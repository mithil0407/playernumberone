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

      await response.json();
      
      // In production, you would redirect to Cashfree payment page
      // For now, we'll simulate successful payment
      setTimeout(() => {
        setIsProcessing(false);
        // Redirect to success page after successful payment
        window.location.href = '/checkout/success';
      }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      alert('Payment failed. Please try again.');
    }
  };

  const totalAmount = formData.addOn ? 2498 : 2299;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
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
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Complete Your Alpha1 Transformation
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <div>
                    <h3 className="font-semibold text-blue-400">Alpha1 Full Program</h3>
                    <p className="text-sm text-gray-400">Complete 1-on-1 transformation</p>
                  </div>
                  <span className="text-xl font-bold">₹2,299</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <div>
                    <h3 className="font-semibold text-yellow-400">Before & After AI Visualisation</h3>
                    <p className="text-sm text-gray-400">See your transformation preview</p>
                  </div>
                  <span className="text-xl font-bold">₹199</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold">₹2,498</span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-2xl font-bold">Total</span>
                  <span className="text-3xl font-bold text-blue-400">₹{totalAmount}</span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-green-400">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Secure Payment via Cashfree</span>
                </div>
                <div className="flex items-center gap-3 text-blue-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Instant Access After Payment</span>
                </div>
                <div className="flex items-center gap-3 text-yellow-400">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">1-on-1 with Expert Stylist</span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Your Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
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
                  <label htmlFor="addOn" className="text-sm">
                    Include Before & After AI Visualisation (+₹199)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white py-4 rounded-lg text-lg font-bold transition-all duration-300 transform hover:scale-105"
                >
                  {isProcessing ? 'Processing Payment...' : `Pay ₹${totalAmount} & Transform`}
                </button>
              </form>

              <p className="text-xs text-gray-400 mt-4 text-center">
                By proceeding, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </div>

          {/* Scarcity Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 bg-red-900/30 border border-red-500/30 rounded-lg p-4 text-center"
          >
            <p className="text-red-300 font-semibold">
              ⚠️ Only 20 slots available this week. Secure your transformation now!
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
