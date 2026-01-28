'use client';

import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Mail, Calendar, Package } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { trackCompleteRegistration } from '@/lib/metaPixel';

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const [planType, setPlanType] = useState<string>('monthly');
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    // Get plan type and amount from URL params
    const plan = searchParams.get('plan_type') || 'monthly';
    const subscriptionAmount = searchParams.get('amount') || '1699';

    setPlanType(plan);
    setAmount(parseInt(subscriptionAmount));

    // Track successful subscription registration
    trackCompleteRegistration(
      parseInt(subscriptionAmount),
      'Iconik Closet Subscription',
      'INR'
    );
  }, [searchParams]);

  const planName = planType === 'monthly' ? 'Monthly Plan' : 'Quarterly Plan (3 Months)';

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-16">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl">
            <CheckCircle className="w-12 h-12 md:w-14 md:h-14 text-white" />
          </div>

          <h1 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-4">
            🎉 Welcome to Iconik Closet!
          </h1>

          <p className="text-lg md:text-xl luxury-body text-luxury-charcoal/70 mb-2">
            Your subscription is active.
          </p>

          {/* Subscription Details */}
          <div className="bg-luxury-cream/50 backdrop-blur-sm rounded-2xl p-6 mt-6 max-w-md mx-auto border border-luxury-cream">
            <div className="flex items-center justify-between mb-2">
              <span className="luxury-body text-luxury-charcoal/70">Plan:</span>
              <span className="luxury-heading text-luxury-charcoal">{planName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="luxury-body text-luxury-charcoal/70">Amount:</span>
              <span className="luxury-heading text-luxury-green text-2xl">₹{amount.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* What Happens Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 border-2 border-luxury-cream"
        >
          <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-6 text-center">
            What Happens Next:
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-luxury-accent/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-luxury-accent" />
              </div>
              <div className="flex-1">
                <h3 className="luxury-heading text-luxury-charcoal text-lg mb-2">
                  Step 1: Check Your Email
                </h3>
                <p className="luxury-body text-luxury-charcoal/70 text-sm md:text-base">
                  You have received a mail through which you can choose a time slot according to your convenience for your initial style analysis with our stylist.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-luxury-accent/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-luxury-accent" />
              </div>
              <div className="flex-1">
                <h3 className="luxury-heading text-luxury-charcoal text-lg mb-2">
                  Step 2: Receive Your Style Blueprint
                </h3>
                <p className="luxury-body text-luxury-charcoal/70 text-sm md:text-base">
                  Within 3-5 days, receive your complete style blueprint via WhatsApp.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-luxury-accent/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-luxury-accent" />
              </div>
              <div className="flex-1">
                <h3 className="luxury-heading text-luxury-charcoal text-lg mb-2">
                  Step 3: Monthly Outfit Delivery
                </h3>
                <p className="luxury-body text-luxury-charcoal/70 text-sm md:text-base">
                  Get 6 new outfit sets with shopping links every month on the 1st.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center justify-center my-8">
          <div className="border-t border-luxury-charcoal/20 flex-1"></div>
          <div className="px-4 text-luxury-charcoal/40 luxury-body text-sm">━━━━━━━━━━━━━━━━━━━━━━━</div>
          <div className="border-t border-luxury-charcoal/20 flex-1"></div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-luxury-cream/30 backdrop-blur-sm rounded-2xl p-6 mb-8 text-center border border-luxury-cream"
        >
          <p className="luxury-body text-luxury-charcoal/70 mb-4">
            Have questions? Reply to your confirmation email.
          </p>
          <p className="luxury-body text-luxury-charcoal/60 text-sm">
            We&apos;re here to help you every step of the way!
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-4 rounded-full text-lg luxury-body transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to Home <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="luxury-body text-luxury-charcoal/50 text-sm">
            Your subscription will automatically renew. You can cancel anytime from your account settings.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function IconikClosetSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-luxury-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="luxury-body text-luxury-charcoal/70">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
