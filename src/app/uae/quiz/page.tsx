'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle, Upload, Info } from 'lucide-react';
import { trackCTAClick, trackPageView } from '@/lib/metaPixel';
import { getQuizPhoto, saveQuizPhoto } from '@/lib/uaeQuizStorage';

interface QuizData {
  fullBodyUploaded?: boolean;
  headshotUploaded?: boolean;
  heightCm?: number;
  weightAreas?: string[];
  bodyShape?: string;
  skinTone?: string;
  undertone?: string;
  hairTexture?: string;
  routine?: string;
  dressUpFrequency?: string;
  stylingFrustration?: string;
  avoidStyles?: string[];
  favoriteColors?: string;
  occasions?: string[];
}

const TOTAL_STEPS = 14;
const QUIZ_STORAGE_KEY = 'uaeStyleQuizData';
const QUIZ_COMPLETED_KEY = 'uaeStyleQuizCompleted';

const heightOptions = Array.from({ length: 42 }, (_, index) => 147 + index); // 147cm to 188cm

const weightAreas = [
  'Shoulders/Upper Body',
  'Bust',
  'Waist/Midsection',
  'Hips/Thighs',
  'Evenly Distributed',
  "I'm not sure – let the stylists analyze"
];

const bodyShapes = [
  'Hourglass',
  'Pear',
  'Apple',
  'Rectangle',
  'Inverted Triangle',
  "I'm not sure – let the stylists tell me! ✨"
];

const skinTones = [
  'Fair (Light beige)',
  'Medium (Warm tan)',
  'Tan (Deep caramel)',
  'Deep (Rich brown)'
];

const undertones = [
  'Warm (Gold jewelry looks better on me)',
  'Cool (Silver jewelry looks better on me)',
  'Neutral (Both look good)',
  "I'm not sure – analyze from my photo"
];

const hairTextures = ['Straight', 'Wavy', 'Curly', 'Coily', 'Scanty/Thin'];

const routines = [
  'Corporate Professional (Office 5 days/week)',
  'Creative Professional (Flexible dress code)',
  'Stay-at-Home/Casual Lifestyle',
  'Mix of Professional & Casual'
];

const dressUpFrequencyOptions = [
  'Daily (Work requires it)',
  '2-3 times per week',
  'Only for special occasions',
  'Rarely – I prefer comfort'
];

const avoidStylesOptions = [
  'Sleeveless Tops',
  'Crop Tops',
  'Short Skirts/Dresses (above knee)',
  'Low Necklines',
  'Backless Outfits',
  'Sheer/Transparent Fabrics',
  'Tight-Fitting Clothes',
  "None – I'm open to everything"
];

const occasionOptions = [
  'Work Meetings/Office',
  'Family Functions/Weddings',
  'Date Nights/Romantic Outings',
  'Casual Outings (Brunch, Shopping)',
  'Religious/Cultural Events',
  'Formal Dinners/Galas',
  'Gym/Athleisure'
];

export default function UaeQuizPage() {
  const [step, setStep] = useState<number | 'intro'>('intro');
  const [quizData, setQuizData] = useState<QuizData>({
    heightCm: 163,
    bodyShape: "I'm not sure – let the stylists tell me! ✨",
    weightAreas: [],
    avoidStyles: [],
    occasions: []
  });
  const [error, setError] = useState<string | null>(null);
  const [fullBodyPreview, setFullBodyPreview] = useState<string | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);

  useEffect(() => {
    trackPageView('UAE Quiz');
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as QuizData;
        setQuizData({
          heightCm: parsed.heightCm || 163,
          bodyShape: parsed.bodyShape || \"I'm not sure – let the stylists tell me! ✨\",
          ...parsed,
          weightAreas: parsed.weightAreas || [],
          avoidStyles: parsed.avoidStyles || [],
          occasions: parsed.occasions || []
        });
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (step !== 'intro') {
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizData));
    }
  }, [quizData, step]);

  useEffect(() => {
    const loadPreviews = async () => {
      const fullBody = await getQuizPhoto('fullBody');
      const headshot = await getQuizPhoto('headshot');
      if (fullBody) {
        setFullBodyPreview(URL.createObjectURL(fullBody));
        setQuizData((prev) => ({ ...prev, fullBodyUploaded: true }));
      }
      if (headshot) {
        setHeadshotPreview(URL.createObjectURL(headshot));
        setQuizData((prev) => ({ ...prev, headshotUploaded: true }));
      }
    };

    loadPreviews();
  }, []);

  const progress = useMemo(() => {
    if (step === 'intro') return 0;
    return Math.round(((step + 1) / TOTAL_STEPS) * 100);
  }, [step]);

  const handlePhotoUpload = async (
    key: 'fullBody' | 'headshot',
    file: File | null,
    setPreview: (value: string | null) => void,
    flagKey: 'fullBodyUploaded' | 'headshotUploaded'
  ) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Please upload an image smaller than 10MB.');
      return;
    }
    await saveQuizPhoto(key, file);
    setPreview(URL.createObjectURL(file));
    setQuizData((prev) => ({ ...prev, [flagKey]: true }));
    setError(null);
  };

  const toggleMultiSelect = (key: keyof QuizData, value: string) => {
    setQuizData((prev) => {
      const current = (prev[key] as string[]) || [];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((item) => item !== value) };
      }
      return { ...prev, [key]: [...current, value] };
    });
  };

  const toggleOccasion = (value: string) => {
    setQuizData((prev) => {
      const current = prev.occasions || [];
      if (current.includes(value)) {
        return { ...prev, occasions: current.filter((item) => item !== value) };
      }
      if (current.length >= 3) {
        setError('Select up to 3 occasions.');
        return prev;
      }
      setError(null);
      return { ...prev, occasions: [...current, value] };
    });
  };

  const validateStep = () => {
    setError(null);
    if (step === 0 && !quizData.fullBodyUploaded) {
      setError('Please upload your full-body photo.');
      return false;
    }
    if (step === 1 && !quizData.headshotUploaded) {
      setError('Please upload your headshot.');
      return false;
    }
    if (step === 2 && !quizData.heightCm) {
      setError('Please select your height.');
      return false;
    }
    if (step === 3 && (!quizData.weightAreas || quizData.weightAreas.length === 0)) {
      setError('Please select at least one area.');
      return false;
    }
    if (step === 5 && !quizData.skinTone) {
      setError('Please select a skin tone.');
      return false;
    }
    if (step === 6 && !quizData.undertone) {
      setError('Please select your undertone.');
      return false;
    }
    if (step === 7 && !quizData.hairTexture) {
      setError('Please select your hair texture.');
      return false;
    }
    if (step === 8 && !quizData.routine) {
      setError('Please select your daily routine.');
      return false;
    }
    if (step === 9 && !quizData.dressUpFrequency) {
      setError('Please select how often you dress up.');
      return false;
    }
    if (step === 10 && !quizData.stylingFrustration) {
      setError('Please share your biggest styling frustration.');
      return false;
    }
    if (step === 11 && (!quizData.avoidStyles || quizData.avoidStyles.length === 0)) {
      setError('Please select at least one option.');
      return false;
    }
    if (step === 12 && !quizData.favoriteColors) {
      setError('Please share the colors you love wearing.');
      return false;
    }
    if (step === 13 && (!quizData.occasions || quizData.occasions.length === 0)) {
      setError('Please select up to 3 occasions.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 'intro') {
      setStep(0);
      return;
    }
    if (!validateStep()) return;
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem(QUIZ_COMPLETED_KEY, 'true');
      trackCTAClick('Quiz Completed', 'Quiz', 179, 'AED', 'UAE');
      setStep(TOTAL_STEPS);
    }
  };

  const handleBack = () => {
    if (step === 'intro') return;
    if (step === 0) {
      setStep('intro');
      return;
    }
    if (typeof step === 'number' && step > 0) {
      setStep(step - 1);
    }
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl text-center">
          <h1 className="text-3xl md:text-4xl luxury-heading mb-4">Let's build your Style Blueprint</h1>
          <p className="luxury-body text-luxury-charcoal/70 mb-6">
            This will take 3 minutes. Our stylist team will review your answers to create a personalized report.
          </p>
          <button
            onClick={handleNext}
            className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-4 rounded-full luxury-body text-lg transition-all"
          >
            Let's Start <ArrowRight className="ml-3 h-5 w-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === TOTAL_STEPS) {
    return (
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl text-center">
          <CheckCircle className="w-16 h-16 text-luxury-accent mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl luxury-heading mb-4">Perfect! Your Answers Are Saved.</h1>
          <p className="luxury-body text-luxury-charcoal/70 mb-6">
            Our stylist team is ready to curate your personalized Style Blueprint. Complete your order to receive it within 48 hours.
          </p>
          <Link
            href="/uae/checkout"
            className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-4 rounded-full luxury-body text-lg transition-all"
          >
            COMPLETE YOUR ORDER (AED 179) <ArrowRight className="ml-3 h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-2 text-luxury-charcoal/70">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="text-sm luxury-body text-luxury-charcoal/70">Step {step + 1} of {TOTAL_STEPS}</div>
        </div>
        <div className="h-1 bg-luxury-cream">
          <div className="h-1 bg-luxury-accent" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">Upload Your Full-Body Photo</h2>
            <p className="luxury-body text-luxury-charcoal/70">
              Upload a recent full-body photo (front-facing, arms relaxed by your sides). Wear fitted clothing so our stylists can analyze your proportions accurately.
            </p>
            <div className="bg-white border border-luxury-cream rounded-3xl p-6 text-center">
              {fullBodyPreview ? (
                <img src={fullBodyPreview} alt="Full body preview" className="w-full max-h-80 object-contain rounded-2xl" />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-luxury-accent" />
                  <p className="luxury-body text-luxury-charcoal/60">Drag & drop or click to upload</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="mt-4 w-full luxury-body"
                onChange={(event) =>
                  handlePhotoUpload('fullBody', event.target.files?.[0] || null, setFullBodyPreview, 'fullBodyUploaded')
                }
              />
              <div className="flex items-start gap-2 mt-4 text-xs text-luxury-charcoal/60">
                <Info className="w-4 h-4" />
                <p>This helps us identify your body shape so we can recommend silhouettes that flatter YOUR proportions.</p>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">Upload Your Headshot</h2>
            <p className="luxury-body text-luxury-charcoal/70">
              Upload a clear headshot (shoulders up, neutral expression, hair pulled back if possible).
            </p>
            <div className="bg-white border border-luxury-cream rounded-3xl p-6 text-center">
              {headshotPreview ? (
                <img src={headshotPreview} alt="Headshot preview" className="w-full max-h-80 object-contain rounded-2xl" />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-luxury-accent" />
                  <p className="luxury-body text-luxury-charcoal/60">Drag & drop or click to upload</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="mt-4 w-full luxury-body"
                onChange={(event) =>
                  handlePhotoUpload('headshot', event.target.files?.[0] || null, setHeadshotPreview, 'headshotUploaded')
                }
              />
              <div className="flex items-start gap-2 mt-4 text-xs text-luxury-charcoal/60">
                <Info className="w-4 h-4" />
                <p>This helps us analyze your face shape and recommend hairstyles, necklines, and eyewear that complement your features.</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">What's Your Height?</h2>
            <p className="luxury-body text-luxury-charcoal/70">Select your height in centimeters.</p>
            <select
              value={quizData.heightCm || ''}
              onChange={(event) => setQuizData((prev) => ({ ...prev, heightCm: Number(event.target.value) }))}
              className="w-full border border-luxury-cream rounded-2xl p-4 luxury-body"
            >
              <option value="" disabled>Select your height</option>
              {heightOptions.map((height) => (
                <option key={height} value={height}>{height} cm</option>
              ))}
            </select>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">Where Do You Tend to Carry Weight?</h2>
            <p className="luxury-body text-luxury-charcoal/70">Select all that apply.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {weightAreas.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleMultiSelect('weightAreas', option)}
                  className={`border rounded-2xl p-4 text-left luxury-body transition-all ${quizData.weightAreas?.includes(option) ? 'border-luxury-accent bg-luxury-cream/50' : 'border-luxury-cream bg-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">If You Know Your Body Shape, Select It (Optional)</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {bodyShapes.map((option) => (
                <button
                  key={option}
                  onClick={() => setQuizData((prev) => ({ ...prev, bodyShape: option }))}
                  className={`border rounded-2xl p-4 text-left luxury-body transition-all ${quizData.bodyShape === option ? 'border-luxury-accent bg-luxury-cream/50' : 'border-luxury-cream bg-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">How Would You Describe Your Skin Tone?</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {skinTones.map((option) => (
                <button
                  key={option}
                  onClick={() => setQuizData((prev) => ({ ...prev, skinTone: option }))}
                  className={`border rounded-2xl p-4 text-left luxury-body transition-all ${quizData.skinTone === option ? 'border-luxury-accent bg-luxury-cream/50' : 'border-luxury-cream bg-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">What's Your Undertone?</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {undertones.map((option) => (
                <button
                  key={option}
                  onClick={() => setQuizData((prev) => ({ ...prev, undertone: option }))}
                  className={`border rounded-2xl p-4 text-left luxury-body transition-all ${quizData.undertone === option ? 'border-luxury-accent bg-luxury-cream/50' : 'border-luxury-cream bg-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">What's Your Natural Hair Texture?</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {hairTextures.map((option) => (
                <button
                  key={option}
                  onClick={() => setQuizData((prev) => ({ ...prev, hairTexture: option }))}
                  className={`border rounded-2xl p-4 text-left luxury-body transition-all ${quizData.hairTexture === option ? 'border-luxury-accent bg-luxury-cream/50' : 'border-luxury-cream bg-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">What Best Describes Your Daily Routine?</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {routines.map((option) => (
                <button
                  key={option}
                  onClick={() => setQuizData((prev) => ({ ...prev, routine: option }))}
                  className={`border rounded-2xl p-4 text-left luxury-body transition-all ${quizData.routine === option ? 'border-luxury-accent bg-luxury-cream/50' : 'border-luxury-cream bg-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">How Often Do You Dress Up?</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {dressUpFrequencyOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setQuizData((prev) => ({ ...prev, dressUpFrequency: option }))}
                  className={`border rounded-2xl p-4 text-left luxury-body transition-all ${quizData.dressUpFrequency === option ? 'border-luxury-accent bg-luxury-cream/50' : 'border-luxury-cream bg-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 10 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">What's Your Biggest Styling Frustration?</h2>
            <textarea
              value={quizData.stylingFrustration || ''}
              onChange={(event) => setQuizData((prev) => ({ ...prev, stylingFrustration: event.target.value.slice(0, 200) }))}
              placeholder="Example: 'Nothing fits my arms properly' or 'I look frumpy in Indian wear'"
              className="w-full border border-luxury-cream rounded-2xl p-4 luxury-body min-h-[140px]"
            />
            <p className="text-xs text-luxury-charcoal/50">{(quizData.stylingFrustration || '').length}/200</p>
          </div>
        )}

        {step === 11 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">Are There Any Styles You Prefer to Avoid?</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {avoidStylesOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleMultiSelect('avoidStyles', option)}
                  className={`border rounded-2xl p-4 text-left luxury-body transition-all ${quizData.avoidStyles?.includes(option) ? 'border-luxury-accent bg-luxury-cream/50' : 'border-luxury-cream bg-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 12 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">What Colors Do You Love Wearing?</h2>
            <textarea
              value={quizData.favoriteColors || ''}
              onChange={(event) => setQuizData((prev) => ({ ...prev, favoriteColors: event.target.value.slice(0, 100) }))}
              placeholder="Example: Black, navy, maroon, pastels, jewel tones..."
              className="w-full border border-luxury-cream rounded-2xl p-4 luxury-body min-h-[120px]"
            />
            <p className="text-xs text-luxury-charcoal/50">{(quizData.favoriteColors || '').length}/100</p>
          </div>
        )}

        {step === 13 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl luxury-heading">What Occasions Do You Dress For Most? (Select Top 3)</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {occasionOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleOccasion(option)}
                  className={`border rounded-2xl p-4 text-left luxury-body transition-all ${quizData.occasions?.includes(option) ? 'border-luxury-accent bg-luxury-cream/50' : 'border-luxury-cream bg-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 luxury-body">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-full border border-luxury-cream luxury-body text-luxury-charcoal/70 hover:text-luxury-charcoal"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-3 rounded-full bg-luxury-accent text-luxury-warm-white luxury-body hover:bg-luxury-accent/80 inline-flex items-center"
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
