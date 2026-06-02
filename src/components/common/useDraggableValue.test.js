import { describe, it, expect } from 'vitest';
import { stepDecimals, nextDragValue } from './useDraggableValue.js';

describe('stepDecimals()', () => {
  it.each([
    [1, 0],
    [0.5, 1],
    [0.05, 2],
    [100, 0],
  ])('step %p → %i decimals', (st, dec) => {
    expect(stepDecimals(st)).toBe(dec);
  });
});

describe('nextDragValue() — drag math (clamp / shift×10)', () => {
  // PIXELS_PER_STEP = 6: a -6px movement = +1 step.
  it('an upward movement (negative movementY) increases the value by one step', () => {
    const { clamped } = nextDragValue(100, -6, 1, false, 0, 1000, 0);
    expect(clamped).toBe(101);
  });

  it('shift multiplies the step by 10', () => {
    const sans = nextDragValue(100, -6, 1, false, 0, 1000, 0).clamped;
    const avec = nextDragValue(100, -6, 1, true, 0, 1000, 0).clamped;
    expect(avec - 100).toBeCloseTo((sans - 100) * 10, 6);
    expect(avec).toBe(110);
  });

  it('clamps to the maximum', () => {
    expect(nextDragValue(995, -60, 1, false, 0, 1000, 0).clamped).toBe(1000);
  });

  it('clamps to the minimum', () => {
    expect(nextDragValue(3, 60, 1, false, 0, 1000, 0).clamped).toBe(0);
  });

  it('respects the step decimals', () => {
    const { clamped } = nextDragValue(1.0, -6, 0.05, false, 0, 5, 2);
    expect(clamped).toBeCloseTo(1.05, 6);
  });

  it('raw (unclamped) accumulates beyond the bounds for smooth continuous dragging', () => {
    const { raw } = nextDragValue(995, -60, 1, false, 0, 1000, 0);
    expect(raw).toBeGreaterThan(1000);
  });
});
