import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import { formatRelativeTime, formatLocalDateTime, getTimeZoneName } from '@/lib/utils/dateUtils';
import { Users, Share2, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ChallengeEntryAgreement } from '@/components/agreements/ChallengeEntryAgreement';
import { SponsorAgreement } from '@/components/agreements/SponsorAgreement';
import { setEntryAgreementSession } from '@/lib/supabase/agreements';
import { Input } from '@/components/ui/Input';
import { SubmissionFormModal } from '@/components/challenge/SubmissionFormModal';
import {
  getChallengeById,
  getChallengeListCountdownLine,
  getPhaseBadgeLabel,
  getPhaseBadgeVariant,
  votingEndFromEndDate,
  resultsDateFromEndDate,
} from '@/lib/supabase/challenges';
import { getMyEntry, withdrawEntry, getPublicParticipants } from '@/lib/supabase/entries';
import { getMySubmission } from '@/lib/supabase/submissions';
import { useAuth } from '@/context/AuthContext';
import { getComments, postComment, type Comment } from '@/lib/supabase/comments';
import type { Challenge, Profile } from '@/lib/supabase/types';
import { useWallet } from '@/context/WalletContext';
import { useLivePhase } from '@/hooks/useLivePhase';
import { useNow } from '@/hooks/useNow';
import { ChallengeCountdown } from '@/components/ChallengeCountdown';

export function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [myEntry, setMyEntry] = useState<any>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [participants, setParticipants] = useState<Pick<Profile, 'id' | 'name' | 'avatar_url' | 'role'>[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [entryAgreementOpen, setEntryAgreementOpen] = useState(false);

  const { refreshBalance } = useWallet();
  const { profile, user } = useAuth();
  const isAuthenticated = !!user;

  const phase = useLivePhase(challenge, 1000);
  const tickNow = useNow(1000);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getChallengeById(id);
        if (!cancelled) setChallenge(data);

        // Check if current user has entered
        const entry = await getMyEntry(id);
        if (!cancelled) {
          setMyEntry(entry);
          setHasEntered(!!entry);
        }
        const submission = entry ? await getMySubmission(id) : null;
        if (!cancelled) setHasSubmitted(!!submission);
        // Fetch comments
        const comms = await getComments(id);
        if (!cancelled) setComments(comms);

        // Fetch participants
        const parts = await getPublicParticipants(id);
        if (!cancelled) setParticipants(parts);
      } catch (err) {
        console.error('Error loading challenge:', err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load challenge details';
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const getActionButtons = () => {
    if (!challenge || !id) return null;

    const isCreatorLocal = !!profile?.id && profile.id === challenge.created_by;
    const isFreeLocal = challenge.prize_type === 'bragging_rights' || challenge.entry_fee === 0;
    const now = tickNow.getTime();
    const isStarted = challenge?.start_date && new Date(challenge.start_date).getTime() <= now;
    const isEnded = challenge?.end_date && new Date(challenge.end_date).getTime() <= now;
    const startMs = challenge?.start_date ? new Date(challenge.start_date).getTime() : null;
    const endMs = challenge?.end_date ? new Date(challenge.end_date).getTime() : null;
    const beforeStart = startMs !== null && now < startMs;
    const afterEnd = endMs !== null && now > endMs;

    const showEnterButton =
      !isCreatorLocal &&
      isAuthenticated &&
      (phase === 'upcoming' || phase === 'entry_open') &&
      !hasEntered;

    const showSubmitButton =
      !isCreatorLocal &&
      hasEntered &&
      phase === 'active' &&
      !hasSubmitted &&
      !beforeStart &&
      !afterEnd;

    const isFull = challenge?.max_participants && challenge.current_participants >= challenge.max_participants;

    if (hasEntered) {
      if (phase === 'completed') {
        return <Button fullWidth onClick={() => navigate(`/challenges/${id}/winners`)}>View Winners</Button>;
      }

      if (isEnded || phase === 'voting') {
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs mb-2">
              <AlertCircle size={14} />
              <span>Submission period has ended</span>
            </div>
            <Button fullWidth variant="secondary" onClick={() => navigate(`/challenges/${id}/voting`)}>View Submissions and Vote</Button>
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {hasSubmitted ? (
            <p className="text-xs text-emerald-400 text-center">You have submitted your work.</p>
          ) : beforeStart && challenge.start_date ? (
            <div className="text-xs text-[#9CA3AF] space-y-1 text-center">
              <p>Submissions open in:</p>
              <p>{formatRelativeTime(challenge.start_date)}</p>
              <p>{formatLocalDateTime(challenge.start_date)}</p>
            </div>
          ) : afterEnd ? (
            <p className="text-xs text-red-400 text-center">Submission deadline has passed.</p>
          ) : showSubmitButton ? (
            <Button fullWidth onClick={() => setSubmitOpen(true)}>Submit Your Work</Button>
          ) : null}
          <Button fullWidth variant="secondary" onClick={() => navigate(`/challenges/${id}/voting`)}>View Submissions and Vote</Button>
          {!isStarted && ['upcoming', 'entry_open', 'entry_closed'].includes(phase) && (
            <Button fullWidth variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" loading={withdrawLoading} onClick={handleWithdraw}>Withdraw Entry</Button>
          )}
        </div>
      );
    }

    if (phase === 'completed') {
      return <Button fullWidth onClick={() => navigate(`/challenges/${id}/winners`)}>View Winners</Button>;
    }

    if (phase === 'voting') {
      return <Button fullWidth onClick={() => navigate(`/challenges/${id}/voting`)}>View Submissions and Vote</Button>;
    }

    if (phase === 'active' || phase === 'entry_closed') {
      if (phase === 'entry_closed' && challenge.start_date) {
        return (
          <div className="space-y-2">
            <p className="text-xs text-[#9CA3AF] text-center">Entries are closed. Challenge starts {formatRelativeTime(challenge.start_date)}.</p>
            <p className="text-[10px] text-[#6B7280] text-center">{formatLocalDateTime(challenge.start_date)}</p>
            <Button disabled fullWidth>Entries closed</Button>
          </div>
        );
      }
      return (
        <Button disabled fullWidth>
          {phase === 'active' ? 'Submissions in progress' : 'Entries closed'}
        </Button>
      );
    }

    if (showEnterButton) {
      if (isFull) {
        return <Button disabled fullWidth>Challenge Full</Button>;
      }
      return (
        <Button
          fullWidth
          onClick={() => {
            setEntryAgreementOpen(true);
          }}
        >
          {isFreeLocal ? 'Enter Free Challenge' : `Enter Now (${challenge?.entry_fee ?? 0} DC)`}
        </Button>
      );
    }

    if (isCreatorLocal && (phase === 'upcoming' || phase === 'entry_open')) {
      return (
        <div className="w-full flex justify-center">
          <Badge>You created this challenge</Badge>
        </div>
      );
    }

    return null;
  };

  if (!id) {
    return (
      <Container>
        <Section>
          <p className="text-center text-[#9CA3AF] py-8">Invalid challenge link (missing id).</p>
        </Section>
      </Container>
    );
  }

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
          <p className="text-center text-[#9CA3AF] py-8">
            Challenge not found. ID: <span className="font-mono text-xs">{id}</span>
          </p>
        </Section>
      </Container>
    );
  }

  const isFree = challenge.prize_type === 'bragging_rights' || challenge.entry_fee === 0;
  const totalPool = challenge.entry_fee * challenge.current_participants;
  const isCreator = !!profile?.id && profile.id === challenge.created_by;
  const votingEndDisplay =
    challenge.voting_end_date ||
    (challenge.end_date ? votingEndFromEndDate(challenge.end_date) : undefined);
  const resultsDateDisplay =
    challenge.results_date ||
    (challenge.end_date ? resultsDateFromEndDate(challenge.end_date) : undefined);

  const handlePostComment = async () => {
    if (!comment.trim() || !id) return;
    setCommentsLoading(true);
    try {
      const newComment = await postComment(id, comment.trim());
      setComments([...comments, newComment]);
      setComment('');
      toast.success('Comment posted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setCommentsLoading(false);
    }
  };

  const rulesArray = Array.isArray(challenge?.rules) ? challenge.rules.map(r => r?.rule_text).filter(Boolean) : [];

  const handleShare = async () => {
    const url = window.location.href;
    const title = challenge?.title || 'Famiglia Doro Challenge';
    const text = challenge?.description || 'Check out this challenge on Famiglia Doro!';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch (err) {
        console.error('Error copying link:', err);
        toast.error('Failed to copy link');
      }
    }
  };

  const handleWithdraw = async () => {
    if (!id || !myEntry?.id) return;
    if (!confirm('Are you sure you want to withdraw? Any entry fee paid will be refunded.')) return;

    setWithdrawLoading(true);
    try {
      const { refunded } = await withdrawEntry(id, myEntry.id);
      setHasEntered(false);
      setMyEntry(null);
      setParticipants(prev => prev.filter(p => p.id !== profile?.id));
      setChallenge(prev => prev ? { ...prev, current_participants: Math.max(0, prev.current_participants - 1) } : null);
      refreshBalance();
      toast.success(`Withdrawn successfully.${refunded > 0 ? ` Refunded ${refunded} DC.` : ''}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to withdraw');
    } finally {
      setWithdrawLoading(false);
    }
  };

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
                <Badge variant={getPhaseBadgeVariant(phase)}>
                  {getPhaseBadgeLabel(phase)}
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
              <h3 className="text-sm font-semibold mb-1">Challenge Timeline</h3>
              <p className="text-xs text-yellow-500/90 mb-3">{getChallengeListCountdownLine(challenge, tickNow)}</p>
              <div className="space-y-4 text-sm">
                {challenge.registration_deadline && (
                  <div className={phase === 'upcoming' || phase === 'entry_open' ? 'rounded-md border border-yellow-600/25 p-2 -m-1' : ''}>
                    <div className="flex items-center gap-2 mb-1">
                      <Check size={14} className={phase === 'upcoming' || phase === 'entry_open' ? 'text-yellow-500' : 'text-emerald-400'} />
                      <span className="font-medium">Registration</span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] pl-6">Closes: {formatDateTime(challenge.registration_deadline)}</p>
                  </div>
                )}
                {challenge.start_date && challenge.end_date && (
                  <div className={phase === 'active' || phase === 'entry_closed' ? 'rounded-md border border-yellow-600/25 p-2 -m-1' : ''}>
                    <div className="flex items-center gap-2 mb-1">
                      <Check size={14} className={phase === 'active' || phase === 'entry_closed' ? 'text-yellow-500' : 'text-emerald-400'} />
                      <span className="font-medium">Submission phase</span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] pl-6">
                      {formatLocalDateTime(challenge.start_date)} → {formatLocalDateTime(challenge.end_date)}
                    </p>
                  </div>
                )}
                {challenge.end_date && votingEndDisplay && (
                  <div className={phase === 'voting' ? 'rounded-md border border-yellow-600/25 p-2 -m-1' : ''}>
                    <div className="flex items-center gap-2 mb-1">
                      <Check size={14} className={phase === 'voting' ? 'text-yellow-500' : 'text-emerald-400'} />
                      <span className="font-medium">Voting phase</span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] pl-6">
                      {formatLocalDateTime(challenge.end_date)} → {formatLocalDateTime(votingEndDisplay)} (7 days, auto-starts when submissions close)
                    </p>
                  </div>
                )}
                {resultsDateDisplay && (
                  <div className={phase === 'completed' ? 'rounded-md border border-yellow-600/25 p-2 -m-1' : ''}>
                    <div className="flex items-center gap-2 mb-1">
                      <Check size={14} className={phase === 'completed' ? 'text-yellow-500' : 'text-gray-600'} />
                      <span className="font-medium">Results</span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] pl-6">{formatLocalDateTime(resultsDateDisplay)}</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[#6B7280] mt-3">
                Times shown in your time zone ({getTimeZoneName()}).
              </p>
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
              <h3 className="text-sm font-semibold mb-3">Comments ({comments.length})</h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {comments.length === 0 ? (
                  <p className="text-xs text-[#6B7280] italic">No comments yet. Be the first!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-[#161618] rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {c.user?.avatar_url && <img src={c.user.avatar_url} className="w-4 h-4 rounded-full" alt="" />}
                          <span className="text-xs font-medium">{c.user?.name || 'Anonymous'}</span>
                        </div>
                        <span className="text-[10px] text-[#6B7280]">{formatRelativeTime(c.created_at)}</span>
                      </div>
                      <p className="text-xs text-[#9CA3AF]">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add a comment..." 
                  value={comment} 
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                />
                <Button onClick={handlePostComment} loading={commentsLoading} disabled={!comment.trim()}>Post</Button>
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
                {(challenge?.start_date || challenge?.end_date) && (
                  <p className="text-[10px] text-[#6B7280] pt-1">Your time zone: {getTimeZoneName()}</p>
                )}
                <ChallengeCountdown challenge={challenge} phase={phase} tickMs={1000} className="pt-2" />
              </div>
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)] space-y-2">
                {getActionButtons()}
                <Button variant="ghost" fullWidth onClick={handleShare}><Share2 size={14} /> Share</Button>
              </div>
            </Card>

            {hasEntered && phase !== 'voting' && phase !== 'completed' && (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={16} className="text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">You are entered</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-3">Submit your work before the deadline to participate in voting.</p>
                {/* We rely on getActionButtons above for the actual submit button to handle the 'isEnded' check */}
              </Card>
            )}

            <Card>
              <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                Participants 
                <span className="text-xs font-normal text-[#9CA3AF]">{challenge.current_participants}{challenge.max_participants ? `/${challenge.max_participants}` : ''}</span>
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {participants.length === 0 ? (
                  <p className="text-xs text-[#6B7280] italic">No one has joined yet.</p>
                ) : (
                  participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <img src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`} className="w-6 h-6 rounded-full bg-[#27272a]" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.name || 'Anonymous'}</p>
                        <p className="text-[10px] text-[#6B7280] capitalize">{p.role.replace('_', ' ')}</p>
                      </div>
                      {p.id === challenge.created_by && <Badge variant="default" className="text-[8px] px-1 py-0 h-auto">Host</Badge>}
                    </div>
                  ))
                )}
              </div>
            </Card>

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
      {challenge && (
        <ChallengeEntryAgreement
          challenge={challenge}
          isPaid={ !(challenge.prize_type === 'bragging_rights' || challenge.entry_fee === 0)}
          isOpen={entryAgreementOpen}
          onCancel={() => setEntryAgreementOpen(false)}
          onConfirm={() => {
            if (challenge?.id) setEntryAgreementSession(challenge.id);
            setEntryAgreementOpen(false);
            navigate(`/challenges/${id}/enter`);
          }}
        />
      )}
      <SponsorAgreement
        isOpen={sponsorOpen}
        onCancel={() => setSponsorOpen(false)}
        onConfirm={() => {
          toast.success('Sponsorship proposed');
          setSponsorOpen(false);
        }}
      />
      <SubmissionFormModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        challengeId={id || ''}
        onSuccess={() => navigate(`/challenges/${id}/submission-success`)}
      />
    </Container>
  );
}
