'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Calendar, Users, Clock, Shield, Sparkles, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackCompleteRegistration, trackPageView, trackViewContent, trackInitiateCheckout, trackPurchase } from '@/lib/metaPixel';

// Razorpay types for subscription
interface RazorpaySubscriptionResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpaySubscriptionOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: RazorpaySubscriptionResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayInstance {
  open(): void;
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [orderId, setOrderId] = useState('');
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
      setCustomerId(urlCustomerId);
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

    // Try to get customer email/phone from localStorage (stored during checkout)
    const storedEmail = localStorage.getItem('customerEmail') || '';
    const storedPhone = localStorage.getItem('customerPhone') || '';
    setCustomerEmail(storedEmail);
    setCustomerPhone(storedPhone);

    // Track upsell view once
    if (!upsellTracked) {
      trackViewContent(
        'Iconik Closet Upsell',
        7188,
        ['iconik_closet_subscription'],
        'INR',
        'Upsell'
      );
      setUpsellTracked(true);
    }
  }, [searchParams, upsellTracked]);

  // Preload Razorpay script
  useEffect(() => {
    if (document.querySelector('script[src*="razorpay.com"]')) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.error('Failed to preload Razorpay');
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleSubscription = useCallback(async (planType: 'monthly' | 'yearly') => {
    setIsProcessing(true);

    const amount = planType === 'yearly' ? 7188 : 699;
    const description = planType === 'yearly'
      ? 'Iconik Closet - Yearly (₹599/mo)'
      : 'Iconik Closet - Monthly (₹699/mo)';

    // Track InitiateCheckout
    trackInitiateCheckout(
      amount,
      1,
      `Iconik Closet ${planType === 'yearly' ? 'Yearly' : 'Monthly'}`,
      'INR',
      'Upsell'
    );

    try {
      // Get email from input or localStorage
      const email = customerEmail || localStorage.getItem('customerEmail') || '';
      const phone = customerPhone || localStorage.getItem('customerPhone') || '';

      // Create subscription via API
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type: planType,
          customer_email: email,
          customer_phone: phone,
          customer_name: email.split('@')[0],
          customer_id: customerId,
          order_id: orderId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Initialize Razorpay subscription checkout
      const options: RazorpaySubscriptionOptions = {
        key: data.key,
        subscription_id: data.subscription_id,
        name: 'Iconik Closet',
        description: description,
        image: `${window.location.origin}/logopayment.webp`,
        handler: function (response: RazorpaySubscriptionResponse) {
          // Track purchase
          trackPurchase(
            amount,
            `Iconik Closet ${planType === 'yearly' ? 'Yearly' : 'Monthly'}`,
            ['iconik_closet_subscription'],
            1,
            'INR',
            'Subscription',
            response.razorpay_payment_id
          );

          // Store subscription data
          localStorage.setItem('closetSubscriptionId', response.razorpay_subscription_id);
          localStorage.setItem('closetPlanType', planType);
          localStorage.setItem('closetAmount', amount.toString());

          // Redirect to closet success page
          window.location.href = `/closet/success?subscription_id=${response.razorpay_subscription_id}&plan_type=${planType}&amount=${amount}`;
        },
        prefill: {
          name: email.split('@')[0],
          email: email,
          contact: phone
        },
        theme: {
          color: '#E91E63'
        }
      };

      if (razorpayLoaded && window.Razorpay) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window.Razorpay as any)(options);
        rzp.open();
      } else {
        throw new Error('Payment system not loaded');
      }

    } catch (error) {
      console.error('Subscription error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [customerEmail, customerPhone, customerId, orderId, razorpayLoaded]);

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

      {/* ==================== UPSELL SECTION ==================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-b from-amber-50 to-orange-50 border-y-2 border-amber-200 py-8 md:py-12 px-4"
      >
        <div className="max-w-3xl mx-auto">
          {/* Headline */}
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              Wait — Don&apos;t Close This Page Yet
            </h2>
            <p className="text-lg md:text-xl text-gray-700">
              You just booked your style blueprint. <span className="font-semibold">Smart.</span>
            </p>
            <p className="text-base text-gray-600 mt-2">
              But here&apos;s what 67% of our clients tell us 2 weeks later:
            </p>
          </div>

          {/* Problem Agitation */}
          <div className="bg-white/70 backdrop-blur rounded-2xl p-5 md:p-6 mb-6 border border-amber-200">
            <div className="space-y-4 text-gray-700">
              <p className="italic border-l-4 border-amber-400 pl-4">
                &quot;I love my blueprint... but I spent 6 hours scrolling Myntra and still couldn&apos;t find the structured boat-neck kurta you recommended.&quot;
              </p>
              <p className="italic border-l-4 border-amber-400 pl-4">
                &quot;I know my undertone now, but which brands actually carry mustard in that exact shade?&quot;
              </p>
              <p className="italic border-l-4 border-amber-400 pl-4">
                &quot;I have 16 outfit formulas... and zero time to hunt down each piece.&quot;
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-200">
              <p className="font-bold text-gray-900 text-lg mb-2">The brutal truth?</p>
              <p className="text-gray-700">
                Your blueprint is your <span className="font-semibold">formula</span>. But shopping is where <span className="font-bold text-red-600">80% of women get stuck.</span>
              </p>
              <p className="text-gray-600 mt-2">
                Wrong fit. Wrong color. Wrong neckline.<br />
                One bad purchase = ₹2,000 wasted + back to feeling &quot;nothing looks good on me.&quot;
              </p>
            </div>
          </div>

          {/* Solution */}
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              That&apos;s why we created <span className="text-luxury-accent">Iconik Closet</span>
            </h3>
            <p className="text-gray-700 text-lg">Your personal shopping assistant.</p>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl p-5 md:p-6 mb-6 border-2 border-luxury-accent/20">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-luxury-accent" />
              How it works:
            </h4>
            <p className="text-gray-700 mb-4">
              Every month, you get <span className="font-bold">6 complete outfit sets</span> delivered to your inbox.
            </p>
            <p className="text-gray-600 mb-3">Not just &quot;buy a kurta.&quot; We&apos;re talking:</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Exact links to the kurta (correct neckline, sleeve, undertone)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Matching bottoms (palazzo/jeans/trousers — based on your body shape)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Jewelry (statement or minimal, per your style)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Footwear (heels/flats/juttis)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Bag/accessories</span>
              </div>
            </div>

            <p className="text-gray-900 font-semibold">
              Based on YOUR blueprint. Ready to buy. Ready to wear. <span className="text-luxury-accent">Zero guesswork.</span>
            </p>
          </div>

          {/* Credibility Proof */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl p-3 text-center border border-gray-200">
              <Users className="w-6 h-6 text-luxury-accent mx-auto mb-1" />
              <p className="text-xl md:text-2xl font-bold text-gray-900">268</p>
              <p className="text-xs text-gray-600">women subscribed</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-gray-200">
              <Clock className="w-6 h-6 text-luxury-accent mx-auto mb-1" />
              <p className="text-xl md:text-2xl font-bold text-gray-900">12+</p>
              <p className="text-xs text-gray-600">hours saved/mo</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-gray-200">
              <Sparkles className="w-6 h-6 text-luxury-accent mx-auto mb-1" />
              <p className="text-xl md:text-2xl font-bold text-gray-900">₹8,400</p>
              <p className="text-xs text-gray-600">saved/year</p>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Yearly Plan - Featured */}
            <div className="relative bg-white rounded-2xl p-5 border-2 border-luxury-accent shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-luxury-accent text-white px-4 py-1 rounded-full text-sm font-bold">
                BEST VALUE
              </div>
              <h4 className="text-lg font-bold text-gray-900 mt-2 mb-1">Yearly Plan</h4>
              <div className="mb-3">
                <span className="text-3xl font-bold text-luxury-accent">₹599</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Billed yearly: ₹7,188 <span className="text-green-600 font-semibold">(Save ₹1,200)</span>
              </p>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  6 complete outfit sets every month
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Seasonal updates (wedding, festive, work)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Custom look requests
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Priority chat support
                </li>
              </ul>
              <button
                onClick={() => handleSubscription('yearly')}
                disabled={isProcessing}
                className="w-full bg-luxury-accent hover:bg-luxury-accent/90 text-white py-3 px-4 rounded-full font-bold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processing...' : (
                  <>
                    YES — Lock In ₹599/Month <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Monthly Plan */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-1">Monthly Plan</h4>
              <div className="mb-3">
                <span className="text-3xl font-bold text-gray-900">₹699</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Cancel anytime. No lock-in.
              </p>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  6 complete outfit sets every month
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Seasonal updates
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Custom look requests
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Chat support
                </li>
              </ul>
              <button
                onClick={() => handleSubscription('monthly')}
                disabled={isProcessing}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-full font-bold transition-all duration-300 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Start Monthly at ₹699'}
              </button>
            </div>
          </div>

          {/* Guarantee Box */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">🔒 Try it for 30 days.</h4>
                <p className="text-gray-700 text-sm">
                  If you don&apos;t save at least 3 hours or find even 2 outfits you love — reply to any email and we&apos;ll refund your first month. No questions.
                </p>
              </div>
            </div>
          </div>

          {/* Urgency */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-700 font-semibold">
              ⚠️ Only available to consultation clients. We manually curate these — can&apos;t scale beyond 500 subscribers.
            </p>
            <p className="text-red-600 text-lg font-bold mt-1">
              Current capacity: 232 slots left
            </p>
          </div>

          {/* FAQ / Objection Handlers */}
          <div className="space-y-4 mb-6">
            <details className="bg-white rounded-xl p-4 border border-gray-200 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                &quot;I&apos;ll think about it and sign up later.&quot;
                <span className="text-gray-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-gray-600 mt-3 text-sm">
                Fair. But here&apos;s the thing: This offer is only on this page. Once you close it, it&apos;s ₹999/month if you come back.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 border border-gray-200 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                &quot;I don&apos;t shop every month.&quot;
                <span className="text-gray-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-gray-600 mt-3 text-sm">
                You don&apos;t have to buy every outfit. Think of this as a styled lookbook that&apos;s shoppable when you need it. Wedding invite? Office promotion? Date night? It&apos;s already curated.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 border border-gray-200 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                &quot;What if my style changes?&quot;
                <span className="text-gray-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-gray-600 mt-3 text-sm">
                Your blueprint evolves with you. After 6 months, we&apos;ll do a FREE micro-refresh (10-min call) to update your palette/silhouettes if needed.
              </p>
            </details>
          </div>

          {/* Final Nudge */}
          <p className="text-center text-sm text-gray-500 mb-4">
            Most clients who skip this end up spending ₹12,000+ on wrong pieces in the next 90 days. Don&apos;t let your blueprint collect digital dust.
          </p>

          {/* Skip Link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
            >
              I&apos;ll do this later
            </Link>
          </div>
        </div>
      </motion.section>
      {/* ==================== END UPSELL SECTION ==================== */}

      {/* What's Next Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-2xl mx-auto px-4 py-8"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 mb-8 border border-white/30">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">What&apos;s Next?</h2>

          <div className="space-y-5 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Order Confirmation Sent</h3>
                <p className="text-gray-600 text-sm">You&apos;ll receive a message confirming your order with all the details</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Booking Link Coming Soon</h3>
                <p className="text-gray-600 text-sm">We&apos;ll send you a link to schedule your 1-on-1 style consultation with our expert stylist</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Personalized Style Assessment</h3>
                <p className="text-gray-600 text-sm">Get ready for your custom style transformation roadmap</p>
              </div>
            </div>
          </div>
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
