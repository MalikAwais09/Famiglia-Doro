import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getTransactions } from '@/lib/supabase/admin';
import type { TransactionType } from '@/lib/supabase/types';

const PAGE_SIZE = 20;
const TYPES: (TransactionType | 'All')[] = ['All', 'credit', 'debit'];

function typeVariant(t: string) {
  return t === 'credit' ? 'success' : t === 'debit' ? 'error' : 'default';
}

export function AdminTransactions() {
  const [page, setPage] = useState(0);
  const [type, setType] = useState<(typeof TYPES)[number]>('All');
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totals = useMemo(() => {
    const credits = rows.filter((r) => r.type === 'credit').reduce((s, r) => s + (r.amount || 0), 0);
    const debits = rows.filter((r) => r.type === 'debit').reduce((s, r) => s + (r.amount || 0), 0);
    return { credits, debits, net: credits - debits };
  }, [rows]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTransactions(page, PAGE_SIZE, type);
      setRows(res.transactions ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Transactions</h1>
          <p className="text-xs text-[#6B7280]">{total.toLocaleString()} total</p>
        </div>
        <select
          value={type}
          onChange={(e) => {
            setPage(0);
            setType(e.target.value as any);
          }}
          className="h-10 px-3 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-sm text-white"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All types' : t}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="text-[#9CA3AF]">
            Total Credits: <span className="text-emerald-400 font-medium">{totals.credits.toLocaleString()} DC</span>
          </span>
          <span className="text-[#9CA3AF]">
            Total Debits: <span className="text-red-400 font-medium">{totals.debits.toLocaleString()} DC</span>
          </span>
          <span className="text-[#9CA3AF]">
            Net: <span className="text-white font-medium">{totals.net.toLocaleString()} DC</span>
          </span>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#161618] text-[#9CA3AF]">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-right px-4 py-3">Balance After</th>
                <th className="text-left px-4 py-3">Date/Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[#6B7280]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[#6B7280]">
                    No transactions found
                  </td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t.id} className="border-t border-[rgba(255,255,255,0.06)]">
                    <td className="px-4 py-3">{t.user?.name ?? 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={typeVariant(t.type)}>{t.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{Number(t.amount ?? 0).toLocaleString()} DC</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{t.description ?? ''}</td>
                    <td className="px-4 py-3 text-right">{Number(t.balance_after ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{new Date(t.created_at).toLocaleString()}</td>
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

