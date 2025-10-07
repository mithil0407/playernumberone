'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Download, Mail, Clock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GuideSuccessPageContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract customer ID and order ID from URL parameters
    const customerId = searchParams.get('customer_id');
    const orderId = searchParams.get('order_id');
    const dbOrderId = searchParams.get('db_order_id');
    const paymentId = searchParams.get('payment_id');
    
    // Store in localStorage for future reference
    if (customerId) {
      localStorage.setItem('guide_customerId', customerId);
      console.log('Stored guide customerId:', customerId);
    }
    
    // Prefer db_order_id over order_id for the actual database order ID
    if (dbOrderId) {
      localStorage.setItem('guide_orderId', dbOrderId);
      console.log('Stored guide orderId (db):', dbOrderId);
    } else if (orderId) {
      localStorage.setItem('guide_orderId', orderId);
      console.log('Stored guide orderId (razorpay):', orderId);
    }
    
    if (paymentId) {
      localStorage.setItem('guide_paymentId', paymentId);
      console.log('Stored guide paymentId:', paymentId);
    }
    
    // Log what we found
    console.log('Guide Success URL Parameters:', {
      customerId,
      orderId,
      dbOrderId,
      paymentId,
      allParams: Object.fromEntries(searchParams.entries())
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Success Icon */}
          <div className="w-24 h-24 bg-luxury-pink-bg rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-luxury-accent" />
          </div>

          {/* Success Message */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-luxury-charcoal">
            🎉 Payment Successful!
          </h1>
          
          <p className="text-xl luxury-body text-luxury-charcoal/80 mb-8">
            Welcome to the ICONIK family! Your transformation journey starts now.
          </p>

          {/* What's Next */}
          <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-luxury-cream">
            <h2 className="text-2xl luxury-heading text-luxury-charcoal mb-6">📋 What Happens Next?</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-luxury-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-luxury-warm-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-luxury-charcoal mb-2">Within 5 Minutes</h3>
                  <p className="luxury-body text-luxury-charcoal/80">
                    You&apos;ll receive an email with your ICONIK Styling Guide download link. Check your inbox (and spam folder just in case).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-luxury-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-luxury-warm-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-luxury-charcoal mb-2">Instant Access</h3>
                  <p className="luxury-body text-luxury-charcoal/80">
                    Download your guide immediately and start your style transformation. The guide is yours forever - no expiration date.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-luxury-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-luxury-warm-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-luxury-charcoal mb-2">Start Your Journey</h3>
                  <p className="luxury-body text-luxury-charcoal/80">
                    Follow the step-by-step guide to discover your body shape, find your colors, and build your signature style.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What's in Your Guide */}
          <div className="bg-luxury-pink-bg/30 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-luxury-cream">
            <h2 className="text-2xl luxury-heading text-luxury-charcoal mb-6">📖 What's in Your ICONIK Guide?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="text-sm luxury-body text-luxury-charcoal/80">Body Shape Discovery & Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="text-sm luxury-body text-luxury-charcoal/80">Face Shape & Color Palette Guide</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="text-sm luxury-body text-luxury-charcoal/80">Wardrobe Foundation Checklist</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="text-sm luxury-body text-luxury-charcoal/80">Style Archetype Quiz & Results</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="text-sm luxury-body text-luxury-charcoal/80">Mix & Match System (30+ Outfits)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="text-sm luxury-body text-luxury-charcoal/80">Occasion-Based Styling Guide</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="text-sm luxury-body text-luxury-charcoal/80">Accessories & Footwear Guide</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="text-sm luxury-body text-luxury-charcoal/80">Confidence Blueprint</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="text-sm luxury-body text-luxury-charcoal/80">Smart Shopping Framework</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-luxury-accent" />
                  <span className="text-sm luxury-body text-luxury-charcoal/80">Bonus: 100+ Outfit Inspiration Library</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fast Action Bonuses */}
          <div className="bg-luxury-accent/10 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-luxury-accent/30">
            <h2 className="text-2xl luxury-heading text-luxury-charcoal mb-4">🎁 Your Fast Action Bonuses</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-luxury-accent" />
                <span className="luxury-body text-luxury-charcoal/80">
                  <strong>Bonus #1:</strong> Posing & Confidence Guide (₹1,500 Value)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-luxury-accent" />
                <span className="luxury-body text-luxury-charcoal/80">
                  <strong>Bonus #2:</strong> Shopping Masterlist (₹2,000 Value)
                </span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-luxury-cream/30 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-luxury-cream">
            <h2 className="text-xl luxury-heading text-luxury-charcoal mb-4">💬 Need Help?</h2>
            <p className="luxury-body text-luxury-charcoal/80 mb-4">
              If you don&apos;t receive your guide within 10 minutes, or if you have any questions, reach out to us:
            </p>
            <div className="space-y-2">
              <a 
                href="mailto:support@playernumberone.com" 
                className="block text-luxury-accent hover:underline font-medium"
              >
                📧 support@playernumberone.com
              </a>
              <a 
                href="https://wa.me/919876543210" 
                className="block text-luxury-accent hover:underline font-medium"
              >
                💬 WhatsApp Support
              </a>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-4 rounded-full text-lg luxury-body hover:shadow-lg transition-all duration-300"
            >
              🏠 Back to Home
            </Link>
            
            <p className="text-sm luxury-body text-luxury-charcoal/60">
              Thank you for choosing ICONIK! Your transformation starts now. ✨
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function GuideSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-accent mx-auto mb-4"></div>
        <p className="text-luxury-charcoal">Loading...</p>
      </div>
    </div>}>
      <GuideSuccessPageContent />
    </Suspense>
  );
}
