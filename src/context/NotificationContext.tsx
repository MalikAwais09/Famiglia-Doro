import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
  getNotifications,
  markAsRead as dbMarkAsRead,
  markAllAsRead as dbMarkAllAsRead,
  subscribeToNotifications,
} from '@/lib/supabase/notifications';
import type { Notification as DbNotification } from '@/lib/supabase/types';
import type { Notification } from '@/types';

function mapNotification(n: DbNotification): Notification {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: (n.type as Notification['type']) || 'info',
    read: n.is_read,
    createdAt: n.created_at,
    link: undefined,
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { notifications: rows, unreadCount: uc } = await getNotifications();
      setNotifications(rows.map(mapNotification));
      setUnreadCount(uc);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = subscribeToNotifications(user.id, async payload => {
      const row = payload.new as Record<string, unknown>;
      const title = typeof row.title === 'string' ? row.title : 'Notification';
      const message = typeof row.message === 'string' ? row.message : '';
      const typ = typeof row.type === 'string' ? row.type : 'info';

      if (typ === 'success') {
        toast.success(title, { description: message });
      } else if (typ === 'error') {
        toast.error(title, { description: message });
      } else {
        toast.info(title, { description: message });
      }

      try {
        const res = await getNotifications();
        setNotifications(res.notifications.map(mapNotification));
        setUnreadCount(res.unreadCount);
      } catch {
        /* ignore */
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = useCallback(
    async (id: string) => {
      const ok = await dbMarkAsRead(id);
      if (ok) await refresh();
    },
    [refresh],
  );

  const markAllAsRead = useCallback(async () => {
    const ok = await dbMarkAllAsRead();
    if (ok) await refresh();
  }, [refresh]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
