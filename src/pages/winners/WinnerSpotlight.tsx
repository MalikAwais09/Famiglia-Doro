import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MOCK_CHALLENGES, MOCK_SUBMISSIONS, MOCK_WINNERS } from '@/lib/mock/data';
import { getStorage, setStorage } from '@/lib/storage';
import type { Challenge, WinnerRecord } from '@/types';
import { useState } from 'react';
import { WinnerClaimAgreement } from '@/components/agreements/WinnerClaimAgreement';
import { toast } from 'sonner';
import { Share2, Trophy } from 'lucide-react';

export function WinnerSpotlight() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || 'user_current';
  const [claimOpen, setClaimOpen] = useState(false);

  const allChallenges: Challenge[] = [...MOCK_CHALLENGES, ...getStorage<Challenge[]>('challenges', [])];
  const challenge = allChallenges.find(c => c.id === challengeId);

  const allWinners: WinnerRecord[] = [...MOCK_WINNERS, ...getStorage<WinnerRecord[]>('winners', [])];
  let winnerRecord = allWinners.find(w => w.challengeId === challengeId);

  if (!winnerRecord && challengeId) {
    const subs = MOCK_SUBMISSIONS.filter(s => s.challengeId === challengeId).sort((a, b) => b.votes - a.votes);
    if (subs.length >= 3) {
      winnerRecord = {
        challengeId: challengeId,
        challengeTitle: challenge?.title || 'Challenge',
        announcedAt: new Date().toISOString(),
        winners: subs.slice(0, 3).map((s, i) => ({
          userId: s.userId,
          name: s.userName,
          avatar: s.userAvatar,
          position: i + 1,
          votes: s.votes,
          prizeAmount: Math.floor((challenge?.entryFee || 0) * (challenge?.currentParticipants || 0) * (i === 0 ? 0.5 : i === 1 ? 0.3 : 0.2)),
          claimStatus: 'not_claimed' as const,
          verified: false,
        })),
      };
    }
  }

  if (!challenge || !winnerRecord) return <Container><Section><p className="text-center text-[#9CA3AF] py-8">Challenge or winners not found</p></Section></Container>;

  const topWinner = winnerRecord.winners[0];
  const isTopWinner = userId === topWinner.userId;

  const handleClaim = () => {
    const winners = getStorage<WinnerRecord[]>('winners', allWinners.filter(w => w.challengeId !== challengeId));
    const updated = { ...winnerRecord!, winners: winnerRecord!.winners.map(w => w.position === 1 ? { ...w, claimStatus: 'pending' as const } : w) };
    winners.push(updated);
    setStorage('winners', winners);
    toast.success('Claim submitted. Pending verification.');
    setClaimOpen(false);
  };

  const handleFinalize = () => {
    const winners = getStorage<WinnerRecord[]>('winners', allWinners.filter(w => w.challengeId !== challengeId));
    const updated = { ...winnerRecord!, winners: winnerRecord!.winners.map(w => w.position === 1 ? { ...w, claimStatus: 'paid' as const, verified: true } : w) };
    winners.push(updated);
    setStorage('winners', winners);
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
                  {isTopWinner && topWinner.claimStatus === 'not_claimed' && <Button onClick={() => setClaimOpen(true)}>Claim Prize</Button>}
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
            {winnerRecord.winners.slice(1).map(w => (
              <Card key={w.position}>
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

      <WinnerClaimAgreement isOpen={claimOpen} onCancel={() => setClaimOpen(false)} onConfirm={handleClaim} />
    </Section></Container>
  );
}
