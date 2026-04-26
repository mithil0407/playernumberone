'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Clock, Users, CheckCircle, Star, Lock, Crown } from 'lucide-react';
import { trackAddToCart, trackInitiateCheckout, trackCTAClick, trackViewContent, updateUserData } from '@/lib/metaPixel';
import { useSearchParams } from 'next/navigation';
import { getAttributionPayload } from '@/lib/attribution';

// Razorpay types
interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface FormData {
    email: string;
    phone: string;
}

// Tier types  
type TierKey = 'starter' | 'seasonal' | 'vip';

interface Tier {
    key: TierKey;
    name: string;
    tagline: string;
    price: number;
    originalPrice?: number;
    savings?: number;
    savingsPercent?: number;
    monthlyValue?: number;
    duration: string;
    badge?: string;
    badgeIcon?: string;
    features: string[];
    highlighted?: boolean;
    bestValue?: boolean;
    productId: string;
    productName: string;
}

const tiers: Tier[] = [
    {
        key: 'starter',
        name: 'Style Starter',
        tagline: 'Get your complete style blueprint',
        price: 99,
        duration: 'one-time',
        features: [
            '1 Virtual Style Consultation (20 min)',
            'Personalized Style Blueprint',
            '16 Virtual Outfit Previews',
            'Hairstyles & Makeup Blueprint',
            'Shopping Guide',
            'Delivered within 7 days'
        ],
        productId: 'iconik_style_starter',
        productName: 'ICONIK Style Starter'
    },
    {
        key: 'seasonal',
        name: 'Seasonal Transformation',
        tagline: 'Transform your wardrobe this season',
        price: 237,
        originalPrice: 297,
        savings: 60,
        savingsPercent: 20,
        monthlyValue: 79,
        duration: '3 months',
        badge: 'MOST POPULAR',
        badgeIcon: '⭐',
        features: [
            'Everything in Style Starter',
            '60 AI Outfit Renders (20/month)',
            '3 Live Styling Calls (monthly)',
            'Seasonal Shopping Guide',
            '1 Style Blueprint Refresh',
            'WhatsApp Support (4hr response)'
        ],
        highlighted: true,
        productId: 'iconik_seasonal_transformation',
        productName: 'ICONIK Seasonal Transformation'
    },
    {
        key: 'vip',
        name: 'VIP Year-Round Style',
        tagline: 'Premium styling + WhatsApp access',
        price: 354,
        originalPrice: 594,
        savings: 240,
        savingsPercent: 40,
        monthlyValue: 59,
        duration: '6 months',
        badge: 'BEST VALUE',
        badgeIcon: '💎',
        features: [
            'Everything in Seasonal',
            '120 AI Outfit Renders (20/month)',
            '6 Live Styling Calls (monthly)',
            'Monthly Shopping Guide',
            'WhatsApp Stylist Access (9am-5pm)',
            '2 Blueprint Overhauls',
            'Priority AI Rendering (48hr)'
        ],
        bestValue: true,
        productId: 'iconik_vip_year_round',
        productName: 'ICONIK VIP Year-Round Style'
    }
];

function CheckoutContent() {
    const searchParams = useSearchParams();
    const tierParam = searchParams.get('tier') as TierKey | null;

    // Initialize with tier from URL or default to seasonal
    const getInitialTier = (): TierKey => {
        if (tierParam && ['starter', 'seasonal', 'vip'].includes(tierParam)) {
            return tierParam;
        }
        return 'seasonal';
    };

    const [selectedTier, setSelectedTier] = useState<TierKey>(getInitialTier());
    const [formData, setFormData] = useState<FormData>({
        email: '',
        phone: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    const currentTier = useMemo(() => tiers.find(t => t.key === selectedTier) || tiers[1], [selectedTier]);

    // Testimonials carousel
    const testimonialImages = [
        { src: '/ia-checkout-testimonial-1.webp', alt: 'Client testimonial 1' },
        { src: '/ia-checkout-testimonial-2.webp', alt: 'Client testimonial 2' },
        { src: '/ia-checkout-testimonial-3.webp', alt: 'Client testimonial 3' },
        { src: '/ia-checkout-testimonial-4.webp', alt: 'Client testimonial 4' },
        { src: '/ia-checkout-testimonial-5.webp', alt: 'Client testimonial 5' }
    ];

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonialImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [testimonialImages.length]);

    // Track ViewContent on checkout page load
    useEffect(() => {
        trackViewContent(
            `ICONIK Monthly Checkout - ${currentTier.name}`,
            currentTier.price,
            [currentTier.productId],
            'USD',
            'USA_Monthly_Tiered'
        );
    }, [currentTier]);

    // Preload Razorpay script
    useEffect(() => {
        if (document.querySelector('script[src*="razorpay.com"]')) {
            setRazorpayLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRazorpayLoaded(true);
        script.onerror = () => console.error('Failed to preload Razorpay');
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { minutes: prev.minutes - 1, seconds: 59 };
                }
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Handle tier change
    const handleTierChange = useCallback((tierKey: TierKey) => {
        const newTier = tiers.find(t => t.key === tierKey);
        if (newTier) {
            setSelectedTier(tierKey);
            trackAddToCart(newTier.productName, newTier.price, newTier.productId, 'USD', 'USA_Monthly_Tiered');
        }
    }, []);

    // Input change handler
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length > 10) return;
            setFormData(prev => ({ ...prev, [name]: numericValue }));

            if (numericValue.length === 10 && formData.email.includes('@')) {
                updateUserData(formData.email, numericValue);
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'email' && value.includes('@') && formData.phone.length === 10) {
            updateUserData(value, formData.phone);
        }
    }, [formData.phone, formData.email]);

    // Payment processing
    const processPayment = useCallback(async () => {
        if (formData.phone.length !== 10) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Please enter a valid email address');
            return;
        }

        setIsProcessing(true);

        trackInitiateCheckout(currentTier.price, 1, currentTier.productName, 'USD', 'USA_Monthly_Tiered');

        try {
            const orderData = {
                customer_name: formData.email.split('@')[0],
                customer_email: formData.email,
                customer_phone: formData.phone,
                amount: currentTier.price,
                currency: 'USD',
                base_product: currentTier.productName,
                tier: currentTier.key,
                add_ons: {},
                total_base_price: currentTier.price,
                attribution: getAttributionPayload(),
            };

            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error('Payment initialization failed');
            }

            const responseData = await response.json();

            if (!responseData.success) {
                throw new Error(responseData.error || 'Payment initialization failed');
            }

            console.log('Payment API Response:', responseData);

            const initializeRazorpay = () => {
                const options = {
                    key: responseData.key,
                    amount: responseData.amount,
                    currency: responseData.currency || 'USD',
                    name: 'Iconik One On One',
                    description: currentTier.productName,
                    image: `${window.location.origin}/logopayment.webp`,
                    order_id: responseData.razorpay_order_id,
                    handler: function (response: RazorpayResponse) {
                        localStorage.setItem('purchaseAmount', currentTier.price.toString());
                        localStorage.setItem('purchaseCurrency', 'USD');
                        localStorage.setItem('purchasedItems', JSON.stringify([currentTier.productId]));
                        localStorage.setItem('purchasedTier', currentTier.key);

                        if (responseData.customer_id) {
                            localStorage.setItem('customerId', responseData.customer_id);
                            sessionStorage.setItem('customerId', responseData.customer_id);
                        }
                        if (responseData.db_order_id) {
                            localStorage.setItem('orderId', responseData.db_order_id);
                            sessionStorage.setItem('orderId', responseData.db_order_id);
                        }

                        const successUrl = `/monthly/checkout/success?payment_id=${response.razorpay_payment_id}&order_id=${responseData.razorpay_order_id}&customer_id=${responseData.customer_id}&db_order_id=${responseData.db_order_id}&amount=${currentTier.price}&tier=${currentTier.key}`;
                        console.log('🚀 Redirecting to:', successUrl);
                        window.location.href = successUrl;
                    },
                    prefill: {
                        name: formData.email.split('@')[0],
                        email: formData.email,
                        contact: formData.phone
                    },
                    theme: {
                        color: '#E91E63'
                    }
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();
            };

            if (razorpayLoaded && window.Razorpay) {
                initializeRazorpay();
            } else {
                const checkRazorpay = setInterval(() => {
                    if (window.Razorpay) {
                        clearInterval(checkRazorpay);
                        initializeRazorpay();
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkRazorpay);
                    if (!window.Razorpay) {
                        setIsProcessing(false);
                        alert('Failed to load payment system. Please try again.');
                    }
                }, 10000);
            }

        } catch (error) {
            console.error('Payment error:', error);
            setIsProcessing(false);
            alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
        }
    }, [formData, currentTier, razorpayLoaded]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        await processPayment();
    }, [processPayment]);

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
            {/* Header */}
            <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <Link href="/monthly" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Packages
                    </Link>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-3 md:p-4 mb-4 md:mb-6 flex flex-wrap justify-center gap-2 md:gap-4"
                >
                    <div className="flex items-center gap-1 md:gap-2 bg-luxury-pink-bg text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-xs md:text-sm luxury-body">200+ Happy Clients</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 bg-luxury-pink-bg text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
                        <Lock className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-xs md:text-sm luxury-body">100% Secure</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 bg-luxury-pink-bg text-luxury-charcoal px-2 md:px-3 py-1 md:py-2 rounded-full">
                        <Star className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-xs md:text-sm luxury-body">4.9/5 Rating</span>
                    </div>
                </motion.div>

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-6 md:mb-8"
                >
                    <h1 className="text-2xl md:text-4xl lg:text-5xl luxury-heading text-luxury-charcoal mb-4">
                        Complete Your Style Transformation
                    </h1>
                    <p className="luxury-body text-luxury-charcoal/70 text-base md:text-lg">
                        Choose your plan and start your journey to confident, effortless style
                    </p>
                </motion.div>

                {/* Tier Selection Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6 md:mb-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        {tiers.map((tier) => (
                            <button
                                key={tier.key}
                                onClick={() => handleTierChange(tier.key)}
                                className={`relative p-4 md:p-5 rounded-2xl border-2 text-left transition-all duration-300 ${selectedTier === tier.key
                                    ? tier.highlighted
                                        ? 'border-luxury-gold bg-luxury-cream/60 shadow-lg'
                                        : tier.bestValue
                                            ? 'border-luxury-accent bg-luxury-pink-bg/30 shadow-lg'
                                            : 'border-luxury-green bg-luxury-cream/50 shadow-lg'
                                    : 'border-luxury-cream bg-luxury-warm-white hover:border-luxury-charcoal/30 opacity-70 hover:opacity-100'
                                    }`}
                            >
                                {/* Badge */}
                                {tier.badge && (
                                    <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold ${tier.highlighted
                                        ? 'bg-luxury-gold text-luxury-charcoal'
                                        : 'bg-luxury-accent text-luxury-warm-white'
                                        }`}>
                                        {tier.badgeIcon} {tier.badge}
                                    </div>
                                )}

                                {/* Selected checkmark */}
                                {selectedTier === tier.key && (
                                    <div className="absolute top-3 right-3">
                                        <CheckCircle className={`w-6 h-6 ${tier.highlighted ? 'text-luxury-gold' : tier.bestValue ? 'text-luxury-accent' : 'text-luxury-green'
                                            }`} />
                                    </div>
                                )}

                                <div className={tier.badge ? 'mt-2' : ''}>
                                    <h3 className="text-base md:text-lg luxury-heading text-luxury-charcoal mb-1">
                                        {tier.name}
                                    </h3>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className={`text-2xl md:text-3xl font-bold ${tier.highlighted ? 'text-luxury-green' : tier.bestValue ? 'text-luxury-accent' : 'text-luxury-green'
                                            }`}>
                                            ${tier.price}
                                        </span>
                                        <span className="text-luxury-charcoal/60 text-xs">
                                            {tier.duration}
                                        </span>
                                    </div>
                                    {tier.monthlyValue && (
                                        <p className="text-xs text-luxury-charcoal/60 italic">
                                            Only ${tier.monthlyValue}/mo value
                                        </p>
                                    )}
                                    {tier.savings && (
                                        <span className="inline-block mt-1 bg-luxury-green/10 text-luxury-green px-2 py-0.5 rounded-full text-xs font-semibold">
                                            Save ${tier.savings}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Testimonial Carousel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6 md:mb-8 max-w-[203px] mx-auto"
                >
                    <h2 className="text-lg md:text-xl luxury-heading text-center mb-3 text-luxury-charcoal">
                        Real Results
                    </h2>
                    <div className="relative">
                        <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-2 border border-luxury-cream overflow-hidden">
                            <div className="relative" style={{ aspectRatio: '9/16' }}>
                                {testimonialImages.map((testimonial, index) => (
                                    <div
                                        key={index}
                                        className={`absolute inset-0 transition-opacity duration-500 ${index === currentTestimonial ? 'opacity-100' : 'opacity-0'
                                            }`}
                                    >
                                        <Image
                                            src={testimonial.src}
                                            alt={testimonial.alt}
                                            width={203}
                                            height={360}
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center gap-2 mt-3">
                            {testimonialImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentTestimonial(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                                        ? 'bg-luxury-accent w-6'
                                        : 'bg-luxury-charcoal/30 hover:bg-luxury-charcoal/50'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Order Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="bg-white border-2 border-luxury-charcoal rounded-3xl p-6 md:p-8 shadow-2xl"
                    >
                        <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-6 text-center">
                            Get Your {currentTier.name}
                        </h2>

                        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm luxury-body text-luxury-charcoal/70 mb-2 font-semibold">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-4 border-2 border-luxury-charcoal/20 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-base"
                                    placeholder="Enter your email address"
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phone" className="block text-sm luxury-body text-luxury-charcoal/70 mb-2 font-semibold">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={10}
                                    className="w-full px-4 py-4 border-2 border-luxury-charcoal/20 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all duration-300 luxury-body bg-white text-base"
                                    placeholder="(123) 456-7890"
                                />
                                <p className="text-xs luxury-body text-luxury-charcoal/50 mt-1">Enter 10-digit US phone number</p>
                            </div>

                            {/* Security Notice */}
                            <div className="text-center text-sm luxury-body text-luxury-charcoal/60 bg-luxury-cream/30 rounded-xl p-4">
                                <p>🔒 Your payment is secure and encrypted</p>
                                <p className="mt-1">By clicking below, you agree to our terms of service and privacy policy</p>
                            </div>
                        </form>
                    </motion.div>

                    {/* Order Summary */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="space-y-6 md:space-y-8"
                    >
                        {/* Selected Plan Details */}
                        <div className={`rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden ${currentTier.highlighted
                            ? 'bg-luxury-cream/60 border-2 border-luxury-gold'
                            : currentTier.bestValue
                                ? 'bg-luxury-pink-bg/30 border-2 border-luxury-accent/50'
                                : 'bg-luxury-warm-white border-2 border-luxury-charcoal'
                            }`}>
                            {currentTier.badge && (
                                <div className={`absolute top-2 md:top-4 right-[-30px] px-6 md:px-8 py-1 transform rotate-45 text-xs font-bold ${currentTier.highlighted
                                    ? 'bg-luxury-gold text-luxury-charcoal'
                                    : 'bg-luxury-accent text-luxury-warm-white'
                                    }`}>
                                    {currentTier.badge}
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className="text-xl md:text-2xl luxury-heading mb-2 text-luxury-charcoal">
                                    {currentTier.name}
                                </h3>
                                <p className="text-sm md:text-base luxury-body text-luxury-charcoal/70 mb-3">
                                    {currentTier.tagline}
                                </p>
                                <div className="text-2xl md:text-3xl mb-2">
                                    {currentTier.originalPrice && (
                                        <span className="line-through text-luxury-charcoal/40 mr-2 md:mr-4 font-semibold">
                                            ${currentTier.originalPrice}
                                        </span>
                                    )}
                                    <span className={`font-semibold ${currentTier.highlighted ? 'text-luxury-green' : currentTier.bestValue ? 'text-luxury-accent' : 'text-luxury-green'
                                        }`}>
                                        ${currentTier.price}
                                    </span>
                                    <span className="text-luxury-charcoal/60 text-sm ml-2">
                                        {currentTier.duration}
                                    </span>
                                </div>
                                {currentTier.monthlyValue && (
                                    <p className="luxury-body text-luxury-charcoal/70 text-sm italic mb-2">
                                        Only ${currentTier.monthlyValue}/month value
                                    </p>
                                )}
                                {currentTier.savings && (
                                    <span className="inline-block bg-luxury-green/10 text-luxury-green px-3 py-1 rounded-full text-sm font-semibold">
                                        Save ${currentTier.savings} ({currentTier.savingsPercent}% OFF)
                                    </span>
                                )}
                            </div>

                            <div className="mb-4">
                                <h4 className="luxury-heading text-luxury-charcoal mb-3">What&apos;s Included:</h4>
                                <ul className="space-y-2">
                                    {currentTier.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 md:gap-3">
                                            <CheckCircle className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5 ${currentTier.highlighted ? 'text-luxury-gold' : 'text-luxury-accent'
                                                }`} />
                                            <span className="luxury-body text-luxury-charcoal/80 text-sm md:text-base">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Order Total */}
                        <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-luxury-cream">
                            <div className="border-b-2 border-luxury-charcoal/10 pb-4 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal">You Pay:</span>
                                    <span className={`text-3xl md:text-4xl font-bold ${currentTier.highlighted ? 'text-luxury-green' : currentTier.bestValue ? 'text-luxury-accent' : 'text-luxury-green'
                                        }`}>
                                        ${currentTier.price}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs luxury-body text-luxury-charcoal/60">
                                        One-time payment • No subscriptions
                                    </p>
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                        <Clock className="w-3 h-3 text-luxury-accent" />
                                        <span className="text-xs luxury-body text-luxury-accent font-semibold">
                                            Offer expires in {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Button */}
                            <button
                                type="button"
                                disabled={isProcessing}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    trackCTAClick('Transform My Style Now', 'Checkout Main Button', currentTier.price, 'USD', 'USA_Monthly_Tiered');
                                    await processPayment();
                                }}
                                className={`w-full py-4 md:py-5 px-4 md:px-6 rounded-full text-lg md:text-xl luxury-body shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 mt-4 hover:scale-[1.02] transform font-semibold ${currentTier.highlighted
                                    ? 'bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white'
                                    : currentTier.bestValue
                                        ? 'bg-luxury-charcoal hover:bg-luxury-charcoal/90 text-luxury-warm-white'
                                        : 'bg-luxury-green hover:bg-luxury-green/90 text-luxury-warm-white'
                                    }`}
                            >
                                {isProcessing ? 'Processing...' : `🔥 Get ${currentTier.name} - $${currentTier.price} →`}
                            </button>

                            <div className="text-center text-xs md:text-sm luxury-body text-luxury-charcoal/60 mt-3">
                                <p>💳 Secure payment via Razorpay</p>
                            </div>
                        </div>

                        {/* Trust Indicators */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 md:p-6 shadow-lg border border-white/20">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-gray-600 font-light">
                                    <Shield className="w-5 h-5 text-luxury-accent" />
                                    <span>Secure payment with Razorpay</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 font-light">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    <span>7-day money-back guarantee</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 font-light">
                                    <Users className="w-5 h-5 text-purple-500" />
                                    <span>200+ successful transformations</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 font-light">
                                    <Crown className="w-5 h-5 text-luxury-gold" />
                                    <span>One-time payment, no subscriptions</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Floating WhatsApp Button - Mobile Only */}
            <a
                href="https://wa.me/919130048899?text=Hi%20Iconik%20I'm%20looking%20to%20buy%20but%20have%20a%20few%20questions!"
                target="_blank"
                rel="noopener noreferrer"
                className="md:hidden fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
                aria-label="Chat on WhatsApp"
            >
                <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            </a>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
                <div className="text-luxury-charcoal luxury-body">Loading...</div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
