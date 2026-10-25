-- Run only after the new application is live, the backfill reports zero pending
-- references, private copies match source checksums, and signed reads pass.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'stylist-intake-photos' AND public) THEN
    RAISE EXCEPTION 'Expected public legacy Stylist bucket is missing or already private';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.stylist_intake_responses AS intake
    CROSS JOIN LATERAL jsonb_each_text(COALESCE(intake.photo_urls, '{}'::jsonb)) AS photo(key, value)
    WHERE photo.value LIKE 'https://igluqrlzulvzbieuslcd.supabase.co/storage/v1/object/public/stylist-intake-photos/%'
      AND COALESCE(intake.source_photo_paths ->> photo.key, '') NOT LIKE 'stylist-intake-private/%'
  ) THEN
    RAISE EXCEPTION 'Some legacy Stylist photo references have no private path';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.stylist_intake_responses AS intake
    WHERE intake.one_outfit_image_url LIKE 'https://igluqrlzulvzbieuslcd.supabase.co/storage/v1/object/public/stylist-intake-photos/%'
      AND COALESCE(intake.source_photo_paths ->> 'one_outfit', '') NOT LIKE 'stylist-intake-private/%'
  ) THEN
    RAISE EXCEPTION 'Some legacy outfit photos have no private path';
  END IF;
END $$;

DROP POLICY IF EXISTS "stylist_intake_photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "stylist_intake_photos_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "stylist_intake_photos_public_update" ON storage.objects;
UPDATE storage.buckets SET public = false WHERE id = 'stylist-intake-photos';

COMMIT;
