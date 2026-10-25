-- Prepare AU intake for paid, order-scoped uploads without changing the
-- existing public bucket or its active clients.
ALTER TABLE public.au_intake_submissions
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS photo_fullbody_path text,
  ADD COLUMN IF NOT EXISTS photo_headshot_path text;

CREATE UNIQUE INDEX IF NOT EXISTS au_intake_submissions_order_id_unique
  ON public.au_intake_submissions(order_id) WHERE order_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'au-intake-private' AND public) THEN
    RAISE EXCEPTION 'au-intake-private already exists as a public bucket';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('au-intake-private', 'au-intake-private', false, 12582912,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
ON CONFLICT (id) DO NOTHING;
