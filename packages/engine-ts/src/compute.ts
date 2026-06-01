// Pure financial engine — TypeScript variant of @immo-renta/engine.
// Logic is a 1:1 port of the JS package; only the type annotations differ.
// A parity test (../__tests__/parity.test.ts) asserts identical output.

import type {
  AmortMonth,
  ComputeResult,
  EtfKpis,
  EtfPurYear,
  FluxYear,
  Globals,
  Regime,
  ResaleResult,
  SimParams,
} from './types.js';

// ── Constantes fiscales ───────────────────────────────────────
const PFU_RATE = 0.3; // flat tax (PFU) sur la plus-value ETF (CTO)
const MICROBIC_ABATTEMENT = 0.5; // abattement forfaitaire Micro-BIC (meublé non classé)
// Abattements progressifs sur la plus-value immobilière (art. 150 VC CGI)
const ABAT_IR_PER_YEAR = 6; // %/an, années 6→21 (96 % cumulés à la 21e)
const ABAT_PS_PER_YEAR = 1.65; // %/an, années 6→21
const ABAT_PS_AT_22 = (21 - 5) * ABAT_PS_PER_YEAR + 1.6; // 28,0 % cumulés à la 22e (bonus PS 1,6)
const ABAT_PS_LATE_PER_YEAR = 9; // %/an, années 23→30
const ABAT_FULL = 100; // exonération totale

/** Compound revaluation: base × (1 + ratePct%)^periods. */
export const revalorise = (base: number, ratePct: number, periods: number): number =>
  base * Math.pow(1 + ratePct / 100, periods);

/** Annual surplus of the ETF reference scenario (revalued budget − revalued personal rent). */
export const surplusAt = (g: Globals, yr: number): number =>
  Math.max(
    0,
    revalorise(g.budgetMensuel * 12, g.revalBudget, yr - 1) -
      revalorise(g.loyerPerso * 12, g.revalLoyerPerso, yr - 1)
  );

/** Internal rate of return via Newton-Raphson. Returns null on non-convergence. */
export function irr(flows: number[], guess = 0.1, maxIter = 100, tol = 1e-7): number | null {
  let r = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0,
      dnpv = 0;
    for (let t = 0; t < flows.length; t++) {
      const d = Math.pow(1 + r, t);
      npv += flows[t] / d;
      if (t > 0) dnpv -= (t * flows[t]) / Math.pow(1 + r, t + 1);
    }
    if (Math.abs(dnpv) < 1e-15) return null;
    const nr = r - npv / dnpv;
    if (Math.abs(nr - r) < tol) return nr;
    r = nr;
    if (!isFinite(r) || r < -1) return null;
  }
  return null;
}

/** Abattement IR (%) — art. 150 VC CGI. */
export function abattementIR(yr: number): number {
  if (yr <= 5) return 0;
  if (yr <= 21) return (yr - 5) * ABAT_IR_PER_YEAR; // 6 %/an de la 6e à la 21e → 96 %
  return ABAT_FULL; // 4 % à la 22e = exonération totale
}

/** Abattement PS (%) — art. 150 VC CGI. */
export function abattementPS(yr: number): number {
  if (yr <= 5) return 0;
  if (yr <= 21) return (yr - 5) * ABAT_PS_PER_YEAR; // 1,65 %/an de la 6e à la 21e
  if (yr === 22) return ABAT_PS_AT_22; // 28,0 %
  if (yr <= 30) return ABAT_PS_AT_22 + (yr - 22) * ABAT_PS_LATE_PER_YEAR; // 9 %/an, 23e→30e
  return ABAT_FULL;
}

/** Locative income tax for one year. */
export function impLoc(
  le: number,
  chg: number,
  ab: number,
  at: number,
  tmi: number,
  ps: number,
  regime: Regime,
  intAnnuel = 0
): number {
  let ri: number;
  if (regime === 'lmnp') ri = Math.max(0, le - chg - ab - at - intAnnuel);
  else if (regime === 'microbic') ri = Math.max(0, le * MICROBIC_ABATTEMENT);
  else ri = Math.max(0, le - chg - intAnnuel); // 'nu' (Foncier nu)
  return ri * ((tmi + ps) / 100);
}

/** 30-year ETF reference scenario. */
export function computeEtfPur(g: Globals): EtfPurYear[] {
  const result: EtfPurYear[] = [];
  let cap = g.apportETF;
  let totalContribs = g.apportETF;
  const r = g.rendAlt / 100;
  for (let yr = 1; yr <= 30; yr++) {
    const surplus = surplusAt(g, yr);
    cap = cap * (1 + r) + surplus;
    totalContribs += surplus;
    const gain = Math.max(0, cap - totalContribs);
    const capNet = cap - gain * PFU_RATE;
    result.push({ yr, cap, capNet });
  }
  return result;
}

/** ETF KPIs (TRI/VAN/MOIC) at horizon g.horizon. */
export function computeEtfKpis(g: Globals): EtfKpis {
  const hz = g.horizon;
  const capHz = computeEtfPur(g)[hz - 1]?.cap ?? 0;
  const tri = g.rendAlt / 100;
  const triReal = (1 + tri) / (1 + g.inflation / 100) - 1;
  let van = -g.apportETF;
  let surplusTotal = 0;
  for (let t = 1; t <= hz; t++) {
    const s = surplusAt(g, t);
    van += -s / Math.pow(1 + g.tauxActu / 100, t);
    surplusTotal += s;
  }
  van += capHz / Math.pow(1 + g.tauxActu / 100, hz);
  const moic = g.apportETF > 0 ? (capHz - surplusTotal) / g.apportETF : null;
  return { tri, triReal, van, moic, surplusTotal };
}

/** Monthly amortization schedule (constant annuity). amort[m-1] = month m. */
export function buildAmortization(
  emp: number,
  tM: number,
  nM: number,
  mens: number,
  assM: number
): AmortMonth[] {
  const amort: AmortMonth[] = [];
  let cap = emp;
  for (let m = 1; m <= Math.max(nM, 12); m++) {
    const inter = cap * tM;
    const capM = Math.max(0, mens - inter);
    cap = Math.max(0, cap - capM);
    amort.push({ inter, cap: capM, assur: assM, rest: cap });
  }
  return amort;
}

/** Resale at year yr: resale price (works included), fees, taxed capital gain, net proceeds. */
export function computeResale(p: SimParams, rest: number, yr: number): ResaleResult {
  const pr = revalorise(p.prixAchat + p.travaux, p.revalBien, yr);
  const fa = pr * (p.fraisVente / 100);
  const pvB = Math.max(0, pr - p.prixAchat - p.travaux);
  let iPV = 0;
  if (p.mode === 'loc') {
    const abIR = Math.min(100, abattementIR(yr));
    const abPS = Math.min(100, abattementPS(yr));
    iPV = (pvB * (p.impotPV * (1 - abIR / 100) + p.psPV * (1 - abPS / 100))) / 100;
  }
  return { pr, fa, reventeNet: pr - rest - fa - iPV };
}

type ResaleFlux = Pick<FluxYear, 'reventeNet'>;

/** TRI at a horizon. flux 0-based; irrFlows[0] = −apport. */
export function calcTRI(flux: ResaleFlux[], irrFlows: number[], horizon: number): number | null {
  if (horizon > 30 || horizon < 1) return null;
  const flows = [...irrFlows.slice(0, horizon + 1)];
  flows[horizon] += flux[horizon - 1].reventeNet;
  return irr(flows);
}

/** NPV at a horizon. Same flows as calcTRI. */
export function calcVAN(
  flux: ResaleFlux[],
  irrFlows: number[],
  g: Globals,
  horizon: number
): number | null {
  if (horizon > 30 || horizon < 1) return null;
  const r = g.tauxActu / 100;
  let van = irrFlows[0]; // −apport
  for (let t = 1; t <= horizon && t <= 30; t++) {
    let cf = irrFlows[t]; // mêmes flux que le TRI : loyerPersoAnn réintégré
    if (t === horizon) cf += flux[t - 1].reventeNet;
    van += cf / Math.pow(1 + r, t);
  }
  return van;
}

/** MOIC at a horizon. Same flows as calcTRI. */
export function calcMoic(
  flux: ResaleFlux[],
  irrFlows: number[],
  horizon: number,
  apport: number
): number {
  const last = flux[horizon - 1];
  if (!last) return 0;
  return (last.reventeNet + irrFlows.slice(1, horizon + 1).reduce((a, b) => a + b, 0)) / apport;
}

/**
 * Core financial engine. Pure: given a simulation's params and globals, returns
 * monthly payments, the 30-year flux array, IRR at 10/15/20y, NPV, MOIC, resale.
 */
export function compute(p: SimParams, g: Globals): ComputeResult {
  const ct = p.prixAchat + p.fraisNotaire + p.travaux + p.fraisAgence + (p.fraisDossier ?? 0);
  const emp = Math.max(0, ct - p.apport);
  const apportInvesti = Math.min(p.apport, ct);
  const etfSeed = g.investirSurplus ? Math.max(0, p.apport - ct) : 0;
  const apportTotal = apportInvesti + etfSeed;
  const tM = p.taux / 100 / 12,
    nM = p.duree * 12;
  const mens =
    emp > 0 && tM > 0 ? (emp * tM) / (1 - Math.pow(1 + tM, -nM)) : emp > 0 ? emp / nM : 0;
  const assM = (emp * (p.assurance / 100)) / 12;

  const amort = buildAmortization(emp, tM, nM, mens, assM);

  const ab = p.prixAchat * (p.amortBien / 100),
    at = p.travaux * (p.amortTravaux / 100);
  const flux: FluxYear[] = [];
  let cfC = 0;
  let irrCfC = 0; // cumul des flux ajustés (cfN + loyerPersoAnn) — base TRI/VAN/MOIC
  const irrFlows: number[] = [-apportInvesti];
  const rAlt = g.rendAlt / 100;
  let etfCap = etfSeed; // reliquat d'apport investi en ETF dès l'année 0 (compose comme apportETF)
  let amortReport = 0; // report d'amortissement LMNP non utilisé (années déficitaires)

  for (let yr = 1; yr <= 30; yr++) {
    const mi = Math.min(yr * 12, amort.length) - 1;
    const rest = amort[mi]?.rest ?? 0;
    const ann = yr <= p.duree ? mens * 12 : 0;
    const asp = yr <= p.duree ? assM * 12 : 0;
    const vb = revalorise(p.prixAchat, p.revalBien, yr);
    const loyerPersoAnn = revalorise(g.loyerPerso * 12, g.revalLoyerPerso, yr - 1);

    let cfN: number,
      le = 0,
      chg = 0,
      imp = 0;

    if (p.mode === 'loc') {
      const lb = revalorise(p.loyer * 12, p.revalLoyer, yr - 1);
      le = lb * (1 - p.vacance / 100);
      const fC = revalorise(1, g.revalCharges ?? 2, yr - 1);
      chg =
        (p.taxeFonciere + p.chargesCopro + p.assurPNO + p.provision) * fC +
        lb * (p.fraisGestion / 100);
      const intAnnuel = amort.slice((yr - 1) * 12, yr * 12).reduce((s, m) => s + m.inter, 0);
      if (g.regime === 'lmnp') {
        // LMNP réel : intérêts + amortissements déductibles ; déficit reporté aux années suivantes
        const riRaw = le - chg - ab - at - intAnnuel - amortReport;
        const ri = Math.max(0, riRaw);
        amortReport = riRaw < 0 ? -riRaw : 0;
        imp = ri * ((p.tmi + p.ps) / 100);
      } else {
        imp = impLoc(le, chg, ab, at, p.tmi, p.ps, g.regime, intAnnuel);
      }
      cfN = le - chg - ann - asp - imp - loyerPersoAnn;
    } else {
      const fCrp = revalorise(1, g.revalCharges ?? 2, yr - 1);
      chg = (p.taxeFonciereRP + p.chargesCoproRP + p.assurHab + p.provisionRP) * fCrp;
      cfN = -(chg + ann + asp);
      le = loyerPersoAnn;
    }
    cfC += cfN;

    const realOutAnn = p.mode === 'loc' ? -cfN : chg + ann + asp;
    const budgetAnn = revalorise(g.budgetMensuel * 12, g.revalBudget, yr - 1);
    const surplusAnn = Math.max(0, budgetAnn - realOutAnn);
    etfCap = etfCap * (1 + rAlt) + (g.investirSurplus ? surplusAnn : 0);

    const { pr, reventeNet } = computeResale(p, rest, yr);
    irrCfC += cfN + loyerPersoAnn;
    const bilanRevente = reventeNet + cfC - apportInvesti;
    const bilanTotal = reventeNet + etfCap - apportTotal;
    const bilanCash = reventeNet + irrCfC - apportInvesti;
    const patTotal = vb - rest + etfCap;

    flux.push({
      yr,
      le,
      chg,
      ann: ann + asp,
      imp,
      cfN,
      cfC,
      coc: apportInvesti > 0 ? (cfN / apportInvesti) * 100 : null,
      vb,
      rest,
      patNet: vb - rest + cfC - apportInvesti,
      patTotal,
      etfPoche: etfCap,
      reventeNet,
      bilanRevente,
      bilanTotal,
      bilanCash,
      pr,
    });

    irrFlows.push(cfN + loyerPersoAnn);
  }

  const totInt = amort.reduce((s, m) => s + m.inter, 0);
  const totAss = amort.reduce((s, m) => s + m.assur, 0);
  const rendBrut = p.mode === 'loc' ? ((p.loyer * 12) / ct) * 100 : 0;
  let rendNet = 0;
  if (p.mode === 'loc') {
    const lnA =
      p.loyer * (1 - p.vacance / 100) * 12 -
      (p.taxeFonciere +
        p.chargesCopro +
        p.assurPNO +
        p.provision +
        p.loyer * 12 * (p.fraisGestion / 100));
    rendNet = (lnA / ct) * 100;
  }
  const cfM = p.mode === 'loc' ? p.loyer - mens - assM - g.loyerPerso : g.loyerPerso - mens - assM;
  const be = flux.findIndex(f => f.cfC >= 0);
  const beRevente = flux.findIndex(f => f.bilanCash >= 0);

  return {
    ct,
    emp,
    mens,
    assM,
    totInt,
    totAss,
    rendBrut,
    rendNet,
    cfM,
    be: be >= 0 ? be + 1 : null,
    beRevente: beRevente >= 0 ? beRevente + 1 : null,
    flux,
    amort,
    tri10: calcTRI(flux, irrFlows, 10),
    tri15: calcTRI(flux, irrFlows, 15),
    tri20: calcTRI(flux, irrFlows, 20),
    van: calcVAN(flux, irrFlows, g, g.horizon),
    moic: calcMoic(flux, irrFlows, g.horizon, apportInvesti),
    revente: flux.map(f => ({ yr: f.yr, pr: f.pr, rest: f.rest, bilanRevente: f.bilanRevente })),
  };
}

/** First year where immo patTotal ≥ ETF reference cap. Null if surplus not invested. */
export function crossoverYear(
  res: { flux: { patTotal: number }[] },
  etfPurGlobal: { cap: number }[],
  g: Globals
): number | null {
  if (!etfPurGlobal.length || !g.investirSurplus) return null;
  for (let i = 0; i < 30; i++) {
    const immo = res.flux[i]?.patTotal;
    const etf = etfPurGlobal[i]?.cap;
    if (immo != null && etf != null && immo >= etf) return i + 1;
  }
  return null;
}
