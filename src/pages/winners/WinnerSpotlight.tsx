import { useParams } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useState, useEffect, useCallback } from 'react';
import { WinnerClaimAgreement } from '@/components/agreements/WinnerClaimAgreement';
import { toast } from 'sonner';
import { Share2, Trophy, Loader2 } from 'lucide-react';
import { getChallengeWinnersDetail, claimPrize } from '@/lib/supabase/winners';
import { useAuth } from '@/context/AuthContext';

type SpotlightWinner = {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  position: number;
  votes: number;
  prizeAmount: number;
  claimStatus: 'not_claimed' | 'pending' | 'paid';
  verified: boolean;
};

export function WinnerSpotlight() {
  const { challengeId } = useParams();
  const { profile } = useAuth();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimTargetId, setClaimTargetId] = useState<string | null>(null);

  const refreshDetail = useCallback(async () => {
    if (!challengeId) return;
    const data = await getChallengeWinnersDetail(challengeId);
    setDetail(data);
  }, [challengeId]);

  useEffect(() => {
    if (!challengeId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getChallengeWinnersDetail(challengeId).then((data) => {
      if (!cancelled) {
        setDetail(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  const mapWinner = (w: any, row: typeof detail): SpotlightWinner => {
    const pool = (row?.entry_fee ?? 0) * (row?.current_participants ?? 0);
    const cut = w.placement === 1 ? 0.5 : w.placement === 2 ? 0.3 : 0.2;
    return {
      id: w.id,
      userId: w.user_id,
      name: w.profiles?.name ?? 'Unknown',
      avatar: w.profiles?.avatar_url ?? '',
      position: w.placement,
      votes: w.submissions?.votes_count ?? 0,
      prizeAmount: Math.floor(pool * cut),
      claimStatus: w.prize_claimed ? 'paid' : 'not_claimed',
      verified: !!w.prize_claimed,
    };
  };

  const handleClaimPrize = async (winnerId: string) => {
    const result = await claimPrize(winnerId);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success('Prize claimed!');
    await refreshDetail();
    setClaimOpen(false);
    setClaimTargetId(null);
  };

  const isMyWinning = (w: SpotlightWinner) =>
    !!profile?.id && profile.id === w.userId && w.claimStatus === 'not_claimed';

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

  if (!detail || !detail.winners?.length) {
    return (
      <Container>
        <Section>
          <p className="text-center text-[#9CA3AF] py-8">Challenge or winners not found</p>
        </Section>
      </Container>
    );
  }

  const challenge = {
    coverImage:
      detail.cover_image_url ||
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600',
    title: detail.title,
    category: detail.category ?? '',
    entryFee: detail.entry_fee ?? 0,
    currentParticipants: detail.current_participants ?? 0,
  };

  const winnersMapped = detail.winners.map((w: any) => mapWinner(w, detail));
  const winnerRecord = {
    challengeId: detail.id,
    challengeTitle: detail.title,
    announcedAt: '',
    winners: winnersMapped,
  };

  const topWinner = winnerRecord.winners[0];
  const isTopWinner = !!profile?.id && profile.id === topWinner.userId;

  const handleFinalize = () => {
    toast.success('Claim verified. Payout completed.');
  };

  return (
    <Container><Section>
      {/* Hero */}
      <div className="relative h-64 rounded-lg overflow-hidden mb-8">
        <img src={challenge.coverImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0F] to-transparent" />
        <Badge variant="gold" className="absolute top-4 right-4">Completed</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Winners */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Trophy className="text-yellow-500" size={20} /> Top Winner</h2>
          {topWinner && (
            <Card className="border-yellow-600/30 bg-yellow-600/5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center text-2xl font-bold text-black">1</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <img src={topWinner.avatar || ''} alt="" className="w-8 h-8 rounded-full" />
                    <p className="text-lg font-bold">{topWinner.name}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="gold">{topWinner.votes} votes</Badge>
                    <span className="text-xl font-bold text-emerald-400">${topWinner.prizeAmount}</span>
                  </div>
                </div>
                <div>
                  {isMyWinning(topWinner) && (
                    <Button
                      onClick={() => {
                        setClaimTargetId(topWinner.id);
                        setClaimOpen(true);
                      }}
                    >
                      Claim Prize
                    </Button>
                  )}
                  {isTopWinner && topWinner.claimStatus === 'pending' && (
                    <div className="space-y-2">
                      <Badge variant="warning">Pending Verification</Badge>
                      <Button variant="secondary" onClick={handleFinalize}>Finalize Claim</Button>
                    </div>
                  )}
                  {isTopWinner && topWinner.claimStatus === 'paid' && <Badge variant="success">Prize Paid</Badge>}
                  {!isTopWinner && <Button disabled>Claim Prize</Button>}
                </div>
              </div>
            </Card>
          )}

          <h2 className="text-lg font-semibold">Other Winners</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {winnerRecord.winners.slice(1).map((w: SpotlightWinner) => (
              <Card key={w.id}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${w.position === 2 ? 'bg-gray-400 text-black' : 'bg-amber-700 text-white'}`}>
                    {w.position}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{w.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#9CA3AF]">{w.votes} votes</span>
                      <span className="text-sm font-bold text-emerald-400">${w.prizeAmount}</span>
                    </div>
                  </div>
                  {isMyWinning(w) && (
                    <Button
                      className="shrink-0 text-xs px-2 py-1 h-auto"
                      onClick={() => {
                        setClaimTargetId(w.id);
                        setClaimOpen(true);
                      }}
                    >
                      Claim Prize
                    </Button>
                  )}
                  <Badge variant={w.claimStatus === 'paid' ? 'success' : w.claimStatus === 'pending' ? 'warning' : 'default'}>
                    {w.claimStatus}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold mb-3">Challenge Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Title</span><span className="text-right">{challenge.title}</span></div>
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Category</span><span>{challenge.category}</span></div>
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Entry Fee</span><span>{challenge.entryFee > 0 ? `${challenge.entryFee} DC` : 'Free'}</span></div>
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Participants</span><span>{challenge.currentParticipants}</span></div>
            </div>
          </Card>
          <Button variant="secondary" fullWidth onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }}>
            <Share2 size={14} /> Share Challenge
          </Button>
        </div>
      </div>

      <WinnerClaimAgreement
        isOpen={claimOpen}
        onCancel={() => {
          setClaimOpen(false);
          setClaimTargetId(null);
        }}
        onConfirm={() => {
          if (claimTargetId) void handleClaimPrize(claimTargetId);
        }}
      />
    </Section></Container>
  );
}
