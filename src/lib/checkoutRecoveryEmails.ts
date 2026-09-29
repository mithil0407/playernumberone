// The three ₹2,699 abandoned-checkout emails. Table layout and inline styles
// throughout, because Gmail strips most <style> rules and Outlook renders with
// Word; the <style> block only adds the phone layout for clients that keep it.
// Images are JPEGs under /public/email/checkout-recovery (Outlook cannot show
// WebP) and every one has alt text, since many inboxes block images at first.

import {
  recoveryAddonLines,
  recoveryReferencePrice,
  type CheckoutRecoveryStage,
  type CheckoutRecoveryStep,
  type RecoveryAddons,
} from './checkoutRecoveryModel.ts';
import { OFFER_FREE_BONUSES } from './offerTopics.ts';
import {
  BLUEPRINT_OFFER,
  BUSINESS_HOURS,
  CLIENT_PROOF,
  LEGAL_ENTITY_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from './siteFacts.ts';

export interface CheckoutRecoveryEmailInput {
  step: CheckoutRecoveryStep;
  stage: CheckoutRecoveryStage;
  addons: RecoveryAddons;
  basePrice: number;
  amount: number;
  resumeUrl: string;
  unsubscribeUrl: string;
}

export interface CheckoutRecoveryEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

// Mirrors FREE_CHANGES_PROMISE in OfferShowcase.tsx, which is a client module.
const FREE_CHANGES_PROMISE = 'If your Blueprint does not match what you told your stylist, we change it for free.';

const C = {
  page: '#F4EFE5',
  card: '#FFFFFF',
  panel: '#F8F3E9',
  line: '#E7DDCB',
  ink: '#2C2622',
  body: '#5E534C',
  muted: '#8C8078',
  gold: '#9A7D4A',
  sage: '#54705D',
  cream: '#F4EFE5',
  alert: '#8A4B2F',
  alertBg: '#F7EBE2',
} as const;

const SERIF = "Georgia, 'Times New Roman', Times, serif";
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

// ── Building blocks ────────────────────────────────────────────────────────────

function eyebrow(text: string, color: string = C.gold) {
  return `<p style="margin:0 0 14px;font-family:${SANS};font-size:11px;line-height:16px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:${color};">${text}</p>`;
}

function headline(html: string) {
  return `<h1 class="rc-h1" style="margin:0 0 18px;font-family:${SERIF};font-size:34px;line-height:40px;font-weight:400;color:${C.ink};letter-spacing:-0.4px;">${html}</h1>`;
}

function paragraph(html: string, extra = '') {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:26px;color:${C.body};${extra}">${html}</p>`;
}

function button(href: string, label: string) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="rc-btn-table" style="margin:8px 0 0;">
  <tr>
    <td align="center" bgcolor="${C.ink}" style="border-radius:999px;background:${C.ink};">
      <a href="${esc(href)}" target="_blank" class="rc-btn" style="display:inline-block;padding:17px 38px;font-family:${SANS};font-size:16px;line-height:20px;font-weight:700;color:${C.cream};text-decoration:none;border-radius:999px;letter-spacing:0.2px;">${label}&nbsp;&nbsp;&rarr;</a>
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

function contentRow(inner: string, padding = '0 48px') {
  return `<tr><td class="rc-pad" style="padding:${padding};">${inner}</td></tr>`;
}

function image(src: string, alt: string, width: number, radius = 16) {
  return `<img src="${IMG}/${src}" width="${width}" alt="${esc(alt)}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:${radius}px;background:${C.panel};font-family:${SANS};font-size:13px;color:${C.muted};" />`;
}

function caption(text: string) {
  return `<p style="margin:10px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:${C.muted};text-align:center;">${text}</p>`;
}

function rule() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${C.line};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr></table>`;
}

function orderSummary(input: CheckoutRecoveryEmailInput) {
  const addonRows = recoveryAddonLines(input.addons).map((line) => `
      <tr>
        <td style="padding:12px 0 0;font-family:${SANS};font-size:15px;line-height:22px;color:${C.ink};">+ ${line.label}</td>
        <td align="right" style="padding:12px 0 0;font-family:${SANS};font-size:15px;line-height:22px;color:${C.ink};white-space:nowrap;">${inr(line.price)}</td>
      </tr>`).join('');

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.panel};border:1px solid ${C.line};border-radius:18px;">
  <tr>
    <td class="rc-panel" style="padding:26px 28px 24px;">
      ${eyebrow('Your saved order', C.muted)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="top" style="font-family:${SANS};font-size:15px;line-height:22px;color:${C.ink};font-weight:700;">
            ICONIK Personal Style Blueprint
            <div style="font-weight:400;font-size:13px;line-height:20px;color:${C.muted};padding-top:3px;">${BLUEPRINT_OFFER.consultationMinutes}-min stylist call &middot; ${BLUEPRINT_OFFER.outfitFormulas} outfits &middot; your colours &middot; body &amp; face guides</div>
          </td>
          <td valign="top" align="right" style="padding-left:16px;font-family:${SANS};font-size:15px;line-height:22px;color:${C.ink};white-space:nowrap;">
            <span style="font-size:12px;color:${C.muted};text-decoration:line-through;">${inr(recoveryReferencePrice())}</span><br />${inr(input.basePrice)}
          </td>
        </tr>
        ${addonRows}
        <tr>
          <td valign="top" style="padding:12px 0 0;font-family:${SANS};font-size:15px;line-height:22px;color:${C.ink};">
            4 free guides
            <div style="font-size:13px;line-height:20px;color:${C.muted};padding-top:3px;">Hairstyle &middot; Makeup &middot; Hair colour &middot; Glasses</div>
          </td>
          <td valign="top" align="right" style="padding:12px 0 0 16px;font-family:${SANS};font-size:13px;line-height:22px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${C.sage};white-space:nowrap;">Free</td>
        </tr>
        <tr><td colspan="2" style="padding:18px 0 0;">${rule()}</td></tr>
        <tr>
          <td style="padding:16px 0 0;font-family:${SANS};font-size:15px;line-height:22px;font-weight:700;color:${C.ink};">Total</td>
          <td align="right" style="padding:16px 0 0;font-family:${SERIF};font-size:26px;line-height:30px;color:${C.ink};white-space:nowrap;">${inr(input.amount)}</td>
        </tr>
      </table>
      <p style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:${C.muted};">UPI, cards, net banking and wallets &middot; secure payment by Razorpay</p>
    </td>
  </tr>
</table>`;
}

function nextSteps() {
  const steps = [
    ['Pick your call time', 'Right after you pay, we send your booking link on WhatsApp.'],
    [`${BLUEPRINT_OFFER.consultationMinutes} minutes with your stylist`, 'On video, from home. Share what you love, what you never wear, and where you need to look your best.'],
    [`Your Blueprint in ${BLUEPRINT_OFFER.deliveryWorkingDays} working days`, `${BLUEPRINT_OFFER.outfitFormulas} complete outfits, your colour palette, and your body and face guides, all yours to keep.`],
  ];
  const rows = steps.map(([title, desc], index) => `
    <tr>
      <td valign="top" width="44" style="padding:0 0 22px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" valign="middle" width="30" height="30" style="width:30px;height:30px;border:1px solid ${C.gold};border-radius:999px;font-family:${SERIF};font-size:15px;line-height:30px;color:${C.gold};">${index + 1}</td>
        </tr></table>
      </td>
      <td valign="top" style="padding:3px 0 22px;">
        <p style="margin:0 0 4px;font-family:${SANS};font-size:15px;line-height:22px;font-weight:700;color:${C.ink};">${title}</p>
        <p style="margin:0;font-family:${SANS};font-size:14px;line-height:22px;color:${C.body};">${desc}</p>
      </td>
    </tr>`).join('');

  return `
${eyebrow('What happens after you pay')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`;
}

function promiseBand() {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ink};border-radius:18px;">
  <tr>
    <td class="rc-panel" style="padding:26px 28px;">
      ${eyebrow('Our promise', '#D7B57A')}
      <p style="margin:0;font-family:${SERIF};font-size:20px;line-height:29px;color:${C.cream};">${FREE_CHANGES_PROMISE}</p>
    </td>
  </tr>
</table>`;
}

function helpBlock(title: string, body: string) {
  return `
<p style="margin:0 0 6px;font-family:${SANS};font-size:15px;line-height:22px;font-weight:700;color:${C.ink};">${title}</p>
<p style="margin:0;font-family:${SANS};font-size:14px;line-height:22px;color:${C.body};">${body} Reply to this email or <a href="${SUPPORT_WHATSAPP_URL}" target="_blank" style="color:${C.ink};font-weight:700;text-decoration:underline;">WhatsApp us on ${SUPPORT_WHATSAPP_DISPLAY}</a>. A real person on our team answers.</p>`;
}

function quoteCard(quote: string, who: string) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.panel};border-radius:18px;">
  <tr>
    <td class="rc-panel" style="padding:24px 28px 22px;">
      <p style="margin:0 0 4px;font-family:${SERIF};font-size:44px;line-height:30px;color:${C.gold};">&ldquo;</p>
      <p style="margin:0 0 14px;font-family:${SERIF};font-style:italic;font-size:18px;line-height:28px;color:${C.ink};">${quote}</p>
      <p style="margin:0;font-family:${SANS};font-size:12px;line-height:18px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${C.muted};">${who} &nbsp;<span style="color:${C.gold};letter-spacing:2px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span></p>
    </td>
  </tr>
</table>`;
}

function statCell(value: string, label: string, divider: boolean) {
  return `<td class="rc-stat" width="33%" align="center" valign="top" style="padding:4px 6px;${divider ? `border-left:1px solid ${C.line};` : ''}">
    <p style="margin:0;font-family:${SERIF};font-size:30px;line-height:36px;color:${C.ink};">${value}</p>
    <p style="margin:4px 0 0;font-family:${SANS};font-size:12px;line-height:17px;color:${C.muted};">${label}</p>
  </td>`;
}

function twoUp(left: string, right: string) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td class="rc-col" width="50%" valign="top" style="padding-right:8px;">${left}</td>
    <td class="rc-col rc-col-last" width="50%" valign="top" style="padding-left:8px;">${right}</td>
  </tr>
</table>`;
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
      .rc-container { width:100% !important; }
      .rc-pad { padding-left:24px !important; padding-right:24px !important; }
      .rc-panel { padding-left:20px !important; padding-right:20px !important; }
      .rc-h1 { font-size:28px !important; line-height:34px !important; }
      .rc-col { display:block !important; width:100% !important; padding:0 0 14px !important; }
      .rc-col-last { padding-bottom:0 !important; }
      .rc-stat p:first-child { font-size:24px !important; line-height:30px !important; }
      .rc-btn-table { width:100% !important; }
      .rc-btn { display:block !important; padding-left:16px !important; padding-right:16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.page};">
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};">${esc(preheader)}${previewPad}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
    <tr>
      <td align="center" style="padding:36px 12px 40px;">
        <table role="presentation" class="rc-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
          <tr>
            <td align="center" style="padding:0 0 26px;">
              <a href="${SITE_URL}${BLUEPRINT_OFFER.offerPath}" target="_blank" style="text-decoration:none;">
                <span style="font-family:${SERIF};font-size:24px;line-height:28px;letter-spacing:9px;color:${C.ink};">ICONIK</span>
              </a>
              <p style="margin:6px 0 0;font-family:${SANS};font-size:10px;line-height:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.gold};">Personal Style Blueprint</p>
            </td>
          </tr>
          <tr>
            <td style="background:${C.card};border:1px solid ${C.line};border-radius:24px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${body}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" class="rc-pad" style="padding:30px 40px 0;">
              <p style="margin:0 0 8px;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:${C.body};text-decoration:underline;">${SUPPORT_EMAIL}</a> &middot; <a href="${SUPPORT_WHATSAPP_URL}" target="_blank" style="color:${C.body};text-decoration:underline;">WhatsApp ${SUPPORT_WHATSAPP_DISPLAY}</a></p>
              <p style="margin:0 0 8px;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">You're getting this because you started checkout for the ICONIK Blueprint at iconik.pro. We only email about this order. <a href="${esc(unsubscribeUrl)}" target="_blank" style="color:${C.body};text-decoration:underline;">Stop these reminders</a>.</p>
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

// ── Email 1 · one hour: "your order is saved" ──────────────────────────────────

function savedEmail(input: CheckoutRecoveryEmailInput): CheckoutRecoveryEmail {
  const failed = input.stage === 'payment_failed';
  const subject = failed
    ? "Your payment didn't go through, but your Blueprint is saved"
    : 'Your Style Blueprint is saved for you';
  const preheader = failed
    ? 'If anything was debited, your bank returns it automatically. Finish in under a minute.'
    : 'Pick up right where you left off. It takes under a minute.';

  const failedBanner = failed
    ? `<tr><td class="rc-pad" style="padding:16px 48px;background:${C.alertBg};font-family:${SANS};font-size:14px;line-height:21px;color:${C.alert};"><strong>Your payment didn't go through.</strong> Nothing is lost: your order is saved exactly as you left it.</td></tr>`
    : '';

  const body = `
    ${failedBanner}
    ${spacer(44)}
    ${contentRow(`
      ${eyebrow(failed ? 'Your order is still saved' : 'You were one step away')}
      ${headline(failed ? 'Let&rsquo;s get your Blueprint <em style="font-style:italic;">sorted.</em>' : 'Your Blueprint is still <em style="font-style:italic;">waiting for you.</em>')}
      ${failed
        ? paragraph('Payments sometimes fail for reasons that have nothing to do with you: a UPI app timing out, a bank limit, a weak connection. If any money left your account, your bank returns it automatically within 5&ndash;7 working days.')
          + paragraph('Trying once more with a different UPI app, a card or net banking usually works.')
        : paragraph(`You were about to get your own style plan: a ${BLUEPRINT_OFFER.consultationMinutes}-minute call with your stylist, then ${BLUEPRINT_OFFER.outfitFormulas} outfits made for your body and your life. We've kept everything exactly as you left it.`)}
      ${button(input.resumeUrl, failed ? 'Try payment again' : 'Complete my order')}
      ${smallNote('Your details and add-ons are already filled in.')}
    `)}
    ${spacer(36)}
    ${contentRow(`
      <a href="${esc(input.resumeUrl)}" target="_blank" style="text-decoration:none;">${image('blueprint-hero.jpg', 'Sample ICONIK Personal Style Blueprint pages on a tablet and a phone', 504)}</a>
      ${caption('Sample Blueprint pages. Yours is made from your own call.')}
    `)}
    ${spacer(32)}
    ${contentRow(orderSummary(input))}
    ${spacer(40)}
    ${contentRow(nextSteps())}
    ${spacer(12)}
    ${contentRow(promiseBand())}
    ${spacer(36)}
    ${contentRow(helpBlock(failed ? 'Payment still not working?' : 'Something stopped you?', failed ? 'We can help you pay another way.' : 'If you had a question, a payment problem or just want to talk to someone first, we are here.'))}
    ${spacer(44)}`;

  const text = [
    failed ? "Your payment didn't go through, but your ICONIK Blueprint is saved." : 'Your ICONIK Style Blueprint is still waiting for you.',
    '',
    failed
      ? 'Payments sometimes fail because of a UPI timeout, a bank limit or a weak connection. If any money left your account, your bank returns it automatically within 5-7 working days. Trying again with a different UPI app, a card or net banking usually works.'
      : `You were about to get your own style plan: a ${BLUEPRINT_OFFER.consultationMinutes}-minute call with your stylist, then ${BLUEPRINT_OFFER.outfitFormulas} outfits made for your body and your life. We've kept everything exactly as you left it.`,
    '',
    `${failed ? 'Try payment again' : 'Complete your order'}: ${input.resumeUrl}`,
    '',
    ...plainOrderSummary(input),
    '',
    'What happens after you pay:',
    '1. We send your call booking link on WhatsApp.',
    `2. A ${BLUEPRINT_OFFER.consultationMinutes}-minute video call with your stylist.`,
    `3. Your Blueprint in ${BLUEPRINT_OFFER.deliveryWorkingDays} working days.`,
    '',
    FREE_CHANGES_PROMISE,
    '',
    `Need help? Reply to this email or WhatsApp us on ${SUPPORT_WHATSAPP_DISPLAY}.`,
    '',
    'The ICONIK styling team',
    '',
    `Stop these reminders: ${input.unsubscribeUrl}`,
  ].join('\n');

  return { subject, preheader, html: layout({ title: subject, preheader, body, unsubscribeUrl: input.unsubscribeUrl }), text };
}

// ── Email 2 · one day: proof ───────────────────────────────────────────────────

function proofEmail(input: CheckoutRecoveryEmailInput): CheckoutRecoveryEmail {
  const subject = `What ${BLUEPRINT_OFFER.outfitFormulas} outfits made for your body look like`;
  const preheader = 'Before and afters from ICONIK clients, and your saved checkout.';
  const clients = `${CLIENT_PROOF.totalClients.toLocaleString('en-IN')}+`;

  const body = `
    <tr><td style="padding:0;"><a href="${esc(input.resumeUrl)}" target="_blank" style="text-decoration:none;">${image('blueprint-outfits.jpg', 'A sample outfit page from an ICONIK Blueprint: The Ivory Kurta Office Look', 600, 0)}</a></td></tr>
    ${spacer(40)}
    ${contentRow(`
      ${eyebrow('Made for your body, not a trend')}
      ${headline('Open your wardrobe and <em style="font-style:italic;">just know.</em>')}
      ${paragraph('Most women we style don&rsquo;t need more clothes. They need to know which ones suit them.')}
      ${paragraph(`Your Blueprint gives you ${BLUEPRINT_OFFER.outfitFormulas} complete looks: clothes, shoes, bag and jewellery, for work, family functions and weekends. Each one is chosen for your body, your colours and your life, with a note on why it works.`)}
    `)}
    ${spacer(20)}
    ${contentRow(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};">
        <tr><td style="padding:22px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            ${statCell(clients, 'clients styled', false)}
            ${statCell(String(BLUEPRINT_OFFER.outfitFormulas), 'complete outfits', true)}
            ${statCell(`${BLUEPRINT_OFFER.deliveryWorkingDays} days`, 'to your Blueprint', true)}
          </tr></table>
        </td></tr>
      </table>
    `)}
    ${spacer(40)}
    ${contentRow(`
      ${eyebrow('Before &amp; after')}
      ${twoUp(
        image('transformation-1.jpg', 'ICONIK client before and after: from a loose vest top to a tailored black suit with a wine silk shirt', 248, 14),
        image('transformation-2.jpg', 'ICONIK client before and after: from an oversized T-shirt to a belted emerald blouse with navy trousers', 248, 14),
      )}
      ${caption('ICONIK clients. Faces blurred for privacy.')}
    `)}
    ${spacer(36)}
    ${contentRow(`
      ${quoteCard('Earlier I would change three or four times before going out. Now I know what to pick, and I still feel comfortable in it.', 'Priya, 28 &middot; Mumbai')}
      <div style="height:14px;line-height:14px;font-size:0;">&nbsp;</div>
      ${quoteCard('I always thought covering my arms was the only option. The sleeve suggestions were practical, and the outfits still felt like me.', 'Ananya, 32 &middot; Delhi')}
    `)}
    ${spacer(40)}
    ${contentRow(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.panel};border:1px solid ${C.line};border-radius:18px;">
        <tr><td class="rc-panel" align="center" style="padding:30px 28px;">
          <p style="margin:0 0 6px;font-family:${SERIF};font-size:22px;line-height:30px;color:${C.ink};">Your checkout is saved</p>
          <p style="margin:0 0 16px;font-family:${SANS};font-size:14px;line-height:22px;color:${C.body};">${plainCartLine(input)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="rc-btn-table"><tr><td align="center">${button(input.resumeUrl, 'Continue my Blueprint')}</td></tr></table>
          ${smallNote('Your details are already filled in.')}
        </td></tr>
      </table>
    `)}
    ${spacer(36)}
    ${contentRow(helpBlock('Have a question first?', 'Ask us anything about the call, the outfits or payment.'))}
    ${spacer(44)}`;

  const text = [
    `What ${BLUEPRINT_OFFER.outfitFormulas} outfits made for your body look like`,
    '',
    'Most women we style don’t need more clothes. They need to know which ones suit them.',
    `Your Blueprint gives you ${BLUEPRINT_OFFER.outfitFormulas} complete looks: clothes, shoes, bag and jewellery, each one chosen for your body, your colours and your life.`,
    '',
    `${clients} clients styled · ${BLUEPRINT_OFFER.outfitFormulas} complete outfits · ready in ${BLUEPRINT_OFFER.deliveryWorkingDays} working days`,
    '',
    '"Earlier I would change three or four times before going out. Now I know what to pick, and I still feel comfortable in it." — Priya, 28, Mumbai',
    '',
    '"I always thought covering my arms was the only option. The sleeve suggestions were practical, and the outfits still felt like me." — Ananya, 32, Delhi',
    '',
    `Your checkout is saved: ${plainCartLine(input)}`,
    `Continue: ${input.resumeUrl}`,
    '',
    `Questions? Reply to this email or WhatsApp us on ${SUPPORT_WHATSAPP_DISPLAY}.`,
    '',
    'The ICONIK styling team',
    '',
    `Stop these reminders: ${input.unsubscribeUrl}`,
  ].join('\n');

  return { subject, preheader, html: layout({ title: subject, preheader, body, unsubscribeUrl: input.unsubscribeUrl }), text };
}

// ── Email 3 · three days: last note, objections ────────────────────────────────

const LAST_EMAIL_FAQS = [
  {
    q: 'What if the outfits don&rsquo;t feel like me?',
    a: `On your call, you tell your stylist what you like and what you never wear. Your outfits are made around that. ${FREE_CHANGES_PROMISE}`,
  },
  {
    q: 'When would I actually talk to someone?',
    a: `Right after you pay, we send a link to pick your call time. Calls happen ${BUSINESS_HOURS.display.replace('–', '&ndash;')}, on video from home.`,
  },
  {
    q: 'What exactly do I get?',
    a: `A ${BLUEPRINT_OFFER.consultationMinutes}-minute video call, then your Blueprint: ${BLUEPRINT_OFFER.outfitFormulas} outfits made for you, your colour palette, and your body shape and face guides, ready in ${BLUEPRINT_OFFER.deliveryWorkingDays} working days. Plus four guides, free.`,
  },
];

const BOOKLET_IMAGES: Record<string, string> = {
  'Hairstyle guide': 'booklet-hairstyles.jpg',
  'Makeup guide': 'booklet-makeup.jpg',
  'Hair colour guide': 'booklet-hair-colour.jpg',
  'Glasses guide': 'booklet-glasses.jpg',
};

function bookletCell(title: string, desc: string) {
  const src = BOOKLET_IMAGES[title];
  return `
    ${src ? image(src, `ICONIK ${title} booklet cover`, 248, 14) : ''}
    <p style="margin:12px 0 2px;font-family:${SANS};font-size:14px;line-height:20px;font-weight:700;color:${C.ink};">${title}</p>
    <p style="margin:0;font-family:${SANS};font-size:13px;line-height:19px;color:${C.muted};">${desc}</p>`;
}

function lastEmail(input: CheckoutRecoveryEmailInput): CheckoutRecoveryEmail {
  const subject = 'Still deciding? Straight answers before we let your checkout go';
  const preheader = 'The three questions women ask before booking, and the four guides included free.';

  const faqs = LAST_EMAIL_FAQS.map((item, index) => `
    ${index > 0 ? rule() : ''}
    <p style="margin:${index > 0 ? '22px' : '0'} 0 8px;font-family:${SERIF};font-size:20px;line-height:28px;color:${C.ink};">${item.q}</p>
    <p style="margin:0 0 22px;font-family:${SANS};font-size:15px;line-height:24px;color:${C.body};">${item.a}</p>`).join('');

  const bonuses = OFFER_FREE_BONUSES;
  const bookletRows = [];
  for (let index = 0; index < bonuses.length; index += 2) {
    const left = bonuses[index];
    const right = bonuses[index + 1];
    bookletRows.push(twoUp(
      bookletCell(left.title, left.desc),
      right ? bookletCell(right.title, right.desc) : '',
    ));
  }

  const body = `
    ${spacer(44)}
    ${contentRow(`
      ${eyebrow('A last note from us')}
      ${headline('Still thinking it over? <em style="font-style:italic;">That&rsquo;s fair.</em>')}
      ${paragraph(`${inr(input.basePrice)} is a real decision. So here are straight answers to what women ask us most before they book.`)}
    `)}
    ${spacer(12)}
    ${contentRow(faqs)}
    ${spacer(8)}
    ${contentRow(`
      ${eyebrow('Included free with your Blueprint', C.sage)}
      ${bookletRows.join('<div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>')}
    `)}
    ${spacer(40)}
    ${contentRow(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ink};border-radius:18px;">
        <tr><td class="rc-panel" align="center" style="padding:34px 28px;">
          <p style="margin:0 0 8px;font-family:${SERIF};font-size:24px;line-height:32px;color:${C.cream};">Your checkout is still saved</p>
          <p style="margin:0 0 20px;font-family:${SANS};font-size:14px;line-height:22px;color:#CFC5B8;">${plainCartLine(input)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="rc-btn-table">
            <tr><td align="center" bgcolor="${C.cream}" style="border-radius:999px;background:${C.cream};">
              <a href="${esc(input.resumeUrl)}" target="_blank" class="rc-btn" style="display:inline-block;padding:17px 38px;font-family:${SANS};font-size:16px;line-height:20px;font-weight:700;color:${C.ink};text-decoration:none;border-radius:999px;">Complete my order&nbsp;&nbsp;&rarr;</a>
            </td></tr>
          </table>
          <p style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:#A89C90;">Your details are already filled in.</p>
        </td></tr>
      </table>
    `)}
    ${spacer(36)}
    ${contentRow(`
      ${paragraph('This is the last email we&rsquo;ll send about this checkout. If now isn&rsquo;t the right time, that&rsquo;s completely okay. Your details stay private, and the offer page is always here when you&rsquo;re ready.', 'font-size:15px;line-height:24px;')}
      <p style="margin:0;font-family:${SERIF};font-style:italic;font-size:17px;line-height:26px;color:${C.ink};">With care,<br />The ICONIK styling team</p>
    `)}
    ${spacer(44)}`;

  const text = [
    'Still thinking it over? That’s fair.',
    '',
    `${inr(input.basePrice)} is a real decision. So here are straight answers to what women ask us most before they book.`,
    '',
    ...LAST_EMAIL_FAQS.flatMap((item) => [plain(item.q), plain(item.a), '']),
    'Included free with your Blueprint:',
    ...OFFER_FREE_BONUSES.map((bonus) => `- ${bonus.title}: ${bonus.desc}`),
    '',
    `Your checkout is still saved: ${plainCartLine(input)}`,
    `Complete your order: ${input.resumeUrl}`,
    '',
    'This is the last email we’ll send about this checkout.',
    '',
    'With care,',
    'The ICONIK styling team',
    '',
    `Stop these reminders: ${input.unsubscribeUrl}`,
  ].join('\n');

  return { subject, preheader, html: layout({ title: subject, preheader, body, unsubscribeUrl: input.unsubscribeUrl }), text };
}

// ── Plain-text helpers ─────────────────────────────────────────────────────────

function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&rsquo;/g, '’')
    .replace(/&ndash;/g, '–')
    .replace(/&middot;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

function plainCartLine(input: CheckoutRecoveryEmailInput): string {
  const addons = recoveryAddonLines(input.addons).map((line) => line.label);
  const items = ['Personal Style Blueprint', ...addons, '4 free guides'];
  return `${items.join(' + ')} · ${inr(input.amount)}`;
}

function plainOrderSummary(input: CheckoutRecoveryEmailInput): string[] {
  return [
    'Your saved order:',
    `- ICONIK Personal Style Blueprint: ${inr(input.basePrice)}`,
    ...recoveryAddonLines(input.addons).map((line) => `- ${line.label}: ${inr(line.price)}`),
    '- 4 free guides (hairstyle, makeup, hair colour, glasses): Free',
    `Total: ${inr(input.amount)}`,
  ];
}

export function buildCheckoutRecoveryEmail(input: CheckoutRecoveryEmailInput): CheckoutRecoveryEmail {
  if (input.step === 1) return savedEmail(input);
  if (input.step === 2) return proofEmail(input);
  return lastEmail(input);
}
