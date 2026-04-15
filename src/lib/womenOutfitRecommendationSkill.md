# ICONIK Women Outfit Recommendation Skill

**Version:** 1.0  
**Scope:** ICONIK Club Women outfit generation  
**Output:** 6 outfits across 6 occasions  
**Logic:** Skill-guided taste profiling + constrained blueprinting + guided catalog matching

---

## HOW THIS SKILL WORKS

When generating women’s outfits for ICONIK Club, operate in three steps:

1. Build a normalized **Preference Profile JSON** from the client’s liked outfit examples, style notes, visual profile, measurements, restrictions, and budget.
2. Build 6 **Outfit Blueprint JSON** objects using the preference profile as the source of truth.
3. Match each blueprint against pre-filtered catalog candidates and return **Catalog Match JSON** using only the supplied candidate IDs.

Never introduce a silhouette, colour direction, footwear language, or styling register that the client has not clearly signalled.

---

## INPUT MAP

Use these inputs in this order of authority:

1. `liked_outfit_examples`
   The primary taste signal. These are direct examples of what the client already likes.
2. `style_notes`
   Secondary taste context. Useful for brands, aesthetics, dislikes, and softer cues.
3. `style_restrictions`
   Hard rules. Never violate them.
4. `visual_profile`
   Supports colour and silhouette calibration. It is not the client’s taste signal.
5. `measurements`
   Supports proportion and body-shape logic.
6. `budget_level`
   Influences fabric and catalog prioritisation, not taste.
7. `season`
   Controls fabric weight and layering frequency.

---

## PREFERENCE PROFILE JSON CONTRACT

Return only valid JSON with this exact shape:

```json
{
  "profileVersion": "women-skill-v1",
  "tasteSummary": "",
  "colour": {
    "temperature": "warm | cool | neutral",
    "depth": "light | medium | deep",
    "saturation": "soft | balanced | rich",
    "undertone": "warm | cool | neutral | deep-warm | olive",
    "preferredColours": ["", ""],
    "avoidedColours": ["", ""],
    "anchorNeutrals": ["", ""]
  },
  "silhouette": {
    "family": "apple | pear | hourglass | rectangle | inverted-triangle | petite | plus",
    "structurePreference": "layer-led | waist-defined | top-structured | bottom-weighted | elongating | balanced",
    "fitPreference": "relaxed | regular | fitted",
    "preferredCuts": ["", ""],
    "avoidCuts": ["", ""]
  },
  "styling": {
    "footwearLanguage": ["", ""],
    "bagLanguage": ["", ""],
    "accessoryLanguage": ["", ""],
    "disruptorStyle": "chromatic | structural | accessory | footwear",
    "disruptorTolerance": "subtle | moderate",
    "modestyRules": ["", ""],
    "signatureCodes": ["", ""],
    "antiCodes": ["", ""]
  },
  "occasionDirectives": {
    "casual": "",
    "work": "",
    "evening": "",
    "weekend": "",
    "formal": "",
    "party": ""
  }
}
```

Rules:
- `liked_outfit_examples` dominate when present.
- If the client repeats the same cue, convert it into a `signatureCode`.
- If the client explicitly rejects a cue, convert it into an `antiCode`.
- `modestyRules` must encode practical garment boundaries, not vague style language.
- `tasteSummary` should describe the client’s wardrobe system, not just individual garments.

---

## NON-NEGOTIABLE GENERATION RULES

- Max 3 colours per outfit. Two is preferred.
- One colour must lead, one must support, one must ground.
- Every outfit must contain at least 2 recurring signature elements from the preference profile.
- Never repeat the exact same outfit logic across the 6 looks.
- No single item type should dominate all 6 outfits unless the preference profile clearly demands it.
- Keep the wardrobe coherent: same woman, same taste system, different occasions.
- Do not use unsignalled statement pieces, maximalist styling, or experimental shapes unless the client has already signalled that taste.
- Respect all `style_restrictions` and `modestyRules` absolutely.

---

## OCCASION VOCABULARY

- `casual`: relaxed daywear, easy fabrics, polished but unfussy
- `work`: metro-office appropriate, clean structure, professional polish
- `evening`: refined dinner or cocktails, elevated texture and richer finish
- `weekend`: off-duty but intentional, more ease than work
- `formal`: eventwear, wedding guest, gala, or occasion dressing
- `party`: celebratory, confident, but still within the client’s taste language

The silhouette logic may stay related across occasions. Fabric, finish, shoe choice, and register should create the occasion shift.

---

## OUTFIT BLUEPRINT JSON CONTRACT

Return only valid JSON with this exact shape:

```json
[
  {
    "occasion": "casual",
    "title": "",
    "singlePiece": null,
    "top": "",
    "layer": null,
    "bottom": "",
    "shoes": "",
    "bag": null,
    "accessory": null,
    "disruptor": "",
    "colourHierarchy": "",
    "structurePiece": "",
    "signatureCodesUsed": ["", ""]
  }
]
```

Rules:
- Return exactly 6 objects.
- Each occasion must appear exactly once.
- If `singlePiece` is non-null, `top` and `bottom` must be null.
- `signatureCodesUsed` must name the recurring client-specific cues the look is honoring.
- The structure piece must be explicit and intentional.

---

## CATALOG MATCHING RUBRIC

You will receive server-built candidate pools for each slot. Use only those items.

Priority order:
1. Hard restrictions and coverage compliance
2. Silhouette and structure alignment
3. Occasion alignment
4. Undertone and colour alignment
5. Signature code alignment
6. Budget fit
7. Variety across the 6-outfit batch

Fallback rules:
- A good silhouette match may beat an exact colour match.
- Use fewer optional accessories rather than force a bad match.
- Shoes are mandatory.
- If no good bag or accessory exists, omit it.

---

## CATALOG MATCH JSON CONTRACT

Return only valid JSON with this exact shape:

```json
[
  {
    "occasion": "casual",
    "styleNote": "",
    "itemIds": ["", ""],
    "slotSelections": {
      "singlePiece": null,
      "top": "",
      "layer": null,
      "bottom": "",
      "shoes": "",
      "bag": null,
      "accessory": null
    }
  }
]
```

Rules:
- Return exactly 6 objects.
- Use only supplied candidate IDs.
- Do not use the same item in more than 2 outfits across the batch.
- Every outfit must have a valid base and shoes.
- Do not invent IDs or slots.
