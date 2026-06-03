-- Color Mirror lead capture fields for the /stylist/style-score funnel.
ALTER TABLE IF EXISTS public.style_scan_leads
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS season_name text,
  ADD COLUMN IF NOT EXISTS diagnosis_answers jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS betrayer_colours text,
  ADD COLUMN IF NOT EXISTS power_palette text;

CREATE INDEX IF NOT EXISTS style_scan_leads_season_name_idx
  ON public.style_scan_leads(season_name);
