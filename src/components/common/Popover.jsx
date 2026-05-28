import { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const Pop = styled.div`
  position: fixed;
  background: ${({ theme }) => theme.popBg};
  border: 1px solid ${({ theme }) => theme.subtle};
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 11px;
  line-height: 1.6;
  color: ${({ theme }) => theme.muted};
  max-width: 280px;
  z-index: 600;
  box-shadow: 0 8px 32px rgba(0,0,0,.8);
  pointer-events: none;
  h4 { color: ${({ theme }) => theme.text}; font-size: 12px; margin-bottom: 5px; font-weight: 700; }
  code { display: block; background: ${({ theme }) => theme.border}; border-radius: 4px; padding: 3px 8px; font-family: monospace; font-size: 10px; color: ${({ theme }) => theme.yellow}; margin-top: 6px; }
`;

const InfoBtn = styled.button`
  width: 13px; height: 13px; border-radius: 50%;
  background: ${({ theme }) => theme.border};
  border: none; color: ${({ theme }) => theme.muted};
  font-size: 8px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-family: 'DM Sans', sans-serif; font-weight: 800; line-height: 1;
  transition: background .15s, color .15s; vertical-align: middle;
  &:hover { background: ${({ theme }) => theme.subtle}; color: ${({ theme }) => theme.text}; }
`;

let _setActivePop = null;

export function InfoButton({ tooltipKey }) {
  const { t } = useTranslation();
  const ref = useRef(null);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!ref.current || !_setActivePop) return;
    const info = { key: tooltipKey, anchor: ref.current.getBoundingClientRect() };
    _setActivePop(prev => prev?.key === tooltipKey ? null : info);
  }, [tooltipKey]);

  const title = t(`tooltips.${tooltipKey}.title`, '');
  if (!title) return null;
  return <InfoBtn ref={ref} onClick={handleClick}>?</InfoBtn>;
}

export function PopoverHost() {
  const { t } = useTranslation();
  const [active, setActive] = useState(null);
  const popRef = useRef(null);

  _setActivePop = setActive;

  useEffect(() => {
    const hide = () => setActive(null);
    document.addEventListener('click', hide);
    return () => document.removeEventListener('click', hide);
  }, []);

  if (!active) return null;

  const { key, anchor } = active;
  const title = t(`tooltips.${key}.title`, '');
  const body  = t(`tooltips.${key}.body`, '');
  const code  = t(`tooltips.${key}.code`, '');

  let left = anchor.right + 8, top = anchor.top - 8;
  if (left + 280 > innerWidth - 8) left = anchor.left - 288;

  return (
    <Pop ref={popRef} style={{ left: Math.max(4, left), top: Math.max(4, top) }}>
      <h4>{title}</h4>
      <span dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br>') }} />
      {code && <code>{code}</code>}
    </Pop>
  );
}
