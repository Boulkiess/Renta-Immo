# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**ImmoRenta** is a single-file French real estate investment analysis tool. The entire application lives in [immo_renta.html](immo_renta.html) — no build step, no dependencies, no package manager. Open the file directly in a browser to run it.

## Architecture

Everything is in one HTML file: inline CSS (lines 7–119), inline JavaScript (lines 138–845), and a minimal HTML shell.

### Core data flow

1. **`sims` object** — holds state for 3 concurrent simulations (A, B, C), each with a `mode` (`'loc'` for rental, `'rp'` for primary residence) and ~25 financial parameters defined by `mkDef()`.
2. **`compute(p)`** — pure function that takes a simulation's parameters and returns all derived financials: monthly payments, annual cashflows over 30 years, IRR at multiple horizons, NPV, patrimoine net, and the "Louer+Investir" alternative scenario for RP mode. This is the financial engine — touch it carefully.
3. **`renderPanel(key)`** — rebuilds the full HTML for one of the 3 left-column simulation panels (including sliders and inputs). Called on mode change or group toggle. KPI chips are updated more cheaply via `updateKpiChips()` on slider/number input events.
4. **`rebuildShell()`** — recreates the canvas elements and static content for the active tab. Called only on tab changes and resize.
5. **`redraw()`** — reads all `sims`, calls `compute()` for each, and draws charts or tables. Triggered via `scheduleRedraw()` which debounces with `requestAnimationFrame`.

### Charts

Two pure canvas renderers — `drawLine()` and `drawBars()` — handle all charts. They store render metadata on the canvas element (`el._meta`) for the hover tooltip system (`attachHover()`).

### Key globals

- `G` — global settings shared across simulations: `inflation`, `regime` (`'lmnp'`/`'microbic'`/`'nu'`), `horizon`, `tauxActu`, `rendAlt`
- `COL` — color map `{A, B, C}` for the 3 simulations
- `openGrp` — tracks which accordion group is open per simulation panel
- `curTab` — active tab id (`'charts'`, `'kpis'`, `'revente'`, `'amort'`)
- `I` (info registry) — tooltip/popover content keyed by parameter name

### Field definitions

`GRP_COMMON`, `GRP_LOC`, `GRP_RP` define the parameter groups and their slider configs. `GROUPS_ALL()` flattens them for lookups. `getGroups(mode)` returns the right combination for a given simulation mode.

## Financial formulas

- **Loan payment**: standard annuity formula — `mens = emp × (τ/12) / (1 − (1+τ/12)^−n)`
- **IRR**: Newton-Raphson on cashflows `[-apport, CF1, ..., CFn + reventeNet]`
- **RP alternative scenario**: apport invested upfront + delta between RP monthly cost and current rent invested each month, compounding at `G.rendAlt`
- **Tax**: `impLoc()` handles LMNP (amortissements déductibles), Micro-BIC (50% abattement), and foncier nu (charges réelles)
- **Capital gains**: only applies to `'loc'` mode; RP is fully exempt (`impotPV`/`psPV` = 0)
