import { useState } from 'react';
import { useVoting } from '@/hooks/useVoting';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Heart } from 'lucide-react';

interface VoteButtonProps {
  submissionId: string;
  challengeId: string;
  onVote?: () => void;
}

export function VoteButton({ submissionId, challengeId, onVote }: VoteButtonProps) {
  const { canVoteFree, recordFreeVote, recordPaidVote, hasUserVoted } = useVoting();
  const [showPaidConfirm, setShowPaidConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasVoted = hasUserVoted(submissionId);
  const canVoteFreeToday = canVoteFree();

  const handleFreeVote = async () => {
    setIsLoading(true);
    try {
      if (recordFreeVote(submissionId, challengeId)) {
        onVote?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaidVote = async () => {
    setIsLoading(true);
    try {
      if (await recordPaidVote(submissionId, challengeId)) {
        setShowPaidConfirm(false);
        onVote?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (hasVoted) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Heart size={16} className="fill-red-500 text-red-500" />
        Already Voted
      </Button>
    );
  }

  if (canVoteFreeToday) {
    return (
      <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleFreeVote} icon={<Heart size={16} />}>
        Free Vote
      </Button>
    );
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setShowPaidConfirm(true)} icon={<Heart size={16} />}>
        Pay to Vote
      </Button>

      <Modal isOpen={showPaidConfirm} onClose={() => setShowPaidConfirm(false)} title="Vote with DoroCoins" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[#9CA3AF]">
            Free votes are limited to 1 per challenge per day. Additional votes cost <span className="text-yellow-500 font-semibold">1 DoroCoin</span> each.
          </p>
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-md p-3">
            <p className="text-xs text-yellow-400">By confirming, you agree to the paid voting terms. Votes are non-refundable and final.</p>
          </div>
          <Button variant="primary" fullWidth isLoading={isLoading} onClick={handlePaidVote}>
            Pay 1 DoroCoin to Vote
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setShowPaidConfirm(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
