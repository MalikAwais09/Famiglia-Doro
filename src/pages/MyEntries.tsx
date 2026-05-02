import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SubmissionFormModal } from '@/components/challenge/SubmissionFormModal';
import { getMyEntries } from '@/lib/supabase/entries';
import { formatRelativeTime, formatLocalDateTime } from '@/lib/utils/dateUtils';
import { Loader2 } from 'lucide-react';

function phaseLabel(phase: string) {
  return phase.replace('_', ' ');
}

function placementLabel(placement: number | null) {
  if (placement === 1) return '1st';
  if (placement === 2) return '2nd';
  if (placement === 3) return '3rd';
  return null;
}

export function MyEntries() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MyEntryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitTarget, setSubmitTarget] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyEntries();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  if (loading) {
    return (
      <Container><Section>
        <PageHeader title="My Entries" subtitle="Track your challenge entries" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-yellow-500" size={32} />
        </div>
      </Section></Container>
    );
  }

  if (entries.length === 0) {
    return (
      <Container><Section>
        <PageHeader title="My Entries" subtitle="Track your challenge entries" />
        <div className="text-center py-12">
          <p className="text-[#9CA3AF] mb-4">You haven&apos;t entered any challenges yet</p>
          <Button onClick={() => navigate('/challenges')}>Browse Challenges</Button>
        </div>
      </Section></Container>
    );
  }

  return (
    <Container><Section>
      <PageHeader title="My Entries" subtitle="Track your challenge entries" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((e) => {
          const ch = e.challenge;
          const now = Date.now();
          const startMs = ch?.start_date ? new Date(ch.start_date).getTime() : null;
          const endMs = ch?.end_date ? new Date(ch.end_date).getTime() : null;
          const beforeStart = startMs !== null && now < startMs;
          const afterEnd = endMs !== null && now > endMs;
          const canSubmit =
            !e.hasSubmitted &&
            !!ch &&
            ['entry_open', 'on_going'].includes(ch.phase) &&
            !beforeStart &&
            !afterEnd;
          const place = placementLabel(e.placement);

          return (
            <Card key={e.entryId} className="overflow-hidden p-0">
              <img
                src={ch?.cover_image_url || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600'}
                alt=""
                className="w-full h-32 object-cover"
                loading="lazy"
              />
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{ch?.category || 'General'}</Badge>
                  {ch?.format && <Badge variant="default">{ch.format}</Badge>}
                  {ch?.phase && <Badge variant="info">{phaseLabel(ch.phase)}</Badge>}
                  {e.isWinner && <Badge variant="success">Winner</Badge>}
                  {place && <Badge variant="success">{place}</Badge>}
                </div>
                <p className="font-semibold text-sm">{ch?.title || 'Challenge'}</p>
                {e.hasSubmitted && e.submission?.title && (
                  <p className="text-xs text-[#9CA3AF]">{e.submission.title}</p>
                )}
                {e.hasSubmitted && e.submission && (
                  <p className="text-xs text-[#6B7280]">Votes: {e.submission.votes_count ?? 0}</p>
                )}
                <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span>Joined {formatRelativeTime(e.enteredAt)}</span>
                  {e.entryFeePaid > 0 ? (
                    <span className="gold-text">{e.entryFeePaid} DC</span>
                  ) : (
                    <span className="text-emerald-400">Free</span>
                  )}
                </div>
                {!e.hasSubmitted && beforeStart && ch?.start_date && (
                  <p className="text-xs text-[#9CA3AF]">
                    Opens on {formatLocalDateTime(ch.start_date)}
                  </p>
                )}
                {afterEnd && !e.hasSubmitted && (
                  <p className="text-xs text-red-400">Submission deadline has passed</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" fullWidth onClick={() => ch?.id && navigate(`/challenges/${ch.id}`)}>
                    View Challenge
                  </Button>
                  {canSubmit && (
                    <Button fullWidth onClick={() => ch?.id && setSubmitTarget(ch.id)}>
                      Submit Your Work
                    </Button>
                  )}
                  {e.hasSubmitted && (
                    <Button fullWidth variant="ghost" onClick={() => ch?.id && navigate(`/challenges/${ch.id}/voting`)}>
                      Vote
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <SubmissionFormModal
        open={!!submitTarget}
        onClose={() => setSubmitTarget(null)}
        challengeId={submitTarget || ''}
        onSuccess={() => {
          setSubmitTarget(null);
          void loadEntries();
        }}
      />
    </Section></Container>
  );
}
