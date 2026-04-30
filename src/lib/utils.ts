import type { Challenge, Submission, LeaderboardEntry } from '@/types';

// ==================== EXISTING UTILITIES (kept for backward compatibility) ====================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function generateId(prefix: string = ''): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${ts}_${rand}` : `${ts}_${rand}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDaysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export function getTimeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Started';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function detectRegion(): string {
  const regions = ['US', 'EU', 'CA', 'RESTRICTED'];
  return regions[Math.floor(Math.random() * regions.length)];
}

// ==================== PRODUCTION UTILITIES ====================

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
};

export const formatDatetime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
};

export const timeUntil = (targetDate: Date): string => {
  const diff = targetDate.getTime() - Date.now();
  if (diff < 0) return 'Ended';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 7) return `${days}d`;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const computeChallengePhase = (challenge: Challenge): Challenge['phase'] => {
  const now = Date.now();
  if (now < new Date(challenge.registrationDeadline).getTime()) return 'entry_open';
  if (now < new Date(challenge.startDate).getTime()) return 'entry_closed';
  if (now < new Date(challenge.endDate).getTime()) return 'voting';
  return 'completed';
};

export const getPhaseLabel = (phase: Challenge['phase']): string => {
  const labels: Record<Challenge['phase'], string> = {
    upcoming: 'Registration Opens Soon',
    entry_open: 'Registration Open',
    entry_closed: 'Registration Closed',
    voting: 'Voting Phase',
    pending_verification: 'Pending Verification',
    completed: 'Completed',
  };
  return labels[phase];
};

export const computeWinners = (challengeId: string, submissions: Submission[], totalEntries: number) => {
  if (submissions.length === 0) return [];
  const sorted = [...submissions].sort((a, b) => b.votes - a.votes);
  const percentages: Record<number, number> = { 1: 0.5, 2: 0.3, 3: 0.2 };
  return sorted.slice(0, 3).map((sub, idx) => {
    const position = (idx + 1) as 1 | 2 | 3;
    const prizePool = totalEntries * 10 * 0.85; // approximate
    return {
      userId: sub.userId,
      name: sub.userName,
      position,
      votes: sub.votes,
      prizeAmount: Math.round(prizePool * (percentages[position] || 0) * 100) / 100,
      claimStatus: 'not_claimed' as const,
      verified: false,
    };
  });
};

export const getPrizeDistribution = (prizePool: number) => ({
  winner: Math.round(prizePool * 0.5 * 100) / 100,
  creator: Math.round(prizePool * 0.35 * 100) / 100,
  platform: Math.round(prizePool * 0.15 * 100) / 100,
});

export const computeLeaderboard = (submissions: Submission[], winners: { userId: string; userName: string; position: number; challengeId: string }[]): LeaderboardEntry[] => {
  const userPoints: Record<string, { points: number; wins: number; challenges: Set<string>; name: string }> = {};
  const positionPoints: Record<number, number> = { 1: 50, 2: 30, 3: 20 };
  winners.forEach(w => {
    if (!userPoints[w.userId]) userPoints[w.userId] = { points: 0, wins: 0, challenges: new Set(), name: w.userName };
    userPoints[w.userId].points += positionPoints[w.position] || 0;
    userPoints[w.userId].wins += 1;
    userPoints[w.userId].challenges.add(w.challengeId);
  });
  submissions.forEach(sub => {
    if (!userPoints[sub.userId]) userPoints[sub.userId] = { points: 0, wins: 0, challenges: new Set(), name: sub.userName };
    userPoints[sub.userId].points += sub.votes;
    userPoints[sub.userId].challenges.add(sub.challengeId);
  });
  return Object.entries(userPoints)
    .map(([userId, data]) => ({ userId, userName: data.name, points: data.points, wins: data.wins, challenges: data.challenges.size }))
    .sort((a, b) => b.points - a.points)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
};

export const formatCardNumber = (value: string): string => {
  const v = value.replace(/\D/g, '').slice(0, 16);
  return v.replace(/(.{4})/g, '$1 ').trim();
};

export const formatExpiry = (value: string): string => {
  const v = value.replace(/\D/g, '').slice(0, 4);
  return v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
};

export const encodeCalendarEvent = (title: string, startDate: string, endDate: string): string => {
  const start = new Date(startDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = new Date(endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
};

export const isValidUrl = (url: string): boolean => { try { new URL(url); return true; } catch { return false; } };

export const truncate = (str: string, length: number): string =>
  str.length > length ? str.slice(0, length) + '...' : str;

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const percentage = (num: number, total: number): number =>
  total > 0 ? Math.round((num / total) * 100) : 0;

export const getFreeVoteKey = (userId: string, challengeId: string): string =>
  `fdoro_free_vote_${userId}_${challengeId}`;

export const hasUsedFreeVoteToday = (userId: string, challengeId: string): boolean => {
  const val = localStorage.getItem(getFreeVoteKey(userId, challengeId));
  return val === getTodayString();
};

export const recordFreeVote = (userId: string, challengeId: string): void => {
  localStorage.setItem(getFreeVoteKey(userId, challengeId), getTodayString());
};
