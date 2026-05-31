// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import FieldGroup from './FieldGroup.jsx';
import { getGroups, AUTOABLE_FIELDS } from '../../state/definitions.js';

const groups = getGroups('loc');
const firstGroup = groups[0];
const autoGroup = groups.find(g => g.f.some(f => AUTOABLE_FIELDS.has(f.k)));

const renderGroup = (group, simsOverride) =>
  renderWithProviders(<FieldGroup simKey="A" group={group} open onToggle={() => {}} />, {
    simsOverride,
  });

describe('FieldGroup (jsdom)', () => {
  it('rend les champs du groupe (au moins un input numérique + un slider)', () => {
    const { container } = renderGroup(firstGroup);
    expect(container.querySelectorAll('input[inputmode="decimal"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('input[type="range"]').length).toBeGreaterThan(0);
  });

  it('flèche haut incrémente d’un pas ; shift+flèche incrémente de 10 pas (D9#8)', () => {
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

  it('cliquer le badge AUTO bascule l’état disabled d’un slider', () => {
    if (!autoGroup) return; // garde : aucun champ autoable dans ce mode
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
