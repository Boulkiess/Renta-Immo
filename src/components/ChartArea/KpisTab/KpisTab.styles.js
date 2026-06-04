import styled from 'styled-components';

export const Wrap = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const TableWrap = styled.div`
  flex: 1;
  padding: 12px 12px 0;
`;

/* Mobile: the 5-column table is wider than a phone — scroll it horizontally
   while the indicator column stays pinned (sticky) so rows stay identifiable. */
export const TableScroll = styled.div`
  @media (max-width: 767px) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  @media (max-width: 767px) {
    min-width: 520px;
  }
`;

export const IndicatorTh = styled.th`
  text-align: left;
  padding: 6px 10px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.muted};
  @media (max-width: 767px) {
    position: sticky;
    left: 0;
    z-index: 2;
    background: ${({ theme }) => theme.bg};
    box-shadow: inset -1px 0 0 ${({ theme }) => theme.border};
  }
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
  /* Padding lives on the inner label so it can be pinned independently. */
  padding: 0;
`;

/* The section label. The cell spans every column (so it can't stick on its own),
   so on mobile we pin the label text instead — it stays visible while the data
   columns scroll horizontally. Padding here reproduces the desktop bar spacing. */
export const SectionLabel = styled.span`
  display: inline-block;
  padding: 4px 10px;
  @media (max-width: 767px) {
    position: sticky;
    left: 0;
  }
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
  @media (max-width: 767px) {
    position: sticky;
    left: 0;
    z-index: 1;
    background: ${({ theme }) => theme.bg};
    box-shadow: inset -1px 0 0 ${({ theme }) => theme.border};
  }
`;

/* ── Summary cards ── */
export const Cards = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px;
  /* Mobile: the large mono values don't shrink, so 3 side-by-side cards overflow
     the viewport and added a right gutter to the whole tab. Stack them. */
  @media (max-width: 767px) {
    flex-direction: column;
  }
`;

export const Card = styled.div`
  flex: 1;
  min-width: 0;
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
