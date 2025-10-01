'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Calendar } from 'lucide-react';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackCompleteRegistration, trackLead } from '@/lib/metaPixel';

function SuccessPageContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract customer ID and order ID from URL parameters
    const customerId = searchParams.get('customer_id');
    const orderId = searchParams.get('order_id');
    const dbOrderId = searchParams.get('db_order_id');
    const paymentId = searchParams.get('payment_id');
    
    // Store in localStorage for future reference
    if (customerId) {
      localStorage.setItem('customerId', customerId);
      console.log('Stored customerId:', customerId);
    }
    
    // Prefer db_order_id over order_id for the actual database order ID
    if (dbOrderId) {
      localStorage.setItem('orderId', dbOrderId);
      console.log('Stored orderId (db):', dbOrderId);
    } else if (orderId) {
      localStorage.setItem('orderId', orderId);
      console.log('Stored orderId (razorpay):', orderId);
    }
    
    if (paymentId) {
      localStorage.setItem('paymentId', paymentId);
      console.log('Stored paymentId:', paymentId);
    }
    
    // Enhanced Meta Pixel tracking for successful purchase
    // Track successful payment completion
    trackCompleteRegistration(1499, 'ICONIK Customer Registration');
    
    // Track lead generation success
    trackLead(1499, 'ICONIK Style Consultation Purchase');
    
    // Log what we found
    console.log('URL Parameters:', {
      customerId,
      orderId,
      dbOrderId,
      paymentId,
      allParams: Object.fromEntries(searchParams.entries())
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-2xl mx-auto px-4"
      >
        <div className="bg-luxury-gold/20 border border-luxury-gold/30 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-luxury-gold" />
        </div>
        
        <h1 className="text-4xl md:text-5xl luxury-heading mb-6 text-luxury-charcoal">
          Payment Successful! 🎉
        </h1>
        
        <p className="text-xl mb-8 luxury-body text-luxury-charcoal/70">
          Welcome to ICONIK! Your style transformation journey begins now.
        </p>
        
        <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-luxury-cream">
          <h2 className="text-2xl luxury-heading mb-6 text-luxury-charcoal">What&apos;s Next?</h2>
          
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-luxury-accent/20 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-luxury-accent" />
              </div>
              <div>
                <h3 className="luxury-heading text-luxury-charcoal mb-3 text-2xl">Check Your Messages!</h3>
                <p className="luxury-body text-luxury-charcoal/70 text-lg max-w-xl mx-auto">
                  You will receive a link via email and WhatsApp to book your style consultation meeting. 
                  Please check your inbox and messages shortly.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-sm luxury-body text-luxury-charcoal/60">
          <p className="mb-2">You&apos;ll receive a confirmation email with all the details.</p>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-accent mx-auto mb-4"></div>
          <p className="luxury-body text-luxury-charcoal/60">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
