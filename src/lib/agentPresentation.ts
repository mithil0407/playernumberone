// How verified products are presented on WhatsApp: one branded card image per
// product, numbered so the client can reply "1" or "2", with a caption that
// carries the facts the store page confirmed and a tracked shop link.

import { formatInr } from './agentLookLinks.ts';

export interface PresentableProduct {
  number: number;
  title: string;
  retailer: string | null;
  priceInr: number | null;
  mrpInr: number | null;
  colour: string | null;
  reason: string | null;
  isPick: boolean;
  status: 'verified' | 'failed' | 'unavailable' | 'pending' | 'checking';
  sizeChecked: string | null;
  sizeAvailable: boolean | null;
  deliveryEstimate: string | null;
  pincode: string | null;
  imageUrl: string | null;
  shopUrl: string;
}

/** Shorter size note for chat: "M" when the client gave a plain size, else just "your size". */
export function sizeLabel(size: string | null) {
  if (!size) return null;
  const trimmed = size.trim();
  return trimmed.length <= 6 ? trimmed : 'your size';
}

/** "By Tue, Oct 06 for 411037" → "by Tue, Oct 06": stores phrase delivery dates in many ways. */
export function deliveryPhrase(estimate: string) {
  const cleaned = estimate
    .replace(/\s*(?:for|to|at)\s*(?:pincode\s*)?\d{6}\b/gi, '')
    .replace(/^(?:estimated\s+)?(?:delivery|arrives|get it|delivered)\s*:?\s*/i, '')
    .trim();
  return cleaned.replace(/^(By|On|Within|Between)\b/, word => word.toLowerCase());
}

export function buildProductCaption(product: PresentableProduct) {
  const price = formatInr(product.priceInr);
  const headline = `${product.number}) ${product.title}${price ? ` — ${price}` : ''}${product.isPick ? ' · my pick' : ''}`;
  const lines = [headline];
  if (product.reason) lines.push(product.reason);

  const facts: string[] = [];
  const size = sizeLabel(product.sizeChecked);
  if (product.status === 'verified') {
    facts.push(size && product.sizeAvailable !== false ? `✓ ${size} in stock` : '✓ In stock');
    if (product.deliveryEstimate) {
      facts.push(`arrives ${deliveryPhrase(product.deliveryEstimate)}${product.pincode ? ` (${product.pincode})` : ''}`);
    }
  } else {
    facts.push(`Couldn't confirm ${size ? `${size} ` : ''}stock on the site — check before you buy`);
  }
  lines.push(facts.join(' · '));
  lines.push(`Shop${product.retailer ? ` at ${product.retailer}` : ''}: ${product.shopUrl}`);
  return lines.join('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The card is rendered from this HTML in headless Chrome and sent as an image. */
export function productCardHtml(product: PresentableProduct, dateLabel: string) {
  const price = formatInr(product.priceInr);
  const mrp = product.mrpInr && product.priceInr && product.mrpInr > product.priceInr ? formatInr(product.mrpInr) : null;
  const image = product.imageUrl
    ? `<img src="${escapeHtml(product.imageUrl)}" alt="" referrerpolicy="no-referrer" />`
    : `<div class="placeholder">${escapeHtml(product.title)}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Inter:wght@400;500;600&display=block" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #ffffff; font-family: Inter, system-ui, sans-serif; color: #1E1A16; }
  #card { width: 600px; background: #fff; }
  .media { position: relative; height: 600px; background: #F6F1E9; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .media img { width: 100%; height: 100%; object-fit: contain; }
  .placeholder { font-family: Fraunces, Georgia, serif; font-size: 34px; line-height: 1.2; text-align: center; padding: 48px; color: #4A4037; }
  .badge { position: absolute; top: 20px; left: 20px; min-width: 40px; height: 40px; padding: 0 10px; border-radius: 10px; background: #1E1A16; color: #fff; font-weight: 600; font-size: 20px; display: flex; align-items: center; justify-content: center; }
  .pick { position: absolute; top: 20px; right: 20px; padding: 8px 14px; border-radius: 999px; background: #B8862F; color: #fff; font-size: 15px; font-weight: 600; letter-spacing: 0.02em; }
  .body { padding: 22px 26px 18px; }
  .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .retailer { font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: #9A8E80; }
  .title { margin-top: 6px; font-size: 22px; font-weight: 600; line-height: 1.25; }
  .price { text-align: right; white-space: nowrap; }
  .price b { display: block; font-size: 24px; font-weight: 600; color: #2F6B45; }
  .price s { font-size: 15px; color: #9A8E80; }
  .rule { height: 1px; background: #EDE6DB; margin: 18px 0 12px; }
  .foot { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #9A8E80; }
  .brand { font-family: Fraunces, Georgia, serif; font-size: 20px; color: #1E1A16; letter-spacing: 0.04em; }
</style></head><body>
<div id="card">
  <div class="media">${image}<div class="badge">${product.number}</div>${product.isPick ? '<div class="pick">My pick</div>' : ''}</div>
  <div class="body">
    <div class="row">
      <div><div class="retailer">${escapeHtml(product.retailer ?? '')}</div><div class="title">${escapeHtml(product.title)}</div></div>
      ${price ? `<div class="price"><b>${price}</b>${mrp ? `<s>${mrp}</s>` : ''}</div>` : ''}
    </div>
    <div class="rule"></div>
    <div class="foot"><span>${escapeHtml(dateLabel)}</span><span class="brand">ICONIK</span></div>
  </div>
</div>
</body></html>`;
}
