import { Badge } from '@/components/ui/Badge';
import { useLivePhase } from '@/hooks/useLivePhase';
import { getPhaseBadgeLabel, getPhaseBadgeVariant } from '@/lib/supabase/challenges';

interface Props {
  challenge: unknown;
  /** List cards: 60000; detail: 1000 */
  tickMs?: number;
  className?: string;
}

export function PhaseBadge({ challenge, tickMs = 60000, className }: Props) {
  const phase = useLivePhase(challenge, tickMs);
  return (
    <Badge variant={getPhaseBadgeVariant(phase)} className={className}>
      {getPhaseBadgeLabel(phase)}
    </Badge>
  );
}
