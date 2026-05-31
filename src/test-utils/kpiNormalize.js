// Parse a formatted money/percent string back to a number for value assertions.
// fmtE/fmtP emit fr-FR output with a narrow no-break space (U+202F) thousands
// separator and a trailing € / %, which getByText(/123 456/) can't match
// reliably (D9#3). Mirrors KpisTab's parseNum so tests assert on real numbers
// regardless of ICU/locale formatting quirks across environments.
// Note: \s already matches U+202F and U+00A0, so one replace covers all spaces.
export function normalizeMoney(str) {
  if (str == null || str === '—') return null;
  return parseFloat(
    String(str)
      .replace(/\s/g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  );
}
