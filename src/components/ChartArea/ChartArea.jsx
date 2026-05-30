import styled from 'styled-components';
import { useApp } from '../../state/AppContext.jsx';
import { COL, KEYS } from '../../state/definitions.js';
import Legend from '../Legend/Legend.jsx';
import ChartsTab from './ChartsTab.jsx';
import KpisTab from './KpisTab.jsx';
import ReventeTab from './ReventeTab.jsx';
import AmortTab from './AmortTab.jsx';

const Area = styled.div`
  display: flex; flex-direction: column;
  flex: 1; min-width: 0; overflow: hidden;
  background: ${({ theme }) => theme.bg};
  @media (max-width: 960px) { flex: none; overflow: visible; }
`;

const TabBar = styled.div`
  display: flex; align-items: center;
  padding: 8px 12px; border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; flex-shrink: 0;
`;

const TabGroup = styled.div`
  display: inline-flex; gap: 3px;
  background: ${({ theme }) => theme.s2}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px; padding: 3px;
`;

const Tab = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; font-family: inherit;
  padding: 6px 13px; border-radius: 6px; border: none; cursor: pointer;
  color: ${({ $active, theme }) => $active ? '#fff' : theme.muted};
  background: ${({ $active, theme }) => $active ? theme.a : 'transparent'};
  transition: background .15s, color .15s;
  white-space: nowrap;
  &:hover { color: ${({ $active, theme }) => $active ? '#fff' : theme.text}; }
`;

const TABS = [
  { id: 'charts',  label: 'Graphiques',      Icon: ChartIcon },
  { id: 'kpis',    label: 'Comparaison',     Icon: ScaleIcon },
  { id: 'revente', label: 'Revente',         Icon: TagIcon },
  { id: 'amort',   label: 'Amortissement',   Icon: BarsIcon },
];

function ChartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v16h16" /><path d="M7 14l3-4 3 3 4-6" />
    </svg>
  );
}
function ScaleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v16M5 8h14M5 8l-2 5h4zM19 8l-2 5h4z" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8z" /><circle cx="8.5" cy="8.5" r="1.3" />
    </svg>
  );
}
function BarsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20V10M12 20V4M19 20v-7" />
    </svg>
  );
}

const Content = styled.div`
  flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;
`;

export default function ChartArea() {
  const { curTab, setCurTab } = useApp();

  return (
    <Area>
      <TabBar>
        <TabGroup>
          {TABS.map(({ id, label, Icon }) => (
            <Tab key={id} $active={curTab === id} onClick={() => setCurTab(id)}>
              <Icon />{label}
            </Tab>
          ))}
        </TabGroup>
      </TabBar>
      <Legend />
      <Content>
        {curTab === 'charts'  && <ChartsTab />}
        {curTab === 'kpis'    && <KpisTab />}
        {curTab === 'revente' && <ReventeTab />}
        {curTab === 'amort'   && <AmortTab />}
      </Content>
    </Area>
  );
}
