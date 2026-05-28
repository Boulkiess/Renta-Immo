import styled from 'styled-components';
import { useApp } from '../../state/AppContext.jsx';
import Legend from '../Legend/Legend.jsx';
import ChartsTab from './ChartsTab.jsx';
import KpisTab from './KpisTab.jsx';
import ReventeTab from './ReventeTab.jsx';
import AmortTab from './AmortTab.jsx';

const Area = styled.div`
  display: flex; flex-direction: column;
  flex: 1; min-width: 0; overflow: hidden;
`;

export default function ChartArea() {
  const { curTab } = useApp();

  return (
    <Area>
      <Legend />
      {curTab === 'charts'  && <ChartsTab />}
      {curTab === 'kpis'    && <KpisTab />}
      {curTab === 'revente' && <ReventeTab />}
      {curTab === 'amort'   && <AmortTab />}
    </Area>
  );
}
