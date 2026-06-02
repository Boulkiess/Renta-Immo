import { describe, it, expect } from 'vitest';
import { parseNum, findBestIdx } from './kpiFormat.js';

describe('parseNum()', () => {
  it('parses fr-FR amounts (non-breaking space, €, comma)', () => {
    expect(parseNum('285 000 €')).toBeCloseTo(285000, 6);
    expect(parseNum('1 234,56 €')).toBeCloseTo(1234.56, 6);
    expect(parseNum('-2 500 €')).toBeCloseTo(-2500, 6);
  });
  it('returns null for dash / null', () => {
    expect(parseNum('—')).toBeNull();
    expect(parseNum(null)).toBeNull();
  });
});

describe('findBestIdx()', () => {
  it('max: index of the largest value', () => {
    expect(findBestIdx([10, 30, 20], 'max', 3)).toBe(1);
  });
  it('min: index of the smallest value', () => {
    expect(findBestIdx([10, 30, 20], 'min', 3)).toBe(0);
  });
  it('null with a single column or no direction', () => {
    expect(findBestIdx([10], 'max', 1)).toBeNull();
    expect(findBestIdx([10, 20], undefined, 2)).toBeNull();
  });
  it('ignores null / non-finite values among the valid ones', () => {
    // 20 is the max of the two valid values (5, 20) → index 2
    expect(findBestIdx([null, 5, 20], 'max', 3)).toBe(2);
  });
  it('null with fewer than 2 valid values', () => {
    expect(findBestIdx([null, 5, null], 'max', 3)).toBeNull();
  });
});
