import { describe, it, expect } from 'vitest';
import { parseNum, findBestIdx } from './kpiFormat.js';

describe('parseNum()', () => {
  it('parse les montants fr-FR (espace insécable, €, virgule)', () => {
    expect(parseNum('285 000 €')).toBeCloseTo(285000, 6);
    expect(parseNum('1 234,56 €')).toBeCloseTo(1234.56, 6);
    expect(parseNum('-2 500 €')).toBeCloseTo(-2500, 6);
  });
  it('retourne null pour tiret / null', () => {
    expect(parseNum('—')).toBeNull();
    expect(parseNum(null)).toBeNull();
  });
});

describe('findBestIdx()', () => {
  it('max : indice de la plus grande valeur', () => {
    expect(findBestIdx([10, 30, 20], 'max', 3)).toBe(1);
  });
  it('min : indice de la plus petite valeur', () => {
    expect(findBestIdx([10, 30, 20], 'min', 3)).toBe(0);
  });
  it('null quand une seule colonne ou pas de direction', () => {
    expect(findBestIdx([10], 'max', 1)).toBeNull();
    expect(findBestIdx([10, 20], undefined, 2)).toBeNull();
  });
  it('ignore les valeurs nulles / non finies parmi les valides', () => {
    // 20 est le max des deux valeurs valides (5, 20) → indice 2
    expect(findBestIdx([null, 5, 20], 'max', 3)).toBe(2);
  });
  it('null quand moins de 2 valeurs valides', () => {
    expect(findBestIdx([null, 5, null], 'max', 3)).toBeNull();
  });
});
