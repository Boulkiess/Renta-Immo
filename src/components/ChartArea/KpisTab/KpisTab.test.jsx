// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/renderWithProviders.jsx';
import { normalizeMoney } from '../../../test-utils/kpiNormalize.js';
import KpisTab from './index.jsx';
import { compute, computeEtfKpis } from '@immo-renta/engine';
import { DEFAULT_G, DEFAULT_SIMS, resolveAutoFields } from '../../../state/definitions.js';

// Reproduce the provider's pipeline (merge defaults → resolve auto → compute)
// so the DOM is checked against a real, independent engine result (D4).
const expectedA = compute(resolveAutoFields(DEFAULT_SIMS.A), DEFAULT_G);
const expectedEtf = computeEtfKpis(DEFAULT_G);

const tdValues = container =>
  [...container.querySelectorAll('td')].map(td => normalizeMoney(td.textContent));

describe('KpisTab (jsdom, real providers)', () => {
  it('renders the table with the pure ETF column', () => {
    renderWithProviders(<KpisTab />);
    // Default i18n language is French (cf. i18n/index.js) → "ETF pur".
    expect(screen.getByText('ETF pur')).toBeInTheDocument();
  });

  it('displays the real total cost computed by compute() for sim A', () => {
    const { container } = renderWithProviders(<KpisTab />);
    const vals = tdValues(container);
    expect(vals.some(n => n != null && Math.abs(n - expectedA.totalCost) < 1)).toBe(true);
  });

  it('the ETF cell of the NPV row reflects computeEtfKpis()', () => {
    const { container } = renderWithProviders(<KpisTab />);
    const vals = tdValues(container);
    // NPV ETF is a € amount: must appear normalized in a cell.
    expect(vals.some(n => n != null && Math.abs(n - Math.round(expectedEtf.van)) < 2)).toBe(true);
  });

  it('reacts to the horizon (seed override): 30-year wealth row present at horizon 20', () => {
    renderWithProviders(<KpisTab />, { gOverride: { horizon: 20 } });
    // At horizon 20 (<30), the wealth block adds "30y"/"30a" rows.
    expect(screen.getAllByText(/30\s*(a|y|ans)/i).length).toBeGreaterThan(0);
  });
});
