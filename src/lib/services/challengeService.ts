import { challengeStorage, entryStorage, submissionStorage } from '@/lib/storage';
import type { Challenge } from '@/types';
import { computeChallengePhase } from '@/lib/utils';

export const challengeService = {
  getAll: (): Challenge[] => challengeStorage.getAll(),
  getById: (id: string): Challenge | null => challengeStorage.getById(id),
  getByCreator: (creatorId: string): Challenge[] => challengeStorage.getByCreator(creatorId),

  getByPhase: (phase: Challenge['phase']): Challenge[] =>
    challengeService.getAll().filter(c => computeChallengePhase(c) === phase),

  getByCategory: (category: string): Challenge[] =>
    challengeService.getAll().filter(c => c.category === category),

  getByFormat: (format: Challenge['format']): Challenge[] =>
    challengeService.getAll().filter(c => c.format === format),

  getActive: (): Challenge[] =>
    challengeService.getAll().filter(c => {
      const phase = computeChallengePhase(c);
      return phase === 'entry_open' || phase === 'voting';
    }),

  getUpcoming: (): Challenge[] =>
    challengeService.getAll().filter(c => Date.now() < new Date(c.registrationDeadline).getTime()),

  getCompleted: (): Challenge[] =>
    challengeService.getAll().filter(c => Date.now() > new Date(c.endDate).getTime()),

  getWithPrizes: (): Challenge[] => challengeService.getAll().filter(c => c.prizeType !== 'bragging'),
  getFree: (): Challenge[] => challengeService.getAll().filter(c => c.entryFee === 0),
  getPaid: (): Challenge[] => challengeService.getAll().filter(c => c.entryFee > 0),
  getPrivate: (): Challenge[] => challengeService.getAll().filter(c => c.isPrivate),
  getPublic: (): Challenge[] => challengeService.getAll().filter(c => !c.isPrivate),

  search: (query: string): Challenge[] => {
    const q = query.toLowerCase();
    return challengeService.getAll().filter(c =>
      c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  },

  getStats: (challengeId: string) => {
    const challenge = challengeService.getById(challengeId);
    if (!challenge) return null;
    const entries = entryStorage.getByChallengeId(challengeId);
    const submissions = submissionStorage.getByChallengeId(challengeId);
    const totalVotes = submissions.reduce((sum, s) => sum + s.votes, 0);
    const totalRevenue = entries.reduce((sum, e) => sum + (e.entryFee || 0), 0);
    return {
      entries: entries.length,
      submissions: submissions.length,
      submissionRate: entries.length > 0 ? Math.round((submissions.length / entries.length) * 100) : 0,
      totalVotes,
      averageVotes: submissions.length > 0 ? Math.round(totalVotes / submissions.length) : 0,
      totalRevenue,
      prizePool: challenge.entryFee * entries.length * 0.85,
    };
  },

  getAllCategories: (): string[] => {
    const categories = new Set<string>();
    challengeService.getAll().forEach(c => categories.add(c.category));
    return Array.from(categories).sort();
  },

  getRelated: (challengeId: string, limit: number = 3): Challenge[] => {
    const challenge = challengeService.getById(challengeId);
    if (!challenge) return [];
    return challengeService.getByCategory(challenge.category)
      .filter(c => c.id !== challengeId && Date.now() <= new Date(c.endDate).getTime())
      .slice(0, limit);
  },

  isFull: (challengeId: string): boolean => {
    const challenge = challengeService.getById(challengeId);
    if (!challenge) return false;
    return challenge.currentParticipants >= challenge.maxParticipants;
  },
};
