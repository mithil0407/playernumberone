'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Star, Lock, Clock, Shield, ArrowRight } from 'lucide-react';
import { trackPageView, trackInitiateCheckout, updateUserData } from '@/lib/metaPixel';

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
    image?: string;
    handler: (response: RazorpayResponse) => void;
    prefill: { name: string; email: string; contact: string };
    theme: { color: string };
}

interface RazorpayInstance { open(): void; }

// ── Prices ───────────────────────────────────────────────────────────────────

const BASE_PRICE = 79;   // £79
const ADDON_PRICE = 29;  // £29 — The ICONIK Edit

// ── Main Component ───────────────────────────────────────────────────────────

export default function GlobeCheckoutPage() {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [iconikEditAddon, setIkonikEditAddon] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
    const [formError, setFormError] = useState('');
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    // Testimonial images
    const testimonialImages = [
        { src: '/text1.webp', alt: 'Client testimonial 1' },
        { src: '/text2.webp', alt: 'Client testimonial 2' },
        { src: '/text3.webp', alt: 'Client testimonial 3' },
        { src: '/text4.webp', alt: 'Client testimonial 4' },
        { src: '/text5.webp', alt: 'Client testimonial 5' },
    ];

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonialImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [testimonialImages.length]);

    const totalAmount = useMemo(
        () => BASE_PRICE + (iconikEditAddon ? ADDON_PRICE : 0),
        [iconikEditAddon]
    );

    useEffect(() => {
        trackPageView('Globe Checkout');
        trackInitiateCheckout(79, 1, 'ICONIK Blueprint Globe', 'GBP', 'Globe Funnel');
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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setFormError('Please enter a valid email address.');
            return;
        }
        if (!phone.trim() || phone.length < 7) {
            setFormError('Please enter a valid phone number.');
            return;
        }

        updateUserData(email, phone);
        setIsProcessing(true);

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
                }),
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Payment initialisation failed');

            const initRazorpay = () => {
                const options: RazorpayOptions = {
                    key: data.key,
                    amount: data.amount,
                    currency: 'GBP',
                    name: 'ICONIK Style Intelligence',
                    description: 'ICONIK Blueprint',
                    order_id: data.razorpay_order_id,
                    handler: async (rzpResponse: RazorpayResponse) => {
                        // Purchase is tracked on the thankyou page to avoid racing the redirect
                        sessionStorage.setItem('globe_purchaseTracked', rzpResponse.razorpay_payment_id);

                        try {
                            await fetch('/api/globe-confirm-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    db_order_id: data.db_order_id,
                                    razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                    razorpay_order_id: rzpResponse.razorpay_order_id,
                                    customer_name: email.split('@')[0],
                                    customer_email: email,
                                    customer_phone: phone,
                                    amount: totalAmount,
                                    has_edit_addon: iconikEditAddon,
                                }),
                            });
                        } catch (err) {
                            console.warn('Could not confirm globe payment in DB:', err);
                        }

                        localStorage.setItem('globe_purchaseAmount', totalAmount.toString());
                        localStorage.setItem('globe_customerEmail', email);
                        localStorage.setItem('globe_customerPhone', phone);
                        if (data.customer_id) localStorage.setItem('globe_customerId', data.customer_id);
                        if (data.db_order_id) localStorage.setItem('globe_orderId', data.db_order_id);

                        window.location.href = `/globe/thankyou?payment_id=${rzpResponse.razorpay_payment_id}&order_id=${data.razorpay_order_id}&amount=${totalAmount}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
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
            console.error('Globe payment error:', err);
            setIsProcessing(false);
            setFormError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
        }
    }, [email, phone, totalAmount, iconikEditAddon, razorpayLoaded]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        processPayment();
    }, [processPayment]);

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden">

            {/* Header */}
            <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream py-4 px-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/globe" className="luxury-body text-luxury-charcoal/60 hover:text-luxury-charcoal transition-colors text-sm">
                        ← Back
                    </Link>
                    <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                    <div className="flex items-center gap-1.5 luxury-body text-luxury-charcoal/50 text-xs">
                        <Lock className="w-3 h-3" />
                        <span>Secure Checkout</span>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">

                {/* Trust strip */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap justify-center gap-3 mb-8"
                >
                    {['500+ Happy Clients', '4.9/5 Rating', '30-Day Guarantee', 'Instant Delivery'].map((t) => (
                        <div key={t} className="flex items-center gap-2 bg-luxury-cream/40 border border-luxury-cream text-luxury-charcoal/70 px-4 py-1.5 rounded-full text-xs luxury-body">
                            <CheckCircle className="w-3 h-3 text-luxury-accent" />
                            {t}
                        </div>
                    ))}
                </motion.div>

                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-xl md:text-5xl luxury-heading text-luxury-charcoal mb-3">
                        Your ICONIK Blueprint
                    </h1>
                    <div className="flex items-baseline justify-center gap-3 mb-3">
                        <span className="text-xl md:text-3xl luxury-heading text-luxury-charcoal/40 line-through">£149</span>
                        <span className="text-2xl md:text-5xl luxury-heading text-luxury-accent">£{BASE_PRICE}</span>
                    </div>
                    <div className="inline-block bg-luxury-accent text-luxury-warm-white px-5 py-1.5 rounded-full luxury-body text-sm font-semibold mb-3">
                        YOU SAVE £70 TODAY
                    </div>

                    <div className="flex items-center justify-center gap-1.5 mt-1 luxury-body text-luxury-charcoal/50 text-sm">
                        <Clock className="w-4 h-4 text-luxury-accent" />
                        <span>Offer expires in {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
                    </div>
                </motion.div>

                {/* WhatsApp Testimonial Carousel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-8 max-w-[203px] mx-auto"
                >
                    <h2 className="text-lg md:text-xl luxury-heading text-center mb-3 text-luxury-charcoal">
                        Real Results from Real Women
                    </h2>

                    <div className="relative">
                        <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-2 border border-luxury-cream overflow-hidden">
                            <div className="relative" style={{ aspectRatio: '9/16' }}>
                                {testimonialImages.map((testimonial, index) => (
                                    <div
                                        key={index}
                                        className={`absolute inset-0 transition-opacity duration-500 ${index === currentTestimonial ? 'opacity-100' : 'opacity-0'}`}
                                    >
                                        <Image
                                            src={testimonial.src}
                                            alt={testimonial.alt}
                                            width={135}
                                            height={240}
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Carousel Dots */}
                        <div className="flex justify-center gap-2 mt-3">
                            {testimonialImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentTestimonial(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                                        ? 'bg-luxury-accent w-6'
                                        : 'bg-luxury-charcoal/30 hover:bg-luxury-charcoal/50'
                                        }`}
                                    aria-label={`View testimonial ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">

                    {/* ── Left: Form ──────────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-luxury-cream/40 border border-luxury-cream rounded-2xl p-6 md:p-8"
                    >
                        <h2 className="luxury-heading text-luxury-charcoal text-xl mb-6">Your Details</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label htmlFor="globe-email" className="block luxury-body text-luxury-charcoal/70 text-sm font-semibold mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    id="globe-email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-luxury-warm-white luxury-body"
                                    placeholder="your@email.com"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="globe-phone" className="block luxury-body text-luxury-charcoal/70 text-sm font-semibold mb-2">
                                    Phone Number * <span className="font-normal text-luxury-charcoal/40">(international format)</span>
                                </label>
                                <input
                                    type="tel"
                                    id="globe-phone"
                                    value={phone}
                                    onChange={e => {
                                        const v = e.target.value.replace(/[^\d\s+()-]/g, '');
                                        setPhone(v);
                                    }}
                                    required
                                    className="w-full px-4 py-3.5 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-luxury-warm-white luxury-body"
                                    placeholder="+44 7700 000000"
                                />
                            </div>

                            {/* ── Order Bump ─────────────────────────────────────── */}
                            <div
                                onClick={() => setIkonikEditAddon(!iconikEditAddon)}
                                className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${iconikEditAddon
                                    ? 'border-luxury-accent bg-luxury-pink-bg'
                                    : 'border-luxury-cream bg-luxury-warm-white hover:border-luxury-accent/40'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${iconikEditAddon ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/20'
                                        }`}>
                                        {iconikEditAddon && (
                                            <svg className="w-3 h-3 text-luxury-warm-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="luxury-heading text-luxury-charcoal text-sm mb-1">
                                            YES — Add The ICONIK Edit (+£{ADDON_PRICE})
                                        </div>
                                        <p className="luxury-body text-luxury-charcoal/60 text-xs leading-relaxed">
                                            10 complete outfit formulas built specifically for your Blueprint. This is the implementation tool for your Blueprint. Add it now and you&apos;ll receive it alongside your report.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Error */}
                            {formError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 luxury-body text-red-700 text-sm">
                                    {formError}
                                </div>
                            )}

                            {/* Security note */}
                            <div className="bg-luxury-cream/30 rounded-xl p-4 text-center luxury-body text-luxury-charcoal/50 text-xs">
                                <p>🔒 256-bit SSL Encrypted — Your payment is completely secure</p>
                            </div>
                        </form>
                    </motion.div>

                    {/* ── Right: Summary + Pay ─────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-5"
                    >
                        {/* What you get */}
                        <div className="bg-luxury-cream/40 border border-luxury-cream rounded-2xl p-6 md:p-8">
                            <div className="luxury-body text-luxury-charcoal/50 text-xs tracking-widest uppercase mb-4">
                                Your Blueprint Includes
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'Body Geometry Analysis',
                                    'Face Architecture Profile',
                                    'Chromatic Harmony Map (10 exact colours)',
                                    '20 Complete Outfit Formulas',
                                    'Hair Direction (4 styles)',
                                    'Eyewear Guide (4 frames)',
                                    'What to Avoid — and Why',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal/80 text-sm">{item}</span>
                                    </li>
                                ))}
                                {iconikEditAddon && (
                                    <li className="flex items-start gap-3 border-t border-luxury-cream pt-3 mt-3">
                                        <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal font-semibold text-sm">+ The ICONIK Edit (10 outfit formulas)</span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Total + Pay button */}
                        <div className="bg-luxury-cream/40 border border-luxury-cream rounded-2xl p-6">
                            <div className="space-y-2 mb-5">
                                <div className="flex justify-between luxury-body text-luxury-charcoal/60 text-sm">
                                    <span>ICONIK Blueprint</span>
                                    <span>£{BASE_PRICE}</span>
                                </div>
                                {iconikEditAddon && (
                                    <div className="flex justify-between luxury-body text-luxury-charcoal/60 text-sm">
                                        <span>+ The ICONIK Edit</span>
                                        <span>£{ADDON_PRICE}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-luxury-cream pt-4 mb-5">
                                <div className="flex justify-between items-baseline">
                                    <span className="luxury-heading text-luxury-charcoal text-lg md:text-xl">You Pay:</span>
                                    <div className="text-right">
                                        <div className="text-xs luxury-body text-luxury-charcoal/40 line-through">£{149 + (iconikEditAddon ? ADDON_PRICE : 0)}</div>
                                        <span className="text-2xl md:text-3xl luxury-heading text-luxury-accent">£{totalAmount}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={isProcessing}
                                onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
                                className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white py-4 px-6 rounded-full luxury-body font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5 transform flex items-center justify-center gap-2"
                            >
                                {isProcessing ? 'Processing...' : (
                                    <>
                                        GET MY BLUEPRINT — £{totalAmount}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            {/* Testimonial below button */}
                            <div className="mt-5 flex items-center gap-3 bg-luxury-warm-white rounded-xl p-4 border border-luxury-cream">
                                <div className="flex gap-0.5 flex-shrink-0">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-3.5 w-3.5 text-luxury-gold fill-current" />
                                    ))}
                                </div>
                                <p className="luxury-body text-luxury-charcoal/60 text-xs leading-relaxed italic">
                                    &quot;The face architecture section alone was worth three times the price.&quot; — Layla, Manchester
                                </p>
                            </div>
                        </div>

                        {/* Trust signals */}
                        <div className="bg-luxury-cream/40 border border-luxury-cream rounded-2xl p-5">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 luxury-body text-luxury-charcoal/60 text-sm">
                                    <Lock className="w-4 h-4 text-luxury-accent flex-shrink-0" />
                                    <span>🔒 256-bit SSL Encrypted — Your payment is completely secure.</span>
                                </div>
                                <div className="flex items-center gap-3 luxury-body text-luxury-charcoal/60 text-sm">
                                    <Shield className="w-4 h-4 text-luxury-accent flex-shrink-0" />
                                    <span>📩 Instant digital delivery — Blueprint arrives within 24 hours of intake.</span>
                                </div>
                                <div className="flex items-center gap-3 luxury-body text-luxury-charcoal/60 text-sm">
                                    <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0" />
                                    <span>✅ 30-day money-back guarantee — full refund, no questions.</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
