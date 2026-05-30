import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, getGroups } from '../../state/definitions.js';
import Toggle from '../common/Toggle.jsx';
import FieldGroup from './FieldGroup.jsx';

const PANEL_W = 220;
const STRIP_W = 46;

/* ── Collapsed strip (sim active but panel minimised) ── */
const CollapsedStrip = styled.button`
  flex: 0 0 ${STRIP_W}px;
  width: ${STRIP_W}px;
  background: ${({ theme }) => theme.surface};
  border: none;
  border-top: 3px solid ${({ $col }) => $col};
  border-right: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
  font-family: inherit;
  overflow: hidden;
  transition: background 0.15s;
  &:hover {
    background: ${({ theme }) => theme.s2};
  }
`;
const StripeChevron = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: ${({ theme }) => theme.s2};
  display: grid;
  place-items: center;
  color: ${({ $col }) => $col};
  flex-shrink: 0;
`;
const StripLabel = styled.span`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  white-space: nowrap;
  letter-spacing: -0.01em;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
`;
const StripKpi = styled.span`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: ${({ theme }) => theme.mono};
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => theme.inputColor};
  margin-bottom: 6px;
`;
const StripDot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ $col }) => $col};
`;

/* ── Disabled strip ── */
const DisabledStrip = styled.div`
  flex: 0 0 ${STRIP_W}px;
  width: ${STRIP_W}px;
  background: repeating-linear-gradient(
    135deg,
    ${({ theme }) => theme.s2},
    ${({ theme }) => theme.s2} 6px,
    ${({ theme }) => theme.bg} 6px,
    ${({ theme }) => theme.bg} 12px
  );
  border-top: 3px solid ${({ $col }) => $col};
  border-right: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  opacity: 0.85;
`;
const ReactivateBtn = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface};
  color: ${({ $col }) => $col};
  cursor: pointer;
  flex-shrink: 0;
`;
const DisabledLabel = styled.span`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.muted};
  white-space: nowrap;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
`;
const DisabledTag = styled.span`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 8px;
  color: ${({ theme }) => theme.muted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

/* ── Full panel ── */
const Panel = styled.div`
  flex: 0 0 ${PANEL_W}px;
  width: ${PANEL_W}px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.border};
  overflow: hidden;
`;

const Header = styled.div`
  background: ${({ theme }) => theme.surface};
  border-top: 3px solid ${({ $col }) => $col};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 9px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex-shrink: 0;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const Dot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ $col }) => $col};
  flex-shrink: 0;
`;

const LabelInput = styled.input`
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  outline: none;
  color: ${({ theme }) => theme.text};
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  &:focus {
    border-bottom-color: ${({ theme }) => theme.a};
  }
`;

const IconBtn = styled.button`
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.muted};
  display: grid;
  place-items: center;
  border-radius: 5px;
  flex-shrink: 0;
  &:hover {
    background: ${({ theme }) => theme.s2};
    color: ${({ theme }) => theme.text};
  }
`;

const ModeRow = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  padding: 2px;
  background: ${({ theme }) => theme.s2};
  gap: 2px;
`;

const ModeBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active, $col }) => ($active ? $col : 'transparent')};
  border: none;
  border-radius: 4px;
  color: ${({ $active, theme }) => ($active ? '#fff' : theme.muted)};
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
`;

const KpiRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
`;

const KpiChip = styled.div`
  background: ${({ theme }) => theme.s2};
  border: 1px solid ${({ $danger, theme }) => ($danger ? '#f87171' : theme.border)};
  border-radius: 5px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;
const KpiLabel = styled.span`
  font-size: 8.5px;
  color: ${({ theme }) => theme.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const KpiVal = styled.span`
  font-size: 11px;
  color: ${({ $col }) => $col};
  font-weight: 700;
  font-family: ${({ theme }) => theme.mono};
`;

const ScrollBody = styled.div`
  overflow-y: auto;
  flex: 1;
`;

const fmtE = v =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(v || 0);

const CollapseIcon = ({ expanded }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {expanded ? (
      <>
        <path d="M15 5l-7 7 7 7" />
        <path d="M19 5v14" />
      </>
    ) : (
      <>
        <path d="M9 5l7 7-7 7" />
        <path d="M5 5v14" />
      </>
    )}
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export default function SimPanel({ simKey }) {
  const { t } = useTranslation();
  const { G, sims, updateSim, updateSimBulk, openGrp, toggleOpenGrp, RES } = useApp();
  const p = sims[simKey];
  const r = RES[simKey];
  const col = COL[simKey];

  const patTotal = r.flux[G.horizon - 1]?.patTotal;

  /* ── Disabled (excluded from charts) ── */
  if (!p.enabled) {
    return (
      <DisabledStrip $col={col}>
        <ReactivateBtn
          $col={col}
          onClick={() => updateSim(simKey, 'enabled', true)}
          title={t('sim.show')}
        >
          <ChevronIcon />
        </ReactivateBtn>
        <DisabledLabel>{p.label}</DisabledLabel>
        <StripDot $col={col} style={{ opacity: 0.3, marginBottom: 6 }} />
        <DisabledTag>off</DisabledTag>
      </DisabledStrip>
    );
  }

  /* ── Collapsed (active but minimised) ── */
  if (p.collapsed) {
    return (
      <CollapsedStrip
        $col={col}
        onClick={() => updateSim(simKey, 'collapsed', false)}
        title="Déplier le panneau"
      >
        <StripeChevron $col={col}>
          <ChevronIcon />
        </StripeChevron>
        <StripLabel>{p.label}</StripLabel>
        <StripKpi>{fmtE(patTotal)}</StripKpi>
        <StripDot $col={col} />
      </CollapsedStrip>
    );
  }

  /* ── Full panel ── */
  return (
    <Panel>
      <Header $col={col}>
        <TopRow>
          <Dot $col={col} />
          <LabelInput value={p.label} onChange={e => updateSim(simKey, 'label', e.target.value)} />
          <IconBtn
            onClick={() => updateSim(simKey, 'collapsed', true)}
            title="Réduire — garde la simulation dans les graphiques"
          >
            <CollapseIcon expanded />
          </IconBtn>
          <Toggle
            checked={p.enabled}
            onChange={v => updateSim(simKey, 'enabled', v)}
            title={t('sim.enable')}
          />
        </TopRow>

        <ModeRow>
          <ModeBtn
            $active={p.mode === 'loc'}
            $col={col}
            onClick={() => updateSimBulk(simKey, { mode: 'loc' })}
          >
            {t('sim.loc')}
          </ModeBtn>
          <ModeBtn
            $active={p.mode === 'rp'}
            $col={col}
            onClick={() => updateSimBulk(simKey, { mode: 'rp' })}
          >
            {t('sim.rp')}
          </ModeBtn>
        </ModeRow>

        {p.enabled && (
          <KpiRow>
            <KpiChip>
              <KpiLabel>{t('kpi.mensualite')}</KpiLabel>
              <KpiVal $col={col}>{fmtE(r.mens + r.assM)}</KpiVal>
            </KpiChip>
            <KpiChip $danger={Math.round(-(r.flux[0]?.cfN ?? 0) / 12) > G.budgetMensuel}>
              <KpiLabel>{t('kpi.cfMensuel')}</KpiLabel>
              <KpiVal $col={(r.flux[0]?.cfN ?? 0) < 0 ? '#f87171' : col}>
                {fmtE((r.flux[0]?.cfN ?? 0) / 12)}
              </KpiVal>
            </KpiChip>
            <KpiChip>
              <KpiLabel>{t('kpi.effortMois')}</KpiLabel>
              <KpiVal $col={-(r.flux[0]?.cfN ?? 0) / 12 - G.loyerPerso > 0 ? '#f87171' : col}>
                {fmtE(-(r.flux[0]?.cfN ?? 0) / 12 - G.loyerPerso)}
              </KpiVal>
            </KpiChip>
            <KpiChip>
              <KpiLabel>{t('kpi.patrimTotal', { horizon: G.horizon })}</KpiLabel>
              <KpiVal $col={col}>{fmtE(patTotal)}</KpiVal>
            </KpiChip>
          </KpiRow>
        )}
      </Header>

      <ScrollBody>
        {getGroups(p.mode).map(grp => (
          <FieldGroup
            key={grp.t}
            simKey={simKey}
            group={grp}
            open={openGrp[simKey] === grp.t}
            onToggle={() => toggleOpenGrp(simKey, grp.t)}
          />
        ))}
      </ScrollBody>
    </Panel>
  );
}
