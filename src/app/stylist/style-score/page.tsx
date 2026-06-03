'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Droplets, Eye, LockKeyhole, Palette } from 'lucide-react';
import { trackCTAClick, trackPageView } from '@/lib/metaPixel';

function ColorMirrorCTA({ source, className = '' }: { source: string; className?: string }) {
    return (
        <Link
            href="/stylist/style-score/scan"
            onClick={() => {
                trackCTAClick('Find My Colors — Free', source, 0, 'USD', 'Color Mirror Funnel');
                if (typeof window !== 'undefined') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).fbq?.('trackCustom', 'start_color_mirror', { funnel: 'color_mirror', source });
                }
            }}
            className={`inline-flex items-center justify-center gap-3 rounded-full px-9 py-4 luxury-body text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${className}`}
            style={{ background: 'var(--luxury-charcoal)', color: 'var(--luxury-warm-white)' }}
        >
            Find My Colors — Free <ArrowRight className="h-4 w-4" />
        </Link>
    );
}

function MirrorPreview() {
    const swatches = ['#C8956C', '#7B9FC4', '#F5ECD7', '#F4F4F6', '#2D6FA3', '#9BA8A3'];

    return (
        <div className="relative mx-auto max-w-sm">
            <div className="rounded-[28px] border p-4 shadow-2xl" style={{ borderColor: 'var(--luxury-cream)', background: 'var(--luxury-warm-white)' }}>
                <div className="rounded-[20px] overflow-hidden border" style={{ borderColor: 'var(--luxury-cream)' }}>
                    <div className="px-5 py-4" style={{ background: 'var(--iconik-slate-deep)' }}>
                        <div className="iconik-micro text-luxury-warm-white/55">THE COLOR MIRROR</div>
                    </div>
                    <div className="p-5">
                        <div className="iconik-display text-luxury-charcoal mb-4" style={{ fontSize: '28px' }}>Soft Autumn</div>
                        <div className="grid grid-cols-2 gap-2 mb-5">
                            {swatches.map((hex) => (
                                <div key={hex} className="rounded-xl border" style={{ background: hex, borderColor: 'var(--luxury-cream)', aspectRatio: '1.4/1' }} />
                            ))}
                        </div>
                        <div className="rounded-2xl p-4" style={{ background: 'var(--luxury-cream)' }}>
                            <div className="iconik-micro text-luxury-charcoal/35 mb-2">Free Reveal</div>
                            <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed" style={{ fontWeight: 300 }}>
                                The colors draining your face, diagnosed through six quick mirror tests.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StyleScoreLandingPage() {
    useEffect(() => {
        trackPageView('Color Mirror Landing');
    }, []);

    const valueLines = [
        { icon: Eye, text: 'The colors draining your face — revealed free' },
        { icon: Palette, text: 'Your color season, diagnosed in 6 questions' },
        { icon: LockKeyhole, text: 'Your full power palette — unlocked with your Blueprint' },
    ];

    return (
        <div className="min-h-screen overflow-x-hidden text-luxury-charcoal" style={{ background: 'var(--luxury-warm-white)' }}>
            <nav className="fixed top-0 z-50 w-full border-b" style={{ background: 'rgba(244,239,229,0.95)', borderColor: 'var(--luxury-cream)', backdropFilter: 'blur(18px)' }}>
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-6">
                    <span className="iconik-display text-luxury-charcoal" style={{ fontSize: '18px', letterSpacing: '0.34em' }}>I C O N I K</span>
                    <Link href="/stylist/style-score/scan" className="hidden rounded-full px-5 py-2.5 luxury-body text-sm md:inline-flex" style={{ background: 'var(--luxury-charcoal)', color: 'var(--luxury-warm-white)' }}>
                        Start
                    </Link>
                </div>
            </nav>

            <main>
                <section className="px-4 pb-16 pt-28 md:px-6 md:pb-20">
                    <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
                        <div>
                            <div className="iconik-micro text-luxury-charcoal/45 mb-7">THE COLOR MIRROR · ICONIK</div>
                            <h1 className="iconik-display text-luxury-charcoal mb-4" style={{ fontSize: 'clamp(44px, 7vw, 84px)', lineHeight: 0.98 }}>
                                Color is 10% of your style.
                            </h1>
                            <h2 className="iconik-display-it text-luxury-charcoal mb-8" style={{ fontSize: 'clamp(42px, 6.4vw, 78px)', lineHeight: 1, opacity: 0.82 }}>
                                We&apos;ll analyze yours — free.
                            </h2>
                            <p className="luxury-body text-luxury-charcoal/62 max-w-xl text-base leading-relaxed mb-9" style={{ fontWeight: 300 }}>
                                Most women are wearing colors that quietly fight their face. In 90 seconds, find the ones working against you — and the ones that don&apos;t. No upload. No account. Hold your phone up to your face and let your eye do the work.
                            </p>

                            <ColorMirrorCTA source="Hero" />
                            <p className="luxury-body text-luxury-charcoal/38 mt-4 text-xs" style={{ fontWeight: 300 }}>
                                The same color science inside the ICONIK Blueprint — the 10% we&apos;re giving away.
                            </p>
                        </div>

                        <MirrorPreview />
                    </div>
                </section>

                <section className="px-4 py-16 md:px-6" style={{ background: 'var(--luxury-cream)' }}>
                    <div className="mx-auto max-w-5xl">
                        <div className="grid gap-3 md:grid-cols-3">
                            {valueLines.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex min-h-[116px] items-center gap-4 rounded-2xl border p-5" style={{ background: 'var(--luxury-warm-white)', borderColor: 'rgba(44,38,34,0.08)' }}>
                                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--luxury-cream)' }}>
                                        <Icon className="h-5 w-5 text-luxury-charcoal/65" />
                                    </div>
                                    <p className="luxury-body text-luxury-charcoal/70 text-sm leading-relaxed" style={{ fontWeight: 300 }}>{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-4 py-20 md:px-6">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--iconik-slate-deep)' }}>
                            <Droplets className="h-6 w-6 text-luxury-warm-white" />
                        </div>
                        <div className="iconik-micro text-luxury-charcoal/40 mb-6">THE 10% PREVIEW</div>
                        <h2 className="iconik-display text-luxury-charcoal mb-5" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
                            Your color result is the first mirror.
                        </h2>
                        <p className="luxury-body text-luxury-charcoal/58 mx-auto mb-9 max-w-xl text-base leading-relaxed" style={{ fontWeight: 300 }}>
                            The Blueprint completes the diagnosis with your silhouette, face architecture, and exact outfit formulas built from your real photos.
                        </p>
                        <ColorMirrorCTA source="Bottom CTA" />
                    </div>
                </section>
            </main>

            <footer className="border-t px-6 py-8 text-center" style={{ borderColor: 'var(--luxury-cream)' }}>
                <p className="luxury-body text-luxury-charcoal/35 text-xs">
                    © {new Date().getFullYear()} ICONIK Style Intelligence ·{' '}
                    <Link href="/privacy-policy" className="hover:text-luxury-charcoal transition-colors">Privacy</Link>
                    {' · '}
                    <Link href="/refund-policy" className="hover:text-luxury-charcoal transition-colors">Refund Policy</Link>
                </p>
            </footer>

            <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:hidden" style={{ background: 'rgba(244,239,229,0.98)', borderTop: '1px solid var(--luxury-cream)', backdropFilter: 'blur(18px)' }}>
                <ColorMirrorCTA source="Sticky Mobile" className="w-full py-3.5 text-sm" />
            </div>
        </div>
    );
}
