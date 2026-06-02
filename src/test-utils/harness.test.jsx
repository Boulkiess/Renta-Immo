// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './renderWithProviders.jsx';
import { normalizeMoney } from './kpiNormalize.js';
import { useApp } from '../state/AppContext.jsx';

describe('normalizeMoney()', () => {
  it('strips €, non-breaking spaces and converts the comma', () => {
    expect(normalizeMoney('123 456 €')).toBeCloseTo(123456, 6);
    expect(normalizeMoney('1 234,56 €')).toBeCloseTo(1234.56, 6);
    expect(normalizeMoney('-2 500 €')).toBeCloseTo(-2500, 6);
  });

  it('returns null for the dash / empty values', () => {
    expect(normalizeMoney('—')).toBeNull();
    expect(normalizeMoney(null)).toBeNull();
  });
});

describe('renderWithProviders — harness', () => {
  it('renders a child inside the real provider tree (theme + i18n + AppContext)', () => {
    renderWithProviders(<div>harness-ok</div>);
    expect(screen.getByText('harness-ok')).toBeInTheDocument();
  });

  it('exposes a real AppContext: RES computed for the 3 sims', () => {
    const Probe = () => {
      const { RES, G } = useApp();
      return (
        <span data-testid="probe">
          {Object.keys(RES).join(',')}|{G.horizon}
        </span>
      );
    };
    renderWithProviders(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('A,B,C|20');
  });

  it('applies overrides via the localStorage seed', () => {
    const Probe = () => {
      const { G } = useApp();
      return <span data-testid="hz">{G.horizon}</span>;
    };
    renderWithProviders(<Probe />, { gOverride: { horizon: 15 } });
    expect(screen.getByTestId('hz')).toHaveTextContent('15');
  });
});
