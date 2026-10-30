/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- local debugging script */
// Runs the v5 head stylist for a saved classification and prints the final portfolio (one model call, no writes).
// node --experimental-strip-types --import ./scripts/node-test-hooks.mjs --env-file=.env.local scripts/men-recs/stylist.ts <submission-id>
import { readFileSync, writeFileSync } from 'node:fs';
import { getManOutfitLibraryAssignments, getManOutfitLibrary, manLookPieceText } from '@/lib/manOutfitLibrary';
import { withManRecommendationProfile } from '@/lib/manReportGenerator';
import { runManHeadStylist } from '@/lib/manHeadStylist';
import { manAiEngine } from '@/lib/manAi';

const id = process.argv[2];
const saved = JSON.parse(readFileSync(`scripts/men-recs/out/${id}.classification.json`, 'utf8'));
const classification = withManRecommendationProfile(saved.classification, saved.submission);
const now = new Date('2026-10-10');
console.log('engine:', manAiEngine());
const started = Date.now();
const stylist = await runManHeadStylist(classification, now);
console.log(`stylist took ${((Date.now() - started) / 1000).toFixed(0)}s; dropped: ${stylist.dropped.join('; ') || 'none'}`);
writeFileSync(`scripts/men-recs/out/${id}.stylist.json`, JSON.stringify({ ...stylist, classification }, null, 2));
const library = getManOutfitLibrary();
for (const a of getManOutfitLibraryAssignments(classification, library, now, '', stylist.overrides) as any[]) {
  const e = library.find(x => x.id === a.libraryLookId)!;
  const pinned = stylist.overrides.pinned?.[String(a.outfitNumber)] === a.libraryLookId;
  console.log(`${String(a.outfitNumber).padStart(2)} ${a.context.slice(0, 14).padEnd(14)} ${String(a.role).padEnd(9)} ${pinned ? 'STYLIST' : 'rules  '} #${a.libraryLookId} | ${manLookPieceText(e).slice(0, 140)}`);
  const why = stylist.overrides.stylistNotes?.[String(a.outfitNumber)];
  if (why && pinned) console.log(`      why: ${why}`);
}
