import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { MOCK_CHALLENGES, MOCK_SUBMISSIONS, MOCK_WINNERS } from '@/lib/mock/data';
import { getStorage } from '@/lib/storage';
import type { Challenge, WinnerRecord } from '@/types';
import { Heart } from 'lucide-react';

export function WinnersPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'prize'>('all');
  const [search, setSearch] = useState('');

  const allChallenges: Challenge[] = [...MOCK_CHALLENGES, ...getStorage<Challenge[]>('challenges', [])];
  const allWinners: WinnerRecord[] = [...MOCK_WINNERS, ...getStorage<WinnerRecord[]>('winners', [])];
  const completed = allChallenges.filter(c => c.status === 'ended' || c.phase === 'completed');

  const winnerMap = new Map<string, WinnerRecord>();
  allWinners.forEach(w => winnerMap.set(w.challengeId, w));

  const filtered = completed.filter(c => {
    const prizeMatch = filter === 'all' || c.prizeType !== 'bragging';
    const searchMatch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    return prizeMatch && searchMatch;
  });

  const getTopWinner = (challengeId: string) => {
    const record = winnerMap.get(challengeId);
    if (record) return record.winners[0];
    const subs = MOCK_SUBMISSIONS.filter(s => s.challengeId === challengeId).sort((a, b) => b.votes - a.votes);
    return subs[0] ? { name: subs[0].userName, avatar: subs[0].userAvatar, votes: subs[0].votes } : null;
  };

  return (
    <Container><Section>
      <PageHeader title="Winners" subtitle="Winners of recently completed challenges" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <select value={filter} onChange={e => setFilter(e.target.value as 'all' | 'prize')}
          className="h-10 px-3 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500">
          <option value="all">All Challenges</option>
          <option value="prize">Prize Challenges</option>
        </select>
        <Input placeholder="Search challenges..." value={search} onChange={e => setSearch(e.target.value)} />
        <Button variant="secondary" onClick={() => {}}>Search</Button>
      </div>
      <p className="text-sm text-[#9CA3AF] mb-4">Completed Challenges ({filtered.length})</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {filtered.map(c => {
          const top = getTopWinner(c.id);
          return (
            <Card key={c.id} className="overflow-hidden p-0">
              <div className="relative">
                <img src={c.coverImage} alt="" className="w-full h-40 object-cover" loading="lazy" />
                <Badge variant="gold" className="absolute top-2 right-2">Prize</Badge>
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm mb-2 line-clamp-1">{c.title}</p>
                {top && (
                  <div className="flex items-center gap-2 mb-2">
                    <img src={top.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=W'} alt="" className="w-6 h-6 rounded-full" />
                    <span className="text-xs font-medium">{top.name}</span>
                  </div>
                )}
                {top && (
                  <div className="flex items-center gap-1 text-xs text-[#9CA3AF] mb-3">
                    <Heart size={12} /> {top.votes} votes
                  </div>
                )}
                <Button fullWidth onClick={() => navigate(`/winners/${c.id}`)}>View</Button>
              </div>
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center text-[#9CA3AF] py-8">No completed challenges found</p>}
    </Section></Container>
  );
}
