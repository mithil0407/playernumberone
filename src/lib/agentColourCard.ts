// The ICONIK Colour Card: the deliverable of the free colour analysis. A
// story-shaped (4:5) image people screenshot and share — their season, the
// colours that light them up, and the ones to keep away from their face.
// Pure: validation and HTML. Rendering is in agentProductCards.ts.

export interface ColourSwatch {
  name: string;
  hex: string;
}

export interface ColourAnalysis {
  firstName: string | null;
  season: string;
  undertone: string;
  depth: string | null;
  contrast: string | null;
  best: ColourSwatch[];
  neutrals: ColourSwatch[];
  avoid: ColourSwatch[];
  metal: 'gold' | 'silver' | 'both' | null;
}

const HEX = /^#[0-9a-f]{6}$/i;

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function swatches(value: unknown, max: number): ColourSwatch[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => (item && typeof item === 'object' ? item as Record<string, unknown> : {}))
    .map(item => ({ name: cleanText(item.name, 24), hex: cleanText(item.hex, 7) }))
    .filter(item => item.name && HEX.test(item.hex))
    .slice(0, max);
}

/** Validates what the model sent; null when it isn't enough for a real card. */
export function parseColourAnalysis(raw: Record<string, unknown>, firstName: string | null): ColourAnalysis | null {
  const season = cleanText(raw.season, 32);
  const undertone = cleanText(raw.undertone, 20);
  const best = swatches(raw.best_colours, 8);
  if (!season || !undertone || best.length < 4) return null;
  const metal = raw.metal === 'gold' || raw.metal === 'silver' || raw.metal === 'both' ? raw.metal : null;
  return {
    firstName: cleanText(firstName, 30) || null,
    season,
    undertone,
    depth: cleanText(raw.depth, 20) || null,
    contrast: cleanText(raw.contrast, 20) || null,
    best,
    neutrals: swatches(raw.neutrals, 3),
    avoid: swatches(raw.avoid_colours, 3),
    metal,
  };
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function capitalise(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const CARD_FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=block" rel="stylesheet" />`;

/** A blank page that loads the card fonts, used to warm the renderer before the card is ready. */
export const CARD_FONTS_HTML = `<!doctype html><html><head><meta charset="utf-8" />${CARD_FONT_LINKS}</head><body>${
  [['Fraunces', 500], ['Fraunces', 600], ['Inter', 400], ['Inter', 500], ['Inter', 600]]
    .map(([family, weight]) => `<span style="font-family:${family};font-weight:${weight}">ICONIK</span>`).join('')
}</body></html>`;

/** Dark text on light swatches, light text on dark ones (perceived luminance). */
export function readableOn(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1E1A16' : '#FFFFFF';
}

export function colourCardHtml(analysis: ColourAnalysis, dateLabel: string) {
  const chips = [
    `${capitalise(analysis.undertone)} undertone`,
    analysis.depth ? capitalise(analysis.depth) : null,
    analysis.contrast ? `${capitalise(analysis.contrast)} contrast` : null,
  ].filter(Boolean) as string[];
  const metal = analysis.metal === 'both' ? 'Gold & silver' : analysis.metal ? capitalise(analysis.metal) : null;
  const tile = (swatch: ColourSwatch) => `
    <div class="tile">
      <div class="chip" style="background:${swatch.hex}"></div>
      <div class="name">${escapeHtml(swatch.name)}</div>
    </div>`;
  return `<!doctype html><html><head><meta charset="utf-8" />
${CARD_FONT_LINKS}
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F6F1E9; font-family: Inter, system-ui, sans-serif; color: #1E1A16; }
  #card { width: 720px; height: 900px; padding: 44px 48px 36px; background: #F6F1E9; display: flex; flex-direction: column; }
  .top { display: flex; justify-content: space-between; font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase; color: #9A8E80; }
  .lead { margin-top: 30px; font-size: 20px; color: #6B6158; }
  .season { margin-top: 4px; font-family: Fraunces, Georgia, serif; font-weight: 600; font-size: 66px; line-height: 1.02; letter-spacing: -0.01em; }
  .chips { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px; }
  .chips span { padding: 7px 14px; border-radius: 999px; background: #FFFFFF; font-size: 15px; font-weight: 500; color: #4A4037; }
  h2 { margin-top: 30px; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: #9A8E80; font-weight: 600; }
  .grid { margin-top: 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 12px; }
  .tile .chip { height: 92px; border-radius: 16px; }
  .tile .name { margin-top: 7px; font-size: 14px; font-weight: 500; color: #3A322B; }
  .row { margin-top: 26px; display: flex; gap: 28px; align-items: flex-start; }
  .row .group { flex: 1; }
  .small { margin-top: 12px; display: flex; gap: 10px; }
  .small .tile { width: 92px; }
  .small .tile .chip { height: 56px; border-radius: 12px; }
  .avoid .chip { position: relative; overflow: hidden; }
  .avoid .chip::after { content: ''; position: absolute; left: -10%; top: 50%; width: 120%; height: 3px; background: rgba(255,255,255,0.9); transform: rotate(-28deg); box-shadow: 0 0 0 1px rgba(30,26,22,0.25); }
  .metal { margin-top: 12px; align-self: flex-start; display: inline-block; padding: 9px 16px; border-radius: 999px; font-size: 15px; font-weight: 600; background: #FFFFFF; }
  .foot { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 18px; border-top: 1px solid #E3DACE; }
  .foot .cta { font-size: 15px; color: #4A4037; }
  .foot .brand { font-family: Fraunces, Georgia, serif; font-size: 24px; letter-spacing: 0.06em; }
</style></head><body>
<div id="card">
  <div class="top"><span>ICONIK · Colour analysis</span><span>${escapeHtml(dateLabel)}</span></div>
  <div class="lead">${analysis.firstName ? `${escapeHtml(analysis.firstName)}, you're a` : "You're a"}</div>
  <div class="season">${escapeHtml(analysis.season)}</div>
  <div class="chips">${chips.map(chip => `<span>${escapeHtml(chip)}</span>`).join('')}</div>
  <h2>Colours that light you up</h2>
  <div class="grid">${analysis.best.map(tile).join('')}</div>
  <div class="row">
    ${analysis.neutrals.length ? `<div class="group"><h2 style="margin-top:0">Your neutrals</h2><div class="small">${analysis.neutrals.map(tile).join('')}</div></div>` : ''}
    ${analysis.avoid.length ? `<div class="group avoid"><h2 style="margin-top:0">Keep away from your face</h2><div class="small">${analysis.avoid.map(tile).join('')}</div></div>` : ''}
  </div>
  ${metal ? `<h2>Your metal</h2><div class="metal">${escapeHtml(metal)}</div>` : ''}
  <div class="foot"><span class="cta">Free colour analysis on WhatsApp · iconik.pro</span><span class="brand">ICONIK</span></div>
</div>
</body></html>`;
}

// ── Shade cards: exact colours with names, for anything they ask to see ──
// Lipstick or foundation shades by brand, a palette for their partner, the
// colours that go with a saree. Rendered from hex codes, never generated, so
// the colours and brand names are exactly right.

export interface ShadeSwatch extends ColourSwatch {
  /** e.g. "Lakmé 9 to 5 · everyday" */
  note: string | null;
}

export interface ShadeCard {
  title: string;
  subtitle: string | null;
  swatches: ShadeSwatch[];
}

export function parseShadeCard(raw: Record<string, unknown>): ShadeCard | null {
  const title = cleanText(raw.title, 48);
  const list = Array.isArray(raw.swatches) ? raw.swatches : [];
  const swatchesOut = list
    .map(item => (item && typeof item === 'object' ? item as Record<string, unknown> : {}))
    .map(item => ({ name: cleanText(item.name, 34), hex: cleanText(item.hex, 7), note: cleanText(item.note, 44) || null }))
    .filter(item => item.name && HEX.test(item.hex))
    .slice(0, 9);
  if (!title || swatchesOut.length < 2) return null;
  return { title, subtitle: cleanText(raw.subtitle, 90) || null, swatches: swatchesOut };
}

export function shadeCardHtml(card: ShadeCard) {
  const columns = card.swatches.length <= 4 ? 2 : 3;
  const tile = (swatch: ShadeSwatch) => `
    <div class="tile">
      <div class="chip" style="background:${swatch.hex}"></div>
      <div class="name">${escapeHtml(swatch.name)}</div>
      ${swatch.note ? `<div class="note">${escapeHtml(swatch.note)}</div>` : ''}
    </div>`;
  return `<!doctype html><html><head><meta charset="utf-8" />
${CARD_FONT_LINKS}
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F6F1E9; font-family: Inter, system-ui, sans-serif; color: #1E1A16; }
  #card { width: 720px; min-height: 720px; padding: 44px 48px 36px; background: #F6F1E9; display: flex; flex-direction: column; }
  .top { font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase; color: #9A8E80; }
  .title { margin-top: 22px; font-family: Fraunces, Georgia, serif; font-weight: 600; font-size: 50px; line-height: 1.05; }
  .subtitle { margin-top: 10px; font-size: 18px; color: #6B6158; }
  .grid { margin-top: 30px; display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 22px 16px; }
  .tile .chip { height: ${columns === 2 ? 150 : 118}px; border-radius: 18px; box-shadow: inset 0 0 0 1px rgba(30,26,22,0.08); }
  .tile .name { margin-top: 9px; font-size: 17px; font-weight: 600; color: #2A231D; }
  .tile .note { margin-top: 2px; font-size: 14px; color: #7A6F64; }
  .foot { margin-top: auto; padding-top: 26px; display: flex; justify-content: space-between; align-items: flex-end; }
  .foot .cta { font-size: 14px; color: #8A7F74; }
  .foot .brand { font-family: Fraunces, Georgia, serif; font-size: 24px; letter-spacing: 0.06em; }
</style></head><body>
<div id="card">
  <div class="top">ICONIK · Your stylist</div>
  <div class="title">${escapeHtml(card.title)}</div>
  ${card.subtitle ? `<div class="subtitle">${escapeHtml(card.subtitle)}</div>` : ''}
  <div class="grid">${card.swatches.map(tile).join('')}</div>
  <div class="foot"><span class="cta">Shades on screen are a guide; check in daylight</span><span class="brand">ICONIK</span></div>
</div>
</body></html>`;
}
