'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, Loader2, Upload } from 'lucide-react';
import { uploadStyleScanPhoto } from '@/lib/supabaseStyleScan';

const STEPS = ['Profile', 'Measurements', 'Body Photos', 'Loved Outfit', 'Physical Context', 'Coverage', 'Lifestyle', 'Preferences', 'Direction'];

const focusAreas = [
    { value: 'Camouflage my midsection', icon: '◎', label: 'Midsection', hint: 'Ease through the waist and stomach' },
    { value: 'Balance my shoulders / hips', icon: '◆', label: 'Balance', hint: 'Shoulders, hips, and proportion' },
    { value: 'Make my arms look more defined', icon: '◐', label: 'Arms', hint: 'Sleeves and upper-body lines' },
    { value: 'Create the appearance of height', icon: '↟', label: 'Height', hint: 'Longer vertical lines' },
    { value: 'Dress for a fuller chest', icon: '◇', label: 'Fuller chest', hint: 'Necklines and structure' },
    { value: 'Dress for a flatter chest', icon: '◌', label: 'Flatter chest', hint: 'Shape, detail, and volume' },
    { value: 'Work with my curves, not against them', icon: 'S', label: 'Curves', hint: 'Shape without cling' },
    { value: 'Look polished without looking overdressed', icon: '✦', label: 'Polish', hint: 'Elevated but natural' },
    { value: 'I want to focus on colour, not just silhouette', icon: '◼', label: 'Colour', hint: 'Palette and contrast first' },
    { value: 'I do not have a specific focus - give me a full analysis', icon: '+', label: 'Full analysis', hint: 'Let the stylist decide' },
];

const occasionOptions = [
    'Formal dinners',
    'Casual social',
    'Travel',
    'Fitness / active',
    'Cultural or religious events',
    'Weddings / celebrations',
    'Date nights',
    'Networking events',
];

const COUNTRY_BY_DIAL_CODE: Record<string, string> = {
    '+1': 'United States / Canada',
    '+27': 'South Africa',
    '+31': 'Netherlands',
    '+33': 'France',
    '+34': 'Spain',
    '+39': 'Italy',
    '+41': 'Switzerland',
    '+44': 'United Kingdom',
    '+45': 'Denmark',
    '+46': 'Sweden',
    '+47': 'Norway',
    '+49': 'Germany',
    '+60': 'Malaysia',
    '+61': 'Australia',
    '+64': 'New Zealand',
    '+65': 'Singapore',
    '+81': 'Japan',
    '+82': 'South Korea',
    '+852': 'Hong Kong',
    '+91': 'India',
    '+966': 'Saudi Arabia',
    '+971': 'United Arab Emirates',
    '+973': 'Bahrain',
    '+974': 'Qatar',
    '+965': 'Kuwait',
    '+968': 'Oman',
};

function deriveCountryFromPhone(phone: string) {
    const normalized = phone.trim().replace(/[^\d+]/g, '').replace(/^00/, '+');
    if (!normalized.startsWith('+')) return '';

    const matchingCode = Object.keys(COUNTRY_BY_DIAL_CODE)
        .sort((a, b) => b.length - a.length)
        .find(code => normalized.startsWith(code));

    return matchingCode ? COUNTRY_BY_DIAL_CODE[matchingCode] : '';
}

const pieceCategories = [
    {
        key: 'tops',
        title: 'Tops',
        options: [
            ['relaxed_oversized', 'Relaxed oversized', '/stylist-intake/tops-relaxed-oversized.webp'],
            ['fitted_tuck_in', 'Fitted tuck-in', '/stylist-intake/tops-fitted-tuck-in.webp'],
            ['structured_button_front', 'Structured button-front', '/stylist-intake/tops-structured-button-front.webp'],
            ['draped_wrap', 'Draped wrap', '/stylist-intake/tops-draped-wrap.webp'],
            ['detailed_collar', 'Detailed collar', '/stylist-intake/tops-detailed-collar.webp'],
            ['clean_minimal', 'Clean minimal', '/stylist-intake/tops-clean-minimal.webp'],
        ],
    },
    {
        key: 'bottoms',
        title: 'Bottoms',
        options: [
            ['wide_leg_trouser', 'Wide-leg trouser', '/stylist-intake/bottoms-wide-leg-trouser.webp'],
            ['straight_cigarette', 'Straight cigarette', '/stylist-intake/bottoms-straight-cigarette.webp'],
            ['tailored_midi_skirt', 'Tailored midi skirt', '/stylist-intake/bottoms-tailored-midi-skirt.webp'],
            ['wrap_skirt', 'Wrap skirt', '/stylist-intake/bottoms-wrap-skirt.webp'],
            ['straight_jeans', 'Fitted straight jeans', '/stylist-intake/bottoms-straight-jeans.webp'],
            ['bootcut', 'Flared / bootcut', '/stylist-intake/bottoms-bootcut.webp'],
        ],
    },
    {
        key: 'outerwear',
        title: 'Outerwear',
        options: [
            ['structured_blazer', 'Structured blazer', '/stylist-intake/outerwear-structured-blazer.webp'],
            ['longline_coat', 'Longline coat', '/stylist-intake/outerwear-longline-coat.webp'],
            ['denim_jacket', 'Denim jacket', '/stylist-intake/outerwear-denim-jacket.webp'],
            ['moto_jacket', 'Leather / moto', '/stylist-intake/outerwear-moto-jacket.webp'],
            ['knit_cardigan', 'Knit cardigan', '/stylist-intake/outerwear-knit-cardigan.webp'],
            ['linen_blazer', 'Unstructured blazer', '/stylist-intake/outerwear-linen-blazer.webp'],
        ],
    },
    {
        key: 'accessories',
        title: 'Accessories',
        options: [
            ['structured_bag', 'Structured bag', '/stylist-intake/accessories-structured-bag.webp'],
            ['soft_tote', 'Soft tote', '/stylist-intake/accessories-soft-tote.webp'],
            ['minimal_jewellery', 'Minimal jewellery', '/stylist-intake/accessories-minimal-jewellery.webp'],
            ['statement_jewellery', 'Statement jewellery', '/stylist-intake/accessories-statement-jewellery.webp'],
            ['classic_shoe', 'Classic shoe', '/stylist-intake/accessories-classic-shoe.webp'],
            ['modern_shoe', 'Modern shoe', '/stylist-intake/accessories-modern-shoe.webp'],
        ],
    },
];

type PhotoKey = 'headshot' | 'front' | 'side' | 'outfit';

const photoUploadFields: Array<{
    key: PhotoKey;
    label: string;
    instruction: string;
    referenceImage?: string;
    referenceAlt?: string;
}> = [
    {
        key: 'headshot',
        label: 'Headshot / selfie',
        instruction: 'Face the camera · No sunglasses · Natural or indoor light · Selfie is fine',
        referenceImage: '/headshot.webp',
        referenceAlt: 'Example headshot photo',
    },
    {
        key: 'front',
        label: 'Full body front',
        instruction: 'Supporting reference · Face camera · Natural light · Feet visible',
        referenceImage: '/fullbody.webp',
        referenceAlt: 'Example full body photo',
    },
    {
        key: 'side',
        label: 'Full body side profile',
        instruction: 'Turn 90 degrees · Natural posture · Full body in frame',
    },
    {
        key: 'outfit',
        label: 'One outfit you love',
        instruction: 'Upload an outfit you already feel good in',
    },
];

const moodBoards = [
    {
        id: 'structured-minimalist',
        label: 'Structured Minimalist',
        words: ['Precise', 'Clean', 'Controlled'],
        colours: ['#111111', '#E8E0D6', '#B58E4D', '#6F6A61'],
        images: [
            '/stylist-intake/moodboard-structured-minimalist-01.webp',
            '/stylist-intake/moodboard-structured-minimalist-02.webp',
            '/stylist-intake/moodboard-structured-minimalist-03.webp',
            '/stylist-intake/moodboard-structured-minimalist-04.webp',
        ],
    },
    {
        id: 'relaxed-professional',
        label: 'Relaxed Professional',
        words: ['Ease', 'Polish', 'Movement'],
        colours: ['#2B2B2B', '#C7B49A', '#F1ECE4', '#8A7A66'],
        images: [
            '/stylist-intake/moodboard-relaxed-professional-01.webp',
            '/stylist-intake/moodboard-relaxed-professional-02.webp',
            '/stylist-intake/moodboard-relaxed-professional-03.webp',
            '/stylist-intake/moodboard-relaxed-professional-04.webp',
        ],
    },
    {
        id: 'elevated-expressive',
        label: 'Elevated Expressive',
        words: ['Presence', 'Detail', 'Contrast'],
        colours: ['#151515', '#8A1F2D', '#D4A853', '#F6E9D7'],
        images: [
            '/stylist-intake/moodboard-elevated-expressive-01.webp',
            '/stylist-intake/moodboard-elevated-expressive-02.webp',
            '/stylist-intake/moodboard-elevated-expressive-03.webp',
            '/stylist-intake/moodboard-elevated-expressive-04.webp',
        ],
    },
];

type PreferenceState = Record<string, { liked: string[]; disliked: string[]; skipped: string[] }>;

function emptyPreferenceState(): PreferenceState {
    return Object.fromEntries(pieceCategories.map(category => [category.key, { liked: [], disliked: [], skipped: [] }]));
}

function ToggleButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border px-4 py-3 text-left text-sm luxury-body transition ${
                active ? 'border-luxury-accent bg-luxury-pink-bg text-luxury-charcoal' : 'border-luxury-cream bg-white text-luxury-charcoal/65 hover:border-luxury-accent/50'
            }`}
        >
            {children}
        </button>
    );
}

function FocusCard({
    item,
    active,
    onClick,
}: {
    item: (typeof focusAreas)[number];
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`min-h-[132px] rounded-xl border p-4 text-left transition ${
                active
                    ? 'border-luxury-accent bg-luxury-pink-bg text-luxury-charcoal shadow-sm shadow-luxury-accent/10'
                    : 'border-luxury-cream bg-white text-luxury-charcoal/70 hover:border-luxury-accent/50'
            }`}
        >
            <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full border text-xl luxury-heading ${
                active ? 'border-luxury-accent bg-white text-luxury-accent' : 'border-luxury-cream bg-luxury-warm-white text-luxury-charcoal/55'
            }`}>
                {item.icon}
            </span>
            <span className="block luxury-body text-sm font-semibold text-luxury-charcoal">{item.label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-luxury-charcoal/50">{item.hint}</span>
        </button>
    );
}

function PhotoUploadCard({
    field,
    fileName,
    onChange,
    featured = false,
}: {
    field: (typeof photoUploadFields)[number];
    fileName?: string;
    onChange: (file?: File) => void;
    featured?: boolean;
}) {
    const referenceAspect =
        field.key === 'headshot' ? 'aspect-[4/3]' :
            field.key === 'front' ? 'aspect-[3/4]' :
                'aspect-[4/5]';

    return (
        <label className="group flex min-h-full cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-dashed border-luxury-cream bg-white transition hover:border-luxury-accent/60">
            {field.referenceImage && (
                <div className={`relative bg-[#fde7de] ${referenceAspect}`}>
                    <Image
                        src={field.referenceImage}
                        alt={field.referenceAlt || field.label}
                        fill
                        sizes={featured ? '(min-width: 768px) 50vw, 100vw' : '100vw'}
                        className="object-contain"
                    />
                </div>
            )}
            {!field.referenceImage && (
                <div className="flex aspect-[3/4] items-center justify-center bg-luxury-cream/35 px-6 text-center">
                    <div className="rounded-full border border-luxury-accent/30 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-luxury-accent">
                        Upload reference
                    </div>
                </div>
            )}
            <div className="flex flex-1 flex-col p-5">
                <Upload className="w-5 h-5 text-luxury-accent mb-2" />
                <p className="font-semibold luxury-body">{field.label}</p>
                <p className="text-xs text-luxury-charcoal/50 mt-1">{field.instruction}</p>
                <p className="mt-auto pt-4 text-xs text-luxury-charcoal/45 truncate">{fileName || 'Choose file'}</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={e => onChange(e.target.files?.[0])} />
        </label>
    );
}

function StylistIntakeInner() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(0);
    const [accessEmail, setAccessEmail] = useState('');
    const [accessState, setAccessState] = useState<'idle' | 'checking' | 'allowed' | 'denied'>('idle');
    const [accessError, setAccessError] = useState('');
    const [order, setOrder] = useState<Record<string, unknown> | null>(null);
    const [saving, setSaving] = useState(false);
    const [complete, setComplete] = useState(false);

    const [profile, setProfile] = useState({ fullName: '', ageRange: '', country: '', language: 'English', phone: '' });
    const [measurements, setMeasurements] = useState({ unit: 'cm', height: '', weight: '', bust: '', waist: '', hips: '' });
    const [photos, setPhotos] = useState<{ headshot?: File; front?: File; side?: File; outfit?: File }>({});
    const [uploadedUrls, setUploadedUrls] = useState<Record<string, unknown>>({});
    const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
    const [coverage, setCoverage] = useState({ primary: 'No restrictions', specifics: [] as string[] });
    const [lifestyle, setLifestyle] = useState({
        occupation: '',
        occasions: [] as string[],
        shopFrequency: '',
        budget: '',
        hairTexture: '',
        hairColour: '',
        includeHair: true,
        shoppingRelationship: '',
        priorService: 'No prior colour analysis or styling service',
        priorServiceResult: '',
    });
    const [preferences, setPreferences] = useState<PreferenceState>(() => emptyPreferenceState());
    const [selectedMoodboard, setSelectedMoodboard] = useState('');
    const [secondaryElements, setSecondaryElements] = useState<string[]>([]);

    const progress = Math.round(((step + 1) / STEPS.length) * 100);
    const lifestyleReveal = {
        shopFrequency: Boolean(lifestyle.occupation),
        budget: Boolean(lifestyle.occupation && lifestyle.shopFrequency),
        shoppingRelationship: Boolean(lifestyle.occupation && lifestyle.shopFrequency && lifestyle.budget),
        occasions: Boolean(lifestyle.occupation && lifestyle.shopFrequency && lifestyle.budget && lifestyle.shoppingRelationship),
        hairTexture: Boolean(lifestyle.occasions.length > 0),
        hairColour: Boolean(lifestyle.hairTexture.trim()),
        priorService: Boolean(lifestyle.hairTexture.trim() && lifestyle.hairColour.trim()),
        priorServiceResult: lifestyle.priorService === 'Yes, I have tried one before',
    };

    const verifyAccess = useCallback(async (email: string, fallbackPhone = '') => {
        if (!email) return;
        setAccessState('checking');
        setAccessError('');
        try {
            const res = await fetch(`/api/stylist-intake?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Unable to verify purchase');
            setOrder(data.order);
            setProfile(prev => {
                const phone = String(data.order.customer_phone || prev.phone || fallbackPhone || '');
                return {
                    ...prev,
                    fullName: String(data.order.customer_name || prev.fullName || ''),
                    phone,
                    country: prev.country || deriveCountryFromPhone(phone),
                };
            });
            setAccessState('allowed');
        } catch (err) {
            setAccessState('denied');
            setAccessError(err instanceof Error ? err.message : 'Unable to verify purchase');
        }
    }, []);

    useEffect(() => {
        const email = searchParams.get('email') || localStorage.getItem('stylist_customerEmail') || '';
        const phone = searchParams.get('phone') || localStorage.getItem('stylist_customerPhone') || '';
        setAccessEmail(email);
        if (phone) {
            setProfile(prev => ({
                ...prev,
                phone: prev.phone || phone,
                country: prev.country || deriveCountryFromPhone(phone),
            }));
        }
        if (email) verifyAccess(email, phone);
    }, [searchParams, verifyAccess]);

    const toggleArray = <T extends string,>(value: T, values: T[], setter: (next: T[]) => void) => {
        setter(values.includes(value) ? values.filter(v => v !== value) : [...values, value]);
    };

    const setPreference = (categoryKey: string, optionKey: string, action: 'liked' | 'disliked' | 'skipped') => {
        setPreferences(prev => {
            const current = prev[categoryKey] || { liked: [], disliked: [], skipped: [] };
            const next = {
                liked: current.liked.filter(v => v !== optionKey),
                disliked: current.disliked.filter(v => v !== optionKey),
                skipped: current.skipped.filter(v => v !== optionKey),
            };
            next[action] = [...next[action], optionKey];
            return { ...prev, [categoryKey]: next };
        });
    };

    const recommendedBoards = useMemo(() => {
        const liked = Object.values(preferences).flatMap(group => group.liked);
        if (liked.some(v => v.includes('structured') || v.includes('minimal'))) return moodBoards;
        if (liked.some(v => v.includes('relaxed') || v.includes('soft') || v.includes('knit'))) return [moodBoards[1], moodBoards[0], moodBoards[2]];
        return [moodBoards[2], moodBoards[0], moodBoards[1]];
    }, [preferences]);

    const preferenceCategoryComplete = useMemo(() => {
        return Object.fromEntries(pieceCategories.map(category => {
            const state = preferences[category.key];
            const answeredCount = category.options.filter(([key]) =>
                state.liked.includes(key) || state.disliked.includes(key) || state.skipped.includes(key)
            ).length;
            return [category.key, answeredCount === category.options.length];
        }));
    }, [preferences]);

    const visiblePreferenceCategories = pieceCategories.filter((category, index) => {
        if (index === 0) return true;
        return Boolean(preferenceCategoryComplete[pieceCategories[index - 1].key]);
    });

    const preferenceSortingComplete = pieceCategories.every(category => preferenceCategoryComplete[category.key]);

    const uploadOne = async (file: File | undefined, key: string) => {
        if (!file) return null;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        return uploadStyleScanPhoto(file, `${Date.now()}_stylist_${key}_${safeName}`);
    };

    const uploadAllPhotos = async () => {
        if (Object.keys(uploadedUrls).length > 0) return uploadedUrls;
        const urls = {
            headshot: await uploadOne(photos.headshot, 'headshot'),
            full_body_front: await uploadOne(photos.front, 'front'),
            full_body_side: await uploadOne(photos.side, 'side'),
            one_outfit: await uploadOne(photos.outfit, 'one_outfit'),
        };
        setUploadedUrls(urls);
        return urls;
    };

    const submit = async () => {
        setSaving(true);
        setAccessError('');
        try {
            const photoUrls = await uploadAllPhotos();
            const selectedBoard = moodBoards.find(board => board.id === selectedMoodboard);
            const completionPercentage = selectedMoodboard ? 100 : Math.max(65, progress);
            const res = await fetch('/api/stylist-intake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_email: accessEmail,
                    customer_phone: profile.phone,
                    full_name: profile.fullName,
                    age_range: profile.ageRange,
                    country: profile.country,
                    primary_language: profile.language,
                    lead_id: order?.lead_id ?? null,
                    body_measurements: measurements,
                    photo_urls: photoUrls,
                    focus_areas: selectedFocus,
                    coverage_requirements: coverage,
                    lifestyle_context: {
                        occupation: lifestyle.occupation,
                        occasions: lifestyle.occasions,
                        shop_frequency: lifestyle.shopFrequency,
                        budget_per_outfit: lifestyle.budget,
                    },
                    piece_preferences: preferences,
                    selected_moodboard_id: selectedMoodboard,
                    selected_moodboard_label: selectedBoard?.label,
                    secondary_moodboard_elements: secondaryElements,
                    hair_context: {
                        texture: lifestyle.hairTexture,
                        colour: lifestyle.hairColour,
                        include_hair_direction: lifestyle.includeHair,
                    },
                    shopping_relationship: lifestyle.shoppingRelationship,
                    prior_styling_experience: {
                        used_before: lifestyle.priorService,
                        result: lifestyle.priorServiceResult,
                    },
                    one_outfit_image_url: (photoUrls.one_outfit as string | null) || null,
                    completion_percentage: completionPercentage,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Unable to save intake');
            setComplete(true);
        } catch (err) {
            setAccessError(err instanceof Error ? err.message : 'Unable to save intake');
        } finally {
            setSaving(false);
        }
    };

    if (accessState !== 'allowed') {
        return (
            <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white border border-luxury-cream rounded-2xl p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-luxury-charcoal/40 mb-3">ICONIK Intake</p>
                    <h1 className="luxury-heading text-2xl mb-3">Verify your Blueprint purchase</h1>
                    <p className="luxury-body text-sm text-luxury-charcoal/60 mb-5">Enter the email used at checkout.</p>
                    <input value={accessEmail} onChange={e => setAccessEmail(e.target.value)} className="w-full border-2 border-luxury-cream rounded-xl px-4 py-3 mb-3" placeholder="your@email.com" />
                    {accessError && <p className="text-sm text-red-600 mb-3">{accessError}</p>}
                    <button onClick={() => verifyAccess(accessEmail)} disabled={accessState === 'checking'} className="w-full bg-luxury-accent text-white rounded-full py-3 font-semibold">
                        {accessState === 'checking' ? 'Checking...' : 'Continue'}
                    </button>
                </div>
            </div>
        );
    }

    if (complete) {
        const board = moodBoards.find(item => item.id === selectedMoodboard);
        return (
            <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center px-4 text-center">
                <div className="max-w-xl">
                    <div className="w-20 h-20 rounded-full bg-luxury-accent/10 flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-luxury-accent" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-luxury-charcoal/40 mb-3">Style Direction Confirmed</p>
                    <h1 className="luxury-heading text-3xl md:text-5xl text-luxury-charcoal mb-4">{board?.label || 'Your ICONIK Direction'}</h1>
                    <p className="luxury-body text-luxury-charcoal/65 leading-relaxed">This, combined with your body geometry analysis, colour profile, and facial architecture, is the foundation of your Blueprint. We will have it with you within 24 hours.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
            <header className="sticky top-0 z-30 bg-luxury-warm-white/95 backdrop-blur border-b border-luxury-cream">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="luxury-heading text-2xl">ICONIK</span>
                        <span className="text-xs luxury-body text-luxury-charcoal/45">{STEPS[step]} · {progress}%</span>
                    </div>
                    <div className="h-1.5 bg-luxury-cream rounded-full overflow-hidden">
                        <div className="h-full bg-luxury-accent transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white border border-luxury-cream rounded-2xl p-5 md:p-8">
                    {step === 0 && (
                        <section className="space-y-5">
                            <h1 className="luxury-heading text-3xl">Basic profile</h1>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input className="border-2 border-luxury-cream rounded-xl px-4 py-3" placeholder="Full name" value={profile.fullName} onChange={e => setProfile({ ...profile, fullName: e.target.value })} />
                                <select className="border-2 border-luxury-cream rounded-xl px-4 py-3" value={profile.ageRange} onChange={e => setProfile({ ...profile, ageRange: e.target.value })}>
                                    <option value="">Age range</option>
                                    {['20s', '30s', '40s', '50s', '60+'].map(item => <option key={item}>{item}</option>)}
                                </select>
                                <input className="border-2 border-luxury-cream rounded-xl px-4 py-3" placeholder="Country of residence" value={profile.country} onChange={e => setProfile({ ...profile, country: e.target.value })} />
                                <input className="border-2 border-luxury-cream rounded-xl px-4 py-3" placeholder="Primary language" value={profile.language} onChange={e => setProfile({ ...profile, language: e.target.value })} />
                            </div>
                        </section>
                    )}

                    {step === 1 && (
                        <section className="space-y-5">
                            <h1 className="luxury-heading text-3xl">Body measurements</h1>
                            <p className="luxury-body text-luxury-charcoal/60">Optional, but the more precise your Blueprint, the more specific your outfit formulas.</p>
                            <div className="flex gap-2">
                                {['cm', 'in'].map(unit => <ToggleButton key={unit} active={measurements.unit === unit} onClick={() => setMeasurements({ ...measurements, unit })}>{unit.toUpperCase()}</ToggleButton>)}
                            </div>
                            <div className="grid md:grid-cols-5 gap-4">
                                {['height', 'weight', 'bust', 'waist', 'hips'].map(field => (
                                    <input key={field} className="border-2 border-luxury-cream rounded-xl px-4 py-3" placeholder={field} value={measurements[field as keyof typeof measurements]} onChange={e => setMeasurements({ ...measurements, [field]: e.target.value })} />
                                ))}
                            </div>
                        </section>
                    )}

                    {step === 2 && (
                        <section className="space-y-5">
                            <h1 className="luxury-heading text-3xl">Body photos</h1>
                            <p className="luxury-body text-luxury-charcoal/60">Phone photos are perfect. Headshot and side profile matter most here; the front photo helps complete the body analysis.</p>
                            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                                <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
                                    {(['headshot', 'front'] as const).map(key => {
                                        const field = photoUploadFields.find(item => item.key === key);
                                        if (!field) return null;
                                        return (
                                            <PhotoUploadCard
                                                key={field.key}
                                                field={field}
                                                fileName={photos[field.key]?.name}
                                                featured
                                                onChange={file => setPhotos({ ...photos, [field.key]: file })}
                                            />
                                        );
                                    })}
                                </div>
                                {(() => {
                                    const field = photoUploadFields.find(item => item.key === 'side');
                                    if (!field) return null;
                                    return (
                                        <div className="sm:max-w-md lg:max-w-none">
                                            <PhotoUploadCard
                                                field={field}
                                                fileName={photos.side?.name}
                                                onChange={file => setPhotos({ ...photos, side: file })}
                                            />
                                        </div>
                                    );
                                })()}
                            </div>
                        </section>
                    )}

                    {step === 3 && (
                        <section className="space-y-5">
                            <h1 className="luxury-heading text-3xl">One outfit you love</h1>
                            <p className="luxury-body text-luxury-charcoal/60">Upload one outfit you already feel good in. This replaces the old wardrobe sample upload.</p>
                            <div className="max-w-xl">
                                {(() => {
                                    const field = photoUploadFields.find(item => item.key === 'outfit');
                                    if (!field) return null;
                                    return (
                                        <PhotoUploadCard
                                            field={field}
                                            fileName={photos.outfit?.name}
                                            featured
                                            onChange={file => setPhotos({ ...photos, outfit: file })}
                                        />
                                    );
                                })()}
                            </div>
                        </section>
                    )}

                    {step === 4 && (
                        <section className="space-y-6">
                            <h1 className="luxury-heading text-3xl">Physical context</h1>
                            <p className="luxury-body text-luxury-charcoal/60">Tap whatever your eye goes to first. You can choose more than one.</p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {focusAreas.map(item => (
                                    <FocusCard
                                        key={item.value}
                                        item={item}
                                        active={selectedFocus.includes(item.value)}
                                        onClick={() => toggleArray(item.value, selectedFocus, setSelectedFocus)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {step === 5 && (
                        <section className="space-y-6">
                            <h1 className="luxury-heading text-3xl">Coverage requirements</h1>
                            <p className="luxury-body text-luxury-charcoal/60">Tell us what needs to be respected before we build silhouettes.</p>
                            <div className="grid md:grid-cols-2 gap-3">
                                {['No restrictions', 'I prefer to cover my arms', 'I prefer to cover my legs / knees', 'I observe full modesty', 'Specific religious/cultural requirements'].map(item => (
                                    <ToggleButton key={item} active={coverage.primary === item} onClick={() => setCoverage({ ...coverage, primary: item })}>{item}</ToggleButton>
                                ))}
                            </div>
                            {coverage.primary !== 'No restrictions' && (
                                <div>
                                    <p className="font-semibold luxury-body mb-3">Specific areas</p>
                                    <div className="grid md:grid-cols-4 gap-2">
                                        {['Upper arms', 'Neckline', 'Legs / knees', 'Overall fit'].map(item => (
                                            <ToggleButton key={item} active={coverage.specifics.includes(item)} onClick={() => toggleArray(item, coverage.specifics, next => setCoverage({ ...coverage, specifics: next }))}>{item}</ToggleButton>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {step === 6 && (
                        <section className="space-y-5">
                            <h1 className="luxury-heading text-3xl">Lifestyle and shopping</h1>
                            <div className="space-y-5">
                                <div className="rounded-2xl border border-luxury-cream bg-luxury-warm-white/40 p-4">
                                    <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-luxury-charcoal/40">1 of 8</p>
                                    <select className="w-full border-2 border-luxury-cream rounded-xl px-4 py-3 bg-white" value={lifestyle.occupation} onChange={e => setLifestyle({ ...lifestyle, occupation: e.target.value })}>
                                        <option value="">Occupation context</option>
                                        {['Office / Corporate', 'Business Casual', 'Creative Industry', 'Work From Home', 'Homemaker', 'Student', 'Mixed'].map(item => <option key={item}>{item}</option>)}
                                    </select>
                                </div>

                                {lifestyleReveal.shopFrequency && (
                                    <div className="rounded-2xl border border-luxury-cream bg-luxury-warm-white/40 p-4">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-luxury-charcoal/40">2 of 8</p>
                                        <select className="w-full border-2 border-luxury-cream rounded-xl px-4 py-3 bg-white" value={lifestyle.shopFrequency} onChange={e => setLifestyle({ ...lifestyle, shopFrequency: e.target.value })}>
                                            <option value="">How often do you shop?</option>
                                            {['Once a month', 'Every few months', 'Seasonally', 'Rarely, mostly wear what I have'].map(item => <option key={item}>{item}</option>)}
                                        </select>
                                    </div>
                                )}

                                {lifestyleReveal.budget && (
                                    <div className="rounded-2xl border border-luxury-cream bg-luxury-warm-white/40 p-4">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-luxury-charcoal/40">3 of 8</p>
                                        <select className="w-full border-2 border-luxury-cream rounded-xl px-4 py-3 bg-white" value={lifestyle.budget} onChange={e => setLifestyle({ ...lifestyle, budget: e.target.value })}>
                                            <option value="">Budget per outfit</option>
                                            {['Under $50', '$50-150', '$150-300', '$300+'].map(item => <option key={item}>{item}</option>)}
                                        </select>
                                    </div>
                                )}

                                {lifestyleReveal.shoppingRelationship && (
                                    <div className="rounded-2xl border border-luxury-cream bg-luxury-warm-white/40 p-4">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-luxury-charcoal/40">4 of 8</p>
                                        <select className="w-full border-2 border-luxury-cream rounded-xl px-4 py-3 bg-white" value={lifestyle.shoppingRelationship} onChange={e => setLifestyle({ ...lifestyle, shoppingRelationship: e.target.value })}>
                                            <option value="">When shopping, I feel...</option>
                                            {['Overwhelmed', 'Purposeful', 'Excited', 'Anxious', 'I mostly shop online'].map(item => <option key={item}>{item}</option>)}
                                        </select>
                                    </div>
                                )}

                                {lifestyleReveal.occasions && (
                                    <div className="rounded-2xl border border-luxury-cream bg-luxury-warm-white/40 p-4">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-luxury-charcoal/40">5 of 8</p>
                                        <p className="mb-3 font-semibold luxury-body">Where do you most need outfits to work?</p>
                                        <div className="grid md:grid-cols-2 gap-3">{occasionOptions.map(item => <ToggleButton key={item} active={lifestyle.occasions.includes(item)} onClick={() => toggleArray(item, lifestyle.occasions, next => setLifestyle({ ...lifestyle, occasions: next }))}>{item}</ToggleButton>)}</div>
                                    </div>
                                )}

                                {lifestyleReveal.hairTexture && (
                                    <div className="rounded-2xl border border-luxury-cream bg-luxury-warm-white/40 p-4">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-luxury-charcoal/40">6 of 8</p>
                                        <input className="w-full border-2 border-luxury-cream rounded-xl px-4 py-3 bg-white" placeholder="Natural hair texture" value={lifestyle.hairTexture} onChange={e => setLifestyle({ ...lifestyle, hairTexture: e.target.value })} />
                                    </div>
                                )}

                                {lifestyleReveal.hairColour && (
                                    <div className="rounded-2xl border border-luxury-cream bg-luxury-warm-white/40 p-4">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-luxury-charcoal/40">7 of 8</p>
                                        <input className="w-full border-2 border-luxury-cream rounded-xl px-4 py-3 bg-white" placeholder="Current hair colour" value={lifestyle.hairColour} onChange={e => setLifestyle({ ...lifestyle, hairColour: e.target.value })} />
                                    </div>
                                )}

                                {lifestyleReveal.priorService && (
                                    <div className="rounded-2xl border border-luxury-cream bg-luxury-warm-white/40 p-4">
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-luxury-charcoal/40">8 of 8</p>
                                        <select className="w-full border-2 border-luxury-cream rounded-xl px-4 py-3 bg-white" value={lifestyle.priorService} onChange={e => setLifestyle({ ...lifestyle, priorService: e.target.value, priorServiceResult: e.target.value === 'Yes, I have tried one before' ? lifestyle.priorServiceResult : '' })}>
                                            <option>No prior colour analysis or styling service</option>
                                            <option>Yes, I have tried one before</option>
                                        </select>
                                        {lifestyleReveal.priorServiceResult && (
                                            <select className="mt-3 w-full border-2 border-luxury-cream rounded-xl px-4 py-3 bg-white" value={lifestyle.priorServiceResult} onChange={e => setLifestyle({ ...lifestyle, priorServiceResult: e.target.value })}>
                                                <option value="">If yes, did it work?</option>
                                                {['Yes', 'Partially', 'No'].map(item => <option key={item}>{item}</option>)}
                                            </select>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {step === 7 && (
                        <section className="space-y-6">
                            <div>
                                <h1 className="luxury-heading text-3xl mb-2">Style preference sorting</h1>
                                <p className="luxury-body text-luxury-charcoal/60">This is not about what you currently own. Trust your first reaction.</p>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-luxury-cream bg-luxury-warm-white/45 p-4">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-luxury-accent text-white">
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                                <p className="luxury-body text-sm leading-relaxed text-luxury-charcoal/70">
                                    For each piece, choose <strong className="text-luxury-charcoal">Like</strong>, <strong className="text-luxury-charcoal">No</strong>, or <strong className="text-luxury-charcoal">Skip</strong>. Complete this section to unlock the next one.
                                </p>
                            </div>
                            {visiblePreferenceCategories.map((category, categoryIndex) => {
                                const answeredCount = category.options.filter(([key]) => {
                                    const state = preferences[category.key];
                                    return state.liked.includes(key) || state.disliked.includes(key) || state.skipped.includes(key);
                                }).length;
                                return (
                                <div key={category.key} className="rounded-2xl border border-luxury-cream bg-white p-4">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-luxury-charcoal/40">Section {categoryIndex + 1} of {pieceCategories.length}</p>
                                            <h2 className="luxury-heading text-2xl text-luxury-charcoal">{category.title}</h2>
                                        </div>
                                        <span className="rounded-full bg-luxury-cream/60 px-3 py-1 text-xs font-semibold text-luxury-charcoal/55">
                                            {answeredCount}/{category.options.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {category.options.map(([key, label, image]) => {
                                            const state = preferences[category.key];
                                            const activeAction = state.liked.includes(key) ? 'liked' : state.disliked.includes(key) ? 'disliked' : state.skipped.includes(key) ? 'skipped' : '';
                                            return (
                                                <div key={key} className="border border-luxury-cream rounded-xl overflow-hidden bg-white">
                                                    <div className="relative aspect-[4/5]"><Image src={image} alt={label} fill className="object-cover" /></div>
                                                    <div className="p-3">
                                                        <p className="text-sm font-semibold luxury-body mb-2">{label}</p>
                                                        <div className="grid grid-cols-3 gap-1 text-[11px]">
                                                            {(['liked', 'disliked', 'skipped'] as const).map(action => (
                                                                <button key={action} type="button" onClick={() => setPreference(category.key, key, action)} className={`rounded-full border py-1 ${activeAction === action ? 'border-luxury-accent bg-luxury-pink-bg' : 'border-luxury-cream'}`}>
                                                                    {action === 'liked' ? 'Like' : action === 'disliked' ? 'No' : 'Skip'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {preferenceCategoryComplete[category.key] && categoryIndex < pieceCategories.length - 1 && (
                                        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-luxury-accent">
                                            <Check className="h-4 w-4" />
                                            Next section unlocked
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </section>
                    )}

                    {step === 8 && (
                        <section className="space-y-5">
                            <h1 className="luxury-heading text-3xl">Approve your style direction</h1>
                            <div className="grid md:grid-cols-3 gap-4">
                                {recommendedBoards.map(board => (
                                    <button key={board.id} type="button" onClick={() => setSelectedMoodboard(board.id)} className={`text-left border-2 rounded-2xl overflow-hidden ${selectedMoodboard === board.id ? 'border-luxury-accent' : 'border-luxury-cream'}`}>
                                        <div className="grid grid-cols-2">
                                            {board.images.map(image => <div key={image} className="relative aspect-square"><Image src={image} alt={board.label} fill className="object-cover" /></div>)}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex gap-1 mb-3">{board.colours.map(colour => <span key={colour} className="h-4 flex-1 rounded" style={{ backgroundColor: colour }} />)}</div>
                                            <p className="luxury-heading text-lg">{board.label}</p>
                                            <p className="text-xs luxury-body text-luxury-charcoal/50">{board.words.join(' · ')}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div>
                                <p className="font-semibold luxury-body mb-2">Elements I also like</p>
                                <div className="flex flex-wrap gap-2">{recommendedBoards.flatMap(board => board.words).map(word => <ToggleButton key={word} active={secondaryElements.includes(word)} onClick={() => toggleArray(word, secondaryElements, setSecondaryElements)}>{word}</ToggleButton>)}</div>
                            </div>
                        </section>
                    )}

                    {accessError && <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm luxury-body">{accessError}</div>}

                    <div className="flex justify-between gap-3 mt-8">
                        <button type="button" disabled={step === 0 || saving} onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 rounded-full border-2 border-luxury-cream px-5 py-3 disabled:opacity-40">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        {step < STEPS.length - 1 ? (
                            <button type="button" disabled={saving || (step === 7 && !preferenceSortingComplete)} onClick={() => setStep(step + 1)} className="inline-flex items-center gap-2 rounded-full bg-luxury-accent text-white px-7 py-3 font-semibold disabled:opacity-50">
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button type="button" disabled={saving || !selectedMoodboard} onClick={submit} className="inline-flex items-center gap-2 rounded-full bg-luxury-accent text-white px-7 py-3 font-semibold disabled:opacity-50">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Confirm Direction <Check className="w-4 h-4" /></>}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function StylistIntakePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-luxury-warm-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-luxury-accent" /></div>}>
            <StylistIntakeInner />
        </Suspense>
    );
}
