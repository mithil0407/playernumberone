-- Migration: Add ai_blueprint JSONB to outfit_sets and men_outfit_sets
-- ai_blueprint: the Phase 2 freeform outfit design Gemini generated before catalog matching
-- Allows admins to see what was ideally designed vs what was actually matched
-- Created: 2026-04-08

ALTER TABLE outfit_sets
  ADD COLUMN IF NOT EXISTS ai_blueprint JSONB;

ALTER TABLE men_outfit_sets
  ADD COLUMN IF NOT EXISTS ai_blueprint JSONB;
