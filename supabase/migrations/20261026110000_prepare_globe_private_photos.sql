-- Add durable paths and a private destination without altering existing Globe reads.
ALTER TABLE public.globe_intake_submissions
  ADD COLUMN IF NOT EXISTS photo_fullbody_path text,
  ADD COLUMN IF NOT EXISTS photo_headshot_path text;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'globe-intake-private' AND public) THEN
    RAISE EXCEPTION 'globe-intake-private already exists as a public bucket';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('globe-intake-private', 'globe-intake-private', false, 12582912,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
ON CONFLICT (id) DO NOTHING;
