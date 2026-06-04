import { useEffect } from 'react';
import styled from 'styled-components';

/**
 * Bottom-sheet overlay for the mobile shell. Slides up from the bottom edge,
 * scrolls its body, and closes on Esc or backdrop tap. Modeled on the DocPanel
 * overlay pattern (fixed backdrop + dialog, no portal).
 */
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 650;
  background: rgba(2, 8, 23, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-end;
`;

const Panel = styled.div`
  background: ${({ theme }) => theme.bg};
  width: 100%;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border-top: 1px solid ${({ theme }) => theme.border};
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
  animation: sheet-up 0.18s ease-out;
  @keyframes sheet-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const Grab = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.subtle};
  margin: 8px auto 0;
  flex-shrink: 0;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  flex-shrink: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: ${({ theme }) => theme.text};
`;

const CloseBtn = styled.button`
  width: 36px;
  height: 36px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.muted};
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export default function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <Backdrop onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <Panel role="dialog" aria-modal="true" aria-label={title}>
        <Grab />
        <Header>
          <Title>{title}</Title>
          <CloseBtn onClick={onClose} aria-label="Close">
            ✕
          </CloseBtn>
        </Header>
        <Body>{children}</Body>
      </Panel>
    </Backdrop>
  );
}
