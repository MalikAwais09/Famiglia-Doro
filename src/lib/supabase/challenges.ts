import { supabase } from './client';
import { formatRelativeTime } from '@/lib/utils/dateUtils';
import type { Challenge, ChallengePhase, ChallengeFilters, CreateChallengePayload, UpdateChallengePayload } from './types';

// ── getEntryCountForChallenge ─────────────────────────────────────────────
export async function getEntryCountForChallenge(challengeId: string): Promise<number> {
  const { count, error } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('challenge_id', challengeId);

  if (error) throw error;
  return count ?? 0;
}

// ── Voting / results schedule (end_date + 7 / + 9 days) ───────────────────
export function votingEndFromEndDate(endDateIso: string): string {
  const end = new Date(endDateIso);
  const d = new Date(end);
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

export function resultsDateFromEndDate(endDateIso: string): string {
  const end = new Date(endDateIso);
  const d = new Date(end);
  d.setDate(d.getDate() + 9);
  return d.toISOString();
}

function parseMs(d: unknown): number | null {
  if (d == null || d === '') return null;
  const t = new Date(d as string).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Effective voting end: stored column or end_date + 7 days */
export function effectiveVotingEndMs(challenge: { end_date?: string | null; voting_end_date?: string | null }): number | null {
  const stored = parseMs(challenge.voting_end_date);
  if (stored != null) return stored;
  const end = parseMs(challenge.end_date);
  if (end == null) return null;
  return new Date(votingEndFromEndDate(challenge.end_date as string)).getTime();
}

// ── computePhase ──────────────────────────────────────────────────────────
export function computePhase(challenge: any): ChallengePhase {
  const now = Date.now();

  const reg = parseMs(challenge.registration_deadline);
  const start = parseMs(challenge.start_date);
  const end = parseMs(challenge.end_date);
  const vEnd = effectiveVotingEndMs(challenge);

  if (reg != null && now < reg) return 'upcoming';

  if (reg != null && start != null && now >= reg && now < start) return 'entry_closed';

  if (start != null && end != null && now >= start && now < end) return 'active';

  if (end != null && vEnd != null && now >= end && now < vEnd) return 'voting';

  if (vEnd != null && now >= vEnd) return 'completed';

  if (start != null && end == null && now >= start) return 'active';

  if (start == null && end != null && now < end) return 'active';

  return 'entry_open';
}

/** One-line countdown / status for list cards and detail timeline */
export function getChallengeListCountdownLine(challenge: Challenge | Record<string, unknown>): string {
  const ch = challenge as Challenge;
  const phase = computePhase(ch);
  const reg = ch.registration_deadline;
  const start = ch.start_date;
  const end = ch.end_date;
  const vEndIso =
    ch.voting_end_date ||
    (ch.end_date ? votingEndFromEndDate(ch.end_date) : null);

  try {
    switch (phase) {
      case 'upcoming':
        return reg ? `Entries close ${formatRelativeTime(reg)}` : '';
      case 'entry_open':
        return reg ? `Entries close ${formatRelativeTime(reg)}` : '';
      case 'entry_closed':
        return start ? `Challenge starts ${formatRelativeTime(start)}` : '';
      case 'active':
        return end ? `Submissions close ${formatRelativeTime(end)}` : '';
      case 'voting':
        return vEndIso ? `Voting ends ${formatRelativeTime(vEndIso)}` : '';
      case 'completed': {
        const anchor = vEndIso || end;
        return anchor ? `Ended ${formatRelativeTime(anchor)}` : 'Ended';
      }
      default:
        return '';
    }
  } catch {
    return '';
  }
}

export function getPhaseBadgeLabel(phase: ChallengePhase): string {
  const labels: Record<ChallengePhase, string> = {
    upcoming: 'Upcoming',
    entry_open: 'Entries Open',
    entry_closed: 'Entries Closed',
    active: 'Active',
    voting: 'Voting Open',
    completed: 'Completed',
  };
  return labels[phase] ?? String(phase);
}

export function getPhaseBadgeVariant(
  phase: ChallengePhase
): 'default' | 'success' | 'warning' | 'info' | 'gold' {
  switch (phase) {
    case 'entry_open':
      return 'success';
    case 'active':
      return 'info';
    case 'entry_closed':
      return 'warning';
    case 'voting':
      return 'warning';
    case 'upcoming':
      return 'default';
    case 'completed':
      return 'default';
    default:
      return 'default';
  }
}

// ── getChallenges ────────────────────────────────────────────────────────
export async function getChallenges(filters?: ChallengeFilters): Promise<Challenge[]> {
  let query = supabase
    .from('challenges')
    .select(`
      *,
      creator:profiles!challenges_created_by_fkey(id, name, avatar_url, role)
    `)
    .eq('is_deleted', false);

  if (filters?.category && filters.category !== 'All') {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  const rows = data || [];
  const counts = await Promise.all(
    rows.map(async (ch) => {
      const n = await getEntryCountForChallenge(ch.id);
      return [ch.id, n] as const;
    })
  );
  const countById = Object.fromEntries(counts) as Record<string, number>;

  let challenges = rows.map((ch) => {
    const current_participants = countById[ch.id] ?? 0;
    return {
      ...ch,
      current_participants,
      phase: computePhase({ ...ch, current_participants }),
    };
  }) as Challenge[];

  if (filters?.phase) {
    challenges = challenges.filter(c => c.phase === filters.phase);
  }

  return challenges;
}

// ── getChallengeById ──────────────────────────────────────────────────────
export async function getChallengeById(id: string): Promise<Challenge> {
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      creator:profiles!challenges_created_by_fkey(id, name, avatar_url, role),
      rules:challenge_rules(*)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Challenge not found');

  const current_participants = await getEntryCountForChallenge(id);

  return {
    ...data,
    current_participants,
    phase: computePhase({ ...data, current_participants }),
    rules: data.rules || [],
  } as Challenge;
}

// ── createChallenge ───────────────────────────────────────────────────────
export async function createChallenge(payload: CreateChallengePayload): Promise<Challenge> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { rules, phase: _payloadPhase, voting_end_date: _ve, results_date: _rd, ...rest } = payload;

  if (!rest.end_date) throw new Error('end_date is required');

  const voting_end_date = votingEndFromEndDate(rest.end_date);
  const results_date = resultsDateFromEndDate(rest.end_date);

  const rowForPhase = {
    ...rest,
    voting_end_date,
    results_date,
    current_participants: 0,
  };

  const phase = computePhase(rowForPhase);

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .insert({
      ...rest,
      voting_end_date,
      results_date,
      created_by: userId,
      current_participants: 0,
      phase,
    })
    .select()
    .single();

  if (challengeError) throw challengeError;

  if (rules && rules.length > 0) {
    const rulesToInsert = rules.map((text, index) => ({
      challenge_id: challenge.id,
      rule_text: text,
      order_index: index,
    }));

    const { error: rulesError } = await supabase.from('challenge_rules').insert(rulesToInsert);

    if (rulesError) throw rulesError;
  }

  return getChallengeById(challenge.id);
}

// ── uploadCoverImage ──────────────────────────────────────────────────────
export async function uploadCoverImage(challengeId: string, file: File): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const path = `${userId}/${challengeId}/cover-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('challenge-covers').upload(path, file, {
    upsert: true,
  });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from('challenge-covers').getPublicUrl(path);
  const url = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from('challenges')
    .update({ cover_image_url: url })
    .eq('id', challengeId)
    .eq('created_by', userId);

  if (updateError) throw updateError;

  return url;
}

// ── updateChallenge ───────────────────────────────────────────────────────
export async function updateChallenge(id: string, payload: UpdateChallengePayload): Promise<Challenge> {
  const { rules, ...challengeData } = payload;

  let voting_end_date = challengeData.voting_end_date;
  let results_date = challengeData.results_date;

  if (challengeData.end_date) {
    if (voting_end_date === undefined) {
      voting_end_date = votingEndFromEndDate(challengeData.end_date);
    }
    if (results_date === undefined) {
      results_date = resultsDateFromEndDate(challengeData.end_date);
    }
  }

  const updatePayload: Record<string, unknown> = { ...challengeData };
  if (voting_end_date !== undefined) updatePayload.voting_end_date = voting_end_date;
  if (results_date !== undefined) updatePayload.results_date = results_date;

  const shouldRecomputePhase =
    challengeData.end_date !== undefined ||
    challengeData.start_date !== undefined ||
    challengeData.registration_deadline !== undefined ||
    challengeData.voting_end_date !== undefined ||
    challengeData.results_date !== undefined;

  if (shouldRecomputePhase) {
    const { data: existing } = await supabase
      .from('challenges')
      .select('registration_deadline, start_date, end_date, voting_end_date, results_date, current_participants')
      .eq('id', id)
      .single();

    if (existing) {
      const merged = {
        ...existing,
        ...updatePayload,
        voting_end_date: (updatePayload.voting_end_date as string | undefined) ?? existing.voting_end_date,
        results_date: (updatePayload.results_date as string | undefined) ?? existing.results_date,
      };
      updatePayload.phase = computePhase(merged);
    }
  }

  const { error: updateError } = await supabase.from('challenges').update(updatePayload).eq('id', id);

  if (updateError) throw updateError;

  if (rules) {
    await supabase.from('challenge_rules').delete().eq('challenge_id', id);
    if (rules.length > 0) {
      const rulesToInsert = rules.map((text, index) => ({
        challenge_id: id,
        rule_text: text,
        order_index: index,
      }));
      await supabase.from('challenge_rules').insert(rulesToInsert);
    }
  }

  return getChallengeById(id);
}

// ── deleteChallenge ───────────────────────────────────────────────────────
export async function deleteChallenge(id: string): Promise<void> {
  const { error } = await supabase
    .from('challenges')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}
