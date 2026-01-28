'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock } from 'lucide-react';
import { trackInitiateCheckout, trackPurchase, updateUserData, trackViewContent } from '@/lib/metaPixel';

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
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
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
      name: 'Monthly Plan',
      planId: 'plan_S99gOCaBnHybc7'
    },
    quarterly: {
      price: 4599,
      originalPrice: 6599,
      savings: 2000,
      name: 'Quarterly Plan (3 Months)',
      planId: 'plan_S99mi4mzryqODa'
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

        const razorpay = new (window.Razorpay as any)(options);
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/iconik-closet" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body">
            <ArrowLeft className="w-5 h-5" />
            Back to Iconik Closet
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
            <span className="text-xs md:text-sm luxury-body">268+ Happy Subscribers</span>
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
            Start Your Iconik Closet Subscription
          </h1>

          <p className="text-base md:text-lg luxury-body text-luxury-charcoal/70 mb-4">
            Choose your plan and never waste time shopping again
          </p>
        </motion.div>

        {/* Plan Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 md:mb-8 max-w-3xl mx-auto"
        >
          <h2 className="text-xl md:text-2xl luxury-heading text-center mb-4 text-luxury-charcoal">
            Select Your Plan
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Monthly Plan */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-300 ${selectedPlan === 'monthly'
                ? 'border-luxury-accent bg-luxury-accent/5 shadow-lg'
                : 'border-luxury-cream hover:border-luxury-accent/50'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg luxury-heading text-luxury-charcoal mb-1">Monthly Plan</h3>
                  <p className="text-xs luxury-body text-luxury-charcoal/60">Cancel anytime</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPlan === 'monthly' ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                  }`}>
                  {selectedPlan === 'monthly' && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-luxury-green">₹{plans.monthly.price}</span>
                  <span className="text-lg text-luxury-charcoal/50 line-through">₹{plans.monthly.originalPrice}</span>
                </div>
                <p className="text-xs luxury-body text-luxury-green mt-1">Save ₹{plans.monthly.savings}/month</p>
              </div>

              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm luxury-body text-luxury-charcoal/80">
                  <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                  6 outfit sets monthly
                </li>
                <li className="flex items-start gap-2 text-sm luxury-body text-luxury-charcoal/80">
                  <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                  Direct shopping links
                </li>
                <li className="flex items-start gap-2 text-sm luxury-body text-luxury-charcoal/80">
                  <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                  WhatsApp support
                </li>
              </ul>
            </div>

            {/* Quarterly Plan */}
            <div
              onClick={() => setSelectedPlan('quarterly')}
              className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-300 relative ${selectedPlan === 'quarterly'
                ? 'border-luxury-accent bg-luxury-accent/5 shadow-lg'
                : 'border-luxury-cream hover:border-luxury-accent/50'
                }`}
            >
              <div className="absolute top-2 right-2 bg-luxury-gold text-luxury-charcoal px-2 py-1 rounded-full text-xs font-bold">
                BEST VALUE
              </div>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg luxury-heading text-luxury-charcoal mb-1">Quarterly Plan</h3>
                  <p className="text-xs luxury-body text-luxury-charcoal/60">3 months prepaid</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPlan === 'quarterly' ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/30'
                  }`}>
                  {selectedPlan === 'quarterly' && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-luxury-green">₹{plans.quarterly.price}</span>
                  <span className="text-lg text-luxury-charcoal/50 line-through">₹{plans.quarterly.originalPrice}</span>
                </div>
                <p className="text-xs luxury-body text-luxury-green mt-1">Save ₹{plans.quarterly.savings} total</p>
              </div>

              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm luxury-body text-luxury-charcoal/80">
                  <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                  Everything in Monthly
                </li>
                <li className="flex items-start gap-2 text-sm luxury-body text-luxury-charcoal/80">
                  <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                  Priority support
                </li>
                <li className="flex items-start gap-2 text-sm luxury-body text-luxury-charcoal/80">
                  <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                  Seasonal wardrobe refresh
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Testimonial Carousel */}
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
          {/* Order Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white border-2 border-luxury-charcoal rounded-3xl p-6 md:p-8 shadow-2xl"
          >
            <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-6 text-center">Enter Your Details</h2>

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
            {/* What You Get */}
            <div className="bg-luxury-warm-white border-2 border-luxury-charcoal text-luxury-charcoal rounded-3xl p-6 md:p-8 shadow-2xl">
              <h3 className="text-xl md:text-2xl luxury-heading mb-4 text-luxury-charcoal">What You Get Every Month</h3>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base font-semibold block">6 Complete Outfit Sets</span>
                    <span className="luxury-body text-luxury-charcoal/60 text-xs">Top, bottom, shoes, accessories, jewelry</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base font-semibold block">Direct Shopping Links</span>
                    <span className="luxury-body text-luxury-charcoal/60 text-xs">Click & buy in 30 seconds</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base font-semibold block">Styled for YOUR Body</span>
                    <span className="luxury-body text-luxury-charcoal/60 text-xs">Based on your style DNA & body type</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base font-semibold block">WhatsApp Support</span>
                    <span className="luxury-body text-luxury-charcoal/60 text-xs">Get styling questions answered</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base font-semibold block">Seasonal Updates</span>
                    <span className="luxury-body text-luxury-charcoal/60 text-xs">Wardrobe refresh every 3 months</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base font-semibold block">Cancel Anytime</span>
                    <span className="luxury-body text-luxury-charcoal/60 text-xs">No questions asked</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Order Total */}
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-luxury-cream">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70">
                  <span>{currentPlan.name}</span>
                  <span>₹{currentPlan.price}</span>
                </div>
                <div className="flex justify-between items-center text-sm luxury-body text-luxury-green">
                  <span>Savings</span>
                  <span>-₹{currentPlan.savings}</span>
                </div>
              </div>

              {/* Big Bold Total */}
              <div className="border-t-2 border-luxury-charcoal/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal">You Pay:</span>
                  <span className="text-3xl md:text-4xl text-luxury-green font-bold">₹{currentPlan.price.toLocaleString()}</span>
                </div>
                <div className="text-center">
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
                className="w-full bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white py-4 md:py-5 px-4 md:px-6 rounded-full text-lg md:text-xl luxury-body shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mt-4 hover:scale-[1.02] transform font-semibold"
              >
                {isProcessing ? 'Processing...' : '🔥 Start My Subscription →'}
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
                  <span>First outfit set in 72 hours</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>268+ happy subscribers</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
