// The six colour-scan nurture emails, styled like the ₹2,699 offer pages
// (bone paper, carbon ink, oxblood buttons). Table layout and inline styles
// throughout, because Gmail strips most <style> rules and Outlook renders with
// Word; the <style> block only adds the phone layout. Her colours are drawn as
// table cells with bgcolor, which every client renders, so the emails stay
// personal even when images are blocked.

import type { NurtureStep } from './colourScanNurtureModel.ts';
import type { StyleScanColourProfileV1, StyleScanSwatchV1 } from './styleScan.ts';
import { colourOutfitIdeas, hexLightness, swapSuggestions } from './styleScanColour.ts';
import {
  BLUEPRINT_OFFER,
  CLIENT_PROOF,
  LEGAL_ENTITY_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from './siteFacts.ts';

export interface ColourScanNurtureEmailInput {
  step: NurtureStep;
  firstName: string | null;
  colour: StyleScanColourProfileV1 | null;
  upcoming: string | null;
  dressCode: string | null;
  resultUrl: string;
  offerUrl: string;
  unsubscribeUrl: string;
}

export interface ColourScanNurtureEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

// Mirrors FREE_CHANGES_PROMISE in OfferShowcase.tsx, which is a client module.
const FREE_CHANGES_PROMISE = 'If your Blueprint does not match what you told your stylist, we change it for free.';

const C = {
  page: '#F5F3EE',
  card: '#FFFFFF',
  panel: '#F3F1EC',
  slate: '#E4E9EB',
  line: '#E2DED6',
  ink: '#111315',
  body: '#4A4D52',
  muted: '#8A8D92',
  oxblood: '#6A1F2B',
  bone: '#F5F3EE',
  sage: '#4F6B57',
} as const;

const SERIF = "Didot, 'Bodoni 72', 'Bodoni MT', Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const IMG = `${SITE_URL}/email/checkout-recovery`;

const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hello(input: ColourScanNurtureEmailInput) {
  return input.firstName ? `${esc(input.firstName)}, ` : '';
}

// ── Building blocks ────────────────────────────────────────────────────────────

function eyebrow(text: string, color: string = C.oxblood) {
  return `<p style="margin:0 0 14px;font-family:${SANS};font-size:11px;line-height:16px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:${color};">${text}</p>`;
}

function headline(html: string) {
  return `<h1 class="cn-h1" style="margin:0 0 18px;font-family:${SANS};font-size:32px;line-height:37px;font-weight:700;color:${C.ink};letter-spacing:-1px;">${html}</h1>`;
}

function serifMoment(text: string) {
  return `<em style="font-family:${SERIF};font-style:italic;font-weight:400;color:${C.oxblood};letter-spacing:-0.5px;">${text}</em>`;
}

function paragraph(html: string, extra = '') {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:26px;color:${C.body};${extra}">${html}</p>`;
}

function button(href: string, label: string, dark = true) {
  const bg = dark ? C.oxblood : C.bone;
  const fg = dark ? C.bone : C.ink;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="cn-btn-table" style="margin:8px 0 0;">
  <tr>
    <td align="center" bgcolor="${bg}" style="border-radius:999px;background:${bg};">
      <a href="${esc(href)}" target="_blank" class="cn-btn" style="display:inline-block;padding:17px 36px;font-family:${SANS};font-size:16px;line-height:20px;font-weight:700;color:${fg};text-decoration:none;border-radius:999px;letter-spacing:0.1px;">${label}&nbsp;&nbsp;&rarr;</a>
    </td>
  </tr>
</table>`;
}

function smallNote(html: string, extra = '') {
  return `<p style="margin:12px 0 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted};${extra}">${html}</p>`;
}

function spacer(height: number) {
  return `<tr><td style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</td></tr>`;
}

function contentRow(inner: string, padding = '0 44px') {
  return `<tr><td class="cn-pad" style="padding:${padding};">${inner}</td></tr>`;
}

function image(src: string, alt: string, width: number, radius = 16) {
  return `<img src="${IMG}/${src}" width="${width}" alt="${esc(alt)}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:${radius}px;background:${C.panel};font-family:${SANS};font-size:13px;color:${C.muted};" />`;
}

function caption(text: string) {
  return `<p style="margin:10px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:${C.muted};text-align:center;">${text}</p>`;
}

function panel(inner: string, bg: string = C.panel) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg};border:1px solid ${C.line};border-radius:20px;">
  <tr><td class="cn-panel" style="padding:24px 26px;">${inner}</td></tr>
</table>`;
}

function chip(text: string) {
  return `<span style="display:inline-block;margin:0 6px 8px 0;padding:7px 13px;border:1px solid ${C.line};border-radius:999px;background:${C.card};font-family:${SANS};font-size:12px;line-height:16px;font-weight:600;color:${C.ink};">${text}</span>`;
}

/** A row of colour swatches; struck through for colours to skip. */
function swatchRow(swatches: StyleScanSwatchV1[], { skip = false, size = 76 } = {}) {
  if (!swatches.length) return '';
  const width = Math.floor(100 / Math.max(3, swatches.length));
  const cells = swatches.map((swatch) => {
    const textColour = hexLightness(swatch.hex) > 0.6 ? 'rgba(17,19,21,0.55)' : 'rgba(255,255,255,0.85)';
    const mark = skip ? `<span style="font-family:${SANS};font-size:26px;line-height:${size}px;color:${textColour};">&#10005;</span>` : '&nbsp;';
    return `
      <td class="cn-swatch" width="${width}%" align="center" valign="top" style="padding:0 4px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" bgcolor="${swatch.hex}" height="${size}" style="height:${size}px;background:${swatch.hex};border-radius:14px;border:1px solid rgba(17,19,21,0.08);">${mark}</td></tr>
        </table>
        <p style="margin:8px 0 0;font-family:${SANS};font-size:12px;line-height:16px;font-weight:600;color:${skip ? C.muted : C.ink};">${esc(swatch.name)}</p>
      </td>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) rows.push(items.slice(index, index + size));
  return rows;
}

function swatchGrid(swatches: StyleScanSwatchV1[]) {
  return chunk(swatches, 3).map((row) => swatchRow(row)).join('<div style="height:14px;line-height:14px;font-size:0;">&nbsp;</div>');
}

function ruleList(rules: Array<{ title: string; body: string }>) {
  return rules.map((rule, index) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
      <tr>
        <td valign="top" width="40" style="padding-top:2px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" valign="middle" width="28" height="28" style="width:28px;height:28px;border-radius:999px;background:${C.ink};font-family:${SANS};font-size:12px;line-height:28px;font-weight:700;color:${C.bone};">${index + 1}</td>
          </tr></table>
        </td>
        <td valign="top">
          <p style="margin:0 0 4px;font-family:${SANS};font-size:15px;line-height:22px;font-weight:700;color:${C.ink};">${esc(rule.title)}</p>
          <p style="margin:0;font-family:${SANS};font-size:14px;line-height:22px;color:${C.body};">${esc(rule.body)}</p>
        </td>
      </tr>
    </table>`).join('');
}

function quoteCard(quote: string, who: string) {
  return panel(`
      <p style="margin:0 0 4px;font-family:${SERIF};font-size:44px;line-height:30px;color:${C.oxblood};">&ldquo;</p>
      <p style="margin:0 0 14px;font-family:${SERIF};font-style:italic;font-size:18px;line-height:28px;color:${C.ink};">${quote}</p>
      <p style="margin:0;font-family:${SANS};font-size:12px;line-height:18px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${C.muted};">${who} &nbsp;<span style="color:${C.oxblood};letter-spacing:2px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span></p>`);
}

function twoUp(left: string, right: string) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td class="cn-col" width="50%" valign="top" style="padding-right:8px;">${left}</td>
    <td class="cn-col cn-col-last" width="50%" valign="top" style="padding-left:8px;">${right}</td>
  </tr>
</table>`;
}

function blueprintPanel(input: ColourScanNurtureEmailInput, heading: string) {
  const items = [
    `A ${BLUEPRINT_OFFER.consultationMinutes}-minute video call with your own stylist`,
    `${BLUEPRINT_OFFER.outfitFormulas} complete outfits in your colours, made for your body`,
    'All your colours: the full set to wear, and every one to skip',
    'Hairstyle, makeup, hair colour and glasses guides, free',
  ];
  const rows = items.map((item) => `
    <tr>
      <td valign="top" width="26" style="padding:0 0 10px;font-family:${SANS};font-size:15px;line-height:22px;font-weight:700;color:#D9B98A;">&#10003;</td>
      <td valign="top" style="padding:0 0 10px;font-family:${SANS};font-size:15px;line-height:22px;color:${C.bone};">${item}</td>
    </tr>`).join('');
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ink};border-radius:22px;">
  <tr><td class="cn-panel" style="padding:30px 30px 28px;">
    ${eyebrow('ICONIK Personal Style Blueprint', '#D9B98A')}
    <p style="margin:0 0 18px;font-family:${SANS};font-size:24px;line-height:30px;font-weight:700;letter-spacing:-0.6px;color:${C.bone};">${heading}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
    <p style="margin:8px 0 18px;font-family:${SANS};font-size:14px;line-height:21px;color:rgba(245,243,238,0.66);">${inr(BLUEPRINT_OFFER.currentPriceInr)} one time &middot; ready in ${BLUEPRINT_OFFER.deliveryWorkingDays} working days &middot; free changes until it matches</p>
    ${button(input.offerUrl, 'See the Blueprint', false)}
  </td></tr>
</table>`;
}

function helpLine() {
  return paragraph(`Questions about your colours? Just reply to this email or <a href="${SUPPORT_WHATSAPP_URL}" target="_blank" style="color:${C.ink};font-weight:700;text-decoration:underline;">WhatsApp us on ${SUPPORT_WHATSAPP_DISPLAY}</a>. A real stylist on our team answers.`, `font-size:14px;line-height:22px;color:${C.muted};`);
}

function signOff() {
  return paragraph(`With love,<br /><strong style="color:${C.ink};">The ICONIK styling team</strong>`, 'margin:0;');
}

function layout({ title, preheader, body, unsubscribeUrl }: { title: string; preheader: string; body: string; unsubscribeUrl: string }) {
  // Trailing zero-width joiners stop inboxes padding the preview with body text.
  const previewPad = '&#8204;&nbsp;'.repeat(60);
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${esc(title)}</title>
  <style>
    body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
    a { text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .cn-container { width:100% !important; }
      .cn-pad { padding-left:22px !important; padding-right:22px !important; }
      .cn-panel { padding-left:20px !important; padding-right:20px !important; }
      .cn-h1 { font-size:27px !important; line-height:32px !important; }
      .cn-col { display:block !important; width:100% !important; padding:0 0 14px !important; }
      .cn-col-last { padding-bottom:0 !important; }
      .cn-btn-table { width:100% !important; }
      .cn-btn { display:block !important; padding-left:16px !important; padding-right:16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.page};">
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};">${esc(preheader)}${previewPad}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
    <tr>
      <td align="center" style="padding:34px 12px 40px;">
        <table role="presentation" class="cn-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">
                <span style="font-family:${SANS};font-size:20px;line-height:24px;font-weight:600;letter-spacing:7px;color:${C.ink};">ICONIK</span>
              </a>
              <p style="margin:6px 0 0;font-family:${SANS};font-size:10px;line-height:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.oxblood};">Your colour analysis</p>
            </td>
          </tr>
          <tr>
            <td style="background:${C.card};border:1px solid ${C.line};border-radius:26px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${body}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" class="cn-pad" style="padding:28px 40px 0;">
              <p style="margin:0 0 8px;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:${C.body};text-decoration:underline;">${SUPPORT_EMAIL}</a> &middot; <a href="${SUPPORT_WHATSAPP_URL}" target="_blank" style="color:${C.body};text-decoration:underline;">WhatsApp ${SUPPORT_WHATSAPP_DISPLAY}</a></p>
              <p style="margin:0 0 8px;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">You're getting this because you took the free ICONIK colour analysis at iconik.pro. Six short emails about your colours, then we stop. <a href="${esc(unsubscribeUrl)}" target="_blank" style="color:${C.body};text-decoration:underline;">Unsubscribe</a>.</p>
              <p style="margin:0;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">&copy; ${new Date().getFullYear()} ${LEGAL_ENTITY_NAME} &middot; <a href="${SITE_URL}" target="_blank" style="color:${C.muted};text-decoration:none;">iconik.pro</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function build(input: ColourScanNurtureEmailInput, parts: { subject: string; preheader: string; body: string; text: string[] }): ColourScanNurtureEmail {
  return {
    subject: parts.subject,
    preheader: parts.preheader,
    html: layout({ title: parts.subject, preheader: parts.preheader, body: parts.body, unsubscribeUrl: input.unsubscribeUrl }),
    text: [...parts.text, '', 'With love,', 'The ICONIK styling team', '', `Unsubscribe: ${input.unsubscribeUrl}`].join('\n'),
  };
}

function plainSwatches(swatches: StyleScanSwatchV1[]) {
  return swatches.map((swatch) => `- ${swatch.name} (${swatch.hex})`);
}

// ── Email 1 · straight away: your result ───────────────────────────────────────

function resultEmail(input: ColourScanNurtureEmailInput): ColourScanNurtureEmail {
  const colour = input.colour;
  const subject = input.firstName ? `${input.firstName}, your colours are ready` : 'Your colour analysis is ready';
  const preheader = colour
    ? `You're a ${colour.paletteName}. Here are the shades that light up your face, and the ones to skip.`
    : 'Here are the shades that light up your face, and the ones to skip.';

  const body = `
    ${spacer(42)}
    ${contentRow(`
      ${eyebrow('Your free colour analysis')}
      ${headline(colour ? `${hello(input)}you&rsquo;re a ${serifMoment(esc(colour.paletteName))}.` : `${hello(input)}your colours are ${serifMoment('ready')}.`)}
      ${colour ? `<div style="margin:0 0 10px;">${chip(`${esc(colour.undertone)} undertone`)}${chip(`${esc(colour.depth)} depth`)}${chip(`${esc(colour.contrast)} contrast`)}</div>` : ''}
      ${paragraph('We read your selfie in natural light and matched your skin, eyes and hair to the shades that make you look fresh and awake. Save this email: it is your shopping list.')}
    `)}
    ${colour?.best.length ? `
    ${spacer(18)}
    ${contentRow(`
      ${eyebrow('Wear these near your face', C.ink)}
      ${swatchGrid(colour.best)}
    `)}` : ''}
    ${colour?.avoid.length ? `
    ${spacer(30)}
    ${contentRow(`
      ${eyebrow('Skip these near your face', C.muted)}
      ${swatchRow(colour.avoid, { skip: true, size: 56 })}
    `)}` : ''}
    ${colour?.rules.length ? `
    ${spacer(34)}
    ${contentRow(panel(`${eyebrow('Your three colour rules')}${ruleList(colour.rules)}`))}` : ''}
    ${spacer(30)}
    ${contentRow(`
      ${button(input.resultUrl, 'Try your colours on your photo')}
      ${smallNote('Your private result page lets you drape each colour against your own selfie.')}
    `)}
    ${spacer(36)}
    ${contentRow(`
      ${paragraph(`Over the next ten days we&rsquo;ll send five short notes on wearing these colours with clothes you already own. ${colour && colour.lockedCount > 0 ? `Your full analysis found <strong style="color:${C.ink};">${colour.lockedCount} more shades</strong> for you; your stylist walks you through all of them in the Blueprint.` : ''}`)}
      ${signOff()}
    `)}
    ${spacer(42)}`;

  return build(input, {
    subject,
    preheader,
    body,
    text: [
      colour ? `${input.firstName ? `${input.firstName}, you're` : "You're"} a ${colour.paletteName}.` : 'Your ICONIK colour analysis is ready.',
      colour ? `${colour.undertone} undertone · ${colour.depth} depth · ${colour.contrast} contrast` : '',
      '',
      ...(colour?.best.length ? ['Wear these near your face:', ...plainSwatches(colour.best), ''] : []),
      ...(colour?.avoid.length ? ['Skip these near your face:', ...plainSwatches(colour.avoid), ''] : []),
      ...(colour?.rules.length ? ['Your three colour rules:', ...colour.rules.map((rule, index) => `${index + 1}. ${rule.title}: ${rule.body}`), ''] : []),
      `Try your colours on your photo: ${input.resultUrl}`,
    ],
  });
}

// ── Email 2 · one day: the colours dulling your face ───────────────────────────

function dullingEmail(input: ColourScanNurtureEmailInput): ColourScanNurtureEmail {
  const colour = input.colour;
  const swaps = colour ? swapSuggestions(colour) : [];
  const first = swaps[0];
  const subject = first ? `Why ${first.skip.name.toLowerCase()} makes you look tired` : 'The colours quietly dulling your face';
  const preheader = 'It isn’t your skin, your sleep or your makeup. It’s the colour under your chin.';

  const swapRows = swaps.map(({ skip, wear }) => `
    <tr>
      <td width="44%" valign="middle" style="padding:0 0 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="44" valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${skip.hex}" width="40" height="40" style="width:40px;height:40px;background:${skip.hex};border-radius:12px;border:1px solid rgba(17,19,21,0.08);">&nbsp;</td></tr></table></td>
          <td valign="middle" style="padding-left:10px;font-family:${SANS};font-size:14px;line-height:19px;color:${C.muted};text-decoration:line-through;">${esc(skip.name)}</td>
        </tr></table>
      </td>
      <td width="12%" align="center" valign="middle" style="padding:0 0 14px;font-family:${SANS};font-size:18px;color:${C.oxblood};">&rarr;</td>
      <td width="44%" valign="middle" style="padding:0 0 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="44" valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${wear.hex}" width="40" height="40" style="width:40px;height:40px;background:${wear.hex};border-radius:12px;border:1px solid rgba(17,19,21,0.08);">&nbsp;</td></tr></table></td>
          <td valign="middle" style="padding-left:10px;font-family:${SANS};font-size:14px;line-height:19px;font-weight:700;color:${C.ink};">${esc(wear.name)}</td>
        </tr></table>
      </td>
    </tr>`).join('');

  const body = `
    ${spacer(42)}
    ${contentRow(`
      ${eyebrow('Colour lesson 1 of 4')}
      ${headline(`It isn&rsquo;t your skin. It&rsquo;s the ${serifMoment('colour under your chin.')}`)}
      ${paragraph(`${hello(input) ? `${hello(input)}h` : 'H'}ave you ever looked at a photo and thought you looked tired, even on a good day? Most of the time, the culprit is the colour closest to your face.`)}
      ${paragraph('Fabric reflects light up onto your skin. The wrong shade casts a grey or yellow shadow under your eyes and around your mouth. The right one evens out your skin, so you look rested without changing anything else.')}
    `)}
    ${swaps.length ? `
    ${spacer(16)}
    ${contentRow(panel(`
      ${eyebrow('Your easy swaps')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${swapRows}</table>
      <p style="margin:2px 0 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted};">Each swap keeps the same depth, so it works with everything you already wear it with.</p>
    `))}` : ''}
    ${spacer(30)}
    ${contentRow(`
      ${eyebrow('Try this tonight', C.ink)}
      ${paragraph('Stand by a window in daylight with no makeup. Hold one of your skip colours under your chin, then one of your best colours. Watch your skin, not the fabric. You&rsquo;ll see it in about two seconds.')}
      ${paragraph('Already love a skip colour? Keep it. Just wear it below the waist, or add a scarf or dupatta in one of your best shades between it and your face.')}
      ${button(input.resultUrl, 'See both side by side on your photo')}
    `)}
    ${spacer(36)}
    ${contentRow(signOff())}
    ${spacer(42)}`;

  return build(input, {
    subject,
    preheader,
    body,
    text: [
      "It isn't your skin. It's the colour under your chin.",
      '',
      'Fabric reflects light onto your skin. The wrong shade casts a grey or yellow shadow under your eyes; the right one evens your skin out.',
      '',
      ...(swaps.length ? ['Your easy swaps:', ...swaps.map(({ skip, wear }) => `- Instead of ${skip.name}, wear ${wear.name}`), ''] : []),
      'Try this tonight: by a window in daylight, hold a skip colour under your chin, then a best colour. Watch your skin, not the fabric.',
      '',
      `See both side by side on your photo: ${input.resultUrl}`,
    ],
  });
}

// ── Email 3 · three days: three outfits in your colours ────────────────────────

function outfitsEmail(input: ColourScanNurtureEmailInput): ColourScanNurtureEmail {
  const ideas = input.colour ? colourOutfitIdeas(input.colour, input.dressCode) : [];
  const subject = '3 outfits in your colours (from clothes you probably own)';
  const preheader = 'No shopping needed. Just put your best shades where they count.';

  const ideaBlocks = ideas.map((idea) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;background:${C.panel};border:1px solid ${C.line};border-radius:18px;">
      <tr>
        <td class="cn-panel" style="padding:20px 22px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="top">
              <p style="margin:0 0 6px;font-family:${SANS};font-size:11px;line-height:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.oxblood};">${esc(idea.title)}</p>
              <p style="margin:0;font-family:${SANS};font-size:15px;line-height:23px;color:${C.ink};">${esc(idea.formula)}</p>
            </td>
            <td valign="top" align="right" width="${idea.swatches.length * 30 + 6}" style="padding-left:14px;white-space:nowrap;">
              ${idea.swatches.map((swatch) => `<span style="display:inline-block;width:24px;height:24px;margin-left:4px;border-radius:999px;background:${swatch.hex};border:1px solid rgba(17,19,21,0.12);">&nbsp;</span>`).join('')}
            </td>
          </tr></table>
        </td>
      </tr>
    </table>`).join('');

  const body = `
    ${spacer(42)}
    ${contentRow(`
      ${eyebrow('Colour lesson 2 of 4')}
      ${headline(`You don&rsquo;t need new clothes. You need ${serifMoment('new pairings.')}`)}
      ${paragraph('Most wardrobes already hold two or three pieces in the right colours. They just get paired with the wrong ones. Here are three outfits built only from the shades in your result.')}
    `)}
    ${spacer(10)}
    ${contentRow(ideaBlocks || paragraph('Open your result to see your shades, then pair one best colour on top with one grounding neutral below.'))}
    ${spacer(10)}
    ${contentRow(`
      ${paragraph('The rule behind all three: your best colour goes on top, near your face, and a quieter shade grounds it below.', `font-size:15px;color:${C.ink};font-weight:600;`)}
    `)}
    ${spacer(24)}
    ${contentRow(blueprintPanel(input, `Want ${BLUEPRINT_OFFER.outfitFormulas} of these, made for your body and your week?`))}
    ${spacer(36)}
    ${contentRow(`${helpLine()}${signOff()}`)}
    ${spacer(42)}`;

  return build(input, {
    subject,
    preheader,
    body,
    text: [
      "You don't need new clothes. You need new pairings.",
      '',
      ...ideas.map((idea) => `${idea.title}: ${idea.formula}`),
      '',
      'The rule: your best colour on top, near your face; a quieter shade below.',
      '',
      `Want ${BLUEPRINT_OFFER.outfitFormulas} of these made for your body? ${input.offerUrl}`,
    ],
  });
}

// ── Email 4 · five days: proof ─────────────────────────────────────────────────

function proofEmail(input: ColourScanNurtureEmailInput): ColourScanNurtureEmail {
  const subject = 'From “nothing suits me” to “I just know”';
  const preheader = 'What changed for ICONIK clients once colour and shape were solved together.';
  const clients = `${CLIENT_PROOF.totalClients.toLocaleString('en-IN')}+`;

  const body = `
    ${spacer(42)}
    ${contentRow(`
      ${eyebrow('Colour lesson 3 of 4')}
      ${headline(`Colour is half the answer. ${serifMoment('Shape is the other half.')}`)}
      ${paragraph('Your colours make your face look fresh. But an outfit only feels right when the colour and the cut work together: the right length, the right neckline, the right fit for your body.')}
      ${paragraph(`That&rsquo;s what our stylists solve in the Blueprint. ${clients} women and men have been styled by ICONIK so far. Here are two of them.`)}
    `)}
    ${spacer(18)}
    ${contentRow(`
      ${twoUp(
        image('transformation-1.jpg', 'ICONIK client before and after: from a loose vest top to a tailored black suit with a wine silk shirt', 248, 14),
        image('transformation-2.jpg', 'ICONIK client before and after: from an oversized T-shirt to a belted emerald blouse with navy trousers', 248, 14),
      )}
      ${caption('ICONIK clients. Faces blurred for privacy.')}
    `)}
    ${spacer(30)}
    ${contentRow(`
      ${quoteCard('Earlier I would change three or four times before going out. Now I know what to pick, and I still feel comfortable in it.', 'Priya, 28 &middot; Mumbai')}
      <div style="height:14px;line-height:14px;font-size:0;">&nbsp;</div>
      ${quoteCard('I always thought covering my arms was the only option. The sleeve suggestions were practical, and the outfits still felt like me.', 'Ananya, 32 &middot; Delhi')}
    `)}
    ${spacer(30)}
    ${contentRow(`
      ${image('blueprint-outfits.jpg', 'A sample outfit page from an ICONIK Blueprint: The Ivory Kurta Office Look', 512)}
      ${caption('A sample Blueprint outfit page. Yours is made from your own call.')}
    `)}
    ${spacer(30)}
    ${contentRow(blueprintPanel(input, 'Your colours are the start. Let a stylist build the rest.'))}
    ${spacer(36)}
    ${contentRow(signOff())}
    ${spacer(42)}`;

  return build(input, {
    subject,
    preheader,
    body,
    text: [
      'Colour is half the answer. Shape is the other half.',
      '',
      `Our stylists solve both in the Blueprint. ${clients} clients styled so far.`,
      '',
      '"Earlier I would change three or four times before going out. Now I know what to pick." (Priya, 28, Mumbai)',
      '"The sleeve suggestions were practical, and the outfits still felt like me." (Ananya, 32, Delhi)',
      '',
      `See the Blueprint: ${input.offerUrl}`,
    ],
  });
}

// ── Email 5 · seven days: your occasion ────────────────────────────────────────

const OCCASIONS: Record<string, { label: string; subject: string; intro: string; tip: string }> = {
  wedding: {
    label: 'wedding',
    subject: 'Your wedding-guest colours',
    intro: 'You told us a wedding is coming up. Wedding photos are the most unforgiving light there is, so this is where your colours matter most.',
    tip: 'For the ceremony, wear your deepest best shade in silk or brocade; save the lighter ones for the mehendi or day events. Let your metal match your undertone so the jewellery glows instead of looking grey in photos.',
  },
  festive: {
    label: 'festive',
    subject: 'Your festive colours, sorted',
    intro: 'You told us festive season is coming up. Here is how to shine in the photos without buying a whole new wardrobe.',
    tip: 'Build one festive look around your accent shade, with your grounding neutral for the dupatta or bottoms. Rich fabrics (silk, chanderi, velvet) make your best colours look even deeper.',
  },
  office_events: {
    label: 'office event',
    subject: 'Your colours for the office event',
    intro: 'You told us office events are coming up. You want to look polished without looking like you tried too hard.',
    tip: 'Use a grounding neutral for the tailored piece (trousers, blazer or skirt) and one best colour on top, near your face. That one colour does all the work in photos and on video calls.',
  },
  travel: {
    label: 'trip',
    subject: 'Your travel capsule, in your colours',
    intro: 'You told us you are travelling soon. Packing in your colours means every piece goes with every other.',
    tip: 'Pick two grounding neutrals for bottoms and layers, then three tops in your best shades. That is nine outfits from five pieces, and every photo works.',
  },
  nothing: {
    label: 'everyday',
    subject: 'The 5-piece capsule in your colours',
    intro: 'No big event coming up? This is the best time to build an everyday wardrobe that works on autopilot.',
    tip: 'Two grounding neutrals for bottoms, three tops in your best shades, and one metal for all your jewellery. Everything matches everything, and getting dressed takes two minutes.',
  },
};

function occasionEmail(input: ColourScanNurtureEmailInput): ColourScanNurtureEmail {
  const occasion = OCCASIONS[input.upcoming ?? ''] ?? OCCASIONS.nothing;
  const colour = input.colour;
  const shades = colour ? [...colour.accents, ...colour.best].slice(0, 5) : [];
  const subject = occasion.subject;
  const preheader = 'The shades from your result that will look best in the photos.';

  const body = `
    ${spacer(42)}
    ${contentRow(`
      ${eyebrow('Colour lesson 4 of 4')}
      ${headline(`${hello(input)}let&rsquo;s plan your ${serifMoment(`${occasion.label} looks.`)}`)}
      ${paragraph(occasion.intro)}
    `)}
    ${shades.length ? `
    ${spacer(12)}
    ${contentRow(panel(`
      ${eyebrow(`Your ${occasion.label} shades`)}
      ${swatchRow(shades, { size: 64 })}
    `))}` : ''}
    ${spacer(26)}
    ${contentRow(`
      ${paragraph(occasion.tip)}
      ${colour ? paragraph(`Your metals: <strong style="color:${C.ink};">${esc(colour.metals)}</strong>.${colour.lips.length ? ` For lips, try ${esc(colour.lips.join(' or ').toLowerCase())}.` : ''}`) : ''}
    `)}
    ${spacer(14)}
    ${contentRow(blueprintPanel(input, `Walk into your ${occasion.label} knowing exactly what to wear.`))}
    ${spacer(36)}
    ${contentRow(`${helpLine()}${signOff()}`)}
    ${spacer(42)}`;

  return build(input, {
    subject,
    preheader,
    body,
    text: [
      `Let's plan your ${occasion.label} looks.`,
      '',
      occasion.intro,
      '',
      ...(shades.length ? [`Your ${occasion.label} shades:`, ...plainSwatches(shades), ''] : []),
      occasion.tip,
      '',
      `See the Blueprint: ${input.offerUrl}`,
    ],
  });
}

// ── Email 6 · ten days: last note ──────────────────────────────────────────────

function lastEmail(input: ColourScanNurtureEmailInput): ColourScanNurtureEmail {
  const subject = 'Last note about your colours';
  const preheader = 'Answers to the questions women ask us before booking a stylist.';
  const faqs: Array<[string, string]> = [
    ['Is it a real stylist?', `Yes. You talk to your stylist on a ${BLUEPRINT_OFFER.consultationMinutes}-minute video call from home. Your Blueprint is built from that call, not from a template.`],
    ['What if I don’t like it?', FREE_CHANGES_PROMISE],
    ['Do I have to buy new clothes?', 'No. Your stylist works with your wardrobe first and tells you exactly which few pieces would make the biggest difference.'],
    ['How long does it take?', `Your Blueprint is ready in ${BLUEPRINT_OFFER.deliveryWorkingDays} working days after your call.`],
  ];
  const faqRows = faqs.map(([q, a]) => `
    <p style="margin:0 0 4px;font-family:${SANS};font-size:15px;line-height:22px;font-weight:700;color:${C.ink};">${esc(q)}</p>
    <p style="margin:0 0 18px;font-family:${SANS};font-size:14px;line-height:22px;color:${C.body};">${esc(a)}</p>`).join('');

  const body = `
    ${spacer(42)}
    ${contentRow(`
      ${eyebrow('Last email')}
      ${headline(`${hello(input)}this is where we ${serifMoment('step back.')}`)}
      ${paragraph('Over the last ten days you&rsquo;ve learned your undertone, the shades that light you up, the ones dulling your face, and how to pair them. That alone puts you ahead of most people.')}
      ${paragraph('If you want the full picture, with every shade, your body and face rules, and outfits for your real week, that&rsquo;s what the Blueprint is for. If not, keep your result: it&rsquo;s yours.')}
    `)}
    ${spacer(16)}
    ${contentRow(panel(`${eyebrow('Before you decide')}${faqRows}`))}
    ${spacer(24)}
    ${contentRow(`
      ${button(input.offerUrl, `Get my Blueprint &middot; ${inr(BLUEPRINT_OFFER.currentPriceInr)}`)}
      ${smallNote(`Or <a href="${esc(input.resultUrl)}" target="_blank" style="color:${C.ink};text-decoration:underline;">open your free result again</a>.`)}
    `)}
    ${spacer(36)}
    ${contentRow(`${helpLine()}${signOff()}`)}
    ${spacer(42)}`;

  return build(input, {
    subject,
    preheader,
    body,
    text: [
      'This is where we step back.',
      '',
      'If you want every shade, your body and face rules, and outfits for your real week, that is what the Blueprint is for. If not, keep your result: it is yours.',
      '',
      ...faqs.flatMap(([q, a]) => [q, a, '']),
      `Get your Blueprint (${inr(BLUEPRINT_OFFER.currentPriceInr)}): ${input.offerUrl}`,
      `Your free result: ${input.resultUrl}`,
    ],
  });
}

export function buildColourScanNurtureEmail(input: ColourScanNurtureEmailInput): ColourScanNurtureEmail {
  switch (input.step) {
    case 1: return resultEmail(input);
    case 2: return dullingEmail(input);
    case 3: return outfitsEmail(input);
    case 4: return proofEmail(input);
    case 5: return occasionEmail(input);
    default: return lastEmail(input);
  }
}
