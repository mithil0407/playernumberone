'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Clock, Users } from 'lucide-react';
import Link from 'next/link';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
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
        throw new Error('Payment failed');
      }

      const paymentData = await response.json();
      
      if (paymentData.success) {
        if (paymentData.payment_url && !paymentData.mock) {
          // Redirect to actual Cashfree payment page
          window.location.href = paymentData.payment_url;
        } else {
          // Mock payment for development
          setTimeout(() => {
            setIsProcessing(false);
            window.location.href = `/checkout/success?order_id=${paymentData.order_id}`;
          }, 2000);
        }
      } else {
        throw new Error(paymentData.error || 'Payment initialization failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      alert('Payment failed. Please try again.');
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
                  <div>
                    <h3 className="font-semibold text-blue-600">Alpha1 Full Program</h3>
                    <p className="text-sm text-gray-600">Complete 1-on-1 transformation</p>
                  </div>
                  <span className="text-xl font-bold text-gray-900">₹2,299</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <div>
                    <h3 className="font-semibold text-orange-600">Before & After AI Visualisation</h3>
                    <p className="text-sm text-gray-600">See your transformation preview</p>
                  </div>
                  <span className="text-xl font-bold text-gray-900">₹199</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-semibold text-gray-900">Subtotal</span>
                  <span className="font-bold text-gray-900">₹2,498</span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-2xl font-bold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-blue-600">₹{totalAmount}</span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-green-600">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Secure Payment via Cashfree</span>
                </div>
                <div className="flex items-center gap-3 text-blue-600">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Instant Access After Payment</span>
                </div>
                <div className="flex items-center gap-3 text-purple-600">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">1-on-1 with Expert Stylist</span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-900">
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
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-900">
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
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2 text-gray-900">
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
                  <label htmlFor="addOn" className="text-sm text-gray-900">
                    Include Before & After AI Visualisation (+₹199)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="group relative w-full bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl hover:from-blue-700/90 hover:to-purple-700/90 disabled:opacity-50 text-white py-4 rounded-full text-lg font-bold transition-all duration-500 transform hover:scale-105 border border-white/20 shadow-xl"
                >
                  <span className="relative z-10">
                    {isProcessing ? 'Processing Payment...' : `Pay ₹${totalAmount} & Transform`}
                  </span>
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>
              </form>

              <p className="text-xs text-gray-600 mt-4 text-center">
                By proceeding, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </div>

          {/* Scarcity Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 bg-red-50/70 backdrop-blur-xl border border-red-200 rounded-2xl p-4 text-center shadow-lg"
          >
            <p className="text-red-700 font-semibold">
              ⚠️ Only 20 slots available this week. Secure your transformation now!
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
