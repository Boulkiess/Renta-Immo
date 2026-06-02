import { describe, it, expect } from 'vitest';
import { buildSections } from './kpiSections.js';

// Stub t: returns the key (we test the data structure, not the real i18n, here).
const t = (k, opts) => (opts ? `${k}:${JSON.stringify(opts)}` : k);

const mkRES = totalCost => ({
  totalCost,
  loanAmount: 0,
  monthlyPayment: 0,
  monthlyInsurance: 0,
  totalInterest: 0,
  totalInsurance: 0,
  grossYield: 0,
  netYield: 0,
  breakEven: null,
  resaleBreakEven: null,
  tri10: 0.05,
  tri15: 0.05,
  tri20: 0.05,
  van: 1000,
  moic: 1.5,
  flows: Array.from({ length: 30 }, () => ({
    netCashFlow: -100,
    coc: -1,
    resaleBalance: 0,
    totalBalance: 0,
    netWorth: 0,
    totalWorth: 0,
  })),
});

const ctx = {
  G: {
    horizon: 20,
    inflation: 2,
    altReturn: 6,
    personalRent: 900,
    discountRate: 3,
    regime: 'lmnp',
  },
  RES: { A: mkRES(285000), B: mkRES(300000) },
  sims: { A: { mode: 'rental', label: 'A' }, B: { mode: 'rental', label: 'B' } },
  etfScenarioGlobal: Array.from({ length: 30 }, (_, i) => ({ cap: 1000 * (i + 1) })),
  etfKpis: { tri: 0.06, triReal: 0.039, van: 42000, moic: 2.1 },
  crossovers: { A: 12, B: null },
};

describe('buildSections()', () => {
  it('produces 4 sections (Costs, Yields, IRR/NPV/MOIC, Wealth)', () => {
    const s = buildSections(t, ctx);
    expect(s).toHaveLength(4);
    expect(s.every(sec => Array.isArray(sec.rows) && sec.rows.length > 0)).toBe(true);
  });

  it('cell formatters read RES (total cost)', () => {
    const s = buildSections(t, ctx);
    const costRow = s[0].rows[0];
    expect(costRow.fmt('A')).toContain('285');
    expect(costRow.fmt('B')).toContain('300');
  });

  it('ETF KPIs come from etfKpis (van/moic/tri), not recomputed', () => {
    const s = buildSections(t, ctx);
    const returns = s[2].rows;
    const vanRow = returns.find(r => r.tooltipKey === 'kpi.npv');
    const moicRow = returns.find(r => r.tooltipKey === 'kpi.moic');
    expect(vanRow.etfVal).toBe(42000);
    expect(moicRow.etfVal).toBe(2.1);
  });

  it('adds the 30-year wealth rows when horizon < 30', () => {
    const at20 = buildSections(t, ctx).find(s =>
      s.rows.some(r => r.tooltipKey === 'kpi.totalWorth')
    );
    const labels20 = at20.rows.map(r => r.label);
    expect(labels20.some(l => l.startsWith('kpisTable.totalWorth30'))).toBe(true);
  });

  it('hides the 30-year rows when horizon = 30', () => {
    const s30 = buildSections(t, { ...ctx, G: { ...ctx.G, horizon: 30 } });
    const wealth = s30[3];
    expect(wealth.rows.some(r => r.label.startsWith('kpisTable.totalWorth30'))).toBe(false);
  });
});
