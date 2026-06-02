import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { DEFAULT_G, DEFAULT_SIMS, KEYS, resolveAutoFields, simCopyPayload } from './definitions.js';
import { compute, computeEtfScenario, crossoverYear } from '@immo-renta/engine';

// Bumped to v2 with the English-identifier migration: old French-keyed state is
// intentionally ignored (no back-compat) rather than silently half-loaded.
const STORAGE_KEY = 'immorenta_state_v2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState({ G, sims, curTab, openGrp }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ G, sims, curTab, openGrp }));
  } catch (_e) {
    // localStorage can throw in private browsing — ignore silently
  }
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
  const [openGrp, setOpenGrp] = useState(
    () => saved?.openGrp ?? { A: 'Acquisition', B: 'Acquisition', C: 'Acquisition' }
  );
  // Copy/paste clipboard for simulations. In-memory only (not persisted) — paste
  // becomes available once a copy is made and resets on reload (Ctrl+C-like).
  const [clipboard, setClipboard] = useState(null);

  const etfScenarioGlobal = useMemo(() => computeEtfScenario(G), [G]);

  /** resolvedSims: auto fields replaced by computed values. Use for display and compute(). */
  const resolvedSims = useMemo(() => {
    const r = {};
    KEYS.forEach(k => {
      r[k] = resolveAutoFields(sims[k]);
    });
    return r;
  }, [sims]);

  /** RES: financial engine results, always computed from resolved (auto-applied) params. */
  const RES = useMemo(() => {
    const r = {};
    KEYS.forEach(k => {
      r[k] = compute(resolvedSims[k], G);
    });
    return r;
  }, [resolvedSims, G]);

  const crossovers = useMemo(() => {
    const r = {};
    KEYS.forEach(k => {
      r[k] = crossoverYear(RES[k], etfScenarioGlobal, G);
    });
    return r;
  }, [RES, etfScenarioGlobal, G]);

  const updateG = useCallback(updates => {
    setG(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSim = useCallback((key, field, value) => {
    setSims(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }, []);

  const updateSimBulk = useCallback((key, updates) => {
    setSims(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  }, []);

  /** Copy a simulation's financial inputs into the clipboard (excludes identity). */
  const copySim = useCallback(key => setClipboard(simCopyPayload(sims[key])), [sims]);

  /** Paste the clipboard onto a target sim, keeping its label/enabled/collapsed. */
  const pasteSim = useCallback(
    targetKey => {
      if (!clipboard) return;
      updateSimBulk(targetKey, clipboard);
    },
    [clipboard, updateSimBulk]
  );

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
  useEffect(() => {
    stateRef.current = { G, sims, curTab, openGrp };
  });
  useEffect(() => {
    const save = () => saveState(stateRef.current);
    window.addEventListener('beforeunload', save);
    return () => {
      window.removeEventListener('beforeunload', save);
      save();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        G,
        updateG,
        sims,
        resolvedSims,
        updateSim,
        updateSimBulk,
        copySim,
        pasteSim,
        clipboard,
        toggleAutoField,
        curTab,
        setCurTab,
        openGrp,
        toggleOpenGrp,
        RES,
        etfScenarioGlobal,
        crossovers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
