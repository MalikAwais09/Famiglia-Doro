import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  getChallenges,
  getChallengeListCountdownLine,
  getPhaseBadgeLabel,
  getPhaseBadgeVariant,
} from '@/lib/supabase/challenges';
import type { Challenge, ChallengeFilters } from '@/lib/supabase/types';
import { Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'Art & Design', 'Music', 'Gaming', 'Photography', 'Writing', 'Dance', 'Comedy', 'Cooking', 'Fitness', 'Technology', 'Fashion', 'Film & Video', 'Education', 'Sports'];

export function Feed() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const filters: ChallengeFilters = {};
        if (category !== 'All') filters.category = category;
        if (search.trim()) filters.search = search.trim();

        const data = await getChallenges(filters);
        if (!cancelled) setChallenges(data);
      } catch (err) {
        if (!cancelled) {
          toast.error('Failed to load feed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(load, search ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [category, search]);

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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-yellow-500" size={32} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map(c => (
                <Card key={c.id} onClick={() => navigate(`/challenges/${c.id}`)} className="overflow-hidden p-0 cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-colors">
                  <div className="relative">
                    <img src={c.cover_image_url || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600'} alt="" className="w-full h-36 object-cover" loading="lazy" />
                    <Badge variant={getPhaseBadgeVariant(c.phase)} className="absolute top-2 left-2">
                      {getPhaseBadgeLabel(c.phase)}
                    </Badge>
                    <Badge variant={c.prize_type === 'cash' ? 'gold' : 'default'} className="absolute top-2 right-2">
                      {c.prize_type?.replace('_', ' ')}
                    </Badge>
                    {['entry_closed', 'active', 'voting', 'completed'].includes(c.phase) && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-black text-sm tracking-widest bg-black/60 px-3 py-1 rounded border border-white/20">CLOSED</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#9CA3AF] mb-1">{c.category}</p>
                    <p className="font-semibold text-sm mb-1 line-clamp-1">{c.title}</p>
                    <p className="text-xs text-[#9CA3AF] line-clamp-2 mb-3">{c.description}</p>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#9CA3AF] line-clamp-2">{getChallengeListCountdownLine(c)}</span>
                      <span className="flex items-center gap-1 text-xs text-[#9CA3AF]"><Users size={12} />{c.current_participants}</span>
                      {c.entry_fee > 0 ? <span className="text-xs font-medium gold-text">{c.entry_fee} DC</span> : <span className="text-xs text-emerald-400">Free</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {challenges.length === 0 && <p className="text-center text-[#9CA3AF] py-8">No challenges found</p>}
          </>
        )}
      </Section>
    </Container>
  );
}
