'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { saveAUIntakeSubmission, uploadAUIntakePhoto } from '@/lib/supabaseAU';

// ── Types ────────────────────────────────────────────────────────────────────

interface FormState {
    email: string;
    phone: string;
    photoFullBody: File | null;
    photoHeadshot: File | null;
    skinUndertone: string;
    bodyShape: string;
    faceShape: string;
    hairType: string[];
    lifestyle: string;
    styleRestrictions: string[];
    outfitMix: string;
    extraNotes: string;
}

// ── Options ──────────────────────────────────────────────────────────────────

const SKIN_UNDERTONES = [
    { value: 'warm', label: 'Warm', sub: 'golden, peachy, olive' },
    { value: 'cool', label: 'Cool', sub: 'pink, rosy, bluish' },
    { value: 'neutral', label: 'Neutral', sub: 'mixture of both' },
    { value: 'not-sure', label: "I'm not sure", sub: '' },
];

const BODY_SHAPES = [
    { value: 'hourglass', label: 'Hourglass', desc: 'Shoulders and hips aligned, defined waist' },
    { value: 'pear', label: 'Pear', desc: 'Narrower shoulders, wider hips' },
    { value: 'inverted-triangle', label: 'Inverted Triangle', desc: 'Broader shoulders, slimmer hips' },
    { value: 'rectangle', label: 'Rectangle', desc: 'Balanced and straight' },
    { value: 'apple', label: 'Apple', desc: 'Fullness at the centre' },
    { value: 'not-sure', label: "I'm not sure", desc: '' },
];

const FACE_SHAPES = [
    { value: 'oval', label: 'Oval' },
    { value: 'round', label: 'Round' },
    { value: 'square', label: 'Square' },
    { value: 'heart', label: 'Heart' },
    { value: 'oblong', label: 'Oblong / Long' },
    { value: 'not-sure', label: "I'm not sure" },
];

const HAIR_TYPES = [
    { value: 'straight', label: 'Straight' },
    { value: 'wavy', label: 'Wavy' },
    { value: 'curly-coily', label: 'Curly / Coily' },
    { value: 'fine', label: 'Fine (low density)' },
    { value: 'thick', label: 'Thick (high density)' },
];

const LIFESTYLES = [
    { value: 'corporate', label: 'Mostly corporate / office' },
    { value: 'mixed', label: 'Mix of office + casual' },
    { value: 'casual-wfh', label: 'Mostly casual / work from home' },
    { value: 'business-owner', label: 'Business owner / client-facing' },
    { value: 'social-events', label: 'Social / events-heavy' },
];

const STYLE_RESTRICTIONS = [
    { value: 'covered-arms', label: 'I prefer covered arms' },
    { value: 'covered-knees', label: 'I prefer covered knees' },
    { value: 'no-deep-necklines', label: 'I prefer no deep necklines' },
    { value: 'modest', label: 'I prefer modest / conservative styling' },
    { value: 'no-restrictions', label: 'No restrictions — show me everything' },
    { value: 'other', label: 'Other' },
];

const OUTFIT_MIX = [
    { value: 'all-work', label: 'All work / office outfits' },
    { value: 'mostly-work', label: 'Mostly work, some casual' },
    { value: 'equal', label: 'Equal work and casual' },
    { value: 'mostly-casual', label: 'Mostly casual' },
    { value: 'all-casual', label: 'All casual / weekend' },
];

// ── Step defs ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 12; // Opening + Q1-Q10 + Confirmation

// ── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
    const pct = ((step - 1) / (TOTAL_STEPS - 2)) * 100;
    return (
        <div className="w-full bg-luxury-cream rounded-full h-1.5 overflow-hidden">
            <div
                className="bg-luxury-accent h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(pct, 100)}%` }}
            />
        </div>
    );
}

function RadioCard({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
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
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'border-luxury-accent' : 'border-luxury-charcoal/20'
                    }`}>
                    {selected && <div className="w-2.5 h-2.5 bg-luxury-accent rounded-full" />}
                </div>
                {children}
            </div>
        </button>
    );
}

function CheckCard({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
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
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-luxury-accent bg-luxury-accent' : 'border-luxury-charcoal/20 bg-luxury-warm-white'
                    }`}>
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

function PhotoUploadField({
    label,
    instruction,
    file,
    onChange,
    required,
}: {
    label: string;
    instruction: string;
    file: File | null;
    onChange: (file: File | null) => void;
    required?: boolean;
}) {
    return (
        <label className="block cursor-pointer group">
            <div className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-200 ${file ? 'border-luxury-accent bg-luxury-pink-bg' : 'border-luxury-cream bg-luxury-warm-white group-hover:border-luxury-accent/50 group-hover:bg-luxury-cream/20'
                }`}>
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
                <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.heic,.heif"
                    className="hidden"
                    onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                    required={required}
                />
            </div>
        </label>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

function AUIntakePageInner() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(0); // 0 = opening, 1-10 = questions, 11 = confirmation
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
    const [contactPrefilled, setContactPrefilled] = useState(false);

    const [form, setForm] = useState<FormState>({
        email: '',
        phone: '',
        photoFullBody: null,
        photoHeadshot: null,
        skinUndertone: '',
        bodyShape: '',
        faceShape: '',
        hairType: [],
        lifestyle: '',
        styleRestrictions: [],
        outfitMix: '',
        extraNotes: '',
    });

    // Pre-fill email/phone from URL params (set by checkout redirect) or localStorage
    useEffect(() => {
        const urlEmail = searchParams.get('email') || '';
        const urlPhone = searchParams.get('phone') || '';
        const lsEmail = typeof window !== 'undefined' ? localStorage.getItem('au_customerEmail') || '' : '';
        const lsPhone = typeof window !== 'undefined' ? localStorage.getItem('au_customerPhone') || '' : '';

        const resolvedEmail = urlEmail || lsEmail;
        const resolvedPhone = urlPhone || lsPhone;

        if (resolvedEmail || resolvedPhone) {
            setForm(prev => ({ ...prev, email: resolvedEmail, phone: resolvedPhone }));
            if (resolvedEmail && resolvedPhone) {
                setContactPrefilled(true); // Both known — we'll skip step 1
            }
        }
    }, [searchParams]);

    const goNext = useCallback(() => {
        setDirection(1);
        // Skip step 1 (email/phone) if already pre-filled from checkout
        setStep((s) => {
            if (s === 0 && contactPrefilled) return 2;
            return s + 1;
        });
    }, [contactPrefilled]);

    const goBack = useCallback(() => {
        setDirection(-1);
        setStep((s) => {
            if (s === 2 && contactPrefilled) return 0; // skip back over step 1
            return Math.max(0, s - 1);
        });
    }, [contactPrefilled]);

    const toggleHairType = (value: string) => {
        setForm((prev) => {
            const current = prev.hairType;
            if (current.includes(value)) {
                return { ...prev, hairType: current.filter((v) => v !== value) };
            }
            if (current.length >= 2) return prev; // max 2
            return { ...prev, hairType: [...current, value] };
        });
    };

    const toggleRestriction = (value: string) => {
        setForm((prev) => {
            const current = prev.styleRestrictions;
            if (current.includes(value)) {
                return { ...prev, styleRestrictions: current.filter((v) => v !== value) };
            }
            return { ...prev, styleRestrictions: [...current, value] };
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError('');

        try {
            let photoFullBodyUrl = '';
            let photoHeadshotUrl = '';

            // Upload photos if present (will fail gracefully if storage not set up)
            if (form.photoFullBody) {
                try {
                    const fn = `${Date.now()}_fullbody_${form.photoFullBody.name}`;
                    photoFullBodyUrl = await uploadAUIntakePhoto(form.photoFullBody, fn);
                } catch (err) {
                    console.warn('Full body photo upload failed (storage may not be configured):', err);
                }
            }

            if (form.photoHeadshot) {
                try {
                    const fn = `${Date.now()}_headshot_${form.photoHeadshot.name}`;
                    photoHeadshotUrl = await uploadAUIntakePhoto(form.photoHeadshot, fn);
                } catch (err) {
                    console.warn('Headshot upload failed (storage may not be configured):', err);
                }
            }

            await saveAUIntakeSubmission({
                customer_email: form.email,
                customer_phone: form.phone,
                photo_fullbody_url: photoFullBodyUrl,
                photo_headshot_url: photoHeadshotUrl,
                skin_undertone: form.skinUndertone,
                body_shape: form.bodyShape,
                face_shape: form.faceShape,
                hair_type: form.hairType.join(','),
                lifestyle: form.lifestyle,
                style_restrictions: form.styleRestrictions.join(','),
                outfit_mix: form.outfitMix,
                extra_notes: form.extraNotes,
            });

            // Move to confirmation (step 11)
            setDirection(1);
            setStep(11);
        } catch (err) {
            console.error('Intake submit error:', err);
            setSubmitError('Something went wrong. Please try again or email hello@iconik.pro');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Step validity ────────────────────────────────────────────────────────

    const stepValid = useCallback((): boolean => {
        switch (step) {
            case 0: return true; // opening
            case 1: return form.email.includes('@') && form.phone.length >= 8;
            case 2: return !!form.photoFullBody;
            case 3: return !!form.photoHeadshot;
            case 4: return !!form.skinUndertone;
            case 5: return !!form.bodyShape;
            case 6: return !!form.faceShape;
            case 7: return form.hairType.length >= 1;
            case 8: return !!form.lifestyle;
            case 9: return true; // optional
            case 10: return !!form.outfitMix;
            default: return true;
        }
    }, [step, form]);

    // ── Slide variant ───────────────────────────────────────────────────────

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal overflow-x-hidden flex flex-col">

            {/* Header */}
            <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream py-4 px-6 sticky top-0 z-20">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
                        {step > 0 && step < 11 && (
                            <span className="text-xs luxury-body text-luxury-charcoal/50 font-semibold tracking-widest uppercase">Step {step} of 10</span>
                        )}
                    </div>
                    {step > 0 && step < 11 && <ProgressBar step={step} />}
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

                            {/* ── Step 0: Opening ──────────────────────────────────── */}
                            {step === 0 && (
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                                        <div className="absolute inset-0 bg-luxury-accent rounded-full opacity-20 animate-ping"></div>
                                        <CheckCircle className="w-10 h-10 text-luxury-accent relative z-10" />
                                    </div>
                                    <h1 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-6 leading-tight">
                                        Let&apos;s build your Blueprint.
                                    </h1>
                                    <p className="luxury-body text-luxury-charcoal/70 text-lg leading-relaxed mb-6 max-w-lg mx-auto">
                                        We need two photos so our stylists can personalise your profile. This takes exactly <strong className="text-luxury-charcoal font-semibold">4 minutes</strong>.
                                    </p>
                                    {contactPrefilled && form.email && (
                                        <div className="bg-luxury-cream/50 border border-luxury-cream rounded-xl px-5 py-3 mb-8 inline-block">
                                            <p className="luxury-body text-luxury-charcoal/70 text-sm">
                                                Continuing as <strong className="text-luxury-charcoal">{form.email}</strong>
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        onClick={goNext}
                                        className="inline-flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-4 text-base font-semibold luxury-body rounded-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        Begin Intake Form
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* ── Step 1: Email + Phone ────────────────────────────── */}
                            {step === 1 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Your contact details</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">So we can send your Blueprint to you.</p>
                                    {contactPrefilled ? (
                                        <div className="space-y-4">
                                            <div className="bg-luxury-cream/40 border border-luxury-cream rounded-xl px-5 py-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold luxury-body text-luxury-charcoal/50 uppercase tracking-wider mb-1">Email</p>
                                                    <p className="luxury-body text-luxury-charcoal font-medium">{form.email}</p>
                                                </div>
                                                <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0" />
                                            </div>
                                            <div className="bg-luxury-cream/40 border border-luxury-cream rounded-xl px-5 py-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold luxury-body text-luxury-charcoal/50 uppercase tracking-wider mb-1">Phone</p>
                                                    <p className="luxury-body text-luxury-charcoal font-medium">{form.phone}</p>
                                                </div>
                                                <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0" />
                                            </div>
                                            <p className="text-xs text-center luxury-body text-luxury-charcoal/40 mt-3">These were saved from your purchase. <button onClick={() => setContactPrefilled(false)} className="underline hover:text-luxury-accent transition-colors">Edit</button></p>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-2">Email Address *</label>
                                                <input
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                                    className="w-full px-4 py-4 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body"
                                                    placeholder="your@email.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-2">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    value={form.phone}
                                                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/[^\d\s+()-]/g, '') }))}
                                                    className="w-full px-4 py-4 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body"
                                                    placeholder="04XX XXX XXX"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 2: Full Body Photo ──────────────────────────── */}
                            {step === 2 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Upload a full-length photo.</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">
                                        Stand facing the camera. Natural light. Wear form-fitting clothes so we can see your proportions — leggings and a fitted top work well. No shapewear. Hair up or down — either is fine.
                                    </p>
                                    <PhotoUploadField
                                        label="Full body photo"
                                        instruction="Stand facing camera · Natural light · Form-fitting clothes · No shapewear"
                                        file={form.photoFullBody}
                                        onChange={(f) => setForm((p) => ({ ...p, photoFullBody: f }))}
                                        required
                                    />
                                    {!form.photoFullBody && (
                                        <p className="text-xs text-luxury-accent mt-3 text-center luxury-body">A full-length photo is required to complete your Blueprint analysis.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 3: Headshot ─────────────────────────────────── */}
                            {step === 3 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Upload a clear headshot.</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">
                                        Face the camera directly. Natural or indoor light. No sunglasses. Hair can be up or down. A simple selfie is fine — no need for a professional photo.
                                    </p>
                                    <PhotoUploadField
                                        label="Headshot / selfie"
                                        instruction="Face the camera · No sunglasses · Natural or indoor light · Selfie is fine"
                                        file={form.photoHeadshot}
                                        onChange={(f) => setForm((p) => ({ ...p, photoHeadshot: f }))}
                                        required
                                    />
                                </div>
                            )}

                            {/* ── Step 4: Skin Undertone ───────────────────────────── */}
                            {step === 4 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What is your skin undertone?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select the closest match. Our analysis will confirm and refine.</p>
                                    <div className="space-y-3">
                                        {SKIN_UNDERTONES.map((o) => (
                                            <RadioCard key={o.value} selected={form.skinUndertone === o.value} onClick={() => setForm((p) => ({ ...p, skinUndertone: o.value }))}>
                                                <div>
                                                    <div className="font-semibold text-luxury-charcoal luxury-body">{o.label}</div>
                                                    {o.sub && <div className="text-sm text-luxury-charcoal/60 luxury-body mt-0.5">{o.sub}</div>}
                                                </div>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 5: Body Shape ───────────────────────────────── */}
                            {step === 5 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">How would you describe your body proportions?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select the closest — our stylists will accurately map this from your photos.</p>
                                    <div className="space-y-3">
                                        {BODY_SHAPES.map((o) => (
                                            <RadioCard key={o.value} selected={form.bodyShape === o.value} onClick={() => setForm((p) => ({ ...p, bodyShape: o.value }))}>
                                                <div>
                                                    <div className="font-semibold text-luxury-charcoal luxury-body">{o.label}</div>
                                                    {o.desc && <div className="text-sm text-luxury-charcoal/60 luxury-body mt-0.5">{o.desc}</div>}
                                                </div>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 6: Face Shape ───────────────────────────────── */}
                            {step === 6 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What is your face shape?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select the closest — our stylists will chart your exact facial architecture.</p>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        {FACE_SHAPES.map((o) => (
                                            <RadioCard key={o.value} selected={form.faceShape === o.value} onClick={() => setForm((p) => ({ ...p, faceShape: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 7: Hair Type ────────────────────────────────── */}
                            {step === 7 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What is your hair type?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select up to 2 that apply (e.g. Wavy + Fine).</p>
                                    <div className="space-y-3">
                                        {HAIR_TYPES.map((o) => (
                                            <CheckCard key={o.value} selected={form.hairType.includes(o.value)} onClick={() => toggleHairType(o.value)}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                    {form.hairType.length === 2 && (
                                        <p className="text-xs text-luxury-accent mt-4 luxury-body font-medium">Maximum 2 selections reached.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 8: Lifestyle ────────────────────────────────── */}
                            {step === 8 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Which best describes your typical week?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">This shapes the context of your outfit formulas so they actually match your life.</p>
                                    <div className="space-y-3">
                                        {LIFESTYLES.map((o) => (
                                            <RadioCard key={o.value} selected={form.lifestyle === o.value} onClick={() => setForm((p) => ({ ...p, lifestyle: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 9: Style Restrictions (optional) ────────────── */}
                            {step === 9 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Do you have any style preferences or restrictions?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-1">Select all that apply. <span className="font-medium text-luxury-accent">Optional — but powerful for personalisation.</span></p>
                                    <p className="text-luxury-charcoal/40 text-xs mb-8 uppercase tracking-widest font-semibold mt-2">Skip if none apply</p>
                                    <div className="space-y-3">
                                        {STYLE_RESTRICTIONS.map((o) => (
                                            <CheckCard key={o.value} selected={form.styleRestrictions.includes(o.value)} onClick={() => toggleRestriction(o.value)}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 10: Outfit Mix ──────────────────────────────── */}
                            {step === 10 && (
                                <div>
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">How would you like your outfit formulas split?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">This determines the exact balance of work vs. casual outfits in your Blueprint.</p>
                                    <div className="space-y-3">
                                        {OUTFIT_MIX.map((o) => (
                                            <RadioCard key={o.value} selected={form.outfitMix === o.value} onClick={() => setForm((p) => ({ ...p, outfitMix: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>

                                    {/* Q10 extra notes — folded into this step */}
                                    <div className="mt-8 border-t border-luxury-cream pt-8">
                                        <label className="block text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-3">
                                            Anything specific you want your Blueprint to address?{' '}
                                            <span className="font-normal text-luxury-accent ml-2">Optional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.extraNotes}
                                            onChange={(e) => {
                                                if (e.target.value.length <= 200) setForm((p) => ({ ...p, extraNotes: e.target.value }));
                                            }}
                                            className="w-full px-4 py-4 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body"
                                            placeholder="e.g. 'I've always struggled to dress my arms'"
                                            maxLength={200}
                                        />
                                        <p className="text-xs text-luxury-charcoal/40 mt-2 text-right">{form.extraNotes.length}/200</p>
                                    </div>

                                    {/* Submit error */}
                                    {submitError && (
                                        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm luxury-body">
                                            {submitError}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 11: Confirmation ────────────────────────────── */}
                            {step === 11 && (
                                <div className="text-center py-10">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                        className="w-24 h-24 bg-luxury-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                                    >
                                        <div className="absolute inset-0 bg-luxury-accent rounded-full opacity-20 animate-ping"></div>
                                        <CheckCircle className="w-12 h-12 text-luxury-accent relative z-10" />
                                    </motion.div>
                                    <h2 className="text-4xl md:text-5xl luxury-heading text-luxury-charcoal mb-6">
                                        Your intake is complete.
                                    </h2>
                                    <p className="luxury-body text-luxury-charcoal/70 text-lg md:text-xl leading-relaxed max-w-lg mx-auto mb-6">
                                        Your ICONIK Blueprint is now being prepared by our expert stylists and will arrive in your inbox within <strong className="font-semibold text-luxury-charcoal">24 hours</strong>.
                                    </p>
                                    <p className="luxury-body text-sm text-luxury-charcoal/50">Check your spam folder just in case.</p>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* ── Navigation Buttons ─────────────────────────────────── */}
                    {step < 11 && (
                        <div className="flex items-center justify-between mt-8 relative z-10">
                            {step > 0 ? (
                                <button
                                    onClick={goBack}
                                    className="flex items-center gap-2 text-luxury-charcoal/50 hover:text-luxury-accent text-sm font-semibold uppercase tracking-wider transition-colors luxury-body p-2 -ml-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                            ) : (
                                <div />
                            )}

                            {step < 10 && (
                                <button
                                    onClick={goNext}
                                    disabled={!stepValid()}
                                    className="flex items-center gap-2 bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white px-8 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 transform luxury-body"
                                >
                                    {step === 0 ? 'Begin' : 'Continue'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}

                            {step === 10 && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!stepValid() || submitting || !form.outfitMix}
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

export default function AUIntakePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-luxury-warm-white flex items-center justify-center"><div className="luxury-body text-luxury-charcoal/50">Loading...</div></div>}>
            <AUIntakePageInner />
        </Suspense>
    );
}
