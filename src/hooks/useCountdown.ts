import { useMemo } from 'react';
import { useNow } from './useNow';

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isExpired: boolean;
  label: string;
  shortLabel: string;
}

/**
 * Live countdown to a UTC ISO target. `tickMs` should match how often you need UI updates.
 */
export function useCountdown(
  targetDateUtc: string | null | undefined,
  tickMs: number = 1000
): CountdownResult {
  const now = useNow(tickMs);

  return useMemo(() => {
    if (!targetDateUtc) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        isExpired: true,
        label: '',
        shortLabel: '',
      };
    }

    const target = new Date(targetDateUtc).getTime();
    const diff = target - now.getTime();

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        isExpired: true,
        label: 'Expired',
        shortLabel: 'Expired',
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const label =
      days > 0
        ? `${days}d ${hours}h ${minutes}m ${seconds}s`
        : hours > 0
          ? `${hours}h ${minutes}m ${seconds}s`
          : minutes > 0
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`;

    const shortLabel =
      days > 0
        ? `${days} day${days !== 1 ? 's' : ''}`
        : hours > 0
          ? `${hours} hour${hours !== 1 ? 's' : ''}`
          : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

    return { days, hours, minutes, seconds, total: diff, isExpired: false, label, shortLabel };
  }, [now, targetDateUtc]);
}
