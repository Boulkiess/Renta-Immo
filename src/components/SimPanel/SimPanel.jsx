import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, getGroups } from '../../state/definitions.js';
import Toggle from '../common/Toggle.jsx';
import FieldGroup from './FieldGroup.jsx';

const Panel = styled.div`
  display: flex; flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.border};
  overflow: hidden; min-width: 0; flex: 1;
`;

const Header = styled.div`
  background: ${({ theme }) => theme.surface};
  border-bottom: 2px solid ${({ $col }) => $col};
  padding: 8px; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;
`;

const TopRow = styled.div`display: flex; align-items: center; gap: 6px;`;

const Dot = styled.span`
  width: 10px; height: 10px; border-radius: 50%;
  background: ${({ $col }) => $col}; flex-shrink: 0;
`;

const LabelInput = styled.input`
  flex: 1; min-width: 0; background: transparent; border: none; border-bottom: 1px solid transparent; outline: none;
  color: ${({ theme }) => theme.text}; font-family: inherit; font-size: 11px; font-weight: 700;
  &:focus { border-bottom-color: ${({ theme }) => theme.a}; }
`;

const ModeBtn = styled.button`
  background: ${({ $active, theme }) => $active ? theme.a + '22' : 'transparent'};
  border: 1px solid ${({ $active, theme }) => $active ? theme.a : theme.border};
  border-radius: 5px; color: ${({ $active, theme }) => $active ? theme.a : theme.muted};
  font-family: inherit; font-size: 10px; font-weight: 700; padding: 2px 8px; cursor: pointer;
  &:hover { border-color: ${({ theme }) => theme.a}; }
`;

const KpiRow = styled.div`display: flex; gap: 6px; flex-wrap: wrap;`;

const KpiChip = styled.div`
  background: ${({ theme }) => theme.s2}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px; padding: 2px 7px; font-size: 10px; display: flex; align-items: center; gap: 4px;
`;
const KpiLabel = styled.span`color: ${({ theme }) => theme.muted};`;
const KpiVal = styled.span`color: ${({ $col }) => $col}; font-weight: 700;`;

const ScrollBody = styled.div`overflow-y: auto; flex: 1;`;

const Disabled = styled.div`
  padding: 24px; text-align: center; color: ${({ theme }) => theme.muted}; font-size: 11px;
`;

const fmtE = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v || 0);
const fmtP = v => (!isFinite(v) || isNaN(v)) ? '—' : v.toFixed(2) + '%';

export default function SimPanel({ simKey }) {
  const { t } = useTranslation();
  const { sims, updateSim, updateSimBulk, openGrp, toggleOpenGrp, RES } = useApp();
  const p = sims[simKey];
  const r = RES[simKey];
  const col = COL[simKey];

  return (
    <Panel>
      <Header $col={col}>
        <TopRow>
          <Dot $col={col} />
          <LabelInput
            value={p.label}
            onChange={e => updateSim(simKey, 'label', e.target.value)}
          />
          <Toggle
            checked={p.enabled}
            onChange={v => updateSim(simKey, 'enabled', v)}
            title={t('sim.enable')}
          />
        </TopRow>

        <TopRow>
          <ModeBtn $active={p.mode === 'loc'} onClick={() => updateSimBulk(simKey, { mode: 'loc' })}>
            {t('sim.loc')}
          </ModeBtn>
          <ModeBtn $active={p.mode === 'rp'} onClick={() => updateSimBulk(simKey, { mode: 'rp' })}>
            {t('sim.rp')}
          </ModeBtn>
        </TopRow>

        {p.enabled && (
          <KpiRow>
            {p.mode === 'loc' && (
              <>
                <KpiChip>
                  <KpiLabel>{t('kpi.rendBrut')}</KpiLabel>
                  <KpiVal $col={col}>{fmtP(r.rendBrut)}</KpiVal>
                </KpiChip>
                <KpiChip>
                  <KpiLabel>{t('kpi.cfMensuel')}</KpiLabel>
                  <KpiVal $col={r.cfM >= 0 ? col : '#f87171'}>{fmtE(r.cfM)}</KpiVal>
                </KpiChip>
              </>
            )}
            {p.mode === 'rp' && (
              <KpiChip>
                <KpiLabel>{t('kpi.effortMois')}</KpiLabel>
                <KpiVal $col={col}>{fmtE(Math.abs(r.cfM))}</KpiVal>
              </KpiChip>
            )}
            <KpiChip>
              <KpiLabel>{t('kpi.mensualite')}</KpiLabel>
              <KpiVal $col={col}>{fmtE(r.mens + r.assM)}</KpiVal>
            </KpiChip>
          </KpiRow>
        )}
      </Header>

      <ScrollBody>
        {!p.enabled ? (
          <Disabled>{t('sim.disabled')}</Disabled>
        ) : (
          getGroups(p.mode).map(grp => (
            <FieldGroup
              key={grp.t}
              simKey={simKey}
              group={grp}
              open={openGrp[simKey] === grp.t}
              onToggle={() => toggleOpenGrp(simKey, grp.t)}
            />
          ))
        )}
      </ScrollBody>
    </Panel>
  );
}
