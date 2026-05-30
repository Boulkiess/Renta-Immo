// Pure financial engine — all functions receive global settings (g) as parameter

function irr(flows, guess = 0.1, maxIter = 100, tol = 1e-7) {
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

// Abattements progressifs sur la plus-value immobilière (art. 150 VC CGI)
function abattementIR(yr) {
  if (yr <= 5) return 0;
  if (yr <= 21) return (yr - 5) * 6; // 6 %/an de la 6e à la 21e → 96 %
  return 100; // 4 % à la 22e = exonération totale
}

function abattementPS(yr) {
  if (yr <= 5) return 0;
  if (yr <= 21) return (yr - 5) * 1.65; // 1,65 %/an de la 6e à la 21e
  if (yr === 22) return 16 * 1.65 + 1.6; // 28,0 %
  if (yr <= 30) return 16 * 1.65 + 1.6 + (yr - 22) * 9; // 9 %/an de la 23e à la 30e
  return 100;
}

function impLoc(le, chg, ab, at, tmi, ps, regime, intAnnuel = 0) {
  let ri;
  if (regime === 'lmnp') ri = Math.max(0, le - chg - ab - at - intAnnuel);
  else if (regime === 'microbic') ri = Math.max(0, le * 0.5);
  else ri = Math.max(0, le - chg - intAnnuel); // 'nu' (Foncier nu)
  return ri * ((tmi + ps) / 100);
}

export function computeEtfPur(g) {
  const result = [];
  let cap = g.apportETF;
  let totalContribs = g.apportETF;
  const r = g.rendAlt / 100;
  for (let yr = 1; yr <= 30; yr++) {
    const lpa = g.loyerPerso * 12 * Math.pow(1 + g.revalLoyerPerso / 100, yr - 1);
    const budgetAnn = g.budgetMensuel * 12 * Math.pow(1 + g.revalBudget / 100, yr - 1);
    const surplus = Math.max(0, budgetAnn - lpa);
    cap = cap * (1 + r) + surplus;
    totalContribs += surplus;
    const gain = Math.max(0, cap - totalContribs);
    const capNet = cap - gain * 0.3;
    result.push({ yr, cap, capNet });
  }
  return result;
}

export function compute(p, g) {
  const ct = p.prixAchat + p.fraisNotaire + p.travaux + p.fraisAgence + (p.fraisDossier ?? 0);
  const emp = Math.max(0, ct - p.apport);
  const tM = p.taux / 100 / 12,
    nM = p.duree * 12;
  const mens =
    emp > 0 && tM > 0 ? (emp * tM) / (1 - Math.pow(1 + tM, -nM)) : emp > 0 ? emp / nM : 0;
  const assM = (emp * (p.assurance / 100)) / 12;

  const amort = [];
  let cap = emp;
  for (let m = 1; m <= Math.max(nM, 12); m++) {
    const inter = cap * tM,
      capM = Math.max(0, mens - inter);
    cap = Math.max(0, cap - capM);
    amort.push({ inter, cap: capM, assur: assM, rest: cap });
  }

  const ab = p.prixAchat * (p.amortBien / 100),
    at = p.travaux * (p.amortTravaux / 100);
  const flux = [];
  let cfC = 0;
  const irrFlows = [-p.apport];
  const rAlt = g.rendAlt / 100;
  let etfCap = 0;
  let amortReport = 0; // report d'amortissement LMNP non utilisé (années déficitaires)

  for (let yr = 1; yr <= 30; yr++) {
    const mi = Math.min(yr * 12, amort.length) - 1;
    const rest = amort[mi]?.rest ?? 0;
    const ann = yr <= p.duree ? mens * 12 : 0;
    const asp = yr <= p.duree ? assM * 12 : 0;
    const vb = p.prixAchat * Math.pow(1 + p.revalBien / 100, yr);
    const loyerPersoAnn = g.loyerPerso * 12 * Math.pow(1 + g.revalLoyerPerso / 100, yr - 1);

    let cfN,
      le = 0,
      chg = 0,
      imp = 0;

    if (p.mode === 'loc') {
      const lb = p.loyer * 12 * Math.pow(1 + p.revalLoyer / 100, yr - 1);
      le = lb * (1 - p.vacance / 100);
      const fC = Math.pow(1 + (g.revalCharges ?? 2) / 100, yr - 1);
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
      const fCrp = Math.pow(1 + (g.revalCharges ?? 2) / 100, yr - 1);
      chg = (p.taxeFonciereRP + p.chargesCoproRP + p.assurHab + p.provisionRP) * fCrp;
      cfN = -(chg + ann + asp);
      le = loyerPersoAnn;
    }
    cfC += cfN;

    const realOutAnn = p.mode === 'loc' ? -cfN : chg + ann + asp;
    const budgetAnn = g.budgetMensuel * 12 * Math.pow(1 + g.revalBudget / 100, yr - 1);
    const surplusAnn = Math.max(0, budgetAnn - realOutAnn);
    etfCap = etfCap * (1 + rAlt) + (g.investirSurplus ? surplusAnn : 0);

    const pr = (p.prixAchat + p.travaux) * Math.pow(1 + p.revalBien / 100, yr);
    const fa = pr * (p.fraisVente / 100);
    const pvB = Math.max(0, pr - p.prixAchat - p.travaux);
    let iPV = 0;
    if (p.mode === 'loc') {
      const abIR = Math.min(100, abattementIR(yr));
      const abPS = Math.min(100, abattementPS(yr));
      iPV = (pvB * (p.impotPV * (1 - abIR / 100) + p.psPV * (1 - abPS / 100))) / 100;
    }
    const reventeNet = pr - rest - fa - iPV;
    const bilanRevente = reventeNet + cfC - p.apport;
    const bilanTotal = reventeNet + etfCap - p.apport;
    const patTotal = vb - rest + etfCap;

    flux.push({
      yr,
      le,
      chg,
      ann: ann + asp,
      imp,
      cfN,
      cfC,
      coc: p.apport > 0 ? (cfN / p.apport) * 100 : null,
      vb,
      rest,
      patNet: vb - rest + cfC - p.apport,
      patTotal,
      etfPoche: etfCap,
      reventeNet,
      bilanRevente,
      bilanTotal,
      pr,
    });

    // Both modes add loyerPersoAnn to TRI/VAN flows:
    // LOC: removes personal rent from costs (sunk cost unrelated to the investment)
    // RP: adds saved rent as a benefit (you no longer pay it)
    irrFlows.push(cfN + loyerPersoAnn);
  }

  function calcTRI(horizon) {
    if (horizon > 30 || horizon < 1) return null;
    const flows = [...irrFlows.slice(0, horizon + 1)];
    flows[horizon] += flux[horizon - 1].reventeNet;
    return irr(flows);
  }

  function calcVAN(horizon) {
    if (horizon > 30 || horizon < 1) return null;
    const r = g.tauxActu / 100;
    let van = irrFlows[0]; // -apport
    for (let t = 1; t <= horizon && t <= 30; t++) {
      let cf = irrFlows[t]; // same flows as TRI: loyerPersoAnn excluded in LOC mode
      if (t === horizon) cf += flux[t - 1].reventeNet;
      van += cf / Math.pow(1 + r, t);
    }
    return van;
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
    flux,
    amort,
    tri10: calcTRI(10),
    tri15: calcTRI(15),
    tri20: calcTRI(20),
    van: calcVAN(g.horizon),
    moic: flux[g.horizon - 1]
      ? (flux[g.horizon - 1].reventeNet +
          irrFlows.slice(1, g.horizon + 1).reduce((a, b) => a + b, 0)) /
        p.apport
      : 0,
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
