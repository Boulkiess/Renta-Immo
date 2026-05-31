# TODO — refactoring reporté

Items identifiés lors de l'audit clean-code (cf. plan de refactoring) mais hors scope du lot
« tests + DRY ciblé ». À traiter dans des PR dédiés, une fois le filet de tests en place.

## Découpe des god-functions / god-components

- [x] **`compute()`** → îlots purs exportés (`buildAmortization`, `computeResale`, `calcTRI/VAN/calcMoic`) + boucle 30 ans orchestratrice ; `surplusAt`/`computeEtfKpis` extraits.
- [x] **`KpisTab.jsx`** → dossier `KpisTab/` (sous-composants + `kpiSections.js`) ; math ETF (TRI/VAN/MOIC) déplacée vers `engine/compute.js` (`computeEtfKpis`).
- [x] **`SimPanel.jsx` / `GlobalStrip.jsx` / `FieldGroup.jsx`** → styled-components externalisés (`*.styles.js`) + SimPanel scindé en branches (Disabled/Collapsed/Full + HeaderKpis).

## Rendu & I/O

- [ ] **`charts.js`** → extraire setup canvas / couleurs thème / grille / x-labels (dupliqués 3×).
- [ ] **`io.js`** → durcir le parser YAML fait-maison, remplacer `alert()` par un état UI (toast/bandeau).

## Tests

- [x] **Tests composants (jsdom)** : harness `renderWithProviders` + tests `KpisTab`/`SimPanel`/`GlobalStrip`/`FieldGroup` (toggle auto-field, slider, flèches shift×10) ; math drag (clamp/shift×10) testée via `nextDragValue`. _Reste à faire : round-trip import→state._
