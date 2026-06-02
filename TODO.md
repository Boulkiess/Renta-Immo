# TODO — deferred refactoring

Items identified during the clean-code audit (cf. refactoring plan) but out of scope
for the "tests + targeted DRY" batch. To be handled in dedicated PRs, once the test
net is in place.

## Splitting the god-functions / god-components

- [x] **`compute()`** → pure islands exported (`buildAmortization`, `computeResale`, `calcTRI/VAN/calcMoic`) + a thin 30-year orchestrating loop; `annualSurplus`/`computeEtfKpis` extracted.
- [x] **`KpisTab.jsx`** → `KpisTab/` folder (sub-components + `kpiSections.js`); ETF math (IRR/NPV/MOIC) moved to `engine/compute.js` (`computeEtfKpis`).
- [x] **`SimPanel.jsx` / `GlobalStrip.jsx` / `FieldGroup.jsx`** → styled-components externalized (`*.styles.js`) + SimPanel split into branches (Disabled/Collapsed/Full + HeaderKpis).

## Rendering & I/O

- [ ] **`charts.js`** → extract canvas setup / theme colors / grid / x-labels (duplicated 3×).
- [ ] **`io.js`** → harden the home-grown YAML parser, replace `alert()` with a UI state (toast/banner).

## Tests

- [x] **Component tests (jsdom)**: `renderWithProviders` harness + `KpisTab`/`SimPanel`/`GlobalStrip`/`FieldGroup` tests (auto-field toggle, slider, shift×10 arrows); drag math (clamp/shift×10) tested via `nextDragValue`. _Still to do: import→state round-trip._
