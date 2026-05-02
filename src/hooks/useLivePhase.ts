import { useMemo } from 'react';
import { useNow } from './useNow';
import { computePhase } from '@/lib/supabase/challenges';
import type { ChallengePhase } from '@/lib/supabase/types';

/**
 * Recomputes challenge phase on each tick (default 60s for lists, 1s for detail).
 */
export function useLivePhase(challenge: unknown, tickMs: number = 60000): ChallengePhase {
  const now = useNow(tickMs);

  return useMemo(() => {
    if (!challenge) return 'upcoming';
    return computePhase(challenge, now);
  }, [challenge, now]);
}
