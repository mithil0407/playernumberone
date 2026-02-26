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
  customer_name TEXT,           -- persisted on payment confirmation
  customer_phone TEXT,          -- persisted on payment confirmation
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  iconik_edit_addon BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',  -- pending | completed | failed | paid
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  quiz_reminder_sent BOOLEAN DEFAULT FALSE, -- set true after reminder email is sent
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- AU Intake Submissions (from the native intake form)
CREATE TABLE IF NOT EXISTS au_intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT,
  customer_phone TEXT,
  photo_fullbody_url TEXT,
  photo_headshot_url TEXT,
  -- Step 4: Biggest frustration
  frustrations TEXT,         -- comma-separated selected options
  frustrations_custom TEXT,  -- free-text field
  -- Step 5: Situations to dress for
  situations TEXT,           -- comma-separated
  -- Step 6: Body areas least confident about
  body_insecurities TEXT,    -- comma-separated, max 2
  -- Step 7: Current wardrobe description
  wardrobe_type TEXT,
  -- Step 8: Colour preference
  colour_preference TEXT,
  -- Step 9: Style aesthetics
  style_aesthetics TEXT,     -- comma-separated, max 3
  -- Step 10: Style outcome
  style_outcome TEXT,
  -- Step 11: Coverage preferences (reuses concept of old style_restrictions)
  style_restrictions TEXT,   -- comma-separated
  -- Step 12: Hair type
  hair_type TEXT,            -- comma-separated, max 2
  -- Legacy columns (kept for old submissions, not populated by new form)
  skin_undertone TEXT,
  body_shape TEXT,
  face_shape TEXT,
  lifestyle TEXT,
  outfit_mix TEXT,
  extra_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_au_orders_customer_id ON au_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_au_orders_email ON au_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_au_intake_email ON au_intake_submissions(customer_email);

-- AU Style Feed Subscriptions (ICONIK Style Feed OTO)
CREATE TABLE IF NOT EXISTS au_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES au_customers(id),
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_name TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  plan_id TEXT NOT NULL,
  razorpay_subscription_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'completed', 'expired')),
  source TEXT DEFAULT 'au_oto',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_au_subscriptions_email ON au_subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_au_subscriptions_customer_id ON au_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_au_subscriptions_razorpay_id ON au_subscriptions(razorpay_subscription_id);

-- ============================================================
-- Storage Setup (do this in the Supabase Dashboard)
-- ============================================================
-- 1. Go to Storage in your AU Supabase project
-- 2. Create a new bucket: "au-intake-photos"
-- 3. Set it to PUBLIC (so files can be read without auth)
-- 4. Add policy: allow authenticated and anon inserts
-- ============================================================

-- ============================================================
-- MIGRATION: Run this if the au_orders table already exists
-- (adds columns introduced for email automation flows)
-- ============================================================
ALTER TABLE au_orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE au_orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE au_orders ADD COLUMN IF NOT EXISTS quiz_reminder_sent BOOLEAN DEFAULT FALSE;

-- ============================================================
-- MIGRATION: Run this if au_intake_submissions table already exists
-- (adds columns for redesigned intake form questions)
-- ============================================================
ALTER TABLE au_intake_submissions ADD COLUMN IF NOT EXISTS frustrations TEXT;
ALTER TABLE au_intake_submissions ADD COLUMN IF NOT EXISTS frustrations_custom TEXT;
ALTER TABLE au_intake_submissions ADD COLUMN IF NOT EXISTS situations TEXT;
ALTER TABLE au_intake_submissions ADD COLUMN IF NOT EXISTS body_insecurities TEXT;
ALTER TABLE au_intake_submissions ADD COLUMN IF NOT EXISTS wardrobe_type TEXT;
ALTER TABLE au_intake_submissions ADD COLUMN IF NOT EXISTS colour_preference TEXT;
ALTER TABLE au_intake_submissions ADD COLUMN IF NOT EXISTS style_aesthetics TEXT;
ALTER TABLE au_intake_submissions ADD COLUMN IF NOT EXISTS style_outcome TEXT;
