'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock } from 'lucide-react';
import { trackEthnicPurchase } from '@/lib/metaPixel';

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

export default function EthnicCheckoutPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    email: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewerCount, setViewerCount] = useState(18);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
  
  // Product pricing
  const originalPrice = 3999;
  const discountedPrice = 1999;
  const savings = originalPrice - discountedPrice;
  
  // Calculate total
  const totalAmount = discountedPrice;
  const totalValue = originalPrice + 1000; // Base + Free bonuses (₹1,000+ value)

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
      setViewerCount(15 + Math.floor(Math.random() * 6));
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
        base_product: 'Ethnic Elegance Package',
        add_ons: {
          shopping_blueprint: false,
          glow_up_program: false
        },
        total_base_price: discountedPrice,
        shopping_blueprint_price: 0,
        glow_up_program_price: 0
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
          name: 'Iconik',
          description: 'Ethnic Elegance Package',
          order_id: responseData.razorpay_order_id,
          handler: function (response: RazorpayResponse) {
            // Payment successful
            trackEthnicPurchase(totalAmount);
            
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-amber-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/ethnic" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-accent/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Ethnic Elegance
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 pb-24 md:pb-8">
        {/* Urgency Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-lg font-light mb-4 md:mb-6 text-center animate-pulse font-['Inter',sans-serif]"
        >
          🌸 LIMITED TIME: 50% OFF + FREE BONUSES - Only 15 Spots Left This Month! 🌸
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl p-3 md:p-4 mb-4 md:mb-6 flex flex-wrap justify-center gap-2 md:gap-4"
        >
          <div className="flex items-center gap-1 md:gap-2 bg-luxury-pink-bg text-luxury-accent px-2 md:px-3 py-1 md:py-2 rounded-full">
            <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-light font-['Inter',sans-serif]">150+ Happy Clients</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-blue-100 text-blue-800 px-2 md:px-3 py-1 md:py-2 rounded-full">
            <Lock className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-light font-['Inter',sans-serif]">100% Secure</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-yellow-100 text-yellow-800 px-2 md:px-3 py-1 md:py-2 rounded-full">
            <Star className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-light font-['Inter',sans-serif]">4.8/5 Rating</span>
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
            <div className="text-orange-600 font-light text-base md:text-lg font-['Inter',sans-serif]">
              👀 {viewerCount} people are viewing this right now
            </div>
          </div>
          
          <div className="bg-luxury-accent text-luxury-warm-white rounded-2xl p-3 md:p-4 text-center">
            <div className="text-base md:text-lg mb-1 md:mb-2 font-light font-['Inter',sans-serif]">Offer Expires In:</div>
            <div className="text-2xl md:text-3xl font-light text-yellow-400 font-['Cormorant Garamond',serif]">
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-4 md:mb-6 font-['Playfair Display',serif]">
            Embrace Your Cultural Elegance
          </h1>
          
          <div className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-3 md:mb-4">
            <span className="line-through text-gray-400 mr-2 md:mr-4 font-['Inter',sans-serif]">₹{originalPrice}</span>
            <span className="text-luxury-accent font-['Cormorant Garamond',serif]">₹{discountedPrice}</span>
          </div>
          
          <div className="bg-yellow-400 text-gray-900 px-4 md:px-6 py-2 rounded-full font-light text-base md:text-lg inline-block animate-bounce font-['Inter',sans-serif]">
            YOU SAVE ₹{savings} TODAY!
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Order Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20"
          >
            <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 md:mb-6 font-['Cormorant Garamond',serif]">Your Information</h2>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-light text-gray-700 mb-1 md:mb-2 font-['Inter',sans-serif]">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your first name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-light text-gray-700 mb-1 md:mb-2 font-['Inter',sans-serif]">
                  Email ID *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-light text-gray-700 mb-1 md:mb-2 font-['Inter',sans-serif]">
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
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter 10-digit phone number"
                />
                <p className="text-xs text-gray-500 mt-1">Enter exactly 10 digits</p>
              </div>

              {/* Security Notice */}
              <div className="text-center text-xs md:text-sm text-gray-600 font-light font-['Inter',sans-serif]">
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
            className="space-y-6 md:space-y-8"
          >
            {/* Main Product */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-2 md:top-4 right-[-30px] bg-yellow-400 text-gray-900 px-6 md:px-8 py-1 transform rotate-45 text-xs font-bold">
                ETHNIC SPECIAL
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <span className="text-xl md:text-2xl">🌸</span>
                <h3 className="text-xl md:text-2xl font-light font-['Cormorant Garamond',serif]">Ethnic Elegance Package</h3>
              </div>
              
              <div className="text-sm md:text-base text-gray-300 mb-3 md:mb-4 font-light font-['Inter',sans-serif]">
                Delivered 1-on-1 by Certified Ethnic Wear Specialists
              </div>
              
              <div className="text-2xl md:text-3xl font-light mb-3 md:mb-4">
                <span className="line-through text-gray-300 mr-2 md:mr-4 font-['Inter',sans-serif]">₹{originalPrice}</span>
                <span className="text-luxury-accent font-['Cormorant Garamond',serif]">₹{discountedPrice}</span>
              </div>
              
              <div className="mb-3 md:mb-4">
                <div className="text-sm md:text-base font-light mb-2 font-['Inter',sans-serif]">What you get:</div>
                <ul className="space-y-1 md:space-y-2 text-xs md:text-sm font-light font-['Inter',sans-serif]">
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span>14 curated ethnic outfits across all categories</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span>Complete accessories & footwear guide</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span>Pan-Indian regional style recommendations</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span>Personalized styling for your body type</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span>20-min Private Consultation Call</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span>Lifetime Access to Your Ethnic Style Profile</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Free Bonuses */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-dashed border-orange-300 rounded-3xl p-6 md:p-8">
              <h4 className="text-orange-700 font-light text-base md:text-lg text-center mb-3 md:mb-4 font-['Cormorant Garamond',serif]">Included at No Extra Charge (₹1,000+ value):</h4>
              
              <div className="space-y-3 md:space-y-4">
                <div className="bg-white rounded-xl p-3 md:p-4 shadow-lg">
                  <div className="font-light text-gray-900 mb-1 md:mb-2 text-sm md:text-base font-['Inter',sans-serif]">Traditional Styling Secrets Guide</div>
                  <div className="text-xs text-gray-600 font-light font-['Inter',sans-serif]">
                    Discover the exact styling formulas for ethnic wear
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-3 md:p-4 shadow-lg">
                  <div className="font-light text-gray-900 mb-1 md:mb-2 text-sm md:text-base font-['Inter',sans-serif]">Festival & Wedding Style Checklist</div>
                  <div className="text-xs text-gray-600 font-light font-['Inter',sans-serif]">
                    Complete guide for every celebration and occasion
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-3 md:p-4 shadow-lg">
                  <div className="font-light text-gray-900 mb-1 md:mb-2 text-sm md:text-base font-['Inter',sans-serif]">3-Day WhatsApp Ethnic Style Access</div>
                  <div className="text-xs text-gray-600 font-light font-['Inter',sans-serif]">
                    Get instant ethnic style advice from experts & community
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-luxury-pink-bg border-l-4 border-luxury-accent rounded-xl p-4">
              <p className="text-sm text-gray-700 italic font-light font-['Inter',sans-serif]">
                &quot;My wedding lehenga selection was absolutely perfect! The ethnic styling guide helped me look stunning at every celebration.&quot;
              </p>
              <p className="text-xs text-gray-600 mt-2 font-light font-['Inter',sans-serif]">– Meera K., Delhi (Verified Buyer)</p>
            </div>

            {/* Order Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">
              <h3 className="text-xl font-light text-gray-900 mb-4 font-['Cormorant Garamond',serif]">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-light font-['Inter',sans-serif]">Ethnic Elegance Package</span>
                  <span className="font-light font-['Inter',sans-serif]">
                    <span className="line-through text-gray-400 mr-2">₹{originalPrice}</span>
                    <span className="text-luxury-accent">₹{discountedPrice}</span>
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-luxury-accent">
                  <span className="font-light font-['Inter',sans-serif]">FREE Bonuses (₹1,000+ value)</span>
                  <span className="font-light font-['Inter',sans-serif]">FREE</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                    <span>Total Value:</span>
                    <span className="line-through">₹{totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-light">
                    <span className="font-['Inter',sans-serif]">You Pay:</span>
                    <span className="text-blue-600 font-['Cormorant Garamond',serif]">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-center text-sm text-gray-600 mt-2 font-light font-['Inter',sans-serif]">
                    Total: ₹{totalAmount.toLocaleString()} (Value over ₹{totalValue.toLocaleString()})
                  </div>
                </div>
              </div>
              
              {/* Payment Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 md:py-4 px-4 md:px-6 rounded-full text-lg md:text-xl font-light shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mb-3 md:mb-4 hover:scale-105 transform font-['Inter',sans-serif]"
              >
                {isProcessing ? 'Processing...' : '🌸 YES! Embrace My Ethnic Elegance Now →'}
              </button>
              
              <div className="text-center text-xs md:text-sm text-gray-600 mb-3 md:mb-4 font-light font-['Inter',sans-serif]">
                <p>Pay via Razorpay – 100% Safe & Secure</p>
              </div>
              
              {/* Money Back Guarantee */}
              <div className="bg-luxury-pink-bg border border-luxury-accent/30 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-luxury-accent" />
                  <span className="font-light text-luxury-accent font-['Inter',sans-serif]">30-Day Money-Back Guarantee</span>
                </div>
                <p className="text-sm text-luxury-accent/80 font-light font-['Inter',sans-serif]">
                  Love your ethnic style or get 100% of your money back. No questions asked!
                </p>
              </div>
              
              {/* Payment Methods */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2 font-light font-['Inter',sans-serif]">Accepted Payment Methods:</p>
                <div className="flex justify-center gap-3 text-sm text-gray-500 font-light font-['Inter',sans-serif]">
                  <span>💳 UPI</span>
                  <span>💳 Cards</span>
                  <span>💳 Netbanking</span>
                  <span>💳 Wallets</span>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                  <Shield className="w-5 h-5 text-luxury-accent" />
                  <span>Secure payment with Razorpay</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Instant access to your ethnic style guide</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>150+ successful ethnic transformations</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-amber-100 p-4 md:hidden z-50">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-light text-gray-600 font-['Inter',sans-serif]">
              Total: <span className="font-light text-luxury-accent font-['Cormorant Garamond',serif]">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="text-xs font-light text-gray-500 font-['Inter',sans-serif]">
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')} left
            </div>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-full text-lg font-light shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 hover:scale-105 transform font-['Inter',sans-serif]"
          >
            {isProcessing ? 'Processing...' : '🌸 Embrace My Ethnic Elegance Now →'}
          </button>
        </div>
      </div>
    </div>
  );
}

