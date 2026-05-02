import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { banUser, getUsers, unbanUser, updateUserRole, type AdminUserRole } from '@/lib/supabase/admin';
import type { Profile } from '@/lib/supabase/types';

const PAGE_SIZE = 20;
const ROLES: (AdminUserRole | 'All')[] = ['All', 'free', 'creatorPro', 'eliteHost', 'admin'];

function roleVariant(role: string) {
  if (role === 'admin') return 'gold';
  if (role === 'eliteHost') return 'gold';
  if (role === 'creatorPro') return 'warning';
  return 'default';
}

export function AdminUsers() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('All');
  const [rows, setRows] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getUsers(page, PAGE_SIZE, search, role);
      setRows(res.users as Profile[]);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role, search]);

  const onChangeRole = async (u: Profile, nextRole: AdminUserRole) => {
    if (u.role === nextRole) return;
    if (!confirm(`Change role for ${u.name ?? 'User'} to ${nextRole}?`)) return;
    try {
      await updateUserRole(u.id, nextRole);
      toast.success('Role updated');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update role');
    }
  };

  const onBanToggle = async (u: Profile) => {
    const name = u.name ?? 'User';
    if (!u.is_banned) {
      if (!confirm(`Ban ${name}?`)) return;
      try {
        await banUser(u.id);
        toast.success('User banned');
        void load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to ban user');
      }
    } else {
      if (!confirm(`Unban ${name}?`)) return;
      try {
        await unbanUser(u.id);
        toast.success('User unbanned');
        void load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to unban user');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-xs text-[#6B7280]">{total.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
          />
          <select
            value={role}
            onChange={(e) => {
              setPage(0);
              setRole(e.target.value as any);
            }}
            className="h-10 px-3 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-sm text-white"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r === 'All' ? 'All roles' : r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#161618] text-[#9CA3AF]">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-right px-4 py-3">Points</th>
                <th className="text-right px-4 py-3">Wins</th>
                <th className="text-right px-4 py-3">DoroCoins</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#6B7280]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#6B7280]">
                    No users found
                  </td>
                </tr>
              ) : (
                rows.map((u) => (
                  <tr key={u.id} className="border-t border-[rgba(255,255,255,0.06)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`
                          }
                          alt=""
                          className="w-8 h-8 rounded-full bg-[#161618]"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.name ?? 'User'}</p>
                          <p className="text-[10px] text-[#6B7280] truncate">{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={roleVariant(u.role)}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{u.points.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{u.wins.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{u.dorocoin_balance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_banned ? 'error' : 'success'}>
                        {u.is_banned ? 'Banned' : 'Active'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <select
                          value={u.role}
                          onChange={(e) => void onChangeRole(u, e.target.value as AdminUserRole)}
                          className="h-8 px-2 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-xs text-white"
                        >
                          {ROLES.filter((r) => r !== 'All').map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant={u.is_banned ? 'secondary' : 'danger'}
                          onClick={() => void onBanToggle(u)}
                        >
                          {u.is_banned ? 'Unban' : 'Ban'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B7280]">
          Page {page + 1} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

