// Keep all existing simple storage functions for backward compatibility
const PREFIX = 'fdoro_';

export function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function getRawStorage(key: string): string | null {
  return localStorage.getItem(key);
}

export function setRawStorage(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function removeStorage(key: string): void {
  localStorage.removeItem(PREFIX + key);
}

export function clearAuthStorage(): void {
  const keys = ['isAuthenticated', 'userId', 'userName', 'userEmail', 'userRole', 'authProvider'];
  keys.forEach(k => localStorage.removeItem(k));
}

export function clearAllStorage(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(k => {
    if (k.startsWith(PREFIX) || ['isAuthenticated', 'userId', 'userName', 'userEmail', 'userRole', 'authProvider'].includes(k)) {
      localStorage.removeItem(k);
    }
  });
}

export function appendToList<T>(key: string, item: T): T[] {
  const list = getStorage<T[]>(key, []);
  list.push(item);
  setStorage(key, list);
  return list;
}

export function updateInList<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T[] {
  const list = getStorage<T[]>(key, []);
  const idx = list.findIndex(item => item.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    setStorage(key, list);
  }
  return list;
}

// ==================== PRODUCTION STRUCTURED STORAGE ====================

import type { Challenge, Submission, Entry, WinnerRecord, WalletTransaction, Notification, ConsentLog, ChallengeEntry, ProductionVote, ProductionWinner, ProductionWalletTransaction, AgreementLog } from '@/types';

const KEYS = {
  AUTH_ISAUTH: 'isAuthenticated',
  AUTH_USERID: 'userId',
  AUTH_USERNAME: 'userName',
  AUTH_EMAIL: 'userEmail',
  AUTH_ROLE: 'userRole',
  AUTH_PROVIDER: 'authProvider',
  AUTH_CREATEDAT: 'userCreatedAt',
  WALLET_BALANCE: 'fdoro_dorocoins',
  WALLET_TRANSACTIONS: 'fdoro_wallet_transactions',
  CHALLENGES: 'fdoro_challenges',
  USER_ENTRIES: 'fdoro_userEntries',
  SUBMISSIONS: 'fdoro_submissions',
  VOTES: 'fdoro_votes',
  WINNERS: 'fdoro_winners',
  NOTIFICATIONS: 'fdoro_notifications',
  NOTIFICATIONS_ENABLED: 'fdoro_notifications_enabled',
  CONSENT_LOG: 'fdoro_consent_log',
  GEO_SHOWN: 'fdoro_geo_shown',
  REMINDERS: 'fdoro_reminders',
};

// ==================== AUTH STORAGE ====================
export const authStorage = {
  setUser: (user: { id: string; name: string; email: string; role: string; provider?: string }) => {
    localStorage.setItem(KEYS.AUTH_ISAUTH, 'true');
    localStorage.setItem(KEYS.AUTH_USERID, user.id);
    localStorage.setItem(KEYS.AUTH_USERNAME, user.name);
    localStorage.setItem(KEYS.AUTH_EMAIL, user.email);
    localStorage.setItem(KEYS.AUTH_ROLE, user.role);
    if (user.provider) localStorage.setItem(KEYS.AUTH_PROVIDER, user.provider);
    localStorage.setItem(KEYS.AUTH_CREATEDAT, new Date().toISOString());
  },

  getUser: () => {
    const isAuth = localStorage.getItem(KEYS.AUTH_ISAUTH) === 'true';
    if (!isAuth) return null;
    return {
      id: localStorage.getItem(KEYS.AUTH_USERID) || '',
      name: localStorage.getItem(KEYS.AUTH_USERNAME) || '',
      email: localStorage.getItem(KEYS.AUTH_EMAIL) || '',
      role: localStorage.getItem(KEYS.AUTH_ROLE) || 'free',
      provider: localStorage.getItem(KEYS.AUTH_PROVIDER) || undefined,
      createdAt: new Date(localStorage.getItem(KEYS.AUTH_CREATEDAT) || new Date().toISOString()),
    };
  },

  updateProfile: (user: { name?: string; email?: string }) => {
    if (user.name) localStorage.setItem(KEYS.AUTH_USERNAME, user.name);
    if (user.email) localStorage.setItem(KEYS.AUTH_EMAIL, user.email);
  },

  updateRole: (role: string) => {
    localStorage.setItem(KEYS.AUTH_ROLE, role);
  },

  clear: () => {
    clearAllStorage();
  },
};

// ==================== CHALLENGE STORAGE ====================
export const challengeStorage = {
  getAll: (): Challenge[] => getStorage<Challenge[]>('challenges', []),
  getById: (id: string): Challenge | null => challengeStorage.getAll().find(c => c.id === id) || null,
  getByCreator: (creatorId: string): Challenge[] => challengeStorage.getAll().filter(c => c.createdBy === creatorId),
  save: (challenge: Challenge) => {
    const challenges = challengeStorage.getAll();
    const index = challenges.findIndex(c => c.id === challenge.id);
    if (index > -1) challenges[index] = challenge;
    else challenges.push(challenge);
    setStorage('challenges', challenges);
  },
  updatePhase: (id: string, phase: Challenge['phase']) => {
    const challenge = challengeStorage.getById(id);
    if (challenge) { challenge.phase = phase; challengeStorage.save(challenge); }
  },
  delete: (id: string) => {
    setStorage('challenges', challengeStorage.getAll().filter(c => c.id !== id));
  },
};

// ==================== ENTRY STORAGE ====================
export const entryStorage = {
  getAll: (): Entry[] => getStorage<Entry[]>('userEntries', []),
  getByUserId: (userId: string): Entry[] => entryStorage.getAll().filter(e => e.userId === userId),
  getByUserAndChallenge: (userId: string, challengeId: string): Entry | null =>
    entryStorage.getAll().find(e => e.userId === userId && e.challengeId === challengeId) || null,
  getByChallengeId: (challengeId: string): Entry[] => entryStorage.getAll().filter(e => e.challengeId === challengeId),
  save: (entry: Entry) => {
    const entries = entryStorage.getAll();
    const index = entries.findIndex(e => e.id === entry.id);
    if (index > -1) entries[index] = entry;
    else entries.push(entry);
    setStorage('userEntries', entries);
  },
  updateStatus: (entryId: string, status: string) => {
    const entries = entryStorage.getAll();
    const entry = entries.find(e => e.id === entryId);
    if (entry) { entry.status = status as Entry['status']; setStorage('userEntries', entries); }
  },
};

// ==================== SUBMISSION STORAGE ====================
export const submissionStorage = {
  getAll: (): Submission[] => getStorage<Submission[]>('submissions', []),
  getById: (id: string): Submission | null => submissionStorage.getAll().find(s => s.id === id) || null,
  getByChallengeId: (challengeId: string): Submission[] =>
    submissionStorage.getAll().filter(s => s.challengeId === challengeId).sort((a, b) => b.votes - a.votes),
  getByUserId: (userId: string): Submission[] => submissionStorage.getAll().filter(s => s.userId === userId),
  save: (submission: Submission) => {
    const submissions = submissionStorage.getAll();
    const index = submissions.findIndex(s => s.id === submission.id);
    if (index > -1) submissions[index] = submission;
    else submissions.push(submission);
    setStorage('submissions', submissions);
  },
  addVote: (submissionId: string, voterId: string): boolean => {
    const submission = submissionStorage.getById(submissionId);
    if (submission) {
      submission.votes += 1;
      submissionStorage.save(submission);
      return true;
    }
    return false;
  },
};

// ==================== VOTE STORAGE ====================
export const voteStorage = {
  getAll: (): ProductionVote[] => getStorage<ProductionVote[]>('votes', []),
  record: (vote: ProductionVote) => {
    const votes = voteStorage.getAll();
    if (!votes.some(v => v.submissionId === vote.submissionId && v.voterId === vote.voterId && v.voteType === vote.voteType)) {
      votes.push(vote);
      setStorage('votes', votes);
    }
  },
  hasVoted: (submissionId: string, voterId: string): boolean =>
    voteStorage.getAll().some(v => v.submissionId === submissionId && v.voterId === voterId),
  getVoteCountToday: (voterId: string): number => {
    const today = new Date().toDateString();
    return voteStorage.getAll().filter(v => new Date(v.timestamp).toDateString() === today && v.voterId === voterId && v.voteType === 'free').length;
  },
  hasFreeVotesAvailable: (voterId: string): boolean => voteStorage.getVoteCountToday(voterId) < 1,
};

// ==================== WALLET STORAGE ====================
export const walletStorage = {
  getBalance: (_userId: string): number => {
    const data = localStorage.getItem(KEYS.WALLET_BALANCE);
    return data ? parseFloat(data) : 0;
  },
  setBalance: (_userId: string, amount: number) => {
    localStorage.setItem(KEYS.WALLET_BALANCE, Math.max(0, amount).toString());
  },
  addTransaction: (transaction: WalletTransaction) => {
    const transactions = getStorage<WalletTransaction[]>('wallet_transactions', []);
    transactions.push(transaction);
    setStorage('wallet_transactions', transactions);
  },
  getTransactions: (_userId: string, limit: number = 5): WalletTransaction[] => {
    const transactions = getStorage<WalletTransaction[]>('wallet_transactions', []);
    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  },
  getAllTransactions: (_userId: string): WalletTransaction[] => {
    return getStorage<WalletTransaction[]>('wallet_transactions', [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};

// ==================== WINNER STORAGE ====================
export const winnerStorage = {
  getByChallenge: (challengeId: string): WinnerRecord[] => {
    return getStorage<WinnerRecord[]>('winners', []).filter(w => w.challengeId === challengeId);
  },
  getAll: (): WinnerRecord[] => getStorage<WinnerRecord[]>('winners', []),
  save: (winner: WinnerRecord) => {
    const winners = winnerStorage.getAll();
    const index = winners.findIndex(w => w.challengeId === winner.challengeId);
    if (index > -1) winners[index] = winner;
    else winners.push(winner);
    setStorage('winners', winners);
  },
  updateClaimStatus: (challengeId: string, userId: string, position: number, status: 'not_claimed' | 'pending' | 'paid') => {
    const records = winnerStorage.getAll();
    const record = records.find(r => r.challengeId === challengeId);
    if (record) {
      const winner = record.winners.find(w => w.userId === userId && w.position === position);
      if (winner) {
        winner.claimStatus = status;
        if (status === 'paid') winner.verified = true;
        setStorage('winners', records);
      }
    }
  },
};

// ==================== NOTIFICATION STORAGE ====================
export const notificationStorage = {
  getAll: (_userId: string): Notification[] => getStorage<Notification[]>('notifications', []),
  add: (notification: Notification) => {
    const notifications = getStorage<Notification[]>('notifications', []);
    notifications.push(notification);
    setStorage('notifications', notifications);
  },
  markAsRead: (id: string) => {
    const notifications = getStorage<Notification[]>('notifications', []);
    const n = notifications.find(n => n.id === id);
    if (n) { n.read = true; setStorage('notifications', notifications); }
  },
  markAllAsRead: (_userId: string) => {
    const notifications = getStorage<Notification[]>('notifications', []);
    notifications.forEach(n => { n.read = true; });
    setStorage('notifications', notifications);
  },
  getUnreadCount: (_userId: string): number =>
    getStorage<Notification[]>('notifications', []).filter(n => !n.read).length,
  setEnabled: (enabled: boolean) => { localStorage.setItem(KEYS.NOTIFICATIONS_ENABLED, enabled.toString()); },
  isEnabled: (): boolean => localStorage.getItem(KEYS.NOTIFICATIONS_ENABLED) !== 'false',
};

// ==================== AGREEMENT STORAGE ====================
export const agreementStorage = {
  log: (agreement: ConsentLog) => {
    const logs = getStorage<ConsentLog[]>('consent_log', []);
    logs.push(agreement);
    setStorage('consent_log', logs);
  },
  hasAccepted: (userId: string, agreementType: string): boolean => {
    return getStorage<ConsentLog[]>('consent_log', []).some(l => l.userId === userId && l.agreementType === agreementType);
  },
  getAll: (): ConsentLog[] => getStorage<ConsentLog[]>('consent_log', []),
  markGeoShown: () => { sessionStorage.setItem(KEYS.GEO_SHOWN, 'true'); },
  hasGeoShown: (): boolean => sessionStorage.getItem(KEYS.GEO_SHOWN) === 'true',
};

// ==================== REMINDER STORAGE ====================
export const reminderStorage = {
  set: (eventId: string, eventDate: string) => {
    const reminders = getStorage<Record<string, string>>('reminders', {});
    reminders[eventId] = eventDate;
    setStorage('reminders', reminders);
  },
  get: (eventId: string): string | null => {
    const reminders = getStorage<Record<string, string>>('reminders', {});
    return reminders[eventId] || null;
  },
  has: (eventId: string): boolean => !!reminderStorage.get(eventId),
};
