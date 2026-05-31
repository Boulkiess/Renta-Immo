import { useTranslation } from 'react-i18next';
import { fmtE } from '../../engine/utils.js';
import { KpiRow, KpiChip, KpiLabel, KpiVal } from './SimPanel.styles.js';

/** The four KPI chips in the panel header. Formulas preserved verbatim (cf. CLAUDE.md). */
export default function HeaderKpis({ r, col, loyerPerso, budgetMensuel, horizon }) {
  const { t } = useTranslation();
  const patTotal = r.flux[horizon - 1]?.patTotal;
  const cfN0 = r.flux[0]?.cfN ?? 0;
  return (
    <KpiRow>
      <KpiChip>
        <KpiLabel>{t('kpi.mensualite')}</KpiLabel>
        <KpiVal $col={col}>{fmtE(r.mens + r.assM)}</KpiVal>
      </KpiChip>
      <KpiChip $danger={Math.round(-cfN0 / 12) > budgetMensuel}>
        <KpiLabel>{t('kpi.cfMensuel')}</KpiLabel>
        <KpiVal $col={cfN0 < 0 ? '#f87171' : col}>{fmtE(cfN0 / 12)}</KpiVal>
      </KpiChip>
      <KpiChip>
        <KpiLabel>{t('kpi.effortMois')}</KpiLabel>
        <KpiVal $col={-cfN0 / 12 - loyerPerso > 0 ? '#f87171' : col}>
          {fmtE(-cfN0 / 12 - loyerPerso)}
        </KpiVal>
      </KpiChip>
      <KpiChip>
        <KpiLabel>{t('kpi.patrimTotal', { horizon })}</KpiLabel>
        <KpiVal $col={col}>{fmtE(patTotal)}</KpiVal>
      </KpiChip>
    </KpiRow>
  );
}
