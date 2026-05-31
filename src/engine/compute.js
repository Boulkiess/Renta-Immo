// Pure financial engine — all functions receive global settings (g) as parameter

// ── Constantes fiscales ───────────────────────────────────────
const PFU_RATE = 0.3; // flat tax (PFU) sur la plus-value ETF (CTO)
const MICROBIC_ABATTEMENT = 0.5; // abattement forfaitaire Micro-BIC (meublé non classé)
// Abattements progressifs sur la plus-value immobilière (art. 150 VC CGI)
const ABAT_IR_PER_YEAR = 6; // %/an, années 6→21 (96 % cumulés à la 21e)
const ABAT_PS_PER_YEAR = 1.65; // %/an, années 6→21
const ABAT_PS_AT_22 = (21 - 5) * ABAT_PS_PER_YEAR + 1.6; // 28,0 % cumulés à la 22e (bonus PS 1,6)
const ABAT_PS_LATE_PER_YEAR = 9; // %/an, années 23→30
const ABAT_FULL = 100; // exonération totale

// Revalorisation composée : base × (1 + taux%)^périodes
const revalorise = (base, ratePct, periods) => base * Math.pow(1 + ratePct / 100, periods);

// Surplus annuel du scénario de RÉFÉRENCE ETF : budget revalorisé − loyer perso revalorisé.
// ⚠️ Ne PAS confondre avec le surplus in-loop de compute() (budget − sorties réelles du bien) :
// ce sont deux grandeurs distinctes. surplusAt() unifie uniquement computeEtfPur + computeEtfKpis.
export const surplusAt = (g, yr) =>
  Math.max(
    0,
    revalorise(g.budgetMensuel * 12, g.revalBudget, yr - 1) -
      revalorise(g.loyerPerso * 12, g.revalLoyerPerso, yr - 1)
  );

export function irr(flows, guess = 0.1, maxIter = 100, tol = 1e-7) {
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

export function abattementIR(yr) {
  if (yr <= 5) return 0;
  if (yr <= 21) return (yr - 5) * ABAT_IR_PER_YEAR; // 6 %/an de la 6e à la 21e → 96 %
  return ABAT_FULL; // 4 % à la 22e = exonération totale
}

export function abattementPS(yr) {
  if (yr <= 5) return 0;
  if (yr <= 21) return (yr - 5) * ABAT_PS_PER_YEAR; // 1,65 %/an de la 6e à la 21e
  if (yr === 22) return ABAT_PS_AT_22; // 28,0 %
  if (yr <= 30) return ABAT_PS_AT_22 + (yr - 22) * ABAT_PS_LATE_PER_YEAR; // 9 %/an, 23e→30e
  return ABAT_FULL;
}

export function impLoc(le, chg, ab, at, tmi, ps, regime, intAnnuel = 0) {
  let ri;
  if (regime === 'lmnp') ri = Math.max(0, le - chg - ab - at - intAnnuel);
  else if (regime === 'microbic') ri = Math.max(0, le * MICROBIC_ABATTEMENT);
  else ri = Math.max(0, le - chg - intAnnuel); // 'nu' (Foncier nu)
  return ri * ((tmi + ps) / 100);
}

export function computeEtfPur(g) {
  const result = [];
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

// KPIs ETF (TRI/VAN/MOIC) à l'horizon g.horizon — déplacés depuis KpisTab.jsx pour
// passer sous le filet golden-master. Voir CLAUDE.md § « Colonne ETF pur — KpisTab ».
//   TRI_ETF      = rendAlt (exact : les flux ETF s'annulent en VPN au taux rendAlt)
//   TRI_real_ETF = (1 + rendAlt) / (1 + inflation) − 1
//   VAN_ETF      = −apportETF + Σ (−surplusAt) / (1+tauxActu)^t + cap[hz] / (1+tauxActu)^hz
//   MOIC_ETF     = (cap[hz] − Σ surplusAt) / apportETF   (null si apportETF = 0)
export function computeEtfKpis(g) {
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

// ── Îlots purs extraits de compute() (testés transitivement via golden-master) ──

// Tableau d'amortissement mensuel (annuité constante). amort[m-1] = mois m.
// Boucle ≥ 12 mois pour garantir au moins une année même sur prêt très court.
export function buildAmortization(emp, tM, nM, mens, assM) {
  const amort = [];
  let cap = emp;
  for (let m = 1; m <= Math.max(nM, 12); m++) {
    const inter = cap * tM;
    const capM = Math.max(0, mens - inter);
    cap = Math.max(0, cap - capM);
    amort.push({ inter, cap: capM, assur: assM, rest: cap });
  }
  return amort;
}

// Revente à l'année yr : prix de revente (travaux inclus), frais, plus-value
// imposée puis produit net. iPV avec abattements progressifs en mode 'loc' ; RP exonérée.
export function computeResale(p, rest, yr) {
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

// TRI / VAN / MOIC à un horizon. Purs. flux 0-based ; irrFlows[0] = −apport.
export function calcTRI(flux, irrFlows, horizon) {
  if (horizon > 30 || horizon < 1) return null;
  const flows = [...irrFlows.slice(0, horizon + 1)];
  flows[horizon] += flux[horizon - 1].reventeNet;
  return irr(flows);
}

export function calcVAN(flux, irrFlows, g, horizon) {
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

export function calcMoic(flux, irrFlows, horizon, apport) {
  const last = flux[horizon - 1];
  if (!last) return 0;
  return (last.reventeNet + irrFlows.slice(1, horizon + 1).reduce((a, b) => a + b, 0)) / apport;
}

export function compute(p, g) {
  const ct = p.prixAchat + p.fraisNotaire + p.travaux + p.fraisAgence + (p.fraisDossier ?? 0);
  const emp = Math.max(0, ct - p.apport);
  // Capital réellement immobilisé dans le bien : plafonné au coût total. Un apport
  // qui dépasse `ct` (achat comptant sur-financé) laisse un reliquat de cash. Ce
  // reliquat ne fait pas partie du rendement du bien (TRI/VAN/MOIC, patNet, bilans
  // opérationnels restent calés sur apportInvesti).
  const apportInvesti = Math.min(p.apport, ct);
  // Reliquat d'apport au-delà du coût d'acquisition : investi en ETF si le toggle
  // surplus→ETF est actif (sinon conservé en cash, hors modèle). Il alimente la
  // poche ETF (patTotal / bilanTotal) ; la mise de départ totale devient alors
  // apportInvesti + etfSeed (= p.apport quand le reliquat est investi).
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
  const flux = [];
  let cfC = 0;
  let irrCfC = 0; // cumul des flux ajustés (cfN + loyerPersoAnn) — base TRI/VAN/MOIC
  const irrFlows = [-apportInvesti];
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

    let cfN,
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
    // bilanCash : bilan revente en cash sur la même base que TRI/VAN/MOIC — le
    // loyer perso (LOC : coût subi / RP : loyer économisé) est réintégré, ce qui
    // rend le passage à zéro interprétable comme « durée de détention pour ne pas perdre ».
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

    // Both modes add loyerPersoAnn to TRI/VAN flows:
    // LOC: removes personal rent from costs (sunk cost unrelated to the investment)
    // RP: adds saved rent as a benefit (you no longer pay it)
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

export function crossoverYear(res, etfPurGlobal, g) {
  if (!etfPurGlobal.length || !g.investirSurplus) return null;
  for (let i = 0; i < 30; i++) {
    const immo = res.flux[i]?.patTotal;
    const etf = etfPurGlobal[i]?.cap;
    if (immo != null && etf != null && immo >= etf) return i + 1;
  }
  return null;
}
