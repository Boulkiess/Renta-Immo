// Public API of the TypeScript engine variant. Mirrors @immo-renta/engine's
// barrel, plus the domain types (which the JS package can only emit, not export
// as named values).
export {
  compute,
  computeEtfPur,
  computeEtfKpis,
  crossoverYear,
  irr,
  revalorise,
  surplusAt,
  abattementIR,
  abattementPS,
  impLoc,
  buildAmortization,
  computeResale,
  calcTRI,
  calcVAN,
  calcMoic,
} from './compute.js';

export type {
  Regime,
  Mode,
  Globals,
  SimParams,
  AmortMonth,
  FluxYear,
  EtfPurYear,
  EtfKpis,
  ResaleResult,
  ReventeRow,
  ComputeResult,
} from './types.js';
