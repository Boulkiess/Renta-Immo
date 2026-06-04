import { useState, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { buildExportData, doExport, handleImport } from '../../engine/io.js';

const NAV_BG = 'linear-gradient(180deg,#16294a,#0e1c36)';
const NAV_BORDER = 'rgba(255,255,255,.07)';

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 200;
  background: ${NAV_BG};
  border-bottom: 1px solid ${NAV_BORDER};
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  flex-shrink: 0;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 15px;
  color: #fff;
  white-space: nowrap;
  letter-spacing: -0.01em;
`;

const BrandIcon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: #3b6fd4;
  display: grid;
  place-items: center;
  flex-shrink: 0;
`;

const Badge = styled.span`
  font-size: 9px;
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.12);
  padding: 2px 7px;
  border-radius: 20px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-family: ${({ theme }) => theme.mono};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LangWrap = styled.div`
  display: inline-flex;
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
`;
const LangBtn = styled.button`
  font-size: 12px;
  font-weight: 700;
  padding: 5px 11px;
  cursor: pointer;
  font-family: inherit;
  border: none;
  color: ${({ $active }) => ($active ? '#0e1c36' : '#aebbd4')};
  background: ${({ $active }) => ($active ? '#fff' : 'transparent')};
`;

const ActionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${({ $primary }) => ($primary ? '#3b6fd4' : 'transparent')};
  border: 1px solid ${({ $primary }) => ($primary ? '#3b6fd4' : 'rgba(255,255,255,.18)')};
  border-radius: 7px;
  color: ${({ $primary }) => ($primary ? '#fff' : '#dce6f7')};
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    opacity: 0.85;
  }
`;

const ExpWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;
const MenuBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 250;
`;
const MenuDivider = styled.div`
  height: 1px;
  margin: 4px 6px;
  background: rgba(255, 255, 255, 0.1);
`;
const ExpMenu = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: #0a1628;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 4px;
  z-index: 300;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
`;
const ExpOpt = styled.button`
  display: block;
  width: 100%;
  background: transparent;
  border: none;
  color: #dce6f7;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 5px;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const ThemeBtn = styled.button`
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 7px;
  display: grid;
  place-items: center;
  background: transparent;
  cursor: pointer;
  color: #aebbd4;
  font-size: 14px;
  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const HouseIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 11l8-6 8 6" />
    <path d="M6 10v9h12v-9" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 4v11M8 11l4 4 4-4M5 20h14" />
  </svg>
);

const UploadIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20V9M8 13l4-4 4 4M5 4h14" />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export default function NavBar({ currentThemeName, onToggleTheme, onOpenDoc, compact = false }) {
  const { t, i18n } = useTranslation();
  const { G, sims, RES, etfScenarioGlobal, updateG, updateSimBulk } = useApp();
  const [expOpen, setExpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef(null);

  function onExport(fmt) {
    setExpOpen(false);
    setMenuOpen(false);
    doExport(fmt, buildExportData(G, sims, RES, etfScenarioGlobal));
  }

  function onImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    handleImport(file, { updateG, updateSimBulk });
    e.target.value = '';
  }

  function setLang(lng) {
    i18n.changeLanguage(lng);
    localStorage.setItem('immorenta_lang', lng);
  }

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept=".json,.yaml,.yml,.csv"
      style={{ display: 'none' }}
      onChange={onImportFile}
    />
  );

  if (compact) {
    return (
      <Nav>
        <Brand>
          <BrandIcon>
            <HouseIcon />
          </BrandIcon>
          <span>{t('nav.brand')}</span>
        </Brand>
        <Actions>
          <ExpWrap>
            <ThemeBtn
              onClick={() => setMenuOpen(v => !v)}
              title={t('nav.menu')}
              aria-label={t('nav.menu')}
            >
              <MenuIcon />
            </ThemeBtn>
            {menuOpen && (
              <>
                <MenuBackdrop onClick={() => setMenuOpen(false)} />
                <ExpMenu style={{ minWidth: 168, zIndex: 300 }}>
                  <ExpOpt
                    onClick={() => {
                      onToggleTheme();
                      setMenuOpen(false);
                    }}
                  >
                    {currentThemeName === 'dark'
                      ? `☀ ${t('nav.lightMode')}`
                      : `☾ ${t('nav.darkMode')}`}
                  </ExpOpt>
                  <ExpOpt
                    onClick={() => {
                      onOpenDoc();
                      setMenuOpen(false);
                    }}
                  >
                    ? {t('doc.open')}
                  </ExpOpt>
                  <MenuDivider />
                  {['fr', 'en'].map(lng => (
                    <ExpOpt
                      key={lng}
                      onClick={() => {
                        setLang(lng);
                        setMenuOpen(false);
                      }}
                    >
                      {i18n.language === lng ? '✓ ' : '  '}
                      {t(`lang.${lng}`)}
                    </ExpOpt>
                  ))}
                  <MenuDivider />
                  {['csv', 'json', 'yaml'].map(fmt => (
                    <ExpOpt key={fmt} onClick={() => onExport(fmt)}>
                      {t('nav.export')}{' '}
                      {t(`nav.export${fmt.charAt(0).toUpperCase() + fmt.slice(1)}`)}
                    </ExpOpt>
                  ))}
                  <MenuDivider />
                  <ExpOpt
                    onClick={() => {
                      setMenuOpen(false);
                      fileRef.current?.click();
                    }}
                  >
                    {t('nav.import')}
                  </ExpOpt>
                </ExpMenu>
              </>
            )}
          </ExpWrap>
        </Actions>
        {fileInput}
      </Nav>
    );
  }

  return (
    <Nav>
      <Brand>
        <BrandIcon>
          <HouseIcon />
        </BrandIcon>
        <span>{t('nav.brand')}</span>
        <Badge>{t('nav.badge')}</Badge>
      </Brand>

      <Actions>
        <LangWrap>
          {['fr', 'en'].map((lng, i) => (
            <LangBtn
              key={lng}
              $active={i18n.language === lng}
              onClick={() => {
                i18n.changeLanguage(lng);
                localStorage.setItem('immorenta_lang', lng);
              }}
            >
              {t(`lang.${lng}`)}
            </LangBtn>
          ))}
        </LangWrap>

        <ThemeBtn
          onClick={onToggleTheme}
          title={currentThemeName === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
        >
          {currentThemeName === 'dark' ? '☀' : '☾'}
        </ThemeBtn>

        <ThemeBtn onClick={onOpenDoc} title={t('doc.open')} aria-label={t('doc.open')}>
          ?
        </ThemeBtn>

        <ExpWrap>
          <ActionBtn onClick={() => setExpOpen(v => !v)}>
            <DownloadIcon /> {t('nav.export')} <ChevronIcon />
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

        <ActionBtn $primary onClick={() => fileRef.current?.click()}>
          <UploadIcon /> {t('nav.import')}
        </ActionBtn>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.yaml,.yml,.csv"
          style={{ display: 'none' }}
          onChange={onImportFile}
        />
      </Actions>
    </Nav>
  );
}
