import { describe, it, expect } from 'vitest';
import { CONCEPTS, GROUPS, monthlyPayment, npv, yearlyAmortization } from '../concepts.js';
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
  it('monthlyPayment matches the engine annuity (200k / 3.85% / 20y ≈ 1196 €/mo)', () => {
    const m = monthlyPayment(200000, 3.85, 20);
    expect(m).toBeGreaterThan(1194);
    expect(m).toBeLessThan(1199);
  });

  it('monthlyPayment handles zero-rate loan (loan / nM)', () => {
    expect(monthlyPayment(120000, 0, 10)).toBeCloseTo(1000, 6);
  });

  it('npv at r=0 is the plain sum of flows', () => {
    expect(npv([-100, 50, 60], 0)).toBeCloseTo(10, 9);
  });

  it('yearlyAmortization interest+principal roughly equals the loan over its life', () => {
    const { interest, principal } = yearlyAmortization(200000, 3.85, 20);
    expect(interest.length).toBe(20);
    expect(principal.reduce((a, b) => a + b, 0)).toBeCloseTo(200000, -1);
  });
});

describe('adapter correctness', () => {
  it('monthlyPayment concept → ~1196 €/mo at defaults', () => {
    const r = byId('monthlyPayment').compute({
      loanAmount: 200000,
      interestRate: 3.85,
      loanTerm: 20,
    });
    expect(r.unit).toBe('eurMonth');
    expect(r.value).toBeGreaterThan(1194);
    expect(r.value).toBeLessThan(1199);
  });

  it('allowances curve hits 96% (IR) at yr 21, 100% at yr 22; PS 100% at yr 30', () => {
    const r = byId('allowances').compute({});
    const [ir, ps] = r.series;
    expect(ir.data[4]).toBe(0); // yr 5
    expect(ir.data[20]).toBe(96); // yr 21
    expect(ir.data[21]).toBe(100); // yr 22
    expect(ps.data[21]).toBeCloseTo(28, 5); // yr 22
    expect(ps.data[29]).toBe(100); // yr 30
  });

  it('rentalTax differs by regime for the same inputs', () => {
    const base = {
      effectiveRent: 12000,
      charges: 3500,
      buildingDepreciation: 6250,
      worksDepreciation: 1500,
      annualInterest: 6000,
      marginalTaxRate: 30,
      socialCharges: 17.2,
    };
    const lmnp = byId('rentalTax').compute({ ...base, regime: 'lmnp' }).value;
    const micro = byId('rentalTax').compute({ ...base, regime: 'microbic' }).value;
    const nu = byId('rentalTax').compute({ ...base, regime: 'nu' }).value;
    expect(lmnp).toBe(0); // loss → no tax
    expect(micro).toBeCloseTo(6000 * 0.472, 4); // 50% allowance × (30+17.2)%
    expect(nu).toBeCloseTo(2500 * 0.472, 4); // (rent − charges − interest) × 47.2%
  });

  it('grossYield concept → 4.21% at 1000€ rent / 285k cost', () => {
    const r = byId('grossYield').compute({ rent: 1000, totalCost: 285000 });
    expect(r.value).toBeCloseTo((12000 / 285000) * 100, 6);
  });

  it('etfScenario returns 30 finite years', () => {
    const r = byId('etfScenario').compute(defaults(byId('etfScenario')));
    expect(r.series[0].data.length).toBe(30);
    expect(Number.isFinite(r.series[0].data[29])).toBe(true);
  });

  it('irrNpvMoic computes MOIC and a converging IRR at defaults', () => {
    const c = byId('irrNpvMoic');
    const r = c.compute({ flows: [-50000, 3000, 3000, 3500, 3500, 4000, 70000], discountRate: 3 });
    const moic = r.notes.find(n => n.label === 'doc.notes.moic').value;
    const tri = r.notes.find(n => n.label === 'doc.notes.tri').value;
    expect(moic).toBeCloseTo(87000 / 50000, 6);
    expect(tri).not.toBeNull();
  });
});

describe('failure modes (no NaN leaks, explicit nulls)', () => {
  it('IRR non-convergence → null (all-negative flows)', () => {
    const r = byId('irrNpvMoic').compute({ flows: [-50000, -1000, -1000, -1000], discountRate: 3 });
    const tri = r.notes.find(n => n.label === 'doc.notes.tri').value;
    expect(tri).toBeNull();
  });

  it('MOIC with zero initial outflow → null (no divide-by-zero)', () => {
    const r = byId('irrNpvMoic').compute({ flows: [0, 1000, 1000], discountRate: 3 });
    const moic = r.notes.find(n => n.label === 'doc.notes.moic').value;
    expect(moic).toBeNull();
  });

  it('grossYield with zero cost → null, not Infinity', () => {
    expect(byId('grossYield').compute({ rent: 1000, totalCost: 0 }).value).toBeNull();
  });
});
