import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, formatDate } from '@/lib/utils';
import { Users, Share2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AgreementModal } from '@/components/agreements/AgreementModal';
import { Input } from '@/components/ui/Input';
import { SubmissionFormModal } from '@/components/challenge/SubmissionFormModal';
import { getChallengeById } from '@/lib/supabase/challenges';
import { getMyEntry, withdrawEntry } from '@/lib/supabase/entries';
import { supabase } from '@/lib/supabase/client';
import type { Challenge } from '@/lib/supabase/types';
import { useWallet } from '@/context/WalletContext';

export function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [myEntry, setMyEntry] = useState<any>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const { refreshBalance } = useWallet();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getChallengeById(id!);
        if (!cancelled) setChallenge(data);

        // Check if current user has entered
        const entry = await getMyEntry(id!);
        if (!cancelled) {
          setMyEntry(entry);
          setHasEntered(!!entry);
        }
      } catch {
        if (!cancelled) toast.error('Failed to load challenge');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <Container>
        <Section>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-yellow-500" size={32} />
          </div>
        </Section>
      </Container>
    );
  }

  if (!challenge) {
    return (
      <Container>
        <Section>
          <p className="text-center text-[#9CA3AF] py-8">Challenge not found</p>
        </Section>
      </Container>
    );
  }

  const isFree = challenge.prize_type === 'bragging_rights' || challenge.entry_fee === 0;
  const totalPool = challenge.entry_fee * challenge.current_participants;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied');
  };

  const handleWithdraw = async () => {
    if (!myEntry || !id) return;
    if (!confirm('Are you sure you want to withdraw your entry?')) return;
    setWithdrawLoading(true);
    try {
      const res = await withdrawEntry(id, myEntry.id);
      setHasEntered(false);
      setMyEntry(null);
      if (res.refunded > 0) {
        await refreshBalance();
        toast.success(`Entry withdrawn. ${res.refunded} DC refunded.`);
      } else {
        toast.success('Entry withdrawn.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to withdraw entry');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const getActionButtons = () => {
    const isRegistrationOver = challenge?.registration_deadline && new Date(challenge.registration_deadline).getTime() < Date.now();

    if (isRegistrationOver) {
      return <Button disabled fullWidth>Registration Closed</Button>;
    }

    switch (challenge?.phase) {
      case 'upcoming':
        return <Button disabled fullWidth>Registration opens soon</Button>;
      case 'entry_open':
        if (hasEntered) {
          return (
            <div className="space-y-2">
              <Button fullWidth onClick={() => setSubmitOpen(true)}>Submit Your Work</Button>
              <Button fullWidth variant="secondary" onClick={() => navigate(`/challenges/${id}/voting`)}>View Submissions and Vote</Button>
              <Button fullWidth variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" loading={withdrawLoading} onClick={handleWithdraw}>Withdraw Entry</Button>
            </div>
          );
        }
        return <Button fullWidth onClick={() => navigate(`/challenges/${id}/enter`)}>{isFree ? 'Enter Free Challenge' : `Enter Now (${challenge?.entry_fee ?? 0} DC)`}</Button>;
      case 'entry_closed':
        return <Button disabled fullWidth>Entry Closed</Button>;
      case 'voting':
        return <Button fullWidth onClick={() => navigate(`/challenges/${id}/voting`)}>View Submissions and Vote</Button>;
      case 'completed':
        return <Button fullWidth onClick={() => navigate(`/challenges/${id}/winners`)}>View Winners</Button>;
      default:
        return null;
    }
  };

  // Build rules array from joined challenge_rules safely
  const rulesArray = Array.isArray(challenge?.rules) ? challenge.rules.map(r => r?.rule_text).filter(Boolean) : [];

  return (
    <Container>
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <img
              src={challenge?.cover_image_url || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600'}
              alt=""
              className="w-full h-48 md:h-64 object-cover rounded-lg"
              loading="lazy"
            />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{challenge?.category}</Badge>
                <Badge variant={challenge?.phase === 'entry_open' ? 'success' : challenge?.phase === 'upcoming' ? 'info' : 'default'}>
                  {challenge?.phase?.replace('_', ' ')}
                </Badge>
                <Badge>{challenge?.format}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{challenge?.title}</h1>
              <p className="text-[#9CA3AF] text-sm">{challenge?.description}</p>
              {challenge?.creator && (
                <p className="text-xs text-[#6B7280] mt-2">
                  by <span className="text-[#9CA3AF]">{challenge.creator?.name ?? 'Unknown'}</span>
                </p>
              )}
            </div>

            {/* Prize Distribution */}
            {!isFree && (
              <Card>
                <h3 className="text-sm font-semibold mb-3">Prize Distribution</h3>
                <div className="flex h-3 rounded-full overflow-hidden mb-3">
                  <div className="w-[50%] bg-emerald-500" />
                  <div className="w-[35%] bg-yellow-500" />
                  <div className="w-[15%] bg-gray-500" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-emerald-400 font-medium">Winner: 50%</span><br /><span className="text-[#9CA3AF]">{(totalPool * 0.5).toFixed(0)} DC</span></div>
                  <div><span className="text-yellow-400 font-medium">Creator: 35%</span><br /><span className="text-[#9CA3AF]">{(totalPool * 0.35).toFixed(0)} DC</span></div>
                  <div><span className="text-gray-400 font-medium">Platform: 15%</span><br /><span className="text-[#9CA3AF]">{(totalPool * 0.15).toFixed(0)} DC</span></div>
                </div>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <h3 className="text-sm font-semibold mb-3">Timeline</h3>
              <div className="space-y-3">
                {[
                  { label: 'Registration Deadline', date: challenge?.registration_deadline },
                  { label: 'Challenge Start', date: challenge?.start_date },
                  { label: 'Challenge End', date: challenge?.end_date },
                  ...(challenge?.voting_end_date ? [{ label: 'Voting End', date: challenge.voting_end_date }] : []),
                  ...(challenge?.results_date ? [{ label: 'Results', date: challenge.results_date }] : []),
                ].filter(t => t.date).map((t, i) => {
                  const past = new Date(t.date!) < new Date();
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${past ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                      <span className="text-sm flex-1">{t.label}</span>
                      <span className="text-xs text-[#9CA3AF]">{formatDate(t.date!)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Rules */}
            {rulesArray.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold mb-3">Rules</h3>
                <ul className="space-y-2">
                  {rulesArray.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#9CA3AF]">
                      <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />{r}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <h3 className="text-sm font-semibold mb-3">Comments</h3>
              <div className="space-y-3 mb-4">
                {[
                  { name: 'Alex Rivera', text: "This looks amazing! Can't wait to participate.", time: '2h ago' },
                  { name: 'Jordan Lee', text: 'The prize pool is impressive. Good luck everyone!', time: '5h ago' },
                ].map((c, i) => (
                  <div key={i} className="bg-[#161618] rounded-md p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{c.name}</span>
                      <span className="text-xs text-[#6B7280]">{c.time}</span>
                    </div>
                    <p className="text-xs text-[#9CA3AF]">{c.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
                <Button onClick={() => { setComment(''); toast.success('Comment posted'); }} disabled={!comment.trim()}>Post</Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-xs text-[#9CA3AF]">Entry Fee</span><span className="text-sm font-medium">{isFree ? <span className="text-emerald-400">Free</span> : `${challenge?.entry_fee ?? 0} DC`}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-[#9CA3AF]">Participants</span><span className="text-sm font-medium flex items-center gap-1"><Users size={14} /> {challenge?.current_participants ?? 0}{challenge?.max_participants ? `/${challenge.max_participants}` : ''}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-[#9CA3AF]">Format</span><span className="text-sm font-medium">{challenge?.format}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-[#9CA3AF]">Prize Type</span><span className="text-sm font-medium">{challenge?.prize_type?.replace('_', ' ')}</span></div>
                {challenge?.prize_description && <div className="flex items-center justify-between"><span className="text-xs text-[#9CA3AF]">Prize</span><span className="text-sm font-medium gold-text">{challenge.prize_description}</span></div>}
                {challenge?.start_date && <div className="flex items-center justify-between"><span className="text-xs text-[#9CA3AF]">Start</span><span className="text-xs">{formatDateTime(challenge.start_date)}</span></div>}
                {challenge?.end_date && <div className="flex items-center justify-between"><span className="text-xs text-[#9CA3AF]">End</span><span className="text-xs">{formatDateTime(challenge.end_date)}</span></div>}
              </div>
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)] space-y-2">
                {getActionButtons()}
                <Button variant="ghost" fullWidth onClick={handleShare}><Share2 size={14} /> Share</Button>
              </div>
            </Card>

            {hasEntered && (challenge.phase === 'entry_open' || challenge.phase === 'voting') && (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={16} className="text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">You are entered</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-3">Submit your work before the deadline to participate in voting.</p>
                <Button fullWidth onClick={() => setSubmitOpen(true)}>Submit Your Work</Button>
              </Card>
            )}

            {challenge?.sponsorship_enabled && (
              <Card>
                <h3 className="text-sm font-semibold mb-2">Sponsorship</h3>
                <p className="text-xs text-[#9CA3AF] mb-3">Fund the prize and negotiate ROI split.</p>
                <Button variant="secondary" fullWidth onClick={() => setSponsorOpen(true)}>Propose Sponsorship</Button>
              </Card>
            )}
          </div>
        </div>
      </Section>
      <AgreementModal open={sponsorOpen} onClose={() => setSponsorOpen(false)} onAgree={() => { toast.success('Sponsorship proposed'); setSponsorOpen(false); }} title="Sponsor Agreement">
        <p className="mb-2">By proposing a sponsorship, you agree to the following terms:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Sponsor will fund the designated prize amount.</li>
          <li>Default ROI split is 12% to sponsor, 3% to creator.</li>
          <li>Both parties must agree before sponsorship is finalized.</li>
          <li>Platform retains standard 15% fee.</li>
          <li>Sponsorship terms are binding once confirmed.</li>
        </ul>
      </AgreementModal>
      <SubmissionFormModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        challengeId={id || ''}
        onSuccess={() => navigate(`/challenges/${id}/submission-success`)}
      />
    </Container>
  );
}
