import { fmtK } from './utils.js';

/**
 * Responsive chart paddings + axis font size. Narrow canvases (mobile) get a
 * tighter left gutter and smaller axis labels so the plot area stays usable.
 * `rMax` is the right gutter on wide screens (large for the dual-axis chart).
 */
function chartMetrics(W, { rMax = 14, rMin = 12 } = {}) {
  const l = Math.round(Math.min(60, Math.max(34, W * 0.16)));
  const r = Math.round(Math.min(rMax, Math.max(rMin, W * (rMax / 600))));
  const fs = W < 420 ? 9 : 10;
  return { l, r, t: 12, b: 26, fs };
}

/** X-axis label step: keep ~40px between drawn labels. */
function labelStep(n, cW) {
  const maxLabels = Math.max(4, Math.floor(cW / 40));
  return Math.max(1, Math.ceil(n / maxLabels));
}

export function drawLine(canvas, datasets, xLabels, annotations = [], opts = {}) {
  if (!canvas) return;
  const W = canvas.offsetWidth || 600,
    H = canvas.offsetHeight || 220,
    dpr = devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const p = chartMetrics(W),
    cW = W - p.l - p.r,
    cH = H - p.t - p.b;
  const all = datasets
    .filter(d => !d.hide)
    .flatMap(d => d.data.filter(v => v != null && isFinite(v)));
  if (!all.length) {
    ctx.fillStyle =
      getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#0f172a';
    ctx.fillRect(0, 0, W, H);
    return;
  }
  let mn = Math.min(...all),
    mx = Math.max(...all);
  // baseZero anchors the y-axis at 0 (origin visible) instead of auto-scaling to the data min.
  if (opts.baseZero) mn = Math.min(0, mn);
  const rng = mx - mn || 1;
  if (!opts.baseZero) mn -= rng * 0.07;
  mx += rng * 0.07;
  const xS = i => p.l + (i / Math.max(xLabels.length - 1, 1)) * cW;
  const yS = v => p.t + cH - ((v - mn) / (mx - mn)) * cH;
  ctx.fillStyle =
    getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#0f172a';
  ctx.fillRect(0, 0, W, H);
  const borderColor =
    getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#1e293b';
  const mutedColor =
    getComputedStyle(document.documentElement).getPropertyValue('--subtle').trim() || '#4b5563';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = p.t + (i / 5) * cH;
    ctx.beginPath();
    ctx.moveTo(p.l, y);
    ctx.lineTo(W - p.r, y);
    ctx.stroke();
    ctx.fillStyle = mutedColor;
    ctx.font = `${p.fs}px 'DM Sans',sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(fmtK(mx - (i / 5) * (mx - mn)), p.l - 4, y + 3.5);
  }
  const step = labelStep(xLabels.length, cW);
  ctx.fillStyle = mutedColor;
  ctx.textAlign = 'center';
  xLabels.forEach((l, i) => {
    if (i % step === 0 || i === xLabels.length - 1) ctx.fillText(l, xS(i), H - 5);
  });
  if (mn < 0 && mx > 0) {
    const y0 = yS(0);
    ctx.strokeStyle =
      getComputedStyle(document.documentElement).getPropertyValue('--subtle').trim() || '#334155';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(p.l, y0);
    ctx.lineTo(W - p.r, y0);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  datasets.forEach(ds => {
    if (ds.hide) return;
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = ds.dashed ? 1.5 : 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (ds.dashed) ctx.setLineDash([6, 4]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    let st = false;
    ds.data.forEach((v, i) => {
      if (v == null || !isFinite(v)) return;
      st ? ctx.lineTo(xS(i), yS(v)) : ctx.moveTo(xS(i), yS(v));
      st = true;
    });
    ctx.stroke();
    ctx.setLineDash([]);
  });
  annotations.forEach(({ x, color = '#94a3b8', label }) => {
    const xPx = xS(x - 1); // x is 1-based year
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(xPx, p.t);
    ctx.lineTo(xPx, H - p.b);
    ctx.stroke();
    ctx.setLineDash([]);
    if (label) {
      ctx.fillStyle = color;
      ctx.font = `${Math.max(8, p.fs - 1)}px 'DM Sans',sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(label, xPx + 3, p.t + 10);
    }
    ctx.restore();
  });
  canvas._meta = { datasets, xLabels, xS, dpr, W };
}

export function attachHover(canvas) {
  if (!canvas || canvas._hov) return;
  canvas._hov = true;
  canvas.style.cursor = 'crosshair';
  // Vertical pan still scrolls the page on touch; horizontal scrubbing drives
  // the tooltip instead of scrolling (Pointer Events unify mouse + touch).
  canvas.style.touchAction = 'pan-y';
  const tip = document.createElement('div');
  tip.style.cssText =
    "position:fixed;background:var(--s2,#0d1b2a);color:var(--text,#e2e8f0);padding:8px 10px;border-radius:6px;font:11px 'DM Sans',sans-serif;pointer-events:none;display:none;z-index:9999;min-width:120px;box-shadow:0 4px 14px rgba(0,0,0,.5);border:1px solid var(--border,#1e293b);";
  document.body.appendChild(tip);
  canvas._tip = tip;

  let hideTimer = null;
  const hide = () => {
    tip.style.display = 'none';
  };

  const showAt = (clientX, clientY) => {
    const m = canvas._meta;
    if (!m) {
      hide();
      return;
    }
    const rect = canvas.getBoundingClientRect(),
      cx = clientX - rect.left;
    let bi = 0,
      bd = 1e9;
    m.xLabels.forEach((_, i) => {
      const dx = Math.abs(m.xS(i) * (rect.width / m.W) - cx);
      if (dx < bd) {
        bd = dx;
        bi = i;
      }
    });
    let h = `<div style="font-weight:700;margin-bottom:5px;color:var(--muted,#64748b);font-size:10px">Year ${m.xLabels[bi]}</div>`;
    m.datasets
      .filter(d => !d.hide)
      .forEach(d => {
        const v = d.data[bi];
        if (v == null || !isFinite(v)) return;
        h += `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:3px"><span style="display:flex;align-items:center;gap:5px;color:${d.color}"><span style="width:7px;height:7px;border-radius:50%;background:${d.color};flex-shrink:0;display:inline-block"></span>${d.label || ''}</span><span style="font-weight:700;color:var(--text,#e2e8f0)">${fmtK(v)}</span></div>`;
      });
    tip.innerHTML = h;
    tip.style.display = 'block';
    let tx = clientX + 14,
      ty = clientY - 10;
    if (tx + tip.offsetWidth > innerWidth - 8) tx = clientX - tip.offsetWidth - 10;
    if (ty + tip.offsetHeight > innerHeight - 8) ty = innerHeight - tip.offsetHeight - 8;
    if (ty < 8) ty = 8;
    tip.style.left = tx + 'px';
    tip.style.top = ty + 'px';
  };

  // Touch: the tooltip only appears after a stationary press of HOLD_MS, so a
  // swipe to scroll past the chart never triggers it. Moving more than MOVE_TOL
  // px before the hold completes cancels it (it's a scroll/scrub, not a press).
  // Once armed, the finger scrubs the tooltip. Mouse keeps instant hover.
  const HOLD_MS = 500;
  const MOVE_TOL = 10;
  let down = false;
  let armed = false;
  let pressTimer = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  const clearPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  canvas.addEventListener('pointerdown', e => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (e.pointerType === 'mouse') {
      down = true;
      armed = true;
      showAt(e.clientX, e.clientY);
      return;
    }
    down = true;
    armed = false;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    clearPress();
    pressTimer = setTimeout(() => {
      armed = true;
      showAt(lastX, lastY);
    }, HOLD_MS);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') {
      showAt(e.clientX, e.clientY);
      return;
    }
    if (!down) return;
    lastX = e.clientX;
    lastY = e.clientY;
    if (armed) {
      showAt(e.clientX, e.clientY);
    } else if (Math.abs(e.clientX - startX) > MOVE_TOL || Math.abs(e.clientY - startY) > MOVE_TOL) {
      clearPress();
    }
  });
  const release = e => {
    down = false;
    clearPress();
    // Touch: keep the readout up briefly after lifting, then hide.
    if (e && e.pointerType !== 'mouse') {
      if (armed) hideTimer = setTimeout(hide, 1200);
      armed = false;
    }
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  // Mouse leaving the canvas dismisses immediately.
  canvas.addEventListener('pointerleave', e => {
    if (e.pointerType === 'mouse') hide();
  });
}

export function drawBars(canvas, datasets, xLabels, stacked) {
  if (!canvas) return;
  const W = canvas.offsetWidth || 600,
    H = canvas.offsetHeight || 200,
    dpr = devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const p = chartMetrics(W),
    cW = W - p.l - p.r,
    cH = H - p.t - p.b,
    n = xLabels.length,
    gW = cW / n;
  const vis = datasets.filter(d => !d.hide);
  let mn = 0,
    mx;
  if (stacked) {
    mx =
      (Math.max(...xLabels.map((_, i) => vis.reduce((s, d) => s + (d.data[i] || 0), 0))) || 1) *
      1.1;
  } else {
    const av = vis.flatMap(d => d.data.filter(v => isFinite(v)));
    mn = Math.min(0, ...av) * 1.1;
    mx = Math.max(0, ...av) * 1.1 || 1;
  }
  const rng = mx - mn || 1,
    yS = v => p.t + cH - ((v - mn) / rng) * cH;
  const surfaceColor =
    getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#0f172a';
  ctx.fillStyle = surfaceColor;
  ctx.fillRect(0, 0, W, H);
  const borderColor =
    getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#1e293b';
  const mutedColor =
    getComputedStyle(document.documentElement).getPropertyValue('--subtle').trim() || '#4b5563';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = p.t + (i / 5) * cH;
    ctx.beginPath();
    ctx.moveTo(p.l, y);
    ctx.lineTo(W - p.r, y);
    ctx.stroke();
    ctx.fillStyle = mutedColor;
    ctx.font = `${p.fs}px 'DM Sans',sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(fmtK(mx - (i / 5) * rng), p.l - 4, y + 3.5);
  }
  const step = labelStep(n, cW);
  ctx.fillStyle = mutedColor;
  ctx.textAlign = 'center';
  xLabels.forEach((l, i) => {
    if (i % step === 0 || i === n - 1) ctx.fillText(l, p.l + (i + 0.5) * gW, H - 5);
  });
  if (!stacked && mn < 0) {
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--subtle')
      .trim();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.l, yS(0));
    ctx.lineTo(W - p.r, yS(0));
    ctx.stroke();
  }
  if (stacked) {
    xLabels.forEach((_, i) => {
      let base = 0;
      vis.forEach(ds => {
        const v = ds.data[i] || 0,
          x = p.l + i * gW + gW * 0.08,
          bW = gW * 0.84,
          y = yS(base + v),
          h = Math.max(0, yS(base) - yS(base + v));
        if (h > 0.5) {
          ctx.fillStyle = ds.color;
          ctx.beginPath();
          ctx.roundRect(x, y, bW, h, [0]);
          ctx.fill();
        }
        base += v;
      });
    });
  } else {
    const nD = vis.length,
      bW = Math.min((gW * 0.72) / nD, 15);
    xLabels.forEach((_, i) => {
      vis.forEach((ds, di) => {
        const v = ds.data[i];
        if (v == null || !isFinite(v)) return;
        const x = p.l + (i + 0.05) * gW + di * bW + (gW * 0.9 - nD * bW) / 2,
          y = v >= 0 ? yS(v) : yS(0),
          h = Math.max(1, Math.abs(yS(0) - yS(v)));
        ctx.fillStyle = ds.color;
        ctx.beginPath();
        ctx.roundRect(x, y, bW, h, [v >= 0 ? 2 : 0, v >= 0 ? 2 : 0, v < 0 ? 2 : 0, v < 0 ? 2 : 0]);
        ctx.fill();
      });
    });
  }
  canvas._meta = { datasets: vis, xLabels, xS: i => p.l + (i + 0.5) * gW, dpr, W };
}

export function drawBarsWithLine(canvas, barDatasets, lineDatasets, xLabels) {
  if (!canvas) return;
  const W = canvas.offsetWidth || 600,
    H = canvas.offsetHeight || 220,
    dpr = devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const p = chartMetrics(W, { rMax: 56, rMin: 34 }),
    cW = W - p.l - p.r,
    cH = H - p.t - p.b,
    n = xLabels.length,
    gW = cW / n;
  const linesArr = Array.isArray(lineDatasets) ? lineDatasets : [lineDatasets];
  const vis = barDatasets.filter(d => !d.hide);
  const mxBar =
    (Math.max(...xLabels.map((_, i) => vis.reduce((s, d) => s + (d.data[i] || 0), 0))) || 1) * 1.1;
  const allLineVals = linesArr.flatMap(ld => ld.data.filter(v => v != null && isFinite(v)));
  const mxLine = allLineVals.length ? Math.max(...allLineVals) * 1.1 : 1;
  const ySBar = v => p.t + cH - (v / mxBar) * cH;
  const ySLine = v => p.t + cH - (v / mxLine) * cH;
  const surfaceColor =
    getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#0f172a';
  const borderColor =
    getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#1e293b';
  const mutedColor =
    getComputedStyle(document.documentElement).getPropertyValue('--subtle').trim() || '#4b5563';
  ctx.fillStyle = surfaceColor;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = p.t + (i / 5) * cH;
    ctx.beginPath();
    ctx.moveTo(p.l, y);
    ctx.lineTo(W - p.r, y);
    ctx.stroke();
    ctx.fillStyle = mutedColor;
    ctx.font = `${p.fs}px 'DM Sans',sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(fmtK(mxBar * (1 - i / 5)), p.l - 4, y + 3.5);
    ctx.textAlign = 'left';
    ctx.fillText(fmtK(mxLine * (1 - i / 5)), W - p.r + 4, y + 3.5);
  }
  const step = labelStep(n, cW);
  ctx.fillStyle = mutedColor;
  ctx.textAlign = 'center';
  xLabels.forEach((l, i) => {
    if (i % step === 0 || i === n - 1) ctx.fillText(l, p.l + (i + 0.5) * gW, H - 5);
  });
  xLabels.forEach((_, i) => {
    let base = 0;
    vis.forEach(ds => {
      const v = ds.data[i] || 0,
        x = p.l + i * gW + gW * 0.08,
        bW = gW * 0.84,
        y = ySBar(base + v),
        h = Math.max(0, ySBar(base) - ySBar(base + v));
      if (h > 0.5) {
        ctx.fillStyle = ds.color;
        ctx.beginPath();
        ctx.roundRect(x, y, bW, h, [0]);
        ctx.fill();
      }
      base += v;
    });
  });
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  linesArr.forEach(ld => {
    ctx.strokeStyle = ld.color;
    ctx.setLineDash(ld.dashed ? [6, 4] : []);
    ctx.beginPath();
    let started = false;
    ld.data.forEach((v, i) => {
      if (v == null || !isFinite(v)) return;
      const x = p.l + (i + 0.5) * gW;
      const y = ySLine(v);
      started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      started = true;
    });
    ctx.stroke();
  });
  ctx.setLineDash([]);
  canvas._meta = {
    datasets: [...vis, ...linesArr],
    xLabels,
    xS: i => p.l + (i + 0.5) * gW,
    dpr,
    W,
  };
}
