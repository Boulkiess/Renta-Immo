import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { DEFAULT_G, DEFAULT_SIMS, KEYS } from './definitions.js';
import { compute, computeEtfPur, crossoverYear } from '../engine/compute.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [G, setG] = useState(DEFAULT_G);
  const [sims, setSims] = useState(DEFAULT_SIMS);
  const [curTab, setCurTab] = useState('charts');
  const [openGrp, setOpenGrp] = useState({ A: 'Acquisition', B: 'Acquisition', C: 'Acquisition' });

  const etfPurGlobal = useMemo(() => computeEtfPur(G), [G]);

  const RES = useMemo(() => {
    const r = {};
    KEYS.forEach(k => { r[k] = compute(sims[k], G); });
    return r;
  }, [sims, G]);

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

  return (
    <AppContext.Provider value={{
      G, updateG,
      sims, updateSim, updateSimBulk,
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
