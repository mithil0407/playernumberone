'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { trackPageView } from '@/lib/metaPixel';
import { getAttributionPayload } from '@/lib/attribution';

// ── Types ─────────────────────────────────────────────────────────────────

interface ScanPayload {
    email: string;
    struggle: string;
    bodyShape: string;
    undertone: string;
    aesthetic: string;
    dressingContext: string;
    photoUrl?: string;
    hasPhoto: boolean;
    styleScore: number;
    scoreLabel: string;
    colourDirection: string;
    silhouetteDirection: string;
    moodKeywords: string[];
    moodColours: string[];
    whatsMissing: string;
    completedAt: string;
}

// ── Blueprint CTA ─────────────────────────────────────────────────────────

function BlueprintCTA({ onCTAClick, disabled = false }: { onCTAClick: () => void; disabled?: boolean }) {
    return (
        <button
            onClick={onCTAClick}
            disabled={disabled}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full transition-all duration-300 luxury-body hover:shadow-xl hover:-translate-y-0.5 transform disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--luxury-charcoal)', color: 'var(--luxury-warm-white)' }}
        >
            {disabled ? 'Preparing Checkout…' : 'Get My ICONIK Blueprint — $149'} <ArrowRight className="h-4 w-4" />
        </button>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function StyleScoreResultPage() {
    const router = useRouter();
    const [payload, setPayload] = useState<ScanPayload | null>(null);
    const [leadId, setLeadId] = useState<string | null>(null);
    const [leadSaving, setLeadSaving] = useState(true);
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        trackPageView('Style Score Result');
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'result_viewed', { funnel: 'style_scan' });
        }

        const raw = typeof window !== 'undefined' ? localStorage.getItem('style_scan_result') : null;
        if (!raw) { router.replace('/stylist/style-score'); return; }

        let parsed: ScanPayload;
        try { parsed = JSON.parse(raw) as ScanPayload; }
        catch { router.replace('/stylist/style-score'); return; }

        setPayload(parsed);

        const attribution = getAttributionPayload();
        fetch('/api/stylist-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...parsed, attribution }),
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || 'Style scan lead save failed');
                if (data.lead?.id) {
                    setLeadId(data.lead.id);
                    if (typeof window !== 'undefined') localStorage.setItem('style_scan_lead_id', data.lead.id);
                }
            })
            .catch(err => console.warn('Style scan lead save failed; checkout fallback will retry:', err))
            .finally(() => setLeadSaving(false));
    }, [router]);

    useEffect(() => {
        if (!payload) return;
        let frame = 0;
        const target = payload.styleScore;
        const duration = 60;
        const timer = setInterval(() => {
            frame++;
            setAnimatedScore(Math.round((target * frame) / duration));
            if (frame >= duration) clearInterval(timer);
        }, 20);
        return () => clearInterval(timer);
    }, [payload]);

    const handleCTAClick = useCallback(() => {
        if (leadSaving) return;
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'blueprint_cta_clicked', { funnel: 'style_scan', score: payload?.styleScore });
        }
        if (leadId) {
            import('@/lib/supabaseStyleScan').then(m => m.markStyleScanCtaClicked(leadId)).catch(() => { });
        }
        if (payload?.email && typeof window !== 'undefined') {
            localStorage.setItem('stylist_customerEmail', payload.email);
        }
        router.push('/stylist/checkout');
    }, [leadId, payload, router, leadSaving]);

    if (!payload) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--luxury-warm-white)' }}>
                <div className="luxury-body text-luxury-charcoal/40">Loading your results…</div>
            </div>
        );
    }

    const scoreBarColour = payload.styleScore < 58 ? '#C4645A' : payload.styleScore < 68 ? 'var(--iconik-slate)' : '#5A8B6A';

    return (
        <div className="min-h-screen text-luxury-charcoal overflow-x-hidden" style={{ background: 'var(--luxury-warm-white)' }}>

            {/* Header */}
            <nav
                className="fixed top-0 w-full z-50"
                style={{ background: 'rgba(244,239,229,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--luxury-cream)' }}
            >
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="iconik-display text-luxury-charcoal" style={{ fontSize: '16px', letterSpacing: '0.32em' }}>I C O N I K</span>
                    <div className="iconik-micro text-luxury-charcoal/40">Your Style Score</div>
                </div>
            </nav>

            <div className="pt-20 pb-24 max-w-3xl mx-auto px-4 md:px-6">

                {/* ── Score Panel ──────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="py-14"
                >
                    <div
                        className="relative rounded-2xl overflow-hidden p-10 text-center"
                        style={{ background: 'radial-gradient(ellipse 120% 80% at 25% 10%, var(--iconik-slate-light) 0%, var(--iconik-slate) 45%, var(--iconik-slate-deep) 100%)' }}
                    >
                        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #F4EFE5 1px, transparent 0)', backgroundSize: '3px 3px' }} />
                        <div className="relative">
                            <div className="iconik-micro text-luxury-warm-white/55 mb-6">ICONIK Style Score</div>
                            <div className="iconik-display text-luxury-warm-white" style={{ fontSize: 'clamp(80px, 14vw, 120px)' }}>
                                {animatedScore}
                            </div>
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <div className="h-px flex-1" style={{ background: 'rgba(244,239,229,0.2)', maxWidth: '80px' }} />
                                <span className="iconik-mono text-luxury-warm-white/50" style={{ fontSize: '11px' }}>/100</span>
                                <div className="h-px flex-1" style={{ background: 'rgba(244,239,229,0.2)', maxWidth: '80px' }} />
                            </div>
                            <div className="max-w-xs mx-auto mb-6">
                                <div className="w-full rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(244,239,229,0.2)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${payload.styleScore}%`, background: 'var(--luxury-warm-white)' }}
                                    />
                                </div>
                            </div>
                            <div className="iconik-display-it text-luxury-warm-white/80" style={{ fontSize: '18px' }}>
                                &ldquo;{payload.scoreLabel}&rdquo;
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ── Direction Cards ──────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="space-y-3 mb-8"
                >
                    {/* Colour Direction */}
                    <div className="rounded-2xl p-6 border" style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}>
                        <div className="iconik-micro text-luxury-charcoal/35 mb-4">Colour Direction</div>
                        <div className="iconik-display text-luxury-charcoal mb-4" style={{ fontSize: '28px' }}>{payload.colourDirection}</div>
                        <div className="flex gap-2 mb-3">
                            {payload.moodColours.map((hex, i) => (
                                <div
                                    key={i}
                                    className="flex-1 rounded-xl border"
                                    style={{ backgroundColor: hex, aspectRatio: '1/1', maxHeight: '44px', borderColor: 'var(--luxury-cream)' }}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {payload.moodColours.map((hex, i) => (
                                <span key={i} className="iconik-mono text-luxury-charcoal/30" style={{ fontSize: '8px' }}>{hex}</span>
                            ))}
                        </div>
                        <p className="luxury-body text-luxury-charcoal/40 text-xs mt-3" style={{ fontWeight: 300 }}>Your palette direction — expanded with precise hex codes in the full Blueprint</p>
                    </div>

                    {/* Silhouette Direction */}
                    <div className="rounded-2xl p-6 border" style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}>
                        <div className="iconik-micro text-luxury-charcoal/35 mb-4">Silhouette Direction</div>
                        <div className="iconik-display text-luxury-charcoal mb-3" style={{ fontSize: '28px' }}>{payload.silhouetteDirection}</div>
                        <p className="luxury-body text-luxury-charcoal/55 text-sm leading-relaxed" style={{ fontWeight: 300 }}>
                            {payload.bodyShape === 'hourglass' && 'Define the natural waist. Avoid boxy, shapeless silhouettes.'}
                            {payload.bodyShape === 'pear' && 'Draw the eye upward. Structured shoulders, A-line skirts, wide-leg trousers.'}
                            {payload.bodyShape === 'apple' && 'Create vertical line. V-necks, empire cuts, structured shoulders.'}
                            {payload.bodyShape === 'rectangle' && 'Add shape and dimension. Peplum, wrap styles, belted silhouettes.'}
                            {payload.bodyShape === 'oval' && 'Elongate the frame. Vertical seams, monochromatic dressing, clean lines.'}
                        </p>
                    </div>

                    {/* Mood Board */}
                    <div className="rounded-2xl p-6 border" style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}>
                        <div className="iconik-micro text-luxury-charcoal/35 mb-4">Aesthetic Mood Board</div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {payload.moodKeywords.map((kw, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 rounded-full border iconik-micro text-luxury-charcoal/50"
                                    style={{ borderColor: 'var(--luxury-cream)', background: 'var(--luxury-cream)' }}
                                >
                                    {kw}
                                </span>
                            ))}
                        </div>
                        <p className="luxury-body text-luxury-charcoal/35 text-xs" style={{ fontWeight: 300 }}>
                            Your aesthetic direction — the full Blueprint builds a complete wardrobe formula around this
                        </p>
                    </div>
                </motion.section>

                {/* ── What's Missing ───────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="rounded-2xl p-7 mb-8 relative overflow-hidden"
                    style={{ background: 'var(--iconik-slate-deep)' }}
                >
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #F4EFE5 1px, transparent 0)', backgroundSize: '3px 3px' }} />
                    <div className="relative">
                        <div className="iconik-micro text-luxury-warm-white/45 mb-4">The Gap in Your Style</div>
                        <p className="luxury-body text-luxury-warm-white/65 text-sm leading-relaxed mb-3" style={{ fontWeight: 300 }}>
                            Based on your answers, the biggest missing piece in your style is:
                        </p>
                        <div className="iconik-display-it text-luxury-warm-white" style={{ fontSize: '22px', lineHeight: 1.4 }}>
                            {payload.whatsMissing}
                        </div>
                    </div>
                </motion.section>

                {/* ── Blueprint Upsell ─────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="rounded-2xl p-7 mb-8 border"
                    style={{ background: 'var(--luxury-cream)', borderColor: 'var(--luxury-cream)' }}
                >
                    <div className="iconik-micro text-luxury-charcoal/40 mb-5">Your Free Result Shows the Direction</div>
                    <h2 className="iconik-display text-luxury-charcoal mb-2" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>The Blueprint</h2>
                    <h2 className="iconik-display-it text-luxury-charcoal mb-6" style={{ fontSize: 'clamp(28px, 4vw, 40px)', opacity: 0.8 }}>shows the science.</h2>

                    <div className="h-px mb-6" style={{ background: 'rgba(44,38,34,0.1)' }} />

                    <p className="luxury-body text-luxury-charcoal/60 text-sm leading-relaxed mb-6" style={{ fontWeight: 300 }}>
                        Your Style Score reveals where the gaps are. The full ICONIK Blueprint closes them — with exact colour palettes, outfit formulas, body geometry analysis, and everything you need to shop and dress with complete confidence.
                    </p>

                    <div className="space-y-3 mb-7">
                        {[
                            'Your detailed colour palette — precise hex codes for every look',
                            'Body proportion analysis — which cuts flatter every silhouette',
                            'Face architecture — necklines, earrings, eyewear matched to your face shape',
                            'Complete outfit formulas (top, bottom, footwear, accessories)',
                            'What to avoid — and the exact reason why',
                            'Shopping rules specific to your frame and palette',
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--luxury-charcoal)', opacity: 0.4 }} />
                                <span className="luxury-body text-luxury-charcoal/65 text-sm" style={{ fontWeight: 300 }}>{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-baseline gap-3 mb-6">
                        <span className="iconik-display text-luxury-charcoal/25 line-through" style={{ fontSize: '20px' }}>$249</span>
                        <span className="iconik-display text-luxury-charcoal" style={{ fontSize: '40px' }}>$149</span>
                        <div className="px-3 py-1 rounded-full iconik-micro text-luxury-warm-white" style={{ background: 'var(--luxury-accent)' }}>
                            Limited Offer
                        </div>
                    </div>

                    <BlueprintCTA onCTAClick={handleCTAClick} disabled={leadSaving} />
                    <p className="luxury-body text-luxury-charcoal/35 text-xs mt-3" style={{ fontWeight: 300 }}>72-hour delivery · 30-day money-back guarantee</p>
                </motion.section>

                {/* ── Testimonials ─────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    className="space-y-3 mb-10"
                >
                    <div className="iconik-micro text-luxury-charcoal/35 text-center mb-5">What Clients Say</div>
                    {[
                        {
                            quote: 'I have been dressing for the wrong body shape my entire life. The Blueprint told me things I had never been told by any stylist.',
                            name: 'Sara, New York',
                            tag: 'Inverted Triangle · Cool Autumn',
                        },
                        {
                            quote: 'The outfit formulas changed everything. I finally have a system, not just a wardrobe full of things that almost work.',
                            name: 'Nour, Toronto',
                            tag: 'Hourglass · Neutral Autumn',
                        },
                    ].map((t, i) => (
                        <div key={i} className="p-6 rounded-2xl border" style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}>
                            <div className="iconik-display-it text-luxury-charcoal mb-4" style={{ fontSize: '17px', lineHeight: 1.5 }}>
                                &ldquo;{t.quote}&rdquo;
                            </div>
                            <div className="luxury-body text-luxury-charcoal/50 text-xs">{t.name}</div>
                            <div className="iconik-micro text-luxury-charcoal/30 mt-1">{t.tag}</div>
                        </div>
                    ))}
                </motion.section>

                {/* Final CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="text-center"
                >
                    <p className="luxury-body text-luxury-charcoal/45 text-sm mb-6" style={{ fontWeight: 300 }}>
                        Your score shows the gap. The Blueprint closes it.
                    </p>
                    <BlueprintCTA onCTAClick={handleCTAClick} disabled={leadSaving} />
                    <p className="luxury-body text-luxury-charcoal/30 text-xs mt-3" style={{ fontWeight: 300 }}>
                        72-hour delivery · 30-day guarantee · Personalised to you
                    </p>
                </motion.div>

            </div>

            {/* Sticky Mobile CTA */}
            <div
                className="fixed bottom-0 left-0 right-0 p-3 md:hidden z-50"
                style={{ background: 'rgba(244,239,229,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--luxury-cream)' }}
            >
                <div className="max-w-sm mx-auto">
                    <button
                        onClick={handleCTAClick}
                        disabled={leadSaving}
                        className="w-full px-6 py-3.5 text-sm rounded-full transition-all duration-300 luxury-body text-center block shadow-lg disabled:opacity-50"
                        style={{ background: 'var(--luxury-charcoal)', color: 'var(--luxury-warm-white)' }}
                    >
                        {leadSaving ? 'Preparing Checkout…' : 'Get My ICONIK Blueprint — $149'}
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-6 px-6 text-center border-t" style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}>
                <p className="luxury-body text-luxury-charcoal/30 text-xs">
                    © {new Date().getFullYear()} ICONIK Style Intelligence ·{' '}
                    <Link href="/privacy-policy" className="hover:text-luxury-charcoal transition-colors">Privacy</Link>
                    {' · '}
                    <Link href="/refund-policy" className="hover:text-luxury-charcoal transition-colors">Refund Policy</Link>
                </p>
            </footer>

        </div>
    );
}
