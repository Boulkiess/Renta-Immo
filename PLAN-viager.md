<!-- /autoplan restore point: /Users/fabien.tribel/.gstack/projects/Boulkiess-Renta-Immo/main-autoplan-restore-20260602-143425.md -->

# PLAN — Viager (life annuity) investment mode

Status: DRAFT (pre-review)
Branch: main
Scope decisions (confirmed with user):

- **Viager occupé only** (seller keeps occupancy; no rental income until death; price decoted by occupation).
- **Deterministic expected-duration model** (user inputs the seller's expected remaining lifespan; engine stays deterministic exactly like `rental`/`primary`). No mortality table, no scenario spread — those are explicitly deferred.

## Problem

ImmoRenta compares real-estate strategies (`rental`, `primary`) against an ETF
reference. Viager occupé is a distinct acquisition structure — bouquet + lifetime
annuity (rente) on an occupied, discounted property — that today cannot be modeled.
A buyer evaluating a viager cannot use the tool to compare it against a classic
rental or against the ETF benchmark.

## Goal

Add `mode: 'viager'` as a third simulation mode, reusing the existing engine shape
(`compute(p, g)`, `mkDef`, `getGroups`, KPI chips, charts, ETF crossover) so viager
sims sit side by side with rental/primary in the A/B/C comparison.

## Domain model (viager occupé, buyer = débirentier)

The buyer pays a **bouquet** (upfront lump) plus a **rente** (monthly annuity) to the
seller until death. The property is **occupied** by the seller, so the buyer earns
**no rental income** during the occupation period. The purchase price is the
**occupied value** = market value minus an **occupation discount** (décote).

### New per-sim parameters (`mode: 'viager'`)

| Key                  | Type    | Default | Description                                                              |
| -------------------- | ------- | ------- | ------------------------------------------------------------------------ |
| `marketValue`        | €       | 250000  | Free-market (vacant) value of the property                               |
| `occupationDiscount` | %       | 35      | Décote d'occupation → occupied value = marketValue × (1 − discount/100)  |
| `bouquet`            | €       | 50000   | Upfront lump paid at signing                                             |
| `monthlyAnnuity`     | €/month | 800     | Rente viagère paid to the seller                                         |
| `annuityGrowth`      | %       | 2       | Annual revaluation (indexation) of the rente                             |
| `expectedDuration`   | years   | 15      | Seller's expected remaining lifespan = occupation + annuity-paying years |
| `ownerCharges`       | €/yr    | 1500    | Owner-borne charges during occupation (taxe foncière, gros travaux)      |
| `ownerChargesGrowth` | %       | 2       | Revaluation of owner charges (reuses `chargesGrowth` semantics)          |

Reused common params (already in `GRP_COMMON`): `notaryFees`, `propertyGrowth`,
`sellingFees`, and optionally `downPayment`/`interestRate`/`loanTerm` **only if** the
bouquet is financed (default: no loan — viager is typically cash bouquet + income rente).

### Derived quantities (new branch in `compute`)

```
occupiedValue   = marketValue × (1 − occupationDiscount/100)
notaryBase      = occupiedValue                         # notary fees on the price actually paid
totalCost       = occupiedValue + notaryFees            # acquisition cost basis
investedCapital = bouquet                               # the débirentier's stake (downPayment analog)
```

Annuity stream (stops at death, unlike a loan that runs `loanTerm`):

```
renteAnnual[yr] = monthlyAnnuity × 12 × (1 + annuityGrowth/100)^(yr−1)   for yr ≤ expectedDuration
                = 0                                                       for yr >  expectedDuration
```

Owner charges (the débirentier bears taxe foncière + gros travaux throughout; the
projection simply continues past death — there is no separate "vacant charges" input):

```
ownerChargesAnnual[yr] = ownerCharges × (1 + ownerChargesGrowth/100)^(yr−1)   for all yr
```

Annual cash flow (always ≤ 0 like `primary`; personal rent reintegrated like `rental`
because the investor still rents their own home):

```
netCashFlow[yr] = −(renteAnnual[yr] + ownerChargesAnnual[yr] + loanAnnuity[yr]) − personalRentAnnual[yr]
```

Property value unlock at death (the defining viager event):

```
propertyValue[yr] = occupiedValue × (1 + propertyGrowth/100)^yr   for yr ≤ expectedDuration
                  = marketValue   × (1 + propertyGrowth/100)^yr   for yr >  expectedDuration   # décote lifts at death
resalePrice[yr]   = same step function, used for netResaleProceeds
```

Capital-gains cost basis (for resale tax): reuse the rental allowance machinery with

```
costBasis = bouquet + Σ renteAnnual[1..min(yr, expectedDuration)] + notaryFees
grossGain = max(0, resalePrice[yr] − costBasis)
```

(Simplification flag: real viager CGI treatment of the rente capital is more nuanced;
documented as a known simplification, same posture as the existing Micro-BIC note.)

IRR / NPV / MOIC flows (same structure as today, `investedCapital = bouquet` as the
year-0 outflow):

```
flows = [ −(bouquet + notaryFees),
          netCashFlow[1] + personalRentAnnual[1],
          ...,
          netCashFlow[H] + personalRentAnnual[H] + netResaleProceeds[H] ]
```

## Files to change

> **Correction after review:** the original "reuse `compute`/`computeResale`/charts
> unchanged, just add a branch" claim is wrong on three load-bearing paths. The mode
> dispatch is binary today (`if rental … else /*primary*/`), `computeResale()` is
> hardwired to `purchasePrice + renovationCosts` and taxes gains only for rental, and
> the "Monthly payment" KPI chip reads the loan, which is €0 for a bouquet-only viager.
> Each is now an explicit work item.

1. `packages/engine/src/compute.js`
   - **3-way dispatch (CRITICAL):** convert the binary `if (mode==='rental'){…} else {…}`
     to `if rental / else if primary / else if viager`, with a `default: throw` so an
     unknown mode never silently runs as primary.
   - **Parameterize `computeResale()` (CRITICAL):** it currently hardwires
     `resalePrice = (purchasePrice + renovationCosts)×g^yr`, cost basis on the same, and
     taxes gains only when `mode==='rental'`. Viager needs the value-step
     (`occupiedValue → marketValue` at `expectedDuration`), cost basis
     `bouquet + Σrente + notaryFees`, and gains taxed (viager resale is taxable, like
     rental — not exempt like primary). Parameterize basis + resale-price + taxable-flag,
     or fork a `computeViagerResale()`.
   - **Guard rental/primary-only fields:** `propertyValue`, `netWorth`, `totalWorth`,
     `buildingDepreciation`, `grossYield`/`netYield`/`monthlyCashFlow` all read
     `p.purchasePrice` / `p.rent` / `p.renovationCosts`, which viager lacks. Guard each
     (yield/monthlyCashFlow → 0 / N/A for viager; value metrics use occupied/market value).
   - **Route the stake:** operational metrics divide by `investedDownPayment`/`downPayment`.
     For viager the stake is the `bouquet` — set `downPayment ← bouquet` (or route
     `investedCapital`) so `coc`, MOIC, IRR year-0 all use the right denominator.
   - Reuse `buildAmortization` only if the bouquet is financed (v1 default: cash, loan=0).
   - Add JSDoc `@typedef` fields for the new params on `SimParams`.
2. `packages/engine-ts/src/types.ts` + `packages/engine-ts/src/compute.ts` — extend
   `Mode` to `'rental' | 'primary' | 'viager'`, add the new optional `SimParams` fields,
   and mirror the branch using an **exhaustive `switch`** (a forgotten case must fail
   loudly, not diverge silently — the parity test catches runtime divergence either way,
   but exhaustive switch catches it at authoring time).
3. `src/state/definitions.js` — `mkDef('viager')` defaults (drop loan `autoFields`),
   `GRP_VIAGER` field group, make `getGroups()` and the `mkDef` `label` ternary **3-way**
   (today both fall through to the primary branch), a `DEFAULT_SIMS` viager example.
   Note: `mkDef` returns a flat object with ALL fields, so the 8 viager fields widen
   every sim object → io CSV columns, clipboard payloads, and the engine-ts `SimParams`
   interface all grow. More files touched than the original 9.
4. `src/components/SimPanel/` — add `viager` to the mode switch; **remap the
   "Monthly payment" chip to the rente (`monthlyAnnuity`) for viager** (the generic chip
   reads the loan payment = €0 for bouquet-only viager). Real CF/mo, Effort/mo, Wealth
   chips work unchanged.
5. `src/components/ChartArea/` — charts read `flows[]`, but the value-step at
   `expectedDuration` makes `propertyValue`/`totalWorth`/`cashBalance` **non-monotone**
   (a near-vertical "cliff" at the death year). Annotate the death year on the wealth and
   resale charts (reuse the existing break-even vertical-annotation pattern) so the cliff
   reads as an event, not a glitch.
6. `src/components/DocPanel/concepts.js` + i18n `doc.*` — viager concept cards
   (occupied value / décote, bouquet vs rente, value unlock at death).
7. `src/i18n/locales/{en,fr}.json` — labels for the new fields/group/mode.
8. `CLAUDE.md` — document the viager mode, params, formulas, and the cost-basis
   simplification (nominal Σrente vs. capitalised rente value — same posture as the
   Micro-BIC note).
9. `CHANGELOG.md` — `### Added` entry.

## Tests

- `packages/engine/__tests__/` — viager ground-truth fixtures: bouquet-only (no loan),
  annuity stops at `expectedDuration`, value unlock at death year, resale before/after
  death, IRR sign, personal-rent reintegration. Add to golden-master.
- `packages/engine-ts/__tests__/parity.test.ts` — viager added to the parity matrix.
- `src/engine/__tests__/io.test.js` — viager sim round-trips through CSV/JSON/YAML.
- `src/components/DocPanel/__tests__/concepts.test.js` — viager concept adapters pure + correct.

## Explicitly NOT in scope (deferred)

- Mortality table / barème (INSEE) to derive `expectedDuration` from age/sex.
- Pessimistic/expected/optimistic death-date scenario spread.
- Viager libre (immediate possession + rental income).
- Rente reversion to a surviving spouse (réversibilité).
- Exact CGI treatment of the rente capital in capital-gains basis (simplification flagged).

## Open questions for review

- Should the bouquet be financeable by a loan (reuse `downPayment`/`interestRate`/
  `loanTerm`), or is cash-only acceptable for v1?
- Is the occupation discount a direct % input, or should it be hinted from
  `expectedDuration` (DUH valuation)? v1: direct % with a tooltip.
- After death (yr > expectedDuration) within the horizon: hold the now-vacant property
  as equity, or assume it's rented? v1: hold as equity, resell at horizon.
