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

function ProgressBar({ step }: { step: number }) {
    const pct = (step / TOTAL_STEPS) * 100;
    return (
        <div className="w-full bg-luxury-cream rounded-full h-1.5 overflow-hidden">
            <div className="bg-luxury-accent h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
    );
}

function RadioCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left border-2 rounded-xl px-5 py-4 transition-all duration-200 ${selected
                ? 'border-luxury-accent bg-luxury-pink-bg shadow-sm shadow-luxury-accent/10'
                : 'border-luxury-cream bg-luxury-warm-white hover:border-luxury-accent/40 hover:bg-luxury-cream/10'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'border-luxury-accent' : 'border-luxury-charcoal/20'}`}>
                    {selected && <div className="w-2.5 h-2.5 bg-luxury-accent rounded-full" />}
                </div>
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
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden flex flex-col">

            {/* Header */}
            <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream py-4 px-6 sticky top-0 z-20">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                        {step > 0 && (
                            <span className="text-xs luxury-body text-luxury-charcoal/50 font-semibold tracking-widest uppercase">
                                {step < TOTAL_STEPS ? `Question ${step} of ${TOTAL_STEPS - 1}` : 'Almost done'}
                            </span>
                        )}
                    </div>
                    {step > 0 && <ProgressBar step={step} />}
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
                            className="bg-luxury-warm-white md:bg-luxury-cream/20 md:backdrop-blur-sm md:border md:border-luxury-cream md:rounded-3xl md:p-10 md:shadow-xl md:shadow-luxury-accent/5"
                        >

                            {/* ── Step 0: Welcome ──────────────────────────── */}
                            {step === 0 && (
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                                        <div className="absolute inset-0 bg-luxury-accent rounded-full opacity-20 animate-ping" />
                                        <CheckCircle className="w-10 h-10 text-luxury-accent relative z-10" />
                                    </div>
                                    <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-3">Free ICONIK Style Scan</p>
                                    <h1 className="text-3xl md:text-4xl luxury-heading text-luxury-charcoal mb-5 leading-tight">
                                        Your free Style Score + Personal Mood Board.
                                    </h1>
                                    <p className="luxury-body text-luxury-charcoal/70 text-base leading-relaxed mb-8 max-w-sm mx-auto">
                                        6 quick questions. A personalised result that shows you exactly where your style is losing alignment — and how to fix it.
                                    </p>
                                    <button
                                        onClick={goNext}
                                        className="inline-flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-4 text-base font-semibold luxury-body rounded-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        Start My Free Style Scan <ArrowRight className="w-5 h-5" />
                                    </button>
                                    <p className="luxury-body text-luxury-charcoal/40 text-xs mt-4">Takes 3 minutes · 100% free · No card required</p>
                                </div>
                            )}

                            {/* ── Step 1: Email ────────────────────────────── */}
                            {step === 1 && (
                                <div>
                                    <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-4">Before We Start</p>
                                    <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-3">Where should we send your results?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 text-sm mb-7">Your Style Score and Mood Board will be ready at the end. Enter your email so they don&apos;t disappear.</p>
                                    <div>
                                        <label className="block text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                                            onKeyDown={e => { if (e.key === 'Enter' && stepValid()) handleNextOrComplete(); }}
                                            className="w-full px-4 py-4 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body"
                                            placeholder="your@email.com"
                                            autoFocus
                                        />
                                        {emailError && <p className="text-luxury-accent text-xs mt-2 luxury-body">{emailError}</p>}
                                        <p className="text-xs text-luxury-charcoal/40 mt-2 luxury-body">We&apos;ll only send your result — no spam, ever.</p>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 2: Style Struggle (emoji cards) ─────── */}
                            {step === 2 && (
                                <div>
                                    <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-4">Question 1 of 5</p>
                                    <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-3">What&apos;s your biggest style struggle right now?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 text-sm mb-7">Select one.</p>
                                    <div className="space-y-3">
                                        {STRUGGLES.map(o => (
                                            <button
                                                key={o.value}
                                                type="button"
                                                onClick={() => setStruggle(o.value)}
                                                className={`w-full text-left border-2 rounded-xl px-5 py-4 transition-all duration-200 ${struggle === o.value
                                                    ? 'border-luxury-accent bg-luxury-pink-bg shadow-sm shadow-luxury-accent/10'
                                                    : 'border-luxury-cream bg-luxury-warm-white hover:border-luxury-accent/40 hover:bg-luxury-cream/10'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-2xl flex-shrink-0">{o.emoji}</span>
                                                    <div>
                                                        <div className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</div>
                                                        <div className="text-xs text-luxury-charcoal/50 luxury-body mt-0.5">{o.sub}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 3: Body Shape (image cards) ─────────── */}
                            {step === 3 && (
                                <div>
                                    <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-4">Question 2 of 5</p>
                                    <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-3">Which silhouette is closest to yours?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 text-sm mb-6">Select one. Don&apos;t overthink it — go with your instinct.</p>

                                    {/* First 4 in 2-column grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        {BODY_SHAPES.slice(0, 4).map(o => {
                                            const selected = bodyShape === o.value;
                                            return (
                                                <button
                                                    key={o.value}
                                                    type="button"
                                                    onClick={() => setBodyShape(o.value)}
                                                    className={`relative flex flex-col border-2 rounded-2xl overflow-hidden transition-all duration-200 text-left ${selected
                                                        ? 'border-luxury-accent shadow-md shadow-luxury-accent/15'
                                                        : 'border-luxury-cream hover:border-luxury-accent/40'}`}
                                                >
                                                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                                                        <Image src={o.image} alt={o.label} fill className="object-cover" />
                                                        {selected && (
                                                            <div className="absolute top-2 right-2 w-6 h-6 bg-luxury-accent rounded-full flex items-center justify-center shadow-md">
                                                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`px-3 py-2.5 ${selected ? 'bg-luxury-pink-bg' : 'bg-luxury-warm-white'}`}>
                                                        <p className={`font-semibold luxury-body text-xs ${selected ? 'text-luxury-accent' : 'text-luxury-charcoal'}`}>{o.label}</p>
                                                        <p className="text-[10px] luxury-body text-luxury-charcoal/50 mt-0.5 leading-snug">{o.sub}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* 5th card centred at half width */}
                                    {(() => {
                                        const o = BODY_SHAPES[4];
                                        const selected = bodyShape === o.value;
                                        return (
                                            <div className="flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setBodyShape(o.value)}
                                                    className={`relative flex flex-col border-2 rounded-2xl overflow-hidden transition-all duration-200 text-left w-[calc(50%-6px)] ${selected
                                                        ? 'border-luxury-accent shadow-md shadow-luxury-accent/15'
                                                        : 'border-luxury-cream hover:border-luxury-accent/40'}`}
                                                >
                                                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                                                        <Image src={o.image} alt={o.label} fill className="object-cover" />
                                                        {selected && (
                                                            <div className="absolute top-2 right-2 w-6 h-6 bg-luxury-accent rounded-full flex items-center justify-center shadow-md">
                                                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`px-3 py-2.5 ${selected ? 'bg-luxury-pink-bg' : 'bg-luxury-warm-white'}`}>
                                                        <p className={`font-semibold luxury-body text-xs ${selected ? 'text-luxury-accent' : 'text-luxury-charcoal'}`}>{o.label}</p>
                                                        <p className="text-[10px] luxury-body text-luxury-charcoal/50 mt-0.5 leading-snug">{o.sub}</p>
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* ── Step 4: Undertone (split-screen colour test) */}
                            {step === 4 && (
                                <div>
                                    <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-4">Question 3 of 5</p>
                                    <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-2">Which shade makes your skin look more alive?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 text-sm mb-5">
                                        Hold your phone flat against your inner wrist. Look in a mirror. Which side makes your skin glow more?
                                    </p>

                                    {/* Split-screen colour swatch */}
                                    <div className="rounded-2xl overflow-hidden border border-luxury-cream mb-2 shadow-sm" style={{ height: '120px' }}>
                                        <div className="flex h-full">
                                            <div className="flex-1 flex flex-col items-center justify-center gap-1.5" style={{ backgroundColor: '#E8C080' }}>
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5C3D0A]/70">Warm</span>
                                                <span className="text-[9px] luxury-body text-[#5C3D0A]/50">Golden · Peachy</span>
                                            </div>
                                            <div className="w-px bg-white/60" />
                                            <div className="flex-1 flex flex-col items-center justify-center gap-1.5" style={{ backgroundColor: '#B0A8D8' }}>
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2A1F5C]/70">Cool</span>
                                                <span className="text-[9px] luxury-body text-[#2A1F5C]/50">Lavender · Pink</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] luxury-body text-luxury-charcoal/40 text-center mb-6">
                                        Hold your phone against your inner wrist — not on screen
                                    </p>

                                    {/* Answer cards */}
                                    <div className="space-y-3">
                                        {UNDERTONES.map(o => (
                                            <RadioCard key={o.value} selected={undertone === o.value} onClick={() => setUndertone(o.value)}>
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-4 h-4 rounded-full flex-shrink-0 border border-luxury-cream/80 shadow-sm" style={{ backgroundColor: o.dotColour }} />
                                                    <div>
                                                        <div className="font-semibold text-luxury-charcoal luxury-body">{o.label}</div>
                                                        <div className="text-xs text-luxury-charcoal/50 luxury-body mt-0.5">{o.sub}</div>
                                                    </div>
                                                </div>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 5: Aesthetic (image cards) ──────────── */}
                            {step === 5 && (
                                <div>
                                    <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-4">Question 4 of 5</p>
                                    <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-3">Which of these feels most like the style you want?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 text-sm mb-6">Select one.</p>

                                    {/* First 4 in 2-column grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        {AESTHETICS.slice(0, 4).map(o => {
                                            const selected = aesthetic === o.value;
                                            return (
                                                <button
                                                    key={o.value}
                                                    type="button"
                                                    onClick={() => setAesthetic(o.value)}
                                                    className={`relative flex flex-col border-2 rounded-2xl overflow-hidden transition-all duration-200 text-left ${selected
                                                        ? 'border-luxury-accent shadow-md shadow-luxury-accent/15'
                                                        : 'border-luxury-cream hover:border-luxury-accent/40'}`}
                                                >
                                                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                                                        <Image src={o.image} alt={o.label} fill className="object-cover" />
                                                        {selected && (
                                                            <div className="absolute top-2 right-2 w-6 h-6 bg-luxury-accent rounded-full flex items-center justify-center shadow-md">
                                                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`px-3 py-2.5 ${selected ? 'bg-luxury-pink-bg' : 'bg-luxury-warm-white'}`}>
                                                        <p className={`font-semibold luxury-body text-xs ${selected ? 'text-luxury-accent' : 'text-luxury-charcoal'}`}>{o.label}</p>
                                                        <p className="text-[10px] luxury-body text-luxury-charcoal/50 mt-0.5 leading-snug">{o.sub}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* 5th card centred at half width */}
                                    {(() => {
                                        const o = AESTHETICS[4];
                                        const selected = aesthetic === o.value;
                                        return (
                                            <div className="flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setAesthetic(o.value)}
                                                    className={`relative flex flex-col border-2 rounded-2xl overflow-hidden transition-all duration-200 text-left w-[calc(50%-6px)] ${selected
                                                        ? 'border-luxury-accent shadow-md shadow-luxury-accent/15'
                                                        : 'border-luxury-cream hover:border-luxury-accent/40'}`}
                                                >
                                                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                                                        <Image src={o.image} alt={o.label} fill className="object-cover" />
                                                        {selected && (
                                                            <div className="absolute top-2 right-2 w-6 h-6 bg-luxury-accent rounded-full flex items-center justify-center shadow-md">
                                                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`px-3 py-2.5 ${selected ? 'bg-luxury-pink-bg' : 'bg-luxury-warm-white'}`}>
                                                        <p className={`font-semibold luxury-body text-xs ${selected ? 'text-luxury-accent' : 'text-luxury-charcoal'}`}>{o.label}</p>
                                                        <p className="text-[10px] luxury-body text-luxury-charcoal/50 mt-0.5 leading-snug">{o.sub}</p>
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* ── Step 6: Dressing Context (emoji cards) ─────── */}
                            {step === 6 && (
                                <div>
                                    <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-4">Question 5 of 5</p>
                                    <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-3">Where do you most need to look great?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 text-sm mb-7">Select one.</p>
                                    <div className="space-y-3">
                                        {CONTEXTS.map(o => (
                                            <button
                                                key={o.value}
                                                type="button"
                                                onClick={() => setDressingContext(o.value)}
                                                className={`w-full text-left border-2 rounded-xl px-5 py-4 transition-all duration-200 ${dressingContext === o.value
                                                    ? 'border-luxury-accent bg-luxury-pink-bg shadow-sm shadow-luxury-accent/10'
                                                    : 'border-luxury-cream bg-luxury-warm-white hover:border-luxury-accent/40 hover:bg-luxury-cream/10'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-2xl flex-shrink-0">{o.emoji}</span>
                                                    <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 7: Optional Photo ────────────────────── */}
                            {step === 7 && (
                                <div>
                                    <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-4">Optional — Boost Your Accuracy</p>
                                    <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-3">Want a more accurate Style Score?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 text-sm mb-2">Upload a clear photo — a simple selfie is fine. This helps us calibrate your score.</p>
                                    <p className="luxury-body text-luxury-accent text-xs mb-7 font-semibold">Completely optional. Skip if you prefer.</p>

                                    <label className="block cursor-pointer group mb-6">
                                        <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${photo ? 'border-luxury-accent bg-luxury-pink-bg' : 'border-luxury-cream bg-luxury-warm-white group-hover:border-luxury-accent/50 group-hover:bg-luxury-cream/20'}`}>
                                            {photo ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    {uploading
                                                        ? <div className="w-10 h-10 border-2 border-luxury-accent/30 border-t-luxury-accent rounded-full animate-spin" />
                                                        : <CheckCircle className="w-10 h-10 text-luxury-accent" />
                                                    }
                                                    <div className="font-semibold text-luxury-charcoal luxury-body text-sm">{uploading ? 'Uploading…' : photo.name}</div>
                                                    {!uploading && <div className="text-xs text-luxury-charcoal/50 luxury-body">Click to change</div>}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3">
                                                    <Upload className="w-10 h-10 text-luxury-charcoal/30 group-hover:text-luxury-accent transition-colors" />
                                                    <div className="font-semibold text-luxury-charcoal luxury-body">Upload a photo</div>
                                                    <div className="text-sm luxury-body text-luxury-charcoal/50">Selfie · Full body · Any angle</div>
                                                    <div className="text-xs luxury-body text-luxury-charcoal/30 uppercase tracking-wider">JPG · PNG · HEIC · Max 20MB</div>
                                                </div>
                                            )}
                                            <input type="file" accept=".jpg,.jpeg,.png,.heic,.heif" className="hidden" onChange={e => handlePhotoChange(e.target.files?.[0] ?? null)} />
                                        </div>
                                    </label>

                                    <div className="flex items-center gap-3 p-3 bg-luxury-cream/30 rounded-xl">
                                        <div className="relative w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                                            <Image src="/headshot.webp" alt="Example photo" fill className="object-cover" />
                                        </div>
                                        <p className="text-xs luxury-body text-luxury-charcoal/50 leading-relaxed">
                                            A clear selfie like this works perfectly. Natural light is ideal but not required.
                                        </p>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className={`flex mt-8 gap-4 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
                        {step > 0 && (
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex items-center gap-2 px-6 py-3 border-2 border-luxury-cream rounded-full text-luxury-charcoal/70 luxury-body font-semibold hover:border-luxury-charcoal/30 hover:text-luxury-charcoal transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        )}
                        {step === TOTAL_STEPS ? (
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={uploading}
                                className="flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 disabled:opacity-60 text-luxury-warm-white px-10 py-3 text-base font-semibold luxury-body rounded-full transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                {uploading ? 'Uploading…' : 'Get My Style Score'} <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : step > 0 ? (
                            <button
                                type="button"
                                onClick={handleNextOrComplete}
                                disabled={!stepValid()}
                                className="flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-luxury-warm-white px-10 py-3 text-base font-semibold luxury-body rounded-full transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                Continue <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    );
}
