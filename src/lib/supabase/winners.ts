import { supabase } from './client';

export interface CalculatedPrizeBreakdown {
  first: number | string;
  second: number | string;
  third: number | string;
  currency: string;
  type: string;
}

export function calculatePrizes(challenge: {
  prize_type?: string | null;
  prize_description?: string | null;
  entry_fee?: number | null;
  current_participants?: number | null;
}): CalculatedPrizeBreakdown {
  const {
    prize_type,
    prize_description,
    entry_fee,
    current_participants,
  } = challenge;

  const totalPool = (Number(entry_fee) || 0) * (Number(current_participants) || 0);
  const platformCut = totalPool * 0.15;
  const availablePool = totalPool - platformCut;

  if (prize_type === 'cash') {
    const descAmount = parseFloat(
      (prize_description ?? '0').replace(/[^0-9.]/g, '')
    );

    if (descAmount > 0) {
      return {
        first: descAmount,
        second: Math.round(descAmount * 0.6),
        third: Math.round(descAmount * 0.3),
        currency: '$',
        type: 'cash',
      };
    }

    return {
      first: Math.round(availablePool * 0.6),
      second: Math.round(availablePool * 0.25),
      third: Math.round(availablePool * 0.15),
      currency: '$',
      type: 'cash',
    };
  }

  if (prize_type === 'digital') {
    return {
      first: prize_description ?? 'Digital Prize',
      second: prize_description ?? 'Digital Prize',
      third: prize_description ?? 'Digital Prize',
      currency: '',
      type: 'digital',
    };
  }

  if (prize_type === 'physical') {
    return {
      first: prize_description ?? 'Physical Prize',
      second: prize_description ?? 'Physical Prize',
      third: prize_description ?? 'Physical Prize',
      currency: '',
      type: 'physical',
    };
  }

  if (prize_type === 'bragging_rights') {
    return {
      first: '🏆 Champion',
      second: '🥈 Runner Up',
      third: '🥉 Third Place',
      currency: '',
      type: 'bragging_rights',
    };
  }

  return {
    first: prize_description ?? 'Prize TBD',
    second: prize_description ?? 'Prize TBD',
    third: prize_description ?? 'Prize TBD',
    currency: '',
    type: prize_type ?? 'none',
  };
}

// Get all completed challenges with their winners
export async function getCompletedChallengesWithWinners() {
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select(`
      id,
      title,
      category,
      cover_image_url,
      prize_type,
      prize_description,
      entry_fee,
      current_participants,
      phase,
      end_date,
      profiles!challenges_created_by_fkey (
        id, name, avatar_url
      )
    `)
    .eq('phase', 'completed')
    .eq('is_deleted', false)
    .order('end_date', { ascending: false });

  if (error) {
    console.error('getCompletedChallenges error:', error);
    return [];
  }

  if (!challenges || challenges.length === 0) return [];

  const challengesWithWinners = await Promise.all(
    challenges.map(async (challenge: { id: string }) => {
      const { data: winners } = await supabase
        .from('winners')
        .select(`
          id,
          placement,
          prize_claimed,
          user_id,
          profiles!winners_user_id_fkey (
            id, name, avatar_url
          ),
          submissions!winners_submission_id_fkey (
            id, title, votes_count, content_url, content_type
          )
        `)
        .eq('challenge_id', challenge.id)
        .order('placement', { ascending: true });

      return {
        ...challenge,
        winners: winners ?? [],
        topWinner: winners?.[0] ?? null,
      };
    })
  );

  return challengesWithWinners;
}

// Get single challenge winners detail
export async function getChallengeWinnersDetail(challengeId: string) {
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select(`
      id,
      title,
      category,
      cover_image_url,
      prize_type,
      prize_description,
      entry_fee,
      current_participants,
      phase,
      profiles!challenges_created_by_fkey (
        id, name, avatar_url
      )
    `)
    .eq('id', challengeId)
    .single();

  if (challengeError) return null;

  const { data: winners } = await supabase
    .from('winners')
    .select(`
      id,
      placement,
      prize_claimed,
      claimed_at,
      user_id,
      profiles!winners_user_id_fkey (
        id, name, avatar_url
      ),
      submissions!winners_submission_id_fkey (
        id, title, description,
        votes_count, content_url, content_type
      )
    `)
    .eq('challenge_id', challengeId)
    .order('placement', { ascending: true });

  return {
    ...challenge,
    winners: winners ?? [],
  };
}

// Claim prize
export async function claimPrize(winnerId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: winner } = await supabase
    .from('winners')
    .select('user_id, prize_claimed')
    .eq('id', winnerId)
    .single();

  if (!winner) return { error: 'Winner not found' };
  if (winner.user_id !== user.id) return { error: 'Not authorized' };
  if (winner.prize_claimed) return { error: 'Prize already claimed' };

  const { error } = await supabase
    .from('winners')
    .update({
      prize_claimed: true,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', winnerId);

  if (error) return { error: error.message };
  return { success: true };
}
