import { useState, useEffect } from 'react';

/**
 * Returns current Date that updates on an interval.
 * Use for live phase boundaries and countdowns.
 */
export function useNow(intervalMs: number = 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
