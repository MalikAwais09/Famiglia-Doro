-- Agreements table RLS and columns (run in Supabase SQL Editor if not already applied)
-- Matches public.agreements in schema.sql

ALTER TABLE public.agreements
  ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0';

ALTER TABLE public.agreements
  ADD COLUMN IF NOT EXISTS user_agent text;

DROP POLICY IF EXISTS "agreements_insert_own" ON public.agreements;
CREATE POLICY "agreements_insert_own"
  ON public.agreements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "agreements_select_own" ON public.agreements;
CREATE POLICY "agreements_select_own"
  ON public.agreements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
