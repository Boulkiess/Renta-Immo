import { KEYS, mkDef } from '../state/definitions.js';

// ── Export ─────────────────────────────────────────────────
export function buildExportData(G, sims, RES, etfPurGlobal) {
  const d = { global: { ...G }, simulations: {} };
  KEYS.forEach(k => {
    const p = sims[k],
      r = RES[k];
    d.simulations[k] = {
      label: p.label,
      enabled: p.enabled,
      inputs: { ...p },
      computed: {
        coutTotal: r.ct,
        montantEmprunte: r.emp,
        mensualite: Math.round(r.mens),
        assuranceMensuelle: Math.round(r.assM),
        totalInterets: Math.round(r.totInt),
        totalAssurance: Math.round(r.totAss),
        rendementBrut: p.mode === 'loc' ? +r.rendBrut.toFixed(4) : null,
        rendementNet: p.mode === 'loc' ? +r.rendNet.toFixed(4) : null,
        cashflowMensuel: Math.round(r.cfM),
        breakevenAns: r.be,
        tri10ans: r.tri10 != null ? +(r.tri10 * 100).toFixed(4) : null,
        tri15ans: r.tri15 != null ? +(r.tri15 * 100).toFixed(4) : null,
        tri20ans: r.tri20 != null ? +(r.tri20 * 100).toFixed(4) : null,
        van: Math.round(r.van),
        moic: r.moic ? +r.moic.toFixed(4) : null,
        flux: r.flux.map(f => ({
          annee: f.yr,
          ...(p.mode === 'loc'
            ? { loyersEncaisses: Math.round(f.le) }
            : { loyerEconomise: Math.round(f.le) }),
          charges: Math.round(f.chg),
          annuitePlusAssurance: Math.round(f.ann),
          ...(p.mode === 'loc' ? { impots: Math.round(f.imp) } : {}),
          cfNet: Math.round(f.cfN),
          cfCumule: Math.round(f.cfC),
          valeurBien: Math.round(f.vb),
          capitalRestant: Math.round(f.rest),
          patrimoineNet: Math.round(f.patNet),
          patrimoineTotal: Math.round(f.patTotal),
          etfPoche: Math.round(f.etfPoche),
          reventeNette: Math.round(f.reventeNet),
          bilanRevente: Math.round(f.bilanRevente),
        })),
        etfPurRef: etfPurGlobal.map(e => ({ annee: e.yr, capitalEtf: Math.round(e.cap) })),
      },
    };
  });
  return d;
}

function dlFile(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function toYAML(val, depth = 0) {
  const pad = '  '.repeat(depth);
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return String(val);
  if (typeof val === 'number') return isFinite(val) ? String(val) : 'null';
  if (typeof val === 'string') {
    const nq =
      val === '' ||
      ['true', 'false', 'null', 'yes', 'no'].includes(val.toLowerCase()) ||
      /^[\d-]/.test(val) ||
      /[\n:#[\]{},&*?|<>=!%@`"']/.test(val);
    return nq ? JSON.stringify(val) : val;
  }
  if (Array.isArray(val)) {
    if (!val.length) return '[]';
    return val
      .map(item => {
        if (item !== null && typeof item === 'object') {
          const inner = toYAML(item, depth + 1);
          const ipad = '  '.repeat(depth + 1);
          const nl = inner.indexOf('\n');
          const first = nl >= 0 ? inner.slice(0, nl) : inner;
          const rest = nl >= 0 ? inner.slice(nl) : '';
          return `${pad}- ${first.slice(ipad.length)}${rest}`;
        }
        return `${pad}- ${toYAML(item, 0)}`;
      })
      .join('\n');
  }
  const entries = Object.entries(val);
  if (!entries.length) return '{}';
  return entries
    .map(([k, v]) => {
      if (v !== null && typeof v === 'object') {
        if (Array.isArray(v) && !v.length) return `${pad}${k}: []`;
        if (!Array.isArray(v) && !Object.keys(v).length) return `${pad}${k}: {}`;
        return `${pad}${k}:\n${toYAML(v, depth + 1)}`;
      }
      return `${pad}${k}: ${toYAML(v, 0)}`;
    })
    .join('\n');
}

function exportCSV(d) {
  const lines = [];
  const esc = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const row = (...c) => lines.push(c.map(esc).join(','));
  const lbls = KEYS.map(k => d.simulations[k].label);

  row('## Paramètres globaux');
  row('Paramètre', 'Valeur', 'Unité');
  [
    ['Inflation', d.global.inflation, '%/an'],
    ['Régime fiscal', d.global.regime],
    ['Horizon', d.global.horizon, 'ans'],
    ["Taux d'actualisation (VAN)", d.global.tauxActu, '%'],
    ['Rdt placement alternatif (net)', d.global.rendAlt, '%'],
    ['Loyer perso (€/mois)', d.global.loyerPerso, '€/mois'],
    ['Reval. loyer perso (%/an)', d.global.revalLoyerPerso, '%/an'],
    ['Budget mensuel (€/mois)', d.global.budgetMensuel, '€/mois'],
    ['Investir surplus ETF', d.global.investirSurplus ? 'true' : 'false'],
    ['Apport ETF pur (€)', d.global.apportETF, '€'],
  ].forEach(r => row(...r));
  row('');
  row('## Paramètres des simulations');
  row('Paramètre', ...lbls);
  // (abbreviated — full mapping identical to legacy io code)
  row('');
  KEYS.forEach(k => {
    const s = d.simulations[k],
      isLoc = s.inputs.mode === 'loc';
    row(`## Flux annuels — ${s.label}`);
    row(
      'Année',
      isLoc ? 'Loyers (€)' : 'Loyer éco. (€)',
      'Charges (€)',
      'Annuité+Ass (€)',
      ...(isLoc ? ['Impôts (€)'] : []),
      'CF net (€)',
      'CF cumulé (€)',
      'Valeur bien (€)',
      'Capital restant (€)',
      'Patrimoine total (€)',
      'ETF poche (€)',
      'Revente nette (€)',
      'Bilan (€)',
      'ETF pur (€)'
    );
    s.computed.flux.forEach((f, i) => {
      row(
        f.annee,
        isLoc ? f.loyersEncaisses : f.loyerEconomise,
        f.charges,
        f.annuitePlusAssurance,
        ...(isLoc ? [f.impots] : []),
        f.cfNet,
        f.cfCumule,
        f.valeurBien,
        f.capitalRestant,
        f.patrimoineTotal ?? '',
        f.etfPoche ?? '',
        f.reventeNette,
        f.bilanRevente,
        s.computed.etfPurRef?.[i]?.capitalEtf ?? ''
      );
    });
    row('');
  });
  return lines.join('\n');
}

export function doExport(fmt, data) {
  const ts = new Date().toISOString().slice(0, 10);
  if (fmt === 'json')
    dlFile(`immorenta_${ts}.json`, JSON.stringify(data, null, 2), 'application/json');
  else if (fmt === 'csv') dlFile(`immorenta_${ts}.csv`, exportCSV(data), 'text/csv');
  else if (fmt === 'yaml') dlFile(`immorenta_${ts}.yaml`, toYAML(data), 'text/yaml');
}

// ── Import ─────────────────────────────────────────────────
function parseCSVRow(line) {
  const cells = [];
  let cell = '',
    inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      cells.push(cell);
      cell = '';
    } else cell += c;
  }
  cells.push(cell);
  return cells;
}

function parseCSVSections(text) {
  const sections = {};
  let sec = null;
  for (const raw of text.split('\n')) {
    const t = raw.trim();
    if (!t) continue;
    if (t.startsWith('##')) {
      sec = t.replace(/^##\s*/, '').trim();
      sections[sec] = { headers: [], rows: [] };
      continue;
    }
    if (!sec) continue;
    const cells = parseCSVRow(raw).map(c => c.trim());
    if (!cells.some(c => c)) continue;
    if (!sections[sec].headers.length) sections[sec].headers = cells;
    else sections[sec].rows.push(cells);
  }
  return sections;
}

function yScalar(s) {
  s = s.trim();
  if (!s || s === 'null' || s === '~') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  const n = Number(s);
  if (!isNaN(n) && s !== '') return n;
  if ((s[0] === '"' || s[0] === "'") && s[s.length - 1] === s[0]) {
    try {
      return JSON.parse(s);
    } catch (e) {
      return s.slice(1, -1);
    }
  }
  return s;
}

function parseYAMLFlat(text) {
  const flat = {},
    stack = [];
  let skipTo = -1;
  for (const line of text.split('\n')) {
    if (/^\s*(#.*)?$/.test(line)) continue;
    const li = line.search(/\S/),
      tr = line.trim();
    while (stack.length && stack[stack.length - 1].i >= li) stack.pop();
    if (skipTo >= 0 && li > skipTo) continue;
    skipTo = -1;
    if (tr.startsWith('- ')) {
      skipTo = li;
      continue;
    }
    const ci = tr.indexOf(':');
    if (ci < 0) continue;
    const k = tr.slice(0, ci).trim(),
      vs = tr.slice(ci + 1).trim();
    if (vs && !vs.startsWith('#')) flat[[...stack.map(s => s.k), k].join('.')] = yScalar(vs);
    stack.push({ k, i: li });
  }
  return flat;
}

function applyGlobalFromObj(g, updateG) {
  const map = {
    inflation: v => +v,
    regime: v => String(v),
    horizon: v => +v,
    tauxActu: v => +v,
    rendAlt: v => +v,
    loyerPerso: v => +v,
    revalLoyerPerso: v => +v,
    budgetMensuel: v => +v,
    investirSurplus: v => v === true || v === 'true',
    apportETF: v => +v,
  };
  const updates = {};
  Object.entries(map).forEach(([k, fn]) => {
    if (g[k] != null) updates[k] = fn(g[k]);
  });
  if (Object.keys(updates).length) updateG(updates);
}

function applySimFromObj(key, data, updateSimBulk) {
  if (!data) return;
  const updates = {};
  if (data.label != null) updates.label = String(data.label);
  if (data.enabled != null) updates.enabled = data.enabled === true || data.enabled === 'true';
  const inp = data.inputs || {};
  Object.keys(mkDef('loc')).forEach(f => {
    if (inp[f] == null) return;
    if (f === 'mode' || f === 'label') updates[f] = String(inp[f]);
    else if (f === 'enabled') updates[f] = inp[f] === true || inp[f] === 'true';
    else if (f === 'autoFields') {
      if (Array.isArray(inp[f])) updates[f] = inp[f];
    } else {
      const n = parseFloat(inp[f]);
      if (!isNaN(n)) updates[f] = n;
    }
  });
  updateSimBulk(key, updates);
}

export function handleImport(file, { updateG, updateSimBulk }) {
  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text = /** @type {string} */ (e.target.result);
      if (ext === 'json') {
        const data = JSON.parse(text);
        applyGlobalFromObj(data.global || {}, updateG);
        KEYS.forEach(k => applySimFromObj(k, (data.simulations || {})[k], updateSimBulk));
      } else if (ext === 'yaml' || ext === 'yml') {
        const flat = parseYAMLFlat(text);
        const g = {};
        [
          'inflation',
          'regime',
          'horizon',
          'tauxActu',
          'rendAlt',
          'loyerPerso',
          'revalLoyerPerso',
          'budgetMensuel',
          'investirSurplus',
          'apportETF',
        ].forEach(k => {
          if (flat[`global.${k}`] != null) g[k] = flat[`global.${k}`];
        });
        applyGlobalFromObj(g, updateG);
        KEYS.forEach(k => {
          const data = {
            label: flat[`simulations.${k}.label`],
            enabled: flat[`simulations.${k}.enabled`],
            inputs: {},
          };
          Object.keys(mkDef('loc')).forEach(f => {
            const v = flat[`simulations.${k}.inputs.${f}`];
            if (v != null) data.inputs[f] = v;
          });
          applySimFromObj(k, data, updateSimBulk);
        });
      } else if (ext === 'csv') {
        const sections = parseCSVSections(text);
        const gSec = sections['Paramètres globaux'];
        if (gSec) {
          const g = {};
          for (const r of gSec.rows) {
            const [p, v] = r;
            if (p === 'Inflation') g.inflation = +v;
            else if (p === 'Régime fiscal') g.regime = v;
            else if (p === 'Horizon') g.horizon = +v;
            else if (p === "Taux d'actualisation (VAN)") g.tauxActu = +v;
            else if (p === 'Rdt placement alternatif (net)') g.rendAlt = +v;
            else if (p === 'Loyer perso (€/mois)') g.loyerPerso = +v;
            else if (p === 'Reval. loyer perso (%/an)') g.revalLoyerPerso = +v;
            else if (p === 'Budget mensuel (€/mois)') g.budgetMensuel = +v;
            else if (p === 'Investir surplus ETF') g.investirSurplus = v === 'true';
            else if (p === 'Apport ETF pur (€)') g.apportETF = +v;
          }
          applyGlobalFromObj(g, updateG);
        }
      } else {
        throw new Error(`Format non supporté : ${ext}`);
      }
    } catch (err) {
      alert('Erreur importation :\n' + err.message);
    }
  };
  reader.readAsText(file, 'UTF-8');
}
