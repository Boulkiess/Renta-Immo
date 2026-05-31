import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, getGroups } from '../../state/definitions.js';
import { Menu, MenuItem } from '../common/Menu.jsx';
import FieldGroup from './FieldGroup.jsx';
import HeaderKpis from './HeaderKpis.jsx';
import { CollapseIcon, KebabIcon } from './icons.jsx';
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
  const {
    G,
    sims,
    updateSim,
    updateSimBulk,
    copySim,
    pasteSim,
    clipboard,
    openGrp,
    toggleOpenGrp,
    RES,
  } = useApp();
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
          <Menu trigger={<KebabIcon />} title={t('sim.menu')}>
            <MenuItem onClick={() => updateSim(simKey, 'enabled', false)}>
              {t('sim.disable')}
            </MenuItem>
            <MenuItem onClick={() => copySim(simKey)}>{t('sim.copy')}</MenuItem>
            <MenuItem onClick={() => pasteSim(simKey)} disabled={!clipboard}>
              {t('sim.paste')}
            </MenuItem>
          </Menu>
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
