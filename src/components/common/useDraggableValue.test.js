import { describe, it, expect } from 'vitest';
import { stepDecimals, nextDragValue } from './useDraggableValue.js';

describe('stepDecimals()', () => {
  it.each([
    [1, 0],
    [0.5, 1],
    [0.05, 2],
    [100, 0],
  ])('pas %p → %i décimales', (st, dec) => {
    expect(stepDecimals(st)).toBe(dec);
  });
});

describe('nextDragValue() — math du glissement (clamp / shift×10)', () => {
  // PIXELS_PER_STEP = 6 : un déplacement de -6px = +1 pas.
  it('un déplacement vers le haut (movementY négatif) augmente la valeur d’un pas', () => {
    const { clamped } = nextDragValue(100, -6, 1, false, 0, 1000, 0);
    expect(clamped).toBe(101);
  });

  it('shift multiplie le pas par 10', () => {
    const sans = nextDragValue(100, -6, 1, false, 0, 1000, 0).clamped;
    const avec = nextDragValue(100, -6, 1, true, 0, 1000, 0).clamped;
    expect(avec - 100).toBeCloseTo((sans - 100) * 10, 6);
    expect(avec).toBe(110);
  });

  it('clampe au maximum', () => {
    expect(nextDragValue(995, -60, 1, false, 0, 1000, 0).clamped).toBe(1000);
  });

  it('clampe au minimum', () => {
    expect(nextDragValue(3, 60, 1, false, 0, 1000, 0).clamped).toBe(0);
  });

  it('respecte les décimales du pas', () => {
    const { clamped } = nextDragValue(1.0, -6, 0.05, false, 0, 5, 2);
    expect(clamped).toBeCloseTo(1.05, 6);
  });

  it('raw (non clampé) accumule au-delà des bornes pour un glissement continu fluide', () => {
    const { raw } = nextDragValue(995, -60, 1, false, 0, 1000, 0);
    expect(raw).toBeGreaterThan(1000);
  });
});
