import { describe, it, expect } from 'vitest';
import {
  compute,
  computeEtfScenario,
  computeEtfKpis,
  computeViagerBand,
  annualSurplus,
  irr,
  allowanceIncomeTax,
  allowanceSocialTax,
  rentalTax,
} from '../src/index.js';
import { makeG, mkParams } from './fixtures.js';

const makeRental = (over = {}) => mkParams('rental', over);
const makePrimary = (over = {}) => mkParams('primary', over);
const makeViager = (over = {}) => mkParams('viager', over);

describe('irr() — Newton-Raphson', () => {
  it('solves a flow with a known IRR of 10 %', () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 6);
  });

  it('solves a deferred flow at 10 % (1000 → 1210 over 2 years)', () => {
    expect(irr([-1000, 0, 1210])).toBeCloseTo(0.1, 6);
  });

  it('returns null on non-convergence (no sign change)', () => {
    expect(irr([100, 110])).toBeNull();
  });
});

describe('allowanceIncomeTax(yr) — hinges of art. 150 VC CGI', () => {
  it.each([
    [5, 0],
    [6, 6],
    [21, 96],
    [22, 100],
    [30, 100],
  ])('year %i → %i %%', (yr, expected) => {
    expect(allowanceIncomeTax(yr)).toBeCloseTo(expected, 6);
  });
});

describe('allowanceSocialTax(yr) — hinges of art. 150 VC CGI', () => {
  it.each([
    [5, 0],
    [6, 1.65],
    [21, 26.4],
    [22, 28.0],
    [30, 100],
    [31, 100],
  ])('year %i → %f %%', (yr, expected) => {
    expect(allowanceSocialTax(yr)).toBeCloseTo(expected, 6);
  });
});

describe('rentalTax() — 3 tax regimes', () => {
  // effectiveRent=12000, charges=3000, buildingDep=5000, worksDep=1000,
  // annualInterest=2000, marginalTaxRate=30, socialCharges=17.2 → global rate 47.2 %
  const args = [12000, 3000, 5000, 1000, 30, 17.2];

  it('LMNP real: taxable = rent − charges − dep − int, loss carried over (clamped to 0)', () => {
    // taxable = max(0, 12000-3000-5000-1000-2000) = 1000 → tax = 1000 × 0.472 = 472
    expect(rentalTax(...args, 'lmnp', 2000)).toBeCloseTo(472, 6);
  });

  it('Micro-BIC: 50 % allowance on the effective rent', () => {
    // taxable = 12000 × 0.5 = 6000 → tax = 6000 × 0.472 = 2832
    expect(rentalTax(...args, 'microbic', 2000)).toBeCloseTo(2832, 6);
  });

  it('Bare ownership: taxable = rent − charges − int (deductible interest)', () => {
    // taxable = max(0, 12000-3000-2000) = 7000 → tax = 7000 × 0.472 = 3304
    expect(rentalTax(...args, 'nu', 2000)).toBeCloseTo(3304, 6);
  });

  it('clamps taxable income to 0 (never a negative tax)', () => {
    expect(rentalTax(1000, 5000, 5000, 1000, 30, 17.2, 'lmnp', 2000)).toBe(0);
  });
});

describe('compute() — monthly loan payment (constant annuity)', () => {
  it('textbook case: 200,000 € at 5 % over 20 years ≈ 1319.9 €/month', () => {
    const p = makeRental({
      purchasePrice: 200000,
      notaryFees: 0,
      renovationCosts: 0,
      downPayment: 0,
      interestRate: 5,
      loanTerm: 20,
    });
    const r = compute(p, makeG());
    expect(r.loanAmount).toBe(200000);
    expect(r.monthlyPayment).toBeCloseTo(1319.9, 0);
  });

  it('zero-rate loan: monthly payment = principal / number of months', () => {
    const p = makeRental({
      purchasePrice: 100000,
      notaryFees: 0,
      renovationCosts: 0,
      downPayment: 0,
      interestRate: 0,
      loanTerm: 20,
    });
    const r = compute(p, makeG());
    expect(r.monthlyPayment).toBeCloseTo(100000 / 240, 6);
  });
});

describe('compute() — down payment capped at total cost (over-funding)', () => {
  const base = makeRental({
    purchasePrice: 200000,
    notaryFees: 15000,
    renovationCosts: 10000,
    agencyFees: 0,
    loanFees: 0,
  });
  const totalCost = 200000 + 15000 + 10000; // 225000
  const excess = 80000;

  // Cash purchase: once the down payment ≥ totalCost, the loan is zero. The
  // remainder is not part of the property return: operational metrics
  // (IRR/NPV/MOIC, netWorth, coc, non-ETF balances) must NOT move.
  it('the remainder does not affect the property operational metrics', () => {
    const atCost = compute({ ...base, downPayment: totalCost }, makeG());
    const above = compute({ ...base, downPayment: totalCost + excess }, makeG());

    expect(above.loanAmount).toBe(0);
    expect(atCost.loanAmount).toBe(0);
    expect(above.tri10).toBe(atCost.tri10);
    expect(above.tri20).toBe(atCost.tri20);
    expect(above.van).toBe(atCost.van);
    expect(above.moic).toBe(atCost.moic);
    expect(above.resaleBreakEven).toBe(atCost.resaleBreakEven);
    above.flows.forEach((f, i) => {
      expect(f.netWorth).toBeCloseTo(atCost.flows[i].netWorth, 6);
      expect(f.coc).toBeCloseTo(atCost.flows[i].coc, 6);
      expect(f.resaleBalance).toBeCloseTo(atCost.flows[i].resaleBalance, 6);
      expect(f.cashBalance).toBeCloseTo(atCost.flows[i].cashBalance, 6);
    });
  });

  // Surplus→ETF toggle on: the remainder is invested in the ETF from year 0 and
  // compounds at altReturn. totalWorth gains the compounded remainder; totalBalance
  // gains that same amount minus the extra stake (the remainder is also a cost).
  it('invests the remainder in the ETF when investSurplus is on', () => {
    const g = makeG({ investSurplus: true, altReturn: 6 });
    const atCost = compute({ ...base, downPayment: totalCost }, g);
    const above = compute({ ...base, downPayment: totalCost + excess }, g);
    above.flows.forEach((f, i) => {
      const compounded = excess * Math.pow(1.06, i + 1);
      expect(f.totalWorth).toBeCloseTo(atCost.flows[i].totalWorth + compounded, 4);
      expect(f.etfPocket).toBeCloseTo(atCost.flows[i].etfPocket + compounded, 4);
      expect(f.totalBalance).toBeCloseTo(atCost.flows[i].totalBalance + compounded - excess, 4);
    });
  });

  // Toggle off: the remainder stays as cash outside the model → no curve moves.
  it('ignores the remainder when investSurplus is off', () => {
    const g = makeG({ investSurplus: false });
    const atCost = compute({ ...base, downPayment: totalCost }, g);
    const above = compute({ ...base, downPayment: totalCost + excess }, g);
    above.flows.forEach((f, i) => {
      expect(f.totalWorth).toBeCloseTo(atCost.flows[i].totalWorth, 6);
      expect(f.totalBalance).toBeCloseTo(atCost.flows[i].totalBalance, 6);
    });
  });
});

describe('compute() — LMNP loss carry-over', () => {
  it('deducts depreciation + carries losses → tax ≤ bare-ownership regime each year', () => {
    const lmnp = compute(makeRental(), makeG({ regime: 'lmnp' }));
    const nu = compute(makeRental(), makeG({ regime: 'nu' }));
    // taxable_lmnp = max(0, rent−charges−dep−int−carry) ≤ taxable_nu = max(0, rent−charges−int) each year
    lmnp.flows.forEach((f, i) => expect(f.tax).toBeLessThanOrEqual(nu.flows[i].tax + 1e-6));
    // Default depreciation: rental income is shielded from year 1 (zero tax)
    expect(lmnp.flows[0].tax).toBe(0);
  });

  it('carries a loss onto profitable years (no depreciation, isolates the carry-over)', () => {
    // buildingDep = worksDep = 0 → the only LMNP-vs-nu difference is the loss carry-over
    const p = makeRental({ propertyDepreciation: 0, renovationDepreciation: 0 });
    const lmnp = compute(p, makeG({ regime: 'lmnp' }));
    const nu = compute(p, makeG({ regime: 'nu' }));
    const sum = r => r.flows.reduce((s, f) => s + f.tax, 0);
    // High interest early in the loan → loss-making year(s) carried over → LMNP taxes less than nu
    expect(sum(lmnp)).toBeLessThan(sum(nu));
    expect(sum(nu)).toBeGreaterThan(0);
  });

  it('under Micro-BIC the same property is taxed from year 1 (no loss)', () => {
    const r = compute(makeRental(), makeG({ regime: 'microbic' }));
    expect(r.flows[0].tax).toBeGreaterThan(0);
  });
});

describe('compute() — capital-gains exemption (rental mode)', () => {
  // capitalGainsTax derived: netResaleProceeds = resalePrice − remaining − sellingFee − tax;
  // sellingFee = resalePrice × sellingFees/100
  const cgtAt = (r, p, yr) => {
    const f = r.flows[yr - 1];
    const sellingFee = f.resalePrice * (p.sellingFees / 100);
    return f.resalePrice - f.remainingCapital - sellingFee - f.netResaleProceeds;
  };

  it('income tax exempt at 22 years, income + social tax fully exempt at 30 years', () => {
    const p = makeRental({ propertyGrowth: 2 });
    const r = compute(p, makeG({ horizon: 30 }));
    // 30 years: income-tax and social-tax allowances = 100 % → tax ≈ 0
    expect(cgtAt(r, p, 30)).toBeCloseTo(0, 4);
    // 22 years: income tax exempt but social tax partial → tax strictly positive
    expect(cgtAt(r, p, 22)).toBeGreaterThan(0);
    // The income-tax exemption drops the tax between years 21 and 22
    expect(cgtAt(r, p, 22)).toBeLessThan(cgtAt(r, p, 21));
  });

  it('primary mode: no capital-gains tax (tax = 0 everywhere)', () => {
    const p = makePrimary({ propertyGrowth: 2 });
    const r = compute(p, makeG({ horizon: 30 }));
    for (const f of r.flows) {
      const sellingFee = f.resalePrice * (p.sellingFees / 100);
      expect(f.netResaleProceeds).toBeCloseTo(f.resalePrice - f.remainingCapital - sellingFee, 4);
    }
  });
});

describe('compute() — primary mode invariants', () => {
  it('netCashFlow is always ≤ 0 (real outflows only)', () => {
    const r = compute(makePrimary(), makeG());
    for (const f of r.flows) expect(f.netCashFlow).toBeLessThanOrEqual(0);
  });

  it('effectiveRent (saved rent) = annualized personalRent, excluded from netCashFlow', () => {
    const g = makeG({ personalRent: 900, personalRentGrowth: 2 });
    const r = compute(makePrimary(), g);
    expect(r.flows[0].effectiveRent).toBeCloseTo(900 * 12, 6);
    expect(r.flows[4].effectiveRent).toBeCloseTo(900 * 12 * Math.pow(1.02, 4), 6);
  });
});

describe('compute() — viager (occupied) mode', () => {
  // occupiedValue = marketValue × (1 − discount) = 250000 × 0.65 = 162500
  // totalCost = bouquet + notary = 50000 + 20000 = 70000
  it('no rental income: effectiveRent is 0 and netCashFlow is always ≤ 0', () => {
    const r = compute(makeViager(), makeG());
    for (const f of r.flows) {
      expect(f.effectiveRent).toBe(0);
      expect(f.netCashFlow).toBeLessThanOrEqual(0);
    }
  });

  it('cash bouquet (downPayment = bouquet + notary) → no loan; default → financed', () => {
    expect(compute(makeViager({ downPayment: 70000 }), makeG()).loanAmount).toBe(0);
    expect(compute(makeViager(), makeG()).loanAmount).toBe(20000); // 70000 − 50000
  });

  it('the rente stops at expectedDuration (charges drop sharply the year after death)', () => {
    const r = compute(makeViager({ expectedDuration: 15 }), makeG());
    // flows[14] = year 15 (rente present), flows[15] = year 16 (rente gone)
    expect(r.flows[15].charges).toBeLessThan(r.flows[14].charges * 0.5);
  });

  it('décote amortizes smoothly to full market value by the expected-death year (no cliff)', () => {
    const p = makeViager({ expectedDuration: 15, occupationDiscount: 35, propertyGrowth: 2 });
    const r = compute(p, makeG());
    // Property value rises monotonically across the death year, no step.
    expect(r.flows[13].propertyValue).toBeLessThan(r.flows[14].propertyValue);
    expect(r.flows[14].propertyValue).toBeLessThan(r.flows[15].propertyValue);
    // No cliff: the year-over-year ratio around death stays small (was ~1.5 with the step).
    expect(r.flows[15].propertyValue / r.flows[14].propertyValue).toBeLessThan(1.1);
    // By the expected-death year the décote is fully gone → full market value × growth.
    expect(r.flows[14].propertyValue).toBeCloseTo(250000 * Math.pow(1.02, 15), 2);
  });

  it('exposes the monthly rente for the KPI chip (0 for non-viager)', () => {
    expect(compute(makeViager({ monthlyAnnuity: 800 }), makeG()).monthlyAnnuity).toBe(800);
    expect(compute(makeRental(), makeG()).monthlyAnnuity).toBe(0);
    expect(compute(makeViager(), makeG()).grossYield).toBe(0);
    expect(compute(makeViager(), makeG()).netYield).toBe(0);
  });

  it('resale gains are taxed (not exempt) and fully exempt at 30 years', () => {
    const p = makeViager({ propertyGrowth: 3, expectedDuration: 8 });
    const r = compute(p, makeG({ horizon: 30 }));
    const cgtAt = yr => {
      const f = r.flows[yr - 1];
      const sellingFee = f.resalePrice * (p.sellingFees / 100);
      return f.resalePrice - f.remainingCapital - sellingFee - f.netResaleProceeds;
    };
    expect(cgtAt(10)).toBeGreaterThan(0); // partial allowances → positive tax
    expect(cgtAt(30)).toBeCloseTo(0, 4); // 30 years → full exemption
  });

  it('clamps expectedDuration ≥ 1 (ED = 0 behaves like ED = 1)', () => {
    const a = compute(makeViager({ expectedDuration: 0 }), makeG());
    const b = compute(makeViager({ expectedDuration: 1 }), makeG());
    expect(a.flows).toEqual(b.flows);
  });

  it('clamps occupationDiscount < 100 (no zero-value arbitrage at 100 %)', () => {
    const r = compute(makeViager({ occupationDiscount: 100 }), makeG());
    expect(r.flows[0].propertyValue).toBeGreaterThan(0);
  });

  it('computeViagerBand returns min ≤ mid ≤ max and null for non-viager', () => {
    const band = computeViagerBand(makeViager(), makeG());
    expect(band).not.toBeNull();
    expect(band.totalWorth.min).toBeLessThanOrEqual(band.totalWorth.mid);
    expect(band.totalWorth.mid).toBeLessThanOrEqual(band.totalWorth.max);
    expect(computeViagerBand(makeRental(), makeG())).toBeNull();
  });
});

describe('computeEtfScenario() — ETF reference scenario', () => {
  it('starts at etfDownPayment and compounds at the alternative return', () => {
    const g = makeG({ etfDownPayment: 60000, altReturn: 6, monthlyBudget: 0, personalRent: 0 });
    const etf = computeEtfScenario(g);
    // zero surplus → pure growth: cap[1] = 60000 × 1.06
    expect(etf[0].cap).toBeCloseTo(60000 * 1.06, 4);
    expect(etf[1].cap).toBeCloseTo(60000 * Math.pow(1.06, 2), 4);
  });

  it('capNet applies the 30 % PFU on the capital gain only', () => {
    const g = makeG({ etfDownPayment: 60000, altReturn: 6, monthlyBudget: 0, personalRent: 0 });
    const etf = computeEtfScenario(g);
    const gain = etf[0].cap - 60000;
    expect(etf[0].capNet).toBeCloseTo(etf[0].cap - gain * 0.3, 4);
  });
});

describe('annualSurplus() — annual ETF reference surplus (budget − personal rent)', () => {
  it('year 1: budget − personal rent, no revaluation', () => {
    // 2500×12 − 900×12 = 30000 − 10800 = 19200
    expect(annualSurplus(makeG(), 1)).toBeCloseTo(19200, 6);
  });

  it('revalues budget and personal rent independently', () => {
    const g = makeG({ budgetGrowth: 1, personalRentGrowth: 2 });
    const expected = 2500 * 12 * Math.pow(1.01, 4) - 900 * 12 * Math.pow(1.02, 4);
    expect(annualSurplus(g, 5)).toBeCloseTo(expected, 6);
  });

  it('clamps to 0 when personal rent exceeds the budget', () => {
    expect(annualSurplus(makeG({ monthlyBudget: 500, personalRent: 900 }), 1)).toBe(0);
  });
});

describe('computeEtfKpis() — ETF KPIs (characterization + invariants)', () => {
  it('IRR = altReturn and real IRR = (1+altReturn)/(1+inflation)−1', () => {
    const g = makeG({ altReturn: 6, inflation: 2 });
    const { tri, triReal } = computeEtfKpis(g);
    expect(tri).toBeCloseTo(0.06, 12);
    expect(triReal).toBeCloseTo(1.06 / 1.02 - 1, 12);
  });

  it('NPV = 0 when discountRate = altReturn (exact algebraic invariant)', () => {
    const g = makeG({ discountRate: 6, altReturn: 6 });
    expect(computeEtfKpis(g).van).toBeCloseTo(0, 4);
  });

  it('MOIC = (1+altReturn)^horizon when surplus is zero', () => {
    // personalRent ≥ budget → surplus 0 → cap[hz] = etfDownPayment×(1+r)^hz → MOIC = (1+r)^hz
    const g = makeG({ monthlyBudget: 500, personalRent: 900, altReturn: 6, horizon: 20 });
    expect(computeEtfKpis(g).moic).toBeCloseTo(Math.pow(1.06, 20), 6);
  });

  it('MOIC = null when etfDownPayment = 0 (no division by zero)', () => {
    expect(computeEtfKpis(makeG({ etfDownPayment: 0 })).moic).toBeNull();
  });

  it('horizon 30: NPV and MOIC finite, total surplus positive', () => {
    const { van, moic, surplusTotal } = computeEtfKpis(makeG({ horizon: 30 }));
    expect(Number.isFinite(van)).toBe(true);
    expect(Number.isFinite(moic)).toBe(true);
    expect(surplusTotal).toBeGreaterThan(0);
  });
});
