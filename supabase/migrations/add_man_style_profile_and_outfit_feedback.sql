-- Men's Blueprint recommendations v4.
-- Run once in the Supabase SQL editor. Safe to re-run.

-- 1. The intake's new taste questions (experimentation and colour levels,
--    how his week splits, workplace dress code, the 12-look taste test,
--    pieces to try / never, age range, city, style reference link).
ALTER TABLE public.man_intake_submissions
  ADD COLUMN IF NOT EXISTS style_profile JSONB;

-- 2. Stylist 👍 / 👎 on each Blueprint outfit. Totals per library look feed
--    back into the outfit picker for every later client; a 👎 also keeps that
--    look out of the same client's future picks.
CREATE TABLE IF NOT EXISTS public.man_outfit_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.man_reports(id) ON DELETE CASCADE,
  outfit_number INTEGER NOT NULL CHECK (outfit_number BETWEEN 1 AND 40),
  library_look_id INTEGER,
  context TEXT,
  verdict TEXT NOT NULL CHECK (verdict IN ('up', 'down')),
  reasons TEXT[] NOT NULL DEFAULT '{}',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_id, outfit_number)
);

CREATE INDEX IF NOT EXISTS idx_man_outfit_feedback_look
  ON public.man_outfit_feedback(library_look_id);

ALTER TABLE public.man_outfit_feedback ENABLE ROW LEVEL SECURITY;

-- Feedback is only read and written through service-role admin API routes.
