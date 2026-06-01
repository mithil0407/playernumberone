'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Upload, CheckCircle } from 'lucide-react';
import { trackPageView, updateUserData } from '@/lib/metaPixel';
import { computeScanResult, uploadStyleScanPhoto } from '@/lib/supabaseStyleScan';

// ── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7;

const STRUGGLES = [
    { value: 'fit_body', emoji: '👗', label: 'My clothes never fit my body the way they should', sub: 'The cuts feel off — even when the size is right' },
    { value: 'wardrobe_disconnect', emoji: '🪄', label: 'I have a wardrobe full of things that don\'t work together', sub: 'Individual pieces look fine. As outfits, they fall apart' },
    { value: 'dont_know_colours', emoji: '🎨', label: 'I don\'t know my colours — I wear what I think works', sub: 'Some shades drain me. I can\'t tell which ones or why' },
    { value: 'look_fine', emoji: '✨', label: 'I look fine but never elevated or truly put-together', sub: 'Nothing\'s wrong exactly — but nothing\'s ever right either' },
    { value: 'body_change', emoji: '🌱', label: 'I\'ve been through a change and my style doesn\'t feel like me', sub: 'Body change, life change, or just ready to start over' },
];

const BODY_SHAPES = [
    { value: 'hourglass', label: 'Hourglass', sub: 'Shoulders and hips roughly equal, defined waist', image: '/scan-shape-hourglass.webp' },
    { value: 'pear', label: 'Pear', sub: 'Hips wider than shoulders, narrower upper body', image: '/scan-shape-pear.webp' },
    { value: 'apple', label: 'Inverted Triangle', sub: 'Shoulders wider, narrower below', image: '/scan-shape-apple.webp' },
    { value: 'rectangle', label: 'Rectangle', sub: 'Shoulders, waist, and hips roughly equal width', image: '/scan-shape-rectangle.webp' },
    { value: 'oval', label: 'Oval', sub: 'Fullness in the midsection, narrower above and below', image: '/scan-shape-oval.webp' },
];

const UNDERTONES = [
    { value: 'warm', label: 'Warm', sub: 'This side made my skin look more alive', dotColour: '#D4A853' },
    { value: 'cool', label: 'Cool', sub: 'This side made my skin look more alive', dotColour: '#9488C8' },
    { value: 'neutral', label: 'Neutral', sub: 'Both sides looked similar — no clear winner', dotColour: '#A09880' },
    { value: 'dont_know', label: 'I genuinely can\'t tell', sub: 'That\'s fine — we\'ll work with what you give us', dotColour: '#C0B0A0' },
];

const AESTHETICS = [
    { value: 'minimal', label: 'Clean & Minimal', sub: 'Structured basics, neutral palette, nothing extra', image: '/scan-aesthetic-minimal.webp' },
    { value: 'soft', label: 'Soft & Feminine', sub: 'Fluid silhouettes, earthy or dusty tones', image: '/scan-aesthetic-soft.webp' },
    { value: 'sharp', label: 'Sharp & Modern', sub: 'Bold cuts, contrast, architectural shapes', image: '/scan-aesthetic-sharp.webp' },
    { value: 'relaxed', label: 'Relaxed & Effortless', sub: 'Comfortable but intentional, casual elevated', image: '/scan-aesthetic-relaxed.webp' },
    { value: 'classic', label: 'Classic & Polished', sub: 'Timeless pieces, tailored fits, investment dressing', image: '/scan-aesthetic-classic.webp' },
];

const CONTEXTS = [
    { value: 'office', emoji: '💼', label: 'Office / Corporate' },
    { value: 'business_casual', emoji: '💻', label: 'Business Casual / Everyday Professional' },
    { value: 'social', emoji: '🥂', label: 'Social Events / Family Functions' },
    { value: 'casual', emoji: '☀️', label: 'Everyday Casual' },
    { value: 'occasions', emoji: '💫', label: 'Special Occasions / Weddings' },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function StepDots({ step }: { step: number }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => (
                <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                        width: i < step - 1 ? '16px' : '6px',
                        height: '6px',
                        background: i < step - 1
                            ? 'var(--iconik-slate)'
                            : i === step - 1
                                ? 'var(--luxury-charcoal)'
                                : 'var(--luxury-cream)',
                    }}
                />
            ))}
        </div>
    );
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left rounded-xl px-5 py-4 transition-all duration-200 border"
            style={{
                background: selected ? 'var(--luxury-cream)' : 'var(--luxury-warm-white)',
                borderColor: selected ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)',
            }}
        >
            <div className="flex items-center gap-4">
                <div
                    className="w-4 h-4 rounded-full flex-shrink-0 border transition-all duration-200"
                    style={{
                        borderColor: selected ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)',
                        background: selected ? 'var(--luxury-charcoal)' : 'transparent',
                    }}
                />
                {children}
            </div>
        </button>
    );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function StyleScanPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [uploading, setUploading] = useState(false);

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [struggle, setStruggle] = useState('');
    const [bodyShape, setBodyShape] = useState('');
    const [undertone, setUndertone] = useState('');
    const [aesthetic, setAesthetic] = useState('');
    const [dressingContext, setDressingContext] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoUrl, setPhotoUrl] = useState('');

    useEffect(() => { trackPageView('Style Scan Quiz'); }, []);
    useEffect(() => { if (step >= 2 && email) updateUserData(email); }, [step, email]);

    const goNext = useCallback(() => { setDirection(1); setStep(s => s + 1); }, []);
    const goBack = useCallback(() => { setDirection(-1); setStep(s => Math.max(0, s - 1)); }, []);

    const stepValid = useCallback((): boolean => {
        switch (step) {
            case 0: return true;
            case 1: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            case 2: return !!struggle;
            case 3: return !!bodyShape;
            case 4: return !!undertone;
            case 5: return !!aesthetic;
            case 6: return !!dressingContext;
            case 7: return true;
            default: return true;
        }
    }, [step, email, struggle, bodyShape, undertone, aesthetic, dressingContext]);

    const handlePhotoChange = useCallback(async (file: File | null) => {
        setPhoto(file);
        if (!file) return;
        setUploading(true);
        try {
            const baseName = file.name.replace(/\.[^.]+$/, '');
            const url = await uploadStyleScanPhoto(file, `${Date.now()}_scan_${baseName}.jpg`);
            setPhotoUrl(url);
            if (typeof window !== 'undefined') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).fbq?.('trackCustom', 'photo_uploaded', { funnel: 'style_scan' });
            }
        } catch (err) {
            console.warn('Style scan photo upload failed:', err);
        } finally {
            setUploading(false);
        }
    }, []);

    const handleComplete = useCallback(async () => {
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'email_submitted', { funnel: 'style_scan', email });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'quiz_completed', { funnel: 'style_scan' });
        }
        const result = computeScanResult({ struggle, bodyShape, undertone, aesthetic, dressingContext, hasPhoto: !!photo });
        const payload = { email, struggle, bodyShape, undertone, aesthetic, dressingContext, photoUrl, hasPhoto: !!photo, ...result, completedAt: new Date().toISOString() };
        if (typeof window !== 'undefined') localStorage.setItem('style_scan_result', JSON.stringify(payload));
        router.push('/stylist/style-score/result');
    }, [email, struggle, bodyShape, undertone, aesthetic, dressingContext, photo, photoUrl, router]);

    const handleNextOrComplete = useCallback(() => {
        if (step === 1) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Please enter a valid email address.'); return; }
            setEmailError('');
        }
        if (step === TOTAL_STEPS) { handleComplete(); return; }
        goNext();
    }, [step, email, goNext, handleComplete]);

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    };

    return (
        <div className="min-h-screen text-luxury-charcoal overflow-x-hidden flex flex-col" style={{ background: 'var(--luxury-warm-white)' }}>

            {/* Header */}
            <header
                className="py-4 px-6 sticky top-0 z-20"
                style={{ background: 'rgba(244,239,229,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--luxury-cream)' }}
            >
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="iconik-display text-luxury-charcoal" style={{ fontSize: '16px', letterSpacing: '0.32em', fontWeight: 400 }}>I C O N I K</span>
                        {step > 0 && (
                            <div className="flex items-center gap-3">
                                {step < TOTAL_STEPS && <StepDots step={step} />}
                                <span className="iconik-mono text-luxury-charcoal/40" style={{ fontSize: '10px' }}>
                                    {step < TOTAL_STEPS ? `${step} / ${TOTAL_STEPS - 1}` : 'Almost done'}
                                </span>
                            </div>
                        )}
                    </div>
                    {step > 0 && (
                        <div className="w-full rounded-full overflow-hidden" style={{ height: '2px', background: 'var(--luxury-cream)' }}>
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${Math.min((step / TOTAL_STEPS) * 100, 100)}%`, background: 'var(--iconik-slate)' }}
                            />
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 flex items-start md:items-center justify-center px-4 py-8 md:py-12">
                <div className="w-full max-w-xl">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="rounded-2xl border p-8 md:p-10"
                            style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}
                        >

                            {/* ── Step 0: Welcome ──────────────────────────── */}
                            {step === 0 && (
                                <div className="text-center">
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-10">Free ICONIK Style Scan</div>

                                    <h1 className="iconik-display text-luxury-charcoal mb-2" style={{ fontSize: 'clamp(40px, 6vw, 64px)' }}>
                                        Your free Style Score
                                    </h1>
                                    <h1 className="iconik-display-it text-luxury-charcoal mb-10" style={{ fontSize: 'clamp(40px, 6vw, 64px)', opacity: 0.75 }}>
                                        + Personal Mood Board.
                                    </h1>

                                    <div className="h-px mb-8" style={{ background: 'var(--luxury-cream)' }} />

                                    <p className="luxury-body text-luxury-charcoal/55 text-base leading-relaxed mb-10 max-w-sm mx-auto" style={{ fontWeight: 300 }}>
                                        6 quick questions. A personalised result that shows you exactly where your style is losing alignment — and how to fix it.
                                    </p>

                                    <button
                                        onClick={goNext}
                                        className="inline-flex items-center gap-3 px-10 py-4 text-base luxury-body rounded-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                                        style={{ background: 'var(--luxury-charcoal)', color: 'var(--luxury-warm-white)' }}
                                    >
                                        Start My Free Style Scan <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <p className="luxury-body text-luxury-charcoal/30 text-xs mt-5">Takes 3 minutes · 100% free · No card required</p>
                                </div>
                            )}

                            {/* ── Step 1: Email ────────────────────────────── */}
                            {step === 1 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-6">Before We Start</div>
                                    <h2 className="iconik-display text-luxury-charcoal mb-3" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>Where should we send your results?</h2>
                                    <p className="luxury-body text-luxury-charcoal/50 text-sm mb-8" style={{ fontWeight: 300 }}>Your Style Score and Mood Board will be ready at the end. Enter your email so they don&apos;t disappear.</p>
                                    <div>
                                        <label className="iconik-micro text-luxury-charcoal/40 block mb-3">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                                            onKeyDown={e => { if (e.key === 'Enter' && stepValid()) handleNextOrComplete(); }}
                                            className="w-full px-4 py-4 rounded-xl transition-all text-base luxury-body outline-none"
                                            style={{ border: '1.5px solid var(--luxury-cream)', background: 'var(--luxury-warm-white)', color: 'var(--luxury-charcoal)' }}
                                            placeholder="your@email.com"
                                            autoFocus
                                        />
                                        {emailError && <p className="iconik-mono text-red-500 text-xs mt-2">{emailError}</p>}
                                        <p className="luxury-body text-luxury-charcoal/35 text-xs mt-2" style={{ fontWeight: 300 }}>We&apos;ll only send your result — no spam, ever.</p>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 2: Style Struggle ──────────────────── */}
                            {step === 2 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-6">Question 1 of 5</div>
                                    <h2 className="iconik-display text-luxury-charcoal mb-8" style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>What&apos;s your biggest style struggle right now?</h2>
                                    <div className="space-y-2">
                                        {STRUGGLES.map(o => (
                                            <button
                                                key={o.value}
                                                type="button"
                                                onClick={() => setStruggle(o.value)}
                                                className="w-full text-left rounded-xl px-5 py-4 transition-all duration-200 border"
                                                style={{
                                                    background: struggle === o.value ? 'var(--luxury-cream)' : 'var(--luxury-warm-white)',
                                                    borderColor: struggle === o.value ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)',
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xl flex-shrink-0">{o.emoji}</span>
                                                    <div>
                                                        <div className="luxury-body text-luxury-charcoal text-sm" style={{ fontWeight: struggle === o.value ? 500 : 400 }}>{o.label}</div>
                                                        <div className="luxury-body text-luxury-charcoal/40 text-xs mt-0.5" style={{ fontWeight: 300 }}>{o.sub}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 3: Body Shape ───────────────────────── */}
                            {step === 3 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-6">Question 2 of 5</div>
                                    <h2 className="iconik-display text-luxury-charcoal mb-7" style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>Which silhouette is closest to yours?</h2>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        {BODY_SHAPES.slice(0, 4).map(o => {
                                            const selected = bodyShape === o.value;
                                            return (
                                                <button
                                                    key={o.value}
                                                    type="button"
                                                    onClick={() => setBodyShape(o.value)}
                                                    className="relative flex flex-col rounded-xl overflow-hidden transition-all duration-200 text-left border"
                                                    style={{ borderColor: selected ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)' }}
                                                >
                                                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                                                        <Image src={o.image} alt={o.label} fill className="object-cover" />
                                                        {selected && (
                                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--luxury-charcoal)' }}>
                                                                <CheckCircle className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="px-3 py-2.5" style={{ background: selected ? 'var(--luxury-cream)' : 'var(--luxury-warm-white)' }}>
                                                        <p className="luxury-body text-luxury-charcoal text-xs" style={{ fontWeight: selected ? 500 : 400 }}>{o.label}</p>
                                                        <p className="luxury-body text-luxury-charcoal/40 leading-snug" style={{ fontSize: '10px', fontWeight: 300 }}>{o.sub}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {(() => {
                                        const o = BODY_SHAPES[4];
                                        const selected = bodyShape === o.value;
                                        return (
                                            <div className="flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setBodyShape(o.value)}
                                                    className="relative flex flex-col rounded-xl overflow-hidden transition-all duration-200 text-left border"
                                                    style={{ width: 'calc(50% - 6px)', borderColor: selected ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)' }}
                                                >
                                                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                                                        <Image src={o.image} alt={o.label} fill className="object-cover" />
                                                        {selected && (
                                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--luxury-charcoal)' }}>
                                                                <CheckCircle className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="px-3 py-2.5" style={{ background: selected ? 'var(--luxury-cream)' : 'var(--luxury-warm-white)' }}>
                                                        <p className="luxury-body text-luxury-charcoal text-xs" style={{ fontWeight: selected ? 500 : 400 }}>{o.label}</p>
                                                        <p className="luxury-body text-luxury-charcoal/40 leading-snug" style={{ fontSize: '10px', fontWeight: 300 }}>{o.sub}</p>
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* ── Step 4: Undertone ───────────────────────── */}
                            {step === 4 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-6">Question 3 of 5</div>
                                    <h2 className="iconik-display text-luxury-charcoal mb-3" style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>Which shade makes your skin look more alive?</h2>
                                    <p className="luxury-body text-luxury-charcoal/50 text-sm mb-6" style={{ fontWeight: 300 }}>
                                        Hold your phone flat against your inner wrist. Look in a mirror. Which side makes your skin glow more?
                                    </p>

                                    <div className="rounded-xl overflow-hidden border mb-2" style={{ borderColor: 'var(--luxury-cream)', height: '100px' }}>
                                        <div className="flex h-full">
                                            <div className="flex-1 flex flex-col items-center justify-center gap-1" style={{ backgroundColor: '#E8C080' }}>
                                                <span className="iconik-micro" style={{ color: 'rgba(92,61,10,0.7)' }}>Warm</span>
                                                <span className="luxury-body" style={{ fontSize: '9px', color: 'rgba(92,61,10,0.5)', fontWeight: 300 }}>Golden · Peachy</span>
                                            </div>
                                            <div className="w-px" style={{ background: 'rgba(255,255,255,0.6)' }} />
                                            <div className="flex-1 flex flex-col items-center justify-center gap-1" style={{ backgroundColor: '#B0A8D8' }}>
                                                <span className="iconik-micro" style={{ color: 'rgba(42,31,92,0.7)' }}>Cool</span>
                                                <span className="luxury-body" style={{ fontSize: '9px', color: 'rgba(42,31,92,0.5)', fontWeight: 300 }}>Lavender · Pink</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="luxury-body text-luxury-charcoal/30 text-center text-xs mb-6" style={{ fontWeight: 300 }}>
                                        Hold your phone against your inner wrist — not on screen
                                    </p>

                                    <div className="space-y-2">
                                        {UNDERTONES.map(o => (
                                            <OptionCard key={o.value} selected={undertone === o.value} onClick={() => setUndertone(o.value)}>
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 border" style={{ backgroundColor: o.dotColour, borderColor: 'var(--luxury-cream)' }} />
                                                    <div>
                                                        <div className="luxury-body text-luxury-charcoal text-sm" style={{ fontWeight: undertone === o.value ? 500 : 400 }}>{o.label}</div>
                                                        <div className="luxury-body text-luxury-charcoal/40 text-xs mt-0.5" style={{ fontWeight: 300 }}>{o.sub}</div>
                                                    </div>
                                                </div>
                                            </OptionCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 5: Aesthetic ───────────────────────── */}
                            {step === 5 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-6">Question 4 of 5</div>
                                    <h2 className="iconik-display text-luxury-charcoal mb-7" style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>Which of these feels most like the style you want?</h2>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        {AESTHETICS.slice(0, 4).map(o => {
                                            const selected = aesthetic === o.value;
                                            return (
                                                <button
                                                    key={o.value}
                                                    type="button"
                                                    onClick={() => setAesthetic(o.value)}
                                                    className="relative flex flex-col rounded-xl overflow-hidden transition-all duration-200 text-left border"
                                                    style={{ borderColor: selected ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)' }}
                                                >
                                                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                                                        <Image src={o.image} alt={o.label} fill className="object-cover" />
                                                        {selected && (
                                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--luxury-charcoal)' }}>
                                                                <CheckCircle className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="px-3 py-2.5" style={{ background: selected ? 'var(--luxury-cream)' : 'var(--luxury-warm-white)' }}>
                                                        <p className="luxury-body text-luxury-charcoal text-xs" style={{ fontWeight: selected ? 500 : 400 }}>{o.label}</p>
                                                        <p className="luxury-body text-luxury-charcoal/40 leading-snug" style={{ fontSize: '10px', fontWeight: 300 }}>{o.sub}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {(() => {
                                        const o = AESTHETICS[4];
                                        const selected = aesthetic === o.value;
                                        return (
                                            <div className="flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setAesthetic(o.value)}
                                                    className="relative flex flex-col rounded-xl overflow-hidden transition-all duration-200 text-left border"
                                                    style={{ width: 'calc(50% - 6px)', borderColor: selected ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)' }}
                                                >
                                                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                                                        <Image src={o.image} alt={o.label} fill className="object-cover" />
                                                        {selected && (
                                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--luxury-charcoal)' }}>
                                                                <CheckCircle className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="px-3 py-2.5" style={{ background: selected ? 'var(--luxury-cream)' : 'var(--luxury-warm-white)' }}>
                                                        <p className="luxury-body text-luxury-charcoal text-xs" style={{ fontWeight: selected ? 500 : 400 }}>{o.label}</p>
                                                        <p className="luxury-body text-luxury-charcoal/40 leading-snug" style={{ fontSize: '10px', fontWeight: 300 }}>{o.sub}</p>
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* ── Step 6: Context ─────────────────────────── */}
                            {step === 6 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-6">Question 5 of 5</div>
                                    <h2 className="iconik-display text-luxury-charcoal mb-8" style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>Where do you most need to look great?</h2>
                                    <div className="space-y-2">
                                        {CONTEXTS.map(o => (
                                            <button
                                                key={o.value}
                                                type="button"
                                                onClick={() => setDressingContext(o.value)}
                                                className="w-full text-left rounded-xl px-5 py-4 transition-all duration-200 border"
                                                style={{
                                                    background: dressingContext === o.value ? 'var(--luxury-cream)' : 'var(--luxury-warm-white)',
                                                    borderColor: dressingContext === o.value ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)',
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xl flex-shrink-0">{o.emoji}</span>
                                                    <span className="luxury-body text-luxury-charcoal text-sm" style={{ fontWeight: dressingContext === o.value ? 500 : 400 }}>{o.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 7: Optional Photo ──────────────────── */}
                            {step === 7 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-6">Optional — Boost Your Accuracy</div>
                                    <h2 className="iconik-display text-luxury-charcoal mb-3" style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>Want a more accurate Style Score?</h2>
                                    <p className="luxury-body text-luxury-charcoal/50 text-sm mb-2" style={{ fontWeight: 300 }}>Upload a clear photo — a simple selfie is fine. This helps us calibrate your score.</p>
                                    <p className="luxury-body text-luxury-charcoal/40 text-xs mb-7" style={{ fontWeight: 300 }}>Completely optional. Skip if you prefer.</p>

                                    <label className="block cursor-pointer group mb-5">
                                        <div
                                            className="border-dashed rounded-xl p-8 text-center transition-all duration-200 border-2"
                                            style={{
                                                background: photo ? 'var(--luxury-cream)' : 'var(--luxury-warm-white)',
                                                borderColor: photo ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)',
                                            }}
                                        >
                                            {photo ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    {uploading
                                                        ? <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--luxury-cream)', borderTopColor: 'var(--luxury-charcoal)' }} />
                                                        : <CheckCircle className="w-8 h-8 text-luxury-charcoal" />
                                                    }
                                                    <div className="luxury-body text-luxury-charcoal text-sm">{uploading ? 'Uploading…' : photo.name}</div>
                                                    {!uploading && <div className="luxury-body text-luxury-charcoal/40 text-xs">Click to change</div>}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3">
                                                    <Upload className="w-8 h-8 text-luxury-charcoal/25" />
                                                    <div className="luxury-body text-luxury-charcoal text-sm">Upload a photo</div>
                                                    <div className="luxury-body text-luxury-charcoal/40 text-xs">Selfie · Full body · Any angle</div>
                                                    <div className="iconik-micro text-luxury-charcoal/25">JPG · PNG · HEIC · Max 20MB</div>
                                                </div>
                                            )}
                                            <input type="file" accept=".jpg,.jpeg,.png,.heic,.heif" className="hidden" onChange={e => handlePhotoChange(e.target.files?.[0] ?? null)} />
                                        </div>
                                    </label>

                                    <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'var(--luxury-cream)', borderColor: 'var(--luxury-cream)' }}>
                                        <div className="relative w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                                            <Image src="/headshot.webp" alt="Example photo" fill className="object-cover" />
                                        </div>
                                        <p className="luxury-body text-luxury-charcoal/45 leading-relaxed text-xs" style={{ fontWeight: 300 }}>
                                            A clear selfie like this works perfectly. Natural light is ideal but not required.
                                        </p>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className={`flex mt-6 gap-4 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
                        {step > 0 && (
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex items-center gap-2 px-6 py-3 rounded-full luxury-body transition-all border"
                                style={{ borderColor: 'var(--luxury-cream)', color: 'var(--luxury-charcoal)', background: 'transparent' }}
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        )}
                        {step === TOTAL_STEPS ? (
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={uploading}
                                className="flex items-center gap-3 px-10 py-3 text-base luxury-body rounded-full transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                                style={{ background: 'var(--luxury-charcoal)', color: 'var(--luxury-warm-white)' }}
                            >
                                {uploading ? 'Uploading…' : 'Get My Style Score'} <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : step > 0 ? (
                            <button
                                type="button"
                                onClick={handleNextOrComplete}
                                disabled={!stepValid()}
                                className="flex items-center gap-3 px-10 py-3 text-base luxury-body rounded-full transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ background: 'var(--luxury-charcoal)', color: 'var(--luxury-warm-white)' }}
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    );
}
