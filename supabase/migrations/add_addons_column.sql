-- Migration: Add add_ons and product_type columns to orders table
-- This allows tracking which add-ons each customer purchased
-- Created: 2026-02-04

-- Add add_ons column to store comma-separated list of purchased add-ons
ALTER TABLE orders ADD COLUMN IF NOT EXISTS add_ons TEXT;

-- Add product_type column to identify the type of order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_type VARCHAR(50);

-- Add index for product_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_product_type ON orders(product_type);

-- Allow update policy for orders (needed for webhook updates)
-- Drop first if exists, then create
DROP POLICY IF EXISTS "Allow public update on orders" ON orders;
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);

-- Add comments for documentation
COMMENT ON COLUMN orders.add_ons IS 'Comma-separated list of purchased add-ons (e.g., "Wardrobe Detox, Smart Shopper''s Guide")';
COMMENT ON COLUMN orders.product_type IS 'Type of order: consultation, subscription, guide, ethnic, etc.';
