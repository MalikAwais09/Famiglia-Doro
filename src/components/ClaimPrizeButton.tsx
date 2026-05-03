import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { WinnerClaimAgreement } from '@/components/agreements/WinnerClaimAgreement';

interface Props {
  winnerId: string;
  challengeId: string;
  onClaimed: () => void;
}

export function ClaimPrizeButton({ winnerId, challengeId: _challengeId, onClaimed }: Props) {
  const [showAgreement, setShowAgreement] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { error } = await supabase
        .from('winners')
        .update({
          prize_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', winnerId);

      if (error) {
        toast.error('Failed to claim prize');
        return;
      }

      toast.success('Prize claimed successfully!');
      onClaimed();
    } catch {
      toast.error('Failed to claim prize');
    } finally {
      setClaiming(false);
      setShowAgreement(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowAgreement(true)}
        disabled={claiming}
        className="text-xs px-2 py-1 rounded bg-yellow-600 text-black font-medium disabled:opacity-60"
      >
        {claiming ? 'Claiming...' : 'Claim Prize'}
      </button>

      <WinnerClaimAgreement
        isOpen={showAgreement}
        onConfirm={handleClaim}
        onCancel={() => setShowAgreement(false)}
      />
    </>
  );
}
