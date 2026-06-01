// Public domain types of the engine. In the JS package these live as JSDoc
// @typedef in compute.js; here they are first-class TypeScript interfaces —
// the main authoring-ergonomics difference between the two variants.

export type Regime = 'lmnp' | 'microbic' | 'nu';
export type Mode = 'loc' | 'rp';

/** Global settings shared across the 3 simulations. Mirrors state's DEFAULT_G. */
export interface Globals {
  regime: Regime;
  horizon: number;
  tauxActu: number;
  rendAlt: number;
  loyerPerso: number;
  revalLoyerPerso: number;
  budgetMensuel: number;
  revalBudget: number;
  revalCharges?: number;
  investirSurplus: boolean;
  apportETF: number;
  inflation: number;
}

/** One simulation's financial parameters. Mirrors state's mkDef(). */
export interface SimParams {
  mode: Mode;
  prixAchat: number;
  fraisNotaire: number;
  travaux: number;
  fraisAgence: number;
  fraisDossier?: number;
  apport: number;
  taux: number;
  duree: number;
  assurance: number;
  revalBien: number;
  fraisVente: number;
  loyer: number;
  vacance: number;
  taxeFonciere: number;
  chargesCopro: number;
  assurPNO: number;
  fraisGestion: number;
  provision: number;
  revalLoyer: number;
  tmi: number;
  ps: number;
  amortBien: number;
  amortTravaux: number;
  impotPV: number;
  psPV: number;
  taxeFonciereRP: number;
  chargesCoproRP: number;
  assurHab: number;
  provisionRP: number;
}

export interface AmortMonth {
  inter: number;
  cap: number;
  assur: number;
  rest: number;
}

export interface FluxYear {
  yr: number;
  le: number;
  chg: number;
  ann: number;
  imp: number;
  cfN: number;
  cfC: number;
  coc: number | null;
  vb: number;
  rest: number;
  patNet: number;
  patTotal: number;
  etfPoche: number;
  reventeNet: number;
  bilanRevente: number;
  bilanTotal: number;
  bilanCash: number;
  pr: number;
}

export interface EtfPurYear {
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
  pr: number;
  fa: number;
  reventeNet: number;
}

export interface ReventeRow {
  yr: number;
  pr: number;
  rest: number;
  bilanRevente: number;
}

export interface ComputeResult {
  ct: number;
  emp: number;
  mens: number;
  assM: number;
  totInt: number;
  totAss: number;
  rendBrut: number;
  rendNet: number;
  cfM: number;
  be: number | null;
  beRevente: number | null;
  flux: FluxYear[];
  amort: AmortMonth[];
  tri10: number | null;
  tri15: number | null;
  tri20: number | null;
  van: number | null;
  moic: number;
  revente: ReventeRow[];
}
