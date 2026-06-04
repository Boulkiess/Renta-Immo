import { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './theme/GlobalStyles.js';
import { darkTheme, lightTheme } from './theme/themes.js';
import { AppProvider } from './state/AppContext.jsx';
import { PopoverHost } from './components/common/Popover.jsx';
import { useIsMobile } from './components/common/useMediaQuery.js';
import NavBar from './components/NavBar/NavBar.jsx';
import GlobalStrip from './components/GlobalStrip/GlobalStrip.jsx';
import SimPanel from './components/SimPanel/SimPanel.jsx';
import ChartArea from './components/ChartArea/ChartArea.jsx';
import DocPanel from './components/DocPanel/DocPanel.jsx';
import MobileShell from './components/MobileShell/MobileShell.jsx';

const AppWrap = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  @media (max-width: 960px) {
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }
`;

const Main = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  @media (max-width: 960px) {
    flex-direction: column;
    overflow: visible;
    flex: none;
  }
`;

const SimsPane = styled.div`
  display: flex;
  flex-shrink: 0;
  border-right: 1px solid ${({ theme }) => theme.border};
  overflow: hidden;
  @media (max-width: 960px) {
    width: 100%;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }
`;

export default function App() {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('immorenta_theme') === 'light' ? lightTheme : darkTheme
  );
  const [docOpen, setDocOpen] = useState(false);
  const isMobile = useIsMobile();

  function toggleTheme() {
    setTheme(t => {
      const next = t.name === 'dark' ? lightTheme : darkTheme;
      localStorage.setItem('immorenta_theme', next.name);
      return next;
    });
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AppProvider>
        {isMobile ? (
          <MobileShell
            currentThemeName={theme.name}
            onToggleTheme={toggleTheme}
            onOpenDoc={() => setDocOpen(true)}
          />
        ) : (
          <AppWrap>
            <NavBar
              currentThemeName={theme.name}
              onToggleTheme={toggleTheme}
              onOpenDoc={() => setDocOpen(true)}
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
        )}
        {docOpen && <DocPanel onClose={() => setDocOpen(false)} />}
        <PopoverHost />
      </AppProvider>
    </ThemeProvider>
  );
}
