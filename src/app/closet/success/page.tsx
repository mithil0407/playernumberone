'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Mail, Calendar, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackPurchase, trackPageView } from '@/lib/metaPixel';

function ClosetSuccessContent() {
    const searchParams = useSearchParams();

    useEffect(() => {
        // Track page view
        trackPageView();

        // Get subscription details
        const subscriptionId = searchParams.get('subscription_id');
        const planType = searchParams.get('plan_type');
        const amount = searchParams.get('amount');

        // Track purchase if not already tracked (backup tracking)
        if (subscriptionId && amount) {
            const purchaseAmount = parseFloat(amount);
            trackPurchase(
                purchaseAmount,
                `Iconik Closet ${planType === 'yearly' ? 'Yearly' : 'Monthly'}`,
                ['iconik_closet_subscription'],
                1,
                'INR',
                'Subscription',
                subscriptionId
            );
        }

        // Log for debugging
        console.log('Closet Success - Subscription Details:', {
            subscriptionId,
            planType,
            amount
        });
    }, [searchParams]);

    const planType = searchParams.get('plan_type') || 'monthly';
    const isYearly = planType === 'yearly';

    // Calculate date 72 hours from now
    const deliveryDate = new Date();
    deliveryDate.setHours(deliveryDate.getHours() + 72);
    const formattedDate = deliveryDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 text-gray-900 flex items-center justify-center py-8 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-2xl mx-auto"
            >
                {/* Success Icon */}
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-16 h-16 text-white" />
                </div>

                {/* Headline */}
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                    You&apos;re In! 🎉
                </h1>
                <p className="text-xl md:text-2xl text-gray-700 mb-2">
                    Your First Outfit Set Arrives in 72 Hours.
                </p>
                <p className="text-gray-600 mb-8">
                    Expected by <span className="font-semibold">{formattedDate}</span>
                </p>

                {/* Subscription Confirmation Card */}
                <div className="bg-white rounded-2xl p-6 md:p-8 mb-8 border border-green-200 shadow-lg text-left">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                        <div className="bg-luxury-accent/10 p-2 rounded-full">
                            <CheckCircle className="w-6 h-6 text-luxury-accent" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Subscription Active</p>
                            <p className="text-gray-600 text-sm">
                                Iconik Closet — {isYearly ? 'Yearly (₹599/month)' : 'Monthly (₹699/month)'}
                            </p>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold mb-4 text-gray-900">📲 What happens next:</h2>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                                <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Watch your email</h3>
                                <p className="text-gray-600 text-sm">
                                    First 6 outfits (30+ shoppable links) dropping by {formattedDate}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Your style blueprint</h3>
                                <p className="text-gray-600 text-sm">
                                    Arriving from your consultation within 3-5 days
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                                <MessageCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Got a request?</h3>
                                <p className="text-gray-600 text-sm">
                                    Reply to the welcome email (e.g., &quot;I have a wedding on March 15&quot;)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <p className="text-gray-500 text-sm">
                            Every month after this, you&apos;ll receive 6 new looks — automatically curated based on your style profile.
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <Link
                    href="/"
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-12 py-4 rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3"
                >
                    Back to Home <ArrowRight className="w-6 h-6" />
                </Link>

                {/* Contact Info */}
                <div className="mt-8 text-sm text-gray-500">
                    <p>Questions? WhatsApp us or email support@playernumberone.com</p>
                </div>
            </motion.div>
        </div>
    );
}

export default function ClosetSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ClosetSuccessContent />
        </Suspense>
    );
}
