import { G, KEYS } from './state.js';
import {
  buildGS, buildTabs, renderPanel, renderLegend, rebuildShell, scheduleRedraw,
  setTab, togSim, setMode, togGrp, updS, updN, updLbl,
  toggleExpMenu, doExport, handleImport,
} from './render.js';

// Expose to window for inline HTML event handlers
Object.assign(window, {
  G, KEYS,
  buildGS, buildTabs, renderPanel, renderLegend, rebuildShell, scheduleRedraw,
  setTab, togSim, setMode, togGrp, updS, updN, updLbl,
  toggleExpMenu, doExport, handleImport,
});

// Init
buildGS();
buildTabs();
renderLegend();
KEYS.forEach(k => renderPanel(k));
rebuildShell();
scheduleRedraw();

window.addEventListener('resize', () => {
  clearTimeout(window._rt);
  window._rt = setTimeout(() => { rebuildShell(); scheduleRedraw(); }, 120);
});
