-- Migration: Add man_intake_submissions table with RLS
-- Created: 2026-04-09

CREATE TABLE IF NOT EXISTS public.man_intake_submissions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_email          TEXT,
  customer_phone          TEXT,
  photo_fullbody_url      TEXT,
  photo_headshot_url      TEXT,

  -- Section 1 — Basics
  primary_goal            TEXT,
  style_relationship      TEXT,
  dressing_context        TEXT,
  location_tier           TEXT,

  -- Section 2 — Body
  height_category         TEXT,
  body_shape              TEXT,
  fat_storage_zone        TEXT,
  highlight_zone          TEXT,
  minimise_zone           TEXT,
  fit_preference          TEXT,
  wardrobe_composition    TEXT,

  -- Section 3 — Colour
  skin_tone               TEXT,
  vein_undertone          TEXT,
  white_test              TEXT,
  hair_colour             TEXT,
  eye_colour              TEXT,
  derived_colour_season   TEXT,

  -- Section 4 — Face
  face_shape              TEXT,
  facial_feature_type     TEXT,

  -- Section 5 — Style Identity
  primary_style_goal      TEXT,
  branch_answer           TEXT,
  style_tribes            TEXT,
  style_pole_structure    TEXT,
  style_pole_expression   TEXT,
  style_pole_tone         TEXT,
  style_pole_register     TEXT,
  style_blocker           TEXT,
  style_anti_pref         TEXT,
  style_anti_pref_note    TEXT,
  free_text_note          TEXT,

  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.man_intake_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated / anon) to submit the intake form
CREATE POLICY "man_intake_public_insert"
  ON public.man_intake_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read/update/delete submissions
CREATE POLICY "man_intake_admin_full_access"
  ON public.man_intake_submissions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
