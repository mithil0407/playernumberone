'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Star, ArrowRight, Sparkles, Gem, Heart, Shield, Award, Trophy, ArrowLeft } from 'lucide-react';
import { trackPageView, trackViewContent, trackCTAClick } from '@/lib/metaPixel';

// ── Data ────────────────────────────────────────────────────────────────────

const pillars = [
    {
        icon: <Gem className="h-6 w-6 text-luxury-green" />,
        number: '01',
        title: 'Geometric Silhouette Profiling',
        body: 'We identify your exact body geometry — every proportion ratio and structural strength. Every cut that works with your specific frame, defined by science, not guesswork.',
    },
    {
        icon: <Sparkles className="h-6 w-6 text-luxury-green" />,
        number: '02',
        title: 'Chromatic Harmony Mapping',
        body: 'Your undertone, depth, and contrast level determines every colour that makes you glow — and every colour that washes you out. We map yours precisely.',
    },
    {
        icon: <Award className="h-6 w-6 text-luxury-green" />,
        number: '03',
        title: 'Facial Architecture Analysis',
        body: 'Your face shape determines your necklines, eyewear, earring geometry, and hair structures. Most women have never been told their face architecture — until now.',
    },
];

const blueprintItems = [
    { icon: <Trophy className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Body Geometry Analysis', desc: 'Your exact silhouette type with technical rationale — what cuts flatter every proportion.' },
    { icon: <Award className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Face Architecture Profile', desc: 'Your face shape with structure-specific neckline, earring, and eyewear recommendations.' },
    { icon: <Sparkles className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Chromatic Harmony Map', desc: 'Your seasonal colour palette: 10 exact colours that work for your undertone + depth.' },
    { icon: <Gem className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Outfit Formulas', desc: '6 complete outfits (top, bottom, footwear, bag, jewellery) built specifically for your Blueprint.' },
    { icon: <Heart className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Hair Direction', desc: '4 hairstyle recommendations with technical explanation of why each works for your face shape.' },
    { icon: <Shield className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'Eyewear Guide', desc: '4 frame styles matched to your face geometry and undertone.' },
    { icon: <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />, title: 'What to Avoid', desc: 'Cuts, colours, and silhouettes that will never serve you — and exactly why.' },
];

const testimonials = [
    {
        quote: 'I have been dressing for the wrong body shape my entire life. The Blueprint told me things I had never been told by any stylist. I now walk into a store, go straight to what works, and leave.',
        name: 'Sara, Dubai',
        tag: 'Blueprint: Inverted Triangle · Cool Autumn',
    },
    {
        quote: 'I was sceptical. I have done colour analysis before and it felt too general. This was different — the face architecture section alone was worth three times the price.',
        name: 'Layla, Abu Dhabi',
        tag: 'Blueprint: Oval · Warm Spring',
    },
    {
        quote: 'The outfit formulas changed everything. I finally have a system, not just a wardrobe full of things that almost work.',
        name: 'Nour, Sharjah',
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
        answer: 'Within 24 hours of submitting your intake form and photos. Most clients receive theirs within a few hours.',
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
            onClick={() => trackCTAClick('Get My Blueprint', 'Globe Landing', 349, 'AED', 'Globe Funnel')}
            className={`inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-4 rounded-full transition-all duration-300 luxury-body hover:shadow-xl hover:-translate-y-0.5 transform ${className}`}
        >
            GET MY BLUEPRINT — AED 349 <ArrowRight className="ml-3 h-4 w-4" />
        </Link>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function GlobeLandingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);

    const heroImages = useMemo(() => [
        { src: '/transformation-1.webp', caption: 'Blueprint transformation · Sara, Dubai' },
        { src: '/au-hero-2.webp', caption: 'Blueprint transformation · Layla, Abu Dhabi' },
        { src: '/transformation-2.webp', caption: 'Blueprint transformation · Nour, Sharjah' },
    ], []);

    const nextSlide = useCallback(() => setCarouselIndex(i => (i + 1) % heroImages.length), [heroImages.length]);
    const prevSlide = useCallback(() => setCarouselIndex(i => (i - 1 + heroImages.length) % heroImages.length), [heroImages.length]);

    useEffect(() => {
        trackPageView('Globe Landing');
        trackViewContent('ICONIK Blueprint Globe', 349, ['iconik_blueprint_globe'], 'AED', 'Globe Funnel');
    }, []);

    useEffect(() => {
        const timer = setInterval(nextSlide, 4000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden">

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
                        <h1 className="text-3xl md:text-7xl luxury-heading text-luxury-charcoal mb-6 leading-[0.95] tracking-tight">
                            Discover your exact colours, silhouettes,{' '}
                            <span className="text-luxury-accent">and cuts.</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-sm md:text-xl luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto mb-8 leading-relaxed">
                            ICONIK analyses your facial architecture, body geometry, and colour harmony using a proprietary methodology used by professional stylists.{' '}
                            <span className="font-semibold text-luxury-accent">Personalised Blueprint. 24-hour delivery. AED 349.</span>
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
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'bg-luxury-accent w-4' : 'bg-luxury-accent/30'
                                                }`}
                                            aria-label={`Go to slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <CTAButton className="text-base px-12 py-5 mb-8" />

                        <div className="flex items-center justify-center gap-3 text-sm luxury-body text-luxury-charcoal/60 flex-wrap mt-2">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 text-luxury-gold fill-current" />
                                ))}
                            </div>
                            <span className="text-luxury-charcoal/80 font-medium">Trusted by 500+ women worldwide</span>
                            <span className="hidden md:inline">·</span>
                            <span className="hidden md:inline">24-Hour Delivery</span>
                            <span className="hidden md:inline">·</span>
                            <span className="hidden md:inline">30-Day Guarantee</span>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── Stats strip ───────────────────────────────────────────── */}
            <section className="py-12 bg-luxury-cream/30">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
                        {[
                            { num: '500+', label: 'Blueprints Delivered' },
                            { num: '4.9', label: 'Average Rating', star: true },
                            { num: '24h', label: 'Delivery Time' },
                            { num: '30-day', label: 'Money-Back Guarantee' },
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

            {/* ── SECTION 2: Pain Cards ──────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {[
                            { icon: '🛍️', text: 'You spend hours shopping online. Everything looks different when it arrives.' },
                            { icon: '✨', text: 'You\'ve tried trends. Nothing feels like YOU — it just feels expensive.' },
                            { icon: '💭', text: 'You know something is off. You just don\'t know what — or how to fix it.' },
                        ].map((card, i) => (
                            <div
                                key={i}
                                className="p-8 bg-luxury-cream/40 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 rounded-2xl hover:-translate-y-1"
                            >
                                <div className="text-3xl mb-4">{card.icon}</div>
                                <p className="luxury-body text-luxury-charcoal/80 leading-relaxed">{card.text}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center luxury-body text-luxury-charcoal/60 text-lg max-w-3xl mx-auto leading-relaxed">
                        Most women have never been told the three things that actually determine whether a piece of clothing works for them. It has nothing to do with size — it has everything to do with{' '}
                        <strong className="text-luxury-charcoal">geometry</strong>.
                    </p>
                </div>
            </section>

            {/* ── SECTION 3: ICONIK Method ───────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-cream/20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="luxury-body text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">The Methodology</p>
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal leading-tight">
                            A system, not an opinion.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        {pillars.map((p, i) => (
                            <div
                                key={i}
                                className="p-8 bg-luxury-warm-white/80 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-2xl hover:-translate-y-2 group"
                            >
                                <div className="group-hover:scale-110 transition-transform duration-300 mb-5">{p.icon}</div>
                                <div className="luxury-body text-luxury-charcoal/40 text-xs tracking-widest uppercase mb-3">PILLAR {p.number}</div>
                                <h3 className="luxury-heading text-luxury-charcoal text-xl mb-3 leading-snug">{p.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed">{p.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 4: What's Inside ───────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="luxury-body text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">Your Deliverable</p>
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal mb-4">
                            What&apos;s Inside Your Blueprint
                        </h2>
                        <p className="luxury-body text-luxury-charcoal/60 text-sm md:text-lg">
                            A 12–18 page personalised report. Built on your body, face, and colour profile.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {blueprintItems.map((item, i) => (
                            <div
                                key={i}
                                className="flex gap-4 p-5 md:p-6 bg-luxury-cream/40 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 rounded-xl hover:-translate-y-1"
                            >
                                <div className="mt-0.5">{item.icon}</div>
                                <div>
                                    <div className="luxury-heading text-luxury-charcoal text-base mb-1">{item.title}</div>
                                    <div className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <CTAButton />
                    </div>
                </div>
            </section>

            {/* ── SECTION 5: Testimonials ────────────────────────────────── */}
            <section id="testimonials" className="py-24 px-4 md:px-6 bg-luxury-cream/20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal mb-4">Client Stories</h2>
                        <p className="luxury-body text-luxury-charcoal/60 text-sm md:text-lg">What women across the UAE are saying.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 md:gap-10">
                        {[
                            { ...testimonials[0], img: '/transformation-1.webp' },
                            { ...testimonials[1], img: '/au-testimonial-jess.webp' },
                            { ...testimonials[2], img: '/transformation-2.webp' },
                        ].map((t, i) => (
                            <div
                                key={i}
                                className="p-8 md:p-10 bg-luxury-warm-white/80 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-2xl hover:-translate-y-2"
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

            {/* ── SECTION 6: Price Anchor ────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-accent">
                <div className="max-w-3xl mx-auto text-center text-luxury-warm-white">
                    <p className="luxury-body text-luxury-warm-white/70 text-lg leading-relaxed mb-8">
                        An in-person personal styling session in Dubai or Abu Dhabi costs AED 800–2,000+. They give you one day. You forget half of it. You still don&apos;t know your colours.
                    </p>
                    <div className="bg-luxury-warm-white/10 backdrop-blur-sm border border-luxury-warm-white/20 rounded-2xl p-10 mb-10">
                        <div className="luxury-body text-luxury-warm-white/60 text-xs tracking-widest uppercase mb-3">Your ICONIK Blueprint</div>
                        <div className="text-4xl md:text-7xl luxury-heading text-luxury-warm-white mb-3">AED 349</div>
                        <p className="luxury-body text-luxury-warm-white/70 text-lg">
                            Yours forever. Built on your specific body, face, and colour profile.
                        </p>
                    </div>
                    <Link
                        href="/globe/checkout"
                        onClick={() => trackCTAClick('Get My Blueprint', 'Globe Price Section', 349, 'AED', 'Globe Funnel')}
                        className="inline-flex items-center bg-luxury-warm-white hover:bg-luxury-cream text-luxury-accent px-10 py-4 rounded-full transition-all duration-300 luxury-body hover:shadow-xl hover:-translate-y-0.5 transform font-semibold"
                    >
                        GET MY BLUEPRINT — AED 349 <ArrowRight className="ml-3 h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* ── SECTION 7: How It Works ────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="luxury-body text-luxury-charcoal/60 mb-4 tracking-widest text-xs uppercase">The Process</p>
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal">How It Works</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { step: '01', title: 'Purchase & Upload', desc: 'Complete your purchase. Upload two photos — one full body, one headshot. Fill in 9 questions. Takes 4 minutes.' },
                            { step: '02', title: 'We Analyse', desc: 'Our proprietary ICONIK methodology analyses your geometry, colour profile, and facial architecture.' },
                            { step: '03', title: 'You Receive', desc: 'Your personalised 12–18 page Blueprint arrives in your inbox within 24 hours. Yours to keep forever.' },
                        ].map((s, i) => (
                            <div
                                key={i}
                                className="p-8 bg-luxury-cream/40 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 rounded-2xl hover:-translate-y-1 text-center"
                            >
                                <div className="text-5xl luxury-heading text-luxury-accent/20 mb-4">{s.step}</div>
                                <h3 className="luxury-heading text-luxury-charcoal text-xl mb-3">{s.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 8: FAQ ─────────────────────────────────────────── */}
            <section id="faq" className="py-24 px-4 md:px-6 bg-luxury-cream/20">
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

            {/* ── SECTION 9: Final CTA ──────────────────────────────────── */}
            <section className="py-24 px-4 md:px-6 bg-luxury-warm-white text-center">
                <div className="max-w-3xl mx-auto">
                    <div>
                        <h2 className="text-2xl md:text-6xl luxury-heading text-luxury-charcoal mb-6 leading-tight">
                            Most women spend years buying clothes that{' '}
                            <span className="text-luxury-accent">almost</span> work.
                        </h2>
                        <p className="text-base md:text-xl luxury-body text-luxury-charcoal/60 mb-10 leading-relaxed">
                            Your Blueprint tells you exactly what does.
                        </p>
                        <CTAButton className="text-base px-12 py-5 mb-6" />
                        <div className="flex items-center justify-center gap-3 text-sm luxury-body text-luxury-charcoal/50 mt-4 flex-wrap">
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
                <p className="luxury-body text-luxury-charcoal/40 text-xs">
                    © {new Date().getFullYear()} ICONIK Style Intelligence · UAE ·{' '}
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
                        onClick={() => trackCTAClick('Get My Blueprint', 'Globe Sticky CTA', 349, 'AED', 'Globe Funnel')}
                        className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-6 py-3.5 text-base rounded-full transition-all duration-300 luxury-body text-center block font-semibold shadow-lg"
                    >
                        GET MY BLUEPRINT — AED 349
                    </Link>
                </div>
            </div>

        </div>
    );
}
