'use client';

import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, MessageCircle, FileText, Users, Gift, ArrowRight, Calendar, Star } from 'lucide-react';
import { trackPurchase, trackCompleteRegistration } from '@/lib/metaPixel';
import { useSearchParams } from 'next/navigation';

// Tier display names
const tierNames: Record<string, string> = {
    essentials: 'ICONIK Essentials',
    signature: 'ICONIK Signature',
    vip: 'ICONIK VIP'
};

function SuccessContent() {
    const searchParams = useSearchParams();
    const [customerName, setCustomerName] = useState<string>('');
    const [hasTracked, setHasTracked] = useState(false);

    const paymentId = searchParams.get('payment_id');
    const tier = searchParams.get('tier') || 'signature';
    const amount = searchParams.get('amount');
    const billing = searchParams.get('billing') || 'monthly';

    const tierName = tierNames[tier] || 'ICONIK Signature';
    const billingLabel = billing === 'monthly' ? 'Monthly' : 'Quarterly';

    // Get customer name from localStorage
    useEffect(() => {
        const storedName = localStorage.getItem('customerName');
        if (storedName) {
            setCustomerName(storedName);
        }
    }, []);

    // Track purchase event
    useEffect(() => {
        if (!hasTracked && paymentId && amount) {
            const purchaseAmount = parseFloat(amount);
            const productId = `iconik_${tier}_india`;

            // Track Purchase
            trackPurchase(
                purchaseAmount,
                tierName,
                [productId],
                1,
                'INR',
                'India_Monthly',
                paymentId
            );

            // Track Complete Registration
            trackCompleteRegistration(
                purchaseAmount,
                tierName,
                'INR'
            );

            setHasTracked(true);
        }
    }, [hasTracked, paymentId, amount, tier, tierName]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-luxury-warm-white to-luxury-cream/30 text-luxury-charcoal">
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
                {/* Success Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="w-24 h-24 bg-luxury-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-14 h-14 text-luxury-green" />
                    </div>

                    <h1 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-4">
                        Welcome to ICONIK{customerName ? `, ${customerName}` : ''}! 🎉
                    </h1>

                    <p className="text-lg md:text-xl luxury-body text-luxury-charcoal/70 mb-4">
                        Your {tierName} membership is now active
                    </p>

                    <div className="inline-flex items-center gap-2 bg-luxury-cream/50 px-4 py-2 rounded-full">
                        <Calendar className="w-4 h-4 text-luxury-accent" />
                        <span className="text-sm luxury-body text-luxury-charcoal/80">
                            {billingLabel} billing • Cancel anytime
                        </span>
                    </div>
                </motion.div>

                {/* What Happens Next */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-luxury-cream mb-8"
                >
                    <h2 className="text-2xl luxury-heading text-luxury-charcoal mb-6 text-center">
                        What Happens Next?
                    </h2>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-luxury-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-luxury-accent font-bold">1</span>
                            </div>
                            <div>
                                <h3 className="luxury-heading text-luxury-charcoal mb-1">Check Your Email</h3>
                                <p className="luxury-body text-luxury-charcoal/70 text-sm">
                                    We&apos;ve sent your welcome guide with everything you need to get started.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-luxury-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-luxury-accent font-bold">2</span>
                            </div>
                            <div>
                                <h3 className="luxury-heading text-luxury-charcoal mb-1">Your Stylist Will Reach Out</h3>
                                <p className="luxury-body text-luxury-charcoal/70 text-sm">
                                    Within 24 hours, your personal stylist will contact you via WhatsApp to introduce themselves.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-luxury-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-luxury-accent font-bold">3</span>
                            </div>
                            <div>
                                <h3 className="luxury-heading text-luxury-charcoal mb-1">First Call Scheduled</h3>
                                <p className="luxury-body text-luxury-charcoal/70 text-sm">
                                    Your first styling consultation call will be scheduled within 3 days.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Action Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="grid md:grid-cols-2 gap-4 mb-8"
                >
                    {/* Join WhatsApp Group */}
                    <a
                        href="https://chat.whatsapp.com/ICONIK_Members_Group"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Join Members Group</h3>
                                <p className="text-white/80 text-sm">Connect with 247+ ICONIK members</p>
                            </div>
                            <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
                        </div>
                    </a>

                    {/* Complete Style Profile */}
                    <a
                        href="https://forms.gle/ICONIK_Style_Profile"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-luxury-accent hover:bg-luxury-accent/90 text-white rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Complete Style Profile</h3>
                                <p className="text-white/80 text-sm">Help us understand your style</p>
                            </div>
                            <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
                        </div>
                    </a>
                </motion.div>

                {/* Social Proof */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="bg-luxury-cream/50 rounded-2xl p-6 text-center mb-8"
                >
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-luxury-accent" />
                        <span className="luxury-heading text-luxury-charcoal">You&apos;re now part of 247 active members!</span>
                    </div>
                    <div className="flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 text-luxury-gold fill-current" />
                        ))}
                    </div>
                    <p className="text-sm luxury-body text-luxury-charcoal/60 mt-2">
                        Join the community of confident, stylish women
                    </p>
                </motion.div>

                {/* Referral Program */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="bg-gradient-to-r from-luxury-gold/20 to-luxury-accent/20 rounded-2xl p-6 md:p-8 border border-luxury-gold/30"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-luxury-gold/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <Gift className="w-6 h-6 text-luxury-gold" />
                        </div>
                        <div>
                            <h3 className="luxury-heading text-luxury-charcoal text-lg mb-2">
                                Know Someone Who Needs ICONIK?
                            </h3>
                            <p className="luxury-body text-luxury-charcoal/70 text-sm mb-4">
                                Refer a friend and get <span className="font-semibold text-luxury-accent">₹500 credit</span> toward your next month!
                            </p>
                            <button className="bg-luxury-charcoal hover:bg-luxury-charcoal/90 text-white px-6 py-2 rounded-full text-sm luxury-body transition-all duration-300">
                                Share ICONIK →
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-center mt-12"
                >
                    <p className="luxury-body text-luxury-charcoal/60 text-sm mb-4">
                        Questions? Reach out to us anytime
                    </p>
                    <div className="flex justify-center gap-4">
                        <a
                            href="https://wa.me/919130048899"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-luxury-charcoal/60 hover:text-luxury-accent transition-colors"
                        >
                            WhatsApp
                        </a>
                        <span className="text-luxury-charcoal/30">•</span>
                        <a
                            href="mailto:support@iconik.pro"
                            className="text-luxury-charcoal/60 hover:text-luxury-accent transition-colors"
                        >
                            Email
                        </a>
                    </div>

                    <Link
                        href="/"
                        className="inline-block mt-8 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body"
                    >
                        ← Back to Home
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
                <div className="text-luxury-charcoal luxury-body">Loading...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
