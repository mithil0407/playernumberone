-- Migration: Add style_restrictions to client_profiles
-- Stores an array of styling constraint keys set during onboarding or by admin.
-- Example values: 'no_sleeveless', 'cover_tummy'

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS style_restrictions TEXT[] DEFAULT '{}';
