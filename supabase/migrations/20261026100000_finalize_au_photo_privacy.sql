-- Final AU cutover. Apply only after the paid intake API is deployed and
-- private uploads, live page loads, and historical reference checks pass.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'au-intake-photos' AND public) THEN
    RAISE EXCEPTION 'Expected public legacy AU bucket is missing or already private';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.au_intake_submissions
    WHERE (photo_fullbody_url LIKE '%/storage/v1/object/public/au-intake-photos/%'
           AND COALESCE(photo_fullbody_path, '') NOT LIKE 'au-intake-private/%')
       OR (photo_headshot_url LIKE '%/storage/v1/object/public/au-intake-photos/%'
           AND COALESCE(photo_headshot_path, '') NOT LIKE 'au-intake-private/%')
  ) THEN
    RAISE EXCEPTION 'Some AU legacy photo references have no private path';
  END IF;
END $$;

DROP POLICY IF EXISTS "au_intake_public_insert" ON public.au_intake_submissions;
DROP POLICY IF EXISTS "au_intake_photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "au_intake_photos_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "au_intake_photos_public_update" ON storage.objects;
UPDATE storage.buckets SET public = false WHERE id = 'au-intake-photos';

COMMIT;
