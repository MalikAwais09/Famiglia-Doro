import { submissionStorage, entryStorage, winnerStorage } from '@/lib/storage';
import { computeWinners, generateId } from '@/lib/utils';
import type { Winner, WinnerRecord } from '@/types';

export const useWinnersComputation = () => {
  const computeAndSaveWinners = (challengeId: string, challengeTitle: string): WinnerRecord | null => {
    const submissions = submissionStorage.getByChallengeId(challengeId);
    if (submissions.length === 0) return null;

    const existing = winnerStorage.getByChallenge(challengeId);
    if (existing.length > 0) return existing[0];

    const entries = entryStorage.getByChallengeId(challengeId);
    const totalEntries = Math.max(entries.length, submissions.length);
    const computedWinners = computeWinners(challengeId, submissions, totalEntries);

    if (computedWinners.length === 0) return null;

    const record: WinnerRecord = {
      challengeId,
      challengeTitle,
      winners: computedWinners.map(w => ({
        userId: w.userId,
        name: w.name,
        position: w.position,
        votes: w.votes,
        prizeAmount: w.prizeAmount,
        claimStatus: 'not_claimed' as const,
        verified: false,
      })),
      announcedAt: new Date().toISOString(),
    };

    winnerStorage.save(record);
    return record;
  };

  const getWinners = (challengeId: string): WinnerRecord[] => {
    return winnerStorage.getByChallenge(challengeId);
  };

  const canClaimPrize = (challengeId: string, userId: string): boolean => {
    const records = winnerStorage.getByChallenge(challengeId);
    const topWinner = records.flatMap(r => r.winners).find(w => w.userId === userId && w.position === 1);
    return topWinner ? topWinner.claimStatus === 'not_claimed' : false;
  };

  const startClaimProcess = (challengeId: string, userId: string): boolean => {
    const records = winnerStorage.getAll();
    const record = records.find(r => r.challengeId === challengeId);
    if (!record) return false;
    const winner = record.winners.find(w => w.userId === userId && w.position === 1);
    if (!winner || winner.claimStatus !== 'not_claimed') return false;
    winner.claimStatus = 'pending';
    winnerStorage.save(record);
    return true;
  };

  const finalizeClaim = (challengeId: string, userId: string): boolean => {
    const records = winnerStorage.getAll();
    const record = records.find(r => r.challengeId === challengeId);
    if (!record) return false;
    const winner = record.winners.find(w => w.userId === userId && w.position === 1);
    if (!winner || winner.claimStatus !== 'pending') return false;
    winner.claimStatus = 'paid';
    winner.verified = true;
    winnerStorage.save(record);
    return true;
  };

  return { computeAndSaveWinners, getWinners, canClaimPrize, startClaimProcess, finalizeClaim };
};
