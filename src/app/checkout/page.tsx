'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock } from 'lucide-react';
import { trackAddToCart, trackRemoveFromCart, trackInitiateCheckout, trackPurchase } from '@/lib/metaPixel';

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
  const [showExitIntent, setShowExitIntent] = useState(false);
  
  // Product pricing
  const originalPrice = 5999;
  const discountedPrice = 1499;
  const savings = originalPrice - discountedPrice;
  
  // Add-ons
  const [shoppingBlueprintAddon, setShoppingBlueprintAddon] = useState(false); // Default unchecked
  const [glowUpProgramAddon, setGlowUpProgramAddon] = useState(true); // Default checked
  
  const shoppingBlueprintOriginalPrice = 1999;
  const shoppingBlueprintDiscountedPrice = 999;
  
  const glowUpProgramOriginalPrice = 799;
  const glowUpProgramDiscountedPrice = 399;
  const glowUpProgramSavings = glowUpProgramOriginalPrice - glowUpProgramDiscountedPrice;
  
  // Calculate total
  const totalAmount = discountedPrice + 
    (shoppingBlueprintAddon ? shoppingBlueprintDiscountedPrice : 0) + 
    (glowUpProgramAddon ? glowUpProgramDiscountedPrice : 0);
  
  const totalValue = originalPrice + 1000 + // Base + Free bonuses (₹1,000+ value)
    (shoppingBlueprintAddon ? shoppingBlueprintOriginalPrice : 0) + 
    (glowUpProgramAddon ? glowUpProgramOriginalPrice : 0);
  
  // const totalSavings = totalValue - totalAmount; // Removed as not used in current design

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

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitIntent) {
        setShowExitIntent(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showExitIntent]);

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

  // Track add-on changes for Meta Pixel
  const handleAddonChange = (addonType: 'shopping' | 'glowup', checked: boolean) => {
    const addonDetails = {
      shopping: {
        name: 'Styled Looks Pack',
        price: checked ? 999 : 0,
        id: 'styled_looks_pack'
      },
      glowup: {
        name: 'Beauty & Confidence Essentials Pack',
        price: checked ? 399 : 0,
        id: 'beauty_confidence_pack'
      }
    };
    
    const addon = addonDetails[addonType];
    
    if (checked) {
      // Track AddToCart when addon is selected
      trackAddToCart(addon.name, addon.price, addon.id);
    } else {
      // Track RemoveFromCart when addon is deselected
      trackRemoveFromCart(addon.name, addon.price, addon.id);
    }
    
    // Update state
    if (addonType === 'shopping') {
      setShoppingBlueprintAddon(checked);
    } else {
      setGlowUpProgramAddon(checked);
    }
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
    
    setIsProcessing(true);
    
    // Track InitiateCheckout event
    trackInitiateCheckout(totalAmount, 1 + (shoppingBlueprintAddon ? 1 : 0) + (glowUpProgramAddon ? 1 : 0));
    
    try {
      // Create order data
      const orderData = {
        customer_name: formData.email.split('@')[0], // Use email prefix as name
        customer_email: formData.email,
        customer_phone: formData.phone,
        amount: totalAmount,
        base_product: 'Iconik Style Consultation',
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
          name: 'Iconik',
          description: 'Iconik Style Consultation',
          order_id: responseData.razorpay_order_id,
          handler: function (response: RazorpayResponse) {
            // Payment successful
            trackPurchase(totalAmount, 'Iconik Style Consultation', 'iconone_style_consultation');
            
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
            name: formData.email.split('@')[0],
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
          <div className="flex items-center gap-1 md:gap-2 bg-luxury-gold/20 text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
            <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm luxury-body">2,847+ Happy Clients</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-luxury-gold/20 text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
            <Lock className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm luxury-body">100% Secure</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-luxury-gold/20 text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
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
            <span className="text-luxury-accent font-semibold">₹{discountedPrice}</span>
          </div>
          
          <div className="bg-luxury-gold text-luxury-charcoal px-4 md:px-6 py-2 rounded-full luxury-body text-sm md:text-lg inline-block animate-bounce">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-4 border border-luxury-cream">
              <Image 
                src="/testimonial-shreya.webp" 
                alt="Shreya's transformation testimonial"
                width={400}
                height={300}
                className="w-full rounded-xl mb-3"
              />
              <p className="text-sm luxury-body text-luxury-charcoal/80 italic">
                &quot;I saved ₹15,000 on clothes that actually work for me! The color analysis alone changed everything.&quot;
              </p>
              <p className="text-xs luxury-body text-luxury-charcoal/60 mt-2">– Shreya, Mumbai</p>
            </div>
            
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-4 border border-luxury-cream">
              <Image 
                src="/testimonial-kavya.webp" 
                alt="Kavya's transformation testimonial"
                width={400}
                height={300}
                className="w-full rounded-xl mb-3"
              />
              <p className="text-sm luxury-body text-luxury-charcoal/80 italic">
                &quot;Finally found my style! The consultation was worth every penny. I get compliments daily now.&quot;
              </p>
              <p className="text-xs luxury-body text-luxury-charcoal/60 mt-2">– Kavya, Delhi</p>
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
            <div className="bg-luxury-charcoal text-luxury-warm-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-2 md:top-4 right-[-30px] bg-luxury-gold text-luxury-charcoal px-6 md:px-8 py-1 transform rotate-45 text-xs font-bold">
                BEST SELLER
              </div>
              
              <div className="mb-3 md:mb-4">
                <h3 className="text-xl md:text-2xl luxury-heading mb-2">ICONIK Personal Style Consultation</h3>
              
                <p className="text-sm md:text-base luxury-body text-luxury-warm-white/80 mb-3 md:mb-4">
                  Delivered 1-on-1 by Certified Fashion & Image Consultants
                </p>
                
                <div className="text-2xl md:text-3xl mb-3 md:mb-4">
                  <span className="line-through text-luxury-warm-white/60 mr-2 md:mr-4 font-semibold">₹{originalPrice}</span>
                  <span className="text-luxury-gold font-semibold">₹{discountedPrice}</span>
                </div>
              </div>
              
              <div className="mb-3 md:mb-4">
                <h4 className="luxury-heading text-luxury-warm-white mb-2">What you get:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-gold flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-warm-white/90">Complete Style DNA Analysis</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-gold flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-warm-white/90">Personalized Color Palette</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-gold flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-warm-white/90">Body-Flattering Silhouette Mapping</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-gold flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-warm-white/90">Hair & Makeup Blueprint</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-gold flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-warm-white/90">20-min Private Consultation Call</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-gold flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-warm-white/90">Lifetime Style Profile Access</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Free Bonuses */}
            <div className="bg-luxury-gold/10 border-2 border-dashed border-luxury-gold/30 rounded-3xl p-6 md:p-8">
              <h4 className="text-luxury-charcoal luxury-heading text-base md:text-lg text-center mb-3 md:mb-4">Included at No Extra Charge (₹1,000+ value):</h4>
              
              <div className="space-y-3 md:space-y-4">
                <div className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-luxury-cream">
                  <div className="luxury-body text-luxury-charcoal mb-1 md:mb-2 text-sm md:text-base">Celebrity Stylist Secrets Guide</div>
                  <div className="text-xs luxury-body text-luxury-charcoal/60">
                    Discover the exact style formulas Bollywood stylists use
                  </div>
                </div>
                
                <div className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-luxury-cream">
                  <div className="luxury-body text-luxury-charcoal mb-1 md:mb-2 text-sm md:text-base">Instant Confidence Routine Checklist</div>
                  <div className="text-xs luxury-body text-luxury-charcoal/60">
                    5-minute morning routine to look & feel amazing
                  </div>
                </div>
                
                <div className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-luxury-cream">
                  <div className="luxury-body text-luxury-charcoal mb-1 md:mb-2 text-sm md:text-base">3-Day WhatsApp Style Access</div>
                  <div className="text-xs luxury-body text-luxury-charcoal/60">
                    Get instant style advice from experts & community
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-luxury-gold/10 border-l-4 border-luxury-gold rounded-xl p-4">
              <p className="text-sm luxury-body text-luxury-charcoal italic">
                &quot;I saved ₹15,000 on clothes that actually work for me! The color analysis alone changed everything – I get compliments daily now.&quot;
              </p>
              <p className="text-xs luxury-body text-luxury-charcoal/60 mt-2">– Priya S., Mumbai (Verified Buyer)</p>
            </div>

            {/* Add-on 1: Shopping Blueprint */}
            <div className="bg-luxury-cream/40 border-2 border-luxury-cream rounded-3xl p-6 md:p-8 relative">
              <div className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 bg-luxury-accent text-luxury-warm-white px-4 py-1 rounded-full text-xs font-bold">
                Most Clients Also Add This
              </div>
              
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shoppingBlueprintAddon}
                  onChange={(e) => handleAddonChange('shopping', e.target.checked)}
                  className="w-6 h-6 text-luxury-accent border-luxury-cream rounded focus:ring-luxury-accent mt-1"
                />
                <div className="flex-1">
                  <div className="luxury-heading text-luxury-charcoal text-lg mb-2">✨ Styled Looks Pack</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="line-through text-luxury-charcoal/40 font-semibold">₹{shoppingBlueprintOriginalPrice}</span>
                    <span className="text-luxury-accent font-semibold text-xl">₹{shoppingBlueprintDiscountedPrice}</span>
                    <span className="bg-luxury-accent text-luxury-warm-white px-2 py-1 rounded-full text-xs">56% OFF</span>
                  </div>
                  <ul className="text-sm luxury-body text-luxury-charcoal/70 space-y-1 ml-4">
                    <li>🎉 4 Party Outfits</li>
                    <li>✈️ 4 Travel Outfits</li>
                    <li>👕 4 Casual Outfits</li>
                    <li>💼 4 Office Outfits</li>
                  </ul>
                  <div className="bg-luxury-gold/20 text-luxury-charcoal p-3 rounded-lg mt-3 text-center text-sm luxury-body">
                    ⚡ One-Time Offer: Never Available At This Price Again!
                  </div>
                </div>
              </label>
                </div>
                
            {/* Add-on 2: Glow Up Program */}
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-luxury-cream">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={glowUpProgramAddon}
                  onChange={(e) => handleAddonChange('glowup', e.target.checked)}
                  className="w-6 h-6 text-luxury-accent border-luxury-cream rounded focus:ring-luxury-accent mt-1"
                />
                <div className="flex-1">
                  <div className="luxury-heading text-luxury-charcoal text-lg mb-2">Beauty & Confidence Essentials Pack</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="line-through text-luxury-charcoal/40 font-semibold">₹{glowUpProgramOriginalPrice}</span>
                    <span className="text-luxury-accent font-semibold text-xl">₹{glowUpProgramDiscountedPrice}</span>
                    <span className="bg-luxury-accent text-luxury-warm-white px-2 py-1 rounded-full text-xs">SAVE ₹{glowUpProgramSavings}</span>
                  </div>
                  <ul className="text-sm luxury-body text-luxury-charcoal/70 space-y-1 ml-4">
                    <li>💄 Signature Makeup & Lipstick Guide</li>
                    <li>• Quick & natural makeup routine</li>
                    <li>• Your perfect lipstick shade (skin-matched)</li>
                    <li>👙 Lingerie Fit & Essentials Guide</li>
                      <li>• Correct bra styles for your body</li>
                      <li>• Shapewear essentials to flatter any outfit</li>
                  </ul>
                </div>
              </label>
            </div>

            {/* Order Summary */}
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-luxury-cream">
              <h3 className="text-xl luxury-heading text-luxury-charcoal mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="luxury-body text-luxury-charcoal">ICONIK Style Consultation</span>
                  <span className="luxury-body">
                    <span className="line-through text-luxury-charcoal/40 mr-2 font-semibold">₹{originalPrice}</span>
                    <span className="text-luxury-accent font-semibold">₹{discountedPrice}</span>
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-luxury-accent">
                  <span className="luxury-body">FREE Bonuses (₹1,000+ value)</span>
                  <span className="luxury-body">FREE</span>
                </div>
                
                {shoppingBlueprintAddon && (
                  <div className="flex justify-between items-center text-luxury-accent">
                    <span className="luxury-body">Styled Looks Pack (Optional)</span>
                    <span className="luxury-body font-semibold">₹{shoppingBlueprintDiscountedPrice}</span>
                  </div>
                )}
                
                {glowUpProgramAddon && (
                  <div className="flex justify-between items-center text-luxury-accent">
                    <span className="luxury-body">Beauty & Confidence Essentials Pack (Optional)</span>
                    <span className="luxury-body font-semibold">₹{glowUpProgramDiscountedPrice}</span>
                  </div>
                )}
                
                <div className="border-t border-luxury-cream pt-3">
                  <div className="flex justify-between items-center text-sm luxury-body text-luxury-charcoal/60">
                    <span>Total Value:</span>
                    <span className="line-through">₹{totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="luxury-body">You Pay:</span>
                    <span className="text-luxury-accent font-semibold">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-center text-sm luxury-body text-luxury-charcoal/60 mt-2">
                    Total if all selected: ₹{totalAmount.toLocaleString()} (Value over ₹{totalValue.toLocaleString()})
                  </div>
                </div>
              </div>
              
              {/* Payment Button - Mobile Optimized */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className="w-full bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white py-4 md:py-5 px-4 md:px-6 rounded-full text-lg md:text-xl luxury-body shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mb-3 md:mb-4 hover:scale-105 transform font-semibold"
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
                  <Shield className="w-5 h-5 text-green-500" />
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
                <span className="text-lg font-semibold text-luxury-charcoal">₹{totalAmount.toLocaleString()}</span>
                <span className="line-through text-luxury-charcoal/40 text-sm">₹5,999</span>
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
            className="w-full bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white px-4 py-4 text-base rounded-full transition-all duration-300 luxury-body text-center disabled:opacity-50 hover:scale-105 transform font-semibold"
          >
            {isProcessing ? 'Processing...' : '🔥 Transform My Style Now →'}
          </button>
        </div>
      </div>

      {/* Exit Intent Popup */}
      {showExitIntent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-luxury-warm-white rounded-3xl p-6 max-w-sm w-full relative">
            <button
              onClick={() => setShowExitIntent(false)}
              className="absolute top-4 right-4 text-luxury-charcoal/60 hover:text-luxury-charcoal"
            >
              ✕
            </button>
            
            <div className="text-center mb-4">
              <h3 className="text-xl luxury-heading text-luxury-charcoal mb-2">Wait! Don&apos;t Miss Out!</h3>
              <p className="text-sm luxury-body text-luxury-charcoal/70">
                Get an extra 10% off your style consultation
              </p>
            </div>
            
            <div className="bg-luxury-gold/20 rounded-xl p-4 mb-4 text-center">
              <div className="text-2xl font-semibold text-luxury-charcoal">
                ₹1,349 <span className="text-sm line-through text-luxury-charcoal/60">₹1,499</span>
              </div>
              <div className="text-xs luxury-body text-luxury-charcoal/60">Save ₹150 more!</div>
            </div>
            
            <button
              onClick={() => {
                setShowExitIntent(false);
                // Scroll to form
                document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white py-3 rounded-full text-base luxury-body font-semibold transition-all duration-300"
            >
              Claim My Discount Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}