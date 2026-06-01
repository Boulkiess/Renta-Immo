import { describe, it, expect } from 'vitest';
import {
  compute,
  computeEtfPur,
  computeEtfKpis,
  surplusAt,
  irr,
  abattementIR,
  abattementPS,
  impLoc,
} from '../src/index.js';
import { makeG, mkParams } from './fixtures.js';

const makeLoc = (over = {}) => mkParams('loc', over);
const makeRp = (over = {}) => mkParams('rp', over);

describe('irr() — Newton-Raphson', () => {
  it('résout un flux à TRI connu de 10 %', () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 6);
  });

  it('résout un flux différé à 10 % (1000 → 1210 en 2 ans)', () => {
    expect(irr([-1000, 0, 1210])).toBeCloseTo(0.1, 6);
  });

  it('retourne null en cas de non-convergence (aucun changement de signe)', () => {
    expect(irr([100, 110])).toBeNull();
  });
});

describe('abattementIR(yr) — charnières art. 150 VC CGI', () => {
  it.each([
    [5, 0],
    [6, 6],
    [21, 96],
    [22, 100],
    [30, 100],
  ])('année %i → %i %%', (yr, expected) => {
    expect(abattementIR(yr)).toBeCloseTo(expected, 6);
  });
});

describe('abattementPS(yr) — charnières art. 150 VC CGI', () => {
  it.each([
    [5, 0],
    [6, 1.65],
    [21, 26.4],
    [22, 28.0],
    [30, 100],
    [31, 100],
  ])('année %i → %f %%', (yr, expected) => {
    expect(abattementPS(yr)).toBeCloseTo(expected, 6);
  });
});

describe('impLoc() — 3 régimes fiscaux', () => {
  // le=12000, chg=3000, ab=5000, at=1000, intAnnuel=2000, tmi=30, ps=17,2 → taux global 47,2 %
  const args = [12000, 3000, 5000, 1000, 30, 17.2];

  it('LMNP réel : RI = le − chg − ab − at − int, déficit reporté (clampé à 0)', () => {
    // RI = max(0, 12000-3000-5000-1000-2000) = 1000 → impôt = 1000 × 0,472 = 472
    expect(impLoc(...args, 'lmnp', 2000)).toBeCloseTo(472, 6);
  });

  it('Micro-BIC : abattement 50 % sur le loyer effectif', () => {
    // RI = 12000 × 0,5 = 6000 → impôt = 6000 × 0,472 = 2832
    expect(impLoc(...args, 'microbic', 2000)).toBeCloseTo(2832, 6);
  });

  it('Foncier nu : RI = le − chg − int (intérêts déductibles)', () => {
    // RI = max(0, 12000-3000-2000) = 7000 → impôt = 7000 × 0,472 = 3304
    expect(impLoc(...args, 'nu', 2000)).toBeCloseTo(3304, 6);
  });

  it('clampe le revenu imposable à 0 (jamais d’impôt négatif)', () => {
    expect(impLoc(1000, 5000, 5000, 1000, 30, 17.2, 'lmnp', 2000)).toBe(0);
  });
});

describe('compute() — mensualité de crédit (annuité constante)', () => {
  it('cas textbook : 200 000 € à 5 % sur 20 ans ≈ 1319,9 €/mois', () => {
    const p = makeLoc({
      prixAchat: 200000,
      fraisNotaire: 0,
      travaux: 0,
      apport: 0,
      taux: 5,
      duree: 20,
    });
    const r = compute(p, makeG());
    expect(r.emp).toBe(200000);
    expect(r.mens).toBeCloseTo(1319.9, 0);
  });

  it('prêt à taux 0 : mensualité = capital / nombre de mois', () => {
    const p = makeLoc({
      prixAchat: 100000,
      fraisNotaire: 0,
      travaux: 0,
      apport: 0,
      taux: 0,
      duree: 20,
    });
    const r = compute(p, makeG());
    expect(r.mens).toBeCloseTo(100000 / 240, 6);
  });
});

describe('compute() — apport plafonné au coût total (sur-financement)', () => {
  const base = makeLoc({
    prixAchat: 200000,
    fraisNotaire: 15000,
    travaux: 10000,
    fraisAgence: 0,
    fraisDossier: 0,
  });
  const ct = 200000 + 15000 + 10000; // 225000
  const excess = 80000;

  // Bien acheté comptant : une fois l'apport ≥ ct, le crédit est nul. Le reliquat
  // d'apport n'appartient pas au rendement du bien : les métriques opérationnelles
  // (TRI/VAN/MOIC, patNet, coc, bilans hors ETF) ne doivent PAS bouger.
  it('le reliquat ne touche pas les métriques opérationnelles du bien', () => {
    const atCt = compute({ ...base, apport: ct }, makeG());
    const above = compute({ ...base, apport: ct + excess }, makeG());

    expect(above.emp).toBe(0);
    expect(atCt.emp).toBe(0);
    expect(above.tri10).toBe(atCt.tri10);
    expect(above.tri20).toBe(atCt.tri20);
    expect(above.van).toBe(atCt.van);
    expect(above.moic).toBe(atCt.moic);
    expect(above.beRevente).toBe(atCt.beRevente);
    above.flux.forEach((f, i) => {
      expect(f.patNet).toBeCloseTo(atCt.flux[i].patNet, 6);
      expect(f.coc).toBeCloseTo(atCt.flux[i].coc, 6);
      expect(f.bilanRevente).toBeCloseTo(atCt.flux[i].bilanRevente, 6);
      expect(f.bilanCash).toBeCloseTo(atCt.flux[i].bilanCash, 6);
    });
  });

  // Toggle surplus→ETF actif : le reliquat est investi en ETF dès l'année 0 et
  // compose au rendAlt. patTotal gagne le reliquat composé ; bilanTotal gagne ce
  // même montant moins la mise supplémentaire (le reliquat est aussi un coût).
  it('investit le reliquat en ETF quand investirSurplus est actif', () => {
    const g = makeG({ investirSurplus: true, rendAlt: 6 });
    const atCt = compute({ ...base, apport: ct }, g);
    const above = compute({ ...base, apport: ct + excess }, g);
    above.flux.forEach((f, i) => {
      const compounded = excess * Math.pow(1.06, i + 1);
      expect(f.patTotal).toBeCloseTo(atCt.flux[i].patTotal + compounded, 4);
      expect(f.etfPoche).toBeCloseTo(atCt.flux[i].etfPoche + compounded, 4);
      expect(f.bilanTotal).toBeCloseTo(atCt.flux[i].bilanTotal + compounded - excess, 4);
    });
  });

  // Toggle désactivé : le reliquat reste du cash hors modèle → aucune courbe ne bouge.
  it('ignore le reliquat quand investirSurplus est désactivé', () => {
    const g = makeG({ investirSurplus: false });
    const atCt = compute({ ...base, apport: ct }, g);
    const above = compute({ ...base, apport: ct + excess }, g);
    above.flux.forEach((f, i) => {
      expect(f.patTotal).toBeCloseTo(atCt.flux[i].patTotal, 6);
      expect(f.bilanTotal).toBeCloseTo(atCt.flux[i].bilanTotal, 6);
    });
  });
});

describe('compute() — report de déficit LMNP', () => {
  it('déduit amortissements + reporte les déficits → impôt ≤ régime nu chaque année', () => {
    const lmnp = compute(makeLoc(), makeG({ regime: 'lmnp' }));
    const nu = compute(makeLoc(), makeG({ regime: 'nu' }));
    // RI_lmnp = max(0, le−chg−ab−at−int−report) ≤ RI_nu = max(0, le−chg−int) à chaque année
    lmnp.flux.forEach((f, i) => expect(f.imp).toBeLessThanOrEqual(nu.flux[i].imp + 1e-6));
    // Amortissement par défaut : le revenu locatif est abrité dès l'année 1 (impôt nul)
    expect(lmnp.flux[0].imp).toBe(0);
  });

  it('reporte un déficit sur les années profitables (sans amortissement, isole le report)', () => {
    // ab = at = 0 → la seule différence LMNP vs nu est le report de déficit
    const p = makeLoc({ amortBien: 0, amortTravaux: 0 });
    const lmnp = compute(p, makeG({ regime: 'lmnp' }));
    const nu = compute(p, makeG({ regime: 'nu' }));
    const sum = r => r.flux.reduce((s, f) => s + f.imp, 0);
    // Intérêts élevés en début de prêt → année(s) déficitaire(s) reportées → LMNP taxe moins que nu
    expect(sum(lmnp)).toBeLessThan(sum(nu));
    expect(sum(nu)).toBeGreaterThan(0);
  });

  it('en Micro-BIC le même bien est taxé dès l’année 1 (pas de déficit)', () => {
    const r = compute(makeLoc(), makeG({ regime: 'microbic' }));
    expect(r.flux[0].imp).toBeGreaterThan(0);
  });
});

describe('compute() — exonération de plus-value (mode loc)', () => {
  // iPV dérivé : reventeNet = pr − rest − fa − iPV ; fa = pr × fraisVente/100
  const ipvAt = (r, p, yr) => {
    const f = r.flux[yr - 1];
    const fa = f.pr * (p.fraisVente / 100);
    return f.pr - f.rest - fa - f.reventeNet;
  };

  it('IR exonéré à 22 ans, PS+IR totalement exonérés à 30 ans', () => {
    const p = makeLoc({ revalBien: 2 });
    const r = compute(p, makeG({ horizon: 30 }));
    // 30 ans : abattement IR et PS = 100 % → iPV ≈ 0
    expect(ipvAt(r, p, 30)).toBeCloseTo(0, 4);
    // 22 ans : IR exonéré mais PS partiel → iPV strictement positif
    expect(ipvAt(r, p, 22)).toBeGreaterThan(0);
    // L'exonération IR fait chuter l'impôt entre 21 et 22 ans
    expect(ipvAt(r, p, 22)).toBeLessThan(ipvAt(r, p, 21));
  });

  it('mode RP : aucune imposition de plus-value (iPV = 0 partout)', () => {
    const p = makeRp({ revalBien: 2 });
    const r = compute(p, makeG({ horizon: 30 }));
    for (const f of r.flux) {
      const fa = f.pr * (p.fraisVente / 100);
      expect(f.reventeNet).toBeCloseTo(f.pr - f.rest - fa, 4);
    }
  });
});

describe('compute() — invariants mode RP', () => {
  it('cfN est toujours ≤ 0 (sorties réelles uniquement)', () => {
    const r = compute(makeRp(), makeG());
    for (const f of r.flux) expect(f.cfN).toBeLessThanOrEqual(0);
  });

  it('le (loyer économisé) = loyerPerso annualisé, hors cfN', () => {
    const g = makeG({ loyerPerso: 900, revalLoyerPerso: 2 });
    const r = compute(makeRp(), g);
    expect(r.flux[0].le).toBeCloseTo(900 * 12, 6);
    expect(r.flux[4].le).toBeCloseTo(900 * 12 * Math.pow(1.02, 4), 6);
  });
});

describe('computeEtfPur() — scénario de référence ETF', () => {
  it('démarre à apportETF et capitalise au rendement alternatif', () => {
    const g = makeG({ apportETF: 60000, rendAlt: 6, budgetMensuel: 0, loyerPerso: 0 });
    const etf = computeEtfPur(g);
    // surplus nul → croissance pure : cap[1] = 60000 × 1,06
    expect(etf[0].cap).toBeCloseTo(60000 * 1.06, 4);
    expect(etf[1].cap).toBeCloseTo(60000 * Math.pow(1.06, 2), 4);
  });

  it('capNet applique le PFU 30 % sur la plus-value uniquement', () => {
    const g = makeG({ apportETF: 60000, rendAlt: 6, budgetMensuel: 0, loyerPerso: 0 });
    const etf = computeEtfPur(g);
    const gain = etf[0].cap - 60000;
    expect(etf[0].capNet).toBeCloseTo(etf[0].cap - gain * 0.3, 4);
  });
});

describe('surplusAt() — surplus annuel de référence ETF (budget − loyer perso)', () => {
  it('année 1 : budget − loyer perso, sans revalorisation', () => {
    // 2500×12 − 900×12 = 30000 − 10800 = 19200
    expect(surplusAt(makeG(), 1)).toBeCloseTo(19200, 6);
  });

  it('revalorise budget et loyer perso indépendamment', () => {
    const g = makeG({ revalBudget: 1, revalLoyerPerso: 2 });
    const expected = 2500 * 12 * Math.pow(1.01, 4) - 900 * 12 * Math.pow(1.02, 4);
    expect(surplusAt(g, 5)).toBeCloseTo(expected, 6);
  });

  it('clampe à 0 quand le loyer perso dépasse le budget', () => {
    expect(surplusAt(makeG({ budgetMensuel: 500, loyerPerso: 900 }), 1)).toBe(0);
  });
});

describe('computeEtfKpis() — KPIs ETF (caractérisation + invariants)', () => {
  it('TRI = rendAlt et TRI réel = (1+rendAlt)/(1+inflation)−1', () => {
    const g = makeG({ rendAlt: 6, inflation: 2 });
    const { tri, triReal } = computeEtfKpis(g);
    expect(tri).toBeCloseTo(0.06, 12);
    expect(triReal).toBeCloseTo(1.06 / 1.02 - 1, 12);
  });

  it('VAN = 0 quand tauxActu = rendAlt (invariant algébrique exact)', () => {
    const g = makeG({ tauxActu: 6, rendAlt: 6 });
    expect(computeEtfKpis(g).van).toBeCloseTo(0, 4);
  });

  it('MOIC = (1+rendAlt)^horizon quand le surplus est nul', () => {
    // loyerPerso ≥ budget → surplus 0 → cap[hz] = apportETF×(1+r)^hz → MOIC = (1+r)^hz
    const g = makeG({ budgetMensuel: 500, loyerPerso: 900, rendAlt: 6, horizon: 20 });
    expect(computeEtfKpis(g).moic).toBeCloseTo(Math.pow(1.06, 20), 6);
  });

  it('MOIC = null quand apportETF = 0 (pas de division par zéro)', () => {
    expect(computeEtfKpis(makeG({ apportETF: 0 })).moic).toBeNull();
  });

  it('horizon 30 : VAN et MOIC finis, surplus total positif', () => {
    const { van, moic, surplusTotal } = computeEtfKpis(makeG({ horizon: 30 }));
    expect(Number.isFinite(van)).toBe(true);
    expect(Number.isFinite(moic)).toBe(true);
    expect(surplusTotal).toBeGreaterThan(0);
  });
});
