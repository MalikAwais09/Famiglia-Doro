import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ClaimPrizeButton } from '@/components/ClaimPrizeButton';

interface WinnerView {
  id: string;
  placement: number;
  prize_claimed: boolean;
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
  submissions: {
    id: string;
    title: string;
    votes_count: number;
    content_url: string | null;
    content_type: string;
  } | null;
}

interface Props {
  challengeId: string;
  isCurrentUserWinner: boolean;
  currentUserId?: string;
}

export function WinnersDisplay({ challengeId, isCurrentUserWinner: _isCurrentUserWinner, currentUserId }: Props) {
  const [winners, setWinners] = useState<WinnerView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      const { data, error } = await supabase
        .from('winners')
        .select(`
          id,
          placement,
          prize_claimed,
          profiles!winners_user_id_fkey (
            id, name, avatar_url
          ),
          submissions!winners_submission_id_fkey (
            id, title, votes_count, content_url, content_type
          )
        `)
        .eq('challenge_id', challengeId)
        .order('placement', { ascending: true });

      if (!error && data) setWinners(data as WinnerView[]);
      setLoading(false);
    };

    fetchWinners();
  }, [challengeId]);

  if (loading) return <p className="text-sm text-[#9CA3AF]">Loading winners...</p>;
  if (winners.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉'];
  const placementText = ['1st Place', '2nd Place', '3rd Place'];
  const pointsEarned = [100, 50, 25];

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">🏆 Winners</h2>
      {winners.map((winner, index) => (
        <div key={winner.id} className="flex items-center justify-between bg-[#161618] rounded-md p-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">{medals[index] ?? '🏅'}</span>
            <div>
              <p className="text-sm font-medium">{placementText[index] ?? `${winner.placement}th Place`}</p>
              <p className="text-xs text-[#9CA3AF]">{winner.profiles?.name ?? 'Unknown'}</p>
              <p className="text-xs text-[#9CA3AF]">{winner.submissions?.votes_count ?? 0} votes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-400">+{pointsEarned[index] ?? 0} points</span>
            {currentUserId === winner.profiles?.id && !winner.prize_claimed && (
              <ClaimPrizeButton
                winnerId={winner.id}
                challengeId={challengeId}
                onClaimed={() => {
                  setWinners((prev) =>
                    prev.map((w) => (w.id === winner.id ? { ...w, prize_claimed: true } : w))
                  );
                }}
              />
            )}
            {currentUserId === winner.profiles?.id && winner.prize_claimed && (
              <span className="text-xs text-emerald-400">✅ Prize Claimed</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
