'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X, ArrowRight, ArrowLeft, Loader2, CheckCircle, Sparkles } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Headshot', 'Full body', 'Measurements', 'Done'];

function PhotoUploader({
  label,
  hint,
  file,
  preview,
  onFile,
  onClear,
}: {
  label: string;
  hint: string;
  file: File | null;
  preview: string;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = useCallback((f: File) => {
    if (f.type.startsWith('image/')) onFile(f);
  }, [onFile]);

  return (
    <div>
      <p className="text-xs font-bold text-[#4a2c3e] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs text-[#4a2c3e]/50 mb-3 leading-relaxed">{hint}</p>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) accept(f); }}
        onClick={() => !preview && ref.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl flex items-center justify-center min-h-[200px] transition-all duration-200
          ${preview
            ? 'border-[#ff6b9d] cursor-default bg-[#fff9f5]'
            : `cursor-pointer ${dragging ? 'border-[#ff6b9d] bg-[#fff0f5]' : 'border-[#ffb3d1] hover:border-[#ff6b9d] hover:bg-[#fff9f5]'}`
          }`}
      >
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) accept(f); }} />

        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="max-h-56 max-w-full rounded-xl object-contain py-4" />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onClear(); }}
              className="absolute top-3 right-3 w-7 h-7 bg-[#4a2c3e] text-white rounded-full flex items-center justify-center hover:bg-[#ff6b9d] transition-colors shadow-sm"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <div className="text-center p-8">
            <div className="w-12 h-12 bg-[#fff0f5] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ImagePlus size={22} className="text-[#ffb3d1]" />
            </div>
            <p className="text-sm font-medium text-[#4a2c3e]/60">Tap to upload or drag & drop</p>
            <p className="text-xs text-[#4a2c3e]/35 mt-1">JPEG, PNG, or WebP</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep]             = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const [headshot, setHeadshot]         = useState<File | null>(null);
  const [headshotPrev, setHeadshotPrev] = useState('');
  const [bodyPhoto, setBodyPhoto]       = useState<File | null>(null);
  const [bodyPrev, setBodyPrev]         = useState('');

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bust,   setBust]   = useState('');
  const [waist,  setWaist]  = useState('');
  const [hips,   setHips]   = useState('');

  useEffect(() => {
    fetch('/api/iconik-club/clients/profile')
      .then(r => r.json())
      .then(d => {
        if (d.profile?.onboarding_complete) {
          router.replace('/iconik-club/client/outfits');
        }
      });
  }, [router]);

  const setHeadshotFile = useCallback((f: File) => {
    setHeadshot(f);
    setHeadshotPrev(URL.createObjectURL(f));
  }, []);

  const setBodyFile = useCallback((f: File) => {
    setBodyPhoto(f);
    setBodyPrev(URL.createObjectURL(f));
  }, []);

  const handleSubmit = async () => {
    if (!headshot || !bodyPhoto) { setError('Both photos are required.'); return; }
    setError('');
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('headshot',   headshot);
      fd.append('body_photo', bodyPhoto);
      fd.append('name',       '');
      if (height) fd.append('height_cm', height);
      if (weight) fd.append('weight_kg', weight);
      if (bust)   fd.append('bust_cm',   bust);
      if (waist)  fd.append('waist_cm',  waist);
      if (hips)   fd.append('hips_cm',   hips);

      const res  = await fetch('/api/iconik-club/clients/onboard', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setSubmitting(false); return; }

      setStep(4);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-[#ffb3d1] bg-white text-[#4a2c3e] text-sm outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition placeholder:text-[#4a2c3e]/30";

  const continueBtnCls = "flex-1 flex items-center justify-center gap-2 py-3 bg-[#ff6b9d] hover:bg-[#e85a8a] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-[#ff6b9d]/20";
  const backBtnCls = "flex items-center gap-1.5 px-4 py-3 border border-[#ffb3d1] text-[#4a2c3e]/60 text-sm rounded-xl hover:bg-[#fff0f5] hover:text-[#4a2c3e] transition-colors";

  return (
    <div className="min-h-screen bg-[#fff9f5] flex flex-col items-center py-10 px-4" style={{ fontFamily: 'var(--font-inter)' }}>

      {/* Progress indicator */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between relative">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-4 h-px bg-[#ffb3d1]/50 -z-0" />
          <div
            className="absolute left-0 top-4 h-px bg-[#ff6b9d] -z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / (STEP_LABELS.length - 1)) * 100}%` }}
          />

          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done    = n < step;
            const current = n === step;
            return (
              <div key={label} className="flex flex-col items-center gap-2 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                  ${done    ? 'bg-[#ff6b9d] border-[#ff6b9d] text-white' : ''}
                  ${current ? 'bg-white border-[#ff6b9d] text-[#ff6b9d] shadow-md shadow-[#ff6b9d]/20' : ''}
                  ${!done && !current ? 'bg-white border-[#ffb3d1] text-[#4a2c3e]/30' : ''}
                `}>
                  {done ? <CheckCircle size={15} /> : n}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${current ? 'text-[#ff6b9d]' : 'text-[#4a2c3e]/35'}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-md">

        {/* ── Step 1: Headshot ─────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-[#ffb3d1] p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-[#fff0f5] rounded-xl flex items-center justify-center">
                <Sparkles size={16} className="text-[#ff6b9d]" />
              </div>
              <div>
                <h2 className="luxury-heading text-2xl text-[#4a2c3e]">Your headshot</h2>
                <p className="text-xs text-[#4a2c3e]/50 mt-0.5">Helps us understand your colouring & features</p>
              </div>
            </div>

            <PhotoUploader
              label="Headshot photo"
              hint="Face visible, natural lighting, plain background preferred"
              file={headshot}
              preview={headshotPrev}
              onFile={setHeadshotFile}
              onClear={() => { setHeadshot(null); setHeadshotPrev(''); }}
            />

            {error && <p className="text-xs text-red-500 mt-3 text-center">{error}</p>}

            <button
              onClick={() => { if (!headshot) { setError('Please upload a headshot first.'); return; } setError(''); setStep(2); }}
              disabled={!headshot}
              className={`w-full mt-5 ${continueBtnCls}`}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step 2: Full body photo ──────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-[#ffb3d1] p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-[#fff0f5] rounded-xl flex items-center justify-center">
                <Sparkles size={16} className="text-[#ff6b9d]" />
              </div>
              <div>
                <h2 className="luxury-heading text-2xl text-[#4a2c3e]">Full body photo</h2>
                <p className="text-xs text-[#4a2c3e]/50 mt-0.5">Used to overlay your outfit recommendations</p>
              </div>
            </div>

            <PhotoUploader
              label="Full body photo"
              hint="Full length, arms at sides, fitted clothing, good lighting"
              file={bodyPhoto}
              preview={bodyPrev}
              onFile={setBodyFile}
              onClear={() => { setBodyPhoto(null); setBodyPrev(''); }}
            />

            {error && <p className="text-xs text-red-500 mt-3 text-center">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setError(''); setStep(1); }} className={backBtnCls}>
                <ArrowLeft size={15} /> Back
              </button>
              <button
                onClick={() => { if (!bodyPhoto) { setError('Please upload a photo first.'); return; } setError(''); setStep(3); }}
                disabled={!bodyPhoto}
                className={continueBtnCls}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Measurements ─────────────────────────── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-[#ffb3d1] p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-[#fff0f5] rounded-xl flex items-center justify-center">
                <Sparkles size={16} className="text-[#ff6b9d]" />
              </div>
              <div>
                <h2 className="luxury-heading text-2xl text-[#4a2c3e]">Measurements</h2>
                <p className="text-xs text-[#4a2c3e]/50 mt-0.5">All optional — helps us pick pieces in your size</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5">Height (cm)</label>
                  <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="165" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5">Weight (kg)</label>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="60" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5">Bust (cm)</label>
                  <input type="number" value={bust} onChange={e => setBust(e.target.value)} placeholder="88" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5">Waist (cm)</label>
                  <input type="number" value={waist} onChange={e => setWaist(e.target.value)} placeholder="70" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5">Hips (cm)</label>
                  <input type="number" value={hips} onChange={e => setHips(e.target.value)} placeholder="96" className={inputCls} />
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-3 text-center">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setError(''); setStep(2); }} className={backBtnCls}>
                <ArrowLeft size={15} /> Back
              </button>
              <button onClick={handleSubmit} disabled={submitting} className={continueBtnCls}>
                {submitting
                  ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                  : <>Finish setup <ArrowRight size={16} /></>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ─────────────────────────────────── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-[#ffb3d1] p-12 shadow-sm text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b9d] to-[#e85a8a] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#ff6b9d]/25">
              <CheckCircle size={28} className="text-white" />
            </div>
            <h2 className="luxury-heading text-3xl text-[#4a2c3e] mb-3">Profile complete!</h2>
            <p className="text-sm text-[#4a2c3e]/60 leading-relaxed mb-4">
              Your stylist will review your profile and curate your first outfit set after your Blueprint consultation.
            </p>
            <p className="text-xs text-[#4a2c3e]/40 leading-relaxed">
              You&apos;ll receive an email with a link to your outfits once they&apos;re ready.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
