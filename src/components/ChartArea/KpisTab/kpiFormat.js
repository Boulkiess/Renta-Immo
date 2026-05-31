// Parse a formatted KPI string back to a number. fmtE/fmtP emit fr-FR output
// with a narrow no-break space (U+202F) thousands separator and a trailing € / %.
// \s already matches U+202F and U+00A0, so one replace strips all spaces.
// Used to compare columns and highlight the "best" value per row.
export const parseNum = str => {
  if (str == null || str === '—') return null;
  return parseFloat(
    String(str)
      .replace(/\s/g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  );
};

/**
 * Index of the "best" column for a row, or null when there's no contest.
 * Matches the original behavior: only highlights when 2+ valid values exist.
 * @param {Array<number|null>} nums  parsed numeric values, aligned with columns
 * @param {'min'|'max'|undefined} better  optimisation direction
 * @param {number} colCount  number of active simulation columns
 */
export const findBestIdx = (nums, better, colCount) => {
  if (!better || colCount <= 1) return null;
  const valid = nums.map((n, i) => (n != null && isFinite(n) ? { n, i } : null)).filter(Boolean);
  if (valid.length <= 1) return null;
  const target =
    better === 'max' ? Math.max(...valid.map(v => v.n)) : Math.min(...valid.map(v => v.n));
  const best = valid.find(v => Math.abs(v.n - target) < 0.01);
  return best ? best.i : null;
};
