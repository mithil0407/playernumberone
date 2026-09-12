-- Extend the existing workspace to active stylists with an existing PIN.
-- Preserve all credentials and current client assignments.
UPDATE public.stylists AS stylist
SET workspace_enabled = true
WHERE stylist.is_active = true
  AND stylist.slug IS NOT NULL AND btrim(stylist.slug) <> ''
  AND EXISTS (SELECT 1 FROM public.stylist_credentials AS credential WHERE credential.stylist_id = stylist.id);
