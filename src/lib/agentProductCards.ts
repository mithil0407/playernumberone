import 'server-only';

// Renders the agent's image cards — product cards (agentPresentation.ts), the
// Colour Card and shade cards (agentColourCard.ts) and the Body Card (agentBodyCard.ts) — to PNG in headless Chrome, the same browser
// stack as report PDFs, with Google Fonts so text looks right on Vercel, and
// stores them for WhatsApp to fetch.

import type { Browser, Page } from 'puppeteer-core';
import { bodyCardHtml, type BodyAnalysis } from '@/lib/agentBodyCard';
import { CARD_FONTS_HTML, colourCardHtml, shadeCardHtml, type ColourAnalysis, type ShadeCard } from '@/lib/agentColourCard';
import { launchHeadlessBrowser } from '@/lib/headlessBrowser';
import { productCardHtml, type PresentableProduct } from '@/lib/agentPresentation';
import { uploadAgentMedia } from '@/lib/agentStore';

const RENDER_TIMEOUT_MS = 15_000;

async function renderCard(page: Page, clientId: string, html: string): Promise<{ signedUrl: string | null; bytes: Buffer } | null> {
  await page.setContent(html, { waitUntil: 'load', timeout: RENDER_TIMEOUT_MS }).catch(() => undefined);
  // Fonts and photos come from other hosts; give them a moment to settle.
  await page.waitForNetworkIdle({ idleTime: 300, timeout: 6_000 }).catch(() => undefined);
  await page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => undefined);
  const card = await page.$('#card');
  if (!card) return null;
  const bytes = Buffer.from(await card.screenshot({ type: 'png' }));
  const uploaded = await uploadAgentMedia(clientId, bytes, 'image/png', 'png');
  return { signedUrl: uploaded.signedUrl, bytes };
}

// A browser launched ahead of time (see prewarmCardBrowser), used once.
let warmBrowser: { browser: Promise<Browser>; expires: number } | null = null;
const WARM_BROWSER_TTL_MS = 90_000;

/**
 * Starts Chrome and loads the card fonts while the model is still reading a
 * selfie, so the Colour Card renders without a cold start. Unused, it closes
 * itself after a minute and a half.
 */
export function prewarmCardBrowser() {
  if (warmBrowser && warmBrowser.expires > Date.now()) return;
  const browser = launchHeadlessBrowser('agent cards').then(async launched => {
    const page = await launched.newPage();
    await page.setContent(CARD_FONTS_HTML, { waitUntil: 'load', timeout: RENDER_TIMEOUT_MS }).catch(() => undefined);
    await page.close().catch(() => undefined);
    return launched;
  });
  const entry = { browser, expires: Date.now() + WARM_BROWSER_TTL_MS };
  warmBrowser = entry;
  browser.catch(() => undefined);
  setTimeout(() => {
    if (warmBrowser !== entry) return;
    warmBrowser = null;
    void browser.then(launched => launched.close()).catch(() => undefined);
  }, WARM_BROWSER_TTL_MS).unref?.();
}

async function takeBrowser() {
  const warm = warmBrowser && warmBrowser.expires > Date.now() ? warmBrowser.browser : null;
  warmBrowser = null;
  if (warm) {
    const launched = await warm.catch(() => null);
    if (launched?.connected) return launched;
  }
  return launchHeadlessBrowser('agent cards');
}

async function withCardPage<T>(width: number, fn: (page: Page) => Promise<T>) {
  const browser = await takeBrowser();
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
        const rendered = await renderCard(page, clientId, productCardHtml(product, dateLabel));
        if (rendered?.signedUrl) urls.set(product.number, rendered.signedUrl);
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

export async function renderBodyCard(clientId: string, analysis: BodyAnalysis, dateLabel: string) {
  return withCardPage(720, page => renderCard(page, clientId, bodyCardHtml(analysis, dateLabel)));
}

export async function renderShadeCard(clientId: string, card: ShadeCard) {
  return withCardPage(720, page => renderCard(page, clientId, shadeCardHtml(card)));
}
