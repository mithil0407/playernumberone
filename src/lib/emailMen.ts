// emailMen.ts — transactional emails for ICONIK Club Men
// Same Gmail transporter as email.ts, men-specific copy and man-theme styling.

import nodemailer from 'nodemailer';

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD not set');
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function deriveName(name: string | null | undefined, email: string): string {
  const fallback = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const raw = (name?.trim() || fallback || 'there')
    .replace(/\s+/g, ' ')
    .trim();

  return raw.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Sent immediately after subscription activates — contains login credentials.
export async function sendMenClubWelcomeEmail(
  name:         string,
  email:        string,
  tempPassword: string
): Promise<void> {
  const transporter = getTransporter();
  const from        = process.env.GMAIL_USER!;
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playernumberone.in';
  const loginUrl    = `${siteUrl}/iconik-club-men/client/login`;
  const firstName   = name.split(' ')[0];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Georgia',serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #e8e4dc;">

    <!-- Header -->
    <div style="background:#141414;padding:32px 40px;text-align:center;">
      <p style="margin:0;font-size:11px;letter-spacing:0.3em;color:#9a7d4a;text-transform:uppercase;">Iconik Club Men</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 40px 32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;color:#9a7d4a;text-transform:uppercase;">Welcome</p>
      <h1 style="margin:0 0 24px;font-size:32px;font-weight:400;color:#141414;line-height:1.2;">
        Hi ${firstName},<br /><em>you're in.</em>
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#141414;opacity:0.75;line-height:1.7;">
        Your Iconik Club Men membership is active. Here are your login details to
        complete your style profile — it takes 4 minutes and unlocks your personalised outfits.
      </p>

      <!-- Credentials box -->
      <div style="background:#f5f3ef;border:1px solid #e8e4dc;padding:20px 24px;margin:0 0 28px;border-radius:4px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9a7d4a;">Your Login</p>
        <p style="margin:0 0 4px;font-size:14px;color:#141414;">
          <strong>Email:</strong> ${email}
        </p>
        <p style="margin:0;font-size:14px;color:#141414;">
          <strong>Password:</strong> ${tempPassword}
        </p>
        <p style="margin:8px 0 0;font-size:11px;color:#141414;opacity:0.5;">
          Keep this private. You can change your password after logging in.
        </p>
      </div>

      <!-- What happens next -->
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9a7d4a;">What happens next</p>
      <ol style="margin:0 0 28px;padding-left:20px;color:#141414;opacity:0.75;font-size:14px;line-height:1.8;">
        <li>Sign in and complete your style profile (photos + measurements)</li>
        <li>Our stylists build 6 outfits around your body geometry and lifestyle</li>
        <li>You receive your outfit edit within 24 hours — every piece is shoppable</li>
      </ol>

      <!-- CTA -->
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${loginUrl}"
           style="display:inline-block;background:#141414;color:#ffffff;text-decoration:none;
                  padding:16px 36px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;">
          Sign In &amp; Complete Your Profile →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e8e4dc;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#141414;opacity:0.4;letter-spacing:0.1em;">
        Iconik Club Men · playernumberone.in
      </p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    `"Iconik Club Men" <${from}>`,
    to:      email,
    subject: `Welcome to Iconik Club Men — your login details`,
    html,
  });
}

// Sent by admin after generating outfits for a client.
export async function sendMenOutfitsReadyEmail(
  name:       string,
  email:      string,
  outfitsUrl: string
): Promise<void> {
  const transporter = getTransporter();
  const from        = process.env.GMAIL_USER!;
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playernumberone.in';
  const firstName   = name.split(' ')[0];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Georgia',serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #e8e4dc;">

    <div style="background:#141414;padding:32px 40px;text-align:center;">
      <p style="margin:0;font-size:11px;letter-spacing:0.3em;color:#9a7d4a;text-transform:uppercase;">Iconik Club Men</p>
    </div>

    <div style="padding:40px 40px 32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;color:#9a7d4a;text-transform:uppercase;">Your style edit is ready</p>
      <h1 style="margin:0 0 24px;font-size:32px;font-weight:400;color:#141414;line-height:1.2;">
        Hi ${firstName},<br /><em>your outfits are here.</em>
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#141414;opacity:0.75;line-height:1.7;">
        Your stylist has built 6 outfits around your body geometry, colour palette, and lifestyle.
        Every piece is shoppable — direct links to Myntra, Ajio, and Amazon.
      </p>

      <div style="text-align:center;margin:0 0 32px;">
        <a href="${outfitsUrl}"
           style="display:inline-block;background:#141414;color:#ffffff;text-decoration:none;
                  padding:16px 36px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;">
          View Your Outfits →
        </a>
      </div>

      <p style="margin:0;font-size:13px;color:#141414;opacity:0.5;line-height:1.6;">
        New outfits drop every month. Questions? Reply to this email or visit
        <a href="${siteUrl}" style="color:#9a7d4a;">playernumberone.in</a>.
      </p>
    </div>

    <div style="border-top:1px solid #e8e4dc;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#141414;opacity:0.4;letter-spacing:0.1em;">
        Iconik Club Men · playernumberone.in
      </p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    `"Iconik Club Men" <${from}>`,
    to:      email,
    subject: `${firstName}, your style edit is ready`,
    html,
  });
}

export async function sendMenBlueprintReportEmail(data: {
  name?: string | null;
  email: string;
  reportUrl: string;
  silhouette?: string | null;
  faceShape?: string | null;
  season?: string | null;
  primaryBrief?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const from        = process.env.GMAIL_USER!;
    const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playernumberone.in';
    const displayName = deriveName(data.name, data.email);
    const firstName   = displayName.split(' ')[0];
    const silhouette  = data.silhouette?.trim() || 'Personalised';
    const faceShape   = data.faceShape?.trim() || 'Face';
    const season      = data.season?.trim() || 'Season';
    const brief       = data.primaryBrief?.trim() || 'Your report is built specifically around your structure, colouring, and style direction.';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ICONIK Blueprint is ready</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f3ef;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e8e4dc;">
          <tr>
            <td style="padding:22px 36px;background:#141414;text-align:center;">
              <div style="font-size:11px;letter-spacing:0.34em;text-transform:uppercase;color:#9a7d4a;">ICONIK Blueprint</div>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 36px 28px;">
              <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9a7d4a;margin-bottom:12px;">Your Report Is Ready</div>
              <h1 style="margin:0 0 18px;font-size:34px;line-height:1.15;font-weight:400;color:#141414;">
                Hi ${htmlEscape(firstName)},<br /><em>your Blueprint is ready.</em>
              </h1>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#4b4b4b;">
                Your completed ICONIK Men&apos;s Blueprint is now live. Inside, you&apos;ll find your face architecture analysis, body geometry rules, chromatic map, full outfit section, and your personal style identity statement.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;background:#f8f5f1;border:1px solid #ece5db;">
                <tr>
                  <td width="33.33%" style="padding:16px 12px;text-align:center;border-right:1px solid #ece5db;">
                    <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#9a7d4a;margin-bottom:6px;">Build</div>
                    <div style="font-size:14px;color:#141414;">${htmlEscape(silhouette)}</div>
                  </td>
                  <td width="33.33%" style="padding:16px 12px;text-align:center;border-right:1px solid #ece5db;">
                    <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#9a7d4a;margin-bottom:6px;">Face</div>
                    <div style="font-size:14px;color:#141414;">${htmlEscape(faceShape)}</div>
                  </td>
                  <td width="33.33%" style="padding:16px 12px;text-align:center;">
                    <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#9a7d4a;margin-bottom:6px;">Season</div>
                    <div style="font-size:14px;color:#141414;">${htmlEscape(season)}</div>
                  </td>
                </tr>
              </table>

              <div style="padding:18px 20px;background:#141414;margin:0 0 26px;">
                <p style="margin:0;font-size:14px;line-height:1.7;color:#f5f3ef;">
                  ${htmlEscape(brief)}
                </p>
              </div>

              <div style="text-align:center;margin:0 0 28px;">
                <a href="${htmlEscape(data.reportUrl)}"
                   style="display:inline-block;background:#141414;color:#ffffff;text-decoration:none;padding:16px 34px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">
                  Open Your Private Report
                </a>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:0 0 10px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9a7d4a;">
                    Inside Your Blueprint
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;line-height:1.8;color:#4b4b4b;">
                    • Face architecture analysis for hair, facial hair, and eyewear<br />
                    • Body geometry rules for fit, structure, and cuts to avoid<br />
                    • Chromatic harmony map with your best palette and neutrals<br />
                    • Your outfit recommendations and final style identity statement
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;line-height:1.7;color:#6b6b6b;">
                This link opens your private report directly, with no login required. If you have any questions, just reply to this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 36px;border-top:1px solid #e8e4dc;text-align:center;">
              <div style="font-size:11px;letter-spacing:0.12em;color:#8a8a8a;">
                ICONIK Blueprint · ${htmlEscape(siteUrl.replace(/^https?:\/\//, ''))}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text =
      `Hi ${firstName},\n\n` +
      `Your ICONIK Men's Blueprint is ready.\n\n` +
      `Open your private report here:\n${data.reportUrl}\n\n` +
      `Summary:\n` +
      `Build: ${silhouette}\n` +
      `Face: ${faceShape}\n` +
      `Season: ${season}\n\n` +
      `${brief}\n\n` +
      `If you have any questions, just reply to this email.\n\n` +
      `ICONIK Blueprint`;

    const info = await transporter.sendMail({
      from:    `"ICONIK Blueprint" <${from}>`,
      to:      data.email,
      subject: `${firstName}, your ICONIK Blueprint is ready`,
      text,
      html,
    });

    console.log(`Men blueprint report email sent to ${data.email}. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending men blueprint report email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
