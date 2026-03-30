'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock } from 'lucide-react';
import { trackInitiateCheckout, trackPurchase, updateUserData } from '@/lib/metaPixel';

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


interface FormData {
  email: string;
  phone: string;
  name: string;
}

function MonthlyCheckoutPageContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    phone: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  // Determine plan from URL parameter
  const plan = planParam === 'with-consultation' ? 'with-consultation' : 'base';
  
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
  
  // Pricing based on plan
  const trialPrice = 99;
  const monthlyPrice = 499;
  const consultationPrice = 1999;
  
  // Calculate total based on plan
  const totalAmount = useMemo(() => {
    if (plan === 'with-consultation') {
      return trialPrice + consultationPrice; // ₹99 + ₹1,999 = ₹2,098
    }
    return trialPrice; // ₹99 trial
  }, [plan]);
  
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

  // Input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Phone number validation - only allow 10 digits
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

  // Process payment
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
    
    // Validate name
    if (!formData.name || formData.name.trim().length < 2) {
      alert('Please enter your full name');
      return;
    }
    
    setIsProcessing(true);
    
    // Track InitiateCheckout event
    trackInitiateCheckout(totalAmount, 1, 'ICONIK Monthly Subscription');
    
    try {
      // Create order data
      const orderData = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        amount: totalAmount,
        base_product: 'ICONIK Monthly Subscription',
        plan_type: plan,
        add_ons: {
          consultation: plan === 'with-consultation'
        },
        total_base_price: trialPrice,
        consultation_price: plan === 'with-consultation' ? consultationPrice : 0,
        monthly_price: monthlyPrice
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
      
      // Initialize Razorpay payment
      const initializeRazorpay = () => {
        const options = {
          key: responseData.key,
          amount: responseData.amount,
          currency: responseData.currency,
          name: 'Iconik One On One',
          description: plan === 'with-consultation' 
            ? 'ICONIK Monthly + Consultation' 
            : 'ICONIK Monthly Subscription',
          image: `${window.location.origin}/logopayment.webp`,
          order_id: responseData.razorpay_order_id,
          handler: function (response: RazorpayResponse) {
            // Payment successful - Track purchase
            const purchasedItems = ['iconik_monthly_subscription'];
            if (plan === 'with-consultation') {
              purchasedItems.push('iconik_consultation');
            }
            
            trackPurchase(totalAmount, 'ICONIK Monthly Subscription', purchasedItems, purchasedItems.length);
            
            // Store purchase amount
            localStorage.setItem('purchaseAmount', totalAmount.toString());
            
            // Store customer and order IDs
            if (responseData.customer_id) {
              localStorage.setItem('customerId', responseData.customer_id);
              sessionStorage.setItem('customerId', responseData.customer_id);
            }
            if (responseData.db_order_id) {
              localStorage.setItem('orderId', responseData.db_order_id);
              sessionStorage.setItem('orderId', responseData.db_order_id);
            }
            
            // Redirect to external quiz platform (as per PRD)
            // TODO: Replace with actual quiz platform URL
            const quizPlatformUrl = process.env.NEXT_PUBLIC_QUIZ_PLATFORM_URL || 'https://your-quiz-platform.com';
            const redirectUrl = `${quizPlatformUrl}/onboarding?email=${encodeURIComponent(formData.email)}&phone=${encodeURIComponent(formData.phone)}&plan=${plan}&payment_id=${response.razorpay_payment_id}`;
            
            window.location.href = redirectUrl;
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#E91E63'
          }
        };
        
        const razorpay = new (window as unknown as { Razorpay: new (o: RazorpayOptions) => RazorpayInstance }).Razorpay(options);
        razorpay.open();
      };

      // Check if Razorpay is already loaded
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
  }, [formData, totalAmount, plan, razorpayLoaded]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      {/* Header */}
      <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/monthly" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body">
            <ArrowLeft className="w-5 h-5" />
            Back to Monthly Plan
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
            <span className="text-xs md:text-sm luxury-body">1,200+ Happy Subscribers</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-luxury-pink-bg text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
            <Lock className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm luxury-body">100% Secure</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-luxury-pink-bg text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
            <Star className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm luxury-body">4.8/5 Rating</span>
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
            Your Weekly Styling Journey Starts Here
          </h1>
          
          <div className="text-3xl md:text-5xl lg:text-6xl mb-3 md:mb-4">
            <span className="text-luxury-green font-semibold">₹{totalAmount}</span>
            {plan === 'with-consultation' && (
              <span className="text-luxury-charcoal/60 luxury-body text-base md:text-lg ml-2">+ ₹{monthlyPrice}/month</span>
            )}
          </div>
          
          {plan === 'base' ? (
            <div className="bg-luxury-accent text-luxury-warm-white px-4 md:px-6 py-2 rounded-full luxury-body text-sm md:text-lg inline-block">
              Try first week for ₹99, then ₹499/month
            </div>
          ) : (
            <div className="bg-luxury-accent text-luxury-warm-white px-4 md:px-6 py-2 rounded-full luxury-body text-sm md:text-lg inline-block">
              First week ₹99 + Consultation ₹1,999, then ₹499/month
            </div>
          )}
        </motion.div>

        {/* WhatsApp Testimonial Carousel */}
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
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentTestimonial ? 'opacity-100' : 'opacity-0'
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
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
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
            <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-6 text-center">
              Get Your Weekly Styling
            </h2>
            
            <form id="checkout-form" className="space-y-6">
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm luxury-body text-luxury-charcoal/70 mb-2 font-semibold">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-4 border-2 border-luxury-charcoal/20 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-base"
                  placeholder="Enter your full name"
                />
              </div>

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

              {/* Phone Number (WhatsApp) */}
              <div>
                <label htmlFor="phone" className="block text-sm luxury-body text-luxury-charcoal/70 mb-2 font-semibold">
                  WhatsApp Number *
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
                  placeholder="Enter 10-digit WhatsApp number"
                />
                <p className="text-xs luxury-body text-luxury-charcoal/50 mt-1">We&apos;ll send your styled outfits here</p>
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
            {/* Plan Summary */}
            <div className="bg-luxury-warm-white border-2 border-luxury-charcoal text-luxury-charcoal rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-2 md:top-4 right-[-30px] bg-luxury-accent text-luxury-warm-white px-6 md:px-8 py-1 transform rotate-45 text-xs font-bold">
                {plan === 'with-consultation' ? 'COMPLETE PACKAGE' : 'MOST POPULAR'}
              </div>
              
              <div className="mb-4">
                <h3 className="text-xl md:text-2xl luxury-heading mb-2 text-luxury-charcoal">
                  {plan === 'with-consultation' ? 'ICONIK Monthly + Consultation' : 'ICONIK Monthly'}
                </h3>
              
                <p className="text-sm md:text-base luxury-body text-luxury-charcoal/70 mb-3">
                  Weekly styling delivered to WhatsApp
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="luxury-heading text-luxury-charcoal mb-3">Order Summary:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/80">
                    <span>First Week Trial:</span>
                    <span>₹{trialPrice}</span>
                  </div>
                  {plan === 'with-consultation' && (
                    <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/80">
                      <span>Style Consultation:</span>
                      <span>₹{consultationPrice}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/60">
                    <span>Then Monthly:</span>
                    <span>₹{monthlyPrice}/month</span>
                  </div>
                  <div className="border-t border-luxury-charcoal/20 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base luxury-heading text-luxury-charcoal font-semibold">Total Due Today:</span>
                      <span className="text-xl md:text-2xl text-luxury-green font-bold">₹{totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="luxury-heading text-luxury-charcoal mb-3">What You Get:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">3 styled outfits per week (Mon/Wed/Fri)</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">AI-generated images of YOU in each outfit</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">Personalized styling based on your quiz</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">WhatsApp support (24h response)</span>
                  </li>
                  {plan === 'with-consultation' && (
                    <>
                      <li className="flex items-start gap-2 md:gap-3">
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">90-minute 1-on-1 video consultation</span>
                      </li>
                      <li className="flex items-start gap-2 md:gap-3">
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">Comprehensive style guide PDF (30+ pages)</span>
                      </li>
                    </>
                  )}
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">Cancel anytime, no contracts</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Order Total */}
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-luxury-cream">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70">
                  <span>First Week Trial</span>
                  <span>₹{trialPrice}</span>
                </div>
                
                {plan === 'with-consultation' && (
                  <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/70">
                    <span>Style Consultation</span>
                    <span>₹{consultationPrice}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xs luxury-body text-luxury-charcoal/50">
                  <span>Then Monthly</span>
                  <span>₹{monthlyPrice}/month</span>
                </div>
              </div>

              {/* Big Bold Total */}
              <div className="border-t-2 border-luxury-charcoal/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal">You Pay:</span>
                  <span className="text-3xl md:text-4xl text-luxury-green font-bold">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs luxury-body text-luxury-charcoal/60">
                    {plan === 'with-consultation' 
                      ? `Total first month: ₹${(totalAmount + monthlyPrice).toLocaleString()} (then ₹${monthlyPrice}/month)`
                      : `Then ₹${monthlyPrice}/month • Cancel anytime`
                    }
                  </p>
                </div>
              </div>

              {/* Payment Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={processPayment}
                className="w-full bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white py-4 md:py-5 px-4 md:px-6 rounded-full text-lg md:text-xl luxury-body shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mt-4 hover:scale-[1.02] transform font-semibold"
              >
                {isProcessing ? 'Processing...' : '✨ Complete Payment & Start Styling →'}
              </button>

              <div className="text-center text-xs md:text-sm luxury-body text-luxury-charcoal/60 mt-3">
                <p>💳 Secure payment via Razorpay</p>
                <p className="mt-1">After payment, you&apos;ll be redirected to complete your style quiz</p>
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
                  <span>Start receiving outfits within 48 hours</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>1,200+ women getting styled weekly</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function MonthlyCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
        <div className="text-luxury-charcoal luxury-body">Loading...</div>
      </div>
    }>
      <MonthlyCheckoutPageContent />
    </Suspense>
  );
}

