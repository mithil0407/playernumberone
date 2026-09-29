-- Published snapshots for stylist Blueprint reports.
--
-- A client reads the last published snapshot, never the stylist's live draft.
-- Editing a delivered report — which is what a revision request means — used to
-- clear published_at and take the client's WhatsApp link offline until the
-- stylist finished and republished. With a snapshot the two are independent:
-- the client keeps reading the version she was sent while the stylist works.

ALTER TABLE public.stylist_blueprint_reports
  ADD COLUMN IF NOT EXISTS published_report_data jsonb,
  ADD COLUMN IF NOT EXISTS published_image_urls jsonb,
  -- The row's `revision` at publish time. Draft and snapshot are identical
  -- while these match, so a mismatch is exactly "has unpublished changes".
  ADD COLUMN IF NOT EXISTS published_revision integer,
  -- What the client would call it: 1 on first publish, 2 after a revision.
  ADD COLUMN IF NOT EXISTS published_version integer NOT NULL DEFAULT 0;

-- Reports that are already live keep serving exactly what their client sees
-- today, so this migration is invisible to anyone holding an existing link.
UPDATE public.stylist_blueprint_reports
SET published_report_data = COALESCE(published_report_data, report_data),
    published_image_urls = COALESCE(published_image_urls, image_urls),
    published_revision = COALESCE(published_revision, revision),
    published_version = GREATEST(published_version, 1)
WHERE published_at IS NOT NULL;
