'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Lock } from 'lucide-react';
import {
  INDIA_PHONE_COUNTRY_CODE,
  MAN_BLUEPRINT_PRODUCT_ID,
  MAN_EDIT_CONTENT_NAME,
  MAN_EDIT_FUNNEL_CATEGORY,
  MAN_EDIT_PRODUCT_ID,
  MAN_FUNNEL_CATEGORY,
  MAN_OUTFIT_PREVIEW_PRODUCT_ID,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  updateUserData,
  trackCTAClick,
  trackRemoveFromCart,
  trackViewContent
} from '@/lib/metaPixel';
import { useManRegion } from '@/hooks/useManRegion';
import { getManPricing } from '@/lib/manPricing';
import { getAttributionPayload } from '@/lib/attribution';

const MAN_EDIT_MONTHLY_PRICE = 699;

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  image?: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance { open(): void; }


interface FormData {
  email: string;
  phone: string;
}

export default function ManCheckoutPage() {
  const [formData, setFormData] = useState<FormData>({ email: '', phone: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showAddonPopup, setShowAddonPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [iconikEditSubscription, setIconikEditSubscription] = useState(false);

  const { country, isIndia, isLoading: regionLoading } = useManRegion();
  const pricing = getManPricing(country);

  const originalPrice = pricing.originalPrice;
  const discountedPrice = pricing.basePrice;
  const outfitPreviewPrice = pricing.addonPrice;
  useEffect(() => {
    if (regionLoading) return;
    trackViewContent('ICONIK Man Style Blueprint - Checkout', discountedPrice, [MAN_BLUEPRINT_PRODUCT_ID], pricing.currency, MAN_FUNNEL_CATEGORY);
  }, [regionLoading, discountedPrice, pricing.currency]);

  const [outfitPreviewAddon, setOutfitPreviewAddon] = useState(false);

  const totalAmount = useMemo(() =>
    discountedPrice + (outfitPreviewAddon ? outfitPreviewPrice : 0),
    [discountedPrice, outfitPreviewAddon, outfitPreviewPrice]
  );

  const totalValue = useMemo(() =>
    originalPrice + (isIndia ? 1000 : 100) + (outfitPreviewAddon ? outfitPreviewPrice : 0),
    [originalPrice, isIndia, outfitPreviewAddon, outfitPreviewPrice]
  );

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
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // India: digits only, max 10. International: digits/spaces/dashes/+, max 15.
      if (isIndia) {
        if (!/^\d{0,10}$/.test(value)) return;
      } else {
        if (!/^[\d\s\-+]{0,15}$/.test(value)) return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    // India collects a 10-digit national number, which Meta cannot match
    // without its country code. International numbers already carry theirs.
    const phoneCountryCode = isIndia ? INDIA_PHONE_COUNTRY_CODE : undefined;
    if (name === 'email' && value.includes('@') && formData.phone.length >= 7) updateUserData(value, formData.phone, phoneCountryCode);
    else if (name === 'phone' && value.length >= 7 && formData.email.includes('@')) updateUserData(formData.email, value, phoneCountryCode);
  }, [formData.phone, formData.email, isIndia]);

  const handleAddonChange = useCallback((checked: boolean) => {
    if (checked) trackAddToCart('Outfit Preview on You', outfitPreviewPrice, MAN_OUTFIT_PREVIEW_PRODUCT_ID, pricing.currency, MAN_FUNNEL_CATEGORY);
    else trackRemoveFromCart('Outfit Preview on You', outfitPreviewPrice, MAN_OUTFIT_PREVIEW_PRODUCT_ID, pricing.currency, MAN_FUNNEL_CATEGORY);
    setOutfitPreviewAddon(checked);
  }, [outfitPreviewPrice, pricing.currency]);

  const handleEditSubscriptionChange = useCallback((checked: boolean) => {
    // Categorised as the Edit funnel, not the Blueprint funnel, so this add-on's
    // AddToCart and its own Purchase form one traceable funnel. India-only, so
    // INR is correct regardless of the visitor's region.
    if (checked) trackAddToCart(MAN_EDIT_CONTENT_NAME, MAN_EDIT_MONTHLY_PRICE, MAN_EDIT_PRODUCT_ID, 'INR', MAN_EDIT_FUNNEL_CATEGORY);
    else trackRemoveFromCart(MAN_EDIT_CONTENT_NAME, MAN_EDIT_MONTHLY_PRICE, MAN_EDIT_PRODUCT_ID, 'INR', MAN_EDIT_FUNNEL_CATEGORY);
    setIconikEditSubscription(checked);
  }, []);

  const redirectToIntake = useCallback(() => {
    const intakeUrl = `/man/intake?email=${encodeURIComponent(formData.email)}&phone=${encodeURIComponent(formData.phone)}`;
    window.location.href = intakeUrl;
  }, [formData.email, formData.phone]);

  const startIconikEditSubscription = useCallback(async (paymentResponse: RazorpayResponse, dbOrderId?: string) => {
    const response = await fetch('/api/man-edit-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_name: formData.email.split('@')[0],
        razorpay_order_id: paymentResponse.razorpay_order_id,
        db_order_id: dbOrderId,
        attribution: getAttributionPayload(),
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Could not start Iconik Edit subscription');
    }

    await new Promise<void>((resolve, reject) => {
      const options: RazorpayOptions = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'ICONIK Man',
        description: 'Iconik Edit Monthly',
        subscription_id: data.subscription_id,
        image: `${window.location.origin}/logopayment.webp`,
        handler: function (subscriptionResponse: RazorpayResponse) {
          // The Edit subscription is a separate Razorpay order, so it needs its
          // own Purchase — its price is not part of the Blueprint order value.
          // The payment ID is the event ID, matching the subscription.charged
          // webhook so Meta collapses the pair into one sale.
          if (subscriptionResponse?.razorpay_payment_id) {
            trackPurchase(
              MAN_EDIT_MONTHLY_PRICE,
              MAN_EDIT_CONTENT_NAME,
              [MAN_EDIT_PRODUCT_ID],
              1,
              'INR',
              MAN_EDIT_FUNNEL_CATEGORY,
              subscriptionResponse.razorpay_payment_id,
              subscriptionResponse.razorpay_payment_id,
            );
          }
          resolve();
        },
        prefill: {
          name: formData.email.split('@')[0],
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#1c1917' },
        modal: {
          ondismiss: () => reject(new Error('Iconik Edit subscription checkout was closed')),
        },
      };

      const razorpay = new (window as unknown as { Razorpay: new (o: RazorpayOptions) => RazorpayInstance }).Razorpay(options);
      razorpay.open();
    });
  }, [formData.email, formData.phone]);

  const processPayment = useCallback(async () => {
    // Phone validation: 10 digits for India, 7+ for international
    const phoneValid = isIndia ? formData.phone.length === 10 : formData.phone.replace(/[\s\-+]/g, '').length >= 7;
    if (!phoneValid) {
      alert(isIndia ? 'Please enter a valid 10-digit phone number' : 'Please enter a valid phone number');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { alert('Please enter a valid email address'); return; }

    setIsProcessing(true);
    // Scoped to what this Razorpay order charges. The Edit subscription is a
    // separate order with its own InitiateCheckout/Purchase, so counting it here
    // would report more items than `totalAmount` covers.
    const checkoutItems = [MAN_BLUEPRINT_PRODUCT_ID, ...(outfitPreviewAddon ? [MAN_OUTFIT_PREVIEW_PRODUCT_ID] : [])];
    trackInitiateCheckout(totalAmount, checkoutItems.length, 'ICONIK Man Style Blueprint', pricing.currency, MAN_FUNNEL_CATEGORY, checkoutItems);

    try {
      let responseData: {
        success: boolean;
        key: string;
        razorpay_order_id: string;
        amount: number;
        currency: string;
        customer_id?: string;
        db_order_id?: string;
        error?: string;
      };

      if (isIndia) {
        // ── India: existing INR flow ──────────────────────────────────────────
        const orderData = {
          customer_name: formData.email.split('@')[0],
          customer_email: formData.email,
          customer_phone: formData.phone,
          amount: totalAmount,
          base_product: 'Iconik Man Style Blueprint',
          add_ons: {
            outfit_preview: outfitPreviewAddon,
            iconik_edit_subscription: iconikEditSubscription,
          },
          total_base_price: discountedPrice,
          outfit_preview_price: outfitPreviewAddon ? outfitPreviewPrice : 0,
          attribution: getAttributionPayload(),
        };

        const response = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) throw new Error('Payment initialization failed');
        responseData = await response.json();
        if (!responseData.success) throw new Error(responseData.error || 'Payment initialization failed');

      } else {
        // ── International: USD flow ───────────────────────────────────────────
        const orderData = {
          customer_email: formData.email,
          customer_phone: formData.phone,
          amount: totalAmount,
          outfit_preview_addon: outfitPreviewAddon,
          attribution: getAttributionPayload(),
        };

        const response = await fetch('/api/man-payment-intl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) throw new Error('Payment initialization failed');
        responseData = await response.json();
        if (!responseData.success) throw new Error(responseData.error || 'Payment initialization failed');
      }

      const initializeRazorpay = () => {
        const options = {
          key: responseData.key,
          amount: responseData.amount,
          currency: responseData.currency,
          name: 'ICONIK Man',
          description: 'ICONIK Man Style Blueprint',
          image: `${window.location.origin}/logopayment.webp`,
          order_id: responseData.razorpay_order_id,
          handler: async function (response: RazorpayResponse) {
            // Only what this Razorpay order actually charged for. The Edit
            // subscription is billed separately and fires its own Purchase, so
            // including it here would report 3 items against a 2-item value and
            // disagree with the Conversions API event of the same ID.
            const purchasedItems = [MAN_BLUEPRINT_PRODUCT_ID];
            if (outfitPreviewAddon) purchasedItems.push(MAN_OUTFIT_PREVIEW_PRODUCT_ID);

            trackPurchase(totalAmount, 'ICONIK Man Complete Package', purchasedItems, purchasedItems.length, pricing.currency, MAN_FUNNEL_CATEGORY, response.razorpay_payment_id, response.razorpay_payment_id);

            // International: confirm payment server-side and send email
            if (!isIndia) {
              try {
                await fetch('/api/man-confirm-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    db_order_id: responseData.db_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    amount: totalAmount,
                    has_outfit_preview: outfitPreviewAddon,
                  }),
                });
              } catch (err) {
                console.error('Man INTL confirm payment error:', err);
              }
            }

            // Store in localStorage so intake form can prefill contact details
            localStorage.setItem('man_customerEmail', formData.email);
            localStorage.setItem('man_customerPhone', formData.phone);

            if (isIndia && iconikEditSubscription) {
              try {
                await startIconikEditSubscription(response, responseData.db_order_id);
              } catch (err) {
                console.error('Iconik Edit subscription error:', err);
                alert(err instanceof Error ? err.message : 'Iconik Edit subscription was not completed. You can continue your intake now.');
              }
            }

            redirectToIntake();
          },
          prefill: {
            name: formData.email.split('@')[0],
            email: formData.email,
            contact: formData.phone
          },
          theme: { color: '#1c1917' }
        };

        const razorpay = new (window as unknown as { Razorpay: new (o: RazorpayOptions) => RazorpayInstance }).Razorpay(options);
        razorpay.open();
      };

      if (razorpayLoaded && window.Razorpay) {
        initializeRazorpay();
      } else {
        const checkRazorpay = setInterval(() => {
          if (window.Razorpay) {
            clearInterval(checkRazorpay);
            initializeRazorpay();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkRazorpay);
          if (!window.Razorpay) {
            setIsProcessing(false);
            alert('Failed to load payment system. Please try again or contact support.');
          }
        }, 10000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    }
  }, [formData, totalAmount, outfitPreviewAddon, iconikEditSubscription, razorpayLoaded, isIndia, discountedPrice, outfitPreviewPrice, pricing.currency, redirectToIntake, startIconikEditSubscription]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const hasAddons = outfitPreviewAddon || iconikEditSubscription;
    if (!hasAddons && !popupDismissed) setShowAddonPopup(true);
    else await processPayment();
  }, [processPayment, outfitPreviewAddon, iconikEditSubscription, popupDismissed]);

  const INK = '#2C2622';
  const LIGHT = '#F4EFE5';

  return (
    <div className="man-editorial me-page-wrapper min-h-screen" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(248,243,233,0.95)', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/man" className="flex items-center gap-2 transition-opacity hover:opacity-60" style={{ color: INK }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="iconik-mono" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Back</span>
          </Link>
          <span className="iconik-display" style={{ fontSize: '18px', letterSpacing: '0.1em', color: INK }}>ICONIK</span>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">

        {/* Trust strip */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8"
        >
          {[
            { icon: <CheckCircle className="w-3.5 h-3.5" />, text: '1,000+ Men Served' },
            { icon: <Lock className="w-3.5 h-3.5" />, text: '100% Secure' },
            { icon: <CheckCircle className="w-3.5 h-3.5" />, text: '10+ Countries' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(148,166,173,0.12)', border: '1px solid rgba(148,166,173,0.2)', color: INK }}>
              <span style={{ color: '#94A6AD' }}>{icon}</span>
              <span className="iconik-mono" style={{ fontSize: '11px', opacity: 0.7 }}>{text}</span>
            </div>
          ))}
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-10">
          <div className="iconik-display mb-4" style={{ fontSize: 'clamp(28px, 5vw, 48px)', color: INK }}>
            Your Man Style Blueprint Starts Now
          </div>
          <div className="flex items-baseline justify-center gap-4 mb-4">
            <span className="iconik-display line-through" style={{ fontSize: 'clamp(22px, 4vw, 36px)', color: INK, opacity: 0.3 }}>{pricing.displayOriginal}</span>
            <span className="iconik-display" style={{ fontSize: 'clamp(32px, 6vw, 52px)', color: INK }}>{pricing.displayBase}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full" style={{ background: '#94A6AD', color: LIGHT }}>
            <span className="iconik-mono" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>YOU SAVE {pricing.displaySavings}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

          {/* Order Form */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="rounded-3xl p-6 md:p-8" style={{ background: '#fff', border: '1px solid rgba(44,38,34,0.1)' }}
          >
            <div className="iconik-display mb-6 text-center" style={{ fontSize: '24px', color: INK }}>Get Your Blueprint</div>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block mb-2 iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.5, letterSpacing: '0.2em' }}>EMAIL ADDRESS *</label>
                <input
                  type="email" id="email" name="email" value={formData.email}
                  onChange={handleInputChange} required
                  className="w-full px-4 py-3.5 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{ border: '1px solid rgba(44,38,34,0.15)', background: '#FAFAF8', color: INK, fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 300 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#94A6AD')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(44,38,34,0.15)')}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block mb-2 iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.5, letterSpacing: '0.2em' }}>PHONE NUMBER *</label>
                <input
                  type="tel" id="phone" name="phone" value={formData.phone}
                  onChange={handleInputChange} required maxLength={isIndia ? 10 : 15}
                  className="w-full px-4 py-3.5 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{ border: '1px solid rgba(44,38,34,0.15)', background: '#FAFAF8', color: INK, fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 300 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#94A6AD')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(44,38,34,0.15)')}
                  placeholder={isIndia ? '10-digit number' : 'Your phone number'}
                />
                {isIndia && <p className="mt-1.5 iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.4 }}>Enter exactly 10 digits</p>}
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(44,38,34,0.03)', border: '1px solid rgba(44,38,34,0.06)' }}>
                <p className="iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.5, letterSpacing: '0.12em' }}>🔒 Secure &amp; encrypted payment via Razorpay</p>
              </div>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-4">

            {/* Main product card */}
            <div className="rounded-3xl p-6 md:p-8 relative overflow-hidden" style={{ background: '#EDE5D2', border: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="absolute top-3 right-[-28px] px-8 py-1 rotate-45 iconik-mono" style={{ background: '#94A6AD', color: LIGHT, fontSize: '9px', letterSpacing: '0.2em' }}>BEST SELLER</div>
              <div className="iconik-display mb-1" style={{ fontSize: '20px', color: INK }}>ICONIK Man Style Blueprint</div>
              <p style={{ fontSize: '13px', color: INK, opacity: 0.55, marginBottom: '16px' }}>Generated by ICONIK&apos;s system and reviewed by a human stylist.</p>
              <div className="flex items-baseline gap-3 mb-5">
                <span className="iconik-display line-through" style={{ fontSize: '20px', color: INK, opacity: 0.3 }}>{pricing.displayOriginal}</span>
                <span className="iconik-display" style={{ fontSize: '28px', color: INK }}>{pricing.displayBase}</span>
              </div>
              <div className="space-y-2.5">
                {[
                  'Geometric Frame Profile™ — fits built for your body',
                  'Personal Colour Palette — 10 that work, 4 to cut',
                  'Facial Architecture Analysis™ — collar, eyewear, hair',
                  'Grooming & Hair Blueprint',
                  'Human ICONIK stylist review — no appointment required',
                  '20 Complete Outfit Formulas — office, casual, occasion',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />
                    <span style={{ fontSize: '13px', color: INK, opacity: 0.75 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add-on */}
            <div className="rounded-3xl p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="iconik-display mb-1 text-center" style={{ fontSize: '17px', color: INK }}>Complete Your Blueprint</div>
              <p className="text-center mb-4 iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.45, letterSpacing: '0.12em' }}>Most clients add this for best results</p>
              <div
                onClick={() => handleAddonChange(!outfitPreviewAddon)}
                className="cursor-pointer rounded-2xl p-4 transition-all duration-200"
                style={{ border: `1px solid ${outfitPreviewAddon ? '#94A6AD' : 'rgba(44,38,34,0.1)'}`, background: outfitPreviewAddon ? 'rgba(148,166,173,0.08)' : '#FAFAF8' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all" style={{ border: `2px solid ${outfitPreviewAddon ? '#94A6AD' : 'rgba(44,38,34,0.2)'}`, background: outfitPreviewAddon ? '#94A6AD' : 'transparent' }}>
                    {outfitPreviewAddon && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="iconik-display" style={{ fontSize: '15px', color: INK }}>Outfit Preview on You</div>
                      <span className="iconik-display flex-shrink-0" style={{ fontSize: '15px', color: '#94A6AD' }}>{pricing.displayAddon}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: INK, opacity: 0.55, marginBottom: '10px' }}>See how the outfits we recommend will actually look on your body.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['See yourself in the outfits', 'No more guessing', 'Shop with confidence'].map((t) => (
                        <span key={t} className="px-2.5 py-0.5 rounded-full iconik-mono" style={{ fontSize: '9px', background: 'rgba(44,38,34,0.06)', color: INK, opacity: 0.6, letterSpacing: '0.1em' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {isIndia && (
                <div
                  onClick={() => handleEditSubscriptionChange(!iconikEditSubscription)}
                  className="cursor-pointer rounded-2xl p-4 mt-3 transition-all duration-200"
                  style={{ border: `1px solid ${iconikEditSubscription ? '#94A6AD' : 'rgba(44,38,34,0.1)'}`, background: iconikEditSubscription ? 'rgba(148,166,173,0.08)' : '#FAFAF8' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all" style={{ border: `2px solid ${iconikEditSubscription ? '#94A6AD' : 'rgba(44,38,34,0.2)'}`, background: iconikEditSubscription ? '#94A6AD' : 'transparent' }}>
                      {iconikEditSubscription && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <div className="iconik-display" style={{ fontSize: '15px', color: INK }}>Iconik Edit</div>
                        <span className="iconik-display flex-shrink-0" style={{ fontSize: '15px', color: '#94A6AD' }}>₹699/mo</span>
                      </div>
                      <p style={{ fontSize: '12px', color: INK, opacity: 0.55, marginBottom: '10px' }}>Keep your stylist on-call after your Blueprint. Ask outfit questions, upload looks, and get monthly recommendations.</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Stylist chat', 'Learns what you like', 'Monthly outfit edit'].map((t) => (
                          <span key={t} className="px-2.5 py-0.5 rounded-full iconik-mono" style={{ fontSize: '9px', background: 'rgba(44,38,34,0.06)', color: INK, opacity: 0.6, letterSpacing: '0.1em' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Total + Pay */}
            <div className="rounded-3xl p-5 md:p-6" style={{ background: '#EDE5D2', border: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)', paddingBottom: '8px' }}>
                  <span className="iconik-mono" style={{ fontSize: '11px', color: INK, opacity: 0.5 }}>Man Style Blueprint</span>
                  <span className="iconik-mono" style={{ fontSize: '11px', color: INK, opacity: 0.7 }}>{pricing.displayBase}</span>
                </div>
                {outfitPreviewAddon && (
                  <div className="flex justify-between items-center" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)', paddingBottom: '8px' }}>
                    <span className="iconik-mono" style={{ fontSize: '11px', color: INK, opacity: 0.5 }}>+ Outfit Preview</span>
                    <span className="iconik-mono" style={{ fontSize: '11px', color: INK, opacity: 0.7 }}>{pricing.displayAddon}</span>
                  </div>
                )}
                {isIndia && iconikEditSubscription && (
                  <div className="flex justify-between items-center" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)', paddingBottom: '8px' }}>
                    <span className="iconik-mono" style={{ fontSize: '11px', color: INK, opacity: 0.5 }}>+ Iconik Edit</span>
                    <span className="iconik-mono" style={{ fontSize: '11px', color: INK, opacity: 0.7 }}>₹699 / month</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="iconik-display" style={{ fontSize: '18px', color: INK }}>You Pay</span>
                <span className="iconik-display" style={{ fontSize: '32px', color: INK }}>{pricing.symbol}{totalAmount.toLocaleString()}</span>
              </div>
              {isIndia && iconikEditSubscription && (
                <p className="text-center mb-3 iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.45, letterSpacing: '0.1em' }}>
                  Then ₹699/month for Iconik Edit after this payment
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mb-5">
                <Clock className="w-3 h-3" style={{ color: '#94A6AD' }} />
                <span className="iconik-mono" style={{ fontSize: '10px', color: '#94A6AD', letterSpacing: '0.1em' }}>
                  Offer expires in {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
              <button
                type="button" disabled={isProcessing}
                onClick={async (e) => {
                  e.preventDefault();
                  if (!outfitPreviewAddon && !iconikEditSubscription && !popupDismissed) {
                    setShowAddonPopup(true);
                    trackCTAClick('Add-on Popup Shown', 'Man Checkout Main Button', totalAmount, pricing.currency, MAN_FUNNEL_CATEGORY);
                  } else { await processPayment(); }
                }}
                className="w-full py-4 rounded-full transition-all duration-300 disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-lg transform"
                style={{ background: '#2C2622', color: LIGHT }}
              >
                <span className="iconik-display" style={{ fontSize: '16px' }}>
                  {isProcessing ? 'Processing...' : `Build My Blueprint — ${pricing.symbol}${totalAmount.toLocaleString()} →`}
                </span>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(44,38,34,0.06)' }}>
              <div className="space-y-3">
                {[
                  { icon: <Shield className="w-4 h-4" style={{ color: '#94A6AD' }} />, text: 'Secure payment with Razorpay' },
                  { icon: <Clock className="w-4 h-4" style={{ color: '#94A6AD' }} />, text: 'Blueprint delivered within 5 working days of completing your intake' },
                  { icon: <Users className="w-4 h-4" style={{ color: '#94A6AD' }} />, text: '1,000+ men served' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    {icon}
                    <span style={{ fontSize: '13px', color: INK, opacity: 0.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* Add-on Popup */}
      {showAddonPopup && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: 'rgba(44,38,34,0.5)', backdropFilter: 'blur(6px)' }}>
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="w-full md:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl md:rounded-3xl shadow-2xl"
            style={{ background: '#F8F3E9' }}
          >
            <div className="sticky top-0 p-5 z-10" style={{ background: 'rgba(248,243,233,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="iconik-display mb-0.5" style={{ fontSize: '20px', color: INK }}>Complete Your Blueprint</div>
                  <p className="iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.45 }}>Add the Outfit Preview for the full experience</p>
                </div>
                <button onClick={() => { setShowAddonPopup(false); setPopupDismissed(true); }} className="p-2 rounded-full hover:opacity-60 transition-opacity" style={{ color: INK }}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>×</span>
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p style={{ fontSize: '14px', color: INK, opacity: 0.65, lineHeight: 1.7, textAlign: 'center' }}>
                You&apos;re about to check out without any add-ons. Most clients see better results with the full package.
              </p>
              <button
                onClick={() => { setShowAddonPopup(false); setPopupDismissed(true); }}
                className="w-full py-3.5 rounded-full transition-all hover:opacity-80"
                style={{ background: '#EDE5D2', border: '1px solid rgba(44,38,34,0.1)', color: INK }}
              >
                <span className="iconik-display" style={{ fontSize: '15px' }}>Add something to my order</span>
              </button>
              <button
                onClick={async () => { setShowAddonPopup(false); await processPayment(); }}
                className="w-full py-2.5 iconik-mono transition-opacity hover:opacity-70 underline"
                style={{ fontSize: '11px', color: INK, opacity: 0.45, letterSpacing: '0.1em' }}
              >
                Continue without add-ons
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
