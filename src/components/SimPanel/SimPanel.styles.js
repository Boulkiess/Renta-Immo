import styled from 'styled-components';

export const PANEL_W = 220;
export const STRIP_W = 46;

/* ── Collapsed strip (sim active but panel minimised) ── */
export const CollapsedStrip = styled.button`
  flex: 0 0 ${STRIP_W}px;
  width: ${STRIP_W}px;
  background: ${({ theme }) => theme.surface};
  border: none;
  border-top: 3px solid ${({ $col }) => $col};
  border-right: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
  font-family: inherit;
  overflow: hidden;
  transition: background 0.15s;
  &:hover {
    background: ${({ theme }) => theme.s2};
  }
`;
export const StripeChevron = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: ${({ theme }) => theme.s2};
  display: grid;
  place-items: center;
  color: ${({ $col }) => $col};
  flex-shrink: 0;
`;
export const StripLabel = styled.span`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  white-space: nowrap;
  letter-spacing: -0.01em;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
`;
export const StripKpi = styled.span`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: ${({ theme }) => theme.mono};
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => theme.inputColor};
  margin-bottom: 6px;
`;
export const StripDot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ $col }) => $col};
`;

/* ── Disabled strip ── */
export const DisabledStrip = styled.div`
  flex: 0 0 ${STRIP_W}px;
  width: ${STRIP_W}px;
  background: repeating-linear-gradient(
    135deg,
    ${({ theme }) => theme.s2},
    ${({ theme }) => theme.s2} 6px,
    ${({ theme }) => theme.bg} 6px,
    ${({ theme }) => theme.bg} 12px
  );
  border-top: 3px solid ${({ $col }) => $col};
  border-right: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  opacity: 0.85;
`;
export const ReactivateBtn = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface};
  color: ${({ $col }) => $col};
  cursor: pointer;
  flex-shrink: 0;
`;
export const DisabledLabel = styled.span`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.muted};
  white-space: nowrap;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
`;
export const DisabledTag = styled.span`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 8px;
  color: ${({ theme }) => theme.muted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

/* ── Full panel ── */
/* Below 768px this only renders inside the mobile sheet (the desktop SimsPane is
   not mounted there), so the mobile overrides below are sheet-only. */
export const Panel = styled.div`
  flex: 0 0 ${PANEL_W}px;
  width: ${PANEL_W}px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.border};
  overflow: hidden;
  @media (max-width: 767px) {
    flex: none;
    width: 100%;
    border-right: none;
  }
`;

export const Header = styled.div`
  background: ${({ theme }) => theme.surface};
  border-top: 3px solid ${({ $col }) => $col};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 9px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex-shrink: 0;
  @media (max-width: 767px) {
    padding: 12px 16px 16px;
    gap: 12px;
  }
`;

export const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

export const Dot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ $col }) => $col};
  flex-shrink: 0;
`;

export const LabelInput = styled.input`
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  outline: none;
  color: ${({ theme }) => theme.text};
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  &:focus {
    border-bottom-color: ${({ theme }) => theme.a};
  }
  /* 16px keeps iOS Safari from zooming the page on focus. */
  @media (max-width: 767px) {
    font-size: 16px;
  }
`;

export const IconBtn = styled.button`
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.muted};
  display: grid;
  place-items: center;
  border-radius: 5px;
  flex-shrink: 0;
  &:hover {
    background: ${({ theme }) => theme.s2};
    color: ${({ theme }) => theme.text};
  }
  @media (max-width: 767px) {
    width: 36px;
    height: 36px;
  }
`;

export const ModeRow = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  padding: 2px;
  background: ${({ theme }) => theme.s2};
  gap: 2px;
`;

export const ModeBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active, $col }) => ($active ? $col : 'transparent')};
  border: none;
  border-radius: 4px;
  color: ${({ $active, theme }) => ($active ? '#fff' : theme.muted)};
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  @media (max-width: 767px) {
    font-size: 13px;
    padding: 9px 4px;
  }
`;

export const KpiRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  @media (max-width: 767px) {
    gap: 8px;
  }
`;

export const KpiChip = styled.div`
  background: ${({ theme }) => theme.s2};
  border: 1px solid ${({ $danger, theme }) => ($danger ? '#f87171' : theme.border)};
  border-radius: 5px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  @media (max-width: 767px) {
    padding: 8px 10px;
    gap: 3px;
  }
`;
export const KpiLabel = styled.span`
  font-size: 8.5px;
  color: ${({ theme }) => theme.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 767px) {
    font-size: 11px;
  }
`;
export const KpiVal = styled.span`
  font-size: 11px;
  color: ${({ $col }) => $col};
  font-weight: 700;
  font-family: ${({ theme }) => theme.mono};
  @media (max-width: 767px) {
    font-size: 15px;
  }
`;

export const ScrollBody = styled.div`
  overflow-y: auto;
  flex: 1;
`;
