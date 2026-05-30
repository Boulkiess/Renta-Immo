# Changelog

## [Unreleased]

### Fixed

- **`fraisDossier` sans traduction** : le champ "Frais de dossier" s'affichait avec la clé brute `fraisDossier` dans le formulaire. Labels et tooltips ajoutés en français et anglais.
- **`revalCharges` orphelin** : le paramètre de revalorisation des charges (2 %/an par défaut) influençait les calculs sans être visible ni modifiable. Un champ dédié est maintenant présent dans le GlobalStrip entre "Reval. budget" et "Surplus→ETF".
- **Tooltips `bilanRevente` et `bilanTotal` incorrects** : les deux nouvelles lignes du tableau comparatif pointaient vers les tooltips de `patNet`/`patTotal`. Nouveaux tooltips dédiés avec la bonne formule.

### Added

- **GlobalStrip — hypothèses actives** : bandeau de synthèse en lecture seule affiché à droite du GlobalStrip résumant les taux d'évolution appliqués (inflation, charges, budget, loyer perso). Rend visibles les hypothèses que l'utilisateur n'aurait pas encore ajustées.
- **KpisTab — Cash-on-cash return (an 1)** : nouvelle ligne dans la section Rendements affichant `cfN[1] / apport × 100`. Indicateur immédiat du rendement courant, complémentaire au TRI.
- **KpisTab — Note métriques réelles** : lorsque l'inflation est > 0, une note explicative s'affiche sous la description du tableau pour clarifier que les lignes grisées sont en euros constants.
- **Graphique Patrimoine — ligne de croisement** : une ligne verticale fine (couleur de la simulation) marque l'année de croisement vs ETF pur sur le graphique Patrimoine, avec le label "an N". Visible uniquement si le crossover a lieu avant la 30e année.
- **SimPanel — sections Revenus/Charges** : la section "Exploitation" du mode Locatif est divisée en deux sections distinctes — "Revenus locatifs" (loyer, vacance, revalLoyer) et "Charges" (taxe foncière, copro, assurances, gestion, provision) — pour améliorer la lisibilité.

### Fixed

- **Abattements progressifs sur la plus-value immobilière** : l'impôt PV est désormais calculé avec les abattements légaux (art. 150 VC CGI). IR : 6 %/an de la 6e à la 21e année → exonération totale à partir de la 22e. PS : 1,65 %/an de la 6e à la 21e, 1,6 % à la 22e, 9 %/an de la 23e à la 30e → exonération totale après 30 ans. Auparavant, le taux plein (19 % + 17,2 %) était appliqué quelle que soit la durée de détention, surestimant massivement l'impôt pour les longues détentions.
- **Déduction des intérêts d'emprunt** : les intérêts annuels du prêt (`intAnnuel`) sont désormais déduits du revenu imposable en LMNP réel (`le − chg − ab − at − intAnnuel`) et en Foncier nu (`le − chg − intAnnuel`), conformément au droit fiscal français. L'impôt était auparavant surestimé de €2 000–4 000/an en début de prêt.
- **Report d'amortissement LMNP** : le déficit LMNP (amortissements excédant le revenu imposable) est désormais reporté aux années suivantes via la variable `amortReport`. Les années déficitaires produisent `imp = 0` et le solde non utilisé réduit l'imposition des années futures. Auparavant, l'excédent était perdu.
- **Cohérence string régime** : la valeur enum correcte du régime Foncier nu est `'nu'` (et non `'foncier'` comme incorrectement documenté dans CLAUDE.md). Le code était déjà correct ; seule la documentation est corrigée.
- **Guard `calcVAN()` horizon > 30** : `calcVAN()` retourne désormais `null` pour `horizon > 30` ou `< 1`, cohérent avec `calcTRI()`.

### Added

- **Revalorisation annuelle des charges fixes** (`revalCharges`, défaut 2 %/an) : nouveau paramètre global modélisant la hausse annuelle de la taxe foncière, des charges de copropriété, des assurances et des provisions. Le facteur `(1 + revalCharges/100)^(yr−1)` est appliqué à toutes les charges fixes (LOC et RP) ; les frais de gestion (proportionnels au loyer) restent inchangés.
- **Frais de dossier et courtage crédit** (`fraisDossier`, défaut 0 €) : nouveau paramètre de simulation (section Acquisition) intégré dans `ct` (coût total) et donc dans `emp`. Modélise les frais bancaires ou de courtier liés à l'obtention du prêt.
- **Cash-on-cash return** : `coc` ajouté à chaque objet `flux[yr]` — rendement annuel du flux net sur l'apport initial (`cfN / apport × 100`). Disponible pour export et affichage futur.
- **Bilan revente et bilan total dans le tableau comparatif** : les métriques `bilanRevente` (`reventeNet + cfC − apport`) et `bilanTotal` (`reventeNet + etfCap − apport`) sont désormais affichées dans la section Patrimoine du tableau KPIs à l'horizon choisi.

### Changed

- **KpisTab — masquer les lignes "Patrimoine total à 30 ans" quand l'horizon = 30** : les lignes `patTotal30` et `patTotal30Real` ne s'affichent plus lorsque l'horizon choisi est déjà 30 ans, car elles font alors doublon avec les lignes "à horizon".
- **SimPanel & GlobalStrip — icône `?` avant les labels** : le bouton d'aide `?` est déplacé avant le label de chaque paramètre (simulations et barre globale), au lieu d'après.

- **Comparaison — colonne ETF pur** : le tableau de l'onglet Comparaison remplace les lignes ETF (`ETF pur à Xans`, `ETF pur 30a`, `Avantage vs ETF`) par une colonne **ETF pur** à droite des colonnes simulation, aligné sur le modèle de l'onglet Revente. La colonne est renseignée pour toutes les sections : rendements (`rendAlt` en %), CF mensuel (`−loyerPerso`), effort (`0 €`), TRI 10/15/20 et réels (`rendAlt` exact par construction Fisher), VAN et MOIC (calculés via les flux `[−apportETF, −surplus₁…]`), patrimoine total nominal et réel. Les labels `Rendement brut (loc.)` / `Rendement net (loc.)` sont raccourcis en `Rendement brut` / `Rendement net`.

- **CLAUDE.md** : suppression des sections dupliquées en fin de fichier (`Code Exploration Policy`, `Session-Aware Routing`, `Model-Driven Tool Tiering`) — déjà incluses via `@AGENTS.md` en tête de fichier.

### Added

- **Revalorisation annuelle du budget** : nouveau paramètre global `revalBudget` (%/an, défaut 0%) dans la GlobalStrip, juste après `budgetMensuel`. Modélise les hausses de salaire annuelles : le budget disponible croît chaque année en `(1 + revalBudget/100)^(yr−1)`, augmentant le surplus investi en ETF au fil du temps. Impacte `computeEtfPur()`, `compute()` (surplusAnn) et le calcul VAN/MOIC ETF dans KpisTab.

- **Métriques réelles (ajustées inflation)** : le paramètre Inflation est désormais utilisé pour afficher des indicateurs en euros constants. Dans les KPIs : 3 lignes TRI réel (10/15/20a) via Fisher `(1+TRI)/(1+inflation)−1`, atténuées sous chaque TRI nominal ; 2 lignes Patrimoine réel déflatées par `(1+inflation)^n` ; cards de bas de page avec "réel : Xk€". Dans le graphique Patrimoine : ligne tiretée gris clair = ETF pur en euros constants. Notes `ChartNote` italiques sous les graphiques Patrimoine et Valeur du bien précisant les valeurs nominales. Tooltips : `inflation` (rôle pour les métriques réelles), `rendAlt` (clarifié nominal net d'impôts), `kpi.triReal` et `kpi.patReal` avec formules.

- **Drag-to-scrub sur les unités** : survoler l'unité (€, %, ans…) d'un paramètre change le curseur en double flèche verticale. Maintenir le clic et glisser haut/bas ajuste la valeur par pas (6 px par pas, Shift × 10). Fonctionne sur tous les paramètres de simulation (FieldGroup) et les paramètres globaux (GlobalStrip). Le curseur disparaît pendant le drag via Pointer Lock et réapparaît exactement à sa position d'origine au relâchement.

### Added

- **Tableau comparatif — tooltips** : un bouton `?` apparaît avant chaque label de ligne dans le tableau comparatif (onglet KPIs). Cliquer ouvre un popover expliquant la formule ou la définition de l'indicateur (TRI, VAN, MOIC, rendements, cashflow, patrimoine, ETF pur, crossover…). 17 nouvelles clés `tooltips.kpi.*` ajoutées en FR et EN.

### Changed

- **Onglet Revente — tableau** : la valeur ETF pur (net) est désormais affichée dans une colonne dédiée plutôt qu'en sous-ligne dans chaque cellule de simulation.

### Added

- **Persistance thème et langue** : le thème (dark/light) et la langue (fr/en) sont désormais sauvegardés dans `localStorage` (`immorenta_theme`, `immorenta_lang`) et restaurés automatiquement au rechargement de la page.

### Added

- **Onglet Amortissement — série "Capital remboursé"** : nouvelle courbe sur l'axe droit montrant le capital cumulativement remboursé (montant croissant, symétrique du capital restant dû). `drawBarsWithLine` accepte désormais un tableau de datasets ligne, chaque entrée portant une propriété `dashed` pour contrôler le style individuellement.

### Changed

- **Onglet Amortissement — couleurs** : schéma de couleurs entièrement revu. Barres : intérêts `#e2cbcb`, assurance `#a30eff`. Courbes axe droit : capital restant dû `#ff0000` (continu), capital remboursé `#ffff00` (continu). Labels axe droit passés en couleur neutre (`mutedColor`). Couleurs centralisées dans la constante `AMORT_COLORS`.

- **Onglet Amortissement** : fusion des deux graphiques (décomposition annuelle et capital restant dû) en un seul graphique à double ordonnée. L'axe gauche donne l'échelle des barres empilées (capital / intérêts / assurance) ; l'axe droit donne l'échelle de la courbe pointillée du capital restant dû. Les deux séries partagent désormais le même horizon temporel (durée du prêt), ce qui rend la lecture plus naturelle.

### Added

- **Setup clean code** : pipeline de qualité complète ajoutée au projet.
  - **Prettier 3** : formatage automatique avec `.prettierrc` (singleQuote, printWidth 100, trailingComma es5). Script `npm run format` (réécriture) et `npm run format:check` (CI).
  - **ESLint 9** (flat config) : linting React-aware avec `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, intégré avec `eslint-config-prettier`. Scripts `npm run lint` et `npm run lint:fix`.
  - **TypeScript checkJs** : vérification de types sur `src/engine/` et `src/state/` sans migration vers `.ts`. Script `npm run typecheck`.
  - **Husky + lint-staged** : hook pre-commit qui reformate et lint automatiquement les fichiers stagés.
  - **`npm run check`** : pipeline complète (format:check + lint + typecheck) à lancer avant chaque PR.
  - **CI GitHub Actions** : nouveau job `quality` (format:check + lint + typecheck) bloquant le job `build` en cas d'échec.
  - **`.editorconfig`** : règles d'indentation et de fin de ligne pour tous les éditeurs.
  - **`src/types/styled.d.ts`** : augmentation de `DefaultTheme` avec la forme réelle du thème.

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

- **Moteur — VAN/TRI incorrects en modes LOC et RP** : deux corrections symétriques sur les flux `irrFlows[]` utilisés par `calcTRI` et `calcVAN`.
  - **LOC** : `calcVAN` utilisait `flux[t-1].cfN` directement, qui inclut `−loyerPersoAnn`. Le loyer personnel (coût subi indépendamment de l'investissement) était compté comme charge, rendant la VAN très négative. Correction : `calcVAN` réutilise désormais `irrFlows[]` comme `calcTRI`.
  - **RP** : `irrFlows[]` ne comptabilisait pas le loyer économisé (`loyerPersoAnn`) comme bénéfice. Le TRI et la VAN mesuraient les sorties brutes sans tenir compte que l'investissement fait cesser le paiement du loyer. Correction : `loyerPersoAnn` est ajouté dans `irrFlows[]` pour RP, symétriquement au traitement LOC. Les deux modes mesurent désormais le rendement pur de l'investissement sur une base comparable.
  - **MOIC** : même cause — calculé depuis `bilanRevente` qui accumule le `cfN` brut. Corrigé pour utiliser `irrFlows[]` (même base que TRI/VAN) : `MOIC = (reventeNet + Σ irrFlows[1..horizon]) / apport`.

- **KpisTab — TRI affiché N/C pour toutes les simulations locatives** : le moteur IRR incluait `loyerPersoAnn` comme dépense dans les flux de trésorerie locatifs, rendant le NPV systématiquement négatif et l'IRR incalculable. Le TRI mesure désormais le rendement pur de l'investissement (sans loyer personnel) pour le mode `loc` — `loyerPersoAnn` est exclu des flux IRR (réintégré dans `cfN` avant push). Le mode `rp` est inchangé. CLAUDE.md mis à jour.
- **KpisTab — CF mensuel affiché uniquement pour les sims locatives** : suppression du filtre `mode === 'loc'` sur la ligne "CF mensuel simplifié" — la valeur est désormais affichée pour tous les modes.
- **KpisTab — Effort mensuel affiché uniquement pour les sims RP** : suppression du filtre `mode === 'rp'` sur la ligne "Effort mensuel" — la valeur est désormais affichée pour tous les modes.
- **KpisTab — Labels "(loc.)" et "(RP)" supprimés** : les labels "CF mensuel net (loc.)" et "Effort mensuel (RP)" renommés en "CF mensuel net simplifié" et "Effort mensuel simplifié" (fr/en) maintenant que les deux lignes s'affichent pour tous les modes.

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
