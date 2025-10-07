'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, CheckCircle, Lock, Star } from 'lucide-react';
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

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface FormData {
  email: string;
  phone: string;
}

export default function GuideCheckoutPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  
  // Product pricing
  const originalPrice = 25000;
  const discountedPrice = 499;
  const savings = originalPrice - discountedPrice;
  
  // Memoize total calculations to prevent unnecessary recalculations
  const totalAmount = useMemo(() => discountedPrice, []);


  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitIntent) {
        setShowExitIntent(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showExitIntent]);

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
    
    // Track InitiateCheckout event
    trackInitiateCheckout(totalAmount, 1, 'ICONIK Styling Guide');
    
    try {
      // Create order data
      const orderData = {
        customer_name: formData.email.split('@')[0], // Use email prefix as name
        customer_email: formData.email,
        customer_phone: formData.phone,
        amount: totalAmount,
        base_product: 'ICONIK Styling Guide',
        add_ons: {
          shopping_blueprint: false,
          glow_up_program: false,
          skin_hair_blueprint: false
        },
        total_base_price: discountedPrice,
        shopping_blueprint_price: 0,
        glow_up_program_price: 0,
        skin_hair_blueprint_price: 0
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
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        // Initialize Razorpay payment
        const options = {
          key: responseData.key,
          amount: responseData.amount,
          currency: 'INR',
          name: 'ICONIK',
          description: 'ICONIK Styling Guide',
          order_id: responseData.order_id,
          handler: async (response: RazorpayResponse) => {
            // Track purchase
            trackPurchase(totalAmount, 'ICONIK Styling Guide', ['iconik_guide'], 1);
            
            // Redirect to success page with parameters
            const successUrl = `/guide/success?customer_id=${responseData.customer_id}&order_id=${responseData.order_id}&db_order_id=${responseData.db_order_id}&payment_id=${response.razorpay_payment_id}`;
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
      document.body.appendChild(script);
      
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    }
  }, [formData, totalAmount]);

  // Memoize submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process payment directly
    await processPayment();
  }, [processPayment]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      {/* Header */}
      <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/guide" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body">
            <ArrowLeft className="w-5 h-5" />
            Back to ICONIK Guide
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 pb-24 md:pb-8">
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
            Get Your ICONIK Styling Guide
          </h1>
          
          <div className="text-3xl md:text-5xl lg:text-6xl mb-3 md:mb-4">
            <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">₹{originalPrice.toLocaleString()}</span>
            <span className="text-luxury-accent font-semibold">₹{discountedPrice}</span>
          </div>
          
          <div className="bg-luxury-accent text-luxury-warm-white px-4 md:px-6 py-2 rounded-full luxury-body text-sm md:text-lg inline-block animate-bounce">
            YOU SAVE ₹{savings.toLocaleString()} TODAY!
          </div>
        </motion.div>

        {/* WhatsApp Testimonials - Mobile First */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 md:mb-8"
        >
          <h2 className="text-xl md:text-2xl luxury-heading text-center mb-4 text-luxury-charcoal">
            Real Results from Real Women
          </h2>
          
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-2 border border-luxury-cream">
              <Image 
                src="/text1.webp" 
                alt="WhatsApp testimonial screenshot"
                width={400}
                height={300}
                className="w-full rounded-xl"
              />
            </div>
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-2 border border-luxury-cream">
              <Image 
                src="/text2.webp" 
                alt="WhatsApp testimonial screenshot"
                width={400}
                height={300}
                className="w-full rounded-xl"
              />
            </div>
          </div>
        </motion.div>

        {/* Product Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-4 md:p-6 mb-6 md:mb-8 border border-luxury-cream"
        >
          <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal mb-4 text-center">
            What You Get in Your ICONIK Guide
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Body Shape Discovery & Analysis',
              'Face Shape & Color Palette Guide',
              'Wardrobe Foundation Checklist',
              'Style Archetype Quiz & Results',
              'Mix & Match System (30+ Outfits)',
              'Occasion-Based Styling Guide',
              'Accessories & Footwear Guide',
              'Confidence Blueprint',
              'Smart Shopping Framework',
              'Bonus: 100+ Outfit Inspiration Library'
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-1" />
                <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Fast Action Bonuses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-luxury-pink-bg/50 backdrop-blur-xl rounded-3xl p-4 md:p-6 mb-6 md:mb-8 border border-luxury-cream"
        >
          <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal mb-4 text-center">
            🔥 Fast Action Bonuses (Limited Time)
          </h3>
          
          <div className="space-y-4">
            <div className="bg-luxury-warm-white/80 rounded-xl p-4">
              <h4 className="font-semibold text-luxury-charcoal mb-2">
                Bonus #1: Posing & Confidence Guide (₹1,500 Value)
              </h4>
              <p className="text-sm luxury-body text-luxury-charcoal/80">
                Learn how to pose and move in front of the camera like a natural. Perfect for photos, reels, or your first fashion shoot.
              </p>
            </div>
            
            <div className="bg-luxury-warm-white/80 rounded-xl p-4">
              <h4 className="font-semibold text-luxury-charcoal mb-2">
                Bonus #2: Shopping Masterlist (₹2,000 Value)
              </h4>
              <p className="text-sm luxury-body text-luxury-charcoal/80">
                Every essential piece to build your Iconik wardrobe — on a real Indian budget.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Order Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-luxury-warm-white/90 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-luxury-cream shadow-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-luxury-charcoal mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-luxury-warm-white/50 backdrop-blur-sm border border-luxury-cream rounded-lg focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent text-luxury-charcoal placeholder-luxury-charcoal/50"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-luxury-charcoal mb-2">
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
                className="w-full px-4 py-3 bg-luxury-warm-white/50 backdrop-blur-sm border border-luxury-cream rounded-lg focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent text-luxury-charcoal placeholder-luxury-charcoal/50"
                placeholder="10-digit mobile number"
              />
            </div>

            {/* Order Summary */}
            <div className="bg-luxury-cream/30 rounded-xl p-4">
              <h4 className="font-semibold text-luxury-charcoal mb-3">Order Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="luxury-body text-luxury-charcoal/80">ICONIK Styling Guide</span>
                  <span className="text-luxury-accent font-semibold">₹{discountedPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="luxury-body text-luxury-charcoal/80">Fast Action Bonuses</span>
                  <span className="text-luxury-accent font-semibold">FREE</span>
                </div>
                <div className="border-t border-luxury-cream pt-2">
                  <div className="flex justify-between">
                    <span className="luxury-body text-luxury-charcoal font-semibold">Total</span>
                    <span className="text-luxury-accent font-semibold text-lg">₹{totalAmount}</span>
                  </div>
                  <div className="text-xs luxury-body text-luxury-charcoal/60 mt-1">
                    + GST as applicable
                  </div>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="bg-luxury-pink-bg/30 border border-luxury-accent/30 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-luxury-accent" />
                <span className="font-light text-luxury-accent font-['Inter',sans-serif]">30-Day Money-Back Guarantee</span>
              </div>
              <p className="text-sm text-luxury-accent/80 font-light font-['Inter',sans-serif]">
                Not satisfied? Get a full refund within 30 days, no questions asked.
              </p>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white py-4 md:py-5 px-4 md:px-6 rounded-full text-lg md:text-xl luxury-body shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mb-3 md:mb-4 hover:scale-105 transform font-semibold"
            >
              {isProcessing ? 'Processing...' : '🔥 Get Your Guide Now →'}
            </button>
          </form>
        </motion.div>

        {/* Exit Intent Popup */}
        {showExitIntent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-luxury-warm-white rounded-3xl p-6 max-w-sm w-full relative">
              <button
                onClick={() => setShowExitIntent(false)}
                className="absolute top-4 right-4 text-luxury-charcoal/60 hover:text-luxury-charcoal"
              >
                ✕
              </button>
              
              <div className="text-center">
                <h3 className="text-xl luxury-heading text-luxury-charcoal mb-3">Wait! Don&apos;t Miss Out</h3>
                <p className="luxury-body text-luxury-charcoal/70 mb-4">
                  This special price won&apos;t last forever. Get your ICONIK guide now and start your transformation today!
                </p>
                <Link
                  href="/guide/checkout"
                  className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white py-3 rounded-full text-base luxury-body font-semibold transition-all duration-300 block text-center"
                >
                  Get My Guide Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
