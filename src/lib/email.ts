import nodemailer from 'nodemailer';

export interface ConfirmationEmailData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_amount: number;
  add_ons?: string;
  payment_id?: string;
  // Optional: override currency symbol for international orders (default '₹')
  currency_symbol?: string;
}

export interface AUOrderConfirmationEmailData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_amount: number;
  payment_id?: string;
  has_edit_addon?: boolean;
  delivery_hours?: number;
}

export interface AUQuizReminderEmailData {
  customer_name: string;
  customer_email: string;
  intake_link: string;
}

export interface GlobeQuizReminderEmailData {
  customer_name: string;
  customer_email: string;
  intake_link: string;
  delivery_hours?: number;
}

export interface IntakeReceivedEmailData {
  customer_email: string;
  customer_phone?: string;
}

export interface GlobeIntakeNotificationData {
  customer_email: string;
  customer_phone: string;
  photo_fullbody_url?: string;
  photo_headshot_url?: string;
  // Section 1 — Basics
  primary_goal?: string;
  style_relationship?: string;
  dressing_context?: string;
  location_tier?: string;
  // Section 2 — Body
  height_category?: string;
  body_shape?: string;
  fat_storage_zone?: string;
  highlight_zone?: string;
  minimise_zone?: string;
  fit_preference?: string;
  modesty_level?: string;
  wardrobe_composition?: string;
  // Section 3 — Colour
  skin_tone?: string;
  vein_undertone?: string;
  white_test?: string;
  hair_colour?: string;
  eye_colour?: string;
  derived_colour_season?: string;
  // Section 4 — Face
  face_shape?: string;
  facial_feature_type?: string;
  // Section 5 — Style
  style_goal?: string;
  primary_style_goal?: string;
  branch_sub_goal?: string;
  branch_blocker?: string;
  branch_reference?: string;
  style_pole_structure?: string;
  style_pole_expression?: string;
  style_pole_tone?: string;
  style_pole_register?: string;
  style_blocker?: string;
  style_anti_pref?: string;
  style_anti_pref_note?: string;
  visual_style_reference?: string;
  free_text_note?: string;
  // Additional intake fields
  frustrations?: string;
  frustrations_custom?: string;
  situations?: string;
  body_insecurities?: string;
  wardrobe_type?: string;
  colour_preference?: string;
  style_aesthetics?: string;
  style_outcome?: string;
  style_restrictions?: string;
  hair_type?: string;
}

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD environment variables are not set');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

function buildEmailHtml(data: ConfirmationEmailData): string {
  const { customer_name, customer_email, customer_phone, order_amount, add_ons, payment_id } = data;

  // Build add-ons section
  const addOnsList = add_ons && add_ons !== 'None' && add_ons !== ''
    ? add_ons.split(',').map(a => a.trim()).filter(Boolean)
    : [];

  const addOnsHtml = addOnsList.length > 0
    ? `
      <tr>
        <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
          <strong style="color:#333;">Add-ons:</strong> ${addOnsList.join(', ')}
        </td>
      </tr>`
    : '';

  // Suppress unused variable warning — kept for potential future use
  void customer_name;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Iconik Consultation is Confirmed!</title>
</head>
<body style="margin:0; padding:0; background-color:#fdf8f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%); padding: 40px 40px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:-0.5px;">ICONIK</h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px; letter-spacing:2px; text-transform:uppercase;">Fashion &amp; Image Consulting</p>
            </td>
          </tr>

          <!-- Confirmation Badge -->
          <tr>
            <td style="padding: 32px 40px 0; text-align:center;">
              <div style="display:inline-block; background:#f0fdf4; border:2px solid #22c55e; border-radius:50px; padding:10px 24px;">
                <span style="color:#16a34a; font-size:15px; font-weight:600;">✓ Order Confirmed</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin:0 0 12px; color:#333; font-size:16px; line-height:1.7;">Hi there,</p>
              <p style="margin:0 0 12px; color:#333; font-size:16px; line-height:1.7;">
                Thank you for purchasing your <strong>Iconik Style Consultation</strong>. Your order is confirmed, and your transformation journey officially begins now!
              </p>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <div style="background:#fdf8f5; border-radius:12px; padding:20px 24px; border:1px solid #f0e8e8;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
                      <strong style="color:#333;">Service:</strong> Iconik Style Consultation
                    </td>
                  </tr>
                  ${addOnsHtml}
                  <tr>
                    <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
                      <strong style="color:#333;">Email:</strong> ${customer_email}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
                      <strong style="color:#333;">Phone:</strong> +91 ${customer_phone}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0 0; color:#16a34a; font-size:16px; font-weight:700;">
                      Total Paid: ₹${order_amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </table>
                ${payment_id ? `<p style="margin:10px 0 0; color:#bbb; font-size:11px;">Payment ID: ${payment_id}</p>` : ''}
              </div>
            </td>
          </tr>

          <!-- Book Session CTA -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin:0 0 16px; color:#333; font-size:16px; line-height:1.7;">
                To get started, please book your session using the link below:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://cal.com/iconone-wpnx1q/30min-copy"
                       style="display:inline-block; background:#e91e63; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:16px 36px; border-radius:50px; letter-spacing:0.3px;">
                      👉 Schedule Your Consultation Here
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Session Policies -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin:0 0 16px; color:#333; font-size:16px; font-weight:700;">Please note our session policies:</p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f5eded; vertical-align:top;">
                    <p style="margin:0 0 4px; color:#1a1a1a; font-size:15px; font-weight:700;">⏰ 24-Hour Rescheduling Rule</p>
                    <p style="margin:0; color:#555; font-size:14px; line-height:1.6;">
                      You can reschedule your session for free as long as you do so at least 24 hours before your scheduled time.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f5eded; vertical-align:top;">
                    <p style="margin:0 0 4px; color:#1a1a1a; font-size:15px; font-weight:700;">💳 Late Rescheduling</p>
                    <p style="margin:0; color:#555; font-size:14px; line-height:1.6;">
                      Changes made within 24 hours of the meeting will incur a <strong>₹399 convenience fee</strong> to book a new slot.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f5eded; vertical-align:top;">
                    <p style="margin:0 0 4px; color:#1a1a1a; font-size:15px; font-weight:700;">🚫 No-Show Policy</p>
                    <p style="margin:0; color:#555; font-size:14px; line-height:1.6;">
                      We value our consultants' time. If you miss your scheduled session without prior notice (No-Show), no refunds will be issued, and a <strong>₹399 fee</strong> will apply if you wish to re-book.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align:top;">
                    <p style="margin:0 0 4px; color:#1a1a1a; font-size:15px; font-weight:700;">📋 Preparation</p>
                    <p style="margin:0; color:#555; font-size:14px; line-height:1.6;">
                      To get the best results, please ensure you are in a quiet space with a stable internet connection at the time of your call.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0; color:#555; font-size:14px; line-height:1.6;">
                We recommend choosing a time when you're fully available so you can make the most of your consultation.
              </p>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <p style="margin:0 0 8px; color:#333; font-size:15px; line-height:1.7;">
                If you have any questions, just reply to this email — we're here to help you look and feel your best.
              </p>
              <p style="margin:0; color:#333; font-size:15px; line-height:1.7;">
                Best regards,<br />
                <strong>Team Iconik</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px 40px; text-align:center; border-top:1px solid #f0e8e8; margin-top:28px;">
              <p style="margin:0 0 4px; color:#e91e63; font-weight:700; font-size:15px;">ICONIK Fashion &amp; Image Consulting</p>
              <p style="margin:0; color:#999; font-size:13px;">help.iconikfashion@gmail.com</p>
              <p style="margin:16px 0 0; color:#bbb; font-size:12px;">© 2025 ICONIK. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendConfirmationEmail(data: ConfirmationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();

    const addOnsSuffix = data.add_ons && data.add_ons !== 'None' && data.add_ons !== ''
      ? ` + ${data.add_ons}`
      : '';

    const info = await transporter.sendMail({
      from: `"Team Iconik" <${process.env.GMAIL_USER}>`,
      to: data.customer_email,
      subject: `Your Iconik Style Consultation is Confirmed ✅`,
      text: `Hi there,\n\nThank you for purchasing your Iconik Style Consultation${addOnsSuffix}. Your order is confirmed, and your transformation journey officially begins now!\n\nTo get started, please book your session using the link below:\n👉 Schedule Your Consultation Here: https://cal.com/iconone-wpnx1q/30min-copy\n\nPlease note our session policies:\n\n24-Hour Rescheduling Rule: You can reschedule your session for free as long as you do so at least 24 hours before your scheduled time.\n\nLate Rescheduling: Changes made within 24 hours of the meeting will incur a ₹399 convenience fee to book a new slot.\n\nNo-Show Policy: We value our consultants' time. If you miss your scheduled session without prior notice (No-Show), no refunds will be issued, and a ₹399 fee will apply if you wish to re-book.\n\nPreparation: To get the best results, please ensure you are in a quiet space with a stable internet connection at the time of your call.\n\nWe recommend choosing a time when you're fully available so you can make the most of your consultation.\n\nIf you have any questions, just reply to this email — we're here to help you look and feel your best.\n\nBest regards,\nTeam Iconik`,
      html: buildEmailHtml(data),
    });

    console.log(`Confirmation email sent to ${data.customer_email}. Message ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ── Men's Order Confirmation Email ─────────────────────────────────────────

function buildManEmailHtml(data: ConfirmationEmailData): string {
  const { customer_email, customer_phone, order_amount, add_ons, payment_id, currency_symbol = '₹' } = data;
  const intakeLink = `https://www.iconik.pro/man/intake?email=${encodeURIComponent(customer_email)}&phone=${encodeURIComponent(customer_phone)}`;

  const addOnsList = add_ons && add_ons !== 'None' && add_ons !== ''
    ? add_ons.split(',').map(a => a.trim()).filter(Boolean)
    : [];

  const addOnsHtml = addOnsList.length > 0
    ? `
      <tr>
        <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
          <strong style="color:#333;">Add-ons:</strong> ${addOnsList.join(', ')}
        </td>
      </tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Iconik Man Blueprint is Confirmed!</title>
</head>
<body style="margin:0; padding:0; background-color:#fdf8f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 40px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:-0.5px;">ICONIK</h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.75); font-size:14px; letter-spacing:2px; text-transform:uppercase;">Man Style &amp; Image Consulting</p>
            </td>
          </tr>

          <!-- Confirmation Badge -->
          <tr>
            <td style="padding: 32px 40px 0; text-align:center;">
              <div style="display:inline-block; background:#f0fdf4; border:2px solid #22c55e; border-radius:50px; padding:10px 24px;">
                <span style="color:#16a34a; font-size:15px; font-weight:600;">✓ Blueprint Confirmed</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin:0 0 12px; color:#333; font-size:16px; line-height:1.7;">Hi there,</p>
              <p style="margin:0 0 12px; color:#333; font-size:16px; line-height:1.7;">
                Thank you for purchasing your <strong>Iconik Man Style Blueprint</strong>. Your order is confirmed — and your journey to dressing with intention officially begins now.
              </p>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <div style="background:#fdf8f5; border-radius:12px; padding:20px 24px; border:1px solid #f0e8e8;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
                      <strong style="color:#333;">Service:</strong> Iconik Man Style Blueprint
                    </td>
                  </tr>
                  ${addOnsHtml}
                  <tr>
                    <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
                      <strong style="color:#333;">Email:</strong> ${customer_email}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
                      <strong style="color:#333;">Phone:</strong> ${customer_phone}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0 0; color:#16a34a; font-size:16px; font-weight:700;">
                      Total Paid: ${currency_symbol}${order_amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </table>
                ${payment_id ? `<p style="margin:10px 0 0; color:#bbb; font-size:11px;">Payment ID: ${payment_id}</p>` : ''}
              </div>
            </td>
          </tr>

          <!-- Intake Form CTA -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin:0 0 8px; color:#333; font-size:16px; line-height:1.7;">
                <strong style="color:#1a1a2e;">One thing stands between you and your Blueprint:</strong> completing the intake questions. They take 4 minutes and give our stylists the information they need to personalise every section of your report.
              </p>
              <p style="margin:0 0 20px; color:#333; font-size:16px; line-height:1.7;">
                Complete your intake form now and your Blueprint will be ready within 72 hours:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${intakeLink}"
                       style="display:inline-block; background:#1a1a2e; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:16px 36px; border-radius:50px; letter-spacing:0.3px;">
                      Complete My Intake Form →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <p style="margin:0 0 8px; color:#333; font-size:15px; line-height:1.7;">
                If you have any questions, just reply to this email — we&apos;re here to help you build a style that actually works for you.
              </p>
              <p style="margin:0; color:#333; font-size:15px; line-height:1.7;">
                Best regards,<br />
                <strong>Team Iconik</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px 40px; text-align:center; border-top:1px solid #f0e8e8; margin-top:28px;">
              <p style="margin:0 0 4px; color:#1a1a2e; font-weight:700; font-size:15px;">ICONIK Man Style &amp; Image Consulting</p>
              <p style="margin:0; color:#999; font-size:13px;">help.iconikfashion@gmail.com</p>
              <p style="margin:16px 0 0; color:#bbb; font-size:12px;">© 2025 ICONIK. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendManConfirmationEmail(data: ConfirmationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();

    const addOnsSuffix = data.add_ons && data.add_ons !== 'None' && data.add_ons !== ''
      ? ` + ${data.add_ons}`
      : '';

    const intakeLink = `https://www.iconik.pro/man/intake?email=${encodeURIComponent(data.customer_email)}&phone=${encodeURIComponent(data.customer_phone)}`;

    const info = await transporter.sendMail({
      from: `"Team Iconik" <${process.env.GMAIL_USER}>`,
      to: data.customer_email,
      subject: `Your Iconik Man Blueprint is Confirmed ✅`,
      text: `Hi there,\n\nThank you for purchasing your Iconik Man Style Blueprint${addOnsSuffix}. Your order is confirmed — and your Blueprint is now in the queue.\n\nOne thing stands between you and your Blueprint: completing the intake questions. They take 4 minutes and give our stylists the information they need to personalise every section of your report.\n\nComplete your intake form now and your Blueprint will be ready within 72 hours:\n👉 ${intakeLink}\n\nIf you have any questions, just reply to this email — we're here to help you build a style that actually works for you.\n\nBest regards,\nTeam Iconik`,
      html: buildManEmailHtml(data),
    });

    console.log(`Man confirmation email sent to ${data.customer_email}. Message ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending man confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ── AU Order Confirmation Email ────────────────────────────────────────────

function buildAUOrderConfirmationHtml(data: AUOrderConfirmationEmailData): string {
  const { customer_name, customer_email, customer_phone, order_amount, payment_id, has_edit_addon } = data;
  const firstName = customer_name.split(' ')[0] || 'there';
  const intakeLink = `https://www.iconik.pro/au/intake?email=${encodeURIComponent(customer_email)}&phone=${encodeURIComponent(customer_phone)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ICONIK Blueprint is Confirmed</title>
</head>
<body style="margin:0; padding:0; background-color:#fdf8f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #c2185b 0%, #880e4f 100%); padding: 40px 40px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:2px;">ICONIK</h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.8); font-size:12px; letter-spacing:3px; text-transform:uppercase;">Style Intelligence System · Australia</p>
            </td>
          </tr>

          <!-- Confirmation Badge -->
          <tr>
            <td style="padding: 32px 40px 0; text-align:center;">
              <div style="display:inline-block; background:#f0fdf4; border:2px solid #22c55e; border-radius:50px; padding:10px 24px;">
                <span style="color:#16a34a; font-size:15px; font-weight:600;">✓ Order Confirmed · Blueprint in Production</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin:0 0 12px; color:#333; font-size:16px; line-height:1.7;">Hi ${firstName},</p>
              <p style="margin:0 0 12px; color:#333; font-size:16px; line-height:1.7;">
                Thank you for purchasing your <strong>ICONIK Blueprint</strong>. Your payment is confirmed and your Blueprint is now in the queue.
              </p>
              <p style="margin:0; color:#555; font-size:15px; line-height:1.7;">
                <strong style="color:#c2185b;">One thing stands between you and your Blueprint:</strong> completing the intake questions. They take 4 minutes and give our stylists the information they need to personalise every section of your report.
              </p>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <div style="background:#fdf8f5; border-radius:12px; padding:20px 24px; border:1px solid #f0e8e8;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
                      <strong style="color:#333;">Product:</strong> ICONIK Blueprint — Australia
                    </td>
                  </tr>
                  ${has_edit_addon ? `
                  <tr>
                    <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
                      <strong style="color:#333;">Add-on:</strong> The ICONIK Edit (10 outfit formulas)
                    </td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding: 6px 0; border-bottom: 1px solid #f0e8e8; color:#555; font-size:14px;">
                      <strong style="color:#333;">Email:</strong> ${customer_email}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0 0; color:#16a34a; font-size:16px; font-weight:700;">
                      Total Paid: AUD $${order_amount}
                    </td>
                  </tr>
                </table>
                ${payment_id ? `<p style="margin:10px 0 0; color:#bbb; font-size:11px;">Payment Ref: ${payment_id}</p>` : ''}
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin:0 0 16px; color:#333; font-size:16px; line-height:1.7;">
                Complete your intake form now and your Blueprint will be ready within 24 hours:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${intakeLink}"
                       style="display:inline-block; background:#c2185b; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:16px 36px; border-radius:50px; letter-spacing:0.3px;">
                      Complete My Intake Form →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0; color:#999; font-size:12px; text-align:center;">Takes 4 minutes · Blueprint delivered within 24 hours of completion</p>
            </td>
          </tr>

          <!-- What Happens Next -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin:0 0 12px; color:#333; font-size:15px; font-weight:700;">What happens next:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f5eded; vertical-align:top;">
                    <p style="margin:0 0 4px; color:#1a1a1a; font-size:14px; font-weight:700;">1. Complete your intake form</p>
                    <p style="margin:0; color:#555; font-size:13px; line-height:1.6;">4 questions + 2 photos. Your Blueprint cannot be prepared without this.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f5eded; vertical-align:top;">
                    <p style="margin:0 0 4px; color:#1a1a1a; font-size:14px; font-weight:700;">2. Our stylists analyse your profile</p>
                    <p style="margin:0; color:#555; font-size:13px; line-height:1.6;">Your body geometry, chromatic profile, and facial architecture are mapped by our team.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align:top;">
                    <p style="margin:0 0 4px; color:#1a1a1a; font-size:14px; font-weight:700;">3. Blueprint lands in your inbox</p>
                    <p style="margin:0; color:#555; font-size:13px; line-height:1.6;">Within 24 hours of your intake submission, your full personalised Blueprint arrives.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <p style="margin:0 0 8px; color:#333; font-size:15px; line-height:1.7;">
                If you have any questions, reply to this email — we're here.
              </p>
              <p style="margin:0; color:#333; font-size:15px; line-height:1.7;">
                Best regards,<br />
                <strong>The ICONIK Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px 40px; text-align:center; border-top:1px solid #f0e8e8; margin-top:28px;">
              <p style="margin:0 0 4px; color:#c2185b; font-weight:700; font-size:15px;">ICONIK Style Intelligence</p>
              <p style="margin:0; color:#999; font-size:13px;">help.iconikfashion@gmail.com</p>
              <p style="margin:16px 0 0; color:#bbb; font-size:12px;">© 2026 ICONIK. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendAUOrderConfirmationEmail(
  data: AUOrderConfirmationEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const firstName = data.customer_name.split(' ')[0] || 'there';
    const intakeLink = `https://www.iconik.pro/au/intake?email=${encodeURIComponent(data.customer_email)}&phone=${encodeURIComponent(data.customer_phone)}`;

    const info = await transporter.sendMail({
      from: `"ICONIK Style Intelligence" <${process.env.GMAIL_USER}>`,
      to: data.customer_email,
      subject: `✅ Your ICONIK Blueprint is confirmed — complete your intake to unlock it`,
      text: `Hi ${firstName},\n\nThank you for purchasing your ICONIK Blueprint (AUD $${data.order_amount}).\n\nYour Blueprint cannot be prepared until you complete your 4-minute intake form:\n${intakeLink}\n\nOnce submitted, your Blueprint arrives within 24 hours.\n\nBest regards,\nThe ICONIK Team\nhelp.iconikfashion@gmail.com`,
      html: buildAUOrderConfirmationHtml(data),
    });

    console.log(`AU order confirmation sent to ${data.customer_email}. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending AU order confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ── AU Quiz Reminder Email ─────────────────────────────────────────────────

function buildAUQuizReminderHtml(data: AUQuizReminderEmailData): string {
  const { customer_name, intake_link } = data;
  const firstName = customer_name.split(' ')[0] || 'there';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Complete Your Intake to Unlock Your Blueprint</title>
</head>
<body style="margin:0; padding:0; background-color:#fdf8f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #c2185b 0%, #880e4f 100%); padding: 40px 40px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:2px;">ICONIK</h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.8); font-size:12px; letter-spacing:3px; text-transform:uppercase;">Style Intelligence System · Australia</p>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 32px 40px 0; text-align:center;">
              <div style="display:inline-block; background:#fffbeb; border:2px solid #f59e0b; border-radius:50px; padding:10px 24px;">
                <span style="color:#b45309; font-size:15px; font-weight:600;">⏳ Intake Not Yet Received</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin:0 0 12px; color:#333; font-size:16px; line-height:1.7;">Hi ${firstName},</p>
              <p style="margin:0 0 16px; color:#333; font-size:16px; line-height:1.7;">
                We received your payment and your Blueprint slot is reserved — but we haven't received your intake form answers yet.
              </p>
              <p style="margin:0 0 16px; color:#555; font-size:15px; line-height:1.7;">
                <strong style="color:#c2185b;">Without your intake answers, we cannot prepare your Blueprint.</strong> Our stylists need your photos and profile information to personalise:
              </p>
              <ul style="margin:0 0 20px; padding-left:20px; color:#555; font-size:14px; line-height:2;">
                <li>Your body geometry analysis</li>
                <li>Your chromatic harmony map (your exact 10 colours)</li>
                <li>Your facial architecture profile</li>
                <li>Your 6 personalised outfit formulas</li>
              </ul>
              <p style="margin:0 0 16px; color:#555; font-size:15px; line-height:1.7;">
                It only takes <strong>4 minutes</strong>. Complete it now and your Blueprint will be ready within 24 hours.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${intake_link}"
                       style="display:inline-block; background:#c2185b; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:18px 40px; border-radius:50px; letter-spacing:0.3px;">
                      Complete My Intake Now →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0; color:#999; font-size:12px; text-align:center;">Takes 4 minutes · Blueprint delivered within 24 hours of completion</p>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin:0 0 8px; color:#333; font-size:15px; line-height:1.7;">
                If you've already submitted your form, please ignore this email — we may have sent this before it processed.
              </p>
              <p style="margin:0; color:#333; font-size:15px; line-height:1.7;">
                Questions? Reply to this email.<br />
                <strong>The ICONIK Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 40px; text-align:center; border-top:1px solid #f0e8e8;">
              <p style="margin:0 0 4px; color:#c2185b; font-weight:700; font-size:15px;">ICONIK Style Intelligence</p>
              <p style="margin:0; color:#999; font-size:13px;">help.iconikfashion@gmail.com</p>
              <p style="margin:16px 0 0; color:#bbb; font-size:12px;">© 2026 ICONIK. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ── Globe Order Confirmation Email ────────────────────────────────────────

export async function sendGlobeOrderConfirmationEmail(
  data: AUOrderConfirmationEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const firstName = data.customer_name.split(' ')[0] || 'there';
    const intakeLink = `https://www.iconik.pro/globe/intake?email=${encodeURIComponent(data.customer_email)}&phone=${encodeURIComponent(data.customer_phone)}`;
    const deliveryHours = data.delivery_hours ?? 24;

    const subject = `✅ Your ICONIK Blueprint is confirmed — complete your intake to unlock it`;
    const text = `Hi ${firstName},\n\nThank you for purchasing your ICONIK Blueprint (AED ${data.order_amount}).\n\nYour Blueprint cannot be prepared until you complete your 4-minute intake form:\n${intakeLink}\n\nOnce submitted, your Blueprint arrives within ${deliveryHours} hours.\n\nBest regards,\nThe ICONIK Team\nhelp.iconikfashion@gmail.com`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Your ICONIK Blueprint is Confirmed</title></head>
<body style="margin:0;padding:0;background-color:#fdf8f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#c2185b 0%,#880e4f 100%);padding:40px 40px 32px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">ICONIK</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:3px;text-transform:uppercase;">Style Intelligence System · Worldwide</p>
</td></tr>
<tr><td style="padding:32px 40px 0;text-align:center;"><div style="display:inline-block;background:#f0fdf4;border:2px solid #22c55e;border-radius:50px;padding:10px 24px;"><span style="color:#16a34a;font-size:15px;font-weight:600;">✓ Order Confirmed · Blueprint in Production</span></div></td></tr>
<tr><td style="padding:28px 40px 0;">
<p style="margin:0 0 12px;color:#333;font-size:16px;line-height:1.7;">Hi ${firstName},</p>
<p style="margin:0 0 12px;color:#333;font-size:16px;line-height:1.7;">Thank you for purchasing your <strong>ICONIK Blueprint</strong>. Your payment is confirmed and your Blueprint is now in the queue.</p>
<p style="margin:0;color:#555;font-size:15px;line-height:1.7;"><strong style="color:#c2185b;">One thing stands between you and your Blueprint:</strong> completing the intake questions. They take 4 minutes and give our stylists the information they need to personalise every section of your report.</p>
</td></tr>
<tr><td style="padding:20px 40px 0;">
<div style="background:#fdf8f5;border-radius:12px;padding:20px 24px;border:1px solid #f0e8e8;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;border-bottom:1px solid #f0e8e8;color:#555;font-size:14px;"><strong style="color:#333;">Product:</strong> ICONIK Blueprint — Worldwide</td></tr>
${data.has_edit_addon ? `<tr><td style="padding:6px 0;border-bottom:1px solid #f0e8e8;color:#555;font-size:14px;"><strong style="color:#333;">Add-on:</strong> The ICONIK Edit (10 outfit formulas)</td></tr>` : ''}
<tr><td style="padding:6px 0;border-bottom:1px solid #f0e8e8;color:#555;font-size:14px;"><strong style="color:#333;">Email:</strong> ${data.customer_email}</td></tr>
<tr><td style="padding:10px 0 0;color:#16a34a;font-size:16px;font-weight:700;">Total Paid: AED ${data.order_amount}</td></tr>
</table>
${data.payment_id ? `<p style="margin:10px 0 0;color:#bbb;font-size:11px;">Payment Ref: ${data.payment_id}</p>` : ''}
</div></td></tr>
<tr><td style="padding:28px 40px 0;">
<p style="margin:0 0 16px;color:#333;font-size:16px;line-height:1.7;">Complete your intake form now and your Blueprint will be ready within ${deliveryHours} hours:</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="${intakeLink}" style="display:inline-block;background:#c2185b;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 36px;border-radius:50px;letter-spacing:0.3px;">Complete My Intake Form →</a>
</td></tr></table>
<p style="margin:12px 0 0;color:#999;font-size:12px;text-align:center;">Takes 4 minutes · Blueprint delivered within ${deliveryHours} hours of completion</p>
</td></tr>
<tr><td style="padding:24px 40px 0;">
<p style="margin:0 0 8px;color:#333;font-size:15px;line-height:1.7;">If you have any questions, reply to this email — we're here.</p>
<p style="margin:0;color:#333;font-size:15px;line-height:1.7;">Best regards,<br/><strong>The ICONIK Team</strong></p>
</td></tr>
<tr><td style="padding:32px 40px 40px;text-align:center;border-top:1px solid #f0e8e8;">
<p style="margin:0 0 4px;color:#c2185b;font-weight:700;font-size:15px;">ICONIK Style Intelligence</p>
<p style="margin:0;color:#999;font-size:13px;">help.iconikfashion@gmail.com</p>
<p style="margin:16px 0 0;color:#bbb;font-size:12px;">© 2026 ICONIK. All rights reserved.</p>
</td></tr>
</table></td></tr></table>
</body></html>`.trim();

    const info = await transporter.sendMail({
      from: `"ICONIK Style Intelligence" <${process.env.GMAIL_USER}>`,
      to: data.customer_email,
      subject,
      text,
      html,
    });

    console.log(`Globe order confirmation sent to ${data.customer_email}. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending Globe order confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendAUQuizReminderEmail(
  data: AUQuizReminderEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const firstName = data.customer_name.split(' ')[0] || 'there';

    const info = await transporter.sendMail({
      from: `"ICONIK Style Intelligence" <${process.env.GMAIL_USER}>`,
      to: data.customer_email,
      subject: `⏳ Your Blueprint is waiting — we need your intake answers to begin`,
      text: `Hi ${firstName},\n\nWe received your payment but haven't received your intake form answers yet.\n\nWithout them, we cannot prepare your personal Blueprint. It takes 4 minutes:\n${data.intake_link}\n\nOnce submitted, your Blueprint arrives within 24 hours.\n\nIf you've already submitted, please ignore this email.\n\nBest,\nThe ICONIK Team`,
      html: buildAUQuizReminderHtml(data),
    });

    console.log(`AU quiz reminder sent to ${data.customer_email}. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending AU quiz reminder email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ── Globe Quiz Reminder Email ─────────────────────────────────────────────────

function buildGlobeQuizReminderHtml(data: GlobeQuizReminderEmailData): string {
  const { customer_name, intake_link } = data;
  const firstName = customer_name.split(' ')[0] || 'there';
  const deliveryHours = data.delivery_hours ?? 24;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Complete Your Intake to Unlock Your Blueprint</title>
</head>
<body style="margin:0; padding:0; background-color:#fdf8f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #c2185b 0%, #880e4f 100%); padding: 40px 40px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:2px;">ICONIK</h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.8); font-size:12px; letter-spacing:3px; text-transform:uppercase;">Style Intelligence System · Worldwide</p>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 32px 40px 0; text-align:center;">
              <div style="display:inline-block; background:#fffbeb; border:2px solid #f59e0b; border-radius:50px; padding:10px 24px;">
                <span style="color:#b45309; font-size:15px; font-weight:600;">⏳ Intake Not Yet Received</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin:0 0 12px; color:#333; font-size:16px; line-height:1.7;">Hi ${firstName},</p>
              <p style="margin:0 0 16px; color:#333; font-size:16px; line-height:1.7;">
                We received your payment and your Blueprint slot is reserved — but we haven't received your intake form answers yet.
              </p>
              <p style="margin:0 0 16px; color:#555; font-size:15px; line-height:1.7;">
                <strong style="color:#c2185b;">Without your intake answers, we cannot prepare your Blueprint.</strong> Our stylists need your photos and profile information to personalise:
              </p>
              <ul style="margin:0 0 20px; padding-left:20px; color:#555; font-size:14px; line-height:2;">
                <li>Your body geometry analysis</li>
                <li>Your chromatic harmony map (your exact 10 colours)</li>
                <li>Your facial architecture profile</li>
                <li>Your 6 personalised outfit formulas</li>
              </ul>
              <p style="margin:0 0 16px; color:#555; font-size:15px; line-height:1.7;">
                It only takes <strong>4 minutes</strong>. Complete it now and your Blueprint will be ready within ${deliveryHours} hours.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0;">
                <tr>
                  <td align="center">
                    <a href="${intake_link}"
                       style="display:inline-block; background:#c2185b; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:18px 40px; border-radius:50px; letter-spacing:0.3px;">
                      Complete My Intake Now →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0; color:#999; font-size:12px; text-align:center;">Takes 4 minutes · Blueprint delivered within ${deliveryHours} hours of completion</p>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin:0 0 8px; color:#333; font-size:15px; line-height:1.7;">
                If you've already submitted your form, please ignore this email — we may have sent this before it processed.
              </p>
              <p style="margin:0; color:#333; font-size:15px; line-height:1.7;">
                Questions? Reply to this email.<br />
                <strong>The ICONIK Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 40px; text-align:center; border-top:1px solid #f0e8e8;">
              <p style="margin:0 0 4px; color:#c2185b; font-weight:700; font-size:15px;">ICONIK Style Intelligence</p>
              <p style="margin:0; color:#999; font-size:13px;">help.iconikfashion@gmail.com</p>
              <p style="margin:16px 0 0; color:#bbb; font-size:12px;">© 2026 ICONIK. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendGlobeQuizReminderEmail(
  data: GlobeQuizReminderEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const firstName = data.customer_name.split(' ')[0] || 'there';
    const deliveryHours = data.delivery_hours ?? 24;

    const info = await transporter.sendMail({
      from: `"ICONIK Style Intelligence" <${process.env.GMAIL_USER}>`,
      to: data.customer_email,
      subject: `⏳ Your Blueprint is waiting — we need your intake answers to begin`,
      text: `Hi ${firstName},\n\nWe received your payment but haven't received your intake form answers yet.\n\nWithout them, we cannot prepare your personal Blueprint. It takes 4 minutes:\n${data.intake_link}\n\nOnce submitted, your Blueprint arrives within ${deliveryHours} hours.\n\nIf you've already submitted, please ignore this email.\n\nBest,\nThe ICONIK Team`,
      html: buildGlobeQuizReminderHtml(data),
    });

    console.log(`Globe quiz reminder sent to ${data.customer_email}. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending Globe quiz reminder email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ── Intake received client confirmation emails ───────────────────────────────

function buildIntakeReceivedHtml({
  title,
  subtitle,
  body,
  accent,
}: {
  title: string;
  subtitle: string;
  body: string;
  accent: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#fdf8f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:${accent};padding:36px 40px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">ICONIK</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.82);font-size:12px;letter-spacing:3px;text-transform:uppercase;">${subtitle}</p>
</td></tr>
<tr><td style="padding:32px 40px 0;text-align:center;">
<div style="display:inline-block;background:#f0fdf4;border:2px solid #22c55e;border-radius:50px;padding:10px 24px;">
<span style="color:#16a34a;font-size:15px;font-weight:600;">Submission Received</span>
</div>
</td></tr>
<tr><td style="padding:28px 40px 0;">
<p style="margin:0 0 12px;color:#333;font-size:16px;line-height:1.7;">Hi there,</p>
<p style="margin:0 0 16px;color:#333;font-size:16px;line-height:1.7;">${body}</p>
<p style="margin:0 0 16px;color:#333;font-size:16px;line-height:1.7;">Your report will be delivered to your inbox within <strong>72 hours</strong>.</p>
<p style="margin:0;color:#555;font-size:14px;line-height:1.7;">Please check your spam or promotions folder just in case. If you have any questions, reply to this email and our team will help.</p>
</td></tr>
<tr><td style="padding:28px 40px 40px;text-align:center;border-top:1px solid #f0e8e8;">
<p style="margin:0 0 4px;color:#333;font-weight:700;font-size:14px;">The ICONIK Team</p>
<p style="margin:0;color:#999;font-size:13px;">help.iconikfashion@gmail.com</p>
</td></tr>
</table></td></tr></table>
</body></html>`.trim();
}

export async function sendManIntakeReceivedEmail(
  data: IntakeReceivedEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const html = buildIntakeReceivedHtml({
      title: 'Your ICONIK Man Intake Was Received',
      subtitle: 'Man Style Blueprint',
      body: 'We have received your ICONIK Man intake form. Our stylists now have the photos and answers they need to prepare your personalised Blueprint.',
      accent: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
    });

    const info = await transporter.sendMail({
      from: `"Team Iconik" <${process.env.GMAIL_USER}>`,
      to: data.customer_email,
      subject: `Your ICONIK Man intake was received`,
      text: `Hi there,\n\nWe have received your ICONIK Man intake form. Our stylists now have the photos and answers they need to prepare your personalised Blueprint.\n\nYour report will be delivered to your inbox within 72 hours.\n\nPlease check your spam or promotions folder just in case. If you have any questions, reply to this email and our team will help.\n\nBest regards,\nThe ICONIK Team\nhelp.iconikfashion@gmail.com`,
      html,
    });

    console.log(`Man intake received email sent to ${data.customer_email}. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending Man intake received email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendGlobeIntakeReceivedEmail(
  data: IntakeReceivedEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const html = buildIntakeReceivedHtml({
      title: 'Your ICONIK Intake Was Received',
      subtitle: 'Style Intelligence System · Worldwide',
      body: 'We have received your ICONIK intake form. Our stylists now have the photos and answers they need to prepare your personalised Blueprint.',
      accent: 'linear-gradient(135deg,#c2185b 0%,#880e4f 100%)',
    });

    const info = await transporter.sendMail({
      from: `"ICONIK Style Intelligence" <${process.env.GMAIL_USER}>`,
      to: data.customer_email,
      subject: `Your ICONIK intake was received`,
      text: `Hi there,\n\nWe have received your ICONIK intake form. Our stylists now have the photos and answers they need to prepare your personalised Blueprint.\n\nYour report will be delivered to your inbox within 72 hours.\n\nPlease check your spam or promotions folder just in case. If you have any questions, reply to this email and our team will help.\n\nBest regards,\nThe ICONIK Team\nhelp.iconikfashion@gmail.com`,
      html,
    });

    console.log(`Globe intake received email sent to ${data.customer_email}. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending Globe intake received email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ── Globe Intake Internal Notification Email ─────────────────────────────────

export async function sendGlobeIntakeNotificationEmail(
  data: GlobeIntakeNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();

    const row = (label: string, value: string | undefined) =>
      value ? `<tr><td style="padding:6px 12px;font-size:13px;color:#555;border-bottom:1px solid #f0e8e8;"><strong style="color:#333;">${label}:</strong></td><td style="padding:6px 12px;font-size:13px;color:#333;border-bottom:1px solid #f0e8e8;">${value}</td></tr>` : '';

    const photoLink = (label: string, url: string | undefined) =>
      url ? `<tr><td style="padding:6px 12px;font-size:13px;color:#555;border-bottom:1px solid #f0e8e8;"><strong style="color:#333;">${label}:</strong></td><td style="padding:6px 12px;font-size:13px;border-bottom:1px solid #f0e8e8;"><a href="${url}" style="color:#c2185b;text-decoration:none;">View Photo →</a></td></tr>` : '';

    const sectionHeader = (title: string) =>
      `<tr><td colspan="2" style="padding:10px 12px 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c2185b;background:#fdf8f5;">${title}</td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>New Globe Intake Submission</title></head>
<body style="margin:0;padding:0;background:#fdf8f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f5;padding:32px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background:linear-gradient(135deg,#c2185b 0%,#880e4f 100%);padding:28px 40px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:2px;">ICONIK</h1>
  <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:3px;text-transform:uppercase;">New Globe Intake Submission</p>
</td></tr>

<tr><td style="padding:28px 40px 8px;">
  <p style="margin:0 0 4px;font-size:15px;color:#333;">A client has completed their Globe intake form.</p>
  <p style="margin:0;font-size:13px;color:#888;">Submitted at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })} IST</p>
</td></tr>

<tr><td style="padding:16px 40px 28px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e8e8;border-radius:10px;overflow:hidden;">
    ${sectionHeader('Client')}
    ${row('Email', data.customer_email)}
    ${row('Phone', data.customer_phone)}
    ${photoLink('Full Body Photo', data.photo_fullbody_url)}
    ${photoLink('Headshot', data.photo_headshot_url)}
    ${sectionHeader('Section 1 — Basics')}
    ${row('Primary goal', data.primary_goal)}
    ${row('Style relationship', data.style_relationship)}
    ${row('Dressing context', data.dressing_context?.replace(/,/g, ', '))}
    ${row('Location', data.location_tier)}
    ${sectionHeader('Section 2 — Body')}
    ${row('Height', data.height_category)}
    ${row('Body shape', data.body_shape)}
    ${row('Fat storage zone', data.fat_storage_zone)}
    ${row('Highlight zone', data.highlight_zone)}
    ${row('Minimise zone', data.minimise_zone)}
    ${row('Fit preference', data.fit_preference)}
    ${row('Modesty level', data.modesty_level)}
    ${row('Wardrobe composition', data.wardrobe_composition?.replace(/,/g, ', '))}
    ${sectionHeader('Section 3 — Colour')}
    ${row('Skin tone', data.skin_tone)}
    ${row('Vein undertone', data.vein_undertone)}
    ${row('White test', data.white_test)}
    ${row('Hair colour', data.hair_colour)}
    ${row('Eye colour', data.eye_colour)}
    ${row('Derived colour season', data.derived_colour_season)}
    ${sectionHeader('Section 4 — Face')}
    ${row('Face shape', data.face_shape)}
    ${row('Facial features', data.facial_feature_type)}
    ${sectionHeader('Section 5 — Style')}
    ${row('Style goal', data.style_goal)}
    ${row('Primary style goal', data.primary_style_goal)}
    ${row('Branch sub-goal', data.branch_sub_goal)}
    ${row('Branch blocker', data.branch_blocker)}
    ${row('Branch reference', data.branch_reference)}
    ${row('Pole — Structure', data.style_pole_structure)}
    ${row('Pole — Expression', data.style_pole_expression)}
    ${row('Pole — Tone', data.style_pole_tone)}
    ${row('Pole — Register', data.style_pole_register)}
    ${row('Style blocker', data.style_blocker)}
    ${row('Anti-pref', data.style_anti_pref)}
    ${row('Anti-pref note', data.style_anti_pref_note)}
    ${row('Visual style reference', data.visual_style_reference)}
    ${row('Client note', data.free_text_note)}
  </table>
</td></tr>

<tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #f0e8e8;">
  <p style="margin:0;color:#c2185b;font-weight:700;font-size:14px;">ICONIK Style Intelligence — Internal</p>
  <p style="margin:4px 0 0;color:#999;font-size:12px;">help.iconikfashion@gmail.com</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

    const text =
      `New Globe intake submission\n` +
      `Email: ${data.customer_email}\n` +
      `Phone: ${data.customer_phone}\n` +
      (data.photo_fullbody_url ? `Full body photo: ${data.photo_fullbody_url}\n` : '') +
      (data.photo_headshot_url ? `Headshot: ${data.photo_headshot_url}\n` : '') +
      `\n--- Section 1: Basics ---\n` +
      (data.primary_goal ? `Primary goal: ${data.primary_goal}\n` : '') +
      (data.style_relationship ? `Style relationship: ${data.style_relationship}\n` : '') +
      (data.dressing_context ? `Dressing context: ${data.dressing_context}\n` : '') +
      (data.location_tier ? `Location: ${data.location_tier}\n` : '') +
      `\n--- Section 2: Body ---\n` +
      (data.height_category ? `Height: ${data.height_category}\n` : '') +
      (data.body_shape ? `Body shape: ${data.body_shape}\n` : '') +
      (data.fat_storage_zone ? `Fat storage zone: ${data.fat_storage_zone}\n` : '') +
      (data.highlight_zone ? `Highlight zone: ${data.highlight_zone}\n` : '') +
      (data.minimise_zone ? `Minimise zone: ${data.minimise_zone}\n` : '') +
      (data.fit_preference ? `Fit preference: ${data.fit_preference}\n` : '') +
      (data.modesty_level ? `Modesty level: ${data.modesty_level}\n` : '') +
      (data.wardrobe_composition ? `Wardrobe composition: ${data.wardrobe_composition}\n` : '') +
      `\n--- Section 3: Colour ---\n` +
      (data.skin_tone ? `Skin tone: ${data.skin_tone}\n` : '') +
      (data.vein_undertone ? `Vein undertone: ${data.vein_undertone}\n` : '') +
      (data.white_test ? `White test: ${data.white_test}\n` : '') +
      (data.hair_colour ? `Hair colour: ${data.hair_colour}\n` : '') +
      (data.eye_colour ? `Eye colour: ${data.eye_colour}\n` : '') +
      (data.derived_colour_season ? `Derived colour season: ${data.derived_colour_season}\n` : '') +
      `\n--- Section 4: Face ---\n` +
      (data.face_shape ? `Face shape: ${data.face_shape}\n` : '') +
      (data.facial_feature_type ? `Facial features: ${data.facial_feature_type}\n` : '') +
      `\n--- Section 5: Style ---\n` +
      (data.style_goal ? `Style goal: ${data.style_goal}\n` : '') +
      (data.primary_style_goal ? `Primary style goal: ${data.primary_style_goal}\n` : '') +
      (data.branch_sub_goal ? `Branch sub-goal: ${data.branch_sub_goal}\n` : '') +
      (data.branch_blocker ? `Branch blocker: ${data.branch_blocker}\n` : '') +
      (data.branch_reference ? `Branch reference: ${data.branch_reference}\n` : '') +
      (data.style_pole_structure ? `Pole (Structure): ${data.style_pole_structure}\n` : '') +
      (data.style_pole_expression ? `Pole (Expression): ${data.style_pole_expression}\n` : '') +
      (data.style_pole_tone ? `Pole (Tone): ${data.style_pole_tone}\n` : '') +
      (data.style_pole_register ? `Pole (Register): ${data.style_pole_register}\n` : '') +
      (data.style_blocker ? `Style blocker: ${data.style_blocker}\n` : '') +
      (data.style_anti_pref ? `Anti-pref: ${data.style_anti_pref}\n` : '') +
      (data.style_anti_pref_note ? `Anti-pref note: ${data.style_anti_pref_note}\n` : '') +
      (data.visual_style_reference ? `Visual style reference: ${data.visual_style_reference}\n` : '') +
      (data.free_text_note ? `Client note: ${data.free_text_note}\n` : '');

    const info = await transporter.sendMail({
      from: `"ICONIK Intake Bot" <${process.env.GMAIL_USER}>`,
      to: 'help.iconikfashion@gmail.com',
      subject: `📋 New Globe Intake — ${data.customer_email}`,
      text,
      html,
    });

    console.log(`Globe intake notification sent. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending Globe intake notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Man Intake — Internal notification email
// ─────────────────────────────────────────────────────────────────────────────

export interface ManIntakeNotificationData {
  customer_email: string;
  customer_phone: string;
  photo_fullbody_url?: string;
  photo_headshot_url?: string;
  // Section 1 — Basics
  primary_goal?: string;
  style_relationship?: string;
  dressing_context?: string;
  location_tier?: string;
  // Section 2 — Body
  height_category?: string;
  body_shape?: string;
  fat_storage_zone?: string;
  highlight_zone?: string;
  minimise_zone?: string;
  fit_preference?: string;
  wardrobe_composition?: string;
  // Section 3 — Colour
  skin_tone?: string;
  vein_undertone?: string;
  white_test?: string;
  hair_colour?: string;
  eye_colour?: string;
  derived_colour_season?: string;
  // Section 4 — Face
  face_shape?: string;
  facial_feature_type?: string;
  // Section 5 — Style Identity
  primary_style_goal?: string;
  branch_answer?: string;
  style_tribes?: string;
  style_pole_structure?: string;
  style_pole_expression?: string;
  style_pole_tone?: string;
  style_pole_register?: string;
  style_blocker?: string;
  style_anti_pref?: string;
  style_anti_pref_note?: string;
  free_text_note?: string;
}

export async function sendManIntakeNotificationEmail(
  data: ManIntakeNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();

    const row = (label: string, value: string | undefined) =>
      value ? `<tr><td style="padding:6px 12px;font-size:13px;color:#555;border-bottom:1px solid #f0e8e8;"><strong style="color:#333;">${label}:</strong></td><td style="padding:6px 12px;font-size:13px;color:#333;border-bottom:1px solid #f0e8e8;">${value}</td></tr>` : '';

    const photoLink = (label: string, url: string | undefined) =>
      url ? `<tr><td style="padding:6px 12px;font-size:13px;color:#555;border-bottom:1px solid #f0e8e8;"><strong style="color:#333;">${label}:</strong></td><td style="padding:6px 12px;font-size:13px;border-bottom:1px solid #f0e8e8;"><a href="${url}" style="color:#1b5e20;text-decoration:none;">View Photo →</a></td></tr>` : '';

    const section = (title: string) =>
      `<tr><td colspan="2" style="padding:10px 12px 4px;background:#f7f3f0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#2e7d32;border-bottom:1px solid #f0e8e8;">${title}</td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>New Man Intake Submission</title></head>
<body style="margin:0;padding:0;background:#fdf8f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f5;padding:32px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background:linear-gradient(135deg,#2e7d32 0%,#1b5e20 100%);padding:28px 40px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:2px;">ICONIK MEN</h1>
  <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:3px;text-transform:uppercase;">New Man Intake Submission</p>
</td></tr>

<tr><td style="padding:28px 40px 8px;">
  <p style="margin:0 0 4px;font-size:15px;color:#333;">A client has completed their Man intake form.</p>
  <p style="margin:0;font-size:13px;color:#888;">Submitted at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })} IST</p>
</td></tr>

<tr><td style="padding:16px 40px 28px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e8e8;border-radius:10px;overflow:hidden;">
    ${section('Contact')}
    ${row('Email', data.customer_email)}
    ${row('Phone', data.customer_phone)}
    ${photoLink('Full Body Photo', data.photo_fullbody_url)}
    ${photoLink('Headshot', data.photo_headshot_url)}

    ${section('Section 1 — Basics')}
    ${row('Primary goal', data.primary_goal?.replace(/_/g, ' '))}
    ${row('Style relationship', data.style_relationship?.replace(/_/g, ' '))}
    ${row('Dressing context', data.dressing_context?.replace(/,/g, ', ').replace(/_/g, ' '))}
    ${row('Location', data.location_tier?.replace(/_/g, ' '))}

    ${section('Section 2 — Body')}
    ${row('Height category', data.height_category?.replace(/_/g, ' '))}
    ${row('Body shape', data.body_shape?.replace(/_/g, ' '))}
    ${row('Fat storage zone', data.fat_storage_zone?.replace(/_/g, ' '))}
    ${row('Highlight zone', data.highlight_zone?.replace(/_/g, ' '))}
    ${row('Minimise zone', data.minimise_zone?.replace(/_/g, ' '))}
    ${row('Fit preference', data.fit_preference?.replace(/_/g, ' '))}
    ${row('Wardrobe composition', data.wardrobe_composition?.replace(/,/g, ', ').replace(/_/g, ' '))}

    ${section('Section 3 — Colour')}
    ${row('Skin tone', data.skin_tone?.replace(/_/g, ' '))}
    ${row('Vein undertone', data.vein_undertone?.replace(/_/g, ' '))}
    ${row('White test', data.white_test?.replace(/_/g, ' '))}
    ${row('Hair colour', data.hair_colour?.replace(/_/g, ' '))}
    ${row('Eye colour', data.eye_colour?.replace(/_/g, ' '))}
    ${row('Derived colour season', data.derived_colour_season?.replace(/_/g, ' '))}

    ${section('Section 4 — Face')}
    ${row('Face shape', data.face_shape?.replace(/_/g, ' '))}
    ${row('Facial feature type', data.facial_feature_type?.replace(/_/g, ' '))}

    ${section('Section 5 — Style Identity')}
    ${row('Primary style goal', data.primary_style_goal?.replace(/_/g, ' '))}
    ${row('Branch answer', data.branch_answer?.replace(/_/g, ' '))}
    ${row('Style tribes', data.style_tribes?.replace(/,/g, ', ').replace(/_/g, ' '))}
    ${row('Pole — Structure', data.style_pole_structure?.replace(/_/g, ' '))}
    ${row('Pole — Expression', data.style_pole_expression?.replace(/_/g, ' '))}
    ${row('Pole — Tone', data.style_pole_tone?.replace(/_/g, ' '))}
    ${row('Pole — Register', data.style_pole_register?.replace(/_/g, ' '))}
    ${row('Style blocker', data.style_blocker?.replace(/_/g, ' '))}
    ${row('Anti-pref', data.style_anti_pref?.replace(/_/g, ' '))}
    ${row('Anti-pref note', data.style_anti_pref_note)}
    ${row('Free text note', data.free_text_note)}
  </table>
</td></tr>

<tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #f0e8e8;">
  <p style="margin:0;color:#2e7d32;font-weight:700;font-size:14px;">ICONIK Style Intelligence — Internal</p>
  <p style="margin:4px 0 0;color:#999;font-size:12px;">help.iconikfashion@gmail.com</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

    const text =
      `New Man intake submission\n` +
      `Email: ${data.customer_email}\n` +
      `Phone: ${data.customer_phone}\n` +
      (data.photo_fullbody_url ? `Full body: ${data.photo_fullbody_url}\n` : '') +
      (data.photo_headshot_url ? `Headshot: ${data.photo_headshot_url}\n` : '') +
      `\n— Section 1: Basics —\n` +
      (data.primary_goal ? `Primary goal: ${data.primary_goal}\n` : '') +
      (data.style_relationship ? `Style relationship: ${data.style_relationship}\n` : '') +
      (data.dressing_context ? `Dressing context: ${data.dressing_context}\n` : '') +
      (data.location_tier ? `Location: ${data.location_tier}\n` : '') +
      `\n— Section 2: Body —\n` +
      (data.height_category ? `Height: ${data.height_category}\n` : '') +
      (data.body_shape ? `Body shape: ${data.body_shape}\n` : '') +
      (data.fat_storage_zone ? `Fat storage zone: ${data.fat_storage_zone}\n` : '') +
      (data.highlight_zone ? `Highlight zone: ${data.highlight_zone}\n` : '') +
      (data.minimise_zone ? `Minimise zone: ${data.minimise_zone}\n` : '') +
      (data.fit_preference ? `Fit preference: ${data.fit_preference}\n` : '') +
      (data.wardrobe_composition ? `Wardrobe composition: ${data.wardrobe_composition}\n` : '') +
      `\n— Section 3: Colour —\n` +
      (data.skin_tone ? `Skin tone: ${data.skin_tone}\n` : '') +
      (data.vein_undertone ? `Vein undertone: ${data.vein_undertone}\n` : '') +
      (data.white_test ? `White test: ${data.white_test}\n` : '') +
      (data.hair_colour ? `Hair colour: ${data.hair_colour}\n` : '') +
      (data.eye_colour ? `Eye colour: ${data.eye_colour}\n` : '') +
      (data.derived_colour_season ? `Colour season: ${data.derived_colour_season}\n` : '') +
      `\n— Section 4: Face —\n` +
      (data.face_shape ? `Face shape: ${data.face_shape}\n` : '') +
      (data.facial_feature_type ? `Facial features: ${data.facial_feature_type}\n` : '') +
      `\n— Section 5: Style Identity —\n` +
      (data.primary_style_goal ? `Primary style goal: ${data.primary_style_goal}\n` : '') +
      (data.branch_answer ? `Branch answer: ${data.branch_answer}\n` : '') +
      (data.style_tribes ? `Style tribes: ${data.style_tribes}\n` : '') +
      (data.style_pole_structure ? `Pole (Structure): ${data.style_pole_structure}\n` : '') +
      (data.style_pole_expression ? `Pole (Expression): ${data.style_pole_expression}\n` : '') +
      (data.style_pole_tone ? `Pole (Tone): ${data.style_pole_tone}\n` : '') +
      (data.style_pole_register ? `Pole (Register): ${data.style_pole_register}\n` : '') +
      (data.style_blocker ? `Style blocker: ${data.style_blocker}\n` : '') +
      (data.style_anti_pref ? `Anti-pref: ${data.style_anti_pref}\n` : '') +
      (data.style_anti_pref_note ? `Anti-pref note: ${data.style_anti_pref_note}\n` : '') +
      (data.free_text_note ? `Free text note: ${data.free_text_note}\n` : '');

    const info = await transporter.sendMail({
      from: `"ICONIK Intake Bot" <${process.env.GMAIL_USER}>`,
      to: 'help.iconikfashion@gmail.com',
      subject: `📋 New Man Intake — ${data.customer_email}`,
      text,
      html,
    });

    console.log(`Man intake notification sent. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending Man intake notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Iconik Club — Welcome email with temp credentials
// ─────────────────────────────────────────────────────────────────────────────
export async function sendIconikClubWelcomeEmail(
  name: string,
  email: string,
  tempPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iconik.pro';
    const loginUrl = `${siteUrl}/iconik-club/client/login`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Iconik Club</title>
</head>
<body style="margin:0; padding:0; background-color:#fff9f5; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff9f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ff6b9d 0%,#c9457a 100%); padding:40px 40px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:-0.5px;">ICONIK CLUB</h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px; letter-spacing:2px; text-transform:uppercase;">Your Personal Style Edit</p>
            </td>
          </tr>

          <!-- Welcome Badge -->
          <tr>
            <td style="padding:32px 40px 0; text-align:center;">
              <div style="display:inline-block; background:#fdf0f6; border:2px solid #ff6b9d; border-radius:50px; padding:10px 24px;">
                <span style="color:#c9457a; font-size:15px; font-weight:600;">✨ Welcome to the club</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0 0 12px; color:#333; font-size:16px; line-height:1.7;">Hi ${name},</p>
              <p style="margin:0 0 12px; color:#333; font-size:16px; line-height:1.7;">
                Your <strong>Iconik Club</strong> subscription is now active. We're excited to start curating outfits personalised to your body, colouring, and style.
              </p>
              <p style="margin:0 0 0; color:#333; font-size:16px; line-height:1.7;">
                Your client portal is ready — here are your login credentials:
              </p>
            </td>
          </tr>

          <!-- Credentials Box -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="background:#fff9f5; border-radius:12px; padding:24px 28px; border:2px solid #ffb3d1;">
                <p style="margin:0 0 6px; color:#888; font-size:12px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase;">Your Login Details</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #fde8f2; color:#555; font-size:14px;">
                      <strong style="color:#333;">Email:</strong>&nbsp; ${email}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; color:#555; font-size:14px;">
                      <strong style="color:#333;">Temporary Password:</strong>&nbsp;
                      <span style="font-family:monospace; font-size:16px; font-weight:700; color:#c9457a; letter-spacing:0.05em;">${tempPassword}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin:14px 0 0; color:#999; font-size:12px;">
                  ⚠️ Please change your password after your first login.
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 0; text-align:center;">
              <a href="${loginUrl}"
                 style="display:inline-block; background:#ff6b9d; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:16px 40px; border-radius:50px; letter-spacing:0.3px;">
                Sign In to Your Portal →
              </a>
            </td>
          </tr>

          <!-- What happens next -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0 0 16px; color:#333; font-size:16px; font-weight:700;">What happens next:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #fde8f2; color:#555; font-size:14px; vertical-align:top;">
                    <strong style="color:#333;">1. Complete your style profile</strong><br/>
                    <span style="color:#777;">Log in and fill in your measurements and style preferences so we can curate precisely for you.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #fde8f2; color:#555; font-size:14px; vertical-align:top;">
                    <strong style="color:#333;">2. We'll be in touch</strong><br/>
                    <span style="color:#777;">Our team will reach out on WhatsApp to schedule your onboarding and collect any additional details.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0; color:#555; font-size:14px; vertical-align:top;">
                    <strong style="color:#333;">3. Your first outfit set</strong><br/>
                    <span style="color:#777;">Once your profile is complete, your personalised outfits will appear in your portal.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px 32px; text-align:center; border-top:1px solid #fde8f2; margin-top:28px;">
              <p style="margin:0; color:#c9457a; font-weight:700; font-size:14px;">ICONIK Club</p>
              <p style="margin:4px 0 0; color:#999; font-size:12px;">Questions? Reply to this email or WhatsApp us.</p>
              <p style="margin:4px 0 0; color:#bbb; font-size:11px;">support@iconik.pro</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text =
      `Welcome to Iconik Club, ${name}!\n\n` +
      `Your subscription is active. Here are your login credentials:\n\n` +
      `Email: ${email}\n` +
      `Temporary Password: ${tempPassword}\n\n` +
      `Sign in at: ${loginUrl}\n\n` +
      `Please change your password after first login.\n\n` +
      `What's next:\n` +
      `1. Complete your style profile in the portal\n` +
      `2. Our team will reach out on WhatsApp for onboarding\n` +
      `3. Your personalised outfits will appear in your portal once your profile is set up\n\n` +
      `Questions? Reply to this email or WhatsApp us.\n` +
      `support@iconik.pro`;

    const info = await transporter.sendMail({
      from: `"Iconik Club" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Welcome to Iconik Club — Your Login Details`,
      text,
      html,
    });

    console.log(`Iconik Club welcome email sent to ${email}. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending Iconik Club welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Iconik Club — Outfits ready email (sent by admin after generation)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOutfitsReadyEmail(
  name: string,
  email: string,
  outfitsUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const firstName = name.split(' ')[0];

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your outfits are ready</title>
</head>
<body style="margin:0; padding:0; background-color:#fdf9f6; font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf9f6; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background:#ffffff; border:1px solid #f0e6e0;">

          <!-- Header -->
          <tr>
            <td style="background:#2a1a24; padding:32px 40px; text-align:center;">
              <p style="margin:0; font-size:11px; letter-spacing:0.3em; color:#c9a882; text-transform:uppercase;">Iconik Club</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px; font-size:11px; letter-spacing:0.2em; color:#c9a882; text-transform:uppercase;">Your style edit is ready</p>
              <h1 style="margin:0 0 24px; font-size:32px; font-weight:400; color:#2a1a24; line-height:1.2;">
                Hi ${firstName},<br /><em>your outfits are here.</em>
              </h1>
              <p style="margin:0 0 28px; font-size:15px; color:#4a2c3e; line-height:1.7;">
                Your stylist has curated a personalised outfit set built around your body, colouring, and lifestyle — every piece is shoppable with direct links.
              </p>

              <!-- CTA -->
              <div style="text-align:center; margin:0 0 32px;">
                <a href="${outfitsUrl}"
                   style="display:inline-block; background:#2a1a24; color:#ffffff; text-decoration:none;
                          padding:16px 36px; font-size:12px; letter-spacing:0.15em; text-transform:uppercase;">
                  View Your Outfits →
                </a>
              </div>

              <p style="margin:0; font-size:13px; color:#9a7a8a; line-height:1.6;">
                Questions? Reply to this email or WhatsApp us.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #f0e6e0; padding:20px 40px; text-align:center;">
              <p style="margin:0; font-size:11px; color:#9a7a8a; letter-spacing:0.1em;">Iconik Club · playernumberone.in</p>
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
      `Your Iconik Club outfit set is ready!\n\n` +
      `View your outfits here: ${outfitsUrl}\n\n` +
      `Questions? Reply to this email or WhatsApp us.\n` +
      `support@iconik.pro`;

    const info = await transporter.sendMail({
      from: `"Iconik Club" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `${firstName}, your outfits are ready`,
      text,
      html,
    });

    console.log(`Iconik Club outfits-ready email sent to ${email}. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending outfits-ready email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
