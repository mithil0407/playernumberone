'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Lock, ShieldCheck } from 'lucide-react';
import { getAttributionPayload } from '@/lib/attribution';
import { CLIENT_PROOF } from '@/lib/siteFacts';
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
  INDIA_FUNNEL_CATEGORY,
  INDIA_FUNNEL_ENTRY_STORAGE_KEY,
  INDIA_OUTFIT_PREVIEW_PRODUCT_ID,
  INDIA_SMART_SHOPPER_PRODUCT_ID,
  INDIA_WARDROBE_DETOX_PRODUCT_ID,
  indiaFunnelCategoryFromEntry,
} from '@/lib/metaTrackingContract';

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
  outfitPreview: boolean;
  wardrobeDetox: boolean;
  smartShopper: boolean;
}

const STORAGE_KEY = 'iconik_offer_2699_checkout';
const BASE_PRICE = 2699;
const OUTFIT_PREVIEW_PRICE = 999;
const WARDROBE_DETOX_PRICE = 1499;
const SMART_SHOPPER_PRICE = 499;
const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const packageItems = [
  '30-minute private video consultation',
  '20 personalised outfits',
  'Body-shape and concern-zone analysis',
  'Personal colour palette',
  'Hair and makeup guidance',
];

const trustItems = [
  'Secure payment through Razorpay',
  'UPI, cards, netbanking and wallets accepted',
  'Add-ons are completely optional',
  'Consultation scheduling details sent on WhatsApp',
];

const testimonialScreenshots = [
  { src: '/text1.webp', alt: 'WhatsApp feedback from an ICONIK client' },
  { src: '/text2.webp', alt: 'WhatsApp feedback from an ICONIK client' },
  { src: '/text3.webp', alt: 'WhatsApp feedback from an ICONIK client' },
  { src: '/text4.webp', alt: 'WhatsApp feedback from an ICONIK client' },
  { src: '/text5.webp', alt: 'WhatsApp feedback from an ICONIK client' },
];

export default function Offer2699CheckoutPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [outfitPreview, setOutfitPreview] = useState(false);
  const [wardrobeDetox, setWardrobeDetox] = useState(false);
  const [smartShopper, setSmartShopper] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  // Which landing page the visitor entered through. `/` and `/offer-2699` share
  // this checkout, so without carrying the entry point forward neither can be
  // credited for the conversions it drove.
  const [contentCategory, setContentCategory] = useState<string>(INDIA_FUNNEL_CATEGORY);

  const totalAmount = useMemo(
    () => BASE_PRICE
      + (outfitPreview ? OUTFIT_PREVIEW_PRICE : 0)
      + (wardrobeDetox ? WARDROBE_DETOX_PRICE : 0)
      + (smartShopper ? SMART_SHOPPER_PRICE : 0),
    [outfitPreview, wardrobeDetox, smartShopper],
  );

  useEffect(() => {
    let entryCategory = INDIA_FUNNEL_CATEGORY;
    try {
      entryCategory = indiaFunnelCategoryFromEntry(
        window.sessionStorage.getItem(INDIA_FUNNEL_ENTRY_STORAGE_KEY),
      );
    } catch {
      // Analytics must never block the user journey.
    }
    setContentCategory(entryCategory);
    trackViewContent('ICONIK Style Blueprint - Checkout', BASE_PRICE, [INDIA_BLUEPRINT_PRODUCT_ID], 'INR', entryCategory);

    try {
      const storedDraft = window.sessionStorage.getItem(STORAGE_KEY);
      if (storedDraft) {
        const draft = JSON.parse(storedDraft) as Partial<CheckoutDraft>;
        setEmail(typeof draft.email === 'string' ? draft.email : '');
        setPhone(typeof draft.phone === 'string' ? draft.phone : '');
        setOutfitPreview(Boolean(draft.outfitPreview));
        setWardrobeDetox(Boolean(draft.wardrobeDetox));
        setSmartShopper(Boolean(draft.smartShopper));
      }
    } catch (error) {
      console.warn('Unable to restore offer checkout details:', error);
    } finally {
      setHasRestoredDraft(true);
    }

  }, []);

  useEffect(() => {
    if (!hasRestoredDraft) return;
    const draft: CheckoutDraft = { email, phone, outfitPreview, wardrobeDetox, smartShopper };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [email, phone, outfitPreview, wardrobeDetox, smartShopper, hasRestoredDraft]);

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

  const validateDetails = useCallback(() => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validPhone = /^\d{10}$/.test(phone);
    setEmailError(validEmail ? '' : 'Enter a valid email address.');
    setPhoneError(validPhone ? '' : 'Enter a valid 10-digit WhatsApp number.');
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
    const paymentAmount = BASE_PRICE
      + (selected.outfitPreview ? OUTFIT_PREVIEW_PRICE : 0)
      + (selected.wardrobeDetox ? WARDROBE_DETOX_PRICE : 0)
      + (selected.smartShopper ? SMART_SHOPPER_PRICE : 0);
    const contentIds = buildIndiaBlueprintContentIds(selected);
    const itemCount = contentIds.length;

    updateUserData(email, phone, INDIA_PHONE_COUNTRY_CODE);
    trackCTAClick('Pay Securely', 'Offer Checkout', paymentAmount, 'INR', contentCategory);
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
          amount: paymentAmount,
          checkout_source: 'offer_2699_checkout',
          // Recorded in the Razorpay order notes so the webhook can send the
          // server-side Purchase with the same content_category as the browser.
          funnel_entry: contentCategory,
          base_product: 'Iconik Style Consultation',
          add_ons: {
            wardrobe_detox: selected.wardrobeDetox,
            smart_shoppers_guide: selected.smartShopper,
            outfit_preview: selected.outfitPreview,
          },
          total_base_price: BASE_PRICE,
          wardrobe_detox_price: selected.wardrobeDetox ? WARDROBE_DETOX_PRICE : 0,
          smart_shoppers_guide_price: selected.smartShopper ? SMART_SHOPPER_PRICE : 0,
          outfit_preview_price: selected.outfitPreview ? OUTFIT_PREVIEW_PRICE : 0,
          attribution: getAttributionPayload(),
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

            window.sessionStorage.removeItem(STORAGE_KEY);
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
          theme: { color: '#2C2622' },
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
  }, [email, phone, outfitPreview, wardrobeDetox, smartShopper, razorpayLoaded, validateDetails, contentCategory]);

  const addonCards = [
    {
      key: 'outfitpreview' as const,
      title: 'AI Outfit Preview',
      price: OUTFIT_PREVIEW_PRICE,
      description: 'See how your recommended outfits could look on your body before you shop.',
      selected: outfitPreview,
      badge: 'Recommended',
    },
    {
      key: 'wardrobedetox' as const,
      title: 'Wardrobe Detox',
      price: WARDROBE_DETOX_PRICE,
      description: 'We review your wardrobe and tell you what to keep, alter, donate and replace.',
      selected: wardrobeDetox,
    },
    {
      key: 'smartshopper' as const,
      title: "Smart Shopper's Guide",
      price: SMART_SHOPPER_PRICE,
      description: 'Get a ready-to-shop guide matched to your body, lifestyle and budget.',
      selected: smartShopper,
    },
  ];

  return (
    <div className="man-editorial min-h-screen bg-[#F8F3E9]">
      <header className="sticky top-0 z-40 border-b border-[#2C2622]/10 bg-[#F8F3E9]/95 backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-5xl items-center justify-center px-4 py-4">
          <Link href="/offer-2699" aria-label="Back to the ICONIK offer" className="absolute left-4 inline-flex min-h-10 items-center gap-2 text-[#2C2622]/65 transition-opacity hover:opacity-70">
            <ArrowLeft className="h-4 w-4" />
            <span className="iconik-mono text-[10px] tracking-[0.12em]"><span className="sm:hidden">Back</span><span className="hidden sm:inline">Back to ICONIK</span></span>
          </Link>
          <span className="iconik-display text-lg tracking-[0.12em] text-[#2C2622]">ICONIK</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="iconik-micro mb-3 text-[#2C2622]/45">Secure One-Page Checkout</div>
          <h1 className="iconik-display text-3xl leading-tight text-[#2C2622] sm:text-5xl">Complete Your Style Blueprint</h1>
          <p className="mt-3 text-sm leading-6 text-[#2C2622]/60 sm:text-base">Enter your details, choose any optional add-ons, and pay securely—all on this page.</p>
        </div>

        <section aria-label="Client WhatsApp testimonials" className="mx-auto mb-6 max-w-2xl rounded-2xl border border-[#2C2622]/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-[110px_1fr] items-center gap-4 sm:grid-cols-[130px_1fr] sm:gap-6">
            <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-[#2C2622]/10 bg-[#F8F3E9]" aria-live="polite">
              {testimonialScreenshots.map((testimonial, index) => (
                <div
                  key={testimonial.src}
                  className={`absolute inset-0 transition-opacity duration-500 ${index === currentTestimonial ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                  aria-hidden={index !== currentTestimonial}
                >
                  <Image src={testimonial.src} alt={testimonial.alt} fill sizes="(max-width: 640px) 110px, 130px" className="object-cover" priority={index === 0} />
                </div>
              ))}
            </div>

            <div>
              <div className="iconik-micro mb-2 text-[#2C2622]/45">Client Messages</div>
              <h2 className="iconik-display text-xl leading-tight text-[#2C2622] sm:text-2xl">What our clients sent us</h2>
              <p className="mt-2 text-xs leading-5 text-[#2C2622]/60">WhatsApp feedback from women after working with ICONIK.</p>

              <div className="mt-4 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentTestimonial((current) => (current - 1 + testimonialScreenshots.length) % testimonialScreenshots.length)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2C2622]/15 text-[#2C2622] transition hover:border-[#2C2622]/35 hover:bg-[#F8F3E9] focus:outline-none focus:ring-2 focus:ring-[#2C2622] focus:ring-offset-2"
                  aria-label="Previous client message"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="iconik-mono min-w-7 text-center text-[8px] text-[#2C2622]/50">{currentTestimonial + 1}/{testimonialScreenshots.length}</span>
                <button
                  type="button"
                  onClick={() => setCurrentTestimonial((current) => (current + 1) % testimonialScreenshots.length)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2C2622]/15 text-[#2C2622] transition hover:border-[#2C2622]/35 hover:bg-[#F8F3E9] focus:outline-none focus:ring-2 focus:ring-[#2C2622] focus:ring-offset-2"
                  aria-label="Next client message"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={(event) => { event.preventDefault(); void processPayment(); }} noValidate>
          <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
            <aside className="hidden rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-24 lg:block">
              <div className="flex items-start justify-between gap-4 border-b border-[#2C2622]/10 pb-5">
                <div>
                  <div className="iconik-micro mb-2 text-[#2C2622]/45">Your Package</div>
                  <h2 className="iconik-display text-2xl leading-tight text-[#2C2622]">ICONIK Style Blueprint</h2>
                </div>
                <div className="iconik-display shrink-0 text-2xl text-[#2C2622]">₹2,699</div>
              </div>

              <div className="mt-6 space-y-3">
                {packageItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-5 text-[#2C2622]/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7F87]" strokeWidth={2.5} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-[#F8F3E9] p-4 text-center">
                <div className="iconik-display text-lg text-[#2C2622]">Trusted by {CLIENT_PROOF.totalClients.toLocaleString('en-IN')}+ clients</div>
                <p className="mt-1 text-xs text-[#2C2622]/55">Personal styling delivered across {CLIENT_PROOF.countriesServed}+ countries</p>
              </div>
            </aside>

            <div className="space-y-6">
              <section className="rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                  <div className="iconik-micro mb-2 text-[#2C2622]/45">Your Details</div>
                  <h2 className="iconik-display text-2xl text-[#2C2622]">Where should we contact you?</h2>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="offer-email" className="mb-2 block text-sm font-semibold text-[#2C2622]">Email Address</label>
                    <input
                      id="offer-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => { setEmail(event.target.value); setEmailError(''); }}
                      className="w-full rounded-xl border border-[#2C2622]/20 bg-white px-4 py-3.5 text-base text-[#2C2622] outline-none transition focus:border-[#2C2622] focus:ring-2 focus:ring-[#2C2622]/10"
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? 'offer-email-error' : undefined}
                    />
                    {emailError && <p id="offer-email-error" className="mt-1.5 text-sm text-red-700">{emailError}</p>}
                  </div>
                  <div>
                    <label htmlFor="offer-phone" className="mb-2 block text-sm font-semibold text-[#2C2622]">WhatsApp Number</label>
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
                <p className="mt-4 text-xs leading-5 text-[#2C2622]/50">Your details are private and used only for payment and consultation coordination.</p>
              </section>

              <section className="rounded-2xl border border-[#2C2622]/10 bg-white p-5 shadow-sm lg:hidden">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="iconik-micro mb-2 text-[#2C2622]/45">Your Package</div>
                    <h2 className="iconik-display text-xl text-[#2C2622]">ICONIK Style Blueprint</h2>
                  </div>
                  <div className="iconik-display shrink-0 text-2xl text-[#2C2622]">₹2,699</div>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#2C2622]/60">20 personalised outfits · colour palette · 30-minute video consultation</p>
              </section>

              <section className="rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                  <div className="iconik-micro mb-2 text-[#2C2622]/45">Optional</div>
                  <h2 className="iconik-display text-2xl text-[#2C2622]">Enhance Your Blueprint</h2>
                  <p className="mt-2 text-sm leading-6 text-[#2C2622]/60">Your ₹2,699 Blueprint is complete on its own. Add only what feels useful to you.</p>
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

              <section className="rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-end justify-between gap-4 border-b border-[#2C2622]/10 pb-5">
                  <div>
                    <div className="text-sm text-[#2C2622]/55">Your total</div>
                    <div className="mt-1 text-xs text-[#2C2622]/45">Includes selected add-ons</div>
                  </div>
                  <div className="iconik-display text-3xl text-[#2C2622]">{formatINR(totalAmount)}</div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#2C2622] px-5 py-4 text-center text-sm font-semibold text-[#F4EFE5] transition hover:bg-[#3d3430] focus:outline-none focus:ring-2 focus:ring-[#2C2622] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                >
                  <Lock className="h-4 w-4 shrink-0" />
                  {isProcessing ? 'Opening secure Razorpay payment…' : `Pay ${formatINR(totalAmount)} Securely`}
                </button>

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
    </div>
  );
}
