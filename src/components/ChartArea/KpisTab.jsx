import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';
import { fmtE, fmtP, fmtTRI } from '../../engine/utils.js';
import { InfoButton } from '../common/Popover.jsx';

const Wrap = styled.div`
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const TableWrap = styled.div`
  flex: 1;
  padding: 12px 12px 0;
`;

const TableTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 3px;
`;
const TableDesc = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.muted};
  margin-bottom: 10px;
  line-height: 1.5;
`;

const SectionHead = styled.tr``;
const SectionCell = styled.td`
  font-size: 9px;
  font-weight: 700;
  color: ${({ theme }) => theme.muted};
  background: ${({ theme }) => theme.border};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 4px 10px;
`;

const DataCell = styled.td`
  padding: 7px 12px;
  text-align: right;
  font-family: ${({ theme }) => theme.mono};
  font-size: 12px;
  font-weight: ${({ $best }) => ($best ? 700 : 500)};
  color: ${({ $neg, $color, theme }) => ($neg ? theme.red : $color)};
  background: ${({ $best, $color }) => ($best ? $color + '40' : 'transparent')};
  box-shadow: ${({ $best, $color }) => ($best ? `inset 3px 0 0 ${$color}` : 'none')};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const LabelCell = styled.td`
  padding: 7px 10px;
  font-size: 11px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

/* ── Summary cards ── */
const Cards = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px;
`;
const Card = styled.div`
  flex: 1;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  border-top: 3px solid ${({ $col }) => $col};
  padding: 12px 14px;
`;
const CardLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.muted};
  margin-bottom: 4px;
`;
const CardValue = styled.div`
  font-family: ${({ theme }) => theme.mono};
  font-size: 20px;
  font-weight: 700;
  color: ${({ $col }) => $col};
`;
const CardSub = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.muted};
  margin-top: 2px;
`;

/* helpers */
const parseNum = str => {
  if (str == null || str === '—') return null;
  return parseFloat(
    String(str)
      .replace(/\u202F/g, '')
      .replace(/\s/g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  );
};

export default function KpisTab() {
  const { t } = useTranslation();
  const { sims, RES, etfPurGlobal, crossovers, G } = useApp();

  const hz = G.horizon;
  const etfHz = etfPurGlobal[hz - 1]?.cap;
  const etf30 = etfPurGlobal[29]?.cap;
  const activeKeys = KEYS.filter(k => sims[k].enabled);

  const fmtBe = v => (v == null ? '> 30 ans' : t('kpisTable.anneeN', { n: v }));
  const fmtCross = v => (v == null ? t('kpisTable.gt30ans') : t('kpisTable.anneeN', { n: v }));
  const fmtMoic = v => (v && isFinite(v) ? v.toFixed(2) + 'x' : '—');

  const sections = [
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
        },
        {
          label: t('kpisTable.rendNet'),
          fmt: k => (sims[k].mode === 'loc' ? fmtP(RES[k].rendNet) : '—'),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.rendNet',
        },
        {
          label: t('kpisTable.cfMensuel'),
          fmt: k => fmtE(RES[k].flux[0].cfN / 12),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.cfMensuel',
        },
        {
          label: t('kpisTable.effortRP'),
          fmt: k => fmtE(-RES[k].flux[0].cfN / 12 - G.loyerPerso),
          better: 'min',
          neg: true,
          tooltipKey: 'kpi.effortRP',
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
        },
        {
          label: t('kpisTable.tri15'),
          fmt: k => fmtTRI(RES[k].tri15),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.tri',
        },
        {
          label: t('kpisTable.tri20'),
          fmt: k => fmtTRI(RES[k].tri20),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.tri',
        },
        {
          label: t('kpisTable.van', { tauxActu: G.tauxActu, horizon: hz }),
          fmt: k => fmtE(RES[k].van),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.van',
        },
        {
          label: t('kpisTable.moic', { horizon: hz }),
          fmt: k => fmtMoic(RES[k].moic),
          better: 'max',
          neg: false,
          tooltipKey: 'kpi.moic',
        },
      ],
    },
    {
      cat: t('kpisTable.patTotal', { horizon: hz }).startsWith('P') ? 'Patrimoine' : 'Wealth',
      rows: [
        {
          label: t('kpisTable.patNet', { horizon: hz }),
          fmt: k => fmtE(RES[k].flux[hz - 1]?.patNet),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.patNet',
        },
        {
          label: t('kpisTable.patTotal', { horizon: hz }),
          fmt: k => fmtE(RES[k].flux[hz - 1]?.patTotal),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.patTotal',
        },
        {
          label: t('kpisTable.patTotal30'),
          fmt: k => fmtE(RES[k].flux[29]?.patTotal),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.patTotal',
        },
        {
          label: t('kpisTable.etfPurHorizon', { horizon: hz }),
          fmt: () => fmtE(etfHz),
          better: null,
          neg: false,
          tooltipKey: 'kpi.etfPur',
        },
        {
          label: t('kpisTable.etfPur30'),
          fmt: () => fmtE(etf30),
          better: null,
          neg: false,
          tooltipKey: 'kpi.etfPur',
        },
        {
          label: t('kpisTable.avantageEtf', { horizon: hz }),
          fmt: k => fmtE((RES[k].flux[hz - 1]?.patTotal ?? 0) - (etfHz ?? 0)),
          better: 'max',
          neg: true,
          tooltipKey: 'kpi.avantageEtf',
        },
        {
          label: t('kpisTable.crossover'),
          fmt: k => fmtCross(crossovers[k]),
          better: 'min',
          neg: false,
          tooltipKey: 'kpi.crossover',
        },
      ],
    },
  ];

  return (
    <Wrap>
      <TableWrap>
        <TableTitle>
          {t('kpisTable.title')}{' '}
          <span style={{ fontWeight: 400 }}>{t(`global.regimes.${G.regime}`)}</span>
        </TableTitle>
        <TableDesc>{t('kpisTable.desc')}</TableDesc>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--muted)',
                }}
              >
                {t('kpisTable.indicator')}
              </th>
              {activeKeys.map(k => (
                <th
                  key={k}
                  style={{
                    textAlign: 'right',
                    padding: '6px 10px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 11,
                    fontWeight: 800,
                    color: COL[k],
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: COL[k],
                        display: 'inline-block',
                      }}
                    />
                    {sims[k].label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map(sec => [
              <tr key={sec.cat}>
                <SectionCell colSpan={activeKeys.length + 1}>{sec.cat}</SectionCell>
              </tr>,
              ...sec.rows.map(row => {
                const formatted = activeKeys.map(k => ({ key: k, val: row.fmt(k) }));
                const nums = formatted.map(({ val }) => parseNum(val));

                let bestIdx = null;
                if (row.better && activeKeys.length > 1) {
                  const valid = nums
                    .map((n, i) => (n != null && isFinite(n) ? { n, i } : null))
                    .filter(Boolean);
                  if (valid.length > 1) {
                    const target =
                      row.better === 'max'
                        ? Math.max(...valid.map(v => v.n))
                        : Math.min(...valid.map(v => v.n));
                    const best = valid.find(v => Math.abs(v.n - target) < 0.01);
                    if (best) bestIdx = best.i;
                  }
                }

                return (
                  <tr key={row.label}>
                    <LabelCell>
                      {row.tooltipKey && <InfoButton tooltipKey={row.tooltipKey} />} {row.label}
                    </LabelCell>
                    {formatted.map(({ key: k, val }, si) => {
                      const isBest = si === bestIdx;
                      const isNeg = row.neg && nums[si] != null && nums[si] < 0;
                      return (
                        <DataCell key={k} $best={isBest} $color={COL[k]} $neg={isNeg}>
                          {val}
                        </DataCell>
                      );
                    })}
                  </tr>
                );
              }),
            ])}
          </tbody>
        </table>
      </TableWrap>

      {/* Summary cards */}
      {activeKeys.length > 0 && (
        <Cards>
          {activeKeys.map(k => (
            <Card key={k} $col={COL[k]}>
              <CardLabel>Patrimoine total · {hz} ans</CardLabel>
              <CardValue $col={COL[k]}>{fmtE(RES[k].flux[hz - 1]?.patTotal)}</CardValue>
              <CardSub>{sims[k].label}</CardSub>
            </Card>
          ))}
        </Cards>
      )}
    </Wrap>
  );
}
