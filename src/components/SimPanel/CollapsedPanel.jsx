import { fmtE } from '../../engine/utils.js';
import { ChevronIcon } from './icons.jsx';
import {
  CollapsedStrip,
  StripeChevron,
  StripLabel,
  StripKpi,
  StripDot,
} from './SimPanel.styles.js';

/** Sim active but minimised — vertical strip showing label + patrimoine total. */
export default function CollapsedPanel({ col, label, patTotal, onExpand }) {
  return (
    <CollapsedStrip $col={col} onClick={onExpand} title="Déplier le panneau">
      <StripeChevron $col={col}>
        <ChevronIcon />
      </StripeChevron>
      <StripLabel>{label}</StripLabel>
      <StripKpi>{fmtE(patTotal)}</StripKpi>
      <StripDot $col={col} />
    </CollapsedStrip>
  );
}
