// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import { useApp } from '../../state/AppContext.jsx';
import SimPanel from './SimPanel.jsx';

const seed = over => ({ A: { ...over } });

describe('SimPanel — dispatch of the 3 branches (jsdom)', () => {
  it('disabled branch: "off" strip + reactivate button, no sliders', () => {
    const { container } = renderWithProviders(<SimPanel simKey="A" />, {
      simsOverride: seed({ enabled: false, label: 'SimOff' }),
    });
    expect(screen.getByText('off')).toBeInTheDocument();
    expect(screen.getByText('SimOff')).toBeInTheDocument();
    expect(container.querySelector('input[type="range"]')).toBeNull();
  });

  it('collapsed branch: vertical label + wealth (€), no sliders', () => {
    const { container } = renderWithProviders(<SimPanel simKey="A" />, {
      simsOverride: seed({ enabled: true, collapsed: true, label: 'SimMini' }),
    });
    expect(screen.getByText('SimMini')).toBeInTheDocument();
    expect(container.textContent).toMatch(/€/);
    expect(container.querySelector('input[type="range"]')).toBeNull();
  });

  it('full branch: editable label field, mode buttons, KPI chips, sliders', () => {
    const { container } = renderWithProviders(<SimPanel simKey="A" />, {
      simsOverride: seed({ enabled: true, collapsed: false, label: 'SimFull', mode: 'rental' }),
    });
    expect(screen.getByDisplayValue('SimFull')).toBeInTheDocument();
    // KPI chips: the monthly payment is a € amount; sliders present
    expect(container.textContent).toMatch(/€/);
    expect(container.querySelectorAll('input[type="range"]').length).toBeGreaterThan(0);
  });
});

/** Reads selected sim fields from the shared AppContext for integration asserts. */
function Probe() {
  const { sims } = useApp();
  return <div data-testid="probe">{`${sims.B.label}|${sims.B.purchasePrice}|${sims.B.mode}`}</div>;
}

describe('SimPanel — copy/paste context menu (jsdom)', () => {
  it('header: kebab present, no switch; 3 items, "Paste" disabled without a copy', () => {
    const { container } = renderWithProviders(<SimPanel simKey="A" />, {
      simsOverride: seed({ enabled: true, collapsed: false, mode: 'rental' }),
    });
    // no more checkbox (the old Toggle)
    expect(container.querySelector('input[type="checkbox"]')).toBeNull();

    fireEvent.click(screen.getByTitle('Actions sur cette simulation'));
    expect(screen.getByText('Désactiver')).toBeInTheDocument();
    expect(screen.getByText('Copier')).toBeInTheDocument();
    const paste = screen.getByText('Coller');
    expect(paste).toBeInTheDocument();
    expect(paste.closest('button')).toBeDisabled();
  });

  it('copy A → paste B: B takes A mode+params but keeps its label, A stays enabled', () => {
    renderWithProviders(
      <>
        <SimPanel simKey="A" />
        <SimPanel simKey="B" />
        <Probe />
      </>,
      {
        simsOverride: {
          A: { enabled: true, collapsed: false, mode: 'rental', purchasePrice: 280000 },
          B: {
            enabled: true,
            collapsed: false,
            mode: 'primary',
            purchasePrice: 320000,
            label: 'RP B',
          },
        },
      }
    );

    const probe = () => screen.getByTestId('probe').textContent;
    expect(probe()).toBe('RP B|320000|primary');

    const triggers = screen.getAllByTitle('Actions sur cette simulation');
    // Copy on A
    fireEvent.click(triggers[0]);
    fireEvent.click(screen.getByText('Copier'));
    // Paste on B (now enabled)
    fireEvent.click(triggers[1]);
    fireEvent.click(screen.getByText('Coller'));

    // B = financial clone of A, but keeps its identity
    expect(probe()).toBe('RP B|280000|rental');
  });
});
