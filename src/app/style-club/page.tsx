'use client';

import { trackCTAClick, trackPageView, trackViewContent } from '@/lib/metaPixel';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    CheckCircle,
    ArrowLeft,
    ArrowRight,
    Clock,
    Users,
    User,
    Star,
    Sparkles,
    Shield,
    ShoppingBag,
    X,
    Zap,
    Menu
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

export default function StyleClubPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const transformationImages = useMemo(() => [
        {
            src: '/transformation-1.webp',
            testimonial: 'Finally found my signature style! I feel confident every day.',
            name: 'Shreya, Mumbai'
        },
        {
            src: '/transformation-2.webp',
            testimonial: 'The color palette changed everything. I get compliments daily!',
            name: 'Kavya, Delhi'
        },
        {
            src: '/transformation-3.webp',
            testimonial: 'Shopping is no longer overwhelming. I know exactly what works for me.',
            name: 'Priya, Bangalore'
        }
    ], []);

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % transformationImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + transformationImages.length) % transformationImages.length);
    };

    const goToImage = (index: number) => {
        setCurrentImageIndex(index);
    };

    // Track page view
    useEffect(() => {
        trackPageView('Style_Club_Landing');
        trackViewContent('Style Club Subscription', 1699, ['style_club_monthly'], 'INR', 'Style_Club');
    }, []);

    useEffect(() => {
        transformationImages.forEach((image) => {
            const img = new window.Image();
            img.src = image.src;
        });
    }, [transformationImages]);

    const faqs = [
        {
            question: 'When do I get my first outfits?',
            answer: 'On the 1st of next month via WhatsApp (fully personalized based on your consultation today).'
        },
        {
            question: 'What if I haven\'t received my blueprint yet?',
            answer: 'Perfect! We\'ll use what we discussed in your consultation to start curating. Once your blueprint is ready, we\'ll refine future batches.'
        },
        {
            question: 'What budget will you shop within?',
            answer: 'You tell us! Most members spend ₹2-5K/month, but we can work with any range.'
        },
        {
            question: 'What if I don\'t like an outfit?',
            answer: 'Just ping us on WhatsApp. We\'ll send alternatives within 48 hours.'
        },
        {
            question: 'Can I pause if I don\'t need outfits one month?',
            answer: 'Yes! Pause or cancel anytime. No penalties.'
        },
        {
            question: 'Do I need to buy EVERY outfit you send?',
            answer: 'Nope! Think of it as curated options. Buy what you love, skip what you don\'t.'
        }
    ];

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal scroll-smooth overflow-x-hidden">
            {/* Header */}
            <nav className="sticky top-0 w-full bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream z-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center">
                            <span className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#problem" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">Why Join?</a>
                            <a href="#features" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">What You Get</a>
                            <a href="#reviews" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">Stories</a>
                            <a href="#pricing" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">Pricing</a>
                            <Link
                                href="/style-club/subscribe"
                                className="bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white px-6 py-2.5 rounded-full transition-all duration-300 luxury-body font-medium shadow-lg hover:shadow-xl"
                            >
                                Join the Club
                            </Link>
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="md:hidden bg-luxury-warm-white border-t border-luxury-cream"
                    >
                        <div className="px-6 py-6 space-y-4 flex flex-col">
                            <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="luxury-body text-lg">Why Join?</a>
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="luxury-body text-lg">What You Get</a>
                            <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="luxury-body text-lg">Stories</a>
                            <Link
                                href="/style-club/subscribe"
                                className="bg-luxury-accent text-luxury-warm-white px-6 py-3 rounded-full text-center luxury-body font-medium"
                            >
                                Join the Club
                            </Link>
                        </div>
                    </motion.div>
                )}
            </nav>

            {/* Urgency Banner */}
            <div className="bg-luxury-charcoal text-luxury-warm-white py-2.5 text-center px-4">
                <p className="text-sm md:text-base font-medium flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-luxury-gold" />
                    <span>Limited availability: Only <span className="text-luxury-gold font-bold">12 new memberships</span> open this month.</span>
                </p>
            </div>

            {/* Hero Section */}
            <section className="pt-16 pb-20 md:pt-24 md:pb-32 px-4 relative overflow-hidden">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
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

                        <h1 className="text-4xl md:text-6xl lg:text-7xl luxury-heading text-luxury-charcoal mb-6 leading-[1.1]">
                            You Know <span className="text-luxury-accent">WHAT</span> to Wear.<br className="hidden md:block" />
                            But <span className="text-luxury-green">WHERE</span> Do You Buy It?
                        </h1>
                        <p className="text-lg md:text-2xl luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto mb-10 leading-relaxed">
                            Join 200+ women who never waste hours scrolling Myntra again.
                        </p>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                            <Link
                                href="/style-club/subscribe"
                                onClick={() => trackCTAClick('Join Style Club', 'Hero', 1699)}
                                className="w-full md:w-auto bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white px-8 py-4 rounded-full text-lg md:text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                Join the Style Club <ArrowRight className="w-5 h-5" />
                            </Link>
                            <p className="text-sm text-luxury-charcoal/60 mt-2 md:mt-0">
                                Starts at ₹1,699/mo • Cancel anytime
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="max-w-4xl mx-auto mb-4 md:mb-6"
                    >
                        <div className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-luxury-cream">
                            <div className="text-center mb-4">
                                <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal">
                                    ICONIK Transformations
                                </h3>
                            </div>

                            <div className="flex items-center justify-center gap-4 md:gap-6">
                                <button
                                    onClick={prevImage}
                                    className="p-2 md:p-3 bg-luxury-accent/10 hover:bg-luxury-accent/20 rounded-full transition-all duration-300 group"
                                >
                                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-luxury-charcoal group-hover:text-luxury-green" />
                                </button>

                                <div className="relative w-64 h-64 md:w-80 md:h-80 bg-luxury-cream/30 rounded-2xl overflow-hidden border-2 border-luxury-cream">
                                    <Image
                                        src={transformationImages[currentImageIndex].src}
                                        alt="Style Transformation"
                                        width={320}
                                        height={320}
                                        className="w-full h-full object-cover"
                                        priority
                                        loading="eager"
                                    />
                                </div>

                                <button
                                    onClick={nextImage}
                                    className="p-2 md:p-3 bg-luxury-accent/10 hover:bg-luxury-accent/20 rounded-full transition-all duration-300 group"
                                >
                                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-luxury-charcoal group-hover:text-luxury-green" />
                                </button>
                            </div>

                            <div className="text-center mt-6 px-4">
                                <p className="text-luxury-charcoal text-sm md:text-base luxury-body leading-relaxed mb-2">
                                    &quot;{transformationImages[currentImageIndex].testimonial}&quot;
                                </p>
                                <p className="text-luxury-green text-xs md:text-sm luxury-body font-medium">
                                    - {transformationImages[currentImageIndex].name}
                                </p>
                            </div>

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
                </div>
            </section>

            {/* The Problem Section */}
            <section id="problem" className="py-20 md:py-28 bg-luxury-cream/30">
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl luxury-heading mb-6">Does this sound familiar?</h2>
                        <p className="text-xl luxury-body text-luxury-charcoal/70 max-w-2xl mx-auto">
                            You know your body type now. You understand what works. <br />But then you open Myntra… and freeze.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: ShoppingBag,
                                title: "The Endless Scroll",
                                desc: "Spending 2 hours scrolling, adding 20 items to cart, and buying nothing because you're unsure."
                            },
                            {
                                icon: X,
                                title: "The Fit Anxiety",
                                desc: '&quot;Will this fabric cling to my tummy? Is this neckline actually right for me?&quot;'
                            },
                            {
                                icon: Users,
                                title: "The Occasion Dilemma",
                                desc: '&quot;Is this too revealing for office? Too plain for the wedding?&quot; Second-guessing every choice.'
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-luxury-warm-white p-8 rounded-2xl border border-luxury-cream/50 shadow-sm"
                            >
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                    <item.icon className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="text-xl mb-3 luxury-heading">{item.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/70">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Solution */}
            <section className="py-20 md:py-32 bg-luxury-charcoal text-luxury-warm-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/pattern-bg.png')]"></div>
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div>
                            <span className="text-luxury-gold font-bold tracking-widest text-sm uppercase mb-2 block">The Solution</span>
                            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 leading-tight">
                                Introducing:<br />
                                The Style Club
                            </h2>
                            <p className="text-xl luxury-body text-luxury-warm-white/80 mb-8 leading-relaxed">
                                Every month, your personal stylist sends you 5 hand-picked, ready-to-buy outfits—with direct links to purchase.
                            </p>
                            <ul className="space-y-4 mb-10">
                                {[
                                    "Curated for YOUR body type, color palette & budget",
                                    "Clickable links (Myntra, Ajio, Nykaa)",
                                    "No guesswork. No endless scrolling.",
                                    "Cancel anytime."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6 text-luxury-green flex-shrink-0" />
                                        <span className="text-lg">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex items-baseline gap-4">
                                <span className="text-4xl md:text-5xl font-bold text-luxury-gold">₹1,699</span>
                                <span className="text-xl opacity-70">/month</span>
                            </div>
                            <Link
                                href="/style-club/subscribe"
                                className="inline-block bg-luxury-warm-white text-luxury-charcoal hover:bg-luxury-gold px-8 py-4 rounded-full text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-gold/20 mt-4"
                            >
                                Get Started Now
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-luxury-gold/20 blur-3xl rounded-full"></div>
                            <div className="relative bg-luxury-charcoal/50 border border-luxury-gold/30 rounded-2xl p-6 backdrop-blur-sm">
                                <div className="space-y-4">
                                    <div className="bg-luxury-warm-white/10 p-4 rounded-xl flex items-center gap-4">
                                        <div className="w-16 h-16 bg-luxury-warm-white/20 rounded-lg flex-shrink-0"></div>
                                        <div>
                                            <div className="h-4 w-32 bg-luxury-warm-white/40 rounded mb-2"></div>
                                            <div className="h-3 w-48 bg-luxury-warm-white/20 rounded"></div>
                                        </div>
                                        <div className="ml-auto">
                                            <ArrowRight className="text-luxury-gold" />
                                        </div>
                                    </div>
                                    <div className="bg-luxury-warm-white/10 p-4 rounded-xl flex items-center gap-4 opacity-80">
                                        <div className="w-16 h-16 bg-luxury-warm-white/20 rounded-lg flex-shrink-0"></div>
                                        <div>
                                            <div className="h-4 w-28 bg-luxury-warm-white/40 rounded mb-2"></div>
                                            <div className="h-3 w-40 bg-luxury-warm-white/20 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="bg-luxury-warm-white/10 p-4 rounded-xl flex items-center gap-4 opacity-60">
                                        <div className="w-16 h-16 bg-luxury-warm-white/20 rounded-lg flex-shrink-0"></div>
                                        <div>
                                            <div className="h-4 w-36 bg-luxury-warm-white/40 rounded mb-2"></div>
                                            <div className="h-3 w-32 bg-luxury-warm-white/20 rounded"></div>
                                        </div>
                                    </div>
                                    <p className="text-center text-luxury-gold text-sm font-medium mt-4">
                                        5 Fully Styled Looks Delivered Monthly
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Detail */}
            <section id="features" className="py-20 md:py-32 bg-luxury-warm-white">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl luxury-heading mb-6">What You Get Every Month</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: ShoppingBag,
                                title: "5 Ready-to-Buy Outfits",
                                desc: "Not just 'suggestions'—fully styled looks with direct links to every piece."
                            },
                            {
                                icon: User,
                                title: "Personalized to You",
                                desc: "Work outfits? Family events? Casual? Based on your consultation & lifestyle."
                            },
                            {
                                icon: Zap,
                                title: "WhatsApp Support",
                                desc: "Confused about sizing? Need a last-minute event outfit? Ping us anytime (48h response)."
                            },
                            {
                                icon: Sparkles,
                                title: "Seasonal Updates",
                                desc: "4 times a year, we refresh your recommendations based on what's new & trending."
                            }
                        ].map((item, i) => (
                            <div key={i} className="text-center p-6 bg-luxury-cream/20 rounded-2xl hover:bg-luxury-cream/40 transition-colors">
                                <div className="w-14 h-14 bg-luxury-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-luxury-accent">
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl mb-3 luxury-heading">{item.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/70 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Join Today */}
            <section className="py-16 bg-luxury-gold/10 border-y border-luxury-gold/20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-luxury-charcoal">
                        Why Join Today (Before You Even Get Your Blueprint)?
                    </h2>
                    <div className="bg-luxury-warm-white rounded-2xl p-8 shadow-sm text-left">
                        <p className="mb-6 font-medium text-lg">Because your first outfit batch arrives on the 1st of next month—which means:</p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                                <span>By the time you receive your blueprint, your shopping is <strong>ALREADY handled</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                                <span>No waiting. No research. Just outfits ready to buy.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                                <span>Start building your wardrobe immediately (instead of &quot;I&apos;ll do it later&quot;)</span>
                            </li>
                        </ul>
                        <p className="text-sm text-luxury-charcoal/60 italic">
                            &quot;Most clients tell us they wish they&apos;d joined earlier. Don&apos;t let analysis paralysis waste your styling breakthrough.&quot;
                        </p>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="reviews" className="py-20 md:py-32 bg-luxury-cream/30">
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <h2 className="text-3xl md:text-5xl luxury-heading text-center mb-16">Member Stories</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-luxury-warm-white p-8 md:p-10 rounded-2xl shadow-sm border border-luxury-cream">
                            <div className="flex gap-1 mb-4 text-luxury-gold">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                            </div>
                            <p className="text-lg md:text-xl luxury-body italic mb-6 leading-relaxed">
                                &quot;I got my blueprint and LOVED it. But then I spent 3 days trying to find the right kurtas. I finally subscribed to Style Club and within a week, I had 5 perfect outfits bookmarked. Game-changer.&quot;
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-luxury-charcoal/10 rounded-full"></div>
                                <div>
                                    <p className="font-bold">Anjali K.</p>
                                    <p className="text-sm text-luxury-charcoal/60">Software Engineer, Bangalore</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-luxury-warm-white p-8 md:p-10 rounded-2xl shadow-sm border border-luxury-cream">
                            <div className="flex gap-1 mb-4 text-luxury-gold">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                            </div>
                            <p className="text-lg md:text-xl luxury-body italic mb-6 leading-relaxed">
                                &quot;My stylist just GETS me now. She knows I hate shopping, so she sends me links, I click, I buy. Done. I actually have a wardrobe I love for the first time in years.&quot;
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-luxury-charcoal/10 rounded-full"></div>
                                <div>
                                    <p className="font-bold">Meera S.</p>
                                    <p className="text-sm text-luxury-charcoal/60">Marketing Manager, Mumbai</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-20 md:py-32 px-4 relative">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <span className="inline-block py-1 px-3 rounded bg-red-100 text-red-600 text-sm font-bold mb-4">
                            LIMITED: 12 SPOTS LEFT
                        </span>
                        <h2 className="text-4xl md:text-6xl luxury-heading mb-6">Choose Your Plan</h2>

                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className={`text-lg font-medium ${billingCycle === 'monthly' ? 'text-luxury-charcoal' : 'text-luxury-charcoal/50'}`}>Monthly</span>
                            <button
                                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                                className="w-16 h-8 bg-luxury-green rounded-full relative p-1 transition-colors"
                            >
                                <motion.div
                                    animate={{ x: billingCycle === 'annual' ? 32 : 0 }}
                                    className="w-6 h-6 bg-white rounded-full shadow-md"
                                />
                            </button>
                            <span className={`text-lg font-medium ${billingCycle === 'annual' ? 'text-luxury-charcoal' : 'text-luxury-charcoal/50'}`}>
                                Annual <span className="text-sm text-luxury-green font-bold ml-1">SAVE 15%</span>
                            </span>
                        </div>
                    </div>

                    <div className="bg-luxury-warm-white border-2 border-luxury-accent rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        {billingCycle === 'annual' && (
                            <div className="absolute top-0 right-0 bg-luxury-gold text-luxury-charcoal text-xs font-bold px-4 py-2 rounded-bl-xl">
                                BEST VALUE: SAVE ₹3,000/YR
                            </div>
                        )}

                        <div className="text-center mb-8">
                            <h3 className="text-3xl luxury-heading mb-2">Style Club Membership</h3>
                            <div className="flex items-baseline justify-center gap-2 mb-2">
                                <span className="text-5xl md:text-6xl font-bold text-luxury-accent">
                                    ₹{billingCycle === 'monthly' ? '1,699' : '17,299'}
                                </span>
                                <span className="text-xl text-luxury-charcoal/60">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>
                            {billingCycle === 'annual' && (
                                <p className="text-luxury-green font-medium">Effective price: ₹1,441/month</p>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 max-w-2xl mx-auto mb-10">
                            {[
                                "5 hand-picked outfits/month",
                                "Clickable shopping links",
                                "WhatsApp styling support",
                                "Cancel anytime (no contracts)",
                                "Seasonal trend updates",
                                "Budget-friendly curation"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0" />
                                    <span className="text-lg">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <Link
                                href={`/style-club/subscribe?plan=${billingCycle}`}
                                className="block w-full md:max-w-md mx-auto bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white py-4 rounded-full text-xl font-bold shadow-xl transition-all hover:-translate-y-1 mb-4"
                            >
                                {billingCycle === 'monthly' ? 'Join for ₹1,699/mo' : 'Join for ₹17,299/yr'}
                            </Link>
                            <div className="flex items-center justify-center gap-2 text-sm text-luxury-charcoal/60">
                                <Shield className="w-4 h-4" />
                                <span>Secure payment via Razorpay</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-8 text-luxury-charcoal/60">
                        <p>Join 200+ women who never Google &quot;where to buy kurtas&quot; again</p>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 md:py-32 bg-luxury-cream/20">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-3xl md:text-5xl luxury-heading text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-luxury-warm-white rounded-xl p-6 shadow-sm border border-luxury-cream">
                                <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                                <p className="text-luxury-charcoal/70">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 bg-luxury-charcoal text-luxury-warm-white text-center px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-5xl luxury-heading mb-6">
                        Don&apos;t let your style knowledge gather dust.
                    </h2>
                    <p className="text-xl luxury-body opacity-80 mb-10 max-w-2xl mx-auto">
                        You focus on looking amazing. We&apos;ll handle the &quot;where to buy&quot; part.
                    </p>
                    <Link
                        href="/style-club/subscribe"
                        className="inline-block bg-luxury-gold text-luxury-charcoal hover:bg-white px-10 py-5 rounded-full text-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        Join the Style Club
                    </Link>
                    <p className="mt-6 text-sm opacity-60">
                        Your first batch ships on the 1st. Join today to secure your spot.
                    </p>
                </div>
            </section>
        </div>
    );
}
