import { useTranslation } from 'react-i18next';
import { fmtE } from '../../engine/utils.js';
import { ChevronIcon } from './icons.jsx';
import {
  CollapsedStrip,
  StripeChevron,
  StripLabel,
  StripKpi,
  StripDot,
} from './SimPanel.styles.js';

/** Sim active but minimised — vertical strip showing label + total worth. */
export default function CollapsedPanel({ col, label, totalWorth, onExpand }) {
  const { t } = useTranslation();
  return (
    <CollapsedStrip $col={col} onClick={onExpand} title={t('sim.expandTitle')}>
      <StripeChevron $col={col}>
        <ChevronIcon />
      </StripeChevron>
      <StripLabel>{label}</StripLabel>
      <StripKpi>{fmtE(totalWorth)}</StripKpi>
      <StripDot $col={col} />
    </CollapsedStrip>
  );
}
