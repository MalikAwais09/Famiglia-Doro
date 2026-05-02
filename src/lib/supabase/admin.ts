import { supabase } from './client';
import { mergeChallengeCreators } from './challenges';
import type { AgreementType, ChallengePhase, Profile, TransactionType } from './types';

export type AdminUserRole = Profile['role'] | 'admin';

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function countTable(
  table: string,
  opts?: { filter?: (q: any) => any }
): Promise<number> {
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  if (opts?.filter) q = opts.filter(q);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function sumWallet(type: TransactionType): Promise<number> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('amount.sum()')
    .eq('type', type);
  if (error) throw error;
  const row = (data as any)?.[0];
  const sum = row?.sum ?? row?.amount?.sum ?? 0;
  return Number(sum) || 0;
}

export async function getDashboardStats() {
  const today = startOfTodayIso();

  const [
    totalUsers,
    totalChallenges,
    activeChallenges,
    totalSubmissions,
    totalVotes,
    totalAgreementsLogged,
    newUsersToday,
    newChallengesToday,
    totalDorocoinsCirculated,
  ] = await Promise.all([
    countTable('profiles'),
    countTable('challenges', { filter: (q) => q.eq('is_deleted', false) }),
    countTable('challenges', {
      filter: (q) =>
        q.eq('is_deleted', false).in('phase', ['active', 'voting', 'entry_open']),
    }),
    countTable('submissions'),
    countTable('votes'),
    countTable('agreements'),
    countTable('profiles', { filter: (q) => q.gte('created_at', today) }),
    countTable('challenges', { filter: (q) => q.gte('created_at', today) }),
    sumWallet('credit'),
  ]);

  return {
    totalUsers,
    totalChallenges,
    activeChallenges,
    totalSubmissions,
    totalVotes,
    totalDorocoinsCirculated,
    newUsersToday,
    newChallengesToday,
    totalAgreementsLogged,
  };
}

export async function getUsers(
  page: number,
  limit: number,
  search?: string,
  role?: AdminUserRole | 'All'
) {
  const from = page * limit;
  const to = from + limit - 1;

  let q = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search?.trim()) q = q.ilike('name', `%${search.trim()}%`);
  if (role && role !== 'All') q = q.eq('role', role);

  const { data, count, error } = await q;
  if (error) throw error;

  return { users: (data as Profile[]) ?? [], total: count ?? 0 };
}

export async function updateUserRole(userId: string, role: AdminUserRole) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
  return { success: true };
}

export async function banUser(userId: string) {
  const { error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', userId);
  if (error) throw error;
  return { success: true };
}

export async function unbanUser(userId: string) {
  const { error } = await supabase.from('profiles').update({ is_banned: false }).eq('id', userId);
  if (error) throw error;
  return { success: true };
}

export async function getAllChallenges(
  page: number,
  limit: number,
  phase?: ChallengePhase | 'All',
  search?: string
) {
  const from = page * limit;
  const to = from + limit - 1;

  let q = supabase
    .from('challenges')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (phase && phase !== 'All') q = q.eq('phase', phase);
  if (search?.trim()) q = q.ilike('title', `%${search.trim()}%`);

  const { data, count, error } = await q;
  if (error) throw error;
  const rows = data ?? [];
  const challenges = await mergeChallengeCreators(rows);
  return { challenges, total: count ?? 0 };
}

export async function overridePhase(challengeId: string, phase: ChallengePhase) {
  const { error } = await supabase.from('challenges').update({ phase }).eq('id', challengeId);
  if (error) throw error;
  return { success: true };
}

export async function deleteChallenge(challengeId: string) {
  const { error } = await supabase
    .from('challenges')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', challengeId);
  if (error) throw error;
  return { success: true };
}

export async function getTransactions(
  page: number,
  limit: number,
  type?: TransactionType | 'All'
) {
  const from = page * limit;
  const to = from + limit - 1;

  let q = supabase
    .from('wallet_transactions')
    .select(
      `
      *,
      user:profiles!wallet_transactions_user_id_fkey(id, name, avatar_url, role)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (type && type !== 'All') q = q.eq('type', type);

  const { data, count, error } = await q;
  if (error) throw error;
  return { transactions: data ?? [], total: count ?? 0 };
}

export async function getAgreementLogs(
  page: number,
  limit: number,
  agreementType?: AgreementType | 'All'
) {
  const from = page * limit;
  const to = from + limit - 1;

  let q = supabase
    .from('agreements')
    .select(
      `
      *,
      user:profiles!agreements_user_id_fkey(id, name, avatar_url, role)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (agreementType && agreementType !== 'All') q = q.eq('agreement_type', agreementType);

  const { data, count, error } = await q;
  if (error) throw error;
  return { agreements: data ?? [], total: count ?? 0 };
}

export async function getFraudFlags() {
  // Group votes by voter_id + challenge_id and count votes.
  const { data, error } = await supabase
    .from('votes')
    .select('voter_id, challenge_id, count:id');
  if (error) throw error;

  const grouped = (data as any[] | null) ?? [];
  const flagged = grouped
    .map((r) => ({
      voter_id: r.voter_id as string,
      challenge_id: r.challenge_id as string,
      vote_count: Number(r.count) || 0,
    }))
    .filter((r) => r.vote_count > 20);

  if (flagged.length === 0) return [];

  const voterIds = Array.from(new Set(flagged.map((f) => f.voter_id)));
  const challengeIds = Array.from(new Set(flagged.map((f) => f.challenge_id)));

  const [{ data: users }, { data: challenges }] = await Promise.all([
    supabase.from('profiles').select('id, name, avatar_url, role, is_banned').in('id', voterIds),
    supabase.from('challenges').select('id, title, cover_image_url, created_by').in('id', challengeIds),
  ]);

  const userById = Object.fromEntries((users ?? []).map((u: any) => [u.id, u]));
  const chById = Object.fromEntries((challenges ?? []).map((c: any) => [c.id, c]));

  return flagged.map((f) => ({
    ...f,
    user: userById[f.voter_id] ?? null,
    challenge: chById[f.challenge_id] ?? null,
  }));
}

