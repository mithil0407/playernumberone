'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackCompleteRegistration, trackPageView } from '@/lib/metaPixel';

function SuccessPageContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page view
    trackPageView();

    // Extract customer ID and order ID from URL parameters
    const urlCustomerId = searchParams.get('customer_id');
    const urlOrderId = searchParams.get('order_id');
    const dbOrderId = searchParams.get('db_order_id');
    const paymentId = searchParams.get('payment_id');

    // Track successful registration/purchase completion
    const purchaseAmount = localStorage.getItem('purchaseAmount');
    const purchaseCurrency = localStorage.getItem('purchaseCurrency') || 'INR';

    if (purchaseAmount) {
      trackCompleteRegistration(
        parseFloat(purchaseAmount),
        'ICONIK Style Consultation Purchase',
        purchaseCurrency
      );
    }

    // Store in localStorage for the schedule page to access
    if (urlCustomerId) {
      localStorage.setItem('customerId', urlCustomerId);
    }

    if (dbOrderId) {
      localStorage.setItem('orderId', dbOrderId);
    } else if (urlOrderId) {
      localStorage.setItem('orderId', urlOrderId);
    }

    if (paymentId) {
      localStorage.setItem('paymentId', paymentId);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      {/* Payment Success Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center pt-8 pb-6 px-4"
      >
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-luxury-accent" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
          Payment Successful! 🎉
        </h1>
        <p className="text-gray-600">
          Your style consultation is booked.
        </p>
      </motion.div>

      {/* What's Next Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-2xl mx-auto px-4 py-8"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 mb-8 border border-white/30 text-center">
          <CheckCircle className="w-12 h-12 text-luxury-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3 text-gray-900">You&apos;re all set! 🎉</h2>
          <p className="text-gray-700 mb-2">
            We&apos;ve sent a confirmation email with all your order details and next steps.
          </p>
          <p className="text-gray-500 text-sm">
            Can&apos;t find it? Please check your <span className="font-semibold text-gray-700">spam or junk folder</span> — it may have landed there.
          </p>
        </div>

        <Link
          href="/"
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-12 py-4 rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto w-fit"
        >
          Back to Home <ArrowRight className="w-6 h-6" />
        </Link>

        <div className="mt-8 text-sm text-gray-500 text-center">
          <p>Check your email/WhatsApp for your order confirmation and booking link.</p>
          <p>Questions? Contact us at support@playernumberone.com</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
