// ============================================================
// Supabase Database Types — mirrors schema.sql exactly
// ============================================================

export type UserRole = 'free' | 'creatorPro' | 'eliteHost';
export type ChallengeFormat = '1v1' | 'group' | 'tournament';
export type ChallengePhase = 'upcoming' | 'entry_open' | 'entry_closed' | 'voting' | 'completed';
export type PrizeType = 'cash' | 'digital' | 'physical' | 'bragging_rights';
export type ScoringSystem = '1_rounder' | 'best_of_3' | 'best_of_5' | 'best_of_7' | 'points_based';
export type JudgeMethod = 'community_vote' | 'creator_decision' | 'hybrid';
export type LocationFormat = 'virtual' | 'in_person';
export type ContentType = 'video' | 'image' | 'text' | 'link' | 'file';
export type TransactionType = 'credit' | 'debit';
export type LiveEventStatus = 'upcoming' | 'live' | 'ended';
export type AgreementType =
  | 'master_account'
  | 'challenge_entry'
  | 'paid_voting'
  | 'dorocoin_purchase'
  | 'creator'
  | 'sponsor'
  | 'live_event'
  | 'winner_claim'
  | 'anti_fraud'
  | 'geo_compliance';

// ── profiles ────────────────────────────────────────────────
export interface Profile {
  id: string;
  name: string | null;
  role: UserRole;
  points: number;
  wins: number;
  challenges_count: number;
  avatar_url: string | null;
  dorocoin_balance: number;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

// ── challenges ───────────────────────────────────────────────
export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  format: ChallengeFormat;
  phase: ChallengePhase;
  prize_type: PrizeType | null;
  prize_description: string | null;
  entry_fee: number;
  max_participants: number | null;
  current_participants: number;
  created_by: string;
  scoring_system: ScoringSystem | null;
  is_private: boolean;
  invite_code: string | null;
  sponsorship_enabled: boolean;
  has_two_step: boolean;
  judge_method: JudgeMethod | null;
  location_format: LocationFormat | null;
  registration_deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  voting_end_date: string | null;
  results_date: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (not in DB column — populated by queries)
  creator?: Pick<Profile, 'id' | 'name' | 'avatar_url' | 'role'>;
  rules?: ChallengeRule[];
}

// ── challenge_rules ──────────────────────────────────────────
export interface ChallengeRule {
  id: string;
  challenge_id: string;
  rule_text: string;
  order_index: number;
  created_at: string;
}

// ── entries ──────────────────────────────────────────────────
export interface Entry {
  id: string;
  user_id: string;
  challenge_id: string;
  entry_fee_paid: number;
  created_at: string;
}

// ── submissions ──────────────────────────────────────────────
export interface Submission {
  id: string;
  entry_id: string;
  user_id: string;
  challenge_id: string;
  title: string | null;
  description: string | null;
  content_type: ContentType;
  content_url: string | null;
  votes_count: number;
  is_winner: boolean;
  placement: number | null;
  created_at: string;
  updated_at: string;
}

// ── votes ────────────────────────────────────────────────────
export interface Vote {
  id: string;
  voter_id: string;
  submission_id: string;
  challenge_id: string;
  is_paid_vote: boolean;
  dorocoins_spent: number;
  voted_date: string;
  created_at: string;
}

// ── wallet_transactions ──────────────────────────────────────
export interface WalletTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  balance_after: number;
  stripe_payment_id: string | null;
  created_at: string;
}

// ── notifications ────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

// ── agreements ───────────────────────────────────────────────
export interface Agreement {
  id: string;
  user_id: string;
  agreement_type: AgreementType;
  version: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ── live_events ──────────────────────────────────────────────
export interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  stream_url: string | null;
  thumbnail_url: string | null;
  status: LiveEventStatus;
  starts_at: string | null;
  created_by: string;
  created_at: string;
}

// ── tournaments ──────────────────────────────────────────────
export interface Tournament {
  id: string;
  challenge_id: string;
  bracket_data: Record<string, unknown> | null;
  current_round: number;
  total_rounds: number | null;
  created_at: string;
  updated_at: string;
}

// ── winners ──────────────────────────────────────────────────
export interface Winner {
  id: string;
  challenge_id: string;
  user_id: string;
  submission_id: string;
  placement: 1 | 2 | 3;
  prize_claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

// ── Filter helpers ───────────────────────────────────────────
export interface ChallengeFilters {
  category?: string;
  format?: ChallengeFormat;
  phase?: ChallengePhase;
  type?: 'free' | 'paid';
  search?: string;
}

// ── Create/Update payloads ───────────────────────────────────
export interface CreateChallengePayload {
  title: string;
  description: string;
  category: string;
  format: ChallengeFormat;
  phase?: ChallengePhase;
  prize_type: PrizeType;
  prize_description?: string;
  entry_fee: number;
  max_participants?: number;
  scoring_system?: ScoringSystem;
  is_private?: boolean;
  invite_code?: string;
  sponsorship_enabled?: boolean;
  has_two_step?: boolean;
  judge_method?: JudgeMethod;
  location_format?: LocationFormat;
  registration_deadline?: string;
  start_date?: string;
  end_date?: string;
  voting_end_date?: string;
  results_date?: string;
  rules?: string[];
}

export interface UpdateChallengePayload extends Partial<CreateChallengePayload> {
  cover_image_url?: string;
}
