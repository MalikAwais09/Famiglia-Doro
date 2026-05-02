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
}

export type LeaderboardType = 'points' | 'wins';
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

  const orderCol = type === 'wins' ? 'wins' : 'points';
  q = q.order(orderCol, { ascending: false }).limit(50);

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
    .select('points, wins')
    .eq('id', session.user.id)
    .single();

  if (meErr || !me) return null;

  const myScore = type === 'wins' ? me.wins : me.points;
  const cutoff = periodCutoffIso(period);

  let countQuery =
    type === 'wins'
      ? supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('wins', myScore)
      : supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('points', myScore);

  if (cutoff) {
    countQuery = countQuery.gte('updated_at', cutoff);
  }

  const { count, error } = await countQuery;

  if (error) throw error;

  const rank = (count ?? 0) + 1;

  return { rank, points: me.points, wins: me.wins };
}
