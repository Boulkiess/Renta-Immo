import styled from 'styled-components';

const DARK_BG = '#0c1830';
const LABEL_COL = '#9fb1d0';
const UNIT_COL = '#7e90b3';
const SEP_COL = 'rgba(255,255,255,.09)';
export const VAL_COL = '#a78bfa';
const SELECT_BG = 'rgba(255,255,255,.05)';

/* Below 768px this only renders inside the mobile settings sheet, so the mobile
   overrides turn the horizontal strip into a scrollable vertical form. */
export const Strip = styled.div`
  background: ${DARK_BG};
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 11px;
  flex-shrink: 0;
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
    border-bottom: none;
  }
`;

export const TitleCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 40px;
  border-right: 1px solid ${SEP_COL};
  background: rgba(255, 255, 255, 0.03);
  /* The sheet header already shows the title. */
  @media (max-width: 767px) {
    display: none;
  }
`;

export const Title = styled.span`
  font-weight: 800;
  color: #dce6f7;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  white-space: nowrap;
  font-size: 10.5px;
`;

export const FieldsScroll = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  overflow-x: auto;
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
    overflow-x: visible;
    width: 100%;
  }
`;

export const HypoBand = styled.div`
  padding: 0 14px;
  height: 40px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  font-size: 10px;
  color: ${LABEL_COL};
  border-left: 1px solid ${SEP_COL};
  flex-shrink: 0;
  @media (max-width: 767px) {
    height: auto;
    white-space: normal;
    line-height: 1.5;
    padding: 12px 16px;
    border-left: none;
    border-top: 1px solid ${SEP_COL};
    font-size: 12px;
  }
`;

export const Field = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 14px;
  height: 40px;
  border-right: 1px solid ${SEP_COL};
  white-space: nowrap;
  @media (max-width: 767px) {
    height: auto;
    min-height: 50px;
    padding: 10px 16px;
    gap: 10px;
    border-right: none;
    border-bottom: 1px solid ${SEP_COL};
  }
`;

export const Label = styled.span`
  color: ${LABEL_COL};
  font-size: 11px;
  @media (max-width: 767px) {
    font-size: 14px;
    flex: 1;
    min-width: 0;
    white-space: normal;
  }
`;

export const NumInput = styled.input`
  width: ${({ $w }) => $w || '48px'};
  background: transparent;
  border: none;
  outline: none;
  font-family: ${({ theme }) => theme.mono};
  font-size: 12px;
  font-weight: 700;
  color: ${VAL_COL};
  text-align: right;
  padding: 0;
  /* 16px keeps iOS Safari from zooming on focus. */
  @media (max-width: 767px) {
    font-size: 16px;
    min-width: 72px;
    width: auto;
  }
`;

export const Unit = styled.span`
  font-size: 10px;
  color: ${UNIT_COL};
  cursor: ns-resize;
  user-select: none;
  touch-action: none;
  &:hover {
    opacity: 1;
  }
  @media (max-width: 767px) {
    font-size: 15px;
    padding: 6px 2px;
  }
`;

export const Select = styled.select`
  background: ${SELECT_BG};
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 5px;
  color: ${VAL_COL};
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 5px;
  outline: none;
  cursor: pointer;
  @media (max-width: 767px) {
    font-size: 16px;
    padding: 8px 10px;
  }
`;
