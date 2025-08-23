'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Clock, Users } from 'lucide-react';
import Link from 'next/link';

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
          
          // Redirect to success page with payment details
          window.location.href = `/checkout/success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}`;
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

  const basePrice = 2299;
  const addOnPrice = 199;
  const totalAmount = formData.addOn ? basePrice + addOnPrice : basePrice;
  const originalPrice = 5999;
  const savings = originalPrice - totalAmount;

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
        {/* Urgency Banner - Top of Page */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-2xl mb-6 text-center shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-lg">⏰ LIMITED TIME OFFER</span>
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-sm opacity-90">This exclusive pricing ends soon. Don&apos;t miss your transformation opportunity!</p>
        </div>

        {/* Mobile Sticky CTA - High Conversion */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-center">
                  <p className="text-sm text-red-600 font-semibold mb-1">⏰ Limited Time Offer</p>
                  <p className="text-lg font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Complete Transformation</p>
                </div>
              </div>
              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-full text-lg font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : '🚀 Start Now'}
              </button>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >





          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-4 text-gray-900">
            Complete Your Alpha1 Transformation
          </h1>

          {/* High-Conversion Layout: Form First */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Checkout Form - Primary Focus */}
            <div className="xl:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-2xl border border-white/20">
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

                {/* Add-on Checkbox */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="addOn"
                      checked={formData.addOn}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-semibold text-blue-900">Add AI Before/After Visualization</span>
                      <p className="text-sm text-blue-700 mt-1">See your transformation before you start - only ₹199 extra!</p>
                    </div>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg text-lg font-bold hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString()} & Start Your Transformation`}
                </button>

                {/* Money-Back Guarantee */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">7-Day Money-Back Guarantee</span>
                  </div>
                  <p className="text-sm text-green-700">
                    If you&apos;re not 100% satisfied with your transformation plan, we&apos;ll refund your money. No questions asked.
                  </p>
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
              
              {/* Pricing Psychology - Original vs Discounted */}
              <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-2">₹{totalAmount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mb-2">Your Special Price</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Original Price:</span>
                    <span className="line-through text-gray-500">₹{originalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 font-semibold">Your Savings:</span>
                    <span className="text-green-600 font-bold">₹{savings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-600 font-semibold">Discount:</span>
                    <span className="text-blue-600 font-bold">{Math.round((savings / originalPrice) * 100)}% OFF</span>
                  </div>
                </div>
              </div>
              
              {/* What's Included */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900">What&apos;s Included:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Complete 1-on-1 Transformation</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Personal Stylist Consultation</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Grooming & Style Guide</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Fitness & Confidence Plan</span>
                  </div>
                  {formData.addOn && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-600 font-medium">+ AI Before/After Visualization</span>
                    </div>
                  )}
                </div>
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
                  ⚠️ Only 20 slots available this week
                </p>
                <p className="text-red-600 text-xs mt-1">
                  Secure your transformation slot now!
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