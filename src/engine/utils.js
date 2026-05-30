export const fmtE = v =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(v || 0);
export const fmtK = v => {
  if (v == null || !isFinite(v)) return '—';
  const a = Math.abs(v);
  return a >= 1e6
    ? (v / 1e6).toFixed(2) + 'M€'
    : a >= 1e3
      ? (v / 1e3).toFixed(0) + 'k€'
      : Math.round(v) + '€';
};
export const fmtP = v => (!isFinite(v) || isNaN(v) ? '—' : v.toFixed(2) + '%');
export const fmtTRI = v => (v === null ? 'N/C' : (v * 100).toFixed(2) + '%');
