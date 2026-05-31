// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './renderWithProviders.jsx';
import { normalizeMoney } from './kpiNormalize.js';
import { useApp } from '../state/AppContext.jsx';

describe('normalizeMoney()', () => {
  it('strip le €, les espaces insécables et convertit la virgule', () => {
    expect(normalizeMoney('123 456 €')).toBeCloseTo(123456, 6);
    expect(normalizeMoney('1 234,56 €')).toBeCloseTo(1234.56, 6);
    expect(normalizeMoney('-2 500 €')).toBeCloseTo(-2500, 6);
  });

  it('retourne null pour le tiret / valeurs vides', () => {
    expect(normalizeMoney('—')).toBeNull();
    expect(normalizeMoney(null)).toBeNull();
  });
});

describe('renderWithProviders — harness', () => {
  it('rend un enfant dans l’arbre de providers réels (theme + i18n + AppContext)', () => {
    renderWithProviders(<div>harness-ok</div>);
    expect(screen.getByText('harness-ok')).toBeInTheDocument();
  });

  it('expose un AppContext réel : RES calculé pour les 3 sims', () => {
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

  it('applique les overrides via le seed localStorage', () => {
    const Probe = () => {
      const { G } = useApp();
      return <span data-testid="hz">{G.horizon}</span>;
    };
    renderWithProviders(<Probe />, { gOverride: { horizon: 15 } });
    expect(screen.getByTestId('hz')).toHaveTextContent('15');
  });
});
