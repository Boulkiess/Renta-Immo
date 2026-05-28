import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';
import { drawLine, drawBars } from '../../engine/charts.js';
import CanvasChart from '../common/CanvasChart.jsx';

const Grid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
  background: ${({ theme }) => theme.border};
  flex: 1; min-height: 0; overflow: hidden;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.surface}; padding: 10px 10px 6px; overflow: hidden; display: flex; flex-direction: column;
`;

const ChartTitle = styled.div`font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.text}; margin-bottom: 2px; flex-shrink: 0;`;
const ChartDesc = styled.div`font-size: 10px; color: ${({ theme }) => theme.muted}; margin-bottom: 6px; line-height: 1.4; flex-shrink: 0;`;
const CanvasWrap = styled.div`flex: 1; min-height: 0; position: relative;`;

const X_LABELS = Array.from({ length: 30 }, (_, i) => String(i + 1));

export default function ChartsTab() {
  const { t } = useTranslation();
  const { sims, RES, etfPurGlobal, G } = useApp();
  const deps = [sims, RES, etfPurGlobal, G];

  const activeKeys = KEYS.filter(k => sims[k].enabled);

  const cfCumDs   = () => activeKeys.map(k => ({ color: COL[k], data: RES[k].flux.map(f => f.cfC) }));
  const patDs     = () => {
    const ds = activeKeys.map(k => ({ color: COL[k], data: RES[k].flux.map(f => f.patTotal) }));
    ds.push({ color: '#94a3b8', dashed: true, data: etfPurGlobal.map(e => e.cap) });
    return ds;
  };
  const cfAnnDs   = () => activeKeys.map(k => ({ color: COL[k], data: RES[k].flux.map(f => f.cfN) }));
  const vbDs      = () => activeKeys.map(k => ({ color: COL[k], data: RES[k].flux.map(f => f.vb) }));

  return (
    <Grid>
      <Card>
        <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.cf1.title') }} />
        <ChartDesc dangerouslySetInnerHTML={{ __html: t('charts.cf1.desc') }} />
        <CanvasWrap>
          <CanvasChart draw={c => drawLine(c, cfCumDs(), X_LABELS)} deps={deps} height={185} />
        </CanvasWrap>
      </Card>

      <Card>
        <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.pat.title') }} />
        <ChartDesc dangerouslySetInnerHTML={{ __html: t('charts.pat.desc') }} />
        <CanvasWrap>
          <CanvasChart draw={c => drawLine(c, patDs(), X_LABELS)} deps={deps} height={185} />
        </CanvasWrap>
      </Card>

      <Card>
        <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.cf3.title') }} />
        <ChartDesc dangerouslySetInnerHTML={{ __html: t('charts.cf3.desc') }} />
        <CanvasWrap>
          <CanvasChart draw={c => drawBars(c, cfAnnDs(), X_LABELS, false)} deps={deps} height={185} />
        </CanvasWrap>
      </Card>

      <Card>
        <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.vb.title') }} />
        <ChartDesc dangerouslySetInnerHTML={{ __html: t('charts.vb.desc') }} />
        <CanvasWrap>
          <CanvasChart draw={c => drawLine(c, vbDs(), X_LABELS)} deps={deps} height={185} />
        </CanvasWrap>
      </Card>
    </Grid>
  );
}
