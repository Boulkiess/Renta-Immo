import { G, COL, KEYS, sims, I, getGroups, GROUPS_ALL, mkDef } from './state.js';
import { compute, recomputeETFPur, crossoverYear, etfPurGlobal } from './compute.js';
import { drawLine, drawBars, attachHover } from './charts.js';
import { fmtE, fmtK, fmtP, fmtTRI } from './utils.js';

// ── UI state ───────────────────────────────────────────────
export let curTab = 'charts';
export const openGrp = {A:'Acquisition', B:'Acquisition', C:'Acquisition'};

// ── Popover ────────────────────────────────────────────────
const popEl = document.getElementById('pop');
let popKey = null;

export function showPop(key, anchor){
  const info = I[key]; if(!info) return;
  popEl.innerHTML=`<h4>${info.t}</h4>${(info.b||'').replace(/\n/g,'<br>')}${info.code?`<code>${info.code}</code>`:''}`;
  popEl.style.display='block';
  const r=anchor.getBoundingClientRect();
  let left=r.right+8, top=r.top-8;
  if(left+280>innerWidth-8) left=r.left-288;
  if(top+popEl.offsetHeight>innerHeight-8) top=innerHeight-popEl.offsetHeight-8;
  popEl.style.left=Math.max(4,left)+'px'; popEl.style.top=Math.max(4,top)+'px';
  popKey=key;
}

let _expOpen = false;
export function toggleExpMenu(){
  _expOpen=!_expOpen;
  document.getElementById('exp-menu').style.display=_expOpen?'block':'none';
  document.getElementById('exp-arr').style.transform=_expOpen?'rotate(180deg)':'';
}

document.addEventListener('click', e=>{
  const btn=e.target.closest('.ib');
  if(btn){ e.stopPropagation(); const k=btn.dataset.info; if(k===popKey){ popEl.style.display='none'; popKey=null; return; } showPop(k,btn); return; }
  if(popKey){ popEl.style.display='none'; popKey=null; }
  if(_expOpen&&!e.target.closest('#exp-wrap')){ _expOpen=false; document.getElementById('exp-menu').style.display='none'; document.getElementById('exp-arr').style.transform=''; }
});

// ── Panel rendering ────────────────────────────────────────
export function renderPanel(key){
  recomputeETFPur();
  const p=sims[key], res=compute(p), col=COL[key], isLoc=p.mode==='loc';
  const cfNeg=(isLoc?res.cfM:G.loyerPerso-res.mens-res.assM)<0;
  const groups=getGroups(p.mode);

  let kpis;
  if(isLoc){
    kpis=[
      ['Rdt brut',fmtP(res.rendBrut)],
      ['Rdt net',fmtP(res.rendNet)],
      ['Mensualité',fmtE(res.mens+res.assM)],
      ['CF mensuel',fmtE(res.cfM),cfNeg],
    ];
  } else {
    const cross=crossoverYear(res);
    kpis=[
      ['Mensualité',fmtE(res.mens+res.assM)],
      ['Effort/mois',fmtE(res.mens+res.assM-G.loyerPerso),res.mens+res.assM>G.loyerPerso],
      [`Patrim. tot. ${G.horizon}a`,fmtE(res.flux[G.horizon-1]?.patTotal)],
      ['vs ETF pur',cross?`An ${cross}`:(G.investirSurplus?'> 30 ans':'—')],
    ];
  }

  let h=`<div class="sh" style="border-top:3px solid ${col};border-bottom:1px solid ${col}33;background:${col}0d">
    <div class="sh-top">
      <label class="tgl" title="Activer/désactiver cette simulation">
        <input type="checkbox" ${p.enabled?'checked':''} onchange="togSim('${key}',this.checked)">
        <div class="track"></div><div class="knob"></div>
      </label>
      <div class="sh-dot" style="background:${col};box-shadow:0 0 6px ${col}88"></div>
      <input type="text" class="sh-name" value="${p.label}" oninput="updLbl('${key}',this.value)" style="color:${col}">
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div class="mode-sw">
        <button class="mode-btn ${isLoc?'active':''}" style="${isLoc?'background:'+col:'color:var(--muted)'}" onclick="setMode('${key}','loc')">📊 Locatif</button>
        <button class="mode-btn ${!isLoc?'active':''}" style="${!isLoc?'background:'+col:'color:var(--muted)'}" onclick="setMode('${key}','rp')">🏡 RP</button>
      </div>
    </div>
    <div class="kpis">`;
  kpis.forEach(([lbl,val,neg])=>{ h+=`<div class="kc"><div class="kl">${lbl}</div><div class="kv" style="color:${neg?'var(--red)':col}">${val}</div></div>`; });
  h+=`</div></div><div class="sb">`;

  groups.forEach(g=>{
    const open=openGrp[key]===g.t;
    h+=`<button class="gb" onclick="togGrp('${key}','${g.t}')"><span>${g.i} ${g.t}</span><span style="color:var(--muted);transform:${open?'rotate(180deg)':'none'};display:inline-block;transition:.2s;line-height:1">▾</span></button>`;
    if(open){
      h+=`<div class="gc">`;
      g.f.forEach(f=>{
        const v=p[f.k], hasI=!!I[f.k];
        const dv=f.tp==='e'?v:v.toFixed(f.st<.1?2:1);
        const unit=f.tp==='e'?'€':f.tp==='%'?'%':'';
        h+=`<div class="fr"><div class="ft"><div class="fl">${hasI?`<button class="ib" data-info="${f.k}">?</button>`:''}<span>${f.l}</span></div><div class="fw"><input class="ni" type="number" min="${f.mn}" max="${f.mx}" step="${f.st}" value="${dv}" oninput="updN('${key}','${f.k}',this)" style="border-color:${col}44"><span class="gu">${unit}</span></div></div><input type="range" min="${f.mn}" max="${f.mx}" step="${f.st}" value="${v}" oninput="updS('${key}','${f.k}',this)" style="--rng-col:${col}"></div>`;
      });
      h+=`</div>`;
    }
  });
  h+=`</div>`;
  document.getElementById('p'+key).innerHTML=h;
  document.getElementById('p'+key).className=`sp${p.enabled?'':' off'}`;
}

export function updateKpiChips(key, res){
  const chips=document.querySelectorAll(`#p${key} .kv`);
  const p=sims[key], col=COL[key];
  if(p.mode==='loc'&&chips.length>=4){
    chips[0].textContent=fmtP(res.rendBrut);
    chips[1].textContent=fmtP(res.rendNet);
    chips[2].textContent=fmtE(res.mens+res.assM);
    chips[3].textContent=fmtE(res.cfM); chips[3].style.color=res.cfM<0?'var(--red)':col;
  } else if(p.mode==='rp'&&chips.length>=4){
    const cross=crossoverYear(res);
    chips[0].textContent=fmtE(res.mens+res.assM);
    const effort=res.mens+res.assM-G.loyerPerso;
    chips[1].textContent=fmtE(effort); chips[1].style.color=effort>0?'var(--red)':col;
    chips[2].textContent=fmtE(res.flux[G.horizon-1]?.patTotal);
    chips[3].textContent=cross?`An ${cross}`:(G.investirSurplus?'> 30 ans':'—');
  }
}

export function updS(k, f, sl){
  sims[k][f]=parseFloat(sl.value);
  const ni=document.querySelector(`#p${k} input.ni[oninput*="'${f}'"]`);
  if(ni){ const fd=GROUPS_ALL().find(x=>x.k===f); ni.value=fd&&fd.tp==='e'?sl.value:parseFloat(sl.value).toFixed(fd&&fd.st<.1?2:1); }
  scheduleRedraw();
  const res=compute(sims[k]); updateKpiChips(k,res);
}

export function updN(k, f, inp){
  const fd=GROUPS_ALL().find(x=>x.k===f); let v=parseFloat(inp.value);
  if(isNaN(v)) return;
  v=Math.max(fd.mn,Math.min(fd.mx,v));
  sims[k][f]=v;
  const sl=document.querySelector(`#p${k} input[type=range][oninput*="'${f}'"]`);
  if(sl) sl.value=v;
  scheduleRedraw();
  const res=compute(sims[k]); updateKpiChips(k,res);
}

export function togGrp(k, t){ openGrp[k]=openGrp[k]===t?null:t; renderPanel(k); }
export function updLbl(k, v){ sims[k].label=v; renderLegend(); scheduleRedraw(); }
export function setMode(k, mode){ if(sims[k].mode===mode) return; sims[k].mode=mode; openGrp[k]=mode==='loc'?'Exploitation':'Résidence principale'; renderPanel(k); renderLegend(); scheduleRedraw(); }
export function togSim(k, on){ sims[k].enabled=on; document.getElementById('p'+k).className=`sp${on?'':' off'}`; renderLegend(); scheduleRedraw(); }

// ── Global strip ───────────────────────────────────────────
export function buildGS(){
  document.getElementById('gs').innerHTML=`
    <span class="gs-t">⚙️ Global</span>
    <div class="gf"><span class="gl">Inflation</span><button class="ib" data-info="inflation">?</button><input class="gi" type="number" min="0" max="10" step="0.1" value="${G.inflation}" oninput="G.inflation=+this.value;scheduleRedraw()"><span class="gu">%/an</span></div>
    <div class="gd"></div>
    <div class="gf"><span class="gl">Régime fiscal</span><button class="ib" data-info="regime">?</button><select id="g-reg" oninput="G.regime=this.value;scheduleRedraw()" style="background:var(--s2);border:1px solid var(--border);border-radius:5px;color:#fbbf24;font-family:inherit;font-size:10px;font-weight:700;padding:2px 5px;outline:none;cursor:pointer"><option value="lmnp"${G.regime==='lmnp'?' selected':''}>LMNP Réel</option><option value="microbic"${G.regime==='microbic'?' selected':''}>Micro-BIC (50%)</option><option value="nu"${G.regime==='nu'?' selected':''}>Foncier nu</option></select></div>
    <div class="gd"></div>
    <div class="gf"><span class="gl">Horizon</span><input class="gi" type="number" min="5" max="30" step="1" value="${G.horizon}" oninput="G.horizon=+this.value||20;scheduleRedraw()"><span class="gu">ans</span></div>
    <div class="gd"></div>
    <div class="gf"><span class="gl">Taux actualisation (VAN)</span><button class="ib" data-info="tauxActu">?</button><input class="gi" type="number" min="0" max="15" step="0.5" value="${G.tauxActu}" oninput="G.tauxActu=+this.value;scheduleRedraw()"><span class="gu">%</span></div>
    <div class="gd"></div>
    <div class="gf"><span class="gl">Rdt placement alternatif (net)</span><button class="ib" data-info="rendAlt">?</button><input class="gi" type="number" min="0" max="20" step="0.5" value="${G.rendAlt}" oninput="G.rendAlt=+this.value;scheduleRedraw()"><span class="gu">%</span></div>
    <div class="gd"></div>
    <div class="gf"><span class="gl">Loyer actuel payé</span><button class="ib" data-info="loyerPerso">?</button><input class="gi" type="number" min="0" max="5000" step="50" value="${G.loyerPerso}" oninput="G.loyerPerso=+this.value;KEYS.forEach(k=>renderPanel(k));scheduleRedraw()"><span class="gu">€/mois</span></div>
    <div class="gf"><span class="gl">Reval. loyer</span><button class="ib" data-info="revalLoyerPerso">?</button><input class="gi" type="number" min="0" max="5" step="0.1" value="${G.revalLoyerPerso}" oninput="G.revalLoyerPerso=+this.value;scheduleRedraw()"><span class="gu">%/an</span></div>
    <div class="gd"></div>
    <div class="gf"><span class="gl">Budget mensuel</span><button class="ib" data-info="budgetMensuel">?</button><input class="gi" type="number" min="500" max="20000" step="100" value="${G.budgetMensuel}" oninput="G.budgetMensuel=+this.value;scheduleRedraw();renderLegend()" style="width:62px"><span class="gu">€/mois</span></div>
    <div class="gf" style="gap:6px"><span class="gl">Surplus→ETF</span><button class="ib" data-info="investirSurplus">?</button><label class="tgl"><input type="checkbox" ${G.investirSurplus?'checked':''} onchange="G.investirSurplus=this.checked;KEYS.forEach(k=>renderPanel(k));renderLegend();scheduleRedraw()"><div class="track"></div><div class="knob"></div></label></div>
    <div class="gf"><span class="gl">Apport ETF pur</span><button class="ib" data-info="apportETF">?</button><input class="gi" type="number" min="0" max="500000" step="1000" value="${G.apportETF}" oninput="G.apportETF=+this.value;renderLegend();scheduleRedraw()" style="width:68px"><span class="gu">€</span></div>
  `;
}

// ── Tabs ───────────────────────────────────────────────────
const TAB_DEFS = [
  ['charts','📉 Graphiques'],['kpis','🎯 Comparaison'],
  ['revente','🏷️ Revente'],['amort','💳 Amortissement'],
];

export function buildTabs(){
  document.getElementById('tabs').innerHTML=TAB_DEFS.map(([id,lbl])=>`<button class="tab${curTab===id?' active':''}" onclick="setTab('${id}')">${lbl}</button>`).join('');
}

export function setTab(t){ curTab=t; buildTabs(); rebuildShell(); scheduleRedraw(); }

// ── Legend ─────────────────────────────────────────────────
export function renderLegend(){
  let h='';
  KEYS.forEach(k=>{
    const p=sims[k], col=COL[k], on=p.enabled;
    const modeTag=p.mode==='loc'?'📊':'🏡';
    h+=`<div class="li${on?'':' off'}" onclick="togSim('${k}',${!on})" title="Cliquer pour ${on?'masquer':'afficher'}">
      <div class="ll" style="background:${on?col:'#475569'}"></div>
      <span style="color:${on?col:'#475569'}">${modeTag} ${p.label}</span>
    </div>`;
  });
  h+=`<div class="li" style="cursor:default"><div class="ll" style="background:#94a3b8;opacity:.6;border:1px dashed #94a3b8"></div><span style="color:#94a3b8;font-size:10px">📈 ETF pur — ${Math.round(G.apportETF/1000)}k€ apport</span></div>`;
  h+=`<span style="font-size:9px;color:var(--muted);margin-left:auto">Cliquer pour masquer/afficher</span>`;
  document.getElementById('legend').innerHTML=h;
}

// ── Shell (canvas containers, rebuilt on tab change) ───────
export function rebuildShell(){
  const area=document.getElementById('area');
  if(curTab==='charts'){
    area.innerHTML=`
      <div class="cc"><div class="ct">💰 Cash-flow immobilier cumulé — 30 ans</div>
        <div class="cs">Flux nets cumulés de la seule poche immobilière. Locatif : loyers − charges − mensualité − impôts − loyer perso. RP : sorties réelles uniquement (−charges − mensualité).</div>
        <canvas id="c1" data-h="230"></canvas></div>
      <div class="cc" style="margin-top:10px"><div class="ct">🏦 Patrimoine total — 30 ans</div>
        <div class="cs">Équité immobilière + portefeuille ETF constitué avec le surplus mensuel (budget − sorties réelles). Les <b>pointillés</b> = scénario ETF pur : même apport + surplus du budget investi sans achat. Base de comparaison équitable sur même enveloppe mensuelle.</div>
        <canvas id="c2" data-h="230"></canvas></div>
      <div class="cc" style="margin-top:10px"><div class="ct">📊 Cash-flow net annuel (après impôts)</div>
        <div class="cs">Le saut en fin de prêt est <strong>normal</strong> : les mensualités s'arrêtent, le CF bondit du montant de l'annuité disparue.</div>
        <canvas id="c3" data-h="200"></canvas></div>
      <div class="cc" style="margin-top:10px"><div class="ct">📈 Valeur du bien dans le temps</div>
        <div class="cs">Valeur de marché estimée selon le taux de revalorisation paramétré.</div>
        <canvas id="c4" data-h="190"></canvas></div>`;
  } else if(curTab==='kpis'){
    area.innerHTML=`<div class="cc" id="kpi-card"></div>`;
  } else if(curTab==='revente'){
    area.innerHTML=`<div class="cc"><div class="ct">🏷️ Bilan net selon l'année de revente</div>
      <div class="cs">Gain net immo si vous revendez cette année (revente − dette − impôt PV + CF cumulés − apport). RP exonérée d'impôt sur PV. Pointillés = ETF pur de référence (même apport + budget investi) pour comparaison sur base égale.</div>
      <canvas id="cr" data-h="260"></canvas></div>
    <div class="cc" style="margin-top:10px"><div class="ct">📋 Détail par année clé</div><div id="rev-t"></div></div>`;
  } else if(curTab==='amort'){
    area.innerHTML=`<div class="cc"><div class="ct">💳 Décomposition annuelle du prêt</div>
      <div class="cs">Au début la majorité part en intérêts, puis la part en capital augmente progressivement.</div>
      <div id="am-cards"></div></div>
    <div class="cc" style="margin-top:10px"><div class="ct">📉 Capital restant dû</div><canvas id="amcap" data-h="220"></canvas></div>`;
    let h=''; KEYS.filter(k=>sims[k].enabled).forEach(k=>{
      h+=`<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;color:${COL[k]};margin-bottom:4px">● ${sims[k].label}</div>
      <div class="am-lg"><span><span class="am-d" style="background:var(--green)"></span>Capital</span><span><span class="am-d" style="background:var(--red)"></span>Intérêts</span><span><span class="am-d" style="background:var(--yellow)"></span>Assurance</span></div>
      <canvas id="am${k}" data-h="120"></canvas></div>`;
    });
    document.getElementById('am-cards').innerHTML=h;
  }
}

// ── Redraw (canvas + dynamic tables) ──────────────────────
let _raf = null;
export function scheduleRedraw(){ if(_raf) cancelAnimationFrame(_raf); _raf=requestAnimationFrame(redraw); }

export function redraw(){
  _raf=null;
  recomputeETFPur();
  const RES={}; KEYS.forEach(k=>RES[k]=compute(sims[k]));
  const yrs=Array.from({length:30},(_,i)=>i+1);
  const names=KEYS.map(k=>sims[k].label);
  const hide=k=>!sims[k].enabled;

  if(curTab==='charts'){
    const ds1=KEYS.map(k=>({color:COL[k],data:yrs.map(i=>RES[k].flux[i-1]?.cfC),hide:hide(k),label:sims[k].label}));
    drawLine('c1',ds1,yrs); attachHover('c1',ds1.map(d=>d.label));

    let ds2=[];
    KEYS.forEach(k=>ds2.push({color:COL[k],data:yrs.map(i=>RES[k].flux[i-1]?.patTotal),hide:hide(k),label:sims[k].label}));
    ds2.push({color:'#94a3b8',data:yrs.map(i=>etfPurGlobal[i-1]?.cap),hide:false,dashed:true,label:`📈 ETF pur (${Math.round(G.apportETF/1000)}k€ apport)`});
    drawLine('c2',ds2,yrs); attachHover('c2',ds2.map(d=>d.label));

    const ds3=KEYS.map(k=>({color:COL[k],data:yrs.map(i=>RES[k].flux[i-1]?.cfN),hide:hide(k),label:sims[k].label}));
    drawBars('c3',ds3,yrs,false); attachHover('c3',names);

    const ds4=KEYS.map(k=>({color:COL[k],data:yrs.map(i=>RES[k].flux[i-1]?.vb),hide:hide(k),label:sims[k].label}));
    drawLine('c4',ds4,yrs); attachHover('c4',names);
  }

  else if(curTab==='kpis'){
    const regime={'lmnp':'LMNP Réel','microbic':'Micro-BIC','nu':'Foncier nu'}[G.regime];
    const rows=[
      ["Type",k=>sims[k].mode==='loc'?'📊 Locatif':'🏡 RP'],
      ["Coût total acq.",k=>fmtE(RES[k].ct)],
      ["Montant emprunté",k=>fmtE(RES[k].emp)],
      ["Mensualité + assurance",k=>fmtE(RES[k].mens+RES[k].assM)],
      ["Coût total crédit",k=>fmtE(RES[k].totInt+RES[k].totAss)],
      ...(KEYS.some(k=>sims[k].mode==='loc')?[
        ["Rendement brut (loc.)",k=>sims[k].mode==='loc'?fmtP(RES[k].rendBrut):'—'],
        ["Rendement net (loc.)",k=>sims[k].mode==='loc'?fmtP(RES[k].rendNet):'—'],
        ["CF mensuel net (loc.)",k=>sims[k].mode==='loc'?fmtE(RES[k].cfM):'—'],
      ]:[]),
      ...(KEYS.some(k=>sims[k].mode==='rp')?[
        ["Effort mensuel (RP)",k=>sims[k].mode==='rp'?fmtE(RES[k].mens+RES[k].assM-G.loyerPerso):'—'],
      ]:[]),
      ["Breakeven CF immo cumulé",k=>RES[k].be?`An ${RES[k].be}`:'> 30 ans'],
      ["TRI 10 ans",k=>fmtTRI(RES[k].tri10)],
      ["TRI 15 ans",k=>fmtTRI(RES[k].tri15)],
      ["TRI 20 ans",k=>fmtTRI(RES[k].tri20)],
      [`VAN (${G.tauxActu}%, ${G.horizon}a)`,k=>fmtE(RES[k].van)],
      [`MOIC ${G.horizon} ans`,k=>RES[k].moic?RES[k].moic.toFixed(2)+'×':'—'],
      [`Patrimoine immo net ${G.horizon}a`,k=>fmtE(RES[k].flux[G.horizon-1]?.patNet)],
      [`Patrimoine total ${G.horizon}a ⬛`,k=>fmtE(RES[k].flux[G.horizon-1]?.patTotal)],
      [`Patrimoine total 30a ⬛`,k=>fmtE(RES[k].flux[29]?.patTotal)],
      ...(G.investirSurplus?[
        [`ETF pur ${G.horizon}a ⬜`,_=>fmtE(etfPurGlobal[G.horizon-1]?.cap)],
        [`ETF pur 30a ⬜`,_=>fmtE(etfPurGlobal[29]?.cap)],
        [`Avantage vs ETF pur ${G.horizon}a`,k=>{ const tot=RES[k].flux[G.horizon-1]?.patTotal, etf=etfPurGlobal[G.horizon-1]?.cap; return(tot!=null&&etf!=null)?fmtE(tot-etf):'—'; }],
        [`Croisement vs ETF pur`,k=>{ const c=crossoverYear(RES[k]); return c?`Année ${c}`:'> 30 ans'; }],
      ]:[]),
    ];
    let tbody=''; rows.forEach(([lbl,vFn])=>{ tbody+=`<tr><td class="td-lbl">${lbl}</td>`; KEYS.forEach(k=>{ const on=sims[k].enabled; tbody+=`<td class="tr" style="color:${on?COL[k]:'#475569'}">${on?vFn(k):'—'}</td>`; }); tbody+=`</tr>`; });
    document.getElementById('kpi-card').innerHTML=`
      <div class="ct">🎯 Tableau comparatif — Régime locatif : <span style="color:#fbbf24">${regime}</span></div>
      <div class="cs">⬛ Patrimoine total = équité immo + ETF du surplus mensuel (budget − sorties réelles). ⬜ ETF pur = même apport + même budget investi sans achat. Base de comparaison équitable.</div>
      <table><thead><tr><th>Indicateur</th>${KEYS.map(k=>`<th style="text-align:right;color:${COL[k]}">${sims[k].label}</th>`).join('')}</tr></thead><tbody>${tbody}</tbody></table>`;
  }

  else if(curTab==='revente'){
    let ds=[];
    KEYS.forEach(k=>{
      const data=yrs.map(i=>G.investirSurplus?RES[k].flux[i-1]?.bilanTotal:RES[k].flux[i-1]?.bilanRevente);
      ds.push({color:COL[k],data,hide:hide(k),label:sims[k].label});
    });
    if(G.investirSurplus){
      ds.push({color:'#94a3b8',data:yrs.map(i=>etfPurGlobal[i-1]?.cap-G.apportETF),hide:false,dashed:true,label:`📈 ETF pur (${Math.round(G.apportETF/1000)}k€ apport)`});
    }
    drawLine('cr',ds,yrs); attachHover('cr',ds.map(d=>d.label));

    let rows='';
    [5,10,15,20,25,30].forEach(yr=>{
      rows+=`<div class="rg"><div class="yb">Yr ${yr}</div>`;
      KEYS.forEach(k=>{
        if(!sims[k].enabled){ rows+=`<div class="rc" style="background:#1118;padding:6px 8px;font-size:10px;color:#475569">Désactivé</div>`; return; }
        const f=RES[k].flux[yr-1], col=COL[k];
        const bilan=G.investirSurplus?f?.bilanTotal:f?.bilanRevente;
        const pos=(bilan||0)>=0;
        rows+=`<div class="rc" style="background:${col}0f;border:1px solid ${col}28">
          <div style="font-size:9px;font-weight:700;color:${col};margin-bottom:3px;text-transform:uppercase;letter-spacing:.3px">${sims[k].mode==='loc'?'📊':'🏡'} ${sims[k].label}</div>
          <div style="font-size:10px">Revente : <b>${fmtK(f?.pr)}</b></div>
          <div style="font-size:10px">Capital restant : <b style="color:var(--red)">${fmtK(f?.rest)}</b></div>
          ${G.investirSurplus?`<div style="font-size:10px">ETF poche : <b style="color:var(--a)">${fmtK(f?.etfPoche)}</b></div>`:''}
          <div style="font-size:10px;color:${pos?'var(--green)':'var(--red)'}">Bilan ${G.investirSurplus?'total':'immo'} : <b>${fmtK(bilan)}</b></div>
        </div>`;
      });
      rows+=`</div>`;
    });
    document.getElementById('rev-t').innerHTML=rows;
  }

  else if(curTab==='amort'){
    const YRS=[1,3,5,7,10,12,15,18,20];
    KEYS.filter(k=>sims[k].enabled).forEach(k=>{
      const res=RES[k];
      const capA=YRS.map(yr=>{ const s=(yr-1)*12, e=Math.min(yr*12,res.amort.length); return res.amort.slice(s,e).reduce((a,m)=>a+m.cap,0); });
      const intA=YRS.map(yr=>{ const s=(yr-1)*12, e=Math.min(yr*12,res.amort.length); return res.amort.slice(s,e).reduce((a,m)=>a+m.inter,0); });
      const assA=YRS.map(yr=>{ const s=(yr-1)*12, e=Math.min(yr*12,res.amort.length); return res.amort.slice(s,e).reduce((a,m)=>a+m.assur,0); });
      drawBars(`am${k}`,[{color:'#4ade80',data:capA},{color:'#f87171',data:intA},{color:'#fbbf24',data:assA}],YRS.map(y=>`An ${y}`),true);
    });
    const dsCap=KEYS.map(k=>({color:COL[k],data:yrs.map(i=>RES[k].flux[i-1]?.rest),hide:hide(k),label:sims[k].label}));
    drawLine('amcap',dsCap,yrs); attachHover('amcap',names);
  }
}

// ── Export ─────────────────────────────────────────────────
function buildExportData(){
  const d={global:{...G},simulations:{}};
  KEYS.forEach(k=>{
    const p=sims[k], r=compute(p);
    d.simulations[k]={
      label:p.label,enabled:p.enabled,
      inputs:{...p},
      computed:{
        coutTotal:r.ct,montantEmprunte:r.emp,
        mensualite:Math.round(r.mens),assuranceMensuelle:Math.round(r.assM),
        totalInterets:Math.round(r.totInt),totalAssurance:Math.round(r.totAss),
        rendementBrut:p.mode==='loc'?+r.rendBrut.toFixed(4):null,
        rendementNet:p.mode==='loc'?+r.rendNet.toFixed(4):null,
        cashflowMensuel:Math.round(r.cfM),
        breakevenAns:r.be,
        tri10ans:r.tri10!=null?+(r.tri10*100).toFixed(4):null,
        tri15ans:r.tri15!=null?+(r.tri15*100).toFixed(4):null,
        tri20ans:r.tri20!=null?+(r.tri20*100).toFixed(4):null,
        van:Math.round(r.van),moic:r.moic?+r.moic.toFixed(4):null,
        flux:r.flux.map(f=>({
          annee:f.yr,
          ...(p.mode==='loc'?{loyersEncaisses:Math.round(f.le)}:{loyerEconomise:Math.round(f.le)}),
          charges:Math.round(f.chg),annuitePlusAssurance:Math.round(f.ann),
          ...(p.mode==='loc'?{impots:Math.round(f.imp)}:{}),
          cfNet:Math.round(f.cfN),cfCumule:Math.round(f.cfC),
          valeurBien:Math.round(f.vb),capitalRestant:Math.round(f.rest),
          patrimoineNet:Math.round(f.patNet),
          patrimoineTotal:Math.round(f.patTotal),etfPoche:Math.round(f.etfPoche),
          reventeNette:Math.round(f.reventeNet),
          bilanRevente:Math.round(f.bilanRevente),
        })),
        etfPurRef:etfPurGlobal.map(e=>({annee:e.yr,capitalEtf:Math.round(e.cap)})),
      }
    };
  });
  return d;
}

function dlFile(name, content, type){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function exportToCSV(d){
  const lines=[];
  const esc=v=>{ const s=String(v??''); return(s.includes(',')||s.includes('"')||s.includes('\n'))?`"${s.replace(/"/g,'""')}"`  :s; };
  const row=(...c)=>lines.push(c.map(esc).join(','));
  const lbls=KEYS.map(k=>d.simulations[k].label);

  row('## Paramètres globaux'); row('Paramètre','Valeur','Unité');
  row('Inflation',d.global.inflation,'%/an');
  row('Régime fiscal',d.global.regime);
  row('Horizon',d.global.horizon,'ans');
  row("Taux d'actualisation (VAN)",d.global.tauxActu,'%');
  row('Rdt placement alternatif (net)',d.global.rendAlt,'%');
  row('Loyer perso (€/mois)',d.global.loyerPerso,'€/mois');
  row('Reval. loyer perso (%/an)',d.global.revalLoyerPerso,'%/an');
  row('Budget mensuel (€/mois)',d.global.budgetMensuel,'€/mois');
  row('Investir surplus ETF',d.global.investirSurplus?'true':'false');
  row('Apport ETF pur (€)',d.global.apportETF,'€');
  row('');

  row('## Paramètres des simulations'); row('Paramètre',...lbls);
  [
    ['Mode',k=>d.simulations[k].inputs.mode==='loc'?'Locatif':'RP'],
    ["Prix d'achat (€)",k=>d.simulations[k].inputs.prixAchat],
    ['Frais notaire (€)',k=>d.simulations[k].inputs.fraisNotaire],
    ['Travaux (€)',k=>d.simulations[k].inputs.travaux],
    ["Frais agence achat (€)",k=>d.simulations[k].inputs.fraisAgence],
    ['Apport (€)',k=>d.simulations[k].inputs.apport],
    ["Taux intérêt (%)",k=>d.simulations[k].inputs.taux],
    ['Durée (ans)',k=>d.simulations[k].inputs.duree],
    ['Assurance emprunteur (%)',k=>d.simulations[k].inputs.assurance],
    ['Reval. bien (%/an)',k=>d.simulations[k].inputs.revalBien],
    ['Frais agence vente (%)',k=>d.simulations[k].inputs.fraisVente],
    ['Loyer mensuel brut (€)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.loyer:''],
    ['Taux vacance (%)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.vacance:''],
    ['Taxe foncière (€/an)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.taxeFonciere:d.simulations[k].inputs.taxeFonciereRP],
    ['Charges copro (€/an)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.chargesCopro:d.simulations[k].inputs.chargesCoproRP],
    ['Assurance PNO/Hab (€/an)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.assurPNO:d.simulations[k].inputs.assurHab],
    ['Gestion locative (%)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.fraisGestion:''],
    ['Provision travaux (€/an)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.provision:d.simulations[k].inputs.provisionRP],
    ['Reval. loyer (%/an)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.revalLoyer:''],
    ['TMI (%)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.tmi:''],
    ['Prélèvements sociaux (%)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.ps:''],
    ['Amort. bien (%/an)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.amortBien:''],
    ['Amort. travaux (%/an)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.amortTravaux:''],
    ['Impôt PV (%)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.impotPV:''],
    ['PS PV (%)',k=>d.simulations[k].inputs.mode==='loc'?d.simulations[k].inputs.psPV:''],
  ].forEach(([l,fn])=>row(l,...KEYS.map(fn)));
  row('');

  row('## Résultats calculés'); row('Indicateur',...lbls);
  [
    ["Coût total acq. (€)",k=>d.simulations[k].computed.coutTotal],
    ['Montant emprunté (€)',k=>d.simulations[k].computed.montantEmprunte],
    ['Mensualité+ass (€)',k=>d.simulations[k].computed.mensualite+d.simulations[k].computed.assuranceMensuelle],
    ['Total intérêts (€)',k=>d.simulations[k].computed.totalInterets],
    ['Total assurance (€)',k=>d.simulations[k].computed.totalAssurance],
    ['Rendement brut (%)',k=>d.simulations[k].computed.rendementBrut??''],
    ['Rendement net (%)',k=>d.simulations[k].computed.rendementNet??''],
    ['CF mensuel (€)',k=>d.simulations[k].computed.cashflowMensuel??''],
    ['Breakeven (ans)',k=>d.simulations[k].computed.breakevenAns??'>30'],
    ['TRI 10a (%)',k=>d.simulations[k].computed.tri10ans??'N/C'],
    ['TRI 15a (%)',k=>d.simulations[k].computed.tri15ans??'N/C'],
    ['TRI 20a (%)',k=>d.simulations[k].computed.tri20ans??'N/C'],
    ['VAN (€)',k=>d.simulations[k].computed.van],
    ['MOIC',k=>d.simulations[k].computed.moic??''],
  ].forEach(([l,fn])=>row(l,...KEYS.map(fn)));
  row('');

  KEYS.forEach(k=>{
    const s=d.simulations[k], isLoc=s.inputs.mode==='loc';
    row(`## Flux annuels — ${s.label}`);
    row('Année',isLoc?'Loyers encaissés (€)':'Loyer économisé (€)',
      'Charges (€)','Annuité+Ass (€)',...(isLoc?['Impôts (€)']:[]),
      'CF net (€)','CF cumulé (€)','Valeur bien (€)',
      'Capital restant (€)','Patrimoine immo net (€)','Patrimoine total (€)','ETF poche (€)','Revente nette (€)','Bilan revente (€)',
      'ETF pur (€)');
    s.computed.flux.forEach((f,i)=>{
      row(f.annee,isLoc?f.loyersEncaisses:f.loyerEconomise,
        f.charges,f.annuitePlusAssurance,...(isLoc?[f.impots]:[]),
        f.cfNet,f.cfCumule,f.valeurBien,f.capitalRestant,
        f.patrimoineNet,f.patrimoineTotal??'',f.etfPoche??'',f.reventeNette,f.bilanRevente,
        s.computed.etfPurRef?.[i]?.capitalEtf??'');
    });
    row('');
  });
  return lines.join('\n');
}

function toYAML(val, depth=0){
  const pad='  '.repeat(depth);
  if(val===null||val===undefined) return'null';
  if(typeof val==='boolean') return String(val);
  if(typeof val==='number') return isFinite(val)?String(val):'null';
  if(typeof val==='string'){
    const nq=val===''||['true','false','null','yes','no'].includes(val.toLowerCase())||
      /^[\d\-]/.test(val)||/[\n:#\[\]{},&*?|<>=!%@`"']/.test(val);
    return nq?JSON.stringify(val):val;
  }
  if(Array.isArray(val)){
    if(!val.length) return'[]';
    return val.map(item=>{
      if(item!==null&&typeof item==='object'){
        const inner=toYAML(item,depth+1);
        const ipad='  '.repeat(depth+1);
        const nl=inner.indexOf('\n');
        const first=nl>=0?inner.slice(0,nl):inner;
        const rest=nl>=0?inner.slice(nl):'';
        return`${pad}- ${first.slice(ipad.length)}${rest}`;
      }
      return`${pad}- ${toYAML(item,0)}`;
    }).join('\n');
  }
  const entries=Object.entries(val);
  if(!entries.length) return'{}';
  return entries.map(([k,v])=>{
    if(v!==null&&typeof v==='object'){
      if(Array.isArray(v)&&!v.length) return`${pad}${k}: []`;
      if(!Array.isArray(v)&&!Object.keys(v).length) return`${pad}${k}: {}`;
      return`${pad}${k}:\n${toYAML(v,depth+1)}`;
    }
    return`${pad}${k}: ${toYAML(v,0)}`;
  }).join('\n');
}

export function doExport(fmt){
  toggleExpMenu();
  const d=buildExportData();
  const ts=new Date().toISOString().slice(0,10);
  if(fmt==='json')      dlFile(`immorenta_${ts}.json`,JSON.stringify(d,null,2),'application/json');
  else if(fmt==='csv')  dlFile(`immorenta_${ts}.csv`,exportToCSV(d),'text/csv');
  else if(fmt==='yaml') dlFile(`immorenta_${ts}.yaml`,toYAML(d),'text/yaml');
}

// ── Import ─────────────────────────────────────────────────
function parseCSVRow(line){
  const cells=[]; let cell='', inQ=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'){ if(inQ&&line[i+1]==='"'){ cell+='"'; i++; } else inQ=!inQ; }
    else if(c===','&&!inQ){ cells.push(cell); cell=''; }
    else cell+=c;
  }
  cells.push(cell); return cells;
}

function parseCSVSections(text){
  const sections={}; let sec=null;
  for(const raw of text.split('\n')){
    const t=raw.trim(); if(!t) continue;
    if(t.startsWith('##')){ sec=t.replace(/^##\s*/,'').trim(); sections[sec]={headers:[],rows:[]}; continue; }
    if(!sec) continue;
    const cells=parseCSVRow(raw).map(c=>c.trim());
    if(!cells.some(c=>c)) continue;
    if(!sections[sec].headers.length) sections[sec].headers=cells;
    else sections[sec].rows.push(cells);
  }
  return sections;
}

function yScalar(s){
  s=s.trim();
  if(!s||s==='null'||s==='~') return null;
  if(s==='true') return true; if(s==='false') return false;
  const n=Number(s); if(!isNaN(n)&&s!=='') return n;
  if((s[0]==='"'||s[0]==="'")&&s[s.length-1]===s[0]){ try{ return JSON.parse(s); } catch(e){ return s.slice(1,-1); } }
  return s;
}

function parseYAMLFlat(text){
  const flat={}, stack=[]; let skipTo=-1;
  for(const line of text.split('\n')){
    if(/^\s*(#.*)?$/.test(line)) continue;
    const li=line.search(/\S/), tr=line.trim();
    while(stack.length&&stack[stack.length-1].i>=li) stack.pop();
    if(skipTo>=0&&li>skipTo) continue;
    skipTo=-1;
    if(tr.startsWith('- ')){ skipTo=li; continue; }
    const ci=tr.indexOf(':'); if(ci<0) continue;
    const k=tr.slice(0,ci).trim(), vs=tr.slice(ci+1).trim();
    if(vs&&!vs.startsWith('#')) flat[[...stack.map(s=>s.k),k].join('.')]=yScalar(vs);
    stack.push({k,i:li});
  }
  return flat;
}

function restoreFromJSON(data){
  if(!data||typeof data!=='object') throw new Error('Structure invalide');
  const g=data.global||{};
  if(g.inflation!=null)       G.inflation=+g.inflation;
  if(g.regime)                G.regime=String(g.regime);
  if(g.horizon!=null)         G.horizon=+g.horizon;
  if(g.tauxActu!=null)        G.tauxActu=+g.tauxActu;
  if(g.rendAlt!=null)         G.rendAlt=+g.rendAlt;
  if(g.loyerPerso!=null)      G.loyerPerso=+g.loyerPerso;
  if(g.revalLoyerPerso!=null) G.revalLoyerPerso=+g.revalLoyerPerso;
  if(g.budgetMensuel!=null)   G.budgetMensuel=+g.budgetMensuel;
  if(g.investirSurplus!=null) G.investirSurplus=g.investirSurplus===true||g.investirSurplus==='true';
  if(g.apportETF!=null)       G.apportETF=+g.apportETF;
  const sData=data.simulations||{};
  KEYS.forEach(k=>{
    const s=sData[k]; if(!s) return;
    if(s.label!=null)   sims[k].label=String(s.label);
    if(s.enabled!=null) sims[k].enabled=s.enabled===true||s.enabled==='true';
    const inp=s.inputs||{};
    Object.keys(mkDef('loc')).forEach(f=>{
      if(inp[f]==null) return;
      if(f==='mode'||f==='label')  sims[k][f]=String(inp[f]);
      else if(f==='enabled')       sims[k][f]=inp[f]===true||inp[f]==='true';
      else{ const n=parseFloat(inp[f]); if(!isNaN(n)) sims[k][f]=n; }
    });
  });
}

function restoreFromYAML(flat){
  if(flat['global.inflation']!=null)       G.inflation=+flat['global.inflation'];
  if(flat['global.regime'])                G.regime=String(flat['global.regime']);
  if(flat['global.horizon']!=null)         G.horizon=+flat['global.horizon'];
  if(flat['global.tauxActu']!=null)        G.tauxActu=+flat['global.tauxActu'];
  if(flat['global.rendAlt']!=null)         G.rendAlt=+flat['global.rendAlt'];
  if(flat['global.loyerPerso']!=null)      G.loyerPerso=+flat['global.loyerPerso'];
  if(flat['global.revalLoyerPerso']!=null) G.revalLoyerPerso=+flat['global.revalLoyerPerso'];
  if(flat['global.budgetMensuel']!=null)   G.budgetMensuel=+flat['global.budgetMensuel'];
  if(flat['global.investirSurplus']!=null) G.investirSurplus=flat['global.investirSurplus']===true||flat['global.investirSurplus']==='true';
  if(flat['global.apportETF']!=null)       G.apportETF=+flat['global.apportETF'];
  KEYS.forEach(k=>{
    const lbl=flat[`simulations.${k}.label`], en=flat[`simulations.${k}.enabled`];
    if(lbl!=null) sims[k].label=String(lbl);
    if(en!=null)  sims[k].enabled=en===true||en==='true';
    Object.keys(mkDef('loc')).forEach(f=>{
      const v=flat[`simulations.${k}.inputs.${f}`]; if(v==null) return;
      if(f==='mode'||f==='label')  sims[k][f]=String(v);
      else if(f==='enabled')       sims[k][f]=v===true||v==='true';
      else{ const n=parseFloat(v); if(!isNaN(n)) sims[k][f]=n; }
    });
  });
}

function restoreFromCSV(sections){
  const gSec=sections['Paramètres globaux'];
  if(gSec){ for(const r of gSec.rows){
    const[p,v]=r, n=parseFloat(v);
    if(p==='Inflation')                          G.inflation=n;
    else if(p==='Régime fiscal')                 G.regime=v;
    else if(p==='Horizon')                       G.horizon=n;
    else if(p==="Taux d'actualisation (VAN)")    G.tauxActu=n;
    else if(p==='Rdt placement alternatif (net)')G.rendAlt=n;
    else if(p==='Loyer perso (€/mois)')          G.loyerPerso=n;
    else if(p==='Reval. loyer perso (%/an)')     G.revalLoyerPerso=n;
    else if(p==='Budget mensuel (€/mois)')       G.budgetMensuel=n;
    else if(p==='Investir surplus ETF')          G.investirSurplus=v==='true';
    else if(p==='Apport ETF pur (€)')            G.apportETF=n;
  }}
  const sSec=sections['Paramètres des simulations']; if(!sSec) return;
  KEYS.forEach((k,i)=>{ const lbl=sSec.headers[i+1]; if(lbl) sims[k].label=lbl; });
  const fm={
    'Mode':(p,v)=>{ p.mode=v==='Locatif'?'loc':v==='RP'?'rp':v; },
    "Prix d'achat (€)":(p,v)=>{ p.prixAchat=+v; },
    'Frais notaire (€)':(p,v)=>{ p.fraisNotaire=+v; },
    'Travaux (€)':(p,v)=>{ p.travaux=+v; },
    "Frais agence achat (€)":(p,v)=>{ p.fraisAgence=+v; },
    'Apport (€)':(p,v)=>{ p.apport=+v; },
    "Taux intérêt (%)":(p,v)=>{ p.taux=+v; },
    'Durée (ans)':(p,v)=>{ p.duree=+v; },
    'Assurance emprunteur (%)':(p,v)=>{ p.assurance=+v; },
    'Reval. bien (%/an)':(p,v)=>{ p.revalBien=+v; },
    'Frais agence vente (%)':(p,v)=>{ p.fraisVente=+v; },
    'Loyer mensuel brut (€)':(p,v)=>{ if(v) p.loyer=+v; },
    'Taux vacance (%)':(p,v)=>{ if(v) p.vacance=+v; },
    'Taxe foncière (€/an)':(p,v)=>{ if(!v) return; p.mode==='loc'?(p.taxeFonciere=+v):(p.taxeFonciereRP=+v); },
    'Charges copro (€/an)':(p,v)=>{ if(!v) return; p.mode==='loc'?(p.chargesCopro=+v):(p.chargesCoproRP=+v); },
    'Assurance PNO/Hab (€/an)':(p,v)=>{ if(!v) return; p.mode==='loc'?(p.assurPNO=+v):(p.assurHab=+v); },
    'Gestion locative (%)':(p,v)=>{ if(v) p.fraisGestion=+v; },
    'Provision travaux (€/an)':(p,v)=>{ if(!v) return; p.mode==='loc'?(p.provision=+v):(p.provisionRP=+v); },
    'Reval. loyer (%/an)':(p,v)=>{ if(!v||p.mode!=='loc') return; p.revalLoyer=+v; },
    'TMI (%)':(p,v)=>{ if(v) p.tmi=+v; },
    'Prélèvements sociaux (%)':(p,v)=>{ if(v) p.ps=+v; },
    'Amort. bien (%/an)':(p,v)=>{ if(v) p.amortBien=+v; },
    'Amort. travaux (%/an)':(p,v)=>{ if(v) p.amortTravaux=+v; },
    'Impôt PV (%)':(p,v)=>{ if(v) p.impotPV=+v; },
    'PS PV (%)':(p,v)=>{ if(v) p.psPV=+v; },
  };
  for(const row of sSec.rows){
    const fn=fm[row[0]]; if(!fn) continue;
    KEYS.forEach((k,i)=>{ const v=row[i+1]; if(v!=null&&v!=='') fn(sims[k],v); });
  }
}

export function handleImport(input){
  const file=input.files[0]; if(!file) return;
  const ext=file.name.split('.').pop().toLowerCase();
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const text=e.target.result;
      if(ext==='json')           restoreFromJSON(JSON.parse(text));
      else if(ext==='yaml'||ext==='yml') restoreFromYAML(parseYAMLFlat(text));
      else if(ext==='csv')       restoreFromCSV(parseCSVSections(text));
      else throw new Error('Format non supporté : '+ext);
      KEYS.forEach(k=>{ openGrp[k]=sims[k].mode==='loc'?'Exploitation':'Résidence principale'; renderPanel(k); });
      buildGS(); renderLegend(); rebuildShell(); scheduleRedraw();
    }catch(err){ alert('Erreur importation :\n'+err.message); }
    finally{ input.value=''; }
  };
  reader.readAsText(file,'UTF-8');
}
