# Iconik Closet Subscription Implementation Guide

## Overview
New subscription offering at `/iconik-closet` targeting Indian audience with monthly outfit delivery service.

---

## What Was Implemented

### 1. **Landing Page**
**Location:** [/iconik-closet/page.tsx](src/app/iconik-closet/page.tsx)

**Features:**
- Hero section with value proposition: "Never Waste Time Shopping Again"
- Stats: 268+ subscribers, 12+ hours saved monthly, 4.9 rating, ₹8.4K saved yearly
- Features grid showcasing 6 complete outfit sets, shopping links, etc.
- Testimonial carousel (reusing existing transformation images)
- Pricing section with Monthly (₹1,699) and Quarterly (₹4,599) plans
- Before/After transformations
- FAQ section
- Exit intent popup for WhatsApp support
- Sticky mobile CTA
- Full responsive design matching existing brand style

**Key CTAs:**
- All buttons link to `/iconik-closet/checkout`

---

### 2. **Checkout Page**
**Location:** [/iconik-closet/checkout/page.tsx](src/app/iconik-closet/checkout/page.tsx)

**Features:**
- **Plan selection UI** (before form entry)
  - Monthly Plan: ₹1,699/month (save ₹500)
  - Quarterly Plan: ₹4,599 for 3 months (save ₹2,000) - marked "BEST VALUE"
- Email and phone input form
- Real-time validation
- Trust badges (268+ subscribers, 100% secure, 4.9/5 rating)
- Testimonial carousel (75% size)
- What You Get section listing all benefits
- Order summary with countdown timer
- **NO add-ons** (subscription only)
- Razorpay subscription integration
- Meta Pixel tracking

**Pricing Display:**
- Monthly: ₹1,699 (strikethrough ₹2,199)
- Quarterly: ₹4,599 (strikethrough ₹6,599)

**Payment Flow:**
1. User selects plan (monthly/quarterly)
2. Enters email & phone
3. Clicks "Start My Subscription"
4. Razorpay subscription checkout opens
5. On success → redirects to `/iconik-closet/success`

---

### 3. **Success Page**
**Location:** [/iconik-closet/success/page.tsx](src/app/iconik-closet/success/page.tsx)

**Content:**
- 🎉 Success message
- Subscription confirmation card showing plan & amount
- **What Happens Next** (3 steps):
  - **Step 1:** Check email for time slot booking link
  - **Step 2:** Receive style blueprint in 3-5 days via WhatsApp
  - **Step 3:** Get 6 outfit sets monthly on the 1st
- Contact support info
- Back to Home button
- Meta Pixel tracking (CompleteRegistration event)

---

### 4. **Backend API Updates**

#### Subscription API
**Location:** [/api/subscription/route.ts](src/app/api/subscription/route.ts)

**Changes:**
- Added new plan IDs:
  - `iconik-monthly`: `plan_S99gOCaBnHybc7` (₹1,699/month)
  - `quarterly`: `plan_S99mi4mzryqODa` (₹4,599 for 3 months)
- Updated validation to accept `'quarterly'` plan type
- Smart plan ID selection logic:
  - If no `customer_id`/`order_id` → uses new Iconik Closet plans
  - If has `customer_id`/`order_id` → uses original consultation upsell plans
- Correct amount calculation:
  - Monthly (Iconik Closet): ₹1,699 = 169900 paise
  - Quarterly: ₹4,599 = 459900 paise
  - Yearly (consultation upsell): ₹7,188 = 718800 paise
  - Monthly (consultation upsell): ₹699 = 69900 paise

---

### 5. **Database Schema**

#### New Subscriptions Table
**Location:** [supabase/migrations/add_subscriptions_table.sql](supabase/migrations/add_subscriptions_table.sql)

**Schema:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_name VARCHAR(255),

  plan_type VARCHAR(50) CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  plan_id VARCHAR(100) NOT NULL,
  razorpay_subscription_id VARCHAR(100) UNIQUE,

  amount INTEGER NOT NULL, -- in paise
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'active',

  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  notes TEXT,
  original_order_id VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `customer_email` (for lookups)
- `razorpay_subscription_id` (for webhook processing)
- `status` (for filtering active subscriptions)
- `customer_id` (for customer queries)

**Auto-update trigger:** Updates `updated_at` on every row modification

---

#### Supabase Library Updates
**Location:** [src/lib/supabase.ts](src/lib/supabase.ts)

**New TypeScript Interface:**
```typescript
export interface Subscription {
  id?: string;
  customer_id?: string;
  customer_email: string;
  customer_phone?: string;
  customer_name?: string;
  plan_type: 'monthly' | 'quarterly' | 'yearly';
  plan_id: string;
  razorpay_subscription_id?: string;
  amount: number;
  currency?: string;
  status?: 'active' | 'paused' | 'cancelled' | 'expired' | 'pending';
  // ... date fields
}
```

**New Functions:**
- `saveSubscription(subscription)` - Insert/update subscription
- `getSubscriptionByEmail(email)` - Get all subscriptions for a customer
- `getActiveSubscriptionByEmail(email)` - Get active subscription only

---

## Setup Instructions

### 1. Run Database Migration

**Option A: Using Supabase CLI**
```bash
# Navigate to project root
cd playernumberone-app

# Run migration
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/add_subscriptions_table.sql`
4. Run the SQL script

### 2. Verify Razorpay Plan IDs

Ensure these plan IDs exist in your Razorpay dashboard:
- Monthly: `plan_S99gOCaBnHybc7` (₹1,699/month)
- Quarterly: `plan_S99mi4mzryqODa` (₹4,599 billed every 3 months)

If not, create them in Razorpay:
1. Go to Razorpay Dashboard → Subscriptions → Plans
2. Create "Iconik Closet Monthly" plan
   - Amount: ₹1,699
   - Billing frequency: Every 1 month
   - Copy the plan ID
3. Create "Iconik Closet Quarterly" plan
   - Amount: ₹4,599
   - Billing frequency: Every 3 months
   - Copy the plan ID
4. Update the plan IDs in `/api/subscription/route.ts` if they differ

### 3. Environment Variables

Ensure these are set (should already exist):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## Testing Checklist

### Landing Page (`/iconik-closet`)
- [ ] Page loads correctly
- [ ] All sections render (Hero, Stats, Features, Pricing, Testimonials, FAQ)
- [ ] Transformation carousel works (arrows + dots)
- [ ] Both pricing cards display correctly
- [ ] "Start Subscription" buttons link to `/iconik-closet/checkout`
- [ ] Mobile responsive design works
- [ ] Sticky mobile CTA shows at bottom
- [ ] Exit intent popup triggers on scroll/mouse leave
- [ ] WhatsApp link works
- [ ] Footer links work

### Checkout Page (`/iconik-closet/checkout`)
- [ ] Page loads correctly
- [ ] Plan selection UI displays both plans
- [ ] Plan selection toggles work (visual feedback)
- [ ] Monthly plan shows ₹1,699 (strikethrough ₹2,199)
- [ ] Quarterly plan shows ₹4,599 (strikethrough ₹6,599) with "BEST VALUE" badge
- [ ] Email validation works
- [ ] Phone validation (10 digits only)
- [ ] Form submission triggers Razorpay
- [ ] Razorpay loads with correct plan amount
- [ ] Meta Pixel events fire:
  - ViewContent on page load
  - InitiateCheckout on button click

### Payment Flow (Test Mode)
- [ ] Use Razorpay test mode credentials
- [ ] Complete test payment for monthly plan
- [ ] Complete test payment for quarterly plan
- [ ] Verify redirect to `/iconik-closet/success` with query params
- [ ] Check Meta Pixel Purchase event fires

### Success Page (`/iconik-closet/success`)
- [ ] Page loads with subscription details
- [ ] Correct plan name displays
- [ ] Correct amount displays
- [ ] All 3 steps display correctly
- [ ] "Back to Home" button works
- [ ] Meta Pixel CompleteRegistration event fires

### Database Verification
- [ ] Check Supabase `subscriptions` table exists
- [ ] After test payment, verify subscription record created
- [ ] Verify all fields populated correctly:
  - customer_email
  - customer_phone
  - plan_type (monthly/quarterly)
  - plan_id (correct Razorpay plan ID)
  - razorpay_subscription_id
  - amount (in paise)
  - status (should be 'active')

---

## Test Payment Details

**Razorpay Test Cards:**
- **Success:** 4111 1111 1111 1111
- **Failure:** 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

**Test Flow:**
1. Visit `/iconik-closet`
2. Click "Start Subscription"
3. Select Monthly or Quarterly plan
4. Enter test email: `test@example.com`
5. Enter test phone: `9999999999`
6. Click "Start My Subscription"
7. Use test card above
8. Complete payment
9. Verify redirect to success page
10. Check Supabase for new subscription record

---

## Key Differences from Original Consultation

| Feature | Original Consultation | Iconik Closet Subscription |
|---------|---------------------|---------------------------|
| **URL** | `/` and `/checkout` | `/iconik-closet` and `/iconik-closet/checkout` |
| **Product** | One-time consultation (₹1,699) | Monthly subscription (₹1,699/mo or ₹4,599/quarterly) |
| **Pricing** | ₹1,699 (from ₹5,999) | Monthly: ₹1,699 (from ₹2,199)<br>Quarterly: ₹4,599 (from ₹6,599) |
| **Add-ons** | 3 add-ons (Diet, Shopper's Guide, Outfit Preview) | None |
| **Payment Type** | One-time order | Recurring subscription |
| **API** | `/api/payment` | `/api/subscription` |
| **Razorpay** | Orders API | Subscriptions API |
| **Success Page** | `/checkout/success` with upsell | `/iconik-closet/success` simple confirmation |
| **Database** | `orders` table | `subscriptions` table |

---

## Meta Pixel Tracking

All pages track events with `content_ids: ['iconik_closet_subscription']`:

1. **Landing Page:**
   - `PageView` on load
   - `ViewContent` on load
   - `CTAClick` on button clicks

2. **Checkout Page:**
   - `ViewContent` on load
   - `UpdateUserData` when email & phone entered
   - `InitiateCheckout` on payment button click

3. **Success Page:**
   - `Purchase` after successful payment (in checkout handler)
   - `CompleteRegistration` on success page load

---

## File Structure

```
src/app/
├── iconik-closet/
│   ├── page.tsx              # Landing page
│   ├── checkout/
│   │   └── page.tsx          # Checkout with plan selection
│   └── success/
│       └── page.tsx          # Success confirmation
└── api/
    └── subscription/
        └── route.ts          # Updated with new plan IDs

src/lib/
└── supabase.ts               # Updated with Subscription types & functions

supabase/migrations/
└── add_subscriptions_table.sql   # Database migration
```

---

## Deployment Notes

### Pre-deployment Checklist:
1. ✅ Run database migration in production Supabase
2. ✅ Verify Razorpay plan IDs in production dashboard
3. ✅ Test payment flow in production (with test mode first)
4. ✅ Verify Meta Pixel tracking in Facebook Events Manager
5. ✅ Test all pages on mobile devices
6. ✅ Check email notifications work (Razorpay sends confirmation)

### Post-deployment:
1. Monitor Supabase `subscriptions` table for new entries
2. Check Razorpay dashboard for successful subscriptions
3. Verify Meta Pixel events in Facebook Ads Manager
4. Test customer journey end-to-end

---

## Troubleshooting

### Payment fails with "Invalid plan_id"
- Check plan IDs in `/api/subscription/route.ts` match Razorpay dashboard
- Verify plans are active in Razorpay

### Subscription not saving to database
- Check Supabase credentials in `.env`
- Verify `subscriptions` table exists
- Check browser console for errors

### Redirect to success page fails
- Verify success page route exists at `/iconik-closet/success`
- Check Razorpay handler callback URL

### Meta Pixel not tracking
- Check pixel ID in `lib/metaPixel.ts`
- Verify pixel is initialized in layout
- Check browser console for pixel errors
- Use Meta Pixel Helper Chrome extension

---

## Support

For questions or issues:
- Email: support@playernumberone.com
- Check Razorpay logs for payment issues
- Check Supabase logs for database issues
- Check Vercel logs for deployment issues

---

## Summary

✅ **Landing Page:** [/iconik-closet](http://localhost:3000/iconik-closet)
✅ **Checkout:** [/iconik-closet/checkout](http://localhost:3000/iconik-closet/checkout)
✅ **Success:** [/iconik-closet/success](http://localhost:3000/iconik-closet/success)
✅ **API:** Updated subscription API with new plan IDs
✅ **Database:** New subscriptions table with full schema
✅ **Tracking:** Meta Pixel events throughout funnel

**Ready for testing!** 🚀
