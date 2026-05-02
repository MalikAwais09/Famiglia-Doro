import { supabase } from './client';
import type { Challenge, Tournament } from './types';
import { computeWinners } from './votes';

export interface TournamentMatchJson {
  id: string;
  participant1Id: string | null;
  participant2Id: string | null;
  submission1Id: string | null;
  submission2Id: string | null;
  votes1: number;
  votes2: number;
  winnerId: string | null;
}

export interface TournamentRoundJson {
  round: number;
  matches: TournamentMatchJson[];
}

export interface TournamentBracketData {
  rounds: TournamentRoundJson[];
}

export interface ChallengeWithTournament {
  challenge: Challenge;
  tournament: Tournament | null;
}

/** Resolve profile names for all participant IDs referenced in a bracket. */
export async function resolveBracketParticipantNames(
  bracket: TournamentBracketData | null,
): Promise<Map<string, string>> {
  if (!bracket?.rounds?.length) return new Map();

  const ids = new Set<string>();
  for (const r of bracket.rounds) {
    for (const m of r.matches) {
      if (m.participant1Id) ids.add(m.participant1Id);
      if (m.participant2Id) ids.add(m.participant2Id);
      if (m.winnerId) ids.add(m.winnerId);
    }
  }

  if (ids.size === 0) return new Map();

  const { data, error } = await supabase.from('profiles').select('id, name').in('id', [...ids]);

  if (error) throw error;

  return new Map((data ?? []).map(p => [p.id, p.name ?? 'Unknown']));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchSubmissionVotes(submissionId: string | null): Promise<number> {
  if (!submissionId) return 0;
  const { data } = await supabase.from('submissions').select('votes_count').eq('id', submissionId).single();
  return data?.votes_count ?? 0;
}

async function assertChallengeCreator(challengeId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: ch } = await supabase.from('challenges').select('created_by').eq('id', challengeId).single();
  if (!ch || ch.created_by !== userId) throw new Error('Only the challenge creator can manage this tournament');
}

// ── getTournaments ─────────────────────────────────────────────────────────
export async function getTournaments(): Promise<ChallengeWithTournament[]> {
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('format', 'tournament')
    .eq('is_deleted', false);

  if (error) throw error;
  if (!challenges?.length) return [];

  const ids = challenges.map(c => c.id);
  const { data: tournaments } = await supabase.from('tournaments').select('*').in('challenge_id', ids);

  const map = new Map((tournaments ?? []).map(t => [t.challenge_id, t]));

  return challenges.map(c => ({
    challenge: c as Challenge,
    tournament: map.get(c.id) ?? null,
  }));
}

// ── getTournamentBracket ───────────────────────────────────────────────────
export async function getTournamentBracket(challengeId: string): Promise<{
  bracket_data: TournamentBracketData | null;
  current_round: number;
  total_rounds: number | null;
}> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('bracket_data, current_round, total_rounds')
    .eq('challenge_id', challengeId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return { bracket_data: null, current_round: 1, total_rounds: null };
  }

  return {
    bracket_data: (data.bracket_data as TournamentBracketData) ?? null,
    current_round: data.current_round,
    total_rounds: data.total_rounds,
  };
}

// ── initializeTournamentBracket ────────────────────────────────────────────
export async function initializeTournamentBracket(challengeId: string): Promise<TournamentBracketData> {
  await assertChallengeCreator(challengeId);

  const { data: existing } = await supabase.from('tournaments').select('id').eq('challenge_id', challengeId).maybeSingle();
  if (existing) throw new Error('Tournament bracket already initialized');

  const { data: entries, error: eErr } = await supabase.from('entries').select('user_id').eq('challenge_id', challengeId);

  if (eErr) throw eErr;

  const userIds = [...new Set((entries ?? []).map(e => e.user_id))];
  if (userIds.length < 2) throw new Error('Need at least 2 participants');

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, user_id, votes_count')
    .eq('challenge_id', challengeId);

  const subByUser = new Map<string, { id: string; votes_count: number }>();
  for (const s of submissions ?? []) {
    if (!subByUser.has(s.user_id)) {
      subByUser.set(s.user_id, { id: s.id, votes_count: s.votes_count });
    }
  }

  type Part = { userId: string; submissionId: string; votes: number };
  const participants: Part[] = [];
  for (const uid of userIds) {
    const sub = subByUser.get(uid);
    if (!sub) continue;
    participants.push({ userId: uid, submissionId: sub.id, votes: sub.votes_count });
  }

  if (participants.length < 2) throw new Error('Need at least 2 submissions to start the tournament');

  const shuffled = shuffle(participants);
  const matches: TournamentMatchJson[] = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    const mid = `match_${String(i).padStart(2, '0')}_${challengeId.slice(0, 8)}`;

    if (b) {
      matches.push({
        id: mid,
        participant1Id: a.userId,
        participant2Id: b.userId,
        submission1Id: a.submissionId,
        submission2Id: b.submissionId,
        votes1: a.votes,
        votes2: b.votes,
        winnerId: null,
      });
    } else {
      matches.push({
        id: mid,
        participant1Id: a.userId,
        participant2Id: null,
        submission1Id: a.submissionId,
        submission2Id: null,
        votes1: a.votes,
        votes2: 0,
        winnerId: a.userId,
      });
    }
  }

  const n = shuffled.length;
  const total_rounds = Math.max(1, Math.ceil(Math.log2(n)));

  const bracket: TournamentBracketData = {
    rounds: [{ round: 1, matches }],
  };

  const { error: insErr } = await supabase.from('tournaments').insert({
    challenge_id: challengeId,
    bracket_data: bracket as unknown as Record<string, unknown>,
    current_round: 1,
    total_rounds,
  });

  if (insErr) throw insErr;

  return bracket;
}

async function insertParticipantNotifications(
  userIds: string[],
  title: string,
  message: string,
): Promise<void> {
  const rows = userIds.map(uid => ({
    user_id: uid,
    title,
    message,
    type: 'info',
    is_read: false,
  }));
  if (rows.length === 0) return;
  await supabase.from('notifications').insert(rows);
}

// ── advanceToNextRound ─────────────────────────────────────────────────────
export async function advanceToNextRound(challengeId: string): Promise<TournamentBracketData> {
  await assertChallengeCreator(challengeId);

  const { data: tour, error: tErr } = await supabase.from('tournaments').select('*').eq('challenge_id', challengeId).single();

  if (tErr || !tour) throw new Error('Tournament not found');

  const { data: challenge } = await supabase.from('challenges').select('title').eq('id', challengeId).single();
  const challengeTitle = challenge?.title ?? 'Tournament';

  const bracket = JSON.parse(JSON.stringify(tour.bracket_data)) as TournamentBracketData;
  if (!bracket?.rounds?.length) throw new Error('Invalid bracket');

  const cr = tour.current_round;
  const roundIdx = bracket.rounds.findIndex(r => r.round === cr);
  if (roundIdx === -1) throw new Error('Invalid bracket state');

  const currentRound = bracket.rounds[roundIdx];
  const losers: string[] = [];
  const winners: string[] = [];

  for (const m of currentRound.matches) {
    const v1 = await fetchSubmissionVotes(m.submission1Id);
    const v2 = await fetchSubmissionVotes(m.submission2Id);
    m.votes1 = v1;
    m.votes2 = v2;

    let winUid: string | null = m.winnerId;

    if (!m.participant2Id && m.participant1Id) {
      winUid = m.participant1Id;
    } else if (m.participant1Id && m.participant2Id) {
      if (v1 > v2) winUid = m.participant1Id;
      else if (v2 > v1) winUid = m.participant2Id;
      else winUid = m.participant1Id;
    }

    m.winnerId = winUid;

    if (m.participant1Id && winUid !== m.participant1Id) losers.push(m.participant1Id);
    if (m.participant2Id && winUid !== m.participant2Id) losers.push(m.participant2Id);
    if (winUid) winners.push(winUid);
  }

  await insertParticipantNotifications(
    losers,
    'Tournament update',
    `You were eliminated in Round ${cr} of ${challengeTitle}`,
  );

  const uniqueWinners = [...new Set(winners)];

  if (uniqueWinners.length === 1) {
    await computeWinners(challengeId);
    await supabase
      .from('tournaments')
      .update({
        bracket_data: bracket as unknown as Record<string, unknown>,
        current_round: cr,
      })
      .eq('challenge_id', challengeId);
    return bracket;
  }

  await insertParticipantNotifications(
    uniqueWinners,
    'Tournament update',
    `You advanced to Round ${cr + 1} of ${challengeTitle}!`,
  );

  const { data: subs } = await supabase
    .from('submissions')
    .select('id, user_id')
    .eq('challenge_id', challengeId);

  const subIdByUser = new Map<string, string>();
  for (const s of subs ?? []) {
    if (!subIdByUser.has(s.user_id)) subIdByUser.set(s.user_id, s.id);
  }

  const nextRoundNum = cr + 1;
  const nextMatches: TournamentMatchJson[] = [];

  for (let i = 0; i < uniqueWinners.length; i += 2) {
    const wA = uniqueWinners[i];
    const wB = uniqueWinners[i + 1];
    const mid = `match_r${nextRoundNum}_${i}_${challengeId.slice(0, 8)}`;

    if (wB) {
      const s1 = subIdByUser.get(wA) ?? null;
      const s2 = subIdByUser.get(wB) ?? null;
      nextMatches.push({
        id: mid,
        participant1Id: wA,
        participant2Id: wB,
        submission1Id: s1,
        submission2Id: s2,
        votes1: await fetchSubmissionVotes(s1),
        votes2: await fetchSubmissionVotes(s2),
        winnerId: null,
      });
    } else if (wA) {
      const s1 = subIdByUser.get(wA) ?? null;
      nextMatches.push({
        id: mid,
        participant1Id: wA,
        participant2Id: null,
        submission1Id: s1,
        submission2Id: null,
        votes1: await fetchSubmissionVotes(s1),
        votes2: 0,
        winnerId: wA,
      });
    }
  }

  bracket.rounds.push({ round: nextRoundNum, matches: nextMatches });

  await supabase
    .from('tournaments')
    .update({
      bracket_data: bracket as unknown as Record<string, unknown>,
      current_round: nextRoundNum,
    })
    .eq('challenge_id', challengeId);

  return bracket;
}
