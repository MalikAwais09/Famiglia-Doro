import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAgreementLogs } from '@/lib/supabase/admin';
import type { AgreementType } from '@/lib/supabase/types';

const PAGE_SIZE = 20;
const TYPES: (AgreementType | 'All')[] = [
  'All',
  'master_account',
  'challenge_entry',
  'paid_voting',
  'dorocoin_purchase',
  'creator',
  'sponsor',
  'live_event',
  'winner_claim',
  'anti_fraud',
  'geo_compliance',
];

function badgeVariant(type: string) {
  if (type === 'master_account') return 'default';
  if (type === 'challenge_entry') return 'success';
  if (type === 'paid_voting') return 'warning';
  if (type === 'dorocoin_purchase') return 'gold';
  if (type === 'anti_fraud') return 'error';
  if (type === 'geo_compliance') return 'info';
  return 'default';
}

export function AdminAgreements() {
  const [page, setPage] = useState(0);
  const [type, setType] = useState<(typeof TYPES)[number]>('All');
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAgreementLogs(page, PAGE_SIZE, type);
      setRows(res.agreements ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load agreements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type]);

  const exportCSV = () => {
    const csv = rows
      .map((a) =>
        `${(a.user?.name ?? '').replace(/,/g, ' ')},${a.agreement_type},${a.version},${a.ip_address ?? ''},${a.created_at}`
      )
      .join('\n');
    const blob = new Blob([`User,Type,Version,IP,Date\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = 'agreements.csv';
    el.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Agreements</h1>
          <p className="text-xs text-[#6B7280]">{total.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
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
          <Button variant="secondary" onClick={exportCSV} disabled={rows.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#161618] text-[#9CA3AF]">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Agreement Type</th>
                <th className="text-left px-4 py-3">Version</th>
                <th className="text-left px-4 py-3">IP</th>
                <th className="text-left px-4 py-3">Date/Time</th>
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
                  <td colSpan={5} className="px-4 py-10 text-center text-[#6B7280]">
                    No agreements found
                  </td>
                </tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id} className="border-t border-[rgba(255,255,255,0.06)]">
                    <td className="px-4 py-3">{a.user?.name ?? 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={badgeVariant(a.agreement_type)}>{a.agreement_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{a.version}</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{a.ip_address ?? ''}</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{new Date(a.created_at).toLocaleString()}</td>
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

