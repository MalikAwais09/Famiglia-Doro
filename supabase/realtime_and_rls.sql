-- ============================================================
-- Step 5 — Enable Supabase Realtime + tournament / notification RLS
-- Run in Supabase SQL Editor (adjust if tables already in publication)
-- ============================================================

-- Realtime: add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- Allow challenge creators to initialize tournament rows
DROP POLICY IF EXISTS "tournaments_insert_challenge_creator" ON public.tournaments;
CREATE POLICY "tournaments_insert_challenge_creator"
  ON public.tournaments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT created_by FROM public.challenges WHERE id = challenge_id)
  );

-- Allow challenge creators to notify enrolled participants (tournament / winners flows)
DROP POLICY IF EXISTS "notifications_insert_by_challenge_creator" ON public.notifications;
CREATE POLICY "notifications_insert_by_challenge_creator"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.challenges c
      INNER JOIN public.entries e ON e.challenge_id = c.id AND e.user_id = notifications.user_id
      WHERE c.created_by = auth.uid()
    )
  );
