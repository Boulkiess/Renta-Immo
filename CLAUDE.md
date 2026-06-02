# CLAUDE.md

@AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**ImmoRenta** is a French real estate investment analysis tool built with React + Vite, running entirely in the browser. All code, comments and documentation are in English; only the French UI locale (`src/i18n/locales/fr.json` values) is in French.

## Commands

```bash
npm run dev      # Vite dev server (hot reload)
npm run build    # Production build → dist/
npm run preview  # Preview the production build
```

### Verification pipeline (clean code)

| Command                | Role                                                            | When                |
| ---------------------- | --------------------------------------------------------------- | ------------------- |
| `npm run format`       | Reformats all files with Prettier                               | Ad-hoc cleanup      |
| `npm run format:check` | Checks formatting without modifying (exit 1 on diff)            | CI                  |
| `npm run lint`         | ESLint report — errors block CI, warnings are informational     | CI / manual         |
| `npm run lint:fix`     | Auto-fixes the fixable ESLint problems                          | After adding files  |
| `npm run typecheck`    | `tsc --noEmit` (app: src/engine + src/state) then both packages | CI / manual         |
| `npm run test`         | Vitest: engine + package + component tests                      | CI / manual         |
| `npm run check`        | Full pipeline: format:check + lint + typecheck + test           | **Before every PR** |

The pre-commit hook (Husky) runs `npm run check` on every `git commit`.

Deployment: pushing to `main` triggers GitHub Actions → `quality` job (format:check + lint + typecheck) → `build` job → GitHub Pages.

## Before every commit

**Update `CHANGELOG.md`** under `[Unreleased]` before committing any change. Add a `### Fixed`, `### Added`, `### Changed`, or `### Removed` entry as appropriate.

**Keep `CLAUDE.md` in sync with the code.** If you modify formulas, parameters, data shapes, architecture, or any documented behavior, update the relevant sections of this file in the same commit. This file is the source of truth for the financial engine — it must reflect actual code, not past intentions.

## Architecture

```
npm workspaces — app at root, pure financial engine extracted to packages/engine

packages/
  engine/                @immo-renta/engine — pure financial engine, zero runtime deps
    package.json         name "@immo-renta/engine", type module, main src/index.js, types dist/index.d.ts
    tsconfig.json        checkJs + emitDeclarationOnly → generates dist/*.d.ts from JSDoc (npm run build:types)
    src/
      index.js          Public API barrel — the only import surface (re-exports compute.js)
      compute.js        Financial engine: compute(p,g), computeEtfScenario(g), computeEtfKpis(g), crossoverYear()
                        + exported helpers (testable): irr(), allowanceIncomeTax/SocialTax(), rentalTax(), annualSurplus(),
                          compound(), buildAmortization(), computeResale(), calcTRI(), calcVAN(), calcMoic()
                        JSDoc @typedef Globals (g) + SimParams (p) → typed public API in the emitted .d.ts
    __tests__/          Vitest: compute (ground-truth), golden-master + self-contained fixtures.js
                        (NO dependency on src/state — engine is standalone)
    dist/                Generated .d.ts (gitignored; built on demand / on prepack). NOT committed.
  engine-ts/             @immo-renta/engine-ts — TypeScript variant (POC, parallel to engine; app does NOT use it)
    src/{types,compute,index}.ts   1:1 port in native TS (interfaces, strict mode)
    tsconfig.json        compiles src → dist (.js + .d.ts + sourcemaps) via `npm run build -w @immo-renta/engine-ts`
    __tests__/parity.test.ts       imports BOTH engines, asserts TS output === JS output (matrix)
    dist/                Compiled output (gitignored). Required for this package's `main` (TS must build; JS ships src).

index.html              HTML shell — loads src/main.jsx via Vite
src/                     The web app. Imports the engine via `@immo-renta/engine` (workspace symlink).
  main.jsx              React entry point (ReactDOM.createRoot)
  App.jsx               Root component — theme provider, layout, tab routing
  state/
    AppContext.jsx       React context: sims, G (globals), dispatch actions
    definitions.js      mkDef(), GRP_COMMON/RENTAL/PRIMARY, field metadata
  engine/                App-side engine helpers (NOT the pure compute package above)
    charts.js           Canvas renderers: drawLine(), drawBars(), attachHover()
    utils.js            Formatters: fmtE(), fmtK(), fmtP(), fmtTRI()
    io.js               Export/import handlers (CSV, JSON, YAML) — coupled to state/definitions.js
    __tests__/          Vitest: io round-trip (imports compute from @immo-renta/engine)
  components/
    SimPanel/           Left-column simulation panel (sliders, KPI chips, mode switch)
    ChartArea/          Canvas chart wrappers (Charts, KPIs, Sale, Amortization tabs)
    GlobalStrip/        Global settings bar (personalRent, budget, regime, horizon…)
    NavBar/             Tab navigation (+ "?" trigger opening the DocPanel)
    Legend/             Simulation legend
    DocPanel/           Interactive documentation overlay (concept registry + generic card)
    common/             Shared UI atoms (+ useDraggableValue hook, CanvasChart)
  i18n/                 Translations (fr/en) — keys are English; fr values stay French
  theme/                Styled-components theme tokens
```

### Interactive documentation (DocPanel)

A "?" button in the NavBar opens a full-screen overlay documenting the engine's
formulas interactively. It is 100% client-side (the app stays strictly static —
no LLM, no API key, no backend).

- **`components/DocPanel/concepts.js`** — data registry. Each concept descriptor
  has `{ id, group, i18nKey, render: 'number'|'line'|'bars', inputs[], compute(vals, ctx) }`.
  **Every `compute` adapter calls the exported, pure engine helpers** (annuity,
  `buildAmortization`, `rentalTax`, `allowanceIncomeTax/SocialTax`, `computeResale`,
  `computeEtfScenario`, `irr`, `compound`) — the doc cannot drift from the app.
  Adapters are pure (no React/DOM) and unit-tested in `__tests__/concepts.test.js`.
- **`components/DocPanel/ConceptCard.jsx`** — one generic card renders every
  descriptor (sliders / regime select / editable flow vector → number or
  `CanvasChart`). Charts mount lazily (IntersectionObserver). Inputs seed from the
  live sim A via `ctx`; "reset to my simulation" re-seeds.
- **`components/DocPanel/DocPanel.jsx`** — overlay shell (table of contents + scrollable
  cards, Esc / backdrop close, responsive).
- i18n lives under the `doc.*` namespace (`doc.concepts.<id>.{title,body,code}`,
  `doc.groups.*`, `doc.inputs.*`, `doc.notes.*`, `doc.units.*`).

### Core data flow

1. **`AppContext`** (`state/AppContext.jsx`) — holds state for 3 concurrent simulations (A, B, C). Each sim has a `mode` (`'rental'` / `'primary'` / `'viager'`) and ~25 financial parameters from `mkDef()`, plus global settings `G`.
2. **`compute(p, g)`** (`packages/engine/src/compute.js`) — pure function: takes a simulation's parameters and globals, returns derived financials: monthly payments, 30-year cashflows, IRR at multiple horizons, NPV, net worth. This is the financial engine — touch it carefully.
3. **`computeEtfScenario(g)`** (`packages/engine/src/compute.js`) — pure function returning the 30-year ETF reference scenario array.
4. Charts and KPI tables call `compute()` and `computeEtfScenario()` on each render cycle.

### Key data shapes

- `p` (simulation params) — `{ mode, purchasePrice, notaryFees, renovationCosts, downPayment, interestRate, loanTerm, rent, … }` — see `mkDef()` in `definitions.js`
- `g` (globals) — `{ personalRent, personalRentGrowth, monthlyBudget, budgetGrowth, chargesGrowth, investSurplus, etfDownPayment, altReturn, discountRate, horizon, regime, inflation }`
- `compute()` return — `{ flows[30], monthlyCashFlow, monthlyPayment, monthlyInsurance, tri10/15/20, van, moic, resaleByYear[], … }`
- `flows[yr]` — `{ netCashFlow, cumulativeCashFlow, coc, effectiveRent, charges, annuity, tax, propertyValue, remainingCapital, netWorth, totalWorth, etfPocket, netResaleProceeds, resaleBalance, totalBalance, cashBalance, resalePrice }`

## Financial formulas

- **Loan payment**: standard annuity — `monthlyPayment = loanAmount × (r/12) / (1 − (1+r/12)^−n)`
- **IRR**: Newton-Raphson on cashflows `[-downPayment, CF1, ..., CFn + netResaleProceeds]`
- **ETF reference**: down payment invested upfront + annual surplus (budget − real outflows) compounding at `g.altReturn`
- **Tax** (`rentalTax()` + inline LMNP): LMNP (deductible interest + depreciation, loss carried over), Micro-BIC (50% flat allowance), bare ownership (`'nu'`, deductible interest)
- **Capital gains**: rental only, with progressive allowances (income tax exempt after 22 years, social tax exempt after 30 years); primary residence fully exempt
- **Total worth**: property equity (property value − remaining capital) + ETF pocket accumulated from the monthly surplus
- **Primary-residence cash flow**: `netCashFlow = -(charges + annuity + insurance)` — real outflows only, never positive. The rent not spent is NOT a cash flow.

---

## Full input parameters

### Globals (`g` / `G` in the state)

| Key                  | Type                           | Default  | Description                                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `regime`             | `'lmnp' \| 'microbic' \| 'nu'` | `'lmnp'` | Rental tax regime (global, applies to the 3 sims). `'nu'` = bare ownership.                                                                                                                                                                                                        |
| `horizon`            | years (1–30)                   | `20`     | Calculation horizon for NPV and MOIC                                                                                                                                                                                                                                               |
| `discountRate`       | %                              | `3`      | Discount rate for NPV                                                                                                                                                                                                                                                              |
| `altReturn`          | %                              | `6`      | Return of the alternative (ETF) investment                                                                                                                                                                                                                                         |
| `personalRent`       | €/month                        | `900`    | Personal rent paid every month                                                                                                                                                                                                                                                     |
| `personalRentGrowth` | %                              | `2`      | Annual revaluation of the personal rent                                                                                                                                                                                                                                            |
| `monthlyBudget`      | €/month                        | `2500`   | Available monthly budget (used to compute the ETF surplus)                                                                                                                                                                                                                         |
| `budgetGrowth`       | %                              | `0`      | Annual budget revaluation (salary raises)                                                                                                                                                                                                                                          |
| `chargesGrowth`      | %                              | `2`      | Annual revaluation of fixed charges (property tax, condo, insurance, reserves)                                                                                                                                                                                                     |
| `investSurplus`      | boolean                        | `true`   | Reinvest the monthly surplus into the ETF                                                                                                                                                                                                                                          |
| `etfDownPayment`     | €                              | `60 000` | Hypothetical capital invested in the ETF reference scenario                                                                                                                                                                                                                        |
| `inflation`          | %                              | `2`      | Inflation. Drives the real indicators (real IRR, real wealth) and the curve deflation via `displayReal`. Not used by the nominal engine (`compute()`).                                                                                                                             |
| `displayReal`        | boolean                        | `false`  | Nominal / Real display. If `true`: deflates the ChartsTab and ReventeTab curves to constant euros (`value / (1+inflation/100)^year`) and flips the nominal↔real emphasis in the KPI / SummaryCards tables. Affects neither `compute()` (always nominal) nor the Sale detail table. |

### Per simulation (`p`) — Common to `rental` and `primary`

| Key               | Type                                | Default   | Description                                            |
| ----------------- | ----------------------------------- | --------- | ------------------------------------------------------ |
| `mode`            | `'rental' \| 'primary' \| 'viager'` | —         | Simulation mode                                        |
| `purchasePrice`   | €                                   | `250 000` | Property purchase price                                |
| `notaryFees`      | €                                   | `20 000`  | Notary fees                                            |
| `renovationCosts` | €                                   | `15 000`  | Renovation works amount                                |
| `agencyFees`      | €                                   | `0`       | Buyer's agent fees                                     |
| `loanFees`        | €                                   | `0`       | File & broker fees (included in `totalCost`)           |
| `downPayment`     | €                                   | `50 000`  | Personal down payment                                  |
| `interestRate`    | %                                   | `3.85`    | Annual loan interest rate                              |
| `loanTerm`        | years (5–30)                        | `20`      | Loan duration                                          |
| `insuranceRate`   | %                                   | `0.25`    | Annual borrower insurance rate (on borrowed capital)   |
| `propertyGrowth`  | %                                   | `2.0`     | Annual property appreciation                           |
| `sellingFees`     | %                                   | `4`       | Selling fees (agent, diagnostics…) on the resale price |

### Per simulation (`p`) — `rental` mode only

| Key                         | Type    | Default | Description                                                |
| --------------------------- | ------- | ------- | ---------------------------------------------------------- |
| `rent`                      | €/month | `1 000` | Gross monthly rent                                         |
| `vacancyRate`               | %       | `5`     | Rental vacancy rate                                        |
| `propertyTax`               | €/yr    | `1 200` | Property tax                                               |
| `condoFees`                 | €/yr    | `800`   | Co-ownership (HOA) charges                                 |
| `landlordInsurance`         | €/yr    | `200`   | Non-occupying-owner insurance                              |
| `managementFees`            | %       | `7`     | Property management fees (% of gross annual rent)          |
| `maintenanceReserve`        | €/yr    | `500`   | Reserve for works / unexpected vacancy                     |
| `rentGrowth`                | %       | `1.5`   | Annual rent revaluation                                    |
| `marginalTaxRate`           | %       | `30`    | Marginal income tax rate                                   |
| `socialCharges`             | %       | `17.2`  | Social contributions on rental income                      |
| `propertyDepreciation`      | %       | `2.5`   | Annual accounting depreciation of the property (LMNP real) |
| `renovationDepreciation`    | %       | `10`    | Annual accounting depreciation of the works (LMNP real)    |
| `capitalGainsTax`           | %       | `19`    | Capital-gains income-tax rate                              |
| `capitalGainsSocialCharges` | %       | `17.2`  | Social contributions on the capital gain                   |

### Per simulation (`p`) — `primary` mode only

| Key                         | Type | Default | Description                    |
| --------------------------- | ---- | ------- | ------------------------------ |
| `propertyTaxPrimary`        | €/yr | `1 200` | Property tax (primary)         |
| `condoFeesPrimary`          | €/yr | `1 200` | Co-ownership charges (primary) |
| `homeInsurance`             | €/yr | `300`   | Home insurance                 |
| `maintenanceReservePrimary` | €/yr | `500`   | Reserve for works (primary)    |

### Per simulation (`p`) — `viager` mode only (viager occupé)

| Key                  | Type    | Default   | Description                                                                                   |
| -------------------- | ------- | --------- | --------------------------------------------------------------------------------------------- |
| `marketValue`        | €       | `250 000` | Free (vacant) market value — the resale value the décote amortizes toward                     |
| `occupationDiscount` | %       | `35`      | Décote d'occupation at year 0. Amortizes linearly to 0 by `expectedDuration`. Capped `< 100`. |
| `bouquet`            | €       | `50 000`  | Upfront lump at signing. Plays `purchasePrice`'s role (the financed price component).         |
| `monthlyAnnuity`     | €/month | `800`     | Rente viagère paid to the seller until death                                                  |
| `annuityGrowth`      | %       | `2`       | Annual revaluation (indexation) of the rente                                                  |
| `expectedDuration`   | years   | `15`      | Seller's expected remaining lifespan = occupation + annuity-paying years. Clamped `≥ 1`.      |
| `ownerCharges`       | €/yr    | `1 500`   | Owner-borne charges (taxe foncière, gros travaux) — all years                                 |
| `ownerChargesGrowth` | %       | `2`       | Annual revaluation of the owner charges                                                       |

**Viager occupé model (buyer = débirentier).** No rental income (the seller occupies). The
bouquet is the t0 price paid (financed by the existing `downPayment`/loan machinery:
`loanAmount = max(0, bouquet + notaryFees − downPayment)`; set `downPayment = bouquet + notaryFees`
for an all-cash viager). The rente is the deferred price, paid as a parallel outflow that
**stops at `expectedDuration`** (unlike a loan, which runs `loanTerm`). The **décote amortizes
linearly to zero** by `expectedDuration` — `occupiedValue(yr) = marketValue × (1 − occupationDiscount × max(0,(ED−yr)/ED) / 100)`,
so `propertyValue`/`resalePrice = occupiedValue(yr) × (1+propertyGrowth)^yr` rises **smoothly** to
the full market value by the death year (no step). You own the bien from signing, so an early resale
is a real (occupied) sale at this amortized value. `netCashFlow = −(ownerCharges + rente + loanAnnuity) − personalRent`
(always ≤ 0; personal rent reintegrated in the IRR/NPV flows like rental — the investor still
rents elsewhere). The rente is bundled into `flows[].charges` so `netCashFlow` reconciles with
the charges + annuity columns. Resale: cost basis `= bouquet + Σrente-to-date + notaryFees`
(nominal — ⚠️ documented simplification, the real CGI uses the capitalised rente value), and the
gain is taxed with the same progressive allowances as a rental resale (a viager resale is **not**
exempt). `computeViagerResale()` and `computeViagerBand()` (a ±5-year sensitivity readout on
totalWorth/cashBalance, exposed for the UI) live in `compute.js`. The "Monthly payment" KPI chip
adds `monthlyAnnuity` to the loan payment so a bouquet-only viager does not display €0.

**Remaining viager simplifications (do not change without an explicit decision):**

- Deterministic single `expectedDuration` (plus the ±5y band); no mortality table / barème, no
  early/expected/late scenario mode, no viager libre, no rente réversibilité.
- Cost basis is the nominal sum of rente paid, not the capitalised rente value (art. CGI).
- The décote is a direct % input (not derived from a DUH/age valuation).

---

## Computed metrics and exact formulas

All formulas below are implemented in `packages/engine/src/compute.js`. ✅ = verified correct, ⚠️ = documented simplification.

### Cost and loan

```
totalCost          = purchasePrice + notaryFees + renovationCosts + agencyFees + loanFees   ✅ total acquisition cost
loanAmount         = max(0, totalCost − downPayment)                                         ✅ borrowed amount
investedDownPayment = min(downPayment, totalCost)                                            ✅ capital tied up in the property
etfSeed            = investSurplus ? max(0, downPayment − totalCost) : 0                      ✅ remainder invested in ETF
totalDownPayment   = investedDownPayment + etfSeed                                           ✅ total starting stake
```

**`investedDownPayment` (capped capital)**: a down payment that exceeds `totalCost` (over-funded cash purchase) leaves a cash remainder. Beyond `totalCost` the loan is already zero; that remainder is not part of the property return. The **operational** metrics — `netWorth`, `resaleBalance`, `cashBalance`, the `coc`/`MOIC` denominator, the initial IRR/NPV flow — use **`investedDownPayment`**, never `p.downPayment`.

**`etfSeed` (remainder → ETF)**: if the `investSurplus` toggle is on, the remainder `max(0, downPayment − totalCost)` is invested in the ETF pocket from year 0 (`etfCapital` starts at `etfSeed` instead of 0) and compounds at `altReturn` like `etfDownPayment`. Otherwise it stays as cash outside the model (`etfSeed = 0`). The **total wealth** metrics that include the ETF pocket — `totalWorth` (gross) and `totalBalance` (`netResaleProceeds + etfCapital − totalDownPayment`) — therefore reflect this compounded remainder, with `totalDownPayment` as the starting stake. Consequence: beyond `totalCost` the operational metrics are frozen; only `totalWorth`/`totalBalance` move, and only if the remainder is actually invested.

### Monthly loan payment (constant annuity) ✅

```
rM             = interestRate / 100 / 12   (monthly rate)
nM             = loanTerm × 12             (number of payments)
monthlyPayment = loanAmount × rM / (1 − (1+rM)^−nM)   if loanAmount>0 and rM>0
               = loanAmount / nM                       if rM = 0 (interest-free loan)
```

### Borrower insurance ✅

```
monthlyInsurance = loanAmount × (insuranceRate/100) / 12     (fixed, on initial capital)
```

Note: insurance is computed on the initial capital (not the outstanding balance), matching group-insurance practice.

### Amortization schedule (monthly) ✅

For each month m = 1..nM:

```
interest[m]   = balance[m-1] × rM
principal[m]  = max(0, monthlyPayment − interest[m])
balance[m]    = max(0, balance[m-1] − principal[m])
```

Derived KPIs:

```
totalInterest  = Σ interest[m]              (total interest cost)
totalInsurance = Σ monthlyInsurance         (total insurance cost = monthlyInsurance × nM)
```

### Annual rents (`rental` mode) ✅

```
grossRent     = rent × 12 × (1 + rentGrowth/100)^(yr−1)   (gross annual rent, year yr)
effectiveRent = grossRent × (1 − vacancyRate/100)          (effective rent after vacancy)
```

### Annual charges (`rental` mode) ✅

```
chargesFactor = (1 + chargesGrowth/100)^(yr−1)             (annual revaluation factor)
charges = (propertyTax + condoFees + landlordInsurance + maintenanceReserve) × chargesFactor + grossRent × (managementFees/100)
```

Note: management fees are computed on the **gross** rent (grossRent), not the effective rent — standard agency practice. The fixed charges grow with `chargesGrowth`; the management fees grow mechanically with the gross rent.

### Annual charges (`primary` mode) ✅

```
chargesFactor = (1 + chargesGrowth/100)^(yr−1)
charges = (propertyTaxPrimary + condoFeesPrimary + homeInsurance + maintenanceReservePrimary) × chargesFactor
```

### Rental income tax — `rentalTax()` ✅

Regime 'lmnp' (LMNP real) — inline calculation in the annual loop with loss carry-over:

```
annualInterest[yr] = Σ amortization[m].interest  for m ∈ [(yr−1)×12, yr×12)   (deductible annual interest)
buildingDepreciation = purchasePrice × (propertyDepreciation/100),  worksDepreciation = renovationCosts × (renovationDepreciation/100)

taxableRaw = effectiveRent − charges − buildingDepreciation − worksDepreciation − annualInterest − depreciationCarry
taxable    = max(0, taxableRaw)
depreciationCarry_new = taxableRaw < 0 ? −taxableRaw : 0       (surplus carried to the next year)
tax = taxable × (marginalTaxRate + socialCharges) / 100
```

Regimes 'microbic' and 'nu' — via `rentalTax()`:

```
Micro-BIC      : taxable = max(0, effectiveRent × 0.50)                   (50% allowance, non-classified furnished)
Bare ownership : taxable = max(0, effectiveRent − charges − annualInterest)   (deductible interest)

tax = taxable × (marginalTaxRate + socialCharges) / 100
```

**Remaining simplification (do not change without an explicit decision):**

- Micro-BIC is coded at 50% allowance: the rate of **non-classified** furnished. **Classified-tourism** furnished gets 71%. Not implemented.
- For bare ownership, the property loss deductible against global income (up to €10,700/yr) is not modeled (needs the user's global income, out of scope).

### Annual cash flow ✅

**`rental` mode:**

```
personalRentAnnual = personalRent × 12 × (1 + personalRentGrowth/100)^(yr−1)
netCashFlow = effectiveRent − charges − (monthlyPayment×12) − (monthlyInsurance×12) − personalRentAnnual − tax
cumulativeCashFlow = Σ netCashFlow[1..yr]
```

**`primary` mode:**

```
netCashFlow = −(charges + monthlyPayment×12 + monthlyInsurance×12)     (always negative)
cumulativeCashFlow = Σ netCashFlow[1..yr]
effectiveRent = personalRentAnnual    (saved rent, displayed but not counted in netCashFlow)
```

`annuity` in `flows[]` = `monthlyPayment×12 + monthlyInsurance×12` (total annuities + insurance).

### Surplus and ETF pocket ✅

```
realOutflow   = −netCashFlow                                         (rental: real net outflows)
              = charges + monthlyPayment×12 + monthlyInsurance×12    (primary)
annualBudget  = monthlyBudget×12 × (1 + budgetGrowth/100)^(yr−1)     (budget revalued each year)
budgetSurplus = max(0, annualBudget − realOutflow)
etfCapital[yr] = etfCapital[yr-1] × (1 + altReturn/100) + (investSurplus ? budgetSurplus : 0)
```

`etfCapital` starts at `etfSeed` in `compute()` — either 0 (normal case: the down payment is invested in the property) or the down-payment remainder beyond `totalCost` when `investSurplus` is on (cf. § "Cost and loan").

### Property value and resale ⚠️

```
propertyValue = purchasePrice × (1 + propertyGrowth/100)^yr                   (value shown in the wealth charts)
resalePrice   = (purchasePrice + renovationCosts) × (1 + propertyGrowth/100)^yr   (effective resale price)
```

**Documented asymmetry**: `propertyValue` excludes works, `resalePrice` includes them. The equity shown in the charts (`propertyValue − remaining`) is therefore lower by `renovationCosts × (1+r)^yr` than the real sale proceeds. This is not a bug: `propertyValue` is the value of the bare asset, `resalePrice` is the negotiated price accounting for improvements. Always use `netResaleProceeds` (computed from `resalePrice`) for any financial sale calculation.

```
sellingFee = resalePrice × (sellingFees/100)                       (selling fee)
grossGain  = max(0, resalePrice − purchasePrice − renovationCosts) (gross capital gain)

Progressive allowances (art. 150 VC CGI) — 'rental' mode only:
  allowanceIR(yr) = 0          if yr ≤ 5
                  = (yr−5) × 6  if 6 ≤ yr ≤ 21          (6 %/yr → 96 % at year 21)
                  = 100         if yr ≥ 22               (full income-tax exemption)

  allowancePS(yr) = 0                       if yr ≤ 5
                  = (yr−5) × 1.65           if 6 ≤ yr ≤ 21   (1.65 %/yr)
                  = 26.4 + 1.6 = 28.0       if yr = 22
                  = 28.0 + (yr−22) × 9      if 23 ≤ yr ≤ 30   (9 %/yr)
                  = 100                      if yr > 30        (full social-tax exemption)

capitalGainsTax_amount = grossGain × (capitalGainsTax × (1 − allowanceIR/100) + capitalGainsSocialCharges × (1 − allowancePS/100)) / 100   if mode='rental'
                       = 0                                                                                                                   if mode='primary'
netResaleProceeds = resalePrice − remainingCapital − sellingFee − capitalGainsTax_amount                ✅
```

**Note:** For a holding of 22 years or more, income tax on the gain is zero. After 30 years, social tax is also zero → capitalGainsTax_amount = 0.

### Resale balances ✅

```
resaleBalance = netResaleProceeds + cumulativeCashFlow − investedDownPayment   (net operational gain: sale + gross cumulative flows − stake in the property)
totalBalance  = netResaleProceeds + etfCapital − totalDownPayment              (net global gain: sale + accumulated ETF − total starting stake)
cashBalance   = netResaleProceeds + irrCumulative − investedDownPayment        (net cash gain, IRR/NPV basis: irrCumulative = Σ(netCashFlow + personalRentAnnual))
```

Note: these balances subtract `investedDownPayment` (capital in the property), except `totalBalance` which subtracts `totalDownPayment` (property capital + ETF remainder) because its `etfCapital` includes the invested remainder — cf. § "Cost and loan". In the normal case `downPayment ≤ totalCost`, `investedDownPayment = totalDownPayment = downPayment`: these formulas reduce to `− downPayment`.

`resaleBalance` assumes the positive flows stay as cash (**gross** flows `cumulativeCashFlow`, personal rent included as a cost). `totalBalance` assumes they are reinvested in the ETF (via the surplus mechanism). Both metrics are shown in **KpisTab** (Wealth section) at the chosen horizon.

`cashBalance` uses the **same adjusted flows as IRR/NPV/MOIC** (`irrCumulative = Σ(netCashFlow + personalRentAnnual)` — the personal rent is reintegrated: a sunk cost neutralized in rental, a saved rent credited in primary). Unlike `resaleBalance`, its zero-crossing is interpretable as "minimum holding period to not lose money (nominal, excluding opportunity cost)". Drawn in the 2nd chart of **ReventeTab** with a vertical annotation per sim at the break-even year. ⚠️ **Nominal** metric: ignores inflation and opportunity cost (an ETF can outperform even when `cashBalance ≥ 0`).

### Cash-on-cash return ✅

```
coc[yr] = netCashFlow[yr] / downPayment × 100   (% annual, null if downPayment = 0)
```

Gross annual return of the net flow on the invested capital. Available in `flows[yr].coc`. Unlike IRR, it ignores time and resale value — it is the pure operational return of the year.

### Wealth ✅

```
netWorth   = propertyValue − remainingCapital + cumulativeCashFlow − downPayment    (net wealth: property equity + cumulative flows − down payment)
totalWorth = (propertyValue − remainingCapital) + etfCapital                        (gross wealth: equity + ETF pocket, without subtracting the down payment)
```

`totalWorth` does not subtract the down payment because it is compared with `etfScenarioGlobal.cap` which also includes the initial contribution. Note: `etfDownPayment` is a single global parameter whereas each simulation has its own `p.downPayment` — if they differ, the comparison is not at iso-capital.

### Pure ETF scenario — `computeEtfScenario(g)` ⚠️

```
cap[0]      = etfDownPayment
pra[yr]     = personalRent × 12 × (1 + personalRentGrowth/100)^(yr−1)
annualBudget = monthlyBudget × 12 × (1 + budgetGrowth/100)^(yr−1)
surplus     = max(0, annualBudget − pra[yr])
cap[yr]     = cap[yr−1] × (1 + altReturn/100) + surplus
```

Represents the alternative: invest the down payment in ETF and place the monthly surplus after paying the rent.

The function returns two values per year:

- `cap`: gross value (tax-free compounding) — used in ChartsTab (wealth), KpisTab, crossover, export
- `capNet`: net value after **30% PFU on the capital gain** (`capNet = cap − max(0, cap − totalContribs) × 0.30`) — used only in **ReventeTab** (chart + table hover)

**Remaining simplifications:**

- Rate fixed at 30% flat (PFU CTO) — no PEA 17.2% / CTO 30% distinction
- No annual tax (correct for a capitalizing ETF: taxation only on sale)
- The crossover compares immo `totalWorth` (gross, before sale tax) with ETF `cap` (gross) — intentional consistency; only ReventeTab uses `capNet`

### Pure ETF column — KpisTab ✅

The Comparison tab table shows a **Pure ETF** column to the right of the simulation columns. The financial ETF KPIs (IRR/NPV/MOIC) are computed **in `packages/engine/src/compute.js` via `computeEtfKpis(g)`** (moved from the component into the engine to sit under the golden-master). `KpisTab/index.jsx` calls `computeEtfKpis(G)` and passes the result to `buildSections()`. The simple rows (yield, CF) stay derived from `G` in `kpiSections.js`.

#### Yields & Cash-flow

| Row            | ETF value       | Formula                                                                    |
| -------------- | --------------- | -------------------------------------------------------------------------- |
| Gross yield    | `altReturn`     | Assumed ETF return, gross = net (no charges)                               |
| Net yield      | `altReturn`     | Same — shown as `%` via `fmtP`                                             |
| Real CF/mo     | `−personalRent` | Only monthly outflow of the ETF scenario: the rent paid                    |
| Monthly effort | `0`             | The pure ETF is the renter reference situation — zero effort by definition |

#### IRR / NPV / MOIC

**ETF IRR (all horizons) — exact value, not approximated:**

```
IRR_ETF = altReturn / 100
```

Proof: the ETF flows are `[−etfDownPayment, −S₁, …, −S_{n−1}, cap[n]−Sₙ]` where `cap[n] = etfDownPayment×(1+r)ⁿ + Σ Sₖ×(1+r)^{n−k}`. The NPV of these flows at rate `r = altReturn` cancels algebraically for any surplus `Sₖ`. So IRR₁₀ = IRR₁₅ = IRR₂₀ = `altReturn` regardless of the surplus.

```
IRR_real_ETF = (1 + altReturn/100) / (1 + inflation/100) − 1
```

**ETF NPV:**

```
budgetSurplus[t] = max(0, monthlyBudget×12×(1+budgetGrowth/100)^{t−1} − personalRent×12×(1+personalRentGrowth/100)^{t−1})

NPV_ETF = −etfDownPayment
        + Σ_{t=1}^{horizon} (−budgetSurplus[t]) / (1+discountRate/100)^t
        + cap[horizon] / (1+discountRate/100)^{horizon}
```

If `discountRate = altReturn`, NPV = 0. If `discountRate < altReturn`, NPV > 0 (ETF outperforms the discount rate).

**ETF MOIC:**

```
MOIC_ETF = (cap[horizon] − Σ_{t=1}^{horizon} budgetSurplus[t]) / etfDownPayment
```

Analogous to the sim MOIC: `(terminal_value + Σ_operational_flows) / initial_down_payment`. Here the operational flows are `−budgetSurplus[t]` (annual contributions). If surplus = 0: MOIC = `(1 + altReturn/100)^{horizon}`.

#### Wealth

| Row                           | ETF value                                              |
| ----------------------------- | ------------------------------------------------------ |
| Net wealth at horizon         | `—` (real-estate metric with no direct ETF equivalent) |
| Total wealth at horizon       | `etfScenarioGlobal[hz−1].cap`                          |
| Real total wealth at horizon  | `cap[hz] / (1+inflation/100)^{hz}`                     |
| Total wealth at 30 years      | `etfScenarioGlobal[29].cap`                            |
| Real total wealth at 30 years | `cap[30] / (1+inflation/100)^{30}`                     |
| Resale break-even             | `—` (real-estate metric with no direct ETF equivalent) |
| Crossover                     | `—`                                                    |

### Crossover ✅

```
crossover = first year yr such that totalWorth[yr] ≥ etfScenarioGlobal[yr].cap
```

If `investSurplus = false`, returns `null` (the comparison is meaningless since the surpluses are not capitalized).

### IRR — Newton-Raphson ✅

**Flows (rental and primary):** `[−downPayment, netCashFlow[1]+personalRentAnnual[1], …, netCashFlow[horizon]+personalRentAnnual[horizon] + netResaleProceeds[horizon]]`

- **rental mode**: `personalRentAnnual` is reintegrated into the flows — the personal rent is a sunk cost incurred regardless of the investment, not a cost of the investment itself.
- **primary mode**: `personalRentAnnual` is added as a benefit — it is the rent saved by buying the primary residence.

Both modes therefore use the same flow formula, which makes IRR and NPV comparable between rental and primary.

```
NPV(r)  = Σ_{t=0}^{n} flows[t] / (1+r)^t = 0
NPV'(r) = Σ_{t=1}^{n} (−t × flows[t]) / (1+r)^{t+1}
r_{k+1} = r_k − NPV(r_k) / NPV'(r_k)     (Newton-Raphson)
```

Returns `null` on non-convergence in 100 iterations, if `|NPV'| < 1e-15`, or if `r < −1`. Starting point: `r₀ = 0.10` (10 %).

Computed for horizons 10, 15 and 20 years: `tri10`, `tri15`, `tri20`.

### NPV ✅

```
NPV = −downPayment + Σ_{t=1}^{horizon} f[t]/(1+discountRate/100)^t + netResaleProceeds[horizon]/(1+discountRate/100)^{horizon}

where f[t] = netCashFlow[t] + personalRentAnnual[t]   (same flows as IRR — cf. IRR section above)
```

**Remark**: the flows used for NPV are identical to those of the IRR. In rental mode, `personalRentAnnual` is reintegrated (sunk cost incurred regardless of the investment). In primary mode, `personalRentAnnual` is added as a benefit (rent saved by buying). Both modes thereby measure the pure return of the investment on a comparable basis.

### MOIC ✅

```
irrCumulative = Σ_{t=1}^{horizon} irrFlows[t]    (same adjusted flows as IRR/NPV)
MOIC          = (netResaleProceeds[horizon] + irrCumulative) / downPayment
```

Multiple on Invested Capital — how many times the down payment has been multiplied. Uses the adjusted flows (`personalRentAnnual` excluded/added depending on mode) to be consistent with IRR and NPV.

### Yields (`rental` mode) ✅

```
grossYield = (rent × 12 / totalCost) × 100                                       (% of total acquisition cost)
netYield   = (rent × (1−vacancyRate/100) × 12 − chargesYr0) / totalCost × 100
  where chargesYr0 = propertyTax + condoFees + landlordInsurance + maintenanceReserve + rent×12×(managementFees/100)
```

Computed on **year-0** values (not revalued). Static indicators.

### Displayed monthly cash flow — `monthlyCashFlow` ⚠️

```
rental mode  : monthlyCashFlow = rent − monthlyPayment − monthlyInsurance − personalRent   (excludes operational charges!)
primary mode : monthlyCashFlow = personalRent − monthlyPayment − monthlyInsurance          (differential vs. staying a renter)
```

**Warning**: `monthlyCashFlow` is a simplified indicator **not shown in the SimPanel KPI chips** (replaced by `netCashFlow[yr=1]/12`). It is kept in `compute()` for KpisTab and io.js. It does **not** include propertyTax, condoFees, landlordInsurance, managementFees, maintenanceReserve, nor tax. Do not use `monthlyCashFlow` in financial calculations.

### SimPanel KPI chips (unified rental/primary)

The 4 chips shown in each SimPanel header are identical for rental and primary modes:

| Chip            | Formula                                         | Color                           |
| --------------- | ----------------------------------------------- | ------------------------------- |
| Monthly payment | `r.monthlyPayment + r.monthlyInsurance`         | sim color                       |
| Real CF/mo      | `r.flows[0].netCashFlow / 12`                   | red if < 0, sim color otherwise |
| Effort/mo       | `−r.flows[0].netCashFlow / 12 − G.personalRent` | red if > 0, sim color otherwise |
| Wealth Xy       | `r.flows[G.horizon−1].totalWorth`               | sim color                       |

**Effort/mo** = monthly extra cost vs. the current situation (renting at `personalRent`). Positive = you spend more than today. Negative = the investment is cheaper than your current situation. Unified formula valid for rental and primary. Redundant with Real CF/mo only when `personalRent = 0`.

`grossYield`, `netYield`, `monthlyCashFlow`, `crossover` are no longer shown in the SimPanel — still computed by `compute()` and available in KpisTab and io.js.

### Break-even ✅

```
breakEven = first year yr such that cumulativeCashFlow[yr] ≥ 0
```

Indicates when the cumulative operational flows turn positive (excluding the property value). Returns `null` if never reached in 30 years.

### Resale break-even ✅

```
resaleBreakEven = first year yr such that cashBalance[yr] ≥ 0
```

Minimum holding period for the resale not to be a loss (nominal, IRR/NPV basis including the personal/saved rent — cf. `cashBalance`). Includes purchase and sale fees. Shown in **KpisTab** (Wealth section) and as an annotation of the 2nd chart of **ReventeTab**. Returns `null` if never reached in 30 years. Differs from `breakEven` (which includes neither the resale nor the personal rent).

---

## Invariants and rules to respect

- **`compute()` is a pure function**: never introduce side effects or state.
- **`flows[]` is 0-based**: `flows[0]` = year 1, `flows[yr-1]` = year yr.
- **`amortization[]` is monthly**: `amortization[m-1]` = month m. For year yr, the end-of-year outstanding capital is `amortization[yr×12 - 1].remaining`.
- **`etfCapital` starts at `etfSeed`** in `compute()` (0 in the normal case, never `etfDownPayment`). `etfSeed > 0` only when `downPayment > totalCost` AND `investSurplus` is on — the down-payment remainder is then invested in ETF (cf. § "Cost and loan").
- **Over-funded down payment**: `investedDownPayment = min(downPayment, totalCost)` for the operational metrics; `totalDownPayment = investedDownPayment + etfSeed` for `totalBalance`. Never use raw `p.downPayment` in the engine — always one of these two capped quantities.
- **`netResaleProceeds` uses `resalePrice` (with works)**, not `propertyValue` (without works). Never substitute.
- **primary: `netCashFlow` is always ≤ 0**, the saved rent is stored in `effectiveRent` for display but does not enter `netCashFlow`.
- The **residual value of the outstanding capital** after the loan term is 0: `amortization[nM-1].remaining ≈ 0`.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:

- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
