import 'server-only';

// Renders product cards (agentPresentation.productCardHtml) to PNG in headless
// Chrome — the same browser stack as report PDFs, with Google Fonts so text looks
// right on Vercel — and stores them for WhatsApp to fetch.

import { launchHeadlessBrowser } from '@/lib/headlessBrowser';
import { productCardHtml, type PresentableProduct } from '@/lib/agentPresentation';
import { uploadAgentMedia } from '@/lib/agentStore';

const RENDER_TIMEOUT_MS = 15_000;

/** Returns a signed image URL per product number; products that fail to render are left out. */
export async function renderProductCards(clientId: string, products: PresentableProduct[], dateLabel: string) {
  const urls = new Map<number, string>();
  if (!products.length) return urls;
  const browser = await launchHeadlessBrowser('product cards');
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 600, height: 900, deviceScaleFactor: 1.5 });
    for (const product of products) {
      try {
        await page.setContent(productCardHtml(product, dateLabel), { waitUntil: 'load', timeout: RENDER_TIMEOUT_MS })
          .catch(() => undefined);
        // Fonts and the product photo come from other hosts; give them a moment to settle.
        await page.waitForNetworkIdle({ idleTime: 300, timeout: 6_000 }).catch(() => undefined);
        await page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => undefined);
        const card = await page.$('#card');
        if (!card) continue;
        const bytes = Buffer.from(await card.screenshot({ type: 'png' }));
        const uploaded = await uploadAgentMedia(clientId, bytes, 'image/png', 'png');
        if (uploaded.signedUrl) urls.set(product.number, uploaded.signedUrl);
      } catch (error) {
        console.warn('[agent] product card render failed:', error);
      }
    }
  } finally {
    await browser.close().catch(() => undefined);
  }
  return urls;
}
