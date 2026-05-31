// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import GlobalStrip from './GlobalStrip.jsx';

describe('GlobalStrip (jsdom)', () => {
  it('rend les réglages globaux (plusieurs entrées numériques + un select régime)', () => {
    const { container } = renderWithProviders(<GlobalStrip />);
    expect(container.querySelectorAll('input[type="number"]').length).toBeGreaterThan(5);
    expect(container.querySelector('select')).toBeTruthy();
  });

  it('modifier le premier champ (inflation) met à jour l’état via updateG', () => {
    const { container } = renderWithProviders(<GlobalStrip />, { gOverride: { inflation: 2 } });
    const inflation = container.querySelector('input[type="number"]');
    expect(inflation.value).toBe('2');
    fireEvent.change(inflation, { target: { value: '5' } });
    expect(inflation.value).toBe('5');
  });

  it('changer le régime fiscal via le select', () => {
    const { container } = renderWithProviders(<GlobalStrip />, { gOverride: { regime: 'lmnp' } });
    const select = container.querySelector('select');
    expect(select.value).toBe('lmnp');
    fireEvent.change(select, { target: { value: 'nu' } });
    expect(select.value).toBe('nu');
  });
});
