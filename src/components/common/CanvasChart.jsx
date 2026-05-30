import { useRef, useEffect } from 'react';
import { attachHover } from '../../engine/charts.js';

export default function CanvasChart({ draw, deps = [], height }) {
  const wrapRef = useRef(null);
  const ref = useRef(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  // Re-draw when data deps change
  useEffect(() => {
    if (ref.current) drawRef.current(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Re-draw on container resize
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      if (ref.current) drawRef.current(ref.current);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Attach hover tooltip once per canvas element
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    attachHover(canvas);
    return () => {
      if (canvas._tip) { canvas._tip.remove(); canvas._tip = null; canvas._hov = false; }
    };
  }, []);

  const wrapStyle = height
    ? { position: 'relative', height: height + 'px', flexShrink: 0 }
    : { flex: 1, minHeight: 0, position: 'relative' };

  return (
    <div ref={wrapRef} style={wrapStyle}>
      <canvas ref={ref} style={{ position: 'absolute', width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
