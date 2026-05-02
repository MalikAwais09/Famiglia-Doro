-- Optional helpers + idempotent notification INSERT policy for existing projects.
-- Run in Supabase SQL Editor if schema.sql was applied before notifications_insert_authenticated existed.

CREATE OR REPLACE FUNCTION public.get_challenge_participant_count(challenge_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::integer FROM public.entries
  WHERE challenge_id = challenge_uuid;
$$;

CREATE OR REPLACE VIEW public.challenges_with_counts AS
SELECT
  c.*,
  COUNT(DISTINCT e.id)::integer AS real_participant_count,
  COUNT(DISTINCT s.id)::integer AS real_submission_count
FROM public.challenges c
LEFT JOIN public.entries e ON e.challenge_id = c.id
LEFT JOIN public.submissions s ON s.challenge_id = c.id
WHERE c.is_deleted = false
GROUP BY c.id;

DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
CREATE POLICY "notifications_insert_authenticated" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);
