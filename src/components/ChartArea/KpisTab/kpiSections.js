import { fmtE, fmtP, fmtTRI } from '../../../engine/utils.js';

/**
 * Build the KPI table section/row descriptors. Pure data — no JSX.
 *
 * `t` is injected (react-i18next) rather than imported so the function stays a
 * plain data builder the unit tests can drive.
 *
 * ETF KPIs (tri/triReal/van/moic) come from the engine's computeEtfKpis(G),
 * not recomputed in the view.
 *
 * @param {Function} t  i18n translator
 * @param {{ G: object, RES: object, sims: object, etfScenarioGlobal: object[],
 *           etfKpis: {tri:number,triReal:number,van:number,moic:number|null},
 *           crossovers: object }} ctx
 */
export function buildSections(t, { G, RES, sims, etfScenarioGlobal, etfKpis, crossovers }) {
  const hz = G.horizon;
  const etfHz = etfScenarioGlobal[hz - 1]?.cap;
  const etf30 = etfScenarioGlobal[29]?.cap;

  const fmtBe = v => (v == null ? '> 30y' : t('kpisTable.yearN', { n: v }));
  const fmtCross = v => (v == null ? t('kpisTable.gt30y') : t('kpisTable.yearN', { n: v }));
  const fmtMoic = v => (v && isFinite(v) ? v.toFixed(2) + 'x' : '—');

  const infl = G.inflation / 100;
  const realTri = tri => (tri === null ? null : (1 + tri) / (1 + infl) - 1);
  const deflate = (v, yr) => (v == null ? null : v / Math.pow(1 + infl, yr));

  // Nominal/real display toggle: in real mode, emphasize the real rows (color)
  // and mute the nominal ones; in nominal mode, the reverse (current default).
  const real = G.displayReal;

  return [
    {
      cat: t('kpisTable.catCosts'),
      rows: [
        {
          label: t('kpisTable.totalCost'),
          fmt: k => fmtE(RES[k].totalCost),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.totalCost',
        },
        {
          label: t('kpisTable.loanAmount'),
          fmt: k => fmtE(RES[k].loanAmount),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.loanAmount',
        },
        {
          label: t('kpisTable.monthlyPaymentIns'),
          fmt: k => fmtE(RES[k].monthlyPayment + RES[k].monthlyInsurance),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.monthlyPaymentIns',
        },
        {
          label: t('kpisTable.creditCost'),
          fmt: k => fmtE(RES[k].totalInterest + RES[k].totalInsurance),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.creditCost',
        },
      ],
    },
    {
      cat: t('kpisTable.catYields'),
      rows: [
        {
          label: t('kpisTable.grossYield'),
          fmt: k => (sims[k].mode === 'rental' ? fmtP(RES[k].grossYield) : '—'),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.grossYield',
          etfVal: G.altReturn,
          etfFmt: v => fmtP(v),
        },
        {
          label: t('kpisTable.netYield'),
          fmt: k => (sims[k].mode === 'rental' ? fmtP(RES[k].netYield) : '—'),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.netYield',
          etfVal: G.altReturn,
          etfFmt: v => fmtP(v),
        },
        {
          label: t('kpisTable.monthlyCashFlow'),
          fmt: k => fmtE(RES[k].flows[0].netCashFlow / 12),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.monthlyCashFlow',
          etfVal: -G.personalRent,
        },
        {
          label: t('kpisTable.cumulativeCashFlowHz', { horizon: hz }),
          fmt: k => fmtE(RES[k].flows[hz - 1]?.cumulativeCashFlow),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.cumulativeCashFlow',
          etfVal: null,
        },
        {
          label: t('kpisTable.coc'),
          fmt: k => (RES[k].flows[0]?.coc != null ? fmtP(RES[k].flows[0].coc) : '—'),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.coc',
          // ETF: effort cash year 1 mirroring the property netCashFlow (which subtracts personalRent)
          // → only real outflow is the personal rent, no cash distributed by a capitalising ETF.
          etfVal: G.etfDownPayment > 0 ? (-(G.personalRent * 12) / G.etfDownPayment) * 100 : null,
          etfFmt: v => fmtP(v),
        },
        {
          label: t('kpisTable.monthlyEffort'),
          fmt: k => fmtE(-RES[k].flows[0].netCashFlow / 12 - G.personalRent),
          better: 'min',
          neg: true,
          tooltipKey: 'kpi.monthlyEffort',
          etfVal: 0,
        },
        {
          label: t('kpisTable.breakEven'),
          fmt: k => fmtBe(RES[k].breakEven),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.breakEven',
        },
      ],
    },
    {
      cat: t('kpisTable.catReturns'),
      rows: [
        {
          label: t('kpisTable.irr10'),
          fmt: k => fmtTRI(RES[k].tri10),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.irr',
          muted: real,
          etfVal: etfKpis.tri,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.irr10Real'),
          fmt: k => fmtTRI(realTri(RES[k].tri10)),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.irrReal',
          muted: !real,
          etfVal: etfKpis.triReal,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.irr15'),
          fmt: k => fmtTRI(RES[k].tri15),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.irr',
          muted: real,
          etfVal: etfKpis.tri,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.irr15Real'),
          fmt: k => fmtTRI(realTri(RES[k].tri15)),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.irrReal',
          muted: !real,
          etfVal: etfKpis.triReal,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.irr20'),
          fmt: k => fmtTRI(RES[k].tri20),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.irr',
          muted: real,
          etfVal: etfKpis.tri,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.irr20Real'),
          fmt: k => fmtTRI(realTri(RES[k].tri20)),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.irrReal',
          muted: !real,
          etfVal: etfKpis.triReal,
          etfFmt: v => fmtTRI(v),
        },
        {
          label: t('kpisTable.npv', { discountRate: G.discountRate, horizon: hz }),
          fmt: k => fmtE(RES[k].van),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.npv',
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
      cat: t('kpisTable.catWealth'),
      rows: [
        {
          label: t('kpisTable.resaleBalanceHz', { horizon: hz }),
          fmt: k => fmtE(RES[k].flows[hz - 1]?.resaleBalance),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.resaleBalance',
          etfVal: null,
        },
        {
          label: t('kpisTable.totalBalanceHz', { horizon: hz }),
          fmt: k => fmtE(RES[k].flows[hz - 1]?.totalBalance),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.totalBalance',
          etfVal: null,
        },
        {
          label: t('kpisTable.netWorth', { horizon: hz }),
          fmt: k => fmtE(RES[k].flows[hz - 1]?.netWorth),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.netWorth',
          etfVal: null,
        },
        {
          label: t('kpisTable.totalWorth', { horizon: hz }),
          fmt: k => fmtE(RES[k].flows[hz - 1]?.totalWorth),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.totalWorth',
          muted: real,
          etfVal: etfHz,
        },
        {
          label: t('kpisTable.totalWorthReal', { horizon: hz }),
          fmt: k => fmtE(deflate(RES[k].flows[hz - 1]?.totalWorth, hz)),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.wealthReal',
          muted: !real,
          etfVal: deflate(etfHz, hz),
        },
        ...(hz < 30
          ? [
              {
                label: t('kpisTable.totalWorth30'),
                fmt: k => fmtE(RES[k].flows[29]?.totalWorth),
                better: 'max',
                neg: true,
                tooltipKey: 'kpi.totalWorth',
                muted: real,
                etfVal: etf30,
              },
              {
                label: t('kpisTable.totalWorth30Real'),
                fmt: k => fmtE(deflate(RES[k].flows[29]?.totalWorth, 30)),
                better: 'max',
                neg: true,
                tooltipKey: 'kpi.wealthReal',
                muted: !real,
                etfVal: deflate(etf30, 30),
              },
            ]
          : []),
        {
          label: t('kpisTable.resaleBreakEven'),
          fmt: k => fmtBe(RES[k].resaleBreakEven),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.resaleBreakEven',
          etfVal: null,
        },
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
