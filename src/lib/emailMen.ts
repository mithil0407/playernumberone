// emailMen.ts — transactional emails for ICONIK Club Men
// Same Gmail transporter as email.ts, men-specific copy and man-theme styling.

import nodemailer from 'nodemailer';

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD not set');
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
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
