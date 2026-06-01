// Public API of the financial engine (Phase 1 of the package extraction —
// see CLAUDE.md / extraction plan). This barrel is the single import surface
// for the pure engine; consumers import from here, never from compute.js
// directly. Everything re-exported below is pure (no React, no DOM) and covered
// by the golden-master + ground-truth suites in __tests__/.
//
// `compute.js` is the only module behind this boundary: utils.js (formatters),
// charts.js (canvas rendering) and io.js (app-state serialization) are NOT part
// of the engine package — keep importing those from their own files.
export {
  // Orchestration
  compute,
  computeEtfPur,
  computeEtfKpis,
  crossoverYear,
  // Pure helpers (testable in isolation)
  irr,
  revalorise,
  surplusAt,
  abattementIR,
  abattementPS,
  impLoc,
  buildAmortization,
  computeResale,
  calcTRI,
  calcVAN,
  calcMoic,
} from './compute.js';
