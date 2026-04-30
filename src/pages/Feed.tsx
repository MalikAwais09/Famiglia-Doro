import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { MOCK_CHALLENGES } from '@/lib/mock/data';
import { getStorage } from '@/lib/storage';
import type { Challenge } from '@/types';
import { getTimeUntil } from '@/lib/utils';
import { Users } from 'lucide-react';

const CATEGORIES = ['All', 'Art & Design', 'Music', 'Gaming', 'Photography', 'Writing', 'Dance', 'Comedy', 'Cooking', 'Fitness', 'Technology', 'Fashion', 'Film & Video', 'Education', 'Sports'];

export function Feed() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const allChallenges: Challenge[] = [...MOCK_CHALLENGES, ...getStorage<Challenge[]>('challenges', [])];
  const filtered = allChallenges.filter(c => {
    const catMatch = category === 'All' || c.category === category;
    const searchMatch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <Container>
      <Section>
        <PageHeader title="Feed" subtitle="Discover challenges across all categories" />
        <div className="mb-4 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors ${category === cat ? 'gold-gradient text-black font-semibold border-transparent' : 'border-[rgba(255,255,255,0.08)] text-[#9CA3AF] hover:text-white'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <Input placeholder="Search challenges..." value={search} onChange={e => setSearch(e.target.value)} className="mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Card key={c.id} onClick={() => navigate(`/challenges/${c.id}`)} className="overflow-hidden p-0">
              <div className="relative">
                <img src={c.coverImage} alt="" className="w-full h-36 object-cover" loading="lazy" />
                <Badge variant={c.status === 'live' ? 'success' : c.status === 'upcoming' ? 'info' : 'default'} className="absolute top-2 left-2">
                  {c.status}
                </Badge>
                <Badge variant={c.prizeType === 'cash' ? 'gold' : 'default'} className="absolute top-2 right-2">
                  {c.prizeType}
                </Badge>
              </div>
              <div className="p-4">
                <p className="text-xs text-[#9CA3AF] mb-1">{c.category}</p>
                <p className="font-semibold text-sm mb-1 line-clamp-1">{c.title}</p>
                <p className="text-xs text-[#9CA3AF] line-clamp-2 mb-3">{c.description}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-[#9CA3AF]"><Users size={12} />{c.currentParticipants}</span>
                  {c.entryFee > 0 ? <span className="text-xs font-medium gold-text">{c.entryFee} DC</span> : <span className="text-xs text-emerald-400">Free</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-[#9CA3AF] py-8">No challenges found</p>}
      </Section>
    </Container>
  );
}
