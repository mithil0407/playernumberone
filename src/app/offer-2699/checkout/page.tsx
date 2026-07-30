'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Check, ChevronRight, Lock, ShieldCheck } from 'lucide-react';
import { getAttributionPayload } from '@/lib/attribution';
import {
  trackAddToCart,
  trackCTAClick,
  trackInitiateCheckout,
  trackPurchase,
  trackRemoveFromCart,
  trackViewContent,
  updateUserData,
} from '@/lib/metaPixel';

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

type CheckoutStep = 'details' | 'customise';
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

const testimonialImages = [
  { src: '/text1.webp', alt: 'ICONIK client testimonial 1' },
  { src: '/text2.webp', alt: 'ICONIK client testimonial 2' },
  { src: '/text3.webp', alt: 'ICONIK client testimonial 3' },
  { src: '/text4.webp', alt: 'ICONIK client testimonial 4' },
  { src: '/text5.webp', alt: 'ICONIK client testimonial 5' },
];

export default function Offer2699CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>('details');
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

  const totalAmount = useMemo(
    () => BASE_PRICE
      + (outfitPreview ? OUTFIT_PREVIEW_PRICE : 0)
      + (wardrobeDetox ? WARDROBE_DETOX_PRICE : 0)
      + (smartShopper ? SMART_SHOPPER_PRICE : 0),
    [outfitPreview, wardrobeDetox, smartShopper],
  );

  useEffect(() => {
    trackViewContent('ICONIK Style Blueprint - Checkout', BASE_PRICE, ['iconik_style_consultation'], 'INR', 'India');

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

    if (window.history.state?.iconikOfferStep === 'customise') {
      setStep('customise');
    }

    const handlePopState = (event: PopStateEvent) => {
      setStep(event.state?.iconikOfferStep === 'customise' ? 'customise' : 'details');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!hasRestoredDraft) return;
    const draft: CheckoutDraft = { email, phone, outfitPreview, wardrobeDetox, smartShopper };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [email, phone, outfitPreview, wardrobeDetox, smartShopper, hasRestoredDraft]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTestimonial((current) => (current + 1) % testimonialImages.length);
    }, 4000);
    return () => window.clearInterval(interval);
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

  const continueToCustomise = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (!validateDetails()) return;
    updateUserData(email, phone);
    trackCTAClick('Continue to Customise Your Package', 'Offer Checkout Details', BASE_PRICE, 'INR', 'India');
    window.history.pushState({ ...window.history.state, iconikOfferStep: 'customise' }, '', window.location.href);
    setStep('customise');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [email, phone, validateDetails]);

  const returnToDetails = useCallback(() => {
    if (window.history.state?.iconikOfferStep === 'customise') {
      window.history.back();
    } else {
      setStep('details');
    }
  }, []);

  const handleAddonChange = useCallback((addon: AddonKey, checked: boolean) => {
    const details = {
      outfitpreview: { name: 'AI Outfit Preview', price: OUTFIT_PREVIEW_PRICE, id: 'outfit_preview' },
      wardrobedetox: { name: 'Wardrobe Detox', price: WARDROBE_DETOX_PRICE, id: 'wardrobe_detox' },
      smartshopper: { name: "Smart Shopper's Guide", price: SMART_SHOPPER_PRICE, id: 'smart_shoppers_guide' },
    }[addon];

    if (checked) trackAddToCart(details.name, details.price, details.id, 'INR', 'India');
    else trackRemoveFromCart(details.name, details.price, details.id, 'INR', 'India');

    if (addon === 'outfitpreview') setOutfitPreview(checked);
    if (addon === 'wardrobedetox') setWardrobeDetox(checked);
    if (addon === 'smartshopper') setSmartShopper(checked);
  }, []);

  const processPayment = useCallback(async (skipAddons = false) => {
    if (!validateDetails()) {
      setStep('details');
      return;
    }

    const selected = {
      outfitPreview: skipAddons ? false : outfitPreview,
      wardrobeDetox: skipAddons ? false : wardrobeDetox,
      smartShopper: skipAddons ? false : smartShopper,
    };
    const paymentAmount = BASE_PRICE
      + (selected.outfitPreview ? OUTFIT_PREVIEW_PRICE : 0)
      + (selected.wardrobeDetox ? WARDROBE_DETOX_PRICE : 0)
      + (selected.smartShopper ? SMART_SHOPPER_PRICE : 0);
    const itemCount = 1 + Number(selected.outfitPreview) + Number(selected.wardrobeDetox) + Number(selected.smartShopper);

    setIsProcessing(true);
    trackInitiateCheckout(paymentAmount, itemCount, 'ICONIK Style Blueprint', 'INR', 'India');

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
            const purchasedItems = ['iconik_style_consultation'];
            if (selected.outfitPreview) purchasedItems.push('outfit_preview');
            if (selected.wardrobeDetox) purchasedItems.push('wardrobe_detox');
            if (selected.smartShopper) purchasedItems.push('smart_shoppers_guide');
            trackPurchase(paymentAmount, 'ICONIK Complete Package', purchasedItems, purchasedItems.length, 'INR', 'India', razorpayResponse.razorpay_payment_id);

            window.sessionStorage.removeItem(STORAGE_KEY);
            window.localStorage.setItem('purchaseAmount', paymentAmount.toString());
            window.localStorage.setItem('purchaseCurrency', 'INR');
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

            window.location.href = `/checkout/success?payment_id=${razorpayResponse.razorpay_payment_id}&order_id=${responseData.razorpay_order_id}&customer_id=${responseData.customer_id}&db_order_id=${responseData.db_order_id}&amount=${paymentAmount}`;
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
  }, [email, phone, outfitPreview, wardrobeDetox, smartShopper, razorpayLoaded, validateDetails]);

  const addonCards = [
    {
      key: 'outfitpreview' as const,
      title: 'AI Outfit Preview',
      price: OUTFIT_PREVIEW_PRICE,
      description: 'See how your recommended outfits could look on your body before you shop.',
      selected: outfitPreview,
      badge: 'Most Popular',
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
    <div className={`man-editorial min-h-screen bg-[#F8F3E9] ${step === 'customise' ? 'pb-[330px] sm:pb-[285px]' : ''}`}>
      <header className="sticky top-0 z-40 border-b border-[#2C2622]/10 bg-[#F8F3E9]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/offer-2699" className="inline-flex items-center gap-2 text-[#2C2622]/65 transition-opacity hover:opacity-70">
            <ArrowLeft className="h-4 w-4" />
            <span className="iconik-mono text-[10px] tracking-[0.12em]">Back to ICONIK</span>
          </Link>
          <span className="iconik-display text-lg tracking-[0.12em] text-[#2C2622]">ICONIK</span>
          <div className="w-[92px]" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-7 sm:py-10">
        <div className="mb-7 flex items-center justify-center gap-3 text-sm" aria-label="Checkout progress">
          <span className={`font-semibold ${step === 'details' ? 'text-[#2C2622]' : 'text-[#2C2622]/45'}`}>Details</span>
          <ChevronRight className="h-4 w-4 text-[#2C2622]/30" />
          <span className={`font-semibold ${step === 'customise' ? 'text-[#2C2622]' : 'text-[#2C2622]/45'}`}>Customise &amp; Pay</span>
        </div>

        {step === 'details' ? (
          <div className="mx-auto max-w-xl space-y-6">
            <section aria-label="Client testimonials" className="mx-auto w-full max-w-[210px] text-center">
              <div className="iconik-display mb-3 text-lg text-[#2C2622]">Real Results from Real Women</div>
              <div className="rounded-2xl border border-[#2C2622]/10 bg-[#EDE5D2]/50 p-2">
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-white">
                  {testimonialImages.map((testimonial, index) => (
                    <div
                      key={testimonial.src}
                      className={`absolute inset-0 transition-opacity duration-500 ${index === currentTestimonial ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                      aria-hidden={index !== currentTestimonial}
                    >
                      <Image src={testimonial.src} alt={testimonial.alt} fill sizes="210px" className="object-cover" priority={index === 0} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex justify-center gap-2">
                {testimonialImages.map((testimonial, index) => (
                  <button
                    key={testimonial.src}
                    type="button"
                    onClick={() => setCurrentTestimonial(index)}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: index === currentTestimonial ? '16px' : '6px', background: index === currentTestimonial ? '#2C2622' : 'rgba(44,38,34,0.2)' }}
                    aria-label={`View testimonial ${index + 1}`}
                    aria-current={index === currentTestimonial ? 'true' : undefined}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8">
              <h1 className="iconik-display text-2xl text-[#2C2622] sm:text-3xl">Your ICONIK Style Blueprint — ₹2,699</h1>
              <div className="mt-6 space-y-3">
                {packageItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-[#2C2622]/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7F87]" strokeWidth={2.5} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <form onSubmit={continueToCustomise} className="rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8" noValidate>
              <div className="space-y-5">
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
                    placeholder="10-digit WhatsApp number"
                    className="w-full rounded-xl border border-[#2C2622]/20 bg-white px-4 py-3.5 text-base text-[#2C2622] outline-none transition focus:border-[#2C2622] focus:ring-2 focus:ring-[#2C2622]/10"
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby={phoneError ? 'offer-phone-error' : undefined}
                  />
                  {phoneError && <p id="offer-phone-error" className="mt-1.5 text-sm text-red-700">{phoneError}</p>}
                </div>
              </div>

              <button type="submit" className="mt-7 w-full rounded-full bg-[#2C2622] px-5 py-4 text-sm font-semibold text-[#F4EFE5] transition hover:bg-[#3d3430] focus:outline-none focus:ring-2 focus:ring-[#2C2622] focus:ring-offset-2">
                Continue to Customise Your Package
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-[#2C2622]/55">Your details are private and only used to coordinate your consultation.</p>
            </form>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <button type="button" onClick={returnToDetails} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#2C2622]/65 hover:text-[#2C2622]">
              <ArrowLeft className="h-4 w-4" /> Edit your details
            </button>
            <section className="rounded-3xl border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-8">
              <h1 className="iconik-display text-3xl text-[#2C2622]">Optional Add-ons</h1>
              <p className="mt-2 text-sm leading-6 text-[#2C2622]/65">Personalise your package further. Your ₹2,699 Style Blueprint is complete on its own.</p>

              <div className="mt-7 space-y-4">
                {addonCards.map((addon) => (
                  <label
                    key={addon.key}
                    className={`block cursor-pointer rounded-2xl border p-5 transition focus-within:ring-2 focus-within:ring-[#2C2622] focus-within:ring-offset-2 ${addon.selected ? 'border-[#2C2622] bg-[#F8F3E9]' : 'border-[#2C2622]/15 bg-white hover:border-[#2C2622]/35'}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={addon.selected}
                      onChange={(event) => handleAddonChange(addon.key, event.target.checked)}
                    />
                    <span className="flex items-start gap-4">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${addon.selected ? 'border-[#2C2622] bg-[#2C2622]' : 'border-[#2C2622]/25 bg-white'}`}>
                        {addon.selected && <Check className="h-4 w-4 text-[#F4EFE5]" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="iconik-display text-lg text-[#2C2622]">{addon.title} — {formatINR(addon.price)}</span>
                          {addon.badge && <span className="rounded-full bg-[#2C2622] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#F4EFE5]">{addon.badge}</span>}
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-[#2C2622]/65">{addon.description}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {step === 'customise' && (
        <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-[#2C2622]/10 bg-[#F8F3E9]/98 shadow-[0_-12px_40px_rgba(44,38,34,0.12)] backdrop-blur-xl">
          <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
              {trustItems.map((item) => (
                <div key={item} className="flex items-start gap-1.5 text-[10px] leading-4 text-[#2C2622]/65 sm:text-[11px]">
                  <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-[#6B7F87]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => { trackCTAClick('Skip Add-ons', 'Offer Checkout Payment Bar', BASE_PRICE, 'INR', 'India'); void processPayment(true); }}
              className="mt-2 text-xs font-medium text-[#2C2622]/65 underline decoration-[#2C2622]/25 underline-offset-4 hover:text-[#2C2622] disabled:opacity-50"
            >
              Skip add-ons and continue with ₹2,699
            </button>
            <div className="mt-3 flex items-center gap-4">
              <div className="min-w-[112px]">
                <div className="text-xs text-[#2C2622]/55">Your total:</div>
                <div className="iconik-display text-2xl text-[#2C2622]">{formatINR(totalAmount)}</div>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => { trackCTAClick('Pay Securely', 'Offer Checkout Payment Bar', totalAmount, 'INR', 'India'); void processPayment(false); }}
                className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[#2C2622] px-4 py-3 text-center text-sm font-semibold text-[#F4EFE5] transition hover:bg-[#3d3430] focus:outline-none focus:ring-2 focus:ring-[#2C2622] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
              >
                <Lock className="h-4 w-4 shrink-0" />
                {isProcessing ? 'Opening secure Razorpay payment…' : `Pay ${formatINR(totalAmount)} Securely`}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
