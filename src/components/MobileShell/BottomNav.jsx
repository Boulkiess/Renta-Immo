import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';

/**
 * Fixed bottom tab bar for the mobile shell: Chart · A · B · C · Settings.
 * Chart is active when no sheet is open; A/B/C and Settings reflect the open
 * sheet. Tap targets are ≥ 56px tall. Sim color dots mirror the Legend.
 */
const Bar = styled.nav`
  display: flex;
  flex-shrink: 0;
  border-top: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface};
  padding-bottom: env(safe-area-inset-bottom, 0);
`;

const Item = styled.button`
  flex: 1;
  min-width: 0;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 2px;
  color: ${({ $active, $col, theme }) => ($active ? ($col ?? theme.a) : theme.muted)};
  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

const Label = styled.span`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Dot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $col }) => $col};
  opacity: ${({ $on }) => ($on ? 1 : 0.4)};
`;

function ChartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4v16h16" />
      <path d="M7 14l3-4 3 3 4-6" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function BottomNav({ active, onSelect }) {
  const { t } = useTranslation();
  const { sims } = useApp();

  return (
    <Bar>
      <Item $active={active === 'chart'} onClick={() => onSelect('chart')}>
        <ChartIcon />
        <Label>{t('tabs.charts')}</Label>
      </Item>
      {KEYS.map(k => (
        <Item
          key={k}
          $active={active === k}
          $col={COL[k]}
          onClick={() => onSelect(k)}
          title={sims[k].label}
        >
          <Dot $col={COL[k]} $on={sims[k].enabled} />
          <Label>{k}</Label>
        </Item>
      ))}
      <Item $active={active === 'settings'} onClick={() => onSelect('settings')}>
        <GearIcon />
        <Label>{t('mobile.settings')}</Label>
      </Item>
    </Bar>
  );
}
