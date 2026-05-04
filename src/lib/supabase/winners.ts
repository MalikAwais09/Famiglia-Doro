import { supabase } from './client';

export interface CalculatedPrizeBreakdown {
  first: number | string;
  second: number | string | null;
  third: number | string | null;
  currency: string;
  type: string;
  total: number;
  winnersCount: number;
}

export function calculatePrizes(challenge: any): CalculatedPrizeBreakdown {
  const {
    prize_type,
    prize_description,
    entry_fee,
    current_participants,
    scoring_system,
  } = challenge;

  const parsedAmount = parseFloat(
    (prize_description ?? '0').replace(/[^0-9.]/g, '')
  );

  const getTotalPrize = () => {
    if (parsedAmount > 0) return parsedAmount;
    const pool = (entry_fee ?? 0) * (current_participants ?? 0);
    return Math.round(pool * 0.85);
  };

  const isOneRounder = scoring_system === '1_rounder';

  if (prize_type === 'cash') {
    const total = getTotalPrize();

    if (isOneRounder) {
      return {
        first: total,
        second: 0,
        third: 0,
        total,
        currency: '$',
        type: 'cash',
        winnersCount: 1,
      };
    }

    return {
      first: Math.round(total * 0.6),
      second: Math.round(total * 0.25),
      third: Math.round(total * 0.15),
      total,
      currency: '$',
      type: 'cash',
      winnersCount: 3,
    };
  }

  if (prize_type === 'bragging_rights') {
    return {
      first: '🏆 Champion',
      second: isOneRounder ? null : '🥈 Runner Up',
      third: isOneRounder ? null : '🥉 Third Place',
      total: 0,
      currency: '',
      type: 'bragging_rights',
      winnersCount: isOneRounder ? 1 : 3,
    };
  }

  if (prize_type === 'digital') {
    return {
      first: prize_description ?? 'Digital Prize',
      second: isOneRounder ? null : prize_description ?? 'Digital Prize',
      third: isOneRounder ? null : prize_description ?? 'Digital Prize',
      total: 0,
      currency: '',
      type: 'digital',
      winnersCount: isOneRounder ? 1 : 3,
    };
  }

  if (prize_type === 'physical') {
    return {
      first: prize_description ?? 'Physical Prize',
      second: isOneRounder ? null : prize_description ?? 'Physical Prize',
      third: isOneRounder ? null : prize_description ?? 'Physical Prize',
      total: 0,
      currency: '',
      type: 'physical',
      winnersCount: isOneRounder ? 1 : 3,
    };
  }

  return {
    first: prize_description ?? 'Prize TBD',
    second: isOneRounder ? null : prize_description ?? 'Prize TBD',
    third: isOneRounder ? null : prize_description ?? 'Prize TBD',
    total: 0,
    currency: '',
    type: 'none',
    winnersCount: isOneRounder ? 1 : 3,
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
      scoring_system,
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
      scoring_system,
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
