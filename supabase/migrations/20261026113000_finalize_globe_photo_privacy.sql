-- Apply only after all historical Globe photos have checksum-verified private copies
-- and the deployed admin/report routes use signed private URLs.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'globe-intake-photos' AND public) THEN
    RAISE EXCEPTION 'Expected public legacy Globe bucket is missing or already private';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.globe_intake_submissions
    WHERE (photo_fullbody_url LIKE '%/storage/v1/object/public/globe-intake-photos/%'
           AND COALESCE(photo_fullbody_path, '') NOT LIKE 'globe-intake-private/%')
       OR (photo_headshot_url LIKE '%/storage/v1/object/public/globe-intake-photos/%'
           AND COALESCE(photo_headshot_path, '') NOT LIKE 'globe-intake-private/%')
  ) THEN
    RAISE EXCEPTION 'Some Globe legacy photo references have no private path';
  END IF;
END $$;

DROP POLICY IF EXISTS "globe_intake_public_insert" ON public.globe_intake_submissions;
DROP POLICY IF EXISTS "globe_intake_photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "globe_intake_photos_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "globe_intake_photos_public_update" ON storage.objects;
UPDATE storage.buckets SET public = false WHERE id = 'globe-intake-photos';

COMMIT;
