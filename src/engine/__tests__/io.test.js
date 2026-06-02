import { describe, it, expect } from 'vitest';
import { buildExportData } from '../io.js';
import { compute, computeEtfScenario } from '@immo-renta/engine';
import { mkDef, KEYS } from '../../state/definitions.js';

const G = {
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
};

const sims = {
  A: { ...mkDef('rental'), label: 'Rental A' },
  B: { ...mkDef('primary'), label: 'Primary B' },
  C: { ...mkDef('rental'), label: 'Rental C', enabled: false },
};
const RES = Object.fromEntries(KEYS.map(k => [k, compute(sims[k], G)]));
const etfScenarioGlobal = computeEtfScenario(G);

describe('buildExportData()', () => {
  it('produces a stable export structure (golden-master)', () => {
    expect(buildExportData(G, sims, RES, etfScenarioGlobal)).toMatchSnapshot();
  });

  it('includes the 3 simulations with their inputs and label', () => {
    const d = buildExportData(G, sims, RES, etfScenarioGlobal);
    expect(Object.keys(d.simulations)).toEqual(['A', 'B', 'C']);
    expect(d.simulations.A.label).toBe('Rental A');
    expect(d.simulations.A.inputs.mode).toBe('rental');
    expect(d.simulations.B.inputs.mode).toBe('primary');
    expect(d.simulations.C.enabled).toBe(false);
  });

  it('survives a JSON round-trip without loss (inputs preserved)', () => {
    const d = buildExportData(G, sims, RES, etfScenarioGlobal);
    const roundTrip = JSON.parse(JSON.stringify(d));
    expect(roundTrip).toEqual(d);
    // the input parameters must match the source state exactly
    KEYS.forEach(k => expect(roundTrip.simulations[k].inputs).toEqual(sims[k]));
    expect(roundTrip.global).toEqual(G);
  });
});
