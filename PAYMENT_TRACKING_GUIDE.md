# Payment & Subscription Tracking - Complete Guide

## 🎯 Overview

Your payment system now properly tracks **both one-time payments and recurring subscriptions** with full lifecycle management via Razorpay webhooks.

---

## 📊 Database Storage

### 1. **Consultation Purchases** (One-time payments)

**Tables Used:** `customers`, `orders`

**Flow:**
- User purchases consultation at `/checkout`
- Payment creates order in `orders` table
- Webhook updates order status to `completed`
- Customer data synced to Google Sheets & CRM

**What's Stored:**
```sql
orders table:
- customer_id (links to customers)
- razorpay_order_id, razorpay_payment_id
- amount (in rupees, integer)
- add_ons (comma-separated: "Wardrobe Detox, Smart Shopper's Guide")
- product_type: "consultation"
- status: "pending" → "completed" → "paid"
- payment_method, created_at
```

---

### 2. **Style Club Subscriptions** (Direct purchase)

**Tables Used:** `customers`, `subscriptions`

**Flow:**
- User subscribes at `/style-club/subscribe`
- Creates Razorpay subscription
- **NEW:** Saves to `subscriptions` table
- Webhook updates status to `active` when first payment succeeds

**What's Stored:**
```sql
subscriptions table:
- customer_id (links to customers)
- customer_email, customer_phone, customer_name
- plan_type: "monthly" | "styleclub-annual"
- plan_id: Razorpay plan ID
- razorpay_subscription_id: unique subscription ID
- amount: 169900 (₹1,699) or 1729900 (₹17,299) in paise
- status: "pending" → "active" | "cancelled" | "paused" | "expired"
- start_date, end_date, next_billing_date, cancelled_at
- notes: "Direct subscription purchase"
- created_at, updated_at
```

---

### 3. **Iconik Closet Subscriptions** (Upsell after consultation)

**Tables Used:** `customers`, `orders`, `subscriptions`

**Flow:**
- User buys consultation → stored in `orders`
- Success page offers Iconik Closet upsell
- Subscription created and **linked to original order**
- Webhook manages lifecycle

**What's Stored:**
```sql
subscriptions table:
- customer_id (SAME as consultation order)
- plan_type: "monthly" | "yearly"
- amount: 69900 (₹699/mo) or 718800 (₹7,188/yr) in paise
- original_order_id: LINKS to consultation order
- notes: "Upsell from customer {customer_id}"
- status: managed by webhooks
```

**Key Feature:** You can trace the entire customer journey:
```
consultation order → upsell subscription
      (orders)            (subscriptions)
                ↓
         original_order_id
```

---

## 🔔 Webhook Events Handled

### Payment Events (Existing)
✅ `payment.captured` - Mark order as completed  
✅ `payment.failed` - Mark order as failed  
✅ `order.paid` - Alternative payment success event  
✅ `payment.authorized` - Test mode payments  

### Subscription Events (NEW)
✅ `subscription.activated` - Set status to `active`, record start date  
✅ `subscription.charged` - Update billing date, ensure `active` status  
✅ `subscription.cancelled` - Set status to `cancelled`, record end date  
✅ `subscription.paused` - Set status to `paused`  
✅ `subscription.resumed` - Set status back to `active`  
✅ `subscription.completed` - Set status to `expired` when subscription ends  

---

## 🔧 What Was Fixed

### Before:
❌ Subscriptions created in Razorpay but NOT saved locally  
❌ No tracking of subscription status changes  
❌ No link between upsell subscriptions and original orders  
❌ No way to query active subscribers  

### After:
✅ All subscriptions saved to database  
✅ Automatic status updates via webhooks  
✅ Full customer journey tracking (order → subscription)  
✅ Can query by status, plan type, customer email  
✅ Billing dates tracked automatically  

---

## 🚀 Setup Required in Razorpay Dashboard

### Step 1: Configure Webhook URL
Go to: **Razorpay Dashboard → Settings → Webhooks**

**Webhook URL:** `https://yourdomain.com/api/payment/webhook`

### Step 2: Select Events

**Payment Events (for consultations):**
- ✅ payment.captured
- ✅ payment.failed
- ✅ order.paid
- ✅ payment.authorized (for testing)

**Subscription Events (for Style Club & Iconik Closet):**
- ✅ subscription.activated
- ✅ subscription.charged
- ✅ subscription.cancelled
- ✅ subscription.paused
- ✅ subscription.resumed
- ✅ subscription.completed

### Step 3: Set Webhook Secret
Copy the webhook secret and add to your `.env`:
```bash
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 4: Test
1. Make a test subscription purchase
2. Check Vercel logs for webhook events
3. Query database to confirm status updates

---

## 📈 Useful Database Queries

### Get all active subscriptions:
```sql
SELECT * FROM subscriptions 
WHERE status = 'active' 
ORDER BY created_at DESC;
```

### Find subscriptions that came from upsells:
```sql
SELECT 
  s.*,
  o.amount as consultation_amount,
  o.add_ons as consultation_addons
FROM subscriptions s
LEFT JOIN orders o ON s.original_order_id = o.id
WHERE s.original_order_id IS NOT NULL;
```

### Count subscribers by plan:
```sql
SELECT 
  plan_type,
  status,
  COUNT(*) as count
FROM subscriptions
GROUP BY plan_type, status;
```

### Find customers due for renewal in next 7 days:
```sql
SELECT * FROM subscriptions
WHERE status = 'active'
AND next_billing_date <= NOW() + INTERVAL '7 days'
ORDER BY next_billing_date;
```

---

## 🎉 Summary

You now have **complete payment and subscription tracking**:

1. ✅ **All payments** stored in `orders` table
2. ✅ **All subscriptions** stored in `subscriptions` table  
3. ✅ **Automatic status updates** via webhooks
4. ✅ **Customer journey tracking** for upsells
5. ✅ **Synced to Google Sheets & CRM** for consultation purchases
6. ✅ **Ready for analytics** with full historical data

Your payment infrastructure is now production-ready! 🚀
