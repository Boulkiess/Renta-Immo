import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { InfoButton } from '../common/Popover.jsx';
import { useApp } from '../../state/AppContext.jsx';

const Wrap = styled.div`border-bottom: 1px solid ${({ theme }) => theme.border};`;

const GrpHead = styled.button`
  width: 100%; background: ${({ theme }) => theme.s2}; border: none;
  color: ${({ theme }) => theme.text}; font-family: inherit; font-size: 10px; font-weight: 700; letter-spacing: .5px;
  padding: 5px 8px; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;
  &:hover { background: ${({ theme }) => theme.border}; }
`;

const Body = styled.div`padding: 6px 8px 8px; display: flex; flex-direction: column; gap: 5px;`;

const Row = styled.div`display: flex; align-items: center; gap: 5px;`;

const FieldLabel = styled.span`
  font-size: 10px; color: ${({ theme }) => theme.muted};
  width: 105px; min-width: 105px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const RangeWrap = styled.div`flex: 1; min-width: 0;`;

const NumIn = styled.input`
  width: 54px; background: transparent; border: 1px solid ${({ theme }) => theme.border}; border-radius: 4px;
  color: ${({ theme }) => theme.inputColor}; font-family: inherit; font-size: 10px; font-weight: 700;
  text-align: right; padding: 2px 4px; outline: none;
  &:focus { border-color: ${({ theme }) => theme.a}; }
`;

const Unit = styled.span`font-size: 9px; color: ${({ theme }) => theme.muted}; width: 14px; flex-shrink: 0;`;

const unitFor = tp => tp === 'e' ? '€' : tp === '%' ? '%' : '';

export default function FieldGroup({ simKey, group, open, onToggle }) {
  const { t } = useTranslation();
  const { sims, updateSim } = useApp();
  const p = sims[simKey];

  return (
    <Wrap>
      <GrpHead onClick={onToggle}>
        <span>{t(`groups.${group.t}`, group.t)}</span>
        <span style={{ fontSize: 9, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </GrpHead>
      {open && (
        <Body>
          {group.f.map(field => {
            const val = p[field.k] ?? field.mn;
            return (
              <Row key={field.k}>
                <FieldLabel title={t(`fields.${field.k}.label`, field.k)}>
                  {t(`fields.${field.k}.label`, field.k)}
                </FieldLabel>
                <InfoButton tooltipKey={field.k} />
                <RangeWrap>
                  <input
                    type="range"
                    min={field.mn} max={field.mx} step={field.st}
                    value={val}
                    style={{ width: '100%' }}
                    onChange={e => updateSim(simKey, field.k, +e.target.value)}
                  />
                </RangeWrap>
                <NumIn
                  type="number"
                  min={field.mn} max={field.mx} step={field.st}
                  value={val}
                  onChange={e => { const v = +e.target.value; if (isFinite(v)) updateSim(simKey, field.k, v); }}
                />
                <Unit>{unitFor(field.tp)}</Unit>
              </Row>
            );
          })}
        </Body>
      )}
    </Wrap>
  );
}
