-- Migration: Add subscriptions table for Iconik Closet
-- This table tracks recurring subscriptions separately from one-time orders
-- Created: 2024-01-28

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_name VARCHAR(255),

  -- Subscription details
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  plan_id VARCHAR(100) NOT NULL, -- Razorpay plan ID
  razorpay_subscription_id VARCHAR(100) UNIQUE,

  -- Pricing
  amount INTEGER NOT NULL, -- Amount in paise
  currency VARCHAR(10) DEFAULT 'INR',

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'pending')),

  -- Dates
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notes TEXT,
  original_order_id VARCHAR(100), -- If subscription came from consultation upsell

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on customer_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_email ON subscriptions(customer_email);

-- Create index on razorpay_subscription_id for payment webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_id ON subscriptions(razorpay_subscription_id);

-- Create index on status for filtering active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create index on customer_id for customer lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE subscriptions IS 'Stores recurring subscription data for Iconik Closet and other subscription offerings';
COMMENT ON COLUMN subscriptions.plan_type IS 'Type of subscription plan: monthly, quarterly, or yearly';
COMMENT ON COLUMN subscriptions.razorpay_subscription_id IS 'Razorpay subscription ID for payment tracking';
COMMENT ON COLUMN subscriptions.status IS 'Current status of the subscription';
COMMENT ON COLUMN subscriptions.original_order_id IS 'Reference to original consultation order if subscription is an upsell';
