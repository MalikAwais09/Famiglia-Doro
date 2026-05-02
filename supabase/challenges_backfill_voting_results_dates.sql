-- Step 7: Backfill voting_end_date and results_date from end_date for existing rows.
-- Run in Supabase SQL Editor.

UPDATE public.challenges
SET
  voting_end_date = COALESCE(voting_end_date, end_date + INTERVAL '7 days'),
  results_date = COALESCE(results_date, end_date + INTERVAL '9 days')
WHERE end_date IS NOT NULL
  AND (voting_end_date IS NULL OR results_date IS NULL);

-- Allow stored phase value "active" (required for CHECK constraint on some DBs).
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_phase_check;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_phase_check
  CHECK (phase IN ('upcoming','entry_open','entry_closed','active','voting','completed'));
