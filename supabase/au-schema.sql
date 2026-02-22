-- ============================================================
-- ICONIK Australia — Supabase Schema
-- Run this in your AU Supabase project SQL editor
-- ============================================================

-- AU Customers
CREATE TABLE IF NOT EXISTS au_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AU Orders (from Razorpay AUD payments)
CREATE TABLE IF NOT EXISTS au_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES au_customers(id),
  customer_email TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  iconik_edit_addon BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',  -- pending | completed | failed | paid
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AU Intake Submissions (from the native intake form)
CREATE TABLE IF NOT EXISTS au_intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT,
  customer_phone TEXT,
  photo_fullbody_url TEXT,
  photo_headshot_url TEXT,
  skin_undertone TEXT,
  body_shape TEXT,
  face_shape TEXT,
  hair_type TEXT,           -- comma-separated, e.g. "Wavy,Fine"
  lifestyle TEXT,
  style_restrictions TEXT,  -- comma-separated, optional
  outfit_mix TEXT,
  extra_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_au_orders_customer_id ON au_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_au_orders_email ON au_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_au_intake_email ON au_intake_submissions(customer_email);

-- ============================================================
-- Storage Setup (do this in the Supabase Dashboard)
-- ============================================================
-- 1. Go to Storage in your AU Supabase project
-- 2. Create a new bucket: "au-intake-photos"
-- 3. Set it to PUBLIC (so files can be read without auth)
-- 4. Add policy: allow authenticated and anon inserts
-- ============================================================
