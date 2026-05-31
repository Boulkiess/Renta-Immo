import { useRef } from 'react';

const PIXELS_PER_STEP = 6;

/** Nombre de décimales d'un pas (ex. 0.05 → 2). */
export const stepDecimals = st => {
  const s = st.toString();
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
};

/**
 * Logique de glissement vertical (pointer-lock) pour ajuster une valeur numérique.
 * Mutualise le code dupliqué entre FieldGroup et GlobalStrip.
 * Retourne `{ onMouseDown }` à brancher sur l'élément déclencheur (ex. l'unité).
 */
export function useDraggableValue({ val, min, max, step, onChange }) {
  const dragRef = useRef(null);
  const dec = stepDecimals(step);

  const onMouseDown = e => {
    e.preventDefault();
    const el = e.currentTarget;
    dragRef.current = { currentVal: val };
    el.requestPointerLock();
    document.body.style.userSelect = 'none';

    const handleMove = mv => {
      if (!mv.movementY) return;
      const mult = mv.shiftKey ? 10 : 1;
      dragRef.current.currentVal -= (mv.movementY * mult * step) / PIXELS_PER_STEP;
      const next = Math.min(max, Math.max(min, +dragRef.current.currentVal.toFixed(dec)));
      onChange(next);
    };

    const cleanup = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.body.style.userSelect = '';
      dragRef.current = null;
    };

    const handleUp = () => {
      document.exitPointerLock();
      cleanup();
    };

    const onLockChange = () => {
      if (!document.pointerLockElement) cleanup();
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('pointerlockchange', onLockChange);
  };

  return { onMouseDown };
}
