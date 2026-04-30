import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MOCK_ENTRIES, MOCK_CHALLENGES } from '@/lib/mock/data';
import { getStorage } from '@/lib/storage';
import type { Entry, Challenge } from '@/types';
import { formatDate } from '@/lib/utils';
import { SubmissionFormModal } from '@/components/challenge/SubmissionFormModal';

export function MyEntries() {
  const navigate = useNavigate();
  const [submitTarget, setSubmitTarget] = useState<string | null>(null);
  const allEntries: Entry[] = [...getStorage<Entry[]>('userEntries', []), ...MOCK_ENTRIES];
  const allChallenges: Challenge[] = [...MOCK_CHALLENGES, ...getStorage<Challenge[]>('challenges', [])];

  const enriched = allEntries.map(e => {
    const ch = allChallenges.find(c => c.id === e.challengeId);
    return { ...e, challenge: ch };
  }).sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());

  return (
    <Container><Section>
      <PageHeader title="My Entries" subtitle="Track your challenge entries" />
      {enriched.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#9CA3AF] mb-4">You haven't entered any challenges yet</p>
          <Button onClick={() => navigate('/challenges')}>Browse Challenges</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map(e => {
            const canSubmit = e.status === 'active' && (e.challenge?.phase === 'entry_open' || e.challenge?.phase === 'voting');
            return (
              <Card key={e.id} className="overflow-hidden p-0">
                <img src={e.challenge?.coverImage || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600'} alt="" className="w-full h-32 object-cover" loading="lazy" />
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge>{e.challengeCategory || e.challenge?.category || 'General'}</Badge>
                    <Badge variant={e.status === 'active' ? 'info' : e.status === 'submitted' ? 'success' : 'default'}>{e.status}</Badge>
                  </div>
                  <p className="font-semibold text-sm">{e.challengeTitle || e.challenge?.title || 'Challenge'}</p>
                  <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span>{formatDate(e.enteredAt)}</span>
                    <span className="capitalize">{e.paymentMethod}</span>
                    {e.entryFee > 0 ? <span className="gold-text">{e.entryFee} DC</span> : <span className="text-emerald-400">Free</span>}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" fullWidth onClick={() => navigate(`/challenges/${e.challengeId}`)}>View Challenge</Button>
                    {canSubmit && (
                      <Button fullWidth onClick={() => setSubmitTarget(e.challengeId)}>Submit Work</Button>
                    )}
                    {e.status === 'submitted' && (
                      <Button fullWidth variant="ghost" onClick={() => navigate(`/challenges/${e.challengeId}/voting`)}>Vote</Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <SubmissionFormModal
        open={!!submitTarget}
        onClose={() => setSubmitTarget(null)}
        challengeId={submitTarget || ''}
        onSuccess={() => {
          setSubmitTarget(null);
          navigate('/my-entries');
        }}
      />
    </Section></Container>
  );
}
