'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { trackPageView } from '@/lib/metaPixel';

export default function UaeOtoSuccessPage() {
  useEffect(() => {
    trackPageView('UAE OTO Success');
  }, []);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl text-center">
        <div className="bg-luxury-cream/60 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-luxury-accent" />
        </div>
        <h1 className="text-3xl md:text-4xl luxury-heading mb-4">Welcome to Style Refresh Club!</h1>
        <p className="luxury-body text-luxury-charcoal/70 mb-6">
          You&apos;re in. We&apos;ll send your first set of outfit ideas on the 1st of next month along with your WhatsApp community access.
        </p>
        <Link
          href="/uae"
          className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-3 rounded-full luxury-body"
        >
          Back to UAE page <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
