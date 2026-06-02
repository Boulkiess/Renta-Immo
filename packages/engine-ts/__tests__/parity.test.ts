import { describe, it, expect } from 'vitest';
// JS package (the app's source of truth) vs. the TS port. They must agree to the
// last decimal on every output — this is the proof the TS variant is a faithful
// 1:1 reimplementation, not an approximation.
import * as js from '@immo-renta/engine';
import * as ts from '../src/index.js';
import type { Globals, SimParams } from '../src/index.js';

const makeG = (over: Partial<Globals> = {}): Globals => ({
  regime: 'lmnp',
  horizon: 20,
  discountRate: 3,
  altReturn: 6,
  personalRent: 900,
  personalRentGrowth: 2,
  monthlyBudget: 2500,
  budgetGrowth: 0,
  chargesGrowth: 2,
  investSurplus: true,
  etfDownPayment: 60000,
  inflation: 2,
  ...over,
});

const mkParams = (
  mode: 'rental' | 'primary' | 'viager',
  over: Partial<SimParams> = {}
): SimParams => ({
  mode,
  purchasePrice: 250000,
  notaryFees: 20000,
  renovationCosts: 15000,
  agencyFees: 0,
  loanFees: 0,
  downPayment: 50000,
  interestRate: 3.85,
  loanTerm: 20,
  insuranceRate: 0.25,
  propertyGrowth: 2.0,
  sellingFees: 4,
  rent: 1000,
  vacancyRate: 5,
  propertyTax: 1200,
  condoFees: 800,
  landlordInsurance: 200,
  managementFees: 7,
  maintenanceReserve: 500,
  rentGrowth: 1.5,
  marginalTaxRate: 30,
  socialCharges: 17.2,
  propertyDepreciation: 2.5,
  renovationDepreciation: 10,
  capitalGainsTax: 19,
  capitalGainsSocialCharges: 17.2,
  propertyTaxPrimary: 1200,
  condoFeesPrimary: 1200,
  homeInsurance: 300,
  maintenanceReservePrimary: 500,
  marketValue: 250000,
  occupationDiscount: 35,
  bouquet: 50000,
  monthlyAnnuity: 800,
  annuityGrowth: 2,
  expectedDuration: 15,
  ownerCharges: 1500,
  ownerChargesGrowth: 2,
  ...over,
});

// Matrix: rental × 3 regimes, primary, viager, an over-funded sim, and a few global tweaks.
const scenarios: [string, SimParams, Globals][] = [
  ['rental · lmnp', mkParams('rental'), makeG({ regime: 'lmnp' })],
  ['rental · microbic', mkParams('rental'), makeG({ regime: 'microbic' })],
  ['rental · nu', mkParams('rental'), makeG({ regime: 'nu' })],
  ['primary', mkParams('primary'), makeG()],
  ['viager · financed bouquet', mkParams('viager'), makeG()],
  ['viager · cash bouquet', mkParams('viager', { downPayment: 70000 }), makeG()],
  ['viager · horizon 30', mkParams('viager'), makeG({ horizon: 30 })],
  ['rental · over-funded', mkParams('rental', { downPayment: 320000 }), makeG()],
  ['rental · surplus off', mkParams('rental'), makeG({ investSurplus: false })],
  ['primary · horizon 30', mkParams('primary'), makeG({ horizon: 30 })],
];

describe('parity — TS engine matches JS engine', () => {
  it.each(scenarios)('compute() — %s', (_name, p, g) => {
    expect(ts.compute(p, g)).toEqual(js.compute(p, g));
  });

  it.each(scenarios)('computeEtfScenario() — %s', (_name, _p, g) => {
    expect(ts.computeEtfScenario(g)).toEqual(js.computeEtfScenario(g));
  });

  it.each([10, 20, 30])('computeEtfKpis() — horizon %i', hz => {
    const g = makeG({ horizon: hz });
    expect(ts.computeEtfKpis(g)).toEqual(js.computeEtfKpis(g));
  });

  it('computeViagerBand() agrees (viager sensitivity band)', () => {
    const p = mkParams('viager');
    expect(ts.computeViagerBand(p, makeG())).toEqual(js.computeViagerBand(p, makeG()));
    expect(ts.computeViagerBand(mkParams('rental'), makeG())).toEqual(
      js.computeViagerBand(mkParams('rental'), makeG())
    );
  });

  it('pure helpers agree (irr, allowances, rentalTax)', () => {
    expect(ts.irr([-1000, 0, 1210])).toEqual(js.irr([-1000, 0, 1210]));
    for (let yr = 1; yr <= 31; yr++) {
      expect(ts.allowanceIncomeTax(yr)).toEqual(js.allowanceIncomeTax(yr));
      expect(ts.allowanceSocialTax(yr)).toEqual(js.allowanceSocialTax(yr));
    }
    expect(ts.rentalTax(12000, 3000, 5000, 1000, 30, 17.2, 'lmnp', 2000)).toEqual(
      js.rentalTax(12000, 3000, 5000, 1000, 30, 17.2, 'lmnp', 2000)
    );
  });
});
