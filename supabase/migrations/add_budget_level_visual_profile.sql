-- Migration: Add budget_level and visual_profile to client_profiles
-- budget_level: controls which price tier the AI prioritises when building outfits
-- visual_profile: AI-generated appearance description (age, skin tone, body shape, build, hair)

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS budget_level TEXT CHECK (budget_level IN ('high', 'mid', 'low')),
  ADD COLUMN IF NOT EXISTS visual_profile TEXT;
