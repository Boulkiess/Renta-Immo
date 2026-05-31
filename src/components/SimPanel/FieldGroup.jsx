import { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { InfoButton } from '../common/Popover.jsx';
import { useApp } from '../../state/AppContext.jsx';
import { AUTOABLE_FIELDS, computeAutoValue } from '../../state/definitions.js';
import { useDraggableValue, stepDecimals } from '../common/useDraggableValue.js';

const Wrap = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const GrpHead = styled.button`
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
`;

const Body = styled.div`
  padding: 4px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const FieldLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const RangeWrap = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
`;

const NumIn = styled.input`
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
`;

const Unit = styled.span`
  font-size: 9px;
  color: ${({ theme }) => theme.muted};
  width: 12px;
  flex-shrink: 0;
  text-align: left;
  cursor: ns-resize;
  user-select: none;
  &:hover {
    opacity: 1;
  }
`;

const AutoBadgeBtn = styled.button.attrs({ type: 'button' })`
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

const HintBannerWrap = styled.div`
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

const HintDismiss = styled.button.attrs({ type: 'button' })`
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

const unitFor = tp => (tp === 'e' ? '€' : tp === '%' ? '%' : '');

function NumInput({ field, val, isAuto, onChange }) {
  const dec = stepDecimals(field.st);
  // null = show formatted value; string = user is actively typing
  const [localStr, setLocalStr] = useState(null);
  const displayStr = localStr ?? val.toFixed(dec);
  return (
    <NumIn
      type="text"
      inputMode="decimal"
      value={displayStr}
      style={{ opacity: isAuto ? 0.6 : 1 }}
      onFocus={() => setLocalStr(val.toFixed(dec))}
      onBlur={() => setLocalStr(null)}
      onChange={e => {
        setLocalStr(e.target.value);
        const v = +e.target.value;
        if (isFinite(v)) onChange(v);
      }}
      onKeyDown={e => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        const dir = e.key === 'ArrowUp' ? 1 : -1;
        const step = e.shiftKey ? field.st * 10 : field.st;
        const next = Math.min(field.mx, Math.max(field.mn, +(val + dir * step).toFixed(dec)));
        setLocalStr(null);
        onChange(next);
      }}
    />
  );
}

function DraggableUnit({ field, val, isAuto, onChange }) {
  const { onMouseDown } = useDraggableValue({
    val,
    min: field.mn,
    max: field.mx,
    step: field.st,
    onChange,
  });

  return (
    <Unit onMouseDown={onMouseDown} style={{ opacity: isAuto ? 0.6 : undefined }}>
      {unitFor(field.tp)}
    </Unit>
  );
}

export default function FieldGroup({ simKey, group, open, onToggle }) {
  const { t } = useTranslation();
  const { sims, resolvedSims, updateSim, toggleAutoField } = useApp();
  const p = sims[simKey]; // raw state — used for autoFields badge
  const rp = resolvedSims[simKey]; // resolved state — used for display values

  const hasAutoFields = group.f.some(f => AUTOABLE_FIELDS.has(f.k));
  const [hintSeen, setHintSeen] = useState(
    () => !!localStorage.getItem('immorenta_auto_hint_seen')
  );
  const dismissHint = () => {
    localStorage.setItem('immorenta_auto_hint_seen', '1');
    setHintSeen(true);
  };

  return (
    <Wrap>
      <GrpHead onClick={onToggle}>
        <span>{t(`groups.${group.t}`, group.t)}</span>
        <span style={{ fontSize: 9, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </GrpHead>
      {open && (
        <Body>
          {hasAutoFields && !hintSeen && (
            <HintBannerWrap>
              <span>{t('auto.hint')}</span>
              <HintDismiss onClick={dismissHint} title={t('auto.hintDismiss')}>
                ✕
              </HintDismiss>
            </HintBannerWrap>
          )}
          {group.f.map(field => {
            const isAutoable = AUTOABLE_FIELDS.has(field.k);
            const isAuto = isAutoable && (p.autoFields ?? []).includes(field.k);
            const isZeroGuard = isAuto && computeAutoValue(p, field.k) === 0;
            const val = rp[field.k] ?? field.mn;

            const handleChange = v => {
              if (isAuto) toggleAutoField(simKey, field.k);
              updateSim(simKey, field.k, v);
            };

            return (
              <FieldWrap key={field.k}>
                <LabelRow>
                  <InfoButton tooltipKey={field.k} />
                  <FieldLabel title={t(`fields.${field.k}.label`, field.k)}>
                    {t(`fields.${field.k}.label`, field.k)}
                  </FieldLabel>
                  {isAutoable && (
                    <AutoBadgeBtn
                      $active={isAuto}
                      $zero={isZeroGuard}
                      onClick={() => toggleAutoField(simKey, field.k)}
                      title={
                        isZeroGuard
                          ? t('auto.zeroGuard')
                          : isAuto
                            ? t('auto.tooltipOn')
                            : t('auto.tooltipOff')
                      }
                    >
                      {t('auto.badge')}
                    </AutoBadgeBtn>
                  )}
                </LabelRow>
                <InputRow>
                  <RangeWrap>
                    <input
                      type="range"
                      min={field.mn}
                      max={field.mx}
                      step={field.st}
                      value={val}
                      style={{ width: '100%', opacity: isAuto ? 0.35 : 1 }}
                      disabled={isAuto}
                      onChange={e => handleChange(+e.target.value)}
                    />
                  </RangeWrap>
                  <NumInput field={field} val={val} isAuto={isAuto} onChange={handleChange} />
                  <DraggableUnit field={field} val={val} isAuto={isAuto} onChange={handleChange} />
                </InputRow>
              </FieldWrap>
            );
          })}
        </Body>
      )}
    </Wrap>
  );
}
