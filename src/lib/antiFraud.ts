const VOTE_WINDOW_MS = 60 * 1000;
const MAX_VOTES_PER_WINDOW = 5;

interface VoteRecord {
  timestamp: number;
}

let voteHistory: VoteRecord[] = [];

/** Returns true when activity is suspicious (too many votes in the window). */
export function recordVoteAttempt(): boolean {
  const now = Date.now();
  voteHistory = voteHistory.filter((v) => now - v.timestamp < VOTE_WINDOW_MS);
  voteHistory.push({ timestamp: now });

  return voteHistory.length > MAX_VOTES_PER_WINDOW;
}

export function resetVoteHistory() {
  voteHistory = [];
}
