# Changelog

> Note: entries before the "100% English migration" describe changes made when
> the engine used French identifiers (`prixAchat`, `cfN`, `reventeNet`, `loc`/`rp`,
> …). Those names are kept verbatim in historical entries for accuracy; the
> current code uses the English names (`purchasePrice`, `netCashFlow`,
> `netResaleProceeds`, `rental`/`primary`, …).

## [Unreleased]

### Fixed

- **Mobile: KPI section headers slid off-screen** — when scrolling the comparison table
  horizontally, the section-header rows (COÛTS & FINANCEMENT, etc.) slid away with the
  table and their labels were cut off. The section cell spans every column so it can't be
  pinned on its own; the label text is now wrapped in a sticky inner span
  (`SectionLabel`) that stays pinned left during horizontal scroll. Desktop unchanged.

- **Mobile: KPIs tab right-side gutter** — the three total-worth summary cards
  (`SummaryCards`/`Cards`) sat side-by-side with large non-shrinking mono values, so the
  row was wider than the phone and forced a horizontal gutter on the whole Comparaison tab.
  The cards now stack vertically below 768px (`Card` also gets `min-width: 0`), and the tab
  `Wrap` is `overflow-x: hidden` as a guard (the table keeps its own scroll container).

- **Mobile: DocPanel close button unreachable** — on a phone the interactive-documentation
  header (title + 3 seed chips + close ✕) overflowed the viewport on a single non-wrapping
  row, pushing the ✕ off-screen so the overlay could not be closed (Esc/backdrop still
  worked, but there is no Esc on a phone). The header now wraps below 768px: the seed chips
  share their own row and shrink (ellipsis), and the close button stays pinned and visible
  (enlarged to a 40px touch target). `DocPanel.jsx` only.

### Added

- **Mobile/smartphone layout — Phase 1 (adaptive shell)** — the app now switches to a
  dedicated mobile shell below the `tablet` breakpoint (768px), on the same React +
  styled-components stack (no new framework, single codebase). New `bp` breakpoint tokens
  and a `MOBILE_QUERY` constant in `theme/themes.js`; new `useMediaQuery`/`useIsMobile` hook
  (`components/common/useMediaQuery.js`) drives the desktop↔mobile branch in `App.jsx`.
  New `components/MobileShell/` (`MobileShell`, `BottomNav`, `Sheet`): a full-width chart
  area with a bottom tab bar (Chart · A · B · C · Settings); sim panels and global settings
  open as bottom sheets, reusing the existing `ChartArea`, `FullPanel`, and `GlobalStrip`.
  `NavBar` gained a `compact` variant (brand + overflow menu) for the mobile header.
  Canvas charts (`engine/charts.js`) now use responsive left/right gutters, axis font sizes,
  and x-label density (`chartMetrics`/`labelStep`), and `attachHover` was rewritten on
  Pointer Events so tooltips work via touch (tap-and-scrub) as well as mouse. `ChartArea`'s
  tablet reflow media query was scoped to 768–960px so the mobile shell gets a flex-filling
  chart. New i18n keys `nav.menu`, `mobile.settings`, `mobile.settingsTitle` (fr/en).
  Desktop layout unchanged. (Phases 2–3: touch-friendly inputs + responsive tables.)

- **Mobile/smartphone layout — Phase 2 (full-width sheets + touch inputs)** — inside the
  mobile sheets, the sim panel (`SimPanel.styles.js`) and global settings
  (`GlobalStrip.styles.js`) now drop their fixed desktop widths for full-width fluid
  layouts with larger fonts and ≥36px tap targets (16px inputs to avoid iOS focus zoom);
  the `GlobalStrip` horizontal strip becomes a scrollable vertical form. `useDraggableValue`
  was rewritten from mouse-only `requestPointerLock` to **Pointer Events** with
  `setPointerCapture`, so dragging a unit to scrub a value works on touch as well as mouse
  (the `Unit` triggers set `touch-action: none`); consumers updated to `onPointerDown`. All
  mobile styling is gated behind `@media (max-width: 767px)`, which only applies inside the
  sheets (the desktop tree is not mounted below 768px), so desktop is untouched. Phase 3
  (responsive tables) remains.

- **Mobile/smartphone layout — Phase 3 (responsive comparison tables)** — the two wide
  multi-column tables now stay usable on a phone. The KPI comparison table
  (`KpisTab/KpiTable.jsx` + styles) and the ReventeTab detail table (`ReventeTab.jsx`) get a
  horizontal-scroll wrapper with a `min-width` so columns stay readable, and their first
  column (Indicator / Year) is pinned via `position: sticky` so each row stays identifiable
  while scrolling the sim + ETF columns sideways. Gated behind `@media (max-width: 767px)`;
  desktop tables unchanged. Completes the 3-phase mobile adaptation; DocPanel was already
  responsive and verified at 390px.

- **Cumulative cash flow at horizon (KpisTab)** — new row in the **Yields & Cashflow**
  section (right after "CF réel/mois", `kpisTable.cumulativeCashFlowHz`) showing `flows[horizon-1].cumulativeCashFlow`,
  the operational "flows" component of `resaleBalance`. Helps explain why **Net sale profit
  (Bilan revente)** can look very negative: in rental mode the cumulative cash flow subtracts
  the personal rent every year. New `kpi.cumulativeCashFlow` tooltip (fr/en). No engine change.

- **Loan guarantee fees & broker fees** — two new acquisition fields (`guaranteeFees`,
  `brokerFees`) for rental/primary modes, shown in the **Acquisition** group next to
  `loanFees`. Both fold into `totalCost` (and thus `loanAmount`, the monthly payment, and
  all downstream KPIs) exactly like `loanFees`. Each supports the existing **Auto** mode
  (enabled by default, toggleable via the "A" badge): `guaranteeFees` Auto = 1.2% and
  `brokerFees` Auto = 1% of the estimated loan amount (acquisition cost excluding these two
  fees, minus the down payment). Viager mode is unaffected (these fields are not part of its
  Acquisition group). The `loanFees` label/tooltip was narrowed from "File & broker fees" to
  "File fees" to avoid overlap with the new broker field. Mirrored in the engine-ts variant.

- **Viager (life annuity) investment mode** — a third simulation mode (`'viager'`)
  alongside `rental`/`primary`, modeling **viager occupé** (the seller occupies, so no
  rental income; the property is bought for a **bouquet** + lifetime **rente**). New
  per-sim fields: `marketValue`, `occupationDiscount` (décote), `bouquet`,
  `monthlyAnnuity`, `annuityGrowth`, `expectedDuration`, `ownerCharges`,
  `ownerChargesGrowth`. The bouquet is loan-financeable via the existing
  `downPayment`/`interestRate`/`loanTerm` machinery (`downPayment = bouquet + notaryFees`
  ⇒ all-cash). The rente stops at `expectedDuration`; the **décote amortizes linearly to
  zero** by the expected-death year, so the resale value rises smoothly to the full market
  value (no value cliff — an early resale is a real occupied sale). Resale gains are
  taxed like a rental resale (cost basis `bouquet + Σrente + notaryFees`, nominal — a
  documented simplification). Engine: 3-way mode dispatch with a `default: throw`,
  `computeResale` parameterized into `computeViagerResale`, and `computeViagerBand` (a
  ±5-year sensitivity readout that communicates the longevity bet while keeping the engine
  deterministic). Mirrored in the engine-ts POC (exhaustive `switch`, parity test extended).
  UI: viager mode button, the "Monthly payment" chip includes the rente, the
  `GRP_VIAGER` field group, a death-year annotation on the ReventeTab charts, and en/fr
  field labels + tooltips. Tests: viager ground-truth + golden-master scenarios, engine-ts parity rows,
  io round-trip. Existing rental/primary golden snapshots stay numerically byte-identical
  (only the additive `monthlyAnnuity` result field and the widened sim `inputs` changed).
  Produced via `/autoplan` (CEO + Eng/Design review; decisions logged in `PLAN-viager.md`).
- _Deferred (per review):_ mortality table / INSEE barème, full early/expected/late
  scenario mode, viager libre, rente réversibilité, and the capitalised-rente cost basis.

### Changed

- **Codebase translated to 100% English (identifiers included).** All French was
  removed from code, comments, JSDoc, test descriptions and the export/import
  format — including the **domain identifiers themselves**. The 43 data-model
  keys (`prixAchat`→`purchasePrice`, `loyer`→`rent`, `apport`→`downPayment`, …),
  the engine output keys (`flux`→`flows`, `reventeNet`→`netResaleProceeds`,
  `patNet`→`netWorth`, `bilanCash`→`cashBalance`, …), the function names
  (`revalorise`→`compound`, `surplusAt`→`annualSurplus`, `impLoc`→`rentalTax`,
  `computeEtfPur`→`computeEtfScenario`, `abattementIR/PS`→`allowanceIncomeTax/SocialTax`)
  and the mode enum values (`'loc'`→`'rental'`, `'rp'`→`'primary'`) were renamed
  across the engine (JS + TS), state, io, components, tests and i18n keys. The
  **French UI locale (`fr.json`) keeps its French values** — only its keys were
  renamed in lockstep with `en.json`. No behavior change: the ground-truth
  numeric assertions in `compute.test.js` pass unchanged and the engine-ts parity
  test still proves TS == JS; golden/io snapshots were regenerated (keys changed,
  values did not). **No back-compat**: `localStorage` was bumped to
  `immorenta_state_v2` so stale French-keyed state is ignored, and old exported
  JSON/CSV/YAML files no longer re-import. 139 tests green, production build OK.
- Markdown docs (`CLAUDE.md`, `TODO.md`, `CHANGELOG.md`) translated to English.

### Added

- **TypeScript engine variant (`@immo-renta/engine-ts`, parallel POC)**: new `packages/engine-ts/` package — a 1:1 port of the engine in native TypeScript (interfaces `Globals`/`SimParams`/`FlowYear`/`ComputeResult`… in `src/types.ts`, `strict: true`, compiled to `dist/` `.js` + `.d.ts` + sourcemaps via `tsc`). Coexists with the JS package without touching the app (which still consumes `@immo-renta/engine`). Demonstrates the TS trade-off: authoring ergonomics (real inline types) **versus** a mandatory build step (JS ships its `src/`, TS must compile `dist/`). A **parity test** (`__tests__/parity.test.ts`, 18 cases) imports both engines and proves strict output equality (`compute`, `computeEtfScenario`, `computeEtfKpis`, helpers) across a rental/primary × regimes × horizons matrix → the port is not an approximation. Tooling: `packages/engine-ts` workspace, typecheck chained in `npm run check`, ESLint ignores `.ts` (validated by `tsc`, no `typescript-eslint` installed), Vitest includes `*.test.ts`. `dist/` gitignored.
- **Engine `.d.ts` types (Phase 4, no publish)**: `packages/engine/tsconfig.json` (`checkJs` + `emitDeclarationOnly`) generates the package's TypeScript declarations from the JSDoc → `dist/*.d.ts` (gitignored, built on demand via `npm run build:types -w @immo-renta/engine`, and on `prepack`). Added `@typedef Globals` (g) and `SimParams` (p) + annotations on the whole public API of `compute.js` → the exported surface is now **typed** (`compute(p: SimParams, g: Globals)`, etc.); `Globals`/`SimParams` are exported in the `.d.ts`. The engine typecheck is delegated to the package; `__tests__` files are excluded from the root typecheck (symmetry with the package, tests still run by Vitest). Engine comments only → golden-master **byte-identical**, 121 tests green. No npm publish.
- **Engine extracted into an npm package (Phase 3)**: the pure financial engine now lives in `packages/engine/` (`@immo-renta/engine`, **zero runtime dependencies**), activated via **npm workspaces** (app at root). `compute.js` + the `index.js` barrel + their tests (`compute.test.js`, `golden.test.js`, `fixtures.js`, snapshots) moved via `git mv` (history preserved). The app imports the engine via `@immo-renta/engine` (resolved by the workspace symlink at build/dev/test, and by a tsconfig `paths` mapping at typecheck). The app-side helpers stay in `src/engine/` (`charts.js` canvas, `utils.js` formatters, `io.js` serialization) — out of package scope. Golden snapshots **byte-identical** (no regeneration). Verified end to end: `npm ci` recreates the symlink, `npm run build`/`check` green (121 tests), GitHub Pages deploy unchanged. `vite.config`/`tsconfig`/lint scripts extended to `packages/`.
- **Engine tests decoupled (extraction Phase 2)**: `engine/__tests__/compute.test.js` and `golden.test.js` no longer depend on `state/definitions.js` (`mkDef`). New self-contained fixture `engine/__tests__/fixtures.js` (`makeG`, `mkParams`) reproducing the financial fields read by `compute()` — golden snapshots stay **byte-identical** (no regeneration). Both suites now import the engine via the `engine/index.js` barrel. Last `engine → state` link cut for the package scope: only `io.js`/`io.test.js` (serialization, out of scope) stay intentionally coupled to state. The engine (`compute.js` + tests) is now movable as-is into a standalone package.
- **Engine package boundary (extraction Phase 1)**: new `engine/index.js` barrel that exposes the **public surface** of the financial engine (`compute`, `computeEtfPur`, `computeEtfKpis`, `crossoverYear` + pure helpers `irr`, `revalorise`, `surplusAt`, `abattementIR/PS`, `impLoc`, `buildAmortization`, `computeResale`, `calcTRI/VAN/Moic`). All app consumers (`AppContext`, `KpisTab`, `DocPanel/concepts`) now import from `engine/index.js` instead of `engine/compute.js` directly. `compute.js` is the only module behind the boundary — `utils.js` (formatters), `charts.js` (canvas) and `io.js` (state-coupled serialization) stay out of scope. No logic changed: golden-master and the full suite unchanged (121 tests green). Prepares a later extraction into a standalone npm package (`@immo-renta/engine`, zero runtime deps).
- **Interactive documentation (DocPanel)**: new `?` button in the NavBar opening a full-screen surface (overlay, `Esc`/click-outside to close) where each financial concept is a card — title, explanation, formula and **interactive widget** (sliders/select/flows → value or live chart). 100% client-side, deterministic, zero key/server: the app stays strictly static. Pivot from an initial "chatbot" request (incompatible with the serverless constraint because of the API key). **Single source of truth**: each adapter calls the pure engine helpers already exported (`monthly payment` via the annuity, `buildAmortization`, `impLoc`, `abattementIR/PS`, `computeResale`, `computeEtfPur`, `irr`, `revalorise`) — the doc and the app cannot diverge. Data-driven concept registry (`components/DocPanel/concepts.js`) rendered by a single generic `ConceptCard`; charts mounted lazily (IntersectionObserver); cards seedable from any of the 3 live simulations via an A/B/C chip selector ("load values from:", sim-colored) that re-seeds every card. `revalorise` is now exported from `engine/compute.js`. New `doc.*` i18n namespace (fr/en). Pure adapters covered by `components/DocPanel/__tests__/concepts.test.js` (registry integrity, known values, IRR/MOIC failure modes → sentinels, no NaN leaks).
- **ETF column: Cash-on-cash (yr 1)** now filled in KpisTab (Yields & Cash-flow section), previously `—`. "Personal-rent effort" convention: a capitalizing ETF distributes no cash, so the only real year-1 outflow is the personal rent → `etfVal = −(loyerPerso×12) / apportETF × 100` (negative, mirroring the immo `cfN` which includes `loyerPerso`). `kpi.coc` tooltip enriched (fr/en) to document the ETF column.
- **Context menu (kebab ⋮) on each simulation panel**: replaces the activation switch with a 3-action menu — **Disable**, **Copy**, **Paste**. "Paste" is enabled only if a copy has been made. New reusable generic component `components/common/Menu.jsx` (`Menu` + `MenuItem`, handles open/close, click-outside and `Esc`), `KebabIcon` in `SimPanel/icons.jsx`, i18n keys `sim.{menu,disable,copy,paste}` (fr/en, orphan key `sim.enable` removed).
- **Copy-paste a simulation (A → B)**: **in-memory** clipboard (not persisted, reset on reload) in `AppContext` via `copySim`/`pasteSim` + `clipboard` state. Pasting overwrites `mode` + all financial parameters + `autoFields` of the target but **keeps** its `label`, `enabled` and `collapsed` (B stays B). Pure helper `simCopyPayload(p)` in `state/definitions.js` (excludes identity, clones `autoFields`). Covered by unit (helper), jsdom (`Menu`) and integration (copy A → paste B) tests.
- **Global Nominal / Real switch**: new `displayReal` toggle in the GlobalStrip (next to inflation). In "real" mode, the Comparison-tab curves (cumulative CF, wealth, annual CF, property value) and the Sale-tab curves (resale balance, cash balance) are deflated by inflation (`value / (1+inflation/100)^year`) — constant euros. In the KPI tables and summary cards, the emphasis (color ↔ grey) switches between the nominal and real rows depending on the mode. The engine stays strictly nominal (no golden-master impact). i18n keys `global.displayReal` + tooltip `displayReal` (fr/en); pure helper `deflate()` in `engine/utils.js`. No-op when inflation = 0.
- **Sale tab — second chart "How many years before you stop losing money?"**: plots `bilanCash = reventeNet + Σ(cfN + loyerPersoAnn) − apport`, on the same flow basis as IRR/NPV/MOIC (personal rent neutralized in rental, saved rent credited in primary). The zero-crossing = minimum holding period to avoid a loss (nominal, excluding opportunity cost). Vertical annotation per sim at the break-even year. i18n keys `charts.reventeCash.{title,desc}` (fr/en).
- **`engine/compute.js`**: new field `flux[].bilanCash` and KPI `beRevente` (first year where `bilanCash ≥ 0`). Exposed as a **Resale break-even** row in KpisTab (Wealth section) with the `kpi.beRevente` tooltip.
- **Component test net (jsdom)**: `src/test-utils/renderWithProviders.jsx` harness (real theme + i18n + AppContext providers, seed via localStorage) + `kpiNormalize.js`. jsdom tests on `KpisTab`, `SimPanel` (3 branches), `GlobalStrip`, `FieldGroup` (auto toggle, slider, shift×10 arrows). `jsdom` env per file via the `// @vitest-environment jsdom` docblock, engine env staying `node`. Suite grew from 40 to 91 tests.
- `engine/compute.js`: `computeEtfKpis(g)` (ETF IRR/NPV/MOIC) and `surplusAt(g, yr)` (annual ETF reference surplus) extracted and exported — tested (parameterized characterization + golden-master). The ETF math leaves `KpisTab` for the engine.
- `engine/compute.js`: pure islands exported `buildAmortization`, `computeResale`, `calcTRI`, `calcVAN`, `calcMoic` — `compute()` becomes a thin orchestrator around the 30-year loop.
- `components/common/useDraggableValue.js`: pure `nextDragValue()` (clamp/shift×10 math) extracted and tested without the DOM.
- **Vitest** test net on the financial engine: ground-truth assertions (`irr`, art. 150 VC CGI allowances, `impLoc` 3 regimes, annuity, LMNP carry-over, capital-gains exemption) + golden-master freezing `compute`/`computeEtfPur` and `buildExportData` (`src/engine/__tests__/`). Scripts `npm run test` / `npm run test:watch`, integrated into `npm run check` and the `quality` CI job.
- `src/components/common/useDraggableValue.js`: hook factoring the drag logic (pointer-lock) previously duplicated between `FieldGroup` and `GlobalStrip`.
- `TODO.md`: tracking of deferred refactors (splitting the god-functions/components, charts.js, io.js).

### Changed

- **"Property value over time" chart**: the Y axis is now anchored to 0 (visible origin) instead of auto-scaling to the data minimum. New `baseZero` option on `drawLine` (`engine/charts.js`), applied only to this chart; the other three Comparison-tab curves keep auto-scaling.
- **Splitting the god-components** (behavior strictly unchanged — golden-master + jsdom net green):
  - `ChartArea/KpisTab.jsx` (541 l.) → `KpisTab/` folder: `index.jsx` (orchestration), `kpiSections.js` (pure data, `t` injected), `KpiTable.jsx`, `KpiRow.jsx`, `SummaryCards.jsx`, `kpiFormat.js`, `KpisTab.styles.js`.
  - `SimPanel/SimPanel.jsx` (421 l.) → thin dispatcher + `DisabledPanel`/`CollapsedPanel`/`FullPanel`/`HeaderKpis`, styles in `SimPanel.styles.js`, shared SVG icons in `icons.jsx`. Removed the local copy of `fmtE` (import from `engine/utils`).
  - `GlobalStrip.jsx` (405 l.) and `FieldGroup.jsx` (301 l.): styled-components externalized to `*.styles.js`.
- `engine/compute.js`: pure helpers (`irr`, `abattementIR`, `abattementPS`, `impLoc`) now exported (testable); extraction of a `revalorise()` helper and named tax constants (`PFU_RATE`, `MICROBIC_ABATTEMENT`, allowance schedule) — behavior strictly unchanged (golden-master identical).

### Fixed

- **jsdom test harness: renders accumulating between cases** — `src/test-utils/setup.js` did not call Testing Library's `cleanup()` in `afterEach`, leaving mounted React trees stacking up in `document.body` (so `screen.*` queries could match multiple occurrences). `cleanup()` now runs before clearing `localStorage`, guarded to the jsdom environment (no-op in node).
- **Over-funded down payment altered the charts/KPIs**: when a down payment exceeded the total acquisition cost (`ct`), the loan was already zero (`emp = 0`) but the excess down payment kept degrading IRR/NPV/MOIC, `coc`, `patNet` and the balances (which subtract the down payment). The capital actually tied up in the property is now capped via `apportInvesti = min(apport, ct)` in `engine/compute.js`: the **operational** metrics no longer move past the cash purchase. The **remainder** (`apport − ct`) is invested in the ETF pocket (`etfSeed`, compounds at `rendAlt` from year 0) **if the surplus→ETF toggle is on** — it then feeds `patTotal` and `bilanTotal` (starting stake = `apportTotal = apportInvesti + etfSeed`); otherwise it stays as cash outside the model and nothing moves. No golden-master impact (the fixtures use `apport < ct` → `etfSeed = 0`). Regression covered by 3 new tests.
- **`revente.yr` translated to English in the French file**: the key was `"Yr {{n}}"` in fr, showing "Yr 9" in the detail table and the Sale chart annotation. Fixed to `"An {{n}}"`.
- **`fraisDossier` without translation**: the "File fees" field showed the raw key `fraisDossier` in the form. Labels and tooltips added in French and English.
- **Orphan `revalCharges`**: the charges-revaluation parameter (2 %/yr by default) influenced the calculations without being visible or editable. A dedicated field is now present in the GlobalStrip between "Budget growth" and "Surplus→ETF".
- **Incorrect `bilanRevente` and `bilanTotal` tooltips**: the two new comparison-table rows pointed to the `patNet`/`patTotal` tooltips. New dedicated tooltips with the right formula.

### Added

- **GlobalStrip — active assumptions**: read-only summary band shown to the right of the GlobalStrip summarizing the applied growth rates (inflation, charges, budget, personal rent). Makes visible the assumptions the user may not have adjusted yet.
- **KpisTab — Cash-on-cash return (yr 1)**: new row in the Yields section showing `cfN[1] / apport × 100`. Immediate indicator of the current return, complementary to IRR.
- **KpisTab — Real-metrics note**: when inflation is > 0, an explanatory note appears under the table description to clarify that the greyed rows are in constant euros.
- **Wealth chart — crossover line**: a thin vertical line (simulation color) marks the crossover year vs pure ETF on the Wealth chart, with the "yr N" label. Visible only if the crossover happens before year 30.
- **SimPanel — Income/Charges sections**: the "Operating" section of Rental mode is split into two distinct sections — "Rental income" (rent, vacancy, revalLoyer) and "Charges" (property tax, condo, insurance, management, reserve) — to improve readability.

### Fixed

- **Progressive allowances on the real-estate capital gain**: the capital-gains tax is now computed with the legal allowances (art. 150 VC CGI). Income tax: 6 %/yr from year 6 to 21 → full exemption from year 22. Social tax: 1.65 %/yr from year 6 to 21, 1.6 % at year 22, 9 %/yr from year 23 to 30 → full exemption after 30 years. Previously, the full rate (19 % + 17.2 %) was applied regardless of the holding period, massively overestimating the tax for long holdings.
- **Loan interest deduction**: the annual loan interest (`intAnnuel`) is now deducted from the taxable income under LMNP real (`le − chg − ab − at − intAnnuel`) and bare ownership (`le − chg − intAnnuel`), in line with French tax law. The tax was previously overestimated by €2,000–4,000/yr early in the loan.
- **LMNP depreciation carry-over**: the LMNP loss (depreciation exceeding the taxable income) is now carried to later years via the `amortReport` variable. Loss-making years produce `imp = 0` and the unused balance reduces future taxation. Previously, the surplus was lost.
- **Regime string consistency**: the correct enum value for the bare-ownership regime is `'nu'` (not `'foncier'` as incorrectly documented in CLAUDE.md). The code was already correct; only the documentation is fixed.
- **`calcVAN()` guard horizon > 30**: `calcVAN()` now returns `null` for `horizon > 30` or `< 1`, consistent with `calcTRI()`.

### Added

- **Annual revaluation of fixed charges** (`revalCharges`, default 2 %/yr): new global parameter modeling the annual increase of property tax, co-ownership charges, insurance and reserves. The factor `(1 + revalCharges/100)^(yr−1)` is applied to all fixed charges (rental and primary); the management fees (proportional to rent) stay unchanged.
- **File & broker fees** (`fraisDossier`, default 0 €): new simulation parameter (Acquisition section) included in `ct` (total cost) and therefore in `emp`. Models the bank or broker fees tied to obtaining the loan.
- **Cash-on-cash return**: `coc` added to each `flux[yr]` object — annual return of the net flow on the initial down payment (`cfN / apport × 100`). Available for export and future display.
- **Resale balance and total balance in the comparison table**: the `bilanRevente` (`reventeNet + cfC − apport`) and `bilanTotal` (`reventeNet + etfCap − apport`) metrics are now shown in the Wealth section of the KPIs table at the chosen horizon.

### Changed

- **KpisTab — hide the "Total wealth at 30 years" rows when horizon = 30**: the `patTotal30` and `patTotal30Real` rows no longer show when the chosen horizon is already 30 years, since they then duplicate the "at horizon" rows.
- **SimPanel & GlobalStrip — `?` icon before the labels**: the `?` help button is moved before each parameter's label (simulations and global bar), instead of after.
- **Comparison — pure ETF column**: the Comparison-tab table replaces the ETF rows (`Pure ETF at Xy`, `Pure ETF 30y`, `Advantage vs ETF`) with a **Pure ETF** column to the right of the simulation columns, aligned with the Sale tab's model. The column is filled for every section: yields (`rendAlt` in %), monthly CF (`−loyerPerso`), effort (`0 €`), IRR 10/15/20 and real (`rendAlt` exact by Fisher construction), NPV and MOIC (computed via the flows `[−apportETF, −surplus₁…]`), nominal and real total wealth. The `Gross yield (rental)` / `Net yield (rental)` labels are shortened to `Gross yield` / `Net yield`.
- **CLAUDE.md**: removed the duplicated sections at the end of the file (`Code Exploration Policy`, `Session-Aware Routing`, `Model-Driven Tool Tiering`) — already included via `@AGENTS.md` at the top of the file.

### Added

- **Annual budget revaluation**: new global parameter `revalBudget` (%/yr, default 0%) in the GlobalStrip, right after `budgetMensuel`. Models annual salary raises: the available budget grows each year by `(1 + revalBudget/100)^(yr−1)`, increasing the surplus invested in ETF over time. Impacts `computeEtfPur()`, `compute()` (surplusAnn) and the ETF NPV/MOIC calculation in KpisTab.
- **Real metrics (inflation-adjusted)**: the Inflation parameter is now used to display constant-euro indicators. In the KPIs: 3 real IRR rows (10/15/20y) via Fisher `(1+IRR)/(1+inflation)−1`, dimmed under each nominal IRR; 2 real wealth rows deflated by `(1+inflation)^n`; footer cards with "real: Xk€". In the Wealth chart: light-grey dashed line = pure ETF in constant euros. Italic `ChartNote` notes under the Wealth and Property-value charts noting the nominal values. Tooltips: `inflation` (role for real metrics), `rendAlt` (clarified nominal after-tax), `kpi.triReal` and `kpi.patReal` with formulas.
- **Drag-to-scrub on the units**: hovering a parameter's unit (€, %, yrs…) turns the cursor into a vertical double arrow. Holding the click and dragging up/down adjusts the value by step (6 px per step, Shift × 10). Works on all simulation parameters (FieldGroup) and global parameters (GlobalStrip). The cursor disappears during the drag via Pointer Lock and reappears exactly at its original position on release.

### Added

- **Comparison table — tooltips**: a `?` button appears before each row label in the comparison table (KPIs tab). Clicking opens a popover explaining the formula or the definition of the indicator (IRR, NPV, MOIC, yields, cashflow, wealth, pure ETF, crossover…). 17 new `tooltips.kpi.*` keys added in FR and EN.

### Changed

- **Sale tab — table**: the pure ETF value (net) is now shown in a dedicated column rather than as a sub-line in each simulation cell.

### Added

- **Theme and language persistence**: the theme (dark/light) and language (fr/en) are now saved to `localStorage` (`immorenta_theme`, `immorenta_lang`) and automatically restored on page reload.

### Added

- **Amortization tab — "Capital repaid" series**: new curve on the right axis showing the cumulatively repaid capital (increasing amount, symmetric to the outstanding capital). `drawBarsWithLine` now accepts an array of line datasets, each carrying a `dashed` property to control the style individually.

### Changed

- **Amortization tab — colors**: color scheme fully reworked. Bars: interest `#e2cbcb`, insurance `#a30eff`. Right-axis curves: outstanding capital `#ff0000` (solid), repaid capital `#ffff00` (solid). Right-axis labels switched to a neutral color (`mutedColor`). Colors centralized in the `AMORT_COLORS` constant.
- **Amortization tab**: merged the two charts (annual breakdown and outstanding capital) into a single dual-axis chart. The left axis gives the scale of the stacked bars (capital / interest / insurance); the right axis gives the scale of the dashed outstanding-capital curve. Both series now share the same time horizon (loan term), making it more natural to read.

### Added

- **Clean-code setup**: full quality pipeline added to the project.
  - **Prettier 3**: automatic formatting with `.prettierrc` (singleQuote, printWidth 100, trailingComma es5). `npm run format` (rewrite) and `npm run format:check` (CI) scripts.
  - **ESLint 9** (flat config): React-aware linting with `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, integrated with `eslint-config-prettier`. `npm run lint` and `npm run lint:fix` scripts.
  - **TypeScript checkJs**: type checking on `src/engine/` and `src/state/` without migrating to `.ts`. `npm run typecheck` script.
  - **Husky + lint-staged**: pre-commit hook that auto-reformats and lints the staged files.
  - **`npm run check`**: full pipeline (format:check + lint + typecheck) to run before every PR.
  - **GitHub Actions CI**: new `quality` job (format:check + lint + typecheck) blocking the `build` job on failure.
  - **`.editorconfig`**: indentation and end-of-line rules for all editors.
  - **`src/types/styled.d.ts`**: augmentation of `DefaultTheme` with the real theme shape.

### Changed

- **Full UI overhaul — "Claude" design**: visual redesign of the whole interface.
  - **Typography**: DM Sans replaced by Hanken Grotesk (body) + Space Mono (numeric values); `theme.mono` token and `--mono` CSS var added.
  - **Colors**: numeric values move from amber (#fbbf24) to purple (#a78bfa) in dark, (#7c3aed) in light; navbar always dark navy (`#0e1c36`) regardless of theme.
  - **NavBar**: square brand icon, purple "BETA" badge in monospace, segmented language selector (pill), primary/outline action buttons with outline.
  - **GlobalStrip**: `#0c1830` background, gear icon, fields row in `overflow-x: auto`, thin separators, monospace purple values.
  - **SimPanel**: fixed-width 220px panels; two new states — collapsed strip (46px) with vertical label + rotated KPIs, and disabled strip with hatched background. Colored top border (`border-top`) instead of bottom.
  - **ChartArea**: the tab bar leaves the NavBar and integrates into the chart area as a pill group with SVG icons (Charts, Comparison, Sale, Amortization).
  - **KpisTab**: summary cards at the bottom of the table (IRR, wealth, NPV per simulation) with colored border; data cells in monospace, best simulation highlighted with a tinted background and inset shadow.
  - **Legend**: click hint removed; `theme.surface` background added.
  - **Layout**: `SimsPane` no longer has a fixed 690px width — adapts to the active panels. Removed the alternating rows on even `<tr>`.

### Fixed

- **Engine — incorrect NPV/IRR in rental and primary modes**: two symmetric fixes on the `irrFlows[]` flows used by `calcTRI` and `calcVAN`.
  - **rental**: `calcVAN` used `flux[t-1].cfN` directly, which includes `−loyerPersoAnn`. The personal rent (a sunk cost incurred regardless of the investment) was counted as an expense, making the NPV very negative. Fix: `calcVAN` now reuses `irrFlows[]` like `calcTRI`.
  - **primary**: `irrFlows[]` did not count the saved rent (`loyerPersoAnn`) as a benefit. The IRR and NPV measured the gross outflows without accounting for the fact that the investment stops the rent payment. Fix: `loyerPersoAnn` is added to `irrFlows[]` for primary, symmetric to the rental treatment. Both modes now measure the pure return of the investment on a comparable basis.
  - **MOIC**: same cause — computed from `bilanRevente` which accumulates the gross `cfN`. Fixed to use `irrFlows[]` (same basis as IRR/NPV): `MOIC = (reventeNet + Σ irrFlows[1..horizon]) / apport`.
- **KpisTab — IRR shown N/C for all rental simulations**: the IRR engine included `loyerPersoAnn` as an expense in the rental cash flows, making the NPV systematically negative and the IRR uncomputable. The IRR now measures the pure return of the investment (without personal rent) for `loc` mode — `loyerPersoAnn` is excluded from the IRR flows (reintegrated into `cfN` before push). `rp` mode is unchanged. CLAUDE.md updated.
- **KpisTab — monthly CF shown only for rental sims**: removed the `mode === 'loc'` filter on the "simplified monthly CF" row — the value is now shown for all modes.
- **KpisTab — monthly effort shown only for primary sims**: removed the `mode === 'rp'` filter on the "monthly effort" row — the value is now shown for all modes.
- **KpisTab — "(rental)" and "(primary)" labels removed**: the "Net monthly CF (rental)" and "Monthly effort (primary)" labels renamed to "Simplified net monthly CF" and "Simplified monthly effort" (fr/en) now that both rows show for all modes.
- **Decimal display in numeric inputs**: fields with a decimal step (e.g. insurance 0.01) now keep the right number of decimals in all circumstances. The input moves from `type="number"` (which drops trailing zeros) to `type="text" inputMode="decimal"` with a dedicated `NumInput` component managing a local `localStr` state: `null` at rest (showing `toFixed(dec)`), free string while typing. The ↑/↓ keys (Shift × 10) increment/decrement by `field.st`, clamped between `field.mn` and `field.mx`.

### Added

- **Auto mode for derived parameters**: 6 SimPanel fields can be auto-computed — notary fees (8% of the purchase price), interest rate (France average-rate curve 05/2026 interpolated by duration: 7y 3.25% · 10y 3.30% · 15y 3.45% · 20y 3.55% · 25y 3.70%), works reserve, property tax, and their primary equivalents (0.5%/yr of the purchase price). An "A" badge appears next to each auto-capable field. Clicking the badge toggles between auto and manual; editing the slider/input also disables auto. Each field's state is stored in `autoFields[]` per simulation. The calculations stay in a pure `resolveAutoFields()` function without modifying the `compute()` financial engine. The (ⓘ) tooltips of each auto-capable field show the formula used.

### Changed

- **"Interest" color in the loan breakdown chart**: the interest segment moves from amber orange (`#f59e0b`) to bright yellow (`#ffe600`) to distinguish it from simulation B's color.

### Fixed

- **Horizon field — free input**: the "Horizon" input in the global bar updates in real time as soon as the value is valid (1–30 years). When the field is empty or being typed, the simulation keeps the last valid value. Focus is no longer needed to validate.

### Changed

- **Budget alert on the CF chip**: the "Real CF/mo" chip shows a red outline when the monthly outflow (`−cfN/12`) exceeds the monthly budget (`budgetMensuel`). The comparison uses `Math.round()` to avoid false positives from floating-point rounding on an apparent equality.

### Added

- **State persistence in the browser**: the full state (simulations A/B/C, globals, active tab, open groups) is saved to `localStorage` on page close/refresh and automatically restored on the next load. New keys added in the code fall back to their default value if absent from the saved JSON.

### Changed

- **SimPanel KPI chips overhaul**: 4 unified rental/primary indicators (Monthly payment, Real CF/mo, Effort/mo, Wealth at term) replace the mode-specific indicators (rendBrut/rendNet, ETF crossover, differential effort). Real CF/mo = `cfN/12` (yr 1, all charges included). Effort/mo = `−cfN/12 − loyerPerso` (monthly extra cost vs. the current situation).

### Fixed

- **ETF taxation at resale**: the pure ETF scenario in ReventeTab now shows the net value after 30% PFU on the capital gain (simplified CTO PFU). `computeEtfPur` returns `capNet = cap − gain × 0.30` in addition to the gross `cap`. The other views (ChartsTab wealth, KpisTab, crossover) keep using the gross for consistency with real-estate `patTotal`.

### Fixed

- **Chart hover restored**: the `attachHover` function had not been ported during the React migration. Floating tooltip reimplemented in `CanvasChart`, with series labels in all chart components (`ChartsTab`, `ReventeTab`, `AmortTab`).
- **Resale balance fixed**: the "Net balance by resale" chart and table now use `bilanTotal` (which includes the ETF pocket accumulated with the compounded monthly surplus) instead of `bilanRevente` (which only counted the gross uncompounded flows). The pure ETF reference curve stays unchanged in absolute value.

## [1.3.1] — 2026-05-28

### Fixed

- **Primary mode — cash flow fixed**: the rent not spent (`loyerPerso`) is no longer counted as a positive flow in `src/engine/compute.js`. The `cfN` in primary mode now reflects only the real outflows (charges + monthly payment + borrower insurance). Fixes the IRR, the resale balance and the cumulative cash flow for all scenarios — notably when `loyerPerso > monthly payment`.

### Removed

- Removed the legacy files that became unused after the React migration: `js/` (old vanilla JS modules), `style.css` (replaced by styled-components), `immo_renta.html` (old single-page reference file).

## [1.3.0] — 2026-05-28

### Added

- **Responsive layout**: simulation columns stacked on mobile, charts resized.

### Fixed

- UI regressions introduced during the Vite migration (styles, spacing, slider behavior).

## [1.2.0] — 2026-05

### Changed

- **Migration to Vite**: the application is now built with Vite (`npm run dev / build / preview`). Automatic deployment to GitHub Pages via GitHub Actions.
- **Code modularization**: the single-file `immo_renta.html` application was split into ES modules:
  - `js/main.js` — entry point, `window` exposure
  - `js/state.js` — shared state (`G`, `sims`, `COL`, `KEYS`, group definitions)
  - `js/compute.js` — financial engine (`compute()`, `recomputeETFPur()`, `crossoverYear()`, IRR)
  - `js/charts.js` — canvas renderers (`drawLine()`, `drawBars()`, `attachHover()`)
  - `js/render.js` — interface (`renderPanel()`, `rebuildShell()`, `redraw()`, export/import)
  - `js/utils.js` — formatters (`fmtE()`, `fmtK()`, `fmtP()`, `fmtTRI()`)

## [1.1.0] — 2026-04

### Added

- **Pure ETF curve always shown** on the Total-wealth chart, even if no simulation is in rental mode.
- **ETF pocket included in the resale balance**: the total wealth (property equity + ETF from the surplus) is integrated into the `bilanTotal` calculation.
- **Pure ETF externalized**: `recomputeETFPur()` fills a global `etfPurGlobal[]` array computed once per render cycle, independently of `compute()`.
- **Monthly budget + ETF surplus** (`budgetMensuel`, `investirSurplus`, `apportETF`): global parameters to normalize the primary-vs-rental comparison on the same monthly envelope. The surplus (budget − real outflows) is reinvested in ETF in each scenario.
- **Personal rent revaluation** (`revalLoyerPerso`): the current rent paid by the investor is revalued each year in the pure ETF scenario.

### Changed

- The rental calculations now integrate the personal rent (`loyerPerso`) and the market-rent revaluation (`revalLoyer`) into the annual `cfN`.

## [1.0.0] — 2026-03

### Added

- **Export** of simulation data to CSV, JSON and YAML.
- **Import** of simulation data from CSV, JSON and YAML.
- Initial application: rental (`loc` mode) and primary-residence (`rp` mode) real-estate investment analysis tool with 3 concurrent simulations (A, B, C), canvas charts, IRR computation, KPIs dashboard.
