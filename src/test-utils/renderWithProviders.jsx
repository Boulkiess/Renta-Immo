import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/index.js';
import { darkTheme } from '../theme/themes.js';
import { AppProvider } from '../state/AppContext.jsx';

const STORAGE_KEY = 'immorenta_state_v2';

/**
 * Render a component inside the REAL provider tree (theme + i18n + AppContext),
 * so tests exercise the actual compute() → format → DOM pipeline (D4).
 *
 * AppProvider seeds its state from localStorage on mount (AppContext.loadState),
 * so overrides are injected by seeding localStorage before render rather than by
 * touching the provider. setup.js clears localStorage after each test.
 *
 * @param {React.ReactElement} ui
 * @param {{ gOverride?: object, simsOverride?: object, theme?: object }} [opts]
 */
export function renderWithProviders(ui, { gOverride, simsOverride, theme = darkTheme } = {}) {
  if (gOverride || simsOverride) {
    const seed = {};
    if (gOverride) seed.G = gOverride;
    if (simsOverride) seed.sims = simsOverride;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  }
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <AppProvider>{ui}</AppProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
