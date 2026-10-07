// The ICONIK Body Card: the deliverable of the free body shape analysis. A
// story-shaped (4:5) image people screenshot and share — their shape read from
// proportion (shoulders, waist, hips), what to highlight, the silhouettes and
// necklines that work, and what to go easy on. It never talks about weight or
// size. Pure: validation and HTML. Rendering is in agentProductCards.ts.

import { CARD_FONT_LINKS, escapeHtml } from './agentColourCard.ts';

export type BodyLine = 'woman' | 'man';

interface ShapeInfo {
  label: string;
  /** Half-widths of shoulders, waist and hips, for the silhouette drawing. */
  widths: [number, number, number];
  /** Why the outfit works, in one friendly sentence, used right before the library look. */
  why: string;
}

/** The shapes ICONIK reads, per menswear / womenswear. Keys are lower case. */
export const BODY_SHAPES: Record<BodyLine, Record<string, ShapeInfo>> = {
  woman: {
    hourglass: { label: 'Hourglass', widths: [46, 30, 46], why: 'It keeps your waist as the star and lets the rest follow your natural line.' },
    pear: { label: 'Pear', widths: [38, 30, 50], why: 'Structure and detail on top balance your hips, and the clean line below keeps everything calm.' },
    'inverted triangle': { label: 'Inverted triangle', widths: [52, 34, 38], why: 'Soft shoulders and more movement below balance your strong shoulder line.' },
    rectangle: { label: 'Rectangle', widths: [42, 38, 42], why: 'It builds a waist and some shape with layers and cinching, so the line never reads straight up and down.' },
    apple: { label: 'Apple', widths: [44, 46, 40], why: 'It draws the eye up and down in one long line and skims the middle instead of clinging.' },
  },
  man: {
    trapezoid: { label: 'Trapezoid', widths: [52, 38, 40], why: 'A clean, tailored line shows off your natural taper without any fuss.' },
    rectangle: { label: 'Rectangle', widths: [44, 42, 44], why: 'Layers and structure on top add the shape that makes a straight frame look sharp.' },
    'inverted triangle': { label: 'Inverted triangle', widths: [56, 38, 38], why: 'Soft shoulders and a little more room below balance your broad upper body.' },
    oval: { label: 'Oval', widths: [44, 52, 42], why: 'One long, uncluttered line and an open layer lengthen you and skim the middle.' },
    triangle: { label: 'Triangle', widths: [40, 40, 50], why: 'Structure and layers on top balance your lower half, with darker, cleaner lines below.' },
  },
};

export function bodyShapeKey(value: unknown, line: BodyLine) {
  const key = typeof value === 'string' ? value.toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() : '';
  return key in BODY_SHAPES[line] ? key : null;
}

export interface BodyAnalysis {
  firstName: string | null;
  line: BodyLine;
  /** Key into BODY_SHAPES[line]. */
  shape: string;
  proportions: string[];
  summary: string;
  highlight: string[];
  silhouettes: string[];
  necklines: string[];
  goEasy: string[];
  fabrics: string[];
  formula: string;
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function list(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value.map(item => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

/** Validates what the model sent; null when it isn't enough for a real card. */
export function parseBodyAnalysis(raw: Record<string, unknown>, firstName: string | null): BodyAnalysis | null {
  const line = raw.line === 'man' || raw.line === 'woman' ? raw.line : null;
  if (!line) return null;
  const shape = bodyShapeKey(raw.shape, line);
  const summary = cleanText(raw.summary, 120);
  const highlight = list(raw.highlight, 3, 56);
  const silhouettes = list(raw.silhouettes, 4, 32);
  const formula = cleanText(raw.formula, 110);
  if (!shape || !summary || highlight.length < 2 || silhouettes.length < 2 || !formula) return null;
  return {
    firstName: cleanText(firstName, 30) || null,
    line,
    shape,
    proportions: list(raw.proportions, 3, 34),
    summary,
    highlight,
    silhouettes,
    necklines: list(raw.necklines, 4, 28),
    goEasy: list(raw.go_easy, 3, 48),
    fabrics: list(raw.fabrics, 3, 28),
    formula,
  };
}

/** Catmull-Rom through the points, as cubic Béziers: the smooth outline of the figure. */
function smooth(points: Array<[number, number]>) {
  let path = '';
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(index - 1, 0)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(index + 2, points.length - 1)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    path += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return path;
}

/** A calm, abstract figure with guide lines at shoulders, waist and hips. */
export function silhouetteSvg(widths: [number, number, number]) {
  const [shoulder, waist, hip] = widths;
  const cx = 100;
  const left: Array<[number, number]> = [
    [cx - 9, 36], [cx - shoulder * 0.8, 54], [cx - shoulder, 72], [cx - waist, 132], [cx - hip, 194], [cx - hip * 0.78, 262], [cx - hip * 0.6, 292],
  ];
  const right = left.map(([x, y]) => [2 * cx - x, y] as [number, number]).reverse();
  const outline = `M${left[0][0]},${left[0][1]}${smooth(left)} L${right[0][0]},${right[0][1]}${smooth(right)} Z`;
  const guide = (y: number, half: number) => `<line x1="${cx - half - 14}" x2="${cx + half + 14}" y1="${y}" y2="${y}" stroke="#B8895A" stroke-width="1.4" stroke-dasharray="3 4" />`;
  return `<svg viewBox="0 0 200 300" width="200" height="300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="${cx}" cy="20" r="14" fill="#E4D8C5" />
    <path d="${outline}" fill="#E4D8C5" />
    ${guide(72, shoulder)}${guide(132, waist)}${guide(194, hip)}
  </svg>`;
}

export function bodyCardHtml(analysis: BodyAnalysis, dateLabel: string) {
  const info = BODY_SHAPES[analysis.line][analysis.shape];
  const chips = (items: string[]) => items.map(item => `<span>${escapeHtml(item)}</span>`).join('');
  const section = (title: string, items: string[], className = '') => items.length
    ? `<div class="group ${className}"><h2>${title}</h2><div class="chips small">${chips(items)}</div></div>`
    : '';
  const goEasy = analysis.goEasy.length
    ? `<div class="group"><h2>Go easy on</h2><ul>${analysis.goEasy.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8" />
${CARD_FONT_LINKS}
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F6F1E9; font-family: Inter, system-ui, sans-serif; color: #1E1A16; }
  #card { width: 720px; height: 900px; padding: 44px 48px 34px; background: #F6F1E9; display: flex; flex-direction: column; }
  .top { display: flex; justify-content: space-between; font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase; color: #9A8E80; }
  .lead { margin-top: 26px; font-size: 20px; color: #6B6158; }
  .shape { margin-top: 2px; font-family: Fraunces, Georgia, serif; font-weight: 600; font-size: 62px; line-height: 1.04; letter-spacing: -0.01em; }
  .chips { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; }
  .chips span { padding: 7px 14px; border-radius: 999px; background: #FFFFFF; font-size: 15px; font-weight: 500; color: #4A4037; }
  .chips.small { margin-top: 10px; gap: 7px; }
  .chips.small span { padding: 6px 12px; font-size: 14px; }
  h2 { font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: #9A8E80; font-weight: 600; }
  .middle { margin-top: 18px; display: flex; gap: 28px; align-items: center; }
  .middle svg { flex: none; width: 150px; height: 225px; }
  .summary { font-family: Fraunces, Georgia, serif; font-size: 22px; line-height: 1.3; color: #3A322B; }
  .highlight { margin-top: 16px; }
  .highlight ul, .group ul { margin-top: 8px; list-style: none; }
  .highlight li, .group li { position: relative; padding-left: 18px; margin-top: 7px; font-size: 16px; line-height: 1.35; color: #3A322B; }
  .highlight li::before { content: ''; position: absolute; left: 0; top: 7px; width: 8px; height: 8px; border-radius: 50%; background: #B8895A; }
  .group li::before { content: ''; position: absolute; left: 0; top: 10px; width: 8px; height: 2px; background: #9A8E80; }
  .group { margin-top: 16px; }
  .row { display: flex; gap: 28px; }
  .row .group { flex: 1; }
  .formula { margin-top: 18px; padding: 16px 20px; border-radius: 16px; background: #1E1A16; color: #F6F1E9; }
  .formula h2 { color: #C9B79D; }
  .formula p { margin-top: 6px; font-family: Fraunces, Georgia, serif; font-size: 20px; line-height: 1.3; }
  .foot { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px solid #E3DACE; }
  .foot .cta { font-size: 15px; color: #4A4037; }
  .foot .brand { font-family: Fraunces, Georgia, serif; font-size: 24px; letter-spacing: 0.06em; }
</style></head><body>
<div id="card">
  <div class="top"><span>ICONIK · Body shape</span><span>${escapeHtml(dateLabel)}</span></div>
  <div class="lead">${analysis.firstName ? `${escapeHtml(analysis.firstName)}, your shape is` : 'Your shape is'}</div>
  <div class="shape">${escapeHtml(info.label)}</div>
  ${analysis.proportions.length ? `<div class="chips">${chips(analysis.proportions)}</div>` : ''}
  <div class="middle">
    ${silhouetteSvg(info.widths)}
    <div>
      <div class="summary">${escapeHtml(analysis.summary)}</div>
      <div class="highlight"><h2>Dress to highlight</h2><ul>${analysis.highlight.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
    </div>
  </div>
  ${section('Silhouettes that flatter', analysis.silhouettes)}
  <div class="row">${section('Necklines & collars', analysis.necklines)}${goEasy}</div>
  ${analysis.fabrics.length ? section('Fabrics that sit well', analysis.fabrics) : ''}
  <div class="formula"><h2>Your formula</h2><p>${escapeHtml(analysis.formula)}</p></div>
  <div class="foot"><span class="cta">Free body shape analysis on WhatsApp · iconik.pro</span><span class="brand">ICONIK</span></div>
</div>
</body></html>`;
}

/** What the profile remembers: shape plus the formula, for every later recommendation. */
export function bodyProfileFields(analysis: BodyAnalysis) {
  return {
    body_shape: BODY_SHAPES[analysis.line][analysis.shape].label,
    body_notes: `${analysis.formula} Highlight: ${analysis.highlight.join('; ')}.${analysis.goEasy.length ? ` Go easy on: ${analysis.goEasy.join('; ')}.` : ''}`,
  };
}

/**
 * True from the moment they ask for the body analysis until the card is sent.
 * While it holds, a photo is their body photo, not a selfie for the Colour Card.
 */
export function bodyCardPending(profile: Record<string, unknown> | null | undefined) {
  const asked = typeof profile?.body_ask_at === 'string' ? Date.parse(profile.body_ask_at) : NaN;
  if (!Number.isFinite(asked)) return false;
  const delivered = typeof profile?.body_card_at === 'string' ? Date.parse(profile.body_card_at) : NaN;
  return !Number.isFinite(delivered) || asked > delivered;
}
