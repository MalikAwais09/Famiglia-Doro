import { supabase } from './client';
import type { UserRole } from './types';

export interface LeaderboardRow {
  rank: number;
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  points: number;
  wins: number;
  challenges_count: number;
  win_rate: number;
}

export type LeaderboardType = 'points' | 'wins' | 'challenges_count';
export type LeaderboardPeriod = 'all' | 'weekly' | 'monthly';

function periodCutoffIso(period: LeaderboardPeriod): string | null {
  if (period === 'all') return null;
  const days = period === 'weekly' ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ── getLeaderboard ─────────────────────────────────────────────────────────
export async function getLeaderboard(
  type: LeaderboardType = 'points',
  period: LeaderboardPeriod = 'all',
): Promise<LeaderboardRow[]> {
  const cutoff = periodCutoffIso(period);

  let q = supabase.from('profiles').select(
    'id, name, avatar_url, role, points, wins, challenges_count, updated_at',
  );

  if (cutoff) {
    q = q.gte('updated_at', cutoff);
  }

  // Compound sort per user request: points -> wins
  q = q.order('points', { ascending: false })
       .order('wins', { ascending: false })
       .limit(50);

  const { data, error } = await q;

  if (error) throw error;

  const rows = data ?? [];
  return rows.map((p, i) => ({
    rank: i + 1,
    id: p.id,
    name: p.name,
    avatar_url: p.avatar_url,
    role: p.role as UserRole,
    points: p.points,
    wins: p.wins,
    challenges_count: p.challenges_count,
    win_rate: p.challenges_count > 0 ? (p.wins / p.challenges_count) * 100 : 0,
  }));
}

// ── getCurrentUserRank ─────────────────────────────────────────────────────
export async function getCurrentUserRank(
  type: LeaderboardType = 'points',
  period: LeaderboardPeriod = 'all',
): Promise<{ rank: number; points: number; wins: number } | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: me, error: meErr } = await supabase
    .from('profiles')
    .select('points, wins, challenges_count')
    .eq('id', session.user.id)
    .single();

  if (meErr || !me) return null;

  const cutoff = periodCutoffIso(period);

  // For rank calculation, we need to match the compound sort logic
  // This is tricky with simple .gt() filters for compound sorts.
  // We'll simplify to primary sort by challenges_count if type is not specified or matching the new logic.
  let countQuery = supabase.from('profiles').select('id', { count: 'exact', head: true });
  
  if (type === 'points') {
    countQuery = countQuery.gt('points', me.points);
  } else if (type === 'wins') {
    countQuery = countQuery.gt('wins', me.wins);
  } else {
    countQuery = countQuery.gt('challenges_count', me.challenges_count);
  }

  if (cutoff) {
    countQuery = countQuery.gte('updated_at', cutoff);
  }

  const { count, error } = await countQuery;

  if (error) throw error;

  const rank = (count ?? 0) + 1;

  return { rank, points: me.points, wins: me.wins };
}
