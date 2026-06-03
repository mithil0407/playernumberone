'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { trackPageView, updateUserData } from '@/lib/metaPixel';
import {
    ClaritySwatch,
    computeColorMirrorResult,
    MetalTest,
    NaturalDepth,
    StyleGoal,
    TemperatureSwatch,
    WhiteTest,
} from '@/lib/supabaseStyleScan';

const TOTAL_QUESTIONS = 6;
const FINAL_STEP = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const METAL_OPTIONS: Array<{ value: MetalTest; label: string; background: string; textColor?: string; code: string }> = [
    { value: 'gold', label: 'Warm gold', background: '#C7A24B', code: '#C7A24B' },
    { value: 'silver', label: 'Cool silver', background: '#C9CDD3', code: '#C9CDD3' },
    { value: 'both', label: 'Both feel balanced', background: 'linear-gradient(90deg, #C7A24B 0%, #C7A24B 50%, #C9CDD3 50%, #C9CDD3 100%)', code: 'gold + silver' },
];

const DEPTH_OPTIONS: Array<{ value: NaturalDepth; label: string; background: string; textColor?: string; code: string }> = [
    { value: 'light', label: 'Light natural depth', background: '#D9C09B', code: '#D9C09B' },
    { value: 'medium', label: 'Medium natural depth', background: '#8F6046', code: '#8F6046', textColor: 'var(--luxury-warm-white)' },
    { value: 'deep', label: 'Deep natural depth', background: '#2C1F1A', code: '#2C1F1A', textColor: 'var(--luxury-warm-white)' },
];

const GOAL_OPTIONS: Array<{ value: StyleGoal; label: string; background: string; textColor?: string; code: string }> = [
    { value: 'arms', label: 'Draw the eye away from my arms', background: '#B88A9B', code: '#B88A9B' },
    { value: 'midsection', label: 'Draw the eye away from my midsection', background: '#4F7775', code: '#4F7775', textColor: 'var(--luxury-warm-white)' },
    { value: 'polished', label: 'Make me look more polished and expensive', background: '#2C2622', code: '#2C2622', textColor: 'var(--luxury-warm-white)' },
    { value: 'glow', label: 'Just make me glow', background: '#D8A94F', code: '#D8A94F' },
];

function StepDots({ step }: { step: number }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
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

function InstructionBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="mb-6 rounded-2xl border p-4" style={{ background: 'var(--luxury-cream)', borderColor: 'var(--luxury-cream)' }}>
            <p className="luxury-body text-luxury-charcoal/62 text-sm leading-relaxed" style={{ fontWeight: 300 }}>{children}</p>
        </div>
    );
}

function SwatchChoice({
    label,
    background,
    code,
    selected,
    onClick,
    textColor = 'var(--luxury-charcoal)',
}: {
    label: string;
    background: string;
    code: string;
    selected: boolean;
    onClick: () => void;
    textColor?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group min-h-[210px] overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ borderColor: selected ? 'var(--luxury-charcoal)' : 'var(--luxury-cream)', background }}
        >
            <div className="flex h-full min-h-[210px] flex-col justify-between p-5">
                <div className="flex justify-end">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: selected ? 'rgba(44,38,34,0.6)' : 'rgba(255,255,255,0.45)', background: selected ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.18)' }}>
                        {selected && <CheckCircle className="h-4 w-4 text-luxury-charcoal" />}
                    </div>
                </div>
                <div>
                    <div className="iconik-micro mb-2" style={{ color: textColor, opacity: 0.58 }}>Tap to choose</div>
                    <div className="luxury-body text-base" style={{ color: textColor, fontWeight: 500 }}>{label}</div>
                    <div className="iconik-mono mt-2" style={{ color: textColor, opacity: 0.45, fontSize: '10px' }}>{code}</div>
                </div>
            </div>
        </button>
    );
}

export default function ColorMirrorScanPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);

    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [formError, setFormError] = useState('');
    const [temperatureSwatch, setTemperatureSwatch] = useState<TemperatureSwatch | ''>('');
    const [metalTest, setMetalTest] = useState<MetalTest | ''>('');
    const [whiteTest, setWhiteTest] = useState<WhiteTest | ''>('');
    const [naturalDepth, setNaturalDepth] = useState<NaturalDepth | ''>('');
    const [claritySwatch, setClaritySwatch] = useState<ClaritySwatch | ''>('');
    const [styleGoal, setStyleGoal] = useState<StyleGoal | ''>('');

    useEffect(() => { trackPageView('Color Mirror Quiz'); }, []);
    useEffect(() => { if (step === FINAL_STEP && email) updateUserData(email); }, [step, email]);

    const goBack = useCallback(() => {
        setDirection(-1);
        setStep(s => Math.max(0, s - 1));
    }, []);

    const goNext = useCallback(() => {
        setDirection(1);
        setStep(s => Math.min(FINAL_STEP, s + 1));
    }, []);

    const advanceAfterChoice = useCallback(() => {
        setDirection(1);
        window.setTimeout(() => setStep(s => Math.min(FINAL_STEP, s + 1)), 180);
    }, []);

    const canContinue = useCallback(() => {
        switch (step) {
            case 0: return !!temperatureSwatch;
            case 1: return !!metalTest;
            case 2: return !!whiteTest;
            case 3: return !!naturalDepth;
            case 4: return !!claritySwatch;
            case 5: return !!styleGoal;
            case 6: return firstName.trim().length > 1 && EMAIL_RE.test(email);
            default: return false;
        }
    }, [step, firstName, email, temperatureSwatch, metalTest, whiteTest, naturalDepth, claritySwatch, styleGoal]);

    const handleComplete = useCallback(() => {
        if (!temperatureSwatch || !metalTest || !whiteTest || !naturalDepth || !claritySwatch || !styleGoal || !EMAIL_RE.test(email) || firstName.trim().length < 2) return;

        const result = computeColorMirrorResult({
            temperatureSwatch,
            metalTest,
            whiteTest,
            naturalDepth,
            claritySwatch,
            styleGoal,
        });

        const payload = {
            firstName: firstName.trim(),
            email,
            temperatureSwatch,
            metalTest,
            whiteTest,
            naturalDepth,
            claritySwatch,
            styleGoal,
            seasonName: result.seasonName,
            undertone: result.undertone,
            aesthetic: claritySwatch,
            struggle: styleGoal,
            bodyShape: '',
            dressingContext: '',
            whatsMissing: result.styleGoalPhrase,
            colourDirection: result.seasonName,
            silhouetteDirection: result.styleGoalPhrase,
            moodKeywords: [result.seasonName, result.undertone, claritySwatch],
            moodColours: result.powerPalette.map(c => c.hex),
            scoreLabel: result.seasonName,
            styleScore: 0,
            hasPhoto: false,
            subcopy: result.subcopy,
            betrayerColours: result.betrayerColours,
            powerPalette: result.powerPalette,
            betrayerExplanation: result.betrayerExplanation,
            styleGoalPhrase: result.styleGoalPhrase,
            source: 'color_mirror',
            completedAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
            localStorage.setItem('style_scan_result', JSON.stringify(payload));
            localStorage.setItem('stylist_customerEmail', email);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'quiz_completed', { funnel: 'color_mirror', season: result.seasonName });
        }
        router.push('/stylist/style-score/result');
    }, [claritySwatch, email, firstName, metalTest, naturalDepth, router, styleGoal, temperatureSwatch, whiteTest]);

    const handleEmailSubmit = useCallback(() => {
        if (firstName.trim().length < 2) {
            setFormError('Please enter your first name.');
            return;
        }
        if (!EMAIL_RE.test(email)) {
            setFormError('Please enter a valid email address.');
            return;
        }
        setFormError('');
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq?.('trackCustom', 'email_submitted', { funnel: 'color_mirror', email });
        }
        handleComplete();
    }, [email, firstName, handleComplete]);

    const handleContinue = useCallback(() => {
        if (step === FINAL_STEP) {
            handleEmailSubmit();
            return;
        }
        goNext();
    }, [goNext, handleEmailSubmit, step]);

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    };

    return (
        <div className="flex min-h-screen flex-col overflow-x-hidden text-luxury-charcoal" style={{ background: 'var(--luxury-warm-white)' }}>
            <header className="sticky top-0 z-20 border-b px-5 py-4" style={{ background: 'rgba(244,239,229,0.95)', borderColor: 'var(--luxury-cream)', backdropFilter: 'blur(18px)' }}>
                <div className="mx-auto max-w-2xl">
                    <div className="mb-3 flex items-center justify-between gap-4">
                        <span className="iconik-display text-luxury-charcoal" style={{ fontSize: '16px', letterSpacing: '0.32em' }}>I C O N I K</span>
                        {step < FINAL_STEP ? (
                            <div className="flex items-center gap-3">
                                <StepDots step={step + 1} />
                                <span className="iconik-mono text-luxury-charcoal/40" style={{ fontSize: '10px' }}>{step + 1} / {TOTAL_QUESTIONS}</span>
                            </div>
                        ) : (
                            <span className="iconik-micro text-luxury-charcoal/40">Send result</span>
                        )}
                    </div>
                    {step < FINAL_STEP && (
                        <div className="h-0.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--luxury-cream)' }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((step + 1) / TOTAL_QUESTIONS) * 100}%`, background: 'var(--iconik-slate)' }} />
                        </div>
                    )}
                </div>
            </header>

            <main className="flex flex-1 items-start justify-center px-4 py-8 md:items-center md:py-12">
                <div className="w-full max-w-xl">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.28, ease: 'easeOut' }}
                            className="rounded-2xl border p-7 md:p-9"
                            style={{ background: 'var(--luxury-warm-white)', borderColor: 'var(--luxury-cream)' }}
                        >
                            {step === 0 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-5">Question 1 of 6</div>
                                    <InstructionBox>
                                        Hold your phone up to your face or bare wrist. Tilt the screen so each color fills your view. Which side makes your skin look alive, healthy, lifted — and which makes it look a little grey or tired?
                                    </InstructionBox>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <SwatchChoice label="Warm golden" background="#C8956C" code="#C8956C" selected={temperatureSwatch === 'warm'} onClick={() => { setTemperatureSwatch('warm'); advanceAfterChoice(); }} />
                                        <SwatchChoice label="Cool blue" background="#7B9FC4" code="#7B9FC4" selected={temperatureSwatch === 'cool'} onClick={() => { setTemperatureSwatch('cool'); advanceAfterChoice(); }} />
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-5">Question 2 of 6</div>
                                    <InstructionBox>
                                        Look at these tones against your face. Which one makes your skin look clearer and more awake?
                                    </InstructionBox>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {METAL_OPTIONS.map(o => (
                                            <SwatchChoice key={o.value} label={o.label} background={o.background} code={o.code} selected={metalTest === o.value} onClick={() => { setMetalTest(o.value); advanceAfterChoice(); }} textColor={o.textColor} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-5">Question 3 of 6</div>
                                    <InstructionBox>
                                        Hold your phone up to your face again. Which feels cleaner and brighter against your skin — left or right?
                                    </InstructionBox>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <SwatchChoice label="Warm cream / ivory" background="#F5ECD7" code="#F5ECD7" selected={whiteTest === 'warm_cream'} onClick={() => { setWhiteTest('warm_cream'); advanceAfterChoice(); }} />
                                        <SwatchChoice label="Bright white" background="#F4F4F6" code="#F4F4F6" selected={whiteTest === 'bright_white'} onClick={() => { setWhiteTest('bright_white'); advanceAfterChoice(); }} />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-5">Question 4 of 6</div>
                                    <InstructionBox>
                                        Which depth feels closest to the natural contrast of your hair, eyes, and features?
                                    </InstructionBox>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {DEPTH_OPTIONS.map(o => (
                                            <SwatchChoice key={o.value} label={o.label} background={o.background} code={o.code} selected={naturalDepth === o.value} onClick={() => { setNaturalDepth(o.value); advanceAfterChoice(); }} textColor={o.textColor} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-5">Question 5 of 6</div>
                                    <InstructionBox>
                                        Hold your phone up one more time. This time notice your features — do they look more defined and striking against the vivid side, or softer and more natural against the muted side?
                                    </InstructionBox>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <SwatchChoice label="Vivid, saturated" background="#2D6FA3" code="#2D6FA3" selected={claritySwatch === 'vivid'} onClick={() => { setClaritySwatch('vivid'); advanceAfterChoice(); }} textColor="var(--luxury-warm-white)" />
                                        <SwatchChoice label="Soft, muted" background="#9BA8A3" code="#9BA8A3" selected={claritySwatch === 'muted'} onClick={() => { setClaritySwatch('muted'); advanceAfterChoice(); }} />
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-5">Question 6 of 6</div>
                                    <InstructionBox>
                                        What do you most want your style to quietly do for you?
                                    </InstructionBox>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {GOAL_OPTIONS.map(o => (
                                            <SwatchChoice key={o.value} label={o.label} background={o.background} code={o.code} selected={styleGoal === o.value} onClick={() => { setStyleGoal(o.value); advanceAfterChoice(); }} textColor={o.textColor} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === FINAL_STEP && (
                                <div>
                                    <div className="iconik-micro text-luxury-charcoal/35 mb-6">Send your result</div>
                                    <h1 className="iconik-display text-luxury-charcoal mb-3" style={{ fontSize: 'clamp(30px, 5vw, 44px)' }}>
                                        Where should we send your color result?
                                    </h1>
                                    <p className="luxury-body text-luxury-charcoal/55 text-sm leading-relaxed mb-8" style={{ fontWeight: 300 }}>
                                        We&apos;ll include the specific colors your wardrobe is probably built around that are quietly working against you.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="iconik-micro text-luxury-charcoal/40 mb-3 block">First name</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={e => { setFirstName(e.target.value); setFormError(''); }}
                                                className="w-full rounded-xl px-4 py-4 luxury-body text-base outline-none transition-all"
                                                style={{ border: '1.5px solid var(--luxury-cream)', background: 'var(--luxury-warm-white)', color: 'var(--luxury-charcoal)' }}
                                                placeholder="First name"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="iconik-micro text-luxury-charcoal/40 mb-3 block">Email address</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => { setEmail(e.target.value); setFormError(''); }}
                                                onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit(); }}
                                                className="w-full rounded-xl px-4 py-4 luxury-body text-base outline-none transition-all"
                                                style={{ border: '1.5px solid var(--luxury-cream)', background: 'var(--luxury-warm-white)', color: 'var(--luxury-charcoal)' }}
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>
                                    {formError && <p className="iconik-mono text-red-500 text-xs mt-3">{formError}</p>}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className={`mt-6 flex gap-4 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
                        {step > 0 && (
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex items-center gap-2 rounded-full border px-6 py-3 luxury-body transition-all"
                                style={{ borderColor: 'var(--luxury-cream)', color: 'var(--luxury-charcoal)' }}
                            >
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>
                        )}
                        {step === FINAL_STEP && (
                            <button
                                type="button"
                                onClick={handleContinue}
                                disabled={!canContinue()}
                                className="flex items-center gap-3 rounded-full px-8 py-3 luxury-body transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30"
                                style={{ background: 'var(--luxury-charcoal)', color: 'var(--luxury-warm-white)' }}
                            >
                                Reveal My Results <ArrowRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
