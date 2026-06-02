import { describe, it, expect } from 'vitest';
import { mkDef, simCopyPayload } from './definitions.js';

describe('simCopyPayload', () => {
  it('excludes identity/view state and keeps mode + params + autoFields', () => {
    const p = { ...mkDef('rental'), label: 'Sim A', enabled: false, collapsed: true };
    const payload = simCopyPayload(p);

    // identity / view state removed
    expect(payload).not.toHaveProperty('label');
    expect(payload).not.toHaveProperty('enabled');
    expect(payload).not.toHaveProperty('collapsed');

    // mode + financial parameters kept
    expect(payload.mode).toBe('rental');
    expect(payload.purchasePrice).toBe(p.purchasePrice);
    expect(payload.interestRate).toBe(p.interestRate);
    expect(payload.autoFields).toEqual(p.autoFields);
  });

  it('clones autoFields — mutating the payload does not touch the source', () => {
    const p = mkDef('rental');
    const payload = simCopyPayload(p);
    payload.autoFields.push('purchasePrice');
    expect(p.autoFields).not.toContain('purchasePrice');
  });

  it('tolerates a sim without autoFields', () => {
    const { autoFields: _drop, ...noAuto } = mkDef('primary');
    const payload = simCopyPayload(noAuto);
    expect(payload.autoFields).toEqual([]);
  });
});
