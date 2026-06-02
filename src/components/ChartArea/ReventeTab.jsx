import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';
import { drawLine } from '../../engine/charts.js';
import { fmtE, fmtK, deflate } from '../../engine/utils.js';
import CanvasChart from '../common/CanvasChart.jsx';

const Wrap = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 12px;
`;
const Title = styled.div`
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 2px;
`;
const Desc = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.muted};
  margin-bottom: 8px;
  line-height: 1.4;
`;
const SubTitle = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: ${({ theme }) => theme.muted};
  margin: 14px 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const X_LABELS = Array.from({ length: 30 }, (_, i) => String(i + 1));
const KEY_YEARS = [5, 10, 15, 20, 25, 30];

export default function ReventeTab() {
  const { t } = useTranslation();
  const { sims, RES, etfScenarioGlobal, G } = useApp();
  const theme = useTheme();
  const activeKeys = KEYS.filter(k => sims[k].enabled);

  // In real mode, deflate each value by inflation (flux index i is year i+1).
  const real = G.displayReal;
  const dfl = (v, i) => (real ? deflate(v, i + 1, G.inflation) : v);

  function datasets() {
    const ds = activeKeys.map(k => ({
      color: COL[k],
      label: sims[k].label,
      data: RES[k].flows.map((f, i) => dfl(f.totalBalance, i)),
    }));
    ds.push({
      color: '#94a3b8',
      dashed: true,
      label: 'Pure ETF (net)',
      data: etfScenarioGlobal.map((e, i) => dfl(e.capNet, i)),
    });
    return ds;
  }

  function cashDatasets() {
    return activeKeys.map(k => ({
      color: COL[k],
      label: sims[k].label,
      data: RES[k].flows.map((f, i) => dfl(f.cashBalance, i)),
    }));
  }

  // Vertical markers at each sim's resale break-even year (cashBalance ≥ 0).
  function cashAnnotations() {
    return activeKeys
      .filter(k => RES[k].resaleBreakEven != null)
      .map(k => ({
        x: RES[k].resaleBreakEven,
        color: COL[k],
        label: t('resale.yr', { n: RES[k].resaleBreakEven }),
      }));
  }

  // Viager: mark the expected death year — where the rente stops and the décote has
  // fully amortized (the property reaches its full market value) — as a reference event.
  function deathAnnotations() {
    return activeKeys
      .filter(k => sims[k].mode === 'viager')
      .map(k => ({
        x: sims[k].expectedDuration,
        color: COL[k],
        label: t('resale.death', { n: sims[k].expectedDuration }),
      }));
  }

  return (
    <Wrap>
      <Title dangerouslySetInnerHTML={{ __html: t('charts.resale.title') }} />
      <Desc dangerouslySetInnerHTML={{ __html: t('charts.resale.desc') }} />
      <CanvasChart
        draw={c => drawLine(c, datasets(), X_LABELS, deathAnnotations())}
        deps={[sims, RES, etfScenarioGlobal, G, theme.name]}
        height={220}
      />

      <Title
        style={{ marginTop: 18 }}
        dangerouslySetInnerHTML={{ __html: t('charts.resaleCash.title') }}
      />
      <Desc dangerouslySetInnerHTML={{ __html: t('charts.resaleCash.desc') }} />
      <CanvasChart
        draw={c =>
          drawLine(c, cashDatasets(), X_LABELS, [...cashAnnotations(), ...deathAnnotations()])
        }
        deps={[sims, RES, G, theme.name]}
        height={220}
      />

      <SubTitle dangerouslySetInnerHTML={{ __html: t('charts.resaleDetail') }} />

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '5px 8px',
                borderBottom: '1px solid var(--border)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--muted)',
              }}
            >
              Year
            </th>
            {activeKeys.map(k => (
              <th
                key={k}
                style={{
                  color: COL[k],
                  textAlign: 'right',
                  padding: '5px 8px',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 800,
                  fontSize: 10,
                }}
              >
                {sims[k].label}
              </th>
            ))}
            <th
              style={{
                color: '#94a3b8',
                textAlign: 'right',
                padding: '5px 8px',
                borderBottom: '1px solid var(--border)',
                fontWeight: 800,
                fontSize: 10,
              }}
            >
              Pure ETF
            </th>
          </tr>
        </thead>
        <tbody>
          {KEY_YEARS.map((yr, ri) => {
            const etf = etfScenarioGlobal[yr - 1];
            const bg = ri % 2 === 0 ? 'var(--s2)' : 'transparent';
            return (
              <tr key={yr}>
                <td style={{ padding: '6px 8px', background: bg, fontWeight: 700 }}>
                  {t('resale.yr', { n: yr })}
                </td>
                {activeKeys.map(k => {
                  const f = RES[k].flows[yr - 1];
                  return (
                    <td key={k} style={{ padding: '6px 8px', textAlign: 'right', background: bg }}>
                      <div style={{ color: COL[k], fontWeight: 700 }}>{fmtE(f?.totalBalance)}</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                        {t('resale.salePrice')} {fmtK(f?.netResaleProceeds)}
                        {' · '}
                        {t('resale.etfPocket')} {fmtK(f?.etfPocket)}
                      </div>
                    </td>
                  );
                })}
                <td style={{ padding: '6px 8px', textAlign: 'right', background: bg }}>
                  {etf && (
                    <div style={{ color: '#94a3b8', fontWeight: 700 }}>{fmtE(etf.capNet)}</div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Wrap>
  );
}
