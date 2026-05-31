import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, getGroups } from '../../state/definitions.js';
import Toggle from '../common/Toggle.jsx';
import FieldGroup from './FieldGroup.jsx';
import HeaderKpis from './HeaderKpis.jsx';
import { CollapseIcon } from './icons.jsx';
import {
  Panel,
  Header,
  TopRow,
  Dot,
  LabelInput,
  IconBtn,
  ModeRow,
  ModeBtn,
  ScrollBody,
} from './SimPanel.styles.js';

/** Full expanded simulation panel: header (label, mode, KPI chips) + field groups. */
export default function FullPanel({ simKey }) {
  const { t } = useTranslation();
  const { G, sims, updateSim, updateSimBulk, openGrp, toggleOpenGrp, RES } = useApp();
  const p = sims[simKey];
  const r = RES[simKey];
  const col = COL[simKey];

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
          <HeaderKpis
            r={r}
            col={col}
            loyerPerso={G.loyerPerso}
            budgetMensuel={G.budgetMensuel}
            horizon={G.horizon}
          />
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
