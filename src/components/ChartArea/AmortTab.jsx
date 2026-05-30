import styled, { useTheme } from "styled-components";
import { useTranslation } from "react-i18next";
import { useApp } from "../../state/AppContext.jsx";
import { COL, KEYS } from "../../state/definitions.js";
import { drawBars, drawLine } from "../../engine/charts.js";
import CanvasChart from "../common/CanvasChart.jsx";

const Wrap = styled.div`
  overflow-y: auto; flex: 1; min-height: 0; padding: 12px; display: flex; flex-direction: column; gap: 16px;
`;

const SimBlock = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px; overflow: hidden; flex-shrink: 0;
`;

const BlockHeader = styled.div`
  padding: 11px 14px 10px; border-bottom: 1px solid ${({ theme }) => theme.border};
`;
const BlockTitle = styled.div`
  font-size: 13px; font-weight: 700; color: ${({ $col }) => $col}; letter-spacing: -0.01em;
`;
const BlockDesc = styled.div`font-size: 11px; color: ${({ theme }) => theme.muted}; margin-top: 3px; line-height: 1.4;`;

const ChartSection = styled.div`padding: 12px 14px;`;
const ChartTitle = styled.div`font-size: 11px; font-weight: 700; margin-bottom: 4px;`;
const ChartDesc = styled.div`font-size: 10px; color: ${({ theme }) => theme.muted}; margin-bottom: 6px; line-height: 1.4;`;

const LegendRow = styled.div`display: flex; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;`;
const LegItem = styled.span`
  font-size: 9px; color: ${({ theme }) => theme.muted};
  display: flex; align-items: center; gap: 4px;
`;
const Swatch = styled.span`
  display: inline-block; width: 10px; height: 10px; border-radius: 2px;
  background: ${({ $col }) => $col};
`;

const Divider = styled.div`height: 1px; background: ${({ theme }) => theme.border}; margin: 0 14px;`;

function aggregateByYear(amort, duree) {
  const cap = [], inter = [], ass = [];
  for (let yr = 1; yr <= duree; yr++) {
    let c = 0, i = 0, a = 0;
    for (let m = (yr - 1) * 12; m < yr * 12 && m < amort.length; m++) {
      c += amort[m].cap;
      i += amort[m].inter;
      a += amort[m].assur;
    }
    cap.push(c);
    inter.push(i);
    ass.push(a);
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
        const capX = r.flux.map(f => String(f.yr));
        const capData = r.flux.map(f => f.rest);

        const amortDs = [
          { color: COL[k], label: t("amort.capital"), data: cap },
          { color: "#ffe600", label: t("amort.interets"), data: inter },
          { color: "#94a3b8", label: t("amort.assurance"), data: ass },
        ];
        const capDs = [{ color: COL[k], label: t("amort.capital"), data: capData }];

        return (
          <SimBlock key={k}>
            <BlockHeader>
              <BlockTitle $col={COL[k]}>{p.label}</BlockTitle>
              <BlockDesc>
                {t("amort.capital")} — {t("kpisTable.emprunte").toLowerCase()} — {t("amort.assurance").toLowerCase()}
              </BlockDesc>
            </BlockHeader>

            <ChartSection>
              <ChartTitle dangerouslySetInnerHTML={{ __html: t("charts.amort.title") }} />
              <ChartDesc dangerouslySetInnerHTML={{ __html: t("charts.amort.desc") }} />
              <LegendRow>
                <LegItem><Swatch $col={COL[k]} />{t("amort.capital")}</LegItem>
                <LegItem><Swatch $col="#dfdc2f" />{t("amort.interets")}</LegItem>
                <LegItem><Swatch $col="#94a3b8" />{t("amort.assurance")}</LegItem>
              </LegendRow>
              <CanvasChart
                draw={c => drawBars(c, amortDs, amortX, true)}
                deps={[r, p.duree, theme.name]}
                height={180}
              />
            </ChartSection>

            <Divider />

            <ChartSection>
              <ChartTitle dangerouslySetInnerHTML={{ __html: t("charts.amortCap.title") }} />
              <CanvasChart
                draw={c => drawLine(c, capDs, capX)}
                deps={[r, p.duree, theme.name]}
                height={120}
              />
            </ChartSection>
          </SimBlock>
        );
      })}
    </Wrap>
  );
}
