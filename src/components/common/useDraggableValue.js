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
 * Vertical-drag logic to adjust a numeric value, on **Pointer Events** so it
 * works with both mouse and touch (the previous mouse-only `requestPointerLock`
 * implementation did nothing on a phone). Drag distance is the per-event delta
 * of `clientY`, captured to the trigger via `setPointerCapture` so the gesture
 * keeps tracking outside the element. Shares the code between FieldGroup and
 * GlobalStrip. Returns `{ onPointerDown }` to wire onto the trigger (the unit).
 *
 * The trigger sets `touch-action: none` (see the `Unit` styled components) so a
 * vertical drag scrubs the value instead of scrolling the page on touch.
 */
export function useDraggableValue({ val, min, max, step, onChange }) {
  const dragRef = useRef(null);
  const dec = stepDecimals(step);

  const onPointerDown = e => {
    e.preventDefault();
    const el = e.currentTarget;
    const { pointerId } = e;
    dragRef.current = { currentVal: val, lastY: e.clientY };
    try {
      el.setPointerCapture(pointerId);
    } catch {
      /* capture unsupported — listeners on the element still work for mouse */
    }
    document.body.style.userSelect = 'none';

    const handleMove = mv => {
      const d = dragRef.current;
      if (!d) return;
      const movementY = mv.clientY - d.lastY;
      d.lastY = mv.clientY;
      if (!movementY) return;
      const { raw, clamped } = nextDragValue(
        d.currentVal,
        movementY,
        step,
        mv.shiftKey,
        min,
        max,
        dec
      );
      d.currentVal = raw;
      onChange(clamped);
    };

    const cleanup = () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerup', cleanup);
      el.removeEventListener('pointercancel', cleanup);
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }
      document.body.style.userSelect = '';
      dragRef.current = null;
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerup', cleanup);
    el.addEventListener('pointercancel', cleanup);
  };

  return { onPointerDown };
}
