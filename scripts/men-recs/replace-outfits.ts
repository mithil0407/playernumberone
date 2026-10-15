// Replaces or rewrites chosen outfits in one Man report and saves it (the rest stay exactly as they are).
// node --experimental-strip-types --import ./scripts/node-test-hooks.mjs --env-file=.env.local scripts/men-recs/replace-outfits.ts <report-id> --replace 5,8,14,18 --rewrite 1 --fix "1=…"
import { replaceManReportOutfits } from '@/lib/manReportOutfitReplace';

const [reportId, ...args] = process.argv.slice(2);
const list = (flag: string) => (args[args.indexOf(flag) + 1] ?? '').split(',').map(Number).filter(Boolean);
const fixNotes = Object.fromEntries(args.flatMap((arg, index) => args[index - 1] === '--fix' ? [arg.split(/=(.*)/s).slice(0, 2)] : []));
const started = Date.now();
const result = await replaceManReportOutfits(reportId, {
  replace: args.includes('--replace') ? list('--replace') : [],
  rewrite: args.includes('--rewrite') ? list('--rewrite') : [],
  fixNotes,
});
console.log(`done in ${Math.round((Date.now() - started) / 1000)}s; status ${result.status}`);
console.log('pictures cleared for outfits:', result.clearedImageUrls.outfitCards.flatMap((path, index) => path ? [] : [index + 1]).join(', '));
console.log(result.updatedS4Outfits);
