'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Facebook Pixel types
interface FacebookPixel {
  (command: 'init', pixelId: string): void;
  (command: 'track', eventName: string, parameters?: Record<string, unknown>): void;
  (command: 'trackCustom', eventName: string, parameters?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    fbq: FacebookPixel;
  }
}

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  customer: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, unknown>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayError {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
  };
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (response: RazorpayError) => void): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addOn: true
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Track checkout initiation with Meta Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: totalAmount,
        currency: 'INR',
        content_ids: ['alpha1_transformation_program'],
        content_type: 'product',
        content_name: 'Alpha1 Transformation Program'
      });
    }
    
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order on backend
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          addOn: formData.addOn,
          amount: totalAmount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      const paymentData = await response.json();
      
      if (!paymentData.success) {
        throw new Error(paymentData.error || 'Payment initialization failed');
      }

      // Configure Razorpay options
      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'PlayerNumberOne Alpha1',
        description: 'Alpha1 Transformation Program',
        image: '/logo.png', // Add your logo here
        order_id: paymentData.razorpay_order_id,
        customer: paymentData.customer,
        notes: paymentData.notes,
        theme: {
          color: '#3B82F6' // Blue theme matching your site
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            console.log('Payment modal dismissed');
          }
        },
        handler: function (response: RazorpayResponse) {
          console.log('Payment successful:', response);
          
          // Store customer and order IDs for session booking
          if (paymentData.customer && paymentData.order) {
            localStorage.setItem('customerId', paymentData.customer.id);
            localStorage.setItem('orderId', paymentData.order.id);
            console.log('Stored in localStorage:', {
              customerId: paymentData.customer.id,
              orderId: paymentData.order.id
            });
          } else {
            console.error('Missing customer or order data:', paymentData);
          }
          
          // Track successful payment with Meta Pixel
          if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'Purchase', {
              value: totalAmount,
              currency: 'INR',
              content_ids: ['alpha1_transformation_program'],
              content_type: 'product',
              content_name: 'Alpha1 Transformation Program'
            });
          }
          
          // Redirect based on plan type
          if (selectedPlan === 'basic') {
            // Basic plan customers go to basic success page (PDF only)
            window.location.href = `/checkout/basic-success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}`;
          } else {
            // Advanced plan customers go to regular success page (with scheduling)
            window.location.href = `/checkout/success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}`;
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', function (response: RazorpayError) {
        console.error('Payment failed:', response.error);
        setIsProcessing(false);
        alert(`Payment failed: ${response.error.description}`);
      });
      
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    }
  };

  const [selectedPlan, setSelectedPlan] = useState('advanced'); // 'basic' or 'advanced'
  const [showUpsellPopup, setShowUpsellPopup] = useState(false);
  const [upsellTimer, setUpsellTimer] = useState(300); // 5 minutes in seconds
  const [isUpsellActive, setIsUpsellActive] = useState(false); // Track if upsell is active
  
  const basicPrice = 799;
  const advancedPrice = 2500;
  const upsellPrice = 1999;
  const totalAmount = isUpsellActive ? upsellPrice : (selectedPlan === 'basic' ? basicPrice : advancedPrice);
  const originalValue = 27000;
  const savings = originalValue - totalAmount;

  // Timer effect for upsell popup
  useEffect(() => {
    if (showUpsellPopup && upsellTimer > 0) {
      const interval = setInterval(() => {
        setUpsellTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showUpsellPopup, upsellTimer]);

  // Reset timer when popup closes
  useEffect(() => {
    if (!showUpsellPopup) {
      setUpsellTimer(300);
    }
  }, [showUpsellPopup]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Alpha1
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 pb-24 md:pb-8">


        {/* Mobile Sticky CTA - High Conversion */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-center">
                  <p className="text-sm text-red-600 font-semibold mb-1">⏰ Limited Time Offer</p>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <p className="text-lg font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
                    {selectedPlan === 'basic' && (
                      <span className="text-xs text-gray-500 line-through">₹{basicPrice}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{selectedPlan === 'basic' ? 'PDF Guide' : 'Complete Transformation'}</p>
                </div>
              </div>
              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-full text-lg font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : selectedPlan === 'basic' ? '📖 Get PDF' : '🚀 Start Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Conditional Upsell Popup */}
        {showUpsellPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-2xl p-4 md:p-6 max-w-sm md:max-w-md w-full shadow-2xl mx-4"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowUpsellPopup(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Urgency Timer */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-3 mb-4 text-center">
                <div className="text-red-600 font-bold text-lg mb-1">⏰ LIMITED TIME OFFER!</div>
                <div className="text-red-700 text-sm">This upgrade offer expires in:</div>
                <div className="text-2xl font-bold text-red-600 mt-2">
                  {Math.floor(upsellTimer / 60)}:{(upsellTimer % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-red-600">minutes</div>
              </div>

              <div className="text-center mb-4 md:mb-6">
                <div className="text-3xl mb-2">🚀</div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Upgrade to Full Program?</h3>
                <p className="text-sm md:text-base text-gray-600">Get everything in Basic PLUS personalized coaching!</p>
              </div>
              
              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-3 md:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-purple-900 text-sm md:text-base">Advanced Full Program</span>
                    <div className="text-right">
                      <span className="text-lg md:text-xl font-bold text-purple-600">₹{upsellPrice}</span>
                      <div className="text-sm text-gray-500 line-through">₹{advancedPrice}</div>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-purple-700">Only ₹{upsellPrice - basicPrice} extra!</p>
                </div>
                
                <div className="space-y-2 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-lg">✅</span>
                    <span>1-on-1 Personalized Consultation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-lg">✅</span>
                    <span>Personalized Gym & Fitness Plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-lg">✅</span>
                    <span>AI Before & After Visualization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-lg">✅</span>
                    <span>Advanced Grooming & Style</span>
                  </div>
                </div>
              </div>
              
              {/* Mobile-Optimized Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedPlan('advanced');
                    setIsUpsellActive(true); // Activate special upsell pricing
                    setShowUpsellPopup(false);
                  }}
                  className="w-full px-4 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all text-base md:text-lg shadow-lg hover:shadow-xl"
                >
                  🚀 Upgrade Now - Save ₹{upsellPrice - basicPrice}!
                </button>
                <button
                  onClick={() => setShowUpsellPopup(false)}
                  className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm md:text-base"
                >
                  No thanks, keep Basic Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >





          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-4 text-gray-900">
            Complete Your Alpha1 Transformation
          </h1>

          {/* Mobile-First Layout: Form → Order Summary → Pay Button */}
          <div className="space-y-6 lg:space-y-8">
            {/* Checkout Form - Primary Focus */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-2xl border border-white/20">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-gray-900">Your Information</h2>
              
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Phone Field */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your phone number"
                  />
                </div>







                {/* Security Notice */}
                <div className="text-center text-sm text-gray-600">
                  <p>🔒 Your payment is secure and encrypted</p>
                  <p className="mt-1">By clicking above, you agree to our terms of service and privacy policy</p>
                </div>

                {/* Final Urgency Message */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 text-center">
                  <p className="text-orange-800 font-semibold text-sm mb-1">
                    ⚡ Don&apos;t Wait - Transformations Take Time!
                  </p>
                  <p className="text-orange-700 text-xs">
                    Every day you wait is another day you&apos;re missing opportunities. Start your transformation today!
                  </p>
                </div>
              </form>
            </div>

            {/* Order Summary Sidebar - High Conversion */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-2xl border border-blue-200/50">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Order Summary</h2>
              
              {/* Product Visualization */}
              <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">What You&apos;ll Get</h3>
                <div className="text-center">
                  <div className="relative w-48 h-32 mx-auto mb-4">
                    <Image
                      src="/book.png"
                      alt="Alpha1 Transformation Guide"
                      fill
                      className="object-contain rounded-lg"
                      sizes="(max-width: 768px) 192px, 128px"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedPlan === 'basic' 
                      ? 'Complete PDF transformation guide' 
                      : 'Complete PDF guide + 1-on-1 coaching session'
                    }
                  </p>
                </div>
              </div>
              
              {/* Plan Selection */}
              <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">Choose Your Plan</h3>
                
                {/* Basic Plan */}
                <div className={`border-2 rounded-lg p-3 mb-3 cursor-pointer transition-all ${
                  selectedPlan === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`                } onClick={() => {
                  setSelectedPlan('basic');
                  setIsUpsellActive(false); // Reset upsell pricing
                  // Show popup after a short delay for better UX
                  setTimeout(() => setShowUpsellPopup(true), 500);
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Basic Starter PDF</span>
                    <span className="text-lg font-bold text-gray-900">₹{basicPrice}</span>
                  </div>
                  <p className="text-sm text-gray-600">Self-paced transformation guide</p>
                </div>

                {/* Advanced Plan */}
                <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                  selectedPlan === 'advanced' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`                } onClick={() => {
                  setSelectedPlan('advanced');
                  setIsUpsellActive(false); // Reset upsell pricing
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Advanced Full Program</span>
                    <span className="text-lg font-bold text-purple-600">₹{advancedPrice}</span>
                  </div>
                  <p className="text-sm text-gray-600">Complete 1-on-1 transformation</p>
                </div>

                {/* Value Framing */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">₹{totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 mb-2">Your Investment</div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Full Package Value:</span>
                      <span className="line-through text-gray-500">₹{originalValue.toLocaleString()}+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-semibold">Your Savings:</span>
                      <span className="text-green-600 font-bold">₹{savings.toLocaleString()}+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-semibold">Discount:</span>
                      <span className="text-blue-600 font-bold">{Math.round((savings / originalValue) * 100)}% OFF</span>
                    </div>
                  </div>
                </div>
              </div>
              


              {/* What's Included */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900">What&apos;s Included:</h3>
                <div className="space-y-3">
                  {selectedPlan === 'basic' ? (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Instant Download PDF Guide</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Grooming & Skincare Routine</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Style & Outfit Recommendations</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Gym & Fitness Basics</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Communication & Confidence Hacks</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-red-600">❌ No personal 1-on-1 consultation</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Everything in Basic PDF, PLUS:</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-purple-600 font-medium">✅ 1-on-1 Personalized Consultation</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-purple-600 font-medium">✅ Personalized Gym & Fitness Plan</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-purple-600 font-medium">✅ AI Before & After Visualization</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-purple-600 font-medium">✅ Advanced Grooming & Style</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-purple-600 font-medium">✅ Communication & Confidence Coaching</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Pay Button - Prominent */}
              <div className="md:hidden">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : selectedPlan === 'basic' ? '📖 Get PDF Guide - ₹799' : '🚀 Start Full Transformation - ₹2,500'}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">Complete your information above to proceed</p>
              </div>

              {/* Desktop Pay Button */}
              <div className="hidden md:block">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : selectedPlan === 'basic' ? '📖 Get PDF Guide - ₹799' : '🚀 Start Full Transformation - ₹2,500'}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Secure payment with Razorpay</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>7-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>200+ successful transformations</span>
                </div>
              </div>

              {/* Urgency Message */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-700 font-semibold text-sm">
                  ⚠️ {selectedPlan === 'basic' ? 'Limited Time PDF Offer' : 'Only 20 slots available this week'}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  {selectedPlan === 'basic' ? 'Get your transformation guide now!' : 'Secure your transformation slot now!'}
                </p>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-red-600 text-xs">
                    🔥 This offer expires in <span className="font-bold">24 hours</span>
                  </p>
                </div>
              </div>

              {/* Social Proof */}
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white shadow-sm"></div>
                    ))}
                  </div>
                  <div>
                    <p className="text-green-700 font-semibold text-sm">200+ Successful Transformations</p>
                    <p className="text-green-600 text-xs">Join the community!</p>
                  </div>
                </div>
              </div>

              {/* Testimonial Quote */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-blue-800 text-sm italic mb-2">
                    &ldquo;Alpha1 completely changed my life. I went from being invisible to getting compliments everywhere I go!&rdquo;
                  </p>
                  <p className="text-blue-700 text-xs font-medium">- Rahul S., Delhi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scarcity Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 text-center"
          >
            <p className="text-red-800 font-medium">
              🔥 Limited Time: Only 5 spots available this month. Secure your transformation now!
            </p>
          </motion.div>

          {/* Payment Security Notice */}
          <div className="mt-8 bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Secure Payment</h3>
            </div>
            <p className="text-green-700 text-center">
              Your payment is processed securely through Razorpay with 256-bit SSL encryption. 
              We never store your payment information.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}