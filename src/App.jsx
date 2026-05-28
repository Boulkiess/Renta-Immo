import { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './theme/GlobalStyles.js';
import { darkTheme, lightTheme } from './theme/themes.js';
import { AppProvider } from './state/AppContext.jsx';
import { PopoverHost } from './components/common/Popover.jsx';
import NavBar from './components/NavBar/NavBar.jsx';
import GlobalStrip from './components/GlobalStrip/GlobalStrip.jsx';
import SimPanel from './components/SimPanel/SimPanel.jsx';
import ChartArea from './components/ChartArea/ChartArea.jsx';

const AppWrap = styled.div`
  display: flex; flex-direction: column;
  height: 100vh; overflow: hidden;
`;

const Main = styled.div`
  display: flex; flex: 1; min-height: 0; overflow: hidden;
`;

const SimsPane = styled.div`
  display: flex;
  width: 690px; flex-shrink: 0;
  border-right: 1px solid ${({ theme }) => theme.border};
  overflow: hidden;
`;

export default function App() {
  const [theme, setTheme] = useState(darkTheme);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AppProvider>
        <AppWrap>
          <NavBar
            currentThemeName={theme.name}
            onToggleTheme={() => setTheme(t => t.name === 'dark' ? lightTheme : darkTheme)}
          />
          <GlobalStrip />
          <Main>
            <SimsPane>
              <SimPanel simKey="A" />
              <SimPanel simKey="B" />
              <SimPanel simKey="C" />
            </SimsPane>
            <ChartArea />
          </Main>
        </AppWrap>
        <PopoverHost />
      </AppProvider>
    </ThemeProvider>
  );
}
