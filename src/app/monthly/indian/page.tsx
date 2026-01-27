'use client';

import Head from 'next/head';
import { trackCTAClick, trackPageView, trackViewContent } from '@/lib/metaPixel';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Clock,
    Users,
    Heart,
    Zap,
    Target,
    TrendingUp,
    Menu,
    X,
    Star,
    Sparkles,
    Gem,
    Shield,
    Trophy,
    Award,
    Crown,
    Calendar,
    MessageCircle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

// Tier types
type TierKey = 'essentials' | 'signature' | 'vip';

interface Tier {
    key: TierKey;
    name: string;
    tagline: string;
    monthlyPrice: number;
    quarterlyPrice: number;
    quarterlyDiscount: number;
    duration: string;
    badge?: string;
    badgeIcon?: string;
    features: string[];
    ctaText: string;
    highlighted?: boolean;
    bestValue?: boolean;
    includedAddons?: string;
}

const tiers: Tier[] = [
    {
        key: 'essentials',
        name: 'ICONIK Essentials',
        tagline: 'Start your style journey',
        monthlyPrice: 999,
        quarterlyPrice: 2697,
        quarterlyDiscount: 10,
        duration: '/month',
        features: [
            '1 Virtual Style Consultation (20 min)',
            'Personalized Style Blueprint',
            '16 Virtual Outfit Previews',
            'Hairstyles & Makeup Blueprint',
            'Shopping Guide',
            'Email Support'
        ],
        ctaText: 'Start with Essentials'
    },
    {
        key: 'signature',
        name: 'ICONIK Signature',
        tagline: 'Transform your wardrobe this season',
        monthlyPrice: 1499,
        quarterlyPrice: 4047,
        quarterlyDiscount: 10,
        duration: '/month',
        badge: 'MOST POPULAR',
        badgeIcon: '⭐',
        features: [
            'Everything in Essentials',
            '60 AI Outfit Renders (20/month)',
            '3 Live Styling Calls (monthly)',
            'Seasonal Shopping Guide',
            '1 Style Blueprint Refresh',
            'WhatsApp Support (4hr response)'
        ],
        ctaText: 'Join Signature',
        highlighted: true
    },
    {
        key: 'vip',
        name: 'ICONIK VIP',
        tagline: 'Premium styling + Daily WhatsApp access',
        monthlyPrice: 2499,
        quarterlyPrice: 6747,
        quarterlyDiscount: 10,
        duration: '/month',
        badge: 'BEST VALUE',
        badgeIcon: '💎',
        features: [
            'Everything in Signature',
            'Unlimited AI Outfit Renders',
            'Daily WhatsApp Stylist Access (9am-9pm)',
            'Priority AI Rendering (24hr)',
            '2 Blueprint Overhauls/quarter',
            'All Add-ons Included (₹1,797 value)'
        ],
        ctaText: 'Apply for VIP',
        bestValue: true,
        includedAddons: 'Virtual Preview ₹999 + Shopping Guide ₹499 + Diet Plan ₹299'
    }
];

export default function MonthlyIndianPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    // Track page view and product view on mount
    useEffect(() => {
        trackPageView('India_Monthly');
        trackViewContent('ICONIK Monthly Subscription India', 1499, ['iconik_monthly_india'], 'INR', 'India_Monthly');
    }, []);

    // Transformation images data - India focused
    const transformationImages = useMemo(() => [
        {
            src: '/transformation-1.webp',
            testimonial: 'Finally found outfits that work for office AND festive occasions. My colleagues keep asking who styled me!',
            name: 'Priya M., Mumbai'
        },
        {
            src: '/transformation-2.webp',
            testimonial: 'The monthly styling calls have been a game-changer. I feel confident for every wedding function now.',
            name: 'Ananya R., Bangalore'
        },
        {
            src: '/transformation-3.webp',
            testimonial: 'Post-pregnancy, I had no idea what suited my new body. ICONIK helped me feel like myself again.',
            name: 'Shreya K., Pune'
        }
    ], []);

    // Navigation functions
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % transformationImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + transformationImages.length) % transformationImages.length);
    };

    const goToImage = (index: number) => {
        setCurrentImageIndex(index);
    };

    // Preload all images for faster transitions
    useEffect(() => {
        transformationImages.forEach((image) => {
            const img = new window.Image();
            img.src = image.src;
        });
    }, [transformationImages]);

    const testimonials = [
        {
            name: 'Kavitha S., Chennai',
            story: 'I struggled with office wear that was both professional and comfortable in Chennai heat. ICONIK gave me breathable yet elegant options.',
            image: '/testimonial-priya.webp'
        },
        {
            name: 'Meera P., Delhi',
            story: 'From Diwali to Holi, my festive wardrobe is now sorted. The monthly calls help me plan ahead for every occasion.',
            image: '/testimonial-ananya.webp'
        },
        {
            name: 'Divya R., Hyderabad',
            story: 'The VIP WhatsApp access is incredible. I get outfit advice before every important meeting within hours!',
            image: '/testimonial-shreya.webp'
        }
    ];

    const faqs = [
        {
            question: 'Is this a subscription? Will I be charged monthly?',
            answer: 'Yes, this is a monthly subscription. You can choose to pay monthly or save 10% with quarterly billing. Cancel anytime with no questions asked.'
        },
        {
            question: 'What\'s the difference between the tiers?',
            answer: 'Essentials is perfect for getting started with personal styling. Signature adds monthly styling calls and WhatsApp support for ongoing guidance. VIP includes unlimited access, daily WhatsApp support, and all premium add-ons included.'
        },
        {
            question: 'Can I upgrade or downgrade my plan?',
            answer: 'Absolutely! You can change your plan anytime. Upgrades are effective immediately, and downgrades apply from your next billing cycle.'
        },
        {
            question: 'What if I\'m not satisfied?',
            answer: 'We offer a 7-day money-back guarantee. If you\'re not completely satisfied with your first month, we\'ll refund your payment in full.'
        },
        {
            question: 'Do you style for Indian occasions like weddings and festivals?',
            answer: 'Yes! We specialize in styling for Indian occasions - from office wear to wedding functions, Diwali celebrations to casual weekends. We understand traditional and fusion wear.'
        },
        {
            question: 'What\'s included in the "All Add-ons" for VIP?',
            answer: 'VIP members get Virtual Outfit Preview (₹999 value), Smart Shopper\'s Guide (₹499 value), and Diva Diet Plan (₹299 value) - all included at no extra cost.'
        },
        {
            question: 'How does WhatsApp support work?',
            answer: 'Signature members get responses within 4 hours during business hours. VIP members get daily access from 9am-9pm with priority responses, perfect for last-minute outfit decisions!'
        },
        {
            question: 'Can I pause my subscription instead of cancelling?',
            answer: 'Yes! You can pause your subscription for up to 2 months per year. Just reach out to your stylist or email us.'
        }
    ];

    // Render tier card
    const renderTierCard = (tier: Tier, index: number) => {
        const isHighlighted = tier.highlighted;
        const isBestValue = tier.bestValue;

        return (
            <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:-translate-y-2 ${isHighlighted
                    ? 'border-luxury-gold bg-luxury-cream/60 shadow-2xl scale-[1.02] md:scale-105'
                    : isBestValue
                        ? 'border-luxury-accent/50 bg-luxury-pink-bg/30 shadow-xl'
                        : 'border-luxury-cream bg-luxury-cream/40 hover:bg-luxury-cream/60'
                    }`}
            >
                {/* Badge */}
                {tier.badge && (
                    <div className={`absolute top-0 left-0 right-0 py-2 text-center text-sm font-bold ${isHighlighted
                        ? 'bg-luxury-gold text-luxury-charcoal'
                        : 'bg-luxury-accent text-luxury-warm-white'
                        }`}>
                        {tier.badgeIcon} {tier.badge}
                    </div>
                )}

                <div className={`p-6 md:p-8 ${tier.badge ? 'pt-12' : ''}`}>
                    {/* Tier Name */}
                    <h3 className={`text-xl md:text-2xl luxury-heading text-center mb-2 ${isHighlighted ? 'text-luxury-charcoal' : 'text-luxury-charcoal'
                        }`}>
                        {tier.name}
                    </h3>

                    {/* Price */}
                    <div className="text-center mb-4">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className={`text-4xl md:text-5xl font-bold ${isHighlighted ? 'text-luxury-green' : isBestValue ? 'text-luxury-accent' : 'text-luxury-green'
                                }`}>
                                ₹{tier.monthlyPrice.toLocaleString()}
                            </span>
                            <span className="text-luxury-charcoal/60 luxury-body text-sm">
                                {tier.duration}
                            </span>
                        </div>

                        {/* Quarterly option */}
                        <p className="luxury-body text-luxury-charcoal/70 text-sm mt-2">
                            or ₹{tier.quarterlyPrice.toLocaleString()}/quarter <span className="text-luxury-green font-semibold">(Save 10%)</span>
                        </p>
                    </div>

                    {/* Tagline */}
                    <p className="luxury-body text-luxury-charcoal/70 text-center text-sm mb-6">
                        {tier.tagline}
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                        {tier.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isHighlighted ? 'text-luxury-gold' : 'text-luxury-green'
                                    }`} />
                                <span className="luxury-body text-luxury-charcoal/80 text-sm">
                                    {feature}
                                </span>
                            </li>
                        ))}
                    </ul>

                    {/* Included Addons for VIP */}
                    {tier.includedAddons && (
                        <div className="bg-luxury-accent/10 rounded-xl p-3 mb-6 text-center">
                            <p className="text-xs luxury-body text-luxury-accent font-medium">
                                Includes: {tier.includedAddons}
                            </p>
                        </div>
                    )}

                    {/* CTA Button */}
                    <Link
                        href={`/monthly/indian/checkout?tier=${tier.key}`}
                        onClick={() => {
                            trackCTAClick(tier.ctaText, 'Pricing Section', tier.monthlyPrice, 'INR', 'India_Monthly');
                        }}
                        className={`block w-full text-center py-3 md:py-4 rounded-full transition-all duration-300 luxury-body font-semibold ${isHighlighted
                            ? 'bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white shadow-lg hover:shadow-xl text-lg'
                            : isBestValue
                                ? 'bg-luxury-charcoal hover:bg-luxury-charcoal/90 text-luxury-warm-white'
                                : 'bg-luxury-green hover:bg-luxury-green/90 text-luxury-warm-white'
                            }`}
                    >
                        {tier.ctaText}
                    </Link>
                </div>
            </motion.div>
        );
    };

    return (
        <>
            <Head>
                <title>ICONIK - Your Personal Stylist. Every Month. Forever. | Monthly Subscription</title>
                <meta name="description" content="ICONIK Monthly Subscription: Get your personal stylist for ₹999/month. Transform your wardrobe with monthly styling calls, outfit previews, and WhatsApp support." />
                <meta name="keywords" content="personal stylist subscription, monthly styling, wardrobe transformation, Indian fashion, style consultation" />
                <meta property="og:title" content="ICONIK - Your Personal Stylist. Every Month. Forever." />
                <meta property="og:description" content="Get your personal stylist for ₹999/month. Monthly styling calls, outfit previews, and WhatsApp support." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://playernumberone.com/monthly/indian" />
                <link rel="canonical" href="https://playernumberone.com/monthly/indian" />
            </Head>
            <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal scroll-smooth overflow-x-hidden pb-20 md:pb-0">
                {/* Navigation */}
                <nav className="fixed top-0 w-full bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream z-50">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            <div className="flex items-center">
                                <span className="text-3xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                            </div>
                            <div className="hidden md:flex items-center space-x-12">
                                <a href="#features" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Features</a>
                                <a href="#testimonials" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Stories</a>
                                <a href="#pricing" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Pricing</a>
                                <a href="#faq" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">FAQ</a>
                                <Link
                                    href="/monthly/indian/checkout?tier=signature"
                                    className="bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-3 rounded-full transition-all duration-300 luxury-body"
                                >
                                    Get Started
                                </Link>
                            </div>
                            {/* Mobile menu button */}
                            <div className="md:hidden">
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="text-luxury-charcoal/60 hover:text-luxury-charcoal p-2"
                                >
                                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="md:hidden bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream"
                        >
                            <div className="px-6 py-6 space-y-4">
                                <a href="#features" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Features</a>
                                <a href="#testimonials" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Stories</a>
                                <a href="#pricing" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Pricing</a>
                                <a href="#faq" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">FAQ</a>
                                <Link
                                    href="/monthly/indian/checkout?tier=signature"
                                    className="block bg-luxury-accent text-luxury-warm-white px-8 py-4 rounded-full luxury-body text-center mt-6 transition-all duration-300"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </nav>

                {/* Hero Section */}
                <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-6 lg:px-8 relative" id="hero">
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="text-center mb-8">
                            {/* Press Logos */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="mt-2 md:mt-4 mb-3 md:mb-4"
                            >
                                <p className="luxury-body text-luxury-charcoal/60 mb-4">Featured in</p>
                                <div className="flex items-center justify-center gap-8 md:gap-12">
                                    <Image
                                        src="/times-of-india-logo.png"
                                        alt="Times of India"
                                        width={120}
                                        height={40}
                                        className="opacity-40 hover:opacity-70 transition-opacity h-[40px] w-auto md:h-[50px]"
                                    />
                                    <Image
                                        src="/femina-logo.png"
                                        alt="Femina"
                                        width={120}
                                        height={40}
                                        className="opacity-40 hover:opacity-70 transition-opacity h-[40px] w-auto md:h-[50px]"
                                    />
                                    <Image
                                        src="/vogue-india-logo.png"
                                        alt="Vogue India"
                                        width={120}
                                        height={40}
                                        className="opacity-40 hover:opacity-70 transition-opacity h-[40px] w-auto md:h-[50px]"
                                    />
                                </div>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-4xl md:text-6xl lg:text-7xl luxury-heading text-luxury-charcoal mb-4 md:mb-6 leading-[0.95] tracking-tight"
                            >
                                Your Personal Stylist.<br />
                                <span className="text-luxury-accent">Every Month.</span> <span className="text-luxury-green">Forever.</span>
                            </motion.h1>

                            {/* Hero Subtitle */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="text-lg md:text-xl lg:text-2xl luxury-body text-luxury-charcoal/80 max-w-4xl mx-auto mb-6 leading-relaxed"
                            >
                                Monthly styling calls, outfit previews, and WhatsApp support starting at <span className="font-semibold text-luxury-green">₹999/month</span>
                            </motion.p>

                            {/* Membership Benefits Quick List */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                                className="flex flex-wrap justify-center gap-4 mb-8"
                            >
                                <div className="flex items-center gap-2 bg-luxury-cream/50 px-4 py-2 rounded-full">
                                    <Calendar className="w-4 h-4 text-luxury-green" />
                                    <span className="text-sm luxury-body">Monthly Styling Calls</span>
                                </div>
                                <div className="flex items-center gap-2 bg-luxury-cream/50 px-4 py-2 rounded-full">
                                    <MessageCircle className="w-4 h-4 text-luxury-green" />
                                    <span className="text-sm luxury-body">WhatsApp Support</span>
                                </div>
                                <div className="flex items-center gap-2 bg-luxury-cream/50 px-4 py-2 rounded-full">
                                    <Sparkles className="w-4 h-4 text-luxury-green" />
                                    <span className="text-sm luxury-body">AI Outfit Previews</span>
                                </div>
                            </motion.div>

                            {/* Testimonial Slideshow */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="max-w-4xl mx-auto mb-4 md:mb-6"
                            >
                                <div className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-luxury-cream">
                                    <div className="text-center mb-4">
                                        <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal">
                                            Member Transformations
                                        </h3>
                                    </div>

                                    {/* Single Transformation Image with Arrow */}
                                    <div className="flex items-center justify-center gap-4 md:gap-6">
                                        {/* Left Arrow */}
                                        <button
                                            onClick={prevImage}
                                            className="p-2 md:p-3 bg-luxury-accent/10 hover:bg-luxury-accent/20 rounded-full transition-all duration-300 group"
                                        >
                                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-luxury-charcoal group-hover:text-luxury-green" />
                                        </button>

                                        {/* 1:1 Square Image */}
                                        <div className="relative w-64 h-64 md:w-80 md:h-80 bg-luxury-cream/30 rounded-2xl overflow-hidden border-2 border-luxury-cream">
                                            <Image
                                                src={transformationImages[currentImageIndex].src}
                                                alt="Member Transformation"
                                                width={320}
                                                height={320}
                                                className="w-full h-full object-cover"
                                                priority
                                                loading="eager"
                                            />
                                        </div>

                                        {/* Right Arrow */}
                                        <button
                                            onClick={nextImage}
                                            className="p-2 md:p-3 bg-luxury-accent/10 hover:bg-luxury-accent/20 rounded-full transition-all duration-300 group"
                                        >
                                            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-luxury-charcoal group-hover:text-luxury-green" />
                                        </button>
                                    </div>

                                    {/* Testimonial Text Below Image */}
                                    <div className="text-center mt-6 px-4">
                                        <p className="text-luxury-charcoal text-sm md:text-base luxury-body leading-relaxed mb-2">
                                            &quot;{transformationImages[currentImageIndex].testimonial}&quot;
                                        </p>
                                        <p className="text-luxury-green text-xs md:text-sm luxury-body font-medium">
                                            - {transformationImages[currentImageIndex].name}
                                        </p>
                                    </div>

                                    {/* Dots Indicator */}
                                    <div className="flex justify-center gap-2 mt-6">
                                        {transformationImages.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => goToImage(index)}
                                                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-luxury-accent' : 'bg-luxury-accent/30'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                            >
                                <Link
                                    href="/monthly/indian/checkout?tier=signature"
                                    onClick={() => {
                                        trackCTAClick('Start Your Membership', 'Hero Section', 1499, 'INR', 'India_Monthly');
                                    }}
                                    className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-12 md:px-16 py-4 md:py-6 text-lg md:text-xl rounded-full transition-all duration-500 transform hover:-translate-y-1 luxury-body"
                                >
                                    Start Your Membership <ArrowRight className="ml-3 h-5 w-5 inline" />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Elegant Stats */}
                <section className="py-12 md:py-20 bg-luxury-cream/30">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
                            <div className="text-center group">
                                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                                    247+
                                </div>
                                <div className="luxury-body text-luxury-charcoal/70">Active Members</div>
                            </div>
                            <div className="text-center group">
                                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                                    95%
                                </div>
                                <div className="luxury-body text-luxury-charcoal/70">Member Retention</div>
                            </div>
                            <div className="text-center group">
                                <div className="flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                                    <span className="text-4xl md:text-6xl luxury-heading text-luxury-green">4.9</span>
                                    <Star className="h-6 w-6 md:h-8 md:w-8 text-luxury-gold fill-current ml-2" />
                                </div>
                                <div className="luxury-body text-luxury-charcoal/70">Member Rating</div>
                            </div>
                            <div className="text-center group">
                                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                                    7
                                </div>
                                <div className="luxury-body text-luxury-charcoal/70">Days Money-Back</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Membership > One-Time Section */}
                <section className="py-16 md:py-24 bg-luxury-warm-white">
                    <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl md:text-5xl luxury-heading mb-6 text-luxury-charcoal">
                                Why Membership Beats One-Time Consulting
                            </h2>
                            <p className="luxury-body text-luxury-charcoal/70 text-lg">
                                Your style evolves. Your stylist should evolve with you.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* One-Time Column */}
                            <div className="bg-luxury-cream/30 rounded-2xl p-6 md:p-8 border border-luxury-cream/50">
                                <h3 className="text-xl luxury-heading text-luxury-charcoal/60 mb-6 text-center">One-Time Consultation</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal/70">Static advice that gets outdated</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal/70">No support for new occasions</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal/70">Weight/body changes? Start over</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal/70">Seasonal trends? On your own</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Membership Column */}
                            <div className="bg-luxury-green/10 rounded-2xl p-6 md:p-8 border-2 border-luxury-green/30">
                                <h3 className="text-xl luxury-heading text-luxury-green mb-6 text-center">ICONIK Membership</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal/80">Evolving style guidance every month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal/80">Wedding? Diwali? We&apos;ve got you</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal/80">Body changes? Blueprint refresh included</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                                        <span className="luxury-body text-luxury-charcoal/80">Seasonal shopping guides quarterly</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="pt-8 pb-20 md:pt-12 md:pb-32 bg-luxury-cream/20 relative">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
                        <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">What Members Receive</h2>
                        <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
                            Everything you need to look and feel your best, every single month.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
                        {[
                            { icon: <Calendar className="h-6 w-6 text-luxury-green" />, title: "Monthly Styling Calls" },
                            { icon: <Sparkles className="h-6 w-6 text-luxury-green" />, title: "AI Outfit Previews" },
                            { icon: <MessageCircle className="h-6 w-6 text-luxury-green" />, title: "WhatsApp Support" },
                            { icon: <Gem className="h-6 w-6 text-luxury-green" />, title: "Seasonal Shopping Guides" },
                            { icon: <Heart className="h-6 w-6 text-luxury-green" />, title: "Festival & Wedding Styling" },
                            { icon: <Trophy className="h-6 w-6 text-luxury-green" />, title: "Priority Stylist Access" }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="p-5 md:p-6 bg-luxury-warm-white backdrop-blur-sm border border-luxury-cream hover:bg-luxury-cream/40 transition-all duration-300 rounded-xl hover:-translate-y-1 group"
                            >
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                                    <h3 className="text-sm md:text-base luxury-heading text-center text-luxury-charcoal">{item.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-20 md:py-32 bg-luxury-warm-white">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
                        <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">Member Stories</h2>
                        <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
                            Hear from women who transformed their style with ICONIK membership.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="p-8 md:p-10 bg-luxury-cream/30 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-cream/50 transition-all duration-300 rounded-2xl hover:-translate-y-2 group"
                            >
                                <div className="space-y-6">
                                    <div className="aspect-square bg-luxury-cream/50 flex items-center justify-center rounded-xl overflow-hidden">
                                        <Image
                                            src={testimonial.image || "/placeholder.svg"}
                                            alt={testimonial.name}
                                            width={300}
                                            height={300}
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                    </div>
                                    <p className="luxury-body text-luxury-charcoal/80 text-center text-lg leading-relaxed">
                                        &ldquo;{testimonial.story}&rdquo;
                                    </p>
                                    <div className="text-center">
                                        <p className="luxury-body text-luxury-charcoal/60 mb-3">{testimonial.name}</p>
                                        <div className="flex justify-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="h-4 w-4 text-luxury-gold fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Pricing Section - 3-Tier Cards */}
                <section id="pricing" className="py-20 md:py-32 bg-luxury-cream/20">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
                        <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">Choose Your Plan</h2>
                        <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
                            Cancel anytime. 7-day money-back guarantee on all plans.
                        </p>
                    </div>

                    {/* Desktop: 3 columns, Mobile: Stacked (Signature first) */}
                    <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                        {/* Desktop Layout */}
                        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
                            {tiers.map((tier, index) => renderTierCard(tier, index))}
                        </div>

                        {/* Mobile Layout - Signature first, then VIP, then Essentials */}
                        <div className="md:hidden space-y-6">
                            {renderTierCard(tiers[1], 0)} {/* Signature */}
                            {renderTierCard(tiers[2], 1)} {/* VIP */}
                            {renderTierCard(tiers[0], 2)} {/* Essentials */}
                        </div>
                    </div>

                    {/* Trust indicators below pricing */}
                    <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 mt-12">
                        <div className="flex flex-wrap items-center justify-center gap-6 text-luxury-charcoal/60 luxury-body text-sm">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                <span>Secure Payment</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                <span>7-Day Money Back</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Crown className="w-5 h-5" />
                                <span>247+ Active Members</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Problem Section - India Specific */}
                <section className="py-20 md:py-32 px-4 bg-luxury-warm-white">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-8 md:mb-16"
                        >
                            <h2 className="text-4xl md:text-6xl luxury-heading mb-8 text-luxury-charcoal">
                                Sound Familiar?
                            </h2>
                            <p className="text-xl md:text-2xl luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto">
                                These are the exact problems our members solved.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                            {[
                                {
                                    icon: Users,
                                    text: 'Looking professional in a conservative office environment?',
                                    color: 'rose'
                                },
                                {
                                    icon: Heart,
                                    text: 'Confused about what to wear for every wedding function?',
                                    color: 'orange'
                                },
                                {
                                    icon: Clock,
                                    text: 'Monsoon wardrobe struggles? Nothing fits the weather!',
                                    color: 'blue'
                                },
                                {
                                    icon: Target,
                                    text: 'Post-pregnancy body changes affecting your confidence?',
                                    color: 'purple'
                                },
                                {
                                    icon: Zap,
                                    text: 'Too many kurtas, not sure how to style them modern?',
                                    color: 'green'
                                },
                                {
                                    icon: TrendingUp,
                                    text: 'Diwali, Holi, Navratri—different outfit stress every festival?',
                                    color: 'gold'
                                }
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                    className="group relative bg-luxury-cream/40 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 hover:-translate-y-2"
                                >
                                    <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center bg-luxury-accent/10`}>
                                        <item.icon className="w-6 h-6 text-luxury-accent" />
                                    </div>
                                    <p className="luxury-body text-luxury-charcoal/80 text-center">
                                        {item.text}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <Link
                                href="/monthly/indian/checkout?tier=signature"
                                onClick={() => {
                                    trackCTAClick('Solve These Problems', 'Problem Section', 1499, 'INR', 'India_Monthly');
                                }}
                                className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-4 text-lg rounded-full transition-all duration-300 luxury-body"
                            >
                                Solve These Problems <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="py-20 md:py-32 bg-luxury-cream/20">
                    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">
                                Frequently Asked Questions
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="bg-luxury-warm-white rounded-2xl border border-luxury-cream overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                        className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
                                    >
                                        <span className="luxury-heading text-luxury-charcoal text-lg">
                                            {faq.question}
                                        </span>
                                        <ArrowRight
                                            className={`w-5 h-5 text-luxury-accent transition-transform duration-300 flex-shrink-0 ${expandedFaq === index ? 'rotate-90' : ''
                                                }`}
                                        />
                                    </button>
                                    {expandedFaq === index && (
                                        <div className="px-6 pb-5">
                                            <p className="luxury-body text-luxury-charcoal/70 leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20 md:py-32 bg-luxury-accent/5">
                    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-5xl luxury-heading mb-6 text-luxury-charcoal">
                            Ready to Transform Your Style?
                        </h2>
                        <p className="luxury-body text-luxury-charcoal/70 text-lg mb-8 max-w-2xl mx-auto">
                            Join 247+ members who never stress about &quot;what to wear&quot; anymore.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/monthly/indian/checkout?tier=essentials"
                                onClick={() => {
                                    trackCTAClick('Start with Essentials', 'Final CTA', 999, 'INR', 'India_Monthly');
                                }}
                                className="bg-luxury-green hover:bg-luxury-green/90 text-luxury-warm-white px-8 py-4 rounded-full transition-all duration-300 luxury-body"
                            >
                                Start with Essentials - ₹999/mo
                            </Link>
                            <Link
                                href="/monthly/indian/checkout?tier=signature"
                                onClick={() => {
                                    trackCTAClick('Join Signature', 'Final CTA', 1499, 'INR', 'India_Monthly');
                                }}
                                className="bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white px-8 py-4 rounded-full transition-all duration-300 luxury-body font-semibold"
                            >
                                Join Signature ⭐ - ₹1,499/mo
                            </Link>
                            <Link
                                href="/monthly/indian/checkout?tier=vip"
                                onClick={() => {
                                    trackCTAClick('Apply for VIP', 'Final CTA', 2499, 'INR', 'India_Monthly');
                                }}
                                className="bg-luxury-charcoal hover:bg-luxury-charcoal/90 text-luxury-warm-white px-8 py-4 rounded-full transition-all duration-300 luxury-body"
                            >
                                Apply for VIP 💎 - ₹2,499/mo
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer spacing for mobile */}
                <div className="h-20 md:hidden"></div>
            </div>
        </>
    );
}
