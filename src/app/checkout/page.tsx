'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock } from 'lucide-react';
import { trackAddToCart, trackInitiateCheckout, trackPurchase, updateUserData, trackCTAClick, trackRemoveFromCart, trackViewContent, trackPageView } from '@/lib/metaPixel';

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

  // Testimonial images
  const testimonialImages = [
    { src: '/text1.webp', alt: 'Client testimonial 1' },
    { src: '/text2.webp', alt: 'Client testimonial 2' }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonialImages.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [testimonialImages.length]);

  // Product pricing
  const originalPrice = 5999;
  const discountedPrice = 1999;
  const savings = originalPrice - discountedPrice;

  // Track PageView and ViewContent on checkout page load
  useEffect(() => {
    trackPageView('Checkout');
    trackViewContent(
      'ICONIK Style Consultation - Checkout',
      discountedPrice,
      ['iconik_style_consultation'],
      'INR',
      'India'
    );
  }, [discountedPrice]);

  // Add-ons
  const [wardrobeDetoxAddon, setWardrobeDetoxAddon] = useState(false); // Wardrobe Detox
  const [smartShoppersGuideAddon, setSmartShoppersGuideAddon] = useState(false); // Smart Shopper's Guide
  const [outfitPreviewAddon, setOutfitPreviewAddon] = useState(false); // Outfit Preview on You

  const wardrobeDetoxPrice = 1299;

  const smartShoppersGuidePrice = 499;
  const outfitPreviewPrice = 999;

  // Memoize total calculations to prevent unnecessary recalculations
  const totalAmount = useMemo(() =>
    discountedPrice +
    (wardrobeDetoxAddon ? wardrobeDetoxPrice : 0) +
    (smartShoppersGuideAddon ? smartShoppersGuidePrice : 0) +
    (outfitPreviewAddon ? outfitPreviewPrice : 0),
    [wardrobeDetoxAddon, smartShoppersGuideAddon, outfitPreviewAddon]
  );

  const totalValue = useMemo(() =>
    originalPrice + 1000 + // Base + Free bonuses (₹1,000+ value)
    (wardrobeDetoxAddon ? wardrobeDetoxPrice : 0) +
    (smartShoppersGuideAddon ? smartShoppersGuidePrice : 0) +
    (outfitPreviewAddon ? outfitPreviewPrice : 0),
    [wardrobeDetoxAddon, smartShoppersGuideAddon, outfitPreviewAddon]
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

  // Optimized input change handler with memoized validation
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Phone number validation - only allow 10 digits
    if (name === 'phone') {
      const phoneRegex = /^\d{0,10}$/;
      if (!phoneRegex.test(value)) {
        return; // Don't update if invalid
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update Meta Pixel with user data for advanced matching when both fields have valid data
    if (name === 'email' && value.includes('@') && formData.phone.length === 10) {
      updateUserData(value, formData.phone);
    } else if (name === 'phone' && value.length === 10 && formData.email.includes('@')) {
      updateUserData(formData.email, value);
    }
  }, [formData.phone, formData.email]);

  // Memoize addon details to prevent recreation on every render
  const addonDetails = useMemo(() => ({
    wardrobedetox: {
      name: 'Wardrobe Detox',
      price: 1299,
      id: 'wardrobe_detox'
    },
    smartshopper: {
      name: 'Smart Shopper\'s Guide',
      price: 499,
      id: 'smart_shoppers_guide'
    },
    outfitpreview: {
      name: 'Outfit Preview on You',
      price: 999,
      id: 'outfit_preview'
    }
  }), []);

  // Optimized add-on change handler with Meta tracking only for additions
  const handleAddonChange = useCallback((addonType: 'wardrobedetox' | 'smartshopper' | 'outfitpreview', checked: boolean) => {
    const addon = addonDetails[addonType];

    // Track addon changes
    if (checked) {
      trackAddToCart(addon.name, addon.price, addon.id, 'INR', 'India');
    } else {
      trackRemoveFromCart(addon.name, addon.price, addon.id, 'INR', 'India');
    }

    // Update state
    if (addonType === 'wardrobedetox') {
      setWardrobeDetoxAddon(checked);
    } else if (addonType === 'smartshopper') {
      setSmartShoppersGuideAddon(checked);
    } else if (addonType === 'outfitpreview') {
      setOutfitPreviewAddon(checked);
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
    const itemCount = 1 + (wardrobeDetoxAddon ? 1 : 0) + (smartShoppersGuideAddon ? 1 : 0) + (outfitPreviewAddon ? 1 : 0);
    trackInitiateCheckout(totalAmount, itemCount, 'ICONIK Style Consultation', 'INR', 'India');

    try {
      // Create order data
      const orderData = {
        customer_name: formData.email.split('@')[0], // Use email prefix as name
        customer_email: formData.email,
        customer_phone: formData.phone,
        amount: totalAmount,
        base_product: 'Iconik Style Consultation',
        add_ons: {
          wardrobe_detox: wardrobeDetoxAddon,
          smart_shoppers_guide: smartShoppersGuideAddon,
          outfit_preview: outfitPreviewAddon
        },
        total_base_price: discountedPrice,
        wardrobe_detox_price: wardrobeDetoxAddon ? wardrobeDetoxPrice : 0,
        smart_shoppers_guide_price: smartShoppersGuideAddon ? smartShoppersGuidePrice : 0,
        outfit_preview_price: outfitPreviewAddon ? outfitPreviewPrice : 0
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
          currency: responseData.currency,
          name: 'Iconik One On One',
          description: 'Iconik Style Consultation',
          image: `${window.location.origin}/logopayment.webp`, // Logo displayed on Razorpay checkout
          order_id: responseData.razorpay_order_id,
          handler: function (response: RazorpayResponse) {
            // Payment successful - Track detailed purchase with all items
            const purchasedItems = ['iconik_style_consultation'];
            if (wardrobeDetoxAddon) purchasedItems.push('wardrobe_detox');
            if (smartShoppersGuideAddon) purchasedItems.push('smart_shoppers_guide');
            if (outfitPreviewAddon) purchasedItems.push('outfit_preview');

            // Track SINGLE purchase event with all items (no duplicates)
            trackPurchase(totalAmount, 'ICONIK Complete Package', purchasedItems, purchasedItems.length, 'INR', 'India', response.razorpay_payment_id);

            // Store purchase amount and currency for success page tracking
            localStorage.setItem('purchaseAmount', totalAmount.toString());
            localStorage.setItem('purchaseCurrency', 'INR');

            // Store customer email and phone for upsell subscription
            localStorage.setItem('customerEmail', formData.email);
            localStorage.setItem('customerPhone', formData.phone);

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

            // Redirect to success page with all necessary parameters including amount
            const successUrl = `/checkout/success?payment_id=${response.razorpay_payment_id}&order_id=${responseData.razorpay_order_id}&customer_id=${responseData.customer_id}&db_order_id=${responseData.db_order_id}&amount=${totalAmount}`;
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
  }, [formData, totalAmount, wardrobeDetoxAddon, smartShoppersGuideAddon, outfitPreviewAddon, razorpayLoaded]);

  // Memoize submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();


    // Check if no add-ons are selected
    const hasAddons = wardrobeDetoxAddon || smartShoppersGuideAddon || outfitPreviewAddon;


    // Only show popup if: no add-ons AND popup hasn't been dismissed
    if (!hasAddons && !popupDismissed) {
      setShowAddonPopup(true);
    } else {
      // Process payment directly if add-ons selected OR popup was dismissed
      await processPayment();
    }
  }, [processPayment, wardrobeDetoxAddon, smartShoppersGuideAddon, outfitPreviewAddon, popupDismissed]);

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
          <Link href="/" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body">
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
            <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">₹{originalPrice}</span>
            <span className="text-luxury-green font-semibold">₹{discountedPrice}</span>
          </div>

          <div className="bg-luxury-accent text-luxury-warm-white px-4 md:px-6 py-2 rounded-full luxury-body text-sm md:text-lg inline-block animate-bounce">
            YOU SAVE ₹{savings} TODAY!
          </div>
        </motion.div>

        {/* WhatsApp Testimonial Carousel - 75% Size (25% Smaller) */}
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
                      width={135}
                      height={240}
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
                  placeholder="Enter 10-digit phone number"
                />
                <p className="text-xs luxury-body text-luxury-charcoal/50 mt-1">Enter exactly 10 digits</p>
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
                  <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">₹{originalPrice}</span>
                  <span className="text-luxury-green font-semibold">₹{discountedPrice}</span>
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
                {/* Add-on 0: Outfit Preview on You - NEW */}
                <div
                  onClick={() => handleAddonChange('outfitpreview', !outfitPreviewAddon)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${outfitPreviewAddon
                    ? 'border-luxury-accent bg-luxury-warm-white shadow-lg'
                    : 'border-luxury-cream bg-luxury-warm-white/50 hover:border-luxury-accent/50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${outfitPreviewAddon ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                      }`}>
                      {outfitPreviewAddon && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="luxury-heading text-luxury-charcoal text-base">👗 Outfit Preview on You</h4>
                        <span className="text-luxury-green font-semibold text-lg flex-shrink-0">₹{outfitPreviewPrice}</span>
                      </div>
                      <p className="text-xs luxury-body text-luxury-charcoal/70 mb-2">
                        See how the outfits we recommend will actually look on YOUR body.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">See yourself in the outfits</span>
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">No more guessing</span>
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">Shop with confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Add-on 1: Wardrobe Detox */}
                <div
                  onClick={() => handleAddonChange('wardrobedetox', !wardrobeDetoxAddon)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${wardrobeDetoxAddon
                    ? 'border-luxury-accent bg-luxury-warm-white shadow-lg'
                    : 'border-luxury-cream bg-luxury-warm-white/50 hover:border-luxury-accent/50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${wardrobeDetoxAddon ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                      }`}>
                      {wardrobeDetoxAddon && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="luxury-heading text-luxury-charcoal text-base">👗 Wardrobe Detox</h4>
                        <span className="text-luxury-green font-semibold text-lg flex-shrink-0">₹{wardrobeDetoxPrice}</span>
                      </div>
                      <p className="text-xs luxury-body text-luxury-charcoal/70 mb-2">
                        Let us audit your closet and create a curated wardrobe for you
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">Closet audit</span>
                        <span className="text-[10px] bg-luxury-cream px-2 py-0.5 rounded-full text-luxury-charcoal/70">Keep/donate guide</span>
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
                        <h4 className="luxury-heading text-luxury-charcoal text-base">🛍️ Smart Shopper&apos;s Guide</h4>
                        <span className="text-luxury-green font-semibold text-lg flex-shrink-0">₹{smartShoppersGuidePrice}</span>
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
                  <span>₹{discountedPrice}</span>
                </div>

                {wardrobeDetoxAddon && (
                  <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70">
                    <span>+ Wardrobe Detox</span>
                    <span>₹{wardrobeDetoxPrice}</span>
                  </div>
                )}

                {smartShoppersGuideAddon && (
                  <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70">
                    <span>+ Smart Shopper&apos;s Guide</span>
                    <span>₹{smartShoppersGuidePrice}</span>
                  </div>
                )}

                {outfitPreviewAddon && (
                  <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70">
                    <span>+ Outfit Preview</span>
                    <span>₹{outfitPreviewPrice}</span>
                  </div>
                )}
              </div>

              {/* Big Bold Total */}
              <div className="border-t-2 border-luxury-charcoal/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal">You Pay:</span>
                  <span className="text-3xl md:text-4xl text-luxury-green font-bold">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs luxury-body text-luxury-charcoal/60">
                    Total value: <span className="line-through">₹{totalValue.toLocaleString()}</span>
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
                  const hasAddons = wardrobeDetoxAddon || smartShoppersGuideAddon || outfitPreviewAddon;
                  if (!hasAddons && !popupDismissed) {
                    setShowAddonPopup(true);
                    trackCTAClick('Add-on Popup Shown', 'Checkout Main Button', totalAmount, 'INR', 'India');
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
                    trackCTAClick('Add-on Popup Dismissed', 'Popup Close Button', undefined, 'INR', 'India');
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
              {/* Wardrobe Detox Add-on */}
              <div
                onClick={() => setWardrobeDetoxAddon(!wardrobeDetoxAddon)}
                className={`border-2 rounded-xl p-3 cursor-pointer transition-all duration-300 ${wardrobeDetoxAddon
                  ? 'border-luxury-accent bg-luxury-pink-bg shadow-lg'
                  : 'border-luxury-cream hover:border-luxury-accent/50 hover:bg-luxury-cream/30'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${wardrobeDetoxAddon ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                    }`}>
                    {wardrobeDetoxAddon && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="luxury-heading text-luxury-charcoal text-sm md:text-base">
                        👗 Wardrobe Detox
                      </h4>
                      <div className="text-right flex-shrink-0">
                        <span className="text-luxury-green font-semibold text-base">₹{wardrobeDetoxPrice}</span>
                      </div>
                    </div>
                    <p className="text-xs luxury-body text-luxury-charcoal/70 mb-2">
                      Let us audit your closet and create a curated wardrobe
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5 text-xs luxury-body text-luxury-charcoal/70">
                        <CheckCircle className="w-3.5 h-3.5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span>Closet audit</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs luxury-body text-luxury-charcoal/70">
                        <CheckCircle className="w-3.5 h-3.5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span>Keep/donate guide</span>
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
                        <span className="text-luxury-green font-semibold text-base">₹{smartShoppersGuidePrice}</span>
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
                  trackCTAClick('Proceed with Add-ons', 'Popup Continue Button', totalAmount, 'INR', 'India');
                  await processPayment();
                }}
                disabled={isProcessing}
                className="w-full bg-luxury-accent hover:bg-luxury-accent/90 text-white py-3 md:py-3.5 rounded-full luxury-body font-semibold transition-all duration-300 disabled:opacity-50 hover:scale-[1.01] transform text-sm md:text-base shadow-lg"
              >
                {isProcessing ? 'Processing...' : `Add & Pay ₹${totalAmount.toLocaleString()}`}
              </button>

              <button
                onClick={() => {
                  trackCTAClick('Continue without Add-ons', 'Popup Skip Button', totalAmount, 'INR', 'India');
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
    </div>
  );
}