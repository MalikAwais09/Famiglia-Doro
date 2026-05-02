import { supabase } from './client';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';
import { computePhase } from '@/lib/supabase/challenges';
import type { Submission, ContentType, Profile } from './types';

interface SubmitWorkData {
  title: string;
  description?: string;
  content_type: ContentType;
  content_url?: string;
  file?: File;
}

// ── submitWork ────────────────────────────────────────────────────────────
export async function submitWork(challengeId: string, data: SubmitWorkData): Promise<Submission> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: challenge } = await supabase
    .from('challenges')
    .select('title, created_by, start_date, end_date, phase')
    .eq('id', challengeId)
    .single();

  if (!challenge) throw new Error('Challenge not found');

  const nowMs = Date.now();

  if (challenge.start_date) {
    const startMs = new Date(challenge.start_date).getTime();
    if (nowMs < startMs) {
      throw new Error(
        `Submissions open on ${formatLocalDateTime(challenge.start_date)}. Please wait until the challenge starts.`
      );
    }
  }

  if (challenge.end_date && nowMs > new Date(challenge.end_date).getTime()) {
    throw new Error('Submission deadline has passed for this challenge.');
  }

  // Verify entry
  const { data: entry } = await supabase
    .from('entries')
    .select('id')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .single();

  if (!entry) throw new Error('You must enter the challenge before submitting work');

  // Verify no previous submission
  const { count } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);

  if (count && count > 0) throw new Error('You have already submitted work for this challenge');

  let finalContentUrl = data.content_url || null;

  // Handle file upload
  if (data.file && (data.content_type === 'image' || data.content_type === 'video')) {
    const timestamp = Date.now();
    const path = `${challengeId}/${userId}/${timestamp}-${data.file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(path, data.file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('submissions').getPublicUrl(path);
    finalContentUrl = publicUrlData.publicUrl;
  }

  if (!finalContentUrl && data.content_type !== 'text') {
    throw new Error('Content URL or file is required for this submission type');
  }

  // Insert submission
  const { data: submission, error: submitError } = await supabase
    .from('submissions')
    .insert({
      entry_id: entry.id,
      user_id: userId,
      challenge_id: challengeId,
      title: data.title,
      description: data.description || null,
      content_type: data.content_type,
      content_url: finalContentUrl,
    })
    .select()
    .single();

  if (submitError) throw submitError;

  if (challenge.created_by !== userId) {
    const { data: me } = await supabase.from('profiles').select('name').eq('id', userId).single();
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: challenge.created_by,
      title: 'New Submission',
      message: `${me?.name || 'Someone'} submitted to your challenge ${challenge.title}`,
      type: 'new_submission',
      is_read: false,
    });
    if (notifError) {
      console.error('Notification insert failed:', notifError);
    }
  }

  return submission as Submission;
}

// ── getSubmissions ────────────────────────────────────────────────────────
export async function getSubmissions(challengeId: string): Promise<(Submission & { user: Profile })[]> {
  const { data: challengeRow } = await supabase
    .from('challenges')
    .select('phase, registration_deadline, start_date, end_date, voting_end_date, results_date')
    .eq('id', challengeId)
    .single();

  const effectivePhase = challengeRow ? computePhase(challengeRow) : null;

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      user:profiles (id, name, avatar_url, role)
    `)
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  let subs = (data ?? []) as (Submission & { user: Profile })[];

  if (effectivePhase === 'voting') {
    subs = subs.sort(() => Math.random() - 0.5);
  } else if (effectivePhase === 'completed') {
    // Sort by votes if completed
    subs = subs.sort((a, b) => b.votes_count - a.votes_count);
  }

  return subs;
}

// ── getMySubmission ───────────────────────────────────────────────────────
export async function getMySubmission(challengeId: string): Promise<Submission | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as Submission;
}

// ── updateSubmission ──────────────────────────────────────────────────────
export async function updateSubmission(submissionId: string, data: { title: string; description?: string }): Promise<Submission> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('submissions')
    .select('user_id, challenge_id')
    .eq('id', submissionId)
    .single();

  if (!existing) throw new Error('Submission not found');
  if (existing.user_id !== userId) throw new Error('Not authorized');

  const { data: challengeRow } = await supabase
    .from('challenges')
    .select('phase, end_date, registration_deadline, start_date, voting_end_date, results_date')
    .eq('id', existing.challenge_id)
    .single();

  const p = challengeRow ? computePhase(challengeRow) : null;

  if (challengeRow && challengeRow.end_date && new Date() > new Date(challengeRow.end_date)) {
    throw new Error('Cannot update submission after the challenge has ended');
  }

  if (p === 'voting' || p === 'completed') {
    throw new Error('Cannot update submission after voting has started');
  }

  const { data: updated, error } = await supabase
    .from('submissions')
    .update({
      title: data.title,
      description: data.description || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;
  return updated as Submission;
}
