import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { entryStorage, submissionStorage } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';
import type { SubmissionType } from '@/types';

export const useChallengeEntry = () => {
  const { user, profile } = useAuth();
  const isAuthenticated = !!user;
  const userId = user?.id;
  const userName = profile?.name || 'User';
  const { balance, deductCoins } = useWallet();

  const hasEntered = (challengeId: string): boolean => {
    return userId ? entryStorage.getByUserAndChallenge(userId, challengeId) !== null : false;
  };

  const getEntry = (challengeId: string) => {
    return userId ? entryStorage.getByUserAndChallenge(userId, challengeId) : null;
  };

  const getSubmission = (challengeId: string) => {
    if (!userId) return null;
    return submissionStorage.getByChallengeId(challengeId).find(s => s.userId === userId) || null;
  };

  const enterChallenge = async (
    challengeId: string,
    entryFee: number,
    paymentMethod: 'dorocoin' | 'card' | 'free',
    challengeTitle?: string,
    challengeImage?: string,
    challengeCategory?: string,
    challengePhase?: string,
  ): Promise<boolean> => {
    if (!userId || !userName) {
      toast.error('Must be logged in');
      return false;
    }
    if (hasEntered(challengeId)) {
      toast.error('Already entered this challenge');
      return false;
    }

    const isPaid = entryFee > 0;
    if (isPaid && paymentMethod === 'dorocoin') {
      if (balance < entryFee) {
        toast.error('Insufficient DoroCoins');
        return false;
      }
      const ok = await deductCoins(entryFee, `Entry fee: ${challengeTitle || challengeId}`);
      if (!ok) {
        toast.error('Could not deduct DoroCoins');
        return false;
      }
    }

    const entry = {
      id: generateId('entry'),
      challengeId,
      userId,
      entryFee,
      paymentMethod: isPaid ? paymentMethod : ('dorocoin' as const),
      status: 'active' as const,
      enteredAt: new Date().toISOString(),
      challengeTitle,
      challengeImage,
      challengeCategory,
      challengePhase: challengePhase as any,
    };

    entryStorage.save(entry);
    toast.success('Entered challenge successfully');
    return true;
  };

  const submitWork = (
    challengeId: string,
    type: SubmissionType,
    title: string,
    description: string,
    content: string,
  ): boolean => {
    if (!userId || !userName) {
      toast.error('Must be logged in');
      return false;
    }

    const entry = entryStorage.getByUserAndChallenge(userId, challengeId);
    if (!entry) {
      toast.error('Must enter challenge before submitting');
      return false;
    }
    if (entry.status === 'submitted') {
      toast.error('Already submitted work for this challenge');
      return false;
    }

    const submission = {
      id: generateId('sub'),
      challengeId,
      userId,
      userName,
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
      type,
      title,
      description: description || undefined,
      content,
      votes: 0,
      submittedAt: new Date().toISOString(),
    };

    submissionStorage.save(submission);
    entry.status = 'submitted';
    entryStorage.save(entry);

    toast.success('Submission uploaded successfully');
    return true;
  };

  return { hasEntered, enterChallenge, submitWork, getEntry, getSubmission };
};
