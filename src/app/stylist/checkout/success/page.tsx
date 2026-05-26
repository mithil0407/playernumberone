'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { trackPageView } from '@/lib/metaPixel';

function StylistSuccessInner() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    useEffect(() => {
        trackPageView('Stylist Checkout Success');
        if (typeof window !== 'undefined') {
            const paymentId = sessionStorage.getItem('stylist_purchaseTracked') || '';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'blueprint_purchased', {
                funnel: 'style_scan',
                amount: 149,
                currency: 'USD',
                payment_id: paymentId,
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('track', 'Purchase', { value: 149, currency: 'USD', content_name: 'ICONIK Style Blueprint' });
            sessionStorage.removeItem('stylist_purchaseTracked');
        }
    }, []);

    return (
        <div className="min-h-screen bg-luxury-warm-white flex flex-col items-center justify-center px-4 text-center">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="w-24 h-24 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 relative"
            >
                <div className="absolute inset-0 bg-luxury-accent rounded-full opacity-20 animate-ping" />
                <CheckCircle className="w-12 h-12 text-luxury-accent relative z-10" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-lg"
            >
                <span className="text-3xl luxury-heading text-luxury-charcoal tracking-wider block mb-6">ICONIK</span>
                <h1 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-5 leading-tight">
                    Your Blueprint is on its way.
                </h1>
                <p className="luxury-body text-luxury-charcoal/70 text-lg leading-relaxed mb-4">
                    You&apos;ll receive a link to complete your intake form at{' '}
                    {email ? <strong className="text-luxury-charcoal">{email}</strong> : 'your email'} shortly.
                </p>
                <p className="luxury-body text-luxury-charcoal/60 leading-relaxed mb-8">
                    Your personalised ICONIK Style Blueprint will be delivered within <strong className="text-luxury-charcoal">72 hours</strong> of completing the intake form.
                </p>
                <div className="bg-luxury-cream/40 border border-luxury-cream rounded-2xl p-5 mb-8 text-left space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-luxury-charcoal/40">Next Steps</p>
                    {[
                        'Check your email for your intake form link',
                        'Complete the intake form (takes 7 minutes)',
                        'Receive your personalised Blueprint within 72 hours',
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-luxury-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-black text-luxury-accent">{i + 1}</span>
                            </div>
                            <span className="luxury-body text-luxury-charcoal/80 text-sm">{step}</span>
                        </div>
                    ))}
                </div>
                <p className="luxury-body text-luxury-charcoal/40 text-sm">
                    Questions? Email us at{' '}
                    <a href="mailto:help.iconikfashion@gmail.com" className="text-luxury-accent hover:underline">help.iconikfashion@gmail.com</a>
                </p>
            </motion.div>

            <footer className="mt-16">
                <Link href="/" className="luxury-body text-luxury-charcoal/30 text-xs hover:text-luxury-charcoal transition-colors">
                    ← Back to ICONIK
                </Link>
            </footer>
        </div>
    );
}

export default function StylistCheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
                <div className="text-luxury-charcoal/40 luxury-body">Loading…</div>
            </div>
        }>
            <StylistSuccessInner />
        </Suspense>
    );
}
