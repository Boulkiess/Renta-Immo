import { useRef } from 'react';

const PIXELS_PER_STEP = 6;

/** Nombre de décimales d'un pas (ex. 0.05 → 2). */
export const stepDecimals = st => {
  const s = st.toString();
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
};

/**
 * Math pure du glissement : applique un déplacement vertical à une valeur.
 * `raw` accumule (non clampé) ; `clamped` est la valeur émise (bornée, arrondie).
 * Shift ⇒ pas ×10. Extrait pour être testable sans DOM (cf. D7).
 */
export function nextDragValue(currentVal, movementY, step, shiftKey, min, max, dec) {
  const mult = shiftKey ? 10 : 1;
  const raw = currentVal - (movementY * mult * step) / PIXELS_PER_STEP;
  const clamped = Math.min(max, Math.max(min, +raw.toFixed(dec)));
  return { raw, clamped };
}

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
      const { raw, clamped } = nextDragValue(
        dragRef.current.currentVal,
        mv.movementY,
        step,
        mv.shiftKey,
        min,
        max,
        dec
      );
      dragRef.current.currentVal = raw;
      onChange(clamped);
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
