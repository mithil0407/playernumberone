# ICONIK Women WhatsApp confirmations

The application is ready to send a WhatsApp Utility template after a paid
`Iconik Style Consultation` order. That product is shared by the main ICONIK
Women checkout and `/offer-2699`, so both funnels are covered by the same
Razorpay `order.paid` webhook.

Email remains the primary confirmation. WhatsApp is sent only when the customer
checks the WhatsApp consent box at checkout, and a WhatsApp failure never blocks
email, CRM sync, or payment acknowledgement.

## 1. Create or connect the Meta assets

1. Open Meta Business Settings and use the ICONIK business portfolio.
2. Create a Business-type app in Meta for Developers, then add the **WhatsApp**
   product.
3. In WhatsApp API Setup, create or connect the ICONIK WhatsApp Business Account
   (WABA).
4. Add and verify the phone number that will send customer confirmations.
   Prefer a dedicated business number. Do not migrate a number currently used in
   the WhatsApp or WhatsApp Business mobile app until WhatsApp Manager explicitly
   confirms that coexistence is supported for that number and region.
5. Complete the business display name and business verification steps shown by
   Meta. The test number can be used while those steps are pending.

Meta's maintained Cloud API collection documents the phone-number ID, access
tokens, permissions, and `/messages` request used by this integration:
[WhatsApp Cloud API — Meta](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api).

## 2. Create the Utility template

In WhatsApp Manager → Message templates, create this template. Keep the wording
transactional; adding promotions can cause Meta to classify it as Marketing.

- **Name:** `iconik_women_consultation_confirmation_v1`
- **Category:** Utility
- **Language:** English, code `en`
- **Header:** `Order confirmed ✅`
- **Body:**

  ```text
  Your payment for the ICONIK Style Consultation is confirmed.

  Amount paid: {{1}}
  Payment ID: {{2}}

  Tap the button below to choose your 30-minute consultation slot. Reply here if you need help with your booking.
  ```

- **Call-to-action button:** `Schedule consultation`
- **Button URL:** `https://cal.com/iconone-wpnx1q/30min-copy`
- **Sample value for `{{1}}`:** `₹2,699`
- **Sample value for `{{2}}`:** `pay_example123`

Wait until the template status is **Active/Approved**. If Meta assigns a
different language code or the name changes, use those exact values in the
environment variables below.

## 3. Create the production access token

The temporary token on the API Setup screen expires and is only suitable for a
smoke test. For production:

1. Business Settings → Users → System users → Add an admin system user.
2. Assign the WhatsApp Business Account and the Meta app to that system user.
3. Generate a token for the app with:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Store the token only as a Vercel environment variable. Never prefix it with
   `NEXT_PUBLIC_`, put it in source control, or paste it into client code.

## 4. Configure the application

Add these variables to Production, Preview, and the local `.env.local` as
appropriate. Use the Graph API version displayed in the Meta app dashboard; the
application intentionally does not guess a version.

```env
WHATSAPP_ACCESS_TOKEN=replace_with_system_user_token
WHATSAPP_PHONE_NUMBER_ID=replace_with_phone_number_id
WHATSAPP_GRAPH_API_VERSION=v26.0
WHATSAPP_WOMEN_CONFIRMATION_TEMPLATE=iconik_women_consultation_confirmation_v1
WHATSAPP_TEMPLATE_LANGUAGE=en
WHATSAPP_APP_SECRET=replace_with_meta_app_secret
WHATSAPP_WEBHOOK_VERIFY_TOKEN=replace_with_a_long_random_secret
```

Generate the verify token locally, for example:

```bash
openssl rand -hex 32
```

## 5. Apply the database migration

Apply:

```text
supabase/migrations/add_order_whatsapp_confirmations.sql
```

It adds customer consent and send-deduplication fields to `orders`, plus the
`whatsapp_message_deliveries` table for accepted, sent, delivered, read, and
failed statuses. The delivery table has RLS enabled and no public policies.

## 6. Configure the Meta webhook

After deploying the code and environment variables:

1. Meta app → WhatsApp → Configuration → Webhooks.
2. Callback URL: `https://www.iconik.pro/api/whatsapp/webhook`
3. Verify token: the exact value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
4. Subscribe the WABA to the **messages** webhook field. Delivery receipts arrive
   inside this field.

The endpoint validates Meta's GET challenge and verifies every POST using the
`X-Hub-Signature-256` HMAC signature and `WHATSAPP_APP_SECRET` before touching
the database.

## 7. Test before enabling live traffic

1. Use Meta's test phone number and add one recipient in the API Setup screen.
2. Set the test phone-number ID/token in a Preview deployment.
3. Complete a Razorpay test purchase through both `/checkout` and
   `/offer-2699/checkout`, checking the WhatsApp box.
4. Confirm:
   - the email arrives;
   - the WhatsApp template arrives once;
   - `orders.whatsapp_confirmation_sent` is `true`;
   - `orders.whatsapp_message_id` contains a `wamid...` value;
   - `whatsapp_message_deliveries.status` progresses from `accepted` to
     `sent`/`delivered`/`read`.
5. Repeat without checking the consent box. Email must arrive and WhatsApp must
   be skipped.
6. Replay the same Razorpay `order.paid` webhook. A second WhatsApp confirmation
   must not be sent.

The health endpoint `GET /api/whatsapp/webhook` reports only whether each secret
is configured; it never returns secret values.

## Troubleshooting

- **Template not found / language mismatch:** copy the exact template name and
  locale shown in WhatsApp Manager into Vercel.
- **Token expires:** replace the temporary user token with the system-user token.
- **Message accepted but not delivered:** inspect
  `whatsapp_message_deliveries.error_code`, `error_message`, and `raw_status`.
- **Webhook verification fails:** confirm the callback is deployed over HTTPS and
  both verify-token values match exactly.
- **No message for an old order:** only orders placed after the migration can
  record checkout consent; do not backfill opt-in without evidence of consent.
