import { supabase } from './client';
import type {
  Challenge,
  ChallengeFilters,
  CreateChallengePayload,
  UpdateChallengePayload,
  ChallengePhase,
} from './types';

// ── Helper: compute phase from dates ─────────────────────────────────────
function computePhase(c: {
  registration_deadline: string | null;
  start_date: string | null;
  voting_end_date: string | null;
  phase: ChallengePhase;
}): ChallengePhase {
  const now = new Date();
  const reg = c.registration_deadline ? new Date(c.registration_deadline) : null;
  const start = c.start_date ? new Date(c.start_date) : null;
  const votingEnd = c.voting_end_date ? new Date(c.voting_end_date) : null;

  if (votingEnd && now > votingEnd) return 'completed';
  if (start && now > start) return 'voting';
  if (reg && now > reg) return 'entry_closed';
  if (reg && now <= reg) return 'entry_open';
  return c.phase; // fallback to stored phase
}

// ── getChallenges ─────────────────────────────────────────────────────────
export async function getChallenges(filters?: ChallengeFilters): Promise<Challenge[]> {
  let query = supabase
    .from('challenges')
    .select(`
      *,
      creator:profiles (
        id, name, avatar_url, role
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.format) query = query.eq('format', filters.format);
  if (filters?.phase) query = query.eq('phase', filters.phase);
  if (filters?.type === 'free') query = query.eq('entry_fee', 0);
  if (filters?.type === 'paid') query = query.gt('entry_fee', 0);
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as Challenge[];
}

// ── getChallengeById ──────────────────────────────────────────────────────
export async function getChallengeById(id: string): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      creator:profiles (
        id, name, avatar_url, role
      ),
      rules:challenge_rules (
        id, challenge_id, rule_text, order_index, created_at
      )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) return null;
  if (!data) return null;

  // Sort rules by order_index
  if (data.rules) {
    (data.rules as { order_index: number }[]).sort(
      (a, b) => a.order_index - b.order_index
    );
  }

  return data as Challenge;
}

// ── createChallenge ───────────────────────────────────────────────────────
export async function createChallenge(payload: CreateChallengePayload): Promise<Challenge> {
  // 1. Get current user
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // 2. Get user profile for balance check
  const { data: profile } = await supabase
    .from('profiles')
    .select('dorocoin_balance, role, challenges_count')
    .eq('id', userId)
    .single();

  if (!profile) throw new Error('Profile not found');

  const creationFee = profile.role === 'eliteHost' ? 0 : 50;

  if (creationFee > 0 && profile.dorocoin_balance < creationFee) {
    throw new Error(`Insufficient DoroCoins. You need ${creationFee} DC to create a challenge.`);
  }

  // 3. Insert challenge
  const { rules, ...challengeData } = payload;

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .insert({
      ...challengeData,
      created_by: userId,
      phase: payload.phase ?? 'upcoming',
      current_participants: 0,
      is_deleted: false,
    })
    .select()
    .single();

  if (challengeError) throw challengeError;

  // 4. Insert rules
  if (rules && rules.length > 0) {
    const ruleRows = rules.map((rule_text, index) => ({
      challenge_id: challenge.id,
      rule_text,
      order_index: index,
    }));
    const { error: rulesError } = await supabase
      .from('challenge_rules')
      .insert(ruleRows);
    if (rulesError) throw rulesError;
  }

  // 5. Deduct DoroCoins if applicable
  if (creationFee > 0) {
    const newBalance = profile.dorocoin_balance - creationFee;
    await supabase
      .from('profiles')
      .update({ dorocoin_balance: newBalance })
      .eq('id', userId);

    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'debit',
      amount: creationFee,
      description: `Challenge creation fee: ${challenge.title}`,
      balance_after: newBalance,
    });
  }

  // 6. Increment challenges_count
  const newCount = (profile.challenges_count || 0) + 1;
  await supabase.from('profiles').update({ challenges_count: newCount }).eq('id', userId);

  return challenge as Challenge;
}

// ── updateChallenge ───────────────────────────────────────────────────────
export async function updateChallenge(
  id: string,
  payload: UpdateChallengePayload
): Promise<Challenge> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Verify ownership and phase
  const { data: existing } = await supabase
    .from('challenges')
    .select('created_by, phase')
    .eq('id', id)
    .single();

  if (!existing) throw new Error('Challenge not found');
  if (existing.created_by !== userId) throw new Error('Not authorized');
  if (existing.phase !== 'upcoming') throw new Error('Can only edit challenges in upcoming phase');

  const { rules, ...updateData } = payload;

  const { data: updated, error } = await supabase
    .from('challenges')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Replace rules if provided
  if (rules !== undefined) {
    await supabase.from('challenge_rules').delete().eq('challenge_id', id);
    if (rules.length > 0) {
      await supabase.from('challenge_rules').insert(
        rules.map((rule_text, order_index) => ({ challenge_id: id, rule_text, order_index }))
      );
    }
  }

  return updated as Challenge;
}

// ── deleteChallenge ───────────────────────────────────────────────────────
export async function deleteChallenge(id: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Check ownership
  const { data: challenge } = await supabase
    .from('challenges')
    .select('created_by')
    .eq('id', id)
    .single();

  if (!challenge) throw new Error('Challenge not found');
  if (challenge.created_by !== userId) throw new Error('Not authorized');

  // Check no entries exist
  const { count } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('challenge_id', id);

  if (count && count > 0) throw new Error('Cannot delete a challenge that has entries');

  // Soft delete
  const { error } = await supabase
    .from('challenges')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ── uploadCoverImage ──────────────────────────────────────────────────────
export async function uploadCoverImage(
  challengeId: string,
  file: File
): Promise<string> {
  const timestamp = Date.now();
  const path = `${challengeId}/${timestamp}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('challenge-covers')
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('challenge-covers').getPublicUrl(path);
  const publicUrl = data.publicUrl;

  // Update challenge record
  await supabase
    .from('challenges')
    .update({ cover_image_url: publicUrl })
    .eq('id', challengeId);

  return publicUrl;
}

// ── updateChallengePhases ─────────────────────────────────────────────────
export async function updateChallengePhases(): Promise<void> {
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('id, phase, registration_deadline, start_date, voting_end_date')
    .eq('is_deleted', false)
    .neq('phase', 'completed');

  if (error || !challenges) return;

  const updates: { id: string; phase: ChallengePhase }[] = [];

  for (const c of challenges) {
    const newPhase = computePhase(c as Parameters<typeof computePhase>[0]);
    if (newPhase !== c.phase) {
      updates.push({ id: c.id, phase: newPhase });
    }
  }

  // Batch update
  await Promise.all(
    updates.map(({ id, phase }) =>
      supabase.from('challenges').update({ phase }).eq('id', id)
    )
  );
}

// ── getCategories ─────────────────────────────────────────────────────────
export async function getCategories(): Promise<{ category: string; count: number }[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('category')
    .eq('is_deleted', false)
    .not('category', 'is', null);

  if (error || !data) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.category) {
      counts[row.category] = (counts[row.category] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}
