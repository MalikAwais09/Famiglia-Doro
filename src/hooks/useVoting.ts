import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { voteStorage, submissionStorage } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';

export const useVoting = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const userId = user?.id;
  const { balance, deductCoins } = useWallet();

  const canVoteFree = (): boolean => {
    if (!isAuthenticated || !userId) return false;
    return voteStorage.hasFreeVotesAvailable(userId);
  };

  const recordFreeVote = (submissionId: string, challengeId: string): boolean => {
    if (!userId || !canVoteFree()) {
      toast.error('Free vote already used today');
      return false;
    }
    submissionStorage.addVote(submissionId, userId);
    voteStorage.record({
      id: generateId('vote'),
      submissionId,
      voterId: userId,
      challengeId,
      voteType: 'free',
      timestamp: new Date(),
    });
    toast.success('Free vote recorded');
    return true;
  };

  const recordPaidVote = (submissionId: string, challengeId: string): boolean => {
    if (!userId) return false;
    if (balance < 1) {
      toast.error('Insufficient DoroCoins (need 1)');
      return false;
    }
    if (!deductCoins(1, `vote_${submissionId}`)) return false;
    submissionStorage.addVote(submissionId, userId);
    voteStorage.record({
      id: generateId('vote'),
      submissionId,
      voterId: userId,
      challengeId,
      voteType: 'paid',
      timestamp: new Date(),
    });
    toast.success('Paid vote recorded (1 DoroCoin spent)');
    return true;
  };

  const hasUserVoted = (submissionId: string): boolean => {
    return userId ? voteStorage.hasVoted(submissionId, userId) : false;
  };

  const freeVotesRemainingToday = (): number => {
    return userId && canVoteFree() ? 1 : 0;
  };

  return { canVoteFree, recordFreeVote, recordPaidVote, hasUserVoted, freeVotesRemainingToday };
};
