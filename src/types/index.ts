export type UserRole = 'free' | 'creatorPro' | 'eliteHost';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  points: number;
  wins: number;
  challenges: number;
}

export type ChallengePhase =
  | 'upcoming'
  | 'entry_open'
  | 'entry_closed'
  | 'active'
  | 'on_going'
  | 'closed'
  | 'voting'
  | 'pending_verification'
  | 'completed';
export type ChallengeFormat = '1v1' | 'group' | 'tournament';
export type PrizeType = 'cash' | 'digital' | 'physical' | 'bragging';
export type EventType = '1v1' | 'group' | 'tournament';
export type ScoringSystem = 'single' | 'bo3' | 'bo5' | 'bo7' | 'points';
export type JudgingMethod = 'community' | 'creator' | 'hybrid';
export type LocationFormat = 'virtual' | 'inperson';
export type SubmissionType = 'video' | 'image' | 'text' | 'link' | 'file';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
  format: ChallengeFormat;
  phase: ChallengePhase;
  prizeType: PrizeType;
  prizeDescription?: string;
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  createdBy: string;
  createdByName: string;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
  votingEndDate?: string;
  resultsDate?: string;
  rules: string[];
  customRules?: string;
  scoringSystem: ScoringSystem;
  timeLimit?: number;
  isPrivate: boolean;
  inviteCode?: string;
  minAge?: number;
  maxAge?: number;
  visibility?: 'invite_only' | 'hidden' | 'unlisted';
  sponsorshipEnabled: boolean;
  hasTwoStep: boolean;
  locationFormat: LocationFormat;
  status: 'live' | 'upcoming' | 'ended';
  promoVideoUrl?: string;
  exampleSubmissions?: string[];
  createdAt: string;
}

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: SubmissionType;
  title: string;
  description?: string;
  content: string;
  votes: number;
  submittedAt: string;
}

export interface Vote {
  id: string;
  submissionId: string;
  challengeId: string;
  userId: string;
  isFree: boolean;
  cost: number;
  votedAt: string;
}

export interface Winner {
  userId: string;
  name: string;
  avatar?: string;
  position: number;
  votes: number;
  prizeAmount: number;
  claimStatus: 'not_claimed' | 'pending' | 'paid';
  verified: boolean;
}

export interface WinnerRecord {
  challengeId: string;
  challengeTitle: string;
  winners: Winner[];
  announcedAt: string;
}

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  category: string;
  status: 'live' | 'upcoming';
  isPremiumOnly: boolean;
  startTime: string;
  endTime: string;
  viewerCount: number;
  hostName: string;
}

export interface TournamentData {
  id: string;
  name: string;
  type: 'single' | 'double' | 'roundrobin';
  participants: string[];
  rounds: TournamentRound[];
  status: string;
}

export interface TournamentRound {
  round: number;
  label: string;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: string;
  participant1: string;
  participant2: string;
  score1: number;
  score2: number;
  winner: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  balance: number;
  createdAt: string;
}

export interface Entry {
  id: string;
  challengeId: string;
  userId: string;
  entryFee: number;
  paymentMethod: 'dorocoin' | 'card' | 'free';
  status: 'active' | 'submitted' | 'completed';
  enteredAt: string;
  challengeTitle?: string;
  challengeImage?: string;
  challengeCategory?: string;
  challengePhase?: ChallengePhase;
}

export interface PricingTier {
  name: string;
  role: UserRole;
  price: string;
  priceNumber: number;
  features: string[];
  recommended?: boolean;
  badge?: string;
}

export interface ConsentLog {
  agreementType: string;
  userId: string;
  timestamp: string;
  version: string;
  ip: string;
}

export interface ChallengeFormData {
  title: string;
  category: string;
  customCategory?: string;
  description: string;
  promoImage?: File;
  trailerVideo?: File;
  exampleFiles?: File[];
  eventType: EventType;
  scoringSystem: ScoringSystem;
  timeLimitEnabled: boolean;
  timeLimitHours?: number;
  timeLimitMinutes?: number;
  uploadTimeLimitEnabled: boolean;
  uploadTimeLimitMinutes?: number;
  uploadTimeLimitSeconds?: number;
  twoStepEnabled: boolean;
  entryRoundDuration?: string;
  judgingMethod?: JudgingMethod;
  prizeType: PrizeType;
  prizeDescription?: string;
  entryFee: number;
  locationFormat: LocationFormat;
  sponsorshipEnabled: boolean;
  registrationDeadline: string;
  challengeStart: string;
  challengeEnd: string;
  flyerUpload?: File;
  scheduleVideo?: File;
  rulesPdf?: File;
  rules: string[];
  customRules: string;
  ageRestrictionEnabled: boolean;
  minAge?: number;
  maxAge?: number;
  isPrivate: boolean;
  inviteCode?: string;
  visibility?: 'invite_only' | 'hidden' | 'unlisted';
  restrictedUsers?: string;
}

// ==================== PRODUCTION TYPES ====================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  provider?: string;
  createdAt: Date;
}

export interface AgreementLog {
  id: string;
  userId: string;
  agreementType: 'master' | 'challenge_entry' | 'paid_voting' | 'doro_purchase' | 'creator' | 'sponsor' | 'live_event' | 'winner_claim' | 'anti_fraud' | 'geo_compliance';
  version: string;
  accepted: boolean;
  timestamp: Date;
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  userId: string;
  enteredAt: Date;
  paymentMethod: 'dorocoin' | 'card' | 'free';
  status: 'active' | 'submitted' | 'disqualified';
  amountPaid: number;
}

export interface ProductionSubmission {
  id: string;
  entryId: string;
  challengeId: string;
  userId: string;
  userName: string;
  type: SubmissionType;
  title: string;
  description: string;
  content: string;
  submittedAt: Date;
  votes: number;
  voters: string[];
}

export interface ProductionVote {
  id: string;
  submissionId: string;
  voterId: string;
  challengeId: string;
  voteType: 'free' | 'paid';
  timestamp: Date;
}

export interface ProductionWinner {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  position: 1 | 2 | 3;
  votes: number;
  prizeAmount: number;
  claimStatus: 'not_claimed' | 'pending' | 'paid';
  verified: boolean;
  claimedAt?: Date;
}

export interface ProductionWalletTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'deduction' | 'refund' | 'prize_payout';
  amount: number;
  balanceAfter: number;
  reason: string;
  timestamp: Date;
}

export interface ProductionNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'achievement';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  points: number;
  wins: number;
  challenges: number;
  rank?: number;
}

export interface ProductionLiveEvent {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  youtubeEmbedUrl: string;
  status: 'live' | 'upcoming' | 'ended';
  startDate: Date;
  endDate: Date;
  viewerCount: number;
  isPremiumOnly: boolean;
  category: string;
}

export interface ProductionTournament {
  id: string;
  name: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  participants: { id: string; name: string }[];
  rounds: TournamentRound[];
}

export interface ProductionTournamentMatch {
  id: string;
  participant1: { id: string; name: string; score: number };
  participant2: { id: string; name: string; score: number };
  winner?: string;
}

export type AgreementType = 'master' | 'challenge_entry' | 'paid_voting' | 'doro_purchase' | 'creator' | 'sponsor' | 'live_event' | 'winner_claim' | 'anti_fraud' | 'geo_compliance';
