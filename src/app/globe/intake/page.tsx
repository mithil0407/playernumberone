'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { saveGlobeIntakeSubmission, uploadGlobeIntakePhoto } from '@/lib/supabaseGlobe';
import { trackPageView, trackCompleteRegistration, updateUserData } from '@/lib/metaPixel';

// ── Types ────────────────────────────────────────────────────────────────────

interface FormState {
    email: string;
    phone: string;
    photoFullBody: File | null;
    photoHeadshot: File | null;
    // Section 1 — Basics
    primaryGoal: string;
    styleRelationship: string;
    dressingContext: string[];
    locationTier: string;
    // Section 2 — Body
    heightCategory: string;
    bodyShape: string;
    fatStorageZone: string;
    highlightZone: string;
    minimiseZone: string;
    fitPreference: string;
    modestyLevel: string;
    wardrobeComposition: string[];
    // Section 3 — Colour
    skinTone: string;
    veinUndertone: string;
    whiteTest: string;
    hairColour: string;
    eyeColour: string;
    // Section 4 — Face
    faceShape: string;
    facialFeatureType: string;
    // Section 5 — Style
    primaryStyleGoal: string;
    branchSubGoal: string;
    branchBlocker: string;
    branchReference: string;
    stylePoleStructure: string;
    stylePoleExpression: string;
    stylePoleTone: string;
    stylePoleRegister: string;
    styleBlocker: string;
    styleAntiPref: string;
    styleAntiPrefNote: string;
    freeTextNote: string;
}

// ── Colour Season Derivation ──────────────────────────────────────────────────

function deriveColourSeason(
    skinTone: string,
    undertone: string,
    whiteTest: string,
    hairColour: string,
    eyeColour: string
): string | null {
    if (!skinTone || !undertone) return null;

    let resolved = undertone;
    if (undertone === 'unclear') {
        if (whiteTest === 'bright_white') resolved = 'cool';
        else if (whiteTest === 'cream') resolved = 'warm';
        else resolved = 'neutral';
    }

    const deepSkin = ['dusky', 'deep'].includes(skinTone);
    const lightSkin = ['porcelain', 'fair'].includes(skinTone);
    const darkHair = ['jet_black', 'dark_brown'].includes(hairColour);
    const lightEyes = ['light_golden', 'light_cool'].includes(eyeColour);

    const isDeep = deepSkin || (darkHair && !lightSkin);
    const isLight = lightSkin && (lightEyes || ['medium_brown', 'grey', 'light_highlighted'].includes(hairColour));

    if (resolved === 'warm') {
        if (isDeep) return 'warm_autumn';
        if (isLight) return 'warm_spring';
        return 'warm_autumn';
    }
    if (resolved === 'cool') {
        if (isDeep) return 'deep_cool';
        if (isLight) return 'cool_summer';
        return 'cool_winter';
    }
    if (resolved === 'neutral') {
        if (isDeep) return 'deep_warm';
        return 'neutral_soft';
    }
    return null;
}

// ── Options ──────────────────────────────────────────────────────────────────

const PRIMARY_GOALS = [
    { value: 'body_shape', label: 'I want to finally understand what suits my body shape' },
    { value: 'signature_style', label: 'I want a signature style I can own with confidence' },
    { value: 'professional', label: 'I want to look more put-together for work/professional settings' },
    { value: 'body_change', label: "I've been through a body change and need a style reset" },
    { value: 'modest', label: 'I want to dress modestly without looking frumpy' },
];

const STYLE_RELATIONSHIPS = [
    { value: 'safe_rotation', label: 'I wear the same 5 things on rotation because I know they work' },
    { value: 'buy_nothing_fits', label: 'I buy a lot but feel like nothing ever looks right' },
    { value: 'avoidance', label: 'I avoid certain clothes entirely because of how they make me feel' },
    { value: 'comfort_first', label: 'I dress for comfort, style feels secondary' },
    { value: 'starting_fresh', label: "I'm starting fresh — I genuinely don't know my style yet" },
];

const DRESSING_CONTEXTS = [
    { value: 'office', label: 'Office / Corporate' },
    { value: 'business_casual', label: 'Business Casual / Startup' },
    { value: 'wfh', label: 'Work From Home but still need to look good on calls' },
    { value: 'social', label: 'Social events / Family functions' },
    { value: 'casual', label: 'Everyday casual' },
    { value: 'occasions', label: 'Special occasions / Weddings' },
];

const LOCATION_TIERS = [
    { value: 'india_t1', label: 'India (Tier 1 city)' },
    { value: 'india_t2', label: 'India (Tier 2/3 city)' },
    { value: 'uk', label: 'UK / Europe' },
    { value: 'uae', label: 'UAE / Middle East' },
    { value: 'canada_usa', label: 'Canada / USA' },
    { value: 'other', label: 'Other' },
];

const HEIGHT_CATEGORIES = [
    { value: 'petite', label: "Under 5'2\" (Petite)" },
    { value: 'average', label: "5'2\" – 5'5\" (Average)" },
    { value: 'tall_average', label: "5'5\" – 5'8\" (Tall-average)" },
    { value: 'tall', label: "Above 5'8\" (Tall)" },
];

const BODY_SHAPES = [
    { value: 'hourglass', label: 'Hourglass', sub: 'Shoulders and hips roughly equal, defined waist' },
    { value: 'pear', label: 'Pear / Triangle', sub: 'Hips wider than shoulders' },
    { value: 'apple', label: 'Apple / Inverted Triangle', sub: 'Shoulders/bust wider, slimmer hips' },
    { value: 'rectangle', label: 'Rectangle', sub: 'Shoulders, waist, and hips roughly the same width' },
    { value: 'oval', label: 'Oval', sub: 'Fullness concentrated in the midsection' },
];

const FAT_STORAGE_ZONES = [
    { value: 'midsection', label: 'Mostly around my belly / midsection' },
    { value: 'upper_back', label: 'Across my back and upper body' },
    { value: 'arms', label: 'My arms are the area I want to minimise' },
    { value: 'distributed', label: "Fairly distributed — it's just a fuller figure overall" },
];

const HIGHLIGHT_ZONES = [
    { value: 'waist', label: 'Waist' },
    { value: 'legs', label: 'Legs' },
    { value: 'shoulders', label: 'Shoulders / Décolletage' },
    { value: 'none', label: "I don't have a specific highlight area" },
];

const MINIMISE_ZONES = [
    { value: 'tummy', label: 'Tummy / Midsection' },
    { value: 'arms', label: 'Arms / Upper arms' },
    { value: 'hips_thighs', label: 'Hips / Thighs' },
    { value: 'back', label: 'Back' },
    { value: 'none', label: 'Nothing specific — I just want balance' },
];

const FIT_PREFERENCES = [
    { value: 'fitted', label: 'I love it — I want to show my shape' },
    { value: 'structured_relaxed', label: 'I like some structure but nothing too tight' },
    { value: 'flowy', label: 'I prefer relaxed / flowy — comfort over fit' },
    { value: 'open_to_fitted', label: 'I would wear fitted if I knew it would actually look good on me' },
];

const MODESTY_LEVELS = [
    { value: 'full_coverage', label: 'Very — I prefer full coverage, no sleeveless, no deep necklines' },
    { value: 'moderate', label: "Somewhat — I'm open to sleeveless but keep necklines conservative" },
    { value: 'minimal', label: "Minimal — I dress for what looks good, modesty isn't a major filter" },
    { value: 'situational', label: 'Situational — depends on the occasion' },
];

const WARDROBE_COMPOSITIONS = [
    { value: 'ethnic', label: 'Saris / Salwar Kameez / Indian ethnic wear' },
    { value: 'indo_western', label: 'Kurtis and casual Indian-Western mix' },
    { value: 'western_casual', label: 'Western casuals (jeans, tees, dresses)' },
    { value: 'formal_western', label: 'Formal / Office western wear' },
    { value: 'scratch', label: "I barely have a wardrobe — starting from scratch" },
    { value: 'mixed', label: 'A chaotic mix of everything' },
];

const SKIN_TONES = [
    { value: 'porcelain', label: 'Very fair / Porcelain' },
    { value: 'fair', label: 'Fair with pinkish or neutral undertone' },
    { value: 'wheatish', label: 'Medium / Wheatish — warm golden' },
    { value: 'dusky', label: 'Medium-deep / Dusky' },
    { value: 'deep', label: 'Deep / Rich brown' },
];

const VEIN_UNDERTONES = [
    { value: 'cool', label: 'Clearly blue / purple — cool undertone' },
    { value: 'warm', label: 'Clearly green — warm undertone' },
    { value: 'neutral', label: 'A mix of both — neutral undertone' },
    { value: 'unclear', label: "I genuinely can't tell" },
];

const WHITE_TESTS = [
    { value: 'bright_white', label: 'Bright, crisp white' },
    { value: 'cream', label: 'Cream / Off-white' },
    { value: 'both', label: "Both look fine / I can't tell" },
    { value: 'avoids', label: 'I avoid white entirely' },
];

const HAIR_COLOURS = [
    { value: 'jet_black', label: 'Jet black' },
    { value: 'dark_brown', label: 'Dark brown / Dark with warm highlights' },
    { value: 'medium_brown', label: 'Medium brown' },
    { value: 'grey', label: 'Grey / Salt and pepper' },
    { value: 'light_highlighted', label: 'Light brown / Highlighted / Coloured (lighter)' },
];

const EYE_COLOURS = [
    { value: 'very_dark', label: 'Very dark brown / Almost black' },
    { value: 'medium_warm', label: 'Medium brown / Warm hazel' },
    { value: 'light_golden', label: 'Light brown with golden flecks' },
    { value: 'light_cool', label: 'Green / Grey / Light hazel' },
];

const FACE_SHAPES = [
    { value: 'oval', label: 'Oval', image: '/Oval.webp' },
    { value: 'round', label: 'Round', image: '/Round.webp' },
    { value: 'square', label: 'Square', image: '/Square.webp' },
    { value: 'heart', label: 'Heart / Inverted Triangle', image: '/Heart.webp' },
    { value: 'oblong', label: 'Oblong / Rectangle', image: '/Oblong.webp' },
    { value: 'diamond', label: 'Diamond', image: '/Diamond.webp' },
];

const FACIAL_FEATURE_TYPES = [
    { value: 'angular', label: 'Sharp / angular — strong bone structure' },
    { value: 'soft', label: 'Soft / round — softer, rounder features' },
    { value: 'mixed', label: 'A mix — somewhere in between' },
];

// Section 5 — Style constants
const PRIMARY_STYLE_GOALS = [
    { value: 'polished', label: 'I want to look more polished and put-together' },
    { value: 'authentic', label: 'I want to look more like myself' },
    { value: 'confident', label: 'I want to feel more confident in what I wear' },
    { value: 'variety', label: 'I want more variety and versatility' },
    { value: 'occasion', label: 'I have a specific occasion or life change to dress for' },
];

// Branch A — Polished
const BRANCH_A_SUBGOAL = [
    { value: 'fit_perfectly', label: 'Clothes that fit perfectly' },
    { value: 'intentional', label: 'Looking intentional, not accidental' },
    { value: 'appropriate', label: 'Being appropriate for every context' },
    { value: 'signature', label: 'Looking like I have a signature look' },
];
const BRANCH_A_BLOCKER = [
    { value: 'fit_off_rack', label: "Clothes don't fit well off the rack" },
    { value: 'occasion_clueless', label: "I don't know what occasion calls for what" },
    { value: 'dont_work_together', label: "I buy things that don't work together" },
    { value: 'never_elevated', label: 'I look fine but never elevated' },
];
const BRANCH_A_REFERENCE = [
    { value: 'deepika', label: 'Deepika Padukone — clean, minimal power' },
    { value: 'priyanka', label: 'Priyanka Chopra — sharp corporate edge' },
    { value: 'sonam', label: 'Sonam Kapoor — structured and intentional' },
    { value: 'none', label: 'None of these — I can describe it' },
];

const STYLE_POLE_STRUCTURE = [
    { value: 'structured', label: 'Structured and tailored' },
    { value: 'fluid', label: 'Fluid and draped' },
];
const STYLE_POLE_EXPRESSION = [
    { value: 'minimal', label: 'Minimal and quiet' },
    { value: 'expressive', label: 'Expressive and layered' },
];
const STYLE_POLE_TONE = [
    { value: 'classic', label: 'Classic and timeless' },
    { value: 'current', label: 'Current and fashion-forward' },
];
const STYLE_POLE_REGISTER = [
    { value: 'dressed_up', label: 'Dressed up is my comfort zone' },
    { value: 'dressed_down', label: 'Dressed down is my comfort zone' },
];

const STYLE_BLOCKERS = [
    { value: 'nothing_fits', label: 'Nothing fits the way I want it to' },
    { value: 'dont_know_body', label: "I don't know what works on my body" },
    { value: 'buy_never_wear', label: 'I buy things I never wear' },
    { value: 'dont_know_style', label: "I don't know what my style actually is" },
    { value: 'dress_for_others', label: 'I dress for others, not myself' },
    { value: 'dont_know_where', label: "I don't know where to shop for my needs" },
    { value: 'lifestyle', label: "My lifestyle doesn't allow the style I want" },
];

const ANTI_PREFS = [
    { value: 'yes_colour', label: 'Yes — a colour' },
    { value: 'yes_silhouette', label: 'Yes — a silhouette or cut' },
    { value: 'yes_category', label: 'Yes — a style category (e.g. ethnic, formal)' },
    { value: 'no_wear_told', label: "No — I wear what I'm told looks good" },
    { value: 'never_thought', label: "I've never thought about this" },
];

// Step 0 = welcome, Steps 1–29 = content, Step 30 = confirmation
const CONFIRMATION_STEP = 30;
const QUESTION_COUNT = 29;

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

function SectionLabel({ label }: { label: string }) {
    return (
        <p className="text-luxury-charcoal/40 text-xs mb-6 uppercase tracking-widest font-semibold">{label}</p>
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
        primaryGoal: '',
        styleRelationship: '',
        dressingContext: [],
        locationTier: '',
        heightCategory: '',
        bodyShape: '',
        fatStorageZone: '',
        highlightZone: '',
        minimiseZone: '',
        fitPreference: '',
        modestyLevel: '',
        wardrobeComposition: [],
        skinTone: '',
        veinUndertone: '',
        whiteTest: '',
        hairColour: '',
        eyeColour: '',
        faceShape: '',
        facialFeatureType: '',
        primaryStyleGoal: '',
        branchSubGoal: '',
        branchBlocker: '',
        branchReference: '',
        stylePoleStructure: '',
        stylePoleExpression: '',
        stylePoleTone: '',
        stylePoleRegister: '',
        styleBlocker: '',
        styleAntiPref: '',
        styleAntiPrefNote: '',
        freeTextNote: '',
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

    useEffect(() => {
        if (step >= 2 && form.email && form.phone) {
            updateUserData(form.email, form.phone);
        }
    }, [step, form.email, form.phone]);

    const isBranchPolished = form.primaryStyleGoal === 'polished';

    const goNext = useCallback(() => {
        setDirection(1);
        setStep(s => {
            if (s === 0 && contactPrefilled) return 2;
            // Skip branch sub-questions (23–25) if not polished
            if (s === 22 && !isBranchPolished) return 26;
            return s + 1;
        });
    }, [contactPrefilled, isBranchPolished]);

    const goBack = useCallback(() => {
        setDirection(-1);
        setStep(s => {
            if (s === 2 && contactPrefilled) return 0;
            // Skip back over branch sub-questions if not polished
            if (s === 26 && !isBranchPolished) return 22;
            return Math.max(0, s - 1);
        });
    }, [contactPrefilled, isBranchPolished]);

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

            const derivedColourSeason = deriveColourSeason(
                form.skinTone,
                form.veinUndertone,
                form.whiteTest,
                form.hairColour,
                form.eyeColour,
            );

            await saveGlobeIntakeSubmission({
                customer_email: form.email,
                customer_phone: form.phone,
                photo_fullbody_url: photoFullBodyUrl,
                photo_headshot_url: photoHeadshotUrl,
                primary_goal: form.primaryGoal,
                style_relationship: form.styleRelationship,
                dressing_context: form.dressingContext.join(','),
                location_tier: form.locationTier,
                height_category: form.heightCategory,
                body_shape: form.bodyShape,
                fat_storage_zone: form.fatStorageZone,
                highlight_zone: form.highlightZone,
                minimise_zone: form.minimiseZone,
                fit_preference: form.fitPreference,
                modesty_level: form.modestyLevel,
                wardrobe_composition: form.wardrobeComposition.join(','),
                skin_tone: form.skinTone,
                vein_undertone: form.veinUndertone,
                white_test: form.whiteTest,
                hair_colour: form.hairColour,
                eye_colour: form.eyeColour,
                derived_colour_season: derivedColourSeason ?? undefined,
                face_shape: form.faceShape,
                facial_feature_type: form.facialFeatureType,
                primary_style_goal: form.primaryStyleGoal,
                branch_sub_goal: form.branchSubGoal || undefined,
                branch_blocker: form.branchBlocker || undefined,
                branch_reference: form.branchReference || undefined,
                style_pole_structure: form.stylePoleStructure,
                style_pole_expression: form.stylePoleExpression,
                style_pole_tone: form.stylePoleTone,
                style_pole_register: form.stylePoleRegister,
                style_blocker: form.styleBlocker,
                style_anti_pref: form.styleAntiPref,
                style_anti_pref_note: form.styleAntiPrefNote || undefined,
                free_text_note: form.freeTextNote || undefined,
            });

            fetch('/api/globe-intake-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_email: form.email,
                    customer_phone: form.phone,
                    photo_fullbody_url: photoFullBodyUrl,
                    photo_headshot_url: photoHeadshotUrl,
                    primary_goal: form.primaryGoal,
                    style_relationship: form.styleRelationship,
                    dressing_context: form.dressingContext.join(','),
                    location_tier: form.locationTier,
                    height_category: form.heightCategory,
                    body_shape: form.bodyShape,
                    fat_storage_zone: form.fatStorageZone,
                    highlight_zone: form.highlightZone,
                    minimise_zone: form.minimiseZone,
                    fit_preference: form.fitPreference,
                    modesty_level: form.modestyLevel,
                    wardrobe_composition: form.wardrobeComposition.join(','),
                    skin_tone: form.skinTone,
                    vein_undertone: form.veinUndertone,
                    white_test: form.whiteTest,
                    hair_colour: form.hairColour,
                    eye_colour: form.eyeColour,
                    derived_colour_season: derivedColourSeason,
                    face_shape: form.faceShape,
                    facial_feature_type: form.facialFeatureType,
                    primary_style_goal: form.primaryStyleGoal,
                    branch_sub_goal: form.branchSubGoal || undefined,
                    branch_blocker: form.branchBlocker || undefined,
                    branch_reference: form.branchReference || undefined,
                    style_pole_structure: form.stylePoleStructure,
                    style_pole_expression: form.stylePoleExpression,
                    style_pole_tone: form.stylePoleTone,
                    style_pole_register: form.stylePoleRegister,
                    style_blocker: form.styleBlocker,
                    style_anti_pref: form.styleAntiPref,
                    style_anti_pref_note: form.styleAntiPrefNote || undefined,
                    free_text_note: form.freeTextNote || undefined,
                }),
            }).catch(err => console.warn('Globe intake notify failed:', err));

            trackCompleteRegistration(97, 'ICONIK Blueprint Globe — Intake Submitted', 'USD');
            setDirection(1);
            setStep(CONFIRMATION_STEP);

        } catch (err) {
            console.error('Globe intake submit error:', err);
            setSubmitError('Something went wrong. Please try again or email help.iconikfashion@gmail.com');
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
            // Section 1
            case 4: return !!form.primaryGoal;
            case 5: return !!form.styleRelationship;
            case 6: return form.dressingContext.length >= 1;
            case 7: return !!form.locationTier;
            // Section 2
            case 8: return !!form.heightCategory;
            case 9: return !!form.bodyShape;
            case 10: return !!form.fatStorageZone;
            case 11: return !!form.highlightZone && !!form.minimiseZone;
            case 12: return !!form.fitPreference;
            case 13: return !!form.modestyLevel;
            case 14: return form.wardrobeComposition.length >= 1;
            // Section 3
            case 15: return !!form.skinTone;
            case 16: return !!form.veinUndertone;
            case 17: return !!form.whiteTest;
            case 18: return !!form.hairColour;
            case 19: return !!form.eyeColour;
            // Section 4
            case 20: return !!form.faceShape;
            case 21: return !!form.facialFeatureType;
            // Section 5
            case 22: return !!form.primaryStyleGoal;
            case 23: return !!form.branchSubGoal;
            case 24: return !!form.branchBlocker;
            case 25: return !!form.branchReference;
            case 26: return !!form.stylePoleStructure && !!form.stylePoleExpression && !!form.stylePoleTone && !!form.stylePoleRegister;
            case 27: return !!form.styleBlocker;
            case 28: return !!form.styleAntiPref;
            case 29: return true; // optional free text
            default: return true;
        }
    }, [step, form]);

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    };

    const isLastQuestion = step === 29;

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
                                        We need two photos and a few key details so our stylists can personalise your report. Takes exactly <strong className="text-luxury-charcoal font-semibold">7 minutes</strong>.
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

                            {/* ── Step 4: Q1 Primary Goal ──────────────────────── */}
                            {step === 4 && (
                                <div>
                                    <SectionLabel label="Section 1 of 5 — The Basics" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What&apos;s your primary goal with ICONIK today?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {PRIMARY_GOALS.map(o => (
                                            <RadioCard key={o.value} selected={form.primaryGoal === o.value} onClick={() => setForm(p => ({ ...p, primaryGoal: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 5: Q2 Style Relationship ────────────────── */}
                            {step === 5 && (
                                <div>
                                    <SectionLabel label="Section 1 of 5 — The Basics" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">How would you describe your current relationship with getting dressed?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {STYLE_RELATIONSHIPS.map(o => (
                                            <RadioCard key={o.value} selected={form.styleRelationship === o.value} onClick={() => setForm(p => ({ ...p, styleRelationship: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 6: Q3 Dressing Context ──────────────────── */}
                            {step === 6 && (
                                <div>
                                    <SectionLabel label="Section 1 of 5 — The Basics" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What&apos;s your primary dressing context?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-1">Select up to 2.</p>
                                    <p className="text-luxury-charcoal/40 text-xs mb-8 uppercase tracking-widest font-semibold mt-2">Choose the situations you dress for most</p>
                                    <div className="space-y-3">
                                        {DRESSING_CONTEXTS.map(o => (
                                            <CheckCard key={o.value} selected={form.dressingContext.includes(o.value)} onClick={() => toggleMulti('dressingContext', o.value, 2)}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                    {form.dressingContext.length === 2 && (
                                        <p className="text-xs text-luxury-accent mt-4 luxury-body font-medium">Maximum 2 selections reached.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 7: Q4 Location ──────────────────────────── */}
                            {step === 7 && (
                                <div>
                                    <SectionLabel label="Section 1 of 5 — The Basics" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Where are you based?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {LOCATION_TIERS.map(o => (
                                            <RadioCard key={o.value} selected={form.locationTier === o.value} onClick={() => setForm(p => ({ ...p, locationTier: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 8: Q5 Height ────────────────────────────── */}
                            {step === 8 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">How tall are you?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {HEIGHT_CATEGORIES.map(o => (
                                            <RadioCard key={o.value} selected={form.heightCategory === o.value} onClick={() => setForm(p => ({ ...p, heightCategory: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 9: Q6 Body Shape ────────────────────────── */}
                            {step === 9 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Which of these silhouettes is closest to yours?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {BODY_SHAPES.map(o => (
                                            <RadioCard key={o.value} selected={form.bodyShape === o.value} onClick={() => setForm(p => ({ ...p, bodyShape: o.value }))}>
                                                <div>
                                                    <div className="font-semibold text-luxury-charcoal luxury-body">{o.label}</div>
                                                    <div className="text-sm text-luxury-charcoal/60 luxury-body mt-0.5">{o.sub}</div>
                                                </div>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 10: Q7 Fat Storage Zone ─────────────────── */}
                            {step === 10 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Where does your body carry most of its weight?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {FAT_STORAGE_ZONES.map(o => (
                                            <RadioCard key={o.value} selected={form.fatStorageZone === o.value} onClick={() => setForm(p => ({ ...p, fatStorageZone: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 11: Q8 Highlight + Minimise ─────────────── */}
                            {step === 11 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">When you look in the mirror, which area do you most want to highlight or minimise?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one for each.</p>
                                    <p className="text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-3 uppercase tracking-wider">Highlight</p>
                                    <div className="space-y-3 mb-8">
                                        {HIGHLIGHT_ZONES.map(o => (
                                            <RadioCard key={o.value} selected={form.highlightZone === o.value} onClick={() => setForm(p => ({ ...p, highlightZone: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                    <div className="border-t border-luxury-cream mb-8" />
                                    <p className="text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-3 uppercase tracking-wider">Minimise</p>
                                    <div className="space-y-3">
                                        {MINIMISE_ZONES.map(o => (
                                            <RadioCard key={o.value} selected={form.minimiseZone === o.value} onClick={() => setForm(p => ({ ...p, minimiseZone: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 12: Q9 Fit Preference ───────────────────── */}
                            {step === 12 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">How do you feel about fitted clothing?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {FIT_PREFERENCES.map(o => (
                                            <RadioCard key={o.value} selected={form.fitPreference === o.value} onClick={() => setForm(p => ({ ...p, fitPreference: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 13: Q10 Modesty ─────────────────────────── */}
                            {step === 13 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">How important is modesty to you in your everyday dressing?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {MODESTY_LEVELS.map(o => (
                                            <RadioCard key={o.value} selected={form.modestyLevel === o.value} onClick={() => setForm(p => ({ ...p, modestyLevel: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 14: Q11 Wardrobe Composition ───────────── */}
                            {step === 14 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What&apos;s your current wardrobe mostly made up of?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-1">Select up to 3.</p>
                                    <p className="text-luxury-charcoal/40 text-xs mb-8 uppercase tracking-widest font-semibold mt-2">Choose all that apply</p>
                                    <div className="space-y-3">
                                        {WARDROBE_COMPOSITIONS.map(o => (
                                            <CheckCard key={o.value} selected={form.wardrobeComposition.includes(o.value)} onClick={() => toggleMulti('wardrobeComposition', o.value, 3)}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                    {form.wardrobeComposition.length === 3 && (
                                        <p className="text-xs text-luxury-accent mt-4 luxury-body font-medium">Maximum 3 selections reached.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 15: Q12 Skin Tone ───────────────────────── */}
                            {step === 15 && (
                                <div>
                                    <SectionLabel label="Section 3 of 5 — Your Face & Colouring" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What is your skin tone?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {SKIN_TONES.map(o => (
                                            <RadioCard key={o.value} selected={form.skinTone === o.value} onClick={() => setForm(p => ({ ...p, skinTone: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 16: Q13 Vein Undertone ──────────────────── */}
                            {step === 16 && (
                                <div>
                                    <SectionLabel label="Section 3 of 5 — Your Face & Colouring" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What are the veins on your inner wrist closest to?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Hold your wrist under natural light and select one.</p>
                                    <div className="space-y-3">
                                        {VEIN_UNDERTONES.map(o => (
                                            <RadioCard key={o.value} selected={form.veinUndertone === o.value} onClick={() => setForm(p => ({ ...p, veinUndertone: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 17: Q14 White Test ──────────────────────── */}
                            {step === 17 && (
                                <div>
                                    <SectionLabel label="Section 3 of 5 — Your Face & Colouring" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">When you wear white, which white feels most &ldquo;alive&rdquo; on your face?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {WHITE_TESTS.map(o => (
                                            <RadioCard key={o.value} selected={form.whiteTest === o.value} onClick={() => setForm(p => ({ ...p, whiteTest: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 18: Q15 Hair Colour ─────────────────────── */}
                            {step === 18 && (
                                <div>
                                    <SectionLabel label="Section 3 of 5 — Your Face & Colouring" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What is your natural hair colour?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {HAIR_COLOURS.map(o => (
                                            <RadioCard key={o.value} selected={form.hairColour === o.value} onClick={() => setForm(p => ({ ...p, hairColour: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 19: Q16 Eye Colour ──────────────────────── */}
                            {step === 19 && (
                                <div>
                                    <SectionLabel label="Section 3 of 5 — Your Face & Colouring" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What is your eye colour?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {EYE_COLOURS.map(o => (
                                            <RadioCard key={o.value} selected={form.eyeColour === o.value} onClick={() => setForm(p => ({ ...p, eyeColour: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 20: Q17 Face Shape ──────────────────────── */}
                            {step === 20 && (
                                <div>
                                    <SectionLabel label="Section 4 of 5 — Your Face Shape" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Which of these face shapes is closest to yours?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {FACE_SHAPES.map(o => {
                                            const selected = form.faceShape === o.value;
                                            return (
                                                <button
                                                    key={o.value}
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, faceShape: o.value }))}
                                                    className={`flex flex-col items-center gap-2 border-2 rounded-xl p-3 transition-all duration-200 ${selected
                                                        ? 'border-luxury-accent bg-luxury-pink-bg shadow-sm shadow-luxury-accent/10'
                                                        : 'border-luxury-cream bg-luxury-warm-white hover:border-luxury-accent/40 hover:bg-luxury-cream/10'
                                                    }`}
                                                >
                                                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                                                        <Image
                                                            src={o.image}
                                                            alt={o.label}
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-semibold luxury-body text-center leading-tight ${selected ? 'text-luxury-accent' : 'text-luxury-charcoal'}`}>{o.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 21: Q18 Facial Features ─────────────────── */}
                            {step === 21 && (
                                <div>
                                    <SectionLabel label="Section 4 of 5 — Your Face Shape" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">How would you describe your facial features in general?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {FACIAL_FEATURE_TYPES.map(o => (
                                            <RadioCard key={o.value} selected={form.facialFeatureType === o.value} onClick={() => setForm(p => ({ ...p, facialFeatureType: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 22: Q22 Primary Style Goal (Anchor) ─────── */}
                            {step === 22 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What is your primary style goal right now?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {PRIMARY_STYLE_GOALS.map(o => (
                                            <RadioCard key={o.value} selected={form.primaryStyleGoal === o.value} onClick={() => setForm(p => ({ ...p, primaryStyleGoal: o.value, branchSubGoal: '', branchBlocker: '', branchReference: '' }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 23: Q22a Branch A — Sub-goal ────────────── */}
                            {step === 23 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What does &ldquo;put-together&rdquo; mean to you?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {BRANCH_A_SUBGOAL.map(o => (
                                            <RadioCard key={o.value} selected={form.branchSubGoal === o.value} onClick={() => setForm(p => ({ ...p, branchSubGoal: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 24: Q22b Branch A — Blocker ─────────────── */}
                            {step === 24 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What&apos;s getting in the way right now?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {BRANCH_A_BLOCKER.map(o => (
                                            <RadioCard key={o.value} selected={form.branchBlocker === o.value} onClick={() => setForm(p => ({ ...p, branchBlocker: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 25: Q22c Branch A — Reference ───────────── */}
                            {step === 25 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Who comes to mind when you think &ldquo;polished&rdquo;?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Pick closest.</p>
                                    <div className="space-y-3">
                                        {BRANCH_A_REFERENCE.map(o => (
                                            <RadioCard key={o.value} selected={form.branchReference === o.value} onClick={() => setForm(p => ({ ...p, branchReference: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 26: Q23 Style Poles ─────────────────────── */}
                            {step === 26 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Where do you sit on each of these axes?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-1">Pick one from each axis.</p>
                                    <p className="text-luxury-charcoal/40 text-xs mb-8 uppercase tracking-widest font-semibold mt-2">Your 4-point style coordinate</p>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Structure', field: 'stylePoleStructure' as const, options: STYLE_POLE_STRUCTURE },
                                            { label: 'Expression', field: 'stylePoleExpression' as const, options: STYLE_POLE_EXPRESSION },
                                            { label: 'Tone', field: 'stylePoleTone' as const, options: STYLE_POLE_TONE },
                                            { label: 'Register', field: 'stylePoleRegister' as const, options: STYLE_POLE_REGISTER },
                                        ].map(axis => (
                                            <div key={axis.label}>
                                                <p className="text-xs font-semibold luxury-body text-luxury-charcoal/50 uppercase tracking-widest mb-3">{axis.label}</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {axis.options.map(o => {
                                                        const selected = form[axis.field] === o.value;
                                                        return (
                                                            <button
                                                                key={o.value}
                                                                type="button"
                                                                onClick={() => setForm(p => ({ ...p, [axis.field]: o.value }))}
                                                                className={`text-center border-2 rounded-xl px-4 py-3 text-sm font-semibold luxury-body transition-all duration-200 ${selected
                                                                    ? 'border-luxury-accent bg-luxury-pink-bg text-luxury-accent shadow-sm shadow-luxury-accent/10'
                                                                    : 'border-luxury-cream bg-luxury-warm-white text-luxury-charcoal hover:border-luxury-accent/40'
                                                                }`}
                                                            >
                                                                {o.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 27: Q24 Style Blocker ───────────────────── */}
                            {step === 27 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">What&apos;s the one thing that most often stops you from dressing how you want?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {STYLE_BLOCKERS.map(o => (
                                            <RadioCard key={o.value} selected={form.styleBlocker === o.value} onClick={() => setForm(p => ({ ...p, styleBlocker: o.value }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 28: Q25 Style Anti-Preferences ──────────── */}
                            {step === 28 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Have you ever been told something looks good on you — but you personally dislike wearing it?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-8">Select one.</p>
                                    <div className="space-y-3">
                                        {ANTI_PREFS.map(o => (
                                            <RadioCard key={o.value} selected={form.styleAntiPref === o.value} onClick={() => setForm(p => ({ ...p, styleAntiPref: o.value, styleAntiPrefNote: o.value.startsWith('yes') ? p.styleAntiPrefNote : '' }))}>
                                                <span className="font-semibold text-luxury-charcoal luxury-body text-sm">{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                    {form.styleAntiPref.startsWith('yes') && (
                                        <div className="mt-6">
                                            <label className="block text-sm font-semibold luxury-body text-luxury-charcoal/70 mb-2">What is it, and why don&apos;t you like wearing it?</label>
                                            <textarea
                                                value={form.styleAntiPrefNote}
                                                onChange={e => { if (e.target.value.length <= 150) setForm(p => ({ ...p, styleAntiPrefNote: e.target.value })); }}
                                                className="w-full px-4 py-4 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body resize-none"
                                                placeholder="e.g. Red — it feels too attention-grabbing for me..."
                                                rows={3}
                                                maxLength={150}
                                            />
                                            <p className="text-xs text-luxury-charcoal/40 mt-2 text-right">{form.styleAntiPrefNote.length}/150</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 29: Q26 Anything Else (Optional) ────────── */}
                            {step === 29 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style" />
                                    <h2 className="text-3xl luxury-heading text-luxury-charcoal mb-3">Anything else you want your stylist to know?</h2>
                                    <p className="luxury-body text-luxury-charcoal/60 mb-1"><span className="text-luxury-accent font-medium">Optional.</span></p>
                                    <p className="text-luxury-charcoal/40 text-xs mb-8 uppercase tracking-widest font-semibold mt-2">No prompt — just space</p>
                                    <textarea
                                        value={form.freeTextNote}
                                        onChange={e => { if (e.target.value.length <= 200) setForm(p => ({ ...p, freeTextNote: e.target.value })); }}
                                        className="w-full px-4 py-4 border-2 border-luxury-cream rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-luxury-accent transition-all text-base bg-white luxury-body resize-none"
                                        placeholder=""
                                        rows={4}
                                        maxLength={200}
                                    />
                                    <p className="text-xs text-luxury-charcoal/40 mt-2 text-right">{form.freeTextNote.length}/200</p>
                                    {submitError && (
                                        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm luxury-body">{submitError}</div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 30: Confirmation ─────────────────────────── */}
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
                                        Your ICONIK Blueprint is now being prepared by our expert stylists and will arrive in your inbox within <strong className="font-semibold text-luxury-charcoal">72 hours</strong>.
                                    </p>
                                    <p className="luxury-body text-sm text-luxury-charcoal/50">Check your spam folder just in case.</p>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* ── Navigation ─────────────────────────────────────── */}
                    {step < CONFIRMATION_STEP && (
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
                            {isLastQuestion ? (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 disabled:opacity-60 disabled:cursor-not-allowed text-luxury-warm-white px-10 py-3 text-base font-semibold luxury-body rounded-full transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    {submitting ? 'Submitting…' : 'Submit my Blueprint'}
                                    {!submitting && <ArrowRight className="w-5 h-5" />}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={goNext}
                                    disabled={!stepValid()}
                                    className="flex items-center gap-3 bg-luxury-accent hover:bg-luxury-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-luxury-warm-white px-10 py-3 text-base font-semibold luxury-body rounded-full transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    Continue <ArrowRight className="w-5 h-5" />
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
        <Suspense fallback={
            <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
                <div className="text-luxury-charcoal/40 luxury-body">Loading…</div>
            </div>
        }>
            <GlobeIntakePageInner />
        </Suspense>
    );
}
