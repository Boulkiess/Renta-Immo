# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**ImmoRenta** is a French real estate investment analysis tool that runs entirely in the browser. Open `index.html` via a dev server or directly to run it. No React or framework — the React/styled-components packages in `package.json` are unused leftovers.

## Commands

```bash
npm run dev      # Vite dev server (hot reload)
npm run build    # Production build → dist/
npm run preview  # Preview the production build
```

Deployment: pushing to `main` triggers GitHub Actions → Vite build → GitHub Pages.

The file `immo_renta.html` is the legacy single-file version kept for reference; the active codebase is `index.html` + `style.css` + `js/`.

## Architecture

```
index.html          HTML shell (39 lines) — references style.css and js/main.js
style.css           All CSS (dark theme, CSS custom properties in :root)
js/
  main.js           Entry point — imports everything, exposes to window, calls init sequence
  state.js          All shared state: G, sims, COL, KEYS, I, mkDef(), GRP_*, getGroups()
  compute.js        Financial engine: compute(), recomputeETFPur(), crossoverYear(), irr()
  charts.js         Canvas renderers: drawLine(), drawBars(), attachHover()
  render.js         UI: renderPanel(), rebuildShell(), redraw(), export/import handlers
  utils.js          Formatters: fmtE(), fmtK(), fmtP(), fmtTRI()
```

### Core data flow

1. **`sims` object** (`state.js`) — holds state for 3 concurrent simulations (A, B, C), each with a `mode` (`'loc'` for rental, `'rp'` for primary residence) and ~25 financial parameters defined by `mkDef()`.
2. **`compute(p)`** (`compute.js`) — pure function: takes a simulation's parameters, returns all derived financials: monthly payments, annual cashflows over 30 years, IRR at multiple horizons, NPV, patrimoine net. This is the financial engine — touch it carefully.
3. **`renderPanel(key)`** (`render.js`) — rebuilds the full HTML for one of the 3 left-column simulation panels. Called on mode change or group toggle. KPI chips are updated more cheaply via `updateKpiChips()` on slider/number input events.
4. **`rebuildShell()`** (`render.js`) — recreates canvas elements and static content for the active tab. Called only on tab changes and resize.
5. **`redraw()`** (`render.js`) — reads all `sims`, calls `compute()` for each, draws charts or tables. Triggered via `scheduleRedraw()` which debounces with `requestAnimationFrame`.

### Window exposure pattern

All event handlers in HTML are inline strings (`onclick="setTab('charts')"`). `js/main.js` exposes every needed function via `Object.assign(window, {...})`. When adding a new exported function that needs to be callable from HTML, add it to that `Object.assign` call.

### Charts

Two pure canvas renderers in `charts.js` — `drawLine()` and `drawBars()` — handle all charts. They store render metadata on the canvas element (`el._meta`) for the hover tooltip system (`attachHover()`). Canvas id strings are hardcoded in `rebuildShell()` and referenced by name in `redraw()`.

### Key globals (`state.js`)

- `G` — global settings shared across simulations: `inflation`, `regime` (`'lmnp'`/`'microbic'`/`'nu'`), `horizon`, `tauxActu`, `rendAlt`, `loyerPerso`, `revalLoyerPerso`, `budgetMensuel`, `investirSurplus`, `apportETF`
- `COL` — color map `{A, B, C}` for the 3 simulations
- `curTab` — active tab id (`'charts'`, `'kpis'`, `'revente'`, `'amort'`)
- `openGrp` — tracks which accordion group is open per simulation panel (`render.js`)
- `I` (info registry) — tooltip/popover content keyed by parameter name

### Field definitions (`state.js`)

`GRP_COMMON`, `GRP_LOC`, `GRP_RP` define the parameter groups and their slider configs. `GROUPS_ALL()` flattens them for lookups. `getGroups(mode)` returns the right combination for a given simulation mode.

### ETF reference scenario

`recomputeETFPur()` in `compute.js` fills the module-level `etfPurGlobal[]` array. It must be called before `redraw()` and before `renderPanel()` (KPI chips reference it via `crossoverYear()`). `redraw()` calls it at the top; `renderPanel()` calls it explicitly.

## Financial formulas

- **Loan payment**: standard annuity — `mens = emp × (τ/12) / (1 − (1+τ/12)^−n)`
- **IRR**: Newton-Raphson on cashflows `[-apport, CF1, ..., CFn + reventeNet]`
- **ETF pur reference**: apport invested upfront + annual surplus (budget − real outflows) compounding at `G.rendAlt`
- **Tax** (`impLoc()`): LMNP (amortissements déductibles), Micro-BIC (50% abattement), Foncier nu (charges réelles)
- **Capital gains**: only applies to `'loc'` mode; RP is fully exempt (`impotPV`/`psPV` = 0)
- **Patrimoine total**: equity immobilière (valeur bien − capital restant) + ETF poche accumulée avec le surplus mensuel
