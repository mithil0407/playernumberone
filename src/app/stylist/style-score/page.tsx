'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
            className={`inline-flex items-center gap-3 bg-luxury-charcoal hover:bg-luxury-charcoal/90 text-luxury-warm-white px-10 py-4 rounded-full transition-all duration-300 luxury-body font-medium hover:shadow-xl hover:-translate-y-0.5 transform ${className}`}
        >
            {label} <ArrowRight className="h-4 w-4" />
        </Link>
    );
}

// ── Result Mockup ───────────────────────────────────────────────────────────

function ResultMockup() {
    const baseColours = ['#B85C38', '#D4B896', '#2C5F6B', '#6B5840', '#C8AC80'];
    const accentColours = ['#7A2840', '#C4A040', '#4A6850'];

    return (
        <div className="relative rounded-2xl overflow-hidden border border-luxury-cream shadow-2xl max-w-sm mx-auto">
            {/* Header bar */}
            <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ background: 'var(--iconik-slate)', borderBottom: '1px solid rgba(244,239,229,0.15)' }}
            >
                <span className="iconik-micro text-luxury-warm-white/70">iconik.pro/your-style-score</span>
                <span className="iconik-mono text-luxury-warm-white/50" style={{ fontSize: '10px' }}>01 / 04</span>
            </div>

            {/* Score section */}
            <div className="bg-luxury-warm-white p-5 space-y-4">
                <div className="bg-luxury-cream/40 rounded-xl p-4 border border-luxury-cream">
                    <p className="iconik-micro text-luxury-charcoal/40 mb-3">ICONIK Style Score</p>
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="iconik-display text-luxury-charcoal" style={{ fontSize: '48px' }}>72</span>
                        <span className="iconik-mono text-luxury-charcoal/30" style={{ fontSize: '14px' }}>/100</span>
                    </div>
                    <div className="w-full bg-luxury-cream rounded-full h-1">
                        <div className="h-1 rounded-full" style={{ width: '72%', background: 'var(--iconik-slate)' }} />
                    </div>
                    <p className="luxury-body text-luxury-charcoal/40 mt-2" style={{ fontSize: '9px' }}>Partial alignment — the science behind your instincts is missing</p>
                </div>

                <div className="rounded-xl p-4 border border-luxury-cream">
                    <p className="iconik-micro text-luxury-charcoal/40 mb-3">Colour Direction</p>
                    <div className="iconik-display text-luxury-charcoal mb-3" style={{ fontSize: '18px' }}>Deep Warm</div>
                    <div className="flex gap-1.5">
                        {baseColours.map((hex, i) => (
                            <div key={i} className="flex-1 rounded-lg border border-luxury-cream" style={{ backgroundColor: hex, aspectRatio: '1/1' }} />
                        ))}
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                        {accentColours.map((hex, i) => (
                            <div key={i} className="w-6 h-6 rounded-lg border border-luxury-cream" style={{ backgroundColor: hex }} />
                        ))}
                        <span className="iconik-micro text-luxury-charcoal/30 self-center ml-1">accents</span>
                    </div>
                </div>

                <div
                    className="rounded-xl p-4"
                    style={{ background: 'var(--iconik-slate-deep)' }}
                >
                    <p className="iconik-micro text-luxury-warm-white/50 mb-2">What&apos;s Missing</p>
                    <p className="luxury-body text-luxury-warm-white/80" style={{ fontSize: '11px', lineHeight: '1.6' }}>
                        Geometry-first dressing — knowing precisely which silhouettes and cuts work for your proportions
                    </p>
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
        { num: '01', title: 'ICONIK Style Score', desc: 'Your personal style alignment number — how well your current wardrobe serves your features' },
        { num: '02', title: 'Colour Direction', desc: 'The palette framework built for your undertone' },
        { num: '03', title: 'Silhouette Insight', desc: 'Which cuts and shapes work specifically for your proportions' },
        { num: '04', title: 'Personal Mood Board', desc: 'Your aesthetic direction — a preview of what your full Blueprint would build on' },
    ];

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50" style={{ background: 'rgba(244,239,229,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--luxury-cream)' }}>
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div style={{ width: '80px' }} />
                    <span className="iconik-display text-luxury-charcoal" style={{ fontSize: '20px', letterSpacing: '0.38em', fontWeight: 400 }}>I C O N I K</span>
                    <div className="iconik-micro text-luxury-charcoal/40 hidden md:block" style={{ width: '80px', textAlign: 'right' }}>Free Scan</div>
                </div>
            </nav>

            {/* ── Hero ──────────────────────────────────────────────── */}
            <section className="pt-28 pb-20 px-4 md:px-6" style={{ background: 'var(--luxury-warm-white)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                        <div>
                            <div className="iconik-micro text-luxury-charcoal/40 mb-8">Free ICONIK Style Scan</div>

                            <h1 className="iconik-display text-luxury-charcoal mb-4" style={{ fontSize: 'clamp(48px, 7vw, 80px)' }}>
                                Discover why
                            </h1>
                            <h1 className="iconik-display-it text-luxury-charcoal mb-8" style={{ fontSize: 'clamp(48px, 7vw, 80px)', opacity: 0.85 }}>
                                your clothes don&apos;t feel like you.
                            </h1>

                            <div className="h-px bg-luxury-charcoal/10 mb-8" />

                            <p className="luxury-body text-luxury-charcoal/60 text-base leading-relaxed mb-10" style={{ fontWeight: 300 }}>
                                Get your free ICONIK Style Score and Personal Mood Board based on your colours, body proportions, style goals, and outfit struggles.
                            </p>

                            <ScanCTA className="text-base" source="Hero" />

                            <p className="luxury-body text-luxury-charcoal/35 text-xs mt-5">
                                Takes 3 minutes · Free personalized result · No styling knowledge needed.
                            </p>

                            <div className="flex items-center gap-3 mt-6">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-luxury-accent">
                                            <path d="M6 0l1.5 4.5H12L8.25 7.3l1.5 4.5L6 9 2.25 11.8l1.5-4.5L0 4.5h4.5z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="luxury-body text-luxury-charcoal/40 text-xs">Trusted by 500+ women worldwide</span>
                            </div>
                        </div>

                        <div>
                            <ResultMockup />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Problem ─────────────────────────────────────────── */}
            <section className="py-20 px-4 md:px-6" style={{ background: 'var(--luxury-cream)' }}>
                <div className="max-w-3xl mx-auto">
                    <div className="iconik-micro text-luxury-charcoal/40 mb-8 text-center">The Alignment Problem</div>

                    <h2 className="iconik-display text-luxury-charcoal mb-3 text-center" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
                        Most people don&apos;t have
                    </h2>
                    <h2 className="iconik-display-it text-luxury-charcoal mb-12 text-center" style={{ fontSize: 'clamp(36px, 5vw, 56px)', opacity: 0.8 }}>
                        a shopping problem.
                    </h2>

                    <div className="h-px bg-luxury-charcoal/12 mb-10" />

                    <div className="space-y-6 max-w-xl mx-auto mb-12">
                        {[
                            ['01', 'Your colours may be fighting your undertone.'],
                            ['02', 'Your silhouettes may be cutting your body at the wrong points.'],
                            ['03', 'Your outfits may look fine individually, but disconnected together.'],
                        ].map(([num, line]) => (
                            <div key={num} className="flex items-start gap-5">
                                <span className="iconik-mono text-luxury-charcoal/25" style={{ fontSize: '11px', paddingTop: '3px', flexShrink: 0 }}>{num}</span>
                                <p className="luxury-body text-luxury-charcoal/70" style={{ fontWeight: 300 }}>{line}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <p className="luxury-body text-luxury-charcoal/50 mb-8" style={{ fontWeight: 300 }}>
                            ICONIK helps you find the visual rules that actually work for you.
                        </p>
                        <ScanCTA source="Problem Section" />
                    </div>
                </div>
            </section>

            {/* ── What She Gets ──────────────────────────────────── */}
            <section className="py-20 px-4 md:px-6" style={{ background: 'var(--luxury-warm-white)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="iconik-micro text-luxury-charcoal/40 mb-4">Your Free Result Includes</div>
                        <h2 className="iconik-display text-luxury-charcoal" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
                            Four things that change
                        </h2>
                        <h2 className="iconik-display-it text-luxury-charcoal" style={{ fontSize: 'clamp(32px, 4vw, 52px)', opacity: 0.75 }}>
                            how you see your wardrobe.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                        {resultCards.map((card) => (
                            <div
                                key={card.num}
                                className="p-7 border border-luxury-cream rounded-2xl hover:-translate-y-0.5 transition-transform duration-300"
                                style={{ background: 'rgba(237,229,210,0.4)' }}
                            >
                                <div className="iconik-mono text-luxury-charcoal/20 mb-4" style={{ fontSize: '11px' }}>{card.num}</div>
                                <h3 className="iconik-display text-luxury-charcoal mb-3" style={{ fontSize: '22px' }}>{card.title}</h3>
                                <div className="h-px bg-luxury-charcoal/8 mb-3" />
                                <p className="luxury-body text-luxury-charcoal/55 text-sm leading-relaxed" style={{ fontWeight: 300 }}>{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ──────────────────────────────────── */}
            <section className="py-20 px-4 md:px-6" style={{ background: 'var(--luxury-cream)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="iconik-micro text-luxury-charcoal/40 mb-4">The Process</div>
                        <h2 className="iconik-display text-luxury-charcoal" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>How It Works</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
                        {[
                            { step: '01', title: 'Answer a few style questions', desc: 'Tell us what you struggle with, what you want to look like, and what outfits you\'re drawn to.' },
                            { step: '02', title: 'Get your Style Score', desc: 'We score your style alignment across colour, silhouette, aesthetic direction, and wardrobe consistency.' },
                            { step: '03', title: 'Unlock your Mood Board', desc: 'See your personal style direction and what your full ICONIK Blueprint would reveal.' },
                        ].map((s) => (
                            <div
                                key={s.step}
                                className="p-7 rounded-2xl border border-luxury-cream hover:-translate-y-0.5 transition-transform duration-300"
                                style={{ background: 'var(--luxury-warm-white)' }}
                            >
                                <div className="iconik-display text-luxury-charcoal/15 mb-4" style={{ fontSize: '40px' }}>{s.step}</div>
                                <h3 className="luxury-body text-luxury-charcoal font-medium mb-3" style={{ fontSize: '14px' }}>{s.title}</h3>
                                <p className="luxury-body text-luxury-charcoal/55 text-sm leading-relaxed" style={{ fontWeight: 300 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <ScanCTA source="How It Works" />
                        <p className="luxury-body text-luxury-charcoal/35 text-xs mt-4">Takes 3 minutes · Free personalized result · No styling knowledge needed.</p>
                    </div>
                </div>
            </section>

            {/* ── Blueprint Tease ──────────────────────────────── */}
            <section
                className="py-24 px-4 md:px-6 relative overflow-hidden"
                style={{ background: 'radial-gradient(ellipse 120% 80% at 25% 10%, var(--iconik-slate-light) 0%, var(--iconik-slate) 45%, var(--iconik-slate-deep) 100%)' }}
            >
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #F4EFE5 1px, transparent 0)', backgroundSize: '3px 3px' }} />

                <div className="relative max-w-3xl mx-auto text-center">
                    <div className="iconik-micro text-luxury-warm-white/50 mb-8">The Blueprint</div>

                    <h2 className="iconik-display text-luxury-warm-white mb-2" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
                        Your Blueprint is
                    </h2>
                    <h2 className="iconik-display text-luxury-warm-white mb-2" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
                        the system.
                    </h2>
                    <h2 className="iconik-display-it text-luxury-warm-white/80 mb-10" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
                        The Score is the preview.
                    </h2>

                    <div className="h-px mb-10" style={{ background: 'rgba(244,239,229,0.2)' }} />

                    <div className="grid md:grid-cols-2 gap-3 text-left max-w-xl mx-auto mb-12">
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
                                <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'rgba(244,239,229,0.5)' }} />
                                <span className="luxury-body text-luxury-warm-white/75 text-sm" style={{ fontWeight: 300 }}>{item}</span>
                            </div>
                        ))}
                    </div>

                    <Link
                        href="/stylist/style-score/scan"
                        onClick={() => trackCTAClick('Start with My Free Style Score', 'Blueprint Tease', 0, 'USD', 'Style Scan Funnel')}
                        className="inline-flex items-center gap-3 px-10 py-4 rounded-full transition-all duration-300 luxury-body font-medium hover:shadow-xl hover:-translate-y-0.5 transform"
                        style={{ background: 'var(--luxury-warm-white)', color: 'var(--luxury-charcoal)' }}
                    >
                        Start with My Free Style Score <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────── */}
            <section className="py-20 px-4 md:px-6" style={{ background: 'var(--luxury-warm-white)' }}>
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="iconik-micro text-luxury-charcoal/40 mb-4">Questions</div>
                        <h2 className="iconik-display text-luxury-charcoal" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
                            Frequently Asked
                        </h2>
                    </div>

                    <div className="space-y-2">
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className="border border-luxury-cream rounded-xl cursor-pointer transition-colors"
                                style={{ background: openFaq === i ? 'var(--luxury-cream)' : 'rgba(237,229,210,0.3)' }}
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            >
                                <div className="p-5 flex justify-between items-center gap-4">
                                    <h3 className="luxury-body text-luxury-charcoal" style={{ fontWeight: 400 }}>{faq.q}</h3>
                                    <span className="iconik-mono text-luxury-charcoal/40 flex-shrink-0" style={{ fontSize: '16px' }}>{openFaq === i ? '−' : '+'}</span>
                                </div>
                                {openFaq === i && (
                                    <div className="px-5 pb-5 border-t border-luxury-cream pt-4">
                                        <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed" style={{ fontWeight: 300 }}>{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ─────────────────────────────────────── */}
            <section className="py-20 px-4 md:px-6 text-center" style={{ background: 'var(--luxury-cream)' }}>
                <div className="max-w-2xl mx-auto">
                    <div className="iconik-micro text-luxury-charcoal/40 mb-8">Begin</div>
                    <h2 className="iconik-display text-luxury-charcoal mb-3" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
                        Find out what&apos;s been
                    </h2>
                    <h2 className="iconik-display-it text-luxury-charcoal mb-10" style={{ fontSize: 'clamp(32px, 5vw, 56px)', opacity: 0.8 }}>
                        missing from your style.
                    </h2>
                    <ScanCTA className="text-base" source="Final CTA" />
                    <p className="luxury-body text-luxury-charcoal/35 text-xs mt-5">Free. Takes 3 minutes. No styling knowledge needed.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 text-center border-t border-luxury-cream" style={{ background: 'var(--luxury-warm-white)' }}>
                <p className="luxury-body text-luxury-charcoal/35 text-xs">
                    © {new Date().getFullYear()} ICONIK Style Intelligence ·{' '}
                    <Link href="/privacy-policy" className="hover:text-luxury-charcoal transition-colors">Privacy</Link>
                    {' · '}
                    <Link href="/refund-policy" className="hover:text-luxury-charcoal transition-colors">Refund Policy</Link>
                </p>
            </footer>

            {/* Sticky Mobile CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-3 md:hidden z-50" style={{ background: 'rgba(244,239,229,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--luxury-cream)' }}>
                <div className="max-w-sm mx-auto">
                    <Link
                        href="/stylist/style-score/scan"
                        onClick={() => trackCTAClick('Start My Free Style Scan', 'Sticky Mobile', 0, 'USD', 'Style Scan Funnel')}
                        className="w-full bg-luxury-charcoal text-luxury-warm-white px-6 py-3.5 text-sm rounded-full transition-all duration-300 luxury-body text-center block font-medium"
                    >
                        Start My Free Style Scan
                    </Link>
                </div>
            </div>

        </div>
    );
}
