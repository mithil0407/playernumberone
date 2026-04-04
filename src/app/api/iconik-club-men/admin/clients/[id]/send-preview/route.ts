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

  const { data: profile, error: profileErr } = await admin
    .from('men_client_profiles')
    .select('name, email, preview_token, token_expires_at')
    .eq('id', profileId)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Refresh expiry on every send
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await admin.from('men_client_profiles').update({ token_expires_at: expiresAt }).eq('id', profileId);

  const token      = profile.preview_token as string;
  const baseUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playernumberone.in';
  const previewUrl = `${baseUrl}/iconik-club-men/preview/${token}`;
  const firstName  = (profile.name as string).split(' ')[0];

  try {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
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
      <p style="margin:0 0 28px;font-size:15px;color:#141414;line-height:1.7;opacity:0.75;">
        Your stylist has built 6 outfits around your body geometry, colour palette, and lifestyle.
        Every piece is shoppable — direct links to Myntra, Ajio, and Amazon.
      </p>

      <div style="text-align:center;margin:0 0 32px;">
        <a href="${previewUrl}"
           style="display:inline-block;background:#141414;color:#ffffff;text-decoration:none;
                  padding:16px 36px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;">
          View Your Outfits →
        </a>
      </div>

      <p style="margin:0 0 8px;font-size:13px;color:#141414;opacity:0.5;line-height:1.6;">
        This link is personal to you and expires in 30 days. To keep access
        and receive new outfit drops every month,
        <a href="${baseUrl}/iconik-club-men/join" style="color:#9a7d4a;">subscribe to Iconik Club Men</a>.
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
      from:    `"Iconik Club Men" <${user}>`,
      to:      profile.email as string,
      subject: `${firstName}, your style edit is ready`,
      html,
    });

    return NextResponse.json({ success: true, preview_url: previewUrl });
  } catch (err) {
    console.error('Men preview email send error:', err);
    return NextResponse.json({ success: false, error: 'Email failed', preview_url: previewUrl });
  }
}
