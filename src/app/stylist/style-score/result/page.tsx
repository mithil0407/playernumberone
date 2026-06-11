'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { getAttributionPayload } from '@/lib/attribution';
import { trackPageView } from '@/lib/metaPixel';
import { NamedColour } from '@/lib/supabaseStyleScan';

interface ColorMirrorPayload {
    firstName: string;
    email: string;
    temperatureSwatch: string;
    metalTest: string;
    whiteTest: string;
    naturalDepth: string;
    claritySwatch: string;
    styleGoal: string;
    seasonName: string;
    undertone: string;
    aesthetic: string;
    struggle: string;
    bodyShape: string;
    dressingContext: string;
    whatsMissing: string;
    colourDirection: string;
    silhouetteDirection: string;
    moodKeywords: string[];
    moodColours: string[];
    styleScore: number;
    scoreLabel: string;
    hasPhoto: boolean;
    subcopy: string;
    betrayerColours: NamedColour[];
    powerPalette: NamedColour[];
    betrayerExplanation: string;
    styleGoalPhrase: string;
    source: string;
    completedAt: string;
}

function SwatchRow({ colours, blurred = false }: { colours: NamedColour[]; blurred?: boolean }) {
    return (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {colours.map((colour) => (
                <div key={`${colour.name}-${colour.hex}`} className="min-w-0">
                    <div
                        className={`rounded-2xl border ${blurred ? 'blur-[5px]' : ''}`}
                        style={{ backgroundColor: colour.hex, borderColor: 'var(--luxury-cream)', aspectRatio: '1.35/1' }}
                    />
                    <div className={`mt-3 ${blurred ? 'select-none blur-[4px]' : ''}`}>
                        <p className="luxury-body text-luxury-charcoal text-xs leading-tight" style={{ fontWeight: 500 }}>{colour.name}</p>
                        <p className="iconik-mono text-luxury-charcoal/30 mt-1" style={{ fontSize: '9px' }}>{colour.hex}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function BlueprintCTA({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-3 rounded-full px-9 py-4 luxury-body text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'var(--luxury-charcoal)', color: 'var(--luxury-warm-white)' }}
        >
            {disabled ? 'Preparing Checkout…' : 'Unlock My Full Blueprint'} <ArrowRight className="h-4 w-4" />
        </button>
    );
}

export default function ColorMirrorResultPage() {
    const router = useRouter();
    const [payload, setPayload] = useState<ColorMirrorPayload | null>(null);
    const [leadId, setLeadId] = useState<string | null>(null);
    const [leadSaving, setLeadSaving] = useState(true);

    useEffect(() => {
        trackPageView('Color Mirror Result');
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'result_viewed', { funnel: 'color_mirror' });
        }

        const raw = typeof window !== 'undefined' ? localStorage.getItem('style_scan_result') : null;
        if (!raw) {
            router.replace('/stylist/style-score');
            return;
        }

        let parsed: ColorMirrorPayload;
        try {
            parsed = JSON.parse(raw) as ColorMirrorPayload;
        } catch {
            router.replace('/stylist/style-score');
            return;
        }

        if (!parsed.email || !parsed.seasonName) {
            router.replace('/stylist/style-score');
            return;
        }

        setPayload(parsed);

        fetch('/api/stylist-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...parsed, attribution: getAttributionPayload() }),
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || 'Color Mirror lead save failed');
                if (data.lead?.id) {
                    setLeadId(data.lead.id);
                    if (typeof window !== 'undefined') localStorage.setItem('style_scan_lead_id', data.lead.id);
                }
            })
            .catch(err => console.warn('Color Mirror lead save failed; checkout fallback will retry:', err))
            .finally(() => setLeadSaving(false));
    }, [router]);

    const handleCTAClick = useCallback(() => {
        if (leadSaving) return;
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'blueprint_cta_clicked', { funnel: 'color_mirror', season: payload?.seasonName });
        }
        if (leadId) {
            fetch('/api/stylist-lead/cta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, email: payload?.email }),
            }).catch(() => { });
        }
        if (payload?.email && typeof window !== 'undefined') {
            localStorage.setItem('stylist_customerEmail', payload.email);
        }
        router.push('/stylist/checkout');
    }, [leadId, leadSaving, payload, router]);

    if (!payload) {
        return (
            <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--luxury-warm-white)' }}>
                <div className="luxury-body text-luxury-charcoal/40">Loading your color result…</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-x-hidden text-luxury-charcoal" style={{ background: 'var(--luxury-warm-white)' }}>
            <nav className="fixed top-0 z-50 w-full border-b" style={{ background: 'rgba(244,239,229,0.95)', borderColor: 'var(--luxury-cream)', backdropFilter: 'blur(18px)' }}>
                <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-6">
                    <span className="iconik-display text-luxury-charcoal" style={{ fontSize: '16px', letterSpacing: '0.32em' }}>I C O N I K</span>
                    <div className="iconik-micro text-luxury-charcoal/40">The Color Mirror</div>
                </div>
            </nav>

            <main className="mx-auto max-w-3xl px-4 pb-28 pt-24 md:px-6">
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="py-10 text-center md:py-14"
                >
                    <div className="mx-auto mb-7 inline-flex rounded-full px-5 py-2 iconik-micro text-luxury-warm-white" style={{ background: 'var(--iconik-slate-deep)' }}>
                        {payload.seasonName.toUpperCase()}
                    </div>
                    <h1 className="iconik-display text-luxury-charcoal mb-5" style={{ fontSize: 'clamp(44px, 7vw, 78px)', lineHeight: 1 }}>
                        You&apos;re a {payload.seasonName}.
                    </h1>
                    <p className="luxury-body text-luxury-charcoal/62 mx-auto max-w-2xl text-base leading-relaxed" style={{ fontWeight: 300 }}>
                        {payload.subcopy}
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="mb-8 rounded-2xl border p-6 md:p-7"
                    style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}
                >
                    <div className="iconik-micro text-luxury-charcoal/38 mb-5">Free result</div>
                    <h2 className="iconik-display text-luxury-charcoal mb-7" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
                        The colors working against you — revealed.
                    </h2>
                    <SwatchRow colours={payload.betrayerColours} />
                    <p className="luxury-body text-luxury-charcoal/58 mt-7 text-sm leading-relaxed" style={{ fontWeight: 300 }}>
                        {payload.betrayerExplanation}
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.18 }}
                    className="relative mb-8 overflow-hidden rounded-2xl border p-6 md:p-7"
                    style={{ background: 'var(--luxury-cream)', borderColor: 'var(--luxury-cream)' }}
                >
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="iconik-display text-luxury-charcoal" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>Your power palette</h2>
                        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 iconik-micro text-luxury-warm-white" style={{ background: 'var(--luxury-charcoal)' }}>
                            <LockKeyhole className="h-3.5 w-3.5" /> Unlocks with your Blueprint
                        </div>
                    </div>
                    <SwatchRow colours={payload.powerPalette} blurred />
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.26 }}
                    className="mb-8 rounded-2xl p-7 text-center"
                    style={{ background: 'var(--iconik-slate-deep)' }}
                >
                    <div className="iconik-micro text-luxury-warm-white/45 mb-5">The 10% pivot</div>
                    <p className="luxury-body text-luxury-warm-white/76 mx-auto max-w-2xl text-base leading-relaxed" style={{ fontWeight: 300 }}>
                        Color is 10% of your style. We just gave you the 10% free. Your silhouette — the exact cuts that {payload.styleGoalPhrase} — your face architecture, and the specific outfits built for your body are the other 90%. That&apos;s your Blueprint.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.34 }}
                    className="rounded-2xl border p-7 text-center md:p-9"
                    style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}
                >
                    <div className="iconik-micro text-luxury-charcoal/38 mb-5">Get your full Blueprint — $149</div>
                    <p className="luxury-body text-luxury-charcoal/62 mx-auto mb-8 max-w-2xl text-base leading-relaxed" style={{ fontWeight: 300 }}>
                        Your Blueprint is the complete diagnosis. Every power color. The exact silhouettes that work for your body. The cuts that suit your face. Built by a real stylist on your actual photos — not a template.
                        <br /><br />
                        If it doesn&apos;t show you something you didn&apos;t already know about yourself, we&apos;ll refund it.
                    </p>
                    <BlueprintCTA onClick={handleCTAClick} disabled={leadSaving} />
                    <p className="luxury-body text-luxury-charcoal/35 mt-3 text-xs" style={{ fontWeight: 300 }}>
                        No risk. Built by a human stylist on your photos.
                    </p>
                </motion.section>
            </main>

            <footer className="border-t px-6 py-6 text-center" style={{ borderColor: 'var(--luxury-cream)' }}>
                <p className="luxury-body text-luxury-charcoal/30 text-xs">
                    © {new Date().getFullYear()} ICONIK Style Intelligence ·{' '}
                    <Link href="/privacy-policy" className="hover:text-luxury-charcoal transition-colors">Privacy</Link>
                    {' · '}
                    <Link href="/refund-policy" className="hover:text-luxury-charcoal transition-colors">Refund Policy</Link>
                </p>
            </footer>

            <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:hidden" style={{ background: 'rgba(244,239,229,0.98)', borderTop: '1px solid var(--luxury-cream)', backdropFilter: 'blur(18px)' }}>
                <BlueprintCTA onClick={handleCTAClick} disabled={leadSaving} />
            </div>
        </div>
    );
}
