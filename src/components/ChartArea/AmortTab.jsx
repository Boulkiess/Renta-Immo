import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';
import { drawBarsWithLine } from '../../engine/charts.js';
import CanvasChart from '../common/CanvasChart.jsx';

const Wrap = styled.div`
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SimBlock = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
`;

const BlockHeader = styled.div`
  padding: 11px 14px 10px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;
const BlockTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${({ $col }) => $col};
  letter-spacing: -0.01em;
`;
const BlockDesc = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.muted};
  margin-top: 3px;
  line-height: 1.4;
`;

const ChartSection = styled.div`
  padding: 12px 14px;
`;
const ChartTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 4px;
`;
const ChartDesc = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.muted};
  margin-bottom: 6px;
  line-height: 1.4;
`;

const LegendRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;
const LegItem = styled.span`
  font-size: 9px;
  color: ${({ theme }) => theme.muted};
  display: flex;
  align-items: center;
  gap: 4px;
`;
const Swatch = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: ${({ $col }) => $col};
`;
const LineSwatch = styled.span`
  display: inline-block;
  width: 16px;
  height: 2px;
  border-radius: 1px;
  background: ${({ $col }) => $col};
  vertical-align: middle;
`;

const AMORT_COLORS = {
  interest: '#e2cbcb',
  insurance: '#a30eff',
  remaining: '#ff0000',
  repaid: '#ffff00',
};

function aggregateByYear(amortization, loanTerm) {
  const principal = [],
    interest = [],
    insurance = [];
  for (let yr = 1; yr <= loanTerm; yr++) {
    let c = 0,
      i = 0,
      a = 0;
    for (let m = (yr - 1) * 12; m < yr * 12 && m < amortization.length; m++) {
      c += amortization[m].principal;
      i += amortization[m].interest;
      a += amortization[m].insurance;
    }
    principal.push(c);
    interest.push(i);
    insurance.push(a);
  }
  return { principal, interest, insurance };
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
        const { principal, interest, insurance } = aggregateByYear(r.amortization, p.loanTerm);
        const amortX = Array.from({ length: p.loanTerm }, (_, i) => String(i + 1));
        const remainingByYear = Array.from({ length: p.loanTerm }, (_, i) => {
          const idx = (i + 1) * 12 - 1;
          return idx < r.amortization.length ? r.amortization[idx].remaining : 0;
        });
        let cumPrincipal = 0;
        const principalRepaid = principal.map(v => (cumPrincipal += v));

        const amortDs = [
          { color: COL[k], label: t('amortization.principal'), data: principal },
          { color: AMORT_COLORS.interest, label: t('amortization.interest'), data: interest },
          { color: AMORT_COLORS.insurance, label: t('amortization.insurance'), data: insurance },
        ];
        const restDs = {
          color: AMORT_COLORS.remaining,
          label: t('charts.amortizationBalance.title'),
          data: remainingByYear,
          dashed: false,
        };
        const capRemDs = {
          color: AMORT_COLORS.repaid,
          label: t('amortization.principalRepaid'),
          data: principalRepaid,
          dashed: false,
        };

        return (
          <SimBlock key={k}>
            <BlockHeader>
              <BlockTitle $col={COL[k]}>{p.label}</BlockTitle>
              <BlockDesc>
                {t('amortization.principal')} — {t('kpisTable.loanAmount').toLowerCase()} —{' '}
                {t('amortization.insurance').toLowerCase()}
              </BlockDesc>
            </BlockHeader>

            <ChartSection>
              <ChartTitle dangerouslySetInnerHTML={{ __html: t('charts.amortization.title') }} />
              <ChartDesc dangerouslySetInnerHTML={{ __html: t('charts.amortization.desc') }} />
              <LegendRow>
                <LegItem>
                  <Swatch $col={COL[k]} />
                  {t('amortization.principal')}
                </LegItem>
                <LegItem>
                  <Swatch $col={AMORT_COLORS.interest} />
                  {t('amortization.interest')}
                </LegItem>
                <LegItem>
                  <Swatch $col={AMORT_COLORS.insurance} />
                  {t('amortization.insurance')}
                </LegItem>
                <LegItem>
                  <LineSwatch $col={AMORT_COLORS.remaining} />
                  {t('charts.amortizationBalance.title')}
                </LegItem>
                <LegItem>
                  <LineSwatch $col={AMORT_COLORS.repaid} />
                  {t('amortization.principalRepaid')}
                </LegItem>
              </LegendRow>
              <CanvasChart
                draw={c => drawBarsWithLine(c, amortDs, [restDs, capRemDs], amortX)}
                deps={[r, p.loanTerm, theme.name]}
                height={220}
              />
            </ChartSection>
          </SimBlock>
        );
      })}
    </Wrap>
  );
}
