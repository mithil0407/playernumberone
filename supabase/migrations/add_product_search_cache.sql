-- Migration: shopping links for man reports
--   1. man_reports.shopping_data column (Apify product-link state, sibling of
--      report_data so concurrent stylist edits never clobber pipeline writes)
--   2. product_search_cache table (cross-report Google Shopping result cache;
--      TTL enforced in code via SHOPPING_CACHE_TTL_DAYS)
-- Run AFTER: add_man_reports.sql
-- Created: 2026-07-10

-- ─────────────────────────────────────────────────────────────
-- 1. shopping_data column on man_reports
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.man_reports ADD COLUMN IF NOT EXISTS shopping_data JSONB;
-- Shape (ManShoppingState in src/lib/manShopping.ts):
-- {
--   version: 1,
--   status: 'idle' | 'fetching' | 'ranking' | 'ready' | 'error',
--   apifyRunId?, apifyDatasetId?, startedAt?, updatedAt, error?,
--   slots: { "<outfitNumber>:<top|bottom|layer|footwear>": {
--     descriptor, descriptorHash, query, candidates[], selected[], status
--   } }
-- }

-- ─────────────────────────────────────────────────────────────
-- 2. product_search_cache table
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_search_cache (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash       TEXT NOT NULL,          -- descriptorHash(normalized descriptor)
  normalized_query TEXT NOT NULL,          -- human-readable cache key (debugging)
  country          TEXT NOT NULL DEFAULT 'in',
  results          JSONB NOT NULL,         -- ApifyShoppingItem[]
  result_count     INT NOT NULL DEFAULT 0,
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (query_hash, country)
);

CREATE INDEX IF NOT EXISTS product_search_cache_hash_idx
  ON public.product_search_cache(query_hash, country);

-- ─────────────────────────────────────────────────────────────
-- 3. Row Level Security — service-role only (all access via supabaseAdmin)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.product_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_search_cache_service_all"
  ON public.product_search_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
