# Changelog

## [Unreleased]

### Changed
- **Refonte UI complète — design "Claude"** : redesign visuel de l'ensemble de l'interface.
  - **Typographie** : DM Sans remplacé par Hanken Grotesk (corps) + Space Mono (valeurs numériques) ; token `theme.mono` et CSS var `--mono` ajoutés.
  - **Couleurs** : valeurs numériques passent de l'ambre (#fbbf24) au violet (#a78bfa) en dark, (#7c3aed) en light ; navbar toujours dark navy (`#0e1c36`) quelle que soit le thème.
  - **NavBar** : icône de marque carrée, badge violet "BETA" en monospace, sélecteur de langue segmenté (pill), boutons d'action primary/outline avec contour.
  - **GlobalStrip** : fond `#0c1830`, icône engrenage, ligne de champs en `overflow-x: auto`, séparateurs fins, valeurs en monospace violet.
  - **SimPanel** : panneaux à largeur fixe 220px ; deux nouveaux états — strip réduit (46px) avec label vertical + KPI pivotés, et strip désactivé à fond hachuré. Bordure colorée en haut (`border-top`) à la place du bas.
  - **ChartArea** : la barre d'onglets quitte la NavBar et s'intègre dans la zone graphique sous forme de groupe pill avec icônes SVG (Graphiques, Comparaison, Revente, Amortissement).
  - **KpisTab** : cartes de synthèse en bas de tableau (TRI, patrimoine, VAN par simulation) avec bordure colorée ; cellules de données en monospace, mise en valeur de la meilleure simulation par fond teinté et inset-shadow.
  - **Legend** : hint de clic supprimé ; fond `theme.surface` ajouté.
  - **Layout** : `SimsPane` n'a plus de largeur fixe à 690px — s'adapte aux panneaux actifs. Retrait des lignes alternées sur les `<tr>` pairs.

### Fixed
- **Affichage des décimales dans les inputs numériques** : les champs à pas décimal (ex : assurance 0,01 → affiche `0.25` et non `0.25`) conservent désormais le bon nombre de décimales en toutes circonstances. L'input passe de `type="number"` (qui supprime les zéros finaux) à `type="text" inputMode="decimal"` avec un composant `NumInput` dédié gérant un état local `localStr` : `null` en mode repos (affichage `toFixed(dec)`), chaîne libre pendant la saisie. Les touches ↑/↓ (Shift × 10) incrémentent/décrémentent selon `field.st`, clampées entre `field.mn` et `field.mx`.

### Added
- **Mode auto pour les paramètres dérivés** : 6 champs du SimPanel peuvent être calculés automatiquement — frais de notaire (8% du prix d'achat), taux d'intérêt (courbe taux moyens France 05/2026 interpolée selon la durée : 7a 3,25% · 10a 3,30% · 15a 3,45% · 20a 3,55% · 25a 3,70%), provision travaux, taxe foncière, et leurs équivalents RP (0,5%/an du prix d'achat). Un badge "A" apparaît à côté de chaque champ auto-capable. Cliquer sur le badge bascule entre auto et manuel ; modifier le slider/input désactive aussi l'auto. L'état de chaque champ est stocké dans `autoFields[]` par simulation. Les calculs restent dans une fonction pure `resolveAutoFields()` sans modifier le moteur financier `compute()`. Les tooltips (ⓘ) de chaque champ auto-capable affichent la formule utilisée.

### Changed
- **Couleur "Intérêts" dans le graphe Décomposition du prêt** : le segment intérêts passe de l'orange ambre (`#f59e0b`) au jaune vif (`#ffe600`) pour le distinguer de la couleur de la simulation B.

### Fixed
- **Champ horizon — saisie libre** : l'input "Horizon" dans la barre globale se met à jour en temps réel dès que la valeur est valide (1–30 ans). Quand le champ est vide ou en cours de frappe, la simulation conserve la dernière valeur valide. Le focus n'est plus nécessaire pour valider.

### Changed
- **Alerte budget sur le chip CF** : le chip "CF réel/mois" affiche un contour rouge lorsque le décaissement mensuel (`−cfN/12`) dépasse le budget mensuel (`budgetMensuel`). La comparaison utilise `Math.round()` pour éviter les faux positifs par arrondi flottant lors d'une égalité apparente.

### Added
- **Persistance de l'état dans le navigateur** : l'état complet (simulations A/B/C, globaux, onglet actif, groupes ouverts) est sauvegardé dans `localStorage` à la fermeture/refresh de la page et restauré automatiquement au chargement suivant. Les nouvelles clés ajoutées dans le code récupèrent leur valeur par défaut si absentes du JSON sauvegardé.

### Changed
- **Refonte KPI chips SimPanel** : 4 indicateurs unifiés LOC/RP (Mensualité, CF réel/mois, Effort/mois, Patrimoine à terme) remplacent les indicateurs mode-spécifiques (rendBrut/rendNet, crossover ETF, effort différentiel). CF réel/mois = `cfN/12` (an 1, toutes charges incluses). Effort/mois = `−cfN/12 − loyerPerso` (surcoût mensuel vs. situation actuelle).

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
