'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Star, ArrowRight, Sparkles, Gem, Shield, Award, Trophy, ArrowLeft } from 'lucide-react';
import { trackPageView, trackViewContent, trackCTAClick } from '@/lib/metaPixel';
import { useManRegion } from '@/hooks/useManRegion';
import { getManPricing, type ManPricing } from '@/lib/manPricing';

// ── Data ────────────────────────────────────────────────────────────────────

const pillars = [
    {
        icon: <Gem className="h-6 w-6 text-luxury-green" />,
        number: '01',
        title: 'Geometric Frame Profiling',
        body: 'We identify your exact body geometry — shoulder-to-hip ratio, torso length, vertical line. Every cut and silhouette that works with your specific frame, defined by science, not guesswork.',
    },
    {
        icon: <Sparkles className="h-6 w-6 text-luxury-green" />,
        number: '02',
        title: 'Chromatic Harmony Mapping',
        body: 'Your undertone, depth, and contrast level determines every colour that sharpens your complexion — and every colour that washes you out. We map yours precisely.',
    },
    {
        icon: <Award className="h-6 w-6 text-luxury-green" />,
        number: '03',
        title: 'Facial Architecture Analysis',
        body: 'Your face shape determines your collar styles, lapel widths, eyewear, and hairstyles. Most men have never been told their face architecture — until now.',
    },
];

const blueprintItems = [
    { icon: <Trophy className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Geometric Frame Profile', desc: 'Your exact frame type with technical rationale — what cuts and silhouettes flatter every proportion.' },
    { icon: <Award className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Facial Architecture Profile', desc: 'Your face shape with structure-specific collar, eyewear, and hairstyle recommendations.' },
    { icon: <Sparkles className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Chromatic Harmony Map', desc: 'Your personal colour palette: 10 exact colours that work for your undertone + depth.' },
    { icon: <Gem className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Outfit Formulas', desc: '16 complete outfits (shirt, trousers, footwear, outerwear) built specifically for your frame — office, casual, Indian occasion, weekend.' },
    { icon: <Shield className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Fit & Proportion Solutions', desc: 'Your specific concern — broad shoulders, narrow frame, belly — addressed with the exact cuts that solve it.' },
    { icon: <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Created by an ICONIK Stylist', desc: 'Your Blueprint is personally reviewed and built by an ICONIK stylist — not a quiz, not an algorithm.' },
    { icon: <Award className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'What to Avoid', desc: 'Cuts, colours, and silhouettes that will never serve you — and exactly why.' },
];

const testimonials = [
    {
        quote: 'I have been dressing randomly my entire life. The Blueprint told me things I had never been told by any stylist. I now walk into a store, go straight to what works, and leave.',
        name: 'Karan, Mumbai',
        tag: 'Blueprint: Athletic Build · Warm Autumn',
    },
    {
        quote: 'The colour palette was a game changer. My skin looks better in photos than ever. People keep asking what I did differently.',
        name: 'Siddharth, Delhi',
        tag: 'Blueprint: Rectangle Frame · Cool Neutral',
    },
    {
        quote: 'Stopped buying clothes that just sit in my wardrobe. Shopping is no longer trial and error. I know my system now.',
        name: 'Nikhil, Bangalore',
        tag: 'Blueprint: Rectangle Frame · Warm Neutral',
    },
];

const faqs = [
    {
        question: 'Is this actually useful for men or just a women\'s service repackaged?',
        answer: 'ICONIK for men was built specifically around how men\'s bodies, wardrobes, and style goals work. The Blueprint covers your frame geometry, face shape, undertone, grooming, and real outfit formulas for office, casual, and Indian occasions — all through a male lens.',
    },
    {
        question: 'What photos do I need to submit?',
        answer: 'Two photos: a full-length photo (standing, natural light, fitted clothes so we can see your frame) and a clear headshot. We\'ll guide you after purchase.',
    },
    {
        question: 'How long does it take to receive my Blueprint?',
        answer: 'Within 72 hours of submitting your intake form and photos.',
    },
    {
        question: 'What if I just want to look sharp, not stylish?',
        answer: 'That\'s exactly the goal. The Blueprint isn\'t about trends — it\'s about identifying what fits your body well, what colours make you look healthy, and what silhouettes project authority. Sharp and unfussy is the outcome.',
    },
    {
        question: 'What if I\'m not happy?',
        answer: '100% satisfaction guarantee. If your Blueprint needs adjustments, email us and we\'ll revise the report until it reflects your needs clearly.',
    },
    {
        question: 'Can I do this if I don\'t know anything about my body type or colours?',
        answer: 'Yes. That\'s exactly who this is for. You don\'t need to know anything. That\'s what we figure out.',
    },
];

// ── CTA Button ───────────────────────────────────────────────────────────────

function CTAButton({ className = '', pricing }: { className?: string; pricing: ManPricing }) {
    return (
        <Link
            href="/man/checkout"
            onClick={() => trackCTAClick('Get My Blueprint', 'Man Landing', pricing.basePrice, pricing.currency, 'Man Funnel')}
            className={`inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-4 rounded-full transition-all duration-300 luxury-body hover:shadow-xl hover:-translate-y-0.5 transform ${className}`}
        >
            GET MY BLUEPRINT — {pricing.displayBase} <ArrowRight className="ml-3 h-4 w-4" />
        </Link>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ManLandingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const { country, isIndia, isLoading } = useManRegion();
    const pricing = getManPricing(country);

    const heroImages = useMemo(() => [
        { src: '/men-transformation-1.webp', caption: 'Blueprint transformation · Karan, Mumbai' },
        { src: '/men-transformation-2.webp', caption: 'Blueprint transformation · Siddharth, Delhi' },
        { src: '/men-transformation-3.webp', caption: 'Blueprint transformation · Nikhil, Bangalore' },
    ], []);

    const nextSlide = useCallback(() => setCarouselIndex(i => (i + 1) % heroImages.length), [heroImages.length]);
    const prevSlide = useCallback(() => setCarouselIndex(i => (i - 1 + heroImages.length) % heroImages.length), [heroImages.length]);

    useEffect(() => {
        trackPageView('Man Landing');
    }, []);

    useEffect(() => {
        if (isLoading) return;
        trackViewContent('ICONIK Blueprint Man', pricing.basePrice, ['iconik_blueprint_man'], pricing.currency, 'Man Funnel');
    }, [isLoading, pricing.basePrice, pricing.currency]);

    useEffect(() => {
        const timer = setInterval(nextSlide, 4000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <div className="man-theme min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden">

            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <nav className="fixed top-0 w-full bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
                    <span className="text-3xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                </div>
            </nav>

            {/* ── SECTION 1: Above the Fold ─────────────────────────────── */}
            <section className="pt-24 pb-16 px-4 md:px-6 lg:px-8 bg-luxury-warm-white">
                <div className="max-w-5xl mx-auto text-center">
                    <div>
                        {/* Featured in */}
                        <div className="mb-5">
                            <p className="luxury-body text-luxury-charcoal/60 mb-2 text-sm">Featured in</p>
                            <div className="flex items-center justify-center gap-8">
                                <Image
                                    src="/times-of-india-logo.png"
                                    alt="Times of India"
                                    width={100}
                                    height={30}
                                    className="opacity-40 hover:opacity-70 transition-opacity h-[30px] w-auto"
                                />
                                <Image
                                    src="/vogue-india-logo.png"
                                    alt="Vogue India"
                                    width={60}
                                    height={20}
                                    className="opacity-40 hover:opacity-70 transition-opacity h-[20px] w-auto md:h-[25px]"
                                />
                            </div>
                        </div>

                        {/* Headline */}
                        <h1 className="text-3xl md:text-7xl luxury-heading text-luxury-charcoal mb-6 leading-[0.95] tracking-tight">
                            Build Your{' '}
                            <span className="text-luxury-green">Signature Style</span>{' '}
                            <span className="text-luxury-accent">in 24 Hours.</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-sm md:text-xl luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto mb-8 leading-relaxed">
                            Get <span className="font-semibold text-luxury-accent">16 personalised outfits</span>, your{' '}
                            <span className="font-semibold text-luxury-green">colour palette</span>, and a{' '}
                            <span className="font-semibold text-luxury-accent">created by an ICONIK stylist</span> — built for how men actually dress.{' '}
                            <span className="font-semibold text-luxury-accent">{isLoading ? '...' : pricing.displayBase}.</span>
                        </p>

                        {/* ── Hero Carousel (3:4) ────────────────────── */}
                        <div className="max-w-sm mx-auto mb-8">
                            <div className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-luxury-cream">
                                <div className="flex items-center justify-center gap-3 md:gap-4">
                                    <button
                                        onClick={prevSlide}
                                        className="p-2 md:p-3 bg-luxury-warm-white border border-luxury-cream rounded-full hover:bg-luxury-cream transition-all duration-300 flex-shrink-0"
                                        aria-label="Previous image"
                                    >
                                        <ArrowLeft className="w-4 h-4 text-luxury-charcoal" />
                                    </button>

                                    <div className="relative w-52 md:w-64" style={{ aspectRatio: '3/4' }}>
                                        <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-luxury-cream bg-luxury-cream/30">
                                            <Image
                                                src={heroImages[carouselIndex].src}
                                                alt={heroImages[carouselIndex].caption}
                                                fill
                                                className="object-cover"
                                                priority={carouselIndex === 0}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={nextSlide}
                                        className="p-2 md:p-3 bg-luxury-warm-white border border-luxury-cream rounded-full hover:bg-luxury-cream transition-all duration-300 flex-shrink-0"
                                        aria-label="Next image"
                                    >
                                        <ArrowRight className="w-4 h-4 text-luxury-charcoal" />
                                    </button>
                                </div>

                                <p className="luxury-body text-luxury-charcoal/50 text-xs text-center mt-4">
                                    {heroImages[carouselIndex].caption}
                                </p>

                                <div className="flex justify-center gap-2 mt-3">
                                    {heroImages.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCarouselIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'bg-luxury-accent w-4' : 'bg-luxury-accent/30'}`}
                                            aria-label={`Go to slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <CTAButton className="text-base px-12 py-5 mb-8" pricing={pricing} />

                        <div className="flex items-center justify-center gap-3 text-sm luxury-body text-luxury-charcoal/60 flex-wrap mt-2">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 text-luxury-gold fill-current" />
                                ))}
                            </div>
                            <span className="text-luxury-charcoal/80 font-medium">Trusted by 200+ men across India</span>
                            <span className="hidden md:inline">·</span>
                            <span className="hidden md:inline">24-Hour Delivery</span>
                            <span className="hidden md:inline">·</span>
                            <span className="hidden md:inline">7-Day Guarantee</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats strip ───────────────────────────────────────────── */}
            <section className="py-12 bg-luxury-cream/30">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
                        {[
                            { num: '200+', label: 'Blueprints Delivered' },
                            { num: '4.9', label: 'Average Rating', star: true },
                            { num: '24h', label: 'Delivery Time' },
                            { num: '100%', label: 'Satisfaction Guarantee' },
                        ].map((s, i) => (
                            <div key={i} className="group">
                                <div className="text-2xl md:text-5xl luxury-heading text-luxury-accent mb-2 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-1">
                                    {s.num}
                                    {s.star && <Star className="h-6 w-6 text-luxury-gold fill-current" />}
                                </div>
                                <div className="luxury-body text-luxury-charcoal/70 text-sm">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 3: Report Preview ──────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-cream/20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-3">Sample Report</p>
                        <h3 className="text-2xl md:text-4xl luxury-heading text-luxury-charcoal">What Your Blueprint Actually Looks Like</h3>
                    </div>

                    {/* Browser Frame */}
                    <div className="relative rounded-2xl overflow-hidden border border-luxury-cream shadow-2xl">
                        {/* macOS-style title bar */}
                        <div className="bg-[#f0ede8] px-5 py-3 flex items-center gap-3 border-b border-[#e8e4de]">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                            </div>
                            <div className="flex-1 flex justify-center">
                                <div className="bg-white/70 rounded-full px-5 py-1.5 text-[10px] text-luxury-charcoal/40 luxury-body tracking-wide">
                                    iconik.pro/your-blueprint
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Report Content */}
                        <div className="h-[640px] overflow-y-auto overflow-x-hidden bg-[#faf9f6]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e8e4de transparent' }}>

                            {/* Report Nav */}
                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#f0ede8] px-6 md:px-10 h-14 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 bg-black flex items-center justify-center">
                                        <Sparkles className="text-[#b58e4d]" size={14} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black">Iconik <span className="text-[#b58e4d]">Blueprint</span></span>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-300">Pro Edition // 2025</span>
                            </div>

                            {/* Report Header */}
                            <div className="px-6 md:px-10 py-10 border-b border-[#f0ede8] bg-white">
                                <div className="flex items-center gap-3 text-[#b58e4d] text-[9px] font-black uppercase tracking-[0.4em] mb-3">
                                    <CheckCircle className="w-4 h-4" /> Analysis Verified
                                </div>
                                <h2 className="text-4xl md:text-6xl luxury-heading text-black italic tracking-tighter leading-none">The Lookbook</h2>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <span className="px-4 py-2 bg-black text-[#b58e4d] text-[9px] font-black uppercase tracking-widest">Athletic Build</span>
                                    <span className="px-4 py-2 bg-[#faf9f6] border border-[#f0ede8] text-gray-400 text-[9px] font-black uppercase tracking-widest">Oval Face</span>
                                    <span className="px-4 py-2 bg-[#faf9f6] border border-[#f0ede8] text-gray-400 text-[9px] font-black uppercase tracking-widest">16 Ensembles</span>
                                </div>
                            </div>

                            {/* Section 01: Body Frame */}
                            <div className="bg-white border-b border-[#f0ede8]">
                                <div className="px-6 md:px-10 py-6 border-b border-[#f0ede8] flex items-center gap-3">
                                    <div className="h-px flex-1 bg-[#f0ede8]" />
                                    <span className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.5em]">Section 01 — Geometric Frame Profile™</span>
                                    <div className="h-px flex-1 bg-[#f0ede8]" />
                                </div>
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto bg-[#f5f3ef] flex-shrink-0 border-r border-[#f0ede8]">
                                        <Image src="/men-report-body-shape.webp" alt="Body Frame Analysis" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 p-6 md:p-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="px-5 py-2 bg-black text-[#b58e4d] text-[9px] font-black uppercase tracking-widest">Athletic Build</span>
                                            <span className="text-xs text-gray-400 font-light">Your dominant frame geometry</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            {[
                                                { label: 'Shoulder–Hip Ratio', value: 'Broader shoulders — inverted V frame' },
                                                { label: 'Torso Length', value: 'Average — standard proportions' },
                                                { label: 'Waist Definition', value: 'Moderate — slight taper visible' },
                                                { label: 'Vertical Line', value: 'Elongated — favours clean verticals' },
                                            ].map((row, idx) => (
                                                <div key={idx}>
                                                    <span className="text-[#b58e4d] font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">{row.label}</span>
                                                    <span className="text-xs text-black font-light">{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-l-2 border-[#b58e4d]/20 pl-5 py-1">
                                            <p className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.3em] mb-2 italic">Styling Directive</p>
                                            <p className="text-xs text-gray-500 font-light italic leading-relaxed">&ldquo;Lean into the V-taper. Avoid boxy oversized fits. Slim-straight trousers and fitted shirts maintain proportional balance without looking overdressed.&rdquo;</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 02: Face Shape */}
                            <div className="bg-[#faf9f6] border-b border-[#f0ede8]">
                                <div className="px-6 md:px-10 py-6 border-b border-[#f0ede8] flex items-center gap-3">
                                    <div className="h-px flex-1 bg-[#e8e4de]" />
                                    <span className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.5em]">Section 02 — Facial Architecture Analysis™</span>
                                    <div className="h-px flex-1 bg-[#e8e4de]" />
                                </div>
                                <div className="flex flex-col md:flex-row bg-white">
                                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto bg-[#f5f3ef] flex-shrink-0 border-r border-[#f0ede8]">
                                        <Image src="/men-report-face-shape.webp" alt="Face Shape Analysis" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 p-6 md:p-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="px-5 py-2 bg-black text-[#b58e4d] text-[9px] font-black uppercase tracking-widest">Oval Face</span>
                                            <span className="text-xs text-gray-400 font-light">Your facial geometry</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Recommended For You</p>
                                                <div className="space-y-3">
                                                    {[
                                                        { label: 'Collar', value: 'Spread, button-down, open notch — all work' },
                                                        { label: 'Eyewear', value: 'Square, aviator, round — versatile' },
                                                        { label: 'Neckwear', value: 'Both ties and open-collar suit equally' },
                                                        { label: 'Hairstyle', value: 'Most cuts — textured, side-part, undercut' },
                                                    ].map((item, idx) => (
                                                        <div key={idx}>
                                                            <span className="text-[#b58e4d] font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">{item.label}</span>
                                                            <span className="text-xs text-black font-light">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Avoid</p>
                                                <div className="space-y-2">
                                                    {['Turtlenecks that compress the neck', 'Very wide lapels that widen the jaw', 'Round wire frames that echo face shape'].map((item, idx) => (
                                                        <div key={idx} className="flex items-start gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-300 mt-1.5 flex-shrink-0" />
                                                            <span className="text-xs text-gray-500 font-light">{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 03: Chromatic Harmony */}
                            <div className="bg-white border-b border-[#f0ede8]">
                                <div className="px-6 md:px-10 py-6 border-b border-[#f0ede8] flex items-center gap-3">
                                    <div className="h-px flex-1 bg-[#f0ede8]" />
                                    <span className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.5em]">Section 03 — Chromatic Harmony Map™</span>
                                    <div className="h-px flex-1 bg-[#f0ede8]" />
                                </div>
                                <div className="p-6 md:p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <span className="px-5 py-2 bg-black text-[#b58e4d] text-[9px] font-black uppercase tracking-widest">Warm Undertone · Medium Depth</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-5">Your 10 Colours</p>
                                            <div className="grid grid-cols-5 gap-2 mb-4">
                                                {['#C4956A','#8B6914','#D4A853','#7C4A1E','#E8C99A','#5C3D2E','#F0E0C8','#9E6B3F','#3D2B1F','#B8860B'].map((hex, idx) => (
                                                    <div key={idx} className="flex flex-col items-center gap-1.5">
                                                        <div className="w-full aspect-square rounded-lg border border-[#f0ede8] shadow-sm" style={{ backgroundColor: hex }} />
                                                        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-wide">{hex}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-light italic">Warm earthy tones, camel, olive — all deepen and sharpen your natural complexion</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-5">Eliminate These 4</p>
                                            <div className="grid grid-cols-4 gap-2 mb-4">
                                                {['#E8E8F0','#C8D8E8','#F0E8F8','#D0E8D0'].map((hex, idx) => (
                                                    <div key={idx} className="flex flex-col items-center gap-1.5">
                                                        <div className="w-full aspect-square rounded-lg border-2 border-red-200 relative shadow-sm" style={{ backgroundColor: hex }}>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-full h-px bg-red-300 rotate-45 absolute" />
                                                                <div className="w-full h-px bg-red-300 -rotate-45 absolute" />
                                                            </div>
                                                        </div>
                                                        <span className="text-[7px] font-bold text-red-300 uppercase tracking-wide">{hex}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-light italic">Cool pastels and icy greys wash out warm undertones and make the complexion appear dull</p>
                                            <div className="mt-6 border-l-2 border-[#b58e4d]/20 pl-4">
                                                <p className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.3em] mb-1 italic">Shopping Note</p>
                                                <p className="text-xs text-gray-500 font-light italic">Real examples from Myntra &amp; Ajio included in your full Blueprint</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 04: Outfit Formulas */}
                            <div className="px-6 md:px-10 py-6 border-b border-[#f0ede8] bg-[#faf9f6] flex items-center gap-3">
                                <div className="h-px flex-1 bg-[#e8e4de]" />
                                <span className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.5em]">Section 04 — Your 16 Outfit Formulas</span>
                                <div className="h-px flex-1 bg-[#e8e4de]" />
                            </div>

                            {[
                                {
                                    category: 'Business',
                                    title: 'The Command Look',
                                    img: '/men-report-preview-1.webp',
                                    items: [
                                        { label: 'Top', value: 'Slim-fit Oxford shirt in white — clean, no pattern noise' },
                                        { label: 'Bottom', value: 'Slim-straight trousers in charcoal grey, tapered ankle' },
                                        { label: 'Footwear', value: 'Derby shoes in dark tan — grounded authority' },
                                        { label: 'Outerwear', value: 'Unstructured blazer in camel — soft but sharp' },
                                        { label: 'Watch', value: 'Minimalist dial — no loud complications' },
                                    ],
                                    rationale: 'The monochromatic grey-white axis reads as quietly powerful. The blazer adds structure without formality. Camel grounds the warm undertone and elevates the complexion.',
                                    tags: ['100% Cotton Poplin', 'Wool Blend', 'Full Canvas'],
                                },
                                {
                                    category: 'Indian Occasion',
                                    title: 'The Festive Presence',
                                    img: '/men-report-preview-2.webp',
                                    items: [
                                        { label: 'Top', value: 'Nehru-collar kurta in deep terracotta — warm undertone perfect' },
                                        { label: 'Bottom', value: 'Slim churidar in off-white — elongates the leg' },
                                        { label: 'Footwear', value: 'Kolhapuris in cognac leather — grounded' },
                                        { label: 'Accessory', value: 'Minimal pocket square or no accessory' },
                                        { label: 'Fabric', value: 'Raw silk or cotton-silk blend for depth' },
                                    ],
                                    rationale: 'Deep terracotta pulls warm undertones forward and makes the complexion appear richer. Slim churidar maintains a clean vertical from waist to ankle.',
                                    tags: ['Raw Silk', 'Cotton Silk', 'Zari Weave'],
                                },
                            ].map((look, i) => (
                                <div key={i} className="flex flex-col md:flex-row bg-white border-b border-[#f0ede8]">
                                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto bg-[#f5f3ef] flex-shrink-0 overflow-hidden border-r border-[#f0ede8]">
                                        <Image src={look.img} alt={look.title} width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 p-6 md:p-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-[#b58e4d] text-[9px] font-black uppercase tracking-[0.4em]">{look.category} Ensemble</span>
                                            <div className="h-px w-8 bg-[#b58e4d]/30" />
                                        </div>
                                        <h3 className="text-2xl md:text-3xl luxury-heading text-black italic mb-6 leading-tight">{look.title}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Composition</p>
                                                <div className="space-y-3">
                                                    {look.items.map((item, idx) => (
                                                        <div key={idx}>
                                                            <span className="text-[#b58e4d] font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">{item.label}</span>
                                                            <span className="text-xs text-black font-light leading-relaxed">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="border-l-2 border-[#b58e4d]/20 pl-5 py-1">
                                                    <p className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.3em] mb-2 italic">Stylist Rationale</p>
                                                    <p className="text-xs text-gray-500 font-light italic leading-relaxed">&ldquo;{look.rationale}&rdquo;</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Fabric &amp; Texture</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {look.tags.map((tag, idx) => (
                                                            <span key={idx} className="px-3 py-1.5 border border-[#f0ede8] text-gray-400 text-[8px] font-black uppercase tracking-widest rounded-full bg-[#faf9f6]">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* More outfits teaser */}
                            <div className="bg-white px-6 md:px-10 py-10 text-center">
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">+ 14 More Ensembles in Your Blueprint</p>
                            </div>

                        </div>

                        {/* Bottom fade */}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#faf9f6] to-transparent pointer-events-none rounded-b-2xl" />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-luxury-charcoal/30">
                            <span>Scroll to explore</span>
                            <ArrowRight size={10} className="rotate-90" />
                        </div>
                    </div>

                    <div className="text-center mt-10">
                        <CTAButton pricing={pricing} />
                    </div>
                </div>
            </section>

            {/* ── SECTION 4: The ICONIK Method ──────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="luxury-body text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">The Methodology</p>
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal mb-4">The ICONIK Method</h2>
                        <p className="luxury-body text-luxury-charcoal/60 text-sm md:text-lg max-w-2xl mx-auto">
                            Three proprietary analysis systems. Thousands of data points. One blueprint built entirely around you.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {pillars.map((p, i) => (
                            <div key={i} className="p-8 md:p-10 bg-luxury-cream/40 rounded-2xl border border-luxury-cream hover:-translate-y-1 transition-all duration-300">
                                <div className="mb-4">{p.icon}</div>
                                <div className="text-4xl luxury-heading text-luxury-accent/20 mb-3">{p.number}</div>
                                <h3 className="luxury-heading text-luxury-charcoal text-xl mb-4">{p.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed">{p.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 5: What's Inside Your Blueprint ───────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-cream/20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="luxury-body text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">Included</p>
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal">What&apos;s Inside Your Blueprint</h2>
                    </div>
                    <div className="max-w-2xl mx-auto space-y-4">
                        {blueprintItems.map((item, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 bg-luxury-warm-white/80 border border-luxury-cream rounded-xl hover:bg-luxury-warm-white transition-all duration-300">
                                {item.icon}
                                <div>
                                    <h3 className="luxury-heading text-luxury-charcoal text-base mb-1">{item.title}</h3>
                                    <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <CTAButton pricing={pricing} />
                    </div>
                </div>
            </section>

            {/* ── SECTION 6: Case Studies ───────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="luxury-body text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">Real Findings</p>
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal mb-4">What the Blueprint actually found</h2>
                        <p className="luxury-body text-luxury-charcoal/60 text-sm md:text-lg">
                            Three men. Three different frames. Three specific solutions.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 md:gap-10">
                        {[
                            {
                                name: 'Rohan',
                                age: '31',
                                city: 'Mumbai',
                                image: '/men-case-rohan.webp',
                                concern: ['Broad shoulders, always looked', 'too formal or too casual'],
                                finding: ['Athletic inverted-V frame', 'Warm autumn undertone'],
                                changed: ['Unstructured blazers replaced stiff jackets', 'Slim-straight replaced skinny', 'Warm palette — camel, olive, rust introduced'],
                                quote: 'I walk into meetings and the room shifts.',
                                stars: 5,
                            },
                            {
                                name: 'Dev',
                                age: '28',
                                city: 'Delhi',
                                image: '/men-case-dev.webp',
                                concern: ['Slim frame, clothes', 'always looked borrowed'],
                                finding: ['Rectangle frame — minimal taper', 'Cool neutral undertone'],
                                changed: ['Structured shoulders introduced', 'Layering system built for depth', 'Jewel tones replaced all-black uniform'],
                                quote: 'I look like I dressed on purpose now.',
                                stars: 5,
                            },
                            {
                                name: 'Amit',
                                age: '35',
                                city: 'Bangalore',
                                image: '/men-case-amit.webp',
                                concern: ['Post-30 belly — avoided', 'anything fitted for years'],
                                finding: ['Rectangle frame, medium vertical', 'Warm neutral undertone'],
                                changed: ['Straight-cut kurtas replaced baggy shirts', 'Dark warm palette — no more grey everywhere', 'Fit calibrated to shoulder, not belly'],
                                quote: 'Shopping is no longer trial and error.',
                                stars: 4,
                            },
                        ].map((c, index) => (
                            <div
                                key={index}
                                className="bg-luxury-warm-white/80 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-2xl overflow-hidden hover:-translate-y-2"
                            >
                                <div className="aspect-square bg-luxury-cream/50 overflow-hidden">
                                    <Image src={c.image} alt={c.name} width={300} height={300} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <p className="luxury-heading text-luxury-charcoal text-lg leading-none">{c.name} · {c.age} · {c.city}</p>
                                        <div className="mt-3 h-px bg-luxury-cream" />
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-x-3 items-start">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxury-charcoal/40 pt-0.5">Concern</span>
                                        <span className="luxury-body text-luxury-charcoal/80 text-sm leading-snug">{c.concern.join(' ')}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-x-3 items-start">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxury-charcoal/40 pt-0.5">Finding</span>
                                        <div className="space-y-0.5">
                                            {c.finding.map((f, i) => (
                                                <p key={i} className="luxury-body text-luxury-charcoal/80 text-sm leading-snug">{f}</p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-x-3 items-start">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxury-charcoal/40 pt-0.5">Changed</span>
                                        <div className="space-y-1">
                                            {c.changed.map((ch, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-luxury-accent mt-1.5 flex-shrink-0" />
                                                    <p className="luxury-body text-luxury-charcoal/80 text-sm leading-snug">{ch}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-px bg-luxury-cream" />
                                    <div>
                                        <p className="luxury-body text-luxury-charcoal italic text-sm leading-relaxed mb-3">&ldquo;{c.quote}&rdquo;</p>
                                        <div className="flex gap-1">
                                            {[...Array(c.stars)].map((_, i) => (
                                                <Star key={i} className="h-3.5 w-3.5 text-luxury-gold fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 7: Price Anchor ────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-accent">
                <div className="max-w-3xl mx-auto text-center text-luxury-warm-white">
                    <p className="luxury-body text-luxury-warm-white/70 text-lg leading-relaxed mb-8">
                        A personal styling session in India costs ₹15,000–50,000+. They give you one day. You forget half of it. You still don&apos;t know your colours or your frame.
                    </p>
                    <div className="bg-luxury-warm-white/10 backdrop-blur-sm border border-luxury-warm-white/20 rounded-2xl p-10 mb-10">
                        <div className="luxury-body text-luxury-warm-white/60 text-xs tracking-widest uppercase mb-3">Your ICONIK Man Blueprint</div>
                        <div className="text-4xl md:text-7xl luxury-heading text-luxury-warm-white mb-3">{isLoading ? '...' : pricing.displayBase}</div>
                        <p className="luxury-body text-luxury-warm-white/70 text-lg">
                            Yours forever. Built on your specific frame, face, and colour profile.
                        </p>
                    </div>
                    <Link
                        href="/man/checkout"
                        onClick={() => trackCTAClick('Get My Blueprint', 'Man Price Section', pricing.basePrice, pricing.currency, 'Man Funnel')}
                        className="inline-flex items-center bg-luxury-warm-white hover:bg-luxury-cream text-luxury-accent px-10 py-4 rounded-full transition-all duration-300 luxury-body hover:shadow-xl hover:-translate-y-0.5 transform font-semibold"
                    >
                        GET MY BLUEPRINT — {isLoading ? '...' : pricing.displayBase} <ArrowRight className="ml-3 h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* ── SECTION 8: Before/After ───────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-cream/20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="luxury-body text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">The Blueprint in Practice</p>
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal mb-4">Real clients. Specific findings. Measurable change.</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                        {[
                            {
                                before: '/men-style-before.webp',
                                after: '/men-style-after.webp',
                                beforeLabel: 'Before — ill-fitting silhouette, wrong palette',
                                afterLabel: 'After — Geometric Frame Profile™ applied',
                                caption: 'Rohan, 31, Mumbai · Athletic inverted-V frame · Warm autumn undertone · Blueprint prescribed unstructured blazers, slim-straight, warm camel-olive palette',
                            },
                            {
                                before: '/men-wardrobe-before.webp',
                                after: '/men-wardrobe-after.webp',
                                beforeLabel: 'Before — dressing to disappear',
                                afterLabel: 'After — Fit & Proportion Solutions applied',
                                caption: 'Amit, 35, Bangalore · Rectangle frame · Warm neutral undertone · Blueprint prescribed straight-cut kurtas, structured shoulders, dark warm palette',
                            },
                        ].map((comparison, index) => (
                            <div
                                key={index}
                                className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-2"
                            >
                                <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
                                    <div>
                                        <p className="text-[10px] font-semibold text-luxury-charcoal/50 uppercase tracking-widest mb-3 leading-tight">{comparison.beforeLabel}</p>
                                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-luxury-cream/30">
                                            <Image src={comparison.before} alt={comparison.beforeLabel} fill className="object-cover" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-luxury-accent uppercase tracking-widest mb-3 leading-tight">{comparison.afterLabel}</p>
                                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-luxury-cream/30">
                                            <Image src={comparison.after} alt={comparison.afterLabel} fill className="object-cover" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs md:text-sm luxury-body text-luxury-charcoal/60 leading-relaxed border-t border-luxury-cream pt-4">{comparison.caption}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 9: Sound Familiar? ────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal">Sound Familiar?</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        {[
                            {
                                num: '01',
                                text: 'You get dressed every morning and it still feels like you\'re guessing. Not wrong exactly. Just never sharp.',
                                image: '/men-feeling-overlooked1.webp',
                                imageAlt: 'Man at mirror',
                            },
                            {
                                num: '02',
                                text: "You've read the guides. Watched the videos. Tried the capsule wardrobe. Nothing has actually stuck.",
                                image: '/men-style-confusion1.webp',
                                imageAlt: 'Man with clothes',
                            },
                            {
                                num: '03',
                                text: "The budget is fine. The clothes are fine. But every outfit still feels like you could have done better.",
                                image: '/men-confidence-issues1.webp',
                                imageAlt: 'Man looking at himself',
                            },
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="group relative bg-luxury-cream/40 rounded-3xl p-6 md:p-8 border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 hover:-translate-y-2"
                            >
                                <div className="relative w-full aspect-square mb-6 rounded-xl overflow-hidden">
                                    <Image src={item.image} alt={item.imageAlt} fill className="object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                                </div>
                                <span className="block luxury-heading text-2xl mb-4 leading-none text-luxury-accent">{item.num}</span>
                                <p className="luxury-body text-luxury-charcoal/80 text-base leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 10: Who This Is For ───────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-cream/20">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="luxury-body text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">This Is For You If</p>
                        <h2 className="text-2xl md:text-5xl luxury-heading text-luxury-charcoal">Who This Is For</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            "You've been buying clothes that look fine in the store but never quite right on you.",
                            "You know something is off about your style but can't pinpoint what it is.",
                            "You're tired of wasting money on pieces that end up unworn.",
                            "You want to dress with intention — not guess every morning.",
                            "You're ready to understand your frame, your colours, and your face — for good.",
                        ].map((line, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 bg-luxury-warm-white/80 border border-luxury-cream rounded-xl hover:bg-luxury-warm-white transition-all duration-300">
                                <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                                <p className="luxury-body text-luxury-charcoal/80 text-sm md:text-base leading-relaxed">{line}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <CTAButton pricing={pricing} />
                    </div>
                </div>
            </section>

            {/* ── SECTION 11: Testimonials ──────────────────────────────── */}
            <section id="testimonials" className="py-24 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal mb-4">Client Stories</h2>
                        <p className="luxury-body text-luxury-charcoal/60 text-sm md:text-lg">What men across India are saying.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 md:gap-10">
                        {[
                            { ...testimonials[0], img: '/men-review-karan.webp' },
                            { ...testimonials[1], img: '/men-review-siddharth.webp' },
                            { ...testimonials[2], img: '/men-review-nikhil.webp' },
                        ].map((t, i) => (
                            <div
                                key={i}
                                className="p-8 md:p-10 bg-luxury-cream/40 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-2xl hover:-translate-y-2"
                            >
                                <div className="space-y-6">
                                    <div className="aspect-square bg-luxury-cream/50 rounded-xl overflow-hidden relative">
                                        <Image
                                            src={t.img}
                                            alt={t.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <p className="luxury-body text-luxury-charcoal/80 text-center leading-relaxed">
                                        &ldquo;{t.quote}&rdquo;
                                    </p>
                                    <div className="text-center">
                                        <p className="luxury-body text-luxury-charcoal/60 mb-3">{t.name}</p>
                                        <p className="luxury-body text-luxury-accent text-xs mb-3">{t.tag}</p>
                                        <div className="flex justify-center gap-1">
                                            {[...Array(5)].map((_, j) => (
                                                <Star key={j} className="h-4 w-4 text-luxury-gold fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 12: How It Works ──────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-cream/20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="luxury-body text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">The Process</p>
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal">How It Works</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { step: '01', title: 'Purchase & Fill In', desc: 'Complete your purchase. Upload two photos — one full body, one headshot. Fill in 8 questions about your lifestyle and goals. Takes 4 minutes.' },
                            { step: '02', title: 'We Analyse', desc: 'Our proprietary ICONIK methodology analyses your frame, colour profile, and facial architecture — built specifically for how men dress.' },
                            { step: '03', title: 'You Receive', desc: 'Your personalised Blueprint arrives within 72 hours. 16 outfits, your colour palette, your face architecture guide. Yours to keep forever.' },
                        ].map((s, i) => (
                            <div
                                key={i}
                                className="p-8 bg-luxury-warm-white/80 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-2xl hover:-translate-y-1 text-center"
                            >
                                <div className="text-5xl luxury-heading text-luxury-accent/20 mb-4">{s.step}</div>
                                <h3 className="luxury-heading text-luxury-charcoal text-xl mb-3">{s.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 13: FAQ ─────────────────────────────────────────── */}
            <section id="faq" className="py-24 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl md:text-5xl luxury-heading text-luxury-charcoal mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="luxury-body text-luxury-charcoal/60 max-w-xl mx-auto text-sm md:text-base">
                            Everything you need to know about your Blueprint.
                        </p>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className="text-left p-5 md:p-6 bg-luxury-warm-white/80 backdrop-blur-sm rounded-xl border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            >
                                <div className="flex justify-between items-center gap-4">
                                    <h3 className="text-base md:text-lg luxury-heading text-luxury-charcoal">{faq.question}</h3>
                                    <span className="text-luxury-accent font-bold text-xl flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                                </div>
                                {openFaq === i && (
                                    <p className="luxury-body text-luxury-charcoal/70 text-sm md:text-base leading-relaxed mt-3 border-t border-luxury-cream pt-3">
                                        {faq.answer}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 14: Final CTA ──────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-accent text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-warm-white mb-6 leading-tight">
                        Most men spend years buying clothes that{' '}
                        <span className="text-luxury-warm-white/60">almost</span> work.
                    </h2>
                    <p className="text-base md:text-xl luxury-body text-luxury-warm-white/80 mb-10 leading-relaxed">
                        Your Blueprint tells you exactly what does.
                    </p>
                    <Link
                        href="/man/checkout"
                        onClick={() => trackCTAClick('Final CTA Man', 'Bottom Section', pricing.basePrice, pricing.currency, 'Man Funnel')}
                        className="inline-flex items-center bg-luxury-warm-white hover:bg-luxury-cream text-luxury-accent px-12 py-5 rounded-full transition-all duration-300 luxury-body hover:shadow-xl hover:-translate-y-0.5 transform font-semibold text-base mb-6"
                    >
                        GET MY BLUEPRINT — {isLoading ? '...' : pricing.displayBase} <ArrowRight className="ml-3 h-4 w-4" />
                    </Link>
                    <div className="flex items-center justify-center gap-3 text-sm luxury-body text-luxury-warm-white/60 flex-wrap mt-4">
                        <span>★★★★★ Trusted by 200+ men {isIndia ? 'across India' : 'worldwide'}</span>
                        <span className="hidden md:inline">·</span>
                        <span className="hidden md:inline">24-Hour Delivery</span>
                        <span className="hidden md:inline">·</span>
                        <span className="hidden md:inline">7-Day Money-Back Guarantee</span>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="py-12 bg-luxury-cream/30 border-t border-luxury-cream">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                        <div className="flex flex-wrap justify-center gap-6 luxury-body text-luxury-charcoal/60 text-sm">
                            <Link href="/privacy-policy" className="hover:text-luxury-green transition-colors">Privacy Policy</Link>
                            <Link href="/refund-policy" className="hover:text-luxury-green transition-colors">Refund Policy</Link>
                            <Link href="/terms" className="hover:text-luxury-green transition-colors">Terms of Service</Link>
                            <a href="mailto:support@iconik.pro" className="hover:text-luxury-green transition-colors">support@iconik.pro</a>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-luxury-cream text-center">
                        <p className="luxury-body text-luxury-charcoal/40 text-xs">© {new Date().getFullYear()} ICONIK. All rights reserved. Personal styling for Indian men who dress with purpose.</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}
