import { useRef, useEffect } from 'react';
import { attachHover } from '../../engine/charts.js';

export default function CanvasChart({ draw, deps = [], height = 220 }) {
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
    const canvas = ref.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      if (ref.current) drawRef.current(ref.current);
    });
    ro.observe(canvas.parentElement || canvas);
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

  return <canvas ref={ref} data-h={height} style={{ width: '100%', display: 'block' }} />;
}
