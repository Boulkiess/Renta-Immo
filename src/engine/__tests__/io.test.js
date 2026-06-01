import { describe, it, expect } from 'vitest';
import { buildExportData } from '../io.js';
import { compute, computeEtfPur } from '@immo-renta/engine';
import { mkDef, KEYS } from '../../state/definitions.js';

const G = {
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
};

const sims = {
  A: { ...mkDef('loc'), label: 'Locatif A' },
  B: { ...mkDef('rp'), label: 'RP B' },
  C: { ...mkDef('loc'), label: 'Locatif C', enabled: false },
};
const RES = Object.fromEntries(KEYS.map(k => [k, compute(sims[k], G)]));
const etfPurGlobal = computeEtfPur(G);

describe('buildExportData()', () => {
  it('produit une structure d’export stable (golden-master)', () => {
    expect(buildExportData(G, sims, RES, etfPurGlobal)).toMatchSnapshot();
  });

  it('inclut les 3 simulations avec leurs inputs et leur libellé', () => {
    const d = buildExportData(G, sims, RES, etfPurGlobal);
    expect(Object.keys(d.simulations)).toEqual(['A', 'B', 'C']);
    expect(d.simulations.A.label).toBe('Locatif A');
    expect(d.simulations.A.inputs.mode).toBe('loc');
    expect(d.simulations.B.inputs.mode).toBe('rp');
    expect(d.simulations.C.enabled).toBe(false);
  });

  it('survit à un aller-retour JSON sans perte (inputs préservés)', () => {
    const d = buildExportData(G, sims, RES, etfPurGlobal);
    const roundTrip = JSON.parse(JSON.stringify(d));
    expect(roundTrip).toEqual(d);
    // les paramètres d'entrée doivent correspondre exactement à l'état source
    KEYS.forEach(k => expect(roundTrip.simulations[k].inputs).toEqual(sims[k]));
    expect(roundTrip.global).toEqual(G);
  });
});
