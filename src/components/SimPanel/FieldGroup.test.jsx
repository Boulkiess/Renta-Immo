// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import FieldGroup from './FieldGroup.jsx';
import { getGroups, AUTOABLE_FIELDS } from '../../state/definitions.js';

const groups = getGroups('rental');
const firstGroup = groups[0];
const autoGroup = groups.find(g => g.f.some(f => AUTOABLE_FIELDS.has(f.k)));

const renderGroup = (group, simsOverride) =>
  renderWithProviders(<FieldGroup simKey="A" group={group} open onToggle={() => {}} />, {
    simsOverride,
  });

describe('FieldGroup (jsdom)', () => {
  it('renders the group fields (at least one numeric input + one slider)', () => {
    const { container } = renderGroup(firstGroup);
    expect(container.querySelectorAll('input[inputmode="decimal"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('input[type="range"]').length).toBeGreaterThan(0);
  });

  it('arrow up increments by one step; shift+arrow increments by 10 steps (D9#8)', () => {
    const { container } = renderGroup(firstGroup);
    const input = container.querySelector('input[inputmode="decimal"]');
    const v0 = parseFloat(input.value);

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    const v1 = parseFloat(input.value);
    const d1 = v1 - v0;
    expect(d1).toBeGreaterThan(0);

    fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });
    const v2 = parseFloat(input.value);
    const d2 = v2 - v1;
    expect(d2).toBeCloseTo(d1 * 10, 6);
  });

  it('clicking the AUTO badge toggles a slider disabled state', () => {
    if (!autoGroup) return; // guard: no autoable field in this mode
    const { container } = renderGroup(autoGroup, { A: { autoFields: [] } });
    const disabledCount = () =>
      [...container.querySelectorAll('input[type="range"]')].filter(r => r.disabled).length;
    const before = disabledCount();
    const badge = [...container.querySelectorAll('button[type="button"]')].find(
      b => b.textContent.trim() !== '✕'
    );
    expect(badge).toBeTruthy();
    fireEvent.click(badge);
    expect(Math.abs(disabledCount() - before)).toBe(1);
  });
});
