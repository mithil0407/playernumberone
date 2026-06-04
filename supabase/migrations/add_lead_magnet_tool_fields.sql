-- Generic interactive lead magnet fields.
-- Keeps the existing Color Mirror / style_scan_leads funnel backward compatible.
ALTER TABLE IF EXISTS public.style_scan_leads
  ADD COLUMN IF NOT EXISTS tool_id text,
  ADD COLUMN IF NOT EXISTS tool_version text,
  ADD COLUMN IF NOT EXISTS result_key text,
  ADD COLUMN IF NOT EXISTS result_label text,
  ADD COLUMN IF NOT EXISTS result_summary text,
  ADD COLUMN IF NOT EXISTS result_payload jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS share_payload jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS style_scan_leads_tool_id_idx
  ON public.style_scan_leads(tool_id);

CREATE INDEX IF NOT EXISTS style_scan_leads_result_key_idx
  ON public.style_scan_leads(result_key);
