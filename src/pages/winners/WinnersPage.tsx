import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { getCompletedChallengesWithWinners, calculatePrizes } from '@/lib/supabase/winners';
import { Heart } from 'lucide-react';

type ListChallenge = {
  id: string;
  title: string;
  category: string;
  coverImage: string;
  prizeType: string | null;
  hasWinners: boolean;
  topWinnerName: string;
  topWinnerAvatar: string | null | undefined;
  topWinnerVotes: number;
  firstPrizeDisplay: string;
};

export function WinnersPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'prize'>('all');
  const [search, setSearch] = useState('');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      setLoading(true);
      try {
        const data = await getCompletedChallengesWithWinners();
        setChallenges(data);
      } catch (err) {
        console.error('Winners fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWinners();
  }, []);

  const listItems: ListChallenge[] = challenges.map((challenge) => {
    const prizes = calculatePrizes(challenge);
    const firstPrizeDisplay =
      prizes.type === 'cash' ? `${prizes.currency}${prizes.first}` : String(prizes.first);
    return {
      id: challenge.id,
      title: challenge.title,
      category: challenge.category ?? '',
      coverImage:
        challenge.cover_image_url ||
        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600',
      prizeType: challenge.prize_type ?? null,
      hasWinners: challenge.winners.length > 0,
      topWinnerName: challenge.topWinner?.profiles?.name ?? 'TBD',
      topWinnerAvatar: challenge.topWinner?.profiles?.avatar_url,
      topWinnerVotes: challenge.topWinner?.submissions?.votes_count ?? 0,
      firstPrizeDisplay,
    };
  });

  const filtered = listItems.filter((c) => {
    const prizeMatch = filter === 'all' || c.prizeType !== 'bragging_rights';
    const searchMatch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    return prizeMatch && searchMatch;
  });

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
      <p className="text-sm text-[#9CA3AF] mb-4">
        {loading ? 'Loading...' : `Completed Challenges (${filtered.length})`}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {filtered.map(c => {
          const top = c.hasWinners
            ? {
                name: c.topWinnerName,
                avatar: c.topWinnerAvatar,
                votes: c.topWinnerVotes,
              }
            : null;
          return (
            <Card key={c.id} className="overflow-hidden p-0">
              <div className="relative">
                <img src={c.coverImage} alt="" className="w-full h-40 object-cover" loading="lazy" />
                <Badge variant="gold" className="absolute top-2 right-2">Prize</Badge>
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm mb-2 line-clamp-1">{c.title}</p>
                {!c.hasWinners && (
                  <div className="mb-2">
                    <Badge variant="warning">Winners Pending</Badge>
                  </div>
                )}
                {c.hasWinners && top && (
                  <div className="flex items-center gap-2 mb-2">
                    <img src={top.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=W'} alt="" className="w-6 h-6 rounded-full" />
                    <span className="text-xs font-medium">{top.name}</span>
                  </div>
                )}
                {c.hasWinners && top && (
                  <div className="flex items-center gap-1 text-xs text-[#9CA3AF] mb-3">
                    <Heart size={12} /> {top.votes} votes
                  </div>
                )}
                {c.hasWinners && top && (
                  <p className="text-xs font-semibold text-emerald-400 mb-3">1st: {c.firstPrizeDisplay}</p>
                )}
                <Button fullWidth onClick={() => navigate(`/winners/${c.id}`)}>View</Button>
              </div>
            </Card>
          );
        })}
      </div>
      {!loading && filtered.length === 0 && <p className="text-center text-[#9CA3AF] py-8">No completed challenges found</p>}
    </Section></Container>
  );
}
