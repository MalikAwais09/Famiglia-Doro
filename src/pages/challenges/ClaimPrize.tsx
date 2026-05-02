import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MOCK_WINNERS } from '@/lib/mock/data';
import { getStorage, setStorage } from '@/lib/storage';
import type { WinnerRecord } from '@/types';
import { useState } from 'react';
import { WinnerClaimAgreement } from '@/components/agreements/WinnerClaimAgreement';
import { toast } from 'sonner';

export function ClaimPrize() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || 'user_current';
  const [claimOpen, setClaimOpen] = useState(false);

  const allWinners: WinnerRecord[] = [...MOCK_WINNERS, ...getStorage<WinnerRecord[]>('winners', [])];
  const record = allWinners.find(w => w.challengeId === id);
  const topWinner = record?.winners.find(w => w.position === 1);

  if (!record || !topWinner) return <Container><Section><p className="text-center text-[#9CA3AF] py-8">No winner data found</p></Section></Container>;

  const isWinner = userId === topWinner.userId;

  const handleClaim = () => {
    const winners = getStorage<WinnerRecord[]>('winners', []);
    const idx = winners.findIndex(w => w.challengeId === id);
    if (idx !== -1) {
      winners[idx].winners = winners[idx].winners.map(w => w.position === 1 ? { ...w, claimStatus: 'pending' as const } : w);
      setStorage('winners', winners);
    }
    toast.success('Claim submitted. Pending verification.');
    setClaimOpen(false);
  };

  const handleFinalize = () => {
    const winners = getStorage<WinnerRecord[]>('winners', []);
    const idx = winners.findIndex(w => w.challengeId === id);
    if (idx !== -1) {
      winners[idx].winners = winners[idx].winners.map(w => w.position === 1 ? { ...w, claimStatus: 'paid' as const, verified: true } : w);
      setStorage('winners', winners);
    }
    toast.success('Claim verified. Payout completed.');
  };

  return (
    <Container><Section>
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-2">Claim Prize</h1>
        <p className="text-sm text-[#9CA3AF] mb-6">{record.challengeTitle}</p>

        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center text-xl font-bold text-black">1</div>
            <div className="text-left flex-1">
              <p className="font-semibold">{topWinner.name}</p>
              <p className="text-sm text-[#9CA3AF]">{topWinner.votes} votes</p>
              <p className="text-xl font-bold text-emerald-400">${topWinner.prizeAmount}</p>
            </div>
          </div>
        </Card>

        {isWinner && topWinner.claimStatus === 'not_claimed' && (
          <Button fullWidth onClick={() => setClaimOpen(true)}>Claim Prize</Button>
        )}
        {isWinner && topWinner.claimStatus === 'pending' && (
          <div className="space-y-3">
            <Badge variant="warning" className="text-sm px-4 py-2">Claim Pending Verification</Badge>
            <Button fullWidth variant="secondary" onClick={handleFinalize}>Finalize Claim (Demo)</Button>
          </div>
        )}
        {isWinner && topWinner.claimStatus === 'paid' && (
          <Badge variant="success" className="text-sm px-4 py-2">Prize Paid</Badge>
        )}
        {!isWinner && <Button disabled fullWidth>Claim Prize</Button>}

        <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
      </div>

      <WinnerClaimAgreement
        isOpen={claimOpen}
        onCancel={() => setClaimOpen(false)}
        onConfirm={handleClaim}
      />
    </Section></Container>
  );
}
