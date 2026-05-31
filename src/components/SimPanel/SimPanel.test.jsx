// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import SimPanel from './SimPanel.jsx';

const seed = over => ({ A: { ...over } });

describe('SimPanel — dispatch des 3 branches (jsdom)', () => {
  it('branche désactivée : strip "off" + bouton réactiver, pas de sliders', () => {
    const { container } = renderWithProviders(<SimPanel simKey="A" />, {
      simsOverride: seed({ enabled: false, label: 'SimOff' }),
    });
    expect(screen.getByText('off')).toBeInTheDocument();
    expect(screen.getByText('SimOff')).toBeInTheDocument();
    expect(container.querySelector('input[type="range"]')).toBeNull();
  });

  it('branche réduite : label vertical + patrimoine (€), pas de sliders', () => {
    const { container } = renderWithProviders(<SimPanel simKey="A" />, {
      simsOverride: seed({ enabled: true, collapsed: true, label: 'SimMini' }),
    });
    expect(screen.getByText('SimMini')).toBeInTheDocument();
    expect(container.textContent).toMatch(/€/);
    expect(container.querySelector('input[type="range"]')).toBeNull();
  });

  it('branche complète : champ label éditable, boutons mode, chips KPI, sliders', () => {
    const { container } = renderWithProviders(<SimPanel simKey="A" />, {
      simsOverride: seed({ enabled: true, collapsed: false, label: 'SimFull', mode: 'loc' }),
    });
    expect(screen.getByDisplayValue('SimFull')).toBeInTheDocument();
    // chips KPI : la mensualité est un montant € ; sliders présents
    expect(container.textContent).toMatch(/€/);
    expect(container.querySelectorAll('input[type="range"]').length).toBeGreaterThan(0);
  });
});
