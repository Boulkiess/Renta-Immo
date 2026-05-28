import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';
import { fmtE, fmtP, fmtTRI } from '../../engine/utils.js';

const Wrap = styled.div`overflow-y: auto; flex: 1; padding: 12px;`;

const TableTitle = styled.div`font-size: 11px; font-weight: 700; margin-bottom: 4px;`;
const TableDesc = styled.div`font-size: 10px; color: ${({ theme }) => theme.muted}; margin-bottom: 12px; line-height: 1.5;`;

const CatRow = styled.tr``;
const CatCell = styled.td`
  font-size: 9px; font-weight: 700; color: ${({ theme }) => theme.muted};
  background: ${({ theme }) => theme.border}; text-transform: uppercase; letter-spacing: .8px;
  padding: 3px 8px;
`;

export default function KpisTab() {
  const { t } = useTranslation();
  const { sims, RES, etfPurGlobal, crossovers, G } = useApp();

  const hz = G.horizon;
  const etfHz  = etfPurGlobal[hz - 1]?.cap;
  const etf30  = etfPurGlobal[29]?.cap;
  const activeKeys = KEYS.filter(k => sims[k].enabled);
  const colSpan = activeKeys.length + 1;

  const fmtBe    = v => v == null ? '> 30 ans' : t('kpisTable.anneeN', { n: v });
  const fmtCross = v => v == null ? t('kpisTable.gt30ans') : t('kpisTable.anneeN', { n: v });
  const fmtMoic  = v => (v && isFinite(v)) ? v.toFixed(2) + 'x' : '—';

  const sections = [
    {
      cat: t('kpisTable.coutTotal').startsWith('C') ? 'Coûts & Financement' : 'Costs & Financing',
      rows: [
        { label: t('kpisTable.coutTotal'),     fmt: k => fmtE(RES[k].ct) },
        { label: t('kpisTable.emprunte'),       fmt: k => fmtE(RES[k].emp) },
        { label: t('kpisTable.mensualiteAss'), fmt: k => fmtE(RES[k].mens + RES[k].assM) },
        { label: t('kpisTable.coutCredit'),    fmt: k => fmtE(RES[k].totInt + RES[k].totAss) },
      ],
    },
    {
      cat: t('kpisTable.rendBrut').startsWith('R') ? 'Rendements & Cashflow' : 'Yields & Cash-flow',
      rows: [
        { label: t('kpisTable.rendBrut'),  fmt: k => sims[k].mode === 'loc' ? fmtP(RES[k].rendBrut) : '—' },
        { label: t('kpisTable.rendNet'),   fmt: k => sims[k].mode === 'loc' ? fmtP(RES[k].rendNet) : '—' },
        { label: t('kpisTable.cfMensuel'), fmt: k => sims[k].mode === 'loc' ? fmtE(RES[k].cfM) : '—' },
        { label: t('kpisTable.effortRP'),  fmt: k => sims[k].mode === 'rp' ? fmtE(Math.abs(RES[k].cfM)) : '—' },
        { label: t('kpisTable.breakeven'), fmt: k => fmtBe(RES[k].be) },
      ],
    },
    {
      cat: 'TRI / VAN / MOIC',
      rows: [
        { label: t('kpisTable.tri10'), fmt: k => fmtTRI(RES[k].tri10) },
        { label: t('kpisTable.tri15'), fmt: k => fmtTRI(RES[k].tri15) },
        { label: t('kpisTable.tri20'), fmt: k => fmtTRI(RES[k].tri20) },
        { label: t('kpisTable.van', { tauxActu: G.tauxActu, horizon: hz }), fmt: k => fmtE(RES[k].van) },
        { label: t('kpisTable.moic', { horizon: hz }),  fmt: k => fmtMoic(RES[k].moic) },
      ],
    },
    {
      cat: t('kpisTable.patTotal', { horizon: hz }).startsWith('P') ? 'Patrimoine' : 'Wealth',
      rows: [
        { label: t('kpisTable.patNet', { horizon: hz }),    fmt: k => fmtE(RES[k].flux[hz - 1]?.patNet) },
        { label: t('kpisTable.patTotal', { horizon: hz }),  fmt: k => fmtE(RES[k].flux[hz - 1]?.patTotal) },
        { label: t('kpisTable.patTotal30'),                 fmt: k => fmtE(RES[k].flux[29]?.patTotal) },
        { label: t('kpisTable.etfPurHorizon', { horizon: hz }), fmt: () => fmtE(etfHz) },
        { label: t('kpisTable.etfPur30'),                        fmt: () => fmtE(etf30) },
        { label: t('kpisTable.avantageEtf', { horizon: hz }),   fmt: k => fmtE((RES[k].flux[hz - 1]?.patTotal ?? 0) - (etfHz ?? 0)) },
        { label: t('kpisTable.crossover'),                  fmt: k => fmtCross(crossovers[k]) },
      ],
    },
  ];

  let rowIdx = 0;

  return (
    <Wrap>
      <TableTitle>
        {t('kpisTable.title')} <span style={{ fontWeight: 400 }}>{t(`global.regimes.${G.regime}`)}</span>
      </TableTitle>
      <TableDesc>{t('kpisTable.desc')}</TableDesc>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 600, color: 'var(--muted)' }}>
              {t('kpisTable.indicator')}
            </th>
            {KEYS.map(k => !sims[k].enabled ? null : (
              <th key={k} style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 800, color: COL[k] }}>
                <span style={{ opacity: 0.4, fontSize: 8, marginRight: 3 }}>{k}</span>
                {sims[k].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map(sec => [
            <tr key={sec.cat}>
              <td colSpan={colSpan} style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', background: 'var(--border)', textTransform: 'uppercase', letterSpacing: '.8px', padding: '3px 8px' }}>
                {sec.cat}
              </td>
            </tr>,
            ...sec.rows.map(row => {
              const even = rowIdx++ % 2 === 0;
              const bg = even ? 'var(--s2)' : 'transparent';
              return (
                <tr key={row.label}>
                  <td style={{ padding: '5px 8px', fontSize: 11, background: bg }}>{row.label}</td>
                  {activeKeys.map(k => (
                    <td key={k} style={{ padding: '5px 8px', fontSize: 11, textAlign: 'right', fontWeight: 700, color: COL[k], background: bg }}>
                      {row.fmt(k)}
                    </td>
                  ))}
                </tr>
              );
            }),
          ])}
        </tbody>
      </table>
    </Wrap>
  );
}
