import { useState } from 'react';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MOCK_LEADERBOARD } from '@/lib/mock/data';

const TABS = ['Global', 'Weekly', 'Monthly'];

export function Leaderboards() {
  const [tab, setTab] = useState('Global');

  const data = tab === 'Global' ? MOCK_LEADERBOARD
    : tab === 'Weekly' ? MOCK_LEADERBOARD.slice(0, 5).map(u => ({ ...u, points: Math.floor(u.points * 0.3) }))
    : MOCK_LEADERBOARD.slice(0, 7).map(u => ({ ...u, points: Math.floor(u.points * 0.7) }));

  return (
    <Container><Section>
      <PageHeader title="Leaderboards" subtitle="Top competitors ranked by points" />
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${tab === t ? 'gold-gradient text-black font-semibold border-transparent' : 'border-[rgba(255,255,255,0.08)] text-[#9CA3AF]'}`}>
            {t}
          </button>
        ))}
      </div>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="text-left text-xs text-[#9CA3AF] px-4 py-3 w-16">Rank</th>
                <th className="text-left text-xs text-[#9CA3AF] px-4 py-3">Player</th>
                <th className="text-right text-xs text-[#9CA3AF] px-4 py-3">Points</th>
                <th className="text-right text-xs text-[#9CA3AF] px-4 py-3 hidden sm:table-cell">Wins</th>
                <th className="text-right text-xs text-[#9CA3AF] px-4 py-3 hidden sm:table-cell">Challenges</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u, i) => (
                <tr key={u.id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="px-4 py-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'gold-gradient text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-[#161618] text-[#9CA3AF]'}`}>
                      {u.rank}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={u.avatar} alt="" className="w-7 h-7 rounded-full" />
                      <span className="text-sm font-medium">{u.name}</span>
                      {u.role !== 'free' && <Badge variant="gold" className="text-xs">{u.role === 'creatorPro' ? 'Pro' : 'Elite'}</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{u.points.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm text-[#9CA3AF] hidden sm:table-cell">{u.wins}</td>
                  <td className="px-4 py-3 text-right text-sm text-[#9CA3AF] hidden sm:table-cell">{u.challenges}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section></Container>
  );
}
