import { useApp } from '../../state/AppContext.jsx';
import { COL } from '../../state/definitions.js';
import DisabledPanel from './DisabledPanel.jsx';
import CollapsedPanel from './CollapsedPanel.jsx';
import FullPanel from './FullPanel.jsx';

/**
 * Dispatches one simulation to its render branch:
 *   !enabled  → DisabledPanel (striped strip)
 *   collapsed → CollapsedPanel (vertical strip)
 *   else      → FullPanel (sliders + KPIs)
 */
export default function SimPanel({ simKey }) {
  const { G, sims, updateSim, RES } = useApp();
  const p = sims[simKey];
  const col = COL[simKey];

  if (!p.enabled) {
    return (
      <DisabledPanel
        col={col}
        label={p.label}
        onReactivate={() => updateSim(simKey, 'enabled', true)}
      />
    );
  }

  if (p.collapsed) {
    return (
      <CollapsedPanel
        col={col}
        label={p.label}
        totalWorth={RES[simKey].flows[G.horizon - 1]?.totalWorth}
        onExpand={() => updateSim(simKey, 'collapsed', false)}
      />
    );
  }

  return <FullPanel simKey={simKey} />;
}
