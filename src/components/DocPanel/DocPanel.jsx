import { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../state/AppContext.jsx';
import { KEYS, COL } from '../../state/definitions.js';
import { CONCEPTS, GROUPS } from './concepts.js';
import ConceptCard from './ConceptCard.jsx';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 700;
  background: rgba(2, 8, 23, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: stretch;
`;
const Panel = styled.div`
  background: ${({ theme }) => theme.bg};
  width: min(1100px, 100%);
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
`;
const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  flex-shrink: 0;
`;
const HTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: ${({ theme }) => theme.text};
`;
const HActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
const Btn = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 7px;
  color: ${({ theme }) => theme.muted};
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.subtle};
  }
`;
const CloseBtn = styled(Btn)`
  width: 32px;
  padding: 6px 0;
  font-size: 16px;
  line-height: 1;
`;
const SeedLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.muted};
  @media (max-width: 560px) {
    display: none;
  }
`;
const SeedChip = styled.button`
  border: 1px solid ${({ $active, $color, theme }) => ($active ? $color : theme.border)};
  background: ${({ $active, $color }) => ($active ? `${$color}22` : 'transparent')};
  color: ${({ $active, $color, theme }) => ($active ? $color : theme.muted)};
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  cursor: pointer;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover {
    color: ${({ $color }) => $color};
    border-color: ${({ $color }) => $color};
  }
`;
const Layout = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  @media (max-width: 760px) {
    flex-direction: column;
  }
`;
const Toc = styled.nav`
  flex-shrink: 0;
  width: 180px;
  border-right: 1px solid ${({ theme }) => theme.border};
  padding: 14px 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  @media (max-width: 760px) {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }
`;
const TocItem = styled.button`
  background: transparent;
  border: none;
  text-align: left;
  color: ${({ theme }) => theme.muted};
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text};
  }
`;
const Content = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 22px;
`;
const GroupHead = styled.h3`
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.subtle};
`;
const GroupCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export default function DocPanel({ onClose }) {
  const { t } = useTranslation();
  const { sims, resolvedSims, G, RES } = useApp();
  // Which simulation the cards seed from. Bumping seedNonce re-mounts the cards,
  // re-running their seed() from the chosen sim.
  const [seedKey, setSeedKey] = useState('A');
  const [seedNonce, setSeedNonce] = useState(0);
  const sectionRefs = useRef({});

  const reseedFrom = key => {
    setSeedKey(key);
    setSeedNonce(n => n + 1);
  };

  // ctx seeds each card from the selected simulation's live scenario.
  const ctx = { sim: resolvedSims[seedKey], G, res: RES[seedKey] };

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const scrollTo = group => {
    sectionRefs.current[group]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const groupsWithConcepts = GROUPS.map(g => ({
    group: g,
    concepts: CONCEPTS.filter(c => c.group === g),
  })).filter(x => x.concepts.length > 0);

  return (
    <Backdrop onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <Panel role="dialog" aria-modal="true" aria-label={t('doc.title')}>
        <Header>
          <HTitle>{t('doc.title')}</HTitle>
          <HActions>
            <SeedLabel>{t('doc.resetToSim')}</SeedLabel>
            {KEYS.map(k => (
              <SeedChip
                key={k}
                $active={seedKey === k}
                $color={COL[k]}
                title={sims[k].label}
                onClick={() => reseedFrom(k)}
              >
                {sims[k].label}
              </SeedChip>
            ))}
            <CloseBtn onClick={onClose} aria-label={t('doc.close')}>
              ✕
            </CloseBtn>
          </HActions>
        </Header>
        <Layout>
          <Toc>
            {groupsWithConcepts.map(({ group }) => (
              <TocItem key={group} onClick={() => scrollTo(group)}>
                {t(`doc.groups.${group}`)}
              </TocItem>
            ))}
          </Toc>
          <Content>
            {groupsWithConcepts.map(({ group, concepts }) => (
              <section
                key={group}
                ref={el => {
                  sectionRefs.current[group] = el;
                }}
              >
                <GroupHead>{t(`doc.groups.${group}`)}</GroupHead>
                <GroupCards style={{ marginTop: 10 }}>
                  {concepts.map(c => (
                    <ConceptCard key={`${c.id}-${seedNonce}`} concept={c} ctx={ctx} />
                  ))}
                </GroupCards>
              </section>
            ))}
          </Content>
        </Layout>
      </Panel>
    </Backdrop>
  );
}
