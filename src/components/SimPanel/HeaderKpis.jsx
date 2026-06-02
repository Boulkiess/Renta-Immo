import { useTranslation } from 'react-i18next';
import { fmtE } from '../../engine/utils.js';
import { KpiRow, KpiChip, KpiLabel, KpiVal } from './SimPanel.styles.js';

/** The four KPI chips in the panel header. Formulas preserved verbatim (cf. CLAUDE.md). */
export default function HeaderKpis({ r, col, personalRent, monthlyBudget, horizon }) {
  const { t } = useTranslation();
  const totalWorth = r.flows[horizon - 1]?.totalWorth;
  const cfN0 = r.flows[0]?.netCashFlow ?? 0;
  return (
    <KpiRow>
      <KpiChip>
        <KpiLabel>{t('kpi.monthlyPayment')}</KpiLabel>
        {/* Viager: include the rente — a bouquet-only viager has no loan payment. */}
        <KpiVal $col={col}>
          {fmtE(r.monthlyPayment + r.monthlyInsurance + (r.monthlyAnnuity ?? 0))}
        </KpiVal>
      </KpiChip>
      <KpiChip $danger={Math.round(-cfN0 / 12) > monthlyBudget}>
        <KpiLabel>{t('kpi.monthlyCashFlow')}</KpiLabel>
        <KpiVal $col={cfN0 < 0 ? '#f87171' : col}>{fmtE(cfN0 / 12)}</KpiVal>
      </KpiChip>
      <KpiChip>
        <KpiLabel>{t('kpi.monthlyEffort')}</KpiLabel>
        <KpiVal $col={-cfN0 / 12 - personalRent > 0 ? '#f87171' : col}>
          {fmtE(-cfN0 / 12 - personalRent)}
        </KpiVal>
      </KpiChip>
      <KpiChip>
        <KpiLabel>{t('kpi.totalWorth', { horizon })}</KpiLabel>
        <KpiVal $col={col}>{fmtE(totalWorth)}</KpiVal>
      </KpiChip>
    </KpiRow>
  );
}
