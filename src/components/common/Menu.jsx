import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import styled from 'styled-components';

/**
 * Generic dropdown menu.
 *
 *   <Menu trigger={<KebabIcon />} title="…">
 *     <MenuItem onClick={fn}>Label</MenuItem>
 *     <MenuItem onClick={fn} disabled>Label</MenuItem>
 *   </Menu>
 *
 * The shell owns open/close state, outside-click and Escape dismissal, and
 * positioning. Each MenuItem closes the menu after its handler runs (via the
 * MenuCtx). Interactive — unlike Popover (which is pointer-events:none).
 */

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const Trigger = styled.button`
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.muted};
  display: grid;
  place-items: center;
  border-radius: 5px;
  flex-shrink: 0;
  &:hover {
    background: ${({ theme }) => theme.s2};
    color: ${({ theme }) => theme.text};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  ${({ $align }) => ($align === 'left' ? 'left: 0;' : 'right: 0;')}
  min-width: 132px;
  background: ${({ theme }) => theme.popBg};
  border: 1px solid ${({ theme }) => theme.subtle};
  border-radius: 8px;
  padding: 4px;
  z-index: 600;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
`;

const Item = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  color: ${({ theme }) => theme.text};
  text-align: left;
  border-radius: 5px;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.s2};
  }
  &:disabled {
    color: ${({ theme }) => theme.muted};
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MenuCtx = createContext(null);

export function Menu({ trigger, title, children, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <Wrap ref={wrapRef}>
      <Trigger
        type="button"
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {trigger}
      </Trigger>
      {open && (
        <Dropdown role="menu" $align={align}>
          <MenuCtx.Provider value={{ close }}>{children}</MenuCtx.Provider>
        </Dropdown>
      )}
    </Wrap>
  );
}

export function MenuItem({ onClick, disabled, children }) {
  const ctx = useContext(MenuCtx);
  return (
    <Item
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onClick?.();
        ctx?.close();
      }}
    >
      {children}
    </Item>
  );
}
