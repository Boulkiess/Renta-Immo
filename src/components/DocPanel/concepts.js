// Interactive documentation registry.
//
// Each entry is a *data descriptor*; the generic <ConceptCard> renders all of
// them, so adding/altering a concept is a data edit here, never new UI.
//
// SINGLE SOURCE OF TRUTH: every `compute()` adapter calls the exported, pure,
// golden-master-tested engine helpers from engine/compute.js. The doc therefore
// computes exactly like the app and cannot drift. Adapters are pure (no React,
// no DOM) so they are unit-tested directly in concepts.test.js.
//
// ┌── Concept ─────────────────────────────────────────────────────────────┐
// │ id        unique slug                                                    │
// │ group     group id (see GROUPS) — drives the sommaire                    │
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
  abattementIR,
  abattementPS,
  impLoc,
  buildAmortization,
  computeResale,
  computeEtfPur,
  revalorise,
} from '../../engine/compute.js';

export const GROUPS = [
  'credit',
  'rendement',
  'capitalisation',
  'fiscalite',
  'plusvalue',
  'rentabilite',
];

// ── Pure local helpers (doc-only; not part of the engine) ──────────────────

/** Monthly annuity payment. Mirrors compute(): emp×τM/(1−(1+τM)^−nM). */
export function mensualite(emp, tauxPct, dureeAns) {
  const tM = tauxPct / 100 / 12;
  const nM = dureeAns * 12;
  if (emp <= 0) return 0;
  return tM > 0 ? (emp * tM) / (1 - Math.pow(1 + tM, -nM)) : emp / nM;
}

/** Net present value of a 0-based flow vector at rate r (fraction). */
export function npv(flows, r) {
  return flows.reduce((s, f, t) => s + f / Math.pow(1 + r, t), 0);
}

/** Aggregate the monthly amortization schedule into per-year interest/capital. */
export function yearlyAmort(emp, tauxPct, dureeAns) {
  const tM = tauxPct / 100 / 12;
  const nM = dureeAns * 12;
  const mens = mensualite(emp, tauxPct, dureeAns);
  const amort = buildAmortization(emp, tM, nM, mens, 0);
  const interest = [];
  const capital = [];
  for (let y = 0; y < dureeAns; y++) {
    const slice = amort.slice(y * 12, y * 12 + 12);
    interest.push(slice.reduce((s, m) => s + m.inter, 0));
    capital.push(slice.reduce((s, m) => s + m.cap, 0));
  }
  return { interest, capital };
}

const years1to30 = Array.from({ length: 30 }, (_, i) => i + 1);

// Seed helpers: read the user's live sim/globals from ctx when present, else
// fall back to the descriptor default. ctx = { sim, G, res } | undefined.
const seedSim = (key, fallback) => ctx => ctx?.sim?.[key] ?? fallback;
const seedG = (key, fallback) => ctx => ctx?.G?.[key] ?? fallback;
const seedEmp = fallback => ctx => ctx?.res?.emp ?? fallback;

// ── The registry ───────────────────────────────────────────────────────────

export const CONCEPTS = [
  // ════ CRÉDIT ════
  {
    id: 'mensualite',
    group: 'credit',
    i18nKey: 'doc.concepts.mensualite',
    render: 'number',
    inputs: [
      {
        key: 'emp',
        min: 10000,
        max: 1000000,
        step: 5000,
        default: 200000,
        unit: 'eur',
        seed: seedEmp(200000),
      },
      {
        key: 'taux',
        min: 0.5,
        max: 10,
        step: 0.05,
        default: 3.85,
        unit: 'pct',
        seed: seedSim('taux', 3.85),
      },
      {
        key: 'duree',
        min: 5,
        max: 30,
        step: 1,
        default: 20,
        unit: 'years',
        seed: seedSim('duree', 20),
      },
    ],
    compute: v => ({ value: mensualite(v.emp, v.taux, v.duree), unit: 'eurMonth' }),
  },
  {
    id: 'amortissement',
    group: 'credit',
    i18nKey: 'doc.concepts.amortissement',
    render: 'bars',
    inputs: [
      {
        key: 'emp',
        min: 10000,
        max: 1000000,
        step: 5000,
        default: 200000,
        unit: 'eur',
        seed: seedEmp(200000),
      },
      {
        key: 'taux',
        min: 0.5,
        max: 10,
        step: 0.05,
        default: 3.85,
        unit: 'pct',
        seed: seedSim('taux', 3.85),
      },
      {
        key: 'duree',
        min: 5,
        max: 30,
        step: 1,
        default: 20,
        unit: 'years',
        seed: seedSim('duree', 20),
      },
    ],
    compute: v => {
      const { interest, capital } = yearlyAmort(v.emp, v.taux, v.duree);
      const xLabels = Array.from({ length: v.duree }, (_, i) => String(i + 1));
      return {
        kind: 'bars',
        stacked: true,
        xLabels,
        series: [
          { label: 'amort.interets', data: interest },
          { label: 'amort.capital', data: capital },
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
    id: 'assurance',
    group: 'credit',
    i18nKey: 'doc.concepts.assurance',
    render: 'number',
    inputs: [
      {
        key: 'emp',
        min: 10000,
        max: 1000000,
        step: 5000,
        default: 200000,
        unit: 'eur',
        seed: seedEmp(200000),
      },
      {
        key: 'assurance',
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.25,
        unit: 'pct',
        seed: seedSim('assurance', 0.25),
      },
    ],
    compute: v => ({ value: (v.emp * (v.assurance / 100)) / 12, unit: 'eurMonth' }),
  },
  {
    id: 'coutCredit',
    group: 'credit',
    i18nKey: 'doc.concepts.coutCredit',
    render: 'number',
    inputs: [
      {
        key: 'emp',
        min: 10000,
        max: 1000000,
        step: 5000,
        default: 200000,
        unit: 'eur',
        seed: seedEmp(200000),
      },
      {
        key: 'taux',
        min: 0.5,
        max: 10,
        step: 0.05,
        default: 3.85,
        unit: 'pct',
        seed: seedSim('taux', 3.85),
      },
      {
        key: 'duree',
        min: 5,
        max: 30,
        step: 1,
        default: 20,
        unit: 'years',
        seed: seedSim('duree', 20),
      },
      {
        key: 'assurance',
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.25,
        unit: 'pct',
        seed: seedSim('assurance', 0.25),
      },
    ],
    compute: v => {
      const { interest } = yearlyAmort(v.emp, v.taux, v.duree);
      const totInt = interest.reduce((a, b) => a + b, 0);
      const totAss = ((v.emp * (v.assurance / 100)) / 12) * v.duree * 12;
      return {
        value: totInt + totAss,
        unit: 'eur',
        notes: [
          { label: 'doc.notes.interest', value: totInt, unit: 'eur' },
          { label: 'doc.notes.insurance', value: totAss, unit: 'eur' },
        ],
      };
    },
  },

  // ════ RENDEMENT ════
  {
    id: 'rendBrut',
    group: 'rendement',
    i18nKey: 'doc.concepts.rendBrut',
    render: 'number',
    inputs: [
      {
        key: 'loyer',
        min: 100,
        max: 8000,
        step: 50,
        default: 1000,
        unit: 'eur',
        seed: seedSim('loyer', 1000),
      },
      { key: 'ct', min: 10000, max: 2000000, step: 5000, default: 285000, unit: 'eur' },
    ],
    compute: v => ({ value: v.ct > 0 ? ((v.loyer * 12) / v.ct) * 100 : null, unit: 'pct' }),
  },
  {
    id: 'rendNet',
    group: 'rendement',
    i18nKey: 'doc.concepts.rendNet',
    render: 'number',
    inputs: [
      {
        key: 'loyer',
        min: 100,
        max: 8000,
        step: 50,
        default: 1000,
        unit: 'eur',
        seed: seedSim('loyer', 1000),
      },
      {
        key: 'vacance',
        min: 0,
        max: 30,
        step: 0.5,
        default: 5,
        unit: 'pct',
        seed: seedSim('vacance', 5),
      },
      { key: 'charges', min: 0, max: 20000, step: 100, default: 2700, unit: 'eur' },
      { key: 'ct', min: 10000, max: 2000000, step: 5000, default: 285000, unit: 'eur' },
    ],
    compute: v => {
      const net = v.loyer * (1 - v.vacance / 100) * 12 - v.charges;
      return { value: v.ct > 0 ? (net / v.ct) * 100 : null, unit: 'pct' };
    },
  },

  // ════ CAPITALISATION ════
  {
    id: 'revalorisation',
    group: 'capitalisation',
    i18nKey: 'doc.concepts.revalorisation',
    render: 'line',
    inputs: [
      {
        key: 'base',
        min: 1000,
        max: 2000000,
        step: 5000,
        default: 250000,
        unit: 'eur',
        seed: seedSim('prixAchat', 250000),
      },
      {
        key: 'taux',
        min: -2,
        max: 10,
        step: 0.1,
        default: 2,
        unit: 'pct',
        seed: seedSim('revalBien', 2),
      },
    ],
    compute: v => ({
      kind: 'line',
      xLabels: years1to30.map(String),
      series: [
        { label: 'doc.notes.value', data: years1to30.map(y => revalorise(v.base, v.taux, y)) },
      ],
      notes: [{ label: 'doc.notes.at30', value: revalorise(v.base, v.taux, 30), unit: 'eur' }],
    }),
  },
  {
    id: 'etfPur',
    group: 'capitalisation',
    i18nKey: 'doc.concepts.etfPur',
    render: 'line',
    inputs: [
      {
        key: 'apportETF',
        min: 0,
        max: 500000,
        step: 5000,
        default: 60000,
        unit: 'eur',
        seed: seedG('apportETF', 60000),
      },
      {
        key: 'rendAlt',
        min: 0,
        max: 12,
        step: 0.1,
        default: 6,
        unit: 'pct',
        seed: seedG('rendAlt', 6),
      },
      {
        key: 'budgetMensuel',
        min: 0,
        max: 10000,
        step: 100,
        default: 2500,
        unit: 'eur',
        seed: seedG('budgetMensuel', 2500),
      },
      {
        key: 'loyerPerso',
        min: 0,
        max: 5000,
        step: 50,
        default: 900,
        unit: 'eur',
        seed: seedG('loyerPerso', 900),
      },
      {
        key: 'revalBudget',
        min: 0,
        max: 5,
        step: 0.1,
        default: 0,
        unit: 'pct',
        seed: seedG('revalBudget', 0),
      },
      {
        key: 'revalLoyerPerso',
        min: 0,
        max: 5,
        step: 0.1,
        default: 2,
        unit: 'pct',
        seed: seedG('revalLoyerPerso', 2),
      },
    ],
    compute: v => {
      const g = {
        apportETF: v.apportETF,
        rendAlt: v.rendAlt,
        budgetMensuel: v.budgetMensuel,
        loyerPerso: v.loyerPerso,
        revalBudget: v.revalBudget,
        revalLoyerPerso: v.revalLoyerPerso,
      };
      const arr = computeEtfPur(g);
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

  // ════ FISCALITÉ ════
  {
    id: 'impotLoc',
    group: 'fiscalite',
    i18nKey: 'doc.concepts.impotLoc',
    render: 'number',
    inputs: [
      {
        key: 'regime',
        type: 'select',
        options: ['lmnp', 'microbic', 'nu'],
        default: 'lmnp',
        seed: seedG('regime', 'lmnp'),
      },
      { key: 'le', min: 0, max: 60000, step: 500, default: 12000, unit: 'eur' },
      { key: 'chg', min: 0, max: 30000, step: 500, default: 3500, unit: 'eur' },
      { key: 'ab', min: 0, max: 40000, step: 500, default: 6250, unit: 'eur' },
      { key: 'at', min: 0, max: 20000, step: 250, default: 1500, unit: 'eur' },
      { key: 'intAnnuel', min: 0, max: 40000, step: 500, default: 6000, unit: 'eur' },
      { key: 'tmi', min: 0, max: 45, step: 1, default: 30, unit: 'pct', seed: seedSim('tmi', 30) },
      {
        key: 'ps',
        min: 0,
        max: 20,
        step: 0.1,
        default: 17.2,
        unit: 'pct',
        seed: seedSim('ps', 17.2),
      },
    ],
    compute: v => ({
      value: impLoc(v.le, v.chg, v.ab, v.at, v.tmi, v.ps, v.regime, v.intAnnuel),
      unit: 'eur',
    }),
  },

  // ════ PLUS-VALUE ════
  {
    id: 'abattements',
    group: 'plusvalue',
    i18nKey: 'doc.concepts.abattements',
    render: 'line',
    inputs: [],
    compute: () => ({
      kind: 'line',
      xLabels: years1to30.map(String),
      series: [
        { label: 'doc.notes.abatIR', data: years1to30.map(y => Math.min(100, abattementIR(y))) },
        { label: 'doc.notes.abatPS', data: years1to30.map(y => Math.min(100, abattementPS(y))) },
      ],
    }),
  },
  {
    id: 'revente',
    group: 'plusvalue',
    i18nKey: 'doc.concepts.revente',
    render: 'line',
    inputs: [
      {
        key: 'prixAchat',
        min: 10000,
        max: 2000000,
        step: 5000,
        default: 250000,
        unit: 'eur',
        seed: seedSim('prixAchat', 250000),
      },
      {
        key: 'travaux',
        min: 0,
        max: 400000,
        step: 1000,
        default: 15000,
        unit: 'eur',
        seed: seedSim('travaux', 15000),
      },
      {
        key: 'revalBien',
        min: -2,
        max: 10,
        step: 0.1,
        default: 2,
        unit: 'pct',
        seed: seedSim('revalBien', 2),
      },
      {
        key: 'fraisVente',
        min: 0,
        max: 10,
        step: 0.5,
        default: 4,
        unit: 'pct',
        seed: seedSim('fraisVente', 4),
      },
      {
        key: 'impotPV',
        min: 0,
        max: 50,
        step: 1,
        default: 19,
        unit: 'pct',
        seed: seedSim('impotPV', 19),
      },
      {
        key: 'psPV',
        min: 0,
        max: 20,
        step: 0.1,
        default: 17.2,
        unit: 'pct',
        seed: seedSim('psPV', 17.2),
      },
      { key: 'rest', min: 0, max: 1000000, step: 5000, default: 0, unit: 'eur' },
    ],
    compute: v => {
      const p = {
        mode: 'loc',
        prixAchat: v.prixAchat,
        travaux: v.travaux,
        revalBien: v.revalBien,
        fraisVente: v.fraisVente,
        impotPV: v.impotPV,
        psPV: v.psPV,
      };
      const data = years1to30.map(y => computeResale(p, v.rest, y).reventeNet);
      return {
        kind: 'line',
        xLabels: years1to30.map(String),
        series: [{ label: 'doc.notes.reventeNet', data }],
      };
    },
  },

  // ════ RENTABILITÉ (TRI / VAN / MOIC) ════
  {
    id: 'triVanMoic',
    group: 'rentabilite',
    i18nKey: 'doc.concepts.triVanMoic',
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
        key: 'tauxActu',
        min: 0,
        max: 15,
        step: 0.1,
        default: 3,
        unit: 'pct',
        seed: seedG('tauxActu', 3),
      },
    ],
    compute: v => {
      const flows = v.flows;
      const tri = irr(flows); // null si non-convergent
      const van = npv(flows, v.tauxActu / 100);
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
