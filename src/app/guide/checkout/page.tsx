'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, CheckCircle, Lock, Star, Clock, Users } from 'lucide-react';
import { trackInitiateCheckout, trackPurchase, updateUserData } from '@/lib/metaPixel';

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

export default function GuideCheckoutPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
  
  // Add-ons
  const [presenceGuideAddon, setPresenceGuideAddon] = useState(false);
  const [magnetismPlaybookAddon, setMagnetismPlaybookAddon] = useState(false);
  
  // Product pricing
  const originalPrice = 25000;
  const discountedPrice = 499;
  const savings = originalPrice - discountedPrice;
  
  // Add-on pricing
  const presenceGuidePrice = 379;
  const magnetismPlaybookPrice = 399;
  
  // Memoize total calculations to prevent unnecessary recalculations
  const totalAmount = useMemo(() => 
    discountedPrice + 
    (presenceGuideAddon ? presenceGuidePrice : 0) + 
    (magnetismPlaybookAddon ? magnetismPlaybookPrice : 0),
    [presenceGuideAddon, magnetismPlaybookAddon]
  );
  
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
    const itemCount = 1 + (presenceGuideAddon ? 1 : 0) + (magnetismPlaybookAddon ? 1 : 0);
    trackInitiateCheckout(totalAmount, itemCount, 'ICONIK Styling Guide');
    
    try {
      // Create order data
      const orderData = {
        customer_name: formData.email.split('@')[0], // Use email prefix as name
        customer_email: formData.email,
        customer_phone: formData.phone,
        amount: totalAmount,
        base_product: 'ICONIK Styling Guide',
        add_ons: {
          presence_guide: presenceGuideAddon,
          magnetism_playbook: magnetismPlaybookAddon
        },
        total_base_price: discountedPrice,
        presence_guide_price: presenceGuideAddon ? presenceGuidePrice : 0,
        magnetism_playbook_price: magnetismPlaybookAddon ? magnetismPlaybookPrice : 0
      };

      // Call payment API
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Payment API error:', responseData);
        throw new Error(`HTTP ${response.status}: ${responseData.error || 'Payment initialization failed'}`);
      }
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Payment initialization failed');
      }
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        
        // Initialize Razorpay payment
        const options = {
          key: responseData.key,
          amount: responseData.amount,
          currency: 'INR',
          name: 'ICONIK',
          description: 'ICONIK Styling Guide',
          order_id: responseData.razorpay_order_id,
          handler: async (response: RazorpayResponse) => {
            
            // Track purchase with all items
            const purchasedItems = ['iconik_guide'];
            if (presenceGuideAddon) purchasedItems.push('presence_guide');
            if (magnetismPlaybookAddon) purchasedItems.push('magnetism_playbook');
            
            trackPurchase(totalAmount, 'ICONIK Styling Guide', purchasedItems, purchasedItems.length);
            
            // Redirect to success page with parameters
            const successUrl = `/guide/success?customer_id=${responseData.customer_id}&order_id=${responseData.order_id}&db_order_id=${responseData.db_order_id}&payment_id=${response.razorpay_payment_id}`;
            window.location.href = successUrl;
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: formData.email.split('@')[0],
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#E91E63'
          },
          // Disable some tracking features that cause browser warnings
          retry: {
            enabled: false
          },
          // Reduce fingerprinting attempts
          notes: {
            integration: 'checkout'
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      
      script.onerror = () => {
        setIsProcessing(false);
        alert('Failed to load payment system. Please try again or contact support.');
      };
      
      document.body.appendChild(script);
      
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    }
  }, [formData, totalAmount, presenceGuideAddon, magnetismPlaybookAddon, discountedPrice, presenceGuidePrice, magnetismPlaybookPrice]);

  // Memoize submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process payment directly
    await processPayment();
  }, [processPayment]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      {/* Header */}
      <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/guide" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body">
            <ArrowLeft className="w-5 h-5" />
            Back to ICONIK Guide
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
            Your Style Guide Transformation Starts Now
          </h1>
          
          <div className="text-3xl md:text-5xl lg:text-6xl mb-3 md:mb-4">
            <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">₹{originalPrice.toLocaleString()}</span>
            <span className="text-luxury-green font-semibold">₹{discountedPrice}</span>
          </div>
          
          <div className="bg-luxury-accent text-luxury-warm-white px-4 md:px-6 py-2 rounded-full luxury-body text-sm md:text-lg inline-block animate-bounce">
            YOU SAVE ₹{savings.toLocaleString()} TODAY!
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

        {/* Product Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-4 md:p-6 mb-6 md:mb-8 border border-luxury-cream"
        >
          <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal mb-4 text-center">
            What You Get in Your ICONIK Guide
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Body Shape Discovery & Analysis',
              'Face Shape & Color Palette Guide',
              'Wardrobe Foundation Checklist',
              'Style Archetype Quiz & Results',
              'Mix & Match System (30+ Outfits)',
              'Occasion-Based Styling Guide',
              'Accessories & Footwear Guide',
              'Confidence Blueprint',
              'Smart Shopping Framework',
              'Bonus: 100+ Outfit Inspiration Library'
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-1" />
                <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">{item}</span>
              </div>
            ))}
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
            <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-6 text-center">Get Your Style Guide</h2>
            
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
                BEST VALUE
              </div>
              
              <div className="mb-3 md:mb-4">
                <h3 className="text-xl md:text-2xl luxury-heading mb-2 text-luxury-charcoal">ICONIK Style Guide</h3>
              
                <p className="text-sm md:text-base luxury-body text-luxury-charcoal/70 mb-3 md:mb-4">
                  Complete personal style transformation guide
                </p>
                
                <div className="text-2xl md:text-3xl mb-3 md:mb-4">
                  <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">₹{originalPrice.toLocaleString()}</span>
                  <span className="text-luxury-green font-semibold">₹{discountedPrice}</span>
                </div>
              </div>
              
              <div className="mb-3 md:mb-4">
                <h4 className="luxury-heading text-luxury-charcoal mb-2">What you get:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">Body Shape Discovery & Analysis</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">Face Shape & Color Palette Guide</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">Wardrobe Foundation Checklist</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">Style Archetype Quiz & Results</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                    <span className="luxury-body text-luxury-charcoal/80">Mix & Match System (30+ Outfits)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Add-on 1: Presence Guide */}
            <div 
              onClick={() => setPresenceGuideAddon(!presenceGuideAddon)}
              className="bg-luxury-cream/40 border-2 border-luxury-cream rounded-3xl p-6 md:p-8 relative cursor-pointer hover:bg-luxury-cream/60 transition-all duration-300"
            >
              <div className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 bg-luxury-accent text-luxury-warm-white px-4 py-1 rounded-full text-xs font-bold">
                💎 Add-On 1
              </div>
              
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={presenceGuideAddon}
                  readOnly
                  className="w-6 h-6 text-luxury-accent border-luxury-cream rounded focus:ring-luxury-accent mt-1 pointer-events-none"
                />
                <div className="flex-1">
                  <div className="luxury-heading text-luxury-charcoal text-lg mb-2">&ldquo;The ICONIK Presence Guide&rdquo;</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-luxury-green font-semibold text-xl">₹{presenceGuidePrice} + GST</span>
                    <span className="bg-luxury-accent text-luxury-warm-white px-2 py-1 rounded-full text-xs">Special One-Time Offer</span>
                  </div>
                  <div className="luxury-body text-luxury-charcoal/80 text-sm mb-3">
                    Master the Art of Effortless Authority & Confidence
                  </div>
                  <ul className="text-sm luxury-body text-luxury-charcoal/70 space-y-1 ml-4">
                    <li>• Learn posture and body-language secrets of confident women</li>
                    <li>• Project calm power and elegance in every setting</li>
                    <li>• Use your voice to influence and command attention naturally</li>
                    <li>• Build a magnetic presence that makes people listen and respect you</li>
                  </ul>
                  <div className="bg-luxury-gold/20 text-luxury-charcoal p-3 rounded-lg mt-3 text-center text-sm luxury-body">
                    Limited Offer: Unlock this exclusive guide by ticking the box above.
                  </div>
                </div>
              </div>
            </div>

            {/* Add-on 2: Magnetism Playbook */}
            <div 
              onClick={() => setMagnetismPlaybookAddon(!magnetismPlaybookAddon)}
              className="bg-luxury-cream/40 border-2 border-luxury-cream rounded-3xl p-6 md:p-8 relative cursor-pointer hover:bg-luxury-cream/60 transition-all duration-300"
            >
              <div className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 bg-luxury-accent text-luxury-warm-white px-4 py-1 rounded-full text-xs font-bold">
                💖 Add-On 2
              </div>
              
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={magnetismPlaybookAddon}
                  readOnly
                  className="w-6 h-6 text-luxury-accent border-luxury-cream rounded focus:ring-luxury-accent mt-1 pointer-events-none"
                />
                <div className="flex-1">
                  <div className="luxury-heading text-luxury-charcoal text-lg mb-2">&ldquo;The Feminine Magnetism Playbook&rdquo;</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-luxury-green font-semibold text-xl">₹{magnetismPlaybookPrice} + GST</span>
                    <span className="bg-luxury-accent text-luxury-warm-white px-2 py-1 rounded-full text-xs">Special One-Time Offer</span>
                  </div>
                  <div className="luxury-body text-luxury-charcoal/80 text-sm mb-3">
                    Unlock the Power of Feminine Energy & Charisma
                  </div>
                  <ul className="text-sm luxury-body text-luxury-charcoal/70 space-y-1 ml-4">
                    <li>• Balance strength with grace to become irresistibly confident</li>
                    <li>• Understand emotional cues and connect deeply in relationships</li>
                    <li>• Cultivate allure without effort or pretense</li>
                    <li>• Express your femininity with authenticity and self-respect</li>
                  </ul>
                  <div className="bg-luxury-gold/20 text-luxury-charcoal p-3 rounded-lg mt-3 text-center text-sm luxury-body">
                    Limited Offer: Access this exclusive guide only with your order today.
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-luxury-cream">
              <h3 className="text-xl luxury-heading text-luxury-charcoal mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="luxury-body text-luxury-charcoal">ICONIK Style Guide</span>
                  <span className="luxury-body">
                    <span className="line-through text-luxury-charcoal/40 mr-2 font-semibold">₹{originalPrice.toLocaleString()}</span>
                    <span className="text-luxury-green font-semibold">₹{discountedPrice}</span>
                  </span>
                </div>
                
                {presenceGuideAddon && (
                  <div className="flex justify-between items-center text-luxury-accent">
                    <span className="luxury-body">The ICONIK Presence Guide</span>
                    <span className="luxury-body font-semibold">₹{presenceGuidePrice}</span>
                  </div>
                )}
                
                {magnetismPlaybookAddon && (
                  <div className="flex justify-between items-center text-luxury-accent">
                    <span className="luxury-body">The Feminine Magnetism Playbook</span>
                    <span className="luxury-body font-semibold">₹{magnetismPlaybookPrice}</span>
                  </div>
                )}
                
                <div className="border-t border-luxury-cream pt-3">
                  <div className="flex justify-between items-center text-lg">
                    <span className="luxury-body">You Pay:</span>
                    <span className="text-luxury-green font-semibold">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-center text-sm luxury-body text-luxury-charcoal/60 mt-2">
                    Total: ₹{totalAmount.toLocaleString()} + GST
                  </div>
                </div>
              </div>
              
              {/* Payment Button - Mobile Optimized */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white py-4 md:py-5 px-4 md:px-6 rounded-full text-lg md:text-xl luxury-body shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mb-3 md:mb-4 hover:scale-105 transform font-semibold"
              >
                {isProcessing ? 'Processing...' : '🔥 YES! Get My Guide Now →'}
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
                  <span>Instant access to your guide</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light font-['Inter',sans-serif]">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>100s of successful transformations</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sticky Mobile CTA - Enhanced */}
        <div className="fixed bottom-0 left-0 right-0 bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream p-3 md:hidden z-50">
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="luxury-body text-luxury-charcoal/70 text-xs">Complete Guide</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-luxury-green">₹{totalAmount.toLocaleString()}</span>
                  <span className="line-through text-luxury-charcoal/40 text-xs">₹25,000</span>
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
              {isProcessing ? 'Processing...' : '🔥 Get My Guide Now →'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
