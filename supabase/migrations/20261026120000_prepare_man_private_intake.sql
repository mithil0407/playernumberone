-- Prepare private Man uploads while existing public objects and sessions remain usable.
ALTER TABLE public.man_intake_upload_sessions
  ADD COLUMN IF NOT EXISTS storage_bucket text NOT NULL DEFAULT 'man-intake-photos',
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS customer_email text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.man_intake_upload_sessions'::regclass
      AND conname = 'man_intake_upload_session_storage_bucket_check'
  ) THEN
    ALTER TABLE public.man_intake_upload_sessions
      ADD CONSTRAINT man_intake_upload_session_storage_bucket_check
      CHECK (storage_bucket IN ('man-intake-photos', 'man-intake-private'));
  END IF;
END $$;

ALTER TABLE public.man_intake_submissions
  ADD COLUMN IF NOT EXISTS photo_fullbody_path text,
  ADD COLUMN IF NOT EXISTS photo_headshot_path text,
  ADD COLUMN IF NOT EXISTS photo_side_profile_path text,
  ADD COLUMN IF NOT EXISTS notification_claimed_at timestamptz;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'man-intake-private' AND public) THEN
    RAISE EXCEPTION 'man-intake-private already exists as a public bucket';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('man-intake-private', 'man-intake-private', false, 20971520,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
ON CONFLICT (id) DO NOTHING;
