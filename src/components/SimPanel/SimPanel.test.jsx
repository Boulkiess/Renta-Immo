// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import { useApp } from '../../state/AppContext.jsx';
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

/** Reads selected sim fields from the shared AppContext for integration asserts. */
function Probe() {
  const { sims } = useApp();
  return <div data-testid="probe">{`${sims.B.label}|${sims.B.prixAchat}|${sims.B.mode}`}</div>;
}

describe('SimPanel — menu contextuel copier/coller (jsdom)', () => {
  it('en-tête : kebab présent, pas de switch ; 3 items dont « Coller » désactivé sans copie', () => {
    const { container } = renderWithProviders(<SimPanel simKey="A" />, {
      simsOverride: seed({ enabled: true, collapsed: false, mode: 'loc' }),
    });
    // plus de checkbox (l'ancien Toggle)
    expect(container.querySelector('input[type="checkbox"]')).toBeNull();

    fireEvent.click(screen.getByTitle('Actions sur cette simulation'));
    expect(screen.getByText('Désactiver')).toBeInTheDocument();
    expect(screen.getByText('Copier')).toBeInTheDocument();
    const coller = screen.getByText('Coller');
    expect(coller).toBeInTheDocument();
    expect(coller.closest('button')).toBeDisabled();
  });

  it('copier A → coller B : B prend mode+params de A mais garde son label, A reste activée', () => {
    renderWithProviders(
      <>
        <SimPanel simKey="A" />
        <SimPanel simKey="B" />
        <Probe />
      </>,
      {
        simsOverride: {
          A: { enabled: true, collapsed: false, mode: 'loc', prixAchat: 280000 },
          B: { enabled: true, collapsed: false, mode: 'rp', prixAchat: 320000, label: 'RP B' },
        },
      }
    );

    const probe = () => screen.getByTestId('probe').textContent;
    expect(probe()).toBe('RP B|320000|rp');

    const triggers = screen.getAllByTitle('Actions sur cette simulation');
    // Copier sur A
    fireEvent.click(triggers[0]);
    fireEvent.click(screen.getByText('Copier'));
    // Coller sur B (désormais actif)
    fireEvent.click(triggers[1]);
    fireEvent.click(screen.getByText('Coller'));

    // B = clone financier de A, mais garde son identité
    expect(probe()).toBe('RP B|280000|loc');
  });
});
