'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, Mail, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackCompleteRegistration, trackPageView } from '@/lib/metaPixel';

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    trackPageView('Checkout Success');

    const urlCustomerId = searchParams.get('customer_id');
    const urlOrderId = searchParams.get('order_id');
    const dbOrderId = searchParams.get('db_order_id');
    const paymentId = searchParams.get('payment_id');
    const urlAmount = searchParams.get('amount');
    const purchaseAmount = localStorage.getItem('purchaseAmount') || urlAmount;
    const purchaseCurrency = localStorage.getItem('purchaseCurrency') || 'INR';

    if (purchaseAmount) {
      trackCompleteRegistration(
        parseFloat(purchaseAmount),
        'ICONIK Style Consultation Purchase',
        purchaseCurrency
      );
    }

    if (urlCustomerId) localStorage.setItem('customerId', urlCustomerId);
    if (paymentId) localStorage.setItem('paymentId', paymentId);

    const resolvedOrderId = dbOrderId || urlOrderId || localStorage.getItem('orderId') || '';
    if (resolvedOrderId) {
      localStorage.setItem('orderId', resolvedOrderId);
      setOrderId(resolvedOrderId);
    }

    setCustomerEmail(localStorage.getItem('customerEmail') || '');
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="bg-white border border-luxury-cream rounded-3xl shadow-2xl shadow-luxury-gold/5 overflow-hidden"
        >
          <div className="h-1.5 bg-gradient-to-r from-luxury-accent via-luxury-gold to-luxury-green" />

          <div className="p-6 md:p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>

            <p className="luxury-body text-xs uppercase tracking-[0.24em] text-luxury-accent font-bold mb-3">
              Payment Confirmed
            </p>

            <h1 className="luxury-heading text-3xl md:text-5xl text-luxury-charcoal leading-tight mb-4">
              Your Style Blueprint is reserved.
            </h1>

            <p className="luxury-body text-base md:text-lg text-luxury-charcoal/70 leading-relaxed max-w-2xl mx-auto">
              We have received your order. Your personalised Blueprint is now in the preparation queue and will be delivered within 4-5 days.
            </p>
          </div>

          <div className="border-t border-luxury-cream bg-luxury-cream/25 p-5 md:p-7">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white border border-luxury-cream rounded-2xl p-4 text-center">
                <Clock className="w-6 h-6 text-luxury-accent mx-auto mb-3" />
                <p className="luxury-body text-sm font-semibold text-luxury-charcoal mb-1">Delivery timeline</p>
                <p className="luxury-body text-xs text-luxury-charcoal/60">4-5 days</p>
              </div>

              <div className="bg-white border border-luxury-cream rounded-2xl p-4 text-center">
                <Mail className="w-6 h-6 text-luxury-accent mx-auto mb-3" />
                <p className="luxury-body text-sm font-semibold text-luxury-charcoal mb-1">Confirmation</p>
                <p className="luxury-body text-xs text-luxury-charcoal/60">
                  {customerEmail || 'Sent to your checkout email'}
                </p>
              </div>

              <div className="bg-white border border-luxury-cream rounded-2xl p-4 text-center">
                <Shield className="w-6 h-6 text-luxury-accent mx-auto mb-3" />
                <p className="luxury-body text-sm font-semibold text-luxury-charcoal mb-1">Order reference</p>
                <p className="luxury-body text-xs text-luxury-charcoal/60 break-all">
                  {orderId || 'Saved after payment'}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-white border border-luxury-cream rounded-2xl p-5 md:p-6">
              <h2 className="luxury-heading text-xl text-luxury-charcoal mb-3">
                What happens next
              </h2>
              <div className="space-y-3 text-left">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                  <p className="luxury-body text-sm text-luxury-charcoal/70 m-0">
                    Your stylist reviews your checkout details and prepares your personalised analysis.
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                  <p className="luxury-body text-sm text-luxury-charcoal/70 m-0">
                    Your Blueprint is built around your colours, silhouette, face architecture, and outfit goals.
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                  <p className="luxury-body text-sm text-luxury-charcoal/70 m-0">
                    If we need anything else, we will contact you using the email or phone number from checkout.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-luxury-accent hover:bg-luxury-accent/90 text-white px-6 py-3 rounded-full luxury-body font-semibold transition-colors"
              >
                Back to ICONIK <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-luxury-cream/40 text-luxury-charcoal px-6 py-3 rounded-full luxury-body font-semibold border border-luxury-cream transition-colors"
              >
                Contact support
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-luxury-accent animate-spin mx-auto mb-4" />
          <p className="luxury-body text-sm text-luxury-charcoal/70">Loading confirmation...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
