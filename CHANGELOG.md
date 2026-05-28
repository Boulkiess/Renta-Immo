# Changelog

## [Unreleased]

### Fixed
- **Fiscalité ETF à la revente** : le scénario ETF pur dans ReventeTab affiche désormais la valeur nette après PFU 30% sur la plus-value (PFU CTO simplifié). `computeEtfPur` retourne `capNet = cap − gain × 0,30` en plus du `cap` brut. Les autres vues (ChartsTab patrimoine, KpisTab, crossover) continuent d'utiliser le brut pour cohérence avec `patTotal` immobilier.

### Fixed
- **Hover sur les graphiques restauré** : la fonction `attachHover` n'avait pas été portée lors de la migration vers React. Tooltip flottant réimplémenté dans `CanvasChart`, avec labels de séries dans tous les composants graphiques (`ChartsTab`, `ReventeTab`, `AmortTab`).
- **Bilan revente corrigé** : le graphique et le tableau "Bilan net selon la revente" utilisent désormais `bilanTotal` (qui inclut l'ETF poche accumulée avec le surplus mensuel composé) au lieu de `bilanRevente` (qui ne comptabilisait que les flux bruts non composés). La courbe ETF pur de référence reste inchangée en valeur absolue.

## [1.3.1] — 2026-05-28

### Fixed
- **Mode RP — cash flow corrigé** : le loyer non dépensé (`loyerPerso`) n'est plus compté comme un flux positif dans `src/engine/compute.js`. Le `cfN` en mode RP reflète désormais uniquement les sorties réelles (charges + mensualité + assurance emprunteur). Corrige l'IRR, le bilan revente et le cash-flow cumulé pour tous les scénarios — notamment quand `loyerPerso > mensualité`.

### Removed
- Suppression des fichiers legacy devenus inutilisés après la migration React : `js/` (anciens modules vanilla JS), `style.css` (remplacé par styled-components), `immo_renta.html` (ancien fichier mono-page de référence).

## [1.3.0] — 2026-05-28

### Added
- **Layout responsive** : colonnes de simulation empilées sur mobile, graphiques redimensionnés.

### Fixed
- Régressions UI introduites lors de la migration Vite (styles, espacements, comportement des sliders).

## [1.2.0] — 2026-05

### Changed
- **Migration vers Vite** : l'application est désormais construite avec Vite (`npm run dev / build / preview`). Déploiement automatique sur GitHub Pages via GitHub Actions.
- **Modularisation du code** : l'application mono-fichier `immo_renta.html` a été découpée en modules ES :
  - `js/main.js` — point d'entrée, exposition `window`
  - `js/state.js` — état partagé (`G`, `sims`, `COL`, `KEYS`, définitions des groupes)
  - `js/compute.js` — moteur financier (`compute()`, `recomputeETFPur()`, `crossoverYear()`, IRR)
  - `js/charts.js` — rendus canvas (`drawLine()`, `drawBars()`, `attachHover()`)
  - `js/render.js` — interface (`renderPanel()`, `rebuildShell()`, `redraw()`, export/import)
  - `js/utils.js` — formateurs (`fmtE()`, `fmtK()`, `fmtP()`, `fmtTRI()`)

## [1.1.0] — 2026-04

### Added
- **Courbe ETF pur toujours affichée** sur le graphique Patrimoine total, même si aucune simulation n'est en mode locatif.
- **ETF poche inclus dans le bilan revente** : le patrimoine total (équité immobilière + ETF du surplus) est intégré au calcul `bilanTotal`.
- **ETF pur externalisé** : `recomputeETFPur()` remplit un tableau global `etfPurGlobal[]` calculé une seule fois par cycle de rendu, indépendamment de `compute()`.
- **Budget mensuel + surplus ETF** (`budgetMensuel`, `investirSurplus`, `apportETF`) : paramètres globaux permettant de normaliser la comparaison RP vs locatif sur une même enveloppe mensuelle. Le surplus (budget − sorties réelles) est réinvesti en ETF dans chaque scénario.
- **Revalorisation du loyer personnel** (`revalLoyerPerso`) : le loyer actuel payé par l'investisseur est revalorisé chaque année dans le scénario ETF pur.

### Changed
- Les calculs locatifs intègrent désormais le loyer personnel (`loyerPerso`) et la revalorisation du loyer de marché (`revalLoyer`) dans le `cfN` annuel.

## [1.0.0] — 2026-03

### Added
- **Export** des données de simulation en CSV, JSON et YAML.
- **Import** des données de simulation depuis CSV, JSON et YAML.
- Application initiale : outil d'analyse d'investissement immobilier locatif (mode `loc`) et résidence principale (mode `rp`) avec 3 simulations concurrentes (A, B, C), graphiques canvas, calcul IRR/TRI, tableau de bord KPIs.
