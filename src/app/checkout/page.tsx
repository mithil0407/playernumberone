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
  const basePrice = 999;
  const totalBasePrice = basePrice; // No GST for main product
  
  // Add-ons
  const [shoppingGuideAddon, setShoppingGuideAddon] = useState(false);
  const [wellnessPlanAddon, setWellnessPlanAddon] = useState(false);
  
  const shoppingGuidePrice = 799;
  const shoppingGuideTotal = shoppingGuidePrice;
  
  const wellnessPlanPrice = 399;
  const wellnessPlanTotal = wellnessPlanPrice;
  
  // Calculate total
  const totalAmount = totalBasePrice + 
    (shoppingGuideAddon ? shoppingGuideTotal : 0) + 
    (wellnessPlanAddon ? wellnessPlanTotal : 0);

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
          shopping_guide: shoppingGuideAddon,
          wellness_plan: wellnessPlanAddon
        },
        total_base_price: totalBasePrice,
        shopping_guide_price: shoppingGuideAddon ? shoppingGuideTotal : 0,
        wellness_plan_price: wellnessPlanAddon ? wellnessPlanTotal : 0
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            IconOne Style Consultation
          </h1>
          <p className="text-lg text-gray-600">
            Enter Your Details To Begin Your Style Transformation
          </p>
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Main Product</h3>
              
                              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 mb-4">
                              <h4 className="font-bold text-gray-900 mb-2">IconOne Style Consultation</h4>
              <div className="text-2xl font-bold text-rose-600 mb-2">
                ₹{basePrice}
              </div>
              
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Complete style assessment tailored to your features</li>
                <li>• Personalized color palette that makes your skin glow</li>
                <li>• Body-flattering silhouettes that work with your shape</li>
                <li>• Hair & beauty advice for your unique features</li>
                <li>• 20-minute one-on-one call with expert stylist</li>
              </ul>
              </div>
            </div>

            {/* Add-on 1: Shopping Guide */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="shoppingGuide"
                  checked={shoppingGuideAddon}
                  onChange={(e) => setShoppingGuideAddon(e.target.checked)}
                  className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500 mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="shoppingGuide" className="font-bold text-gray-900 cursor-pointer">
                    ✅ Yes! I Also Add &quot;Curated Shopping Guide&quot; to my Order
                  </label>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    Special One-Time Offer, Only ₹{shoppingGuidePrice}
                  </div>
                </div>
              </div>
              
              <ul className="space-y-2 text-sm text-gray-700 ml-8">
                <li>• Direct links to pieces that work for YOUR style profile</li>
                <li>• Complete wardrobe blueprints for work, social & everyday</li>
                <li>• Mix-and-match formulas – 20 pieces create 50+ looks</li>
                <li>• Investment vs. budget breakdowns for smart spending</li>
              </ul>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-semibold">
                  LIMITED OFFER: Access this exclusive shopping guide by ticking the box above.
                </p>
              </div>
            </div>

            {/* Add-on 2: Wellness Plan */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="wellnessPlan"
                  checked={wellnessPlanAddon}
                  onChange={(e) => setWellnessPlanAddon(e.target.checked)}
                  className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500 mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="wellnessPlan" className="font-bold text-gray-900 cursor-pointer">
                    ✅ Yes! Also Add &quot;Wellness & Confidence Plan&quot; to my Order
                  </label>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    Special One-Time Offer, Only ₹{wellnessPlanPrice}
                  </div>
                </div>
              </div>
              
              <ul className="space-y-2 text-sm text-gray-700 ml-8">
                <li>• 28-day body confidence program for real women</li>
                <li>• Home workout options plus gym alternatives</li>
                <li>• Nourishing meal plans that energize, don&apos;t deprive</li>
                <li>• Confidence-building rituals for inner radiance</li>
              </ul>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-semibold">
                  LIMITED OFFER: Access this exclusive wellness plan by ticking the box above.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
              
              {/* Product Image */}
              <div className="text-center mb-6">
                <div className="relative w-48 h-32 mx-auto mb-4">
                  <Image
                    src="/book.png"
                    alt="Alpha1 Grooming Guide"
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
                  <span className="font-semibold">₹{totalBasePrice}</span>
                </div>
                
                {shoppingGuideAddon && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>+ Curated Shopping Guide</span>
                    <span className="font-semibold">₹{shoppingGuideTotal}</span>
                  </div>
                )}
                
                {wellnessPlanAddon && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>+ Wellness & Confidence Plan</span>
                    <span className="font-semibold">₹{wellnessPlanTotal}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Order Total:</span>
                    <span className="text-blue-600">₹{totalAmount.toLocaleString()}</span>
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
                {isProcessing ? 'Processing...' : '✨ Start My Style Transformation Now'}
              </button>
              
              <div className="text-center text-sm text-gray-600">
                <p>Pay via Razorpay – 100% Safe & Secure</p>
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