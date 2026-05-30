export const COL = { A: '#6C9AFF', B: '#FF9D5C', C: '#5CEFB0' };
export const KEYS = ['A', 'B', 'C'];

export const DEFAULT_G = {
  inflation: 2, regime: 'lmnp', horizon: 20, tauxActu: 3, rendAlt: 6,
  loyerPerso: 900, revalLoyerPerso: 2, budgetMensuel: 2500,
  investirSurplus: true, apportETF: 60000,
};

export const AUTOABLE_FIELDS = new Set(['fraisNotaire', 'taux', 'provision', 'provisionRP', 'taxeFonciere', 'taxeFonciereRP']);

export const TAUX_CURVE_UPDATED_AT = '2026-05';
const _TAUX_CURVE = [
  { y: 7, r: 3.25 }, { y: 10, r: 3.30 }, { y: 15, r: 3.45 }, { y: 20, r: 3.55 }, { y: 25, r: 3.70 }, { y: 30, r: 3.85 },
];
if (typeof window !== 'undefined') {
  const [cy, cm] = TAUX_CURVE_UPDATED_AT.split('-').map(Number);
  const now = new Date();
  if ((now.getFullYear() - cy) * 12 + now.getMonth() + 1 - cm > 12)
    console.warn(`[ImmoRenta] Rate curve last updated ${TAUX_CURVE_UPDATED_AT} — consider refreshing _TAUX_CURVE in definitions.js`);
}

function interpTaux(duree) {
  if (duree <= _TAUX_CURVE[0].y) return _TAUX_CURVE[0].r;
  const last = _TAUX_CURVE[_TAUX_CURVE.length - 1];
  if (duree >= last.y) return last.r;
  for (let i = 0; i < _TAUX_CURVE.length - 1; i++) {
    const a = _TAUX_CURVE[i], b = _TAUX_CURVE[i + 1];
    if (duree >= a.y && duree <= b.y) return a.r + (duree - a.y) / (b.y - a.y) * (b.r - a.r);
  }
  return 3.85;
}

export function computeAutoValue(p, fieldKey) {
  const base = p.prixAchat ?? 0;
  switch (fieldKey) {
    case 'fraisNotaire':   return base > 0 ? Math.round(base * 0.08) : 0;
    case 'taux':           return (p.duree ?? 0) > 0 ? +interpTaux(p.duree).toFixed(2) : 0;
    case 'provision':      return base > 0 ? Math.round(base * 0.005) : 0;
    case 'provisionRP':    return base > 0 ? Math.round(base * 0.005) : 0;
    case 'taxeFonciere':   return base > 0 ? Math.round(base * 0.005) : 0;
    case 'taxeFonciereRP': return base > 0 ? Math.round(base * 0.005) : 0;
    default:               return p[fieldKey] ?? 0;
  }
}

export function resolveAutoFields(p) {
  const af = p.autoFields ?? [];
  if (!af.length) return p;
  const overrides = {};
  af.forEach(k => { overrides[k] = computeAutoValue(p, k); });
  return { ...p, ...overrides };
}

export function mkDef(mode) {
  return {
    mode,
    enabled: true,
    collapsed: false,
    label: mode === 'loc' ? 'Locatif' : 'Résidence principale',
    prixAchat: 250000, fraisNotaire: 20000, travaux: 15000, fraisAgence: 0, apport: 50000,
    taux: 3.85, duree: 20, assurance: 0.25,
    revalBien: 2.0, fraisVente: 4,
    loyer: 1000, vacance: 5, taxeFonciere: 1200, chargesCopro: 800, assurPNO: 200,
    fraisGestion: 7, provision: 500, revalLoyer: 1.5,
    tmi: 30, ps: 17.2, amortBien: 2.5, amortTravaux: 10,
    impotPV: 19, psPV: 17.2,
    taxeFonciereRP: 1200, chargesCoproRP: 1200, assurHab: 300, provisionRP: 500,
    autoFields: mode === 'loc'
      ? ['fraisNotaire', 'taux', 'provision', 'taxeFonciere']
      : ['fraisNotaire', 'taux', 'provisionRP', 'taxeFonciereRP'],
  };
}

export const DEFAULT_SIMS = {
  A: { ...mkDef('loc'), label: 'Locatif — Centre-ville', prixAchat: 280000, fraisNotaire: 22000, loyer: 1050, apport: 60000 },
  B: { ...mkDef('rp'),  label: 'RP — Achat appart',      prixAchat: 320000, fraisNotaire: 25000, apport: 70000 },
  C: { ...mkDef('loc'), label: 'Locatif — Périphérie',   prixAchat: 180000, fraisNotaire: 14000, loyer: 750,  apport: 35000, taux: 3.5, duree: 15 },
};

export const GRP_COMMON = [
  { t: 'Acquisition', f: [
    { k: 'prixAchat',    tp: 'e', mn: 10000,   mx: 2000000, st: 1000 },
    { k: 'fraisNotaire', tp: 'e', mn: 0,        mx: 100000,  st: 500  },
    { k: 'travaux',      tp: 'e', mn: 0,        mx: 400000,  st: 1000 },
    { k: 'fraisAgence',  tp: 'e', mn: 0,        mx: 40000,   st: 500  },
    { k: 'apport',       tp: 'e', mn: 0,        mx: 500000,  st: 1000 },
  ]},
  { t: 'Financement', f: [
    { k: 'taux',      tp: '%', mn: 0.5, mx: 10,  st: 0.05 },
    { k: 'duree',     tp: 'n', mn: 5,   mx: 30,  st: 1    },
    { k: 'assurance', tp: '%', mn: 0,   mx: 1,   st: 0.01 },
  ]},
  { t: 'Revente', f: [
    { k: 'revalBien',  tp: '%', mn: -2, mx: 10, st: 0.1 },
    { k: 'fraisVente', tp: '%', mn: 0,  mx: 10, st: 0.5 },
  ]},
];

export const GRP_LOC = [
  { t: 'Exploitation', f: [
    { k: 'loyer',         tp: 'e', mn: 100, mx: 8000,  st: 50  },
    { k: 'vacance',       tp: '%', mn: 0,   mx: 30,    st: 0.5 },
    { k: 'taxeFonciere',  tp: 'e', mn: 0,   mx: 10000, st: 100 },
    { k: 'chargesCopro',  tp: 'e', mn: 0,   mx: 8000,  st: 100 },
    { k: 'assurPNO',      tp: 'e', mn: 0,   mx: 2000,  st: 50  },
    { k: 'fraisGestion',  tp: '%', mn: 0,   mx: 15,    st: 0.5 },
    { k: 'provision',     tp: 'e', mn: 0,   mx: 5000,  st: 100 },
    { k: 'revalLoyer',    tp: '%', mn: 0,   mx: 5,     st: 0.1 },
  ]},
  { t: 'Fiscalité', f: [
    { k: 'tmi',          tp: '%', mn: 0,  mx: 45, st: 1   },
    { k: 'ps',           tp: '%', mn: 0,  mx: 20, st: 0.1 },
    { k: 'amortBien',    tp: '%', mn: 0,  mx: 5,  st: 0.1 },
    { k: 'amortTravaux', tp: '%', mn: 0,  mx: 25, st: 1   },
    { k: 'impotPV',      tp: '%', mn: 0,  mx: 50, st: 1   },
    { k: 'psPV',         tp: '%', mn: 0,  mx: 20, st: 0.1 },
  ]},
];

export const GRP_RP = [
  { t: 'Résidence principale', f: [
    { k: 'taxeFonciereRP', tp: 'e', mn: 0, mx: 10000, st: 100 },
    { k: 'chargesCoproRP', tp: 'e', mn: 0, mx: 8000,  st: 100 },
    { k: 'assurHab',       tp: 'e', mn: 0, mx: 2000,  st: 50  },
    { k: 'provisionRP',    tp: 'e', mn: 0, mx: 5000,  st: 100 },
  ]},
];

export function getGroups(mode) {
  return [...GRP_COMMON, ...(mode === 'loc' ? GRP_LOC : GRP_RP)];
}

export function getAllFields() {
  return [...GRP_COMMON, ...GRP_LOC, ...GRP_RP].flatMap(g => g.f);
}
