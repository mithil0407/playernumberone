-- Migration: Storage buckets for ICONIK Club Men
-- Run this AFTER add_men_club_tables.sql
-- Created: 2026-04-03

-- ─────────────────────────────────────────────────────────────
-- 1. Buckets
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('men-fashion-items', 'men-fashion-items', true),
  ('men-client-photos', 'men-client-photos', false),
  ('men-outfit-cards',  'men-outfit-cards',  false)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 2. men-fashion-items (public read, service role write)
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "men_fashion_items_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'men-fashion-items');

CREATE POLICY "men_fashion_items_service_write"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'men-fashion-items');

CREATE POLICY "men_fashion_items_service_update"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'men-fashion-items');

CREATE POLICY "men_fashion_items_service_delete"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'men-fashion-items');

-- ─────────────────────────────────────────────────────────────
-- 3. men-client-photos (private — client reads own, service role writes)
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "men_client_photos_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'men-client-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "men_client_photos_owner_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'men-client-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "men_client_photos_service_all"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'men-client-photos');

-- ─────────────────────────────────────────────────────────────
-- 4. men-outfit-cards (private — client reads own, service role writes)
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "men_outfit_cards_service_all"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'men-outfit-cards');

-- Clients access outfit cards via signed URLs generated server-side,
-- so no direct SELECT policy needed for authenticated role here.
