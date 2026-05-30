import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';

const Wrap = styled.div`
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  padding: 5px 12px; border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; font-size: 10px; flex-shrink: 0;
`;

const Item = styled.button`
  display: flex; align-items: center; gap: 5px;
  background: transparent; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px; padding: 3px 8px; cursor: pointer;
  color: ${({ $dim, theme }) => $dim ? theme.muted : theme.text};
  opacity: ${({ $dim }) => $dim ? 0.4 : 1};
  font-family: inherit; font-size: 10px; font-weight: 600;
  transition: opacity .15s, border-color .15s;
  &:hover { opacity: 1; border-color: ${({ $col }) => $col}; color: ${({ $col }) => $col}; }
`;

const Dot = styled.span`
  width: 8px; height: 8px; border-radius: 50%; background: ${({ $col }) => $col};
`;

const EtfRef = styled.div`
  display: flex; align-items: center; gap: 6px;
  padding: 3px 8px; color: ${({ theme }) => theme.muted}; font-size: 10px;
`;

const DashLine = styled.span`
  display: inline-block; width: 18px; height: 2px;
  background: repeating-linear-gradient(90deg, #94a3b8 0 5px, transparent 5px 9px);
`;

export default function Legend() {
  const { t } = useTranslation();
  const { sims, updateSim, G } = useApp();

  return (
    <Wrap>
      {KEYS.map(k => (
        <Item
          key={k}
          $col={COL[k]}
          $dim={!sims[k].enabled}
          onClick={() => updateSim(k, 'enabled', !sims[k].enabled)}
          title={t(sims[k].enabled ? 'sim.hide' : 'sim.show')}
        >
          <Dot $col={COL[k]} />
          {sims[k].label}
        </Item>
      ))}
      <EtfRef>
        <DashLine />
        {t('legend.etfPur', { apport: Math.round(G.apportETF / 1000) })}
      </EtfRef>
    </Wrap>
  );
}
