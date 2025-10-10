'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock } from 'lucide-react';
import { trackAddToCart, trackInitiateCheckout, trackPurchase, updateUserData } from '@/lib/metaPixel';

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

export default function CheckoutPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
  
  // Product pricing
  const originalPrice = 5999;
  const discountedPrice = 1199;
  const savings = originalPrice - discountedPrice;
  
  // Add-ons
  const [divaDietPlanAddon, setDivaDietPlanAddon] = useState(false); // Diva Diet Plan
  const [skinHairBlueprintAddon, setSkinHairBlueprintAddon] = useState(false); // Skin and Hair Blueprint
  
  const divaDietPlanPrice = 299;
  
  const skinHairBlueprintOriginalPrice = 1999;
  const skinHairBlueprintDiscountedPrice = 999;
  
  // Memoize total calculations to prevent unnecessary recalculations
  const totalAmount = useMemo(() => 
    discountedPrice + 
    (divaDietPlanAddon ? divaDietPlanPrice : 0) +
    (skinHairBlueprintAddon ? skinHairBlueprintDiscountedPrice : 0),
    [divaDietPlanAddon, skinHairBlueprintAddon]
  );
  
  const totalValue = useMemo(() => 
    originalPrice + 1000 + // Base + Free bonuses (₹1,000+ value)
    (divaDietPlanAddon ? divaDietPlanPrice : 0) +
    (skinHairBlueprintAddon ? skinHairBlueprintOriginalPrice : 0),
    [divaDietPlanAddon, skinHairBlueprintAddon]
  );
  
  // const totalSavings = totalValue - totalAmount; // Removed as not used in current design

  // Optimized countdown timer - only update when time actually changes
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev; // No change, prevents unnecessary re-render
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  // Memoize addon details to prevent recreation on every render
  const addonDetails = useMemo(() => ({
    divadiet: {
      name: 'Diva Diet Plan',
      price: 299,
      id: 'diva_diet_plan'
    },
    skinhair: {
      name: 'Skin and Hair Blueprint',
      price: 999,
      id: 'skin_hair_blueprint'
    }
  }), []);

  // Optimized add-on change handler with Meta tracking only for additions
  const handleAddonChange = useCallback((addonType: 'divadiet' | 'skinhair', checked: boolean) => {
    const addon = addonDetails[addonType];
    
    // Track only when addon is added (not removed)
    if (checked) {
      trackAddToCart(addon.name, addon.price, addon.id);
    }
    
    // Update state
    if (addonType === 'divadiet') {
      setDivaDietPlanAddon(checked);
    } else if (addonType === 'skinhair') {
      setSkinHairBlueprintAddon(checked);
    }
  }, [addonDetails]);

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
    
    // Track InitiateCheckout event with correct item count
    const itemCount = 1 + (divaDietPlanAddon ? 1 : 0) + (skinHairBlueprintAddon ? 1 : 0);
    trackInitiateCheckout(totalAmount, itemCount, 'ICONIK Style Consultation');
    
    try {
      // Create order data
      const orderData = {
        customer_name: formData.email.split('@')[0], // Use email prefix as name
        customer_email: formData.email,
        customer_phone: formData.phone,
        amount: totalAmount,
        base_product: 'Iconik Style Consultation',
        add_ons: {
          diva_diet_plan: divaDietPlanAddon,
          skin_hair_blueprint: skinHairBlueprintAddon
        },
        total_base_price: discountedPrice,
        diva_diet_plan_price: divaDietPlanAddon ? divaDietPlanPrice : 0,
        skin_hair_blueprint_price: skinHairBlueprintAddon ? skinHairBlueprintDiscountedPrice : 0
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
          description: 'Iconik Style Consultation',
          order_id: responseData.razorpay_order_id,
          handler: function (response: RazorpayResponse) {
            // Payment successful - Track detailed purchase with all items
            const purchasedItems = ['iconik_style_consultation'];
            if (divaDietPlanAddon) purchasedItems.push('diva_diet_plan');
            if (skinHairBlueprintAddon) purchasedItems.push('skin_hair_blueprint');
            
            // Track SINGLE purchase event with all items (no duplicates)
            trackPurchase(totalAmount, 'ICONIK Complete Package', purchasedItems, purchasedItems.length);
            
            // Store purchase amount and customer data for success page tracking
            localStorage.setItem('purchaseAmount', totalAmount.toString());
            
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
            
            // Redirect to success page with all necessary parameters including amount
            const successUrl = `/checkout/success?payment_id=${response.razorpay_payment_id}&order_id=${responseData.razorpay_order_id}&customer_id=${responseData.customer_id}&db_order_id=${responseData.db_order_id}&amount=${totalAmount}`;
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
  }, [formData, totalAmount, divaDietPlanAddon, skinHairBlueprintAddon]);

  // Memoize submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process payment directly without addon popup
    await processPayment();
  }, [processPayment]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      {/* Header */}
      <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body">
            <ArrowLeft className="w-5 h-5" />
            Back to ICONIK
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
            Your Personal Style Transformation Starts Now
          </h1>
          
          <div className="text-3xl md:text-5xl lg:text-6xl mb-3 md:mb-4">
            <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">₹{originalPrice}</span>
            <span className="text-luxury-green font-semibold">₹{discountedPrice}</span>
          </div>
          
          <div className="bg-luxury-accent text-luxury-warm-white px-4 md:px-6 py-2 rounded-full luxury-body text-sm md:text-lg inline-block animate-bounce">
            YOU SAVE ₹{savings} TODAY!
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Order Form - Simplified Design */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white border-2 border-luxury-charcoal rounded-3xl p-6 md:p-8 shadow-2xl"
          >
            <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-6 text-center">Get Your Style Consultation</h2>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm luxury-body text-luxury-charcoal/70 mb-2 font-semibold">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-4 border-2 border-luxury-charcoal/20 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-base"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm luxury-body text-luxury-charcoal/70 mb-2 font-semibold">
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
                  className="w-full px-4 py-4 border-2 border-luxury-charcoal/20 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-base"
                  placeholder="Enter 10-digit phone number"
                />
                <p className="text-xs luxury-body text-luxury-charcoal/50 mt-1">Enter exactly 10 digits</p>
              </div>

              {/* Security Notice */}
              <div className="text-center text-sm luxury-body text-luxury-charcoal/60 bg-luxury-cream/30 rounded-xl p-4">
                <p>🔒 Your payment is secure and encrypted</p>
                <p className="mt-1">By clicking below, you agree to our terms of service and privacy policy</p>
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
            <div className="bg-luxury-warm-white border-2 border-luxury-charcoal text-luxury-charcoal rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-2 md:top-4 right-[-30px] bg-luxury-gold text-luxury-charcoal px-6 md:px-8 py-1 transform rotate-45 text-xs font-bold">
                BEST SELLER
              </div>
              
              <div className="mb-3 md:mb-4">
                <h3 className="text-xl md:text-2xl luxury-heading mb-2 text-luxury-charcoal">ICONIK Personal Style Consultation</h3>
              
                <p className="text-sm md:text-base luxury-body text-luxury-charcoal/70 mb-3 md:mb-4">
                  Delivered 1-on-1 by Certified Fashion & Image Consultants
                </p>
                
                <div className="text-2xl md:text-3xl mb-3 md:mb-4">
                  <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">₹{originalPrice}</span>
                  <span className="text-luxury-green font-semibold">₹{discountedPrice}</span>
                </div>
              </div>
              
              <div className="mb-3 md:mb-4">
                <h4 className="luxury-heading text-luxury-charcoal mb-2">What you get:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">Complete Style DNA Analysis</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">Personalized Color Palette</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">Body-Flattering Silhouette Mapping</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">Hair & Makeup Blueprint</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">20-min Private Consultation Call</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">Lifetime Style Profile Access</span>
                  </li>
                </ul>
              </div>
            </div>


            {/* Add-on 1: Diva Diet Plan */}
            <div 
              onClick={() => handleAddonChange('divadiet', !divaDietPlanAddon)}
              className="bg-luxury-cream/40 border-2 border-luxury-cream rounded-3xl p-6 md:p-8 relative cursor-pointer hover:bg-luxury-cream/60 transition-all duration-300"
            >
              <div className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 bg-luxury-accent text-luxury-warm-white px-4 py-1 rounded-full text-xs font-bold">
                Most Clients Also Add This
              </div>
              
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={divaDietPlanAddon}
                  readOnly
                  className="w-6 h-6 text-luxury-accent border-luxury-cream rounded focus:ring-luxury-accent mt-1 pointer-events-none"
                />
                <div className="flex-1">
                  <div className="luxury-heading text-luxury-charcoal text-lg mb-2">🥗 Diva Diet Plan</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-luxury-green font-semibold text-xl">₹{divaDietPlanPrice}</span>
                  </div>
                  <ul className="text-sm luxury-body text-luxury-charcoal/70 space-y-1 ml-4">
                    <li>🍽️ Personalized meal plans tailored to your lifestyle</li>
                    <li>💪 Nutrition guide for glowing skin and healthy hair</li>
                    <li>🥑 Easy-to-follow recipes and portion control tips</li>
                    <li>📊 Weekly progress tracking and adjustments</li>
                  </ul>
                  <div className="bg-luxury-gold/20 text-luxury-charcoal p-3 rounded-lg mt-3 text-center text-sm luxury-body">
                    ⚡ Complete your transformation inside & out!
                  </div>
                </div>
              </div>
            </div>

            {/* Add-on 2: Skin and Hair Blueprint */}
            <div 
              onClick={() => handleAddonChange('skinhair', !skinHairBlueprintAddon)}
              className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-luxury-cream cursor-pointer hover:bg-luxury-cream/60 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={skinHairBlueprintAddon}
                  readOnly
                  className="w-6 h-6 text-luxury-accent border-luxury-cream rounded focus:ring-luxury-accent mt-1 pointer-events-none"
                />
                <div className="flex-1">
                  <div className="luxury-heading text-luxury-charcoal text-lg mb-2">🌿 Skin and Hair Blueprint</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="line-through text-luxury-charcoal/40 font-semibold">₹{skinHairBlueprintOriginalPrice}</span>
                    <span className="text-luxury-green font-semibold text-xl">₹{skinHairBlueprintDiscountedPrice}</span>
                    <span className="bg-luxury-accent text-luxury-warm-white px-2 py-1 rounded-full text-xs">50% OFF</span>
                  </div>
                  <p className="text-sm luxury-body text-luxury-charcoal/70 mb-2">Ayurvedic remedies for natural beauty transformation:</p>
                  <ul className="text-sm luxury-body text-luxury-charcoal/70 space-y-1 ml-4">
                    <li>✨ Clear skin & blemish removal remedies</li>
                    <li>🌞 Natural tan removal treatments</li>
                    <li>💆 Thicker, healthier hair growth solutions</li>
                    <li>🌱 Natural, chemical-free Ayurvedic recipes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-luxury-cream">
              <h3 className="text-xl luxury-heading text-luxury-charcoal mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="luxury-body text-luxury-charcoal">ICONIK Style Consultation</span>
                  <span className="luxury-body">
                    <span className="line-through text-luxury-charcoal/40 mr-2 font-semibold">₹{originalPrice}</span>
                    <span className="text-luxury-green font-semibold">₹{discountedPrice}</span>
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-luxury-accent">
                  <span className="luxury-body">FREE Bonuses (₹1,000+ value)</span>
                  <span className="luxury-body">FREE</span>
                </div>
                
                {divaDietPlanAddon && (
                  <div className="flex justify-between items-center text-luxury-accent">
                    <span className="luxury-body">Diva Diet Plan (Optional)</span>
                    <span className="luxury-body font-semibold">₹{divaDietPlanPrice}</span>
                  </div>
                )}
                
                {skinHairBlueprintAddon && (
                  <div className="flex justify-between items-center text-luxury-accent">
                    <span className="luxury-body">Skin and Hair Blueprint (Optional)</span>
                    <span className="luxury-body font-semibold">₹{skinHairBlueprintDiscountedPrice}</span>
                  </div>
                )}
                
                <div className="border-t border-luxury-cream pt-3">
                  <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/60">
                    <span>Total Value:</span>
                    <span className="line-through">₹{totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="luxury-body">You Pay:</span>
                    <span className="text-luxury-green font-semibold">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-center text-sm luxury-body text-luxury-charcoal/60 mt-2">
                    Total if all selected: ₹{totalAmount.toLocaleString()} (Value over ₹{totalValue.toLocaleString()})
                  </div>
                </div>
              </div>

              {/* Free Outfit Recommendation - Alternative Option */}
              <div className="mb-4 md:mb-5">
                <a
                  href="https://api.whatsapp.com/send/?phone=919130048899&text=Hi+ICONIK%21+I%27d+love+to+get+my+free+outfit+recommendation.&type=phone_number&app_absent=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-luxury-pink-bg/40 backdrop-blur-sm border border-luxury-accent/20 rounded-xl p-3 md:p-4 hover:bg-luxury-pink-bg/60 hover:border-luxury-accent/40 transition-all duration-300"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="flex-shrink-0 w-6 h-6 bg-[#25D366] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </div>
                    <p className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">
                      🤔 Still unsure? <span className="text-luxury-accent font-semibold">Try a Free Outfit Recommendation</span> first!
                    </p>
                  </div>
                  <p className="luxury-body text-luxury-charcoal/60 text-xs md:text-sm text-center">
                    Get instant style advice on WhatsApp — no commitment needed
                  </p>
                </a>
              </div>
              
              {/* Payment Button - Mobile Optimized */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white py-4 md:py-5 px-4 md:px-6 rounded-full text-lg md:text-xl luxury-body shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mb-3 md:mb-4 hover:scale-105 transform font-semibold"
              >
                {isProcessing ? 'Processing...' : '🔥 YES! Transform My Style Now →'}
              </button>
              
              <div className="text-center text-xs md:text-sm luxury-body text-luxury-charcoal/60 mb-3 md:mb-4">
                <p>Pay via Razorpay – 100% Safe & Secure</p>
              </div>
              
              {/* Money Back Guarantee */}
              <div className="bg-luxury-gold/10 border border-luxury-gold/20 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-luxury-gold" />
                  <span className="luxury-body text-luxury-charcoal">30-Day Money-Back Guarantee</span>
                </div>
                <p className="text-sm luxury-body text-luxury-charcoal/70">
                  Love your new style or get 100% of your money back. No questions asked!
                </p>
              </div>
              
              {/* Payment Methods */}
              <div className="mt-4 text-center">
                <p className="text-sm luxury-body text-luxury-charcoal/60 mb-2">Accepted Payment Methods:</p>
                <div className="flex justify-center gap-3 text-sm luxury-body text-luxury-charcoal/50">
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
                  <span>Instant access to your guides</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>100s of successful transformations</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sticky Mobile CTA - Enhanced */}
      <div className="fixed bottom-0 left-0 right-0 bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream p-3 md:hidden z-50">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="luxury-body text-luxury-charcoal/70 text-xs">Complete Package</div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-semibold text-luxury-green">₹{totalAmount.toLocaleString()}</span>
                <span className="line-through text-luxury-charcoal/40 text-xs">₹5,999</span>
              </div>
            </div>
            <div className="text-right ml-2">
              <div className="luxury-body text-luxury-charcoal/60 text-xs">Expires:</div>
              <div className="luxury-body text-luxury-accent text-sm font-medium">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={isProcessing}
            className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-4 py-4 text-base rounded-full transition-all duration-300 luxury-body text-center disabled:opacity-50 hover:scale-105 transform font-semibold"
          >
            {isProcessing ? 'Processing...' : '🔥 Transform My Style Now →'}
          </button>
        </div>
      </div>
    </div>
  );
}