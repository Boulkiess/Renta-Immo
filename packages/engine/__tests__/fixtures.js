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
  tauxActu: 3,
  rendAlt: 6,
  loyerPerso: 900,
  revalLoyerPerso: 2,
  budgetMensuel: 2500,
  revalBudget: 0,
  revalCharges: 2,
  investirSurplus: true,
  apportETF: 60000,
  inflation: 2,
  ...over,
});

/** Simulation params (p). All financial fields compute() reads, for both modes. */
export const mkParams = (mode, over = {}) => ({
  mode,
  prixAchat: 250000,
  fraisNotaire: 20000,
  travaux: 15000,
  fraisAgence: 0,
  fraisDossier: 0,
  apport: 50000,
  taux: 3.85,
  duree: 20,
  assurance: 0.25,
  revalBien: 2.0,
  fraisVente: 4,
  loyer: 1000,
  vacance: 5,
  taxeFonciere: 1200,
  chargesCopro: 800,
  assurPNO: 200,
  fraisGestion: 7,
  provision: 500,
  revalLoyer: 1.5,
  tmi: 30,
  ps: 17.2,
  amortBien: 2.5,
  amortTravaux: 10,
  impotPV: 19,
  psPV: 17.2,
  taxeFonciereRP: 1200,
  chargesCoproRP: 1200,
  assurHab: 300,
  provisionRP: 500,
  ...over,
});
