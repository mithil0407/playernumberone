/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- local debugging script */
// Prints v4 and v5 outfit picks for a saved classification (no model calls, no writes).
// node --experimental-strip-types --import ./scripts/node-test-hooks.mjs scripts/men-recs/picks.ts <submission-id>
import { readFileSync } from 'node:fs';
import { getManOutfitLibraryAssignments, getManOutfitLibrary, manLookPieceText } from '@/lib/manOutfitLibrary';
import { withManRecommendationProfile } from '@/lib/manReportGenerator';
import { findManColourMentions } from '@/lib/manOutfitColour';

const id = process.argv[2];
const { submission, classification } = JSON.parse(readFileSync(`scripts/men-recs/out/${id}.classification.json`, 'utf8'));
const v5 = withManRecommendationProfile(classification, submission);
const { picker: _picker, ...v4Profile } = v5.recommendation_profile as any;
const v4 = { ...v5, recommendation_profile: v4Profile };
const library = getManOutfitLibrary();
const lead = (e: any) => { const noLayer = /^(none|no layer)\b/i.test(e.layer.trim()); return findManColourMentions(noLayer ? e.top : e.layer)[0]?.info.family ?? '?'; };
for (const [label, c] of [['V4 (today)', v4], ['V5 (new)', v5]] as const) {
  console.log(`\n===== ${label}`);
  const leads: Record<string, number> = {};
  for (const a of getManOutfitLibraryAssignments(c as any, undefined, new Date('2026-10-10'), '', {}) as any[]) {
    const e = library.find(x => x.id === a.libraryLookId)!;
    leads[lead(e)] = (leads[lead(e)] || 0) + 1;
    console.log(`${String(a.outfitNumber).padStart(2)} ${a.context.slice(0, 14).padEnd(14)} ${String(a.role ?? a.ladder).padEnd(9)} b${a.boldness} col${a.paletteFit} sty${a.styleMatch} #${a.libraryLookId} | ${manLookPieceText(e).slice(0, 150)}`);
  }
  console.log('lead colours near face:', Object.entries(leads).sort((a, b) => b[1] - a[1]).map(e => e.join(':')).join(' '));
}
