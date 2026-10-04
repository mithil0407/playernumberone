import 'server-only';

// Renders the agent's image cards — product cards (agentPresentation.ts) and the
// Colour Card (agentColourCard.ts) — to PNG in headless Chrome, the same browser
// stack as report PDFs, with Google Fonts so text looks right on Vercel, and
// stores them for WhatsApp to fetch.

import type { Page } from 'puppeteer-core';
import { colourCardHtml, type ColourAnalysis } from '@/lib/agentColourCard';
import { launchHeadlessBrowser } from '@/lib/headlessBrowser';
import { productCardHtml, type PresentableProduct } from '@/lib/agentPresentation';
import { uploadAgentMedia } from '@/lib/agentStore';

const RENDER_TIMEOUT_MS = 15_000;

async function renderCard(page: Page, clientId: string, html: string) {
  await page.setContent(html, { waitUntil: 'load', timeout: RENDER_TIMEOUT_MS }).catch(() => undefined);
  // Fonts and photos come from other hosts; give them a moment to settle.
  await page.waitForNetworkIdle({ idleTime: 300, timeout: 6_000 }).catch(() => undefined);
  await page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => undefined);
  const card = await page.$('#card');
  if (!card) return null;
  const bytes = Buffer.from(await card.screenshot({ type: 'png' }));
  const uploaded = await uploadAgentMedia(clientId, bytes, 'image/png', 'png');
  return uploaded.signedUrl;
}

async function withCardPage<T>(width: number, fn: (page: Page) => Promise<T>) {
  const browser = await launchHeadlessBrowser('agent cards');
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1.5 });
    return await fn(page);
  } finally {
    await browser.close().catch(() => undefined);
  }
}

/** Returns a signed image URL per product number; products that fail to render are left out. */
export async function renderProductCards(clientId: string, products: PresentableProduct[], dateLabel: string) {
  const urls = new Map<number, string>();
  if (!products.length) return urls;
  await withCardPage(600, async page => {
    for (const product of products) {
      try {
        const url = await renderCard(page, clientId, productCardHtml(product, dateLabel));
        if (url) urls.set(product.number, url);
      } catch (error) {
        console.warn('[agent] product card render failed:', error);
      }
    }
  });
  return urls;
}

export async function renderColourCard(clientId: string, analysis: ColourAnalysis, dateLabel: string) {
  return withCardPage(720, page => renderCard(page, clientId, colourCardHtml(analysis, dateLabel)));
}
