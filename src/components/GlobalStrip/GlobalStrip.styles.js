import styled from 'styled-components';

const DARK_BG = '#0c1830';
const LABEL_COL = '#9fb1d0';
const UNIT_COL = '#7e90b3';
const SEP_COL = 'rgba(255,255,255,.09)';
export const VAL_COL = '#a78bfa';
const SELECT_BG = 'rgba(255,255,255,.05)';

export const Strip = styled.div`
  background: ${DARK_BG};
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 11px;
  flex-shrink: 0;
`;

export const TitleCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 40px;
  border-right: 1px solid ${SEP_COL};
  background: rgba(255, 255, 255, 0.03);
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
`;

export const Field = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 14px;
  height: 40px;
  border-right: 1px solid ${SEP_COL};
  white-space: nowrap;
`;

export const Label = styled.span`
  color: ${LABEL_COL};
  font-size: 11px;
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
`;

export const Unit = styled.span`
  font-size: 10px;
  color: ${UNIT_COL};
  cursor: ns-resize;
  user-select: none;
  &:hover {
    opacity: 1;
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
`;
