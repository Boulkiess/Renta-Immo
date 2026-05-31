# Plan — Découpe des god-functions / god-components

Source: [TODO.md](TODO.md) § "Découpe des god-functions / god-components".
Reviewed via `/plan-eng-review` (2026-05-31). Behavior-preserving refactor.

## Objectif

Casser quatre god-units (`compute()` 256 l., `KpisTab.jsx` 541 l., `SimPanel.jsx`
421 l., `GlobalStrip.jsx` 405 l., `FieldGroup.jsx` 301 l.) en sous-unités testables,
**sans changer un seul chiffre affiché**. Le garde-fou de non-régression est double :
golden-master (déjà en place, moteur) + un nouveau filet jsdom (composants).

## Décisions verrouillées (revue interactive)

| #   | Décision            | Choix                                                                          |
| --- | ------------------- | ------------------------------------------------------------------------------ |
| D1  | Séquencement        | **jsdom net d'abord, puis UI.** Phase 0 → 1 → 2 → 3.                           |
| D2  | Découpe `compute()` | Îlots purs + boucle orchestratrice mince.                                      |
| D3  | Math ETF            | `surplusAt()` + `computeEtfKpis(g)` dans le moteur.                            |
| D4  | Harness jsdom       | `renderWithProviders()` providers réels + assertions de valeurs.               |
| D5  | Découpe `KpisTab`   | `kpiSections.js` (data) + `<KpiTable>/<KpiRow>/<SummaryCards>`.                |
| D6  | Phase 3             | `.styles.js` par composant + split SimPanel + import `fmtE`.                   |
| D7  | Tests drag          | Math pure unitaire + jsdom toggle/slider/number ; pas de drag synthétique DOM. |
| D8  | Outside voice       | Exécuté (subagent Claude).                                                     |
| D9  | Corrections         | Toutes incorporées (cf. § Corrections).                                        |

## Corrections issues de l'outside voice (vérifiées dans le code)

1. **Ce n'est PAS une triplication.** [compute.js:141-143](src/engine/compute.js#L141)
   soustrait `realOutAnn` (sortie réelle) ; seuls `computeEtfPur` et `KpisTab`
   soustraient `loyerPerso`. → `surplusAt(g, yr)` unifie **2 sites** (référence ETF) ;
   le surplus in-loop de `compute()` est une autre grandeur et **reste tel quel**.
2. **Test de caractérisation paramétré**, pas seulement G par défaut :
   `{apportETF: 0}` (MOIC null), `{tauxActu === rendAlt}` (VAN→0), `{horizon: 30}`.
3. **Assertions jsdom robustes au formatage.** `fmtE` émet ` ` (nbsp) + `€` et
   dépend de l'ICU. Le harness assert via un helper de normalisation (réutilise la
   logique de [`parseNum`](src/components/ChartArea/KpisTab.jsx#L94)) et **épingle la locale/ICU**.
4. **Env de test par fichier.** [vite.config.js](vite.config.js) est global
   `environment: 'node'`. Les tests moteur restent `node` ; jsdom via
   `environmentMatchGlobs` (ou docblock `@vitest-environment jsdom`) + `setupFiles`
   pour les matchers `@testing-library/jest-dom`.
5. **`buildSections` n'est pas pure** — saturée de `t()` + branches `.startsWith()`
   de détection de langue ([:143](src/components/ChartArea/KpisTab.jsx#L143)).
   Signature `buildSections(t, G, RES, sims, etf)` — `t` injecté ; branches recopiées verbatim.
6. **`fmtE` SimPanel = `fmtE` utils** (vérifié byte-identique,
   [utils.js:1-6](src/engine/utils.js#L1)). Drop-dup sûr.
7. **Signature `calcVAN`/`moic` incomplète** — MOIC divise par `p.apport`
   ([:242](src/engine/compute.js#L242)). Les fns levées prennent `apport` en paramètre.
8. **shift×10 existe à 2 endroits** : [useDraggableValue.js:30](src/components/common/useDraggableValue.js#L30)
   (drag) **et** [FieldGroup.jsx:187](src/components/SimPanel/FieldGroup.jsx#L187) (flèches NumInput).
   Tester **les deux**.

---

## Phases

```
PHASE 0  Harness jsdom            ── bloque Phase 2 & 3
PHASE 1  Moteur (compute split)   ── protégé golden-master ; bloque Phase 2 (computeEtfKpis)
PHASE 2  KpisTab                  ── protégé Phase 0 ; dépend Phase 1
PHASE 3  SimPanel/GlobalStrip/FG  ── protégé Phase 0 ; indépendant de 1 & 2
```

### Phase 0 — Harness jsdom (fondation)

- `npm i -D @testing-library/react @testing-library/jest-dom jsdom`
- [vite.config.js](vite.config.js) : ajouter `environmentMatchGlobs: [['src/components/**', 'jsdom'], ['src/**/*.dom.test.{js,jsx}', 'jsdom']]`, garder le reste `node`. Ajouter `setupFiles: ['./src/test-utils/setup.js']` (`import '@testing-library/jest-dom'`). Épingler ICU/locale (documenter `NODE_ICU_DATA`/full-icu, ou normaliser au lieu de comparer des chaînes formatées).
- `src/test-utils/renderWithProviders.jsx` : wrap `ThemeProvider` (thème réel) + `I18nextProvider` (i18n réel) + `AppProvider` avec seed `{simsOverride, gOverride}`. Exporte `renderWithProviders(ui, opts)`.
- `src/test-utils/kpiNormalize.js` : `normalizeMoney(str)` (strip ` `/espaces/`€`, virgule→point) pour asserts de valeurs. Smoke-test du harness lui-même.

### Phase 1 — Moteur (protégé golden-master)

- `buildAmortization(emp, tM, nM, assM)` → `amort[]`. (transitivement épinglé)
- `computeResale(p, pr, rest, yr)` → `{ fa, pvB, iPV, reventeNet }` (abattements inclus).
- Lever `calcTRI(flux, irrFlows, h)`, `calcVAN(flux, irrFlows, g)`, `calcMoic(flux, irrFlows, g, apport)` en fns pures top-level. **`apport` explicite** (D9#7).
- `surplusAt(g, yr)` → `max(0, budgetAnn − lpa)`. Remplace les 2 sites référence-ETF (`computeEtfPur`, et l'usage dans `computeEtfKpis`). **`compute()` loop inchangé** (D9#1).
- `computeEtfKpis(g)` → `{ tri, triReal, van, moic, surplusTotal }`. Déplace
  [KpisTab.jsx:122-139](src/components/ChartArea/KpisTab.jsx#L122).
- `compute()` : boucle d'accumulation reste orchestratrice (porte `amortReport/cfC/etfCap`).
- **AVANT le déplacement** : test de caractérisation paramétré de `computeEtfKpis`
  (D9#2) + snapshot golden-master de `computeEtfKpis`.

### Phase 2 — KpisTab (protégé Phase 0, dépend Phase 1)

```
ChartArea/KpisTab/
  index.jsx          # orchestration (~60 l), appelle computeEtfKpis(G)
  kpiSections.js     # buildSections(t, G, RES, sims, etf) → rows (D9#5)
  KpiTable.jsx       # thead + regroupement sections
  KpiRow.jsx         # logique best-col + cellule ETF
  SummaryCards.jsx
  kpiFormat.js       # parseNum / findBest
  KpisTab.styles.js
```

Tests : unit `buildSections` (nb lignes, labels, un formatter) ; jsdom valeurs vs
`compute()` (via `normalizeMoney`) ; cas 2 sims → cellule "best".

### Phase 3 — SimPanel / GlobalStrip / FieldGroup (protégé Phase 0)

```
SimPanel/
  index.jsx           # dispatch des 3 branches (~40 l)
  DisabledStrip.jsx  CollapsedStrip.jsx  FullPanel.jsx  HeaderKpis.jsx
  SimPanel.styles.js  icons.jsx          # CollapseIcon/ChevronIcon partagés
GlobalStrip/  index.jsx + GlobalStrip.styles.js
FieldGroup/   FieldGroup.jsx + FieldGroup.styles.js  (garde NumInput/DraggableUnit)
```

- SimPanel importe `fmtE` de `engine/utils`, supprime la copie locale (D9#6, vérifié sûr).
- **`&& p.enabled` ([SimPanel.jsx:382](src/components/SimPanel/SimPanel.jsx#L382)) est mort** (early-return l.310). Recopier verbatim, **ne pas simplifier** (refactor behavior-preserving).
- Tests : `useDraggableValue` clamp/shift×10 en unitaire pur + NumInput flèches shift×10 (D9#8) ; jsdom auto-toggle, slider, number ; SimPanel 3 branches rendues ; GlobalStrip + 1 interaction.

---

## Ce qui existe déjà (réutilisé, non reconstruit)

- **[golden.test.js](src/engine/__tests__/golden.test.js)** — fige tout l'output `compute()`/`computeEtfPur` (4 scénarios + 3 horizons). Protège Phase 1 intégralement. Réutilisé tel quel.
- **[compute.test.js](src/engine/__tests__/compute.test.js)** — vérité-terrain `irr`, `abattementIR/PS`, `impLoc`, mensualité, report LMNP, exo PV.
- **NumInput / DraggableUnit** ([FieldGroup.jsx](src/components/SimPanel/FieldGroup.jsx)) — déjà des sous-composants propres ; Phase 3 n'extrait que leurs styles.
- **`parseNum`** ([KpisTab.jsx:94](src/components/ChartArea/KpisTab.jsx#L94)) — logique de normalisation réutilisée par le helper de test (D9#3).
- **vitest** — déjà configuré ; Phase 0 ajoute l'env jsdom par fichier, ne le remplace pas.

## NOT in scope (différé, avec raison)

- **`charts.js`** (setup canvas / thème / grille dupliqués 3×) — reste dans [TODO.md](TODO.md) § Rendu & I/O. Hors périmètre god-functions ; lot dédié.
- **`io.js`** (durcir le parser YAML, remplacer `alert()`) — idem, lot I/O dédié.
- **Drag synthétique DOM** (mousedown→move→up jsdom) — D7 : fragile, math testée au niveau pur à la place.
- **Réécriture data-driven complète** de SimPanel/FieldGroup — D6 : abstraction prématurée pour 4 chips fixes.
- **Correction du hack `.startsWith()` de détection de langue** — comportement préservé verbatim ; à traiter quand l'i18n des `cat` sera revue.
- **Suppression du `&& p.enabled` mort** — refactor behavior-preserving ; nettoyage séparé.

## Modes de défaillance (par codepath nouveau)

| Codepath                               | Défaillance réaliste              | Test ?                                | Erreur visible ?          |
| -------------------------------------- | --------------------------------- | ------------------------------------- | ------------------------- |
| `computeEtfKpis(g)` `apportETF=0`      | MOIC `null`/NaN division          | ✅ char-test paramétré (D9#2)         | colonne ETF "—"           |
| `surplusAt` mal câblé sur compute loop | `etfPoche` dérive silencieusement | ✅ golden-master `flux[].etfPoche`    | aucune → **golden catch** |
| `calcMoic` sans `apport`               | NaN MOIC                          | ✅ signature corrigée (D9#7) + golden | cellule MOIC "—"          |
| jsdom asserts vs ` `/ICU               | test flaky CI≠local               | ✅ normalize + locale pin (D9#3/#4)   | faux rouge CI             |
| `buildSections` `t` non injecté        | labels = clés brutes              | ✅ jsdom (i18n réel)                  | labels "kpisTable.x"      |
| Drop `fmtE` SimPanel                   | format chip change                | ✅ vérifié identique (D9#6)           | aucune                    |

**Aucun gap critique** (silencieux + sans test + sans error-handling) : le plus à risque (#1 `surplusAt`) est couvert par golden-master.

## Parallélisation (worktrees)

| Phase   | Modules touchés                                   | Dépend de        |
| ------- | ------------------------------------------------- | ---------------- |
| Phase 0 | `test-utils/`, `vite.config.js`                   | —                |
| Phase 1 | `engine/`                                         | —                |
| Phase 2 | `components/ChartArea/`                           | Phase 0, Phase 1 |
| Phase 3 | `components/SimPanel/`, `components/GlobalStrip/` | Phase 0          |

- **Lane A** : Phase 0 → Phase 2 (séquentiel, Phase 2 a besoin du harness + de `computeEtfKpis`)
- **Lane B** : Phase 1 (indépendant, golden-master)
- **Lane C** : Phase 3 (a besoin de Phase 0 mergé)

**Ordre** : lancer **Phase 0 + Phase 1 en parallèle** (worktrees séparés, 0 conflit :
`test-utils/`+`vite.config.js` vs `engine/`). Merger les deux. Puis **Phase 2 + Phase 3
en parallèle** (`ChartArea/` vs `SimPanel/`+`GlobalStrip/` — 0 conflit). Phase 2 attend
le merge de Phase 1.

**Conflit potentiel** : `vite.config.js` touché par Phase 0 uniquement. Aucun chevauchement de module entre lanes parallèles.

## Implementation Tasks

Synthétisé depuis les findings. P1 = bloque le ship du lot, P2 = même branche, P3 = suivi.

- [ ] **T1 (P1, human: ~3h / CC: ~20min)** — test-utils — Harness jsdom + env par fichier
  - Surfacé par : D4 + D9#3/#4 — vite.config global node, asserts brittle
  - Files: `vite.config.js`, `src/test-utils/renderWithProviders.jsx`, `src/test-utils/setup.js`, `src/test-utils/kpiNormalize.js`
  - Verify: `npm run test` (harness smoke vert, engine suite reste node)
- [ ] **T2 (P1, human: ~2h / CC: ~15min)** — engine — `surplusAt` + `computeEtfKpis` + char-test AVANT déplacement
  - Surfacé par : D3 + D9#1/#2 — dedup 2 sites, char-test paramétré
  - Files: `src/engine/compute.js`, `src/engine/__tests__/compute.test.js`, `src/engine/__tests__/golden.test.js`
  - Verify: char-test pinne valeurs pré-déplacement ; golden inchangé
- [ ] **T3 (P1, human: ~3h / CC: ~20min)** — engine — Split `compute()` îlots purs + signatures avec `apport`
  - Surfacé par : D2 + D9#7 — calcVAN/moic missing apport
  - Files: `src/engine/compute.js`
  - Verify: `npm run test` golden-master 0 diff
- [ ] **T4 (P2, human: ~4h / CC: ~30min)** — ChartArea — Découpe KpisTab + `buildSections(t,…)`
  - Surfacé par : D5 + D9#5 — t injecté, sniff verbatim
  - Files: `src/components/ChartArea/KpisTab/*` (index, kpiSections, KpiTable, KpiRow, SummaryCards, kpiFormat, styles)
  - Verify: jsdom valeurs vs compute() ; best-col 2 sims
- [ ] **T5 (P2, human: ~4h / CC: ~30min)** — SimPanel/GlobalStrip — Styles externalisés + split branches + import fmtE
  - Surfacé par : D6 + D9#6/#8 — fmtE sûr, `&&p.enabled` mort verbatim
  - Files: `src/components/SimPanel/*`, `src/components/GlobalStrip/*`
  - Verify: jsdom 3 branches + GlobalStrip ; `useDraggableValue` + NumInput shift×10 units
- [ ] **T6 (P3, human: ~30min / CC: ~5min)** — TODO.md — Cocher les 3 items god-functions + l'item tests composants
  - Files: `TODO.md`, `CHANGELOG.md`

## Décisions non résolues

Aucune — D1 à D9 toutes répondues.

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
- **CROSS-MODEL:** No tension — outside voice refined execution spec, did not contradict any D1–D8 decision.
- **UNRESOLVED:** 0.
- **VERDICT:** ENG CLEARED — behavior-preserving refactor, golden-master + new jsdom net, all decisions locked. Ready to implement.
