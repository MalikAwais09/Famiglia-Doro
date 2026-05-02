-- ============================================================
-- FAMIGLIA D'ORO — Complete Database Schema
-- Supabase SQL Editor → Run this entire file
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TRIGGER FUNCTIONS (defined first, used later)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1. PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT,
  role              TEXT        NOT NULL DEFAULT 'free'
                                CHECK (role IN ('free', 'creatorPro', 'eliteHost')),
  points            INTEGER     NOT NULL DEFAULT 0,
  wins              INTEGER     NOT NULL DEFAULT 0,
  challenges_count  INTEGER     NOT NULL DEFAULT 0,
  avatar_url        TEXT,
  dorocoin_balance  INTEGER     NOT NULL DEFAULT 0,
  is_banned         BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. CHALLENGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.challenges (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 TEXT        NOT NULL,
  description           TEXT,
  category              TEXT,
  cover_image_url       TEXT,
  video_url             TEXT,
  format                TEXT        NOT NULL CHECK (format IN ('1v1', 'group', 'tournament')),
  phase                 TEXT        NOT NULL DEFAULT 'upcoming'
                                    CHECK (phase IN ('upcoming','entry_open','entry_closed','active','voting','completed')),
  prize_type            TEXT        CHECK (prize_type IN ('cash','digital','physical','bragging_rights')),
  prize_description     TEXT,
  entry_fee             INTEGER     NOT NULL DEFAULT 0,
  max_participants      INTEGER,
  current_participants  INTEGER     NOT NULL DEFAULT 0,
  created_by            UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scoring_system        TEXT        CHECK (scoring_system IN ('1_rounder','best_of_3','best_of_5','best_of_7','points_based')),
  is_private            BOOLEAN     NOT NULL DEFAULT false,
  invite_code           TEXT,
  sponsorship_enabled   BOOLEAN     NOT NULL DEFAULT false,
  has_two_step          BOOLEAN     NOT NULL DEFAULT false,
  judge_method          TEXT        CHECK (judge_method IN ('community_vote','creator_decision','hybrid')),
  location_format       TEXT        CHECK (location_format IN ('virtual','in_person')),
  registration_deadline TIMESTAMPTZ,
  start_date            TIMESTAMPTZ,
  end_date              TIMESTAMPTZ,
  voting_end_date       TIMESTAMPTZ,
  results_date          TIMESTAMPTZ,
  is_deleted            BOOLEAN     NOT NULL DEFAULT false,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 3. CHALLENGE RULES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.challenge_rules (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  rule_text    TEXT        NOT NULL,
  order_index  INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. ENTRIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.entries (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id   UUID        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  entry_fee_paid INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, challenge_id)
);

-- ============================================================
-- 5. SUBMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.submissions (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id     UUID        NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  title        TEXT,
  description  TEXT,
  content_type TEXT        NOT NULL CHECK (content_type IN ('video','image','text','link','file')),
  content_url  TEXT,
  votes_count  INTEGER     NOT NULL DEFAULT 0,
  is_winner    BOOLEAN     NOT NULL DEFAULT false,
  placement    INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, challenge_id)
);

CREATE OR REPLACE TRIGGER submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 6. VOTES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.votes (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id   UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  challenge_id    UUID        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  is_paid_vote    BOOLEAN     NOT NULL DEFAULT false,
  dorocoins_spent INTEGER     NOT NULL DEFAULT 0,
  voted_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (voter_id, submission_id)
);

-- ============================================================
-- 7. WALLET TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type             TEXT        NOT NULL CHECK (type IN ('credit','debit')),
  amount           INTEGER     NOT NULL,
  description      TEXT,
  balance_after    INTEGER     NOT NULL,
  stripe_payment_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  type       TEXT,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. AGREEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agreements (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agreement_type TEXT        NOT NULL CHECK (agreement_type IN (
    'master_account','challenge_entry','paid_voting','dorocoin_purchase',
    'creator','sponsor','live_event','winner_claim','anti_fraud','geo_compliance'
  )),
  version        TEXT        NOT NULL DEFAULT '1.0',
  ip_address     TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. LIVE EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.live_events (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT        NOT NULL,
  description   TEXT,
  stream_url    TEXT,
  thumbnail_url TEXT,
  status        TEXT        NOT NULL DEFAULT 'upcoming'
                            CHECK (status IN ('upcoming','live','ended')),
  starts_at     TIMESTAMPTZ,
  created_by    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. TOURNAMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tournaments (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id  UUID        NOT NULL UNIQUE REFERENCES public.challenges(id) ON DELETE CASCADE,
  bracket_data  JSONB,
  current_round INTEGER     NOT NULL DEFAULT 1,
  total_rounds  INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 12. WINNERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.winners (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id  UUID        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  placement     INTEGER     NOT NULL CHECK (placement IN (1, 2, 3)),
  prize_claimed BOOLEAN     NOT NULL DEFAULT false,
  claimed_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY — Enable on all tables
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_rules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: PROFILES
-- ============================================================

CREATE POLICY "profiles_select_all"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS POLICIES: CHALLENGES
-- ============================================================

CREATE POLICY "challenges_select_public"       ON public.challenges FOR SELECT USING (is_deleted = false);
CREATE POLICY "challenges_insert_authenticated" ON public.challenges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);
CREATE POLICY "challenges_update_own"          ON public.challenges FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "challenges_delete_own"          ON public.challenges FOR DELETE USING (auth.uid() = created_by);

-- ============================================================
-- RLS POLICIES: CHALLENGE RULES
-- ============================================================

CREATE POLICY "challenge_rules_select_all" ON public.challenge_rules FOR SELECT USING (true);
CREATE POLICY "challenge_rules_insert_creator" ON public.challenge_rules FOR INSERT
  WITH CHECK (auth.uid() = (SELECT created_by FROM public.challenges WHERE id = challenge_id));
CREATE POLICY "challenge_rules_update_creator" ON public.challenge_rules FOR UPDATE
  USING (auth.uid() = (SELECT created_by FROM public.challenges WHERE id = challenge_id));
CREATE POLICY "challenge_rules_delete_creator" ON public.challenge_rules FOR DELETE
  USING (auth.uid() = (SELECT created_by FROM public.challenges WHERE id = challenge_id));

-- ============================================================
-- RLS POLICIES: ENTRIES
-- ============================================================

CREATE POLICY "entries_select_own_or_creator" ON public.entries FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = (SELECT created_by FROM public.challenges WHERE id = challenge_id)
  );
CREATE POLICY "entries_insert_own" ON public.entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: SUBMISSIONS
-- ============================================================

CREATE POLICY "submissions_select_all"  ON public.submissions FOR SELECT USING (true);
CREATE POLICY "submissions_insert_own"  ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "submissions_update_own"  ON public.submissions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: VOTES
-- ============================================================

CREATE POLICY "votes_select_all"   ON public.votes FOR SELECT USING (true);
CREATE POLICY "votes_insert_own"   ON public.votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ============================================================
-- RLS POLICIES: WALLET TRANSACTIONS
-- ============================================================

CREATE POLICY "wallet_select_own" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallet_insert_own" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: NOTIFICATIONS
-- ============================================================

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_insert_authenticated" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES: AGREEMENTS
-- ============================================================

CREATE POLICY "agreements_select_own" ON public.agreements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agreements_insert_own" ON public.agreements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: LIVE EVENTS
-- ============================================================

CREATE POLICY "live_events_select_all" ON public.live_events FOR SELECT USING (true);
CREATE POLICY "live_events_insert_eliteHost" ON public.live_events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'eliteHost'
  );
CREATE POLICY "live_events_update_own" ON public.live_events FOR UPDATE
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- ============================================================
-- RLS POLICIES: TOURNAMENTS
-- ============================================================

CREATE POLICY "tournaments_select_all" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_update_creator" ON public.tournaments FOR UPDATE
  USING (auth.uid() = (SELECT created_by FROM public.challenges WHERE id = challenge_id))
  WITH CHECK (auth.uid() = (SELECT created_by FROM public.challenges WHERE id = challenge_id));

-- ============================================================
-- RLS POLICIES: WINNERS
-- ============================================================

CREATE POLICY "winners_select_all" ON public.winners FOR SELECT USING (true);
-- INSERT is intentionally restricted to service role only (no authenticated INSERT policy)

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    5242880,
    ARRAY['image/jpeg','image/png','image/webp']
  ),
  (
    'challenge-covers',
    'challenge-covers',
    true,
    10485760,
    ARRAY['image/jpeg','image/png','image/webp']
  ),
  (
    'submissions',
    'submissions',
    true,
    104857600,
    ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES: AVATARS
-- ============================================================

CREATE POLICY "avatars_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- STORAGE RLS POLICIES: CHALLENGE COVERS
-- ============================================================

CREATE POLICY "covers_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'challenge-covers');
CREATE POLICY "covers_insert_auth" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'challenge-covers' AND auth.uid() IS NOT NULL);
CREATE POLICY "covers_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'challenge-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "covers_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'challenge-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- STORAGE RLS POLICIES: SUBMISSIONS
-- ============================================================

CREATE POLICY "submissions_storage_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'submissions');
CREATE POLICY "submissions_storage_insert_auth" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'submissions' AND auth.uid() IS NOT NULL);
CREATE POLICY "submissions_storage_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "submissions_storage_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- DONE
-- ============================================================
