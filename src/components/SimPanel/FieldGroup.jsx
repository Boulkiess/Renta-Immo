import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoButton } from '../common/Popover.jsx';
import { useApp } from '../../state/AppContext.jsx';
import { AUTOABLE_FIELDS, computeAutoValue } from '../../state/definitions.js';
import { useDraggableValue, stepDecimals } from '../common/useDraggableValue.js';
import {
  Wrap,
  GrpHead,
  Body,
  FieldWrap,
  LabelRow,
  FieldLabel,
  InputRow,
  RangeWrap,
  NumIn,
  Unit,
  AutoBadgeBtn,
  HintBannerWrap,
  HintDismiss,
} from './FieldGroup.styles.js';

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
  const { onPointerDown } = useDraggableValue({
    val,
    min: field.mn,
    max: field.mx,
    step: field.st,
    onChange,
  });

  return (
    <Unit onPointerDown={onPointerDown} style={{ opacity: isAuto ? 0.6 : undefined }}>
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
