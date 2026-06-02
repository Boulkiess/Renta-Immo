// Interactive documentation registry.
//
// Each entry is a *data descriptor*; the generic <ConceptCard> renders all of
// them, so adding/altering a concept is a data edit here, never new UI.
//
// SINGLE SOURCE OF TRUTH: every `compute()` adapter calls the exported, pure,
// golden-master-tested engine helpers from @immo-renta/engine. The doc therefore
// computes exactly like the app and cannot drift. Adapters are pure (no React,
// no DOM) so they are unit-tested directly in concepts.test.js.
//
// ┌── Concept ─────────────────────────────────────────────────────────────┐
// │ id        unique slug                                                    │
// │ group     group id (see GROUPS) — drives the table of contents          │
// │ i18nKey   dotted path to {title, body, code?} (tooltips.* reused where   │
// │           a clean match exists, else doc.concepts.*)                     │
// │ inputs    [{ key, type?, min, max, step, default, unit?, options?,       │
// │             count?, seed?(ctx) }]                                        │
// │ render    'number' | 'line' | 'bars'                                     │
// │ compute   (vals, ctx) => Result                                          │
// └─────────────────────────────────────────────────────────────────────────┘
// Result (number): { value:number|null, unit:UnitId, notes?:Note[] }
// Result (chart) : { kind:'line'|'bars', xLabels:string[],
//                    series:[{label,data:number[]}], stacked?, notes?:Note[] }
// Note           : { label:string, value:number|null, unit:UnitId }
// UnitId         : 'eur'|'eurMonth'|'pct'|'pctPoint'|'ratio'|'tri'|'years'
//
// @typedef placeholder kept terse on purpose — this file is checkJs-exempt
// (components/ is outside the typecheck scope, see CLAUDE.md).

import {
  irr,
  allowanceIncomeTax,
  allowanceSocialTax,
  rentalTax,
  buildAmortization,
  computeResale,
  computeEtfScenario,
  compound,
} from '@immo-renta/engine';

export const GROUPS = [
  'credit',
  'yield',
  'compounding',
  'taxation',
  'capitalGains',
  'profitability',
];

// ── Pure local helpers (doc-only; not part of the engine) ──────────────────

/** Monthly annuity payment. Mirrors compute(): loan×rM/(1−(1+rM)^−nM). */
export function monthlyPayment(loanAmount, ratePct, termYears) {
  const rM = ratePct / 100 / 12;
  const nM = termYears * 12;
  if (loanAmount <= 0) return 0;
  return rM > 0 ? (loanAmount * rM) / (1 - Math.pow(1 + rM, -nM)) : loanAmount / nM;
}

/** Net present value of a 0-based flow vector at rate r (fraction). */
export function npv(flows, r) {
  return flows.reduce((s, f, t) => s + f / Math.pow(1 + r, t), 0);
}

/** Aggregate the monthly amortization schedule into per-year interest/principal. */
export function yearlyAmortization(loanAmount, ratePct, termYears) {
  const rM = ratePct / 100 / 12;
  const nM = termYears * 12;
  const payment = monthlyPayment(loanAmount, ratePct, termYears);
  const amortization = buildAmortization(loanAmount, rM, nM, payment, 0);
  const interest = [];
  const principal = [];
  for (let y = 0; y < termYears; y++) {
    const slice = amortization.slice(y * 12, y * 12 + 12);
    interest.push(slice.reduce((s, m) => s + m.interest, 0));
    principal.push(slice.reduce((s, m) => s + m.principal, 0));
  }
  return { interest, principal };
}

const years1to30 = Array.from({ length: 30 }, (_, i) => i + 1);

// Seed helpers: read the user's live sim/globals from ctx when present, else
// fall back to the descriptor default. ctx = { sim, G, res } | undefined.
const seedSim = (key, fallback) => ctx => ctx?.sim?.[key] ?? fallback;
const seedG = (key, fallback) => ctx => ctx?.G?.[key] ?? fallback;
const seedLoan = fallback => ctx => ctx?.res?.loanAmount ?? fallback;

// ── The registry ───────────────────────────────────────────────────────────

export const CONCEPTS = [
  // ════ CREDIT ════
  {
    id: 'monthlyPayment',
    group: 'credit',
    i18nKey: 'doc.concepts.monthlyPayment',
    render: 'number',
    inputs: [
      {
        key: 'loanAmount',
        min: 10000,
        max: 1000000,
        step: 5000,
        default: 200000,
        unit: 'eur',
        seed: seedLoan(200000),
      },
      {
        key: 'interestRate',
        min: 0.5,
        max: 10,
        step: 0.05,
        default: 3.85,
        unit: 'pct',
        seed: seedSim('interestRate', 3.85),
      },
      {
        key: 'loanTerm',
        min: 5,
        max: 30,
        step: 1,
        default: 20,
        unit: 'years',
        seed: seedSim('loanTerm', 20),
      },
    ],
    compute: v => ({
      value: monthlyPayment(v.loanAmount, v.interestRate, v.loanTerm),
      unit: 'eurMonth',
    }),
  },
  {
    id: 'amortization',
    group: 'credit',
    i18nKey: 'doc.concepts.amortization',
    render: 'bars',
    inputs: [
      {
        key: 'loanAmount',
        min: 10000,
        max: 1000000,
        step: 5000,
        default: 200000,
        unit: 'eur',
        seed: seedLoan(200000),
      },
      {
        key: 'interestRate',
        min: 0.5,
        max: 10,
        step: 0.05,
        default: 3.85,
        unit: 'pct',
        seed: seedSim('interestRate', 3.85),
      },
      {
        key: 'loanTerm',
        min: 5,
        max: 30,
        step: 1,
        default: 20,
        unit: 'years',
        seed: seedSim('loanTerm', 20),
      },
    ],
    compute: v => {
      const { interest, principal } = yearlyAmortization(v.loanAmount, v.interestRate, v.loanTerm);
      const xLabels = Array.from({ length: v.loanTerm }, (_, i) => String(i + 1));
      return {
        kind: 'bars',
        stacked: true,
        xLabels,
        series: [
          { label: 'amortization.interest', data: interest },
          { label: 'amortization.principal', data: principal },
        ],
        notes: [
          {
            label: 'doc.notes.totalInterest',
            value: interest.reduce((a, b) => a + b, 0),
            unit: 'eur',
          },
        ],
      };
    },
  },
  {
    id: 'insurance',
    group: 'credit',
    i18nKey: 'doc.concepts.insurance',
    render: 'number',
    inputs: [
      {
        key: 'loanAmount',
        min: 10000,
        max: 1000000,
        step: 5000,
        default: 200000,
        unit: 'eur',
        seed: seedLoan(200000),
      },
      {
        key: 'insuranceRate',
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.25,
        unit: 'pct',
        seed: seedSim('insuranceRate', 0.25),
      },
    ],
    compute: v => ({ value: (v.loanAmount * (v.insuranceRate / 100)) / 12, unit: 'eurMonth' }),
  },
  {
    id: 'creditCost',
    group: 'credit',
    i18nKey: 'doc.concepts.creditCost',
    render: 'number',
    inputs: [
      {
        key: 'loanAmount',
        min: 10000,
        max: 1000000,
        step: 5000,
        default: 200000,
        unit: 'eur',
        seed: seedLoan(200000),
      },
      {
        key: 'interestRate',
        min: 0.5,
        max: 10,
        step: 0.05,
        default: 3.85,
        unit: 'pct',
        seed: seedSim('interestRate', 3.85),
      },
      {
        key: 'loanTerm',
        min: 5,
        max: 30,
        step: 1,
        default: 20,
        unit: 'years',
        seed: seedSim('loanTerm', 20),
      },
      {
        key: 'insuranceRate',
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.25,
        unit: 'pct',
        seed: seedSim('insuranceRate', 0.25),
      },
    ],
    compute: v => {
      const { interest } = yearlyAmortization(v.loanAmount, v.interestRate, v.loanTerm);
      const totalInterest = interest.reduce((a, b) => a + b, 0);
      const totalInsurance = ((v.loanAmount * (v.insuranceRate / 100)) / 12) * v.loanTerm * 12;
      return {
        value: totalInterest + totalInsurance,
        unit: 'eur',
        notes: [
          { label: 'doc.notes.interest', value: totalInterest, unit: 'eur' },
          { label: 'doc.notes.insurance', value: totalInsurance, unit: 'eur' },
        ],
      };
    },
  },

  // ════ YIELD ════
  {
    id: 'grossYield',
    group: 'yield',
    i18nKey: 'doc.concepts.grossYield',
    render: 'number',
    inputs: [
      {
        key: 'rent',
        min: 100,
        max: 8000,
        step: 50,
        default: 1000,
        unit: 'eur',
        seed: seedSim('rent', 1000),
      },
      { key: 'totalCost', min: 10000, max: 2000000, step: 5000, default: 285000, unit: 'eur' },
    ],
    compute: v => ({
      value: v.totalCost > 0 ? ((v.rent * 12) / v.totalCost) * 100 : null,
      unit: 'pct',
    }),
  },
  {
    id: 'netYield',
    group: 'yield',
    i18nKey: 'doc.concepts.netYield',
    render: 'number',
    inputs: [
      {
        key: 'rent',
        min: 100,
        max: 8000,
        step: 50,
        default: 1000,
        unit: 'eur',
        seed: seedSim('rent', 1000),
      },
      {
        key: 'vacancyRate',
        min: 0,
        max: 30,
        step: 0.5,
        default: 5,
        unit: 'pct',
        seed: seedSim('vacancyRate', 5),
      },
      { key: 'charges', min: 0, max: 20000, step: 100, default: 2700, unit: 'eur' },
      { key: 'totalCost', min: 10000, max: 2000000, step: 5000, default: 285000, unit: 'eur' },
    ],
    compute: v => {
      const net = v.rent * (1 - v.vacancyRate / 100) * 12 - v.charges;
      return { value: v.totalCost > 0 ? (net / v.totalCost) * 100 : null, unit: 'pct' };
    },
  },

  // ════ COMPOUNDING ════
  {
    id: 'compounding',
    group: 'compounding',
    i18nKey: 'doc.concepts.compounding',
    render: 'line',
    inputs: [
      {
        key: 'base',
        min: 1000,
        max: 2000000,
        step: 5000,
        default: 250000,
        unit: 'eur',
        seed: seedSim('purchasePrice', 250000),
      },
      {
        key: 'rate',
        min: -2,
        max: 10,
        step: 0.1,
        default: 2,
        unit: 'pct',
        seed: seedSim('propertyGrowth', 2),
      },
    ],
    compute: v => ({
      kind: 'line',
      xLabels: years1to30.map(String),
      series: [
        { label: 'doc.notes.value', data: years1to30.map(y => compound(v.base, v.rate, y)) },
      ],
      notes: [{ label: 'doc.notes.at30', value: compound(v.base, v.rate, 30), unit: 'eur' }],
    }),
  },
  {
    id: 'etfScenario',
    group: 'compounding',
    i18nKey: 'doc.concepts.etfScenario',
    render: 'line',
    inputs: [
      {
        key: 'etfDownPayment',
        min: 0,
        max: 500000,
        step: 5000,
        default: 60000,
        unit: 'eur',
        seed: seedG('etfDownPayment', 60000),
      },
      {
        key: 'altReturn',
        min: 0,
        max: 12,
        step: 0.1,
        default: 6,
        unit: 'pct',
        seed: seedG('altReturn', 6),
      },
      {
        key: 'monthlyBudget',
        min: 0,
        max: 10000,
        step: 100,
        default: 2500,
        unit: 'eur',
        seed: seedG('monthlyBudget', 2500),
      },
      {
        key: 'personalRent',
        min: 0,
        max: 5000,
        step: 50,
        default: 900,
        unit: 'eur',
        seed: seedG('personalRent', 900),
      },
      {
        key: 'budgetGrowth',
        min: 0,
        max: 5,
        step: 0.1,
        default: 0,
        unit: 'pct',
        seed: seedG('budgetGrowth', 0),
      },
      {
        key: 'personalRentGrowth',
        min: 0,
        max: 5,
        step: 0.1,
        default: 2,
        unit: 'pct',
        seed: seedG('personalRentGrowth', 2),
      },
    ],
    compute: v => {
      const g = {
        etfDownPayment: v.etfDownPayment,
        altReturn: v.altReturn,
        monthlyBudget: v.monthlyBudget,
        personalRent: v.personalRent,
        budgetGrowth: v.budgetGrowth,
        personalRentGrowth: v.personalRentGrowth,
      };
      const arr = computeEtfScenario(g);
      return {
        kind: 'line',
        xLabels: arr.map(e => String(e.yr)),
        series: [
          { label: 'doc.notes.capGross', data: arr.map(e => e.cap) },
          { label: 'doc.notes.capNet', data: arr.map(e => e.capNet) },
        ],
        notes: [{ label: 'doc.notes.at30', value: arr[29]?.cap ?? null, unit: 'eur' }],
      };
    },
  },

  // ════ TAXATION ════
  {
    id: 'rentalTax',
    group: 'taxation',
    i18nKey: 'doc.concepts.rentalTax',
    render: 'number',
    inputs: [
      {
        key: 'regime',
        type: 'select',
        options: ['lmnp', 'microbic', 'nu'],
        default: 'lmnp',
        seed: seedG('regime', 'lmnp'),
      },
      { key: 'effectiveRent', min: 0, max: 60000, step: 500, default: 12000, unit: 'eur' },
      { key: 'charges', min: 0, max: 30000, step: 500, default: 3500, unit: 'eur' },
      { key: 'buildingDepreciation', min: 0, max: 40000, step: 500, default: 6250, unit: 'eur' },
      { key: 'worksDepreciation', min: 0, max: 20000, step: 250, default: 1500, unit: 'eur' },
      { key: 'annualInterest', min: 0, max: 40000, step: 500, default: 6000, unit: 'eur' },
      {
        key: 'marginalTaxRate',
        min: 0,
        max: 45,
        step: 1,
        default: 30,
        unit: 'pct',
        seed: seedSim('marginalTaxRate', 30),
      },
      {
        key: 'socialCharges',
        min: 0,
        max: 20,
        step: 0.1,
        default: 17.2,
        unit: 'pct',
        seed: seedSim('socialCharges', 17.2),
      },
    ],
    compute: v => ({
      value: rentalTax(
        v.effectiveRent,
        v.charges,
        v.buildingDepreciation,
        v.worksDepreciation,
        v.marginalTaxRate,
        v.socialCharges,
        v.regime,
        v.annualInterest
      ),
      unit: 'eur',
    }),
  },

  // ════ CAPITAL GAINS ════
  {
    id: 'allowances',
    group: 'capitalGains',
    i18nKey: 'doc.concepts.allowances',
    render: 'line',
    inputs: [],
    compute: () => ({
      kind: 'line',
      xLabels: years1to30.map(String),
      series: [
        {
          label: 'doc.notes.allowanceIncomeTax',
          data: years1to30.map(y => Math.min(100, allowanceIncomeTax(y))),
        },
        {
          label: 'doc.notes.allowanceSocialTax',
          data: years1to30.map(y => Math.min(100, allowanceSocialTax(y))),
        },
      ],
    }),
  },
  {
    id: 'resale',
    group: 'capitalGains',
    i18nKey: 'doc.concepts.resale',
    render: 'line',
    inputs: [
      {
        key: 'purchasePrice',
        min: 10000,
        max: 2000000,
        step: 5000,
        default: 250000,
        unit: 'eur',
        seed: seedSim('purchasePrice', 250000),
      },
      {
        key: 'renovationCosts',
        min: 0,
        max: 400000,
        step: 1000,
        default: 15000,
        unit: 'eur',
        seed: seedSim('renovationCosts', 15000),
      },
      {
        key: 'propertyGrowth',
        min: -2,
        max: 10,
        step: 0.1,
        default: 2,
        unit: 'pct',
        seed: seedSim('propertyGrowth', 2),
      },
      {
        key: 'sellingFees',
        min: 0,
        max: 10,
        step: 0.5,
        default: 4,
        unit: 'pct',
        seed: seedSim('sellingFees', 4),
      },
      {
        key: 'capitalGainsTax',
        min: 0,
        max: 50,
        step: 1,
        default: 19,
        unit: 'pct',
        seed: seedSim('capitalGainsTax', 19),
      },
      {
        key: 'capitalGainsSocialCharges',
        min: 0,
        max: 20,
        step: 0.1,
        default: 17.2,
        unit: 'pct',
        seed: seedSim('capitalGainsSocialCharges', 17.2),
      },
      { key: 'remaining', min: 0, max: 1000000, step: 5000, default: 0, unit: 'eur' },
    ],
    compute: v => {
      const p = {
        mode: 'rental',
        purchasePrice: v.purchasePrice,
        renovationCosts: v.renovationCosts,
        propertyGrowth: v.propertyGrowth,
        sellingFees: v.sellingFees,
        capitalGainsTax: v.capitalGainsTax,
        capitalGainsSocialCharges: v.capitalGainsSocialCharges,
      };
      const data = years1to30.map(y => computeResale(p, v.remaining, y).netResaleProceeds);
      return {
        kind: 'line',
        xLabels: years1to30.map(String),
        series: [{ label: 'doc.notes.netResaleProceeds', data }],
      };
    },
  },

  // ════ PROFITABILITY (IRR / NPV / MOIC) ════
  {
    id: 'irrNpvMoic',
    group: 'profitability',
    i18nKey: 'doc.concepts.irrNpvMoic',
    render: 'line',
    inputs: [
      {
        key: 'flows',
        type: 'flows',
        count: 7,
        default: [-50000, 3000, 3000, 3500, 3500, 4000, 70000],
        unit: 'eur',
      },
      {
        key: 'discountRate',
        min: 0,
        max: 15,
        step: 0.1,
        default: 3,
        unit: 'pct',
        seed: seedG('discountRate', 3),
      },
    ],
    compute: v => {
      const flows = v.flows;
      const tri = irr(flows); // null if non-convergent
      const van = npv(flows, v.discountRate / 100);
      const inflow = flows.slice(1).reduce((a, b) => a + b, 0);
      const moic = flows[0] !== 0 ? inflow / -flows[0] : null;
      // NPV(r) curve from −40% to +40% — its zero-crossing is the IRR.
      const rates = [];
      for (let pct = -40; pct <= 40; pct += 2) rates.push(pct);
      return {
        kind: 'line',
        xLabels: rates.map(r => r + '%'),
        series: [{ label: 'doc.notes.npvCurve', data: rates.map(r => npv(flows, r / 100)) }],
        notes: [
          { label: 'doc.notes.tri', value: tri, unit: 'tri' },
          { label: 'doc.notes.van', value: van, unit: 'eur' },
          { label: 'doc.notes.moic', value: moic, unit: 'ratio' },
        ],
      };
    },
  },
];
