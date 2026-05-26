'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Sparkles, Star } from 'lucide-react';
import { trackPageView, trackCTAClick } from '@/lib/metaPixel';

// ── CTA Button ──────────────────────────────────────────────────────────────

function ScanCTA({ className = '', label = 'Start My Free Style Scan', source = 'Landing' }: {
    className?: string;
    label?: string;
    source?: string;
}) {
    return (
        <Link
            href="/stylist/style-score/scan"
            onClick={() => {
                trackCTAClick('Start My Free Style Scan', source, 0, 'USD', 'Style Scan Funnel');
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('style_scan_cta_clicked', { detail: { source } }));
                }
            }}
            className={`inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-4 rounded-full transition-all duration-300 luxury-body font-semibold hover:shadow-xl hover:-translate-y-0.5 transform ${className}`}
        >
            {label} <ArrowRight className="ml-3 h-4 w-4" />
        </Link>
    );
}

// ── Result Mockup ───────────────────────────────────────────────────────────

function ResultMockup() {
    const sampleColours = ['#C4956A', '#8B6914', '#E8C99A', '#D4A853', '#7C5C2E', '#F0E0C8'];
    const avoidColours = ['#E8E8F0', '#C8D8E8'];

    return (
        <div className="relative rounded-2xl overflow-hidden border border-luxury-cream shadow-2xl max-w-sm mx-auto">
            {/* macOS title bar */}
            <div className="bg-[#f0ede8] px-4 py-3 flex items-center gap-2 border-b border-[#e8e4de]">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="bg-white/70 rounded-full px-4 py-1 text-[9px] text-luxury-charcoal/40 luxury-body tracking-wide">
                        iconik.pro/your-style-score
                    </div>
                </div>
            </div>

            {/* Report content */}
            <div className="bg-[#faf9f6] p-5 space-y-5">
                {/* Score */}
                <div className="bg-white rounded-xl p-4 border border-[#f0ede8]">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-2">ICONIK Style Score</p>
                    <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-4xl font-black text-black leading-none">72</span>
                        <span className="text-sm font-light text-gray-400">/100</span>
                    </div>
                    <div className="w-full bg-[#f0ede8] rounded-full h-1.5">
                        <div className="bg-[#b58e4d] h-1.5 rounded-full" style={{ width: '72%' }} />
                    </div>
                    <p className="text-[8px] text-gray-400 mt-2 font-light italic">Partial alignment — the science behind your instincts is missing</p>
                </div>

                {/* Colour Direction */}
                <div className="bg-white rounded-xl p-4 border border-[#f0ede8]">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-3">Colour Direction</p>
                    <p className="text-xs font-semibold text-black mb-3">Golden Neutrals</p>
                    <div className="flex gap-1.5">
                        {sampleColours.map((hex, i) => (
                            <div key={i} className="flex-1 aspect-square rounded-md border border-[#f0ede8]" style={{ backgroundColor: hex }} />
                        ))}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                        {avoidColours.map((hex, i) => (
                            <div key={i} className="w-7 h-7 rounded-md border-2 border-red-200 relative" style={{ backgroundColor: hex }}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-px bg-red-300 rotate-45 absolute" />
                                    <div className="w-full h-px bg-red-300 -rotate-45 absolute" />
                                </div>
                            </div>
                        ))}
                        <span className="text-[8px] text-gray-400 self-center ml-1 font-light">avoid</span>
                    </div>
                </div>

                {/* Silhouette */}
                <div className="bg-white rounded-xl p-4 border border-[#f0ede8]">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-2">Silhouette Direction</p>
                    <p className="text-xs font-semibold text-black">Define & Balance</p>
                    <p className="text-[9px] text-gray-400 mt-1 font-light">Hourglass — celebrate the natural waist</p>
                </div>

                {/* Mood Board */}
                <div className="bg-white rounded-xl p-4 border border-[#f0ede8]">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-3">Aesthetic Mood Board</p>
                    <div className="flex flex-wrap gap-1.5">
                        {['Clean Structure', 'Golden Restraint', 'Minimal Layering', 'Warm Precision'].map(k => (
                            <span key={k} className="px-2 py-1 bg-[#faf9f6] border border-[#f0ede8] text-[8px] font-black uppercase tracking-widest text-gray-500 rounded-full">
                                {k}
                            </span>
                        ))}
                    </div>
                </div>

                {/* What's Missing */}
                <div className="bg-black rounded-xl p-4">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-2">What&apos;s Missing</p>
                    <p className="text-[9px] text-white/70 font-light leading-relaxed">Geometry-first dressing — knowing precisely which silhouettes and cuts work for your specific proportions</p>
                </div>
            </div>
        </div>
    );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function StyleScoreLandingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        trackPageView('Style Score Landing');

        const handleCtaEvent = () => {
            if (typeof window !== 'undefined') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).fbq?.('trackCustom', 'start_style_scan', { funnel: 'style_scan' });
            }
        };
        window.addEventListener('style_scan_cta_clicked', handleCtaEvent);
        return () => window.removeEventListener('style_scan_cta_clicked', handleCtaEvent);
    }, []);

    const faqs = [
        { q: 'Is this free?', a: 'Yes. Your Style Score and Mood Board are completely free.' },
        { q: 'Do I need to upload a photo?', a: 'No. Photo upload is optional, but it can make your result more accurate.' },
        { q: 'Is this only for certain body types or ethnicities?', a: 'No. ICONIK is built for all body shapes, skin tones, lifestyles, and style preferences.' },
        { q: 'Will I get outfit recommendations?', a: 'Your free result gives you direction. The full Blueprint gives you complete outfit formulas.' },
        { q: 'How long does it take?', a: 'Around 3 minutes.' },
    ];

    const resultCards = [
        { title: 'ICONIK Style Score', desc: 'Your personal style alignment number — how well your current wardrobe serves your features', icon: '01' },
        { title: 'Colour Direction', desc: 'The palette framework built for your undertone', icon: '02' },
        { title: 'Silhouette Insight', desc: 'Which cuts and shapes work specifically for your proportions', icon: '03' },
        { title: 'Personal Mood Board', desc: 'Your aesthetic direction — a preview of what your full Blueprint would build on', icon: '04' },
    ];

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed top-0 w-full bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
                    <span className="text-3xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                </div>
            </nav>

            {/* ── Section 1: Hero ─────────────────────────────────────── */}
            <section className="pt-28 pb-16 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-luxury-accent/10 text-luxury-accent px-4 py-1.5 rounded-full luxury-body text-xs font-semibold uppercase tracking-wider mb-6">
                                <Sparkles className="w-3 h-3" />
                                Free ICONIK Style Scan
                            </div>
                            <h1 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-5 leading-[1.05] tracking-tight">
                                Discover why your clothes don&apos;t feel like you.
                            </h1>
                            <p className="luxury-body text-luxury-charcoal/70 text-base md:text-lg leading-relaxed mb-8">
                                Get your free ICONIK Style Score and Personal Mood Board based on your colours, body proportions, style goals, and outfit struggles.
                            </p>
                            <ScanCTA className="text-base px-12 py-5" source="Hero" />
                            <p className="luxury-body text-luxury-charcoal/40 text-xs mt-4">
                                Takes 3 minutes · Free personalized result · No styling knowledge needed.
                            </p>
                            <div className="flex items-center gap-2 mt-6">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-luxury-gold fill-current" />)}
                                </div>
                                <span className="luxury-body text-luxury-charcoal/50 text-xs">Trusted by 500+ women worldwide</span>
                            </div>
                        </div>
                        <div>
                            <ResultMockup />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 2: Problem ──────────────────────────────────── */}
            <section className="py-16 px-4 md:px-6 bg-luxury-cream/30">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-4xl luxury-heading text-luxury-charcoal mb-6 leading-tight">
                        Most people don&apos;t have a shopping problem. They have a style alignment problem.
                    </h2>
                    <div className="space-y-3 text-left max-w-xl mx-auto mb-8">
                        {[
                            'Your colours may be fighting your undertone.',
                            'Your silhouettes may be cutting your body at the wrong points.',
                            'Your outfits may look fine individually, but disconnected together.',
                        ].map((line, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-luxury-accent mt-2 flex-shrink-0" />
                                <p className="luxury-body text-luxury-charcoal/70">{line}</p>
                            </div>
                        ))}
                    </div>
                    <p className="luxury-body text-luxury-charcoal/60 mb-8">
                        ICONIK helps you find the visual rules that actually work for you.
                    </p>
                    <ScanCTA source="Problem Section" />
                </div>
            </section>

            {/* ── Section 3: What She Gets ─────────────────────────── */}
            <section className="py-20 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-3">Your Free Result Includes</p>
                        <h2 className="text-2xl md:text-4xl luxury-heading text-luxury-charcoal">Four things that change how you see your wardrobe.</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
                        {resultCards.map((card, i) => (
                            <div key={i} className="p-7 bg-luxury-cream/30 border border-luxury-cream rounded-2xl hover:-translate-y-0.5 transition-transform duration-300">
                                <div className="text-3xl luxury-heading text-luxury-accent/20 mb-3">{card.icon}</div>
                                <h3 className="luxury-heading text-luxury-charcoal text-lg mb-2">{card.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 4: How It Works ──────────────────────────── */}
            <section className="py-20 px-4 md:px-6 bg-luxury-cream/20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-3">The Process</p>
                        <h2 className="text-2xl md:text-4xl luxury-heading text-luxury-charcoal">How It Works</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        {[
                            { step: '01', title: 'Answer a few style questions', desc: 'Tell us what you struggle with, what you want to look like, and what outfits you\'re drawn to.' },
                            { step: '02', title: 'Get your Style Score', desc: 'We score your style alignment across colour, silhouette, aesthetic direction, and wardrobe consistency.' },
                            { step: '03', title: 'Unlock your Mood Board', desc: 'See your personal style direction and what your full ICONIK Blueprint would reveal.' },
                        ].map((s, i) => (
                            <div key={i} className="p-7 bg-luxury-warm-white/80 border border-luxury-cream rounded-2xl text-center hover:-translate-y-0.5 transition-transform duration-300">
                                <div className="text-4xl luxury-heading text-luxury-accent/20 mb-3">{s.step}</div>
                                <h3 className="luxury-heading text-luxury-charcoal text-base mb-3">{s.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <ScanCTA source="How It Works" />
                        <p className="luxury-body text-luxury-charcoal/40 text-xs mt-3">Takes 3 minutes · Free personalized result · No styling knowledge needed.</p>
                    </div>
                </div>
            </section>

            {/* ── Section 5: Blueprint Tease ───────────────────────── */}
            <section className="py-20 px-4 md:px-6 bg-luxury-accent">
                <div className="max-w-3xl mx-auto text-center text-luxury-warm-white">
                    <h2 className="text-2xl md:text-4xl luxury-heading mb-4">Your free result shows the direction. The Blueprint shows the science.</h2>
                    <p className="luxury-body text-luxury-warm-white/70 mb-10 leading-relaxed">
                        Your free Style Score gives you the surface-level direction.<br />
                        The full ICONIK Blueprint includes:
                    </p>
                    <div className="grid md:grid-cols-2 gap-3 text-left max-w-2xl mx-auto mb-10">
                        {[
                            'Your detailed colour palette',
                            'Body proportion analysis',
                            'Face and accessory direction',
                            'Outfit formulas for your lifestyle',
                            'What to avoid — and exactly why',
                            'Shopping rules',
                            'Styling logic behind every recommendation',
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle className="w-4 h-4 text-luxury-warm-white/60 flex-shrink-0" />
                                <span className="luxury-body text-luxury-warm-white/80 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/stylist/style-score/scan"
                        onClick={() => trackCTAClick('Start with My Free Style Score', 'Blueprint Tease', 0, 'USD', 'Style Scan Funnel')}
                        className="inline-flex items-center bg-luxury-warm-white hover:bg-luxury-cream text-luxury-accent px-10 py-4 rounded-full transition-all duration-300 luxury-body font-semibold hover:shadow-xl hover:-translate-y-0.5 transform"
                    >
                        Start with My Free Style Score <ArrowRight className="ml-3 h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* ── Section 6: FAQ ───────────────────────────────────── */}
            <section className="py-20 px-4 md:px-6 bg-luxury-warm-white">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-4xl luxury-heading text-luxury-charcoal">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className="p-5 bg-luxury-cream/20 border border-luxury-cream rounded-xl cursor-pointer hover:bg-luxury-cream/40 transition-colors"
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            >
                                <div className="flex justify-between items-center gap-4">
                                    <h3 className="luxury-heading text-luxury-charcoal text-base">{faq.q}</h3>
                                    <span className="text-luxury-accent font-bold text-xl flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                                </div>
                                {openFaq === i && (
                                    <p className="luxury-body text-luxury-charcoal/70 text-sm leading-relaxed mt-3 border-t border-luxury-cream pt-3">{faq.a}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ────────────────────────────────────────── */}
            <section className="py-20 px-4 md:px-6 bg-luxury-cream/20 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl md:text-4xl luxury-heading text-luxury-charcoal mb-4 leading-tight">
                        Find out what&apos;s been missing from your style.
                    </h2>
                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Free. Takes 3 minutes. No styling knowledge needed.</p>
                    <ScanCTA className="text-base px-12 py-5" source="Final CTA" />
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 bg-luxury-warm-white text-center border-t border-luxury-cream">
                <p className="luxury-body text-luxury-charcoal/40 text-xs">
                    © {new Date().getFullYear()} ICONIK Style Intelligence ·{' '}
                    <Link href="/privacy-policy" className="hover:text-luxury-charcoal transition-colors">Privacy</Link>
                    {' · '}
                    <Link href="/refund-policy" className="hover:text-luxury-charcoal transition-colors">Refund Policy</Link>
                </p>
            </footer>

            {/* Sticky Mobile CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream p-3 md:hidden z-50">
                <div className="max-w-sm mx-auto">
                    <Link
                        href="/stylist/style-score/scan"
                        onClick={() => trackCTAClick('Start My Free Style Scan', 'Sticky Mobile', 0, 'USD', 'Style Scan Funnel')}
                        className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-6 py-3.5 text-base rounded-full transition-all duration-300 luxury-body text-center block font-semibold shadow-lg"
                    >
                        Start My Free Style Scan
                    </Link>
                </div>
            </div>

        </div>
    );
}
