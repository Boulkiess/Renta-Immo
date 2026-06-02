import { describe, it, expect } from 'vitest';
import { compute, computeEtfScenario, computeEtfKpis } from '../src/index.js';
import { makeG, mkParams } from './fixtures.js';

// Golden-master: freezes the engine's full behavior. Any drift during a refactor
// fails these snapshots → non-regression guardrail. The values are not checked "by
// hand" here (that is compute.test.js's job); we freeze the existing behavior. If a
// snapshot changes, it is INTENTIONAL or a bug — to be decided.

const G = makeG();

// We do not snapshot `amortization` (240+ rows) nor `resaleByYear` (derived from
// flows) — just the KPI scalars + the yearly `flows` detail, which cover every path.
const snap = (/** @type {any} */ res) => {
  const clone = { ...res };
  delete clone.amortization;
  delete clone.resaleByYear;
  return clone;
};

/** @type {[string, object, object][]} */
const scenarios = [
  ['rental · lmnp', mkParams('rental'), { regime: 'lmnp' }],
  ['rental · microbic', mkParams('rental'), { regime: 'microbic' }],
  ['rental · nu', mkParams('rental'), { regime: 'nu' }],
  ['primary', mkParams('primary'), {}],
  ['viager · financed bouquet', mkParams('viager'), {}],
  ['viager · cash bouquet', mkParams('viager', { downPayment: 70000 }), {}],
];

describe('golden-master — compute()', () => {
  it.each(scenarios)('%s (horizon 20)', (_name, p, gOver) => {
    expect(snap(compute(p, { ...G, ...gOver }))).toMatchSnapshot();
  });

  it.each([10, 20, 30])('rental · lmnp at horizon %i', hz => {
    expect(snap(compute(mkParams('rental'), { ...G, horizon: hz }))).toMatchSnapshot();
  });
});

describe('golden-master — computeEtfScenario()', () => {
  it('ETF reference scenario (30 years)', () => {
    expect(computeEtfScenario(G)).toMatchSnapshot();
  });
});

describe('golden-master — computeEtfKpis()', () => {
  it.each([10, 20, 30])('ETF KPIs at horizon %i', hz => {
    expect(computeEtfKpis({ ...G, horizon: hz })).toMatchSnapshot();
  });
});
