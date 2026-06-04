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

/* Mobile: the detail table (5 columns with nested sale-price/ETF-pocket lines) is
   far wider than a phone — scroll horizontally with the Year column pinned. */
const Scroll = styled.div`
  @media (max-width: 767px) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;
const DTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  @media (max-width: 767px) {
    min-width: 640px;
  }
`;
const YearTh = styled.th`
  text-align: left;
  padding: 5px 8px;
  border-bottom: 1px solid var(--border);
  font-size: 10px;
  font-weight: 600;
  color: var(--muted);
  @media (max-width: 767px) {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--bg);
    box-shadow: inset -1px 0 0 var(--border);
  }
`;
const YearTd = styled.td`
  padding: 6px 8px;
  font-weight: 700;
  background: ${({ $bg }) => $bg};
  @media (max-width: 767px) {
    position: sticky;
    left: 0;
    z-index: 1;
    box-shadow: inset -1px 0 0 var(--border);
  }
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
      label: t('charts.etfPureNet'),
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

      <Scroll>
        <DTable>
          <thead>
            <tr>
              <YearTh>{t('resale.year')}</YearTh>
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
                {t('charts.etfPure')}
              </th>
            </tr>
          </thead>
          <tbody>
            {KEY_YEARS.map((yr, ri) => {
              const etf = etfScenarioGlobal[yr - 1];
              // var(--bg) (not transparent) on odd rows so the sticky Year cell is
              // opaque over horizontally-scrolled content on mobile.
              const bg = ri % 2 === 0 ? 'var(--s2)' : 'var(--bg)';
              return (
                <tr key={yr}>
                  <YearTd $bg={bg}>{t('resale.yr', { n: yr })}</YearTd>
                  {activeKeys.map(k => {
                    const f = RES[k].flows[yr - 1];
                    return (
                      <td
                        key={k}
                        style={{ padding: '6px 8px', textAlign: 'right', background: bg }}
                      >
                        <div style={{ color: COL[k], fontWeight: 700 }}>
                          {fmtE(f?.totalBalance)}
                        </div>
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
        </DTable>
      </Scroll>
    </Wrap>
  );
}
