import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { InfoButton } from '../common/Popover.jsx';
import Toggle from '../common/Toggle.jsx';

const Strip = styled.div`
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 6px 16px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 11px;
`;
const Title = styled.span`
  font-weight: 700; color: ${({ theme }) => theme.muted};
  text-transform: uppercase; letter-spacing: 1px; margin-right: 4px; white-space: nowrap; font-size: 10px;
`;
const Field = styled.div`
  display: flex; align-items: center; gap: 5px;
  background: ${({ theme }) => theme.s2}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 7px; padding: 3px 8px;
`;
const Label = styled.span`color: ${({ theme }) => theme.muted}; white-space: nowrap; font-size: 10px;`;
const NumInput = styled.input`
  width: ${({ $w }) => $w || '50px'}; background: transparent; border: none; outline: none;
  font-family: inherit; font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.inputColor};
  text-align: right; padding: 0;
`;
const Unit = styled.span`font-size: 9px; color: ${({ theme }) => theme.muted}; white-space: nowrap;`;
const Div = styled.div`width: 1px; height: 16px; background: ${({ theme }) => theme.border}; margin: 0 2px;`;
const Select = styled.select`
  background: ${({ theme }) => theme.s2}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px; color: ${({ theme }) => theme.inputColor};
  font-family: inherit; font-size: 10px; font-weight: 700; padding: 2px 5px; outline: none; cursor: pointer;
`;

export default function GlobalStrip() {
  const { t } = useTranslation();
  const { G, updateG } = useApp();
  const u = t('global.units', { returnObjects: true });

  return (
    <Strip>
      <Title>{t('global.title')}</Title>

      <Field>
        <Label>{t('global.inflation')}</Label>
        <InfoButton tooltipKey="inflation" />
        <NumInput type="number" min="0" max="10" step="0.1" value={G.inflation} onChange={e => updateG({ inflation: +e.target.value })} />
        <Unit>{u.perYear}</Unit>
      </Field>
      <Div />

      <Field>
        <Label>{t('global.regime')}</Label>
        <InfoButton tooltipKey="regime" />
        <Select value={G.regime} onChange={e => updateG({ regime: e.target.value })}>
          {['lmnp', 'microbic', 'nu'].map(r => (
            <option key={r} value={r}>{t(`global.regimes.${r}`)}</option>
          ))}
        </Select>
      </Field>
      <Div />

      <Field>
        <Label>{t('global.horizon')}</Label>
        <NumInput type="number" min="5" max="30" step="1" value={G.horizon} onChange={e => updateG({ horizon: +e.target.value || 20 })} />
        <Unit>{u.years}</Unit>
      </Field>
      <Div />

      <Field>
        <Label>{t('global.tauxActu')}</Label>
        <InfoButton tooltipKey="tauxActu" />
        <NumInput type="number" min="0" max="15" step="0.5" value={G.tauxActu} onChange={e => updateG({ tauxActu: +e.target.value })} />
        <Unit>{u.percent}</Unit>
      </Field>
      <Div />

      <Field>
        <Label>{t('global.rendAlt')}</Label>
        <InfoButton tooltipKey="rendAlt" />
        <NumInput type="number" min="0" max="20" step="0.5" value={G.rendAlt} onChange={e => updateG({ rendAlt: +e.target.value })} />
        <Unit>{u.percent}</Unit>
      </Field>
      <Div />

      <Field>
        <Label>{t('global.loyerPerso')}</Label>
        <InfoButton tooltipKey="loyerPerso" />
        <NumInput type="number" min="0" max="5000" step="50" value={G.loyerPerso} onChange={e => updateG({ loyerPerso: +e.target.value })} />
        <Unit>{u.perMonth}</Unit>
      </Field>

      <Field>
        <Label>{t('global.revalLoyerPerso')}</Label>
        <InfoButton tooltipKey="revalLoyerPerso" />
        <NumInput type="number" min="0" max="5" step="0.1" value={G.revalLoyerPerso} onChange={e => updateG({ revalLoyerPerso: +e.target.value })} />
        <Unit>{u.perYear}</Unit>
      </Field>
      <Div />

      <Field>
        <Label>{t('global.budgetMensuel')}</Label>
        <InfoButton tooltipKey="budgetMensuel" />
        <NumInput $w="62px" type="number" min="500" max="20000" step="100" value={G.budgetMensuel} onChange={e => updateG({ budgetMensuel: +e.target.value })} />
        <Unit>{u.perMonth}</Unit>
      </Field>

      <Field style={{ gap: 6 }}>
        <Label>{t('global.investirSurplus')}</Label>
        <InfoButton tooltipKey="investirSurplus" />
        <Toggle checked={G.investirSurplus} onChange={v => updateG({ investirSurplus: v })} />
      </Field>

      <Field>
        <Label>{t('global.apportETF')}</Label>
        <InfoButton tooltipKey="apportETF" />
        <NumInput $w="68px" type="number" min="0" max="500000" step="1000" value={G.apportETF} onChange={e => updateG({ apportETF: +e.target.value })} />
        <Unit>{u.euros}</Unit>
      </Field>
    </Strip>
  );
}
