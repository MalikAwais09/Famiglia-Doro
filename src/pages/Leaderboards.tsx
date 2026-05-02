import { useState, useEffect, useCallback } from 'react';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import {
  getLeaderboard,
  getCurrentUserRank,
  type LeaderboardPeriod,
  type LeaderboardRow,
} from '@/lib/supabase/leaderboard';

const TABS: { label: string; period: LeaderboardPeriod }[] = [
  { label: 'Global', period: 'all' },
  { label: 'Weekly', period: 'weekly' },
  { label: 'Monthly', period: 'monthly' },
];

function avatarUrl(row: LeaderboardRow): string {
  return (
    row.avatar_url ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(row.id)}`
  );
}

export function Leaderboards() {
  const { profile } = useAuth();
  const [tab, setTab] = useState(TABS[0].label);
  const [data, setData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<{ rank: number; points: number; wins: number } | null>(null);

  const period = TABS.find(t => t.label === tab)?.period ?? 'all';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, ur] = await Promise.all([
        getLeaderboard('challenges_count', period),
        profile?.id ? getCurrentUserRank('challenges_count', period) : Promise.resolve(null),
      ]);
      setData(rows);
      setUserRank(ur);
    } catch (e) {
      console.error(e);
      setData([]);
      setUserRank(null);
    } finally {
      setLoading(false);
    }
  }, [period, profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const inTopList = profile ? data.some(r => r.id === profile.id) : false;
  const showYourRankFooter =
    profile && userRank && (!inTopList || userRank.rank > 50);

  return (
    <Container>
      <Section>
        <PageHeader title="Leaderboards" subtitle="Top competitors ranked by challenges, wins, and points" />
        <div className="flex gap-2 mb-6">
          {TABS.map(t => (
            <button
              key={t.label}
              onClick={() => setTab(t.label)}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${tab === t.label ? 'gold-gradient text-black font-semibold border-transparent' : 'border-[rgba(255,255,255,0.08)] text-[#9CA3AF]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" message="Loading leaderboard…" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <th className="text-left text-xs text-[#9CA3AF] px-4 py-3 w-16">Rank</th>
                    <th className="text-left text-xs text-[#9CA3AF] px-4 py-3">Player</th>
                    <th className="text-right text-xs text-[#9CA3AF] px-4 py-3">Points</th>
                    <th className="text-right text-xs text-[#9CA3AF] px-4 py-3 hidden sm:table-cell">Wins</th>
                    <th className="text-right text-xs text-[#9CA3AF] px-4 py-3 hidden sm:table-cell">
                      Challenges
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-[#6B7280]">
                        No leaderboard entries yet for this period.
                      </td>
                    </tr>
                  ) : (
                    data.map((u, i) => (
                      <tr
                        key={u.id}
                        className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'gold-gradient text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-[#161618] text-[#9CA3AF]'}`}
                          >
                            {u.rank}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={avatarUrl(u)} alt="" className="w-7 h-7 rounded-full" />
                            <span className="text-sm font-medium">{u.name ?? 'Unknown'}</span>
                            {u.role !== 'free' && (
                              <Badge variant="gold" className="text-xs">
                                {u.role === 'creatorPro' ? 'Pro' : 'Elite'}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          {u.points.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-[#9CA3AF] hidden sm:table-cell">
                          {u.wins}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-[#9CA3AF] hidden sm:table-cell">
                          {u.challenges_count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {showYourRankFooter && userRank && (
          <Card className="mt-4">
            <p className="text-sm text-[#9CA3AF]">
              Your rank:{' '}
              <span className="text-white font-semibold">#{userRank.rank}</span>
              <span className="mx-2">·</span>
              {userRank.points.toLocaleString()} pts · {userRank.wins} wins
            </p>
          </Card>
        )}
      </Section>
    </Container>
  );
}
