import { describe, it, expect } from 'vitest';
import { compute, computeEtfPur, computeEtfKpis } from '../src/index.js';
import { makeG, mkParams } from './fixtures.js';

// Golden-master : fige le comportement complet du moteur. Toute dérive lors d'un
// refactor (Phase 2+) fait échouer ces snapshots → garde-fou de non-régression.
// Les valeurs ne sont pas vérifiées « à la main » ici (c'est le rôle de compute.test.js) ;
// on gèle l'existant. Si un snapshot change, c'est INTENTIONNEL ou un bug — à trancher.

const G = makeG();

// On ne snapshot pas `amort` (240+ lignes) ni `revente` (dérivé de flux) — juste
// les scalaires KPI + le détail annuel `flux`, qui couvrent tous les chemins.
const snap = (/** @type {any} */ res) => {
  const clone = { ...res };
  delete clone.amort;
  delete clone.revente;
  return clone;
};

/** @type {[string, object, object][]} */
const scenarios = [
  ['loc · lmnp', mkParams('loc'), { regime: 'lmnp' }],
  ['loc · microbic', mkParams('loc'), { regime: 'microbic' }],
  ['loc · nu', mkParams('loc'), { regime: 'nu' }],
  ['rp', mkParams('rp'), {}],
];

describe('golden-master — compute()', () => {
  it.each(scenarios)('%s (horizon 20)', (_name, p, gOver) => {
    expect(snap(compute(p, { ...G, ...gOver }))).toMatchSnapshot();
  });

  it.each([10, 20, 30])('loc · lmnp à horizon %i', hz => {
    expect(snap(compute(mkParams('loc'), { ...G, horizon: hz }))).toMatchSnapshot();
  });
});

describe('golden-master — computeEtfPur()', () => {
  it('scénario ETF de référence (30 ans)', () => {
    expect(computeEtfPur(G)).toMatchSnapshot();
  });
});

describe('golden-master — computeEtfKpis()', () => {
  it.each([10, 20, 30])('KPIs ETF à horizon %i', hz => {
    expect(computeEtfKpis({ ...G, horizon: hz })).toMatchSnapshot();
  });
});
