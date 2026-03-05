'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { uploadGlobeIntakePhoto } from '@/lib/supabaseGlobe';
import { trackPageView, trackCompleteRegistration } from '@/lib/metaPixel';

// ── Types ────────────────────────────────────────────────────────────────────

interface FormState {
    email: string;
    phone: string;
    photoFullBody: File | null;
    photoHeadshot: File | null;
    // Step 4
    frustrations: string[];
    frustrationsCustom: string;
    // Step 5
    situations: string[];
    // Step 6
    bodyInsecurities: string[];
    // Step 7
    wardrobeType: string;
    // Step 8
    colourPreference: string;
    // Step 9
    styleAesthetics: string[];
    // Step 10
    styleOutcome: string;
    // Step 11
    coveragePrefs: string[];
    // Step 12
    hairType: string[];
}

// ── Options ──────────────────────────────────────────────────────────────────

const FRUSTRATIONS = [
    { value: 'nothing-feels-like-me', label: 'Nothing in my wardrobe feels like "me"' },
    { value: 'look-older', label: 'I always look older than I feel' },
    { value: 'hiding-body', label: 'I hide my body instead of dressing it' },
    { value: 'everything-same', label: 'Everything I own looks the same' },
    { value: 'never-know-work', label: 'I never know what to wear to work' },
    { value: 'look-fine-no-confidence', label: 'I look fine but never feel confident' },
    { value: 'lots-nothing-works', label: 'I have lots of clothes but nothing works' },
    { value: 'feel-invisible', label: 'I feel invisible in what I wear' },
];

const SITUATIONS = [
    { value: 'corporate-office', label: 'Corporate office' },
    { value: 'client-facing', label: 'Client-facing' },
    { value: 'casual-social', label: 'Casual social' },
    { value: 'events-occasions', label: 'Events and occasions' },
    { value: 'work-from-home', label: 'Work from home' },
    { value: 'mix-of-everything', label: 'Mix of everything' },
];

const BODY_INSECURITIES = [
    { value: 'arms', label: 'Arms' },
    { value: 'midsection', label: 'Midsection' },
    { value: 'hips-thighs', label: 'Hips and thighs' },
    { value: 'bust', label: 'Bust' },
    { value: 'overall-height', label: 'Overall height' },
    { value: 'no-concern', label: 'No specific concern' },
];

const WARDROBE_TYPES = [
    { value: 'mostly-basics', label: 'Mostly basics, no real style' },
    { value: 'lots-nothing-works', label: 'Lots of clothes but nothing works' },
    { value: 'stuck-in-rut', label: 'Stuck in a rut from years ago' },
    { value: 'pretty-good', label: 'Pretty good but needs refinement' },
    { value: 'starting-fresh', label: 'Starting fresh' },
];

const COLOUR_PREFERENCES = [
    { value: 'neutrals-black', label: 'Mostly neutrals and black' },
    { value: 'some-colour-safe', label: 'Some colour but mostly safe choices' },
    { value: 'love-colour-lost', label: "I love colour but don't know what works" },
    { value: 'avoid-colour', label: 'I avoid colour entirely' },
];

const STYLE_AESTHETICS = [
    { value: 'minimalist', label: 'Minimalist', sub: 'Clean lines, neutral palette, nothing extra' },
    { value: 'classic', label: 'Classic / Timeless', sub: 'Structured, polished, investment pieces' },
    { value: 'boho', label: 'Boho / Relaxed', sub: 'Flowy, earthy, layered and effortless' },
    { value: 'smart-casual', label: 'Smart Casual', sub: 'Put-together but comfortable, never overdressed' },
    { value: 'feminine', label: 'Feminine / Romantic', sub: 'Soft fabrics, delicate details, elegant cuts' },
    { value: 'edgy', label: 'Edgy / Contemporary', sub: 'Bold cuts, contrast, statement pieces' },
    { value: 'preppy', label: 'Preppy / Polished', sub: 'Collegiate, structured, clean and refined' },
    { value: 'unknown', label: "I don't know yet — help me find it", sub: '' },
];

const STYLE_OUTCOMES = [
    { value: 'more-polished', label: 'Look more polished and professional' },
    { value: 'confident-body', label: 'Feel confident in my body' },
    { value: 'wardrobe-works', label: 'Build a wardrobe that actually works' },
    { value: 'appropriate', label: 'Dress appropriately for where I am in life' },
    { value: 'signature-style', label: "Find a signature style that's mine" },
];

const COVERAGE_PREFS = [
    { value: 'covered-arms', label: 'Prefer covered arms' },
    { value: 'covered-knees', label: 'Prefer covered knees' },
    { value: 'modest-necklines', label: 'Prefer modest necklines' },
    { value: 'no-restrictions', label: 'No restrictions' },
];

const HAIR_TYPES = [
    { value: 'straight', label: 'Straight' },
    { value: 'wavy', label: 'Wavy' },
    { value: 'curly-coily', label: 'Curly / Coily' },
    { value: 'fine', label: 'Fine (low density)' },
    { value: 'thick', label: 'Thick (high density)' },
];

const TOTAL_STEPS = 14;
const CONFIRMATION_STEP = 13;
const QUESTION_COUNT = 12;

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
    const pct = (step / QUESTION_COUNT) * 100;
    return (
        <div className="w-full bg-luxury-cream rounded-full h-1.5 overflow-hidden">
            <div
                className="bg-luxury-accent h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(pct, 100)}%` }}
            />
        </div>
    );
}

function RadioCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left border-2 rounded-xl px-5 py-4 transition-all duration-200 ${selected
                ? 'border-luxury-accent bg-luxury-pink-bg shadow-sm shadow-luxury-accent/10 hover:-translate-y-0.5 transform'
                : 'border-luxury-cream bg-luxury-warm-white hover:border-luxury-accent/40 hover:bg-luxury-cream/10'
                }`}
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

function CheckCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left border-2 rounded-xl px-5 py-4 transition-all duration-200 ${selected
                ? 'border-luxury-accent bg-luxury-pink-bg shadow-sm shadow-luxury-accent/10 hover:-translate-y-0.5 transform'
                : 'border-luxury-cream bg-luxury-warm-white hover:border-luxury-accent/40 hover:bg-luxury-cream/10'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/20 bg-luxury-warm-white'}`}>
                    {selected && (
                        <svg className="w-3.5 h-3.5 text-luxury-warm-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                {children}
            </div>
        </button>
    );
}

function PhotoUploadField({ label, instruction, file, onChange, required }: {
    label: string; instruction: string; file: File | null; onChange: (file: File | null) => void; required?: boolean;
}) {
    return (
        <label className="block cursor-pointer group">
            <div className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-200 ${file ? 'border-luxury-accent bg-luxury-pink-bg' : 'border-luxury-cream bg-luxury-warm-white group-hover:border-luxury-accent/50 group-hover:bg-luxury-cream/20'}`}>
                {file ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-luxury-accent/10 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle className="w-8 h-8 text-luxury-accent" />
                        </div>
                        <div className="font-semibold text-luxury-charcoal luxury-body">{file.name}</div>
                        <div className="text-xs text-luxury-charcoal/50 luxury-body">Click or drag here to change</div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-luxury-cream/50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-luxury-charcoal/40 group-hover:text-luxury-accent transition-colors" />
                        </div>
                        <div className="font-semibold text-luxury-charcoal luxury-body">{label}{required && ' *'}</div>
                        <div className="text-sm luxury-body text-luxury-charcoal/60 max-w-sm leading-relaxed">{instruction}</div>
                        <div className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-wider mt-2">JPG · PNG · HEIC · Max 20MB</div>
                    </div>
                )}
                <input type="file" accept=".jpg,.jpeg,.png,.heic,.heif" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} required={required} />
            </div>
        </label>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

function GlobeIntakePageInner() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [direction, setDirection] = useState(1);
    const [contactPrefilled, setContactPrefilled] = useState(false);

    const [form, setForm] = useState<FormState>({
        email: '',
        phone: '',
        photoFullBody: null,
        photoHeadshot: null,
        frustrations: [],
        frustrationsCustom: '',
        situations: [],
        bodyInsecurities: [],
        wardrobeType: '',
        colourPreference: '',
        styleAesthetics: [],
        styleOutcome: '',
        coveragePrefs: [],
        hairType: [],
    });

    useEffect(() => {
        trackPageView('Globe Intake');
        const urlEmail = searchParams.get('email') || '';
        const urlPhone = searchParams.get('phone') || '';
        const lsEmail = typeof window !== 'undefined' ? localStorage.getItem('globe_customerEmail') || '' : '';
        const lsPhone = typeof window !== 'undefined' ? localStorage.getItem('globe_customerPhone') || '' : '';
        const resolvedEmail = urlEmail || lsEmail;
        const resolvedPhone = urlPhone || lsPhone;
        if (resolvedEmail || resolvedPhone) {
            setForm(prev => ({ ...prev, email: resolvedEmail, phone: resolvedPhone }));
            if (resolvedEmail && resolvedPhone) setContactPrefilled(true);
        }
    }, [searchParams]);

    const goNext = useCallback(() => {
        setDirection(1);
        setStep(s => {
            if (s === 0 && contactPrefilled) return 2;
            return s + 1;
        });
    }, [contactPrefilled]);

    const goBack = useCallback(() => {
        setDirection(-1);
        setStep(s => {
            if (s === 2 && contactPrefilled) return 0;
            return Math.max(0, s - 1);
        });
    }, [contactPrefilled]);

    const toggleMulti = (field: keyof FormState, value: string, max?: number) => {
        setForm(prev => {
            const current = prev[field] as string[];
            if (current.includes(value)) return { ...prev, [field]: current.filter(v => v !== value) };
            if (max && current.length >= max) return prev;
            return { ...prev, [field]: [...current, value] };
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError('');
        try {
            let photoFullBodyUrl = '';
            let photoHeadshotUrl = '';

            if (form.photoFullBody) {
                try {
                    const baseName = form.photoFullBody.name.replace(/\.[^.]+$/, '');
                    photoFullBodyUrl = await uploadGlobeIntakePhoto(form.photoFullBody, `${Date.now()}_fullbody_${baseName}.jpg`);
                } catch (err) { console.warn('Full body photo upload failed:', err); }
            }

            if (form.photoHeadshot) {
                try {
                    const baseName = form.photoHeadshot.name.replace(/\.[^.]+$/, '');
                    photoHeadshotUrl = await uploadGlobeIntakePhoto(form.photoHeadshot, `${Date.now()}_headshot_${baseName}.jpg`);
                } catch (err) { console.warn('Headshot upload failed:', err); }
            }

            const intakePayload = {
                customer_email: form.email,
                customer_phone: form.phone,
                photo_fullbody_url: photoFullBodyUrl,
                photo_headshot_url: photoHeadshotUrl,
                frustrations: form.frustrations.join(','),
                frustrations_custom: form.frustrationsCustom,
                situations: form.situations.join(','),
                body_insecurities: form.bodyInsecurities.join(','),
                wardrobe_type: form.wardrobeType,
                colour_preference: form.colourPreference,
                style_aesthetics: form.styleAesthetics.join(','),
                style_outcome: form.styleOutcome,
                style_restrictions: form.coveragePrefs.join(','),
                hair_type: form.hairType.join(','),
            };

            // Submit via server-side API (uses admin client, bypasses RLS)
            const submitRes = await fetch('/api/globe-intake-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(intakePayload),
            });

            if (!submitRes.ok) {
                const errBody = await submitRes.json().catch(() => ({}));
                throw new Error(errBody.error || `Submission failed (${submitRes.status})`);
            }

            // Notify the ICONIK team (fire-and-forget — doesn't block customer UX)
            fetch('/api/globe-intake-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(intakePayload),
            }).catch(err => console.warn('Globe intake notify failed:', err));

            trackCompleteRegistration(349, 'ICONIK Blueprint Globe — Intake Submitted', 'AED');
            setDirection(1);
            setStep(CONFIRMATION_STEP);

        } catch (err) {
            console.error('Globe intake submit error:', err);
            setSubmitError('Something went wrong. Please try again or email hello@iconik.pro');
        } finally {
            setSubmitting(false);
        }
    };

    const stepValid = useCallback((): boolean => {
        switch (step) {
            case 0: return true;
            case 1: return form.email.includes('@') && form.phone.length >= 7;
            case 2: return !!form.photoFullBody;
            case 3: return !!form.photoHeadshot;
            case 4: return form.frustrations.length >= 1 || form.frustrationsCustom.trim().length > 0;
            case 5: return form.situations.length >= 1;
            case 6: return form.bodyInsecurities.length >= 1;
            case 7: return !!form.wardrobeType;
            case 8: return !!form.colourPreference;
            case 9: return form.styleAesthetics.length >= 1;
            case 10: return !!form.styleOutcome;
            case 11: return true; // optional
            case 12: return form.hairType.length >= 1;
            default: return true;
        }
    }, [step, form]);

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    };

    const isLastQuestion = step === 12;

    // Suppress unused variable warning (TOTAL_STEPS used for type safety)
    void TOTAL_STEPS;

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden flex flex-col">

            {/* Header */}
            <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream py-4 px-6 sticky top-0 z-20">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                        {step > 0 && step < CONFIRMATION_STEP && (
                            <span className="text-xs luxury-body text-luxury-charcoal/50 font-semibold tracking-widest uppercase">Step {step} of {QUESTION_COUNT}</span>
                        )}
                    </div>
                    {step > 0 && step < CONFIRMATION_STEP && <ProgressBar step={step} />}
                </div>
            </header>

            <main className="flex-1 flex items-start md:items-center justify-center px-4 py-8 md:py-16">
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

                            {/* ── Step 0: Opening ──────────────────────────────── */}
                            {step === 0 && (
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                                        <div className="absolute inset-0 bg-luxury-accent rounded-full opacity-20 animate-ping" />
                                        <CheckCircle className="w-10 h-10 text-luxury-accent relative z-10" />
                                    </div>
                                    <h1 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-6 leading-tight">Let&apos;s build your Blueprint.</h1>
                                    <p className="luxury-body text-luxury-charcoal/70 text-lg leading-relaxed mb-6 max-w-lg mx-auto">
                                        We need two photos and a few key details so our stylists can personalise your report. Takes exactly <strong className="text-luxury-charcoal font-semibold">4 minutes</strong>.
                                    </p>
                                    {contactPrefilled && form.email && (
                                        <div className="bg-luxury-cream/50 border border-luxury-cream rounded-xl px-5 py-3 mb-8 inline-block">
                                            <p className="luxury-body text-luxury-charcoal/70 text-sm">Continuing as <strong className="text-luxury-charcoal">{form.email}</strong></p>
                                        </div>
                                    )}
                                    <button
                                        onClick={goNext}
                                        className="inline-flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-4 text-base font-semibold luxury-body rounded-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        Begin Intake Form <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* ── Step 1: Contact ──────────────────────────────── */}
                            {step === 1 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Your contact details</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">So we can send your Blueprint to you.</p>
                                    {contactPrefilled ? (
                                        <div className="space-y-4">
                                            {[{ label: 'Email', value: form.email }, { label: 'Phone', value: form.phone }].map(f => (
                                                <div key={f.label} className="bg-luxury-cream/40 border border-luxury-cream rounded-xl px-5 py-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold luxury-body text-luxury-charcoal/50 uppercase tracking-wider mb-1">{f.label}</p>
                                                        <p className="luxury-body text-luxury-charcoal font-medium">{f.value}</p>
                                                    </div>
                                                    <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0" />
                                                </div>
                                            ))}
                                            <p className="text-xs text-center luxury-body text-luxury-charcoal/40 mt-3">Saved from your purchase. <button onClick={() => setContactPrefilled(false)} className="underline hover:text-luxury-accent transition-colors">Edit</button></p>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-2">Email Address *</label>
                                                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-4 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body" placeholder="your@email.com" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-2">Phone Number *</label>
                                                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/[^\d\s+()-]/g, '') }))} className="w-full px-4 py-4 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body" placeholder="+1 (555) 000-0000" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 2: Full Body Photo ──────────────────────── */}
                            {step === 2 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Upload a full-length photo.</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-6">Stand facing the camera. Natural light. Wear form-fitting clothes — leggings and a fitted top work well. No shapewear.</p>
                                    <div className="relative mx-auto w-40 mb-6" style={{ aspectRatio: '3/4' }}>
                                        <Image src="/fullbody.webp" alt="Example full-body photo" fill className="object-cover rounded-2xl border-2 border-luxury-cream" />
                                        <div className="absolute bottom-2 left-0 right-0 text-center">
                                            <span className="bg-luxury-charcoal/70 text-luxury-warm-white text-xs luxury-body px-2 py-0.5 rounded-full">Example</span>
                                        </div>
                                    </div>
                                    <PhotoUploadField label="Full body photo" instruction="Stand facing camera · Natural light · Form-fitting clothes · No shapewear" file={form.photoFullBody} onChange={f => setForm(p => ({ ...p, photoFullBody: f }))} required />
                                    {!form.photoFullBody && <p className="text-xs text-luxury-accent mt-3 text-center luxury-body">A full-length photo is required to complete your Blueprint analysis.</p>}
                                </div>
                            )}

                            {/* ── Step 3: Headshot ─────────────────────────────── */}
                            {step === 3 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Upload a clear headshot.</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-6">Face the camera directly. Natural or indoor light. No sunglasses. A simple selfie is fine.</p>
                                    <div className="relative mx-auto w-40 mb-6" style={{ aspectRatio: '3/4' }}>
                                        <Image src="/headshot.webp" alt="Example headshot photo" fill className="object-cover rounded-2xl border-2 border-luxury-cream" />
                                        <div className="absolute bottom-2 left-0 right-0 text-center">
                                            <span className="bg-luxury-charcoal/70 text-luxury-warm-white text-xs luxury-body px-2 py-0.5 rounded-full">Example</span>
                                        </div>
                                    </div>
                                    <PhotoUploadField label="Headshot / selfie" instruction="Face the camera · No sunglasses · Natural or indoor light · Selfie is fine" file={form.photoHeadshot} onChange={f => setForm(p => ({ ...p, photoHeadshot: f }))} required />
                                </div>
                            )}

                            {/* ── Step 4: Frustrations ─────────────────────────── */}
                            {step === 4 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What&apos;s your biggest frustration when getting dressed?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-2">Select all that apply.</p>
                                    <p className="text-luxury-charcoal/40 text-xs mb-6 uppercase tracking-widest font-semibold">Your answers shape your Blueprint recommendations</p>
                                    <div className="space-y-3 mb-6">
                                        {FRUSTRATIONS.map(o => (
                                            <CheckCard key={o.value} selected={form.frustrations.includes(o.value)} onClick={() => toggleMulti('frustrations', o.value)}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-2">
                                            Or describe it in your own words <span className="font-normal text-luxury-accent ml-1">Optional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.frustrationsCustom}
                                            onChange={e => { if (e.target.value.length <= 150) setForm(p => ({ ...p, frustrationsCustom: e.target.value })); }}
                                            className="w-full px-4 py-4 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body"
                                            placeholder="Describe in your own words..."
                                            maxLength={150}
                                        />
                                        <p className="text-xs text-luxury-charcoal/40 mt-2 text-right">{form.frustrationsCustom.length}/150</p>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 5: Situations ───────────────────────────── */}
                            {step === 5 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Which situations do you need to dress for most?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select all that apply.</p>
                                    <div className="space-y-3">
                                        {SITUATIONS.map(o => (
                                            <CheckCard key={o.value} selected={form.situations.includes(o.value)} onClick={() => toggleMulti('situations', o.value)}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 6: Body Areas ───────────────────────────── */}
                            {step === 6 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Which body areas do you feel least confident about when dressing?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-1">Select up to 2.</p>
                                    <p className="text-luxury-charcoal/40 text-xs mb-8 uppercase tracking-widest font-semibold mt-2">This helps us prioritise your silhouette guidance</p>
                                    <div className="space-y-3">
                                        {BODY_INSECURITIES.map(o => (
                                            <CheckCard key={o.value} selected={form.bodyInsecurities.includes(o.value)} onClick={() => toggleMulti('bodyInsecurities', o.value, 2)}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                    {form.bodyInsecurities.length === 2 && (
                                        <p className="text-xs text-luxury-accent mt-4 luxury-body font-medium">Maximum 2 selections reached.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 7: Wardrobe ─────────────────────────────── */}
                            {step === 7 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">How would you describe your current wardrobe?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Be honest — this helps us calibrate your Blueprint recommendations.</p>
                                    <div className="space-y-3">
                                        {WARDROBE_TYPES.map(o => (
                                            <RadioCard key={o.value} selected={form.wardrobeType === o.value} onClick={() => setForm(p => ({ ...p, wardrobeType: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 8: Colours ──────────────────────────────── */}
                            {step === 8 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What colours do you currently wear most?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select the closest match to your current habit.</p>
                                    <div className="space-y-3">
                                        {COLOUR_PREFERENCES.map(o => (
                                            <RadioCard key={o.value} selected={form.colourPreference === o.value} onClick={() => setForm(p => ({ ...p, colourPreference: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 9: Style Aesthetics ─────────────────────── */}
                            {step === 9 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What styles or aesthetics do you gravitate towards?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-1">Pick up to 3. If you&apos;re unsure, select the last option.</p>
                                    <p className="text-luxury-charcoal/40 text-xs mb-8 uppercase tracking-widest font-semibold mt-2">Skip if none clearly apply</p>
                                    <div className="space-y-3">
                                        {STYLE_AESTHETICS.map(o => (
                                            <CheckCard key={o.value} selected={form.styleAesthetics.includes(o.value)} onClick={() => toggleMulti('styleAesthetics', o.value, 3)}>
                                                <div>
                                                    <div className="font-semibold text-luxury-charcoal luxury-body">{o.label}</div>
                                                    {o.sub && <div className="text-sm text-luxury-charcoal/60 luxury-body mt-0.5">{o.sub}</div>}
                                                </div>
                                            </CheckCard>
                                        ))}
                                    </div>
                                    {form.styleAesthetics.length === 3 && (
                                        <p className="text-xs text-luxury-accent mt-4 luxury-body font-medium">Maximum 3 selections reached.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 10: Style Outcome ───────────────────────── */}
                            {step === 10 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What style outcome matters most to you right now?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Pick the one that resonates most. Your Blueprint will prioritise this.</p>
                                    <div className="space-y-3">
                                        {STYLE_OUTCOMES.map(o => (
                                            <RadioCard key={o.value} selected={form.styleOutcome === o.value} onClick={() => setForm(p => ({ ...p, styleOutcome: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 11: Coverage Preferences ────────────────── */}
                            {step === 11 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Are there any coverage preferences for your outfits?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-1">Select all that apply. <span className="font-medium text-luxury-accent">Optional.</span></p>
                                    <p className="text-luxury-charcoal/40 text-xs mb-8 uppercase tracking-widest font-semibold mt-2">Skip if none apply</p>
                                    <div className="space-y-3">
                                        {COVERAGE_PREFS.map(o => (
                                            <CheckCard key={o.value} selected={form.coveragePrefs.includes(o.value)} onClick={() => toggleMulti('coveragePrefs', o.value)}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 12: Hair Type ───────────────────────────── */}
                            {step === 12 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What is your hair type?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select up to 2 that apply (e.g. Wavy + Fine).</p>
                                    <div className="space-y-3">
                                        {HAIR_TYPES.map(o => (
                                            <CheckCard key={o.value} selected={form.hairType.includes(o.value)} onClick={() => toggleMulti('hairType', o.value, 2)}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                    {form.hairType.length === 2 && (
                                        <p className="text-xs text-luxury-accent mt-4 luxury-body font-medium">Maximum 2 selections reached.</p>
                                    )}
                                    {submitError && (
                                        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm luxury-body">{submitError}</div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 13: Confirmation ────────────────────────── */}
                            {step === CONFIRMATION_STEP && (
                                <div className="text-center py-10">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                        className="w-24 h-24 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                                    >
                                        <div className="absolute inset-0 bg-luxury-accent rounded-full opacity-20 animate-ping" />
                                        <CheckCircle className="w-12 h-12 text-luxury-accent relative z-10" />
                                    </motion.div>
                                    <h2 className="text-4xl md:text-5xl luxury-heading text-luxury-charcoal mb-6">Your intake is complete.</h2>
                                    <p className="luxury-body text-luxury-charcoal/70 text-lg md:text-xl leading-relaxed max-w-lg mx-auto mb-6">
                                        Your ICONIK Blueprint is now being prepared by our expert stylists and will arrive in your inbox within <strong className="font-semibold text-luxury-charcoal">24 hours</strong>.
                                    </p>
                                    <p className="luxury-body text-sm text-luxury-charcoal/50">Check your spam folder just in case.</p>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* ── Navigation ─────────────────────────────────────── */}
                    {step < CONFIRMATION_STEP && (
                        <div className="flex items-center justify-between mt-8 relative z-10">
                            {step > 0 ? (
                                <button onClick={goBack} className="flex items-center gap-2 text-luxury-charcoal/50 hover:text-luxury-accent text-sm font-semibold uppercase tracking-wider transition-colors luxury-body p-2 -ml-2">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                            ) : <div />}

                            {step > 0 && !isLastQuestion && (
                                <button
                                    onClick={goNext}
                                    disabled={!stepValid()}
                                    className="flex items-center gap-2 bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white px-8 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 transform luxury-body"
                                >
                                    Continue <ArrowRight className="w-4 h-4" />
                                </button>
                            )}

                            {isLastQuestion && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!stepValid() || submitting}
                                    className="flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-4 rounded-full text-base font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-xl transform luxury-body"
                                >
                                    {submitting ? 'Submitting...' : 'Submit My Intake'}
                                    {!submitting && <ArrowRight className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function GlobeIntakePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-luxury-warm-white flex items-center justify-center"><div className="luxury-body text-luxury-charcoal/50">Loading...</div></div>}>
            <GlobeIntakePageInner />
        </Suspense>
    );
}
