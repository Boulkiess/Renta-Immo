import { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import NavBar from '../NavBar/NavBar.jsx';
import ChartArea from '../ChartArea/ChartArea.jsx';
import GlobalStrip from '../GlobalStrip/GlobalStrip.jsx';
import FullPanel from '../SimPanel/FullPanel.jsx';
import { KEYS } from '../../state/definitions.js';
import BottomNav from './BottomNav.jsx';
import Sheet from './Sheet.jsx';

/**
 * Mobile navigation shell (rendered below the `tablet` breakpoint — cf. App.jsx).
 * Full-width chart area is always mounted; a bottom tab bar switches between the
 * chart and per-sim / global-settings editors, which open as bottom sheets.
 * Reuses the same ChartArea, FullPanel, and GlobalStrip as the desktop layout.
 */
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
`;

const Main = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
`;

export default function MobileShell({ currentThemeName, onToggleTheme, onOpenDoc }) {
  const { t } = useTranslation();
  const { sims } = useApp();
  // 'chart' = no sheet; 'A'|'B'|'C' = sim editor sheet; 'settings' = globals sheet.
  const [view, setView] = useState('chart');

  const close = () => setView('chart');
  const isSim = KEYS.includes(view);

  return (
    <Wrap>
      <NavBar
        compact
        currentThemeName={currentThemeName}
        onToggleTheme={onToggleTheme}
        onOpenDoc={onOpenDoc}
      />
      <Main>
        <ChartArea />
      </Main>
      <BottomNav active={view} onSelect={setView} />

      {isSim && (
        <Sheet title={sims[view].label} onClose={close}>
          <FullPanel simKey={view} />
        </Sheet>
      )}
      {view === 'settings' && (
        <Sheet title={t('mobile.settingsTitle')} onClose={close}>
          <GlobalStrip />
        </Sheet>
      )}
    </Wrap>
  );
}
