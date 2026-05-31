import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { InfoButton } from '../common/Popover.jsx';
import Toggle from '../common/Toggle.jsx';
import { useDraggableValue } from '../common/useDraggableValue.js';
import {
  Strip,
  TitleCell,
  Title,
  FieldsScroll,
  HypoBand,
  Field,
  Label,
  NumInput,
  Unit,
  Select,
  VAL_COL,
} from './GlobalStrip.styles.js';

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

function DraggableUnit({ min, max, step, val, onChange, children }) {
  const { onMouseDown } = useDraggableValue({ val, min, max, step, onChange });
  return <Unit onMouseDown={onMouseDown}>{children}</Unit>;
}

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

        <Field style={{ gap: 8 }}>
          <InfoButton tooltipKey="displayReal" />
          <Label>{t('global.displayReal')}</Label>
          <Toggle checked={G.displayReal} onChange={v => updateG({ displayReal: v })} />
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

        <Field>
          <InfoButton tooltipKey="revalCharges" />
          <Label>{t('global.revalCharges')}</Label>
          <NumInput
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={G.revalCharges ?? 2}
            onChange={e => updateG({ revalCharges: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={10}
            step={0.1}
            val={G.revalCharges ?? 2}
            onChange={v => updateG({ revalCharges: v })}
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

      <HypoBand title={t('global.hypoTitle')}>
        {t('global.hypoSummary', {
          inflation: G.inflation,
          revalCharges: G.revalCharges ?? 2,
          revalBudget: G.revalBudget,
          revalLoyerPerso: G.revalLoyerPerso,
        })}
      </HypoBand>
    </Strip>
  );
}
