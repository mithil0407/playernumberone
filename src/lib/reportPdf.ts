import 'server-only';

import sharp from 'sharp';
import type { HTTPRequest } from 'puppeteer-core';
import { launchHeadlessBrowser } from './headlessBrowser';
import { REPORT_PDF_HOOK } from './reportPrint';

/**
 * Renders a report page to PDF in headless Chrome on the server.
 *
 * "Save as PDF" used to hand the report to the reader's own browser print.
 * Desktop Chrome honours the report's A4 page rules, but iPhone Safari ignores
 * the page size and adds its own margins, so each slide ran over its sheet and
 * the overflow printed as dark, near-empty sheets. In-app browsers (WhatsApp,
 * Instagram) cannot print at all. Rendering here gives every reader the same
 * one-slide-per-sheet PDF desktop Chrome makes.
 */

// Report images arrive as WebP, which Chrome embeds in a PDF as uncompressed
// pixels: a 60-page report came out at 54 MB. Re-encoded as JPEG, which Chrome
// embeds as-is, the same report is ~9 MB and looks the same.
const JPEG_QUALITY = 84;
const PAPER = '#F4EFE5';
const IMAGE_TYPES = /^image\/(webp|png|jpeg|avif)/;
/** How long the page may spend waiting for its images before printing what it has. */
const IMAGE_WAIT_MS = 90_000;

/**
 * Only the report's own origin, its image storage and web fonts are loaded.
 * Everything else (analytics pixels, session recording) is dropped, so a
 * render neither slows down on them nor counts as a reader's visit.
 */
function isAllowedRequest(url: URL, origin: string) {
  return url.origin === origin
    || url.hostname.endsWith('.supabase.co')
    || url.hostname === 'fonts.gstatic.com'
    || url.hostname === 'fonts.googleapis.com';
}

async function handleRequest(request: HTTPRequest, origin: string) {
  const url = new URL(request.url());
  if (url.protocol === 'data:' || url.protocol === 'blob:') return request.continue();
  if (!isAllowedRequest(url, origin)) return request.abort('blockedbyclient');
  if (request.resourceType() !== 'image') return request.continue();
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const type = response.headers.get('content-type') ?? '';
    const body = Buffer.from(await response.arrayBuffer());
    if (!response.ok || !IMAGE_TYPES.test(type)) {
      return request.respond({ status: response.status, contentType: type, body });
    }
    const jpeg = await sharp(body, { limitInputPixels: 40_000_000 })
      .rotate()
      .flatten({ background: PAPER })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    return request.respond({ status: 200, contentType: 'image/jpeg', body: jpeg });
  } catch {
    // Let Chrome try the original rather than print an empty frame.
    return request.continue();
  }
}

/** Renders `url` (a report page on `origin`) to an A4, one-slide-per-sheet PDF. */
export async function renderReportPdf(url: string): Promise<Buffer> {
  const origin = new URL(url).origin;
  const browser = await launchHeadlessBrowser('PDF rendering');
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.setRequestInterception(true);
    page.on('request', request => { void handleRequest(request, origin); });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForFunction(hook => typeof (window as unknown as Record<string, unknown>)[hook] === 'function', { timeout: 60_000 }, REPORT_PDF_HOOK);
    const pageCount = await page.evaluate(
      (hook, wait) => (window as unknown as Record<string, (timeoutMs: number) => Promise<number>>)[hook](wait),
      REPORT_PDF_HOOK,
      IMAGE_WAIT_MS,
    );
    if (!pageCount) throw new Error('Report rendered no pages');

    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, timeout: 120_000 });
    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => {});
  }
}
