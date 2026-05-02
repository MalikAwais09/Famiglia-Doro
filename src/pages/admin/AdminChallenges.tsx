import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { deleteChallenge, getAllChallenges, overridePhase } from '@/lib/supabase/admin';
import { computePhase, getPhaseBadgeLabel, getPhaseBadgeVariant } from '@/lib/supabase/challenges';
import type { ChallengePhase } from '@/lib/supabase/types';

const PAGE_SIZE = 20;
const PHASES: (ChallengePhase | 'All')[] = [
  'All',
  'upcoming',
  'entry_open',
  'entry_closed',
  'active',
  'voting',
  'completed',
];

export function AdminChallenges() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [phase, setPhase] = useState<(typeof PHASES)[number]>('All');
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllChallenges(page, PAGE_SIZE, phase, search);
      setRows(res.challenges ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, phase, search]);

  const onOverride = async (ch: any, next: ChallengePhase) => {
    if (!confirm(`Override phase for "${ch.title}" to "${next}"?`)) return;
    try {
      await overridePhase(ch.id, next);
      toast.success('Phase updated');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update phase');
    }
  };

  const onDelete = async (ch: any) => {
    if (!confirm(`Soft delete "${ch.title}"?`)) return;
    try {
      await deleteChallenge(ch.id);
      toast.success('Challenge deleted');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete challenge');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Challenges</h1>
          <p className="text-xs text-[#6B7280]">{total.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
          />
          <select
            value={phase}
            onChange={(e) => {
              setPage(0);
              setPhase(e.target.value as any);
            }}
            className="h-10 px-3 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-sm text-white"
          >
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {p === 'All' ? 'All phases' : p}
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
                <th className="text-left px-4 py-3">Challenge</th>
                <th className="text-left px-4 py-3">Creator</th>
                <th className="text-left px-4 py-3">Format</th>
                <th className="text-left px-4 py-3">Phase</th>
                <th className="text-right px-4 py-3">Participants</th>
                <th className="text-right px-4 py-3">Entry Fee</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">Deleted?</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[#6B7280]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[#6B7280]">
                    No challenges found
                  </td>
                </tr>
              ) : (
                rows.map((c) => {
                  const livePhase = computePhase(c);
                  const deleted = !!c.is_deleted;
                  return (
                    <tr
                      key={c.id}
                      className="border-t border-[rgba(255,255,255,0.06)]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              c.cover_image_url ||
                              'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600'
                            }
                            alt=""
                            className="w-12 h-8 object-cover rounded bg-[#161618]"
                          />
                          <div className="min-w-0">
                            <p className={`font-medium truncate ${deleted ? 'line-through text-[#6B7280]' : ''}`}>
                              {c.title}
                            </p>
                            <p className="text-[10px] text-[#6B7280] truncate">{c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#9CA3AF]">
                        {c.creator?.name ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{c.format}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getPhaseBadgeVariant(livePhase)}>
                          {getPhaseBadgeLabel(livePhase)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(c.current_participants ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(c.entry_fee ?? 0).toLocaleString()} DC
                      </td>
                      <td className="px-4 py-3 text-[#9CA3AF]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={deleted ? 'warning' : 'default'}>
                          {deleted ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/challenges/${c.id}`)}>
                            View
                          </Button>
                          <select
                            value={c.phase}
                            onChange={(e) => void onOverride(c, e.target.value as ChallengePhase)}
                            className="h-8 px-2 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-xs text-white"
                          >
                            {PHASES.filter((p) => p !== 'All').map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          <Button size="sm" variant="danger" onClick={() => void onDelete(c)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

