import { supabase } from './client';
import type { Challenge, ChallengePhase, ChallengeFilters, CreateChallengePayload, UpdateChallengePayload } from './types';

// ── computePhase ──────────────────────────────────────────────────────────
export function computePhase(challenge: any): ChallengePhase {
  // Use timestamps for reliable comparison across timezones
  const now = Date.now();
  
  const parse = (d: any) => d ? new Date(d).getTime() : null;
  
  const reg = parse(challenge.registration_deadline);
  const start = parse(challenge.start_date);
  const end = parse(challenge.end_date);
  const vEnd = parse(challenge.voting_end_date);

  // Debugging (optional, removed for production cleanliness)
  // if (votingEnd && now > votingEnd) return 'completed';
  
  // Phase logic:
  // 1. Completed: Voting period has ended
  if (vEnd && now > vEnd) return 'completed';
  
  // 2. Voting: Challenge period has ended, but voting is still active
  if (end && now > end) return 'voting';
  
  // 3. On Going: Challenge has started (past start_date) but not yet ended
  if (start && now > start) return 'on_going';
  
  // 4. Closed: Registration deadline has passed, but challenge hasn't started yet
  if (reg && now > reg) return 'closed';
  
  // 5. Entry Open: Default state if registration deadline is in the future
  // Note: We could add an 'upcoming' phase here if we had a 'registration_starts_at' field
  return 'entry_open';
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

  let challenges = (data || []).map(ch => ({
    ...ch,
    phase: computePhase(ch)
  })) as Challenge[];

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
    .single();

  if (error) throw error;
  if (!data) throw new Error('Challenge not found');

  return {
    ...data,
    phase: computePhase(data),
    rules: data.rules || [],
  } as Challenge;
}

// ── createChallenge ───────────────────────────────────────────────────────
export async function createChallenge(payload: CreateChallengePayload): Promise<Challenge> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { rules, ...challengeData } = payload;

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .insert({
      ...challengeData,
      created_by: userId,
      current_participants: 0,
      phase: 'entry_open' // Initial phase
    })
    .select()
    .single();

  if (challengeError) throw challengeError;

  if (rules && rules.length > 0) {
    const rulesToInsert = rules.map((text, index) => ({
      challenge_id: challenge.id,
      rule_text: text,
      order_index: index
    }));

    const { error: rulesError } = await supabase
      .from('challenge_rules')
      .insert(rulesToInsert);

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

  const { error: updateError } = await supabase
    .from('challenges')
    .update(challengeData)
    .eq('id', id);

  if (updateError) throw updateError;

  if (rules) {
    // Replace rules
    await supabase.from('challenge_rules').delete().eq('challenge_id', id);
    if (rules.length > 0) {
      const rulesToInsert = rules.map((text, index) => ({
        challenge_id: id,
        rule_text: text,
        order_index: index
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
