import styled from 'styled-components';

export const Wrap = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

export const GrpHead = styled.button`
  width: 100%;
  background: ${({ theme }) => theme.s2};
  border: none;
  color: ${({ theme }) => theme.text};
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 5px 8px;
  cursor: pointer;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:hover {
    background: ${({ theme }) => theme.border};
  }
  @media (max-width: 767px) {
    font-size: 13px;
    padding: 12px 16px;
  }
`;

export const Body = styled.div`
  padding: 4px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  @media (max-width: 767px) {
    padding: 8px 16px 14px;
    gap: 12px;
  }
`;

export const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  @media (max-width: 767px) {
    gap: 5px;
  }
`;

export const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const FieldLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  @media (max-width: 767px) {
    font-size: 13px;
  }
`;

export const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  @media (max-width: 767px) {
    gap: 10px;
  }
`;

export const RangeWrap = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
`;

export const NumIn = styled.input`
  width: 52px;
  flex-shrink: 0;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.inputColor};
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  text-align: right;
  padding: 2px 4px;
  outline: none;
  &:focus {
    border-color: ${({ theme }) => theme.a};
  }
  /* 16px keeps iOS Safari from zooming on focus. */
  @media (max-width: 767px) {
    width: 66px;
    font-size: 16px;
    padding: 6px 6px;
  }
`;

export const Unit = styled.span`
  font-size: 9px;
  color: ${({ theme }) => theme.muted};
  width: 12px;
  flex-shrink: 0;
  text-align: left;
  cursor: ns-resize;
  user-select: none;
  touch-action: none;
  &:hover {
    opacity: 1;
  }
  @media (max-width: 767px) {
    font-size: 15px;
    width: 22px;
    text-align: center;
    padding: 6px 0;
  }
`;

export const AutoBadgeBtn = styled.button.attrs({ type: 'button' })`
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.3px;
  min-width: 18px;
  height: 14px;
  padding: 0 3px;
  flex-shrink: 0;
  border-radius: 3px;
  border: 1px solid;
  cursor: pointer;
  line-height: 14px;
  text-align: center;
  transition:
    opacity 200ms,
    background 200ms,
    color 200ms,
    border-color 200ms;
  background: ${({ $active, $zero, theme }) => ($active && !$zero ? theme.a : 'transparent')};
  color: ${({ $active, $zero, theme }) => ($active && !$zero ? '#fff' : theme.muted)};
  border-color: ${({ $active, $zero, theme }) =>
    $active && !$zero ? theme.a : $zero ? `${theme.muted}55` : `${theme.muted}66`};
  opacity: ${({ $active }) => ($active ? 1 : 0.45)};
  &:hover {
    opacity: 1;
  }
`;

export const HintBannerWrap = styled.div`
  background: ${({ theme }) => theme.s2};
  border: 1px solid ${({ theme }) => `${theme.a}55`};
  border-radius: 4px;
  padding: 5px 7px;
  margin-bottom: 2px;
  font-size: 9px;
  color: ${({ theme }) => theme.muted};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
`;

export const HintDismiss = styled.button.attrs({ type: 'button' })`
  background: none;
  border: none;
  color: ${({ theme }) => theme.muted};
  cursor: pointer;
  font-size: 10px;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
`;
