-- Migration: Add style_description to fashion_items and men_fashion_items
-- style_description: AI-generated rich stylist paragraph describing the item in detail
-- Used by the outfit generator to make better pairing decisions
-- Created: 2026-04-06

ALTER TABLE fashion_items
  ADD COLUMN IF NOT EXISTS style_description TEXT;

ALTER TABLE men_fashion_items
  ADD COLUMN IF NOT EXISTS style_description TEXT;
