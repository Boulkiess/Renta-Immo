// Public API of the TypeScript engine variant. Mirrors @immo-renta/engine's
// barrel, plus the domain types (which the JS package can only emit, not export
// as named values).
export {
  compute,
  computeEtfScenario,
  computeEtfKpis,
  crossoverYear,
  computeViagerBand,
  irr,
  compound,
  annualSurplus,
  allowanceIncomeTax,
  allowanceSocialTax,
  rentalTax,
  buildAmortization,
  computeResale,
  computeViagerResale,
  calcTRI,
  calcVAN,
  calcMoic,
} from './compute.js';

export type { ViagerBand } from './compute.js';

export type {
  Regime,
  Mode,
  Globals,
  SimParams,
  AmortMonth,
  FlowYear,
  EtfScenarioYear,
  EtfKpis,
  ResaleResult,
  ResaleRow,
  ComputeResult,
} from './types.js';
