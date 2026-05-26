'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, Lock, Clock, ArrowLeft } from 'lucide-react';
import { trackPageView, trackInitiateCheckout, updateUserData } from '@/lib/metaPixel';
import { getAttributionPayload } from '@/lib/attribution';

// ── Razorpay types ───────────────────────────────────────────────────────────

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
}

interface RazorpayInstance { open(): void; }

const BLUEPRINT_PRICE = 149;

// ── Main ────────────────────────────────────────────────────────────────────

export default function StylistCheckoutPage() {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        trackPageView('Stylist Checkout');
        trackInitiateCheckout(BLUEPRINT_PRICE, 1, 'ICONIK Style Blueprint', 'USD', 'Style Scan Funnel');
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'checkout_started', { funnel: 'style_scan', amount: BLUEPRINT_PRICE });
            const savedEmail = localStorage.getItem('stylist_customerEmail') || '';
            if (savedEmail) setEmail(savedEmail);
        }
    }, []);

    useEffect(() => {
        if (document.querySelector('script[src*="razorpay.com"]')) { setRazorpayLoaded(true); return; }
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
        if (!phone.trim() || phone.length < 7) {
            setFormError('Please enter a valid phone number.');
            return;
        }

        updateUserData(email, phone);
        setIsProcessing(true);

        const leadId = typeof window !== 'undefined' ? localStorage.getItem('style_scan_lead_id') : null;

        try {
            const response = await fetch('/api/stylist-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: email.split('@')[0],
                    customer_email: email,
                    customer_phone: phone,
                    amount: BLUEPRINT_PRICE,
                    lead_id: leadId,
                    attribution: getAttributionPayload(),
                }),
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Payment initialisation failed');

            const initRazorpay = () => {
                const options: RazorpayOptions = {
                    key: data.key,
                    amount: data.amount,
                    currency: 'USD',
                    name: 'ICONIK Style Intelligence',
                    description: 'ICONIK Style Blueprint',
                    order_id: data.razorpay_order_id,
                    handler: async (rzpResponse: RazorpayResponse) => {
                        sessionStorage.setItem('stylist_purchaseTracked', rzpResponse.razorpay_payment_id);
                        try {
                            await fetch('/api/stylist-confirm-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    db_order_id: data.db_order_id,
                                    razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                    razorpay_order_id: rzpResponse.razorpay_order_id,
                                    customer_email: email,
                                    customer_phone: phone,
                                    customer_name: email.split('@')[0],
                                    amount: BLUEPRINT_PRICE,
                                    lead_id: leadId,
                                }),
                            });
                        } catch (err) {
                            console.warn('Could not confirm stylist payment in DB:', err);
                        }

                        if (typeof window !== 'undefined') {
                            localStorage.setItem('stylist_purchaseAmount', BLUEPRINT_PRICE.toString());
                            localStorage.setItem('stylist_customerEmail', email);
                            localStorage.setItem('stylist_customerPhone', phone);
                        }

                        window.location.href = `/stylist/checkout/success?payment_id=${rzpResponse.razorpay_payment_id}&email=${encodeURIComponent(email)}`;
                    },
                    prefill: { name: email.split('@')[0], email, contact: phone },
                    theme: { color: '#ff6b9d' },
                };

                const rzp = new (window as unknown as { Razorpay: new (opts: RazorpayOptions) => RazorpayInstance }).Razorpay(options);
                rzp.open();
                setIsProcessing(false);
            };

            if (razorpayLoaded && (window as unknown as { Razorpay?: unknown }).Razorpay) {
                initRazorpay();
            } else {
                const check = setInterval(() => {
                    if ((window as unknown as { Razorpay?: unknown }).Razorpay) { clearInterval(check); initRazorpay(); }
                }, 100);
                setTimeout(() => {
                    clearInterval(check);
                    if (!(window as unknown as { Razorpay?: unknown }).Razorpay) {
                        setIsProcessing(false);
                        setFormError('Failed to load payment system. Please try again.');
                    }
                }, 10000);
            }
        } catch (err) {
            console.error('Stylist payment error:', err);
            setIsProcessing(false);
            setFormError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
        }
    }, [email, phone, razorpayLoaded]);

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden">

            {/* Header */}
            <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream py-4 px-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/stylist/style-score/result" className="flex items-center gap-1.5 luxury-body text-luxury-charcoal/60 hover:text-luxury-charcoal transition-colors text-sm">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Link>
                    <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                    <div className="flex items-center gap-1.5 luxury-body text-luxury-charcoal/50 text-xs">
                        <Lock className="w-3 h-3" />
                        <span>Secure Checkout</span>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">

                {/* Trust strip */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap justify-center gap-3 mb-8"
                >
                    {['500+ Happy Clients', '4.9/5 Rating', '30-Day Guarantee', '72h Delivery'].map((t) => (
                        <div key={t} className="flex items-center gap-2 bg-luxury-cream/40 border border-luxury-cream text-luxury-charcoal/70 px-4 py-1.5 rounded-full text-xs luxury-body">
                            <CheckCircle className="w-3 h-3 text-luxury-accent" />
                            {t}
                        </div>
                    ))}
                </motion.div>

                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-xl md:text-4xl luxury-heading text-luxury-charcoal mb-4">
                        Your ICONIK Style Blueprint
                    </h1>
                    <div className="flex items-baseline justify-center gap-3 mb-3">
                        <span className="text-xl luxury-heading text-luxury-charcoal/30 line-through">$249</span>
                        <span className="text-3xl md:text-5xl luxury-heading text-luxury-accent">${BLUEPRINT_PRICE}</span>
                    </div>
                    <div className="inline-block bg-luxury-accent text-luxury-warm-white px-5 py-1.5 rounded-full luxury-body text-xs font-semibold mb-3">
                        STYLE SCAN EXCLUSIVE PRICE
                    </div>
                    <div className="flex items-center justify-center gap-1.5 luxury-body text-luxury-charcoal/50 text-sm">
                        <Clock className="w-4 h-4 text-luxury-accent" />
                        <span>Offer expires in {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
                    </div>
                </motion.div>

                {/* What's included */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-luxury-cream/20 border border-luxury-cream rounded-2xl p-6 mb-7"
                >
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-luxury-charcoal/40 mb-4">What&apos;s Included</p>
                    <div className="space-y-3">
                        {[
                            'Detailed colour palette — your exact hex codes and seasonal direction',
                            'Body geometry analysis — every cut that works for your specific proportions',
                            'Face architecture — necklines, earrings, eyewear for your face shape',
                            'Complete outfit formulas (top, bottom, footwear, bag, jewellery)',
                            'Hair direction — 4 styles matched to your face geometry',
                            'What to avoid — and the exact reason why',
                            'Shopping rules specific to your frame and palette',
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                                <span className="luxury-body text-luxury-charcoal/80 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Payment form */}
                <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={e => { e.preventDefault(); processPayment(); }}
                    className="bg-white border border-luxury-cream rounded-2xl p-6 space-y-5 mb-6"
                >
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-luxury-charcoal/40">Your Details</p>
                    <div>
                        <label className="block text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-2">Email Address *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body"
                            placeholder="your@email.com"
                            required
                        />
                        <p className="text-xs text-luxury-charcoal/40 mt-1 luxury-body">Your Blueprint will be sent to this address.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-2">Phone Number *</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/[^\d\s+()-]/g, ''))}
                            className="w-full px-4 py-3.5 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body"
                            placeholder="+1 (555) 000-0000"
                            required
                        />
                    </div>
                    {formError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm luxury-body">{formError}</div>
                    )}
                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full bg-luxury-accent hover:bg-luxury-accent/80 disabled:opacity-60 disabled:cursor-not-allowed text-luxury-warm-white py-4 text-base font-semibold luxury-body rounded-full transition-all duration-300 hover:shadow-lg"
                    >
                        {isProcessing ? 'Opening payment…' : `Pay $${BLUEPRINT_PRICE} — Get My Blueprint`}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-xs luxury-body text-luxury-charcoal/40">
                        <Lock className="w-3 h-3" />
                        <span>Secured by Razorpay · 256-bit SSL encryption</span>
                    </div>
                </motion.form>

                {/* Guarantee */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-center"
                >
                    <p className="luxury-body text-luxury-charcoal/50 text-xs leading-relaxed">
                        30-day money-back guarantee. If you&apos;re not happy with your Blueprint, email us and we&apos;ll refund you in full — no questions asked.
                    </p>
                </motion.div>

            </div>
        </div>
    );
}
