import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useRole } from '@/context/RoleContext';
import { Plus, Users, Loader2 } from 'lucide-react';
import {
  getChallenges,
  getChallengeListCountdownLine,
  getPhaseBadgeLabel,
  getPhaseBadgeVariant,
} from '@/lib/supabase/challenges';
import type { Challenge, ChallengeFilters } from '@/lib/supabase/types';
import { toast } from 'sonner';

const STATUSES = ['All', 'upcoming', 'entry_open', 'entry_closed', 'active', 'voting', 'completed'] as const;

export function Challenges() {
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isCreator } = useRole();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const filters: ChallengeFilters = {};
        if (status !== 'All') filters.phase = status as ChallengeFilters['phase'];
        if (search.trim()) filters.search = search.trim();

        const data = await getChallenges(filters);
        if (!cancelled) setChallenges(data);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load challenges';
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Debounce search input
    const timer = setTimeout(load, search ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status, search]);

  return (
    <Container>
      <Section>
        <PageHeader title="Challenges" subtitle="Browse and join competitions"
          actions={isCreator ? <Button onClick={() => navigate('/challenges/create')}><Plus size={16} /> Create Challenge</Button> : undefined} />
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${status === s ? 'gold-gradient text-black font-semibold border-transparent' : 'border-[rgba(255,255,255,0.08)] text-[#9CA3AF]'}`}>
                {s === 'All' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
          <Input placeholder="Search challenges..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-yellow-500" size={32} />
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-red-400 py-8">{error}</p>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map(c => (
                <Card key={c.id} onClick={() => navigate(`/challenges/${c.id}`)} className="overflow-hidden p-0 cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-colors">
                  <div className="relative">
                    <img
                      src={c.cover_image_url || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600'}
                      alt=""
                      className="w-full h-36 object-cover"
                      loading="lazy"
                    />
                    <Badge variant={getPhaseBadgeVariant(c.phase)} className="absolute top-2 left-2">
                      {getPhaseBadgeLabel(c.phase)}
                    </Badge>
                    <Badge className="absolute top-2 right-2">{c.format}</Badge>
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
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9CA3AF] line-clamp-2">{getChallengeListCountdownLine(c)}</span>
                      <span className="flex items-center gap-1 text-[#9CA3AF]"><Users size={12} />{c.current_participants}</span>
                      {c.entry_fee > 0
                        ? <span className="gold-text font-medium">{c.entry_fee} DC</span>
                        : <span className="text-emerald-400">Free</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {challenges.length === 0 && (
              <p className="text-center text-[#9CA3AF] py-8">No challenges found</p>
            )}
          </>
        )}
      </Section>
    </Container>
  );
}
