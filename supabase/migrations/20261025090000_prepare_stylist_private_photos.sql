-- Additive preparation for private Stylist intake photos. Existing public
-- objects and policies stay intact until application and backfill verification.
ALTER TABLE public.stylist_intake_responses
  ADD COLUMN IF NOT EXISTS source_photo_paths jsonb DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'stylist-intake-private' AND public) THEN
    RAISE EXCEPTION 'stylist-intake-private already exists as a public bucket';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('stylist-intake-private', 'stylist-intake-private', false, 12582912,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
ON CONFLICT (id) DO NOTHING;
