// Public domain types of the engine. In the JS package these live as JSDoc
// @typedef in compute.js; here they are first-class TypeScript interfaces —
// the main authoring-ergonomics difference between the two variants.

export type Regime = 'lmnp' | 'microbic' | 'nu';
export type Mode = 'rental' | 'primary';

/** Global settings shared across the 3 simulations. Mirrors state's DEFAULT_G. */
export interface Globals {
  regime: Regime;
  horizon: number;
  discountRate: number;
  altReturn: number;
  personalRent: number;
  personalRentGrowth: number;
  monthlyBudget: number;
  budgetGrowth: number;
  chargesGrowth?: number;
  investSurplus: boolean;
  etfDownPayment: number;
  inflation: number;
}

/** One simulation's financial parameters. Mirrors state's mkDef(). */
export interface SimParams {
  mode: Mode;
  purchasePrice: number;
  notaryFees: number;
  renovationCosts: number;
  agencyFees: number;
  loanFees?: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  insuranceRate: number;
  propertyGrowth: number;
  sellingFees: number;
  rent: number;
  vacancyRate: number;
  propertyTax: number;
  condoFees: number;
  landlordInsurance: number;
  managementFees: number;
  maintenanceReserve: number;
  rentGrowth: number;
  marginalTaxRate: number;
  socialCharges: number;
  propertyDepreciation: number;
  renovationDepreciation: number;
  capitalGainsTax: number;
  capitalGainsSocialCharges: number;
  propertyTaxPrimary: number;
  condoFeesPrimary: number;
  homeInsurance: number;
  maintenanceReservePrimary: number;
}

export interface AmortMonth {
  interest: number;
  principal: number;
  insurance: number;
  remaining: number;
}

export interface FlowYear {
  yr: number;
  effectiveRent: number;
  charges: number;
  annuity: number;
  tax: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  coc: number | null;
  propertyValue: number;
  remainingCapital: number;
  netWorth: number;
  totalWorth: number;
  etfPocket: number;
  netResaleProceeds: number;
  resaleBalance: number;
  totalBalance: number;
  cashBalance: number;
  resalePrice: number;
}

export interface EtfScenarioYear {
  yr: number;
  cap: number;
  capNet: number;
}

export interface EtfKpis {
  tri: number;
  triReal: number;
  van: number;
  moic: number | null;
  surplusTotal: number;
}

export interface ResaleResult {
  resalePrice: number;
  sellingFee: number;
  netResaleProceeds: number;
}

export interface ResaleRow {
  yr: number;
  resalePrice: number;
  remainingCapital: number;
  resaleBalance: number;
}

export interface ComputeResult {
  totalCost: number;
  loanAmount: number;
  monthlyPayment: number;
  monthlyInsurance: number;
  totalInterest: number;
  totalInsurance: number;
  grossYield: number;
  netYield: number;
  monthlyCashFlow: number;
  breakEven: number | null;
  resaleBreakEven: number | null;
  flows: FlowYear[];
  amortization: AmortMonth[];
  tri10: number | null;
  tri15: number | null;
  tri20: number | null;
  van: number | null;
  moic: number;
  resaleByYear: ResaleRow[];
}
