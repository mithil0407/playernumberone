'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Star, ArrowRight, Sparkles, Gem, Shield, Award, Trophy, ArrowLeft } from 'lucide-react';
import { MAN_BLUEPRINT_PRODUCT_ID, MAN_FUNNEL_CATEGORY, trackPageView, trackViewContent, trackCTAClick } from '@/lib/metaPixel';
import { captureAttribution } from '@/lib/attribution';
import { useManRegion } from '@/hooks/useManRegion';
import { getManPricing, type ManPricing } from '@/lib/manPricing';

// ── Data ─────────────────────────────────────────────────────────────────────

const pillars = [
    {
        icon: <Gem className="h-5 w-5" style={{ color: '#94A6AD' }} />,
        number: '01',
        title: 'Geometric Frame Profiling',
        body: 'We identify your exact body geometry — shoulder-to-hip ratio, torso length, vertical line. Every cut and silhouette that works with your specific frame, defined by science, not guesswork.',
    },
    {
        icon: <Sparkles className="h-5 w-5" style={{ color: '#94A6AD' }} />,
        number: '02',
        title: 'Chromatic Harmony Mapping',
        body: 'Your undertone, depth, and contrast level determines every colour that sharpens your complexion — and every colour that washes you out. We map yours precisely.',
    },
    {
        icon: <Award className="h-5 w-5" style={{ color: '#94A6AD' }} />,
        number: '03',
        title: 'Facial Architecture Analysis',
        body: 'Your face shape determines your collar styles, lapel widths, eyewear, and hairstyles. Most men have never been told their face architecture — until now.',
    },
];

const blueprintItems = [
    { icon: <Trophy className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Geometric Frame Profile', desc: 'Your exact frame type with technical rationale — what cuts and silhouettes flatter every proportion.' },
    { icon: <Award className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Facial Architecture Profile', desc: 'Your face shape with structure-specific collar, eyewear, and hairstyle recommendations.' },
    { icon: <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Chromatic Harmony Map', desc: 'Your personal colour palette: 10 exact colours that work for your undertone + depth.' },
    { icon: <Gem className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Outfit Formulas', desc: '20 complete outfits (shirt, trousers, footwear, outerwear) built specifically for your frame — office, casual, Indian occasion, weekend.' },
    { icon: <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Fit & Proportion Solutions', desc: 'Your specific concern — broad shoulders, narrow frame, belly — addressed with the exact cuts that solve it.' },
    { icon: <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Created by an ICONIK Stylist', desc: 'Your Blueprint is personally reviewed and built by an ICONIK stylist — not a quiz, not an algorithm.' },
    { icon: <Award className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'What to Avoid', desc: 'Cuts, colours, and silhouettes that will never serve you — and exactly why.' },
];

const testimonials = [
    {
        quote: 'I have been dressing randomly my entire life. The Blueprint told me things I had never been told by any stylist. I now walk into a store, go straight to what works, and leave.',
        name: 'Karan, Mumbai',
        tag: 'Blueprint: Athletic Build · Warm Autumn',
        img: '/men-review-karan.webp',
    },
    {
        quote: 'The colour palette was a game changer. My skin looks better in photos than ever. People keep asking what I did differently.',
        name: 'Siddharth, Delhi',
        tag: 'Blueprint: Rectangle Frame · Cool Neutral',
        img: '/men-review-siddharth.webp',
    },
    {
        quote: 'Stopped buying clothes that just sit in my wardrobe. Shopping is no longer trial and error. I know my system now.',
        name: 'Nikhil, Bangalore',
        tag: 'Blueprint: Rectangle Frame · Warm Neutral',
        img: '/men-review-nikhil.webp',
    },
];

const faqs = [
    { question: "Is this actually useful for men or just a women's service repackaged?", answer: "ICONIK for men was built specifically around how men's bodies, wardrobes, and style goals work. The Blueprint covers your frame geometry, face shape, undertone, grooming, and real outfit formulas for office, casual, and Indian occasions — all through a male lens." },
    { question: 'What photos do I need to submit?', answer: "Two photos: a full-length photo (standing, natural light, fitted clothes so we can see your frame) and a clear headshot. We'll guide you after purchase." },
    { question: 'How long does it take to receive my Blueprint?', answer: 'Within 72 hours of submitting your intake form and photos.' },
    { question: "What if I just want to look sharp, not stylish?", answer: "That's exactly the goal. The Blueprint isn't about trends — it's about identifying what fits your body well, what colours make you look healthy, and what silhouettes project authority. Sharp and unfussy is the outcome." },
    { question: "What if I'm not happy?", answer: "100% satisfaction guarantee. If your Blueprint needs adjustments, email us and we'll revise the report until it reflects your needs clearly." },
    { question: "Can I do this if I don't know anything about my body type or colours?", answer: "Yes. That's exactly who this is for. You don't need to know anything. That's what we figure out." },
];

// ── CTA Button ────────────────────────────────────────────────────────────────

function CTAButton({ className = '', pricing, label }: { className?: string; pricing: ManPricing; label?: string }) {
    return (
        <Link
            href="/man/checkout"
            onClick={() => trackCTAClick('Get My Blueprint', 'Man Landing', pricing.basePrice, pricing.currency, MAN_FUNNEL_CATEGORY)}
            className={`inline-flex items-center gap-3 bg-[#2C2622] hover:bg-[#3d3430] text-[#F4EFE5] px-8 py-4 rounded-full transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 transform ${className}`}
        >
            <span className="iconik-display" style={{ fontSize: '15px' }}>{label ?? `Get My Blueprint — ${pricing.displayBase}`}</span>
            <ArrowRight className="h-4 w-4 opacity-60" />
        </Link>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

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
        captureAttribution();
        trackPageView('Man Landing');
    }, []);

    useEffect(() => {
        if (isLoading) return;
        trackViewContent('ICONIK Man Style Blueprint', pricing.basePrice, [MAN_BLUEPRINT_PRODUCT_ID], pricing.currency, MAN_FUNNEL_CATEGORY);
    }, [isLoading, pricing.basePrice, pricing.currency]);

    useEffect(() => {
        const timer = setInterval(nextSlide, 4000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <div className="man-editorial min-h-screen overflow-x-hidden">

            {/* ── Navbar ──────────────────────────────────────────────────── */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl" style={{ background: 'rgba(248,243,233,0.95)', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
                    <span className="iconik-display" style={{ fontSize: '22px', letterSpacing: '0.12em', color: '#2C2622' }}>ICONIK</span>
                </div>
            </nav>

            {/* ── SECTION 1: Hero ──────────────────────────────────────────── */}
            <section className="pt-24 pb-16 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-5xl mx-auto text-center">

                    {/* Featured in */}
                    <div className="mb-6">
                        <div className="iconik-micro mb-3 opacity-45" style={{ color: '#2C2622' }}>Featured in</div>
                        <div className="flex items-center justify-center gap-8">
                            <Image src="/times-of-india-logo.png" alt="Times of India" width={100} height={30} className="opacity-35 hover:opacity-60 transition-opacity h-[30px] w-auto" />
                            <Image src="/vogue-india-logo.png" alt="Vogue India" width={60} height={20} className="opacity-35 hover:opacity-60 transition-opacity h-[20px] w-auto md:h-[25px]" />
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="iconik-display mb-5 leading-none" style={{ fontSize: 'clamp(36px, 8vw, 80px)', color: '#2C2622' }}>
                        Build Your{' '}
                        <span className="iconik-display-it" style={{ color: '#6B7F87' }}>Signature Style</span>
                    </h1>
                    <div className="iconik-display-it mb-8" style={{ fontSize: 'clamp(28px, 5vw, 52px)', color: '#2C2622', opacity: 0.75 }}>
                        in 72 hours.
                    </div>

                    {/* Subheadline */}
                    <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#2C2622', opacity: 0.65, maxWidth: '600px', margin: '0 auto 32px' }}>
                        Get <strong style={{ fontWeight: 500, opacity: 1, color: '#2C2622' }}>20 personalised outfits</strong>, your{' '}
                        <strong style={{ fontWeight: 500, opacity: 1, color: '#2C2622' }}>colour palette</strong>, and a{' '}
                        <strong style={{ fontWeight: 500, opacity: 1, color: '#2C2622' }}>full style blueprint created by an ICONIK stylist</strong> — built for how men actually dress.{' '}
                        <strong style={{ fontWeight: 500, color: '#2C2622' }}>{isLoading ? '...' : pricing.displayBase}.</strong>
                    </p>

                    {/* Carousel */}
                    <div className="max-w-sm mx-auto mb-8">
                        <div className="rounded-3xl p-4 md:p-6" style={{ background: 'rgba(237,229,210,0.5)', border: '1px solid rgba(44,38,34,0.08)' }}>
                            <div className="flex items-center justify-center gap-3 md:gap-4">
                                <button onClick={prevSlide} className="p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0 hover:-translate-x-0.5" style={{ background: '#F8F3E9', border: '1px solid rgba(44,38,34,0.1)' }} aria-label="Previous image">
                                    <ArrowLeft className="w-4 h-4" style={{ color: '#2C2622' }} />
                                </button>
                                <div className="relative w-52 md:w-64" style={{ aspectRatio: '3/4' }}>
                                    <div className="w-full h-full rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(44,38,34,0.1)' }}>
                                        <Image src={heroImages[carouselIndex].src} alt={heroImages[carouselIndex].caption} fill className="object-cover" priority={carouselIndex === 0} />
                                    </div>
                                </div>
                                <button onClick={nextSlide} className="p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0 hover:translate-x-0.5" style={{ background: '#F8F3E9', border: '1px solid rgba(44,38,34,0.1)' }} aria-label="Next image">
                                    <ArrowRight className="w-4 h-4" style={{ color: '#2C2622' }} />
                                </button>
                            </div>
                            <div className="iconik-micro mt-4 opacity-40 text-center" style={{ color: '#2C2622' }}>{heroImages[carouselIndex].caption}</div>
                            <div className="flex justify-center gap-2 mt-3">
                                {heroImages.map((_, idx) => (
                                    <button key={idx} onClick={() => setCarouselIndex(idx)} className="h-1.5 rounded-full transition-all duration-300" style={{ width: idx === carouselIndex ? '16px' : '6px', background: idx === carouselIndex ? '#2C2622' : 'rgba(44,38,34,0.2)' }} aria-label={`Go to slide ${idx + 1}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <CTAButton className="text-base px-10 py-5 mb-8" pricing={pricing} />

                    {/* Trust strip */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: '#9a7d4a' }} />)}
                        </div>
                        <span className="iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>Trusted by 200+ men across India</span>
                        <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.3 }}>·</span>
                        <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>72-Hour Delivery</span>
                        <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.3 }}>·</span>
                        <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>7-Day Guarantee</span>
                    </div>
                </div>
            </section>

            {/* ── SECTION 2: Stats strip ───────────────────────────────────── */}
            <section className="py-12 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { num: '200+', label: 'Blueprints Delivered' },
                            { num: '4.9', label: 'Average Rating', star: true },
                            { num: '72h', label: 'Delivery Time' },
                            { num: '100%', label: 'Satisfaction Guarantee' },
                        ].map((s) => (
                            <div key={s.label}>
                                <div className="iconik-display flex items-center justify-center gap-1.5" style={{ fontSize: 'clamp(28px, 5vw, 48px)', color: '#2C2622' }}>
                                    {s.num}
                                    {s.star && <Star className="h-5 w-5 fill-current" style={{ color: '#9a7d4a' }} />}
                                </div>
                                <div className="iconik-micro mt-2 opacity-50" style={{ color: '#2C2622' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 3: Report Preview ────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="iconik-micro mb-3 opacity-45" style={{ color: '#2C2622' }}>Sample Report</div>
                        <div className="iconik-display" style={{ fontSize: 'clamp(28px, 5vw, 52px)', color: '#2C2622' }}>What Your Blueprint Actually Looks Like</div>
                    </div>

                    {/* Browser frame */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(44,38,34,0.1)' }}>
                        <div className="px-5 py-3 flex items-center gap-3" style={{ background: '#EDE5D2', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                            </div>
                            <div className="flex-1 flex justify-center">
                                <div className="rounded-full px-5 py-1.5" style={{ background: 'rgba(255,255,255,0.7)' }}>
                                    <span className="iconik-mono opacity-40" style={{ fontSize: '10px', color: '#2C2622' }}>iconik.pro/your-blueprint</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[640px] overflow-y-auto overflow-x-hidden" style={{ background: '#faf9f6', scrollbarWidth: 'thin' }}>

                            {/* Report nav */}
                            <div className="sticky top-0 z-10 px-6 md:px-10 h-14 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 bg-[#2C2622] flex items-center justify-center">
                                        <Sparkles className="text-[#9a7d4a]" size={14} />
                                    </div>
                                    <span className="iconik-mono" style={{ fontSize: '10px', color: '#2C2622', letterSpacing: '0.4em', fontWeight: 700 }}>ICONIK <span style={{ color: '#9a7d4a' }}>BLUEPRINT</span></span>
                                </div>
                                <span className="iconik-mono opacity-25" style={{ fontSize: '9px', color: '#2C2622' }}>PRO EDITION // 2025</span>
                            </div>

                            {/* Report header */}
                            <div className="px-6 md:px-10 py-10" style={{ borderBottom: '1px solid rgba(44,38,34,0.06)', background: '#fff' }}>
                                <div className="flex items-center gap-3 mb-3" style={{ color: '#9a7d4a' }}>
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="iconik-mono" style={{ fontSize: '9px', letterSpacing: '0.4em', fontWeight: 700 }}>ANALYSIS VERIFIED</span>
                                </div>
                                <div className="iconik-display-it" style={{ fontSize: 'clamp(32px, 6vw, 56px)', color: '#2C2622', lineHeight: 1 }}>The Lookbook</div>
                                <div className="flex flex-wrap gap-3 mt-4">
                                    <span className="iconik-mono px-4 py-2" style={{ background: '#2C2622', color: '#9a7d4a', fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>Athletic Build</span>
                                    <span className="iconik-mono px-4 py-2" style={{ background: '#faf9f6', border: '1px solid rgba(44,38,34,0.08)', color: '#2C2622', opacity: 0.45, fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>Oval Face</span>
                                    <span className="iconik-mono px-4 py-2" style={{ background: '#faf9f6', border: '1px solid rgba(44,38,34,0.08)', color: '#2C2622', opacity: 0.45, fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>20 Ensembles</span>
                                </div>
                            </div>

                            {/* Section 01: Body Frame */}
                            <div style={{ background: '#fff', borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                                <div className="px-6 md:px-10 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                                    <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                                    <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.5em', fontWeight: 700 }}>SECTION 01 — GEOMETRIC FRAME PROFILE™</span>
                                    <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                                </div>
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto flex-shrink-0 overflow-hidden" style={{ borderRight: '1px solid rgba(44,38,34,0.06)', background: '#f5f3ef' }}>
                                        <Image src="/men-report-body-shape.webp" alt="Body Frame Analysis" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 p-6 md:p-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="iconik-mono px-4 py-2" style={{ background: '#2C2622', color: '#9a7d4a', fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>Athletic Build</span>
                                            <span style={{ fontSize: '12px', color: '#2C2622', opacity: 0.4 }}>Your dominant frame geometry</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            {[
                                                { label: 'Shoulder–Hip Ratio', value: 'Broader shoulders — inverted V frame' },
                                                { label: 'Torso Length', value: 'Average — standard proportions' },
                                                { label: 'Waist Definition', value: 'Moderate — slight taper visible' },
                                                { label: 'Vertical Line', value: 'Elongated — favours clean verticals' },
                                            ].map((row) => (
                                                <div key={row.label}>
                                                    <span className="iconik-mono block mb-0.5" style={{ fontSize: '8px', color: '#9a7d4a', letterSpacing: '0.2em', fontWeight: 700 }}>{row.label}</span>
                                                    <span style={{ fontSize: '12px', color: '#2C2622', fontWeight: 300 }}>{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pl-5 py-1" style={{ borderLeft: '2px solid rgba(154,125,74,0.2)' }}>
                                            <p className="iconik-mono mb-2" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.3em', fontWeight: 700, fontStyle: 'italic' }}>Styling Directive</p>
                                            <p style={{ fontSize: '12px', color: '#2C2622', opacity: 0.55, fontStyle: 'italic', lineHeight: 1.7, fontWeight: 300 }}>&ldquo;Lean into the V-taper. Avoid boxy oversized fits. Slim-straight trousers and fitted shirts maintain proportional balance.&rdquo;</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 02: Face Shape */}
                            <div style={{ background: '#faf9f6', borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                                <div className="px-6 md:px-10 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
                                    <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                                    <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.5em', fontWeight: 700 }}>SECTION 02 — FACIAL ARCHITECTURE ANALYSIS™</span>
                                    <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                                </div>
                                <div className="flex flex-col md:flex-row" style={{ background: '#fff' }}>
                                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto flex-shrink-0 overflow-hidden" style={{ borderRight: '1px solid rgba(44,38,34,0.06)', background: '#f5f3ef' }}>
                                        <Image src="/men-report-face-shape.webp" alt="Face Shape Analysis" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 p-6 md:p-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="iconik-mono px-4 py-2" style={{ background: '#2C2622', color: '#9a7d4a', fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>Oval Face</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="iconik-mono mb-4" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.3em', fontWeight: 700 }}>Recommended For You</p>
                                                <div className="space-y-3">
                                                    {[
                                                        { label: 'Collar', value: 'Spread, button-down, open notch — all work' },
                                                        { label: 'Eyewear', value: 'Square, aviator, round — versatile' },
                                                        { label: 'Hairstyle', value: 'Most cuts — textured, side-part, undercut' },
                                                    ].map((item) => (
                                                        <div key={item.label}>
                                                            <span className="iconik-mono block mb-0.5" style={{ fontSize: '8px', color: '#9a7d4a', letterSpacing: '0.2em', fontWeight: 700 }}>{item.label}</span>
                                                            <span style={{ fontSize: '12px', color: '#2C2622', fontWeight: 300 }}>{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="iconik-mono mb-4" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.3em', fontWeight: 700 }}>Avoid</p>
                                                <div className="space-y-2">
                                                    {['Turtlenecks that compress the neck', 'Very wide lapels that widen the jaw', 'Round wire frames that echo face shape'].map((item) => (
                                                        <div key={item} className="flex items-start gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-red-300" />
                                                            <span style={{ fontSize: '12px', color: '#2C2622', opacity: 0.55, fontWeight: 300 }}>{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 03: Chromatic */}
                            <div style={{ background: '#fff', borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                                <div className="px-6 md:px-10 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                                    <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                                    <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.5em', fontWeight: 700 }}>SECTION 03 — CHROMATIC HARMONY MAP™</span>
                                    <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                                </div>
                                <div className="p-6 md:p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <span className="iconik-mono px-4 py-2" style={{ background: '#2C2622', color: '#9a7d4a', fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>Warm Undertone · Medium Depth</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <p className="iconik-mono mb-5" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.3em', fontWeight: 700 }}>Your 10 Colours</p>
                                            <div className="grid grid-cols-5 gap-2 mb-3">
                                                {['#C4956A','#8B6914','#D4A853','#7C4A1E','#E8C99A','#5C3D2E','#F0E0C8','#9E6B3F','#3D2B1F','#B8860B'].map((hex) => (
                                                    <div key={hex} className="aspect-square rounded-lg shadow-sm" style={{ background: hex, border: '1px solid rgba(44,38,34,0.06)' }} />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="iconik-mono mb-5" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.3em', fontWeight: 700 }}>Eliminate These 4</p>
                                            <div className="grid grid-cols-4 gap-2 mb-3">
                                                {['#E8E8F0','#C8D8E8','#F0E8F8','#D0E8D0'].map((hex) => (
                                                    <div key={hex} className="aspect-square rounded-lg relative shadow-sm" style={{ background: hex, border: '2px solid rgba(239,68,68,0.3)' }}>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-full h-px bg-red-300 rotate-45 absolute" />
                                                            <div className="w-full h-px bg-red-300 -rotate-45 absolute" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 04: Outfits teaser */}
                            <div className="px-6 md:px-10 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(44,38,34,0.06)', background: '#faf9f6' }}>
                                <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                                <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.5em', fontWeight: 700 }}>SECTION 04 — YOUR 20 OUTFIT FORMULAS</span>
                                <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                            </div>
                            <div style={{ background: '#fff', borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto flex-shrink-0 overflow-hidden" style={{ borderRight: '1px solid rgba(44,38,34,0.06)', background: '#f5f3ef' }}>
                                        <Image src="/men-report-preview-1.webp" alt="The Command Look" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 p-6 md:p-10">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.4em', fontWeight: 700 }}>Business Ensemble</span>
                                        </div>
                                        <div className="iconik-display-it mb-5" style={{ fontSize: 'clamp(22px, 3vw, 30px)', color: '#2C2622' }}>The Command Look</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="iconik-mono mb-4" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.3em', fontWeight: 700 }}>Composition</p>
                                                <div className="space-y-3">
                                                    {[
                                                        { label: 'Top', value: 'Slim-fit Oxford shirt in white — clean, no pattern noise' },
                                                        { label: 'Bottom', value: 'Slim-straight trousers in charcoal grey, tapered ankle' },
                                                        { label: 'Footwear', value: 'Derby shoes in dark tan — grounded authority' },
                                                        { label: 'Outerwear', value: 'Unstructured blazer in camel — soft but sharp' },
                                                    ].map((item) => (
                                                        <div key={item.label}>
                                                            <span className="iconik-mono block mb-0.5" style={{ fontSize: '8px', color: '#9a7d4a', letterSpacing: '0.2em', fontWeight: 700 }}>{item.label}</span>
                                                            <span style={{ fontSize: '12px', color: '#2C2622', fontWeight: 300 }}>{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pl-5 py-1 self-start" style={{ borderLeft: '2px solid rgba(154,125,74,0.2)' }}>
                                                <p className="iconik-mono mb-2" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.3em', fontWeight: 700, fontStyle: 'italic' }}>Stylist Rationale</p>
                                                <p style={{ fontSize: '12px', color: '#2C2622', opacity: 0.5, fontStyle: 'italic', lineHeight: 1.7, fontWeight: 300 }}>&ldquo;The monochromatic grey-white axis reads as quietly powerful. The blazer adds structure. Camel grounds the warm undertone.&rdquo;</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Outfits teaser */}
                            <div className="px-6 md:px-10 py-10 text-center" style={{ background: '#fff' }}>
                                <span className="iconik-mono opacity-25" style={{ fontSize: '9px', color: '#2C2622', letterSpacing: '0.5em', fontWeight: 700 }}>+ 16 More Ensembles in Your Blueprint</span>
                            </div>
                        </div>

                        {/* Bottom fade */}
                        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none rounded-b-2xl" style={{ background: 'linear-gradient(to top, #faf9f6, transparent)' }} />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                            <span className="iconik-mono opacity-30" style={{ fontSize: '9px', color: '#2C2622', letterSpacing: '0.3em' }}>Scroll to explore</span>
                            <ArrowRight size={10} className="rotate-90 opacity-30" style={{ color: '#2C2622' }} />
                        </div>
                    </div>

                    <div className="text-center mt-10">
                        <CTAButton pricing={pricing} />
                    </div>
                </div>
            </section>

            {/* ── SECTION 4: The ICONIK Method ─────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="iconik-micro mb-4 opacity-45" style={{ color: '#2C2622' }}>The Methodology</div>
                        <div className="iconik-display mb-4" style={{ fontSize: 'clamp(32px, 6vw, 60px)', color: '#2C2622' }}>The ICONIK Method</div>
                        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#2C2622', opacity: 0.6, maxWidth: '520px', margin: '0 auto' }}>
                            Three proprietary analysis systems. Thousands of data points. One blueprint built entirely around you.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {pillars.map((p) => (
                            <div key={p.number} className="p-8 rounded-2xl hover:-translate-y-1 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(44,38,34,0.08)' }}>
                                <div className="mb-4">{p.icon}</div>
                                <div className="iconik-display mb-3" style={{ fontSize: '40px', color: 'rgba(44,38,34,0.12)' }}>{p.number}</div>
                                <div className="iconik-display mb-3" style={{ fontSize: '20px', color: '#2C2622' }}>{p.title}</div>
                                <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#2C2622', opacity: 0.6 }}>{p.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 5: What's Inside ──────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="iconik-micro mb-4 opacity-45" style={{ color: '#2C2622' }}>Included</div>
                        <div className="iconik-display" style={{ fontSize: 'clamp(32px, 6vw, 60px)', color: '#2C2622' }}>What&apos;s Inside Your Blueprint</div>
                    </div>
                    <div className="max-w-2xl mx-auto">
                        {blueprintItems.map((item, i) => (
                            <div key={i} className="flex items-start gap-5 py-5 transition-all duration-300" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
                                {item.icon}
                                <div>
                                    <div className="iconik-display mb-1" style={{ fontSize: '17px', color: '#2C2622' }}>{item.title}</div>
                                    <p style={{ fontSize: '13px', lineHeight: 1.75, color: '#2C2622', opacity: 0.6 }}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <CTAButton pricing={pricing} />
                    </div>
                </div>
            </section>

            {/* ── SECTION 6: Case Studies ───────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="iconik-micro mb-4 opacity-45" style={{ color: '#2C2622' }}>Real Findings</div>
                        <div className="iconik-display mb-3" style={{ fontSize: 'clamp(32px, 6vw, 60px)', color: '#2C2622' }}>What the Blueprint actually found</div>
                        <p style={{ fontSize: '15px', color: '#2C2622', opacity: 0.55 }}>Three men. Three different frames. Three specific solutions.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: 'Rohan', age: '31', city: 'Mumbai', image: '/men-case-rohan.webp', concern: ['Broad shoulders, always looked', 'too formal or too casual'], finding: ['Athletic inverted-V frame', 'Warm autumn undertone'], changed: ['Unstructured blazers replaced stiff jackets', 'Slim-straight replaced skinny', 'Warm palette — camel, olive, rust introduced'], quote: 'I walk into meetings and the room shifts.', stars: 5 },
                            { name: 'Dev', age: '28', city: 'Delhi', image: '/men-case-dev.webp', concern: ['Slim frame, clothes', 'always looked borrowed'], finding: ['Rectangle frame — minimal taper', 'Cool neutral undertone'], changed: ['Structured shoulders introduced', 'Layering system built for depth', 'Jewel tones replaced all-black uniform'], quote: 'I look like I dressed on purpose now.', stars: 5 },
                            { name: 'Amit', age: '35', city: 'Bangalore', image: '/men-case-amit.webp', concern: ['Post-30 belly — avoided', 'anything fitted for years'], finding: ['Rectangle frame, medium vertical', 'Warm neutral undertone'], changed: ['Straight-cut kurtas replaced baggy shirts', 'Dark warm palette — no more grey everywhere', 'Fit calibrated to shoulder, not belly'], quote: 'Shopping is no longer trial and error.', stars: 4 },
                        ].map((c) => (
                            <div key={c.name} className="rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(44,38,34,0.08)' }}>
                                <div className="aspect-square overflow-hidden" style={{ background: 'rgba(237,229,210,0.5)' }}>
                                    <Image src={c.image} alt={c.name} width={300} height={300} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <div className="iconik-display" style={{ fontSize: '18px', color: '#2C2622' }}>{c.name} · {c.age} · {c.city}</div>
                                        <div className="mt-3 me-rule-thin" />
                                    </div>
                                    {[
                                        { label: 'Concern', val: c.concern.join(' ') },
                                        { label: 'Finding', val: c.finding.join(' · ') },
                                    ].map((row) => (
                                        <div key={row.label} className="grid gap-x-3" style={{ gridTemplateColumns: '70px 1fr' }}>
                                            <span className="iconik-mono pt-0.5" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.2em', fontWeight: 700 }}>{row.label}</span>
                                            <span style={{ fontSize: '13px', color: '#2C2622', opacity: 0.75, lineHeight: 1.6 }}>{row.val}</span>
                                        </div>
                                    ))}
                                    <div className="grid gap-x-3" style={{ gridTemplateColumns: '70px 1fr' }}>
                                        <span className="iconik-mono pt-0.5" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.2em', fontWeight: 700 }}>Changed</span>
                                        <div className="space-y-1">
                                            {c.changed.map((ch) => (
                                                <div key={ch} className="flex items-start gap-2">
                                                    <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#94A6AD' }} />
                                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.75, lineHeight: 1.6 }}>{ch}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="me-rule-thin" />
                                    <div>
                                        <div className="iconik-display-it mb-3" style={{ fontSize: '14px', color: '#2C2622', opacity: 0.7, lineHeight: 1.6 }}>&ldquo;{c.quote}&rdquo;</div>
                                        <div className="flex gap-1">
                                            {[...Array(c.stars)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" style={{ color: '#9a7d4a' }} />)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 7: Price Anchor ───────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 me-slate">
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <p style={{ fontSize: '17px', lineHeight: 1.85, color: '#F4EFE5', opacity: 0.75, marginBottom: '32px', maxWidth: '520px', margin: '0 auto 32px' }}>
                        A personal styling session in India costs ₹15,000–50,000+. They give you one day. You forget half of it. You still don&apos;t know your colours or your frame.
                    </p>
                    <div className="rounded-2xl p-10 mb-10 me-glass-light">
                        <div className="iconik-micro mb-3 opacity-55" style={{ color: '#F4EFE5' }}>Your ICONIK Man Blueprint</div>
                        <div className="iconik-display mb-3" style={{ fontSize: 'clamp(40px, 8vw, 72px)', color: '#F4EFE5' }}>{isLoading ? '...' : pricing.displayBase}</div>
                        <p style={{ fontSize: '16px', color: '#F4EFE5', opacity: 0.7, lineHeight: 1.8 }}>Yours forever. Built on your specific frame, face, and colour profile.</p>
                    </div>
                    <Link
                        href="/man/checkout"
                        onClick={() => trackCTAClick('Get My Blueprint', 'Man Price Section', pricing.basePrice, pricing.currency, MAN_FUNNEL_CATEGORY)}
                        className="inline-flex items-center gap-4 px-10 py-5 rounded-full transition-all duration-300 hover:opacity-75 me-glass-light"
                    >
                        <span className="iconik-display" style={{ fontSize: '16px', color: '#F4EFE5' }}>Get My Blueprint — {isLoading ? '...' : pricing.displayBase}</span>
                        <ArrowRight className="h-4 w-4 opacity-60" style={{ color: '#F4EFE5' }} />
                    </Link>
                </div>
            </section>

            {/* ── SECTION 8: Before / After ─────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="iconik-micro mb-4 opacity-45" style={{ color: '#2C2622' }}>The Blueprint in Practice</div>
                        <div className="iconik-display" style={{ fontSize: 'clamp(28px, 5vw, 52px)', color: '#2C2622' }}>Real clients. Specific findings. Measurable change.</div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            { before: '/men-style-before.webp', after: '/men-style-after.webp', beforeLabel: 'Before — ill-fitting silhouette, wrong palette', afterLabel: 'After — Geometric Frame Profile™ applied', caption: 'Rohan, 31, Mumbai · Athletic inverted-V frame · Warm autumn undertone · Blueprint prescribed unstructured blazers, slim-straight, warm camel-olive palette' },
                            { before: '/men-wardrobe-before.webp', after: '/men-wardrobe-after.webp', beforeLabel: 'Before — dressing to disappear', afterLabel: 'After — Fit & Proportion Solutions applied', caption: 'Amit, 35, Bangalore · Rectangle frame · Warm neutral undertone · Blueprint prescribed straight-cut kurtas, structured shoulders, dark warm palette' },
                        ].map((comparison) => (
                            <div key={comparison.caption} className="rounded-3xl p-6 md:p-8 hover:-translate-y-1 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(44,38,34,0.08)' }}>
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <p className="iconik-micro mb-3 opacity-45" style={{ color: '#2C2622' }}>{comparison.beforeLabel}</p>
                                        <div className="relative w-full aspect-square rounded-xl overflow-hidden"><Image src={comparison.before} alt={comparison.beforeLabel} fill className="object-cover" /></div>
                                    </div>
                                    <div>
                                        <p className="iconik-micro mb-3" style={{ color: '#94A6AD' }}>{comparison.afterLabel}</p>
                                        <div className="relative w-full aspect-square rounded-xl overflow-hidden"><Image src={comparison.after} alt={comparison.afterLabel} fill className="object-cover" /></div>
                                    </div>
                                </div>
                                <div className="me-rule-thin mb-4" />
                                <p style={{ fontSize: '12px', color: '#2C2622', opacity: 0.55, lineHeight: 1.8 }}>{comparison.caption}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 9: Sound Familiar ─────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="iconik-display" style={{ fontSize: 'clamp(32px, 6vw, 60px)', color: '#2C2622' }}>Sound Familiar?</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {[
                            { num: '01', text: "You get dressed every morning and it still feels like you're guessing. Not wrong exactly. Just never sharp.", image: '/men-feeling-overlooked1.webp', imageAlt: 'Man at mirror' },
                            { num: '02', text: "You've read the guides. Watched the videos. Tried the capsule wardrobe. Nothing has actually stuck.", image: '/men-style-confusion1.webp', imageAlt: 'Man with clothes' },
                            { num: '03', text: "The budget is fine. The clothes are fine. But every outfit still feels like you could have done better.", image: '/men-confidence-issues1.webp', imageAlt: 'Man looking at himself' },
                        ].map((item) => (
                            <div key={item.num} className="rounded-3xl p-6 md:p-8 hover:-translate-y-1 transition-all duration-300" style={{ background: '#EDE5D2', border: '1px solid rgba(44,38,34,0.08)' }}>
                                <div className="relative w-full aspect-square mb-6 rounded-xl overflow-hidden">
                                    <Image src={item.image} alt={item.imageAlt} fill className="object-cover" />
                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(44,38,34,0.3), transparent)' }} />
                                </div>
                                <div className="iconik-display mb-4" style={{ fontSize: '24px', color: '#94A6AD' }}>{item.num}</div>
                                <p style={{ fontSize: '14px', color: '#2C2622', opacity: 0.75, lineHeight: 1.75 }}>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 10: Who It's For ──────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="iconik-micro mb-4 opacity-45" style={{ color: '#2C2622' }}>This Is For You If</div>
                        <div className="iconik-display" style={{ fontSize: 'clamp(28px, 5vw, 48px)', color: '#2C2622' }}>Who This Is For</div>
                    </div>
                    <div className="space-y-0">
                        {[
                            "You've been buying clothes that look fine in the store but never quite right on you.",
                            "You know something is off about your style but can't pinpoint what it is.",
                            "You're tired of wasting money on pieces that end up unworn.",
                            "You want to dress with intention — not guess every morning.",
                            "You're ready to understand your frame, your colours, and your face — for good.",
                        ].map((line, i) => (
                            <div key={i} className="flex items-start gap-5 py-5" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
                                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />
                                <p style={{ fontSize: '15px', color: '#2C2622', opacity: 0.75, lineHeight: 1.75 }}>{line}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <CTAButton pricing={pricing} />
                    </div>
                </div>
            </section>

            {/* ── SECTION 11: Testimonials ──────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="iconik-display mb-3" style={{ fontSize: 'clamp(32px, 6vw, 60px)', color: '#2C2622' }}>Client Stories</div>
                        <p style={{ fontSize: '15px', color: '#2C2622', opacity: 0.55 }}>What men across India are saying.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((t) => (
                            <div key={t.name} className="p-8 rounded-2xl hover:-translate-y-1 transition-all duration-300" style={{ background: '#EDE5D2', border: '1px solid rgba(44,38,34,0.08)' }}>
                                <div className="space-y-5">
                                    <div className="aspect-square rounded-xl overflow-hidden relative" style={{ background: 'rgba(237,229,210,0.5)' }}>
                                        <Image src={t.img} alt={t.name} fill className="object-cover" />
                                    </div>
                                    <div className="iconik-display-it text-center" style={{ fontSize: '14px', color: '#2C2622', opacity: 0.75, lineHeight: 1.7 }}>
                                        &ldquo;{t.quote}&rdquo;
                                    </div>
                                    <div className="text-center">
                                        <div className="iconik-display mb-1" style={{ fontSize: '15px', color: '#2C2622' }}>{t.name}</div>
                                        <div className="iconik-mono mb-3" style={{ fontSize: '10px', color: '#94A6AD', opacity: 0.8 }}>{t.tag}</div>
                                        <div className="flex justify-center gap-1">
                                            {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-current" style={{ color: '#9a7d4a' }} />)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 12: How It Works ──────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="iconik-micro mb-4 opacity-45" style={{ color: '#2C2622' }}>The Process</div>
                        <div className="iconik-display" style={{ fontSize: 'clamp(32px, 6vw, 60px)', color: '#2C2622' }}>How It Works</div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { step: '01', title: 'Purchase & Fill In', desc: 'Complete your purchase. Upload two photos — one full body, one headshot. Fill in 8 questions about your lifestyle and goals. Takes 4 minutes.' },
                            { step: '02', title: 'We Analyse', desc: "Our proprietary ICONIK methodology analyses your frame, colour profile, and facial architecture — built specifically for how men dress." },
                            { step: '03', title: 'You Receive', desc: 'Your personalised Blueprint arrives within 72 hours. 20 outfits, your colour palette, your face architecture guide. Yours to keep forever.' },
                        ].map((s) => (
                            <div key={s.step} className="p-8 rounded-2xl text-center hover:-translate-y-1 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(44,38,34,0.08)' }}>
                                <div className="iconik-display mb-4" style={{ fontSize: '48px', color: 'rgba(44,38,34,0.1)' }}>{s.step}</div>
                                <div className="iconik-display mb-3" style={{ fontSize: '20px', color: '#2C2622' }}>{s.title}</div>
                                <p style={{ fontSize: '14px', color: '#2C2622', opacity: 0.6, lineHeight: 1.75 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 13: FAQ ───────────────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="iconik-display mb-3" style={{ fontSize: 'clamp(28px, 5vw, 48px)', color: '#2C2622' }}>Frequently Asked Questions</div>
                        <p style={{ fontSize: '15px', color: '#2C2622', opacity: 0.55, maxWidth: '380px', margin: '0 auto' }}>Everything you need to know about your Blueprint.</p>
                    </div>
                    <div className="space-y-0">
                        {faqs.map((faq, i) => (
                            <div key={i} className="cursor-pointer py-5" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                <div className="flex justify-between items-center gap-4">
                                    <div className="iconik-display" style={{ fontSize: '17px', color: '#2C2622', lineHeight: 1.4 }}>{faq.question}</div>
                                    <span className="iconik-mono flex-shrink-0 opacity-35" style={{ fontSize: '18px', color: '#2C2622' }}>{openFaq === i ? '−' : '+'}</span>
                                </div>
                                {openFaq === i && (
                                    <p style={{ fontSize: '14px', color: '#2C2622', opacity: 0.65, lineHeight: 1.8, marginTop: '12px' }}>{faq.answer}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 14: Final CTA ─────────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 text-center me-slate relative">
                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="iconik-display mb-3" style={{ fontSize: 'clamp(28px, 5vw, 52px)', color: '#F4EFE5', lineHeight: 1.1 }}>
                        Most men spend years buying clothes that{' '}
                        <span className="iconik-display-it opacity-55">almost</span> work.
                    </div>
                    <p style={{ fontSize: '17px', color: '#F4EFE5', opacity: 0.75, marginTop: '16px', marginBottom: '40px', lineHeight: 1.85 }}>
                        Your Blueprint tells you exactly what does.
                    </p>
                    <Link
                        href="/man/checkout"
                        onClick={() => trackCTAClick('Final CTA Man', 'Bottom Section', pricing.basePrice, pricing.currency, MAN_FUNNEL_CATEGORY)}
                        className="inline-flex items-center gap-5 px-10 py-5 rounded-full mb-6 hover:opacity-75 transition-opacity me-glass-light"
                    >
                        <span className="iconik-display" style={{ fontSize: '32px', color: '#F4EFE5' }}>{isLoading ? '...' : pricing.displayBase}</span>
                        <div className="w-px h-7" style={{ background: 'rgba(244,239,229,0.25)' }} />
                        <span className="iconik-display-it" style={{ fontSize: '18px', color: '#F4EFE5' }}>Get My Blueprint →</span>
                    </Link>
                    <div className="flex items-center justify-center gap-3 flex-wrap" style={{ marginTop: '16px' }}>
                        <span className="iconik-mono opacity-50" style={{ fontSize: '11px', color: '#F4EFE5' }}>★★★★★ Trusted by 200+ men {isIndia ? 'across India' : 'worldwide'}</span>
                        <span className="hidden md:inline iconik-mono opacity-30" style={{ fontSize: '11px', color: '#F4EFE5' }}>·</span>
                        <span className="hidden md:inline iconik-mono opacity-50" style={{ fontSize: '11px', color: '#F4EFE5' }}>72-Hour Delivery</span>
                        <span className="hidden md:inline iconik-mono opacity-30" style={{ fontSize: '11px', color: '#F4EFE5' }}>·</span>
                        <span className="hidden md:inline iconik-mono opacity-50" style={{ fontSize: '11px', color: '#F4EFE5' }}>7-Day Money-Back Guarantee</span>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <footer className="py-12 px-6" style={{ background: '#EDE5D2', borderTop: '1px solid rgba(44,38,34,0.08)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <span className="iconik-display" style={{ fontSize: '20px', letterSpacing: '0.08em', color: '#2C2622' }}>ICONIK</span>
                        <div className="flex flex-wrap justify-center gap-6" style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5 }}>
                            <Link href="/privacy-policy" className="hover:opacity-100 transition-opacity">Privacy Policy</Link>
                            <Link href="/refund-policy" className="hover:opacity-100 transition-opacity">Refund Policy</Link>
                            <Link href="/terms" className="hover:opacity-100 transition-opacity">Terms of Service</Link>
                            <a href="mailto:help.iconikfashion@gmail.com" className="hover:opacity-100 transition-opacity">help.iconikfashion@gmail.com</a>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(44,38,34,0.08)' }}>
                        <p className="iconik-micro opacity-35" style={{ color: '#2C2622' }}>© {new Date().getFullYear()} ICONIK. All rights reserved. Personal styling for Indian men who dress with purpose.</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}
