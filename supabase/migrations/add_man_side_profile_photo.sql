-- Migration: optional side-profile photo for men's blueprint intake

ALTER TABLE public.man_intake_submissions
  ADD COLUMN IF NOT EXISTS photo_side_profile_url TEXT;
