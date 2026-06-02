import { useRef } from 'react';

const PIXELS_PER_STEP = 6;

/** Number of decimals of a step (e.g. 0.05 → 2). */
export const stepDecimals = st => {
  const s = st.toString();
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
};

/**
 * Pure drag math: applies a vertical movement to a value.
 * `raw` accumulates (unclamped); `clamped` is the emitted value (bounded, rounded).
 * Shift ⇒ step ×10. Extracted to be testable without the DOM (cf. D7).
 */
export function nextDragValue(currentVal, movementY, step, shiftKey, min, max, dec) {
  const mult = shiftKey ? 10 : 1;
  const raw = currentVal - (movementY * mult * step) / PIXELS_PER_STEP;
  const clamped = Math.min(max, Math.max(min, +raw.toFixed(dec)));
  return { raw, clamped };
}

/**
 * Vertical-drag (pointer-lock) logic to adjust a numeric value.
 * Shares the code that was duplicated between FieldGroup and GlobalStrip.
 * Returns `{ onMouseDown }` to wire onto the trigger element (e.g. the unit).
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
