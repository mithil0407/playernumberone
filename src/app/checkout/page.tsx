'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Lock } from 'lucide-react';
import {
  INDIA_BLUEPRINT_CONTENT_NAME,
  INDIA_BLUEPRINT_PRODUCT_ID,
  INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY,
  INDIA_PHONE_COUNTRY_CODE,
  buildIndiaBlueprintContentIds,
  storeMetaPurchaseHandoff,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  updateUserData,
  trackCTAClick,
  trackRemoveFromCart,
  trackViewContent,
} from '@/lib/metaPixel';
import {
  INDIA_OUTFIT_PREVIEW_PRODUCT_ID,
  INDIA_SMART_SHOPPER_PRODUCT_ID,
  INDIA_WARDROBE_DETOX_PRODUCT_ID,
} from '@/lib/metaTrackingContract';
import { getAttributionPayload } from '@/lib/attribution';

// Razorpay types
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
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayInstance {
  open(): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface FormData {
  email: string;
  phone: string;
}

const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export default function CheckoutPage() {
  const pathname = usePathname();
  const isOffer2699Checkout = pathname.startsWith('/offer-2699/checkout');
  const landingHref = isOffer2699Checkout ? '/offer-2699' : '/';
  const [formData, setFormData] = useState<FormData>({ email: '', phone: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showAddonPopup, setShowAddonPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonialImages = [
    { src: '/text1.webp', alt: 'Client testimonial 1' },
    { src: '/text2.webp', alt: 'Client testimonial 2' },
    { src: '/text3.webp', alt: 'Client testimonial 3' },
    { src: '/text4.webp', alt: 'Client testimonial 4' },
    { src: '/text5.webp', alt: 'Client testimonial 5' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonialImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonialImages.length]);

  const originalPrice = 5999;
  const discountedPrice = isOffer2699Checkout ? 2699 : 3299;
  const savings = originalPrice - discountedPrice;

  useEffect(() => {
    trackViewContent('ICONIK Style Consultation - Checkout', discountedPrice, [INDIA_BLUEPRINT_PRODUCT_ID], 'INR', INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY);
  }, [discountedPrice]);

  const [wardrobeDetoxAddon, setWardrobeDetoxAddon] = useState(false);
  const [smartShoppersGuideAddon, setSmartShoppersGuideAddon] = useState(false);
  const [outfitPreviewAddon, setOutfitPreviewAddon] = useState(false);

  const wardrobeDetoxPrice = 1499;
  const smartShoppersGuidePrice = 499;
  const outfitPreviewPrice = 999;

  const totalAmount = useMemo(() =>
    discountedPrice +
    (wardrobeDetoxAddon ? wardrobeDetoxPrice : 0) +
    (smartShoppersGuideAddon ? smartShoppersGuidePrice : 0) +
    (outfitPreviewAddon ? outfitPreviewPrice : 0),
    [discountedPrice, wardrobeDetoxAddon, smartShoppersGuideAddon, outfitPreviewAddon]
  );

  const totalValue = useMemo(() =>
    originalPrice + 1000 +
    (wardrobeDetoxAddon ? wardrobeDetoxPrice : 0) +
    (smartShoppersGuideAddon ? smartShoppersGuidePrice : 0) +
    (outfitPreviewAddon ? outfitPreviewPrice : 0),
    [originalPrice, wardrobeDetoxAddon, smartShoppersGuideAddon, outfitPreviewAddon]
  );

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
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        else if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const phoneRegex = /^\d{0,10}$/;
      if (!phoneRegex.test(value)) return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email' && value.includes('@') && formData.phone.length === 10) {
      updateUserData(value, formData.phone, INDIA_PHONE_COUNTRY_CODE);
    } else if (name === 'phone' && value.length === 10 && formData.email.includes('@')) {
      updateUserData(formData.email, value, INDIA_PHONE_COUNTRY_CODE);
    }
  }, [formData.phone, formData.email]);

  const addonDetails = useMemo(() => ({
    wardrobedetox: { name: 'Wardrobe Detox', price: 1499, id: INDIA_WARDROBE_DETOX_PRODUCT_ID },
    smartshopper: { name: "Smart Shopper's Guide", price: 499, id: INDIA_SMART_SHOPPER_PRODUCT_ID },
    outfitpreview: { name: 'Outfit Preview on You', price: 999, id: INDIA_OUTFIT_PREVIEW_PRODUCT_ID },
  }), []);

  const handleAddonChange = useCallback((addonType: 'wardrobedetox' | 'smartshopper' | 'outfitpreview', checked: boolean) => {
    const addon = addonDetails[addonType];
    if (checked) trackAddToCart(addon.name, addon.price, addon.id, 'INR', INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY);
    else trackRemoveFromCart(addon.name, addon.price, addon.id, 'INR', INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY);
    if (addonType === 'wardrobedetox') setWardrobeDetoxAddon(checked);
    else if (addonType === 'smartshopper') setSmartShoppersGuideAddon(checked);
    else if (addonType === 'outfitpreview') setOutfitPreviewAddon(checked);
  }, [addonDetails]);

  const processPayment = useCallback(async () => {
    if (formData.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }
    setIsProcessing(true);
    const itemCount = 1 + (wardrobeDetoxAddon ? 1 : 0) + (smartShoppersGuideAddon ? 1 : 0) + (outfitPreviewAddon ? 1 : 0);
    trackInitiateCheckout(totalAmount, itemCount, 'ICONIK Style Consultation', 'INR', INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY);
    try {
      const orderData = {
        customer_name: formData.email.split('@')[0],
        customer_email: formData.email,
        customer_phone: formData.phone,
        amount: totalAmount,
        checkout_source: isOffer2699Checkout ? 'offer_2699_checkout' : 'root_checkout',
        base_product: 'Iconik Style Consultation',
        add_ons: {
          wardrobe_detox: wardrobeDetoxAddon,
          smart_shoppers_guide: smartShoppersGuideAddon,
          outfit_preview: outfitPreviewAddon,
        },
        total_base_price: discountedPrice,
        wardrobe_detox_price: wardrobeDetoxAddon ? wardrobeDetoxPrice : 0,
        smart_shoppers_guide_price: smartShoppersGuideAddon ? smartShoppersGuidePrice : 0,
        outfit_preview_price: outfitPreviewAddon ? outfitPreviewPrice : 0,
        attribution: getAttributionPayload(),
      };
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error('Payment initialization failed');
      const responseData = await response.json();
      if (!responseData.success) throw new Error(responseData.error || 'Payment initialization failed');
      console.log('Payment API Response:', responseData);
      console.log('Customer ID:', responseData.customer_id);
      console.log('DB Order ID:', responseData.db_order_id);
      const initializeRazorpay = () => {
        const options = {
          key: responseData.key,
          amount: responseData.amount,
          currency: responseData.currency,
          name: 'Iconik One On One',
          description: 'Iconik Style Consultation',
          image: `${window.location.origin}/logopayment.webp`,
          order_id: responseData.razorpay_order_id,
          handler: async function (response: RazorpayResponse) {
            const paymentId = response.razorpay_payment_id;
            const purchasedItems = buildIndiaBlueprintContentIds({
              wardrobeDetox: wardrobeDetoxAddon,
              smartShopper: smartShoppersGuideAddon,
              outfitPreview: outfitPreviewAddon,
            });
            trackPurchase(
              totalAmount,
              INDIA_BLUEPRINT_CONTENT_NAME,
              purchasedItems,
              purchasedItems.length,
              'INR',
              INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY,
              paymentId,
              paymentId,
            );
            storeMetaPurchaseHandoff({
              paymentId,
              amount: totalAmount,
              currency: 'INR',
              contentIds: purchasedItems,
              contentName: INDIA_BLUEPRINT_CONTENT_NAME,
              contentCategory: INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY,
              email: formData.email,
              phone: formData.phone,
              phoneCountryCode: INDIA_PHONE_COUNTRY_CODE,
            });
            localStorage.setItem('customerEmail', formData.email);
            localStorage.setItem('customerPhone', formData.phone);
            if (responseData.customer_id) {
              localStorage.setItem('customerId', responseData.customer_id);
              sessionStorage.setItem('customerId', responseData.customer_id);
            }
            if (responseData.db_order_id) {
              localStorage.setItem('orderId', responseData.db_order_id);
              sessionStorage.setItem('orderId', responseData.db_order_id);
            }
            window.location.href = `/checkout/success?payment_id=${encodeURIComponent(paymentId)}`;
          },
          prefill: { name: formData.email.split('@')[0], email: formData.email, contact: formData.phone },
          theme: { color: '#2C2622' },
        };
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      if (razorpayLoaded && window.Razorpay) {
        initializeRazorpay();
      } else {
        const checkRazorpay = setInterval(() => {
          if (window.Razorpay) { clearInterval(checkRazorpay); initializeRazorpay(); }
        }, 100);
        setTimeout(() => {
          clearInterval(checkRazorpay);
          if (!window.Razorpay) {
            setIsProcessing(false);
            alert('Failed to load payment system. Please try again or contact support.');
          }
        }, 10000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    }
  }, [formData, totalAmount, discountedPrice, wardrobeDetoxAddon, smartShoppersGuideAddon, outfitPreviewAddon, razorpayLoaded, isOffer2699Checkout]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const hasAddons = wardrobeDetoxAddon || smartShoppersGuideAddon || outfitPreviewAddon;
    if (!hasAddons && !popupDismissed) {
      setShowAddonPopup(true);
    } else {
      await processPayment();
    }
  }, [processPayment, wardrobeDetoxAddon, smartShoppersGuideAddon, outfitPreviewAddon, popupDismissed]);

  const continueWithoutAddons = useCallback(async () => {
    setShowAddonPopup(false);
    await processPayment();
  }, [processPayment]);

  return (
    <div className="man-editorial min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(248,243,233,0.95)', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={landingHref} className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity" style={{ color: '#2C2622' }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="iconik-mono" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Back to ICONIK</span>
          </Link>
          <span className="iconik-display" style={{ fontSize: '18px', letterSpacing: '0.12em', color: '#2C2622' }}>ICONIK</span>
          <div style={{ width: '80px' }} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">

        {/* ── Trust Badges ───────────────────────────────────────────────── */}
        <div className="rounded-2xl p-3 md:p-4 mb-6 flex flex-wrap justify-center gap-3" style={{ background: '#EDE5D2', border: '1px solid rgba(44,38,34,0.06)' }}>
          {[
            { icon: <CheckCircle className="w-3.5 h-3.5" style={{ color: '#94A6AD' }} />, label: '5,000+ Clients' },
            { icon: <Lock className="w-3.5 h-3.5" style={{ color: '#94A6AD' }} />, label: '100% Secure' },
            { icon: <CheckCircle className="w-3.5 h-3.5" style={{ color: '#94A6AD' }} />, label: '10+ Countries' },
          ].map((badge) => (
            <div key={badge.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(44,38,34,0.08)' }}>
              {badge.icon}
              <span className="iconik-mono" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.7, letterSpacing: '0.1em' }}>{badge.label}</span>
            </div>
          ))}
        </div>

        {/* ── Hero / Pricing ─────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="iconik-display mb-4" style={{ fontSize: 'clamp(22px, 5vw, 40px)', color: '#2C2622' }}>
            Your Personal Style Transformation Starts Now
          </div>
          <div className="flex items-baseline justify-center gap-4 mb-4">
            <span className="iconik-display line-through" style={{ fontSize: 'clamp(20px, 4vw, 32px)', color: '#2C2622', opacity: 0.3 }}>{formatINR(originalPrice)}</span>
            <span className="iconik-display" style={{ fontSize: 'clamp(28px, 6vw, 48px)', color: '#2C2622' }}>{formatINR(discountedPrice)}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full" style={{ background: '#2C2622' }}>
            <span className="iconik-mono" style={{ fontSize: '11px', color: '#F4EFE5', letterSpacing: '0.15em' }}>YOU SAVE {formatINR(savings)} TODAY</span>
          </div>
        </div>

        {/* ── Testimonial Carousel ───────────────────────────────────────── */}
        <div className="mb-8 max-w-[200px] mx-auto">
          <div className="iconik-display text-center mb-3" style={{ fontSize: '18px', color: '#2C2622' }}>Real Results from Real Women</div>
          <div className="rounded-2xl p-2" style={{ background: 'rgba(237,229,210,0.5)', border: '1px solid rgba(44,38,34,0.08)' }}>
            <div className="relative" style={{ aspectRatio: '9/16' }}>
              {testimonialImages.map((testimonial, index) => (
                <div key={index} className={`absolute inset-0 transition-opacity duration-500 ${index === currentTestimonial ? 'opacity-100' : 'opacity-0'}`}>
                  <Image src={testimonial.src} alt={testimonial.alt} width={135} height={240} className="w-full h-full object-cover rounded-xl" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-3">
            {testimonialImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: index === currentTestimonial ? '16px' : '6px', background: index === currentTestimonial ? '#2C2622' : 'rgba(44,38,34,0.2)' }}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

          {/* ── Order Form ─────────────────────────────────────────────────── */}
          <div className="rounded-3xl p-6 md:p-8" style={{ background: '#fff', border: '1px solid rgba(44,38,34,0.12)' }}>
            <div className="iconik-display mb-6 text-center" style={{ fontSize: 'clamp(18px, 3vw, 24px)', color: '#2C2622' }}>Get Your Style Consultation</div>

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block mb-2 iconik-mono" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.6, letterSpacing: '0.15em' }}>
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-4 rounded-xl transition-all duration-300 text-base outline-none"
                  style={{ border: '1px solid rgba(44,38,34,0.2)', background: '#fff', color: '#2C2622', fontSize: '14px' }}
                  onFocus={(e) => e.target.style.borderColor = '#2C2622'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(44,38,34,0.2)'}
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block mb-2 iconik-mono" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.6, letterSpacing: '0.15em' }}>
                  PHONE NUMBER *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  maxLength={10}
                  className="w-full px-4 py-4 rounded-xl transition-all duration-300 text-base outline-none"
                  style={{ border: '1px solid rgba(44,38,34,0.2)', background: '#fff', color: '#2C2622', fontSize: '14px' }}
                  onFocus={(e) => e.target.style.borderColor = '#2C2622'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(44,38,34,0.2)'}
                  placeholder="Enter 10-digit phone number"
                />
                <p className="mt-1 iconik-mono" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.4, letterSpacing: '0.1em' }}>Enter exactly 10 digits</p>
              </div>

              <div className="rounded-xl p-4 text-center" style={{ background: '#EDE5D2' }}>
                <p className="iconik-mono" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.6, letterSpacing: '0.1em' }}>Your payment is secure and encrypted</p>
                <p className="mt-1" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.45, lineHeight: 1.5 }}>By clicking below, you agree to our terms of service and privacy policy</p>
              </div>
            </form>
          </div>

          {/* ── Order Summary ───────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Main Product */}
            <div className="rounded-3xl p-6 md:p-8 relative overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(44,38,34,0.12)' }}>
              <div className="absolute top-3 right-[-28px] px-8 py-1 transform rotate-45" style={{ background: '#2C2622' }}>
                <span className="iconik-mono" style={{ fontSize: '8px', color: '#9a7d4a', letterSpacing: '0.2em', fontWeight: 700 }}>BEST SELLER</span>
              </div>

              <div className="mb-4">
                <div className="iconik-display mb-2" style={{ fontSize: '20px', color: '#2C2622' }}>ICONIK Personal Style Consultation</div>
                <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.6, marginBottom: '12px', lineHeight: 1.6 }}>
                  Delivered 1-on-1 by Certified Fashion &amp; Image Consultants
                </p>
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="iconik-display line-through" style={{ fontSize: '20px', color: '#2C2622', opacity: 0.35 }}>{formatINR(originalPrice)}</span>
                  <span className="iconik-display" style={{ fontSize: '28px', color: '#2C2622' }}>{formatINR(discountedPrice)}</span>
                </div>
              </div>

              <div className="mb-2">
                <div className="iconik-display mb-3" style={{ fontSize: '14px', color: '#2C2622' }}>Includes:</div>
                <div className="space-y-2">
                  {[
                    'Complete Style DNA Analysis',
                    'Personalized Color Palette',
                    'Body-Flattering Silhouette Mapping',
                    'Hair & Makeup Blueprint',
                    '30-minute Private Consultation Call',
                    'Lifetime Style Profile Access',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />
                      <span style={{ fontSize: '13px', color: '#2C2622', opacity: 0.75 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Add-ons */}
            <div className="rounded-3xl p-5 md:p-6" style={{ background: '#EDE5D2', border: '1px solid rgba(44,38,34,0.06)' }}>
              <div className="iconik-display mb-1 text-center" style={{ fontSize: '17px', color: '#2C2622' }}>Complete Your Transformation</div>
              <p className="text-center mb-4" style={{ fontSize: '12px', color: '#2C2622', opacity: 0.55 }}>Most clients add these for best results</p>

              <div className="space-y-3">
                {/* Outfit Preview */}
                <div
                  onClick={() => handleAddonChange('outfitpreview', !outfitPreviewAddon)}
                  className="rounded-xl p-4 cursor-pointer transition-all duration-300"
                  style={{
                    border: outfitPreviewAddon ? '1.5px solid #2C2622' : '1px solid rgba(44,38,34,0.12)',
                    background: outfitPreviewAddon ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all" style={{ border: outfitPreviewAddon ? 'none' : '1px solid rgba(44,38,34,0.2)', background: outfitPreviewAddon ? '#2C2622' : 'transparent' }}>
                      {outfitPreviewAddon && <svg className="w-3.5 h-3.5" fill="none" stroke="#F4EFE5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="iconik-display" style={{ fontSize: '14px', color: '#2C2622' }}>Outfit Preview on You</div>
                        <span className="iconik-display flex-shrink-0" style={{ fontSize: '14px', color: '#2C2622' }}>{formatINR(outfitPreviewPrice)}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6, marginBottom: '8px' }}>See how the outfits we recommend will actually look on YOUR body.</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['See yourself in the outfits', 'No more guessing', 'Shop with confidence'].map((tag) => (
                          <span key={tag} className="iconik-mono px-2 py-0.5 rounded-full" style={{ fontSize: '8px', background: 'rgba(44,38,34,0.06)', color: '#2C2622', opacity: 0.6 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wardrobe Detox */}
                <div
                  onClick={() => handleAddonChange('wardrobedetox', !wardrobeDetoxAddon)}
                  className="rounded-xl p-4 cursor-pointer transition-all duration-300"
                  style={{
                    border: wardrobeDetoxAddon ? '1.5px solid #2C2622' : '1px solid rgba(44,38,34,0.12)',
                    background: wardrobeDetoxAddon ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all" style={{ border: wardrobeDetoxAddon ? 'none' : '1px solid rgba(44,38,34,0.2)', background: wardrobeDetoxAddon ? '#2C2622' : 'transparent' }}>
                      {wardrobeDetoxAddon && <svg className="w-3.5 h-3.5" fill="none" stroke="#F4EFE5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="iconik-display" style={{ fontSize: '14px', color: '#2C2622' }}>Wardrobe Detox</div>
                        <span className="iconik-display flex-shrink-0" style={{ fontSize: '14px', color: '#2C2622' }}>{formatINR(wardrobeDetoxPrice)}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6, marginBottom: '8px' }}>Let us audit your closet and create a curated wardrobe for you</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Closet audit', 'Keep/donate guide'].map((tag) => (
                          <span key={tag} className="iconik-mono px-2 py-0.5 rounded-full" style={{ fontSize: '8px', background: 'rgba(44,38,34,0.06)', color: '#2C2622', opacity: 0.6 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smart Shopper's Guide */}
                <div
                  onClick={() => handleAddonChange('smartshopper', !smartShoppersGuideAddon)}
                  className="rounded-xl p-4 cursor-pointer transition-all duration-300"
                  style={{
                    border: smartShoppersGuideAddon ? '1.5px solid #2C2622' : '1px solid rgba(44,38,34,0.12)',
                    background: smartShoppersGuideAddon ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all" style={{ border: smartShoppersGuideAddon ? 'none' : '1px solid rgba(44,38,34,0.2)', background: smartShoppersGuideAddon ? '#2C2622' : 'transparent' }}>
                      {smartShoppersGuideAddon && <svg className="w-3.5 h-3.5" fill="none" stroke="#F4EFE5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="iconik-display" style={{ fontSize: '14px', color: '#2C2622' }}>Smart Shopper&apos;s Guide</div>
                        <span className="iconik-display flex-shrink-0" style={{ fontSize: '14px', color: '#2C2622' }}>{formatINR(smartShoppersGuidePrice)}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6, marginBottom: '8px' }}>A ready-to-wear capsule wardrobe curated for your body type, lifestyle &amp; budget — pieces that work together effortlessly.</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Capsule wardrobe plan', 'Mix & match outfits', 'Budget-smart picks'].map((tag) => (
                          <span key={tag} className="iconik-mono px-2 py-0.5 rounded-full" style={{ fontSize: '8px', background: 'rgba(44,38,34,0.06)', color: '#2C2622', opacity: 0.6 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Total */}
            <div className="rounded-3xl p-5 md:p-6" style={{ background: '#EDE5D2', border: '1px solid rgba(44,38,34,0.06)' }}>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center" style={{ fontSize: '13px', color: '#2C2622', opacity: 0.7 }}>
                  <span>Style Consultation</span>
                  <span>{formatINR(discountedPrice)}</span>
                </div>
                {wardrobeDetoxAddon && (
                  <div className="flex justify-between items-center" style={{ fontSize: '13px', color: '#2C2622', opacity: 0.7 }}>
                    <span>+ Wardrobe Detox</span>
                    <span>{formatINR(wardrobeDetoxPrice)}</span>
                  </div>
                )}
                {smartShoppersGuideAddon && (
                  <div className="flex justify-between items-center" style={{ fontSize: '13px', color: '#2C2622', opacity: 0.7 }}>
                    <span>+ Smart Shopper&apos;s Guide</span>
                    <span>{formatINR(smartShoppersGuidePrice)}</span>
                  </div>
                )}
                {outfitPreviewAddon && (
                  <div className="flex justify-between items-center" style={{ fontSize: '13px', color: '#2C2622', opacity: 0.7 }}>
                    <span>+ Outfit Preview</span>
                    <span>{formatINR(outfitPreviewPrice)}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mb-4" style={{ borderTop: '1px solid rgba(44,38,34,0.1)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="iconik-display" style={{ fontSize: '20px', color: '#2C2622' }}>You Pay:</span>
                  <span className="iconik-display" style={{ fontSize: '28px', color: '#2C2622' }}>{formatINR(totalAmount)}</span>
                </div>
                <div className="text-center">
                  <p className="iconik-mono" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.45 }}>
                    Total value: <span className="line-through">{formatINR(totalValue)}</span>
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Clock className="w-3 h-3" style={{ color: '#94A6AD' }} />
                    <span className="iconik-mono" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.6 }}>
                      Offer expires in {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={async (e) => {
                  e.preventDefault();
                  const hasAddons = wardrobeDetoxAddon || smartShoppersGuideAddon || outfitPreviewAddon;
                  if (!hasAddons && !popupDismissed) {
                    setShowAddonPopup(true);
                    trackCTAClick('Add-on Popup Shown', 'Checkout Main Button', totalAmount, 'INR', INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY);
                  } else {
                    await processPayment();
                  }
                }}
                className="w-full py-4 md:py-5 px-4 rounded-full transition-all duration-300 disabled:opacity-50 mt-2 hover:-translate-y-0.5 transform"
                style={{ background: '#2C2622', color: '#F4EFE5' }}
              >
                <span className="iconik-display" style={{ fontSize: '16px' }}>
                  {isProcessing ? 'Processing...' : 'Transform My Style Now →'}
                </span>
              </button>

              <p className="text-center mt-3 iconik-mono" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.4, letterSpacing: '0.1em' }}>Secure payment via Razorpay</p>
            </div>

            {/* Trust Indicators */}
            <div className="rounded-3xl p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(44,38,34,0.06)' }}>
              <div className="space-y-4">
                {[
                  { icon: <Shield className="w-4 h-4" style={{ color: '#94A6AD' }} />, text: 'Secure payment with Razorpay' },
                  { icon: <Clock className="w-4 h-4" style={{ color: '#94A6AD' }} />, text: 'Instant access to your guides' },
                  { icon: <Users className="w-4 h-4" style={{ color: '#94A6AD' }} />, text: '100s of successful transformations' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    {item.icon}
                    <span style={{ fontSize: '13px', color: '#2C2622', opacity: 0.7 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Add-on Popup ────────────────────────────────────────────────── */}
      {showAddonPopup && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: 'rgba(44,38,34,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full md:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl md:rounded-3xl shadow-2xl" style={{ background: '#F8F3E9' }}>

            {/* Popup Header */}
            <div className="sticky top-0 backdrop-blur-xl p-4 z-10" style={{ background: 'rgba(248,243,233,0.95)', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="iconik-display mb-1" style={{ fontSize: '18px', color: '#2C2622' }}>Boost Your Transformation</div>
                  <p style={{ fontSize: '12px', color: '#2C2622', opacity: 0.55 }}>Add these to get the complete package</p>
                </div>
                <button
                  onClick={() => { setShowAddonPopup(false); setPopupDismissed(true); trackCTAClick('Add-on Popup Dismissed', 'Popup Close Button', undefined, 'INR', INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY); }}
                  className="hover:opacity-60 transition-opacity p-1 flex-shrink-0"
                  style={{ color: '#2C2622', opacity: 0.4 }}
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Popup Add-ons */}
            <div className="p-3 md:p-4 space-y-3">
              {/* Wardrobe Detox */}
              <div
                onClick={() => setWardrobeDetoxAddon(!wardrobeDetoxAddon)}
                className="rounded-xl p-3 cursor-pointer transition-all duration-300"
                style={{
                  border: wardrobeDetoxAddon ? '1.5px solid #2C2622' : '1px solid rgba(44,38,34,0.1)',
                  background: wardrobeDetoxAddon ? '#fff' : 'rgba(237,229,210,0.3)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all" style={{ border: wardrobeDetoxAddon ? 'none' : '1px solid rgba(44,38,34,0.2)', background: wardrobeDetoxAddon ? '#2C2622' : 'transparent' }}>
                    {wardrobeDetoxAddon && <svg className="w-3 h-3" fill="none" stroke="#F4EFE5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="iconik-display" style={{ fontSize: '14px', color: '#2C2622' }}>Wardrobe Detox</div>
                      <span className="iconik-display flex-shrink-0" style={{ fontSize: '14px', color: '#2C2622' }}>{formatINR(wardrobeDetoxPrice)}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6, marginBottom: '8px' }}>Let us audit your closet and create a curated wardrobe</p>
                    <div className="space-y-1">
                      {['Closet audit', 'Keep/donate guide'].map((item) => (
                        <div key={item} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />
                          <span style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Shopper's Guide */}
              <div
                onClick={() => setSmartShoppersGuideAddon(!smartShoppersGuideAddon)}
                className="rounded-xl p-3 cursor-pointer transition-all duration-300"
                style={{
                  border: smartShoppersGuideAddon ? '1.5px solid #2C2622' : '1px solid rgba(44,38,34,0.1)',
                  background: smartShoppersGuideAddon ? '#fff' : 'rgba(237,229,210,0.3)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all" style={{ border: smartShoppersGuideAddon ? 'none' : '1px solid rgba(44,38,34,0.2)', background: smartShoppersGuideAddon ? '#2C2622' : 'transparent' }}>
                    {smartShoppersGuideAddon && <svg className="w-3 h-3" fill="none" stroke="#F4EFE5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="iconik-display" style={{ fontSize: '14px', color: '#2C2622' }}>Smart Shopper&apos;s Guide</div>
                      <span className="iconik-display flex-shrink-0" style={{ fontSize: '14px', color: '#2C2622' }}>{formatINR(smartShoppersGuidePrice)}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6, marginBottom: '8px' }}>Curated brand guide for YOUR body type + budget</p>
                    <div className="space-y-1">
                      {['Best brands for your body shape', 'Budget breakdowns (affordable to premium)', 'What to avoid based on your color palette'].map((item) => (
                        <div key={item} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />
                          <span style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Popup Footer */}
            <div className="sticky bottom-0 p-3 md:p-4 space-y-2" style={{ background: 'rgba(248,243,233,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(44,38,34,0.08)' }}>
              <button
                onClick={async () => { setShowAddonPopup(false); trackCTAClick('Proceed with Add-ons', 'Popup Continue Button', totalAmount, 'INR', INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY); await processPayment(); }}
                disabled={isProcessing}
                className="w-full py-3 md:py-3.5 rounded-full transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5 transform"
                style={{ background: '#2C2622', color: '#F4EFE5' }}
              >
                <span className="iconik-display" style={{ fontSize: '14px' }}>
                  {isProcessing ? 'Processing...' : `Add & Pay ${formatINR(totalAmount)}`}
                </span>
              </button>
              <button
                onClick={() => { trackCTAClick('Continue without Add-ons', 'Popup Skip Button', totalAmount, 'INR', INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY); continueWithoutAddons(); }}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-full transition-all duration-300 disabled:opacity-50"
                style={{ background: 'transparent', color: '#2C2622' }}
              >
                <span className="iconik-mono" style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '0.1em' }}>No thanks, continue without</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
