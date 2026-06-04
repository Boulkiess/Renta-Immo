import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';
import { drawLine, drawBars } from '../../engine/charts.js';
import { deflate } from '../../engine/utils.js';
import CanvasChart from '../common/CanvasChart.jsx';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  background: ${({ theme }) => theme.border};
  flex: 1;
  min-height: 0;
  overflow: hidden;
  /* Mobile: a single full-width column that scrolls vertically — four tiny
     quadrants are unreadable on a phone. Each chart gets a usable height. */
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-auto-rows: minmax(240px, auto);
    overflow-y: auto;
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  padding: 10px 10px 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ChartTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 2px;
  flex-shrink: 0;
`;
const ChartDesc = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.muted};
  margin-bottom: 4px;
  line-height: 1.4;
  flex-shrink: 0;
`;
const ChartNote = styled.div`
  font-size: 9px;
  color: ${({ theme }) => theme.muted};
  margin-bottom: 4px;
  font-style: italic;
  line-height: 1.4;
  flex-shrink: 0;
  opacity: 0.75;
`;

const X_LABELS = Array.from({ length: 30 }, (_, i) => String(i + 1));

export default function ChartsTab() {
  const { t } = useTranslation();
  const { sims, RES, etfScenarioGlobal, G, crossovers } = useApp();
  const theme = useTheme();
  const deps = [sims, RES, etfScenarioGlobal, G, theme.name];

  const activeKeys = KEYS.filter(k => sims[k].enabled);

  // In real mode, deflate each value by inflation (flux index i is year i+1).
  const real = G.displayReal;
  const dfl = (v, i) => (real ? deflate(v, i + 1, G.inflation) : v);

  const cfCumDs = () =>
    activeKeys.map(k => ({
      color: COL[k],
      label: sims[k].label,
      data: RES[k].flows.map((f, i) => dfl(f.cumulativeCashFlow, i)),
    }));
  const patDs = () => {
    const infl = G.inflation / 100;
    const ds = activeKeys.map(k => ({
      color: COL[k],
      label: sims[k].label,
      data: RES[k].flows.map((f, i) => dfl(f.totalWorth, i)),
    }));
    ds.push({
      color: '#94a3b8',
      dashed: true,
      label: t('charts.etfPure'),
      data: etfScenarioGlobal.map((e, i) => dfl(e.cap, i)),
    });
    // In nominal mode only, add a secondary dashed line for the real ETF value.
    // In real mode the main line is already deflated, so this would be redundant.
    if (!real && infl > 0) {
      ds.push({
        color: '#94a3b840',
        dashed: true,
        label: t('charts.etfPureReal'),
        data: etfScenarioGlobal.map((e, i) => e.cap / Math.pow(1 + infl, i + 1)),
      });
    }
    return ds;
  };
  const cfAnnDs = () =>
    activeKeys.map(k => ({
      color: COL[k],
      label: sims[k].label,
      data: RES[k].flows.map((f, i) => dfl(f.netCashFlow, i)),
    }));
  const vbDs = () =>
    activeKeys.map(k => ({
      color: COL[k],
      label: sims[k].label,
      data: RES[k].flows.map((f, i) => dfl(f.propertyValue, i)),
    }));

  return (
    <Grid>
      <Card>
        <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.cf1.title') }} />
        <ChartDesc dangerouslySetInnerHTML={{ __html: t('charts.cf1.desc') }} />
        <CanvasChart draw={c => drawLine(c, cfCumDs(), X_LABELS)} deps={deps} />
      </Card>

      <Card>
        <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.pat.title') }} />
        <ChartDesc dangerouslySetInnerHTML={{ __html: t('charts.pat.desc') }} />
        {G.inflation > 0 && !real && (
          <ChartNote
            dangerouslySetInnerHTML={{
              __html: t('charts.pat.realNote', { inflation: G.inflation }),
            }}
          />
        )}
        <CanvasChart
          draw={c => {
            const ann = activeKeys
              .filter(k => crossovers[k] != null && crossovers[k] <= 30)
              .map(k => ({ x: crossovers[k], color: COL[k] + '99', label: `yr ${crossovers[k]}` }));
            drawLine(c, patDs(), X_LABELS, ann);
          }}
          deps={[...deps, crossovers]}
        />
      </Card>

      <Card>
        <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.cf3.title') }} />
        <ChartDesc dangerouslySetInnerHTML={{ __html: t('charts.cf3.desc') }} />
        <CanvasChart draw={c => drawBars(c, cfAnnDs(), X_LABELS, false)} deps={deps} />
      </Card>

      <Card>
        <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.vb.title') }} />
        <ChartDesc dangerouslySetInnerHTML={{ __html: t('charts.vb.desc') }} />
        {G.inflation > 0 && !real && (
          <ChartNote
            dangerouslySetInnerHTML={{
              __html: t('charts.vb.realNote', { inflation: G.inflation }),
            }}
          />
        )}
        <CanvasChart
          draw={c => drawLine(c, vbDs(), X_LABELS, [], { baseZero: true })}
          deps={deps}
        />
      </Card>
    </Grid>
  );
}
