import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';
import { drawLine } from '../../engine/charts.js';
import { fmtE, fmtK } from '../../engine/utils.js';
import CanvasChart from '../common/CanvasChart.jsx';

const Wrap = styled.div`overflow-y: auto; flex: 1; padding: 12px;`;
const Title = styled.div`font-size: 11px; font-weight: 700; margin-bottom: 2px;`;
const Desc = styled.div`font-size: 10px; color: ${({ theme }) => theme.muted}; margin-bottom: 8px; line-height: 1.4;`;
const SubTitle = styled.div`
  font-size: 10px; font-weight: 700; color: ${({ theme }) => theme.muted};
  margin: 14px 0 6px; text-transform: uppercase; letter-spacing: .5px;
`;

const X_LABELS = Array.from({ length: 30 }, (_, i) => String(i + 1));
const KEY_YEARS = [5, 10, 15, 20, 25, 30];

export default function ReventeTab() {
  const { t } = useTranslation();
  const { sims, RES, etfPurGlobal } = useApp();
  const theme = useTheme();
  const activeKeys = KEYS.filter(k => sims[k].enabled);

  function datasets() {
    const ds = activeKeys.map(k => ({ color: COL[k], label: sims[k].label, data: RES[k].flux.map(f => f.bilanTotal) }));
    ds.push({ color: '#94a3b8', dashed: true, label: 'ETF pur', data: etfPurGlobal.map(e => e.cap) });
    return ds;
  }

  return (
    <Wrap>
      <Title dangerouslySetInnerHTML={{ __html: t('charts.revente.title') }} />
      <Desc dangerouslySetInnerHTML={{ __html: t('charts.revente.desc') }} />
      <CanvasChart
        draw={c => drawLine(c, datasets(), X_LABELS)}
        deps={[sims, RES, etfPurGlobal, theme.name]}
        height={220}
      />

      <SubTitle dangerouslySetInnerHTML={{ __html: t('charts.reventeDetail') }} />

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '5px 8px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 600, color: 'var(--muted)' }}>
              Année
            </th>
            {activeKeys.map(k => (
              <th key={k} style={{ color: COL[k], textAlign: 'right', padding: '5px 8px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: 10 }}>
                {sims[k].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {KEY_YEARS.map((yr, ri) => {
            const etf = etfPurGlobal[yr - 1];
            const bg = ri % 2 === 0 ? 'var(--s2)' : 'transparent';
            return (
              <tr key={yr}>
                <td style={{ padding: '6px 8px', background: bg, fontWeight: 700 }}>
                  {t('revente.yr', { n: yr })}
                </td>
                {activeKeys.map(k => {
                  const f = RES[k].flux[yr - 1];
                  return (
                    <td key={k} style={{ padding: '6px 8px', textAlign: 'right', background: bg }}>
                      <div style={{ color: COL[k], fontWeight: 700 }}>{fmtE(f?.bilanTotal)}</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                        {t('revente.revente')} {fmtK(f?.reventeNet)}
                        {' · '}
                        {t('revente.etfPoche')} {fmtK(f?.etfPoche)}
                      </div>
                      {etf && (
                        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>
                          ETF pur: {fmtK(etf.cap)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Wrap>
  );
}
