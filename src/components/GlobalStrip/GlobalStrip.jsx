import { useState, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { InfoButton } from '../common/Popover.jsx';
import Toggle from '../common/Toggle.jsx';

const DARK_BG = '#0c1830';
const LABEL_COL = '#9fb1d0';
const UNIT_COL = '#7e90b3';
const SEP_COL = 'rgba(255,255,255,.09)';
const VAL_COL = '#a78bfa';
const SELECT_BG = 'rgba(255,255,255,.05)';

const Strip = styled.div`
  background: ${DARK_BG};
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 11px;
  flex-shrink: 0;
`;

const TitleCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 40px;
  border-right: 1px solid ${SEP_COL};
  background: rgba(255, 255, 255, 0.03);
`;
const GearIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', color: VAL_COL }}
  >
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3v2.5M12 18.5V21M4.2 7l2.1 1.2M17.7 15.8l2.1 1.2M4.2 17l2.1-1.2M17.7 8.2l2.1-1.2" />
  </svg>
);

const Title = styled.span`
  font-weight: 800;
  color: #dce6f7;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  white-space: nowrap;
  font-size: 10.5px;
`;

const FieldsScroll = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  overflow-x: auto;
`;

const Field = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 14px;
  height: 40px;
  border-right: 1px solid ${SEP_COL};
  white-space: nowrap;
`;

const Label = styled.span`
  color: ${LABEL_COL};
  font-size: 11px;
`;

const NumInput = styled.input`
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

const Unit = styled.span`
  font-size: 10px;
  color: ${UNIT_COL};
  cursor: ns-resize;
  user-select: none;
  &:hover {
    opacity: 1;
  }
`;

const stepDecimals = st => {
  const s = st.toString();
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
};

const PIXELS_PER_STEP = 6;

function DraggableUnit({ min, max, step, val, onChange, children }) {
  const dragRef = useRef(null);
  const dec = stepDecimals(step);

  const handleMouseDown = e => {
    e.preventDefault();
    const el = e.currentTarget;
    dragRef.current = { currentVal: val };
    el.requestPointerLock();
    document.body.style.userSelect = 'none';

    const handleMove = mv => {
      if (!mv.movementY) return;
      const mult = mv.shiftKey ? 10 : 1;
      dragRef.current.currentVal -= (mv.movementY * mult * step) / PIXELS_PER_STEP;
      const next = Math.min(max, Math.max(min, +dragRef.current.currentVal.toFixed(dec)));
      onChange(next);
    };

    const cleanup = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.body.style.userSelect = '';
      dragRef.current = null;
    };

    const handleUp = () => {
      document.exitPointerLock();
      cleanup();
    };

    const onLockChange = () => {
      if (!document.pointerLockElement) cleanup();
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('pointerlockchange', onLockChange);
  };

  return <Unit onMouseDown={handleMouseDown}>{children}</Unit>;
}

const Select = styled.select`
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

export default function GlobalStrip() {
  const { t } = useTranslation();
  const { G, updateG } = useApp();
  const u = t('global.units', { returnObjects: true });
  const [horizonDraft, setHorizonDraft] = useState(null);

  return (
    <Strip>
      <TitleCell>
        <GearIcon />
        <Title>{t('global.title')}</Title>
      </TitleCell>

      <FieldsScroll>
        <Field>
          <InfoButton tooltipKey="inflation" />
          <Label>{t('global.inflation')}</Label>
          <NumInput
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={G.inflation}
            onChange={e => updateG({ inflation: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={10}
            step={0.1}
            val={G.inflation}
            onChange={v => updateG({ inflation: v })}
          >
            {u.perYear}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="regime" />
          <Label>{t('global.regime')}</Label>
          <Select value={G.regime} onChange={e => updateG({ regime: e.target.value })}>
            {['lmnp', 'microbic', 'nu'].map(r => (
              <option key={r} value={r}>
                {t(`global.regimes.${r}`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field>
          <Label>{t('global.horizon')}</Label>
          <NumInput
            type="number"
            min="5"
            max="30"
            step="1"
            value={horizonDraft !== null ? horizonDraft : G.horizon}
            onChange={e => {
              setHorizonDraft(e.target.value);
              const v = parseInt(e.target.value, 10);
              if (v >= 1 && v <= 30) updateG({ horizon: v });
            }}
            onBlur={() => setHorizonDraft(null)}
          />
          <DraggableUnit
            min={5}
            max={30}
            step={1}
            val={G.horizon}
            onChange={v => updateG({ horizon: v })}
          >
            {u.years}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="tauxActu" />
          <Label>{t('global.tauxActu')}</Label>
          <NumInput
            type="number"
            min="0"
            max="15"
            step="0.5"
            value={G.tauxActu}
            onChange={e => updateG({ tauxActu: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={15}
            step={0.5}
            val={G.tauxActu}
            onChange={v => updateG({ tauxActu: v })}
          >
            {u.percent}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="rendAlt" />
          <Label>{t('global.rendAlt')}</Label>
          <NumInput
            type="number"
            min="0"
            max="20"
            step="0.5"
            value={G.rendAlt}
            onChange={e => updateG({ rendAlt: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={20}
            step={0.5}
            val={G.rendAlt}
            onChange={v => updateG({ rendAlt: v })}
          >
            {u.percent}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="loyerPerso" />
          <Label>{t('global.loyerPerso')}</Label>
          <NumInput
            type="number"
            min="0"
            max="5000"
            step="50"
            value={G.loyerPerso}
            onChange={e => updateG({ loyerPerso: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={5000}
            step={50}
            val={G.loyerPerso}
            onChange={v => updateG({ loyerPerso: v })}
          >
            {u.perMonth}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="revalLoyerPerso" />
          <Label>{t('global.revalLoyerPerso')}</Label>
          <NumInput
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={G.revalLoyerPerso}
            onChange={e => updateG({ revalLoyerPerso: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={5}
            step={0.1}
            val={G.revalLoyerPerso}
            onChange={v => updateG({ revalLoyerPerso: v })}
          >
            {u.perYear}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="budgetMensuel" />
          <Label>{t('global.budgetMensuel')}</Label>
          <NumInput
            $w="62px"
            type="number"
            min="500"
            max="20000"
            step="100"
            value={G.budgetMensuel}
            onChange={e => updateG({ budgetMensuel: +e.target.value })}
          />
          <DraggableUnit
            min={500}
            max={20000}
            step={100}
            val={G.budgetMensuel}
            onChange={v => updateG({ budgetMensuel: v })}
          >
            {u.perMonth}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="revalBudget" />
          <Label>{t('global.revalBudget')}</Label>
          <NumInput
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={G.revalBudget}
            onChange={e => updateG({ revalBudget: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={10}
            step={0.1}
            val={G.revalBudget}
            onChange={v => updateG({ revalBudget: v })}
          >
            {u.perYear}
          </DraggableUnit>
        </Field>

        <Field style={{ gap: 8 }}>
          <InfoButton tooltipKey="investirSurplus" />
          <Label>{t('global.investirSurplus')}</Label>
          <Toggle checked={G.investirSurplus} onChange={v => updateG({ investirSurplus: v })} />
        </Field>

        <Field>
          <InfoButton tooltipKey="apportETF" />
          <Label>{t('global.apportETF')}</Label>
          <NumInput
            $w="68px"
            type="number"
            min="0"
            max="500000"
            step="1000"
            value={G.apportETF}
            onChange={e => updateG({ apportETF: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={500000}
            step={1000}
            val={G.apportETF}
            onChange={v => updateG({ apportETF: v })}
          >
            {u.euros}
          </DraggableUnit>
        </Field>
      </FieldsScroll>
    </Strip>
  );
}
