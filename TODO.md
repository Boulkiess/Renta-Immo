# TODO — refactoring reporté

Items identifiés lors de l'audit clean-code (cf. plan de refactoring) mais hors scope du lot
« tests + DRY ciblé ». À traiter dans des PR dédiés, une fois le filet de tests en place.

## Découpe des god-functions / god-components

- [ ] **`compute()`** (~171 l.) → sous-fonctions pures : amortissement, cashflow loc/rp, plus-value, TRI/VAN/MOIC.
- [ ] **`KpisTab.jsx`** (~540 l.) → sous-composants + sortir la math ETF (TRI/VAN/MOIC) du composant vers le moteur.
- [ ] **`SimPanel.jsx` / `GlobalStrip.jsx` / `FieldGroup.jsx`** → styled-components externalisés + sous-composants data-driven.

## Rendu & I/O

- [ ] **`charts.js`** → extraire setup canvas / couleurs thème / grille / x-labels (dupliqués 3×).
- [ ] **`io.js`** → durcir le parser YAML fait-maison, remplacer `alert()` par un état UI (toast/bandeau).

## Tests

- [ ] **Tests composants (jsdom)** : interaction drag (clamp, shift×10), toggle auto-field, round-trip import→state.
