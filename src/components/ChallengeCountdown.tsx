import { useCountdown } from '@/hooks/useCountdown';
import { votingEndFromEndDate } from '@/lib/supabase/challenges';

interface Props {
  challenge: {
    registration_deadline?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    voting_end_date?: string | null;
  };
  phase: string;
  tickMs?: number;
  className?: string;
}

export function ChallengeCountdown({ challenge, phase, tickMs = 1000, className }: Props) {
  const targetDate = (() => {
    switch (phase) {
      case 'upcoming':
      case 'entry_open':
        return challenge.registration_deadline ?? null;
      case 'entry_closed':
        return challenge.start_date ?? null;
      case 'active':
        return challenge.end_date ?? null;
      case 'voting':
        return (
          challenge.voting_end_date ||
          (challenge.end_date ? votingEndFromEndDate(challenge.end_date) : null)
        );
      default:
        return null;
    }
  })();

  const countdown = useCountdown(targetDate ?? undefined, tickMs);

  if (!targetDate || phase === 'completed') return null;

  const label = (() => {
    switch (phase) {
      case 'upcoming':
      case 'entry_open':
        return 'Registration closes in';
      case 'entry_closed':
        return 'Challenge starts in';
      case 'active':
        return 'Submissions close in';
      case 'voting':
        return 'Voting ends in';
      default:
        return 'Time remaining';
    }
  })();

  if (countdown.isExpired) return null;

  return (
    <div className={className}>
      <p className="text-xs text-[#9CA3AF]">{label}</p>
      <p className="text-xs text-yellow-500/90 font-medium">{countdown.label}</p>
    </div>
  );
}
