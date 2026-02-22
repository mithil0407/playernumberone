'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { Suspense } from 'react';

function ThankYouContent() {
    const params = useSearchParams();
    const paymentId = params.get('payment_id') || '';
    const amount = params.get('amount') || '97';

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden flex flex-col">

            {/* Header */}
            <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream py-4 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
                <div className="max-w-2xl w-full mx-auto text-center">

                    {/* Success icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="w-20 h-20 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                    >
                        <div className="absolute inset-0 bg-luxury-accent rounded-full opacity-20 animate-ping"></div>
                        <CheckCircle className="w-10 h-10 text-luxury-accent relative z-10" />
                    </motion.div>

                    {/* Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl md:text-5xl luxury-heading text-luxury-charcoal mb-4">
                            Payment Confirmed
                        </h1>
                        <p className="text-lg md:text-xl luxury-body text-luxury-charcoal/70 mb-6 leading-relaxed max-w-lg mx-auto">
                            Your ICONIK Blueprint is being prepared. Before we can personalise it, we need two photos and a few details.
                        </p>

                        {/* Payment ref */}
                        {paymentId && (
                            <p className="luxury-body text-xs text-luxury-charcoal/40 mb-10 tracking-wider">
                                REF: {paymentId} · AUD ${amount}
                            </p>
                        )}
                    </motion.div>

                    {/* Next step card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-luxury-cream/40 backdrop-blur-sm border-2 border-luxury-accent/20 rounded-3xl p-8 md:p-12 mb-10 shadow-xl shadow-luxury-accent/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-accent/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-luxury-accent/5 rounded-full blur-3xl -ml-10 -mb-10"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-center gap-2 text-xs luxury-body text-luxury-accent tracking-widest uppercase mb-4 font-semibold">
                                <Clock className="w-4 h-4" />
                                NEXT STEP
                            </div>
                            <h2 className="text-3xl md:text-4xl luxury-heading text-luxury-charcoal mb-4">
                                Complete your intake form
                            </h2>
                            <p className="luxury-body text-luxury-charcoal/70 mb-8 leading-relaxed max-w-md mx-auto">
                                Your Blueprint will be delivered within 24 hours of completing the form. It takes 4 minutes. Upload two photos and answer 9 questions.
                            </p>
                            <Link
                                href="/au/intake"
                                className="inline-flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-5 rounded-full text-base font-semibold luxury-body tracking-wide transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform"
                            >
                                Start My Intake Form
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* What happens next */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-luxury-cream/20 border border-luxury-cream rounded-2xl p-6 md:p-8 text-left max-w-lg mx-auto"
                    >
                        <h3 className="luxury-body font-semibold text-luxury-charcoal/50 text-xs tracking-widest uppercase mb-6 text-center">What happens next</h3>
                        <div className="space-y-6">
                            {[
                                { step: '1', text: 'Submit your intake form and photos (4 minutes)' },
                                { step: '2', text: 'We analyse your body geometry, colour profile, and facial architecture' },
                                { step: '3', text: 'Your personalised Blueprint arrives in your inbox within 24 hours' },
                            ].map((item) => (
                                <div key={item.step} className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-luxury-cream rounded-full flex items-center justify-center flex-shrink-0 text-luxury-accent font-semibold text-sm">
                                        {item.step}
                                    </div>
                                    <span className="text-sm luxury-body text-luxury-charcoal/80 leading-relaxed pt-1.5">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <p className="luxury-body text-xs text-luxury-charcoal/40 mt-12">
                        Check your spam folder if you don&apos;t see the Blueprint email.<br className="md:hidden" /> Need help?{' '}
                        <a href="mailto:hello@iconik.pro" className="text-luxury-charcoal underline hover:text-luxury-accent transition-colors">
                            hello@iconik.pro
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
}

export default function AUThankYouPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-luxury-warm-white flex items-center justify-center luxury-body text-luxury-charcoal/50">Loading...</div>}>
            <ThankYouContent />
        </Suspense>
    );
}
