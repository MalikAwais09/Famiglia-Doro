import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getChallengeWinnersDetail, calculatePrizes, claimPrize } from '@/lib/supabase/winners';
import { useAuth } from '@/context/AuthContext';
import { WinnerClaimAgreement } from '@/components/agreements/WinnerClaimAgreement';

export function ChallengeWinners() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getChallengeWinnersDetail(id).then((data) => {
      if (!cancelled) {
        setDetail(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const prizes = detail ? calculatePrizes(detail) : null;

  const isMyWinning = (winner: any) =>
    !!profile?.id && profile.id === winner?.user_id && !winner?.prize_claimed;

  const prizeLabelForPlacement = (placement: number) => {
    if (!prizes) return 'Prize TBD';
    if (prizes.type === 'cash') {
      const v = placement === 1 ? prizes.first : placement === 2 ? prizes.second : prizes.third;
      return `$${v}`;
    }
    if (prizes.type === 'bragging_rights') {
      if (placement === 1) return '🏆 Champion';
      if (placement === 2) return '🥈 Runner Up';
      return '🥉 Third Place';
    }
    const v = placement === 1 ? prizes.first : placement === 2 ? prizes.second : prizes.third;
    return String(v ?? 'Prize TBD');
  };

  const handleClaimPrize = async () => {
    if (!selectedWinnerId) return;
    const result = await claimPrize(selectedWinnerId);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success('🎉 Prize claimed successfully!');
    setShowClaimModal(false);
    setSelectedWinnerId(null);
    if (id) {
      const data = await getChallengeWinnersDetail(id);
      setDetail(data);
    }
  };

  if (loading) {
    return (
      <Container>
        <Section>
          <p className="text-center text-[#9CA3AF] py-8">Loading...</p>
        </Section>
      </Container>
    );
  }

  if (!detail) {
    return (
      <Container>
        <Section>
          <p className="text-center text-[#9CA3AF] py-8">Challenge not found</p>
        </Section>
      </Container>
    );
  }

  if (!detail.winners?.length) {
    return (
      <Container>
        <Section>
          <h1 className="text-3xl font-bold mb-6">{detail.title} — Winners</h1>
          <p className="text-center text-[#9CA3AF] py-8">Winners have not been announced yet</p>
          <div className="mt-6">
            <Button variant="secondary" onClick={() => navigate(`/challenges/${id}`)}>
              Back to Challenge
            </Button>
          </div>
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <Section>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold">{detail.title}</h1>
          <Badge variant="gold">Completed</Badge>
        </div>

        <Card className="mb-6 p-4">
          <h3 className="text-sm font-semibold mb-3">Challenge Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Title</span>
              <span className="text-right">{detail?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Category</span>
              <span>{detail?.category ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Entry Fee</span>
              <span>{detail?.entry_fee === 0 ? 'Free' : `${detail?.entry_fee} DC`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Participants</span>
              <span>{detail?.current_participants ?? 0}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {detail.winners.map((winner: any) => {
            const placement = winner.placement ?? 1;
            const prizeLine = prizeLabelForPlacement(placement);
            const isTop = placement === 1;

            return (
              <Card key={winner.id} className={isTop ? 'border-yellow-600/30 bg-yellow-600/5' : ''}>
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                      placement === 1
                        ? 'gold-gradient text-black'
                        : placement === 2
                          ? 'bg-gray-400 text-black'
                          : 'bg-amber-700 text-white'
                    }`}
                  >
                    {placement}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{winner?.profiles?.name ?? 'TBD'}</p>
                    <p className="text-sm text-[#9CA3AF]">
                      {winner?.submissions?.votes_count ?? 0} votes
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-lg font-bold text-emerald-400">{prizeLine}</p>
                    {isMyWinning(winner) && (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setSelectedWinnerId(winner.id);
                          setShowClaimModal(true);
                        }}
                      >
                        Claim Prize
                      </Button>
                    )}
                    {winner.prize_claimed && <Badge variant="success">Paid</Badge>}
                    {!winner.prize_claimed && !isMyWinning(winner) && (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={() => navigate(`/challenges/${id}`)}>
            Back to Challenge
          </Button>
          <Button variant="secondary" onClick={() => navigate('/winners')}>
            All Winners
          </Button>
        </div>

        <WinnerClaimAgreement
          isOpen={showClaimModal}
          onConfirm={() => {
            void handleClaimPrize();
          }}
          onCancel={() => {
            setShowClaimModal(false);
            setSelectedWinnerId(null);
          }}
        />
      </Section>
    </Container>
  );
}
