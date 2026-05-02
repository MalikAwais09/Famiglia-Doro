-- RPC helpers for votes, entries, and profiles.
-- Run in Supabase SQL Editor. Argument names match @supabase/supabase-js .rpc() payloads.

CREATE OR REPLACE FUNCTION public.increment_votes(submission_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.submissions
  SET votes_count = votes_count + 1
  WHERE id = submission_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_participants(challenge_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.challenges
  SET current_participants = current_participants + 1
  WHERE id = challenge_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_participants(challenge_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.challenges
  SET current_participants = GREATEST(0, current_participants - 1)
  WHERE id = challenge_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_wins(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET wins = wins + 1
  WHERE id = user_id;
$$;

-- Second parameter is named `pts` (matches client + avoids shadowing column "points")
CREATE OR REPLACE FUNCTION public.add_points(user_id uuid, pts integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET points = points + pts
  WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_challenges_count(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET challenges_count = challenges_count + 1
  WHERE id = user_id;
$$;

-- Grant execute to authenticated users (adjust if you use service role only)
GRANT EXECUTE ON FUNCTION public.increment_votes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_participants(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_participants(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_wins(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_points(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_challenges_count(uuid) TO authenticated;
