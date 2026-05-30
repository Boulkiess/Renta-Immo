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

### Pipeline de vérification (clean code)

| Commande               | Rôle                                                               | Quand                   |
| ---------------------- | ------------------------------------------------------------------ | ----------------------- |
| `npm run format`       | Reformate tous les fichiers avec Prettier                          | Nettoyage ponctuel      |
| `npm run format:check` | Vérifie le formatage sans modifier (exit 1 si diff)                | CI                      |
| `npm run lint`         | Rapport ESLint — erreurs bloquent la CI, warnings sont informatifs | CI / manuelle           |
| `npm run lint:fix`     | Corrige automatiquement les problèmes ESLint corrigibles           | Après ajout de fichiers |
| `npm run typecheck`    | TypeScript checkJs sur `src/engine/` + `src/state/`                | CI / manuelle           |
| `npm run check`        | Pipeline complète : format:check + lint + typecheck                | **Avant chaque PR**     |

Le hook pre-commit (Husky + lint-staged) reformate et lint automatiquement les fichiers stagés à chaque `git commit`.

Deployment: pushing to `main` triggers GitHub Actions → `quality` job (format:check + lint + typecheck) → `build` job → GitHub Pages.

## Before every commit

**Update `CHANGELOG.md`** under `[Unreleased]` before committing any change. Add a `### Fixed`, `### Added`, `### Changed`, or `### Removed` entry as appropriate.

**Keep `CLAUDE.md` in sync with the code.** If you modify formulas, parameters, data shapes, architecture, or any documented behavior, update the relevant sections of this file in the same commit. This file is the source of truth for the financial engine — it must reflect actual code, not past intentions.

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

---

## Paramètres d'entrée complets

### Globaux (`g` / `G` dans le state)

| Clé               | Type                                | Défaut   | Description                                                        |
| ----------------- | ----------------------------------- | -------- | ------------------------------------------------------------------ |
| `regime`          | `'lmnp' \| 'microbic' \| 'foncier'` | `'lmnp'` | Régime fiscal locatif (global, s'applique aux 3 sims)              |
| `horizon`         | années (1–30)                       | `20`     | Horizon de calcul pour VAN et MOIC                                 |
| `tauxActu`        | %                                   | `3`      | Taux d'actualisation pour la VAN                                   |
| `rendAlt`         | %                                   | `6`      | Rendement de l'investissement alternatif (ETF)                     |
| `loyerPerso`      | €/mois                              | `900`    | Loyer personnel payé chaque mois                                   |
| `revalLoyerPerso` | %                                   | `2`      | Revalorisation annuelle du loyer personnel                         |
| `budgetMensuel`   | €/mois                              | `2500`   | Budget mensuel disponible (sert à calculer le surplus vers ETF)    |
| `investirSurplus` | booléen                             | `true`   | Réinvestir le surplus mensuel en ETF                               |
| `apportETF`       | €                                   | `60 000` | Apport hypothétique investi en ETF dans le scénario de référence   |
| `inflation`       | %                                   | `2`      | Inflation (non utilisée dans le moteur actuel — paramètre réservé) |

### Par simulation (`p`) — Commun à `loc` et `rp`

| Clé            | Type            | Défaut    | Description                                                  |
| -------------- | --------------- | --------- | ------------------------------------------------------------ |
| `mode`         | `'loc' \| 'rp'` | —         | Mode de la simulation                                        |
| `prixAchat`    | €               | `250 000` | Prix d'achat du bien                                         |
| `fraisNotaire` | €               | `20 000`  | Frais de notaire                                             |
| `travaux`      | €               | `15 000`  | Montant des travaux                                          |
| `fraisAgence`  | €               | `0`       | Frais d'agence à l'achat                                     |
| `apport`       | €               | `50 000`  | Apport personnel                                             |
| `taux`         | %               | `3,85`    | Taux d'intérêt annuel du crédit                              |
| `duree`        | années (5–30)   | `20`      | Durée du crédit                                              |
| `assurance`    | %               | `0,25`    | Taux annuel d'assurance emprunteur (sur capital emprunté)    |
| `revalBien`    | %               | `2,0`     | Revalorisation annuelle du bien                              |
| `fraisVente`   | %               | `4`       | Frais de vente (agence, diagnostics…) sur le prix de revente |

### Par simulation (`p`) — Mode `loc` uniquement

| Clé            | Type   | Défaut  | Description                                                   |
| -------------- | ------ | ------- | ------------------------------------------------------------- |
| `loyer`        | €/mois | `1 000` | Loyer mensuel brut                                            |
| `vacance`      | %      | `5`     | Taux de vacance locative                                      |
| `taxeFonciere` | €/an   | `1 200` | Taxe foncière                                                 |
| `chargesCopro` | €/an   | `800`   | Charges de copropriété                                        |
| `assurPNO`     | €/an   | `200`   | Assurance propriétaire non-occupant                           |
| `fraisGestion` | %      | `7`     | Frais de gestion locative (% du loyer brut annuel)            |
| `provision`    | €/an   | `500`   | Provision pour travaux / vacance imprévue                     |
| `revalLoyer`   | %      | `1,5`   | Revalorisation annuelle du loyer                              |
| `tmi`          | %      | `30`    | Taux marginal d'imposition (IR)                               |
| `ps`           | %      | `17,2`  | Prélèvements sociaux sur revenus locatifs                     |
| `amortBien`    | %      | `2,5`   | Taux d'amortissement comptable annuel du bien (LMNP réel)     |
| `amortTravaux` | %      | `10`    | Taux d'amortissement comptable annuel des travaux (LMNP réel) |
| `impotPV`      | %      | `19`    | Taux d'imposition de la plus-value immobilière                |
| `psPV`         | %      | `17,2`  | Prélèvements sociaux sur la plus-value                        |

### Par simulation (`p`) — Mode `rp` uniquement

| Clé              | Type | Défaut  | Description               |
| ---------------- | ---- | ------- | ------------------------- |
| `taxeFonciereRP` | €/an | `1 200` | Taxe foncière RP          |
| `chargesCoproRP` | €/an | `1 200` | Charges de copropriété RP |
| `assurHab`       | €/an | `300`   | Assurance habitation      |
| `provisionRP`    | €/an | `500`   | Provision pour travaux RP |

---

## Métriques calculées et formules exactes

Toutes les formules ci-dessous sont implémentées dans `engine/compute.js`. ✅ = vérifié correct, ⚠️ = simplification documentée.

### Coût et emprunt

```
ct  = prixAchat + fraisNotaire + travaux + fraisAgence     ✅ coût total d'acquisition
emp = max(0, ct − apport)                                  ✅ montant emprunté
```

### Mensualité crédit (annuité constante) ✅

```
τM   = taux / 100 / 12          (taux mensuel)
nM   = duree × 12               (nombre de mensualités)
mens = emp × τM / (1 − (1+τM)^−nM)   si emp>0 et τM>0
     = emp / nM                       si τM = 0 (prêt sans intérêt)
```

### Assurance emprunteur ✅

```
assM = emp × (assurance/100) / 12     (fixe, sur capital initial)
```

Attention : l'assurance est calculée sur le capital initial (non sur le capital restant dû), ce qui correspond à la pratique des assurances groupe.

### Tableau d'amortissement (mensuel) ✅

Pour chaque mois m = 1..nM :

```
intérêts[m]   = capitalRestant[m-1] × τM
amortCapital[m] = max(0, mens − intérêts[m])
capitalRestant[m] = max(0, capitalRestant[m-1] − amortCapital[m])
```

KPIs dérivés :

```
totInt = Σ intérêts[m]           (coût total des intérêts)
totAss = Σ assM                  (coût total assurance = assM × nM)
```

### Loyers annuels (mode `loc`) ✅

```
lb = loyer × 12 × (1 + revalLoyer/100)^(yr−1)     (loyer brut annuel, année yr)
le = lb × (1 − vacance/100)                         (loyer effectif après vacance)
```

### Charges annuelles (mode `loc`) ✅

```
chg = taxeFonciere + chargesCopro + assurPNO + provision + lb × (fraisGestion/100)
```

Note : les frais de gestion sont calculés sur le loyer **brut** (lb), pas sur le loyer effectif. C'est la pratique courante des agences.

### Charges annuelles (mode `rp`) ✅

```
chg = taxeFonciereRP + chargesCoproRP + assurHab + provisionRP
```

### Fiscalité locative — `impLoc()` ⚠️

```
LMNP réel    : RI = max(0, le − chg − ab − at)   où ab = prixAchat×(amortBien/100), at = travaux×(amortTravaux/100)
Micro-BIC    : RI = max(0, le × 0,50)              (abattement 50%, meublé non-classé uniquement)
Foncier nu   : RI = max(0, le − chg)

impôt = RI × (tmi + ps) / 100
```

**Simplifications (ne pas modifier sans décision explicite) :**

- Les **intérêts d'emprunt** ne sont pas déduits du revenu imposable, ni en LMNP réel ni en Foncier nu, alors qu'ils sont déductibles en droit français. Cela **surestime l'impôt** (surtout les premières années). Choix délibéré pour limiter la complexité.
- Les **abattements progressifs sur la plus-value** (−6%/an IR entre la 6e et la 21e année, −4% à la 22e, −1,65%/an PS entre la 6e et la 21e…) ne sont **pas appliqués**. La fiscalité PV est donc surestimée pour les détentions longues.
- Le Micro-BIC est codé à 50% d'abattement : c'est le taux du meublé **non-classé**. Le meublé **classé tourisme** bénéficie de 71%. Non implémenté.
- En LMNP, les amortissements ne peuvent pas générer un déficit imputable sur le revenu global ; seul le report sur les revenus locatifs futurs est autorisé. Le code applique `max(0, RI)` mais **ne reporte pas** l'excédent d'amortissement sur les années suivantes.

### Cash flow annuel ✅

**Mode `loc` :**

```
loyerPersoAnn = loyerPerso × 12 × (1 + revalLoyerPerso/100)^(yr−1)
cfN = le − chg − (mens×12) − (assM×12) − loyerPersoAnn − impôt
cfC = Σ cfN[1..yr]     (cash flow cumulé)
```

**Mode `rp` :**

```
cfN = −(chg + mens×12 + assM×12)     (toujours négatif)
cfC = Σ cfN[1..yr]
le  = loyerPersoAnn                   (loyer économisé, affiché mais non compté dans cfN)
```

`ann` dans `flux[]` = `mens×12 + assM×12` (annuités + assurances totales).

### Surplus et poche ETF ✅

```
realOutAnn  = −cfN                       (mode loc : sorties nettes réelles)
            = chg + mens×12 + assM×12    (mode rp)
surplusAnn  = max(0, budgetMensuel×12 − realOutAnn)
etfCap[yr]  = etfCap[yr-1] × (1 + rendAlt/100) + (investirSurplus ? surplusAnn : 0)
```

`etfCap` démarre à 0 dans `compute()` (l'apport est investi dans le bien, pas en ETF).

### Valeur du bien et revente ⚠️

```
vb = prixAchat × (1 + revalBien/100)^yr                   (valeur affichée dans les graphiques patrimoine)
pr = (prixAchat + travaux) × (1 + revalBien/100)^yr        (prix de revente effectif)
```

**Asymétrie documentée** : `vb` exclut les travaux, `pr` les inclut. L'équité affichée dans les graphiques (`vb − rest`) est donc inférieure de `travaux × (1+r)^yr` par rapport au produit de cession réel. Ce n'est pas un bug : `vb` est la valeur de l'actif nu, `pr` est le prix négocié tenant compte des améliorations. Toujours utiliser `reventeNet` (calculé depuis `pr`) pour tout calcul financier de cession.

```
fa         = pr × (fraisVente/100)                         (frais de vente)
pvB        = max(0, pr − prixAchat − travaux)              (plus-value brute)
iPV        = pvB × (impotPV + psPV)/100   si mode='loc'
           = 0                             si mode='rp'    (RP totalement exonérée)
reventeNet = pr − capitalRestant − fa − iPV                ✅
```

### Bilans à la revente ✅

```
bilanRevente = reventeNet + cfC − apport      (gain net opérationnel : vente + flux cumulés − mise de départ)
bilanTotal   = reventeNet + etfCap − apport   (gain net global : vente + ETF accumulé − mise de départ)
```

`bilanRevente` suppose que les flux positifs restent en cash. `bilanTotal` suppose qu'ils sont réinvestis en ETF (via le mécanisme surplus).

### Patrimoine ✅

```
patNet   = vb − capitalRestant + cfC − apport    (richesse nette : equity immobilière + flux cumulés − apport)
patTotal = (vb − capitalRestant) + etfCap        (patrimoine brut : equity + poche ETF, sans déduire l'apport)
```

`patTotal` ne déduit pas l'apport car il sert à comparer avec `etfPurGlobal.cap` qui inclut lui aussi l'apport initial. Note : `apportETF` est un paramètre global unique alors que chaque simulation a son propre `p.apport` — si les deux diffèrent, la comparaison n'est pas à iso-capital.

### Scénario ETF pur — `computeEtfPur(g)` ⚠️

```
cap[0]  = apportETF
lpa[yr] = loyerPerso × 12 × (1 + revalLoyerPerso/100)^(yr−1)
surplus = max(0, budgetMensuel×12 − lpa[yr])
cap[yr] = cap[yr−1] × (1 + rendAlt/100) + surplus
```

Représente l'alternative : investir l'apport en ETF et placer le surplus mensuel après paiement du loyer.

La fonction retourne deux valeurs par année :

- `cap` : valeur brute (composition sans taxe) — utilisée dans ChartsTab (patrimoine), KpisTab, crossover, export
- `capNet` : valeur nette après **PFU 30% sur la plus-value** (`capNet = cap − max(0, cap − totalContribs) × 0,30`) — utilisée uniquement dans **ReventeTab** (chart + table hover)

**Simplifications restantes :**

- Taux fixé à 30% flat (PFU CTO) — pas de distinction PEA 17,2% / CTO 30%
- Pas de taxe annuelle (correct pour un ETF capitalisant : l'imposition n'a lieu qu'à la cession)
- Le crossover compare `patTotal` immo (brut, avant impôt de cession) avec `cap` ETF (brut) — cohérence intentionnelle ; seule la ReventeTab utilise `capNet`

### Crossover ✅

```
crossover = première année yr telle que patTotal[yr] ≥ etfPurGlobal[yr].cap
```

Si `investirSurplus = false`, retourne `null` (comparaison sans sens car les surplus ne sont pas capitalisés).

### TRI (IRR) — Newton-Raphson ✅

Flux : `[−apport, cfN[1], cfN[2], …, cfN[horizon] + reventeNet[horizon]]`

```
NPV(r)  = Σ_{t=0}^{n} flux[t] / (1+r)^t = 0
NPV'(r) = Σ_{t=1}^{n} (−t × flux[t]) / (1+r)^{t+1}
r_{k+1} = r_k − NPV(r_k) / NPV'(r_k)     (Newton-Raphson)
```

Retourne `null` si non-convergence en 100 itérations, si `|NPV'| < 1e-15`, ou si `r < −1`. Point de départ : `r₀ = 0,10` (10 %).

Calculé pour horizons 10, 15 et 20 ans : `tri10`, `tri15`, `tri20`.

### VAN (NPV) ✅

```
VAN = −apport + Σ_{t=1}^{horizon} cfN[t]/(1+tauxActu/100)^t + reventeNet[horizon]/(1+tauxActu/100)^{horizon}
```

### MOIC ✅

```
MOIC = (bilanRevente[horizon] + apport) / apport
     = (reventeNet[horizon] + cfC[horizon]) / apport
```

Multiple on Invested Capital — combien de fois l'apport a été multiplié (vente + flux cumulés).

### Rendements (mode `loc`) ✅

```
rendBrut = (loyer × 12 / ct) × 100                                           (% sur coût total acquisition)
rendNet  = (loyer × (1−vacance/100) × 12 − chgAn0) / ct × 100
  où chgAn0 = taxeFonciere + chargesCopro + assurPNO + provision + loyer×12×(fraisGestion/100)
```

Calculés sur les valeurs de l'**année 0** (pas revalorisées). Indicateurs statiques.

### Cash flow mensuel affiché — `cfM` ⚠️

```
Mode loc : cfM = loyer − mens − assM − loyerPerso     (hors charges opérationnelles !)
Mode rp  : cfM = loyerPerso − mens − assM             (différentiel vs. rester locataire)
```

**Attention** : `cfM` est un indicateur simplifié **non affiché dans les KPI chips du SimPanel** (remplacé par `cfN[yr=1]/12`). Il est conservé dans `compute()` pour KpisTab et io.js. Il **n'inclut pas** taxeFonciere, chargesCopro, assurPNO, fraisGestion, provision, ni l'impôt. Ne pas utiliser `cfM` dans des calculs financiers.

### KPI chips SimPanel (unified LOC/RP)

Les 4 chips affichés dans le header de chaque SimPanel sont identiques pour les modes LOC et RP :

| Chip          | Formule                              | Couleur                         |
| ------------- | ------------------------------------ | ------------------------------- |
| Mensualité    | `r.mens + r.assM`                    | couleur sim                     |
| CF réel/mois  | `r.flux[0].cfN / 12`                 | rouge si < 0, couleur sim sinon |
| Effort/mois   | `−r.flux[0].cfN / 12 − G.loyerPerso` | rouge si > 0, couleur sim sinon |
| Patrimoine Xa | `r.flux[G.horizon−1].patTotal`       | couleur sim                     |

**Effort/mois** = surcoût mensuel vs. situation actuelle (louer à `loyerPerso`). Positif = tu dépenses plus qu'aujourd'hui. Négatif = l'investissement est moins cher que ta situation actuelle. Formule unifiée valide pour LOC et RP. Redondant avec CF réel/mois uniquement si `loyerPerso = 0`.

`rendBrut`, `rendNet`, `cfM`, `crossover` ne sont plus affichés dans le SimPanel — toujours calculés par `compute()` et disponibles dans KpisTab et io.js.

### Point mort (break-even) ✅

```
be = première année yr telle que cfC[yr] ≥ 0
```

Indique quand les flux opérationnels cumulés repassent en positif (hors valeur du bien). Retourne `null` si jamais atteint en 30 ans.

---

## Invariants et règles à respecter

- **`compute()` est une fonction pure** : ne jamais y introduire de side effects ni d'état.
- **`flux[]` est indexé 0-based** : `flux[0]` = année 1, `flux[yr-1]` = année yr.
- **`amort[]` est mensuel** : `amort[m-1]` = mois m. Pour l'année yr, le capital restant de fin d'année est `amort[yr×12 - 1].rest`.
- **`etfCap` démarre à 0** dans `compute()`, jamais à `apportETF` (l'apport est immobilisé dans le bien).
- **`reventeNet` utilise `pr` (avec travaux)**, pas `vb` (sans travaux). Ne jamais substituer.
- **RP : `cfN` est toujours ≤ 0**, le loyer économisé est stocké dans `le` pour affichage mais n'entre pas dans `cfN`.
- La **valeur résiduelle du capital restant** après la durée du prêt est 0 : `amort[nM-1].rest ≈ 0`.

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
