import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';
import { drawBars, drawLine } from '../../engine/charts.js';
import CanvasChart from '../common/CanvasChart.jsx';

const Wrap = styled.div`overflow-y: auto; flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 20px;`;

const SimBlock = styled.div``;
const SimTitle = styled.div`font-size: 12px; font-weight: 800; color: ${({ $col }) => $col}; margin-bottom: 8px;`;
const ChartTitle = styled.div`font-size: 10px; font-weight: 700; margin: 10px 0 2px;`;
const ChartDesc = styled.div`font-size: 10px; color: ${({ theme }) => theme.muted}; margin-bottom: 4px; line-height: 1.4;`;

const Legend = styled.div`display: flex; gap: 12px; margin-bottom: 6px; flex-wrap: wrap;`;
const LegItem = styled.span`font-size: 9px; color: ${({ theme }) => theme.muted}; display: flex; align-items: center; gap: 4px;`;
const Swatch = styled.span`display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${({ $col }) => $col};`;

function aggregateByYear(amort, duree) {
  const cap = [], inter = [], ass = [];
  for (let yr = 1; yr <= duree; yr++) {
    let c = 0, i = 0, a = 0;
    for (let m = (yr - 1) * 12; m < yr * 12 && m < amort.length; m++) {
      c += amort[m].cap; i += amort[m].inter; a += amort[m].assur;
    }
    cap.push(c); inter.push(i); ass.push(a);
  }
  return { cap, inter, ass };
}

export default function AmortTab() {
  const { t } = useTranslation();
  const { sims, RES } = useApp();
  const theme = useTheme();
  const activeKeys = KEYS.filter(k => sims[k].enabled);

  return (
    <Wrap>
      {activeKeys.map(k => {
        const p = sims[k];
        const r = RES[k];
        const { cap, inter, ass } = aggregateByYear(r.amort, p.duree);
        const amortX = Array.from({ length: p.duree }, (_, i) => String(i + 1));
        const capX   = r.flux.map(f => String(f.yr));
        const capData = r.flux.map(f => f.rest);

        const amortDs = [
          { color: COL[k],     label: t('amort.capital'),    data: cap },
          { color: '#f59e0b',  label: t('amort.interets'),   data: inter },
          { color: '#94a3b8',  label: t('amort.assurance'),  data: ass },
        ];
        const capDs = [{ color: COL[k], label: t('amort.capital'), data: capData }];

        return (
          <SimBlock key={k}>
            <SimTitle $col={COL[k]}>{p.label}</SimTitle>

            <Legend>
              <LegItem><Swatch $col={COL[k]} />{t('amort.capital')}</LegItem>
              <LegItem><Swatch $col="#f59e0b" />{t('amort.interets')}</LegItem>
              <LegItem><Swatch $col="#94a3b8" />{t('amort.assurance')}</LegItem>
            </Legend>

            <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.amort.title') }} />
            <ChartDesc dangerouslySetInnerHTML={{ __html: t('charts.amort.desc') }} />
            <CanvasChart
              draw={c => drawBars(c, amortDs, amortX, true)}
              deps={[r, p.duree, theme.name]}
              height={180}
            />

            <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.amortCap.title') }} />
            <CanvasChart
              draw={c => drawLine(c, capDs, capX)}
              deps={[r, p.duree, theme.name]}
              height={120}
            />
          </SimBlock>
        );
      })}
    </Wrap>
  );
}
