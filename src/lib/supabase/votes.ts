import { supabase } from './client';
import { getLocalCalendarDateString } from '@/lib/utils/dateUtils';
import type { Vote, Winner, Profile } from './types';

// ── castVote ──────────────────────────────────────────────────────────────
export async function castVote(submissionId: string, isPaid: boolean): Promise<{ success: boolean; newVoteCount: number; isPaid: boolean; dorocoinsSpent: number }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Fetch submission
  const { data: submission } = await supabase
    .from('submissions')
    .select('id, challenge_id, user_id, votes_count')
    .eq('id', submissionId)
    .single();

  if (!submission) throw new Error('Submission not found');
  if (submission.user_id === userId) throw new Error('Cannot vote for your own submission');

  // Check phase
  const { data: challenge } = await supabase
    .from('challenges')
    .select('phase')
    .eq('id', submission.challenge_id)
    .single();

  if (challenge?.phase !== 'voting') throw new Error('Voting is not open for this challenge');

  // Check unique vote constraint (a user can only vote on a specific submission ONCE)
  const { count: voteCount } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('voter_id', userId)
    .eq('submission_id', submissionId);

  if (voteCount && voteCount > 0) throw new Error('You have already voted on this submission');

  const todayStr = getLocalCalendarDateString();

  // Handle free vote
  if (!isPaid) {
    const { count: freeVotesToday } = await supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('voter_id', userId)
      .eq('challenge_id', submission.challenge_id)
      .eq('is_paid_vote', false)
      .eq('voted_date', todayStr);

    if (freeVotesToday && freeVotesToday > 0) {
      throw Object.assign(new Error('Free vote used today'), {
        code: 'free_vote_used',
        canPay: true,
        cost: 1
      });
    }
  }

  // Handle paid vote
  let spent = 0;
  if (isPaid) {
    const cost = 1;
    const { data: profile } = await supabase
      .from('profiles')
      .select('dorocoin_balance')
      .eq('id', userId)
      .single();

    if (!profile || profile.dorocoin_balance < cost) {
      throw new Error('Insufficient DoroCoins');
    }

    const newBalance = profile.dorocoin_balance - cost;
    await supabase.from('profiles').update({ dorocoin_balance: newBalance }).eq('id', userId);
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'debit',
      amount: cost,
      description: 'Paid vote',
      balance_after: newBalance
    });
    spent = cost;
  }

  // Record vote
  const { error: insertError } = await supabase.from('votes').insert({
    voter_id: userId,
    submission_id: submissionId,
    challenge_id: submission.challenge_id,
    is_paid_vote: isPaid,
    dorocoins_spent: spent,
    voted_date: todayStr
  });

  if (insertError) throw insertError;

  // Increment votes
  const newVoteCount = submission.votes_count + 1;
  await supabase.rpc('increment_votes', { submission_id: submissionId }).catch(() => {
    supabase.from('submissions').update({ votes_count: newVoteCount }).eq('id', submissionId);
  });

  return { success: true, newVoteCount, isPaid, dorocoinsSpent: spent };
}

// ── getVoteStatus ─────────────────────────────────────────────────────────
export async function getVoteStatus(challengeId: string): Promise<{ hasUsedFreeVoteToday: boolean; votedSubmissionIds: string[] }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return { hasUsedFreeVoteToday: false, votedSubmissionIds: [] };

  const todayStr = getLocalCalendarDateString();

  // 1. Check free vote today
  const { count } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('voter_id', userId)
    .eq('challenge_id', challengeId)
    .eq('is_paid_vote', false)
    .eq('voted_date', todayStr);

  const hasUsedFreeVoteToday = (count ?? 0) > 0;

  // 2. Get all voted submission IDs (to disable voting again on the same submission)
  const { data } = await supabase
    .from('votes')
    .select('submission_id')
    .eq('voter_id', userId)
    .eq('challenge_id', challengeId);

  const votedSubmissionIds = data ? data.map(v => v.submission_id) : [];

  return { hasUsedFreeVoteToday, votedSubmissionIds };
}

// ── computeWinners ────────────────────────────────────────────────────────
export async function computeWinners(challengeId: string): Promise<(Winner & { user: Profile })[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: challenge } = await supabase
    .from('challenges')
    .select('created_by, title')
    .eq('id', challengeId)
    .single();

  if (!challenge || challenge.created_by !== userId) {
    throw new Error('Only the creator can compute winners');
  }

  // Get top 3 submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, user_id, title, votes_count')
    .eq('challenge_id', challengeId)
    .order('votes_count', { ascending: false })
    .limit(3);

  if (!submissions || submissions.length === 0) return [];

  const winnersToReturn = [];
  const points = [100, 50, 25];

  for (let i = 0; i < submissions.length; i++) {
    const sub = submissions[i];
    const placement = (i + 1) as 1 | 2 | 3;

    // 1. Insert winner
    const { data: winnerData } = await supabase.from('winners').insert({
      challenge_id: challengeId,
      user_id: sub.user_id,
      submission_id: sub.id,
      placement: placement,
      prize_claimed: false
    }).select().single();

    // 2. Update submission
    await supabase.from('submissions').update({
      is_winner: true,
      placement: placement
    }).eq('id', sub.id);

    // 3. Update points and wins
    await supabase.rpc('add_points', { user_id: sub.user_id, pts: points[i] }).catch(() => {
      // Fallback
    });

    if (placement === 1) {
      await supabase.rpc('increment_wins', { user_id: sub.user_id }).catch(() => {
        // Fallback
      });
    }

    // 4. Notify winner
    await supabase.from('notifications').insert({
      user_id: sub.user_id,
      title: 'Congratulations!',
      message: `You won ${placement}${placement === 1 ? 'st' : placement === 2 ? 'nd' : 'rd'} place in ${challenge.title}!`
    });

    if (winnerData) {
      winnersToReturn.push(winnerData);
    }
  }

  // Change phase to completed
  await supabase.from('challenges').update({ phase: 'completed' }).eq('id', challengeId);

  // Return formatted array
  const { data: finalWinners } = await supabase
    .from('winners')
    .select('*, user:profiles(id, name, avatar_url, role)')
    .eq('challenge_id', challengeId)
    .order('placement', { ascending: true });

  return (finalWinners ?? []) as (Winner & { user: Profile })[];
}
