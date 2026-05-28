# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**ImmoRenta** is a French real estate investment analysis tool built with React + Vite, running entirely in the browser.

## Commands

```bash
npm run dev      # Vite dev server (hot reload)
npm run build    # Production build → dist/
npm run preview  # Preview the production build
```

Deployment: pushing to `main` triggers GitHub Actions → Vite build → GitHub Pages.

## Before every commit

**Update `CHANGELOG.md`** under `[Unreleased]` before committing any change. Add a `### Fixed`, `### Added`, `### Changed`, or `### Removed` entry as appropriate.

## Architecture

```
index.html              HTML shell — loads src/main.jsx via Vite
src/
  main.jsx              React entry point (ReactDOM.createRoot)
  App.jsx               Root component — theme provider, layout, tab routing
  state/
    AppContext.jsx       React context: sims, G (globals), dispatch actions
    definitions.js      mkDef(), GRP_COMMON/LOC/RP, field metadata, I (info registry)
  engine/
    compute.js          Financial engine: compute(p,g), computeEtfPur(g), crossoverYear()
    charts.js           Canvas renderers: drawLine(), drawBars(), attachHover()
    utils.js            Formatters: fmtE(), fmtK(), fmtP(), fmtTRI()
    io.js               Export/import handlers (CSV, JSON, YAML)
  components/
    SimPanel/           Left-column simulation panel (sliders, KPI chips, mode switch)
    ChartArea/          Canvas chart wrappers (Charts, KPIs, Revente, Amort tabs)
    GlobalStrip/        Global settings bar (loyerPerso, budget, regime, horizon…)
    NavBar/             Tab navigation
    Legend/             Simulation legend
    common/             Shared UI atoms
  i18n/                 Translations (fr/en)
  theme/                Styled-components theme tokens
```

### Core data flow

1. **`AppContext`** (`state/AppContext.jsx`) — holds state for 3 concurrent simulations (A, B, C) via `useReducer`. Each sim has a `mode` (`'loc'` / `'rp'`) and ~25 financial parameters from `mkDef()`, plus global settings `G`.
2. **`compute(p, g)`** (`engine/compute.js`) — pure function: takes a simulation's parameters and globals, returns derived financials: monthly payments, 30-year cashflows, IRR at multiple horizons, NPV, patrimoine net. This is the financial engine — touch it carefully.
3. **`computeEtfPur(g)`** (`engine/compute.js`) — pure function returning the 30-year ETF reference scenario array.
4. Charts and KPI tables call `compute()` and `computeEtfPur()` on each render cycle.

### Key data shapes

- `p` (simulation params) — `{ mode, prixAchat, fraisNotaire, travaux, apport, taux, duree, loyer, … }` — see `mkDef()` in `definitions.js`
- `g` (globals) — `{ loyerPerso, revalLoyerPerso, budgetMensuel, investirSurplus, apportETF, rendAlt, tauxActu, horizon, regime, inflation }`
- `compute()` return — `{ flux[30], cfM, mens, assM, tri10/15/20, van, moic, revente[], … }`
- `flux[yr]` — `{ cfN, cfC, le, chg, ann, imp, vb, rest, patNet, patTotal, etfPoche, reventeNet, bilanRevente, bilanTotal }`

## Financial formulas

- **Loan payment**: standard annuity — `mens = emp × (τ/12) / (1 − (1+τ/12)^−n)`
- **IRR**: Newton-Raphson on cashflows `[-apport, CF1, ..., CFn + reventeNet]`
- **ETF pur reference**: apport invested upfront + annual surplus (budget − real outflows) compounding at `g.rendAlt`
- **Tax** (`impLoc()`): LMNP (amortissements déductibles), Micro-BIC (50% abattement), Foncier nu (charges réelles)
- **Capital gains**: only applies to `'loc'` mode; RP is fully exempt (`impotPV`/`psPV` = 0)
- **Patrimoine total**: equity immobilière (valeur bien − capital restant) + ETF poche accumulée avec le surplus mensuel
- **RP cash flow**: `cfN = -(charges + annuité + assurance)` — sorties réelles uniquement, jamais positif. Le loyer non dépensé n'est PAS un cash flow.
