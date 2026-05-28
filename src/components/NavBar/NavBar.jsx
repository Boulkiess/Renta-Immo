import { useState, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { buildExportData, doExport, handleImport } from '../../engine/io.js';

const Nav = styled.nav`
  position: sticky; top: 0; z-index: 200;
  background: ${({ theme }) => theme.navBg};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  height: 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
`;
const Brand = styled.div`
  display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14px; white-space: nowrap;
  color: ${({ theme }) => theme.navText};
`;
const Badge = styled.span`
  font-size: 9px; color: ${({ theme }) => theme.navText}99;
  background: rgba(255,255,255,.1); padding: 2px 7px; border-radius: 20px; font-weight: 600;
`;
const Tabs = styled.div`display: flex; gap: 3px; flex-wrap: wrap;`;
const Tab = styled.button`
  padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer;
  font-size: 11px; font-weight: 600; font-family: inherit; transition: all .15s; white-space: nowrap;
  background: ${({ $active }) => $active ? '#1e40af' : 'transparent'};
  color: ${({ $active, theme }) => $active ? '#93c5fd' : theme.navText + '99'};
  &:hover { background: ${({ theme }) => theme.navSubtle}; color: ${({ theme }) => theme.navText}; }
`;
const Actions = styled.div`display: flex; align-items: center; gap: 6px;`;
const ActionBtn = styled.button`
  background: ${({ theme }) => theme.navSubtle}; border: 1px solid ${({ theme }) => theme.navSubtle2};
  border-radius: 6px; color: ${({ theme }) => theme.navText}bb;
  font-family: inherit; font-size: 11px; font-weight: 700;
  padding: 4px 10px; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap;
  &:hover { color: ${({ theme }) => theme.navText}; background: ${({ theme }) => theme.navSubtle2}; }
`;
const ExpWrap = styled.div`position: relative; flex-shrink: 0;`;
const ExpMenu = styled.div`
  position: absolute; right: 0; top: calc(100% + 4px);
  background: ${({ theme }) => theme.popBg}; border: 1px solid ${({ theme }) => theme.subtle};
  border-radius: 8px; padding: 4px; z-index: 300; box-shadow: 0 8px 24px rgba(0,0,0,.8);
`;
const ExpOpt = styled.button`
  display: block; width: 100%; background: transparent; border: none;
  color: ${({ theme }) => theme.text}; font-family: inherit; font-size: 11px; font-weight: 600;
  padding: 6px 10px; border-radius: 5px; cursor: pointer; text-align: left; white-space: nowrap;
  transition: background .1s;
  &:hover { background: ${({ theme }) => theme.border}; }
`;
const LangBtn = styled.button`
  background: ${({ $active, theme }) => $active ? theme.a + '22' : 'transparent'};
  border: 1px solid ${({ $active, theme }) => $active ? theme.a : theme.border};
  border-radius: 5px; color: ${({ $active, theme }) => $active ? theme.a : theme.muted};
  font-family: inherit; font-size: 10px; font-weight: 700; padding: 3px 7px; cursor: pointer;
`;

const TAB_IDS = ['charts', 'kpis', 'revente', 'amort'];

export default function NavBar({ currentThemeName, onToggleTheme }) {
  const { t, i18n } = useTranslation();
  const { curTab, setCurTab, G, sims, RES, etfPurGlobal, updateG, updateSimBulk } = useApp();
  const [expOpen, setExpOpen] = useState(false);
  const fileRef = useRef(null);

  function onExport(fmt) {
    setExpOpen(false);
    doExport(fmt, buildExportData(G, sims, RES, etfPurGlobal));
  }

  function onImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    handleImport(file, { updateG, updateSimBulk });
    e.target.value = '';
  }

  return (
    <Nav>
      <Brand>
        <span>🏠</span><span>{t('nav.brand')}</span>
        <Badge>{t('nav.badge')}</Badge>
      </Brand>

      <Tabs>
        {TAB_IDS.map(id => (
          <Tab key={id} $active={curTab === id} onClick={() => setCurTab(id)}>
            {t(`tabs.${id}`)}
          </Tab>
        ))}
      </Tabs>

      <Actions>
        {['fr', 'en'].map(lng => (
          <LangBtn key={lng} $active={i18n.language === lng} onClick={() => i18n.changeLanguage(lng)}>
            {t(`lang.${lng}`)}
          </LangBtn>
        ))}

        <ActionBtn onClick={onToggleTheme}>
          {currentThemeName === 'dark' ? '☀️' : '🌙'}
        </ActionBtn>

        <ExpWrap>
          <ActionBtn onClick={() => setExpOpen(v => !v)}>
            ↓ {t('nav.export')}
            <span style={{ fontSize: 9, display: 'inline-block', transition: 'transform .15s', transform: expOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
          </ActionBtn>
          {expOpen && (
            <ExpMenu>
              {['csv', 'json', 'yaml'].map(fmt => (
                <ExpOpt key={fmt} onClick={() => onExport(fmt)}>
                  {t(`nav.export${fmt.charAt(0).toUpperCase() + fmt.slice(1)}`)}
                </ExpOpt>
              ))}
            </ExpMenu>
          )}
        </ExpWrap>

        <ActionBtn onClick={() => fileRef.current?.click()}>↑ {t('nav.import')}</ActionBtn>
        <input ref={fileRef} type="file" accept=".json,.yaml,.yml,.csv" style={{ display: 'none' }} onChange={onImportFile} />
      </Actions>
    </Nav>
  );
}
