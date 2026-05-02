import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import type { Notification } from './types';

export interface NotificationsResult {
  notifications: Notification[];
  unreadCount: number;
}

// ── getNotifications ─────────────────────────────────────────────────────
export async function getNotifications(): Promise<NotificationsResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { notifications: [], unreadCount: 0 };
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const notifications = (data ?? []) as Notification[];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount };
}

// ── markAsRead ─────────────────────────────────────────────────────────────
export async function markAsRead(notificationId: string): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', session.user.id);

  return !error;
}

// ── markAllAsRead ──────────────────────────────────────────────────────────
export async function markAllAsRead(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', session.user.id)
    .eq('is_read', false);

  return !error;
}

// ── getUnreadCount ─────────────────────────────────────────────────────────
export async function getUnreadCount(): Promise<number> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

// ── subscribeToNotifications ───────────────────────────────────────────────
export function subscribeToNotifications(
  userId: string,
  callback: (payload: { new: Record<string, unknown> }) => void,
): RealtimeChannel {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      payload => {
        callback(payload as { new: Record<string, unknown> });
      },
    )
    .subscribe();

  return channel;
}
