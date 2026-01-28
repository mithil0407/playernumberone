'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock } from 'lucide-react';
import { trackInitiateCheckout, trackPurchase, updateUserData, trackViewContent, trackCTAClick } from '@/lib/metaPixel';

// Razorpay types for subscription
interface RazorpaySubscriptionResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface FormData {
  email: string;
  phone: string;
}

type PlanType = 'monthly' | 'quarterly';

export default function IconikClosetCheckout() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    phone: ''
  });
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 47 });
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
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
    }, 4000);

    return () => clearInterval(interval);
  }, [testimonialImages.length]);

  // Plan pricing
  const plans = {
    monthly: {
      price: 1699,
      originalPrice: 2199,
      savings: 500,
      name: 'Monthly Subscription',
      planId: 'plan_S99gOCaBnHybc7',
      perMonth: 1699
    },
    quarterly: {
      price: 4599,
      originalPrice: 6599,
      savings: 2000,
      name: 'Quarterly Subscription',
      planId: 'plan_S99mi4mzryqODa',
      perMonth: 1533
    }
  };

  const currentPlan = plans[selectedPlan];

  // Track ViewContent on checkout page load
  useEffect(() => {
    trackViewContent(
      'Iconik Closet Subscription - Checkout',
      currentPlan.price,
      ['iconik_closet_subscription'],
      'INR',
      'India'
    );
  }, [currentPlan.price]);

  // Preload Razorpay script
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
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const phoneRegex = /^\d{0,10}$/;
      if (!phoneRegex.test(value)) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update Meta Pixel with user data
    if (name === 'email' && value.includes('@') && formData.phone.length === 10) {
      updateUserData(value, formData.phone);
    } else if (name === 'phone' && value.length === 10 && formData.email.includes('@')) {
      updateUserData(formData.email, value);
    }
  }, [formData.phone, formData.email]);

  // Process subscription payment
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

    // Track InitiateCheckout event
    trackInitiateCheckout(currentPlan.price, 1, currentPlan.name, 'INR', 'India');

    try {
      // Create subscription data
      const subscriptionData = {
        plan_type: selectedPlan,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_name: formData.email.split('@')[0]
      };

      // Call subscription API
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error('Subscription initialization failed');
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || 'Subscription initialization failed');
      }

      console.log('Subscription API Response:', responseData);

      // Initialize Razorpay subscription
      const initializeRazorpay = () => {
        const options = {
          key: responseData.key,
          subscription_id: responseData.subscription_id,
          name: 'Iconik Closet',
          description: currentPlan.name,
          image: `${window.location.origin}/logopayment.webp`,
          handler: function (response: RazorpaySubscriptionResponse) {
            // Payment successful - Track purchase
            trackPurchase(
              currentPlan.price,
              'Iconik Closet Subscription',
              ['iconik_closet_subscription'],
              1,
              'INR',
              'India',
              response.razorpay_subscription_id
            );

            // Store subscription info
            localStorage.setItem('subscriptionAmount', currentPlan.price.toString());
            localStorage.setItem('subscriptionCurrency', 'INR');
            localStorage.setItem('customerEmail', formData.email);
            localStorage.setItem('customerPhone', formData.phone);
            localStorage.setItem('planType', selectedPlan);

            // Redirect to success page
            const successUrl = `/iconik-closet/success?subscription_id=${response.razorpay_subscription_id}&plan_type=${selectedPlan}&amount=${currentPlan.price}`;
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      };

      // Check if Razorpay is loaded
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
  }, [formData, currentPlan, selectedPlan, razorpayLoaded]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await processPayment();
  }, [processPayment]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      {/* Header */}
      <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Link href="/iconik-closet" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to ICONIK
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-luxury-cream/40 backdrop-blur-xl rounded-xl p-2.5 md:p-3 mb-4 flex flex-wrap justify-center gap-2 md:gap-4 text-xs md:text-sm"
        >
          <div className="flex items-center gap-1.5 luxury-body text-luxury-charcoal">
            <Users className="w-3.5 h-3.5" />
            268+ Happy Subscribers
          </div>
          <div className="text-luxury-charcoal/30">|</div>
          <div className="flex items-center gap-1.5 luxury-body text-luxury-charcoal">
            <Lock className="w-3.5 h-3.5" />
            100% Secure
          </div>
          <div className="text-luxury-charcoal/30">|</div>
          <div className="flex items-center gap-1.5 luxury-body text-luxury-charcoal">
            <Star className="w-3.5 h-3.5 text-luxury-gold fill-current" />
            4.9/5 Rating
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl md:text-4xl lg:text-5xl luxury-heading text-luxury-charcoal mb-3 leading-tight">
            Style Transformation + Personal Shopping Starts Now
          </h1>

          <p className="text-sm md:text-base lg:text-lg luxury-body text-luxury-charcoal/80 mb-4 max-w-3xl mx-auto">
            Iconik Style Blueprint + 6 Outfits Picked for you every month
          </p>

          <div className="mb-3">
            <div className="text-2xl md:text-4xl mb-2">
              <span className="line-through text-luxury-charcoal/40 mr-2">₹7,497</span>
              <span className="text-luxury-green font-bold">₹{currentPlan.price}</span>
              <span className="text-base md:text-lg text-luxury-charcoal/70">/month</span>
            </div>
            <div className="bg-luxury-accent text-luxury-warm-white px-4 py-1.5 rounded-full luxury-body text-sm md:text-base inline-block">
              YOU SAVE ₹{currentPlan.savings === 2000 ? '10,397 (69% OFF)' : '5,798'} TODAY!
            </div>
          </div>
        </motion.div>

        <div className="h-px bg-luxury-charcoal/10 mb-6"></div>

        {/* Real Results from Real Women - MOVED TO TOP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-lg md:text-xl luxury-heading text-center mb-3 text-luxury-charcoal">
            Real Results from Real Women
          </h2>

          <div className="max-w-[180px] mx-auto">
            <div className="relative">
              <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-xl p-2 border border-luxury-cream overflow-hidden">
                <div className="relative" style={{ aspectRatio: '9/16' }}>
                  {testimonialImages.map((testimonial, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        index === currentTestimonial ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <Image
                        src={testimonial.src}
                        alt={testimonial.alt}
                        width={120}
                        height={213}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-1.5 mt-2">
                {testimonialImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? 'bg-luxury-accent w-4'
                        : 'bg-luxury-charcoal/30 hover:bg-luxury-charcoal/50'
                    }`}
                    aria-label={`View testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="h-px bg-luxury-charcoal/10 mb-6"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Left Column - Form and Plan Selection */}
          <div className="space-y-4">
            {/* STEP 1: Choose Your Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-4 md:p-5 border border-luxury-cream shadow-sm"
            >
              <h2 className="text-lg md:text-xl luxury-heading mb-3 text-luxury-charcoal">
                Step 1: Choose Your Plan
              </h2>

              <div className="space-y-3">
                {/* Monthly Plan */}
                <div
                  onClick={() => setSelectedPlan('monthly')}
                  className={`cursor-pointer border-2 rounded-xl p-3 transition-all duration-300 relative ${
                    selectedPlan === 'monthly'
                      ? 'border-luxury-accent bg-luxury-accent/5'
                      : 'border-luxury-cream hover:border-luxury-accent/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedPlan === 'monthly' ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                      }`}
                    >
                      {selectedPlan === 'monthly' && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm luxury-heading text-luxury-charcoal mb-0.5">Monthly Subscription</h3>
                      <p className="text-xs luxury-body text-luxury-charcoal/60 mb-2">Cancel anytime</p>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-xs line-through text-luxury-charcoal/40">₹{plans.monthly.originalPrice}</span>
                        <span className="text-xl font-bold text-luxury-green">₹{plans.monthly.price}</span>
                        <span className="text-xs text-luxury-charcoal/70">/month</span>
                      </div>
                      <p className="text-xs luxury-body text-luxury-green">Save ₹{plans.monthly.savings} every month</p>
                    </div>
                  </div>
                </div>

                {/* Quarterly Plan */}
                <div
                  onClick={() => setSelectedPlan('quarterly')}
                  className={`cursor-pointer border-2 rounded-xl p-3 transition-all duration-300 relative ${
                    selectedPlan === 'quarterly'
                      ? 'border-luxury-accent bg-luxury-accent/5'
                      : 'border-luxury-cream hover:border-luxury-accent/50'
                  }`}
                >
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-luxury-accent text-luxury-warm-white px-3 py-0.5 rounded-full text-[10px] font-medium shadow-sm">
                    Best Value
                  </div>

                  <div className="flex items-start gap-2 mt-1">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedPlan === 'quarterly' ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                      }`}
                    >
                      {selectedPlan === 'quarterly' && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm luxury-heading text-luxury-charcoal mb-0.5">Quarterly Subscription</h3>
                      <p className="text-xs luxury-body text-luxury-charcoal/60 mb-2">3 months prepaid - Best Value</p>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-xs line-through text-luxury-charcoal/40">₹{plans.quarterly.originalPrice}</span>
                        <span className="text-xl font-bold text-luxury-green">₹{plans.quarterly.price}</span>
                      </div>
                      <p className="text-xs luxury-body text-luxury-green">Just ₹{plans.quarterly.perMonth}/month - Save ₹{plans.quarterly.savings}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* STEP 2: Enter Your Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-4 md:p-5 border border-luxury-cream shadow-sm"
            >
              <h2 className="text-lg md:text-xl luxury-heading mb-3 text-luxury-charcoal">
                Step 2: Enter Your Details
              </h2>

              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-3">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-xs luxury-body text-luxury-charcoal/70 mb-1.5 font-medium">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-luxury-charcoal/20 rounded-lg focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-sm"
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-xs luxury-body text-luxury-charcoal/70 mb-1.5 font-medium">
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
                    className="w-full px-3 py-2.5 border border-luxury-charcoal/20 rounded-lg focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-sm"
                    placeholder="Enter 10-digit phone number"
                  />
                  <p className="text-xs luxury-body text-luxury-charcoal/50 mt-1">Enter exactly 10 digits</p>
                </div>

                {/* Security Notice */}
                <div className="text-center text-xs luxury-body text-luxury-charcoal/60 bg-luxury-cream/30 rounded-lg p-3">
                  <p>🔒 Your payment is secure and encrypted</p>
                  <p className="mt-0.5">By clicking below, you agree to our terms of service and privacy policy</p>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Right Column - What You Get & Order Summary */}
          <div className="space-y-4">
            {/* What You Get */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-4 md:p-5 border border-luxury-cream shadow-sm"
            >
              <h3 className="text-sm md:text-base luxury-heading text-luxury-charcoal mb-3 text-center">
                What You Get With Iconik Closet
              </h3>

              {/* Month 1 Card */}
              <div className="bg-luxury-cream/30 rounded-xl p-3 mb-3 border border-luxury-cream">
                <h4 className="text-xs font-semibold luxury-heading text-luxury-charcoal mb-2">
                  Month 1: Your Complete Transformation
                </h4>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-luxury-accent text-xs flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="luxury-body text-luxury-charcoal/80 text-xs font-medium block">16 Complete Outfit Recommendations</span>
                      <span className="luxury-body text-luxury-charcoal/60 text-[10px]">Head-to-toe looks designed for YOUR body type</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-luxury-accent text-xs flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="luxury-body text-luxury-charcoal/80 text-xs font-medium block">Hair & Makeup Styling Guide</span>
                      <span className="luxury-body text-luxury-charcoal/60 text-[10px]">Hairstyles and makeup looks that enhance your features</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-luxury-accent text-xs flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="luxury-body text-luxury-charcoal/80 text-xs font-medium block">Style DNA Blueprint</span>
                      <span className="luxury-body text-luxury-charcoal/60 text-[10px]">Body shape, color palette, silhouette mapping</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-luxury-accent text-xs flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="luxury-body text-luxury-charcoal/80 text-xs font-medium block">20-min Private Consultation</span>
                      <span className="luxury-body text-luxury-charcoal/60 text-[10px]">One-on-one with certified fashion consultant</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Every Month After Card */}
              <div className="bg-luxury-accent/5 rounded-xl p-3 border border-luxury-accent/20">
                <h4 className="text-xs font-semibold luxury-heading text-luxury-charcoal mb-2">
                  Every Month After: Shopping Done For You
                </h4>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-luxury-accent text-xs flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="luxury-body text-luxury-charcoal/80 text-xs font-medium block">6 Curated Outfit Sets</span>
                      <span className="luxury-body text-luxury-charcoal/60 text-[10px]">Top, bottom, shoes, accessories, jewelry</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-luxury-accent text-xs flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="luxury-body text-luxury-charcoal/80 text-xs font-medium block">Direct Shopping Links</span>
                      <span className="luxury-body text-luxury-charcoal/60 text-[10px]">Click & buy in 30 seconds - no searching</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-luxury-accent text-xs flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="luxury-body text-luxury-charcoal/80 text-xs font-medium block">Styled for YOUR Body</span>
                      <span className="luxury-body text-luxury-charcoal/60 text-[10px]">Based on your Month 1 blueprint</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-luxury-accent text-xs flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="luxury-body text-luxury-charcoal/80 text-xs font-medium block">WhatsApp Styling Support</span>
                      <span className="luxury-body text-luxury-charcoal/60 text-[10px]">Get quick answers to styling questions</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-luxury-accent text-xs flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="luxury-body text-luxury-charcoal/80 text-xs font-medium block">Seasonal Wardrobe Updates</span>
                      <span className="luxury-body text-luxury-charcoal/60 text-[10px]">Trend refresh every 3 months</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-luxury-accent text-xs flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="luxury-body text-luxury-charcoal/80 text-xs font-medium block">Cancel Anytime</span>
                      <span className="luxury-body text-luxury-charcoal/60 text-[10px]">No questions asked, instant refund</span>
                    </div>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-luxury-cream/40 rounded-2xl p-4 md:p-5 border border-luxury-cream"
            >
              <h3 className="text-base md:text-lg luxury-heading mb-3 text-luxury-charcoal">
                Order Summary
              </h3>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center text-xs luxury-body text-luxury-charcoal/70">
                  <span>{currentPlan.name}</span>
                  <span>₹{currentPlan.price}</span>
                </div>
                <div className="flex justify-between items-center text-xs luxury-body text-luxury-green">
                  <span>Savings</span>
                  <span>-₹{currentPlan.savings}</span>
                </div>
              </div>

              <div className="border-t border-luxury-charcoal/10 pt-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg luxury-heading text-luxury-charcoal">You Pay:</span>
                  <span className="text-2xl text-luxury-green font-bold">₹{currentPlan.price.toLocaleString()}</span>
                </div>
                <div className="text-center mb-2">
                  <p className="text-xs luxury-body text-luxury-charcoal/60">
                    Regular price: <span className="line-through">₹{currentPlan.originalPrice.toLocaleString()}</span>
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-luxury-accent" />
                    <span className="text-xs luxury-body text-luxury-accent font-semibold">
                      Offer expires in {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={processPayment}
                className="w-full bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white py-3 px-4 rounded-full text-sm md:text-base luxury-body shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] transform font-semibold mb-3"
              >
                {isProcessing ? 'Processing...' : '🔥 Transform My Style + Start Monthly Outfits →'}
              </button>

              <div className="text-center text-xs luxury-body text-luxury-charcoal/60 mb-3">
                <p>💳 Secure payment via Razorpay</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs luxury-body text-luxury-charcoal/70">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-luxury-green" />
                  <span>100% satisfaction</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-luxury-green" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-luxury-gold fill-current" />
                  <span>Hand-curated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-luxury-green" />
                  <span>268+ subscribers</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://api.whatsapp.com/send/?phone=919130048899&text=Hi+ICONIK%21+I+have+a+question+about+Iconik+Closet+subscription.&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          trackCTAClick('Floating WhatsApp', 'WhatsApp Button - Checkout', undefined, 'INR', 'India');
        }}
        className="fixed bottom-6 right-4 md:right-6 bg-[#25D366] hover:bg-[#20BA5A] text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-40 hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
