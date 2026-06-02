// Self-contained engine test fixtures (extraction phase 2). These intentionally
// do NOT import from src/state — the engine package must not depend on app
// state. They mirror the financial fields of state's mkDef() so existing
// golden-master snapshots stay byte-identical, but drop the app/view-only keys
// (enabled, collapsed, label, autoFields) that compute() never reads.
//
// If app defaults change in state/definitions.js, these fixtures are NOT meant
// to follow: they are representative engine inputs, not the app's seed sims.

/** Default global settings (g) — mirrors state's DEFAULT_G minus displayReal (UI-only). */
export const makeG = (over = {}) => ({
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

/** Simulation params (p). All financial fields compute() reads, for both modes. */
export const mkParams = (mode, over = {}) => ({
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
  // Viager (occupied) fields — present on every fixture; compute() reads them only
  // when mode === 'viager'. Adding them does NOT change rental/primary output.
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
