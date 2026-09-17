import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync('src/app/stylist/report/[shareToken]/page.tsx', 'utf8');
const loader = readFileSync('src/lib/stylistBlueprintLoader.ts', 'utf8');

test('the client preview of an unpublished report is gated on report access', () => {
  const branch = page.slice(page.indexOf('async function loadReportForViewer'), page.indexOf('export default async function'));
  assert.match(branch, /getStylistBlueprintClientPreviewByShareToken\(shareToken\)/);
  assert.match(branch, /loaded && await canAccessBlueprintReport\(loaded\.report\.id\)/);
  // Without access the page falls through to the ordinary public loader.
  assert.match(branch, /return report \? \{ report, preview: null \} : null;/);
});

test('the public (cached) loader still hides unpublished consultation reports', () => {
  assert.match(loader, /loadClientReportByShareToken\(shareToken, \{ requireLive: true \}\)/);
  assert.match(loader, /return loaded\?\.live \? loaded\.report : null;/);
  const cached = loader.slice(loader.indexOf('export const getPublicStylistBlueprintByShareToken'));
  assert.match(cached, /loadPublicByShareToken\(shareToken\)/);
  assert.doesNotMatch(cached, /getStylistBlueprintClientPreviewByShareToken|allowUnpublished/);
});

test('client report images use stable links that sign on request, never baked-in signed URLs', () => {
  const publicReportFn = loader.slice(loader.indexOf('async function publicReport'), loader.indexOf('async function resolveRowImages'));
  assert.match(publicReportFn, /mapStylistBlueprintImagePaths\(row\.image_urls, path => stylistBlueprintClientImageUrl\(row\.share_token, path\)\)/);
  assert.doesNotMatch(publicReportFn, /resolveStylistBlueprintImageUrls/);
  const route = readFileSync('src/app/api/stylist-blueprint/share/[shareToken]/image/route.ts', 'utf8');
  assert.match(route, /isStylistBlueprintImagePath\(source\.imagePaths, path\)/);
  assert.match(route, /if \(!source\.live && !\(await canAccessBlueprintReport\(source\.reportId\)\)\) return notFound\(\);/);
});

test('the client report sends its styles with the server HTML', () => {
  assert.match(page, /<StyledJsxRegistry>/);
  assert.match(readFileSync('src/components/StyledJsxRegistry.tsx', 'utf8'), /useServerInsertedHTML/);
});

test('printing keeps backgrounds and a desktop layout, and Save as PDF waits for images', () => {
  const report = readFileSync('src/components/StylistBlueprintReport.tsx', 'utf8');
  const print = report.slice(report.lastIndexOf('@media print {'));
  assert.match(print, /print-color-adjust: exact !important/);
  assert.match(print, /\.iconik-report \{ padding: 0 !important; background: \$\{INK\} !important; zoom: 0\.72; \}/);
  assert.match(print, /\.grain \{ display: none !important; \}/);
  const chrome = readFileSync('src/components/StylistBlueprintViewerChrome.tsx', 'utf8');
  assert.match(chrome, /const restore = await prepareReportForPrint\(\);[\s\S]*window\.print\(\)/);
  const editor = readFileSync('src/app/stylist/admin/report/[reportId]/page.tsx', 'utf8');
  assert.match(editor, /const restore = await prepareReportForPrint\(\);[\s\S]*window\.print\(\);/);
});

test('client report images are served as cached reader-sized copies behind a loading cover', () => {
  const delivery = readFileSync('src/lib/stylistBlueprintImageDelivery.ts', 'utf8');
  assert.match(delivery, /\.resize\(\{ width: DISPLAY_WIDTH, withoutEnlargement: true \}\)[\s\S]*\.webp\(/);
  assert.match(delivery, /cached\.expiresAt - Date\.now\(\) > MIN_REMAINING_MS/);
  const route = readFileSync('src/app/api/stylist-blueprint/share/[shareToken]/image/route.ts', 'utf8');
  // Cache lifetime can never outlast the signed URL, and unpublished reports are never publicly cached.
  assert.match(route, /Math\.floor\(\(image\.expiresAt - Date\.now\(\)\) \/ 1000\) - 5 \* 60/);
  assert.match(route, /source\.live && cacheSeconds > 0 \? `public/);
  assert.match(page, /<StylistBlueprintReportIntro clientName=\{clientName\} \/>/);
  assert.match(readFileSync('src/components/StylistBlueprintReportIntro.tsx', 'utf8'), /const MAX_WAIT_MS = 10_000;/);
});
