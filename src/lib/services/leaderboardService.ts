import { submissionStorage, winnerStorage } from '@/lib/storage';
import { computeLeaderboard, getWeeklyLeaderboard, getMonthlyLeaderboard } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

export const leaderboardService = {
  getGlobalLeaderboard: (): LeaderboardEntry[] => {
    const submissions = submissionStorage.getAll();
    const winners = winnerStorage.getAll().flatMap(r => r.winners.map(w => ({ ...w, challengeId: r.challengeId })));
    return computeLeaderboard(submissions, winners);
  },

  getWeeklyLeaderboard: (): LeaderboardEntry[] => getWeeklyLeaderboard(leaderboardService.getGlobalLeaderboard()),

  getMonthlyLeaderboard: (): LeaderboardEntry[] => getMonthlyLeaderboard(leaderboardService.getGlobalLeaderboard()),

  getUserRank: (userId: string): number | null => {
    const entry = leaderboardService.getGlobalLeaderboard().find(e => e.userId === userId);
    return entry?.rank || null;
  },

  getUserStats: (userId: string) => {
    const submissions = submissionStorage.getByUserId(userId);
    const allWinners = winnerStorage.getAll().flatMap(r => r.winners);
    const wins = allWinners.filter(w => w.userId === userId);
    return {
      totalSubmissions: submissions.length,
      totalVotes: submissions.reduce((s, sub) => s + sub.votes, 0),
      totalWins: wins.length,
      challenges: new Set(submissions.map(s => s.challengeId)).size,
      totalPrizeAmount: wins.reduce((s, w) => s + w.prizeAmount, 0),
      rank: leaderboardService.getUserRank(userId),
    };
  },

  getTopWinners: (limit: number = 10) => {
    const allWinners = winnerStorage.getAll().flatMap(r => r.winners);
    const byUser: Record<string, { userId: string; userName: string; wins: number; totalPrize: number }> = {};
    allWinners.forEach(w => {
      if (!byUser[w.userId]) byUser[w.userId] = { userId: w.userId, userName: w.name, wins: 0, totalPrize: 0 };
      byUser[w.userId].wins++;
      byUser[w.userId].totalPrize += w.prizeAmount;
    });
    return Object.values(byUser).sort((a, b) => b.wins - a.wins).slice(0, limit);
  },
};
