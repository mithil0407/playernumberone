'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Lock, Star } from 'lucide-react';
import {
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  trackRemoveFromCart,
  trackViewContent,
  trackPageView,
  updateUserData
} from '@/lib/metaPixel';
import { clearQuizPhotos, getQuizPhoto } from '@/lib/uaeQuizStorage';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: any) => RazorpayInstance;
  }
}

interface FormData {
  name: string;
  email: string;
  phone: string;
}

const QUIZ_STORAGE_KEY = 'uaeStyleQuizData';
const QUIZ_COMPLETED_KEY = 'uaeStyleQuizCompleted';

export default function UaeCheckoutPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: ''
  });
  const [outfitPreviewAddon, setOutfitPreviewAddon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [quizReady, setQuizReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const originalPrice = 358;
  const discountedPrice = 179;
  const outfitPreviewPrice = 99;

  const totalAmount = useMemo(() => discountedPrice + (outfitPreviewAddon ? outfitPreviewPrice : 0), [outfitPreviewAddon]);

  useEffect(() => {
    trackPageView('UAE Checkout');
    trackViewContent('UAE Style Blueprint - Checkout', discountedPrice, ['uae_style_blueprint'], 'AED', 'UAE');
  }, [discountedPrice]);

  useEffect(() => {
    const hasQuiz = localStorage.getItem(QUIZ_COMPLETED_KEY) === 'true';
    const quizData = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!hasQuiz || !quizData) {
      window.location.href = '/uae/quiz';
      return;
    }
    setQuizReady(true);
  }, []);

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay.com"]')) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setErrorMessage('Failed to load payment system. Please refresh.');
    document.body.appendChild(script);
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const uploadQuizData = useCallback(
    async (orderId: string) => {
      const quizData = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (!quizData) return;

      const fullBody = await getQuizPhoto('fullBody');
      const headshot = await getQuizPhoto('headshot');
      if (!fullBody || !headshot) return;

      const uploadData = new FormData();
      uploadData.append('quiz_data', quizData);
      uploadData.append('full_body', fullBody);
      uploadData.append('headshot', headshot);
      uploadData.append('customer_name', formData.name);
      uploadData.append('customer_email', formData.email);
      uploadData.append('customer_phone', formData.phone);
      uploadData.append('order_id', orderId);

      const response = await fetch('/api/uae-quiz/upload', {
        method: 'POST',
        body: uploadData
      });

      if (!response.ok) {
        localStorage.setItem('uaeQuizUploadPending', 'true');
        return;
      }

      localStorage.removeItem(QUIZ_STORAGE_KEY);
      localStorage.removeItem(QUIZ_COMPLETED_KEY);
      localStorage.removeItem('uaeQuizUploadPending');
      await clearQuizPhotos();
    },
    [formData.email, formData.name, formData.phone]
  );

  const handleCheckout = async () => {
    setErrorMessage(null);

    if (!formData.name || !formData.email || !formData.phone) {
      setErrorMessage('Please enter your name, email, and WhatsApp number.');
      return;
    }

    if (!quizReady) {
      setErrorMessage('Please complete the quiz before checking out.');
      return;
    }

    setIsProcessing(true);

    const itemCount = 1 + (outfitPreviewAddon ? 1 : 0);
    trackInitiateCheckout(totalAmount, itemCount, 'UAE Style Blueprint', 'AED', 'UAE');

    try {
      const orderData = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        amount: totalAmount,
        currency: 'AED',
        base_product: 'UAE Style Blueprint',
        add_ons: {
          diva_diet_plan: false,
          smart_shoppers_guide: false,
          outfit_preview: outfitPreviewAddon
        },
        total_base_price: discountedPrice,
        diva_diet_plan_price: 0,
        smart_shoppers_guide_price: 0,
        outfit_preview_price: outfitPreviewAddon ? outfitPreviewPrice : 0
      };

      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Payment initialization failed');
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || 'Payment initialization failed');
      }

      const initializeRazorpay = () => {
        const options = {
          key: responseData.key,
          amount: responseData.amount,
          currency: responseData.currency,
          name: 'ICONIK',
          description: 'UAE Style Blueprint',
          image: `${window.location.origin}/logopayment.webp`,
          order_id: responseData.razorpay_order_id,
          handler: async (response: RazorpayResponse) => {
            const purchasedItems = ['uae_style_blueprint'];
            if (outfitPreviewAddon) purchasedItems.push('outfit_preview');

            trackPurchase(totalAmount, 'UAE Style Blueprint', purchasedItems, purchasedItems.length, 'AED', 'UAE', response.razorpay_payment_id);

            localStorage.setItem('purchaseAmount', totalAmount.toString());
            localStorage.setItem('purchaseCurrency', 'AED');
            localStorage.setItem('customerEmail', formData.email);
            localStorage.setItem('customerPhone', formData.phone);
            localStorage.setItem('customerName', formData.name);

            if (responseData.customer_id) {
              localStorage.setItem('customerId', responseData.customer_id);
              sessionStorage.setItem('customerId', responseData.customer_id);
            }
            if (responseData.db_order_id) {
              localStorage.setItem('orderId', responseData.db_order_id);
              sessionStorage.setItem('orderId', responseData.db_order_id);
            }

            try {
              await uploadQuizData(responseData.db_order_id || responseData.razorpay_order_id);
            } catch (error) {
              console.error('Quiz upload failed:', error);
              localStorage.setItem('uaeQuizUploadPending', 'true');
            }

            updateUserData(formData.email, formData.phone);

            const successUrl = `/uae/checkout/success?payment_id=${response.razorpay_payment_id}&order_id=${responseData.razorpay_order_id}&customer_id=${responseData.customer_id}&db_order_id=${responseData.db_order_id}`;
            window.location.href = successUrl;
          },
          prefill: {
            name: formData.name,
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

      if (razorpayLoaded && window.Razorpay) {
        initializeRazorpay();
      } else {
        const checkRazorpay = setInterval(() => {
          if (window.Razorpay) {
            clearInterval(checkRazorpay);
            initializeRazorpay();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkRazorpay);
          if (!window.Razorpay) {
            setIsProcessing(false);
            setErrorMessage('Failed to load payment system. Please try again.');
          }
        }, 10000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl md:text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
          <Link href="/uae" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body text-sm md:text-base">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Back to UAE Offer
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 border border-luxury-cream rounded-3xl p-6 mb-6"
          >
            <h1 className="text-2xl md:text-4xl luxury-heading mb-2">Your Personal Style Blueprint</h1>
            <p className="luxury-body text-luxury-charcoal/70 mb-4">Delivered via email within 48 hours</p>
            <div className="flex items-center gap-3">
              <span className="text-xl text-luxury-charcoal/60 line-through">AED {originalPrice}</span>
              <span className="text-3xl text-luxury-accent font-semibold">AED {discountedPrice}</span>
              <span className="text-sm text-luxury-green">50% OFF</span>
            </div>
            <div className="mt-5 grid gap-2">
              {[
                'Body Shape Analysis',
                'Face Shape + Hair/Eyewear Recommendations',
                'Seasonal Color Palette (12 colors)',
                '12 Complete Outfit Formulas',
                'Personalized Stylist Notes'
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="luxury-body text-luxury-charcoal/70">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 border border-luxury-cream rounded-3xl p-6"
          >
            <h2 className="text-xl luxury-heading mb-4">Your Details</h2>
            <div className="grid gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={formData.name}
                onChange={(event) => handleInputChange('name', event.target.value)}
                className="border border-luxury-cream rounded-2xl p-3 luxury-body text-base"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(event) => handleInputChange('email', event.target.value)}
                className="border border-luxury-cream rounded-2xl p-3 luxury-body text-base"
              />
              <input
                type="tel"
                placeholder="WhatsApp Number"
                value={formData.phone}
                onChange={(event) => handleInputChange('phone', event.target.value)}
                className="border border-luxury-cream rounded-2xl p-3 luxury-body text-base"
              />
              <p className="text-xs text-luxury-charcoal/60">We&apos;ll never spam you. We&apos;ll only contact you to deliver your report.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 border border-luxury-cream rounded-3xl p-6 mt-6"
          >
            <h2 className="text-xl luxury-heading mb-3">Add-On</h2>
            <button
              onClick={() => {
                const next = !outfitPreviewAddon;
                setOutfitPreviewAddon(next);
                if (next) {
                  trackAddToCart('Outfit Preview on You', outfitPreviewPrice, 'outfit_preview', 'AED', 'UAE');
                } else {
                  trackRemoveFromCart('Outfit Preview on You', outfitPreviewPrice, 'outfit_preview', 'AED', 'UAE');
                }
              }}
              className={`w-full border rounded-2xl p-4 text-left luxury-body transition-all ${outfitPreviewAddon ? 'border-luxury-accent bg-luxury-cream/50' : 'border-luxury-cream bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Outfit Preview on You</p>
                  <p className="text-sm text-luxury-charcoal/60">See how the outfits look on your body type before you shop.</p>
                </div>
                <span className="text-luxury-accent font-semibold">AED {outfitPreviewPrice}</span>
              </div>
            </button>
          </motion.div>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 border border-luxury-cream rounded-3xl p-6 sticky top-28"
          >
            <h2 className="text-xl luxury-heading mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="luxury-body">Style Blueprint</span>
                <span className="luxury-body">AED {discountedPrice}</span>
              </div>
              {outfitPreviewAddon && (
                <div className="flex items-center justify-between text-sm text-luxury-charcoal/70">
                  <span>Outfit Preview Add-On</span>
                  <span>AED {outfitPreviewPrice}</span>
                </div>
              )}
              <div className="border-t border-luxury-cream pt-4 flex items-center justify-between text-lg">
                <span className="luxury-heading">Total</span>
                <span className="luxury-heading text-luxury-accent">AED {totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full mt-6 bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white py-4 rounded-full luxury-body text-lg transition-all disabled:opacity-60"
            >
              {isProcessing ? 'Processing...' : 'Complete Order'}
            </button>

            {errorMessage && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 space-y-3 text-xs text-luxury-charcoal/60">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> 100% secure payment via Razorpay
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" /> 4.9/5 from 2,000+ clients
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
