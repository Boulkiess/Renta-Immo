// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import GlobalStrip from './GlobalStrip.jsx';

describe('GlobalStrip (jsdom)', () => {
  it('renders the global settings (several numeric inputs + a regime select)', () => {
    const { container } = renderWithProviders(<GlobalStrip />);
    expect(container.querySelectorAll('input[type="number"]').length).toBeGreaterThan(5);
    expect(container.querySelector('select')).toBeTruthy();
  });

  it('editing the first field (inflation) updates the state via updateG', () => {
    const { container } = renderWithProviders(<GlobalStrip />, { gOverride: { inflation: 2 } });
    const inflation = container.querySelector('input[type="number"]');
    expect(inflation.value).toBe('2');
    fireEvent.change(inflation, { target: { value: '5' } });
    expect(inflation.value).toBe('5');
  });

  it('changing the tax regime via the select', () => {
    const { container } = renderWithProviders(<GlobalStrip />, { gOverride: { regime: 'lmnp' } });
    const select = container.querySelector('select');
    expect(select.value).toBe('lmnp');
    fireEvent.change(select, { target: { value: 'nu' } });
    expect(select.value).toBe('nu');
  });
});
