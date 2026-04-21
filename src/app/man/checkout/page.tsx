'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock } from 'lucide-react';
import { trackAddToCart, trackInitiateCheckout, trackPurchase, updateUserData, trackCTAClick, trackRemoveFromCart, trackViewContent, trackPageView } from '@/lib/metaPixel';
import { useManRegion } from '@/hooks/useManRegion';
import { getManPricing } from '@/lib/manPricing';

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
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
}

interface RazorpayInstance { open(): void; }


interface FormData {
  email: string;
  phone: string;
}

export default function ManCheckoutPage() {
  const [formData, setFormData] = useState<FormData>({ email: '', phone: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showAddonPopup, setShowAddonPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

  const { country, isIndia, isLoading: regionLoading } = useManRegion();
  const pricing = getManPricing(country);

  const originalPrice = pricing.originalPrice;
  const discountedPrice = pricing.basePrice;
  const outfitPreviewPrice = pricing.addonPrice;
  const savings = pricing.savings;

  useEffect(() => {
    trackPageView('Man Checkout');
  }, []);

  useEffect(() => {
    if (regionLoading) return;
    trackViewContent('ICONIK Man Style Blueprint - Checkout', discountedPrice, ['iconik_man_style_blueprint'], pricing.currency, 'Man Funnel');
  }, [regionLoading, discountedPrice, pricing.currency]);

  const [outfitPreviewAddon, setOutfitPreviewAddon] = useState(false);

  const totalAmount = useMemo(() =>
    discountedPrice + (outfitPreviewAddon ? outfitPreviewPrice : 0),
    [discountedPrice, outfitPreviewAddon, outfitPreviewPrice]
  );

  const totalValue = useMemo(() =>
    originalPrice + (isIndia ? 1000 : 100) + (outfitPreviewAddon ? outfitPreviewPrice : 0),
    [originalPrice, isIndia, outfitPreviewAddon, outfitPreviewPrice]
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // India: digits only, max 10. International: digits/spaces/dashes/+, max 15.
      if (isIndia) {
        if (!/^\d{0,10}$/.test(value)) return;
      } else {
        if (!/^[\d\s\-+]{0,15}$/.test(value)) return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email' && value.includes('@') && formData.phone.length >= 7) updateUserData(value, formData.phone);
    else if (name === 'phone' && value.length >= 7 && formData.email.includes('@')) updateUserData(formData.email, value);
  }, [formData.phone, formData.email, isIndia]);

  const handleAddonChange = useCallback((checked: boolean) => {
    if (checked) trackAddToCart('Outfit Preview on You', outfitPreviewPrice, 'outfit_preview', pricing.currency, 'Man Funnel');
    else trackRemoveFromCart('Outfit Preview on You', outfitPreviewPrice, 'outfit_preview', pricing.currency, 'Man Funnel');
    setOutfitPreviewAddon(checked);
  }, [outfitPreviewPrice, pricing.currency]);

  const processPayment = useCallback(async () => {
    // Phone validation: 10 digits for India, 7+ for international
    const phoneValid = isIndia ? formData.phone.length === 10 : formData.phone.replace(/[\s\-+]/g, '').length >= 7;
    if (!phoneValid) {
      alert(isIndia ? 'Please enter a valid 10-digit phone number' : 'Please enter a valid phone number');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { alert('Please enter a valid email address'); return; }

    setIsProcessing(true);
    const itemCount = 1 + (outfitPreviewAddon ? 1 : 0);
    trackInitiateCheckout(totalAmount, itemCount, 'ICONIK Man Style Blueprint', pricing.currency, 'Man Funnel');

    try {
      let responseData: {
        success: boolean;
        key: string;
        razorpay_order_id: string;
        amount: number;
        currency: string;
        customer_id?: string;
        db_order_id?: string;
        error?: string;
      };

      if (isIndia) {
        // ── India: existing INR flow ──────────────────────────────────────────
        const orderData = {
          customer_name: formData.email.split('@')[0],
          customer_email: formData.email,
          customer_phone: formData.phone,
          amount: totalAmount,
          base_product: 'Iconik Man Style Blueprint',
          add_ons: {
            outfit_preview: outfitPreviewAddon
          },
          total_base_price: discountedPrice,
          outfit_preview_price: outfitPreviewAddon ? outfitPreviewPrice : 0
        };

        const response = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) throw new Error('Payment initialization failed');
        responseData = await response.json();
        if (!responseData.success) throw new Error(responseData.error || 'Payment initialization failed');

      } else {
        // ── International: USD flow ───────────────────────────────────────────
        const orderData = {
          customer_email: formData.email,
          customer_phone: formData.phone,
          amount: totalAmount,
          outfit_preview_addon: outfitPreviewAddon,
        };

        const response = await fetch('/api/man-payment-intl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) throw new Error('Payment initialization failed');
        responseData = await response.json();
        if (!responseData.success) throw new Error(responseData.error || 'Payment initialization failed');
      }

      const initializeRazorpay = () => {
        const options = {
          key: responseData.key,
          amount: responseData.amount,
          currency: responseData.currency,
          name: 'ICONIK Man',
          description: 'ICONIK Man Style Blueprint',
          image: `${window.location.origin}/logopayment.webp`,
          order_id: responseData.razorpay_order_id,
          handler: async function (response: RazorpayResponse) {
            const purchasedItems = ['iconik_man_style_blueprint'];
            if (outfitPreviewAddon) purchasedItems.push('outfit_preview');

            trackPurchase(totalAmount, 'ICONIK Man Complete Package', purchasedItems, purchasedItems.length, pricing.currency, 'Man Funnel', response.razorpay_payment_id);

            // International: confirm payment server-side and send email
            if (!isIndia) {
              try {
                await fetch('/api/man-confirm-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    db_order_id: responseData.db_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    amount: totalAmount,
                    has_outfit_preview: outfitPreviewAddon,
                  }),
                });
              } catch (err) {
                console.error('Man INTL confirm payment error:', err);
              }
            }

            // Store in localStorage so intake form can prefill contact details
            localStorage.setItem('man_customerEmail', formData.email);
            localStorage.setItem('man_customerPhone', formData.phone);

            // Redirect directly to the intake form
            const intakeUrl = `/man/intake?email=${encodeURIComponent(formData.email)}&phone=${encodeURIComponent(formData.phone)}`;
            window.location.href = intakeUrl;
          },
          prefill: {
            name: formData.email.split('@')[0],
            email: formData.email,
            contact: formData.phone
          },
          theme: { color: '#1c1917' }
        };

        const razorpay = new (window as unknown as { Razorpay: new (o: RazorpayOptions) => RazorpayInstance }).Razorpay(options);
        razorpay.open();
      };

      if (razorpayLoaded && window.Razorpay) {
        initializeRazorpay();
      } else {
        const checkRazorpay = setInterval(() => {
          if (window.Razorpay) {
            clearInterval(checkRazorpay);
            initializeRazorpay();
          }
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
  }, [formData, totalAmount, outfitPreviewAddon, razorpayLoaded, isIndia, discountedPrice, outfitPreviewPrice, pricing.currency]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const hasAddons = outfitPreviewAddon;
    if (!hasAddons && !popupDismissed) setShowAddonPopup(true);
    else await processPayment();
  }, [processPayment, outfitPreviewAddon, popupDismissed]);

  return (
    <div className="man-theme min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      {/* Header */}
      <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/man" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body">
            <ArrowLeft className="w-5 h-5" />
            Back to ICONIK Man
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-3 md:p-4 mb-4 md:mb-6 flex flex-wrap justify-center gap-2 md:gap-4"
        >
          <div className="flex items-center gap-1 md:gap-2 bg-luxury-pink-bg text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
            <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm luxury-body">200+ Men Transformed</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-luxury-pink-bg text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
            <Lock className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm luxury-body">100% Secure</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-luxury-pink-bg text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
            <Star className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm luxury-body">4.9/5 Rating</span>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6 md:mb-8"
        >
          <h1 className="text-2xl md:text-4xl lg:text-5xl luxury-heading text-luxury-charcoal mb-4 md:mb-6">
            Your Man Style Blueprint Starts Now
          </h1>
          <div className="text-3xl md:text-5xl lg:text-6xl mb-3 md:mb-4">
            <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">{pricing.displayOriginal}</span>
            <span className="text-luxury-green font-semibold">{pricing.displayBase}</span>
          </div>
          <div className="bg-luxury-accent text-luxury-warm-white px-4 md:px-6 py-2 rounded-full luxury-body text-sm md:text-lg inline-block animate-bounce">
            YOU SAVE {pricing.displaySavings} TODAY!
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Order Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white border-2 border-luxury-charcoal rounded-3xl p-6 md:p-8 shadow-2xl"
          >
            <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-6 text-center">Get Your Blueprint</h2>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm luxury-body text-luxury-charcoal/70 mb-2 font-semibold">Email Address *</label>
                <input
                  type="email" id="email" name="email" value={formData.email}
                  onChange={handleInputChange} required
                  className="w-full px-4 py-4 border-2 border-luxury-charcoal/20 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-base"
                  placeholder="Enter your email address"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm luxury-body text-luxury-charcoal/70 mb-2 font-semibold">Phone Number *</label>
                <input
                  type="tel" id="phone" name="phone" value={formData.phone}
                  onChange={handleInputChange} required maxLength={isIndia ? 10 : 15}
                  className="w-full px-4 py-4 border-2 border-luxury-charcoal/20 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-base"
                  placeholder={isIndia ? 'Enter 10-digit phone number' : 'Enter your phone number'}
                />
                {isIndia && <p className="text-xs luxury-body text-luxury-charcoal/50 mt-1">Enter exactly 10 digits</p>}
              </div>
              <div className="text-center text-sm luxury-body text-luxury-charcoal/60 bg-luxury-cream/30 rounded-xl p-4">
                <p>🔒 Your payment is secure and encrypted</p>
                <p className="mt-1">By clicking below, you agree to our terms of service and privacy policy</p>
              </div>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-6 md:space-y-8"
          >
            {/* Main Product */}
            <div className="bg-luxury-warm-white border-2 border-luxury-charcoal text-luxury-charcoal rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-2 md:top-4 right-[-30px] bg-luxury-gold text-luxury-charcoal px-6 md:px-8 py-1 transform rotate-45 text-xs font-bold">
                BEST SELLER
              </div>
              <div className="mb-4">
                <h3 className="text-xl md:text-2xl luxury-heading mb-2 text-luxury-charcoal">ICONIK Man Style Blueprint</h3>
                <p className="text-sm md:text-base luxury-body text-luxury-charcoal/70 mb-3">Delivered 1-on-1 by Certified Style &amp; Image Consultants</p>
                <div className="text-2xl md:text-3xl mb-4">
                  <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">{pricing.displayOriginal}</span>
                  <span className="text-luxury-green font-semibold">{pricing.displayBase}</span>
                </div>
              </div>
              <div className="mb-4">
                <h4 className="luxury-heading text-luxury-charcoal mb-3">Includes:</h4>
                <ul className="space-y-2">
                  {[
                    'Geometric Frame Profile™ — fits built for your body',
                    'Personal Colour Palette — 10 that work, 4 to cut',
                    'Facial Architecture Analysis™ — collar, eyewear, hair',
                    'Grooming & Hair Blueprint',
                    'Created by an ICONIK Stylist — personally reviewed',
                    '16 Complete Outfit Formulas — office, casual, occasion',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 md:gap-3">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                      <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Add-ons */}
            <div className="bg-luxury-pink-bg/30 border-2 border-luxury-accent/20 rounded-3xl p-5 md:p-6">
              <h3 className="text-lg md:text-xl luxury-heading text-luxury-charcoal mb-1 text-center">💎 Complete Your Blueprint</h3>
              <p className="text-xs md:text-sm luxury-body text-luxury-charcoal/70 mb-4 text-center">Most clients add these for best results</p>
              <div className="space-y-3">
                {[
                  { label: '👔 Outfit Preview on You', price: outfitPreviewPrice, displayPrice: pricing.displayAddon, checked: outfitPreviewAddon, desc: 'See how the outfits we recommend will actually look on your body.', tags: ['See yourself in the outfits', 'No more guessing', 'Shop with confidence'] },
                ].map(({ label, displayPrice, checked, desc, tags }) => (
                  <div
                    key={label}
                    onClick={() => handleAddonChange(!checked)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${checked ? 'border-luxury-accent bg-luxury-warm-white shadow-lg' : 'border-luxury-cream bg-luxury-warm-white/50 hover:border-luxury-accent/50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'}`}>
                        {checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="luxury-heading text-luxury-charcoal text-base">{label}</h4>
                          <span className="text-luxury-green font-semibold text-lg flex-shrink-0">{displayPrice}</span>
                        </div>
                        <p className="text-xs luxury-body text-luxury-charcoal/70 mb-2">{desc}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((t, i) => <span key={i} className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">{t}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-luxury-cream">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70">
                  <span>Man Style Blueprint</span><span>{pricing.displayBase}</span>
                </div>
                {outfitPreviewAddon && <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70"><span>+ Outfit Preview</span><span>{pricing.displayAddon}</span></div>}
              </div>
              <div className="border-t-2 border-luxury-charcoal/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal">You Pay:</span>
                  <span className="text-3xl md:text-4xl text-luxury-green font-bold">{pricing.symbol}{totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs luxury-body text-luxury-charcoal/60">Total value: <span className="line-through">{pricing.symbol}{totalValue.toLocaleString()}</span></p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-luxury-accent" />
                    <span className="text-xs luxury-body text-luxury-accent font-semibold">
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
                  const hasAddons = outfitPreviewAddon;
                  if (!hasAddons && !popupDismissed) {
                    setShowAddonPopup(true);
                    trackCTAClick('Add-on Popup Shown', 'Man Checkout Main Button', totalAmount, pricing.currency, 'Man Funnel');
                  } else {
                    await processPayment();
                  }
                }}
                className="w-full bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white py-4 md:py-5 px-4 md:px-6 rounded-full text-lg md:text-xl luxury-body shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mt-4 hover:scale-[1.02] transform font-semibold"
              >
                {isProcessing ? 'Processing...' : '🔥 Build My Blueprint Now →'}
              </button>
              <div className="text-center text-xs md:text-sm luxury-body text-luxury-charcoal/60 mt-3">
                <p>💳 Secure payment via Razorpay</p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 md:p-6 shadow-lg border border-white/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light">
                  <Shield className="w-5 h-5 text-luxury-accent" />
                  <span>Secure payment with Razorpay</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Blueprint delivered within 72 hours of your intake form</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>200+ men who dress with intention</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add-on Popup */}
      {showAddonPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-luxury-warm-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream p-4 z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl luxury-heading text-luxury-charcoal mb-1">🎁 Complete Your Blueprint</h3>
                  <p className="text-xs md:text-sm luxury-body text-luxury-charcoal/70">Add these for the full experience</p>
                </div>
                <button
                  onClick={() => { setShowAddonPopup(false); setPopupDismissed(true); }}
                  className="p-2 hover:bg-luxury-cream rounded-full transition-colors"
                >
                  <span className="text-luxury-charcoal/60 text-xl leading-none">×</span>
                </button>
              </div>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <p className="luxury-body text-luxury-charcoal/70 text-sm text-center">
                You&apos;re about to check out without any add-ons. Most clients see better results with the full package.
              </p>
              <button
                onClick={() => { setShowAddonPopup(false); setPopupDismissed(true); }}
                className="w-full bg-luxury-cream text-luxury-charcoal py-3 px-6 rounded-full luxury-body font-medium hover:bg-luxury-cream/80 transition-colors"
              >
                Add something to my order
              </button>
              <button
                onClick={async () => { setShowAddonPopup(false); await processPayment(); }}
                className="w-full text-center text-sm luxury-body text-luxury-charcoal/50 hover:text-luxury-charcoal transition-colors underline py-2"
              >
                Continue without add-ons
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
