'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Lock, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { trackInitiateCheckout, trackPurchase, updateUserData } from '@/lib/metaPixel';
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
    modal?: { ondismiss?: () => void };
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
        return 'ICONIK Edit is temporarily unavailable. Please contact support or deselect Edit to buy the Blueprint at its regular price.';
    }
    if (data.error_code === 'razorpay_plan_invalid') {
        return 'The ICONIK Edit payment plan is unavailable. Please contact support or deselect Edit to buy the Blueprint at its regular price.';
    }
    return data.error || 'We could not set up ICONIK Edit. Please retry or deselect Edit to buy the Blueprint at its regular price.';
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
        <div
            className="rounded-2xl p-5 transition-all duration-200 cursor-pointer border"
            style={{
                background: selected ? 'var(--luxury-cream)' : 'var(--luxury-warm-white)',
                borderColor: selected ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)',
            }}
            onClick={onToggle}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <div className="iconik-micro text-luxury-charcoal/40 mb-1.5">The ICONIK Edit</div>
                    <div className="iconik-display text-luxury-charcoal" style={{ fontSize: '20px' }}>
                        ${EDIT_PRICE}<span className="luxury-body text-luxury-charcoal/40" style={{ fontSize: '12px', fontWeight: 300 }}>/mo</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onToggle(); }}
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all"
                    style={{
                        background: selected ? 'var(--luxury-charcoal)' : 'transparent',
                        borderColor: selected ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)',
                    }}
                >
                    {selected && (
                        <svg width="10" height="8" viewBox="0 0 12 9" fill="none">
                            <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Discount panel */}
            <div className="rounded-xl p-4 mb-4 border" style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}>
                <div className="iconik-micro text-luxury-accent mb-2">Blueprint discount after Edit confirmation</div>
                <div className="flex items-baseline gap-2">
                    <span className="iconik-display text-luxury-charcoal/25 line-through" style={{ fontSize: '18px' }}>${BLUEPRINT_PRICE}</span>
                    <span className="iconik-display text-luxury-charcoal" style={{ fontSize: '32px' }}>${BLUEPRINT_PRICE_WITH_EDIT}</span>
                </div>
                <p className="luxury-body text-luxury-charcoal/50 text-xs mt-1" style={{ fontWeight: 300 }}>
                    Add THE ICONIK EDIT and your first month effectively pays for itself.
                </p>
            </div>

            <div className="iconik-display-it text-luxury-charcoal mb-4" style={{ fontSize: '16px', lineHeight: 1.5, opacity: 0.8 }}>
                Your Blueprint tells you what works.<br />Your Edit puts it to work — every week.
            </div>

            <div className="space-y-2 mb-4">
                {editBullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                        <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--luxury-charcoal)', opacity: 0.35 }} />
                        <span className="luxury-body text-luxury-charcoal/60 text-xs leading-relaxed" style={{ fontWeight: 300 }}>{b}</span>
                    </div>
                ))}
            </div>

            <div className="iconik-mono text-luxury-charcoal/35" style={{ fontSize: '10px' }}>
                Authorize your ${EDIT_PRICE}/month Edit first, then pay ${BLUEPRINT_PRICE_WITH_EDIT} for your Blueprint.
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
    const [editAuthorized, setEditAuthorized] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStage, setPaymentStage] = useState<'creating_order' | 'opening_razorpay' | 'confirming_payment' | 'setting_up_edit' | 'authorizing_edit' | 'redirecting' | null>(null);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        trackInitiateCheckout(BLUEPRINT_PRICE, 1, 'ICONIK Style Blueprint', 'USD', 'Style Scan Funnel');
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
        setEditAuthorized(Boolean(
            email && localStorage.getItem('stylist_editAuthorizedSubscriptionId')
            && localStorage.getItem('stylist_editAuthorizedEmail') === email.trim().toLowerCase(),
        ));
    }, [email]);

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

    const processPayment = useCallback(async function payForBlueprint(confirmedSubscriptionId?: string) {
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
        setPaymentStage('creating_order');

        const leadId = typeof window !== 'undefined' ? localStorage.getItem('style_scan_lead_id') : null;
        const rawScanPayload = typeof window !== 'undefined' ? localStorage.getItem('style_scan_result') : null;
        const checkoutBlueprintPrice = editSelected ? BLUEPRINT_PRICE_WITH_EDIT : BLUEPRINT_PRICE;

        if (editSelected && !confirmedSubscriptionId) {
            const savedId = localStorage.getItem('stylist_editAuthorizedSubscriptionId');
            const savedEmail = localStorage.getItem('stylist_editAuthorizedEmail');
            if (savedId && savedEmail === email.trim().toLowerCase()) return payForBlueprint(savedId);

            setIsProcessing(true);
            setPaymentStage('setting_up_edit');
            const editContext: StylistEditRetryContext = {
                customer_email: email, customer_phone: fullPhone, customer_name: email.split('@')[0],
                lead_id: leadId, order_id: null, plan_type: 'monthly', source: 'checkout',
                attribution: getAttributionPayload(),
            };
            try {
                const subRes = await fetch('/api/stylist-edit-subscribe', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editContext),
                });
                const subData = await subRes.json();
                if (!subRes.ok || !subData.success || !subData.subscription_id || !subData.key) {
                    throw new Error(editSetupMessage(subData));
                }
                localStorage.setItem('stylist_editSubscriptionId', subData.subscription_id);
                localStorage.setItem('stylist_editKey', subData.key);
                localStorage.setItem(EDIT_RETRY_CONTEXT_KEY, JSON.stringify(editContext));
                setStoredEditState('selected_ready_to_authorize');

                const openEdit = () => {
                    let completed = false;
                    const editRzp = new window.Razorpay!({
                        key: subData.key,
                        subscription_id: subData.subscription_id,
                        name: 'ICONIK Style Intelligence',
                        description: `THE ICONIK EDIT — $${EDIT_PRICE}/month`,
                        handler: async (subResponse: RazorpaySubResponse) => {
                            completed = true;
                            const subscriptionId = subResponse.razorpay_subscription_id || subData.subscription_id;
                            localStorage.setItem('stylist_editAuthorizedSubscriptionId', subscriptionId);
                            localStorage.setItem('stylist_editAuthorizedEmail', email.trim().toLowerCase());
                            setEditAuthorized(true);
                            try {
                                await payForBlueprint(subscriptionId);
                                if (subResponse.razorpay_payment_id) {
                                    trackPurchase(EDIT_PRICE, 'THE ICONIK EDIT', ['iconik_edit_subscription'], 1,
                                        'USD', 'style_scan_edit', subResponse.razorpay_payment_id);
                                }
                            } catch (err) {
                                setIsProcessing(false);
                                setPaymentStage(null);
                                setFormError(err instanceof Error ? err.message : 'Edit was authorized, but Blueprint checkout could not open. Please retry.');
                            }
                        },
                        prefill: { name: email.split('@')[0], email, contact: fullPhone },
                        theme: { color: '#C9A96E' },
                        modal: {
                            ondismiss: () => {
                                if (completed) return;
                                setIsProcessing(false);
                                setPaymentStage(null);
                                setFormError('Authorize ICONIK Edit to unlock the $110 Blueprint, or deselect Edit to pay $149.');
                            },
                        },
                    });
                    setPaymentStage(null);
                    editRzp.open();
                };
                if (razorpayLoaded && window.Razorpay) openEdit();
                else {
                    const check = setInterval(() => {
                        if (window.Razorpay) { clearInterval(check); openEdit(); }
                    }, 100);
                    setTimeout(() => {
                        clearInterval(check);
                        if (!window.Razorpay) {
                            setIsProcessing(false);
                            setPaymentStage(null);
                            setFormError('Failed to load payment system. Please try again.');
                        }
                    }, 10000);
                }
            } catch (err) {
                setIsProcessing(false);
                setPaymentStage(null);
                setFormError(err instanceof Error ? err.message : 'Could not prepare ICONIK Edit. Please try again.');
            }
            return;
        }

        try {
            let data: { success?: boolean; error?: string; error_code?: string; key?: string; amount?: number; razorpay_order_id?: string; db_order_id?: string } = {};
            for (let attempt = 0; attempt < (confirmedSubscriptionId ? 6 : 1); attempt++) {
                const response = await fetch('/api/stylist-payment', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_name: email.split('@')[0], customer_email: email, customer_phone: fullPhone,
                        amount: checkoutBlueprintPrice, edit_selected: editSelected,
                        edit_subscription_id: confirmedSubscriptionId || null, lead_id: leadId,
                        scan_payload: rawScanPayload ? JSON.parse(rawScanPayload) : null,
                        attribution: getAttributionPayload(),
                    }),
                });
                data = await response.json();
                if (response.ok && data.success) break;
                if (response.status === 403 && confirmedSubscriptionId) {
                    localStorage.removeItem('stylist_editAuthorizedSubscriptionId');
                    localStorage.removeItem('stylist_editAuthorizedEmail');
                    setEditAuthorized(false);
                }
                if (response.status !== 409 || data.error_code !== 'edit_not_ready' || attempt === 5) {
                    throw new Error(data.error || 'Payment initialisation failed');
                }
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            if (!data.success || !data.key || !data.amount || !data.razorpay_order_id) {
                throw new Error(data.error || 'Payment initialisation failed');
            }
            const orderKey = data.key;
            const orderAmount = data.amount;
            const razorpayOrderId = data.razorpay_order_id;

            const initRazorpay = () => {
                setPaymentStage('opening_razorpay');
                const options: RazorpayOrderOptions = {
                    key: orderKey,
                    amount: orderAmount,
                    currency: 'USD',
                    name: 'ICONIK Style Intelligence',
                    description: 'ICONIK Style Blueprint',
                    order_id: razorpayOrderId,
                    handler: async (rzpResponse: RazorpayOrderResponse) => {
                        setIsProcessing(true);
                        setPaymentStage('confirming_payment');
                        try {
                            const confirmationResponse = await fetch('/api/stylist-confirm-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    db_order_id: data.db_order_id,
                                    razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                    razorpay_order_id: rzpResponse.razorpay_order_id,
                                    razorpay_signature: rzpResponse.razorpay_signature,
                                    customer_email: email,
                                    customer_phone: fullPhone,
                                    customer_name: email.split('@')[0],
                                    amount: checkoutBlueprintPrice,
                                    lead_id: leadId,
                                    edit_selected: editSelected,
                                }),
                            });
                            const confirmation = await confirmationResponse.json();
                            if (!confirmationResponse.ok || !confirmation.success) {
                                throw new Error('Blueprint payment is awaiting confirmation. Please contact support with your Razorpay payment receipt.');
                            }
                        } catch (err) {
                            console.warn('Could not confirm stylist payment in DB:', err);
                            setIsProcessing(false);
                            setPaymentStage(null);
                            setFormError(err instanceof Error ? err.message : 'Blueprint payment is awaiting confirmation. Please contact support with your Razorpay payment receipt.');
                            return;
                        }

                        sessionStorage.setItem('stylist_purchaseTracked', rzpResponse.razorpay_payment_id);

                        localStorage.setItem('stylist_purchaseAmount', checkoutBlueprintPrice.toString());
                        localStorage.setItem('stylist_customerEmail', email);
                        localStorage.setItem('stylist_customerPhone', fullPhone);
                        localStorage.setItem('stylist_editSelected', editSelected.toString());
                        localStorage.removeItem('stylist_editPurchased');
                        localStorage.removeItem('stylist_editSubscriptionId');
                        localStorage.removeItem('stylist_editKey');
                        localStorage.removeItem(EDIT_SETUP_ERROR_KEY);

                        const successHref = `/stylist/checkout/success?payment_id=${rzpResponse.razorpay_payment_id}&email=${encodeURIComponent(email)}`;

                        if (editSelected && confirmedSubscriptionId) {
                            localStorage.setItem('stylist_editPurchased', 'true');
                            localStorage.setItem('stylist_editSelected', 'false');
                            localStorage.removeItem('stylist_editSubscriptionId');
                            localStorage.removeItem('stylist_editKey');
                            localStorage.removeItem('stylist_editAuthorizedSubscriptionId');
                            localStorage.removeItem('stylist_editAuthorizedEmail');
                            localStorage.removeItem(EDIT_RETRY_CONTEXT_KEY);
                            setStoredEditState('authorized');
                        } else {
                            setStoredEditState('not_selected');
                            localStorage.removeItem(EDIT_RETRY_CONTEXT_KEY);
                        }

                        setPaymentStage('redirecting');
                        window.location.href = successHref;
                    },
                    prefill: { name: email.split('@')[0], email, contact: fullPhone },
                    theme: { color: '#C9A96E' },
                    modal: {
                        ondismiss: () => {
                            setIsProcessing(false);
                            setPaymentStage(null);
                        },
                    },
                };

                const rzp = new window.Razorpay!(options);
                rzp.open();
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
                        setPaymentStage(null);
                        setFormError('Failed to load payment system. Please try again.');
                    }
                }, 10000);
            }
        } catch (err) {
            console.error('Stylist payment error:', err);
            setIsProcessing(false);
            setPaymentStage(null);
            setFormError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
        }
    }, [email, phone, countryCode, editSelected, razorpayLoaded]);

    const totalLabel = editSelected
        ? editAuthorized
            ? `Pay $${BLUEPRINT_PRICE_WITH_EDIT} Blueprint — Edit confirmed`
            : `Authorize $${EDIT_PRICE} Edit — then pay $${BLUEPRINT_PRICE_WITH_EDIT} Blueprint`
        : `Pay $${BLUEPRINT_PRICE} — Get My Blueprint`;

    const paymentStageText: Record<NonNullable<typeof paymentStage>, string> = {
        creating_order: 'Preparing your secure checkout...',
        opening_razorpay: 'Opening Razorpay...',
        confirming_payment: 'Confirming your payment...',
        setting_up_edit: 'Setting up your ICONIK Edit authorization...',
        authorizing_edit: 'Opening ICONIK Edit authorization...',
        redirecting: 'Payment confirmed. Taking you to the next step...',
    };

    return (
        <div className="min-h-screen text-luxury-charcoal overflow-x-hidden" style={{ background: 'var(--luxury-warm-white)' }}>
            {paymentStage && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center px-5" style={{ background: 'rgba(244,239,229,0.92)', backdropFilter: 'blur(20px)' }}>
                    <div className="w-full max-w-sm rounded-2xl border p-7 text-center shadow-2xl" style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}>
                        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-luxury-charcoal/40" />
                        <div className="iconik-micro text-luxury-charcoal/35 mb-3">Secure Checkout</div>
                        <h2 className="iconik-display text-luxury-charcoal" style={{ fontSize: '22px' }}>{paymentStageText[paymentStage]}</h2>
                        <p className="luxury-body text-luxury-charcoal/50 text-sm leading-relaxed mt-3" style={{ fontWeight: 300 }}>
                            Please do not refresh or close this page. This usually takes a few seconds.
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="py-4 px-6" style={{ background: 'rgba(244,239,229,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--luxury-cream)' }}>
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/stylist/style-score/result" className="flex items-center gap-1.5 luxury-body text-luxury-charcoal/50 hover:text-luxury-charcoal transition-colors text-sm">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Link>
                    <span className="iconik-display text-luxury-charcoal" style={{ fontSize: '16px', letterSpacing: '0.32em' }}>I C O N I K</span>
                    <div className="flex items-center gap-1.5 text-luxury-charcoal/40 text-xs">
                        <Lock className="w-3 h-3" />
                        <span className="iconik-micro">Secure</span>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">

                {/* Trust strip */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap justify-center gap-2 mb-10"
                >
                    {['5,000+ Clients', '10+ Countries', '20 Outfit Formulas', '5 Working-Day Delivery'].map((t) => (
                        <div key={t} className="flex items-center gap-2 px-4 py-1.5 rounded-full border iconik-micro text-luxury-charcoal/45" style={{ borderColor: 'var(--luxury-cream)', background: 'var(--luxury-cream)' }}>
                            {t}
                        </div>
                    ))}
                </motion.div>

                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-10"
                >
                    <div className="iconik-micro text-luxury-charcoal/35 mb-4">Your ICONIK Style Blueprint</div>
                    <div className="flex items-baseline justify-center gap-3 mb-3">
                        <span className="iconik-display text-luxury-charcoal/20 line-through" style={{ fontSize: '24px' }}>$249</span>
                        <span className="iconik-display text-luxury-charcoal" style={{ fontSize: 'clamp(48px, 8vw, 64px)' }}>
                            ${editSelected ? BLUEPRINT_PRICE_WITH_EDIT : BLUEPRINT_PRICE}
                        </span>
                    </div>
                    {editSelected && (
                        <p className="luxury-body text-luxury-charcoal/50 text-sm mb-3" style={{ fontWeight: 300 }}>
                            Authorize THE ICONIK EDIT at ${EDIT_PRICE}/month first to unlock your ${BLUEPRINT_PRICE_WITH_EDIT} Blueprint.
                        </p>
                    )}
                    <div className="inline-block px-4 py-1.5 rounded-full iconik-micro text-luxury-warm-white mb-4" style={{ background: 'var(--luxury-accent)' }}>
                        Style Scan Exclusive Price
                    </div>
                    <div className="flex items-center justify-center gap-1.5 luxury-body text-luxury-charcoal/40 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="iconik-mono" style={{ fontSize: '11px' }}>
                            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                    </div>
                </motion.div>

                {/* What's included */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-2xl p-6 mb-5 border"
                    style={{ background: 'var(--luxury-cream)', borderColor: 'var(--luxury-cream)' }}
                >
                    <div className="iconik-micro text-luxury-charcoal/40 mb-5">What&apos;s Included</div>
                    <div className="space-y-3">
                        {[
                            'Detailed colour palette — your exact hex codes and seasonal direction',
                            'Body geometry analysis — every cut that works for your specific proportions',
                            'Face architecture — necklines, earrings, eyewear for your face shape',
                            '20 complete outfit formulas (top, bottom, footwear, bag, jewellery)',
                            'Hair direction — 4 styles matched to your face geometry',
                            'What to avoid — and the exact reason why',
                            'Shopping rules specific to your frame and palette',
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--luxury-charcoal)', opacity: 0.35 }} />
                                <span className="luxury-body text-luxury-charcoal/65 text-sm" style={{ fontWeight: 300 }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Edit Add-On Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-5"
                >
                    <EditCard selected={editSelected} onToggle={() => setEditSelected(s => !s)} />
                </motion.div>

                {/* Payment form */}
                <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    onSubmit={e => { e.preventDefault(); processPayment(); }}
                    className="rounded-2xl p-6 space-y-5 mb-6 border"
                    style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}
                >
                    <div className="iconik-micro text-luxury-charcoal/40">Your Details</div>
                    <div>
                        <label className="luxury-body text-luxury-charcoal/55 text-xs block mb-2">Email Address *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl transition-all text-base luxury-body outline-none"
                            style={{ border: '1.5px solid var(--luxury-cream)', background: 'var(--luxury-warm-white)', color: 'var(--luxury-charcoal)' }}
                            placeholder="your@email.com"
                            required
                        />
                        <p className="luxury-body text-luxury-charcoal/35 text-xs mt-1" style={{ fontWeight: 300 }}>Your Blueprint will be sent to this address.</p>
                    </div>
                    <div>
                        <label className="luxury-body text-luxury-charcoal/55 text-xs block mb-2">Phone Number *</label>
                        <div className="grid grid-cols-[128px_1fr] gap-2">
                            <select
                                value={countryCode}
                                onChange={e => setCountryCode(e.target.value)}
                                className="w-full px-3 py-3.5 rounded-xl transition-all text-sm luxury-body outline-none"
                                style={{ border: '1.5px solid var(--luxury-cream)', background: 'var(--luxury-warm-white)', color: 'var(--luxury-charcoal)' }}
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
                                className="w-full px-4 py-3.5 rounded-xl transition-all text-base luxury-body outline-none"
                                style={{ border: '1.5px solid var(--luxury-cream)', background: 'var(--luxury-warm-white)', color: 'var(--luxury-charcoal)' }}
                                placeholder="555 000 0000"
                                required
                            />
                        </div>
                        <p className="luxury-body text-luxury-charcoal/30 text-xs mt-1" style={{ fontWeight: 300 }}>
                            Selected: {COUNTRY_CODES.find(country => country.code === countryCode)?.flag} {countryCode}
                        </p>
                    </div>
                    {formError && (
                        <div className="rounded-xl p-3 text-sm luxury-body" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>{formError}</div>
                    )}

                    {/* Order summary */}
                    {editSelected && (
                        <div className="rounded-xl p-4 space-y-2 border" style={{ background: 'var(--luxury-cream)', borderColor: 'var(--luxury-cream)' }}>
                            <div className="iconik-micro text-luxury-charcoal/40 mb-3">Order Summary</div>
                            <div className="flex justify-between luxury-body text-sm text-luxury-charcoal/60">
                                <span>ICONIK Style Blueprint</span>
                                <span className="iconik-mono" style={{ fontSize: '12px' }}>${BLUEPRINT_PRICE_WITH_EDIT}</span>
                            </div>
                            <div className="flex justify-between luxury-body text-sm text-luxury-charcoal/60">
                                <span>THE ICONIK EDIT authorization</span>
                                <span className="iconik-mono" style={{ fontSize: '12px' }}>${EDIT_PRICE}/mo</span>
                            </div>
                            <div className="pt-2 flex justify-between luxury-body text-sm" style={{ borderTop: '1px solid var(--luxury-warm-white)' }}>
                                <span className="text-luxury-charcoal/40" style={{ fontWeight: 300 }}>Total after both payments</span>
                                <span className="iconik-mono text-luxury-charcoal" style={{ fontSize: '12px' }}>${BLUEPRINT_PRICE}</span>
                            </div>
                            <p className="luxury-body text-luxury-charcoal/35 leading-relaxed" style={{ fontSize: '10px', fontWeight: 300 }}>
                                Razorpay opens twice: first for your ${EDIT_PRICE}/month Edit, then for your ${BLUEPRINT_PRICE_WITH_EDIT} Blueprint. The discounted Blueprint opens only after Edit is confirmed.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-4 text-base luxury-body rounded-full transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'var(--luxury-charcoal)', color: 'var(--luxury-warm-white)' }}
                    >
                        {isProcessing ? 'Opening payment…' : totalLabel}
                    </button>
                    <div className="flex items-center justify-center gap-2 iconik-micro text-luxury-charcoal/30">
                        <Lock className="w-3 h-3" />
                        <span>Secured by Razorpay · 256-bit SSL</span>
                    </div>
                </motion.form>

                {/* Guarantee */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <p className="luxury-body text-luxury-charcoal/35 text-xs leading-relaxed" style={{ fontWeight: 300 }}>
                        In-scope revisions continue until you are satisfied. Refunds are considered only in the specific cancellation cases described in our{' '}
                        <Link href="/refund-policy" className="underline hover:text-luxury-charcoal">refund policy</Link>.
                    </p>
                </motion.div>

            </div>
        </div>
    );
}
