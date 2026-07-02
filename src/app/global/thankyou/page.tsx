'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Star, Sparkles, Shield, Clock } from 'lucide-react';
import { trackPageView, trackCompleteRegistration } from '@/lib/metaPixel';
import { getAttributionPayload } from '@/lib/attribution';

// ── Razorpay types ───────────────────────────────────────────────────────────

interface RazorpaySubResponse {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
}

interface RazorpaySubOptions {
    key: string;
    subscription_id: string;
    name: string;
    description: string;
    handler: (response: RazorpaySubResponse) => void;
    prefill: { email: string; contact: string };
    theme: { color: string };
}

interface RazorpayInstance { open(): void; }

// ── Plans ────────────────────────────────────────────────────────────────────

const PLANS = {
    monthly: {
        label: 'Monthly',
        price: 19,
        period: '/month',
        total: null as null | number,
        savings: null as null | string,
        highlight: false,
    },
    annual: {
        label: 'Annual',
        price: 14,
        period: '/month',
        total: 168,
        savings: '2 months free',
        highlight: true,
    },
};

// ── Inner component ─────────────────────────────────────────────────────────

function GlobalThankyouInner() {
    const searchParams = useSearchParams();
    const paymentId = searchParams.get('payment_id') || '';
    const orderAmount = parseInt(searchParams.get('amount') || '119', 10);
    const rawEmail = searchParams.get('email') || '';
    const rawPhone = searchParams.get('phone') || '';

    const email = rawEmail || (typeof window !== 'undefined' ? localStorage.getItem('global_customerEmail') : '') || '';
    const phone = rawPhone || (typeof window !== 'undefined' ? localStorage.getItem('global_customerPhone') : '') || '';

    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
    const [subscribeError, setSubscribeError] = useState('');

    useEffect(() => {
        trackPageView('Global Thankyou');
        const tracked = sessionStorage.getItem('global_purchaseTracked');
        if (!tracked) trackCompleteRegistration(orderAmount, 'ICONIK Blueprint Global', 'USD');
    }, [orderAmount]);

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

    useEffect(() => {
        if (document.querySelector('script[src*="razorpay.com"]')) { setRazorpayLoaded(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRazorpayLoaded(true);
        document.body.appendChild(script);
        return () => { if (script.parentNode) script.parentNode.removeChild(script); };
    }, []);

    const handleSubscribe = useCallback(async () => {
        setSubscribeError('');
        setIsSubscribing(true);

        try {
            const response = await fetch('/api/global-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_type: selectedPlan,
                    customer_email: email,
                    customer_phone: phone,
                    customer_name: '',
                    attribution: getAttributionPayload(),
                }),
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Subscription creation failed');

            const openRazorpay = () => {
                const options: RazorpaySubOptions = {
                    key: data.key,
                    subscription_id: data.subscription_id,
                    name: 'ICONIK Style Intelligence',
                    description: `ICONIK Style Feed — ${selectedPlan === 'monthly' ? '$19/month' : '$168/year'}`,
                    handler: async (rzpRes: RazorpaySubResponse) => {
                        console.log('Global Style Feed subscription activated:', rzpRes);
                        window.location.href = `/stylist/intake?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&subscribed=true`;
                    },
                    prefill: { email, contact: phone },
                    theme: { color: '#ff6b9d' },
                };
                const rzp = new (window as unknown as { Razorpay: new (opts: RazorpaySubOptions) => RazorpayInstance }).Razorpay(options);
                rzp.open();
                setIsSubscribing(false);
            };

            if (razorpayLoaded && (window as unknown as { Razorpay?: unknown }).Razorpay) {
                openRazorpay();
            } else {
                const check = setInterval(() => {
                    if ((window as unknown as { Razorpay?: unknown }).Razorpay) { clearInterval(check); openRazorpay(); }
                }, 100);
                setTimeout(() => { clearInterval(check); setIsSubscribing(false); }, 10000);
            }

        } catch (err) {
            console.error('Global subscription error:', err);
            setIsSubscribing(false);
            setSubscribeError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        }
    }, [selectedPlan, email, phone, razorpayLoaded]);

    const intakeUrl = `/stylist/intake?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">

            {/* Header */}
            <header className="bg-luxury-warm-white border-b border-luxury-cream py-4 px-6 text-center">
                <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">

                {/* ── Confirmed banner ──────────────────────────────────── */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-5 py-2.5 rounded-full text-sm luxury-body mb-6 font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        Payment Confirmed · Blueprint in Production
                    </div>
                    <h1 className="text-4xl md:text-6xl luxury-heading text-luxury-charcoal mb-4 leading-tight">
                        Welcome to<br />
                        <span className="text-luxury-accent">ICONIK.</span>
                    </h1>
                    <p className="luxury-body text-luxury-charcoal/70 text-lg max-w-xl mx-auto leading-relaxed">
                        Your Blueprint is reserved. Before we begin building it, we have one last question — and it&apos;s our best offer of the year.
                    </p>
                    {paymentId && (
                        <p className="luxury-body text-luxury-charcoal/40 text-xs mt-3">Payment ref: {paymentId}</p>
                    )}
                </div>

                {/* ── Next Steps Banner ─────────────────────────────────── */}
                <div className="bg-luxury-cream/30 border border-luxury-cream rounded-2xl p-6 md:p-8 mb-8">
                    <h3 className="luxury-heading text-luxury-charcoal text-xl mb-4 text-center">
                        One Step Left to Unlock Your Blueprint
                    </h3>
                    <div className="space-y-3 mb-6">
                        {[
                            { num: '1', text: 'Complete your intake form (4 minutes, 9 questions + 2 photos)' },
                            { num: '2', text: 'Our stylists analyse your geometry, colour, and facial profile' },
                            { num: '3', text: 'Your 12–18 page personalised Blueprint lands in your inbox within 24 hours' },
                        ].map((s) => (
                            <div key={s.num} className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-luxury-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="luxury-body text-luxury-accent text-xs font-bold">{s.num}</span>
                                </div>
                                <span className="luxury-body text-luxury-charcoal/80 text-sm leading-relaxed">{s.text}</span>
                            </div>
                        ))}
                    </div>
                    <Link
                        href={intakeUrl}
                        className="w-full block text-center bg-luxury-charcoal hover:bg-luxury-charcoal/80 text-luxury-warm-white py-4 px-6 rounded-full luxury-body font-semibold transition-all duration-300 hover:-translate-y-0.5 transform"
                    >
                        Complete My Intake Form →
                    </Link>
                    <p className="luxury-body text-luxury-charcoal/40 text-xs text-center mt-3">
                        Takes 4 minutes · Blueprint delivered within 24 hours of completion
                    </p>
                </div>

                {/* ── OTO: Style Feed ───────────────────────────────────── */}
                <div className="bg-luxury-cream/40 border-2 border-luxury-accent/20 rounded-3xl p-6 md:p-10 mb-8">

                    {/* Urgency bar */}
                    <div className="bg-luxury-accent/10 border border-luxury-accent/20 rounded-xl p-3 mb-8 text-center">
                        <div className="flex items-center justify-center gap-2 luxury-body text-luxury-accent font-semibold text-sm">
                            <Clock className="w-4 h-4" />
                            <span>One-Time Offer — {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')} remaining</span>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <p className="luxury-body text-luxury-charcoal/50 text-xs tracking-widest uppercase mb-2">Exclusive Blueprint Customer Offer</p>
                        <h2 className="text-3xl md:text-4xl luxury-heading text-luxury-charcoal mb-3">
                            The ICONIK Style Feed
                        </h2>
                        <p className="luxury-body text-luxury-charcoal/70 text-lg leading-relaxed max-w-2xl mx-auto">
                            A monthly styling intelligence update built on <em>your exact Blueprint</em>. Every month: 3 new outfit formulas, updated colour coordinates, curated shopping edits, and seasonal calibration — all personalised to your profile.
                        </p>
                    </div>

                    {/* Feed highlights */}
                    <div className="grid md:grid-cols-2 gap-3 mb-8">
                        {[
                            { icon: '🎨', title: 'Seasonal Colour Updates', desc: 'Monthly palette refreshes calibrated for your undertone and the season.' },
                            { icon: '👗', title: '3 New Outfit Formulas', desc: 'Fresh outfit combinations built specifically for your Blueprint — not generic style advice.' },
                            { icon: '🛒', title: 'Curated Shopping Edits', desc: 'Exact items at every price point that match your body, colour, and style profile.' },
                            { icon: '⚡', title: 'Trend Filters', desc: 'We filter current trends through your Blueprint so you only see what works for you.' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-3 bg-luxury-warm-white rounded-xl p-4 border border-luxury-cream">
                                <span className="text-xl flex-shrink-0">{item.icon}</span>
                                <div>
                                    <div className="luxury-heading text-luxury-charcoal text-sm mb-1">{item.title}</div>
                                    <div className="luxury-body text-luxury-charcoal/60 text-xs leading-relaxed">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sample preview */}
                    <div className="bg-luxury-charcoal rounded-2xl p-5 mb-8">
                        <div className="luxury-body text-luxury-warm-white/50 text-xs tracking-widest uppercase mb-3">Sample · March 2026 Feed</div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-luxury-gold" />
                                <span className="luxury-body text-luxury-warm-white text-sm">Your Blueprint Applied — Spring Refresh</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-luxury-gold" />
                                <span className="luxury-body text-luxury-warm-white text-sm">3 new outfit formulas for your silhouette type</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-luxury-gold" />
                                <span className="luxury-body text-luxury-warm-white text-sm">What&apos;s trending that works for your palette — and what doesn&apos;t</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-luxury-gold" />
                                <span className="luxury-body text-luxury-warm-white text-sm">Shopping edit: 12 exact pieces across all price points</span>
                            </div>
                        </div>
                    </div>

                    {/* Price anchor */}
                    <div className="text-center mb-6">
                        <p className="luxury-body text-luxury-charcoal/60 text-sm mb-2">
                            Personal stylists charge $500–$2,000/month for this level of ongoing guidance.
                        </p>
                        <p className="luxury-body text-luxury-charcoal font-semibold text-sm">
                            ICONIK Style Feed: from $14/month.
                        </p>
                    </div>

                    {/* Plan toggle */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {(['monthly', 'annual'] as const).map((plan) => {
                            const p = PLANS[plan];
                            return (
                                <div
                                    key={plan}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 relative ${selectedPlan === plan
                                        ? 'border-luxury-accent bg-luxury-accent/5'
                                        : 'border-luxury-cream bg-luxury-warm-white hover:border-luxury-accent/40'
                                        }`}
                                >
                                    {p.highlight && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-luxury-accent text-luxury-warm-white text-xs luxury-body px-3 py-0.5 rounded-full whitespace-nowrap">
                                            Best Value
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <div className="luxury-heading text-luxury-charcoal text-sm mb-1">{p.label}</div>
                                        <div className="text-2xl luxury-heading text-luxury-accent">${p.price}<span className="text-sm luxury-body text-luxury-charcoal/50">/mo</span></div>
                                        {p.total && <div className="luxury-body text-luxury-charcoal/50 text-xs mt-1">${p.total}/year</div>}
                                        {p.savings && <div className="luxury-body text-luxury-accent text-xs font-semibold mt-1">{p.savings}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Star reviews */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-luxury-gold fill-current" />)}
                        <span className="luxury-body text-luxury-charcoal/60 text-sm">4.9/5 across 200+ subscribers</span>
                    </div>

                    {subscribeError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 luxury-body text-red-700 text-sm text-center mb-4">
                            {subscribeError}
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        onClick={handleSubscribe}
                        disabled={isSubscribing}
                        className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white py-4 px-6 rounded-full luxury-body font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5 transform flex items-center justify-center gap-2 text-base mb-3"
                    >
                        {isSubscribing ? 'Processing...' : `YES — ADD STYLE FEED (${selectedPlan === 'monthly' ? '$19/month' : '$168/year'})`}
                    </button>

                    <div className="flex items-center justify-center gap-2 luxury-body text-luxury-charcoal/50 text-xs">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Cancel anytime · No lock-in</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ── Page export ──────────────────────────────────────────────────────────────

export default function GlobalThankyouPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <GlobalThankyouInner />
        </Suspense>
    );
}
