'use client';

import { Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Mail, Calendar, MessageCircle, ArrowRight, Star } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { trackCompleteRegistration, trackPurchase, trackPageView } from '@/lib/metaPixel';

function SuccessContent() {
    const searchParams = useSearchParams();
    const amount = searchParams.get('amount');
    const subscriptionId = searchParams.get('subscription_id');

    useEffect(() => {
        // Track page view
        trackPageView('Style_Club_Welcome');

        // Track purchase if not tracked already (backup)
        if (amount && subscriptionId) {
            trackPurchase(
                parseFloat(amount),
                'Style Club Subscription',
                ['style_club_new'],
                1,
                'INR',
                'Style_Club',
                subscriptionId
            );

            // Also track registration
            trackCompleteRegistration(parseFloat(amount), 'Style Club Member', 'INR');
        }
    }, [amount, subscriptionId]);

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal flex flex-col justify-center py-12 px-4">
            <div className="max-w-2xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-10"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl md:text-5xl luxury-heading mb-4 text-luxury-charcoal">
                        🎉 Welcome to the Style Club!
                    </h1>
                    <p className="text-xl luxury-body text-luxury-charcoal/70">
                        Your subscription is active. You&apos;ve just simplified your wardrobe forever.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl mb-10"
                >
                    <h2 className="text-2xl font-bold mb-8 text-center bg-luxury-cream/30 py-2 rounded-lg">Here&apos;s what happens next:</h2>

                    <div className="space-y-8 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gray-100 hidden md:block"></div>

                        <div className="flex gap-6 relative z-10">
                            <div className="w-14 h-14 bg-luxury-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-luxury-accent/20">
                                <Mail className="w-7 h-7 text-luxury-accent" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Step 1: Check Your Email</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    You&apos;ll receive a confirmation in the next 5 minutes with a short style profile form. This helps us personalize your first batch.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6 relative z-10">
                            <div className="w-14 h-14 bg-luxury-green/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-luxury-green/20">
                                <Calendar className="w-7 h-7 text-luxury-green" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Step 2: Your First Curation</h3>
                                <p className="text-gray-600 leading-relaxed mb-3">
                                    Arriving on the <span className="font-bold text-luxury-charcoal">1st of next month!</span> We&apos;ll send you:
                                </p>
                                <ul className="space-y-2 text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> 5 curated outfits via WhatsApp</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Personalized to Body Type + Color Palette</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> All clickable purchase links</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-6 relative z-10">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-blue-100">
                                <MessageCircle className="w-7 h-7 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Step 3: Save Your Stylist&apos;s Number</h3>
                                <div className="bg-luxury-charcoal text-white p-4 rounded-xl inline-block w-full md:w-auto">
                                    <p className="text-2xl font-mono font-bold tracking-wider text-center md:text-left">+91-9130048899</p>
                                    <p className="text-xs text-white/60 mt-1 text-center md:text-left">Add to contacts as &quot;ICONIK Stylist&quot;</p>
                                </div>
                                <p className="text-gray-600 mt-3 text-sm">
                                    Ping us anytime for event styling, last-minute needs, or outfit advice. (48h response time)
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-luxury-cream/40 border border-luxury-cream rounded-2xl p-6 mb-10"
                >
                    <h2 className="text-xl luxury-heading text-center mb-5 text-luxury-charcoal">
                        Your Style Preview
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-luxury-cream bg-white">
                            <Image
                                src="/style-before.webp"
                                alt="Before Style Club"
                                fill
                                sizes="(min-width: 640px) 50vw, 100vw"
                                className="object-cover"
                            />
                            <div className="absolute bottom-3 left-3 bg-luxury-warm-white/90 text-luxury-charcoal text-xs font-semibold px-3 py-1 rounded-full">
                                Before
                            </div>
                        </div>
                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-luxury-cream bg-white">
                            <Image
                                src="/style-after.webp"
                                alt="After Style Club"
                                fill
                                sizes="(min-width: 640px) 50vw, 100vw"
                                className="object-cover"
                            />
                            <div className="absolute bottom-3 left-3 bg-luxury-warm-white/90 text-luxury-charcoal text-xs font-semibold px-3 py-1 rounded-full">
                                After
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Testimonial */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-luxury-gold/5 border border-luxury-gold/20 rounded-2xl p-6 text-center italic text-luxury-charcoal mb-8"
                >
                    <div className="flex justify-center gap-1 mb-3 text-luxury-gold">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                    &quot;I haven&apos;t Googled &apos;what to wear&apos; in 4 months. Total game-changer.&quot;
                    <div className="font-bold not-italic mt-2 text-sm opacity-70">— Sneha R., Marketing Manager</div>
                </motion.div>

                <div className="text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-luxury-charcoal hover:text-luxury-accent font-medium transition-colors"
                    >
                        Return to Home <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function WelcomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
