'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Shield, Clock, Mail } from 'lucide-react';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { trackPageView, trackPurchase, trackViewContent, trackInitiateCheckout } from '@/lib/metaPixel';

// ── Razorpay types for subscription ─────────────────────────────────────────

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
    prefill: { name: string; email: string; contact: string };
    theme: { color: string };
}

// ── Plan copy ────────────────────────────────────────────────────────────────

const PLANS = {
    monthly: {
        label: 'Monthly',
        price: '$19',
        period: '/month',
        sub: 'Billed monthly · Cancel anytime',
        amount: 1900,
        highlights: [
            '5 personalised outfit formulas every month',
            'Built on YOUR Blueprint — not generic trends',
            'Season-calibrated for Australia',
            'Occasion-tagged (Office, Weekend, Event, Travel)',
            'Monthly shopping shortlist',
            'Cancel by email, processed in 24 hours',
        ],
        cta: 'Yes — Add My Style Feed · AUD $19/month',
    },
    annual: {
        label: 'Annual',
        price: '$168',
        period: '/year',
        sub: 'Less than $14/month · Save AUD $60',
        amount: 16800,
        highlights: [
            '5 personalised outfit formulas every month',
            'Built on YOUR Blueprint — not generic trends',
            'Season-calibrated for Australia',
            'Occasion-tagged (Office, Weekend, Event, Travel)',
            'Monthly shopping shortlist',
            '30-day full refund guarantee',
        ],
        cta: 'Yes — Add My Style Feed · AUD $168/year',
    },
};

// ── What you get tiles ───────────────────────────────────────────────────────

const FEED_TILES = [
    { num: '01', title: '5 Monthly Outfit Formulas', body: 'Built on your exact Blueprint. Combinations proven to work for your body geometry, colour profile, and facial architecture.' },
    { num: '02', title: 'Season-Calibrated', body: 'Australian summer, autumn, winter, spring — right fabrics, right colours, right combinations for your climate.' },
    { num: '03', title: 'Inbox Delivery', body: 'No app. No login. Arrives in your email on the 1st of every month. Open, read, dress better.' },
    { num: '04', title: 'Occasion-Tagged', body: 'Every formula tagged: Office, Weekend, Event, Travel. You know immediately which applies.' },
    { num: '05', title: 'Monthly Shopping Shortlist', body: '3–5 specific item types each month, aligned to your Blueprint — so every purchase serves the system.' },
    { num: '06', title: 'Cancel Anytime', body: 'One email. No forms. We earn your subscription every month.' },
];

// ── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
    {
        q: '"I\'ll think about it and sign up later."',
        a: 'This offer is only on this page. Once you close it, the Style Feed is available at a higher rate if you choose to return.',
    },
    {
        q: '"I don\'t shop every month."',
        a: 'You don\'t have to buy every outfit. Think of this as a styled lookbook that\'s shoppable when you need it. Wedding invite? Office promotion? It\'s already curated.',
    },
    {
        q: '"What if my style preferences change?"',
        a: 'Your Blueprint evolves with you. After 6 months, we\'ll refresh the direction if needed — just reply to any feed email.',
    },
];

// ── Core component ───────────────────────────────────────────────────────────

function ThankYouContent() {
    const params = useSearchParams();
    const paymentId = params.get('payment_id') || '';
    const amount = params.get('amount') || '97';
    const email = params.get('email') || '';
    const phone = params.get('phone') || '';

    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [completedPlan, setCompletedPlan] = useState<string | null>(null);

    // Derive email/phone (URL params first, then localStorage)
    const customerEmail = email || (typeof window !== 'undefined' ? localStorage.getItem('au_customerEmail') || '' : '');
    const customerPhone = phone || (typeof window !== 'undefined' ? localStorage.getItem('au_customerPhone') || '' : '');

    // Track purchase + upsell view on mount
    useEffect(() => {
        trackPageView('AU Thank You');
        trackPurchase(
            parseFloat(amount) || 97,
            'ICONIK Blueprint AU',
            ['iconik_blueprint_au'],
            1,
            'AUD',
            'AU Funnel',
            paymentId || undefined
        );
        trackViewContent(
            'ICONIK Style Feed — AU OTO',
            19,
            ['iconik_style_feed_au'],
            'AUD',
            'AU OTO'
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Preload Razorpay
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

    const handleSubscription = useCallback(async (planType: 'monthly' | 'annual') => {
        setIsProcessing(true);

        const plan = PLANS[planType];

        trackInitiateCheckout(
            plan.amount / 100,
            1,
            `ICONIK Style Feed AU — ${plan.label}`,
            'AUD',
            'AU OTO'
        );

        try {
            const response = await fetch('/api/au-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_type: planType,
                    customer_email: customerEmail,
                    customer_phone: customerPhone,
                    customer_name: customerEmail.split('@')[0],
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to create subscription');
            }

            const options: RazorpaySubscriptionOptions = {
                key: data.key,
                subscription_id: data.subscription_id,
                name: 'ICONIK Style Intelligence',
                description: `ICONIK Style Feed — ${plan.label}`,
                image: `${window.location.origin}/logopayment.webp`,
                handler: (rzpResponse: RazorpaySubscriptionResponse) => {
                    // Track purchase with Meta Pixel
                    trackPurchase(
                        plan.amount / 100,
                        `ICONIK Style Feed AU — ${plan.label}`,
                        ['iconik_style_feed_au'],
                        1,
                        'AUD',
                        'AU OTO',
                        rzpResponse.razorpay_payment_id
                    );
                    localStorage.setItem('au_styleFeedSubscriptionId', rzpResponse.razorpay_subscription_id);
                    localStorage.setItem('au_styleFeedPlan', planType);
                    setCompletedPlan(planType);
                    // Scroll to top confirmation
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                prefill: {
                    name: customerEmail.split('@')[0],
                    email: customerEmail,
                    contact: customerPhone,
                },
                theme: { color: '#ff6b9d' },
            };

            if (razorpayLoaded && (window as unknown as { Razorpay?: unknown }).Razorpay) {
                const rzp = new (window as unknown as { Razorpay: new (opts: RazorpaySubscriptionOptions) => { open(): void } }).Razorpay(options);
                rzp.open();
            } else {
                throw new Error('Payment system not loaded. Please refresh and try again.');
            }

        } catch (error) {
            console.error('AU subscription error:', error);
            alert(error instanceof Error ? error.message : 'Failed to start subscription. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }, [customerEmail, customerPhone, razorpayLoaded]);

    // ── Post-subscription success state ─────────────────────────────────────
    if (completedPlan) {
        return (
            <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden flex flex-col">
                <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream py-4 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center px-4 py-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-lg w-full mx-auto text-center"
                    >
                        <div className="w-20 h-20 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                            <div className="absolute inset-0 bg-luxury-accent rounded-full opacity-20 animate-ping" />
                            <CheckCircle className="w-10 h-10 text-luxury-accent relative z-10" />
                        </div>
                        <h1 className="text-3xl md:text-4xl luxury-heading text-luxury-charcoal mb-4">Style Feed Added</h1>
                        <p className="luxury-body text-luxury-charcoal/70 mb-6 leading-relaxed">
                            Your first Style Feed arrives on the 1st of next month. Check your inbox for confirmation.
                        </p>
                        <a
                            href="/au/intake"
                            className="inline-flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-5 rounded-full text-base font-semibold luxury-body tracking-wide transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform"
                        >
                            Continue to Intake Form <ArrowRight className="w-5 h-5" />
                        </a>
                    </motion.div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden">

            {/* ── SECTION 1: Confirmation bar ────────────────────────────── */}
            <div className="bg-luxury-charcoal text-luxury-warm-white py-2.5 px-4 text-center">
                <p className="luxury-body text-xs tracking-widest uppercase">
                    ✓ Your ICONIK Blueprint is confirmed · Delivery within 24 hours to your inbox
                </p>
            </div>

            {/* ── SECTION 2: Logo header ─────────────────────────────────── */}
            <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream py-4 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                </div>
            </header>

            {/* ── SECTION 3: Hero headline ───────────────────────────────── */}
            <section className="pt-14 pb-12 px-4 text-center bg-luxury-warm-white">
                <div className="max-w-2xl mx-auto">
                    <p className="luxury-body text-luxury-charcoal/50 text-xs tracking-widest uppercase mb-5">
                        One moment before you go
                    </p>
                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl luxury-heading text-luxury-charcoal mb-6 leading-[1.0]"
                    >
                        Your Blueprint works.<br />
                        <span className="text-luxury-accent">Most women stop using it.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="luxury-body text-luxury-charcoal/70 text-lg leading-relaxed"
                    >
                        The system you just purchased identifies your exact geometry, colour profile, and silhouette rules.
                        But style decisions happen every month — new season, new shopping trip, new occasion.
                        The Blueprint answers the big question.{' '}
                        <strong className="text-luxury-charcoal">The Style Feed answers every question after that.</strong>
                    </motion.p>
                </div>
            </section>

            {/* ── SECTION 4: Problem strip ───────────────────────────────── */}
            <section className="py-14 px-4 bg-luxury-cream/30">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            {
                                icon: '🗓️',
                                title: 'Seasons change',
                                body: 'New silhouette combinations, new colour pairings, new occasions. Your Blueprint is permanent — the application needs refreshing every season.',
                            },
                            {
                                icon: '🛍️',
                                title: 'Shopping decisions don\'t wait',
                                body: 'A sale, a new job, a dinner. You need outfit formulas on demand, not one document you have to re-interpret every single time.',
                            },
                            {
                                icon: '🔄',
                                title: 'Habits revert without a system',
                                body: 'Without a monthly prompt, most women return to their old pattern within 60 days. The Style Feed is the prompt that keeps the Blueprint alive.',
                            },
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="p-6 bg-luxury-warm-white border border-luxury-cream rounded-2xl"
                            >
                                <div className="text-3xl mb-3">{card.icon}</div>
                                <h3 className="luxury-heading text-luxury-charcoal text-lg mb-2">{card.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed">{card.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 5: What you get ────────────────────────────────── */}
            <section className="py-14 px-4 bg-luxury-warm-white">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <p className="luxury-body text-luxury-charcoal/50 text-xs tracking-widest uppercase mb-3">The ICONIK Style Feed</p>
                        <h2 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal">What you get every month</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {FEED_TILES.map((tile, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                className="p-5 bg-luxury-cream/40 border border-luxury-cream rounded-xl hover:bg-luxury-cream/60 transition-all duration-300"
                            >
                                <div className="text-3xl luxury-heading text-luxury-accent/20 mb-2">{tile.num}</div>
                                <h3 className="luxury-heading text-luxury-charcoal text-base mb-1.5">{tile.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed">{tile.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 6: Sample preview ──────────────────────────────── */}
            <section className="py-14 px-4 bg-luxury-cream/20">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8 items-center bg-luxury-warm-white border border-luxury-cream rounded-3xl p-6 md:p-10">
                        {/* Left: flat-lay image placeholder */}
                        <div className="aspect-[4/5] bg-luxury-cream/50 rounded-2xl overflow-hidden flex items-center justify-center border border-luxury-cream">
                            <div className="text-center px-6">
                                <div className="text-4xl mb-3">👗</div>
                                <p className="luxury-body text-luxury-charcoal/40 text-xs tracking-wider uppercase">Sample Outfit Flat-Lay</p>
                            </div>
                        </div>

                        {/* Right: breakdown */}
                        <div>
                            <p className="luxury-body text-luxury-accent text-xs tracking-widest uppercase mb-4 font-semibold">
                                March Style Feed · Your Blueprint Applied
                            </p>
                            <h3 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-4">
                                Autumn Formula 02:<br />The Structured Casual
                            </h3>
                            <p className="luxury-body text-luxury-charcoal/70 text-sm leading-relaxed mb-6">
                                Geometric silhouette correction for your profile.
                                Chromatic anchor: Warm Terracotta + Deep Navy.
                                Tagged for Office → Evening transition.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['Straight-leg trouser', 'Draped blazer', 'V-neck blouse', 'Block heel'].map((tag) => (
                                    <span
                                        key={tag}
                                        className="luxury-body text-luxury-charcoal/70 text-xs border border-luxury-cream bg-luxury-cream/50 px-3 py-1.5 rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECTION 7: Pricing ─────────────────────────────────────── */}
            <section className="py-14 px-4 bg-luxury-warm-white" id="pricing">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <p className="luxury-body text-luxury-charcoal/50 text-xs tracking-widest uppercase mb-3">The ICONIK Style Feed</p>
                        <h2 className="text-3xl md:text-4xl luxury-heading text-luxury-charcoal mb-3">
                            Choose how you want your Blueprint to keep working
                        </h2>
                        <p className="luxury-body text-luxury-charcoal/60 max-w-xl mx-auto text-sm leading-relaxed">
                            Monthly flexibility or annual simplicity — same 5 formulas every month, same system.
                            Annual means you decide once and never think about it again.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 mb-8">
                        {/* Monthly card */}
                        <div className="bg-luxury-warm-white border-2 border-luxury-cream rounded-2xl p-6 md:p-8">
                            <div className="luxury-body text-luxury-charcoal/50 text-xs tracking-widest uppercase mb-4">{PLANS.monthly.label}</div>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-4xl luxury-heading text-luxury-charcoal">AUD&nbsp;{PLANS.monthly.price}</span>
                                <span className="luxury-body text-luxury-charcoal/50">{PLANS.monthly.period}</span>
                            </div>
                            <p className="luxury-body text-luxury-charcoal/50 text-xs mb-6">{PLANS.monthly.sub}</p>
                            <ul className="space-y-2.5 mb-8">
                                {PLANS.monthly.highlights.map((item) => (
                                    <li key={item} className="flex items-start gap-2.5">
                                        <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal/70 text-sm">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleSubscription('monthly')}
                                disabled={isProcessing}
                                className="w-full bg-luxury-charcoal hover:bg-luxury-charcoal/80 text-luxury-warm-white py-4 px-5 rounded-full luxury-body font-semibold tracking-wide transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                            >
                                {isProcessing ? 'Processing...' : (<>{PLANS.monthly.cta} <ArrowRight className="w-4 h-4" /></>)}
                            </button>
                        </div>

                        {/* Annual card — featured */}
                        <div className="relative bg-luxury-charcoal border-2 border-luxury-accent rounded-2xl p-6 md:p-8 shadow-2xl">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-luxury-accent text-luxury-warm-white px-5 py-1 rounded-full text-xs font-bold luxury-body tracking-widest uppercase">
                                Best Value · Save 26%
                            </div>
                            <div className="luxury-body text-luxury-warm-white/50 text-xs tracking-widest uppercase mb-4 mt-2">{PLANS.annual.label}</div>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-4xl luxury-heading text-luxury-warm-white">AUD&nbsp;{PLANS.annual.price}</span>
                                <span className="luxury-body text-luxury-warm-white/50">{PLANS.annual.period}</span>
                            </div>
                            <p className="luxury-body text-luxury-accent text-xs mb-6 font-semibold">{PLANS.annual.sub}</p>
                            <ul className="space-y-2.5 mb-8">
                                {PLANS.annual.highlights.map((item) => (
                                    <li key={item} className="flex items-start gap-2.5">
                                        <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-warm-white/80 text-sm">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleSubscription('annual')}
                                disabled={isProcessing}
                                className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white py-4 px-5 rounded-full luxury-body font-semibold tracking-wide transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg"
                            >
                                {isProcessing ? 'Processing...' : (<>{PLANS.annual.cta} <ArrowRight className="w-4 h-4" /></>)}
                            </button>
                        </div>
                    </div>

                    {/* Skip link */}
                    <div className="text-center mb-4">
                        <a
                            href="/au/intake"
                            className="luxury-body text-luxury-charcoal/40 hover:text-luxury-charcoal/70 text-sm transition-colors underline underline-offset-4"
                        >
                            No thanks — I&apos;ll style myself from the Blueprint only →
                        </a>
                    </div>
                    <p className="text-center luxury-body text-luxury-charcoal/40 text-xs leading-relaxed">
                        Your Blueprint delivery is not affected by this decision. No new account required.<br />
                        Subscription charged separately. Cancel by email — processed within 24 hours.
                    </p>
                </div>
            </section>

            {/* ── SECTION 8: Price anchor ────────────────────────────────── */}
            <section className="py-12 px-4 bg-luxury-cream/30">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-luxury-warm-white border-l-4 border-luxury-accent rounded-2xl p-6 md:p-8">
                        <p className="luxury-body text-luxury-charcoal/80 leading-relaxed">
                            <strong className="text-luxury-charcoal">
                                A single in-person styling session in Sydney costs AUD $200–$400.
                            </strong>{' '}
                            It happens once and gives you someone&apos;s opinion for that day.
                            The Style Feed gives you your Blueprint applied fresh, every month,
                            for less than a coffee per week.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── SECTION 9: FAQ ─────────────────────────────────────────── */}
            <section className="py-12 px-4 bg-luxury-warm-white">
                <div className="max-w-2xl mx-auto space-y-3">
                    {FAQS.map((faq, i) => (
                        <div
                            key={i}
                            className="bg-luxury-cream/40 border border-luxury-cream rounded-xl p-5 cursor-pointer hover:bg-luxury-cream/60 transition-all duration-300"
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <p className="luxury-body text-luxury-charcoal font-semibold text-sm">{faq.q}</p>
                                <span className="text-luxury-accent font-bold text-xl flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                            </div>
                            {openFaq === i && (
                                <p className="luxury-body text-luxury-charcoal/60 text-sm mt-3 pt-3 border-t border-luxury-cream leading-relaxed">
                                    {faq.a}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── SECTION 10: Trust badges ───────────────────────────────── */}
            <section className="py-10 px-4 bg-luxury-cream/20 border-t border-luxury-cream">
                <div className="max-w-3xl mx-auto">
                    <div className="flex flex-wrap justify-center gap-6">
                        {[
                            { icon: <Shield className="w-4 h-4" />, label: 'Stripe Secure' },
                            { icon: <CheckCircle className="w-4 h-4" />, label: 'Instant Confirmation' },
                            { icon: <Clock className="w-4 h-4" />, label: '30-Day Refund (Annual)' },
                            { icon: <Mail className="w-4 h-4" />, label: 'Cancel by Email Anytime' },
                        ].map((badge) => (
                            <div key={badge.label} className="flex items-center gap-2 luxury-body text-luxury-charcoal/50 text-xs">
                                <span className="text-luxury-accent">{badge.icon}</span>
                                {badge.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Next step banner (after OTO) ───────────────────────────── */}
            <section className="py-10 px-4 bg-luxury-warm-white border-t border-luxury-cream">
                <div className="max-w-lg mx-auto text-center">
                    <Mail className="w-8 h-8 text-luxury-accent mx-auto mb-3" />
                    <h3 className="luxury-heading text-luxury-charcoal text-xl mb-2">Your Blueprint is being prepared</h3>
                    <p className="luxury-body text-luxury-charcoal/60 text-sm mb-1">
                        We&apos;ve sent a confirmation email with all your order details and next steps.
                    </p>
                    <p className="luxury-body text-luxury-charcoal/40 text-xs mb-6">
                        Can&apos;t find it? Check your <strong className="text-luxury-charcoal/60">spam or junk folder</strong> — it may have landed there.
                    </p>
                    {paymentId && (
                        <p className="luxury-body text-luxury-charcoal/30 text-xs mb-6 tracking-wider">
                            REF: {paymentId} · AUD ${amount}
                        </p>
                    )}
                    <a
                        href="/au/intake"
                        className="inline-flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-5 rounded-full text-base font-semibold luxury-body tracking-wide transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform"
                    >
                        Complete My Intake Form <ArrowRight className="w-5 h-5" />
                    </a>
                    <p className="luxury-body text-luxury-charcoal/40 text-xs mt-5">
                        Takes 4 minutes · Blueprint delivered within 24 hours
                    </p>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <footer className="py-6 px-6 bg-luxury-cream/20 text-center border-t border-luxury-cream">
                <p className="luxury-body text-luxury-charcoal/40 text-xs">
                    ICONIK Style Intelligence System · Australia · 2026
                </p>
            </footer>

        </div>
    );
}

// ── Export ───────────────────────────────────────────────────────────────────

export default function AUThankYouPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center luxury-body text-luxury-charcoal/50">
                Loading...
            </div>
        }>
            <ThankYouContent />
        </Suspense>
    );
}
