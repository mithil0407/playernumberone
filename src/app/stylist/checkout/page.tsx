'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, Lock, Clock, ArrowLeft } from 'lucide-react';
import { trackPageView, trackInitiateCheckout, updateUserData } from '@/lib/metaPixel';
import { getAttributionPayload } from '@/lib/attribution';

// ── Razorpay types ───────────────────────────────────────────────────────────

interface RazorpayOrderResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface RazorpayOrderOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayOrderResponse) => void;
    prefill: { name: string; email: string; contact: string };
    theme: { color: string };
}

interface RazorpaySubResponse {
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
}

interface RazorpaySubOptions {
    key: string;
    subscription_id: string;
    name: string;
    description: string;
    handler: (response: RazorpaySubResponse) => void;
    prefill: { name: string; email: string; contact: string };
    theme: { color: string };
    modal?: { ondismiss?: () => void };
}

interface RazorpayInstance { open(): void; }

declare const window: Window & {
    Razorpay?: new (opts: RazorpayOrderOptions | RazorpaySubOptions) => RazorpayInstance;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void;
};

const BLUEPRINT_PRICE = 149;
const BLUEPRINT_PRICE_WITH_EDIT = 110;
const EDIT_PRICE = 39;

type StylistEditCheckoutState =
    | 'not_selected'
    | 'selected_pending_setup'
    | 'selected_ready_to_authorize'
    | 'selected_setup_failed'
    | 'authorized'
    | 'declined';

interface StylistEditRetryContext {
    customer_email: string;
    customer_phone: string;
    customer_name: string;
    lead_id: string | null;
    order_id: string | null;
    plan_type: 'monthly';
    source: 'checkout';
    attribution: ReturnType<typeof getAttributionPayload>;
}

const EDIT_STATE_KEY = 'stylist_editState';
const EDIT_RETRY_CONTEXT_KEY = 'stylist_editRetryContext';
const EDIT_SETUP_ERROR_KEY = 'stylist_editSetupError';

function setStoredEditState(state: StylistEditCheckoutState) {
    localStorage.setItem(EDIT_STATE_KEY, state);
}

function editSetupMessage(data: { error?: string; error_code?: string }) {
    if (data.error_code === 'plan_not_configured') {
        return 'Your Blueprint is confirmed, but ICONIK Edit needs a payment plan configured before it can be authorized. Please contact support and we will activate it for you.';
    }
    if (data.error_code === 'razorpay_plan_invalid') {
        return 'Your Blueprint is confirmed, but the ICONIK Edit payment plan is not available in this Razorpay mode. Please contact support and we will activate it for you.';
    }
    return data.error || 'Your Blueprint is confirmed, but we could not set up ICONIK Edit yet. Please retry from this page.';
}

const COUNTRY_CODES = [
    { code: '+1', flag: '🇺🇸', label: 'US / Canada' },
    { code: '+44', flag: '🇬🇧', label: 'UK' },
    { code: '+91', flag: '🇮🇳', label: 'India' },
    { code: '+971', flag: '🇦🇪', label: 'UAE' },
    { code: '+61', flag: '🇦🇺', label: 'Australia' },
    { code: '+65', flag: '🇸🇬', label: 'Singapore' },
    { code: '+60', flag: '🇲🇾', label: 'Malaysia' },
    { code: '+33', flag: '🇫🇷', label: 'France' },
    { code: '+49', flag: '🇩🇪', label: 'Germany' },
    { code: '+39', flag: '🇮🇹', label: 'Italy' },
    { code: '+31', flag: '🇳🇱', label: 'Netherlands' },
    { code: '+974', flag: '🇶🇦', label: 'Qatar' },
    { code: '+966', flag: '🇸🇦', label: 'Saudi Arabia' },
];

// ── Edit Card ────────────────────────────────────────────────────────────────

function EditCard({ selected, onToggle }: { selected: boolean; onToggle: () => void }) {
    const editBullets = [
        'Weekly personalized style edit built on your Blueprint',
        '6 new outfit formulas every month',
        'Access to your ICONIK stylist — ask anything, anytime',
        'Shopping intelligence matched to your palette and geometry',
    ];

    return (
        <div className="mb-2">
            <div
                className={`relative border rounded-2xl p-5 transition-all duration-200 cursor-pointer ${
                    selected
                        ? 'border-luxury-accent bg-luxury-pink-bg shadow-md border-l-[3px]'
                        : 'border-luxury-cream bg-white shadow-sm border-l-[3px] border-l-luxury-accent/30 hover:border-l-luxury-accent/70 hover:shadow-md'
                }`}
                style={{ borderLeftColor: selected ? '#C9A96E' : 'rgba(201,169,110,0.3)' }}
                onClick={onToggle}
            >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-luxury-charcoal/50 mb-1">THE ICONIK EDIT</p>
                        <p className="luxury-body text-luxury-charcoal/60 text-xs font-semibold">
                            Add — <span className="text-luxury-accent">${EDIT_PRICE}/mo</span>
                        </p>
                    </div>
                    {/* Checkbox */}
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onToggle(); }}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            selected
                                ? 'bg-luxury-accent border-luxury-accent'
                                : 'bg-white border-luxury-charcoal/25 hover:border-luxury-accent/60'
                        }`}
                    >
                        {selected && (
                            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                                <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                </div>

                <div className="grid gap-2 mb-4">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-luxury-accent text-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] luxury-body shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5" />
                        86% add this
                    </div>
                    <div className="rounded-xl border border-luxury-accent/35 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-luxury-accent mb-1">Blueprint discount unlocked</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-luxury-charcoal/35 line-through luxury-heading text-xl">${BLUEPRINT_PRICE}</span>
                            <span className="text-luxury-accent luxury-heading text-3xl">${BLUEPRINT_PRICE_WITH_EDIT}</span>
                        </div>
                        <p className="luxury-body text-luxury-charcoal/60 text-xs mt-1">
                            Add THE ICONIK EDIT and your first month effectively pays for itself.
                        </p>
                    </div>
                </div>

                {/* Value prop */}
                <p className="luxury-body text-luxury-charcoal/80 text-sm leading-relaxed mb-4">
                    Your Blueprint tells you what works.<br />
                    Your Edit puts it to work — every week.
                </p>

                {/* Bullets */}
                <div className="space-y-2 mb-4">
                    {editBullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <span className="text-luxury-accent text-xs mt-0.5 flex-shrink-0">→</span>
                            <span className="luxury-body text-luxury-charcoal/70 text-xs leading-relaxed">{b}</span>
                        </div>
                    ))}
                </div>

                {/* Pricing footnote */}
                <p className="luxury-body text-luxury-charcoal/55 text-[11px] font-semibold">
                    Pay ${BLUEPRINT_PRICE_WITH_EDIT} for your Blueprint now, then authorize ${EDIT_PRICE}/month for your Edit.
                </p>
            </div>

        </div>
    );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function StylistCheckoutPage() {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+1');
    const [editSelected, setEditSelected] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        trackPageView('Stylist Checkout');
        trackInitiateCheckout(BLUEPRINT_PRICE, 1, 'ICONIK Style Blueprint', 'USD', 'Style Scan Funnel');
        window.fbq?.('trackCustom', 'checkout_started', { funnel: 'style_scan', amount: BLUEPRINT_PRICE });
        const savedEmail = localStorage.getItem('stylist_customerEmail') || '';
        const savedPhone = localStorage.getItem('stylist_customerPhone') || '';
        if (savedEmail) setEmail(savedEmail);
        if (savedPhone) {
            const matchedCountry = COUNTRY_CODES.find(country => savedPhone.startsWith(country.code));
            if (matchedCountry) {
                setCountryCode(matchedCountry.code);
                setPhone(savedPhone.slice(matchedCountry.code.length).trim());
            } else {
                setPhone(savedPhone);
            }
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
        const fullPhone = `${countryCode} ${phone}`.trim();

        if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
            setFormError('Please enter a valid phone number.');
            return;
        }

        updateUserData(email, fullPhone);
        setIsProcessing(true);

        const leadId = typeof window !== 'undefined' ? localStorage.getItem('style_scan_lead_id') : null;
        const rawScanPayload = typeof window !== 'undefined' ? localStorage.getItem('style_scan_result') : null;
        const checkoutBlueprintPrice = editSelected ? BLUEPRINT_PRICE_WITH_EDIT : BLUEPRINT_PRICE;

        try {
            const response = await fetch('/api/stylist-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: email.split('@')[0],
                    customer_email: email,
                    customer_phone: fullPhone,
                    amount: checkoutBlueprintPrice,
                    lead_id: leadId,
                    scan_payload: rawScanPayload ? JSON.parse(rawScanPayload) : null,
                    attribution: getAttributionPayload(),
                }),
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Payment initialisation failed');

            const initRazorpay = () => {
                const options: RazorpayOrderOptions = {
                    key: data.key,
                    amount: data.amount,
                    currency: 'USD',
                    name: 'ICONIK Style Intelligence',
                    description: 'ICONIK Style Blueprint',
                    order_id: data.razorpay_order_id,
                    handler: async (rzpResponse: RazorpayOrderResponse) => {
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
                                    customer_phone: fullPhone,
                                    customer_name: email.split('@')[0],
                                    amount: checkoutBlueprintPrice,
                                    lead_id: leadId,
                                    edit_selected: editSelected,
                                }),
                            });
                        } catch (err) {
                            console.warn('Could not confirm stylist payment in DB:', err);
                        }

                        localStorage.setItem('stylist_purchaseAmount', checkoutBlueprintPrice.toString());
                        localStorage.setItem('stylist_customerEmail', email);
                        localStorage.setItem('stylist_customerPhone', fullPhone);
                        localStorage.setItem('stylist_editSelected', editSelected.toString());
                        localStorage.removeItem('stylist_editPurchased');
                        localStorage.removeItem('stylist_editSubscriptionId');
                        localStorage.removeItem('stylist_editKey');
                        localStorage.removeItem(EDIT_SETUP_ERROR_KEY);

                        const successHref = `/stylist/checkout/success?payment_id=${rzpResponse.razorpay_payment_id}&email=${encodeURIComponent(email)}`;

                        // If Edit selected, create and open the subscription authorization immediately.
                        if (editSelected) {
                            const editRetryContext: StylistEditRetryContext = {
                                customer_email: email,
                                customer_phone: fullPhone,
                                customer_name: email.split('@')[0],
                                lead_id: leadId,
                                order_id: data.db_order_id && data.db_order_id !== 'mock-order-id' ? data.db_order_id : null,
                                plan_type: 'monthly',
                                source: 'checkout',
                                attribution: getAttributionPayload(),
                            };
                            setStoredEditState('selected_pending_setup');
                            localStorage.setItem(EDIT_RETRY_CONTEXT_KEY, JSON.stringify(editRetryContext));

                            try {
                                const subRes = await fetch('/api/stylist-edit-subscribe', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(editRetryContext),
                                });
                                const subData = await subRes.json();
                                if (subData.success && subData.subscription_id && subData.key) {
                                    localStorage.setItem('stylist_editSubscriptionId', subData.subscription_id);
                                    localStorage.setItem('stylist_editKey', subData.key);
                                    localStorage.removeItem(EDIT_SETUP_ERROR_KEY);
                                    setStoredEditState('selected_ready_to_authorize');
                                    window.fbq?.('trackCustom', 'edit_checkout_added', { funnel: 'style_scan' });

                                    let editModalCompleted = false;
                                    const subOptions: RazorpaySubOptions = {
                                        key: subData.key,
                                        subscription_id: subData.subscription_id,
                                        name: 'ICONIK Style Intelligence',
                                        description: `THE ICONIK EDIT — $${EDIT_PRICE}/month`,
                                        handler: async (subResponse: RazorpaySubResponse) => {
                                            editModalCompleted = true;
                                            try {
                                                await fetch('/api/stylist-edit-confirm', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        razorpay_subscription_id: subResponse.razorpay_subscription_id || subData.subscription_id,
                                                        razorpay_payment_id: subResponse.razorpay_payment_id || '',
                                                        customer_email: email,
                                                        customer_phone: fullPhone,
                                                        customer_name: email.split('@')[0],
                                                    }),
                                                });
                                            } catch (err) {
                                                console.warn('Could not confirm Stylist Edit subscription in DB:', err);
                                            }

                                            localStorage.setItem('stylist_editPurchased', 'true');
                                            localStorage.removeItem('stylist_editSubscriptionId');
                                            localStorage.removeItem('stylist_editKey');
                                            localStorage.removeItem(EDIT_SETUP_ERROR_KEY);
                                            localStorage.setItem('stylist_editSelected', 'false');
                                            setStoredEditState('authorized');
                                            window.fbq?.('trackCustom', 'edit_purchased', { funnel: 'style_scan', source: 'checkout_immediate' });
                                            window.location.href = successHref;
                                        },
                                        prefill: { name: email.split('@')[0], email, contact: fullPhone },
                                        theme: { color: '#C9A96E' },
                                        modal: {
                                            ondismiss: () => {
                                                if (editModalCompleted) return;
                                                window.location.href = successHref;
                                            },
                                        },
                                    };

                                    const editRzp = new window.Razorpay!(subOptions);
                                    editRzp.open();
                                    return;
                                } else {
                                    localStorage.setItem(EDIT_SETUP_ERROR_KEY, editSetupMessage(subData));
                                    setStoredEditState('selected_setup_failed');
                                }
                            } catch (err) {
                                const message = err instanceof Error ? err.message : 'Your Blueprint is confirmed, but we could not set up ICONIK Edit yet. Please retry from this page.';
                                localStorage.setItem(EDIT_SETUP_ERROR_KEY, message);
                                setStoredEditState('selected_setup_failed');
                                console.warn('Edit subscription creation failed:', err);
                            }
                        } else {
                            setStoredEditState('not_selected');
                            localStorage.removeItem(EDIT_RETRY_CONTEXT_KEY);
                        }

                        window.location.href = successHref;
                    },
                    prefill: { name: email.split('@')[0], email, contact: fullPhone },
                    theme: { color: '#C9A96E' },
                };

                const rzp = new window.Razorpay!(options);
                rzp.open();
                setIsProcessing(false);
            };

            if (razorpayLoaded && window.Razorpay) {
                initRazorpay();
            } else {
                const check = setInterval(() => {
                    if (window.Razorpay) { clearInterval(check); initRazorpay(); }
                }, 100);
                setTimeout(() => {
                    clearInterval(check);
                    if (!window.Razorpay) {
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
    }, [email, phone, countryCode, editSelected, razorpayLoaded]);

    const totalLabel = editSelected
        ? `Pay $${BLUEPRINT_PRICE_WITH_EDIT} now — then authorize $${EDIT_PRICE} Edit`
        : `Pay $${BLUEPRINT_PRICE} — Get My Blueprint`;

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
                        <span className="text-3xl md:text-5xl luxury-heading text-luxury-accent">
                            ${editSelected ? BLUEPRINT_PRICE_WITH_EDIT : BLUEPRINT_PRICE}
                        </span>
                    </div>
                    {editSelected && (
                        <p className="luxury-body text-luxury-charcoal/60 text-sm mb-3">
                            Pay ${BLUEPRINT_PRICE_WITH_EDIT} for your Blueprint now, then authorize THE ICONIK EDIT at ${EDIT_PRICE}/month.
                        </p>
                    )}
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

                {/* ── Edit Add-On Card ────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <EditCard selected={editSelected} onToggle={() => setEditSelected(s => !s)} />
                </motion.div>

                {/* Payment form */}
                <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    onSubmit={e => { e.preventDefault(); processPayment(); }}
                    className="bg-white border border-luxury-cream rounded-2xl p-6 space-y-5 mb-6 mt-7"
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
                        <div className="grid grid-cols-[128px_1fr] gap-2">
                            <select
                                value={countryCode}
                                onChange={e => setCountryCode(e.target.value)}
                                className="w-full px-3 py-3.5 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-sm bg-white luxury-body"
                                aria-label="Country code"
                            >
                                {COUNTRY_CODES.map(country => (
                                    <option key={country.code} value={country.code}>
                                        {country.flag} {country.code}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/[^\d\s()-]/g, ''))}
                                className="w-full px-4 py-3.5 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body"
                                placeholder="555 000 0000"
                                required
                            />
                        </div>
                        <p className="text-xs text-luxury-charcoal/40 mt-1 luxury-body">
                            Selected code: {COUNTRY_CODES.find(country => country.code === countryCode)?.flag} {countryCode}
                        </p>
                    </div>
                    {formError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm luxury-body">{formError}</div>
                    )}

                    {/* Order summary */}
                    {editSelected && (
                        <div className="bg-luxury-cream/30 rounded-xl p-4 space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-luxury-charcoal/40 mb-3">Order Summary</p>
                            <div className="flex justify-between luxury-body text-sm text-luxury-charcoal/70">
                                <span>ICONIK Style Blueprint</span>
                                <span className="font-semibold">${BLUEPRINT_PRICE_WITH_EDIT}</span>
                            </div>
                            <div className="flex justify-between luxury-body text-sm text-luxury-charcoal/70">
                                <span>THE ICONIK EDIT authorization</span>
                                <span className="font-semibold">${EDIT_PRICE}/mo</span>
                            </div>
                            <div className="border-t border-luxury-cream pt-2 flex justify-between luxury-body text-sm">
                                <span className="text-luxury-charcoal/50">First-day total across both steps</span>
                                <span className="text-luxury-charcoal font-semibold">${BLUEPRINT_PRICE}</span>
                            </div>
                            <p className="luxury-body text-luxury-charcoal/45 text-[11px] leading-relaxed">
                                Razorpay will open twice: first for the ${BLUEPRINT_PRICE_WITH_EDIT} Blueprint payment, then for the ${EDIT_PRICE}/month Edit authorization.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full bg-luxury-accent hover:bg-luxury-accent/80 disabled:opacity-60 disabled:cursor-not-allowed text-luxury-warm-white py-4 text-base font-semibold luxury-body rounded-full transition-all duration-300 hover:shadow-lg"
                    >
                        {isProcessing ? 'Opening payment…' : totalLabel}
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
                    transition={{ delay: 0.3 }}
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
