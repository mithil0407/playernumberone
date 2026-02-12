'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { trackCompleteRegistration, trackPageView, trackPurchase, updateUserData } from '@/lib/metaPixel';
import { clearQuizPhotos, getQuizPhoto } from '@/lib/uaeQuizStorage';

const QUIZ_STORAGE_KEY = 'uaeStyleQuizData';

function UaeCheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [processingOto, setProcessingOto] = useState(false);

  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    trackPageView('UAE Success');

    const purchaseAmount = localStorage.getItem('purchaseAmount');
    if (purchaseAmount) {
      trackCompleteRegistration(parseFloat(purchaseAmount), 'UAE Style Blueprint', 'AED');
    }

    const email = localStorage.getItem('customerEmail') || '';
    const phone = localStorage.getItem('customerPhone') || '';
    const name = localStorage.getItem('customerName') || '';

    setCustomerEmail(email);
    setCustomerPhone(phone);
    setCustomerName(name);

    updateUserData(email, phone);
  }, []);

  useEffect(() => {
    const handleMouseLeave = (event: MouseEvent) => {
      if (event.clientY <= 0 && !showExitPopup && !showFinalConfirmation) {
        setShowExitPopup(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showExitPopup, showFinalConfirmation]);

  useEffect(() => {
    const retryUpload = async () => {
      const pending = localStorage.getItem('uaeQuizUploadPending');
      const quizData = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (!pending || !quizData) return;

      const fullBody = await getQuizPhoto('fullBody');
      const headshot = await getQuizPhoto('headshot');
      if (!fullBody || !headshot) return;

      const uploadData = new FormData();
      uploadData.append('quiz_data', quizData);
      uploadData.append('full_body', fullBody);
      uploadData.append('headshot', headshot);
      uploadData.append('customer_name', customerName);
      uploadData.append('customer_email', customerEmail);
      uploadData.append('customer_phone', customerPhone);
      uploadData.append('order_id', localStorage.getItem('orderId') || searchParams.get('db_order_id') || '');

      const response = await fetch('/api/uae-quiz/upload', {
        method: 'POST',
        body: uploadData
      });

      if (!response.ok) return;

      localStorage.removeItem(QUIZ_STORAGE_KEY);
      localStorage.removeItem('uaeQuizUploadPending');
      await clearQuizPhotos();
    };

    retryUpload();
  }, [customerEmail, customerName, customerPhone, searchParams]);

  const handleOtoPurchase = async () => {
    if (!customerEmail || !customerPhone || !customerName) {
      setShowFinalConfirmation(true);
      return;
    }

    setProcessingOto(true);

    try {
      const orderData = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        amount: 349,
        currency: 'AED',
        base_product: 'Style Refresh Club - 3 Months',
        add_ons: {
          diva_diet_plan: false,
          smart_shoppers_guide: false,
          outfit_preview: false
        },
        total_base_price: 349,
        diva_diet_plan_price: 0,
        smart_shoppers_guide_price: 0,
        outfit_preview_price: 0
      };

      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) throw new Error('Payment initialization failed');
      const responseData = await response.json();
      if (!responseData.success) throw new Error(responseData.error || 'Payment initialization failed');

      const options = {
        key: responseData.key,
        amount: responseData.amount,
        currency: responseData.currency,
        name: 'ICONIK',
        description: 'Style Refresh Club - 3 Months',
        image: `${window.location.origin}/logopayment.webp`,
        order_id: responseData.razorpay_order_id,
        handler: (response: { razorpay_payment_id: string }) => {
          trackPurchase(349, 'Style Refresh Club - 3 Months', ['style_refresh_club_3mo'], 1, 'AED', 'UAE', response.razorpay_payment_id);
          window.location.href = `/uae/oto/success?payment_id=${response.razorpay_payment_id}&order_id=${responseData.razorpay_order_id}`;
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        },
        theme: { color: '#E91E63' }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('OTO payment error:', error);
      setShowFinalConfirmation(true);
    } finally {
      setProcessingOto(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 border border-luxury-cream rounded-3xl p-6 md:p-10 mb-10 text-center"
        >
          <div className="bg-luxury-cream/60 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-luxury-accent" />
          </div>
          <h1 className="text-3xl md:text-4xl luxury-heading mb-4">🎉 Order Confirmed! Your Style Blueprint is Being Curated.</h1>
          <p className="luxury-body text-luxury-charcoal/70 mb-6">
            Check your email {customerEmail ? `(${customerEmail})` : ''} in the next 5 minutes for your order receipt.
          </p>
          <div className="grid gap-4 md:grid-cols-3 text-left">
            {[
              'Our stylist team is reviewing your photos and quiz answers',
              'Your personalized Style Blueprint will be delivered within 48 hours',
              'You will receive an email with your download link + access instructions'
            ].map((item) => (
              <div key={item} className="bg-luxury-cream/40 rounded-2xl p-4">
                <CheckCircle className="w-5 h-5 text-luxury-accent mb-2" />
                <p className="luxury-body text-luxury-charcoal/70">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-luxury-charcoal text-luxury-warm-white rounded-3xl p-6 md:p-10 mb-8"
        >
          <h2 className="text-3xl md:text-4xl luxury-heading mb-3">Wait! Before You Go... Never Run Out of Outfit Ideas Again</h2>
          <p className="luxury-body text-luxury-warm-white/80 mb-6">
            You&apos;ve unlocked your Style Blueprint – but what about next month when you&apos;re staring at your closet saying &quot;I have nothing to wear&quot;?
          </p>

          <div className="bg-luxury-warm-white text-luxury-charcoal rounded-3xl p-6 md:p-8">
            <h3 className="text-2xl luxury-heading mb-4">Style Refresh Club – 3-Month Outfit Subscription</h3>
            <div className="grid gap-3 mb-6">
              {[
                '6 fresh, shoppable outfit ideas (delivered on the 1st of every month)',
                'Seasonal trend alerts filtered for your body type',
                'Private stylist Q&A group (WhatsApp community)',
                'Wardrobe remix guide (restyle pieces you already own)'
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-luxury-accent mt-1" />
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <p className="text-sm text-luxury-charcoal/60">Regular: AED 447 (AED 149/month)</p>
              <p className="text-2xl luxury-heading text-luxury-accent">Today Only: AED 349 for 3 Months</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                '/gallery-style1.webp',
                '/gallery-confidence.webp',
                '/gallery-discovery.webp',
                '/gallery-sophisticated.webp',
                '/gallery-natural.webp',
                '/gallery-wellness.webp'
              ].map((src) => (
                <div key={src} className="relative h-24 rounded-2xl overflow-hidden bg-luxury-cream/40">
                  <Image src={src} alt="Outfit preview" fill className="object-cover" />
                </div>
              ))}
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={handleOtoPurchase}
                disabled={processingOto}
                className="flex-1 bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white py-4 rounded-full luxury-body text-lg"
              >
                {processingOto ? 'Processing...' : 'YES! ADD STYLE REFRESH CLUB (AED 349 TODAY)'}
              </button>
              <button
                onClick={() => setShowExitPopup(true)}
                className="flex-1 border border-luxury-cream text-luxury-charcoal py-4 rounded-full luxury-body"
              >
                No Thanks, I&apos;ll Pass
              </button>
            </div>
            <p className="mt-4 text-sm text-luxury-charcoal/60">
              Join 300+ women who&apos;ve said goodbye to &quot;I have nothing to wear.&quot; – Sarah, Dubai
            </p>
          </div>
        </motion.div>

        {showFinalConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 border border-luxury-cream rounded-3xl p-6 md:p-10"
          >
            <h3 className="text-2xl luxury-heading mb-4">All Set! Check Your Email.</h3>
            <ul className="space-y-2 text-luxury-charcoal/70 luxury-body">
              <li>You&apos;ll receive an email receipt in 2 minutes.</li>
              <li>Your Style Blueprint will be delivered within 48 hours.</li>
              <li>
                Questions? Reply to our email or WhatsApp us here:{' '}
                <a
                  className="text-luxury-accent"
                  href="https://wa.me/919130048899"
                  target="_blank"
                  rel="noreferrer"
                >
                  +91 91300 48899
                </a>
              </li>
            </ul>
            <Link
              href="/uae"
              className="inline-flex items-center mt-6 text-luxury-accent luxury-body"
            >
              Back to UAE page <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </div>

      {showExitPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-2xl luxury-heading mb-3">Last Chance – Lock in 3 Months for AED 349</h3>
            <p className="luxury-body text-luxury-charcoal/70 mb-5">
              Not ready to commit long-term? Grab the 3-month bundle today and keep your outfit ideas flowing.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleOtoPurchase}
                className="w-full bg-luxury-accent text-luxury-warm-white py-3 rounded-full luxury-body"
              >
                Yes, Lock in My Discount
              </button>
              <button
                onClick={() => {
                  setShowExitPopup(false);
                  setShowFinalConfirmation(true);
                }}
                className="w-full border border-luxury-cream py-3 rounded-full luxury-body text-luxury-charcoal/70"
              >
                No, Take Me to My Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UaeCheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luxury-warm-white" />}>
      <UaeCheckoutSuccessContent />
    </Suspense>
  );
}
