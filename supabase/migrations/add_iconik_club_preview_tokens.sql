-- Migration: Add preview token support to women Iconik Club client profiles.
-- Preview routes and admin send-preview routes depend on these fields.

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS preview_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

UPDATE client_profiles
SET preview_token = gen_random_uuid()
WHERE preview_token IS NULL;

ALTER TABLE client_profiles
  ALTER COLUMN preview_token SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_profiles_preview_token_unique
  ON client_profiles(preview_token);

CREATE INDEX IF NOT EXISTS idx_client_profiles_preview_token
  ON client_profiles(preview_token);
