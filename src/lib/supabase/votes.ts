import { supabase } from './client';
import { getLocalCalendarDateString } from '@/lib/utils/dateUtils';
import { computePhase } from '@/lib/supabase/challenges';

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
  const { data: challengeRow } = await supabase
    .from('challenges')
    .select('phase, registration_deadline, start_date, end_date, voting_end_date, results_date')
    .eq('id', submission.challenge_id)
    .single();

  if (!challengeRow || computePhase(challengeRow) !== 'voting') {
    throw new Error('Voting is not open for this challenge');
  }

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

  const { error: rpcError } = await supabase.rpc('increment_votes', { submission_id: submissionId });

  let newVoteCount = submission.votes_count + 1;

  if (rpcError) {
    console.error('increment_votes rpc failed:', rpcError);
    const { data: currentSub, error: fetchErr } = await supabase
      .from('submissions')
      .select('votes_count')
      .eq('id', submissionId)
      .single();

    if (fetchErr) {
      console.error('Failed to fetch submission for vote count fallback:', fetchErr);
      throw fetchErr;
    }

    newVoteCount = (currentSub?.votes_count ?? 0) + 1;

    const { error: updateErr } = await supabase
      .from('submissions')
      .update({ votes_count: newVoteCount })
      .eq('id', submissionId);

    if (updateErr) {
      console.error('Fallback vote increment failed:', updateErr);
      throw updateErr;
    }
  }

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
export async function computeWinners(
  challengeId: string
): Promise<{ success?: true; winners?: Array<{ placement: number; userId: string; submissionId: string }>; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData.session?.user?.id;
    if (!currentUserId) return { error: 'Not authenticated' };

    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, title, phase, created_by, scoring_system')
      .eq('id', challengeId)
      .single();

    if (challengeError) return { error: challengeError.message };
    if (!challenge) return { error: 'Challenge not found' };
    if (challenge.created_by !== currentUserId) {
      return { error: 'Only creator can announce winners' };
    }

    const { data: existingWinners, error: existingError } = await supabase
      .from('winners')
      .select('id')
      .eq('challenge_id', challengeId)
      .limit(1);

    if (existingError) return { error: existingError.message };
    if ((existingWinners?.length ?? 0) > 0) return { error: 'Winners already computed' };

    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('id, user_id, votes_count, title')
      .eq('challenge_id', challengeId)
      .order('votes_count', { ascending: false });

    if (subError) return { error: subError.message };
    if (!submissions || submissions.length === 0) {
      return { error: 'No submissions found' };
    }

    const winnerCount = challenge.scoring_system === '1_rounder' ? 1 : 3;
    const winnerSubmissions = submissions.slice(0, winnerCount);

    const points = [100, 50, 25];
    const winners: Array<{ placement: number; userId: string; submissionId: string }> = [];

    for (let i = 0; i < winnerSubmissions.length; i++) {
      const sub = winnerSubmissions[i];
      const placement = i + 1;

      const { error: winnerError } = await supabase.from('winners').insert({
        challenge_id: challengeId,
        user_id: sub.user_id,
        submission_id: sub.id,
        placement,
        prize_claimed: false,
      });

      if (winnerError && winnerError.code !== '23505') {
        console.error('Winner insert error:', winnerError);
        continue;
      }

      await supabase
        .from('submissions')
        .update({ is_winner: true, placement })
        .eq('id', sub.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('points, wins')
        .eq('id', sub.user_id)
        .single();

      if (profile) {
        const updateData: { points: number; wins?: number } = {
          points: (profile.points ?? 0) + points[i],
        };
        if (placement === 1) {
          updateData.wins = (profile.wins ?? 0) + 1;
        }
        await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', sub.user_id);
      }

      const placementText = placement === 1 ? '1st' : placement === 2 ? '2nd' : '3rd';
      await supabase
        .from('notifications')
        .insert({
          user_id: sub.user_id,
          title: '🏆 You Won!',
          message: `Congratulations! You won ${placementText} place in "${challenge.title}"! +${points[i]} points`,
          type: 'winner',
          is_read: false,
        });

      winners.push({ placement, userId: sub.user_id, submissionId: sub.id });
    }

    return { success: true, winners };
  } catch (err: any) {
    console.error('computeWinners error:', err);
    return { error: err?.message ?? 'Failed to compute winners' };
  }
}
