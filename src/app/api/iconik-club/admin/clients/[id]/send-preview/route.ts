import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import nodemailer from 'nodemailer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: profileId } = await params;
  const admin = createSupabaseAdminServerClient();

  // Load profile
  const { data: profile, error: profileErr } = await admin
    .from('client_profiles')
    .select('name, email, preview_token, token_expires_at')
    .eq('id', profileId)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Refresh expiry to 30 days from now on every send
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await admin
    .from('client_profiles')
    .update({ token_expires_at: expiresAt })
    .eq('id', profileId);

  const token     = profile.preview_token as string;
  const baseUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playernumberone.in';
  const previewUrl = `${baseUrl}/iconik-club/preview/${token}`;
  const firstName  = (profile.name as string).split(' ')[0];

  // Send email via Gmail (same transporter used elsewhere in the app)
  try {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      // Return the link even if email fails — admin can share manually
      return NextResponse.json({ success: false, error: 'Email not configured', preview_url: previewUrl });
    }

    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#fdf9f6;font-family:'Georgia',serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #f0e6e0;">

    <!-- Header -->
    <div style="background:#2a1a24;padding:32px 40px;text-align:center;">
      <p style="margin:0;font-size:11px;letter-spacing:0.3em;color:#c9a882;text-transform:uppercase;">Iconik Club</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 40px 32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;color:#c9a882;text-transform:uppercase;">Your style edit is ready</p>
      <h1 style="margin:0 0 24px;font-size:32px;font-weight:400;color:#2a1a24;line-height:1.2;">
        Hi ${firstName},<br /><em>your outfits are here.</em>
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#4a2c3e;line-height:1.7;">
        Your stylist has curated 6 outfits built specifically for your body geometry,
        colour palette, and lifestyle. Every piece is shoppable — direct links to
        Myntra, Ajio, and Amazon.
      </p>

      <!-- CTA button -->
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${previewUrl}"
           style="display:inline-block;background:#2a1a24;color:#ffffff;text-decoration:none;
                  padding:16px 36px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;">
          View Your Outfits →
        </a>
      </div>

      <p style="margin:0 0 8px;font-size:13px;color:#4a2c3e/60;line-height:1.6;">
        This preview link is personal to you and expires in 30 days. To keep access
        to your vault and receive new outfit drops every month,
        <a href="${baseUrl}/iconik-club/join" style="color:#c9a882;">subscribe to Iconik Club</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #f0e6e0;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9a7a8a;letter-spacing:0.1em;">
        Iconik Club · playernumberone.in
      </p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from:    `"Iconik Club" <${user}>`,
      to:      profile.email as string,
      subject: `${firstName}, your style edit is ready`,
      html,
    });

    return NextResponse.json({ success: true, preview_url: previewUrl });
  } catch (err) {
    console.error('Preview email send error:', err);
    return NextResponse.json({ success: false, error: 'Email failed', preview_url: previewUrl });
  }
}
