export const COL = { A: '#6C9AFF', B: '#FF9D5C', C: '#5CEFB0' };
export const KEYS = ['A', 'B', 'C'];

export const DEFAULT_G = {
  inflation: 2,
  regime: 'lmnp',
  horizon: 20,
  discountRate: 3,
  altReturn: 6,
  personalRent: 900,
  personalRentGrowth: 2,
  monthlyBudget: 2500,
  budgetGrowth: 0,
  chargesGrowth: 2,
  investSurplus: true,
  etfDownPayment: 60000,
  displayReal: false,
};

export const AUTOABLE_FIELDS = new Set([
  'notaryFees',
  'interestRate',
  'maintenanceReserve',
  'maintenanceReservePrimary',
  'propertyTax',
  'propertyTaxPrimary',
]);

export const RATE_CURVE_UPDATED_AT = '2026-05';
const _RATE_CURVE = [
  { y: 7, r: 3.25 },
  { y: 10, r: 3.3 },
  { y: 15, r: 3.45 },
  { y: 20, r: 3.55 },
  { y: 25, r: 3.7 },
  { y: 30, r: 3.85 },
];
if (typeof window !== 'undefined') {
  const [cy, cm] = RATE_CURVE_UPDATED_AT.split('-').map(Number);
  const now = new Date();
  if ((now.getFullYear() - cy) * 12 + now.getMonth() + 1 - cm > 12)
    console.warn(
      `[ImmoRenta] Rate curve last updated ${RATE_CURVE_UPDATED_AT} — consider refreshing _RATE_CURVE in definitions.js`
    );
}

function interpRate(loanTerm) {
  if (loanTerm <= _RATE_CURVE[0].y) return _RATE_CURVE[0].r;
  const last = _RATE_CURVE[_RATE_CURVE.length - 1];
  if (loanTerm >= last.y) return last.r;
  for (let i = 0; i < _RATE_CURVE.length - 1; i++) {
    const a = _RATE_CURVE[i],
      b = _RATE_CURVE[i + 1];
    if (loanTerm >= a.y && loanTerm <= b.y)
      return a.r + ((loanTerm - a.y) / (b.y - a.y)) * (b.r - a.r);
  }
  return 3.85;
}

export function computeAutoValue(p, fieldKey) {
  const base = p.purchasePrice ?? 0;
  switch (fieldKey) {
    case 'notaryFees':
      return base > 0 ? Math.round(base * 0.08) : 0;
    case 'interestRate':
      return (p.loanTerm ?? 0) > 0 ? +interpRate(p.loanTerm).toFixed(2) : 0;
    case 'maintenanceReserve':
      return base > 0 ? Math.round(base * 0.005) : 0;
    case 'maintenanceReservePrimary':
      return base > 0 ? Math.round(base * 0.005) : 0;
    case 'propertyTax':
      return base > 0 ? Math.round(base * 0.005) : 0;
    case 'propertyTaxPrimary':
      return base > 0 ? Math.round(base * 0.005) : 0;
    default:
      return p[fieldKey] ?? 0;
  }
}

export function resolveAutoFields(p) {
  const af = p.autoFields ?? [];
  if (!af.length) return p;
  const overrides = {};
  af.forEach(k => {
    overrides[k] = computeAutoValue(p, k);
  });
  return { ...p, ...overrides };
}

export function mkDef(mode) {
  return {
    mode,
    enabled: true,
    collapsed: false,
    label: mode === 'rental' ? 'Rental' : mode === 'viager' ? 'Viager' : 'Primary residence',
    purchasePrice: 250000,
    notaryFees: 20000,
    renovationCosts: 15000,
    agencyFees: 0,
    loanFees: 0,
    downPayment: 50000,
    interestRate: 3.85,
    loanTerm: 20,
    insuranceRate: 0.25,
    propertyGrowth: 2.0,
    sellingFees: 4,
    rent: 1000,
    vacancyRate: 5,
    propertyTax: 1200,
    condoFees: 800,
    landlordInsurance: 200,
    managementFees: 7,
    maintenanceReserve: 500,
    rentGrowth: 1.5,
    marginalTaxRate: 30,
    socialCharges: 17.2,
    propertyDepreciation: 2.5,
    renovationDepreciation: 10,
    capitalGainsTax: 19,
    capitalGainsSocialCharges: 17.2,
    propertyTaxPrimary: 1200,
    condoFeesPrimary: 1200,
    homeInsurance: 300,
    maintenanceReservePrimary: 500,
    // Viager (life annuity, occupied) fields — present on every sim (flat object),
    // read by compute() only when mode === 'viager'.
    marketValue: 250000,
    occupationDiscount: 35,
    bouquet: 50000,
    monthlyAnnuity: 800,
    annuityGrowth: 2,
    expectedDuration: 15,
    ownerCharges: 1500,
    ownerChargesGrowth: 2,
    autoFields:
      mode === 'rental'
        ? ['notaryFees', 'interestRate', 'maintenanceReserve', 'propertyTax']
        : mode === 'viager'
          ? [] // viager has no purchasePrice-derived auto fields (notaryFees auto would zero out)
          : ['notaryFees', 'interestRate', 'maintenanceReservePrimary', 'propertyTaxPrimary'],
  };
}

/**
 * Build the clipboard payload for a "copy simulation" action.
 * Carries the financial inputs (mode + all params) and a *cloned* autoFields
 * array, but drops identity/view state — label, enabled, collapsed — so a
 * subsequent paste keeps the target panel's name and visibility (see D1).
 * autoFields is cloned to avoid sharing the array reference between source and
 * target after a paste.
 */
export const simCopyPayload = p => {
  const { label, enabled, collapsed, ...rest } = p;
  return { ...rest, autoFields: [...(rest.autoFields ?? [])] };
};

export const DEFAULT_SIMS = {
  A: {
    ...mkDef('rental'),
    label: 'Rental — City center',
    purchasePrice: 280000,
    notaryFees: 22000,
    rent: 1050,
    downPayment: 60000,
  },
  B: {
    ...mkDef('primary'),
    label: 'Primary — Apartment purchase',
    purchasePrice: 320000,
    notaryFees: 25000,
    downPayment: 70000,
  },
  C: {
    ...mkDef('rental'),
    label: 'Rental — Suburbs',
    purchasePrice: 180000,
    notaryFees: 14000,
    rent: 750,
    downPayment: 35000,
    interestRate: 3.5,
    loanTerm: 15,
  },
};

export const GRP_COMMON = [
  {
    t: 'Acquisition',
    f: [
      { k: 'purchasePrice', tp: 'e', mn: 10000, mx: 2000000, st: 1000 },
      { k: 'notaryFees', tp: 'e', mn: 0, mx: 100000, st: 500 },
      { k: 'renovationCosts', tp: 'e', mn: 0, mx: 400000, st: 1000 },
      { k: 'agencyFees', tp: 'e', mn: 0, mx: 40000, st: 500 },
      { k: 'loanFees', tp: 'e', mn: 0, mx: 10000, st: 100 },
      { k: 'downPayment', tp: 'e', mn: 0, mx: 500000, st: 1000 },
    ],
  },
  {
    t: 'Financing',
    f: [
      { k: 'interestRate', tp: '%', mn: 0.5, mx: 10, st: 0.05 },
      { k: 'loanTerm', tp: 'n', mn: 5, mx: 30, st: 1 },
      { k: 'insuranceRate', tp: '%', mn: 0, mx: 1, st: 0.01 },
    ],
  },
  {
    t: 'Sale',
    f: [
      { k: 'propertyGrowth', tp: '%', mn: -2, mx: 10, st: 0.1 },
      { k: 'sellingFees', tp: '%', mn: 0, mx: 10, st: 0.5 },
    ],
  },
];

export const GRP_RENTAL = [
  {
    t: 'Income',
    f: [
      { k: 'rent', tp: 'e', mn: 100, mx: 8000, st: 50 },
      { k: 'vacancyRate', tp: '%', mn: 0, mx: 30, st: 0.5 },
      { k: 'rentGrowth', tp: '%', mn: 0, mx: 5, st: 0.1 },
    ],
  },
  {
    t: 'Charges',
    f: [
      { k: 'propertyTax', tp: 'e', mn: 0, mx: 10000, st: 100 },
      { k: 'condoFees', tp: 'e', mn: 0, mx: 8000, st: 100 },
      { k: 'landlordInsurance', tp: 'e', mn: 0, mx: 2000, st: 50 },
      { k: 'managementFees', tp: '%', mn: 0, mx: 15, st: 0.5 },
      { k: 'maintenanceReserve', tp: 'e', mn: 0, mx: 5000, st: 100 },
    ],
  },
  {
    t: 'Taxation',
    f: [
      { k: 'marginalTaxRate', tp: '%', mn: 0, mx: 45, st: 1 },
      { k: 'socialCharges', tp: '%', mn: 0, mx: 20, st: 0.1 },
      { k: 'propertyDepreciation', tp: '%', mn: 0, mx: 5, st: 0.1 },
      { k: 'renovationDepreciation', tp: '%', mn: 0, mx: 25, st: 1 },
      { k: 'capitalGainsTax', tp: '%', mn: 0, mx: 50, st: 1 },
      { k: 'capitalGainsSocialCharges', tp: '%', mn: 0, mx: 20, st: 0.1 },
    ],
  },
];

export const GRP_PRIMARY = [
  {
    t: 'Primary residence',
    f: [
      { k: 'propertyTaxPrimary', tp: 'e', mn: 0, mx: 10000, st: 100 },
      { k: 'condoFeesPrimary', tp: 'e', mn: 0, mx: 8000, st: 100 },
      { k: 'homeInsurance', tp: 'e', mn: 0, mx: 2000, st: 50 },
      { k: 'maintenanceReservePrimary', tp: 'e', mn: 0, mx: 5000, st: 100 },
    ],
  },
];

// Viager occupied: the bouquet replaces purchasePrice and the rente is the deferred
// price, so the standard Acquisition group (purchasePrice/renovation/agency) does not
// apply. These groups carry only the viager-specific fields; getGroups() composes them
// with a viager Acquisition (notary + down payment toward the bouquet) plus the shared
// Financing (optional bouquet loan) and Sale groups.
export const GRP_VIAGER = [
  {
    t: 'Viager property',
    f: [
      { k: 'marketValue', tp: 'e', mn: 10000, mx: 2000000, st: 1000 },
      { k: 'occupationDiscount', tp: '%', mn: 0, mx: 99, st: 1 },
    ],
  },
  {
    t: 'Annuity',
    f: [
      { k: 'bouquet', tp: 'e', mn: 0, mx: 1000000, st: 1000 },
      { k: 'monthlyAnnuity', tp: 'e', mn: 0, mx: 8000, st: 50 },
      { k: 'annuityGrowth', tp: '%', mn: 0, mx: 5, st: 0.1 },
      { k: 'expectedDuration', tp: 'n', mn: 1, mx: 30, st: 1 },
    ],
  },
  {
    t: 'Viager charges',
    f: [
      { k: 'ownerCharges', tp: 'e', mn: 0, mx: 10000, st: 100 },
      { k: 'ownerChargesGrowth', tp: '%', mn: 0, mx: 5, st: 0.1 },
    ],
  },
];

const GRP_VIAGER_ACQUISITION = {
  t: 'Acquisition',
  f: [
    { k: 'notaryFees', tp: 'e', mn: 0, mx: 100000, st: 500 },
    { k: 'downPayment', tp: 'e', mn: 0, mx: 1000000, st: 1000 },
  ],
};

export function getGroups(mode) {
  if (mode === 'viager') {
    const financing = GRP_COMMON.find(g => g.t === 'Financing');
    const sale = GRP_COMMON.find(g => g.t === 'Sale');
    return [GRP_VIAGER_ACQUISITION, ...GRP_VIAGER, financing, sale];
  }
  return [...GRP_COMMON, ...(mode === 'rental' ? GRP_RENTAL : GRP_PRIMARY)];
}

export function getAllFields() {
  return [...GRP_COMMON, ...GRP_RENTAL, ...GRP_PRIMARY, ...GRP_VIAGER].flatMap(g => g.f);
}
