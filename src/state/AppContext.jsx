import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DEFAULT_G, DEFAULT_SIMS, KEYS, resolveAutoFields } from './definitions.js';
import { compute, computeEtfPur, crossoverYear } from '../engine/compute.js';

const STORAGE_KEY = 'immorenta_state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState({ G, sims, curTab, openGrp }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ G, sims, curTab, openGrp }));
  } catch {}
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const saved = useMemo(loadState, []);

  const [G, setG] = useState(() => ({ ...DEFAULT_G, ...saved?.G }));
  const [sims, setSims] = useState(() => ({
    A: { ...DEFAULT_SIMS.A, ...saved?.sims?.A },
    B: { ...DEFAULT_SIMS.B, ...saved?.sims?.B },
    C: { ...DEFAULT_SIMS.C, ...saved?.sims?.C },
  }));
  const [curTab, setCurTab] = useState(() => saved?.curTab ?? 'charts');
  const [openGrp, setOpenGrp] = useState(() => saved?.openGrp ?? { A: 'Acquisition', B: 'Acquisition', C: 'Acquisition' });

  const etfPurGlobal = useMemo(() => computeEtfPur(G), [G]);

  /** resolvedSims: auto fields replaced by computed values. Use for display and compute(). */
  const resolvedSims = useMemo(() => {
    const r = {};
    KEYS.forEach(k => { r[k] = resolveAutoFields(sims[k]); });
    return r;
  }, [sims]);

  /** RES: financial engine results, always computed from resolved (auto-applied) params. */
  const RES = useMemo(() => {
    const r = {};
    KEYS.forEach(k => { r[k] = compute(resolvedSims[k], G); });
    return r;
  }, [resolvedSims, G]);

  const crossovers = useMemo(() => {
    const r = {};
    KEYS.forEach(k => { r[k] = crossoverYear(RES[k], etfPurGlobal, G); });
    return r;
  }, [RES, etfPurGlobal, G]);

  const updateG = useCallback((updates) => {
    setG(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSim = useCallback((key, field, value) => {
    setSims(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }, []);

  const updateSimBulk = useCallback((key, updates) => {
    setSims(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  }, []);

  const toggleOpenGrp = useCallback((key, grp) => {
    setOpenGrp(prev => ({ ...prev, [key]: prev[key] === grp ? null : grp }));
  }, []);

  const toggleAutoField = useCallback((simKey, fieldKey) => {
    setSims(prev => {
      const p = prev[simKey];
      const af = p.autoFields ?? [];
      const next = af.includes(fieldKey) ? af.filter(x => x !== fieldKey) : [...af, fieldKey];
      return { ...prev, [simKey]: { ...p, autoFields: next } };
    });
  }, []);

  const stateRef = useRef({ G, sims, curTab, openGrp });
  useEffect(() => { stateRef.current = { G, sims, curTab, openGrp }; });
  useEffect(() => {
    const save = () => saveState(stateRef.current);
    window.addEventListener('beforeunload', save);
    return () => {
      window.removeEventListener('beforeunload', save);
      save();
    };
  }, []);

  return (
    <AppContext.Provider value={{
      G, updateG,
      sims, resolvedSims, updateSim, updateSimBulk, toggleAutoField,
      curTab, setCurTab,
      openGrp, toggleOpenGrp,
      RES, etfPurGlobal, crossovers,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
