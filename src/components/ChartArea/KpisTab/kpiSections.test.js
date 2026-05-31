import { describe, it, expect } from 'vitest';
import { buildSections } from './kpiSections.js';

// Stub t : renvoie la clé (les branches .startsWith tombent donc sur l'anglais —
// on teste la structure de données, pas l'i18n réelle, ici).
const t = (k, opts) => (opts ? `${k}:${JSON.stringify(opts)}` : k);

const mkRES = ct => ({
  ct,
  emp: 0,
  mens: 0,
  assM: 0,
  totInt: 0,
  totAss: 0,
  rendBrut: 0,
  rendNet: 0,
  be: null,
  tri10: 0.05,
  tri15: 0.05,
  tri20: 0.05,
  van: 1000,
  moic: 1.5,
  flux: Array.from({ length: 30 }, () => ({
    cfN: -100,
    coc: -1,
    bilanRevente: 0,
    bilanTotal: 0,
    patNet: 0,
    patTotal: 0,
  })),
});

const ctx = {
  G: { horizon: 20, inflation: 2, rendAlt: 6, loyerPerso: 900, tauxActu: 3, regime: 'lmnp' },
  RES: { A: mkRES(285000), B: mkRES(300000) },
  sims: { A: { mode: 'loc', label: 'A' }, B: { mode: 'loc', label: 'B' } },
  etfPurGlobal: Array.from({ length: 30 }, (_, i) => ({ cap: 1000 * (i + 1) })),
  etfKpis: { tri: 0.06, triReal: 0.039, van: 42000, moic: 2.1 },
  crossovers: { A: 12, B: null },
};

describe('buildSections()', () => {
  it('produit 4 sections (Coûts, Rendements, TRI/VAN/MOIC, Patrimoine)', () => {
    const s = buildSections(t, ctx);
    expect(s).toHaveLength(4);
    expect(s.every(sec => Array.isArray(sec.rows) && sec.rows.length > 0)).toBe(true);
  });

  it('les formatters de cellule lisent RES (coût total)', () => {
    const s = buildSections(t, ctx);
    const coutRow = s[0].rows[0];
    expect(coutRow.fmt('A')).toContain('285');
    expect(coutRow.fmt('B')).toContain('300');
  });

  it('les KPIs ETF proviennent de etfKpis (van/moic/tri), pas recalculés', () => {
    const s = buildSections(t, ctx);
    const triVan = s[2].rows;
    const vanRow = triVan.find(r => r.tooltipKey === 'kpi.van');
    const moicRow = triVan.find(r => r.tooltipKey === 'kpi.moic');
    expect(vanRow.etfVal).toBe(42000);
    expect(moicRow.etfVal).toBe(2.1);
  });

  it('ajoute les lignes patrimoine 30 ans quand horizon < 30', () => {
    const at20 = buildSections(t, ctx).find(s => s.rows.some(r => r.tooltipKey === 'kpi.patTotal'));
    const labels20 = at20.rows.map(r => r.label);
    expect(labels20.some(l => l.startsWith('kpisTable.patTotal30'))).toBe(true);
  });

  it('masque les lignes 30 ans quand horizon = 30', () => {
    const s30 = buildSections(t, { ...ctx, G: { ...ctx.G, horizon: 30 } });
    const wealth = s30[3];
    expect(wealth.rows.some(r => r.label.startsWith('kpisTable.patTotal30'))).toBe(false);
  });
});
