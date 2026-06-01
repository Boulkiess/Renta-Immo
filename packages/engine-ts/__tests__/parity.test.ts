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

const mkParams = (mode: 'loc' | 'rp', over: Partial<SimParams> = {}): SimParams => ({
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

// Matrix: loc × 3 regimes, rp, an over-financed sim, and a few global tweaks.
const scenarios: [string, SimParams, Globals][] = [
  ['loc · lmnp', mkParams('loc'), makeG({ regime: 'lmnp' })],
  ['loc · microbic', mkParams('loc'), makeG({ regime: 'microbic' })],
  ['loc · nu', mkParams('loc'), makeG({ regime: 'nu' })],
  ['rp', mkParams('rp'), makeG()],
  ['loc · sur-financé', mkParams('loc', { apport: 320000 }), makeG()],
  ['loc · surplus off', mkParams('loc'), makeG({ investirSurplus: false })],
  ['rp · horizon 30', mkParams('rp'), makeG({ horizon: 30 })],
];

describe('parity — TS engine matches JS engine', () => {
  it.each(scenarios)('compute() — %s', (_name, p, g) => {
    expect(ts.compute(p, g)).toEqual(js.compute(p, g));
  });

  it.each(scenarios)('computeEtfPur() — %s', (_name, _p, g) => {
    expect(ts.computeEtfPur(g)).toEqual(js.computeEtfPur(g));
  });

  it.each([10, 20, 30])('computeEtfKpis() — horizon %i', hz => {
    const g = makeG({ horizon: hz });
    expect(ts.computeEtfKpis(g)).toEqual(js.computeEtfKpis(g));
  });

  it('pure helpers agree (irr, abattements, impLoc)', () => {
    expect(ts.irr([-1000, 0, 1210])).toEqual(js.irr([-1000, 0, 1210]));
    for (let yr = 1; yr <= 31; yr++) {
      expect(ts.abattementIR(yr)).toEqual(js.abattementIR(yr));
      expect(ts.abattementPS(yr)).toEqual(js.abattementPS(yr));
    }
    expect(ts.impLoc(12000, 3000, 5000, 1000, 30, 17.2, 'lmnp', 2000)).toEqual(
      js.impLoc(12000, 3000, 5000, 1000, 30, 17.2, 'lmnp', 2000)
    );
  });
});
