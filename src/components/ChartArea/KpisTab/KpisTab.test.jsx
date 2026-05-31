// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/renderWithProviders.jsx';
import { normalizeMoney } from '../../../test-utils/kpiNormalize.js';
import KpisTab from './index.jsx';
import { compute, computeEtfKpis } from '../../../engine/compute.js';
import { DEFAULT_G, DEFAULT_SIMS, resolveAutoFields } from '../../../state/definitions.js';

// Reproduce the provider's pipeline (merge defaults → resolve auto → compute)
// so the DOM is checked against a real, independent engine result (D4).
const expectedA = compute(resolveAutoFields(DEFAULT_SIMS.A), DEFAULT_G);
const expectedEtf = computeEtfKpis(DEFAULT_G);

const tdValues = container =>
  [...container.querySelectorAll('td')].map(td => normalizeMoney(td.textContent));

describe('KpisTab (jsdom, providers réels)', () => {
  it('rend la table avec la colonne ETF pur', () => {
    renderWithProviders(<KpisTab />);
    expect(screen.getByText('ETF pur')).toBeInTheDocument();
  });

  it('affiche le coût total réel calculé par compute() pour la sim A', () => {
    const { container } = renderWithProviders(<KpisTab />);
    const vals = tdValues(container);
    expect(vals.some(n => n != null && Math.abs(n - expectedA.ct) < 1)).toBe(true);
  });

  it('la cellule ETF de la ligne VAN reflète computeEtfKpis()', () => {
    const { container } = renderWithProviders(<KpisTab />);
    const vals = tdValues(container);
    // VAN ETF est un montant € : doit apparaître normalisé dans une cellule.
    expect(vals.some(n => n != null && Math.abs(n - Math.round(expectedEtf.van)) < 2)).toBe(true);
  });

  it('réagit à l’horizon (seed override) : ligne patrimoine 30 ans présente à horizon 20', () => {
    renderWithProviders(<KpisTab />, { gOverride: { horizon: 20 } });
    // À horizon 20 (<30), le bloc patrimoine ajoute des lignes "30 ans".
    expect(screen.getAllByText(/30 ans|30\s*ans/i).length).toBeGreaterThan(0);
  });
});
