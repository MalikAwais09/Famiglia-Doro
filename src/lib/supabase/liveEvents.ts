import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import type { LiveEvent, Profile } from './types';

export interface LiveEventWithCreator extends LiveEvent {
  creator?: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null;
}

export type LiveEventStatusFilter = 'upcoming' | 'live' | 'ended';

async function attachCreators<T extends { created_by: string }>(rows: T[]): Promise<(T & { creator: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null })[]> {
  if (!rows.length) return [];
  const ids = [...new Set(rows.map(r => r.created_by))];
  const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', ids);
  const pmap = new Map((profiles ?? []).map(p => [p.id, p]));
  return rows.map(r => ({
    ...r,
    creator: pmap.get(r.created_by) ?? null,
  }));
}

// ── getLiveEvents ──────────────────────────────────────────────────────────
export async function getLiveEvents(status?: LiveEventStatusFilter): Promise<LiveEventWithCreator[]> {
  let q = supabase.from('live_events').select('*').order('starts_at', { ascending: true, nullsFirst: false });

  if (status) {
    q = q.eq('status', status);
  }

  const { data, error } = await q;

  if (error) throw error;

  const rows = (data ?? []) as LiveEvent[];
  const withCreators = await attachCreators(rows);
  return withCreators.map(r => {
    const { creator, ...rest } = r;
    return { ...(rest as LiveEvent), creator };
  }) as LiveEventWithCreator[];
}

// ── getLiveEventById ───────────────────────────────────────────────────────
export async function getLiveEventById(id: string): Promise<LiveEventWithCreator | null> {
  const { data, error } = await supabase.from('live_events').select('*').eq('id', id).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as LiveEvent;
  const [withCreator] = await attachCreators([row]);
  const out = {
    ...withCreator,
    creator: withCreator.creator,
  } as LiveEventWithCreator;

  if (out.status !== 'live') {
    return { ...out, stream_url: null };
  }
  return out;
}

export interface CreateLiveEventInput {
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  stream_url?: string | null;
  starts_at?: string | null;
}

// ── createLiveEvent ────────────────────────────────────────────────────────
export async function createLiveEvent(data: CreateLiveEventInput): Promise<LiveEventWithCreator> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (pErr || !profile) throw new Error('Profile not found');
  if (profile.role !== 'eliteHost') throw new Error('Only Elite Hosts can create live events');

  const { data: inserted, error } = await supabase
    .from('live_events')
    .insert({
      title: data.title,
      description: data.description ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      stream_url: data.stream_url ?? null,
      starts_at: data.starts_at ?? null,
      status: 'upcoming',
      created_by: session.user.id,
    })
    .select('*')
    .single();

  if (error) throw error;

  const [mapped] = await attachCreators([inserted as LiveEvent]);
  return mapped as LiveEventWithCreator;
}

// ── updateEventStatus ────────────────────────────────────────────────────────
export async function updateEventStatus(id: string, status: 'live' | 'ended'): Promise<LiveEventWithCreator> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data: updated, error } = await supabase
    .from('live_events')
    .update({ status })
    .eq('id', id)
    .eq('created_by', session.user.id)
    .select('*')
    .single();

  if (error) throw error;
  if (!updated) throw new Error('Event not found or not authorized');

  const [mapped] = await attachCreators([updated as LiveEvent]);
  const row = mapped as LiveEventWithCreator;
  if (row.status !== 'live') {
    return { ...row, stream_url: null };
  }
  return row;
}

// ── subscribeToLiveEvent ───────────────────────────────────────────────────
export function subscribeToLiveEvent(
  eventId: string,
  callback: (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`live_event:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_events',
        filter: `id=eq.${eventId}`,
      },
      payload => {
        callback(payload as { new: Record<string, unknown>; old: Record<string, unknown> });
      },
    )
    .subscribe();

  return channel;
}
