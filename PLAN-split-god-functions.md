# Plan — Splitting the god-functions / god-components

> Historical artifact: this completed plan describes work done when the engine
> used French identifiers and `KpisTab.jsx`/`SimPanel.jsx` lived under
> `src/components/ChartArea`/`SimPanel`. Identifier names and line references are
> kept verbatim (accurate at the time of writing).

Source: [TODO.md](TODO.md) § "Splitting the god-functions / god-components".
Reviewed via `/plan-eng-review` (2026-05-31). Behavior-preserving refactor.

## Goal

Break four god-units (`compute()` 256 l., `KpisTab.jsx` 541 l., `SimPanel.jsx`
421 l., `GlobalStrip.jsx` 405 l., `FieldGroup.jsx` 301 l.) into testable sub-units,
**without changing a single displayed number**. The non-regression guardrail is
twofold: golden-master (already in place, engine) + a new jsdom net (components).

## Locked decisions (interactive review)

| #   | Decision          | Choice                                                              |
| --- | ----------------- | ------------------------------------------------------------------- |
| D1  | Sequencing        | **jsdom net first, then UI.** Phase 0 → 1 → 2 → 3.                  |
| D2  | Split `compute()` | Pure islands + a thin orchestrating loop.                           |
| D3  | ETF math          | `surplusAt()` + `computeEtfKpis(g)` in the engine.                  |
| D4  | jsdom harness     | `renderWithProviders()` real providers + value assertions.          |
| D5  | Split `KpisTab`   | `kpiSections.js` (data) + `<KpiTable>/<KpiRow>/<SummaryCards>`.     |
| D6  | Phase 3           | `.styles.js` per component + SimPanel split + `fmtE` import.        |
| D7  | Drag tests        | Pure unit math + jsdom toggle/slider/number; no synthetic DOM drag. |
| D8  | Outside voice     | Done (Claude subagent).                                             |
| D9  | Corrections       | All incorporated (cf. § Corrections).                               |

## Corrections from the outside voice (verified in the code)

1. **It is NOT a triplication.** [compute.js:141-143](src/engine/compute.js#L141)
   subtracts `realOutAnn` (real outflow); only `computeEtfPur` and `KpisTab`
   subtract `loyerPerso`. → `surplusAt(g, yr)` unifies **2 sites** (ETF reference);
   `compute()`'s in-loop surplus is another quantity and **stays as is**.
2. **Parameterized characterization test**, not just default G:
   `{apportETF: 0}` (MOIC null), `{tauxActu === rendAlt}` (NPV→0), `{horizon: 30}`.
3. **jsdom assertions robust to formatting.** `fmtE` emits ` ` (nbsp) + `€` and
   depends on ICU. The harness asserts via a normalization helper (reuses the
   logic of [`parseNum`](src/components/ChartArea/KpisTab.jsx#L94)) and **pins the locale/ICU**.
4. **Per-file test env.** [vite.config.js](vite.config.js) is global
   `environment: 'node'`. Engine tests stay `node`; jsdom via
   `environmentMatchGlobs` (or `@vitest-environment jsdom` docblock) + `setupFiles`
   for the `@testing-library/jest-dom` matchers.
5. **`buildSections` is not pure** — saturated with `t()` + language-detection
   `.startsWith()` branches ([:143](src/components/ChartArea/KpisTab.jsx#L143)).
   Signature `buildSections(t, G, RES, sims, etf)` — `t` injected; branches copied verbatim.
6. **SimPanel `fmtE` = utils `fmtE`** (verified byte-identical,
   [utils.js:1-6](src/engine/utils.js#L1)). Safe drop-dup.
7. **Incomplete `calcVAN`/`moic` signature** — MOIC divides by `p.apport`
   ([:242](src/engine/compute.js#L242)). The lifted fns take `apport` as a parameter.
8. **shift×10 exists in 2 places**: [useDraggableValue.js:30](src/components/common/useDraggableValue.js#L30)
   (drag) **and** [FieldGroup.jsx:187](src/components/SimPanel/FieldGroup.jsx#L187) (NumInput arrows).
   Test **both**.

---

## Phases

```
PHASE 0  jsdom harness            ── blocks Phase 2 & 3
PHASE 1  Engine (compute split)   ── protected by golden-master; blocks Phase 2 (computeEtfKpis)
PHASE 2  KpisTab                  ── protected by Phase 0; depends on Phase 1
PHASE 3  SimPanel/GlobalStrip/FG  ── protected by Phase 0; independent of 1 & 2
```

### Phase 0 — jsdom harness (foundation)

- `npm i -D @testing-library/react @testing-library/jest-dom jsdom`
- [vite.config.js](vite.config.js): add `environmentMatchGlobs: [['src/components/**', 'jsdom'], ['src/**/*.dom.test.{js,jsx}', 'jsdom']]`, keep the rest `node`. Add `setupFiles: ['./src/test-utils/setup.js']` (`import '@testing-library/jest-dom'`). Pin ICU/locale (document `NODE_ICU_DATA`/full-icu, or normalize instead of comparing formatted strings).
- `src/test-utils/renderWithProviders.jsx`: wrap `ThemeProvider` (real theme) + `I18nextProvider` (real i18n) + `AppProvider` with `{simsOverride, gOverride}` seed. Exports `renderWithProviders(ui, opts)`.
- `src/test-utils/kpiNormalize.js`: `normalizeMoney(str)` (strip ` `/spaces/`€`, comma→dot) for value asserts. Smoke-test of the harness itself.

### Phase 1 — Engine (golden-master protected)

- `buildAmortization(emp, tM, nM, assM)` → `amort[]`. (transitively pinned)
- `computeResale(p, pr, rest, yr)` → `{ fa, pvB, iPV, reventeNet }` (allowances included).
- Lift `calcTRI(flux, irrFlows, h)`, `calcVAN(flux, irrFlows, g)`, `calcMoic(flux, irrFlows, g, apport)` to top-level pure fns. **explicit `apport`** (D9#7).
- `surplusAt(g, yr)` → `max(0, budgetAnn − lpa)`. Replaces the 2 ETF-reference sites (`computeEtfPur`, and the use in `computeEtfKpis`). **`compute()` loop unchanged** (D9#1).
- `computeEtfKpis(g)` → `{ tri, triReal, van, moic, surplusTotal }`. Moves
  [KpisTab.jsx:122-139](src/components/ChartArea/KpisTab.jsx#L122).
- `compute()`: the accumulation loop stays the orchestrator (carries `amortReport/cfC/etfCap`).
- **BEFORE the move**: parameterized characterization test of `computeEtfKpis`
  (D9#2) + golden-master snapshot of `computeEtfKpis`.

### Phase 2 — KpisTab (Phase 0 protected, depends on Phase 1)

```
ChartArea/KpisTab/
  index.jsx          # orchestration (~60 l), calls computeEtfKpis(G)
  kpiSections.js     # buildSections(t, G, RES, sims, etf) → rows (D9#5)
  KpiTable.jsx       # thead + section grouping
  KpiRow.jsx         # best-col logic + ETF cell
  SummaryCards.jsx
  kpiFormat.js       # parseNum / findBest
  KpisTab.styles.js
```

Tests: unit `buildSections` (row count, labels, one formatter); jsdom values vs
`compute()` (via `normalizeMoney`); 2-sims case → "best" cell.

### Phase 3 — SimPanel / GlobalStrip / FieldGroup (Phase 0 protected)

```
SimPanel/
  index.jsx           # dispatch of the 3 branches (~40 l)
  DisabledStrip.jsx  CollapsedStrip.jsx  FullPanel.jsx  HeaderKpis.jsx
  SimPanel.styles.js  icons.jsx          # shared CollapseIcon/ChevronIcon
GlobalStrip/  index.jsx + GlobalStrip.styles.js
FieldGroup/   FieldGroup.jsx + FieldGroup.styles.js  (keeps NumInput/DraggableUnit)
```

- SimPanel imports `fmtE` from `engine/utils`, drops the local copy (D9#6, verified safe).
- **`&& p.enabled` ([SimPanel.jsx:382](src/components/SimPanel/SimPanel.jsx#L382)) is dead** (early-return l.310). Copy verbatim, **do not simplify** (behavior-preserving refactor).
- Tests: `useDraggableValue` clamp/shift×10 as pure unit + NumInput shift×10 arrows (D9#8); jsdom auto-toggle, slider, number; SimPanel 3 branches rendered; GlobalStrip + 1 interaction.

---

## What already exists (reused, not rebuilt)

- **[golden.test.js](src/engine/__tests__/golden.test.js)** — freezes all `compute()`/`computeEtfPur` output (4 scenarios + 3 horizons). Protects Phase 1 entirely. Reused as is.
- **[compute.test.js](src/engine/__tests__/compute.test.js)** — ground-truth `irr`, `abattementIR/PS`, `impLoc`, monthly payment, LMNP carry-over, capital-gains exemption.
- **NumInput / DraggableUnit** ([FieldGroup.jsx](src/components/SimPanel/FieldGroup.jsx)) — already clean sub-components; Phase 3 only extracts their styles.
- **`parseNum`** ([KpisTab.jsx:94](src/components/ChartArea/KpisTab.jsx#L94)) — normalization logic reused by the test helper (D9#3).
- **vitest** — already configured; Phase 0 adds the per-file jsdom env, does not replace it.

## NOT in scope (deferred, with reason)

- **`charts.js`** (canvas setup / theme / grid duplicated 3×) — stays in [TODO.md](TODO.md) § Rendering & I/O. Out of god-functions scope; dedicated batch.
- **`io.js`** (harden the YAML parser, replace `alert()`) — same, dedicated I/O batch.
- **Synthetic DOM drag** (mousedown→move→up jsdom) — D7: fragile, math tested at the pure level instead.
- **Full data-driven rewrite** of SimPanel/FieldGroup — D6: premature abstraction for 4 fixed chips.
- **Fixing the `.startsWith()` language-detection hack** — behavior preserved verbatim; to handle when the `cat` i18n is revisited.
- **Removing the dead `&& p.enabled`** — behavior-preserving refactor; separate cleanup.

## Failure modes (per new codepath)

| Codepath                             | Realistic failure          | Test?                                  | Visible error?          |
| ------------------------------------ | -------------------------- | -------------------------------------- | ----------------------- |
| `computeEtfKpis(g)` `apportETF=0`    | MOIC `null`/NaN division   | ✅ parameterized char-test (D9#2)      | ETF column "—"          |
| `surplusAt` miswired on compute loop | `etfPoche` drifts silently | ✅ golden-master `flux[].etfPoche`     | none → **golden catch** |
| `calcMoic` without `apport`          | NaN MOIC                   | ✅ corrected signature (D9#7) + golden | MOIC cell "—"           |
| jsdom asserts vs ` `/ICU             | flaky test CI≠local        | ✅ normalize + locale pin (D9#3/#4)    | false CI red            |
| `buildSections` `t` not injected     | labels = raw keys          | ✅ jsdom (real i18n)                   | labels "kpisTable.x"    |
| Drop SimPanel `fmtE`                 | chip format change         | ✅ verified identical (D9#6)           | none                    |

**No critical gap** (silent + untested + unhandled): the riskiest (#1 `surplusAt`) is covered by golden-master.

## Parallelization (worktrees)

| Phase   | Modules touched                                   | Depends on       |
| ------- | ------------------------------------------------- | ---------------- |
| Phase 0 | `test-utils/`, `vite.config.js`                   | —                |
| Phase 1 | `engine/`                                         | —                |
| Phase 2 | `components/ChartArea/`                           | Phase 0, Phase 1 |
| Phase 3 | `components/SimPanel/`, `components/GlobalStrip/` | Phase 0          |

- **Lane A**: Phase 0 → Phase 2 (sequential, Phase 2 needs the harness + `computeEtfKpis`)
- **Lane B**: Phase 1 (independent, golden-master)
- **Lane C**: Phase 3 (needs Phase 0 merged)

**Order**: run **Phase 0 + Phase 1 in parallel** (separate worktrees, 0 conflict:
`test-utils/`+`vite.config.js` vs `engine/`). Merge both. Then **Phase 2 + Phase 3
in parallel** (`ChartArea/` vs `SimPanel/`+`GlobalStrip/` — 0 conflict). Phase 2 waits
for the Phase 1 merge.

**Potential conflict**: `vite.config.js` touched by Phase 0 only. No module overlap between parallel lanes.

## Implementation Tasks

Synthesized from the findings. P1 = blocks the batch ship, P2 = same branch, P3 = follow-up.

- [ ] **T1 (P1, human: ~3h / CC: ~20min)** — test-utils — jsdom harness + per-file env
  - Surfaced by: D4 + D9#3/#4 — vite.config global node, brittle asserts
  - Files: `vite.config.js`, `src/test-utils/renderWithProviders.jsx`, `src/test-utils/setup.js`, `src/test-utils/kpiNormalize.js`
  - Verify: `npm run test` (harness smoke green, engine suite stays node)
- [ ] **T2 (P1, human: ~2h / CC: ~15min)** — engine — `surplusAt` + `computeEtfKpis` + char-test BEFORE move
  - Surfaced by: D3 + D9#1/#2 — dedup 2 sites, parameterized char-test
  - Files: `src/engine/compute.js`, `src/engine/__tests__/compute.test.js`, `src/engine/__tests__/golden.test.js`
  - Verify: char-test pins pre-move values; golden unchanged
- [ ] **T3 (P1, human: ~3h / CC: ~20min)** — engine — Split `compute()` pure islands + signatures with `apport`
  - Surfaced by: D2 + D9#7 — calcVAN/moic missing apport
  - Files: `src/engine/compute.js`
  - Verify: `npm run test` golden-master 0 diff
- [ ] **T4 (P2, human: ~4h / CC: ~30min)** — ChartArea — Split KpisTab + `buildSections(t,…)`
  - Surfaced by: D5 + D9#5 — t injected, sniff verbatim
  - Files: `src/components/ChartArea/KpisTab/*` (index, kpiSections, KpiTable, KpiRow, SummaryCards, kpiFormat, styles)
  - Verify: jsdom values vs compute(); best-col 2 sims
- [ ] **T5 (P2, human: ~4h / CC: ~30min)** — SimPanel/GlobalStrip — Externalized styles + branch split + fmtE import
  - Surfaced by: D6 + D9#6/#8 — fmtE safe, dead `&&p.enabled` verbatim
  - Files: `src/components/SimPanel/*`, `src/components/GlobalStrip/*`
  - Verify: jsdom 3 branches + GlobalStrip; `useDraggableValue` + NumInput shift×10 units
- [ ] **T6 (P3, human: ~30min / CC: ~5min)** — TODO.md — Check off the 3 god-functions items + the component-tests item
  - Files: `TODO.md`, `CHANGELOG.md`

## Unresolved decisions

None — D1 to D9 all answered.

## GSTACK REVIEW REPORT

| Review        | Trigger               | Why                             | Runs | Status       | Findings                  |
| ------------- | --------------------- | ------------------------------- | ---- | ------------ | ------------------------- |
| CEO Review    | `/plan-ceo-review`    | Scope & strategy                | 0    | —            | —                         |
| Codex Review  | `/codex review`       | Independent 2nd opinion         | 0    | —            | —                         |
| Eng Review    | `/plan-eng-review`    | Architecture & tests (required) | 1    | CLEAR (PLAN) | 5 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps                      | 0    | —            | —                         |
| DX Review     | `/plan-devex-review`  | Developer experience gaps       | 0    | —            | —                         |

- **CODEX:** unavailable (`codex` not installed) — outside voice ran via Claude subagent.
- **OUTSIDE VOICE:** 8 findings; 7 verified real and incorporated (D9), 1 (subagent's shift×10 claim) refuted by code (`useDraggableValue.js:30`). Headline catch: the "triplication" is a 2× duplication — `compute()`'s in-loop surplus stays untouched.
- **CROSS-MODEL:** No tension — outside voice refined the execution spec, did not contradict any D1–D8 decision.
- **UNRESOLVED:** 0.
- **VERDICT:** ENG CLEARED — behavior-preserving refactor, golden-master + new jsdom net, all decisions locked. Ready to implement.
