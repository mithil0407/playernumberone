-- Migration: Add ICONIK Club Men tables
-- men_fashion_items, men_client_profiles, men_outfit_sets, men_outfit_items
-- Created: 2026-04-03

-- ─────────────────────────────────────────────────────────────
-- 1. men_fashion_items — men's catalog uploaded by admin
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.men_fashion_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  raw_description   TEXT,
  raw_image_url     TEXT,

  brand             TEXT,
  item_name         TEXT NOT NULL,
  category          TEXT CHECK (category IN (
                      'shirt','tshirt','trousers','jeans','suit','blazer',
                      'kurta','outerwear','shoes','accessory','other'
                    )),
  color             TEXT[],
  material          TEXT[],
  price             NUMERIC(10,2),
  currency          VARCHAR(10)  DEFAULT 'INR',
  size_availability TEXT[],
  purchase_link     TEXT,
  image_url         TEXT NOT NULL,

  ai_confidence     FLOAT,
  ai_raw_response   JSONB,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('active','archived','draft')),
  uploaded_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_men_fashion_items_category ON public.men_fashion_items(category);
CREATE INDEX IF NOT EXISTS idx_men_fashion_items_status   ON public.men_fashion_items(status);

-- ─────────────────────────────────────────────────────────────
-- 2. men_client_profiles — onboarded men's client data
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.men_client_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  phone                 TEXT,

  headshot_url          TEXT,
  body_photo_url        TEXT,

  -- Men-specific measurements
  height_cm             NUMERIC(5,1),
  weight_kg             NUMERIC(5,1),
  chest_cm              NUMERIC(5,1),
  waist_cm              NUMERIC(5,1),
  shoulder_cm           NUMERIC(5,1),

  body_shape            TEXT,         -- athletic / lean / stocky / broad / average
  size_estimate         TEXT,         -- S / M / L / XL / XXL
  style_notes           TEXT,
  style_restrictions    TEXT[] DEFAULT '{}',  -- e.g. 'formal_only', 'no_shorts'

  subscription_id       UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  onboarding_complete   BOOLEAN DEFAULT FALSE,

  preview_token         UUID DEFAULT gen_random_uuid() UNIQUE,
  token_expires_at      TIMESTAMPTZ,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_men_client_profiles_user_id ON public.men_client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_men_client_profiles_email   ON public.men_client_profiles(email);

-- ─────────────────────────────────────────────────────────────
-- 3. men_outfit_sets — AI-generated outfit sets per client
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.men_outfit_sets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES public.men_client_profiles(id) ON DELETE CASCADE,

  outfit_card_url   TEXT,
  ai_style_note     TEXT,
  occasion          TEXT CHECK (occasion IN (
                      'office','smart-casual','casual',
                      'indian-occasion','weekend','evening'
                    )),
  season            TEXT CHECK (season IN ('summer','winter','monsoon','all-season')),

  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','generating','ready','failed')),
  generation_batch  INT,
  error_message     TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_men_outfit_sets_client ON public.men_outfit_sets(client_id);
CREATE INDEX IF NOT EXISTS idx_men_outfit_sets_status ON public.men_outfit_sets(status);

-- ─────────────────────────────────────────────────────────────
-- 4. men_outfit_items — join table: outfit sets ↔ fashion items
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.men_outfit_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_set_id     UUID NOT NULL REFERENCES public.men_outfit_sets(id) ON DELETE CASCADE,
  fashion_item_id   UUID NOT NULL REFERENCES public.men_fashion_items(id) ON DELETE CASCADE,
  position          INT,   -- 1=top/shirt, 2=bottom/trousers, 3=shoes, 4=outerwear, 5=accessory

  UNIQUE (outfit_set_id, fashion_item_id)
);

CREATE INDEX IF NOT EXISTS idx_men_outfit_items_outfit ON public.men_outfit_items(outfit_set_id);

-- ─────────────────────────────────────────────────────────────
-- 5. updated_at triggers
-- ─────────────────────────────────────────────────────────────
-- Reuses update_updated_at_column() function already created by add_iconik_club_tables.sql

CREATE TRIGGER update_men_fashion_items_updated_at
  BEFORE UPDATE ON public.men_fashion_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_men_client_profiles_updated_at
  BEFORE UPDATE ON public.men_client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_men_outfit_sets_updated_at
  BEFORE UPDATE ON public.men_outfit_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 6. Row Level Security
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.men_fashion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "men_active_items_readable_by_authenticated"
  ON public.men_fashion_items FOR SELECT
  USING (status = 'active' AND auth.role() = 'authenticated');

CREATE POLICY "men_admin_full_access_fashion_items"
  ON public.men_fashion_items FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


ALTER TABLE public.men_client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "men_client_owns_profile"
  ON public.men_client_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "men_admin_full_access_client_profiles"
  ON public.men_client_profiles FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


ALTER TABLE public.men_outfit_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "men_client_owns_outfits"
  ON public.men_outfit_sets FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.men_client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "men_admin_full_access_outfit_sets"
  ON public.men_outfit_sets FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


ALTER TABLE public.men_outfit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "men_client_reads_outfit_items"
  ON public.men_outfit_items FOR SELECT
  USING (
    outfit_set_id IN (
      SELECT os.id FROM public.men_outfit_sets os
      JOIN public.men_client_profiles cp ON cp.id = os.client_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "men_admin_full_access_outfit_items"
  ON public.men_outfit_items FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 7. Storage buckets
-- Run the section below in Supabase SQL editor after the tables above.
-- ─────────────────────────────────────────────────────────────
-- Bucket: men-fashion-items  (public: true)
-- Bucket: men-client-photos  (public: false)
-- Bucket: men-outfit-cards   (public: false)
--
-- See: add_men_club_storage.sql
