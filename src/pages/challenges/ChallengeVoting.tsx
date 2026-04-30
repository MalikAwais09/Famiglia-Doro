import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useWallet } from '@/context/WalletContext';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import { Heart, ExternalLink, CreditCard, Wallet, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import { AgreementModal } from '@/components/agreements/AgreementModal';
import { getSubmissions } from '@/lib/supabase/submissions';
import { getVoteStatus, castVote } from '@/lib/supabase/votes';
import type { Submission } from '@/lib/supabase/types';
import { Heart, ExternalLink, CreditCard, Wallet, ChevronLeft, AlertCircle } from 'lucide-react';
import { AgreementModal } from '@/components/agreements/AgreementModal';

export function ChallengeVoting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { balance, refreshBalance } = useWallet();

  const [submissions, setSubmissions] = useState<(Submission & { user: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'top' | 'recent'>('top');
  const [freeVoteUsed, setFreeVoteUsed] = useState(false);
  const [votedSubIds, setVotedSubIds] = useState<Set<string>>(new Set());
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'choose' | 'dorocoin' | 'card'>('choose');
  const [cardLoading, setCardLoading] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [paidVoteTarget, setPaidVoteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const subs = await getSubmissions(id!);
        if (cancelled) return;
        setSubmissions(subs);

        const status = await getVoteStatus(id!);
        if (cancelled) return;
        setFreeVoteUsed(status.hasUsedFreeVoteToday);
        setVotedSubIds(new Set(status.votedSubmissionIds));
      } catch (err) {
        if (!cancelled) toast.error('Failed to load submissions or vote status');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  const sorted = sort === 'top'
    ? [...submissions].sort((a, b) => b.votes_count - a.votes_count)
    : [...submissions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const totalVotes = submissions.reduce((s, sub) => s + sub.votes_count, 0);

  const handleFreeVote = async (subId: string) => {
    try {
      const res = await castVote(subId, false);
      setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, votes_count: res.newVoteCount } : s));
      setFreeVoteUsed(true);
      setVotedSubIds(prev => new Set(prev).add(subId));
      toast.success('Free vote recorded');
    } catch (err: any) {
      if (err.code === 'free_vote_used') {
        setFreeVoteUsed(true);
        toast.error(err.message);
      } else {
        toast.error(err.message || 'Failed to cast vote');
      }
    }
  };

  const openPaidVote = (subId: string) => {
    setPaidVoteTarget(subId);
    setTermsOpen(true);
  };

  const handlePaidVoteDoroCoin = async () => {
    if (!paidVoteTarget) return;
    try {
      const res = await castVote(paidVoteTarget, true);
      await refreshBalance();
      setSubmissions(prev => prev.map(s => s.id === paidVoteTarget ? { ...s, votes_count: res.newVoteCount } : s));
      setVotedSubIds(prev => new Set(prev).add(paidVoteTarget));
      toast.success('Vote recorded — 1 DoroCoin spent');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cast paid vote');
    } finally {
      setSelectedSub(null);
      setPaymentStep('choose');
      setPaidVoteTarget(null);
    }
  };

  return (
    <Container><Section>
      <Button variant="ghost" onClick={() => navigate(`/challenges/${id}`)} className="mb-4">
        <ChevronLeft size={16} /> Back to Challenge
      </Button>
      <PageHeader title="Vote on Submissions" subtitle="Community voting is open" />

      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <span className="text-[#9CA3AF]">Submissions: <span className="text-white font-medium">{submissions.length}</span></span>
        <span className="text-[#9CA3AF]">Total Votes: <span className="text-white font-medium">{totalVotes}</span></span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-yellow-500" size={32} /></div>
      ) : (
        <>
          {/* Voting status banner */}
      <div className="bg-[#161618] border border-[rgba(255,255,255,0.05)] rounded-md p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#9CA3AF]">
              {freeVoteUsed ? (
                <>You have used your <span className="text-white font-medium">free vote</span> for this challenge today. Additional votes cost <span className="text-yellow-500 font-medium">1 DoroCoin</span> each or you can pay with a <span className="text-white font-medium">card</span>.</>
              ) : (
                <>You have <span className="text-emerald-400 font-medium">1 free vote</span> available for this challenge today. After using your free vote, additional votes cost <span className="text-yellow-500 font-medium">1 DoroCoin</span> each or you can pay with a <span className="text-white font-medium">card</span>.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Sort buttons */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setSort('top')} className={`px-3 py-1.5 text-xs rounded-full border ${sort === 'top' ? 'gold-gradient text-black font-semibold border-transparent' : 'border-[rgba(255,255,255,0.08)] text-[#9CA3AF]'}`}>Top Voted</button>
        <button onClick={() => setSort('recent')} className={`px-3 py-1.5 text-xs rounded-full border ${sort === 'recent' ? 'gold-gradient text-black font-semibold border-transparent' : 'border-[rgba(255,255,255,0.08)] text-[#9CA3AF]'}`}>Recent</button>
      </div>

      {/* Submissions */}
      <div className="space-y-4">
        {sorted.map((sub, i) => (
          <Card key={sub.id}>
            <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i < 3 ? 'gold-gradient text-black' : 'bg-[#161618] text-[#9CA3AF]'}`}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm">{sub.title}</p>
                    <p className="text-xs text-[#9CA3AF]">by {sub.user?.name || 'Unknown'} — {timeAgo(sub.created_at)}</p>
                  </div>
                  <Badge variant="gold">{sub.votes_count} votes</Badge>
                </div>
                {sub.content_type === 'video' && <div className="aspect-video bg-[#161618] rounded-md mb-2 flex items-center justify-center"><ExternalLink size={24} className="text-[#6B7280]" /></div>}
                {sub.content_type === 'image' && <img src={sub.content_url || ''} alt="" className="w-full max-h-48 object-cover rounded-md mb-2" />}
                {sub.content_type === 'text' && <div className="bg-[#161618] rounded-md p-3 mb-2 max-h-32 overflow-y-auto"><p className="text-sm text-[#9CA3AF]">{sub.content_url}</p></div>}
                {sub.content_type === 'link' && <a href={sub.content_url || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-yellow-500 hover:underline mb-2 block">{sub.content_url}</a>}
                {sub.content_type === 'file' && <a href={sub.content_url || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-yellow-500 hover:underline mb-2 block">{sub.content_url}</a>}
                {sub.description && <p className="text-xs text-[#9CA3AF] mb-3">{sub.description}</p>}

                {/* Vote buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {votedSubIds.has(sub.id) ? (
                    <Button disabled className="text-xs h-8 bg-emerald-500/20 text-emerald-500 border-emerald-500/50">
                      <Heart size={14} className="fill-current" /> Voted
                    </Button>
                  ) : !freeVoteUsed ? (
                    <Button onClick={() => handleFreeVote(sub.id)} className="text-xs h-8">
                      <Heart size={14} /> Free Vote
                    </Button>
                  ) : (
                    <>
                      <span className="text-xs text-[#6B7280]">Free vote used today</span>
                      <Button onClick={() => openPaidVote(sub.id)} className="text-xs h-8">
                        <Heart size={14} /> Vote (1 DC)
                      </Button>
                      <Button variant="secondary" onClick={() => { setSelectedSub(sub.id); setPaymentStep('choose'); }} className="text-xs h-8">
                        <CreditCard size={14} /> Vote with Card
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {sorted.length === 0 && <p className="text-center text-[#9CA3AF] py-8">No submissions yet. Be the first to submit!</p>}
      </>
      )}

      {/* Paid Voting Agreement Modal (DoroCoin flow) */}
      <AgreementModal
        open={termsOpen}
        onClose={() => { setTermsOpen(false); setPaidVoteTarget(null); }}
        title="Paid Voting Agreement"
        onAgree={() => {
          setTermsOpen(false);
          if (paidVoteTarget) {
            if (balance < 1) {
              toast.error('Insufficient DoroCoins. You need at least 1 DC.');
            } else {
              handlePaidVoteDoroCoin();
            }
          }
        }}
      >
        <p className="mb-2">By purchasing a vote, you agree:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Each paid vote costs 1 DoroCoin.</li>
          <li>Paid votes are non-refundable.</li>
          <li>Votes are final and cannot be changed.</li>
          <li>Your current balance: <span className="text-yellow-500 font-medium">{balance} DC</span></li>
        </ul>
      </AgreementModal>

      {/* Card Payment Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setSelectedSub(null); setPaymentStep('choose'); }} />
          <div className="relative w-full max-w-sm bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 space-y-4">
            <h3 className="text-base font-semibold">Pay for Vote with Card</h3>
            <div className="bg-[#161618] rounded-md p-3 text-center">
              <p className="text-xs text-[#9CA3AF]">Cost per vote</p>
              <p className="text-xl font-bold gold-text">$1.00</p>
            </div>

            {paymentStep === 'choose' && (
              <div className="space-y-3">
                <Button fullWidth onClick={() => setPaymentStep('card')}>
                  <CreditCard size={14} /> Pay with Card — $1.00
                </Button>
                <Button fullWidth variant="secondary" onClick={() => setPaymentStep('dorocoin')}>
                  <Wallet size={14} /> Pay with DoroCoin (1 DC)
                </Button>
                <p className="text-xs text-[#6B7280] text-center">Card payment is processed securely (mock checkout)</p>
              </div>
            )}

            {paymentStep === 'dorocoin' && (
              <div className="space-y-3">
                <div className="bg-[#161618] rounded-md p-3">
                  <p className="text-xs text-[#9CA3AF]">Your DoroCoin balance</p>
                  <p className="text-lg font-bold gold-text">{balance} DC</p>
                </div>
                {balance < 1 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                    <p className="text-xs text-red-400">Insufficient balance. You need 1 DoroCoin. Buy more from your wallet.</p>
                  </div>
                )}
                <Button fullWidth loading={cardLoading} disabled={balance < 1} onClick={async () => {
                  setCardLoading(true);
                  if (selectedSub) {
                    try {
                      const res = await castVote(selectedSub, true);
                      await refreshBalance();
                      setSubmissions(prev => prev.map(s => s.id === selectedSub ? { ...s, votes_count: res.newVoteCount } : s));
                      setVotedSubIds(prev => new Set(prev).add(selectedSub));
                      toast.success('Vote recorded — 1 DoroCoin spent');
                      setSelectedSub(null);
                      setPaymentStep('choose');
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to cast paid vote');
                    }
                  }
                  setCardLoading(false);
                }}>
                  Confirm — Pay 1 DC
                </Button>
                <Button variant="ghost" fullWidth onClick={() => setPaymentStep('choose')}>Back</Button>
              </div>
            )}

            {paymentStep === 'card' && (
              <div className="space-y-3">
                <Input placeholder="Cardholder Name" />
                <Input placeholder="1234 5678 9012 3456" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="MM/YY" />
                  <Input placeholder="CVV" type="password" />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                  <p className="text-xs text-blue-400">This is a mock checkout for demonstration purposes.</p>
                </div>
                <Button fullWidth loading={cardLoading} onClick={() => {
                  setCardLoading(true);
                  setTimeout(() => {
                    toast.error('Card payments not enabled yet. Please use DoroCoins.');
                    setCardLoading(false);
                    setSelectedSub(null);
                    setPaymentStep('choose');
                  }, 900);
                }}>
                  Pay $1.00
                </Button>
                <Button variant="ghost" fullWidth onClick={() => setPaymentStep('choose')}>Back</Button>
              </div>
            )}

            <Button variant="ghost" fullWidth onClick={() => { setSelectedSub(null); setPaymentStep('choose'); }}>Cancel</Button>
          </div>
        </div>
      )}
    </Section></Container>
  );
}
