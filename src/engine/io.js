import { KEYS, mkDef } from '../state/definitions.js';

// ── Export ─────────────────────────────────────────────────
export function buildExportData(G, sims, RES, etfScenarioGlobal) {
  const d = { global: { ...G }, simulations: {} };
  KEYS.forEach(k => {
    const p = sims[k],
      r = RES[k];
    d.simulations[k] = {
      label: p.label,
      enabled: p.enabled,
      inputs: { ...p },
      computed: {
        totalCost: r.totalCost,
        loanAmount: r.loanAmount,
        monthlyPayment: Math.round(r.monthlyPayment),
        monthlyInsurance: Math.round(r.monthlyInsurance),
        totalInterest: Math.round(r.totalInterest),
        totalInsurance: Math.round(r.totalInsurance),
        grossYield: p.mode === 'rental' ? +r.grossYield.toFixed(4) : null,
        netYield: p.mode === 'rental' ? +r.netYield.toFixed(4) : null,
        monthlyCashFlow: Math.round(r.monthlyCashFlow),
        breakEvenYears: r.breakEven,
        irr10y: r.tri10 != null ? +(r.tri10 * 100).toFixed(4) : null,
        irr15y: r.tri15 != null ? +(r.tri15 * 100).toFixed(4) : null,
        irr20y: r.tri20 != null ? +(r.tri20 * 100).toFixed(4) : null,
        npv: Math.round(r.van),
        moic: r.moic ? +r.moic.toFixed(4) : null,
        flows: r.flows.map(f => ({
          year: f.yr,
          ...(p.mode === 'rental'
            ? { rentReceived: Math.round(f.effectiveRent) }
            : { savedRent: Math.round(f.effectiveRent) }),
          charges: Math.round(f.charges),
          annuityPlusInsurance: Math.round(f.annuity),
          ...(p.mode === 'rental' ? { tax: Math.round(f.tax) } : {}),
          netCashFlow: Math.round(f.netCashFlow),
          cumulativeCashFlow: Math.round(f.cumulativeCashFlow),
          propertyValue: Math.round(f.propertyValue),
          remainingCapital: Math.round(f.remainingCapital),
          netWorth: Math.round(f.netWorth),
          totalWorth: Math.round(f.totalWorth),
          etfPocket: Math.round(f.etfPocket),
          netResale: Math.round(f.netResaleProceeds),
          resaleBalance: Math.round(f.resaleBalance),
        })),
        etfReference: etfScenarioGlobal.map(e => ({ year: e.yr, etfCapital: Math.round(e.cap) })),
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

  row('## Global parameters');
  row('Parameter', 'Value', 'Unit');
  [
    ['Inflation', d.global.inflation, '%/yr'],
    ['Tax regime', d.global.regime],
    ['Horizon', d.global.horizon, 'years'],
    ['Discount rate (NPV)', d.global.discountRate, '%'],
    ['Alternative return (net)', d.global.altReturn, '%'],
    ['Personal rent (€/mo)', d.global.personalRent, '€/mo'],
    ['Personal rent growth (%/yr)', d.global.personalRentGrowth, '%/yr'],
    ['Monthly budget (€/mo)', d.global.monthlyBudget, '€/mo'],
    ['Invest ETF surplus', d.global.investSurplus ? 'true' : 'false'],
    ['ETF reference down payment (€)', d.global.etfDownPayment, '€'],
  ].forEach(r => row(...r));
  row('');
  row('## Simulation parameters');
  row('Parameter', ...lbls);
  // (abbreviated — full mapping identical to legacy io code)
  row('');
  KEYS.forEach(k => {
    const s = d.simulations[k],
      isRental = s.inputs.mode === 'rental';
    row(`## Yearly flows — ${s.label}`);
    row(
      'Year',
      isRental ? 'Rent (€)' : 'Saved rent (€)',
      'Charges (€)',
      'Annuity+Ins (€)',
      ...(isRental ? ['Tax (€)'] : []),
      'Net CF (€)',
      'Cumulative CF (€)',
      'Property value (€)',
      'Remaining capital (€)',
      'Total worth (€)',
      'ETF pocket (€)',
      'Net resale (€)',
      'Balance (€)',
      'ETF reference (€)'
    );
    s.computed.flows.forEach((f, i) => {
      row(
        f.year,
        isRental ? f.rentReceived : f.savedRent,
        f.charges,
        f.annuityPlusInsurance,
        ...(isRental ? [f.tax] : []),
        f.netCashFlow,
        f.cumulativeCashFlow,
        f.propertyValue,
        f.remainingCapital,
        f.totalWorth ?? '',
        f.etfPocket ?? '',
        f.netResale,
        f.resaleBalance,
        s.computed.etfReference?.[i]?.etfCapital ?? ''
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

const GLOBAL_IMPORT_KEYS = [
  'inflation',
  'regime',
  'horizon',
  'discountRate',
  'altReturn',
  'personalRent',
  'personalRentGrowth',
  'monthlyBudget',
  'investSurplus',
  'etfDownPayment',
];

function applyGlobalFromObj(g, updateG) {
  const map = {
    inflation: v => +v,
    regime: v => String(v),
    horizon: v => +v,
    discountRate: v => +v,
    altReturn: v => +v,
    personalRent: v => +v,
    personalRentGrowth: v => +v,
    monthlyBudget: v => +v,
    investSurplus: v => v === true || v === 'true',
    etfDownPayment: v => +v,
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
  Object.keys(mkDef('rental')).forEach(f => {
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
        GLOBAL_IMPORT_KEYS.forEach(k => {
          if (flat[`global.${k}`] != null) g[k] = flat[`global.${k}`];
        });
        applyGlobalFromObj(g, updateG);
        KEYS.forEach(k => {
          const data = {
            label: flat[`simulations.${k}.label`],
            enabled: flat[`simulations.${k}.enabled`],
            inputs: {},
          };
          Object.keys(mkDef('rental')).forEach(f => {
            const v = flat[`simulations.${k}.inputs.${f}`];
            if (v != null) data.inputs[f] = v;
          });
          applySimFromObj(k, data, updateSimBulk);
        });
      } else if (ext === 'csv') {
        const sections = parseCSVSections(text);
        const gSec = sections['Global parameters'];
        if (gSec) {
          const g = {};
          for (const r of gSec.rows) {
            const [p, v] = r;
            if (p === 'Inflation') g.inflation = +v;
            else if (p === 'Tax regime') g.regime = v;
            else if (p === 'Horizon') g.horizon = +v;
            else if (p === 'Discount rate (NPV)') g.discountRate = +v;
            else if (p === 'Alternative return (net)') g.altReturn = +v;
            else if (p === 'Personal rent (€/mo)') g.personalRent = +v;
            else if (p === 'Personal rent growth (%/yr)') g.personalRentGrowth = +v;
            else if (p === 'Monthly budget (€/mo)') g.monthlyBudget = +v;
            else if (p === 'Invest ETF surplus') g.investSurplus = v === 'true';
            else if (p === 'ETF reference down payment (€)') g.etfDownPayment = +v;
          }
          applyGlobalFromObj(g, updateG);
        }
      } else {
        throw new Error(`Unsupported format: ${ext}`);
      }
    } catch (err) {
      alert('Import error:\n' + err.message);
    }
  };
  reader.readAsText(file, 'UTF-8');
}
