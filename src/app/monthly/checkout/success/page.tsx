'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Calendar, Users, Sparkles, Crown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackCompleteRegistration, trackPageView, trackPurchase } from '@/lib/metaPixel';

// Tier types
type TierKey = 'starter' | 'seasonal' | 'vip';

interface TierInfo {
    name: string;
    nextSteps: {
        title: string;
        description: string;
        icon: React.ReactNode;
    }[];
}

const tierInfo: Record<TierKey, TierInfo> = {
    starter: {
        name: 'Style Starter',
        nextSteps: [
            {
                title: 'Order Confirmation Sent',
                description: "You'll receive a message confirming your order with all the details",
                icon: <CheckCircle className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
            },
            {
                title: 'Complete Your Style Quiz',
                description: "We'll send you a quick style questionnaire to understand your preferences, body type, and goals",
                icon: <Sparkles className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
            },
            {
                title: 'Schedule Your Consultation',
                description: "Book your 30-minute video call with our expert stylist at your convenience",
                icon: <Calendar className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
            },
            {
                title: 'Receive Your Style Blueprint',
                description: "Within 5 working days after your consultation, get your complete personalised style guide with 20 outfit formulas",
                icon: <Users className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
            }
        ]
    },
    seasonal: {
        name: 'Seasonal Transformation',
        nextSteps: [
            {
                title: 'Order Confirmation Sent',
                description: "You'll receive a message confirming your 3-month transformation package",
                icon: <CheckCircle className="w-6 h-6 text-luxury-gold mt-1 flex-shrink-0" />
            },
            {
                title: 'Complete Your Style Quiz',
                description: "A detailed questionnaire to personalize your 60 AI outfit renders",
                icon: <Sparkles className="w-6 h-6 text-luxury-gold mt-1 flex-shrink-0" />
            },
            {
                title: 'Initial Consultation (Within 3 Days)',
                description: "Schedule your first styling call to review your blueprint and shopping strategy",
                icon: <Calendar className="w-6 h-6 text-luxury-gold mt-1 flex-shrink-0" />
            },
            {
                title: 'WhatsApp Support Activated',
                description: "Get access to styling support with 4-hour response time for questions",
                icon: <Users className="w-6 h-6 text-luxury-gold mt-1 flex-shrink-0" />
            }
        ]
    },
    vip: {
        name: 'VIP Year-Round Style',
        nextSteps: [
            {
                title: 'VIP Order Confirmation Sent',
                description: "You'll receive a premium welcome message with your 6-month VIP package details",
                icon: <Crown className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
            },
            {
                title: 'Priority Consultation (Within 2 Days)',
                description: "Your consultation call is prioritized - you'll get first available slots",
                icon: <Calendar className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
            },
            {
                title: 'WhatsApp VIP Access Activated',
                description: "Direct access to your stylist 9am-5pm EST, Mon-Fri for real-time styling help",
                icon: <Sparkles className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
            },
            {
                title: '120 AI Outfit Renders Coming',
                description: "Your first batch of personalized outfit renders delivered within the first week",
                icon: <Users className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
            }
        ]
    }
};

function SuccessPageContent() {
    const searchParams = useSearchParams();
    const [purchasedTier, setPurchasedTier] = useState<TierKey>('seasonal');

    useEffect(() => {
        // Track page view
        trackPageView('USA_Monthly_Tiered');

        // Get tier from URL or localStorage
        const tierParam = searchParams.get('tier') as TierKey | null;
        const storedTier = localStorage.getItem('purchasedTier') as TierKey | null;
        const tier = tierParam || storedTier || 'seasonal';
        setPurchasedTier(tier);

        // Extract customer ID and order ID from URL parameters
        const customerId = searchParams.get('customer_id');
        const orderId = searchParams.get('order_id');
        const dbOrderId = searchParams.get('db_order_id');
        const paymentId = searchParams.get('payment_id');

        // Track successful registration/purchase completion with USD currency
        const purchaseAmount = localStorage.getItem('purchaseAmount');
        const purchaseCurrency = localStorage.getItem('purchaseCurrency') || 'USD';
        const purchasedItemsJson = localStorage.getItem('purchasedItems');

        if (purchaseAmount) {
            const amount = parseFloat(purchaseAmount);

            // Track Purchase
            if (purchasedItemsJson) {
                try {
                    const purchasedItems = JSON.parse(purchasedItemsJson);
                    trackPurchase(
                        amount,
                        `ICONIK ${tierInfo[tier].name}`,
                        purchasedItems,
                        purchasedItems.length,
                        purchaseCurrency,
                        'USA_Monthly_Tiered',
                        paymentId || undefined
                    );
                    console.log('✅ Tracked Purchase:', {
                        amount,
                        currency: purchaseCurrency,
                        items: purchasedItems,
                        tier,
                        transactionId: paymentId
                    });
                } catch (e) {
                    console.error('Error parsing purchasedItems for tracking:', e);
                }
            }

            // Track CompleteRegistration
            trackCompleteRegistration(
                amount,
                `ICONIK ${tierInfo[tier].name} Purchase`,
                purchaseCurrency
            );
            console.log('✅ Tracked CompleteRegistration:', {
                amount,
                currency: purchaseCurrency,
                tier
            });
        }

        // Store in localStorage
        if (customerId) localStorage.setItem('customerId', customerId);
        if (dbOrderId) {
            localStorage.setItem('orderId', dbOrderId);
        } else if (orderId) {
            localStorage.setItem('orderId', orderId);
        }
        if (paymentId) localStorage.setItem('paymentId', paymentId);

        console.log('🎯 Monthly Success Page - URL Parameters:', {
            customerId,
            orderId,
            dbOrderId,
            paymentId,
            purchaseAmount,
            purchaseCurrency,
            tier
        });
    }, [searchParams]);

    const currentTierInfo = tierInfo[purchasedTier];

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal flex items-center justify-center py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-2xl mx-auto px-4"
            >
                <div className={`border rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center ${purchasedTier === 'seasonal'
                        ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border-amber-200'
                        : purchasedTier === 'vip'
                            ? 'bg-gradient-to-r from-pink-100 to-rose-100 border-pink-200'
                            : 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200'
                    }`}>
                    {purchasedTier === 'vip' ? (
                        <Crown className="w-16 h-16 text-luxury-accent" />
                    ) : (
                        <CheckCircle className="w-16 h-16 text-luxury-accent" />
                    )}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                    Payment Successful! 🎉
                </h1>

                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 ${purchasedTier === 'seasonal'
                        ? 'bg-luxury-gold/20 text-luxury-charcoal'
                        : purchasedTier === 'vip'
                            ? 'bg-luxury-accent/20 text-luxury-accent'
                            : 'bg-luxury-green/20 text-luxury-green'
                    }`}>
                    {purchasedTier === 'seasonal' && '⭐ '}
                    {purchasedTier === 'vip' && '💎 '}
                    {currentTierInfo.name}
                </div>

                <p className="text-xl mb-8 text-gray-600">
                    Welcome to ICONIK! Your style transformation journey begins now.
                </p>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 mb-8 border border-white/30">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">What&apos;s Next?</h2>

                    <div className="space-y-5 text-left">
                        {currentTierInfo.nextSteps.map((step, index) => (
                            <div key={index} className="flex items-start gap-3">
                                {step.icon}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                                    <p className="text-gray-600 text-sm">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Link
                    href="/monthly"
                    className={`px-12 py-4 rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto w-fit text-white ${purchasedTier === 'seasonal'
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600'
                            : purchasedTier === 'vip'
                                ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                        }`}
                >
                    Back to Home <ArrowRight className="w-6 h-6" />
                </Link>

                <div className="mt-8 text-sm text-gray-500">
                    <p>Check your email/WhatsApp for your order confirmation and next steps.</p>
                    <p>Questions? Contact us at help.iconikfashion@gmail.com</p>
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <SuccessPageContent />
        </Suspense>
    );
}
