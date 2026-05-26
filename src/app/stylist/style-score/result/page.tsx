'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { trackPageView } from '@/lib/metaPixel';
import { saveStyleScanLead } from '@/lib/supabaseStyleScan';
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

// ── Helpers ───────────────────────────────────────────────────────────────

function getScoreColour(score: number): string {
    if (score < 58) return '#C4645A';
    if (score < 68) return '#b58e4d';
    return '#5A8B6A';
}

function getScoreRing(score: number): string {
    if (score < 58) return 'border-red-200';
    if (score < 68) return 'border-[#b58e4d]/40';
    return 'border-green-200';
}

// ── Blueprint CTA ─────────────────────────────────────────────────────────

function BlueprintCTA({ onCTAClick }: { onCTAClick: () => void }) {
    return (
        <button
            onClick={onCTAClick}
            className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-4 rounded-full transition-all duration-300 luxury-body font-semibold hover:shadow-xl hover:-translate-y-0.5 transform"
        >
            Get My ICONIK Blueprint — $149 <ArrowRight className="ml-3 h-4 w-4" />
        </button>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function StyleScoreResultPage() {
    const router = useRouter();
    const [payload, setPayload] = useState<ScanPayload | null>(null);
    const [leadId, setLeadId] = useState<string | null>(null);
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        trackPageView('Style Score Result');
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'result_viewed', { funnel: 'style_scan' });
        }

        const raw = typeof window !== 'undefined' ? localStorage.getItem('style_scan_result') : null;
        if (!raw) {
            router.replace('/stylist/style-score');
            return;
        }

        let parsed: ScanPayload;
        try {
            parsed = JSON.parse(raw) as ScanPayload;
        } catch {
            router.replace('/stylist/style-score');
            return;
        }

        setPayload(parsed);

        // Save lead to Supabase (fire and forget)
        const attribution = getAttributionPayload();
        saveStyleScanLead({
            email: parsed.email,
            style_struggle: parsed.struggle,
            body_shape: parsed.bodyShape,
            undertone: parsed.undertone,
            aesthetic: parsed.aesthetic,
            dressing_context: parsed.dressingContext,
            photo_url: parsed.photoUrl,
            style_score: parsed.styleScore,
            colour_direction: parsed.colourDirection,
            silhouette_direction: parsed.silhouetteDirection,
            mood_keywords: parsed.moodKeywords.join(','),
            mood_colours: parsed.moodColours.join(','),
            whats_missing: parsed.whatsMissing,
            source: 'style_scan',
            utm_source: attribution.utm_source,
            utm_medium: attribution.utm_medium,
            utm_campaign: attribution.utm_campaign,
            utm_content: attribution.utm_content,
            utm_term: attribution.utm_term,
            referrer: attribution.referrer,
            landing_page: attribution.landing_page,
            attribution_payload: attribution.attribution_payload as Record<string, unknown>,
        })
            .then(lead => {
                if (lead?.id) {
                    setLeadId(lead.id);
                    if (typeof window !== 'undefined') localStorage.setItem('style_scan_lead_id', lead.id);
                }
            })
            .catch(err => console.warn('Style scan lead save failed:', err));

    }, [router]);

    // Animate score counter
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
    }, [leadId, payload, router]);

    if (!payload) {
        return (
            <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
                <div className="text-luxury-charcoal/40 luxury-body">Loading your results…</div>
            </div>
        );
    }

    const scoreColour = getScoreColour(payload.styleScore);
    const scoreRing = getScoreRing(payload.styleScore);

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden">

            {/* Header */}
            <nav className="fixed top-0 w-full bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                    <div className="flex items-center gap-2 text-xs luxury-body text-luxury-charcoal/50">
                        <Sparkles className="w-3 h-3 text-luxury-accent" />
                        Your free Style Score
                    </div>
                </div>
            </nav>

            <div className="pt-20 pb-24 max-w-3xl mx-auto px-4 md:px-6">

                {/* ── Section 1: Score ─────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="py-12 text-center"
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-4">Your Result</p>
                    <h1 className="text-2xl md:text-4xl luxury-heading text-luxury-charcoal mb-8 leading-tight">
                        ICONIK Style Score
                    </h1>

                    <div className={`inline-flex flex-col items-center justify-center w-36 h-36 md:w-48 md:h-48 rounded-full border-4 ${scoreRing} bg-white shadow-lg mb-6`}>
                        <span className="luxury-heading leading-none" style={{ fontSize: '3.5rem', color: scoreColour }}>
                            {animatedScore}
                        </span>
                        <span className="text-sm text-luxury-charcoal/40 luxury-body font-light">/100</span>
                    </div>

                    <div className="max-w-sm mx-auto mb-3">
                        <div className="w-full bg-luxury-cream rounded-full h-2">
                            <div
                                className="h-2 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${payload.styleScore}%`, backgroundColor: scoreColour }}
                            />
                        </div>
                    </div>

                    <p className="luxury-body text-luxury-charcoal/60 text-sm italic max-w-xs mx-auto leading-relaxed">
                        &ldquo;{payload.scoreLabel}&rdquo;
                    </p>
                </motion.section>

                {/* ── Section 2: Direction Cards ───────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="space-y-4 mb-8"
                >
                    {/* Colour Direction */}
                    <div className="bg-white border border-[#f0ede8] rounded-2xl p-6">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-3">Colour Direction</p>
                        <p className="luxury-heading text-luxury-charcoal text-xl mb-4">{payload.colourDirection}</p>
                        <div className="flex gap-2 mb-3">
                            {payload.moodColours.map((hex, i) => (
                                <div
                                    key={i}
                                    className="flex-1 rounded-lg border border-[#f0ede8] shadow-sm"
                                    style={{ backgroundColor: hex, aspectRatio: '1/1', maxHeight: '48px' }}
                                />
                            ))}
                        </div>
                        <p className="text-[10px] text-luxury-charcoal/40 font-light luxury-body">Your palette direction — expanded with precise hex codes in the full Blueprint</p>
                    </div>

                    {/* Silhouette Direction */}
                    <div className="bg-white border border-[#f0ede8] rounded-2xl p-6">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-3">Silhouette Direction</p>
                        <p className="luxury-heading text-luxury-charcoal text-xl mb-2">{payload.silhouetteDirection}</p>
                        <p className="text-sm text-luxury-charcoal/60 luxury-body">
                            {payload.bodyShape === 'hourglass' && 'Define the natural waist. Avoid boxy, shapeless silhouettes.'}
                            {payload.bodyShape === 'pear' && 'Draw the eye upward. Structured shoulders, A-line skirts, wide-leg trousers.'}
                            {payload.bodyShape === 'apple' && 'Create vertical line. V-necks, empire cuts, structured shoulders.'}
                            {payload.bodyShape === 'rectangle' && 'Add shape and dimension. Peplum, wrap styles, belted silhouettes.'}
                            {payload.bodyShape === 'oval' && 'Elongate the frame. Vertical seams, monochromatic dressing, clean lines.'}
                        </p>
                    </div>

                    {/* Mood Board */}
                    <div className="bg-white border border-[#f0ede8] rounded-2xl p-6">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-3">Aesthetic Mood Board</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {payload.moodKeywords.map((kw, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 border border-[#f0ede8] text-[10px] font-black uppercase tracking-widest text-luxury-charcoal/60 rounded-full bg-[#faf9f6]"
                                >
                                    {kw}
                                </span>
                            ))}
                        </div>
                        <p className="text-[10px] text-luxury-charcoal/40 luxury-body">
                            Your aesthetic direction — the full Blueprint builds a complete wardrobe formula around this
                        </p>
                    </div>
                </motion.section>

                {/* ── Section 3: What's Missing ─────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="bg-black rounded-2xl p-7 mb-8"
                >
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-3">The Gap in Your Style</p>
                    <p className="luxury-body text-white/80 text-sm leading-relaxed mb-2">
                        Based on your answers, the biggest missing piece in your style is:
                    </p>
                    <p className="luxury-heading text-white text-base md:text-xl leading-snug">
                        {payload.whatsMissing}
                    </p>
                </motion.section>

                {/* ── Section 4: Blueprint Upsell ──────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="bg-luxury-cream/30 border border-luxury-cream rounded-2xl p-7 mb-8"
                >
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#b58e4d] mb-4">Your Free Result Shows the Direction.</p>
                    <h2 className="luxury-heading text-luxury-charcoal text-2xl md:text-3xl mb-4 leading-tight">The Blueprint shows the science.</h2>
                    <p className="luxury-body text-luxury-charcoal/70 text-sm leading-relaxed mb-5">
                        Your Style Score reveals where the gaps are. The full ICONIK Blueprint closes them — with exact colour palettes, outfit formulas, body geometry analysis, and everything you need to shop and dress with complete confidence.
                    </p>
                    <div className="space-y-2.5 mb-7">
                        {[
                            'Your detailed colour palette — precise hex codes for every look',
                            'Body proportion analysis — which cuts flatter every silhouette',
                            'Face architecture — necklines, earrings, eyewear matched to your face shape',
                            'Complete outfit formulas (top, bottom, footwear, accessories)',
                            'What to avoid — and the exact reason why',
                            'Shopping rules specific to your frame and palette',
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <CheckCircle className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                                <span className="luxury-body text-luxury-charcoal/80 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div>
                            <span className="luxury-heading text-luxury-charcoal/30 line-through text-lg">$249</span>
                            <span className="luxury-heading text-luxury-accent text-3xl ml-2">$149</span>
                        </div>
                        <div className="bg-luxury-accent text-luxury-warm-white px-3 py-1 rounded-full luxury-body text-xs font-semibold">
                            LIMITED OFFER
                        </div>
                    </div>

                    <BlueprintCTA onCTAClick={handleCTAClick} />
                    <p className="luxury-body text-luxury-charcoal/40 text-xs mt-3">72-hour delivery · 30-day money-back guarantee</p>
                </motion.section>

                {/* ── Section 5: What Clients Say ──────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    className="space-y-4 mb-10"
                >
                    <p className="text-center text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-4">What Clients Say</p>
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
                        <div key={i} className="p-6 bg-white border border-luxury-cream rounded-2xl">
                            <p className="luxury-body text-luxury-charcoal/80 text-sm leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
                            <p className="luxury-body text-luxury-charcoal/60 text-xs">{t.name}</p>
                            <p className="luxury-body text-luxury-accent text-xs">{t.tag}</p>
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
                    <p className="luxury-body text-luxury-charcoal/60 text-sm mb-5">
                        Your score shows the gap. The Blueprint closes it.
                    </p>
                    <BlueprintCTA onCTAClick={handleCTAClick} />
                    <p className="luxury-body text-luxury-charcoal/40 text-xs mt-3">
                        72-hour delivery · 30-day guarantee · Personalised to you
                    </p>
                </motion.div>

            </div>

            {/* Sticky Mobile CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream p-3 md:hidden z-50">
                <div className="max-w-sm mx-auto">
                    <button
                        onClick={handleCTAClick}
                        className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-6 py-3.5 text-base rounded-full transition-all duration-300 luxury-body text-center block font-semibold shadow-lg"
                    >
                        Get My ICONIK Blueprint — $149
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-6 px-6 bg-luxury-cream/10 text-center border-t border-luxury-cream">
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
