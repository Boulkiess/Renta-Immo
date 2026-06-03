// Pure financial engine — TypeScript variant of @immo-renta/engine.
// Logic is a 1:1 port of the JS package; only the type annotations differ.
// A parity test (../__tests__/parity.test.ts) asserts identical output.

import type {
  AmortMonth,
  ComputeResult,
  EtfKpis,
  EtfScenarioYear,
  FlowYear,
  Globals,
  Regime,
  ResaleResult,
  SimParams,
} from './types.js';

// ── Tax constants ─────────────────────────────────────────────
const PFU_RATE = 0.3; // flat tax (PFU) on the ETF capital gain (CTO)
const MICROBIC_ABATTEMENT = 0.5; // flat Micro-BIC allowance (non-classified furnished)
// Progressive allowances on the real-estate capital gain (art. 150 VC CGI)
const ALLOWANCE_INCOME_TAX_PER_YEAR = 6; // %/yr, years 6→21 (96 % cumulative at year 21)
const ALLOWANCE_SOCIAL_TAX_PER_YEAR = 1.65; // %/yr, years 6→21
const ALLOWANCE_SOCIAL_TAX_AT_22 = (21 - 5) * ALLOWANCE_SOCIAL_TAX_PER_YEAR + 1.6; // 28.0 % cumulative at year 22 (social-tax bonus 1.6)
const ALLOWANCE_SOCIAL_TAX_LATE_PER_YEAR = 9; // %/yr, years 23→30
const ALLOWANCE_FULL = 100; // full exemption

/** Compound revaluation: base × (1 + ratePct%)^periods. */
export const compound = (base: number, ratePct: number, periods: number): number =>
  base * Math.pow(1 + ratePct / 100, periods);

/** Annual surplus of the ETF reference scenario (revalued budget − revalued personal rent). */
export const annualSurplus = (g: Globals, yr: number): number =>
  Math.max(
    0,
    compound(g.monthlyBudget * 12, g.budgetGrowth, yr - 1) -
      compound(g.personalRent * 12, g.personalRentGrowth, yr - 1)
  );

/** Internal rate of return via Newton-Raphson. Returns null on non-convergence. */
export function irr(flows: number[], guess = 0.1, maxIter = 100, tol = 1e-7): number | null {
  let r = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0,
      dnpv = 0;
    for (let t = 0; t < flows.length; t++) {
      const d = Math.pow(1 + r, t);
      npv += flows[t] / d;
      if (t > 0) dnpv -= (t * flows[t]) / Math.pow(1 + r, t + 1);
    }
    if (Math.abs(dnpv) < 1e-15) return null;
    const nr = r - npv / dnpv;
    if (Math.abs(nr - r) < tol) return nr;
    r = nr;
    if (!isFinite(r) || r < -1) return null;
  }
  return null;
}

/** Income-tax allowance (%) — art. 150 VC CGI. */
export function allowanceIncomeTax(yr: number): number {
  if (yr <= 5) return 0;
  if (yr <= 21) return (yr - 5) * ALLOWANCE_INCOME_TAX_PER_YEAR; // 6 %/yr from year 6 to 21 → 96 %
  return ALLOWANCE_FULL; // 4 % at year 22 = full exemption
}

/** Social-tax allowance (%) — art. 150 VC CGI. */
export function allowanceSocialTax(yr: number): number {
  if (yr <= 5) return 0;
  if (yr <= 21) return (yr - 5) * ALLOWANCE_SOCIAL_TAX_PER_YEAR; // 1.65 %/yr from year 6 to 21
  if (yr === 22) return ALLOWANCE_SOCIAL_TAX_AT_22; // 28.0 %
  if (yr <= 30) return ALLOWANCE_SOCIAL_TAX_AT_22 + (yr - 22) * ALLOWANCE_SOCIAL_TAX_LATE_PER_YEAR; // 9 %/yr, years 23→30
  return ALLOWANCE_FULL;
}

/** Rental income tax for one year. */
export function rentalTax(
  effectiveRent: number,
  charges: number,
  buildingDepreciation: number,
  worksDepreciation: number,
  marginalTaxRate: number,
  socialCharges: number,
  regime: Regime,
  annualInterest = 0
): number {
  let taxable: number;
  if (regime === 'lmnp')
    taxable = Math.max(
      0,
      effectiveRent - charges - buildingDepreciation - worksDepreciation - annualInterest
    );
  else if (regime === 'microbic') taxable = Math.max(0, effectiveRent * MICROBIC_ABATTEMENT);
  else taxable = Math.max(0, effectiveRent - charges - annualInterest); // 'nu' (bare ownership)
  return taxable * ((marginalTaxRate + socialCharges) / 100);
}

/** 30-year ETF reference scenario. */
export function computeEtfScenario(g: Globals): EtfScenarioYear[] {
  const result: EtfScenarioYear[] = [];
  let cap = g.etfDownPayment;
  let totalContribs = g.etfDownPayment;
  const r = g.altReturn / 100;
  for (let yr = 1; yr <= 30; yr++) {
    const surplus = annualSurplus(g, yr);
    cap = cap * (1 + r) + surplus;
    totalContribs += surplus;
    const gain = Math.max(0, cap - totalContribs);
    const capNet = cap - gain * PFU_RATE;
    result.push({ yr, cap, capNet });
  }
  return result;
}

/** ETF KPIs (IRR/NPV/MOIC) at horizon g.horizon. */
export function computeEtfKpis(g: Globals): EtfKpis {
  const hz = g.horizon;
  const capHz = computeEtfScenario(g)[hz - 1]?.cap ?? 0;
  const tri = g.altReturn / 100;
  const triReal = (1 + tri) / (1 + g.inflation / 100) - 1;
  let van = -g.etfDownPayment;
  let surplusTotal = 0;
  for (let t = 1; t <= hz; t++) {
    const s = annualSurplus(g, t);
    van += -s / Math.pow(1 + g.discountRate / 100, t);
    surplusTotal += s;
  }
  van += capHz / Math.pow(1 + g.discountRate / 100, hz);
  const moic = g.etfDownPayment > 0 ? (capHz - surplusTotal) / g.etfDownPayment : null;
  return { tri, triReal, van, moic, surplusTotal };
}

/** Monthly amortization schedule (constant annuity). amortization[m-1] = month m. */
export function buildAmortization(
  loanAmount: number,
  monthlyRate: number,
  numPayments: number,
  monthlyPayment: number,
  monthlyInsurance: number
): AmortMonth[] {
  const amortization: AmortMonth[] = [];
  let balance = loanAmount;
  for (let m = 1; m <= Math.max(numPayments, 12); m++) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.max(0, monthlyPayment - interest);
    balance = Math.max(0, balance - principalPaid);
    amortization.push({
      interest,
      principal: principalPaid,
      insurance: monthlyInsurance,
      remaining: balance,
    });
  }
  return amortization;
}

/** Viager occupied value (before growth) at year yr — décote amortizes linearly to 0 by expectedDuration. */
function viagerOccupiedBase(p: SimParams, yr: number): number {
  const ed = Math.max(1, p.expectedDuration ?? 1);
  const remainingFraction = Math.max(0, (ed - yr) / ed); // 1 at yr 0 → 0 at yr ≥ ed
  const discount = Math.min(99, p.occupationDiscount ?? 0) * remainingFraction;
  return (p.marketValue ?? 0) * (1 - discount / 100);
}

/** Cumulative rente actually paid up to year yr (caps at expectedDuration). */
function viagerRenteToDate(p: SimParams, yr: number): number {
  let total = 0;
  const lastYear = Math.min(yr, Math.max(1, p.expectedDuration ?? 1));
  for (let y = 1; y <= lastYear; y++)
    total += compound((p.monthlyAnnuity ?? 0) * 12, p.annuityGrowth ?? 0, y - 1);
  return total;
}

/** Viager resale: décote lifts at death; basis = bouquet + cumulative rente + notary; gain taxed like rental. */
export function computeViagerResale(p: SimParams, remaining: number, yr: number): ResaleResult {
  const resalePrice = compound(viagerOccupiedBase(p, yr), p.propertyGrowth, yr);
  const sellingFee = resalePrice * (p.sellingFees / 100);
  const costBasis = (p.bouquet ?? 0) + viagerRenteToDate(p, yr) + p.notaryFees;
  const grossGain = Math.max(0, resalePrice - costBasis);
  const allowanceIR = Math.min(100, allowanceIncomeTax(yr));
  const allowancePS = Math.min(100, allowanceSocialTax(yr));
  const capitalGainsTax =
    (grossGain *
      (p.capitalGainsTax * (1 - allowanceIR / 100) +
        p.capitalGainsSocialCharges * (1 - allowancePS / 100))) /
    100;
  return {
    resalePrice,
    sellingFee,
    netResaleProceeds: resalePrice - remaining - sellingFee - capitalGainsTax,
  };
}

/** Resale at year yr: resale price (renovation included), fees, taxed capital gain, net proceeds. */
export function computeResale(p: SimParams, remaining: number, yr: number): ResaleResult {
  if (p.mode === 'viager') return computeViagerResale(p, remaining, yr);
  const resalePrice = compound(p.purchasePrice + p.renovationCosts, p.propertyGrowth, yr);
  const sellingFee = resalePrice * (p.sellingFees / 100);
  const grossGain = Math.max(0, resalePrice - p.purchasePrice - p.renovationCosts);
  let capitalGainsTax = 0;
  if (p.mode === 'rental') {
    const allowanceIR = Math.min(100, allowanceIncomeTax(yr));
    const allowancePS = Math.min(100, allowanceSocialTax(yr));
    capitalGainsTax =
      (grossGain *
        (p.capitalGainsTax * (1 - allowanceIR / 100) +
          p.capitalGainsSocialCharges * (1 - allowancePS / 100))) /
      100;
  }
  return {
    resalePrice,
    sellingFee,
    netResaleProceeds: resalePrice - remaining - sellingFee - capitalGainsTax,
  };
}

type ResaleFlow = Pick<FlowYear, 'netResaleProceeds'>;

/** IRR at a horizon. flows 0-based; irrFlows[0] = −downPayment. */
export function calcTRI(flows: ResaleFlow[], irrFlows: number[], horizon: number): number | null {
  if (horizon > 30 || horizon < 1) return null;
  const flowsAtHorizon = [...irrFlows.slice(0, horizon + 1)];
  flowsAtHorizon[horizon] += flows[horizon - 1].netResaleProceeds;
  return irr(flowsAtHorizon);
}

/** NPV at a horizon. Same flows as calcTRI. */
export function calcVAN(
  flows: ResaleFlow[],
  irrFlows: number[],
  g: Globals,
  horizon: number
): number | null {
  if (horizon > 30 || horizon < 1) return null;
  const r = g.discountRate / 100;
  let van = irrFlows[0]; // −downPayment
  for (let t = 1; t <= horizon && t <= 30; t++) {
    let cf = irrFlows[t]; // same flows as the IRR: personal rent reintegrated
    if (t === horizon) cf += flows[t - 1].netResaleProceeds;
    van += cf / Math.pow(1 + r, t);
  }
  return van;
}

/** MOIC at a horizon. Same flows as calcTRI. */
export function calcMoic(
  flows: ResaleFlow[],
  irrFlows: number[],
  horizon: number,
  downPayment: number
): number {
  const last = flows[horizon - 1];
  if (!last) return 0;
  return (
    (last.netResaleProceeds + irrFlows.slice(1, horizon + 1).reduce((a, b) => a + b, 0)) /
    downPayment
  );
}

/**
 * Core financial engine. Pure: given a simulation's params and globals, returns
 * monthly payments, the 30-year flows array, IRR at 10/15/20y, NPV, MOIC, resale.
 */
export function compute(p: SimParams, g: Globals): ComputeResult {
  const isViager = p.mode === 'viager';
  const totalCost = isViager
    ? (p.bouquet ?? 0) + p.notaryFees
    : p.purchasePrice +
      p.notaryFees +
      p.renovationCosts +
      p.agencyFees +
      (p.loanFees ?? 0) +
      (p.guaranteeFees ?? 0) +
      (p.brokerFees ?? 0);
  const loanAmount = Math.max(0, totalCost - p.downPayment);
  const investedDownPayment = Math.min(p.downPayment, totalCost);
  const etfSeed = g.investSurplus ? Math.max(0, p.downPayment - totalCost) : 0;
  const totalDownPayment = investedDownPayment + etfSeed;
  const monthlyRate = p.interestRate / 100 / 12,
    numPayments = p.loanTerm * 12;
  const monthlyPayment =
    loanAmount > 0 && monthlyRate > 0
      ? (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments))
      : loanAmount > 0
        ? loanAmount / numPayments
        : 0;
  const monthlyInsurance = (loanAmount * (p.insuranceRate / 100)) / 12;

  const amortization = buildAmortization(
    loanAmount,
    monthlyRate,
    numPayments,
    monthlyPayment,
    monthlyInsurance
  );

  const buildingDepreciation = isViager ? 0 : p.purchasePrice * (p.propertyDepreciation / 100),
    worksDepreciation = isViager ? 0 : p.renovationCosts * (p.renovationDepreciation / 100);
  const flows: FlowYear[] = [];
  let cumulativeCashFlow = 0;
  let irrCumulative = 0; // cumulative adjusted flows (netCashFlow + personalRentAnnual) — IRR/NPV/MOIC basis
  const irrFlows: number[] = [-investedDownPayment];
  const altRate = g.altReturn / 100;
  let etfCapital = etfSeed; // down-payment remainder invested in ETF from year 0 (compounds like etfDownPayment)
  let depreciationCarry = 0; // unused LMNP depreciation carried over (loss-making years)

  for (let yr = 1; yr <= 30; yr++) {
    const monthIdx = Math.min(yr * 12, amortization.length) - 1;
    const remaining = amortization[monthIdx]?.remaining ?? 0;
    const annuity = yr <= p.loanTerm ? monthlyPayment * 12 : 0;
    const annualInsurance = yr <= p.loanTerm ? monthlyInsurance * 12 : 0;
    const propertyValue = isViager
      ? compound(viagerOccupiedBase(p, yr), p.propertyGrowth, yr)
      : compound(p.purchasePrice, p.propertyGrowth, yr);
    const personalRentAnnual = compound(g.personalRent * 12, g.personalRentGrowth, yr - 1);

    let netCashFlow: number,
      effectiveRent = 0,
      charges = 0,
      tax = 0;

    if (p.mode === 'rental') {
      const grossRent = compound(p.rent * 12, p.rentGrowth, yr - 1);
      effectiveRent = grossRent * (1 - p.vacancyRate / 100);
      const chargesFactor = compound(1, g.chargesGrowth ?? 2, yr - 1);
      charges =
        (p.propertyTax + p.condoFees + p.landlordInsurance + p.maintenanceReserve) * chargesFactor +
        grossRent * (p.managementFees / 100);
      const annualInterest = amortization
        .slice((yr - 1) * 12, yr * 12)
        .reduce((s, m) => s + m.interest, 0);
      if (g.regime === 'lmnp') {
        // LMNP real: interest + depreciation deductible; loss carried over to later years
        const taxableRaw =
          effectiveRent -
          charges -
          buildingDepreciation -
          worksDepreciation -
          annualInterest -
          depreciationCarry;
        const taxable = Math.max(0, taxableRaw);
        depreciationCarry = taxableRaw < 0 ? -taxableRaw : 0;
        tax = taxable * ((p.marginalTaxRate + p.socialCharges) / 100);
      } else {
        tax = rentalTax(
          effectiveRent,
          charges,
          buildingDepreciation,
          worksDepreciation,
          p.marginalTaxRate,
          p.socialCharges,
          g.regime,
          annualInterest
        );
      }
      netCashFlow = effectiveRent - charges - annuity - annualInsurance - tax - personalRentAnnual;
    } else if (p.mode === 'primary') {
      const chargesFactor = compound(1, g.chargesGrowth ?? 2, yr - 1);
      charges =
        (p.propertyTaxPrimary +
          p.condoFeesPrimary +
          p.homeInsurance +
          p.maintenanceReservePrimary) *
        chargesFactor;
      netCashFlow = -(charges + annuity + annualInsurance);
      effectiveRent = personalRentAnnual;
    } else if (p.mode === 'viager') {
      const rente =
        yr <= Math.max(1, p.expectedDuration ?? 1)
          ? compound((p.monthlyAnnuity ?? 0) * 12, p.annuityGrowth ?? 0, yr - 1)
          : 0;
      const chargesFactor = compound(1, p.ownerChargesGrowth ?? g.chargesGrowth ?? 2, yr - 1);
      charges = (p.ownerCharges ?? 0) * chargesFactor + rente;
      netCashFlow = -(charges + annuity + annualInsurance) - personalRentAnnual;
    } else {
      throw new Error(`compute(): unknown sim mode "${String(p.mode)}"`);
    }
    cumulativeCashFlow += netCashFlow;

    const realOutflow = p.mode === 'primary' ? charges + annuity + annualInsurance : -netCashFlow;
    const annualBudget = compound(g.monthlyBudget * 12, g.budgetGrowth, yr - 1);
    const budgetSurplus = Math.max(0, annualBudget - realOutflow);
    etfCapital = etfCapital * (1 + altRate) + (g.investSurplus ? budgetSurplus : 0);

    const { resalePrice, netResaleProceeds } = computeResale(p, remaining, yr);
    irrCumulative += netCashFlow + personalRentAnnual;
    const resaleBalance = netResaleProceeds + cumulativeCashFlow - investedDownPayment;
    const totalBalance = netResaleProceeds + etfCapital - totalDownPayment;
    const cashBalance = netResaleProceeds + irrCumulative - investedDownPayment;
    const totalWorth = propertyValue - remaining + etfCapital;

    flows.push({
      yr,
      effectiveRent,
      charges,
      annuity: annuity + annualInsurance,
      tax,
      netCashFlow,
      cumulativeCashFlow,
      coc: investedDownPayment > 0 ? (netCashFlow / investedDownPayment) * 100 : null,
      propertyValue,
      remainingCapital: remaining,
      netWorth: propertyValue - remaining + cumulativeCashFlow - investedDownPayment,
      totalWorth,
      etfPocket: etfCapital,
      netResaleProceeds,
      resaleBalance,
      totalBalance,
      cashBalance,
      resalePrice,
    });

    irrFlows.push(netCashFlow + personalRentAnnual);
  }

  const totalInterest = amortization.reduce((s, m) => s + m.interest, 0);
  const totalInsurance = amortization.reduce((s, m) => s + m.insurance, 0);
  const grossYield = p.mode === 'rental' ? ((p.rent * 12) / totalCost) * 100 : 0;
  let netYield = 0;
  if (p.mode === 'rental') {
    const netAnnual =
      p.rent * (1 - p.vacancyRate / 100) * 12 -
      (p.propertyTax +
        p.condoFees +
        p.landlordInsurance +
        p.maintenanceReserve +
        p.rent * 12 * (p.managementFees / 100));
    netYield = (netAnnual / totalCost) * 100;
  }
  const monthlyCashFlow =
    p.mode === 'rental'
      ? p.rent - monthlyPayment - monthlyInsurance - g.personalRent
      : p.mode === 'viager'
        ? -(monthlyPayment + monthlyInsurance + (p.monthlyAnnuity ?? 0))
        : g.personalRent - monthlyPayment - monthlyInsurance;
  const breakEven = flows.findIndex(f => f.cumulativeCashFlow >= 0);
  const resaleBreakEven = flows.findIndex(f => f.cashBalance >= 0);

  return {
    totalCost,
    loanAmount,
    monthlyPayment,
    monthlyInsurance,
    monthlyAnnuity: isViager ? (p.monthlyAnnuity ?? 0) : 0,
    totalInterest,
    totalInsurance,
    grossYield,
    netYield,
    monthlyCashFlow,
    breakEven: breakEven >= 0 ? breakEven + 1 : null,
    resaleBreakEven: resaleBreakEven >= 0 ? resaleBreakEven + 1 : null,
    flows,
    amortization,
    tri10: calcTRI(flows, irrFlows, 10),
    tri15: calcTRI(flows, irrFlows, 15),
    tri20: calcTRI(flows, irrFlows, 20),
    van: calcVAN(flows, irrFlows, g, g.horizon),
    moic: calcMoic(flows, irrFlows, g.horizon, investedDownPayment),
    resaleByYear: flows.map(f => ({
      yr: f.yr,
      resalePrice: f.resalePrice,
      remainingCapital: f.remainingCapital,
      resaleBalance: f.resaleBalance,
    })),
  };
}

/** First year where property totalWorth ≥ ETF reference cap. Null if surplus not invested. */
export function crossoverYear(
  res: { flows: { totalWorth: number }[] },
  etfScenarioGlobal: { cap: number }[],
  g: Globals
): number | null {
  if (!etfScenarioGlobal.length || !g.investSurplus) return null;
  for (let i = 0; i < 30; i++) {
    const property = res.flows[i]?.totalWorth;
    const etf = etfScenarioGlobal[i]?.cap;
    if (property != null && etf != null && property >= etf) return i + 1;
  }
  return null;
}

export interface ViagerBand {
  expectedDuration: number;
  delta: number;
  totalWorth: { min: number; mid: number; max: number };
  cashBalance: { min: number; mid: number; max: number };
}

/** Sensitivity band for a viager sim: re-run at expectedDuration ± delta, report min/mid/max KPIs. */
export function computeViagerBand(p: SimParams, g: Globals, delta = 5): ViagerBand | null {
  if (p.mode !== 'viager') return null;
  const hz = g.horizon;
  const at = (duration: number) => {
    const f = compute({ ...p, expectedDuration: Math.max(1, duration) }, g).flows[hz - 1];
    return { totalWorth: f?.totalWorth ?? 0, cashBalance: f?.cashBalance ?? 0 };
  };
  const ed = Math.max(1, p.expectedDuration ?? 1);
  const lo = at(ed - delta),
    mid = at(ed),
    hi = at(ed + delta);
  const span = (key: 'totalWorth' | 'cashBalance') => ({
    min: Math.min(lo[key], mid[key], hi[key]),
    mid: mid[key],
    max: Math.max(lo[key], mid[key], hi[key]),
  });
  return {
    expectedDuration: ed,
    delta,
    totalWorth: span('totalWorth'),
    cashBalance: span('cashBalance'),
  };
}
