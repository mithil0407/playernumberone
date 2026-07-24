'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock, Loader2, Lock, Shield, Sparkles } from 'lucide-react';
import { getAttributionPayload } from '@/lib/attribution';
import { trackInitiateCheckout, trackPageView, trackPurchase, updateUserData } from '@/lib/metaPixel';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance { open(): void; }

const BASE_PRICE = 97;
const ADDON_PRICE = 37;

const C = {
  slate: '#94A6AD',
  slateLight: '#A0B2B9',
  slateDeep: '#7E9098',
  ivory: '#F4EFE5',
  bone: '#EDE5D2',
  paper: '#F8F3E9',
  ink: '#2C2622',
  rose: '#D4537E',
  gold: '#C9A96E',
};

const includedItems = [
  'Geometric Silhouette Profile - cuts built for your body',
  'Chromatic Harmony Map - colours that make you glow',
  'Facial Architecture Analysis - necklines, earrings, eyewear',
  'Hair Direction - styles that work with your face',
  '20 Complete Outfit Formulas - built for your Blueprint',
  'What to Avoid - cuts, colours, and silhouettes to stop buying',
];

export default function GlobeCheckoutPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [iconikEditAddon, setIkonikEditAddon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStage, setPaymentStage] = useState<'creating_order' | 'opening_razorpay' | 'confirming_payment' | 'redirecting' | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
  const [formError, setFormError] = useState('');

  const totalAmount = useMemo(
    () => BASE_PRICE + (iconikEditAddon ? ADDON_PRICE : 0),
    [iconikEditAddon],
  );

  useEffect(() => {
    trackPageView('Globe Checkout');
    trackInitiateCheckout(BASE_PRICE, 1, 'ICONIK Blueprint Globe', 'USD', 'Globe Funnel', ['iconik_blueprint_globe']);
  }, []);

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay.com"]')) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
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

  const processPayment = useCallback(async () => {
    setFormError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
      setFormError('Please enter a valid phone number.');
      return;
    }

    updateUserData(email, phone);
    setIsProcessing(true);
    setPaymentStage('creating_order');

    try {
      const response = await fetch('/api/globe-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: email.split('@')[0],
          customer_email: email,
          customer_phone: phone,
          amount: totalAmount,
          iconik_edit_addon: iconikEditAddon,
          attribution: getAttributionPayload(),
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Payment initialisation failed');

      const initRazorpay = () => {
        setPaymentStage('opening_razorpay');
        const options: RazorpayOptions = {
          key: data.key,
          amount: data.amount,
          currency: 'USD',
          name: 'ICONIK Style Intelligence',
          description: 'ICONIK Blueprint',
          order_id: data.razorpay_order_id,
          handler: async (rzpResponse: RazorpayResponse) => {
            setIsProcessing(true);
            setPaymentStage('confirming_payment');

            try {
              const confirmRes = await fetch('/api/globe-confirm-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  db_order_id: data.db_order_id,
                  stylist_order_id: data.stylist_order_id,
                  razorpay_payment_id: rzpResponse.razorpay_payment_id,
                  razorpay_order_id: rzpResponse.razorpay_order_id,
                  customer_name: email.split('@')[0],
                  customer_email: email,
                  customer_phone: phone,
                  amount: totalAmount,
                  has_edit_addon: iconikEditAddon,
                  attribution: getAttributionPayload(),
                }),
              });
              const confirmData = await confirmRes.json();
              if (!confirmRes.ok || !confirmData.success) {
                throw new Error(confirmData.error || 'Could not unlock your intake after payment.');
              }
            } catch (err) {
              setIsProcessing(false);
              setPaymentStage(null);
              setFormError(
                err instanceof Error
                  ? `Payment succeeded, but we could not unlock your intake yet: ${err.message}. Please contact support with payment ID ${rzpResponse.razorpay_payment_id}.`
                  : `Payment succeeded, but we could not unlock your intake yet. Please contact support with payment ID ${rzpResponse.razorpay_payment_id}.`,
              );
              return;
            }

            localStorage.setItem('globe_purchaseAmount', totalAmount.toString());
            localStorage.setItem('globe_customerEmail', email);
            localStorage.setItem('globe_customerPhone', phone);
            localStorage.setItem('stylist_purchaseAmount', totalAmount.toString());
            localStorage.setItem('stylist_customerEmail', email);
            localStorage.setItem('stylist_customerPhone', phone);
            if (data.customer_id) localStorage.setItem('globe_customerId', data.customer_id);
            if (data.db_order_id) localStorage.setItem('globe_orderId', data.db_order_id);

            trackPurchase(totalAmount, 'ICONIK Blueprint Globe', ['iconik_blueprint_globe'], 1, 'USD', 'Globe Funnel', rzpResponse.razorpay_payment_id);

            setPaymentStage('redirecting');
            window.location.href = `/stylist/intake?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
          },
          prefill: { name: email.split('@')[0], email, contact: phone },
          theme: { color: C.slateDeep },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setPaymentStage(null);
            },
          },
        };

        const rzp = new (window as unknown as { Razorpay: new (opts: RazorpayOptions) => RazorpayInstance }).Razorpay(options);
        rzp.open();
        setIsProcessing(false);
      };

      if (razorpayLoaded && (window as unknown as { Razorpay?: unknown }).Razorpay) {
        initRazorpay();
      } else {
        const check = setInterval(() => {
          if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
            clearInterval(check);
            initRazorpay();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          if (!(window as unknown as { Razorpay?: unknown }).Razorpay) {
            setIsProcessing(false);
            setPaymentStage(null);
            setFormError('Failed to load payment system. Please try again.');
          }
        }, 10000);
      }
    } catch (err) {
      console.error('Globe payment error:', err);
      setIsProcessing(false);
      setPaymentStage(null);
      setFormError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    }
  }, [email, phone, totalAmount, iconikEditAddon, razorpayLoaded]);

  const paymentStageText: Record<NonNullable<typeof paymentStage>, string> = {
    creating_order: 'Preparing your secure checkout...',
    opening_razorpay: 'Opening Razorpay...',
    confirming_payment: 'Confirming your payment and unlocking intake...',
    redirecting: 'Payment confirmed. Taking you to your intake...',
  };

  const INK = C.ink;
  const LIGHT = C.ivory;

  return (
    <div className="man-editorial me-page-wrapper min-h-screen" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
      {paymentStage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-5" style={{ background: 'rgba(44,38,34,0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl" style={{ background: C.paper, border: '1px solid rgba(44,38,34,0.08)' }}>
            <Loader2 className="mx-auto mb-5 h-8 w-8 animate-spin" style={{ color: C.slate }} />
            <div className="iconik-micro mb-4 opacity-45" style={{ color: INK }}>Secure Checkout</div>
            <h2 className="iconik-display" style={{ fontSize: 28, color: INK }}>{paymentStageText[paymentStage]}</h2>
            <p className="mt-4 text-sm leading-7 opacity-60" style={{ color: INK }}>Please do not refresh or close this page.</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(248,243,233,0.95)', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/globe" className="flex items-center gap-2 transition-opacity hover:opacity-60" style={{ color: INK }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="iconik-mono" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Back</span>
          </Link>
          <span className="iconik-display" style={{ fontSize: '18px', letterSpacing: '0.1em', color: INK }}>ICONIK</span>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8"
        >
          {[
            { icon: <CheckCircle className="w-3.5 h-3.5" />, text: '5,000+ Clients' },
            { icon: <Lock className="w-3.5 h-3.5" />, text: '100% Secure' },
            { icon: <CheckCircle className="w-3.5 h-3.5" />, text: '10+ Countries' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(148,166,173,0.12)', border: '1px solid rgba(148,166,173,0.2)', color: INK }}>
              <span style={{ color: C.slate }}>{icon}</span>
              <span className="iconik-mono" style={{ fontSize: '11px', opacity: 0.7 }}>{text}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-10">
          <div className="iconik-display mb-4" style={{ fontSize: 'clamp(28px, 5vw, 48px)', color: INK }}>
            Your ICONIK Blueprint Starts Now
          </div>
          <div className="flex items-baseline justify-center gap-4 mb-4">
            <span className="iconik-display line-through" style={{ fontSize: 'clamp(22px, 4vw, 36px)', color: INK, opacity: 0.3 }}>$297</span>
            <span className="iconik-display" style={{ fontSize: 'clamp(32px, 6vw, 52px)', color: INK }}>${BASE_PRICE}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full" style={{ background: C.slate, color: LIGHT }}>
            <span className="iconik-mono" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>YOU SAVE $200</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <motion.section
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl p-6 md:p-8"
            style={{ background: '#fff', border: '1px solid rgba(44,38,34,0.1)' }}
          >
            <div className="iconik-display mb-6 text-center" style={{ fontSize: '24px', color: INK }}>Get Your Blueprint</div>
            <form onSubmit={e => { e.preventDefault(); processPayment(); }} className="space-y-5">
              <div>
                <label htmlFor="globe-email" className="block mb-2 iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.5, letterSpacing: '0.2em' }}>EMAIL ADDRESS *</label>
                <input
                  id="globe-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{ border: '1px solid rgba(44,38,34,0.15)', background: '#FAFAF8', color: INK, fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 300 }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.slate)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(44,38,34,0.15)')}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="globe-phone" className="block mb-2 iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.5, letterSpacing: '0.2em' }}>PHONE NUMBER *</label>
                <input
                  id="globe-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^\d\s+()-]/g, ''))}
                  required
                  className="w-full px-4 py-3.5 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{ border: '1px solid rgba(44,38,34,0.15)', background: '#FAFAF8', color: INK, fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 300 }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.slate)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(44,38,34,0.15)')}
                  placeholder="Your phone number"
                />
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(44,38,34,0.03)', border: '1px solid rgba(44,38,34,0.06)' }}>
                <p className="iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.5, letterSpacing: '0.12em' }}>Secure &amp; encrypted payment via Razorpay</p>
              </div>
              {formError && (
                <div className="rounded-xl p-4 text-sm leading-6" style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239' }}>
                  {formError}
                </div>
              )}
            </form>
          </motion.section>

          <motion.section initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
            <div className="rounded-3xl p-6 md:p-8 relative overflow-hidden" style={{ background: C.bone, border: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="absolute top-3 right-[-28px] px-8 py-1 rotate-45 iconik-mono" style={{ background: C.slate, color: LIGHT, fontSize: '9px', letterSpacing: '0.2em' }}>BEST SELLER</div>
              <div className="iconik-display mb-1" style={{ fontSize: '20px', color: INK }}>ICONIK Style Blueprint</div>
              <p style={{ fontSize: '13px', color: INK, opacity: 0.55, marginBottom: '16px' }}>Delivered by an ICONIK stylist - personally reviewed.</p>
              <div className="flex items-baseline gap-3 mb-5">
                <span className="iconik-display line-through" style={{ fontSize: '20px', color: INK, opacity: 0.3 }}>$297</span>
                <span className="iconik-display" style={{ fontSize: '28px', color: INK }}>${BASE_PRICE}</span>
              </div>
              <div className="space-y-2.5">
                {includedItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: C.slate }} />
                    <span style={{ fontSize: '13px', color: INK, opacity: 0.75 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="iconik-display mb-1 text-center" style={{ fontSize: '17px', color: INK }}>Complete Your Blueprint</div>
              <p className="text-center mb-4 iconik-mono" style={{ fontSize: '10px', color: INK, opacity: 0.45, letterSpacing: '0.12em' }}>Optional add-on</p>
              <button
                type="button"
                onClick={() => setIkonikEditAddon(value => !value)}
                className="w-full cursor-pointer rounded-2xl p-4 text-left transition-all duration-200"
                style={{ border: `1px solid ${iconikEditAddon ? C.slate : 'rgba(44,38,34,0.1)'}`, background: iconikEditAddon ? 'rgba(148,166,173,0.08)' : '#FAFAF8' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all" style={{ border: `2px solid ${iconikEditAddon ? C.slate : 'rgba(44,38,34,0.2)'}`, background: iconikEditAddon ? C.slate : 'transparent' }}>
                    {iconikEditAddon && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="iconik-display" style={{ fontSize: '15px', color: INK }}>The ICONIK Edit</div>
                      <span className="iconik-display flex-shrink-0" style={{ fontSize: '15px', color: C.slate }}>+${ADDON_PRICE}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: INK, opacity: 0.55, marginBottom: '10px' }}>10 complete outfit formulas built specifically for your Blueprint.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['More outfit direction', 'Built around your report', 'Easy shopping reference'].map((t) => (
                        <span key={t} className="px-2.5 py-0.5 rounded-full iconik-mono" style={{ fontSize: '9px', background: 'rgba(44,38,34,0.06)', color: INK, opacity: 0.6, letterSpacing: '0.1em' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="rounded-3xl p-5 md:p-6" style={{ background: C.bone, border: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)', paddingBottom: '8px' }}>
                  <span className="iconik-mono" style={{ fontSize: '11px', color: INK, opacity: 0.5 }}>ICONIK Style Blueprint</span>
                  <span className="iconik-mono" style={{ fontSize: '11px', color: INK, opacity: 0.7 }}>${BASE_PRICE}</span>
                </div>
                {iconikEditAddon && (
                  <div className="flex justify-between items-center" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)', paddingBottom: '8px' }}>
                    <span className="iconik-mono" style={{ fontSize: '11px', color: INK, opacity: 0.5 }}>+ The ICONIK Edit</span>
                    <span className="iconik-mono" style={{ fontSize: '11px', color: INK, opacity: 0.7 }}>${ADDON_PRICE}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="iconik-display" style={{ fontSize: '18px', color: INK }}>You Pay</span>
                <span className="iconik-display" style={{ fontSize: '32px', color: INK }}>${totalAmount}</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-5">
                <Clock className="w-3 h-3" style={{ color: C.slate }} />
                <span className="iconik-mono" style={{ fontSize: '10px', color: C.slate, letterSpacing: '0.1em' }}>
                  Offer expires in {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={processPayment}
                className="w-full py-4 rounded-full transition-all duration-300 disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-lg transform"
                style={{ background: INK, color: LIGHT }}
              >
                <span className="iconik-display" style={{ fontSize: '16px' }}>
                  {isProcessing ? 'Processing...' : `Get My Blueprint - $${totalAmount} ->`}
                </span>
              </button>
            </div>

            <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(44,38,34,0.06)' }}>
              <div className="space-y-3">
                {[
                  { icon: <Shield className="w-4 h-4" style={{ color: C.slate }} />, text: 'Secure payment with Razorpay' },
                  { icon: <Clock className="w-4 h-4" style={{ color: C.slate }} />, text: 'Blueprint delivered within 5 working days after your 30-minute consultation' },
                  { icon: <Sparkles className="w-4 h-4" style={{ color: C.slate }} />, text: 'After payment, you go directly to the women Blueprint intake' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    {icon}
                    <span style={{ fontSize: '13px', color: INK, opacity: 0.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
