import { useRef, useEffect } from 'react';

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

  return <canvas ref={ref} data-h={height} style={{ width: '100%', display: 'block' }} />;
}
