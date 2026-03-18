-- Migration: Add Iconik Club tables
-- fashion_items, client_profiles, outfit_sets, outfit_items
-- Created: 2026-03-16

-- ─────────────────────────────────────────────────────────────
-- 1. fashion_items — AI-parsed item catalog uploaded by admin
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fashion_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Raw input stored for audit / re-processing
  raw_description   TEXT,
  raw_image_url     TEXT,

  -- AI-extracted structured fields
  brand             TEXT,
  item_name         TEXT NOT NULL,
  category          TEXT CHECK (category IN (
                      'top','bottom','dress','outerwear','shoes',
                      'bag','accessory','jumpsuit','skirt','other'
                    )),
  color             TEXT[],           -- e.g. ['navy', 'white']
  material          TEXT[],           -- e.g. ['cotton', 'polyester']
  price             NUMERIC(10,2),
  currency          VARCHAR(10)   DEFAULT 'INR',
  size_availability TEXT[],           -- normalised: ['XS','S','M','L','XL']
  purchase_link     TEXT,
  image_url         TEXT NOT NULL,    -- canonical Supabase Storage URL

  -- Metadata
  ai_confidence     FLOAT,            -- 0–1 confidence score from GPT-4o
  ai_raw_response   JSONB,            -- full GPT-4o response for debugging
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('active','archived','draft')),
  uploaded_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fashion_items_category ON fashion_items(category);
CREATE INDEX IF NOT EXISTS idx_fashion_items_status   ON fashion_items(status);

-- ─────────────────────────────────────────────────────────────
-- 2. client_profiles — onboarded client data + measurements
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Identity
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT,

  -- Photos (Supabase Storage URLs)
  headshot_url          TEXT,
  body_photo_url        TEXT,

  -- Measurements
  height_cm             NUMERIC(5,1),
  weight_kg             NUMERIC(5,1),
  bust_cm               NUMERIC(5,1),
  waist_cm              NUMERIC(5,1),
  hips_cm               NUMERIC(5,1),

  -- AI-derived during onboarding
  body_shape            TEXT,         -- hourglass / pear / apple / rectangle / inverted-triangle
  size_estimate         TEXT,         -- normalised size: XS / S / M / L / XL
  style_notes           TEXT,         -- GPT-4o free-form style notes from photo analysis

  -- Subscription link
  subscription_id       UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  onboarding_complete   BOOLEAN DEFAULT FALSE,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_email   ON client_profiles(email);

-- ─────────────────────────────────────────────────────────────
-- 3. outfit_sets — AI-generated outfit recommendations per client
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outfit_sets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,

  -- Composited card image
  outfit_card_url   TEXT,

  -- AI generation metadata
  ai_style_note     TEXT,             -- GPT-4o explanation of why this outfit works
  occasion          TEXT CHECK (occasion IN (
                      'casual','work','evening','weekend','formal','party'
                    )),
  season            TEXT CHECK (season IN ('summer','winter','monsoon','all-season')),

  -- Processing state
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','generating','ready','failed')),
  generation_batch  INT,              -- monthly batch number (1, 2, 3 …)
  error_message     TEXT,             -- populated on failure for debugging

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outfit_sets_client  ON outfit_sets(client_id);
CREATE INDEX IF NOT EXISTS idx_outfit_sets_status  ON outfit_sets(status);

-- ─────────────────────────────────────────────────────────────
-- 4. outfit_items — join table linking outfits ↔ fashion items
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outfit_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_set_id     UUID NOT NULL REFERENCES outfit_sets(id) ON DELETE CASCADE,
  fashion_item_id   UUID NOT NULL REFERENCES fashion_items(id) ON DELETE CASCADE,
  position          INT,              -- display order: 1=top, 2=bottom, 3=shoes, 4=accessory

  UNIQUE (outfit_set_id, fashion_item_id)
);

CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit ON outfit_items(outfit_set_id);

-- ─────────────────────────────────────────────────────────────
-- 5. updated_at auto-update trigger (reuse existing function if present)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fashion_items_updated_at
    BEFORE UPDATE ON fashion_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outfit_sets_updated_at
    BEFORE UPDATE ON outfit_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 6. Row Level Security
-- ─────────────────────────────────────────────────────────────

-- fashion_items: anyone authenticated can read active items; only admins write
ALTER TABLE fashion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active_items_readable_by_authenticated"
  ON fashion_items FOR SELECT
  USING (status = 'active' AND auth.role() = 'authenticated');

CREATE POLICY "admin_full_access_fashion_items"
  ON fashion_items FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- client_profiles: clients own their row; admins see all
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_owns_profile"
  ON client_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "admin_full_access_client_profiles"
  ON client_profiles FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- outfit_sets: clients see only their own outfits; admins see all
ALTER TABLE outfit_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_owns_outfits"
  ON outfit_sets FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_full_access_outfit_sets"
  ON outfit_sets FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- outfit_items: same visibility as outfit_sets
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_reads_outfit_items"
  ON outfit_items FOR SELECT
  USING (
    outfit_set_id IN (
      SELECT os.id FROM outfit_sets os
      JOIN client_profiles cp ON cp.id = os.client_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "admin_full_access_outfit_items"
  ON outfit_items FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ─────────────────────────────────────────────────────────────
-- 7. Storage buckets (run these manually in Supabase dashboard
--    OR via supabase CLI: supabase storage create <bucket>)
-- ─────────────────────────────────────────────────────────────
-- Bucket: fashion-items   (public: true)
-- Bucket: client-photos   (public: false)  — headshots + body photos
-- Bucket: outfit-cards    (public: false)  — composited outfit card images
