import { useTranslation } from 'react-i18next';
import { ChevronIcon } from './icons.jsx';
import {
  DisabledStrip,
  ReactivateBtn,
  DisabledLabel,
  StripDot,
  DisabledTag,
} from './SimPanel.styles.js';

/** Sim excluded from charts — narrow striped strip with a reactivate button. */
export default function DisabledPanel({ col, label, onReactivate }) {
  const { t } = useTranslation();
  return (
    <DisabledStrip $col={col}>
      <ReactivateBtn $col={col} onClick={onReactivate} title={t('sim.show')}>
        <ChevronIcon />
      </ReactivateBtn>
      <DisabledLabel>{label}</DisabledLabel>
      <StripDot $col={col} style={{ opacity: 0.3, marginBottom: 6 }} />
      <DisabledTag>off</DisabledTag>
    </DisabledStrip>
  );
}
