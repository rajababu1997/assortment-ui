import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  durationMs?: number;
  formatter?: 'number' | 'percent' | 'money';
}

const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUp({ value, durationMs = 600, formatter = 'number' }: Props) {
  const [n, setN] = useState(0);
  const fromRef = useRef(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    startRef.current = null;
    let raf = 0;

    const tick = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = EASE_OUT(t);
      const current = from + (to - from) * eased;
      setN(current);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <>{format(n, formatter)}</>;
}

function format(n: number, formatter: 'number' | 'percent' | 'money'): string {
  if (formatter === 'percent') return n.toFixed(n < 10 ? 1 : 0);
  if (formatter === 'money') return n.toLocaleString();
  return Math.round(n).toLocaleString();
}
