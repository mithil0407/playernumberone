'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { trackPageView } from '@/lib/metaPixel';
import { getAttributionPayload } from '@/lib/attribution';

// ── Razorpay types ────────────────────────────────────────────────────────────

interface RazorpaySubOptions {
    key: string;
    subscription_id: string;
    name: string;
    description: string;
    handler: (response: RazorpaySubResponse) => void;
    prefill: { name: string; email: string; contact: string };
    theme: { color: string };
}
interface RazorpaySubResponse {
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
}
interface RazorpayInstance { open(): void; }

declare const window: Window & {
    Razorpay?: new (opts: RazorpaySubOptions) => RazorpayInstance;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void;
};

// ── Edit bullets (reused across states) ──────────────────────────────────────

const EDIT_BULLETS = [
    'Weekly style intelligence built on your Blueprint',
    'New outfit formulas every month',
    'Your ICONIK stylist, on call',
    'Shopping picks matched to your exact palette',
];

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
    source: 'checkout' | 'success_page';
    attribution: ReturnType<typeof getAttributionPayload>;
}

const EDIT_STATE_KEY = 'stylist_editState';
const EDIT_RETRY_CONTEXT_KEY = 'stylist_editRetryContext';
const EDIT_SETUP_ERROR_KEY = 'stylist_editSetupError';

function isEditState(value: string | null): value is StylistEditCheckoutState {
    return value === 'not_selected' ||
        value === 'selected_pending_setup' ||
        value === 'selected_ready_to_authorize' ||
        value === 'selected_setup_failed' ||
        value === 'authorized' ||
        value === 'declined';
}

function storedEditState() {
    const state = localStorage.getItem(EDIT_STATE_KEY);
    if (isEditState(state)) return state;
    if (localStorage.getItem('stylist_editPurchased') === 'true') return 'authorized';
    if (localStorage.getItem('stylist_editSelected') === 'true') {
        return localStorage.getItem('stylist_editSubscriptionId') ? 'selected_ready_to_authorize' : 'selected_setup_failed';
    }
    return 'not_selected';
}

function persistEditState(state: StylistEditCheckoutState) {
    localStorage.setItem(EDIT_STATE_KEY, state);
}

function readRetryContext(): StylistEditRetryContext | null {
    const raw = localStorage.getItem(EDIT_RETRY_CONTEXT_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Partial<StylistEditRetryContext>;
        if (!parsed.customer_email) return null;
        return {
            customer_email: parsed.customer_email,
            customer_phone: parsed.customer_phone || '',
            customer_name: parsed.customer_name || parsed.customer_email.split('@')[0],
            lead_id: parsed.lead_id || null,
            order_id: parsed.order_id || null,
            plan_type: 'monthly',
            source: parsed.source === 'checkout' ? 'checkout' : 'success_page',
            attribution: parsed.attribution || getAttributionPayload(),
        };
    } catch {
        return null;
    }
}

function editSetupMessage(data: { error?: string; error_code?: string }) {
    if (data.error_code === 'plan_not_configured') {
        return 'Your Blueprint is confirmed, but ICONIK Edit needs a payment plan configured before it can be authorized. Please contact support and we will activate it for you.';
    }
    if (data.error_code === 'razorpay_plan_invalid') {
        return 'Your Blueprint is confirmed, but the ICONIK Edit payment plan is not available in this Razorpay mode. Please contact support and we will activate it for you.';
    }
    return data.error || 'Your Blueprint is confirmed, but we could not set up ICONIK Edit yet. Please retry below.';
}

function IntakeButton({ href, label = 'Complete My Intake Now' }: { href: string; label?: string }) {
    return (
        <Link
            href={href}
            className="inline-flex w-full items-center justify-center gap-3 bg-luxury-charcoal hover:bg-luxury-charcoal/85 text-luxury-warm-white px-8 py-4 rounded-full transition-all duration-300 luxury-body font-semibold hover:shadow-lg"
        >
            {label} <ArrowRight className="w-4 h-4" />
        </Link>
    );
}

// ── Inner page component ──────────────────────────────────────────────────────

function StylistSuccessInner() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || (typeof window !== 'undefined' ? localStorage.getItem('stylist_customerEmail') || '' : '');
    const phone = typeof window !== 'undefined' ? localStorage.getItem('stylist_customerPhone') || '' : '';
    const intakeParams = new URLSearchParams();
    if (email) intakeParams.set('email', email);
    if (phone) intakeParams.set('phone', phone);
    const intakeHref = `/stylist/intake${intakeParams.toString() ? `?${intakeParams.toString()}` : ''}`;

    // Edit state
    const [editPurchased, setEditPurchased] = useState(false);
    const [editSelected, setEditSelected] = useState(false);
    const [editState, setEditState] = useState<StylistEditCheckoutState>('not_selected');
    const [pendingSubId, setPendingSubId] = useState<string | null>(null);
    const [pendingSubKey, setPendingSubKey] = useState<string | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [noThanks, setNoThanks] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    useEffect(() => {
        trackPageView('Stylist Checkout Success');
        const paymentId = sessionStorage.getItem('stylist_purchaseTracked') || '';
        const purchaseAmount = Number(localStorage.getItem('stylist_purchaseAmount') || 149);
        const trackedAmount = Number.isFinite(purchaseAmount) ? purchaseAmount : 149;
        window.fbq?.('trackCustom', 'blueprint_purchased', { funnel: 'style_scan', amount: trackedAmount, currency: 'USD', payment_id: paymentId });
        window.fbq?.('track', 'Purchase', { value: trackedAmount, currency: 'USD', content_name: 'ICONIK Style Blueprint' });
        sessionStorage.removeItem('stylist_purchaseTracked');

        // Read Edit state from localStorage
        const purchased = localStorage.getItem('stylist_editPurchased') === 'true';
        const selected = localStorage.getItem('stylist_editSelected') === 'true';
        const state = storedEditState();
        const subId = localStorage.getItem('stylist_editSubscriptionId') || null;
        const subKey = localStorage.getItem('stylist_editKey') || null;
        const setupError = localStorage.getItem(EDIT_SETUP_ERROR_KEY) || '';

        setEditPurchased(purchased || state === 'authorized');
        setEditSelected(selected);
        setEditState(state);
        setPendingSubId(subId);
        setPendingSubKey(subKey);
        setEditError(setupError);
    }, []);

    useEffect(() => {
        if (document.querySelector('script[src*="razorpay.com"]')) { setRazorpayLoaded(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRazorpayLoaded(true);
        document.body.appendChild(script);
    }, []);

    const openSubscriptionModal = useCallback((subscriptionId: string, key: string) => {
        const options: RazorpaySubOptions = {
            key,
            subscription_id: subscriptionId,
            name: 'ICONIK Style Intelligence',
            description: 'THE ICONIK EDIT — $39/month',
            handler: async (response: RazorpaySubResponse) => {
                try {
                    await fetch('/api/stylist-edit-confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_subscription_id: response.razorpay_subscription_id || subscriptionId,
                            razorpay_payment_id: response.razorpay_payment_id || '',
                            customer_email: email,
                            customer_phone: phone,
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
                persistEditState('authorized');
                setEditPurchased(true);
                setEditState('authorized');
                window.fbq?.('trackCustom', 'edit_purchased', { funnel: 'style_scan', source: editSelected ? 'checkout_pending' : 'success_page' });
                setEditLoading(false);
            },
            prefill: { name: email.split('@')[0], email, contact: phone },
            theme: { color: '#C9A96E' },
        };

        const tryOpen = () => {
            if (window.Razorpay) {
                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        };

        if (razorpayLoaded && window.Razorpay) {
            tryOpen();
        } else {
            const check = setInterval(() => {
                if (window.Razorpay) { clearInterval(check); tryOpen(); }
            }, 100);
            setTimeout(() => {
                clearInterval(check);
                if (!window.Razorpay) {
                    setEditLoading(false);
                    setEditError('Failed to load payment system. Please try again.');
                }
            }, 10000);
        }
    }, [email, phone, razorpayLoaded, editSelected]);

    const handleAddEdit = useCallback(async () => {
        setEditError('');
        setEditLoading(true);

        // If subscription was already created at checkout, just open the modal
        if (pendingSubId && pendingSubKey) {
            persistEditState('selected_ready_to_authorize');
            setEditState('selected_ready_to_authorize');
            openSubscriptionModal(pendingSubId, pendingSubKey);
            return;
        }

        // Otherwise create subscription now
        try {
            const storedContext = readRetryContext();
            const isCheckoutRetry = editState === 'selected_setup_failed' || editState === 'selected_pending_setup';
            const payload: StylistEditRetryContext = storedContext && isCheckoutRetry
                ? {
                    ...storedContext,
                    attribution: getAttributionPayload(),
                }
                : {
                    customer_email: email,
                    customer_phone: phone,
                    customer_name: email.split('@')[0],
                    lead_id: localStorage.getItem('style_scan_lead_id') || null,
                    order_id: null,
                    plan_type: 'monthly',
                    source: 'success_page',
                    attribution: getAttributionPayload(),
                };
            persistEditState('selected_pending_setup');
            setEditState('selected_pending_setup');
            localStorage.setItem(EDIT_RETRY_CONTEXT_KEY, JSON.stringify(payload));

            const res = await fetch('/api/stylist-edit-subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.success || !data.subscription_id) {
                const message = editSetupMessage(data);
                localStorage.setItem(EDIT_SETUP_ERROR_KEY, message);
                persistEditState('selected_setup_failed');
                setEditState('selected_setup_failed');
                throw new Error(message);
            }
            localStorage.setItem('stylist_editSelected', 'true');
            localStorage.setItem('stylist_editSubscriptionId', data.subscription_id);
            localStorage.setItem('stylist_editKey', data.key);
            localStorage.removeItem(EDIT_SETUP_ERROR_KEY);
            persistEditState('selected_ready_to_authorize');
            setEditSelected(true);
            setEditState('selected_ready_to_authorize');
            setPendingSubId(data.subscription_id);
            setPendingSubKey(data.key);
            openSubscriptionModal(data.subscription_id, data.key);
        } catch (err) {
            setEditLoading(false);
            setEditError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        }
    }, [pendingSubId, pendingSubKey, editState, email, phone, openSubscriptionModal]);

    const hasCheckoutEditIntent =
        editState === 'selected_pending_setup' ||
        editState === 'selected_ready_to_authorize' ||
        editState === 'selected_setup_failed' ||
        (editSelected && editState !== 'declined' && editState !== 'not_selected');
    const editAuthorizationReady = Boolean(pendingSubId && pendingSubKey);
    const editActionLabel = editAuthorizationReady ? 'Authorize My Edit' : 'Retry Edit Setup';

    // ── State A: Edit purchased (Blueprint + Edit confirmed) ─────────────────

    if (editPurchased) {
        return (
            <div className="min-h-screen bg-luxury-warm-white flex flex-col items-center justify-center px-4 text-center">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="w-24 h-24 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                >
                    <div className="absolute inset-0 bg-luxury-accent rounded-full opacity-20 animate-ping" />
                    <CheckCircle className="w-12 h-12 text-luxury-accent relative z-10" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-lg"
                >
                    <span className="text-3xl luxury-heading text-luxury-charcoal tracking-wider block mb-6">ICONIK</span>
                    <h1 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-5 leading-tight">
                        Your Blueprint and ICONIK Edit are confirmed.
                    </h1>
                    <p className="luxury-body text-luxury-charcoal/70 text-lg leading-relaxed mb-4">
                        You&apos;ll receive a link to complete your intake form at{' '}
                        {email ? <strong className="text-luxury-charcoal">{email}</strong> : 'your email'} shortly.
                    </p>
                    <p className="luxury-body text-luxury-charcoal/60 leading-relaxed mb-8">
                        Your Blueprint arrives within <strong className="text-luxury-charcoal">72 hours</strong> of completing the intake form.
                    </p>
                    <div className="mb-5">
                        <IntakeButton href={intakeHref} />
                    </div>
                    <div className="bg-luxury-cream/40 border border-luxury-cream rounded-2xl p-5 mb-8 text-left space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-luxury-charcoal/40">Next Steps</p>
                        {[
                            'Complete the intake form here now, or use the email link later',
                            'Receive your personalised Blueprint within 72 hours',
                            'Your ICONIK Edit is active — your first drop arrives within 72 hours',
                        ].map((step, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-luxury-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-black text-luxury-accent">{i + 1}</span>
                                </div>
                                <span className="luxury-body text-luxury-charcoal/80 text-sm">{step}</span>
                            </div>
                        ))}
                    </div>
                    <p className="luxury-body text-luxury-charcoal/40 text-sm">
                        Questions? Email us at{' '}
                        <a href="mailto:help.iconikfashion@gmail.com" className="text-luxury-accent hover:underline">help.iconikfashion@gmail.com</a>
                    </p>
                </motion.div>
                <footer className="mt-16">
                    <Link href="/" className="luxury-body text-luxury-charcoal/30 text-xs hover:text-luxury-charcoal transition-colors">
                        ← Back to ICONIK
                    </Link>
                </footer>
            </div>
        );
    }

    // ── State B: Edit selected at checkout but authorization still pending ────

    if (hasCheckoutEditIntent && !noThanks) {
        return (
            <div className="min-h-screen bg-luxury-warm-white flex flex-col items-center justify-center px-4 text-center">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="w-24 h-24 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                >
                    <CheckCircle className="w-12 h-12 text-luxury-accent relative z-10" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-lg w-full"
                >
                    <span className="text-3xl luxury-heading text-luxury-charcoal tracking-wider block mb-4">ICONIK</span>
                    <h1 className="text-2xl md:text-4xl luxury-heading text-luxury-charcoal mb-3 leading-tight">
                        Blueprint confirmed.
                    </h1>
                    <p className="luxury-body text-luxury-charcoal/60 mb-8">
                        {editAuthorizationReady
                            ? 'One more step: authorize your Edit to complete your order.'
                            : 'We saved your Edit selection. Retry setup below to authorize it.'}
                    </p>

                    <div className="bg-luxury-cream/40 border border-luxury-cream rounded-2xl p-6 text-left mb-6">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-luxury-charcoal/40 mb-4">THE ICONIK EDIT — $39/month</p>
                        <div className="space-y-2.5 mb-5">
                            {EDIT_BULLETS.map((b, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <span className="text-luxury-accent text-xs mt-0.5 flex-shrink-0">→</span>
                                    <span className="luxury-body text-luxury-charcoal/70 text-sm">{b}</span>
                                </div>
                            ))}
                        </div>
                        <p className="luxury-body text-luxury-charcoal/40 text-xs">
                            $39 billed today · Then monthly · Cancel anytime
                        </p>
                    </div>

                    {editError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm luxury-body mb-4">{editError}</div>
                    )}

                    <button
                        onClick={handleAddEdit}
                        disabled={editLoading}
                        className="w-full inline-flex items-center justify-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 disabled:opacity-60 text-luxury-warm-white px-8 py-4 rounded-full transition-all duration-300 luxury-body font-semibold hover:shadow-lg mb-4"
                    >
                        {editLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</> : <>{editActionLabel} <ArrowRight className="w-4 h-4" /></>}
                    </button>

                    <button
                        onClick={() => {
                            setNoThanks(true);
                            persistEditState('declined');
                            setEditState('declined');
                            localStorage.setItem('stylist_editSelected', 'false');
                        }}
                        className="w-full luxury-body text-luxury-charcoal/40 text-sm hover:text-luxury-charcoal/60 transition-colors"
                    >
                        No thanks, just the Blueprint
                    </button>

                    <div className="mt-6">
                        <IntakeButton href={intakeHref} label="Go To Intake Form" />
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── State C: Edit upsell (not selected at checkout, or dismissed) ─────────

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">

            {/* Hero */}
            <div className="flex flex-col items-center justify-center px-4 pt-16 pb-10 text-center">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="w-20 h-20 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                >
                    <div className="absolute inset-0 bg-luxury-accent rounded-full opacity-20 animate-ping" />
                    <CheckCircle className="w-10 h-10 text-luxury-accent relative z-10" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="max-w-md"
                >
                    <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider block mb-4">ICONIK</span>
                    <h1 className="text-2xl md:text-4xl luxury-heading text-luxury-charcoal mb-3 leading-tight">
                        Your Blueprint is confirmed.
                    </h1>
                    <p className="luxury-body text-luxury-charcoal/60 leading-relaxed">
                        It arrives within <strong className="text-luxury-charcoal">72 hours</strong> of completing your intake form.
                    </p>
                </motion.div>
            </div>

            {/* Divider line */}
            <div className="max-w-2xl mx-auto px-4">
                <div className="border-t border-luxury-cream mb-10" />

                <AnimatePresence>
                    {!noThanks ? (
                        <motion.div
                            key="upsell"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: 0.25 }}
                        >
                            {/* Bridge */}
                            <p className="luxury-body text-luxury-charcoal/50 text-center text-sm mb-8">
                                One thing before you go.
                            </p>

                            {/* Edit offer */}
                            <div className="border border-luxury-cream rounded-2xl p-7 mb-6" style={{ borderLeftWidth: '3px', borderLeftColor: '#C9A96E' }}>
                                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-luxury-charcoal/40 mb-5">THE ICONIK EDIT</p>

                                <p className="luxury-body text-luxury-charcoal/70 text-sm leading-relaxed mb-2">
                                    Most clients tell us the Blueprint answered every &ldquo;what works for me&rdquo; question.
                                </p>
                                <p className="luxury-body text-luxury-charcoal/80 text-sm leading-relaxed mb-6">
                                    The Edit answers what comes next — every week, for as long as you want it.
                                </p>

                                <div className="space-y-3 mb-6">
                                    {EDIT_BULLETS.map((b, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <span className="text-luxury-accent text-xs mt-0.5 flex-shrink-0">→</span>
                                            <span className="luxury-body text-luxury-charcoal/70 text-sm leading-relaxed">{b}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="luxury-heading text-luxury-charcoal text-3xl">$39</span>
                                    <span className="luxury-body text-luxury-charcoal/50 text-sm">/month</span>
                                </div>

                                {editError && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm luxury-body mb-4">{editError}</div>
                                )}

                                <button
                                    onClick={handleAddEdit}
                                    disabled={editLoading}
                                    className="w-full inline-flex items-center justify-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 disabled:opacity-60 text-luxury-warm-white px-8 py-4 rounded-full transition-all duration-300 luxury-body font-semibold hover:shadow-lg mb-5"
                                >
                                    {editLoading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</>
                                        : <>ADD THE ICONIK EDIT <ArrowRight className="w-4 h-4" /></>
                                    }
                                </button>

                                {/* Plain text no-thanks */}
                                <p className="text-center">
                                    <button
                                        onClick={() => {
                                            setNoThanks(true);
                                            persistEditState('declined');
                                            setEditState('declined');
                                        }}
                                        className="luxury-body text-luxury-charcoal/35 text-sm hover:text-luxury-charcoal/55 transition-colors"
                                    >
                                        No thanks, just the Blueprint
                                    </button>
                                </p>

                                <div className="mt-6">
                                    <IntakeButton href={intakeHref} label="Complete Intake Instead" />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        // After declining — show normal next steps
                        <motion.div
                            key="next-steps"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-lg mx-auto text-center pb-16"
                        >
                            <p className="luxury-body text-luxury-charcoal/70 text-lg leading-relaxed mb-4">
                                Complete your intake form now, or use the backup link we sent to{' '}
                                {email ? <strong className="text-luxury-charcoal">{email}</strong> : 'your email'}.
                            </p>
                            <div className="mb-5">
                                <IntakeButton href={intakeHref} />
                            </div>
                            <div className="bg-luxury-cream/40 border border-luxury-cream rounded-2xl p-5 mb-8 text-left space-y-3">
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-luxury-charcoal/40">Next Steps</p>
                                {[
                                    'Complete the intake form here now, or use the email link later',
                                    'Receive your personalised Blueprint within 72 hours',
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-luxury-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-luxury-accent">{i + 1}</span>
                                        </div>
                                        <span className="luxury-body text-luxury-charcoal/80 text-sm">{step}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="luxury-body text-luxury-charcoal/40 text-sm">
                                Questions? Email us at{' '}
                                <a href="mailto:help.iconikfashion@gmail.com" className="text-luxury-accent hover:underline">help.iconikfashion@gmail.com</a>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <footer className="py-6 px-6 text-center border-t border-luxury-cream">
                <Link href="/" className="luxury-body text-luxury-charcoal/30 text-xs hover:text-luxury-charcoal transition-colors">
                    ← Back to ICONIK
                </Link>
            </footer>
        </div>
    );
}

export default function StylistCheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
                <div className="text-luxury-charcoal/40 luxury-body">Loading…</div>
            </div>
        }>
            <StylistSuccessInner />
        </Suspense>
    );
}
