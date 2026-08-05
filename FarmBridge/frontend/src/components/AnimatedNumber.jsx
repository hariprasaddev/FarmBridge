import { useEffect, useRef, useState } from 'react';

/**
 * Counts up to `value` with an ease-out curve when the value changes.
 * `format` receives the intermediate number and returns the rendered
 * string (e.g. currency formatting for revenue cards).
 */
function AnimatedNumber({ value = 0, duration = 900, format }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;

    if (from === to) {
      setDisplay(to);
      return undefined;
    }

    let raf;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  if (format) {
    return <>{format(display)}</>;
  }

  return <>{Math.round(display).toLocaleString('en-IN')}</>;
}

export default AnimatedNumber;
