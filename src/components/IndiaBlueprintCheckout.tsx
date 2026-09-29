'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronDown, Lock, ShieldCheck } from 'lucide-react';
import { getAttributionPayload } from '@/lib/attribution';
import { CLIENT_PROOF } from '@/lib/siteFacts';
import { ClientMessagesStrip, FeaturedClientMessage, FREE_CHANGES_PROMISE } from '@/components/OfferShowcase';
import {
  INDIA_BLUEPRINT_CONTENT_NAME,
  INDIA_BLUEPRINT_PRODUCT_ID,
  INDIA_PHONE_COUNTRY_CODE,
  buildIndiaBlueprintContentIds,
  storeMetaPurchaseHandoff,
  trackAddToCart,
  trackCTAClick,
  trackInitiateCheckout,
  trackPurchase,
  trackRemoveFromCart,
  trackViewContent,
  updateUserData,
} from '@/lib/metaPixel';
import {
  INDIA_OUTFIT_PREVIEW_PRODUCT_ID,
  INDIA_SMART_SHOPPER_PRODUCT_ID,
  INDIA_WARDROBE_DETOX_PRODUCT_ID,
  indiaFunnelCategoryFromEntry,
  type IndiaFunnelEntry,
} from '@/lib/metaTrackingContract';
import {
  INDIA_BLUEPRINT_ADDON_PRICES,
  calculateIndiaBlueprintTotal,
  type IndiaBlueprintCheckoutSource,
} from '@/lib/indiaBlueprintPricing';
import type { RootDesignVariant } from '@/lib/rootDesign';
import { OFFER_FREE_BONUSES } from '@/lib/offerTopics';

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
  image: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open(): void;
}

type RazorpayWindow = Window & {
  Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
};

type AddonKey = 'outfitpreview' | 'wardrobedetox' | 'smartshopper';

interface CheckoutDraft {
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  outfitPreview: boolean;
  wardrobeDetox: boolean;
  smartShopper: boolean;
}

const OUTFIT_PREVIEW_PRICE = INDIA_BLUEPRINT_ADDON_PRICES.outfitPreview;
const WARDROBE_DETOX_PRICE = INDIA_BLUEPRINT_ADDON_PRICES.wardrobeDetox;
const SMART_SHOPPER_PRICE = INDIA_BLUEPRINT_ADDON_PRICES.smartShopper;
const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const packageItems = [
  '30-minute video call with your stylist',
  '20 outfits made for you',
  'Body shape guide',
  'Your colour palette',
];

const trustItems = [
  'Safe payment by Razorpay',
  'UPI, cards, net banking, wallets',
  'We send your call booking on WhatsApp',
  'Ready in 5 working days after your call',
];

interface IndiaBlueprintCheckoutProps {
  basePrice: number;
  funnelEntry: IndiaFunnelEntry;
  checkoutSource: IndiaBlueprintCheckoutSource;
  backHref: string;
  scanToken?: string;
  designVariant?: RootDesignVariant;
  /** Topic landing pages carry their promise into the package summary. */
  topicNote?: string;
  /** Offer topic key, recorded so a recovery email links back to the same topic checkout. */
  topicKey?: string;
  /** Set when arriving from a recovery email: load the saved cart and prefill it. */
  restoreSavedCart?: boolean;
}

export default function IndiaBlueprintCheckout({
  basePrice,
  funnelEntry,
  checkoutSource,
  backHref,
  scanToken = '',
  designVariant,
  topicNote,
  topicKey,
  restoreSavedCart = false,
}: IndiaBlueprintCheckoutProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [outfitPreview, setOutfitPreview] = useState(false);
  const [wardrobeDetox, setWardrobeDetox] = useState(false);
  const [smartShopper, setSmartShopper] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [showPayBar, setShowPayBar] = useState(false);
  const payButtonRef = useRef<HTMLButtonElement>(null);
  const lastCapturedLead = useRef('');
  const contentCategory = indiaFunnelCategoryFromEntry(funnelEntry);
  const storageKey = `iconik_${checkoutSource}`;
  const checkoutEventLocation = funnelEntry === 'root' ? 'Root Checkout' : 'Offer Checkout';

  const totalAmount = useMemo(
    () => calculateIndiaBlueprintTotal(basePrice, { outfitPreview, wardrobeDetox, smartShopper }),
    [basePrice, outfitPreview, wardrobeDetox, smartShopper],
  );

  useEffect(() => {
    trackViewContent('ICONIK Style Blueprint - Checkout', basePrice, [INDIA_BLUEPRINT_PRODUCT_ID], 'INR', contentCategory);

    try {
      const storedDraft = window.sessionStorage.getItem(storageKey);
      if (storedDraft) {
        const draft = JSON.parse(storedDraft) as Partial<CheckoutDraft>;
        setEmail(typeof draft.email === 'string' ? draft.email : '');
        setPhone(typeof draft.phone === 'string' ? draft.phone : '');
        setWhatsappOptIn(Boolean(draft.whatsappOptIn));
        setOutfitPreview(Boolean(draft.outfitPreview));
        setWardrobeDetox(Boolean(draft.wardrobeDetox));
        setSmartShopper(Boolean(draft.smartShopper));
      }
    } catch (error) {
      console.warn('Unable to restore checkout details:', error);
    } finally {
      setHasRestoredDraft(true);
    }

  }, [basePrice, contentCategory, storageKey]);

  useEffect(() => {
    // Arriving from a recovery email: the saved cart outranks this tab's draft.
    if (!restoreSavedCart || !hasRestoredDraft) return;
    let cancelled = false;
    fetch('/api/checkout-recovery/resume', { method: 'POST', cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const cart = data?.cart;
        if (cancelled || !cart) return;
        setEmail(String(cart.email || ''));
        setPhone(String(cart.phone || ''));
        setWhatsappOptIn(Boolean(cart.whatsappOptIn));
        setOutfitPreview(Boolean(cart.outfitPreview));
        setWardrobeDetox(Boolean(cart.wardrobeDetox));
        setSmartShopper(Boolean(cart.smartShopper));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [restoreSavedCart, hasRestoredDraft]);

  useEffect(() => {
    // Save the lead once the details are valid so a recovery email can reach
    // people who leave before pressing Pay. Debounced, and only resent when
    // something actually changed.
    if (!hasRestoredDraft) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[6-9]\d{9}$/.test(phone)) return;
    const lead = {
      email: email.trim(),
      phone,
      whatsapp_opt_in: whatsappOptIn,
      checkout_source: checkoutSource,
      topic: topicKey,
      add_ons: { outfit_preview: outfitPreview, wardrobe_detox: wardrobeDetox, smart_shoppers_guide: smartShopper },
    };
    const signature = JSON.stringify(lead);
    if (signature === lastCapturedLead.current) return;
    const timer = window.setTimeout(() => {
      lastCapturedLead.current = signature;
      fetch('/api/checkout-recovery/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lead, attribution: getAttributionPayload() }),
        keepalive: true,
      }).catch(() => undefined);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [email, phone, whatsappOptIn, outfitPreview, wardrobeDetox, smartShopper, hasRestoredDraft, checkoutSource, topicKey]);

  useEffect(() => {
    if (!scanToken) return;
    fetch(`/api/style-scan/${encodeURIComponent(scanToken)}/status`, { cache: 'no-store' })
      .then(response => response.json())
      .then(data => {
        const scanPhone = String(data.contact?.phone || '').replace(/^\+91/, '');
        if (scanPhone && !phone) setPhone(scanPhone);
      })
      .catch(() => undefined);
  }, [phone, scanToken]);

  useEffect(() => {
    if (!hasRestoredDraft) return;
    const draft: CheckoutDraft = { email, phone, whatsappOptIn, outfitPreview, wardrobeDetox, smartShopper };
    window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
  }, [email, phone, whatsappOptIn, outfitPreview, wardrobeDetox, smartShopper, hasRestoredDraft, storageKey]);

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay.com"]')) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setRazorpayLoaded(false);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    // The mobile pay bar appears once the real Pay button is out of view, so
    // the price and the button are always one tap away.
    const payButton = payButtonRef.current;
    if (!payButton) return;
    const observer = new IntersectionObserver(([entry]) => setShowPayBar(!entry.isIntersecting), { threshold: 0.2 });
    observer.observe(payButton);
    return () => observer.disconnect();
  }, []);

  const validateDetails = useCallback(() => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validPhone = /^\d{10}$/.test(phone);
    setEmailError(validEmail ? '' : 'Enter a valid email address.');
    setPhoneError(validPhone ? '' : 'Enter a valid 10-digit WhatsApp number.');
    if (!validEmail || !validPhone) {
      // Paying from the sticky bar can leave the fields far above; bring the
      // first one that needs fixing back into view.
      const field = document.getElementById(validEmail ? 'offer-phone' : 'offer-email');
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field?.focus({ preventScroll: true });
    }
    return validEmail && validPhone;
  }, [email, phone]);

  const handleAddonChange = useCallback((addon: AddonKey, checked: boolean) => {
    const details = {
      outfitpreview: { name: 'AI Outfit Preview', price: OUTFIT_PREVIEW_PRICE, id: INDIA_OUTFIT_PREVIEW_PRODUCT_ID },
      wardrobedetox: { name: 'Wardrobe Detox', price: WARDROBE_DETOX_PRICE, id: INDIA_WARDROBE_DETOX_PRODUCT_ID },
      smartshopper: { name: "Smart Shopper's Guide", price: SMART_SHOPPER_PRICE, id: INDIA_SMART_SHOPPER_PRODUCT_ID },
    }[addon];

    if (checked) trackAddToCart(details.name, details.price, details.id, 'INR', contentCategory);
    else trackRemoveFromCart(details.name, details.price, details.id, 'INR', contentCategory);

    if (addon === 'outfitpreview') setOutfitPreview(checked);
    if (addon === 'wardrobedetox') setWardrobeDetox(checked);
    if (addon === 'smartshopper') setSmartShopper(checked);
  }, [contentCategory]);

  const processPayment = useCallback(async () => {
    if (!validateDetails()) return;

    const selected = {
      outfitPreview,
      wardrobeDetox,
      smartShopper,
    };
    const paymentAmount = calculateIndiaBlueprintTotal(basePrice, selected);
    const contentIds = buildIndiaBlueprintContentIds(selected);
    const itemCount = contentIds.length;

    updateUserData(email, phone, INDIA_PHONE_COUNTRY_CODE);
    trackCTAClick('Pay Securely', checkoutEventLocation, paymentAmount, 'INR', contentCategory);
    setIsProcessing(true);
    trackInitiateCheckout(paymentAmount, itemCount, 'ICONIK Style Blueprint', 'INR', contentCategory, contentIds);

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: email.split('@')[0],
          customer_email: email,
          customer_phone: phone,
          whatsapp_opt_in: whatsappOptIn,
          amount: paymentAmount,
          checkout_source: checkoutSource,
          topic: topicKey,
          // Recorded in the Razorpay order notes so the webhook can send the
          // server-side Purchase with the same content_category as the browser.
          funnel_entry: contentCategory,
          base_product: 'Iconik Style Consultation',
          add_ons: {
            wardrobe_detox: selected.wardrobeDetox,
            smart_shoppers_guide: selected.smartShopper,
            outfit_preview: selected.outfitPreview,
          },
          total_base_price: basePrice,
          wardrobe_detox_price: selected.wardrobeDetox ? WARDROBE_DETOX_PRICE : 0,
          smart_shoppers_guide_price: selected.smartShopper ? SMART_SHOPPER_PRICE : 0,
          outfit_preview_price: selected.outfitPreview ? OUTFIT_PREVIEW_PRICE : 0,
          attribution: getAttributionPayload(),
          scan_token: scanToken || undefined,
        }),
      });

      if (!response.ok) throw new Error('Payment initialization failed');
      const responseData = await response.json();
      if (!responseData.success) throw new Error(responseData.error || 'Payment initialization failed');

      const openRazorpay = () => {
        const paymentWindow = window as RazorpayWindow;
        if (!paymentWindow.Razorpay) return;
        const options: RazorpayOptions = {
          key: responseData.key,
          amount: responseData.amount,
          currency: responseData.currency,
          name: 'Iconik One On One',
          description: 'ICONIK Style Blueprint',
          image: `${window.location.origin}/logopayment.webp`,
          order_id: responseData.razorpay_order_id,
          handler: (razorpayResponse) => {
            const paymentId = razorpayResponse.razorpay_payment_id;
            // Passing the payment ID as the event ID makes this the same event
            // as the Conversions API Purchase the order.paid webhook will send.
            trackPurchase(
              paymentAmount,
              INDIA_BLUEPRINT_CONTENT_NAME,
              contentIds,
              contentIds.length,
              'INR',
              contentCategory,
              paymentId,
              paymentId,
            );

            storeMetaPurchaseHandoff({
              paymentId,
              amount: paymentAmount,
              currency: 'INR',
              contentIds,
              contentName: INDIA_BLUEPRINT_CONTENT_NAME,
              contentCategory,
              email,
              phone,
              phoneCountryCode: INDIA_PHONE_COUNTRY_CODE,
            });

            window.sessionStorage.removeItem(storageKey);
            window.localStorage.setItem('customerEmail', email);
            window.localStorage.setItem('customerPhone', phone);
            if (responseData.customer_id) {
              window.localStorage.setItem('customerId', responseData.customer_id);
              window.sessionStorage.setItem('customerId', responseData.customer_id);
            }
            if (responseData.db_order_id) {
              window.localStorage.setItem('orderId', responseData.db_order_id);
              window.sessionStorage.setItem('orderId', responseData.db_order_id);
            }

            // Only the payment ID travels in the URL — it is the success page's
            // deduplication key. The customer and order IDs are handed over in
            // storage above rather than leaking into Meta's event_source_url.
            window.location.href = `/checkout/success?payment_id=${encodeURIComponent(paymentId)}`;
          },
          prefill: { name: email.split('@')[0], email, contact: phone },
          theme: { color: designVariant ? '#6A1F2B' : '#2C2622' },
          modal: { ondismiss: () => setIsProcessing(false) },
        };
        new paymentWindow.Razorpay(options).open();
      };

      const paymentWindow = window as RazorpayWindow;
      if (razorpayLoaded && paymentWindow.Razorpay) {
        openRazorpay();
        return;
      }

      const checkRazorpay = window.setInterval(() => {
        if (paymentWindow.Razorpay) {
          window.clearInterval(checkRazorpay);
          openRazorpay();
        }
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(checkRazorpay);
        if (!paymentWindow.Razorpay) {
          setIsProcessing(false);
          window.alert('Failed to load the secure payment window. Please try again.');
        }
      }, 10000);
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      window.alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    }
  }, [basePrice, checkoutEventLocation, checkoutSource, contentCategory, designVariant, email, outfitPreview, phone, razorpayLoaded, scanToken, smartShopper, storageKey, topicKey, validateDetails, wardrobeDetox, whatsappOptIn]);

  const addonCards = [
    {
      key: 'outfitpreview' as const,
      title: 'AI Outfit Preview',
      price: OUTFIT_PREVIEW_PRICE,
      description: 'See your outfits on your own body before you buy them.',
      selected: outfitPreview,
      badge: '87% also added this',
    },
    {
      key: 'wardrobedetox' as const,
      title: 'Wardrobe Detox',
      price: WARDROBE_DETOX_PRICE,
      description: 'We check your wardrobe and tell you what to keep, alter, give away and replace.',
      selected: wardrobeDetox,
    },
    {
      key: 'smartshopper' as const,
      title: "Smart Shopper's Guide",
      price: SMART_SHOPPER_PRICE,
      description: 'A ready shopping list for your body, lifestyle and budget.',
      selected: smartShopper,
    },
  ];

  const packageContents = (
    <>
      <div className="mt-5 space-y-3">
        {packageItems.map((item) => (
          <div key={item} className="flex items-start gap-3 text-sm leading-5 text-[#2C2622]/75">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7F87]" strokeWidth={2.5} />
            <span>{item}</span>
          </div>
        ))}
        {topicNote && (
          <div className="flex items-start gap-3 text-sm font-semibold leading-5 text-[#2C2622]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7F87]" strokeWidth={2.5} />
            <span>{topicNote}</span>
          </div>
        )}
      </div>
      <div className="root-checkout-bonuses mt-5 rounded-2xl border border-dashed border-[#54705d]/40 bg-[#54705d]/[0.06] p-4">
        <div className="iconik-micro mb-3 text-[#54705d]">Free with your Blueprint</div>
        <div className="space-y-2.5">
          {OFFER_FREE_BONUSES.map((bonus) => (
            <div key={bonus.title} className="flex items-center justify-between gap-3 text-sm leading-5 text-[#2C2622]/80">
              <span>{bonus.title}</span>
              <span className="shrink-0 text-xs font-bold tracking-[0.1em] text-[#54705d]">FREE</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className={`man-editorial min-h-screen bg-[#F8F3E9] ${designVariant ? `root-design-preview root-checkout-preview root-concept-${designVariant}` : ''}`}>
      <header className="sticky top-0 z-40 border-b border-[#2C2622]/10 bg-[#F8F3E9]/95 backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-5xl items-center justify-center px-4 py-4">
          <Link href={backHref} aria-label="Back to the ICONIK offer" className="absolute left-4 inline-flex min-h-10 items-center gap-2 text-[#2C2622]/65 transition-opacity hover:opacity-70">
            <ArrowLeft className="h-4 w-4" />
            <span className="iconik-mono text-[10px] tracking-[0.12em]"><span className="sm:hidden">Back</span><span className="hidden sm:inline">Back to ICONIK</span></span>
          </Link>
          <span className="iconik-display text-lg tracking-[0.12em] text-[#2C2622]">ICONIK</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-8 pb-28 sm:pt-12 lg:pb-12">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="iconik-micro mb-3 text-[#2C2622]/45">Secure Checkout</div>
          <h1 className="iconik-display text-3xl leading-tight text-[#2C2622] sm:text-5xl">Book Your <span className="root-serif-moment">Personal Style Blueprint</span></h1>
          <p className="mt-3 text-sm leading-6 text-[#2C2622]/60 sm:text-base">Add your email and WhatsApp number, then pay. It takes about a minute.</p>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void processPayment(); }} noValidate>
          <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
            <aside className="hidden rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-24 lg:block">
              <div className="flex items-start justify-between gap-4 border-b border-[#2C2622]/10 pb-5">
                <div>
                  <div className="iconik-micro mb-2 text-[#2C2622]/45">Your Package</div>
                  <h2 className="iconik-display text-2xl leading-tight text-[#2C2622]">ICONIK Personal Style Blueprint</h2>
                </div>
                <div className="iconik-display shrink-0 text-2xl text-[#2C2622]">{formatINR(basePrice)}</div>
              </div>

              {packageContents}

              <div className="checkout-featured-quote mt-6">
                <div className="iconik-micro mb-3 text-[#54705d]">{CLIENT_PROOF.womenStyled.toLocaleString('en-IN')}+ women styled</div>
                <FeaturedClientMessage />
              </div>
            </aside>

            <div className="min-w-0 space-y-6">
              {/* On phones the package folds to one line so the form starts on
                  the first screen; the full list is one tap away. */}
              <details className="checkout-package-mobile group rounded-2xl border border-[#2C2622]/10 bg-white p-5 shadow-sm lg:hidden">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="iconik-micro mb-1.5 text-[#2C2622]/45">Your Package</div>
                      <h2 className="iconik-display text-lg leading-tight text-[#2C2622]">ICONIK Personal Style Blueprint</h2>
                    </div>
                    <div className="iconik-display shrink-0 text-2xl text-[#2C2622]">{formatINR(basePrice)}</div>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-[#2C2622]/70">Stylist call · 20 outfits · your colours · <span className="font-semibold text-[#54705d]">4 free guides</span></p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2C2622]/70">
                    See what&apos;s included
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                {packageContents}
              </details>

              <section className="rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                  <div className="iconik-micro mb-2 text-[#2C2622]/45">Your Details</div>
                  <h2 className="iconik-display text-2xl text-[#2C2622]">Where should we contact you?</h2>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="offer-email" className="mb-2 block text-sm font-semibold text-[#2C2622]">Email</label>
                    <input
                      id="offer-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => { setEmail(event.target.value); setEmailError(''); }}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#2C2622]/20 bg-white px-4 py-3.5 text-base text-[#2C2622] outline-none transition focus:border-[#2C2622] focus:ring-2 focus:ring-[#2C2622]/10"
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? 'offer-email-error' : undefined}
                    />
                    {emailError && <p id="offer-email-error" className="mt-1.5 text-sm text-red-700">{emailError}</p>}
                  </div>
                  <div>
                    <label htmlFor="offer-phone" className="mb-2 block text-sm font-semibold text-[#2C2622]">WhatsApp number</label>
                    <input
                      id="offer-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(value);
                        setPhoneError('');
                      }}
                      placeholder="10-digit number"
                      className="w-full rounded-xl border border-[#2C2622]/20 bg-white px-4 py-3.5 text-base text-[#2C2622] outline-none transition focus:border-[#2C2622] focus:ring-2 focus:ring-[#2C2622]/10"
                      aria-invalid={Boolean(phoneError)}
                      aria-describedby={phoneError ? 'offer-phone-error' : undefined}
                    />
                    {phoneError && <p id="offer-phone-error" className="mt-1.5 text-sm text-red-700">{phoneError}</p>}
                  </div>
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#2C2622]/10 bg-[#F8F3E9]/60 p-3.5">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(event) => setWhatsappOptIn(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#2C2622]"
                  />
                  <span className="text-xs leading-5 text-[#2C2622]/65">
                    Send my order confirmation, call booking link and updates on WhatsApp. I can stop these any time.
                  </span>
                </label>
                <p className="mt-3 text-xs leading-5 text-[#2C2622]/50">We keep your details private and use them only for your order: your payment, your call, and a reminder email if you don&apos;t finish checkout. We always send a confirmation email.</p>
              </section>

              <section className="rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                  <div className="iconik-micro mb-2 text-[#2C2622]/45">Optional</div>
                  <h2 className="iconik-display text-2xl text-[#2C2622]">Want to add more?</h2>
                  <p className="mt-2 text-sm leading-6 text-[#2C2622]/60">Your {formatINR(basePrice)} Blueprint is complete without these. Add one only if it helps you.</p>
                </div>
                <div className="space-y-3">
                  {addonCards.map((addon) => (
                    <label
                      key={addon.key}
                      className={`block cursor-pointer rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-[#2C2622] focus-within:ring-offset-2 sm:p-5 ${addon.selected ? 'border-[#2C2622] bg-[#F8F3E9]' : addon.badge ? 'border-[#A9874F]/45 bg-[#F8F3E9]/55 hover:border-[#A9874F]' : 'border-[#2C2622]/15 bg-white hover:border-[#2C2622]/35'}`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={addon.selected}
                        onChange={(event) => handleAddonChange(addon.key, event.target.checked)}
                      />
                      <span className="flex items-start gap-3 sm:gap-4">
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${addon.selected ? 'border-[#2C2622] bg-[#2C2622]' : 'border-[#2C2622]/25 bg-white'}`}>
                          {addon.selected && <Check className="h-4 w-4 text-[#F4EFE5]" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center justify-between gap-2">
                            <span className="iconik-display text-lg leading-tight text-[#2C2622]">{addon.title} · {formatINR(addon.price)}</span>
                            {addon.badge && <span className="rounded-full bg-[#A9874F] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">{addon.badge}</span>}
                          </span>
                          <span className="mt-2 block text-sm leading-6 text-[#2C2622]/65">{addon.description}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Proof sits right before the total and Pay button, where doubt
                  peaks, instead of splitting the form from the add-ons. Desktop
                  shows one quote in the sticky package column instead. */}
              <section aria-label="Client WhatsApp messages" className="checkout-proof rounded-3xl border border-[#2C2622]/10 bg-white p-5 shadow-sm sm:p-6 lg:hidden">
                <ClientMessagesStrip compact />
              </section>

              <section className="rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-end justify-between gap-4 border-b border-[#2C2622]/10 pb-5">
                  <div>
                    <div className="text-sm text-[#2C2622]/55">Your total</div>
                    <div className="mt-1 text-xs text-[#2C2622]/45">Hair, makeup, hair colour and glasses guides free</div>
                  </div>
                  <div className="iconik-display text-3xl text-[#2C2622]">{formatINR(totalAmount)}</div>
                </div>

                <button
                  ref={payButtonRef}
                  type="submit"
                  disabled={isProcessing}
                  className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#2C2622] px-5 py-4 text-center text-sm font-semibold text-[#F4EFE5] transition hover:bg-[#3d3430] focus:outline-none focus:ring-2 focus:ring-[#2C2622] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                >
                  <Lock className="h-4 w-4 shrink-0" />
                  {isProcessing ? 'Opening secure Razorpay payment…' : `Pay ${formatINR(totalAmount)} Securely`}
                </button>

                <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[#94A6AD]/15 p-3.5 text-xs leading-5 text-[#2C2622]/75">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#6A1F2B]" />
                  <span><strong className="text-[#2C2622]">Free-changes promise.</strong> {FREE_CHANGES_PROMISE}</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                  {trustItems.map((item) => (
                    <div key={item} className="flex items-start gap-1.5 text-[10px] leading-4 text-[#2C2622]/60 sm:text-[11px]">
                      <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-[#6B7F87]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

              </section>
            </div>
          </div>
        </form>
      </main>

      <div
        className={`checkout-pay-bar fixed inset-x-0 bottom-0 z-50 border-t border-[#2C2622]/10 bg-[#F8F3E9]/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl transition-all duration-300 lg:hidden ${showPayBar ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'}`}
        aria-hidden={!showPayBar}
      >
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="shrink-0">
            <div className="iconik-display text-lg leading-none text-[#2C2622]">{formatINR(totalAmount)}</div>
            <div className="mt-1 text-[10px] font-semibold text-[#54705d]">+ 4 free guides</div>
          </div>
          <button
            type="button"
            tabIndex={showPayBar ? 0 : -1}
            disabled={isProcessing}
            onClick={() => void processPayment()}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#2C2622] px-4 py-3 text-sm font-semibold text-[#F4EFE5] disabled:opacity-60"
          >
            <Lock className="h-4 w-4 shrink-0" />
            {isProcessing ? 'Opening payment…' : `Pay ${formatINR(totalAmount)} Securely`}
          </button>
        </div>
      </div>

    </div>
  );
}
