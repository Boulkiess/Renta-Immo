import { describe, it, expect } from 'vitest';
import { CONCEPTS, GROUPS, mensualite, npv, yearlyAmort } from '../concepts.js';
import en from '../../../i18n/locales/en.json';
import fr from '../../../i18n/locales/fr.json';

const byId = id => CONCEPTS.find(c => c.id === id);
const resolve = (obj, path) =>
  path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

// Build a defaults map for a concept's inputs (what the card seeds without a live sim).
const defaults = concept => {
  const v = {};
  concept.inputs.forEach(inp => {
    v[inp.key] = inp.default;
  });
  return v;
};

describe('registry integrity', () => {
  it('has unique ids', () => {
    const ids = CONCEPTS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every concept has a valid group, render kind and compute fn', () => {
    for (const c of CONCEPTS) {
      expect(GROUPS).toContain(c.group);
      expect(['number', 'line', 'bars']).toContain(c.render);
      expect(typeof c.compute).toBe('function');
      expect(Array.isArray(c.inputs)).toBe(true);
    }
  });

  it('numeric inputs have coherent ranges and in-range defaults', () => {
    for (const c of CONCEPTS) {
      for (const inp of c.inputs) {
        if (inp.type === 'select') {
          expect(inp.options.length).toBeGreaterThan(0);
          expect(inp.options).toContain(inp.default);
        } else if (inp.type === 'flows') {
          expect(Array.isArray(inp.default)).toBe(true);
          expect(inp.default.length).toBe(inp.count);
        } else {
          expect(inp.min).toBeLessThan(inp.max);
          expect(inp.step).toBeGreaterThan(0);
          expect(inp.default).toBeGreaterThanOrEqual(inp.min);
          expect(inp.default).toBeLessThanOrEqual(inp.max);
        }
      }
    }
  });

  it('i18nKey resolves to title + body in BOTH locales', () => {
    for (const c of CONCEPTS) {
      for (const [name, loc] of [
        ['en', en],
        ['fr', fr],
      ]) {
        const title = resolve(loc, `${c.i18nKey}.title`);
        const body = resolve(loc, `${c.i18nKey}.body`);
        expect(typeof title, `${c.id}.title missing in ${name} (${c.i18nKey})`).toBe('string');
        expect(title.length).toBeGreaterThan(0);
        expect(typeof body, `${c.id}.body missing in ${name} (${c.i18nKey})`).toBe('string');
      }
    }
  });

  it('every compute returns either a number result or a chart result', () => {
    for (const c of CONCEPTS) {
      const r = c.compute(defaults(c), undefined);
      if (c.render === 'number') {
        expect('value' in r).toBe(true);
        expect(typeof r.unit).toBe('string');
      } else {
        expect(['line', 'bars']).toContain(r.kind);
        expect(Array.isArray(r.xLabels)).toBe(true);
        expect(Array.isArray(r.series)).toBe(true);
        r.series.forEach(s => {
          expect(Array.isArray(s.data)).toBe(true);
          // chart adapters never emit undefined holes (drawLine also filters,
          // but the adapter contract is "no undefined in series").
          s.data.forEach(d => expect(d === null || Number.isFinite(d)).toBe(true));
        });
      }
    }
  });
});

describe('helpers', () => {
  it('mensualite matches the engine annuity (200k / 3.85% / 20y ≈ 1196 €/mo)', () => {
    const m = mensualite(200000, 3.85, 20);
    expect(m).toBeGreaterThan(1194);
    expect(m).toBeLessThan(1199);
  });

  it('mensualite handles zero-rate loan (emp / nM)', () => {
    expect(mensualite(120000, 0, 10)).toBeCloseTo(1000, 6);
  });

  it('npv at r=0 is the plain sum of flows', () => {
    expect(npv([-100, 50, 60], 0)).toBeCloseTo(10, 9);
  });

  it('yearlyAmort interest+capital roughly equals the loan over its life', () => {
    const { interest, capital } = yearlyAmort(200000, 3.85, 20);
    expect(interest.length).toBe(20);
    expect(capital.reduce((a, b) => a + b, 0)).toBeCloseTo(200000, -1);
  });
});

describe('adapter correctness', () => {
  it('mensualite concept → ~1196 €/mo at defaults', () => {
    const r = byId('mensualite').compute({ emp: 200000, taux: 3.85, duree: 20 });
    expect(r.unit).toBe('eurMonth');
    expect(r.value).toBeGreaterThan(1194);
    expect(r.value).toBeLessThan(1199);
  });

  it('abattements curve hits 96% (IR) at yr 21, 100% at yr 22; PS 100% at yr 30', () => {
    const r = byId('abattements').compute({});
    const [ir, ps] = r.series;
    expect(ir.data[4]).toBe(0); // yr 5
    expect(ir.data[20]).toBe(96); // yr 21
    expect(ir.data[21]).toBe(100); // yr 22
    expect(ps.data[21]).toBeCloseTo(28, 5); // yr 22
    expect(ps.data[29]).toBe(100); // yr 30
  });

  it('impotLoc differs by regime for the same inputs', () => {
    const base = { le: 12000, chg: 3500, ab: 6250, at: 1500, intAnnuel: 6000, tmi: 30, ps: 17.2 };
    const lmnp = byId('impotLoc').compute({ ...base, regime: 'lmnp' }).value;
    const micro = byId('impotLoc').compute({ ...base, regime: 'microbic' }).value;
    const nu = byId('impotLoc').compute({ ...base, regime: 'nu' }).value;
    expect(lmnp).toBe(0); // deficit → no tax
    expect(micro).toBeCloseTo(6000 * 0.472, 4); // 50% abatement × (30+17.2)%
    expect(nu).toBeCloseTo(2500 * 0.472, 4); // (le − chg − int) × 47.2%
  });

  it('rendBrut concept → 4.21% at 1000€ rent / 285k cost', () => {
    const r = byId('rendBrut').compute({ loyer: 1000, ct: 285000 });
    expect(r.value).toBeCloseTo((12000 / 285000) * 100, 6);
  });

  it('etfPur returns 30 finite years', () => {
    const r = byId('etfPur').compute(defaults(byId('etfPur')));
    expect(r.series[0].data.length).toBe(30);
    expect(Number.isFinite(r.series[0].data[29])).toBe(true);
  });

  it('triVanMoic computes MOIC and a converging IRR at defaults', () => {
    const c = byId('triVanMoic');
    const r = c.compute({ flows: [-50000, 3000, 3000, 3500, 3500, 4000, 70000], tauxActu: 3 });
    const moic = r.notes.find(n => n.label === 'doc.notes.moic').value;
    const tri = r.notes.find(n => n.label === 'doc.notes.tri').value;
    expect(moic).toBeCloseTo(87000 / 50000, 6);
    expect(tri).not.toBeNull();
  });
});

describe('failure modes (no NaN leaks, explicit nulls)', () => {
  it('IRR non-convergence → null (all-negative flows)', () => {
    const r = byId('triVanMoic').compute({ flows: [-50000, -1000, -1000, -1000], tauxActu: 3 });
    const tri = r.notes.find(n => n.label === 'doc.notes.tri').value;
    expect(tri).toBeNull();
  });

  it('MOIC with zero initial outflow → null (no divide-by-zero)', () => {
    const r = byId('triVanMoic').compute({ flows: [0, 1000, 1000], tauxActu: 3 });
    const moic = r.notes.find(n => n.label === 'doc.notes.moic').value;
    expect(moic).toBeNull();
  });

  it('rendBrut with zero cost → null, not Infinity', () => {
    expect(byId('rendBrut').compute({ loyer: 1000, ct: 0 }).value).toBeNull();
  });
});
