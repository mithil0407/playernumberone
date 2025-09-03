'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Clock, Users } from 'lucide-react';

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
  
  // Product pricing
  const originalPrice = 1199;
  const discountedPrice = 599;
  const savings = originalPrice - discountedPrice;
  
  // Add-ons
  const [shoppingBlueprintAddon, setShoppingBlueprintAddon] = useState(false);
  const [glowUpProgramAddon, setGlowUpProgramAddon] = useState(false);
  
  const shoppingBlueprintOriginalPrice = 1599;
  const shoppingBlueprintDiscountedPrice = 699;
  const shoppingBlueprintSavings = shoppingBlueprintOriginalPrice - shoppingBlueprintDiscountedPrice;
  
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
                content_ids: ['alpha1_grooming_guide'],
                content_type: 'product',
                content_name: 'Alpha1 Grooming Guide'
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
            color: '#3B82F6'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
                      <Link href="/" className="flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to IconOne
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full text-lg font-bold mb-4 inline-block">
            ⚡ LIMITED TIME: 50% OFF + FREE BONUSES - Only 7 Spots Left Today! ⚡
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
              <span>✓</span>
              <span>2,847+ Happy Clients</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              <span>🔒</span>
              <span>100% Secure</span>
            </div>
            <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              <span>⭐</span>
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
              <span>👀</span>
              <span>22 people are viewing this right now</span>
            </div>
          </div>
          
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg mb-6 inline-block">
            <span className="font-bold">Offer Expires In: 12:32</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your Personal Style Transformation Starts Now!
          </h1>
          
          <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            <span className="line-through text-gray-400 mr-4">₹{originalPrice}</span>
            <span className="text-green-600">₹{discountedPrice}</span>
            <span className="text-sm text-green-600 block mt-2">YOU SAVE ₹{savings} TODAY!</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h2>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your first name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email ID *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter 10-digit phone number"
                />
                <p className="text-xs text-gray-500 mt-1">Enter exactly 10 digits</p>
              </div>

              {/* Security Notice */}
              <div className="text-center text-sm text-gray-600">
                <p>🔒 Your payment is secure and encrypted</p>
                <p className="mt-1">By clicking above, you agree to our terms of service and privacy policy</p>
              </div>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Main Product */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">IconOne Personal Style Consultation</h3>
              
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 mb-4">
                <div className="text-2xl font-bold text-rose-600 mb-2">
                  ₹{originalPrice} <span className="text-green-600">₹{discountedPrice}</span>
                </div>
                
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Complete style DNA analysis (₹499 value)</li>
                  <li>✓ Your perfect color palette revealed</li>
                  <li>✓ Body-flattering silhouettes mapped</li>
                  <li>✓ Hair & makeup blueprint included</li>
                  <li>✓ 20-min 1-on-1 expert consultation call</li>
                  <li>✓ Lifetime access to your style profile</li>
                </ul>
              </div>
              
              {/* Free Bonuses */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
                <h4 className="font-bold text-green-800 mb-2">🎁 TODAY ONLY: Get These FREE Bonuses!</h4>
                
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3">
                    <div className="font-bold text-gray-900">BONUS #1: Celebrity Style Secrets Guide</div>
                    <div className="text-sm text-green-600 font-semibold">Value: ₹299 FREE Today!</div>
                    <div className="text-xs text-gray-600">Discover the exact style formulas Bollywood stylists use</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3">
                    <div className="font-bold text-gray-900">BONUS #2: Instant Confidence Checklist</div>
                    <div className="text-sm text-green-600 font-semibold">Value: ₹199 FREE Today!</div>
                    <div className="text-xs text-gray-600">5-minute morning routine to look & feel amazing</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3">
                    <div className="font-bold text-gray-900">BONUS #3: WhatsApp Support Group (3 Days)</div>
                    <div className="text-sm text-green-600 font-semibold">Value: ₹499 FREE Today!</div>
                    <div className="text-xs text-gray-600">Get instant style advice from experts & community</div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 italic">
                  "I saved ₹15,000 on clothes that actually work for me! The color analysis alone changed everything - I get compliments daily now!"
                </p>
                <p className="text-xs text-gray-600 mt-2">- Priya S., Mumbai (Verified Buyer)</p>
              </div>
            </div>

            {/* Add-on 1: Shopping Blueprint */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg mb-4 text-center font-bold">
                93% OF CUSTOMERS ADD THIS
              </div>
              
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="shoppingBlueprint"
                  checked={shoppingBlueprintAddon}
                  onChange={(e) => setShoppingBlueprintAddon(e.target.checked)}
                  className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500 mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="shoppingBlueprint" className="font-bold text-gray-900 cursor-pointer">
                    ✨ Complete Shopping Blueprint
                  </label>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    <span className="line-through text-gray-400 mr-2">₹{shoppingBlueprintOriginalPrice}</span>
                    <span className="text-green-600">₹{shoppingBlueprintDiscountedPrice}</span>
                    <span className="text-sm text-green-600 block">56% OFF</span>
                  </div>
                </div>
              </div>
              
              <ul className="space-y-2 text-sm text-gray-700 ml-8">
                <li>• Exact shopping links for YOUR style (saves hours!)</li>
                <li>• 20 pieces = 50+ outfit combinations</li>
                <li>• Budget-friendly alternatives included</li>
                <li>• Seasonal wardrobe updates for 1 year</li>
              </ul>
              
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 font-semibold">
                  ⚡ One-Time Offer: Never Available At This Price Again!
                </p>
              </div>
            </div>

            {/* Add-on 2: Glow Up Program */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="glowUpProgram"
                  checked={glowUpProgramAddon}
                  onChange={(e) => setGlowUpProgramAddon(e.target.checked)}
                  className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500 mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="glowUpProgram" className="font-bold text-gray-900 cursor-pointer">
                    💪 30-Day Glow Up Program
                  </label>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    <span className="line-through text-gray-400 mr-2">₹{glowUpProgramOriginalPrice}</span>
                    <span className="text-green-600">₹{glowUpProgramDiscountedPrice}</span>
                    <span className="text-sm text-green-600 block">SAVE ₹{glowUpProgramSavings}</span>
                  </div>
                </div>
              </div>
              
              <ul className="space-y-2 text-sm text-gray-700 ml-8">
                <li>• Customized fitness plan (home + gym options)</li>
                <li>• Nutrition guide for glowing skin & energy</li>
                <li>• Daily confidence boosters & affirmations</li>
                <li>• Progress tracker & accountability partner</li>
              </ul>
            </div>

            {/* Order Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
              
              {/* Product Image */}
              <div className="text-center mb-6">
                <div className="relative w-48 h-32 mx-auto mb-4">
                  <Image
                    src="/book.png"
                    alt="IconOne Style Guide"
                    fill
                    className="object-contain rounded-lg"
                    sizes="(max-width: 768px) 192px, 128px"
                  />
                </div>
                <p className="text-sm text-gray-600">Your IconOne Style Guide</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">IconOne Style Consultation</span>
                  <span className="font-semibold">₹{originalPrice} <span className="text-green-600">₹{discountedPrice}</span></span>
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
                    <span>₹{totalValue.toLocaleString()}</span>
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
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 px-6 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mb-4"
              >
                {isProcessing ? 'Processing...' : '🔥 YES! Transform My Style Now →'}
              </button>
              
              <div className="text-center text-sm text-gray-600 mb-4">
                <p>Pay via Razorpay – 100% Safe & Secure</p>
              </div>
              
              {/* Money Back Guarantee */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
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
                <div className="flex justify-center gap-2 text-sm text-gray-500">
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