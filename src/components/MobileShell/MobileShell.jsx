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
/* height:100dvh tracks the *visible* viewport (it shrinks/grows as the iOS Safari
   toolbars show/hide), keeping the bottom nav at the visible bottom. The body
   itself is locked (see GlobalStyles mobile rules) so it can never scroll and lift
   the whole shell off the bottom edge. Only the inner content / sheets scroll. */
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
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
