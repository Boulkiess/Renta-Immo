import styled from 'styled-components';

export const Wrap = styled.div`
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const TableWrap = styled.div`
  flex: 1;
  padding: 12px 12px 0;
`;

export const TableTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 3px;
`;

export const TableDesc = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.muted};
  margin-bottom: 10px;
  line-height: 1.5;
`;

export const SectionCell = styled.td`
  font-size: 9px;
  font-weight: 700;
  color: ${({ theme }) => theme.muted};
  background: ${({ theme }) => theme.border};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 4px 10px;
`;

export const DataCell = styled.td`
  padding: 7px 12px;
  text-align: right;
  font-family: ${({ theme }) => theme.mono};
  font-size: 12px;
  font-weight: ${({ $best }) => ($best ? 700 : 500)};
  color: ${({ $neg, $muted, $color, theme }) => ($neg ? theme.red : $muted ? theme.muted : $color)};
  background: ${({ $best, $color }) => ($best ? $color + '40' : 'transparent')};
  box-shadow: ${({ $best, $color }) => ($best ? `inset 3px 0 0 ${$color}` : 'none')};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  opacity: ${({ $muted }) => ($muted ? 0.75 : 1)};
`;

export const LabelCell = styled.td`
  padding: 7px 10px;
  font-size: 11px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  color: ${({ $muted, theme }) => ($muted ? theme.muted : 'inherit')};
`;

/* ── Summary cards ── */
export const Cards = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px;
`;

export const Card = styled.div`
  flex: 1;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  border-top: 3px solid ${({ $col }) => $col};
  padding: 12px 14px;
`;

export const CardLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.muted};
  margin-bottom: 4px;
`;

export const CardValue = styled.div`
  font-family: ${({ theme }) => theme.mono};
  font-size: 20px;
  font-weight: 700;
  color: ${({ $col }) => $col};
`;

export const CardSub = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.muted};
  margin-top: 2px;
`;
