import { fmtK } from './utils.js';

const tipEl = document.getElementById('tip');

export function drawLine(id, datasets, xLabels){
  const el = document.getElementById(id); if(!el) return;
  const W=el.offsetWidth||600, H=parseInt(el.dataset.h)||220, dpr=devicePixelRatio||1;
  el.width=W*dpr; el.height=H*dpr; el.style.height=H+'px';
  const ctx=el.getContext('2d'); ctx.scale(dpr,dpr);
  const p={l:60,r:14,t:12,b:26}, cW=W-p.l-p.r, cH=H-p.t-p.b;
  const all=datasets.filter(d=>!d.hide).flatMap(d=>d.data.filter(v=>v!=null&&isFinite(v)));
  if(!all.length){ ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H); return; }
  let mn=Math.min(...all), mx=Math.max(...all); const rng=mx-mn||1; mn-=rng*.07; mx+=rng*.07;
  const xS=i=>p.l+(i/Math.max(xLabels.length-1,1))*cW;
  const yS=v=>p.t+cH-((v-mn)/(mx-mn))*cH;
  ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#1e293b'; ctx.lineWidth=1;
  for(let i=0;i<=5;i++){ const y=p.t+(i/5)*cH; ctx.beginPath(); ctx.moveTo(p.l,y); ctx.lineTo(W-p.r,y); ctx.stroke(); ctx.fillStyle='#4b5563'; ctx.font="10px 'DM Sans',sans-serif"; ctx.textAlign='right'; ctx.fillText(fmtK(mx-(i/5)*(mx-mn)),p.l-4,y+3.5); }
  const step=Math.max(1,Math.ceil(xLabels.length/10)); ctx.fillStyle='#4b5563'; ctx.textAlign='center';
  xLabels.forEach((l,i)=>{ if(i%step===0||i===xLabels.length-1) ctx.fillText(l,xS(i),H-5); });
  if(mn<0&&mx>0){ const y0=yS(0); ctx.strokeStyle='#334155'; ctx.lineWidth=1.5; ctx.setLineDash([5,3]); ctx.beginPath(); ctx.moveTo(p.l,y0); ctx.lineTo(W-p.r,y0); ctx.stroke(); ctx.setLineDash([]); }
  datasets.forEach(ds=>{
    if(ds.hide) return;
    ctx.strokeStyle=ds.color; ctx.lineWidth=ds.dashed?1.5:2.5; ctx.lineJoin='round'; ctx.lineCap='round';
    if(ds.dashed) ctx.setLineDash([6,4]); else ctx.setLineDash([]);
    ctx.beginPath(); let st=false;
    ds.data.forEach((v,i)=>{ if(v==null||!isFinite(v)) return; st?ctx.lineTo(xS(i),yS(v)):ctx.moveTo(xS(i),yS(v)); st=true; });
    ctx.stroke(); ctx.setLineDash([]);
  });
  el._meta = {datasets, xLabels, xS, dpr, W};
}

export function drawBars(id, datasets, xLabels, stacked){
  const el=document.getElementById(id); if(!el) return;
  const W=el.offsetWidth||600, H=parseInt(el.dataset.h)||200, dpr=devicePixelRatio||1;
  el.width=W*dpr; el.height=H*dpr; el.style.height=H+'px';
  const ctx=el.getContext('2d'); ctx.scale(dpr,dpr);
  const p={l:60,r:14,t:12,b:26}, cW=W-p.l-p.r, cH=H-p.t-p.b, n=xLabels.length, gW=cW/n;
  const vis=datasets.filter(d=>!d.hide);
  let mn=0, mx;
  if(stacked){ mx=(Math.max(...xLabels.map((_,i)=>vis.reduce((s,d)=>s+(d.data[i]||0),0)))||1)*1.1; }
  else{ const av=vis.flatMap(d=>d.data.filter(v=>isFinite(v))); mn=Math.min(0,...av)*1.1; mx=Math.max(0,...av)*1.1||1; }
  const rng=mx-mn||1, yS=v=>p.t+cH-((v-mn)/rng)*cH;
  ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#1e293b'; ctx.lineWidth=1;
  for(let i=0;i<=5;i++){ const y=p.t+(i/5)*cH; ctx.beginPath(); ctx.moveTo(p.l,y); ctx.lineTo(W-p.r,y); ctx.stroke(); ctx.fillStyle='#4b5563'; ctx.font="10px 'DM Sans',sans-serif"; ctx.textAlign='right'; ctx.fillText(fmtK(mx-(i/5)*rng),p.l-4,y+3.5); }
  const step=Math.max(1,Math.ceil(n/8)); ctx.fillStyle='#4b5563'; ctx.textAlign='center';
  xLabels.forEach((l,i)=>{ if(i%step===0||i===n-1) ctx.fillText(l,p.l+(i+.5)*gW,H-5); });
  if(!stacked&&mn<0){ ctx.strokeStyle='#334155'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(p.l,yS(0)); ctx.lineTo(W-p.r,yS(0)); ctx.stroke(); }
  if(stacked){
    xLabels.forEach((_,i)=>{ let base=0; vis.forEach(ds=>{ const v=ds.data[i]||0, x=p.l+i*gW+gW*.08, bW=gW*.84, y=yS(base+v), h=Math.max(0,yS(base)-yS(base+v)); if(h>.5){ ctx.fillStyle=ds.color; ctx.beginPath(); ctx.roundRect(x,y,bW,h,[0]); ctx.fill(); } base+=v; }); });
  } else {
    const nD=vis.length, bW=Math.min(gW*.72/nD,15);
    xLabels.forEach((_,i)=>{ vis.forEach((ds,di)=>{ const v=ds.data[i]; if(v==null||!isFinite(v)) return; const x=p.l+(i+.05)*gW+di*bW+(gW*.9-nD*bW)/2, y=v>=0?yS(v):yS(0), h=Math.max(1,Math.abs(yS(0)-yS(v))); ctx.fillStyle=ds.color; ctx.beginPath(); ctx.roundRect(x,y,bW,h,[v>=0?2:0,v>=0?2:0,v<0?2:0,v<0?2:0]); ctx.fill(); }); });
  }
  el._meta = {datasets:vis, xLabels, xS:i=>p.l+(i+.5)*gW, dpr, W};
}

export function attachHover(id, names){
  const el=document.getElementById(id); if(!el||el._hov) return; el._hov=true; el.style.cursor='crosshair';
  el.addEventListener('mousemove', e=>{
    const m=el._meta; if(!m){ tipEl.style.display='none'; return; }
    const rect=el.getBoundingClientRect(), cx=e.clientX-rect.left;
    let bi=0, bd=1e9;
    m.xLabels.forEach((_,i)=>{ const dx=Math.abs(m.xS(i)*(rect.width/m.W)-cx); if(dx<bd){ bd=dx; bi=i; } });
    let h=`<div class="tip-y">Année ${m.xLabels[bi]}</div>`;
    m.datasets.filter(d=>!d.hide).forEach((d,di)=>{ const v=d.data[bi]; if(v==null||!isFinite(v)) return; h+=`<div class="tip-r" style="color:${d.color}"><span style="display:flex;align-items:center;gap:5px"><span class="tip-d" style="background:${d.color}"></span>${d.label||names[di]||''}</span><span style="font-weight:700">${fmtK(v)}</span></div>`; });
    tipEl.innerHTML=h; tipEl.style.display='block';
    let tx=e.clientX+14, ty=e.clientY-10;
    if(tx+tipEl.offsetWidth>innerWidth-8) tx=e.clientX-tipEl.offsetWidth-10;
    if(ty+tipEl.offsetHeight>innerHeight-8) ty=innerHeight-tipEl.offsetHeight-8;
    tipEl.style.left=tx+'px'; tipEl.style.top=ty+'px';
  });
  el.addEventListener('mouseleave', ()=>tipEl.style.display='none');
}
