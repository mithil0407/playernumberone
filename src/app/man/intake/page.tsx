'use client';

import { useState, useCallback, useEffect, type ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import {
    getManIntakePhotoValidationError,
    ManIntakeApiError,
    saveManIntakeSubmission,
    uploadManIntakePhoto,
} from '@/lib/supabaseMan';
import { trackPageView, trackCompleteRegistration, updateUserData } from '@/lib/metaPixel';
import { MAN_PRICING } from '@/lib/manPricing';

// ── Types ────────────────────────────────────────────────────────────────────

interface FormState {
    email: string;
    phone: string;
    photoFullBody: File | null;
    photoHeadshot: File | null;
    photoSideProfile: File | null;
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
    branchAnswer: string;
    styleTribes: string[];
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
    { value: 'body_shape', label: 'I want to finally understand what suits my body shape and frame' },
    { value: 'signature_style', label: 'I want a signature style I can own with confidence' },
    { value: 'professional', label: 'I want to look more polished and professional' },
    { value: 'body_change', label: "I've been through a body change and need a style reset" },
    { value: 'underdressed', label: "I want to stop looking underdressed — or like I'm trying too hard" },
];

const STYLE_RELATIONSHIPS = [
    { value: 'safe_rotation', label: 'I wear the same 5 things on rotation because I know they (roughly) work' },
    { value: 'buy_nothing_fits', label: 'I buy a lot but feel like nothing ever looks right on me' },
    { value: 'avoidance', label: 'I avoid certain clothes because of how they make me feel about my body' },
    { value: 'comfort_first', label: 'I dress for comfort — style has always felt secondary' },
    { value: 'starting_fresh', label: "I'm starting fresh — I genuinely don't know my style yet" },
];

const DRESSING_CONTEXTS = [
    { value: 'corporate_office', label: 'Corporate office / Formal workplace' },
    { value: 'client_facing', label: 'Client-facing / Business meetings' },
    { value: 'business_casual', label: 'Business casual / Startup' },
    { value: 'wfh', label: 'Work from home (but still need to look good on calls)' },
    { value: 'casual_social', label: 'Casual social' },
    { value: 'indian_occasions', label: 'Indian occasions (weddings, festivals)' },
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
    { value: 'short', label: "Under 5'6\" (Short)" },
    { value: 'average', label: "5'6\" – 5'9\" (Average)" },
    { value: 'tall_average', label: "5'9\" – 6'0\" (Tall-average)" },
    { value: 'tall', label: "Above 6'0\" (Tall)" },
];

const BODY_SHAPES = [
    { value: 'rectangle', label: 'Rectangle', sub: 'Shoulders, chest, and waist all similar width — straight and even' },
    { value: 'athletic', label: 'Athletic / V-Shape', sub: 'Broad shoulders tapering to a narrower waist' },
    { value: 'oval', label: 'Oval / Round', sub: 'Fuller midsection, weight sits mostly around the belly' },
    { value: 'slim', label: 'Slim / Lean', sub: 'Narrow frame throughout — slim shoulders, waist, and hips' },
    { value: 'triangle', label: 'Triangle', sub: 'Narrower shoulders, broader hips and thighs' },
];

const FAT_STORAGE_ZONES = [
    { value: 'belly', label: 'Belly / midsection — classic male pattern' },
    { value: 'chest_upper', label: 'Chest and upper body' },
    { value: 'hips_thighs', label: 'Hips and thighs' },
    { value: 'arms_back', label: 'Arms and back' },
    { value: 'distributed', label: 'Fairly evenly distributed across the body' },
];

const HIGHLIGHT_ZONES = [
    { value: 'shoulders_chest', label: 'Shoulders / Chest' },
    { value: 'arms', label: 'Arms (if muscular)' },
    { value: 'legs', label: 'Legs' },
    { value: 'none', label: "No specific area — I just want overall balance" },
];

const MINIMISE_ZONES = [
    { value: 'belly', label: 'Belly / Midsection' },
    { value: 'chest', label: 'Chest (fullness)' },
    { value: 'hips_thighs', label: 'Hips / Thighs' },
    { value: 'arms_back', label: 'Arms / Back' },
    { value: 'none', label: 'Nothing specific — I just want balance' },
];

const FIT_PREFERENCES = [
    { value: 'fitted', label: 'I love it — I want my shape to show' },
    { value: 'structured', label: 'I like structured and tailored, but nothing too tight' },
    { value: 'relaxed', label: 'I prefer relaxed / oversized — comfort comes first' },
    { value: 'open_to_fitted', label: "I'd wear fitted if I knew it would actually look good on me" },
];

const WARDROBE_COMPOSITIONS = [
    { value: 'formals', label: 'Formal shirts, dress trousers, suits' },
    { value: 'business_casual', label: 'Business casual (chinos, blazers, smart shirts)' },
    { value: 'casuals', label: 'Casual wear (jeans, tees, hoodies)' },
    { value: 'ethnic', label: 'Indian ethnic wear (kurtas, sherwanis)' },
    { value: 'mixed', label: 'A chaotic mix of everything' },
    { value: 'scratch', label: "Starting from scratch — I barely have a wardrobe" },
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
    { value: 'oval', label: 'Oval', image: '/man-Oval.webp' },
    { value: 'round', label: 'Round', image: '/man-Round.webp' },
    { value: 'square', label: 'Square', image: '/man-Square.webp' },
    { value: 'heart', label: 'Heart / Inverted Triangle', image: '/man-Heart.webp' },
    { value: 'oblong', label: 'Oblong / Rectangle', image: '/man-Oblong.webp' },
    { value: 'diamond', label: 'Diamond', image: '/man-Diamond.webp' },
];

const FACIAL_FEATURE_TYPES = [
    { value: 'angular', label: 'Sharp / angular — strong bone structure' },
    { value: 'soft', label: 'Soft / round — softer, rounder features' },
    { value: 'mixed', label: 'A mix — somewhere in between' },
];

// ── Section 5 constants ───────────────────────────────────────────────────────

const PRIMARY_STYLE_GOALS = [
    { value: 'polished', label: 'I want to look more polished and put-together' },
    { value: 'authentic', label: 'I want to look more like myself — authentic, not dressed for others' },
    { value: 'confident', label: 'I want to feel more confident in what I wear' },
    { value: 'versatile', label: 'I want more variety and versatility in my wardrobe' },
    { value: 'occasion', label: 'I have a specific occasion or life change I need to dress for' },
];

const BRANCH_OPTIONS: Record<string, { question: string; options: { value: string; label: string }[] }> = {
    polished: {
        question: 'What does polished mean to you?',
        options: [
            { value: 'fit_intentional', label: 'Clothes that fit perfectly and look intentional' },
            { value: 'appropriate', label: 'Always appropriate — never under or overdressed' },
            { value: 'signature', label: 'A signature look people associate with me' },
            { value: 'elevated_basics', label: 'Elevated basics — nothing flashy, everything right' },
        ],
    },
    authentic: {
        question: "Why aren't you dressing that way currently?",
        options: [
            { value: 'expectations', label: 'I dress for work / family / social expectations' },
            { value: 'know_like_not_suit', label: "I know what I like aesthetically but not what suits my body" },
            { value: 'body_change', label: 'My body or life has changed and I need to reset' },
            { value: 'dont_know', label: "I genuinely don't know what my style is yet" },
        ],
    },
    confident: {
        question: 'Where does confidence break down most?',
        options: [
            { value: 'fit', label: "Fit — things don't sit right on my body" },
            { value: 'occasion', label: 'Occasion — I\'m often over or underdressed' },
            { value: 'perception', label: "Perception — I overthink how I'm being read" },
            { value: 'choices', label: 'Choices — I second-guess everything I pick' },
        ],
    },
    versatile: {
        question: "What's structurally wrong with your wardrobe right now?",
        options: [
            { value: 'nothing_works', label: "Lots of clothes but nothing works together" },
            { value: 'too_casual', label: "Everything is too casual — no range upward" },
            { value: 'too_formal', label: "Everything is too formal — nothing relaxed" },
            { value: 'impulse_buys', label: "Impulse buys that don't connect to each other" },
            { value: 'ethnic_western_gap', label: "Mostly ethnic or mostly Western — no bridge between them" },
        ],
    },
    occasion: {
        question: 'What is the occasion or change?',
        options: [
            { value: 'new_job', label: 'New job or promotion' },
            { value: 'wedding_season', label: 'Wedding season' },
            { value: 'body_change', label: 'Significant body change' },
            { value: 'social_reentry', label: 'Re-entering social life after a long gap' },
            { value: 'lifestyle_shift', label: 'Moving cities or lifestyle shift' },
        ],
    },
};

const STYLE_TRIBES = [
    {
        context: 'Casual',
        tribes: [
            { value: 'old_money', label: 'Old Money', image: '/oldmoney.webp' },
            { value: 'off_duty', label: 'Off Duty', image: '/offduty.webp' },
            { value: 'urban_wear', label: 'Urban Wear', image: '/urbanwear.webp' },
            { value: 'indian_casual', label: 'Indian Casual', image: '/indiancasual.webp' },
        ],
    },
    {
        context: 'Formal',
        tribes: [
            { value: 'power_classic', label: 'Power Classic', image: '/powerclassic.webp' },
            { value: 'new_boardroom', label: 'The New Boardroom', image: '/boardroom.webp' },
            { value: 'dark_romantic', label: 'Dark Romantic', image: '/darkromance.webp' },
            { value: 'indo_authority', label: 'Indo Authority', image: '/indoauthority.webp' },
        ],
    },
    {
        context: 'Evening',
        tribes: [
            { value: 'quiet_luxury', label: 'Quiet Luxury', image: '/quietluxury.webp' },
            { value: 'sharp_evening', label: 'Sharp Evening', image: '/sharpevening.webp' },
            { value: 'royal_edit', label: 'Royal Edit', image: '/royaledit.webp' },
            { value: 'classic_evening', label: 'Classic Evening', image: '/classicevening.webp' },
        ],
    },
];

const STYLE_POLES = [
    { field: 'stylePoleStructure' as const, label: 'Structure', a: { value: 'structured', label: 'Structured and tailored' }, b: { value: 'fluid', label: 'Fluid and relaxed' } },
    { field: 'stylePoleExpression' as const, label: 'Expression', a: { value: 'minimal', label: 'Minimal and quiet' }, b: { value: 'expressive', label: 'Expressive and detailed' } },
    { field: 'stylePoleTone' as const, label: 'Tone', a: { value: 'classic', label: 'Classic and timeless' }, b: { value: 'current', label: 'Current and fashion-forward' } },
    { field: 'stylePoleRegister' as const, label: 'Register', a: { value: 'dressed_up', label: 'Dressed up is my comfort zone' }, b: { value: 'dressed_down', label: 'Dressed down is my comfort zone' } },
];

const STYLE_BLOCKERS = [
    { value: 'nothing_fits', label: "Nothing fits the way I want it to" },
    { value: 'dont_know_body', label: "I don't know what actually works on my body" },
    { value: 'buy_never_wear', label: "I buy things I never end up wearing" },
    { value: 'dont_know_where', label: "I don't know where to shop for my context" },
    { value: 'lifestyle', label: "My lifestyle doesn't allow the style I want" },
    { value: 'dress_for_others', label: "I dress for others, not for myself" },
];

const ANTI_PREFS = [
    { value: 'yes_colour', label: 'Yes — a colour' },
    { value: 'yes_silhouette', label: 'Yes — a silhouette or cut' },
    { value: 'yes_category', label: 'Yes — a style category like ethnic or formal' },
    { value: 'no_wear_told', label: "No — I wear what I'm told looks good" },
    { value: 'never_thought', label: "I've never thought about this" },
];

// Step 0 = welcome, Steps 1–27 = content, Step 28 = confirmation
const CONFIRMATION_STEP = 28;
const QUESTION_COUNT = 27;

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
    const pct = (step / QUESTION_COUNT) * 100;
    return (
        <div className="w-full h-px overflow-hidden" style={{ background: 'rgba(44,38,34,0.1)' }}>
            <div
                className="h-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(pct, 100)}%`, background: '#94A6AD' }}
            />
        </div>
    );
}

function SectionLabel({ label }: { label: string }) {
    return (
        <p className="iconik-micro mb-5" style={{ color: '#2C2622', opacity: 0.4 }}>{label}</p>
    );
}

function RadioCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left rounded-xl px-5 py-4 transition-all duration-200"
            style={{
                border: `1px solid ${selected ? '#94A6AD' : 'rgba(44,38,34,0.1)'}`,
                background: selected ? 'rgba(148,166,173,0.08)' : '#FAFAF8',
            }}
        >
            <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all" style={{ border: `2px solid ${selected ? '#94A6AD' : 'rgba(44,38,34,0.2)'}` }}>
                    {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#94A6AD' }} />}
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
            className="w-full text-left rounded-xl px-5 py-4 transition-all duration-200"
            style={{
                border: `1px solid ${selected ? '#94A6AD' : 'rgba(44,38,34,0.1)'}`,
                background: selected ? 'rgba(148,166,173,0.08)' : '#FAFAF8',
            }}
        >
            <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all" style={{ border: `2px solid ${selected ? '#94A6AD' : 'rgba(44,38,34,0.2)'}`, background: selected ? '#94A6AD' : 'transparent' }}>
                    {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                {children}
            </div>
        </button>
    );
}

function PhotoUploadField({ label, instruction, file, onChange, error, onError, required }: {
    label: string;
    instruction: string;
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
    onError: (error: string) => void;
    required?: boolean;
}) {
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] ?? null;
        if (!selectedFile) {
            onError('');
            onChange(null);
            return;
        }

        const validationError = getManIntakePhotoValidationError(selectedFile);
        if (validationError) {
            onError(validationError);
            onChange(null);
            event.target.value = '';
            return;
        }

        onError('');
        onChange(selectedFile);
    };

    return (
        <label className="block cursor-pointer group">
            <div
                className="rounded-2xl p-8 md:p-10 text-center transition-all duration-200"
                style={{
                    border: `1px dashed ${file ? '#94A6AD' : 'rgba(44,38,34,0.2)'}`,
                    background: file ? 'rgba(148,166,173,0.06)' : '#FAFAF8',
                }}
            >
                {file ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(148,166,173,0.12)' }}>
                            <CheckCircle className="w-7 h-7" style={{ color: '#94A6AD' }} />
                        </div>
                        <div className="iconik-display" style={{ fontSize: '15px', color: '#2C2622' }}>{file.name}</div>
                        <div className="iconik-micro opacity-45" style={{ color: '#2C2622' }}>Click or drag to change</div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform" style={{ background: 'rgba(44,38,34,0.04)' }}>
                            <Upload className="w-7 h-7 transition-colors" style={{ color: 'rgba(44,38,34,0.3)' }} />
                        </div>
                        <div className="iconik-display" style={{ fontSize: '16px', color: '#2C2622' }}>{label}{required && ' *'}</div>
                        <div style={{ fontSize: '13px', color: '#2C2622', opacity: 0.55, maxWidth: '320px', lineHeight: 1.7 }}>{instruction}</div>
                        <div className="iconik-micro mt-1 opacity-35" style={{ color: '#2C2622' }}>JPG · PNG · HEIC · Max 20MB</div>
                    </div>
                )}
                <input type="file" accept=".jpg,.jpeg,.png,.heic,.heif" className="hidden" onChange={handleFileChange} required={required} />
            </div>
            {error && <p className="mt-3 text-center text-sm" style={{ color: '#A13D46' }}>{error}</p>}
        </label>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

function ManIntakePageInner() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [direction, setDirection] = useState(1);
    const [contactPrefilled, setContactPrefilled] = useState(false);
    const [photoErrors, setPhotoErrors] = useState({ fullBody: '', headshot: '', sideProfile: '' });

    const [form, setForm] = useState<FormState>({
        email: '',
        phone: '',
        photoFullBody: null,
        photoHeadshot: null,
        photoSideProfile: null,
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
        wardrobeComposition: [],
        skinTone: '',
        veinUndertone: '',
        whiteTest: '',
        hairColour: '',
        eyeColour: '',
        faceShape: '',
        facialFeatureType: '',
        primaryStyleGoal: '',
        branchAnswer: '',
        styleTribes: [],
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
        trackPageView('Man Intake');
        const urlEmail = searchParams.get('email') || '';
        const urlPhone = searchParams.get('phone') || '';
        const lsEmail = typeof window !== 'undefined' ? localStorage.getItem('man_customerEmail') || '' : '';
        const lsPhone = typeof window !== 'undefined' ? localStorage.getItem('man_customerPhone') || '' : '';
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

    // Step 21 = Q18 anchor, step 22 = branch sub-question (skipped if no branch applies)
    const hasBranch = !!BRANCH_OPTIONS[form.primaryStyleGoal];

    const goNext = useCallback(() => {
        setDirection(1);
        setStep(s => {
            if (s === 0 && contactPrefilled) return 2;
            // Skip branch step if no branch for selected goal
            if (s === 21 && !hasBranch) return 23;
            return s + 1;
        });
    }, [contactPrefilled, hasBranch]);

    const goBack = useCallback(() => {
        setDirection(-1);
        setStep(s => {
            if (s === 2 && contactPrefilled) return 0;
            // Skip back over branch step if no branch
            if (s === 23 && !hasBranch) return 21;
            return Math.max(0, s - 1);
        });
    }, [contactPrefilled, hasBranch]);

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
        let submissionStage: 'upload' | 'save' = 'upload';
        try {
            if (!form.photoFullBody || !form.photoHeadshot) {
                setSubmitError('Please upload both your full body photo and headshot before submitting.');
                return;
            }

            const selectedPhotoError = [
                getManIntakePhotoValidationError(form.photoFullBody),
                getManIntakePhotoValidationError(form.photoHeadshot),
                form.photoSideProfile ? getManIntakePhotoValidationError(form.photoSideProfile) : null,
            ].find(Boolean);
            if (selectedPhotoError) {
                setSubmitError(selectedPhotoError);
                return;
            }

            // Upload required photos plus the optional side profile in parallel.
            const ts = Date.now();
            const uploadPhoto = async (file: File, fileName: string, label: string) => {
                try {
                    return await uploadManIntakePhoto(file, fileName);
                } catch (error) {
                    const detail = error instanceof Error ? error.message : 'Upload failed';
                    throw new Error(`${label}: ${detail}`);
                }
            };
            const [photoFullBodyUrl, photoHeadshotUrl, photoSideProfileUrl] = await Promise.all([
                uploadPhoto(form.photoFullBody, `${ts}_fullbody_${form.photoFullBody.name.replace(/\.[^.]+$/, '')}.jpg`, 'Full body photo'),
                uploadPhoto(form.photoHeadshot, `${ts}_headshot_${form.photoHeadshot.name.replace(/\.[^.]+$/, '')}.jpg`, 'Headshot'),
                form.photoSideProfile
                    ? uploadPhoto(form.photoSideProfile, `${ts}_side_profile_${form.photoSideProfile.name.replace(/\.[^.]+$/, '')}.jpg`, 'Side-profile photo')
                    : Promise.resolve<string | null>(null),
            ]);

            if (!photoFullBodyUrl || !photoHeadshotUrl) {
                throw new Error('Both photo uploads are required before submission.');
            }

            const derivedColourSeason = deriveColourSeason(
                form.skinTone,
                form.veinUndertone,
                form.whiteTest,
                form.hairColour,
                form.eyeColour,
            );

            const submissionPayload = {
                customer_email: form.email,
                customer_phone: form.phone,
                photo_fullbody_url: photoFullBodyUrl,
                photo_headshot_url: photoHeadshotUrl,
                ...(photoSideProfileUrl ? { photo_side_profile_url: photoSideProfileUrl } : {}),
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
                wardrobe_composition: form.wardrobeComposition.join(','),
                skin_tone: form.skinTone,
                vein_undertone: form.veinUndertone,
                white_test: form.whiteTest,
                hair_colour: form.hairColour,
                eye_colour: form.eyeColour,
                derived_colour_season: derivedColourSeason || undefined,
                face_shape: form.faceShape,
                facial_feature_type: form.facialFeatureType,
                primary_style_goal: form.primaryStyleGoal,
                branch_answer: form.branchAnswer,
                style_tribes: form.styleTribes.join(','),
                style_pole_structure: form.stylePoleStructure,
                style_pole_expression: form.stylePoleExpression,
                style_pole_tone: form.stylePoleTone,
                style_pole_register: form.stylePoleRegister,
                style_blocker: form.styleBlocker,
                style_anti_pref: form.styleAntiPref,
                style_anti_pref_note: form.styleAntiPrefNote || undefined,
                free_text_note: form.freeTextNote || undefined,
            };

            submissionStage = 'save';
            await saveManIntakeSubmission(submissionPayload);

            trackCompleteRegistration(MAN_PRICING.IN.basePrice, 'ICONIK Blueprint Man — Intake Submitted', MAN_PRICING.IN.currency);
            setDirection(1);
            setStep(CONFIRMATION_STEP);

            // Notify the ICONIK team (background)
            fetch('/api/man-intake-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionPayload),
            }).then(async res => {
                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    console.error('Man intake notify HTTP error:', res.status, text);
                }
            }).catch(err => console.error('Man intake notify failed:', err));

        } catch (err) {
            console.error('Man intake submit error:', err);
            if (submissionStage === 'upload') {
                const detail = err instanceof Error ? err.message : 'One or more uploads failed.';
                setSubmitError(`We could not upload your photos. ${detail} Please try again.`);
            } else if (err instanceof ManIntakeApiError && err.code === 'INVALID_INTAKE') {
                setSubmitError('We could not validate your intake. Your answers are still here; please review them and retry.');
            } else {
                setSubmitError('Your photos were uploaded, but we could not save your intake. Your answers are still here; please retry or email help.iconikfashion@gmail.com.');
            }
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
            case 13: return form.wardrobeComposition.length >= 1;
            // Section 3
            case 14: return !!form.skinTone;
            case 15: return !!form.veinUndertone;
            case 16: return !!form.whiteTest;
            case 17: return !!form.hairColour;
            case 18: return !!form.eyeColour;
            // Section 4
            case 19: return !!form.faceShape;
            case 20: return !!form.facialFeatureType;
            // Section 5
            case 21: return !!form.primaryStyleGoal;
            case 22: return !!form.branchAnswer; // branch sub-question (skipped if no branch)
            case 23: return form.styleTribes.length >= 1;
            case 24: return !!form.stylePoleStructure && !!form.stylePoleExpression && !!form.stylePoleTone && !!form.stylePoleRegister;
            case 25: return !!form.styleBlocker;
            case 26: return !!form.styleAntiPref;
            case 27: return true; // optional free text
            default: return true;
        }
    }, [step, form]);

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    };

    const isLastQuestion = step === 27;

    return (
        <div className="man-editorial me-page-wrapper min-h-screen overflow-x-hidden flex flex-col" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>

            {/* Header */}
            <header className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: 'rgba(248,243,233,0.95)', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
                <div className="max-w-2xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="iconik-display" style={{ fontSize: '18px', letterSpacing: '0.1em', color: '#2C2622' }}>ICONIK</span>
                        {step > 0 && step < CONFIRMATION_STEP && (
                            <span className="iconik-mono" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.4, letterSpacing: '0.2em' }}>Step {step} of {QUESTION_COUNT}</span>
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
                            className="md:rounded-3xl md:p-10"
                            style={{ background: 'transparent' }}
                        >

                            {/* ── Step 0: Opening ──────────────────────────────── */}
                            {step === 0 && (
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8 relative" style={{ background: 'rgba(148,166,173,0.12)' }}>
                                        <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(148,166,173,0.15)' }} />
                                        <CheckCircle className="w-8 h-8 relative z-10" style={{ color: '#94A6AD' }} />
                                    </div>
                                    <div className="iconik-display mb-5" style={{ fontSize: 'clamp(28px, 6vw, 44px)', color: '#2C2622' }}>Let&apos;s build your Blueprint.</div>
                                    <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#2C2622', opacity: 0.65, marginBottom: '24px', maxWidth: '420px', margin: '0 auto 24px' }}>
                                        Two photos and a few key details so our stylists can personalise your report. Takes exactly <strong style={{ fontWeight: 500, color: '#2C2622', opacity: 1 }}>7 minutes</strong>.
                                    </p>
                                    {contactPrefilled && form.email && (
                                        <div className="rounded-xl px-5 py-3 mb-8 inline-block" style={{ background: 'rgba(44,38,34,0.04)', border: '1px solid rgba(44,38,34,0.08)' }}>
                                            <p className="iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.55 }}>Continuing as <strong style={{ fontWeight: 500 }}>{form.email}</strong></p>
                                        </div>
                                    )}
                                    <button
                                        onClick={goNext}
                                        className="inline-flex items-center gap-3 px-10 py-4 rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg transform"
                                        style={{ background: '#2C2622', color: '#F4EFE5' }}
                                    >
                                        <span className="iconik-display" style={{ fontSize: '15px' }}>Begin Intake Form</span>
                                        <ArrowRight className="w-4 h-4 opacity-60" />
                                    </button>
                                </div>
                            )}

                            {/* ── Step 1: Contact ──────────────────────────────── */}
                            {step === 1 && (
                                <div>
                                    <div className="iconik-display mb-2" style={{ fontSize: 'clamp(24px, 5vw, 36px)', color: '#2C2622' }}>Your contact details</div>
                                    <p style={{ fontSize: '14px', color: '#2C2622', opacity: 0.55, marginBottom: '28px', lineHeight: 1.7 }}>So we can send your Blueprint to you.</p>
                                    {contactPrefilled ? (
                                        <div className="space-y-3">
                                            {[{ label: 'Email', value: form.email }, { label: 'Phone', value: form.phone }].map(f => (
                                                <div key={f.label} className="rounded-xl px-5 py-4 flex items-center justify-between" style={{ background: 'rgba(44,38,34,0.04)', border: '1px solid rgba(44,38,34,0.08)' }}>
                                                    <div>
                                                        <p className="iconik-micro mb-1 opacity-40" style={{ color: '#2C2622' }}>{f.label}</p>
                                                        <p style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{f.value}</p>
                                                    </div>
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#94A6AD' }} />
                                                </div>
                                            ))}
                                            <p className="iconik-mono text-center mt-3" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.4 }}>Saved from your purchase. <button onClick={() => setContactPrefilled(false)} className="underline hover:opacity-70 transition-opacity">Edit</button></p>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block iconik-mono mb-2" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.45, letterSpacing: '0.2em' }}>EMAIL ADDRESS *</label>
                                                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl text-base outline-none transition-all" style={{ border: '1px solid rgba(44,38,34,0.15)', background: '#FAFAF8', color: '#2C2622', fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 300 }} placeholder="your@email.com" />
                                            </div>
                                            <div>
                                                <label className="block iconik-mono mb-2" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.45, letterSpacing: '0.2em' }}>PHONE NUMBER *</label>
                                                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/[^\d\s+()-]/g, '') }))} className="w-full px-4 py-3.5 rounded-xl text-base outline-none transition-all" style={{ border: '1px solid rgba(44,38,34,0.15)', background: '#FAFAF8', color: '#2C2622', fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 300 }} placeholder="+91 98765 43210" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 2: Full Body Photo ──────────────────────── */}
                            {step === 2 && (
                                <div>
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>Upload a full-length photo.</h2>
                                    <p style={{ fontSize: '14px', color: '#2C2622', opacity: 0.55, marginBottom: '24px', lineHeight: 1.7 }}>Stand facing the camera. Natural light. Wear fitted clothes — a fitted T-shirt and slim trousers work well. No baggy clothing.</p>
                                    <div className="relative mx-auto w-40 mb-6" style={{ aspectRatio: '3/4' }}>
                                        <Image src="/fullbody.webp" alt="Example full-body photo" fill className="object-cover rounded-2xl" style={{ border: '1px solid rgba(44,38,34,0.1)' }} />
                                        <div className="absolute bottom-2 left-0 right-0 text-center">
                                            <span className="px-2 py-0.5 rounded-full iconik-micro" style={{ background: 'rgba(44,38,34,0.6)', color: '#F4EFE5' }}>Example</span>
                                        </div>
                                    </div>
                                    <PhotoUploadField
                                        label="Full body photo"
                                        instruction="Stand facing camera · Natural light · Fitted clothes · No baggy fits"
                                        file={form.photoFullBody}
                                        onChange={f => setForm(p => ({ ...p, photoFullBody: f }))}
                                        error={photoErrors.fullBody}
                                        onError={error => setPhotoErrors(current => ({ ...current, fullBody: error }))}
                                        required
                                    />
                                    {!form.photoFullBody && <p className="iconik-micro mt-3 text-center" style={{ color: '#94A6AD' }}>A full-length photo is required to complete your Blueprint analysis.</p>}
                                    <div className="mt-7 pt-7" style={{ borderTop: '1px solid rgba(44,38,34,0.08)' }}>
                                        <h3 className="iconik-display mb-2" style={{ fontSize: '20px', color: '#2C2622', lineHeight: 1.2 }}>Optional side-profile photo.</h3>
                                        <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.52, marginBottom: '18px', lineHeight: 1.65 }}>Stand sideways in the same fitted clothes. This lets us build a more honest posture and midsection tailoring slide. Skip it if you do not have one.</p>
                                        <PhotoUploadField
                                            label="Side profile photo"
                                            instruction="Side view · Head to toe · Same outfit if possible · Optional"
                                            file={form.photoSideProfile}
                                            onChange={f => setForm(p => ({ ...p, photoSideProfile: f }))}
                                            error={photoErrors.sideProfile}
                                            onError={error => setPhotoErrors(current => ({ ...current, sideProfile: error }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── Step 3: Headshot ─────────────────────────────── */}
                            {step === 3 && (
                                <div>
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>Upload a clear headshot.</h2>
                                    <p style={{ fontSize: '14px', color: '#2C2622', opacity: 0.55, marginBottom: '24px', lineHeight: 1.7 }}>Face the camera directly. Natural or indoor light. No sunglasses. A simple selfie is fine.</p>
                                    <div className="relative mx-auto w-40 mb-6" style={{ aspectRatio: '3/4' }}>
                                        <Image src="/headshot.webp" alt="Example headshot photo" fill className="object-cover rounded-2xl" style={{ border: '1px solid rgba(44,38,34,0.1)' }} />
                                        <div className="absolute bottom-2 left-0 right-0 text-center">
                                            <span className="px-2 py-0.5 rounded-full iconik-micro" style={{ background: 'rgba(44,38,34,0.6)', color: '#F4EFE5' }}>Example</span>
                                        </div>
                                    </div>
                                    <PhotoUploadField
                                        label="Headshot / selfie"
                                        instruction="Face the camera · No sunglasses · Natural or indoor light · Selfie is fine"
                                        file={form.photoHeadshot}
                                        onChange={f => setForm(p => ({ ...p, photoHeadshot: f }))}
                                        error={photoErrors.headshot}
                                        onError={error => setPhotoErrors(current => ({ ...current, headshot: error }))}
                                        required
                                    />
                                </div>
                            )}

                            {/* ── Step 4: Q1 Primary Goal ──────────────────────── */}
                            {step === 4 && (
                                <div>
                                    <SectionLabel label="Section 1 of 5 — The Basics" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>What&apos;s your primary goal with ICONIK today?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {PRIMARY_GOALS.map(o => (
                                            <RadioCard key={o.value} selected={form.primaryGoal === o.value} onClick={() => setForm(p => ({ ...p, primaryGoal: o.value }))}>
                                                <span style={{ fontSize: '13px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 5: Q2 Style Relationship ────────────────── */}
                            {step === 5 && (
                                <div>
                                    <SectionLabel label="Section 1 of 5 — The Basics" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>How would you describe your current relationship with getting dressed?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {STYLE_RELATIONSHIPS.map(o => (
                                            <RadioCard key={o.value} selected={form.styleRelationship === o.value} onClick={() => setForm(p => ({ ...p, styleRelationship: o.value }))}>
                                                <span style={{ fontSize: '13px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 6: Q3 Dressing Context ──────────────────── */}
                            {step === 6 && (
                                <div>
                                    <SectionLabel label="Section 1 of 5 — The Basics" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>What&apos;s your primary dressing context?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '4px' }}>Select up to 2.</p>
                                    <p className="iconik-micro mt-2 mb-6" style={{ color: '#2C2622', opacity: 0.35 }}>Choose the situations you dress for most</p>
                                    <div className="space-y-3">
                                        {DRESSING_CONTEXTS.map(o => (
                                            <CheckCard key={o.value} selected={form.dressingContext.includes(o.value)} onClick={() => toggleMulti('dressingContext', o.value, 2)}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                    {form.dressingContext.length === 2 && (
                                        <p className="iconik-micro mt-4" style={{ color: '#94A6AD' }}>Maximum 2 selections reached.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 7: Q4 Location ──────────────────────────── */}
                            {step === 7 && (
                                <div>
                                    <SectionLabel label="Section 1 of 5 — The Basics" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>Where are you based?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {LOCATION_TIERS.map(o => (
                                            <RadioCard key={o.value} selected={form.locationTier === o.value} onClick={() => setForm(p => ({ ...p, locationTier: o.value }))}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 8: Q5 Height ────────────────────────────── */}
                            {step === 8 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>How tall are you?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {HEIGHT_CATEGORIES.map(o => (
                                            <RadioCard key={o.value} selected={form.heightCategory === o.value} onClick={() => setForm(p => ({ ...p, heightCategory: o.value }))}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 9: Q6 Body Shape ────────────────────────── */}
                            {step === 9 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>Which of these body types is closest to yours?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {BODY_SHAPES.map(o => (
                                            <RadioCard key={o.value} selected={form.bodyShape === o.value} onClick={() => setForm(p => ({ ...p, bodyShape: o.value }))}>
                                                <div>
                                                    <div style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</div>
                                                    <div style={{ fontSize: '12px', color: '#2C2622', opacity: 0.5, marginTop: '2px' }}>{o.sub}</div>
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
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>Where does your body carry most of its weight?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {FAT_STORAGE_ZONES.map(o => (
                                            <RadioCard key={o.value} selected={form.fatStorageZone === o.value} onClick={() => setForm(p => ({ ...p, fatStorageZone: o.value }))}>
                                                <span style={{ fontSize: '13px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 11: Q8 Highlight + Minimise ─────────────── */}
                            {step === 11 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>When you look in the mirror, which area do you most want to highlight or minimise?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one for each.</p>
                                    <p className="iconik-mono mb-3" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.45, letterSpacing: '0.22em' }}>Highlight</p>
                                    <div className="space-y-3 mb-8">
                                        {HIGHLIGHT_ZONES.map(o => (
                                            <RadioCard key={o.value} selected={form.highlightZone === o.value} onClick={() => setForm(p => ({ ...p, highlightZone: o.value }))}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                    <div className="mb-8" style={{ borderTop: '1px solid rgba(44,38,34,0.08)' }} />
                                    <p className="iconik-mono mb-3" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.45, letterSpacing: '0.22em' }}>Minimise</p>
                                    <div className="space-y-3">
                                        {MINIMISE_ZONES.map(o => (
                                            <RadioCard key={o.value} selected={form.minimiseZone === o.value} onClick={() => setForm(p => ({ ...p, minimiseZone: o.value }))}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 12: Q9 Fit Preference ───────────────────── */}
                            {step === 12 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>How do you feel about fitted clothing?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {FIT_PREFERENCES.map(o => (
                                            <RadioCard key={o.value} selected={form.fitPreference === o.value} onClick={() => setForm(p => ({ ...p, fitPreference: o.value }))}>
                                                <span style={{ fontSize: '13px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 13: Q10 Wardrobe Composition ───────────── */}
                            {step === 13 && (
                                <div>
                                    <SectionLabel label="Section 2 of 5 — Your Body" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>What&apos;s your current wardrobe mostly made up of?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '4px' }}>Select up to 3.</p>
                                    <p className="iconik-micro mt-2 mb-6" style={{ color: '#2C2622', opacity: 0.35 }}>Choose all that apply</p>
                                    <div className="space-y-3">
                                        {WARDROBE_COMPOSITIONS.map(o => (
                                            <CheckCard key={o.value} selected={form.wardrobeComposition.includes(o.value)} onClick={() => toggleMulti('wardrobeComposition', o.value, 3)}>
                                                <span style={{ fontSize: '13px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </CheckCard>
                                        ))}
                                    </div>
                                    {form.wardrobeComposition.length === 3 && (
                                        <p className="iconik-micro mt-4" style={{ color: '#94A6AD' }}>Maximum 3 selections reached.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 14: Q12 Skin Tone ───────────────────────── */}
                            {step === 14 && (
                                <div>
                                    <SectionLabel label="Section 3 of 5 — Your Face & Colouring" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>What is your skin tone?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {SKIN_TONES.map(o => (
                                            <RadioCard key={o.value} selected={form.skinTone === o.value} onClick={() => setForm(p => ({ ...p, skinTone: o.value }))}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 15: Q13 Vein Undertone ──────────────────── */}
                            {step === 15 && (
                                <div>
                                    <SectionLabel label="Section 3 of 5 — Your Face & Colouring" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>What are the veins on your inner wrist closest to?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Hold your wrist under natural light and select one.</p>
                                    <div className="space-y-3">
                                        {VEIN_UNDERTONES.map(o => (
                                            <RadioCard key={o.value} selected={form.veinUndertone === o.value} onClick={() => setForm(p => ({ ...p, veinUndertone: o.value }))}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 16: Q14 White Test ──────────────────────── */}
                            {step === 16 && (
                                <div>
                                    <SectionLabel label="Section 3 of 5 — Your Face & Colouring" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>When you wear white, which white feels most &ldquo;alive&rdquo; on your face?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {WHITE_TESTS.map(o => (
                                            <RadioCard key={o.value} selected={form.whiteTest === o.value} onClick={() => setForm(p => ({ ...p, whiteTest: o.value }))}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 17: Q15 Hair Colour ─────────────────────── */}
                            {step === 17 && (
                                <div>
                                    <SectionLabel label="Section 3 of 5 — Your Face & Colouring" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>What is your natural hair colour?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {HAIR_COLOURS.map(o => (
                                            <RadioCard key={o.value} selected={form.hairColour === o.value} onClick={() => setForm(p => ({ ...p, hairColour: o.value }))}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 18: Q16 Eye Colour ──────────────────────── */}
                            {step === 18 && (
                                <div>
                                    <SectionLabel label="Section 3 of 5 — Your Face & Colouring" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>What is your eye colour?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {EYE_COLOURS.map(o => (
                                            <RadioCard key={o.value} selected={form.eyeColour === o.value} onClick={() => setForm(p => ({ ...p, eyeColour: o.value }))}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 19: Q17 Face Shape ──────────────────────── */}
                            {step === 19 && (
                                <div>
                                    <SectionLabel label="Section 4 of 5 — Your Face Shape" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>Which of these face shapes is closest to yours?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {FACE_SHAPES.map(o => {
                                            const selected = form.faceShape === o.value;
                                            return (
                                                <button
                                                    key={o.value}
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, faceShape: o.value }))}
                                                    className={`flex flex-col items-center gap-2 border-2 rounded-xl p-3 transition-all duration-200 ${selected
                                                        ? ''
                                                        : ''
                                                    }`}
                                                    style={{ border: `1px solid ${selected ? '#94A6AD' : 'rgba(44,38,34,0.1)'}`, background: selected ? 'rgba(148,166,173,0.08)' : '#FAFAF8' }}
                                                >
                                                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                                                        <Image
                                                            src={o.image}
                                                            alt={o.label}
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                    <span className="iconik-mono text-center" style={{ fontSize: '10px', color: selected ? '#94A6AD' : '#2C2622', letterSpacing: '0.1em' }}>{o.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 20: Q18 Facial Features ─────────────────── */}
                            {step === 20 && (
                                <div>
                                    <SectionLabel label="Section 4 of 5 — Your Face Shape" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>How would you describe your facial features in general?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {FACIAL_FEATURE_TYPES.map(o => (
                                            <RadioCard key={o.value} selected={form.facialFeatureType === o.value} onClick={() => setForm(p => ({ ...p, facialFeatureType: o.value }))}>
                                                <span style={{ fontSize: '14px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 21: Q18 Primary Style Goal ──────────────── */}
                            {step === 21 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style Identity" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>What is your primary style goal right now?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {PRIMARY_STYLE_GOALS.map(o => (
                                            <RadioCard key={o.value} selected={form.primaryStyleGoal === o.value} onClick={() => setForm(p => ({ ...p, primaryStyleGoal: o.value, branchAnswer: '' }))}>
                                                <span style={{ fontSize: '13px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 22: Q18a Branch sub-question ────────────── */}
                            {step === 22 && BRANCH_OPTIONS[form.primaryStyleGoal] && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style Identity" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>{BRANCH_OPTIONS[form.primaryStyleGoal].question}</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {BRANCH_OPTIONS[form.primaryStyleGoal].options.map(o => (
                                            <RadioCard key={o.value} selected={form.branchAnswer === o.value} onClick={() => setForm(p => ({ ...p, branchAnswer: o.value }))}>
                                                <span style={{ fontSize: '13px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 23: Q19 Style Tribes ────────────────────── */}
                            {step === 23 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style Identity" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>Pick up to 2 that feel most like the version of you you&apos;re building toward.</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '4px' }}>Select across any context.</p>
                                    <p className="iconik-micro mt-2 mb-6" style={{ color: '#2C2622', opacity: 0.35 }}>Max 2 total</p>
                                    <div className="space-y-8">
                                        {STYLE_TRIBES.map(group => (
                                            <div key={group.context}>
                                                <p className="iconik-micro mb-4" style={{ color: '#2C2622', opacity: 0.4 }}>{group.context}</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {group.tribes.map(t => {
                                                        const selected = form.styleTribes.includes(t.value);
                                                        const maxed = form.styleTribes.length >= 2 && !selected;
                                                        return (
                                                            <button
                                                                key={t.value}
                                                                type="button"
                                                                onClick={() => { if (!maxed) toggleMulti('styleTribes', t.value, 2); }}
                                                                className={`flex flex-col items-center gap-2 border-2 rounded-xl p-2 transition-all duration-200 ${selected
                                                                    ? ''
                                                                    : maxed
                                                                        ? ''
                                                                        : ''
                                                                }`}
                                                                style={{ border: `1px solid ${selected ? '#94A6AD' : 'rgba(44,38,34,0.1)'}`, background: selected ? 'rgba(148,166,173,0.08)' : '#FAFAF8', opacity: maxed ? 0.35 : 1 }}
                                                            >
                                                                <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '3/4' }}>
                                                                    <Image src={t.image} alt={t.label} fill className="object-cover" />
                                                                </div>
                                                                <span className="iconik-mono text-center" style={{ fontSize: '10px', color: selected ? '#94A6AD' : '#2C2622', letterSpacing: '0.1em' }}>{t.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {form.styleTribes.length === 2 && (
                                        <p className="iconik-micro mt-4" style={{ color: '#94A6AD' }}>Maximum 2 selections reached.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 24: Q20 Style Poles ─────────────────────── */}
                            {step === 24 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style Identity" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>Where do you sit on each of these axes?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '4px' }}>Pick one per row.</p>
                                    <p className="iconik-micro mt-2 mb-6" style={{ color: '#2C2622', opacity: 0.35 }}>Your 4-point style coordinate</p>
                                    <div className="space-y-6">
                                        {STYLE_POLES.map(axis => (
                                            <div key={axis.label}>
                                                <p className="iconik-micro mb-3" style={{ color: '#2C2622', opacity: 0.4 }}>{axis.label}</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[axis.a, axis.b].map(o => {
                                                        const selected = form[axis.field] === o.value;
                                                        return (
                                                            <button
                                                                key={o.value}
                                                                type="button"
                                                                onClick={() => setForm(p => ({ ...p, [axis.field]: o.value }))}
                                                                className="text-center rounded-xl px-4 py-3 transition-all duration-200"
                                                                style={{ border: `1px solid ${selected ? '#94A6AD' : 'rgba(44,38,34,0.1)'}`, background: selected ? 'rgba(148,166,173,0.1)' : '#FAFAF8', color: selected ? '#94A6AD' : '#2C2622' }}
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

                            {/* ── Step 25: Q21 Style Blocker ───────────────────── */}
                            {step === 25 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style Identity" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>What most often stops you from dressing how you want?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {STYLE_BLOCKERS.map(o => (
                                            <RadioCard key={o.value} selected={form.styleBlocker === o.value} onClick={() => setForm(p => ({ ...p, styleBlocker: o.value }))}>
                                                <span style={{ fontSize: '13px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 26: Q22 Anti-Preferences ────────────────── */}
                            {step === 26 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style Identity" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>Has anyone ever told you something looks good on you — but you personally dislike wearing it?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '24px' }}>Select one.</p>
                                    <div className="space-y-3">
                                        {ANTI_PREFS.map(o => (
                                            <RadioCard key={o.value} selected={form.styleAntiPref === o.value} onClick={() => setForm(p => ({ ...p, styleAntiPref: o.value, styleAntiPrefNote: o.value.startsWith('yes') ? p.styleAntiPrefNote : '' }))}>
                                                <span style={{ fontSize: '13px', color: '#2C2622', fontWeight: 400 }}>{o.label}</span>
                                            </RadioCard>
                                        ))}
                                    </div>
                                    {form.styleAntiPref.startsWith('yes') && (
                                        <div className="mt-6">
                                            <label className="block iconik-mono mb-2" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.45, letterSpacing: '0.2em' }}>What is it, and why don&apos;t you like wearing it?</label>
                                            <textarea
                                                value={form.styleAntiPrefNote}
                                                onChange={e => { if (e.target.value.length <= 150) setForm(p => ({ ...p, styleAntiPrefNote: e.target.value })); }}
                                                className="w-full px-4 py-3.5 rounded-xl text-base transition-all outline-none resize-none" style={{ border: '1px solid rgba(44,38,34,0.15)', background: '#FAFAF8', color: '#2C2622', fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 300 }}
                                                placeholder="e.g. Slim fit shirts — they make me feel exposed..."
                                                rows={3}
                                                maxLength={150}
                                            />
                                            <p className="iconik-micro mt-2 text-right" style={{ color: '#2C2622', opacity: 0.35 }}>{form.styleAntiPrefNote.length}/150</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 27: Q23 Anything Else (Optional) ────────── */}
                            {step === 27 && (
                                <div>
                                    <SectionLabel label="Section 5 of 5 — Style Identity" />
                                    <h2 className="iconik-display mb-3" style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#2C2622', lineHeight: 1.2 }}>Anything else you want your stylist to know?</h2>
                                    <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5, marginBottom: '4px' }}><span style={{ color: '#94A6AD' }}>Optional.</span></p>
                                    <p className="iconik-micro mt-2 mb-6" style={{ color: '#2C2622', opacity: 0.35 }}>No prompt — just space</p>
                                    <textarea
                                        value={form.freeTextNote}
                                        onChange={e => { if (e.target.value.length <= 200) setForm(p => ({ ...p, freeTextNote: e.target.value })); }}
                                        className="w-full px-4 py-3.5 rounded-xl text-base transition-all outline-none resize-none" style={{ border: '1px solid rgba(44,38,34,0.15)', background: '#FAFAF8', color: '#2C2622', fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 300 }}
                                        placeholder=""
                                        rows={4}
                                        maxLength={200}
                                    />
                                    <p className="iconik-micro mt-2 text-right" style={{ color: '#2C2622', opacity: 0.35 }}>{form.freeTextNote.length}/200</p>
                                    {submitError && (
                                        <div className="mt-6 rounded-xl p-4 text-sm" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }}>{submitError}</div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 28: Confirmation ─────────────────────────── */}
                            {step === CONFIRMATION_STEP && (
                                <div className="text-center py-10">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                                        style={{ background: 'rgba(148,166,173,0.12)' }}
                                    >
                                        <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(148,166,173,0.15)' }} />
                                        <CheckCircle className="w-8 h-8 relative z-10" style={{ color: '#94A6AD' }} />
                                    </motion.div>
                                    <div className="iconik-display mb-5" style={{ fontSize: 'clamp(28px, 6vw, 44px)', color: '#2C2622' }}>Your intake is complete.</div>
                                    <p style={{ fontSize: '16px', color: '#2C2622', opacity: 0.65, lineHeight: 1.8, maxWidth: '420px', margin: '0 auto 20px' }}>
                                        Your ICONIK Man Blueprint is now being prepared by our expert stylists and will arrive in your inbox within <strong style={{ fontWeight: 500, color: '#2C2622' }}>72 hours</strong>.
                                    </p>
                                    <p className="iconik-micro" style={{ color: '#2C2622', opacity: 0.4 }}>Check your spam folder just in case.</p>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* ── Navigation ─────────────────────────────────────── */}
                    {step < CONFIRMATION_STEP && (
                        <div className="flex items-center justify-between mt-8 relative z-10">
                            {step > 0 ? (
                                <button onClick={goBack} className="flex items-center gap-2 transition-opacity hover:opacity-50 p-2 -ml-2" style={{ color: '#2C2622' }}>
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="iconik-mono" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Back</span>
                                </button>
                            ) : <div />}

                            {step > 0 && !isLastQuestion && (
                                <button
                                    onClick={goNext}
                                    disabled={!stepValid()}
                                    className="flex items-center gap-2 px-8 py-3.5 rounded-full transition-all duration-300 disabled:opacity-25 disabled:cursor-not-allowed hover:-translate-y-0.5 transform"
                                    style={{ background: '#2C2622', color: '#F4EFE5' }}
                                >
                                    <span className="iconik-display" style={{ fontSize: '14px' }}>Continue</span>
                                    <ArrowRight className="w-4 h-4 opacity-60" />
                                </button>
                            )}

                            {isLastQuestion && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!stepValid() || submitting}
                                    className="flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg transform"
                                    style={{ background: '#2C2622', color: '#F4EFE5' }}
                                >
                                    <span className="iconik-display" style={{ fontSize: '15px' }}>
                                        {submitting ? 'Submitting...' : 'Submit My Intake'}
                                    </span>
                                    {!submitting && <ArrowRight className="w-4 h-4 opacity-60" />}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ManIntakePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F3E9' }}><div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid #94A6AD', borderTopColor: 'transparent' }} /></div>}>
            <ManIntakePageInner />
        </Suspense>
    );
}
