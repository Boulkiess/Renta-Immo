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
  const { onPointerDown } = useDraggableValue({ val, min, max, step, onChange });
  return <Unit onPointerDown={onPointerDown}>{children}</Unit>;
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
          <InfoButton tooltipKey="discountRate" />
          <Label>{t('global.discountRate')}</Label>
          <NumInput
            type="number"
            min="0"
            max="15"
            step="0.5"
            value={G.discountRate}
            onChange={e => updateG({ discountRate: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={15}
            step={0.5}
            val={G.discountRate}
            onChange={v => updateG({ discountRate: v })}
          >
            {u.percent}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="altReturn" />
          <Label>{t('global.altReturn')}</Label>
          <NumInput
            type="number"
            min="0"
            max="20"
            step="0.5"
            value={G.altReturn}
            onChange={e => updateG({ altReturn: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={20}
            step={0.5}
            val={G.altReturn}
            onChange={v => updateG({ altReturn: v })}
          >
            {u.percent}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="personalRent" />
          <Label>{t('global.personalRent')}</Label>
          <NumInput
            type="number"
            min="0"
            max="5000"
            step="50"
            value={G.personalRent}
            onChange={e => updateG({ personalRent: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={5000}
            step={50}
            val={G.personalRent}
            onChange={v => updateG({ personalRent: v })}
          >
            {u.perMonth}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="personalRentGrowth" />
          <Label>{t('global.personalRentGrowth')}</Label>
          <NumInput
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={G.personalRentGrowth}
            onChange={e => updateG({ personalRentGrowth: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={5}
            step={0.1}
            val={G.personalRentGrowth}
            onChange={v => updateG({ personalRentGrowth: v })}
          >
            {u.perYear}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="monthlyBudget" />
          <Label>{t('global.monthlyBudget')}</Label>
          <NumInput
            $w="62px"
            type="number"
            min="500"
            max="20000"
            step="100"
            value={G.monthlyBudget}
            onChange={e => updateG({ monthlyBudget: +e.target.value })}
          />
          <DraggableUnit
            min={500}
            max={20000}
            step={100}
            val={G.monthlyBudget}
            onChange={v => updateG({ monthlyBudget: v })}
          >
            {u.perMonth}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="budgetGrowth" />
          <Label>{t('global.budgetGrowth')}</Label>
          <NumInput
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={G.budgetGrowth}
            onChange={e => updateG({ budgetGrowth: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={10}
            step={0.1}
            val={G.budgetGrowth}
            onChange={v => updateG({ budgetGrowth: v })}
          >
            {u.perYear}
          </DraggableUnit>
        </Field>

        <Field>
          <InfoButton tooltipKey="chargesGrowth" />
          <Label>{t('global.chargesGrowth')}</Label>
          <NumInput
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={G.chargesGrowth ?? 2}
            onChange={e => updateG({ chargesGrowth: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={10}
            step={0.1}
            val={G.chargesGrowth ?? 2}
            onChange={v => updateG({ chargesGrowth: v })}
          >
            {u.perYear}
          </DraggableUnit>
        </Field>

        <Field style={{ gap: 8 }}>
          <InfoButton tooltipKey="investSurplus" />
          <Label>{t('global.investSurplus')}</Label>
          <Toggle checked={G.investSurplus} onChange={v => updateG({ investSurplus: v })} />
        </Field>

        <Field>
          <InfoButton tooltipKey="etfDownPayment" />
          <Label>{t('global.etfDownPayment')}</Label>
          <NumInput
            $w="68px"
            type="number"
            min="0"
            max="500000"
            step="1000"
            value={G.etfDownPayment}
            onChange={e => updateG({ etfDownPayment: +e.target.value })}
          />
          <DraggableUnit
            min={0}
            max={500000}
            step={1000}
            val={G.etfDownPayment}
            onChange={v => updateG({ etfDownPayment: v })}
          >
            {u.euros}
          </DraggableUnit>
        </Field>
      </FieldsScroll>

      <HypoBand title={t('global.hypoTitle')}>
        {t('global.hypoSummary', {
          inflation: G.inflation,
          chargesGrowth: G.chargesGrowth ?? 2,
          budgetGrowth: G.budgetGrowth,
          personalRentGrowth: G.personalRentGrowth,
        })}
      </HypoBand>
    </Strip>
  );
}
