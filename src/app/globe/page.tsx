'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Star, ArrowRight, Sparkles, Gem, Heart, Shield, Award, Trophy, ArrowLeft } from 'lucide-react';
import { trackPageView, trackViewContent, trackCTAClick } from '@/lib/metaPixel';
import { captureAttribution } from '@/lib/attribution';

// ── Data ────────────────────────────────────────────────────────────────────

const pillars = [
    {
        icon: <Gem className="h-6 w-6 text-[#94A6AD]" />,
        number: '01',
        title: 'Geometric Silhouette Profiling',
        body: 'We identify your exact body geometry — every proportion ratio and structural strength. Every cut that works with your specific frame, defined by science, not guesswork.',
    },
    {
        icon: <Sparkles className="h-6 w-6 text-[#94A6AD]" />,
        number: '02',
        title: 'Chromatic Harmony Mapping',
        body: 'Your undertone, depth, and contrast level determines every colour that makes you glow — and every colour that washes you out. We map yours precisely.',
    },
    {
        icon: <Award className="h-6 w-6 text-[#94A6AD]" />,
        number: '03',
        title: 'Facial Architecture Analysis',
        body: 'Your face shape determines your necklines, eyewear, earring geometry, and hair structures. Most women have never been told their face architecture — until now.',
    },
];

const blueprintItems = [
    { icon: <Trophy className="w-5 h-5 text-[#94A6AD] flex-shrink-0 mt-0.5" />, title: 'Body Geometry Analysis', desc: 'Your exact silhouette type with technical rationale — what cuts flatter every proportion.' },
    { icon: <Award className="w-5 h-5 text-[#94A6AD] flex-shrink-0 mt-0.5" />, title: 'Face Architecture Profile', desc: 'Your face shape with structure-specific neckline, earring, and eyewear recommendations.' },
    { icon: <Sparkles className="w-5 h-5 text-[#94A6AD] flex-shrink-0 mt-0.5" />, title: 'Chromatic Harmony Map', desc: 'Your seasonal colour palette: 10 exact colours that work for your undertone + depth.' },
    { icon: <Gem className="w-5 h-5 text-[#94A6AD] flex-shrink-0 mt-0.5" />, title: 'Outfit Formulas', desc: '20 complete outfits (top, bottom, footwear, bag, jewellery) built specifically for your Blueprint.' },
    { icon: <Heart className="w-5 h-5 text-[#94A6AD] flex-shrink-0 mt-0.5" />, title: 'Hair Direction', desc: '4 hairstyle recommendations with technical explanation of why each works for your face shape.' },
    { icon: <Shield className="w-5 h-5 text-[#94A6AD] flex-shrink-0 mt-0.5" />, title: 'Eyewear Guide', desc: '4 frame styles matched to your face geometry and undertone.' },
    { icon: <CheckCircle className="w-5 h-5 text-[#94A6AD] flex-shrink-0 mt-0.5" />, title: 'What to Avoid', desc: 'Cuts, colours, and silhouettes that will never serve you — and exactly why.' },
];

const testimonials = [
    {
        quote: 'I have been dressing for the wrong body shape my entire life. The Blueprint told me things I had never been told by any stylist. I now walk into a store, go straight to what works, and leave.',
        name: 'Sara, New York',
        tag: 'Blueprint: Inverted Triangle · Cool Autumn',
    },
    {
        quote: 'I was sceptical. I have done colour analysis before and it felt too general. This was different — the face architecture section alone was worth three times the price.',
        name: 'Layla, Dubai',
        tag: 'Blueprint: Oval · Warm Spring',
    },
    {
        quote: 'The outfit formulas changed everything. I finally have a system, not just a wardrobe full of things that almost work.',
        name: 'Nour, Toronto',
        tag: 'Blueprint: Hourglass · Neutral Autumn',
    },
];

const faqs = [
    {
        question: 'What photos do I need to submit?',
        answer: 'Two photos: a full-length photo (standing, natural light, form-fitting clothes so we can see your proportions) and a clear headshot. We\'ll guide you after purchase.',
    },
    {
        question: 'How long does it take to receive my Blueprint?',
        answer: 'Within 72 hours of submitting your intake form and photos.',
    },
    {
        question: 'Is this personalised or a generic quiz result?',
        answer: 'Completely personalised. Your Blueprint is built on your specific photos and answers. No two Blueprints are identical.',
    },
    {
        question: 'What if I\'m not happy?',
        answer: '30-day money-back guarantee. Email us. No questions. Full refund within 48 hours.',
    },
    {
        question: 'Can I do this if I don\'t know anything about my body shape or colours?',
        answer: 'Yes. That\'s exactly who this is for. You don\'t need to know anything. That\'s what we figure out.',
    },
    {
        question: 'Is this suitable for modest dressing?',
        answer: 'Absolutely. Your Blueprint takes your coverage and modesty preferences into account — necklines, sleeve lengths, and silhouettes are all tailored to how you actually dress.',
    },
];

// ── CTA Button ───────────────────────────────────────────────────────────────

function CTAButton({ className = '' }: { className?: string }) {
    return (
        <Link
            href="/globe/checkout"
            onClick={() => trackCTAClick('Get My Blueprint', 'Globe Landing', 97, 'USD', 'Globe Funnel')}
            className={`inline-flex items-center gap-3 bg-[#2C2622] hover:bg-[#3d3430] text-[#F4EFE5] px-8 py-4 rounded-full transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 transform ${className}`}
        >
            <span className="iconik-display" style={{ fontSize: '15px' }}>Get My Blueprint — $97</span>
            <ArrowRight className="h-4 w-4 opacity-60" />
        </Link>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function GlobeLandingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);

    const heroImages = useMemo(() => [
        { src: '/transformation-1.webp', caption: 'Blueprint transformation · Sara, New York' },
        { src: '/testimonial-priya.webp', caption: 'Blueprint transformation · Layla, Dubai' },
        { src: '/transformation-2.webp', caption: 'Blueprint transformation · Nour, Toronto' },
    ], []);

    const nextSlide = useCallback(() => setCarouselIndex(i => (i + 1) % heroImages.length), [heroImages.length]);
    const prevSlide = useCallback(() => setCarouselIndex(i => (i - 1 + heroImages.length) % heroImages.length), [heroImages.length]);

    useEffect(() => {
        captureAttribution();
        trackPageView('Globe Landing');
        trackViewContent('ICONIK Blueprint Globe', 97, ['iconik_blueprint_globe'], 'USD', 'Globe Funnel');
    }, []);

    useEffect(() => {
        const timer = setInterval(nextSlide, 4000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <div className="man-editorial min-h-screen overflow-x-hidden">

            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl" style={{ background: 'rgba(248,243,233,0.95)', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
                    <span className="iconik-display" style={{ fontSize: '22px', letterSpacing: '0.12em', color: '#2C2622' }}>ICONIK</span>
                </div>
            </nav>

            {/* ══ ORDER FOLLOWS ROOT PAGE: Hero → Stats → What You Receive (Report + Method + Inside) → Case Studies → Pricing → Before/After → Pain Cards → Who This Is For → Testimonials → How It Works → FAQ → Final CTA ══ */}

            {/* ── SECTION 1: Above the Fold ─────────────────────────────── */}
            <section className="pt-24 pb-16 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-5xl mx-auto text-center">
                    <div>
                        {/* Featured in */}
                        <div className="mb-6">
                            <p className="iconik-micro mb-3 opacity-45" style={{ color: '#2C2622' }}>Featured in</p>
                            <div className="flex items-center justify-center">
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
                        <h1 className="iconik-display mb-5 leading-none" style={{ fontSize: 'clamp(36px, 8vw, 80px)', color: '#2C2622' }}>
                            Discover Your Signature Style{' '}
                            <span className="iconik-display-it" style={{ color: '#6B7F87' }}>in 24 Hours.</span>
                        </h1>

                        {/* Subheadline */}
                        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#2C2622', opacity: 0.65, maxWidth: '680px', margin: '0 auto 32px' }}>
                            ICONIK analyses your facial architecture, body geometry, and colour harmony using a proprietary methodology used by professional stylists.{' '}
                            <strong style={{ fontWeight: 500, color: '#2C2622' }}>Personalised Blueprint. 24-hour delivery. $97.</strong>
                        </p>

                        {/* ── Hero Carousel (3:4) ────────────────────── */}
                        <div className="max-w-sm mx-auto mb-8">
                            <div className="rounded-3xl p-4 md:p-6" style={{ background: 'rgba(237,229,210,0.5)', border: '1px solid rgba(44,38,34,0.08)' }}>
                                <div className="flex items-center justify-center gap-3 md:gap-4">
                                    <button
                                        onClick={prevSlide}
                                        className="p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0 hover:-translate-x-0.5"
                                        style={{ background: '#F8F3E9', border: '1px solid rgba(44,38,34,0.1)' }}
                                        aria-label="Previous image"
                                    >
                                        <ArrowLeft className="w-4 h-4" style={{ color: '#2C2622' }} />
                                    </button>

                                    <div className="relative w-52 md:w-64" style={{ aspectRatio: '3/4' }}>
                                        <div className="w-full h-full rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(44,38,34,0.1)' }}>
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
                                        className="p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0 hover:translate-x-0.5"
                                        style={{ background: '#F8F3E9', border: '1px solid rgba(44,38,34,0.1)' }}
                                        aria-label="Next image"
                                    >
                                        <ArrowRight className="w-4 h-4" style={{ color: '#2C2622' }} />
                                    </button>
                                </div>

                                <p className="iconik-micro mt-4 opacity-40 text-center" style={{ color: '#2C2622' }}>
                                    {heroImages[carouselIndex].caption}
                                </p>

                                <div className="flex justify-center gap-2 mt-3">
                                    {heroImages.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCarouselIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'bg-[#2C2622] w-4' : 'bg-[#2C2622]/30'
                                                }`}
                                            aria-label={`Go to slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <CTAButton className="text-base px-12 py-5 mb-8" />

                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 text-[#9a7d4a] fill-current" />
                                ))}
                            </div>
                            <span className="iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>Trusted by 500+ women worldwide</span>
                            <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.3 }}>·</span>
                            <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>24-Hour Delivery</span>
                            <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.3 }}>·</span>
                            <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>30-Day Guarantee</span>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── Stats strip ───────────────────────────────────────────── */}
            <section className="py-12 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
                        {[
                            { num: '500+', label: 'Blueprints Delivered' },
                            { num: '4.9', label: 'Average Rating', star: true },
                            { num: '24h', label: 'Delivery Time' },
                            { num: '30-day', label: 'Money-Back Guarantee' },
                        ].map((s, i) => (
                            <div key={i} className="group">
                                <div className="text-2xl md:text-5xl iconik-display text-[#6B7F87] mb-2 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-1">
                                    {s.num}
                                    {s.star && <Star className="h-6 w-6 text-[#9a7d4a] fill-current" />}
                                </div>
                                <div className="iconik-micro mt-2 opacity-50" style={{ color: '#2C2622' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 3: What You Receive — Report Preview ──────────── */}
            {/* (mirrors root page: Report Preview comes first in the features block) */}
            <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <p className="text-xs iconik-mono text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-3">Sample Report</p>
                        <h3 className="text-2xl md:text-4xl iconik-display text-luxury-charcoal">What Your Blueprint Actually Looks Like</h3>
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
                                <div className="bg-white/70 rounded-full px-5 py-1.5 text-[10px] text-luxury-charcoal/40 iconik-mono tracking-wide">
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
                                <h2 className="text-4xl md:text-6xl iconik-display text-black italic tracking-tighter leading-none">The Lookbook</h2>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <span className="px-4 py-2 bg-black text-[#b58e4d] text-[9px] font-black uppercase tracking-widest">Hourglass Profile</span>
                                    <span className="px-4 py-2 bg-[#faf9f6] border border-[#f0ede8] text-gray-400 text-[9px] font-black uppercase tracking-widest">Oval Face</span>
                                    <span className="px-4 py-2 bg-[#faf9f6] border border-[#f0ede8] text-gray-400 text-[9px] font-black uppercase tracking-widest">14 Ensembles</span>
                                </div>
                            </div>

                            {/* Section 01: Body Shape */}
                            <div className="bg-white border-b border-[#f0ede8]">
                                <div className="px-6 md:px-10 py-6 border-b border-[#f0ede8] flex items-center gap-3">
                                    <div className="h-px flex-1 bg-[#f0ede8]" />
                                    <span className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.5em]">Section 01 — Geometric Silhouette Profile™</span>
                                    <div className="h-px flex-1 bg-[#f0ede8]" />
                                </div>
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto bg-[#f5f3ef] flex-shrink-0 border-r border-[#f0ede8]">
                                        <Image src="/report-body-shape.webp" alt="Body Shape Analysis" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 p-6 md:p-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="px-5 py-2 bg-black text-[#b58e4d] text-[9px] font-black uppercase tracking-widest">Hourglass</span>
                                            <span className="text-xs text-gray-400 font-light">Your dominant body geometry</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            {[
                                                { label: 'Shoulder–Hip Balance', value: 'Symmetrical — balanced frame' },
                                                { label: 'Waist Definition', value: 'Naturally defined — visible curve' },
                                                { label: 'Torso Length', value: 'Average — standard proportions' },
                                                { label: 'Vertical Line', value: 'Elongated — good height ratio' },
                                            ].map((row, idx) => (
                                                <div key={idx}>
                                                    <span className="text-[#b58e4d] font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">{row.label}</span>
                                                    <span className="text-xs text-black font-light">{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-l-2 border-[#b58e4d]/20 pl-5 py-1">
                                            <p className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.3em] mb-2 italic">Styling Directive</p>
                                            <p className="text-xs text-gray-500 font-light italic leading-relaxed">&ldquo;Celebrate the natural waist. Avoid boxy, shapeless silhouettes. Always define the middle — belted, wrap, or fitted waistbands are your friend.&rdquo;</p>
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
                                        <Image src="/report-face-shape.webp" alt="Face Shape Analysis" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
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
                                                        { label: 'Necklines', value: 'V-neck, scoop, off-shoulder — all work' },
                                                        { label: 'Earrings', value: 'Any shape — studs to chandeliers' },
                                                        { label: 'Collar', value: 'Open collars, notch lapels, boat neck' },
                                                        { label: 'Eyewear', value: 'Square, cat-eye, aviator frames' },
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
                                                    {['Overly round or circular earrings', 'Heavy turtlenecks that shorten neck', 'Round wire-frame glasses'].map((item, idx) => (
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
                                            <p className="text-[9px] text-gray-400 font-light italic">Warm earth tones, golden ochres, rich browns — all enhance your natural depth</p>
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
                                            <p className="text-[9px] text-gray-400 font-light italic">Cool pastels and icy tones wash out your warm depth and create contrast imbalance</p>
                                            <div className="mt-6 border-l-2 border-[#b58e4d]/20 pl-4">
                                                <p className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.3em] mb-1 italic">Shopping Note</p>
                                                <p className="text-xs text-gray-500 font-light italic">Real shopping examples included in your full Blueprint</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 04: Outfit Formulas */}
                            <div className="px-6 md:px-10 py-6 border-b border-[#f0ede8] bg-[#faf9f6] flex items-center gap-3">
                                <div className="h-px flex-1 bg-[#e8e4de]" />
                                <span className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.5em]">Section 04 — Your Outfit Formulas</span>
                                <div className="h-px flex-1 bg-[#e8e4de]" />
                            </div>

                            {[
                                {
                                    category: 'Corporate',
                                    title: 'The Power Silhouette',
                                    img: '/report-preview-1.webp',
                                    items: [
                                        { label: 'Top', value: 'Structured blazer in ivory — strong shoulders, nipped waist' },
                                        { label: 'Bottom', value: 'Straight-cut trousers in slate grey, ankle-length' },
                                        { label: 'Footwear', value: 'Block heel mules in nude — elongates the leg line' },
                                        { label: 'Handbag', value: 'Structured tote in cognac leather' },
                                        { label: 'Jewelry', value: 'Gold bar earrings + thin watch — clean authority' },
                                    ],
                                    rationale: 'The vertical line created by the blazer lapel draws the eye upward and visually lengthens the torso. Straight trousers maintain the hourglass definition without adding bulk at the hip.',
                                    tags: ['Cotton Poplin', 'Ponte Knit', 'Structured Lining'],
                                },
                                {
                                    category: 'Occasion',
                                    title: 'The Evening Edit',
                                    img: '/report-preview-2.webp',
                                    items: [
                                        { label: 'Top', value: 'Silk wrap blouse in deep burgundy — V-neck to elongate' },
                                        { label: 'Bottom', value: 'Tailored wide-leg trousers in matching tone' },
                                        { label: 'Footwear', value: 'Block heel in nude or black — elongates the leg' },
                                        { label: 'Handbag', value: 'Structured clutch in gold or cognac leather' },
                                        { label: 'Jewelry', value: 'Drop earrings + single bangle — understated luxury' },
                                    ],
                                    rationale: 'A tonal head-to-toe in a deep tone creates an unbroken vertical that flatters the hourglass by maintaining definition at the waist. Silk adds movement without bulk.',
                                    tags: ['Silk Blend', 'Wide Leg', 'Tonal Palette'],
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
                                        <h3 className="text-2xl md:text-3xl iconik-display text-black italic mb-6 leading-tight">{look.title}</h3>
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
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Fabric & Texture</p>
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
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">+ More Ensembles in Your Blueprint</p>
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
                        <CTAButton />
                    </div>
                </div>
            </section>

            {/* ── SECTION 4: ICONIK Method ──────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="iconik-mono text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">The Methodology</p>
                        <h2 className="text-2xl md:text-6xl iconik-display text-luxury-charcoal mb-4">The ICONIK Method</h2>
                        <p className="iconik-mono text-luxury-charcoal/60 text-sm md:text-lg max-w-2xl mx-auto">
                            Three proprietary analysis systems. Thousands of data points. One blueprint built entirely around you.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {pillars.map((p, i) => (
                            <div key={i} className="p-8 md:p-10 bg-luxury-cream/40 rounded-2xl border border-luxury-cream hover:-translate-y-1 transition-all duration-300">
                                <div className="mb-4">{p.icon}</div>
                                <div className="text-4xl iconik-display text-[#6B7F87]/20 mb-3">{p.number}</div>
                                <h3 className="iconik-display text-luxury-charcoal text-xl mb-4">{p.title}</h3>
                                <p className="iconik-mono text-luxury-charcoal/60 text-sm leading-relaxed">{p.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 5: What's Inside Your Blueprint ───────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="iconik-mono text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">Included</p>
                        <h2 className="text-2xl md:text-6xl iconik-display text-luxury-charcoal">What&apos;s Inside Your Blueprint</h2>
                    </div>
                    <div className="max-w-2xl mx-auto space-y-4">
                        {blueprintItems.map((item, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 bg-luxury-warm-white/80 border border-luxury-cream rounded-xl hover:bg-luxury-warm-white transition-all duration-300">
                                {item.icon}
                                <div>
                                    <h3 className="iconik-display text-luxury-charcoal text-base mb-1">{item.title}</h3>
                                    <p className="iconik-mono text-luxury-charcoal/60 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <CTAButton />
                    </div>
                </div>
            </section>

            {/* ── SECTION 6: Case Studies ───────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="iconik-mono text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">Real Findings</p>
                        <h2 className="text-2xl md:text-6xl iconik-display text-luxury-charcoal mb-4">What the Blueprint actually found</h2>
                        <p className="iconik-mono text-luxury-charcoal/60 text-sm md:text-lg">
                            Three women. Three different geometries. Three specific solutions.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 md:gap-10">
                        {[
                            {
                                name: 'Sara',
                                age: '29',
                                city: 'New York',
                                image: '/testimonial-priya.webp',
                                concern: ['Body confidence issues after', 'years of dressing to hide'],
                                finding: ['Rectangle frame', 'Cool neutral undertone'],
                                changed: ['Structured blazers replaced boxy tops', 'Cool neutral palette introduced', 'Wrap styles added for occasions'],
                                quote: 'I stopped hiding. I started showing up.',
                                stars: 5,
                            },
                            {
                                name: 'Layla',
                                age: '34',
                                city: 'Dubai',
                                image: '/transformation-1.webp',
                                concern: ['Felt invisible — colours always', 'washing her out'],
                                finding: ['Inverted triangle frame', 'Warm autumn undertone'],
                                changed: ['Deep warm palette introduced', 'V-necks and boat necks prioritised', 'Cool greys eliminated entirely'],
                                quote: 'People keep asking what I did differently.',
                                stars: 5,
                            },
                            {
                                name: 'Nour',
                                age: '27',
                                city: 'Toronto',
                                image: '/transformation-2.webp',
                                concern: ['Modest dresser who felt', 'frumpy despite spending on clothes'],
                                finding: ['Hourglass frame, short vertical line', 'Warm neutral undertone'],
                                changed: ['Monochromatic dressing introduced', 'Hem lengths and layering calibrated', 'Accessories scaled to frame'],
                                quote: 'Shopping is no longer overwhelming.',
                                stars: 5,
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
                                        <p className="iconik-display text-luxury-charcoal text-lg leading-none">{c.name} · {c.age} · {c.city}</p>
                                        <div className="mt-3 h-px bg-luxury-cream" />
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-x-3 items-start">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxury-charcoal/40 pt-0.5">Concern</span>
                                        <span className="iconik-mono text-luxury-charcoal/80 text-sm leading-snug">{c.concern.join(' ')}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-x-3 items-start">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxury-charcoal/40 pt-0.5">Finding</span>
                                        <div className="space-y-0.5">
                                            {c.finding.map((f, i) => (
                                                <p key={i} className="iconik-mono text-luxury-charcoal/80 text-sm leading-snug">{f}</p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-x-3 items-start">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxury-charcoal/40 pt-0.5">Changed</span>
                                        <div className="space-y-1">
                                            {c.changed.map((ch, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-[#2C2622] mt-1.5 flex-shrink-0" />
                                                    <p className="iconik-mono text-luxury-charcoal/80 text-sm leading-snug">{ch}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-px bg-luxury-cream" />
                                    <div>
                                        <p className="iconik-mono text-luxury-charcoal italic text-sm leading-relaxed mb-3">&ldquo;{c.quote}&rdquo;</p>
                                        <div className="flex gap-1">
                                            {[...Array(c.stars)].map((_, i) => (
                                                <Star key={i} className="h-3.5 w-3.5 text-[#9a7d4a] fill-current" />
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
            <section className="py-24 px-4 md:px-6 me-slate">
                <div className="max-w-3xl mx-auto text-center text-luxury-warm-white">
                    <p className="iconik-mono text-luxury-warm-white/70 text-lg leading-relaxed mb-8">
                        An in-person personal styling session with a professional stylist costs $500–1,500+. They give you one day. You forget half of it. You still don&apos;t know your colours.
                    </p>
                    <div className="bg-luxury-warm-white/10 backdrop-blur-sm border border-luxury-warm-white/20 rounded-2xl p-10 mb-10">
                        <div className="iconik-mono text-luxury-warm-white/60 text-xs tracking-widest uppercase mb-3">Your ICONIK Blueprint</div>
                        <div className="text-4xl md:text-7xl iconik-display text-luxury-warm-white mb-3">$97</div>
                        <p className="iconik-mono text-luxury-warm-white/70 text-lg">
                            Yours forever. Built on your specific body, face, and colour profile.
                        </p>
                    </div>
                    <Link
                        href="/globe/checkout"
                        onClick={() => trackCTAClick('Get My Blueprint', 'Globe Price Section', 97, 'USD', 'Globe Funnel')}
                        className="inline-flex items-center bg-luxury-warm-white hover:bg-luxury-cream text-[#6B7F87] px-10 py-4 rounded-full transition-all duration-300 iconik-mono hover:shadow-xl hover:-translate-y-0.5 transform font-semibold"
                    >
                        GET MY BLUEPRINT — $97 <ArrowRight className="ml-3 h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* ── SECTION 8: Before/After ───────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="iconik-mono text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">The Blueprint in Practice</p>
                        <h2 className="text-2xl md:text-6xl iconik-display text-luxury-charcoal mb-4">Real clients. Specific findings. Measurable change.</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                        {[
                            {
                                before: '/style-before.webp',
                                after: '/style-after.webp',
                                beforeLabel: 'Before — avoiding structure entirely',
                                afterLabel: 'After — Geometric Silhouette Profile™ applied',
                                caption: 'Sara, 34, New York · Rectangle frame · Warm autumn undertone · Blueprint prescribed vertical seams, structured shoulders, dark palette',
                            },
                            {
                                before: '/wardrobe-before.webp',
                                after: '/wardrobe-after.webp',
                                beforeLabel: 'Before — dressing to hide',
                                afterLabel: 'After — Concern Zone Solutions applied',
                                caption: 'Layla, 29, Dubai · Apple frame · Cool neutral undertone · Blueprint prescribed empire cuts, A-line silhouettes, deep cool palette',
                            },
                        ].map((comparison, index) => (
                            <div
                                key={index}
                                className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-2"
                            >
                                <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
                                    <div>
                                        <p className="text-[10px] font-semibold text-luxury-charcoal/50 uppercase tracking-widest mb-3 leading-tight">{comparison.beforeLabel}</p>
                                        <div className="relative w-full aspect-square rounded-xl overflow-hidden" style={{ background: '#EDE5D2' }}>
                                            <Image src={comparison.before} alt={comparison.beforeLabel} fill className="object-cover" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-[#6B7F87] uppercase tracking-widest mb-3 leading-tight">{comparison.afterLabel}</p>
                                        <div className="relative w-full aspect-square rounded-xl overflow-hidden" style={{ background: '#EDE5D2' }}>
                                            <Image src={comparison.after} alt={comparison.afterLabel} fill className="object-cover" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs md:text-sm iconik-mono text-luxury-charcoal/60 leading-relaxed border-t border-luxury-cream pt-4">{comparison.caption}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 9: Sound Familiar? ────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl md:text-6xl iconik-display text-luxury-charcoal">Sound Familiar?</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        {[
                            {
                                num: '01',
                                text: 'You get dressed every morning and something still feels off. Not wrong exactly. Just never quite right.',
                                image: '/feeling-overlooked1.webp',
                                imageAlt: 'Woman at mirror',
                            },
                            {
                                num: '02',
                                text: "You've tried the body type guides. The Pinterest boards. The 'flattering for pears' articles. Nothing has stuck.",
                                image: '/style-confusion1.webp',
                                imageAlt: 'Woman with clothes',
                            },
                            {
                                num: '03',
                                text: "The weight hasn't changed. The budget hasn't changed. But every outfit still feels like a compromise.",
                                image: '/confidence-issues1.webp',
                                imageAlt: 'Woman looking at mirror side-on',
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
                                <span className="block iconik-display text-2xl mb-4 leading-none text-[#6B7F87]">{item.num}</span>
                                <p className="iconik-mono text-luxury-charcoal/80 text-base leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 10: Who This Is For ───────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="iconik-mono text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">This Is For You If</p>
                        <h2 className="text-2xl md:text-5xl iconik-display text-luxury-charcoal">Who This Is For</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            "You've been buying clothes that look good in the store but wrong on you.",
                            "You know something is off about your style but can't pinpoint what it is.",
                            "You're tired of wasting money on pieces that end up unworn.",
                            "You want to dress with intention — not trend-chase.",
                            "You're ready to understand your geometry, your colours, and your face — for good.",
                        ].map((line, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 bg-luxury-warm-white/80 border border-luxury-cream rounded-xl hover:bg-luxury-warm-white transition-all duration-300">
                                <CheckCircle className="w-5 h-5 text-[#6B7F87] flex-shrink-0 mt-0.5" />
                                <p className="iconik-mono text-luxury-charcoal/80 text-sm md:text-base leading-relaxed">{line}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <CTAButton />
                    </div>
                </div>
            </section>

            {/* ── SECTION 11: Testimonials ──────────────────────────────── */}
            <section id="testimonials" className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl md:text-6xl iconik-display text-luxury-charcoal mb-4">Client Stories</h2>
                        <p className="iconik-mono text-luxury-charcoal/60 text-sm md:text-lg">What women around the world are saying.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 md:gap-10">
                        {[
                            { ...testimonials[0], img: '/transformation-1.webp' },
                            { ...testimonials[1], img: '/ia-transformation-3.webp' },
                            { ...testimonials[2], img: '/transformation-2.webp' },
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
                                    <p className="iconik-mono text-luxury-charcoal/80 text-center leading-relaxed">
                                        &ldquo;{t.quote}&rdquo;
                                    </p>
                                    <div className="text-center">
                                        <p className="iconik-mono text-luxury-charcoal/60 mb-3">{t.name}</p>
                                        <p className="iconik-mono text-[#6B7F87] text-xs mb-3">{t.tag}</p>
                                        <div className="flex justify-center gap-1">
                                            {[...Array(5)].map((_, j) => (
                                                <Star key={j} className="h-4 w-4 text-[#9a7d4a] fill-current" />
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
            <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="iconik-mono text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">The Process</p>
                        <h2 className="text-2xl md:text-6xl iconik-display text-luxury-charcoal">How It Works</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { step: '01', title: 'Purchase & Upload', desc: 'Complete your purchase. Upload two photos — one full body, one headshot. Fill in 9 questions. Takes 4 minutes.' },
                            { step: '02', title: 'We Analyse', desc: 'Our proprietary ICONIK methodology analyses your geometry, colour profile, and facial architecture.' },
                            { step: '03', title: 'You Receive', desc: 'Your personalised 12–18 page Blueprint arrives in your inbox within 72 hours. Yours to keep forever.' },
                        ].map((s, i) => (
                            <div
                                key={i}
                                className="p-8 bg-luxury-warm-white/80 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-2xl hover:-translate-y-1 text-center"
                            >
                                <div className="text-5xl iconik-display text-[#6B7F87]/20 mb-4">{s.step}</div>
                                <h3 className="iconik-display text-luxury-charcoal text-xl mb-3">{s.title}</h3>
                                <p className="iconik-mono text-luxury-charcoal/60 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 8: FAQ ─────────────────────────────────────────── */}
            <section id="faq" className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl md:text-5xl iconik-display text-luxury-charcoal mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="iconik-mono text-luxury-charcoal/60 max-w-xl mx-auto text-sm md:text-base">
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
                                    <h3 className="text-base md:text-lg iconik-display text-luxury-charcoal">{faq.question}</h3>
                                    <span className="text-[#6B7F87] font-bold text-xl flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                                </div>
                                {openFaq === i && (
                                    <p className="iconik-mono text-luxury-charcoal/70 text-sm md:text-base leading-relaxed mt-3 border-t border-luxury-cream pt-3">
                                        {faq.answer}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 9: Final CTA ──────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 text-center" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-3xl mx-auto">
                    <div>
                        <h2 className="text-2xl md:text-6xl iconik-display text-luxury-charcoal mb-6 leading-tight">
                            Most women spend years buying clothes that{' '}
                            <span className="text-[#6B7F87]">almost</span> work.
                        </h2>
                        <p className="text-base md:text-xl iconik-mono text-luxury-charcoal/60 mb-10 leading-relaxed">
                            Your Blueprint tells you exactly what does.
                        </p>
                        <CTAButton className="text-base px-12 py-5 mb-6" />
                        <div className="flex items-center justify-center gap-3 text-sm iconik-mono text-luxury-charcoal/50 mt-4 flex-wrap">
                            <span>★★★★★ Trusted by 500+ women worldwide</span>
                            <span>·</span>
                            <span>24-Hour Delivery</span>
                            <span>·</span>
                            <span>30-Day Guarantee</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Minimal Footer ────────────────────────────────────────── */}
            <footer className="py-8 px-6 bg-luxury-cream/20 text-center border-t border-luxury-cream">
                <p className="iconik-mono text-luxury-charcoal/40 text-xs">
                    © {new Date().getFullYear()} ICONIK Style Intelligence ·{' '}
                    <Link href="/privacy-policy" className="hover:text-luxury-charcoal transition-colors">Privacy</Link>
                    {' · '}
                    <Link href="/refund-policy" className="hover:text-luxury-charcoal transition-colors">Refund Policy</Link>
                </p>
            </footer>

            {/* ── Sticky Mobile CTA ─────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream p-3 md:hidden z-50">
                <div className="max-w-sm mx-auto">
                    <Link
                        href="/globe/checkout"
                        onClick={() => trackCTAClick('Get My Blueprint', 'Globe Sticky CTA', 97, 'USD', 'Globe Funnel')}
                        className="w-full bg-[#2C2622] hover:bg-[#3d3430] text-luxury-warm-white px-6 py-3.5 text-base rounded-full transition-all duration-300 iconik-mono text-center block font-semibold shadow-lg"
                    >
                        GET MY BLUEPRINT — $97
                    </Link>
                </div>
            </div>

        </div>
    );
}
