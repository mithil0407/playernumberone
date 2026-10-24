/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- local debugging script */
// Re-runs the v5 head stylist on a generated report's classification and compares variety with the stored picks.
// One or two model calls; writes nothing to the database.
// node --experimental-strip-types --import ./scripts/node-test-hooks.mjs --env-file=.env.local scripts/men-recs/report-stylist.ts <report-id>
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { getManOutfitLibrary, getManOutfitLibraryAssignments, manLookPieceText } from '@/lib/manOutfitLibrary';
import { findManPortfolioVarietyIssues } from '@/lib/manReportQa';
import { runManHeadStylist } from '@/lib/manHeadStylist';

const reportId = process.argv[2];
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data: report, error } = await sb.from('man_reports').select('report_data, created_at').eq('id', reportId).single();
if (error) throw error;
const classification = report.report_data.classification;
const library = getManOutfitLibrary();
const now = new Date();
const looksOf = (assignments: any[]) => assignments.map(a => {
  const e = library.find(x => x.id === a.libraryLookId)!;
  return { number: a.outfitNumber, context: a.context, top: e.top, layer: e.layer, bottom: e.bottom, footwear: e.footwear };
});
const stored = report.report_data.outfit_library.assignments;
console.log(`STORED picks: ${findManPortfolioVarietyIssues(looksOf(stored)).length} variety issues`);
for (const issue of findManPortfolioVarietyIssues(looksOf(stored))) console.log('  -', issue.message);

const stylist = await runManHeadStylist(classification, now);
const assignments = getManOutfitLibraryAssignments(classification, library, now, '', stylist.overrides) as any[];
writeFileSync(`scripts/men-recs/out/${reportId}.stylist.json`, JSON.stringify({ stylist, assignments }, null, 2));
console.log(`\nNEW: dropped ${stylist.dropped.length}, unresolved after repair ${stylist.issues.length}, released to rules: ${stylist.released.join(',') || 'none'}`);
const issues = findManPortfolioVarietyIssues(looksOf(assignments));
console.log(`NEW picks: ${issues.length} variety issues`);
for (const issue of issues) console.log('  -', issue.message);
for (const a of assignments) {
  const e = library.find(x => x.id === a.libraryLookId)!;
  const pinned = stylist.overrides.pinned?.[String(a.outfitNumber)] === a.libraryLookId;
  console.log(`${String(a.outfitNumber).padStart(2)} ${a.context.slice(0, 14).padEnd(14)} ${String(a.role).padEnd(9)} ${pinned ? 'STYLIST' : 'rules  '} #${a.libraryLookId} | ${manLookPieceText(e).slice(0, 135)}`);
}
