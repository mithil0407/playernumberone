import nodemailer from 'nodemailer';

export interface ConfirmationEmailData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_amount: number;
  add_ons?: string;
  payment_id?: string;
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
