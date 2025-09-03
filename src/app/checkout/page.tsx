'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock } from 'lucide-react';

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
  firstName: string;
  email: string;
  phone: string;
}

export default function CheckoutPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    email: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewerCount, setViewerCount] = useState(23);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
  
  // Product pricing
  const originalPrice = 1199;
  const discountedPrice = 599;
  const savings = originalPrice - discountedPrice;
  
  // Add-ons
  const [shoppingBlueprintAddon, setShoppingBlueprintAddon] = useState(true); // Default checked
  const [glowUpProgramAddon, setGlowUpProgramAddon] = useState(false);
  
  const shoppingBlueprintOriginalPrice = 1599;
  const shoppingBlueprintDiscountedPrice = 699;
  
  const glowUpProgramOriginalPrice = 799;
  const glowUpProgramDiscountedPrice = 299;
  const glowUpProgramSavings = glowUpProgramOriginalPrice - glowUpProgramDiscountedPrice;
  
  // Calculate total
  const totalAmount = discountedPrice + 
    (shoppingBlueprintAddon ? shoppingBlueprintDiscountedPrice : 0) + 
    (glowUpProgramAddon ? glowUpProgramDiscountedPrice : 0);
  
  const totalValue = originalPrice + 997 + // Base + Free bonuses
    (shoppingBlueprintAddon ? shoppingBlueprintOriginalPrice : 0) + 
    (glowUpProgramAddon ? glowUpProgramOriginalPrice : 0);
  
  const totalSavings = totalValue - totalAmount;

  // Countdown timer effect
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

  // Viewer count animation
  useEffect(() => {
    const viewerTimer = setInterval(() => {
      setViewerCount(20 + Math.floor(Math.random() * 8));
    }, 5000);

    return () => clearInterval(viewerTimer);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    // Validate first name
    if (formData.firstName.trim().length < 2) {
      alert('Please enter your first name');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create order data
      const orderData = {
        customer_name: formData.firstName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        amount: totalAmount,
        base_product: 'IconOne Style Consultation',
        add_ons: {
          shopping_blueprint: shoppingBlueprintAddon,
          glow_up_program: glowUpProgramAddon
        },
        total_base_price: discountedPrice,
        shopping_blueprint_price: shoppingBlueprintAddon ? shoppingBlueprintDiscountedPrice : 0,
        glow_up_program_price: glowUpProgramAddon ? glowUpProgramDiscountedPrice : 0
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
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        // Initialize Razorpay payment
        const options = {
          key: responseData.key,
          amount: responseData.amount,
          currency: responseData.currency,
          name: 'PlayerNumberOne IconOne',
          description: 'IconOne Style Consultation',
          order_id: responseData.razorpay_order_id,
          handler: function (response: RazorpayResponse) {
            // Payment successful
            if (typeof window !== 'undefined' && window.fbq) {
              window.fbq('track', 'Purchase', {
                value: totalAmount,
                currency: 'INR',
                content_ids: ['iconone_style_consultation'],
                content_type: 'product',
                content_name: 'IconOne Style Consultation'
              });
            }
            
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
            
            // Redirect to success page with all necessary parameters
            const successUrl = `/checkout/success?payment_id=${response.razorpay_payment_id}&order_id=${responseData.razorpay_order_id}&customer_id=${responseData.customer_id}&db_order_id=${responseData.db_order_id}`;
            window.location.href = successUrl;
          },
          prefill: {
            name: formData.firstName,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#EC4899'
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to IconOne
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        {/* Urgency Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-lg font-bold mb-4 md:mb-6 text-center animate-pulse"
        >
          ⚡ LIMITED TIME: 50% OFF + FREE BONUSES - Only 7 Spots Left Today! ⚡
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl p-3 md:p-4 mb-4 md:mb-6 flex flex-wrap justify-center gap-2 md:gap-4"
        >
          <div className="flex items-center gap-1 md:gap-2 bg-green-100 text-green-800 px-2 md:px-3 py-1 md:py-2 rounded-full">
            <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-semibold">2,847+ Happy Clients</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-blue-100 text-blue-800 px-2 md:px-3 py-1 md:py-2 rounded-full">
            <Lock className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-semibold">100% Secure</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-yellow-100 text-yellow-800 px-2 md:px-3 py-1 md:py-2 rounded-full">
            <Star className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-semibold">4.9/5 Rating</span>
          </div>
        </motion.div>

        {/* Social Proof & Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 md:space-y-4 mb-6 md:mb-8"
        >
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-3 md:p-4 text-center">
            <div className="text-red-600 font-bold text-base md:text-lg">
              👀 {viewerCount} people are viewing this right now
            </div>
          </div>
          
          <div className="bg-gray-900 text-white rounded-2xl p-3 md:p-4 text-center">
            <div className="text-base md:text-lg mb-1 md:mb-2">Offer Expires In:</div>
            <div className="text-2xl md:text-3xl font-bold text-yellow-400">
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6 md:mb-8"
        >
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
            Your Personal Style Transformation Starts Now!
          </h1>
          
          <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            <span className="line-through text-gray-400 mr-2 md:mr-4">₹{originalPrice}</span>
            <span className="text-green-600">₹{discountedPrice}</span>
          </div>
          
          <div className="bg-yellow-400 text-gray-900 px-4 md:px-6 py-2 rounded-full font-bold text-base md:text-lg inline-block animate-bounce">
            YOU SAVE ₹{savings} TODAY!
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* Order Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-4 md:p-8 shadow-2xl border border-white/20"
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Your Information</h2>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your first name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Email ID *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
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
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter 10-digit phone number"
                />
                <p className="text-xs text-gray-500 mt-1">Enter exactly 10 digits</p>
              </div>

              {/* Security Notice */}
              <div className="text-center text-xs md:text-sm text-gray-600">
                <p>🔒 Your payment is secure and encrypted</p>
                <p className="mt-1">By clicking above, you agree to our terms of service and privacy policy</p>
              </div>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-6"
          >
                        {/* Main Product */}
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-2 md:top-4 right-[-30px] bg-yellow-400 text-gray-900 px-6 md:px-8 py-1 transform rotate-45 text-xs font-bold">
                BEST SELLER
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <span className="text-xl md:text-2xl">🎨</span>
                <h3 className="text-lg md:text-xl font-bold">IconOne Personal Style Consultation</h3>
              </div>
              
              <div className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                <span className="line-through text-gray-300 mr-2 md:mr-4">₹{originalPrice}</span>
                <span className="text-green-300">₹{discountedPrice}</span>
              </div>
              
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <span>Complete style DNA analysis (₹499 value)</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <span>Your perfect color palette revealed</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <span>Body-flattering silhouettes mapped</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <span>Hair & makeup blueprint included</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <span>20-min 1-on-1 expert consultation call</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <span>Lifetime access to your style profile</span>
                </li>
              </ul>
            </div>

            {/* Free Bonuses */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-dashed border-orange-300 rounded-3xl p-4 md:p-6">
              <h4 className="text-orange-700 font-bold text-base md:text-lg text-center mb-3 md:mb-4">🎁 TODAY ONLY: Get These FREE Bonuses!</h4>
              
              <div className="space-y-3 md:space-y-4">
                <div className="bg-white rounded-xl p-3 md:p-4 shadow-lg">
                  <div className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">BONUS #1: Celebrity Style Secrets Guide</div>
                  <div className="text-xs md:text-sm text-green-600 font-semibold mb-1 md:mb-2">
                    <span className="line-through text-gray-400 mr-1 md:mr-2">Value: ₹299</span>
                    <span className="text-green-600">FREE Today!</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Discover the exact style formulas Bollywood stylists use
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-3 md:p-4 shadow-lg">
                  <div className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">BONUS #2: Instant Confidence Checklist</div>
                  <div className="text-xs md:text-sm text-green-600 font-semibold mb-1 md:mb-2">
                    <span className="line-through text-gray-400 mr-1 md:mr-2">Value: ₹199</span>
                    <span className="text-green-600">FREE Today!</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    5-minute morning routine to look & feel amazing
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-3 md:p-4 shadow-lg">
                  <div className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">BONUS #3: WhatsApp Support Group (3 Days)</div>
                  <div className="text-xs md:text-sm text-green-600 font-semibold mb-1 md:mb-2">
                    <span className="line-through text-gray-400 mr-1 md:mr-2">Value: ₹499</span>
                    <span className="text-green-600">FREE Today!</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Get instant style advice from experts & community
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-4">
              <p className="text-sm text-gray-700 italic">
                &quot;I saved ₹15,000 on clothes that actually work for me! The color analysis alone changed everything - I get compliments daily now!&quot;
              </p>
              <p className="text-xs text-gray-600 mt-2 font-semibold">- Priya S., Mumbai (Verified Buyer)</p>
            </div>

            {/* Add-on 1: Shopping Blueprint */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-3xl p-6 relative">
              <div className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                93% OF CUSTOMERS ADD THIS
              </div>
              
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shoppingBlueprintAddon}
                  onChange={(e) => setShoppingBlueprintAddon(e.target.checked)}
                  className="w-6 h-6 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg mb-2">✨ Complete Shopping Blueprint</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="line-through text-gray-400">₹{shoppingBlueprintOriginalPrice}</span>
                    <span className="text-green-600 font-bold text-xl">₹{shoppingBlueprintDiscountedPrice}</span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">56% OFF</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Exact shopping links for YOUR style (saves hours!)</li>
                    <li>• 20 pieces = 50+ outfit combinations</li>
                    <li>• Budget-friendly alternatives included</li>
                    <li>• Seasonal wardrobe updates for 1 year</li>
                  </ul>
                  <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mt-3 text-center text-sm font-semibold">
                    ⚡ One-Time Offer: Never Available At This Price Again!
                  </div>
                </div>
              </label>
            </div>

            {/* Add-on 2: Glow Up Program */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={glowUpProgramAddon}
                  onChange={(e) => setGlowUpProgramAddon(e.target.checked)}
                  className="w-6 h-6 text-rose-600 border-gray-300 rounded focus:ring-rose-500 mt-1"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg mb-2">💪 30-Day Glow Up Program</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="line-through text-gray-400">₹{glowUpProgramOriginalPrice}</span>
                    <span className="text-orange-600 font-bold text-xl">₹{glowUpProgramDiscountedPrice}</span>
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs">SAVE ₹{glowUpProgramSavings}</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Customized fitness plan (home + gym options)</li>
                    <li>• Nutrition guide for glowing skin & energy</li>
                    <li>• Daily confidence boosters & affirmations</li>
                    <li>• Progress tracker & accountability partner</li>
                  </ul>
                </div>
              </label>
            </div>

            {/* Order Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">IconOne Style Consultation</span>
                  <span className="font-semibold">
                    <span className="line-through text-gray-400 mr-2">₹{originalPrice}</span>
                    <span className="text-green-600">₹{discountedPrice}</span>
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-green-600">
                  <span>FREE Bonuses (₹997 value)</span>
                  <span className="font-semibold">FREE</span>
                </div>
                
                {shoppingBlueprintAddon && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Shopping Blueprint</span>
                    <span className="font-semibold">₹{shoppingBlueprintDiscountedPrice}</span>
                  </div>
                )}
                
                {glowUpProgramAddon && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>30-Day Glow Up</span>
                    <span className="font-semibold">₹{glowUpProgramDiscountedPrice}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Total Value:</span>
                    <span className="line-through">₹{totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>You Pay:</span>
                    <span className="text-blue-600">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-green-600 font-semibold">
                    <span>You Save:</span>
                    <span>₹{totalSavings.toLocaleString()} ({Math.round((totalSavings/totalValue)*100)}% OFF!)</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 md:py-4 px-4 md:px-6 rounded-full text-lg md:text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mb-3 md:mb-4 hover:scale-105 transform"
              >
                {isProcessing ? 'Processing...' : '🔥 YES! Transform My Style Now →'}
              </button>
              
              <div className="text-center text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                <p>Pay via Razorpay – 100% Safe & Secure</p>
              </div>
              
              {/* Money Back Guarantee */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-800">30-Day Money-Back Guarantee</span>
                </div>
                <p className="text-sm text-green-700">
                  Love your new style or get 100% of your money back. No questions asked!
                </p>
              </div>
              
              {/* Payment Methods */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Accepted Payment Methods:</p>
                <div className="flex justify-center gap-3 text-sm text-gray-500">
                  <span>💳 UPI</span>
                  <span>💳 Cards</span>
                  <span>💳 Netbanking</span>
                  <span>💳 Wallets</span>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Secure payment with Razorpay</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Instant access to your guides</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>100s of successful transformations</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}