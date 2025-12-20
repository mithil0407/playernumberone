'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock } from 'lucide-react';
import { trackAddToCart, trackInitiateCheckout, trackPurchase, updateUserData, trackCTAClick, trackRemoveFromCart, trackViewContent } from '@/lib/metaPixel';

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

export default function CheckoutPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showAddonPopup, setShowAddonPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false); // Track if user dismissed popup
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Testimonials carousel - 9:16 format (5 images)
  const testimonialImages = [
    { src: '/ia-checkout-testimonial-1.webp', alt: 'Indian-American client testimonial 1' },
    { src: '/ia-checkout-testimonial-2.webp', alt: 'Indian-American client testimonial 2' },
    { src: '/ia-checkout-testimonial-3.webp', alt: 'Indian-American client testimonial 3' },
    { src: '/ia-checkout-testimonial-4.webp', alt: 'Indian-American client testimonial 4' },
    { src: '/ia-checkout-testimonial-5.webp', alt: 'Indian-American client testimonial 5' }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonialImages.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [testimonialImages.length]);

  // Price values
  const originalPrice = 497;
  const discountedPrice = 79; // Indian-American pricing
  const savings = originalPrice - discountedPrice;

  // Track ViewContent on checkout page load
  useEffect(() => {
    trackViewContent(
      'ICONIK Style Consultation - Checkout',
      discountedPrice,
      ['iconik_style_consultation_ia'],
      'USD',
      'USA_IndianAmerican'
    );
  }, [discountedPrice]);

  // Add-ons
  const [divaDietPlanAddon, setDivaDietPlanAddon] = useState(false); // Diva Diet Plan
  const [smartShoppersGuideAddon, setSmartShoppersGuideAddon] = useState(false); // Smart Shopper's Guide

  const divaDietPlanPrice = 29;

  const smartShoppersGuidePrice = 49;

  // Add-on names for Indian-American audience
  const divaDietPlanName = 'Indian-Friendly Beauty & Wellness Guide';
  const smartShoppersGuideName = 'American Brands for Indian Body Types';

  // Memoize total calculations to prevent unnecessary recalculations
  const totalAmount = useMemo(() =>
    discountedPrice +
    (divaDietPlanAddon ? divaDietPlanPrice : 0) +
    (smartShoppersGuideAddon ? smartShoppersGuidePrice : 0),
    [divaDietPlanAddon, smartShoppersGuideAddon]
  );

  const totalValue = useMemo(() =>
    originalPrice + 100 + // Base + Free bonuses ($100+ value)
    (divaDietPlanAddon ? divaDietPlanPrice : 0) +
    (smartShoppersGuideAddon ? smartShoppersGuidePrice : 0),
    [divaDietPlanAddon, smartShoppersGuideAddon]
  );

  // const totalSavings = totalValue - totalAmount; // Removed as not used in current design

  // OPTIMIZATION #1: Preload Razorpay script immediately on page load
  useEffect(() => {
    // Check if script already exists
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
      // Cleanup if component unmounts before load
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Optimized countdown timer - only update when time actually changes
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev; // No change, prevents unnecessary re-render
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Optimized input change handler with memoized validation - US phone format
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Phone number validation - only allow 10 digits (US format)
    if (name === 'phone') {
      // Remove all non-numeric characters
      const numericValue = value.replace(/\D/g, '');
      // Only allow up to 10 digits
      if (numericValue.length > 10) {
        return; // Don't update if invalid
      }
      // Update with cleaned numeric value
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));

      // Update Meta Pixel with user data for advanced matching when both fields have valid data
      if (numericValue.length === 10 && formData.email.includes('@')) {
        updateUserData(formData.email, numericValue);
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update Meta Pixel with user data for advanced matching when both fields have valid data
    if (name === 'email' && value.includes('@') && formData.phone.length === 10) {
      updateUserData(value, formData.phone);
    }
  }, [formData.phone, formData.email]);

  // Memoize addon details to prevent recreation on every render
  const addonDetails = useMemo(() => ({
    divadiet: {
      name: 'Diva Diet Plan',
      price: 29,
      id: 'diva_diet_plan'
    },
    smartshopper: {
      name: 'Smart Shopper\'s Guide',
      price: 49,
      id: 'smart_shoppers_guide'
    }
  }), []);

  // Optimized add-on change handler with Meta tracking only for additions
  const handleAddonChange = useCallback((addonType: 'divadiet' | 'smartshopper', checked: boolean) => {
    const addon = addonDetails[addonType];

    // Track addon changes
    if (checked) {
      trackAddToCart(addon.name, addon.price, addon.id, 'USD', 'USA_IndianAmerican');
    } else {
      trackRemoveFromCart(addon.name, addon.price, addon.id, 'USD', 'USA_IndianAmerican');
    }

    // Update state
    if (addonType === 'divadiet') {
      setDivaDietPlanAddon(checked);
    } else if (addonType === 'smartshopper') {
      setSmartShoppersGuideAddon(checked);
    }
  }, [addonDetails]);

  // Memoize payment processing function to prevent recreation
  const processPayment = useCallback(async () => {
    // Validate phone number
    if (formData.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setIsProcessing(true);

    // Track InitiateCheckout event with correct item count
    const itemCount = 1 + (divaDietPlanAddon ? 1 : 0) + (smartShoppersGuideAddon ? 1 : 0);
    trackInitiateCheckout(totalAmount, itemCount, 'ICONIK Style Consultation', 'USD', 'USA_IndianAmerican');

    try {
      // Create order data
      const orderData = {
        customer_name: formData.email.split('@')[0], // Use email prefix as name
        customer_email: formData.email,
        customer_phone: formData.phone,
        amount: totalAmount,
        currency: 'USD', // US checkout uses USD
        base_product: 'Iconik Style Consultation',
        add_ons: {
          diva_diet_plan: divaDietPlanAddon,
          smart_shoppers_guide: smartShoppersGuideAddon
        },
        total_base_price: discountedPrice,
        diva_diet_plan_price: divaDietPlanAddon ? divaDietPlanPrice : 0,
        smart_shoppers_guide_price: smartShoppersGuideAddon ? smartShoppersGuidePrice : 0
      };

      // Call payment API
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Payment initialization failed');
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || 'Payment initialization failed');
      }

      // Debug: Log the API response
      console.log('Payment API Response:', responseData);
      console.log('Customer ID:', responseData.customer_id);
      console.log('DB Order ID:', responseData.db_order_id);

      // OPTIMIZATION #1: Use preloaded Razorpay script (no more waiting for download)
      const initializeRazorpay = () => {
        // Initialize Razorpay payment
        const options = {
          key: responseData.key,
          amount: responseData.amount,
          currency: responseData.currency || 'USD',
          name: 'Iconik One On One',
          description: 'Iconik Style Consultation',
          image: `${window.location.origin}/logopayment.webp`, // Logo displayed on Razorpay checkout
          order_id: responseData.razorpay_order_id,
          handler: function (response: RazorpayResponse) {
            // Payment successful
            const purchasedItems = ['iconik_style_consultation'];
            if (divaDietPlanAddon) purchasedItems.push('diva_diet_plan');
            if (smartShoppersGuideAddon) purchasedItems.push('smart_shoppers_guide');

            // Store purchase details for success page tracking (prevents race condition)
            localStorage.setItem('purchaseAmount', totalAmount.toString());
            localStorage.setItem('purchaseCurrency', 'USD');
            localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));

            // Store customer and order IDs in localStorage and sessionStorage for immediate access
            if (responseData.customer_id) {
              localStorage.setItem('customerId', responseData.customer_id);
              sessionStorage.setItem('customerId', responseData.customer_id);
              console.log('Stored customerId in localStorage and sessionStorage:', responseData.customer_id);
            }
            if (responseData.db_order_id) {
              localStorage.setItem('orderId', responseData.db_order_id);
              sessionStorage.setItem('orderId', responseData.db_order_id);
              console.log('Stored orderId in localStorage and sessionStorage:', responseData.db_order_id);
            }

            // Redirect to Indian-American success page with all necessary parameters
            const successUrl = `/indian-american/checkout/success?payment_id=${response.razorpay_payment_id}&order_id=${responseData.razorpay_order_id}&customer_id=${responseData.customer_id}&db_order_id=${responseData.db_order_id}&amount=${totalAmount}`;
            console.log('🚀 Redirecting to:', successUrl);
            window.location.href = successUrl;
          },
          prefill: {
            name: formData.email.split('@')[0],
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#E91E63'
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };

      // Check if Razorpay is already loaded, otherwise wait for it
      if (razorpayLoaded && window.Razorpay) {
        initializeRazorpay();
      } else {
        // Wait for Razorpay to load
        const checkRazorpay = setInterval(() => {
          if (window.Razorpay) {
            clearInterval(checkRazorpay);
            initializeRazorpay();
          }
        }, 100);

        // Timeout after 10 seconds
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
  }, [formData, totalAmount, divaDietPlanAddon, smartShoppersGuideAddon, razorpayLoaded]);

  // Memoize submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if no add-ons are selected
    const hasAddons = divaDietPlanAddon || smartShoppersGuideAddon;

    // Only show popup if: no add-ons AND popup hasn't been dismissed
    if (!hasAddons && !popupDismissed) {
      setShowAddonPopup(true);
    } else {
      // Process payment directly if add-ons selected OR popup was dismissed
      await processPayment();
    }
  }, [processPayment, divaDietPlanAddon, smartShoppersGuideAddon, popupDismissed]);

  // Function to continue without add-ons
  const continueWithoutAddons = useCallback(async () => {
    setShowAddonPopup(false);
    await processPayment();
  }, [processPayment]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      {/* Header */}
      <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/indian-american" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body">
            <ArrowLeft className="w-5 h-5" />
            Back to ICONIK
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
            <span className="text-xs md:text-sm luxury-body">2,847+ Happy Clients</span>
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

        {/* Hero Section - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6 md:mb-8"
        >
          <h1 className="text-2xl md:text-4xl lg:text-5xl luxury-heading text-luxury-charcoal mb-4 md:mb-6">
            Your Personal Style Transformation Starts Now
          </h1>

          <div className="text-3xl md:text-5xl lg:text-6xl mb-3 md:mb-4">
            <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">${originalPrice}</span>
            <span className="text-luxury-green font-semibold">${discountedPrice}</span>
          </div>

          <div className="bg-luxury-accent text-luxury-warm-white px-4 md:px-6 py-2 rounded-full luxury-body text-sm md:text-lg inline-block animate-bounce">
            YOU SAVE ${savings} TODAY!
          </div>
        </motion.div>

        {/* Testimonial Carousel - 9:16 Portrait Format */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 md:mb-8 max-w-[203px] mx-auto"
        >
          <h2 className="text-lg md:text-xl luxury-heading text-center mb-3 text-luxury-charcoal">
            Real Results from Real Women
          </h2>

          <div className="relative">
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-2 border border-luxury-cream overflow-hidden">
              <div className="relative" style={{ aspectRatio: '9/16' }}>
                {testimonialImages.map((testimonial, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-500 ${index === currentTestimonial ? 'opacity-100' : 'opacity-0'
                      }`}
                  >
                    <Image
                      src={testimonial.src}
                      alt={testimonial.alt}
                      width={203}
                      height={360}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2 mt-3">
              {testimonialImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                    ? 'bg-luxury-accent w-6'
                    : 'bg-luxury-charcoal/30 hover:bg-luxury-charcoal/50'
                    }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Order Form - Simplified Design */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white border-2 border-luxury-charcoal rounded-3xl p-6 md:p-8 shadow-2xl"
          >
            <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-6 text-center">Get Your Style Consultation</h2>

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm luxury-body text-luxury-charcoal/70 mb-2 font-semibold">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-4 border-2 border-luxury-charcoal/20 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-base"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm luxury-body text-luxury-charcoal/70 mb-2 font-semibold">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  maxLength={10}
                  className="w-full px-4 py-4 border-2 border-luxury-charcoal/20 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-base"
                  placeholder="(123) 456-7890"
                />
                <p className="text-xs luxury-body text-luxury-charcoal/50 mt-1">Enter 10-digit US phone number</p>
              </div>

              {/* Security Notice */}
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
                <h3 className="text-xl md:text-2xl luxury-heading mb-2 text-luxury-charcoal">ICONIK Personal Style Consultation</h3>

                <p className="text-sm md:text-base luxury-body text-luxury-charcoal/70 mb-3">
                  Delivered 1-on-1 by Certified Fashion & Image Consultants
                </p>

                <div className="text-2xl md:text-3xl mb-4">
                  <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">${originalPrice}</span>
                  <span className="text-luxury-green font-semibold">${discountedPrice}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="luxury-heading text-luxury-charcoal mb-3">Includes:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">Complete Style DNA Analysis</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">Personalized Color Palette</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">Body-Flattering Silhouette Mapping</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">Hair & Makeup Blueprint</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">20-min Private Consultation Call</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">Lifetime Style Profile Access</span>
                  </li>
                </ul>
              </div>
            </div>


            {/* Complete Your Transformation Section */}
            <div className="bg-luxury-pink-bg/30 border-2 border-luxury-accent/20 rounded-3xl p-5 md:p-6">
              <h3 className="text-lg md:text-xl luxury-heading text-luxury-charcoal mb-1 text-center">
                💎 Complete Your Transformation
              </h3>
              <p className="text-xs md:text-sm luxury-body text-luxury-charcoal/70 mb-4 text-center">
                Most clients add these for best results
              </p>

              <div className="space-y-3">
                {/* Add-on 1: Diva Diet Plan */}
                <div
                  onClick={() => handleAddonChange('divadiet', !divaDietPlanAddon)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${divaDietPlanAddon
                    ? 'border-luxury-accent bg-luxury-warm-white shadow-lg'
                    : 'border-luxury-cream bg-luxury-warm-white/50 hover:border-luxury-accent/50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${divaDietPlanAddon ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                      }`}>
                      {divaDietPlanAddon && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="luxury-heading text-luxury-charcoal text-base">💪 {divaDietPlanName}</h4>
                        <span className="text-luxury-green font-semibold text-lg flex-shrink-0">${divaDietPlanPrice}</span>
                      </div>
                      <p className="text-xs luxury-body text-luxury-charcoal/70 mb-2">
                        Personalized nutrition for glowing results
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">Custom meals</span>
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">Indian recipes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add-on 2: Smart Shopper's Guide */}
                <div
                  onClick={() => handleAddonChange('smartshopper', !smartShoppersGuideAddon)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${smartShoppersGuideAddon
                    ? 'border-luxury-accent bg-luxury-warm-white shadow-lg'
                    : 'border-luxury-cream bg-luxury-warm-white/50 hover:border-luxury-accent/50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${smartShoppersGuideAddon ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                      }`}>
                      {smartShoppersGuideAddon && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="luxury-heading text-luxury-charcoal text-base">🛍️ {smartShoppersGuideName}</h4>
                        <span className="text-luxury-green font-semibold text-lg flex-shrink-0">${smartShoppersGuidePrice}</span>
                      </div>
                      <p className="text-xs luxury-body text-luxury-charcoal/70 mb-2">
                        Get our curated brand guide for YOUR body type + budget
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">Best brands for you</span>
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">Budget breakdowns</span>
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">Sizing by brand</span>
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">Color-matched tips</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simplified Order Total */}
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-luxury-cream">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70">
                  <span>Style Consultation</span>
                  <span>${discountedPrice}</span>
                </div>

                {divaDietPlanAddon && (
                  <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70">
                    <span>+ Diet Plan</span>
                    <span>${divaDietPlanPrice}</span>
                  </div>
                )}

                {smartShoppersGuideAddon && (
                  <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70">
                    <span>+ Smart Shopper&apos;s Guide</span>
                    <span>${smartShoppersGuidePrice}</span>
                  </div>
                )}
              </div>

              {/* Big Bold Total */}
              <div className="border-t-2 border-luxury-charcoal/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal">You Pay:</span>
                  <span className="text-3xl md:text-4xl text-luxury-green font-bold">${totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs luxury-body text-luxury-charcoal/60">
                    Total value: <span className="line-through">${totalValue.toLocaleString()}</span>
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-luxury-accent" />
                    <span className="text-xs luxury-body text-luxury-accent font-semibold">
                      Offer expires in {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Button - Mobile Optimized */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={async (e) => {
                  e.preventDefault();
                  const hasAddons = divaDietPlanAddon || smartShoppersGuideAddon;
                  if (!hasAddons && !popupDismissed) {
                    setShowAddonPopup(true);
                    trackCTAClick('Add-on Popup Shown', 'Checkout Main Button', totalAmount, 'USD', 'USA_IndianAmerican');
                  } else {
                    await processPayment();
                  }
                }}
                className="w-full bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white py-4 md:py-5 px-4 md:px-6 rounded-full text-lg md:text-xl luxury-body shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mt-4 hover:scale-[1.02] transform font-semibold"
              >
                {isProcessing ? 'Processing...' : '🔥 Transform My Style Now →'}
              </button>

              <div className="text-center text-xs md:text-sm luxury-body text-luxury-charcoal/60 mt-3">
                <p>💳 Secure payment via Razorpay</p>
              </div>
            </div>


            {/* Trust Indicators */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 md:p-6 shadow-lg border border-white/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                  <Shield className="w-5 h-5 text-luxury-accent" />
                  <span>Secure payment with Razorpay</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Instant access to your guides</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>100s of successful transformations</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>


      {/* Add-on Popup - Optimized for Mobile */}
      {showAddonPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-luxury-warm-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream p-4 z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl luxury-heading text-luxury-charcoal mb-1">
                    🎁 Boost Your Transformation
                  </h3>
                  <p className="text-xs md:text-sm luxury-body text-luxury-charcoal/70">
                    Add these to get the complete package
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddonPopup(false);
                    setPopupDismissed(true); // Mark as dismissed
                    trackCTAClick('Add-on Popup Dismissed', 'Popup Close Button', undefined, 'USD', 'USA_IndianAmerican');
                  }}
                  className="text-luxury-charcoal/40 hover:text-luxury-charcoal p-1 -mr-1 -mt-1 flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Add-ons Content */}
            <div className="p-3 md:p-4 space-y-3">
              {/* Diva Diet Plan Add-on */}
              <div
                onClick={() => setDivaDietPlanAddon(!divaDietPlanAddon)}
                className={`border-2 rounded-xl p-3 cursor-pointer transition-all duration-300 ${divaDietPlanAddon
                  ? 'border-luxury-accent bg-luxury-pink-bg shadow-lg'
                  : 'border-luxury-cream hover:border-luxury-accent/50 hover:bg-luxury-cream/30'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${divaDietPlanAddon ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                    }`}>
                    {divaDietPlanAddon && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="luxury-heading text-luxury-charcoal text-sm md:text-base">
                        💪 Diva Diet Plan
                      </h4>
                      <div className="text-right flex-shrink-0">
                        <span className="text-luxury-green font-semibold text-base">${divaDietPlanPrice}</span>
                      </div>
                    </div>
                    <p className="text-xs luxury-body text-luxury-charcoal/70 mb-2">
                      Personalized nutrition for Indian women
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5 text-xs luxury-body text-luxury-charcoal/70">
                        <CheckCircle className="w-3.5 h-3.5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span>Custom meal plans</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs luxury-body text-luxury-charcoal/70">
                        <CheckCircle className="w-3.5 h-3.5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span>Indian recipes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Shopper's Guide Add-on */}
              <div
                onClick={() => setSmartShoppersGuideAddon(!smartShoppersGuideAddon)}
                className={`border-2 rounded-xl p-3 cursor-pointer transition-all duration-300 ${smartShoppersGuideAddon
                  ? 'border-luxury-accent bg-luxury-pink-bg shadow-lg'
                  : 'border-luxury-cream hover:border-luxury-accent/50 hover:bg-luxury-cream/30'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${smartShoppersGuideAddon ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                    }`}>
                    {smartShoppersGuideAddon && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="luxury-heading text-luxury-charcoal text-sm md:text-base">
                        🛍️ Smart Shopper&apos;s Guide
                      </h4>
                      <div className="text-right flex-shrink-0">
                        <span className="text-luxury-green font-semibold text-base">${smartShoppersGuidePrice}</span>
                      </div>
                    </div>
                    <p className="text-xs luxury-body text-luxury-charcoal/70 mb-2">
                      Curated brand guide for YOUR body type + budget
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5 text-xs luxury-body text-luxury-charcoal/70">
                        <CheckCircle className="w-3.5 h-3.5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span>Best brands for your body shape</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs luxury-body text-luxury-charcoal/70">
                        <CheckCircle className="w-3.5 h-3.5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span>Budget breakdowns (affordable to premium)</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs luxury-body text-luxury-charcoal/70">
                        <CheckCircle className="w-3.5 h-3.5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span>Sizing recommendations by brand</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs luxury-body text-luxury-charcoal/70">
                        <CheckCircle className="w-3.5 h-3.5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span>What to avoid based on your color palette</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-luxury-warm-white/95 backdrop-blur-xl border-t border-luxury-cream p-3 md:p-4 space-y-2">
              <button
                onClick={async () => {
                  setShowAddonPopup(false);
                  trackCTAClick('Proceed with Add-ons', 'Popup Continue Button', totalAmount, 'USD', 'USA_IndianAmerican');
                  await processPayment();
                }}
                disabled={isProcessing}
                className="w-full bg-luxury-accent hover:bg-luxury-accent/90 text-white py-3 md:py-3.5 rounded-full luxury-body font-semibold transition-all duration-300 disabled:opacity-50 hover:scale-[1.01] transform text-sm md:text-base shadow-lg"
              >
                {isProcessing ? 'Processing...' : `Add & Pay $${totalAmount.toLocaleString()}`}
              </button>

              <button
                onClick={() => {
                  trackCTAClick('Continue without Add-ons', 'Popup Skip Button', totalAmount, 'USD', 'USA_IndianAmerican');
                  continueWithoutAddons();
                }}
                disabled={isProcessing}
                className="w-full bg-transparent hover:bg-luxury-cream/50 text-luxury-charcoal/60 py-2.5 rounded-full luxury-body transition-all duration-300 disabled:opacity-50 text-xs md:text-sm"
              >
                No thanks, continue without
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating WhatsApp Button - Mobile Only */}
      <a
        href="https://wa.me/919130048899?text=Hi%20Iconik%20I'm%20looking%20to%20buy%20but%20have%20a%20few%20questions!"
        target="_blank"
        rel="noopener noreferrer"
        className="md:hidden fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="Chat on WhatsApp"
      >
        <svg
          className="w-7 h-7"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}