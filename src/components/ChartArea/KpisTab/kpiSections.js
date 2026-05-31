import { fmtE, fmtP, fmtTRI } from '../../../engine/utils.js';

/**
 * Build the KPI table section/row descriptors. Pure data — no JSX.
 *
 * `t` is injected (react-i18next) rather than imported so the function stays a
 * plain data builder the unit tests can drive. The `.startsWith()` language
 * sniffs for section titles are carried verbatim from the original component
 * (behavior-preserving refactor — not "fixed" here).
 *
 * ETF KPIs (tri/triReal/van/moic) come from the engine's computeEtfKpis(G),
 * not recomputed in the view.
 *
 * @param {Function} t  i18n translator
 * @param {{ G: object, RES: object, sims: object, etfPurGlobal: object[],
 *           etfKpis: {tri:number,triReal:number,van:number,moic:number|null},
 *           crossovers: object }} ctx
 */
export function buildSections(t, { G, RES, sims, etfPurGlobal, etfKpis, crossovers }) {
  const hz = G.horizon;
  const etfHz = etfPurGlobal[hz - 1]?.cap;
  const etf30 = etfPurGlobal[29]?.cap;

  const fmtBe = v => (v == null ? '> 30 ans' : t('kpisTable.anneeN', { n: v }));
  const fmtCross = v => (v == null ? t('kpisTable.gt30ans') : t('kpisTable.anneeN', { n: v }));
  const fmtMoic = v => (v && isFinite(v) ? v.toFixed(2) + 'x' : '—');

  const infl = G.inflation / 100;
  const realTri = tri => (tri === null ? null : (1 + tri) / (1 + infl) - 1);
  const deflate = (v, yr) => (v == null ? null : v / Math.pow(1 + infl, yr));

  return [
    {
      cat: t('kpisTable.coutTotal').startsWith('C') ? 'Coûts & Financement' : 'Costs & Financing',
      rows: [
        {
          label: t('kpisTable.coutTotal'),
          fmt: k => fmtE(RES[k].ct),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.coutTotal',
        },
        {
          label: t('kpisTable.emprunte'),
          fmt: k => fmtE(RES[k].emp),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.emprunte',
        },
        {
          label: t('kpisTable.mensualiteAss'),
          fmt: k => fmtE(RES[k].mens + RES[k].assM),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.mensualiteAss',
        },
        {
          label: t('kpisTable.coutCredit'),
          fmt: k => fmtE(RES[k].totInt + RES[k].totAss),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.coutCredit',
        },
      ],
    },
    {
      cat: t('kpisTable.rendBrut').startsWith('R') ? 'Rendements & Cashflow' : 'Yields & Cash-flow',
      rows: [
        {
          label: t('kpisTable.rendBrut'),
          fmt: k => (sims[k].mode === 'loc' ? fmtP(RES[k].rendBrut) : '—'),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.rendBrut',
          etfVal: G.rendAlt,
          etfFmt: v => fmtP(v),
        },
        {
          label: t('kpisTable.rendNet'),
          fmt: k => (sims[k].mode === 'loc' ? fmtP(RES[k].rendNet) : '—'),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.rendNet',
          etfVal: G.rendAlt,
          etfFmt: v => fmtP(v),
        },
        {
          label: t('kpisTable.cfMensuel'),
          fmt: k => fmtE(RES[k].flux[0].cfN / 12),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.cfMensuel',
          etfVal: -G.loyerPerso,
        },
        {
          label: t('kpisTable.coc'),
          fmt: k => (RES[k].flux[0]?.coc != null ? fmtP(RES[k].flux[0].coc) : '—'),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.coc',
          etfVal: null,
        },
        {
          label: t('kpisTable.effortRP'),
          fmt: k => fmtE(-RES[k].flux[0].cfN / 12 - G.loyerPerso),
          better: 'min',
          neg: true,
          tooltipKey: 'kpi.effortRP',
          etfVal: 0,
        },
        {
          label: t('kpisTable.breakeven'),
          fmt: k => fmtBe(RES[k].be),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.breakeven',
        },
      ],
    },
    {
      cat: 'TRI / VAN / MOIC',
      rows: [
        {
          label: t('kpisTable.tri10'),
          fmt: k => fmtTRI(RES[k].tri10),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.tri',
          etfVal: etfKpis.tri,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.tri10Real'),
          fmt: k => fmtTRI(realTri(RES[k].tri10)),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.triReal',
          muted: true,
          etfVal: etfKpis.triReal,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.tri15'),
          fmt: k => fmtTRI(RES[k].tri15),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.tri',
          etfVal: etfKpis.tri,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.tri15Real'),
          fmt: k => fmtTRI(realTri(RES[k].tri15)),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.triReal',
          muted: true,
          etfVal: etfKpis.triReal,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.tri20'),
          fmt: k => fmtTRI(RES[k].tri20),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.tri',
          etfVal: etfKpis.tri,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.tri20Real'),
          fmt: k => fmtTRI(realTri(RES[k].tri20)),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.triReal',
          muted: true,
          etfVal: etfKpis.triReal,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.van', { tauxActu: G.tauxActu, horizon: hz }),
          fmt: k => fmtE(RES[k].van),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.van',
          etfVal: etfKpis.van,
        },
        {
          label: t('kpisTable.moic', { horizon: hz }),
          fmt: k => fmtMoic(RES[k].moic),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.moic',
          etfVal: etfKpis.moic,
          etfFmt: v => fmtMoic(v),
        },
      ],
    },
    {
      cat: t('kpisTable.patTotal', { horizon: hz }).startsWith('P') ? 'Patrimoine' : 'Wealth',
      rows: [
        {
          label: t('kpisTable.bilanReventeHz', { horizon: hz }),
          fmt: k => fmtE(RES[k].flux[hz - 1]?.bilanRevente),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.bilanRevente',
          etfVal: null,
        },
        {
          label: t('kpisTable.bilanTotalHz', { horizon: hz }),
          fmt: k => fmtE(RES[k].flux[hz - 1]?.bilanTotal),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.bilanTotal',
          etfVal: null,
        },
        {
          label: t('kpisTable.patNet', { horizon: hz }),
          fmt: k => fmtE(RES[k].flux[hz - 1]?.patNet),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.patNet',
          etfVal: null,
        },
        {
          label: t('kpisTable.patTotal', { horizon: hz }),
          fmt: k => fmtE(RES[k].flux[hz - 1]?.patTotal),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.patTotal',
          etfVal: etfHz,
        },
        {
          label: t('kpisTable.patTotalReal', { horizon: hz }),
          fmt: k => fmtE(deflate(RES[k].flux[hz - 1]?.patTotal, hz)),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.patReal',
          muted: true,
          etfVal: deflate(etfHz, hz),
        },
        ...(hz < 30
          ? [
              {
                label: t('kpisTable.patTotal30'),
                fmt: k => fmtE(RES[k].flux[29]?.patTotal),
                better: 'max',
                neg: true,
                tooltipKey: 'kpi.patTotal',
                etfVal: etf30,
              },
              {
                label: t('kpisTable.patTotal30Real'),
                fmt: k => fmtE(deflate(RES[k].flux[29]?.patTotal, 30)),
                better: 'max',
                neg: true,
                tooltipKey: 'kpi.patReal',
                muted: true,
                etfVal: deflate(etf30, 30),
              },
            ]
          : []),
        {
          label: t('kpisTable.crossover'),
          fmt: k => fmtCross(crossovers[k]),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.crossover',
          etfVal: null,
        },
      ],
    },
  ];
}
