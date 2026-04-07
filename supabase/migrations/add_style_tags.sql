-- Migration: Add style_tags JSONB to fashion_items and men_fashion_items
-- style_tags: structured AI-extracted tags enabling rule-based outfit matching
-- Replaces reliance on prose style_description for Phase 3 catalog matching
-- Created: 2026-04-07

ALTER TABLE fashion_items
  ADD COLUMN IF NOT EXISTS style_tags JSONB;

ALTER TABLE men_fashion_items
  ADD COLUMN IF NOT EXISTS style_tags JSONB;

-- Expected shape of style_tags (enforced at application layer, not DB):
-- {
--   "silhouette_type": "A-line" | "fitted" | "relaxed" | "flowy" | "structured" | "boxy" | "tailored" | "oversized" | "wrap" | "sheath" | "column",
--   "length": "crop" | "hip" | "midi" | "maxi" | "full" | "knee" | "ankle" | "mini" | null,
--   "neckline": "crew" | "v-neck" | "scoop" | "boat" | "square" | "halter" | "cowl" | "polo" | "mandarin" | "sweetheart" | "off-shoulder" | "none" | null,
--   "fit_category": "slim" | "regular" | "relaxed" | "oversized",
--   "visual_weight": "light" | "medium" | "heavy",
--   "sleeve_type": "sleeveless" | "cap" | "short" | "3-quarter" | "full" | "none" | null,
--   "coverage": ["arms_covered" | "tummy_covered" | "tummy_skimming" | "tummy_exposed" | "knee_below" | "knee_above" | "shoulders_covered" | "back_covered"],
--   "occasion_tags": ["casual" | "work" | "evening" | "weekend" | "formal" | "party"],
--   "undertone_compatibility": ["warm" | "cool" | "neutral" | "deep-warm" | "olive"],
--   "fabric_weight": "light" | "medium" | "heavy",
--   "pattern": "solid" | "stripe" | "check" | "floral" | "abstract" | "geometric" | "animal-print" | "embroidered" | "textured" | "printed"
-- }

CREATE INDEX IF NOT EXISTS idx_fashion_items_style_tags ON fashion_items USING GIN (style_tags);
CREATE INDEX IF NOT EXISTS idx_men_fashion_items_style_tags ON men_fashion_items USING GIN (style_tags);
