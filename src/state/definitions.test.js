import { describe, it, expect } from 'vitest';
import { mkDef, simCopyPayload } from './definitions.js';

describe('simCopyPayload', () => {
  it('exclut l’identité/état d’affichage et conserve mode + params + autoFields', () => {
    const p = { ...mkDef('loc'), label: 'Sim A', enabled: false, collapsed: true };
    const payload = simCopyPayload(p);

    // identité / état d'affichage retirés
    expect(payload).not.toHaveProperty('label');
    expect(payload).not.toHaveProperty('enabled');
    expect(payload).not.toHaveProperty('collapsed');

    // mode + paramètres financiers conservés
    expect(payload.mode).toBe('loc');
    expect(payload.prixAchat).toBe(p.prixAchat);
    expect(payload.taux).toBe(p.taux);
    expect(payload.autoFields).toEqual(p.autoFields);
  });

  it('clone autoFields — muter le payload ne touche pas la source', () => {
    const p = mkDef('loc');
    const payload = simCopyPayload(p);
    payload.autoFields.push('prixAchat');
    expect(p.autoFields).not.toContain('prixAchat');
  });

  it('tolère un sim sans autoFields', () => {
    const { autoFields: _drop, ...noAuto } = mkDef('rp');
    const payload = simCopyPayload(noAuto);
    expect(payload.autoFields).toEqual([]);
  });
});
