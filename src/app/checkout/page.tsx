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

  const totalAmount = formData.addOn ? 2498 : 2299;

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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900">
            Complete Your Alpha1 Transformation
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium">Alpha1 Transformation Program</span>
                  <span className="font-bold">₹1,999</span>
                </div>
                
                {formData.addOn && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="font-medium text-blue-600">+ AI Before/After Visualization</span>
                    <span className="font-bold text-blue-600">₹499</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3 text-lg font-bold border-t border-gray-300">
                  <span>Total</span>
                  <span className="text-2xl text-blue-600">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 space-y-4">
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
            </div>

            {/* Checkout Form */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your full name"
                  />
                </div>

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
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your email address"
                  />
                </div>

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
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="addOn"
                    name="addOn"
                    checked={formData.addOn}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="addOn" className="text-sm text-gray-700">
                    Add AI Before/After Visualization (+₹499) - <span className="text-blue-600 font-medium">Recommended</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                >
                  <span className="relative z-10">
                    {isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString()} Securely`}
                  </span>
                  
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>
              </form>

              <p className="text-xs text-gray-600 mt-4 text-center">
                By proceeding, you agree to our{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">terms of service</Link>,{' '}
                <Link href="/privacy-policy" className="text-blue-600 hover:underline">privacy policy</Link>, and{' '}
                <Link href="/shipping" className="text-blue-600 hover:underline">shipping policy</Link>.
              </p>
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