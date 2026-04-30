import { submissionStorage, entryStorage } from '@/lib/storage';
import type { Submission } from '@/types';

export const submissionService = {
  getByChallengeId: (challengeId: string): Submission[] => submissionStorage.getByChallengeId(challengeId),
  getByUserId: (userId: string): Submission[] => submissionStorage.getByUserId(userId),

  getUserSubmissionForChallenge: (userId: string, challengeId: string): Submission | null =>
    submissionStorage.getByChallengeId(challengeId).find(s => s.userId === userId) || null,

  getSorted: (challengeId: string): Submission[] =>
    submissionService.getByChallengeId(challengeId).sort((a, b) => b.votes - a.votes),

  canSubmit: (userId: string, challengeId: string): boolean => {
    const entry = entryStorage.getByUserAndChallenge(userId, challengeId);
    return !!entry && entry.status !== 'submitted';
  },

  getStats: (challengeId: string) => {
    const submissions = submissionService.getByChallengeId(challengeId);
    const totalVotes = submissions.reduce((sum, s) => sum + s.votes, 0);
    return {
      count: submissions.length,
      totalVotes,
      averageVotes: submissions.length > 0 ? Math.round(totalVotes / submissions.length) : 0,
      topSubmission: submissions.sort((a, b) => b.votes - a.votes)[0] || null,
    };
  },

  getByType: (challengeId: string, type: Submission['type']): Submission[] =>
    submissionService.getByChallengeId(challengeId).filter(s => s.type === type),

  getTrending: (challengeId: string, limit: number = 5): Submission[] =>
    submissionService.getSorted(challengeId).slice(0, limit),
};
