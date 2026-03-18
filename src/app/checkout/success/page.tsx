'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackCompleteRegistration, trackPageView, trackViewContent, trackInitiateCheckout } from '@/lib/metaPixel';

const ICONIK_CLUB_PLANS = [
  {
    id:          'monthly'   as const,
    label:       'Monthly',
    price:       '₹899',
    period:      '/month',
    subtext:     'Cancel anytime',
    badge:       null,
    highlighted: false,
  },
  {
    id:          'quarterly' as const,
    label:       'Quarterly',
    price:       '₹2,399',
    period:      '/quarter',
    subtext:     'Save ₹298',
    badge:       'POPULAR',
    highlighted: true,
  },
  {
    id:          'yearly'    as const,
    label:       'Annual',
    price:       '₹8,399',
    period:      '/year',
    subtext:     'Save ₹2,389',
    badge:       'BEST VALUE',
    highlighted: false,
  },
];

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [upsellTracked, setUpsellTracked] = useState(false);

  useEffect(() => {
    // Track page view
    trackPageView();

    // Extract customer ID and order ID from URL parameters
    const urlCustomerId = searchParams.get('customer_id');
    const urlOrderId = searchParams.get('order_id');
    const dbOrderId = searchParams.get('db_order_id');
    const paymentId = searchParams.get('payment_id');

    // Track successful registration/purchase completion
    const purchaseAmount = localStorage.getItem('purchaseAmount');
    const purchaseCurrency = localStorage.getItem('purchaseCurrency') || 'INR';

    if (purchaseAmount) {
      trackCompleteRegistration(
        parseFloat(purchaseAmount),
        'ICONIK Style Consultation Purchase',
        purchaseCurrency
      );
    }

    // Store in localStorage for the schedule page to access
    if (urlCustomerId) {
      localStorage.setItem('customerId', urlCustomerId);
    }

    if (dbOrderId) {
      localStorage.setItem('orderId', dbOrderId);
      setOrderId(dbOrderId);
    } else if (urlOrderId) {
      localStorage.setItem('orderId', urlOrderId);
      setOrderId(urlOrderId);
    }

    if (paymentId) {
      localStorage.setItem('paymentId', paymentId);
    }

    // Try to get customer details from localStorage (stored during checkout)
    const storedEmail = localStorage.getItem('customerEmail') || '';
    const storedPhone = localStorage.getItem('customerPhone') || '';
    const storedName  = localStorage.getItem('customerName')  || '';
    setCustomerEmail(storedEmail);
    setCustomerPhone(storedPhone);
    setCustomerName(storedName);

    // Track Iconik Club upsell view once
    if (!upsellTracked) {
      trackViewContent(
        'Iconik Club Upsell',
        8399,
        ['iconik_club_subscription'],
        'INR',
        'Upsell'
      );
      setUpsellTracked(true);
    }
  }, [searchParams, upsellTracked]);

  const handleSubscription = useCallback(async () => {
    setIsProcessing(true);

    const planLabels = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Annual' };
    const planAmounts = { monthly: 899, quarterly: 2399, yearly: 8399 };

    trackInitiateCheckout(
      planAmounts[selectedPlan],
      1,
      `Iconik Club ${planLabels[selectedPlan]}`,
      'INR',
      'Upsell'
    );

    try {
      const email = customerEmail || localStorage.getItem('customerEmail') || '';
      const phone = customerPhone || localStorage.getItem('customerPhone') || '';
      const name  = customerName  || localStorage.getItem('customerName')  || email.split('@')[0];

      const response = await fetch('/api/subscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type:         selectedPlan,
          customer_email:    email,
          customer_phone:    phone,
          customer_name:     name,
          original_order_id: orderId,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.short_url) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      window.location.href = data.short_url;

    } catch (error) {
      console.error('Subscription error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start subscription. Please try again.');
      setIsProcessing(false);
    }
  }, [customerEmail, customerPhone, customerName, orderId, selectedPlan]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      {/* Payment Success Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center pt-8 pb-6 px-4"
      >
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-luxury-accent" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
          Payment Successful! 🎉
        </h1>
        <p className="text-gray-600">
          Your style consultation is booked. But wait...
        </p>
      </motion.div>

      {/* What's Next Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-2xl mx-auto px-4 py-8"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 mb-8 border border-white/30 text-center">
          <CheckCircle className="w-12 h-12 text-luxury-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3 text-gray-900">You&apos;re all set! 🎉</h2>
          <p className="text-gray-700 mb-2">
            We&apos;ve sent a confirmation email with all your order details and next steps.
          </p>
          <p className="text-gray-500 text-sm">
            Can&apos;t find it? Please check your <span className="font-semibold text-gray-700">spam or junk folder</span> — it may have landed there.
          </p>
        </div>

        <Link
          href="/"
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-12 py-4 rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto w-fit"
        >
          Back to Home <ArrowRight className="w-6 h-6" />
        </Link>

        <div className="mt-8 text-sm text-gray-500 text-center">
          <p>Check your email/WhatsApp for your order confirmation and booking link.</p>
          <p>Questions? Contact us at support@playernumberone.com</p>
        </div>
      </motion.div>

      {/* ==================== ICONIK CLUB UPSELL ==================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="py-10 md:py-14 px-4"
        style={{ background: 'linear-gradient(180deg, #fff9f5 0%, #fde8f2 100%)', borderTop: '2px solid #ffb3d1' }}
      >
        <div className="max-w-2xl mx-auto">

          {/* Brand tag */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-4 h-4" style={{ color: '#ff6b9d' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#ff6b9d' }}>
              Exclusive offer — consultation clients only
            </span>
          </div>

          {/* Headline */}
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#4a2c3e' }}>
              Take your blueprint further with <span style={{ color: '#ff6b9d' }}>Iconik Club</span>
            </h2>
            <p className="text-base" style={{ color: '#6b4057' }}>
              Your consultation gives you the formula. Iconik Club gives you the outfits — curated by AI, personalised to your body and style, delivered every month to your private portal.
            </p>
          </div>

          {/* Feature list */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: '#ffffff', border: '1px solid #ffb3d1' }}>
            <div className="space-y-2">
              {[
                'AI-generated outfit sets every month — shoppable, ready to wear',
                'Personalised to your body shape, colouring, and style blueprint',
                'Links to exact pieces from premium brands',
                'Your own private client portal',
                'Custom look requests anytime',
                'Priority WhatsApp support',
              ].map(f => (
                <div key={f} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ff6b9d' }} />
                  <span className="text-sm" style={{ color: '#4a2c3e' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan selector */}
          <h3 className="text-base font-bold mb-3" style={{ color: '#4a2c3e' }}>Choose your plan:</h3>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {ICONIK_CLUB_PLANS.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className="relative rounded-xl p-3 text-left transition-all duration-200 focus:outline-none"
                style={{
                  border:     selectedPlan === plan.id ? '2px solid #ff6b9d' : '2px solid #ffb3d1',
                  background: selectedPlan === plan.id ? '#fdf0f6' : '#ffffff',
                }}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#ff6b9d' }}>
                    {plan.badge}
                  </span>
                )}
                <p className="font-bold text-xs mb-1" style={{ color: '#4a2c3e' }}>{plan.label}</p>
                <p className="font-bold text-base" style={{ color: '#ff6b9d' }}>
                  {plan.price}
                  <span className="text-xs font-normal" style={{ color: '#9b7090' }}>{plan.period}</span>
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#9b7090' }}>{plan.subtext}</p>
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleSubscription}
            disabled={isProcessing}
            className="w-full py-4 rounded-full text-white font-bold text-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c9457a)', boxShadow: '0 8px 24px rgba(255,107,157,0.3)' }}
          >
            {isProcessing ? 'Redirecting to payment…' : (
              <>Join Iconik Club <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
          <p className="text-xs text-center mb-6" style={{ color: '#9b7090' }}>
            You&apos;ll be taken to Razorpay to set up autopay securely.
          </p>

          {/* Guarantee */}
          <div className="rounded-2xl p-4 mb-6 flex items-start gap-3"
               style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
            <Shield className="w-6 h-6 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              <strong>30-day guarantee.</strong> If you don&apos;t love your first outfit set — reply to any email and we&apos;ll refund your first month. No questions.
            </p>
          </div>

          {/* FAQ */}
          <div className="space-y-3 mb-6">
            <details className="rounded-xl p-4 group" style={{ background: '#ffffff', border: '1px solid #ffb3d1' }}>
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between text-sm"
                       style={{ color: '#4a2c3e' }}>
                &quot;I&apos;ll sign up later.&quot;
                <span className="group-open:rotate-45 transition-transform" style={{ color: '#9b7090' }}>+</span>
              </summary>
              <p className="mt-3 text-sm" style={{ color: '#6b4057' }}>
                This offer is exclusive to this page. The price goes up once you leave. It takes 60 seconds to set up autopay — your outfits start arriving after your style profile is complete.
              </p>
            </details>
            <details className="rounded-xl p-4 group" style={{ background: '#ffffff', border: '1px solid #ffb3d1' }}>
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between text-sm"
                       style={{ color: '#4a2c3e' }}>
                &quot;How is this different from my consultation?&quot;
                <span className="group-open:rotate-45 transition-transform" style={{ color: '#9b7090' }}>+</span>
              </summary>
              <p className="mt-3 text-sm" style={{ color: '#6b4057' }}>
                Your consultation gives you the style blueprint — your colours, silhouettes, formulas. Iconik Club executes that blueprint every month with ready-to-buy outfit sets. No more scrolling, no more guessing.
              </p>
            </details>
            <details className="rounded-xl p-4 group" style={{ background: '#ffffff', border: '1px solid #ffb3d1' }}>
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between text-sm"
                       style={{ color: '#4a2c3e' }}>
                &quot;What if I don&apos;t shop every month?&quot;
                <span className="group-open:rotate-45 transition-transform" style={{ color: '#9b7090' }}>+</span>
              </summary>
              <p className="mt-3 text-sm" style={{ color: '#6b4057' }}>
                Your portal keeps all your outfit sets. Think of it as a curated lookbook you dip into whenever you need — for a wedding, a promotion, a date night. It&apos;s already done.
              </p>
            </details>
          </div>

          {/* Skip */}
          <div className="text-center">
            <Link href="/" className="text-sm underline transition-colors" style={{ color: '#9b7090' }}>
              No thanks, I&apos;ll pass for now
            </Link>
          </div>

        </div>
      </motion.section>
      {/* ==================== END ICONIK CLUB UPSELL ==================== */}


    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
