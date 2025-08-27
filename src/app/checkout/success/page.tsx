'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessPageContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract customer ID and order ID from URL parameters
    const customerId = searchParams.get('customer_id');
    const orderId = searchParams.get('order_id');
    const dbOrderId = searchParams.get('db_order_id');
    const paymentId = searchParams.get('payment_id');
    
    // Store in localStorage for the schedule page to access
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
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-2xl mx-auto px-4"
      >
        <div className="bg-green-900/30 border border-green-500/30 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-green-400" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-green-400">
          Payment Successful! 🎉
        </h1>
        
        <p className="text-xl mb-8 text-gray-300">
          Welcome to IconOne! Your style transformation journey begins now.
        </p>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-600">
          <h2 className="text-2xl font-bold mb-4 text-rose-400">What&apos;s Next?</h2>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <Calendar className="w-6 h-6 text-rose-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Schedule Your Style Session</h3>
                <p className="text-gray-400 text-sm">Book your 1-on-1 consultation with our expert stylist</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-rose-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Personalized Style Assessment</h3>
                <p className="text-gray-400 text-sm">Get your custom style transformation roadmap</p>
              </div>
            </div>
          </div>
        </div>
        
        <Link
          href="/schedule"
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-12 py-4 rounded-lg text-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto w-fit"
        >
          Schedule Your Style Session <ArrowRight className="w-6 h-6" />
        </Link>
        
        <div className="mt-8 text-sm text-gray-400">
          <p>You&apos;ll receive a confirmation email with all the details.</p>
          <p>Questions? Contact us at support@playernumberone.com</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
