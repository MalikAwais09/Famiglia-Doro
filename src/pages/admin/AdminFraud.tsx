import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2 } from 'lucide-react';
import { banUser, getFraudFlags } from '@/lib/supabase/admin';

export function AdminFraud() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getFraudFlags();
      setRows(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load fraud flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onBan = async (userId: string, name?: string | null) => {
    if (!confirm(`Ban ${name ?? 'this user'}?`)) return;
    try {
      await banUser(userId);
      toast.success('User banned');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to ban user');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Fraud Flags</h1>
        <p className="text-xs text-[#6B7280]">Users who voted more than 20 times in one challenge</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#161618] text-[#9CA3AF]">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Challenge</th>
                <th className="text-right px-4 py-3">Vote Count</th>
                <th className="text-left px-4 py-3">Reason</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[#6B7280]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle2 size={18} />
                      No suspicious activity detected
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${r.voter_id}:${r.challenge_id}`} className="border-t border-[rgba(255,255,255,0.06)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            r.user?.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.voter_id}`
                          }
                          alt=""
                          className="w-8 h-8 rounded-full bg-[#161618]"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.user?.name ?? 'Unknown'}</p>
                          {r.user?.is_banned ? (
                            <Badge variant="error" className="mt-1">Banned</Badge>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{r.challenge?.title ?? 'Unknown'}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="warning">{r.vote_count}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF]">
                      Voted {r.vote_count} times in one challenge
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!!r.user?.is_banned}
                        onClick={() => void onBan(r.voter_id, r.user?.name)}
                      >
                        Ban User
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

