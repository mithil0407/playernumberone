'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Camera, CheckCircle, Loader2, Lock, Ruler, Shield, Upload } from 'lucide-react';

const Cal = dynamic(() => import('@calcom/embed-react'), { ssr: false });

type IntakeContext = {
  email: string;
  phone: string;
  name?: string | null;
  source: 'root_checkout' | 'offer_2699_checkout';
  order_id?: string | null;
  razorpay_order_id?: string | null;
};

type PhotoKey = 'full_front' | 'headshot' | 'side_profile';

function FileField({
  id,
  label,
  helper,
  capture,
  file,
  onChange,
}: {
  id: PhotoKey;
  label: string;
  helper: string;
  capture: 'user' | 'environment';
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="block rounded-2xl border border-luxury-cream bg-white p-4 transition hover:border-luxury-accent/40"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-luxury-cream/60 text-luxury-accent">
          <Camera className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="luxury-body text-sm font-semibold text-luxury-charcoal">{label}</p>
          <p className="luxury-body mt-1 text-xs leading-relaxed text-luxury-charcoal/60">{helper}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-luxury-warm-white px-3 py-1.5 text-xs font-semibold text-luxury-charcoal/70">
            <Upload className="h-3.5 w-3.5" />
            {file ? file.name : 'Upload or take photo'}
          </div>
        </div>
      </div>
      <input
        id={id}
        name={id}
        type="file"
        accept="image/*,.heic,.heif"
        capture={capture}
        className="hidden"
        required
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function IntakePageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';
  const paymentId = searchParams.get('payment_id') || '';

  const [context, setContext] = useState<IntakeContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [photos, setPhotos] = useState<Record<PhotoKey, File | null>>({
    full_front: null,
    headshot: null,
    side_profile: null,
  });
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    shoulders: '',
    hips: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetch('/api/post-payment-intake/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, payment_id: paymentId }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'This intake link is invalid.');
        }
        if (!cancelled) setContext(data.intake);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'This intake link is invalid.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, paymentId]);

  const formComplete = useMemo(() => {
    return Boolean(
      photos.full_front &&
      photos.headshot &&
      photos.side_profile &&
      measurements.chest &&
      measurements.waist &&
      measurements.shoulders &&
      measurements.hips,
    );
  }, [photos, measurements]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');

    if (!formComplete) {
      setSubmitError('Please upload all 3 photos and enter all 4 measurements.');
      return;
    }

    const body = new FormData();
    body.set('token', token);
    body.set('payment_id', paymentId);
    body.set('unit', unit);
    Object.entries(measurements).forEach(([key, value]) => body.set(key, value));
    Object.entries(photos).forEach(([key, file]) => {
      if (file) body.set(key, file);
    });

    setSubmitting(true);
    try {
      const response = await fetch('/api/post-payment-intake/submit', {
        method: 'POST',
        body,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not submit your intake.');
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit your intake.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 text-center">
          <div>
            <Loader2 className="mx-auto mb-4 h-9 w-9 animate-spin text-luxury-accent" />
            <p className="luxury-body text-sm text-luxury-charcoal/70">Verifying your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 text-center">
          <div className="rounded-3xl border border-luxury-cream bg-white p-8 shadow-xl shadow-luxury-gold/5">
            <Lock className="mx-auto mb-4 h-10 w-10 text-luxury-accent" />
            <h1 className="luxury-heading text-3xl text-luxury-charcoal">This link cannot be opened.</h1>
            <p className="luxury-body mt-3 text-sm leading-relaxed text-luxury-charcoal/65">{loadError}</p>
            <Link href="/contact" className="mt-6 inline-flex rounded-full bg-luxury-accent px-6 py-3 text-sm font-semibold text-white">
              Contact support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
        <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
          <div className="mb-6 rounded-3xl border border-luxury-cream bg-white p-6 text-center shadow-xl shadow-luxury-gold/5 md:p-8">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-luxury-green" />
            <p className="luxury-body mb-2 text-xs font-bold uppercase tracking-[0.24em] text-luxury-accent">
              Intake Submitted
            </p>
            <h1 className="luxury-heading text-3xl text-luxury-charcoal md:text-5xl">Book your consultation.</h1>
            <p className="luxury-body mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-luxury-charcoal/65 md:text-base">
              Your photos and measurements are saved. Choose a time below to meet your ICONIK stylist.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-luxury-cream bg-white shadow-xl shadow-luxury-gold/5">
            <Cal
              calLink="iconone-wpnx1q/30min-copy"
              style={{ width: '100%', height: '760px', overflow: 'scroll' }}
              config={context?.email ? { name: context.name || '', email: context.email } : {}}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-6 rounded-3xl border border-luxury-cream bg-white p-6 shadow-xl shadow-luxury-gold/5 md:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-luxury-cream/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-luxury-accent">
            <Shield className="h-4 w-4" />
            Payment verified
          </div>
          <h1 className="luxury-heading text-3xl text-luxury-charcoal md:text-5xl">
            Complete your styling intake.
          </h1>
          <p className="luxury-body mt-3 max-w-2xl text-sm leading-relaxed text-luxury-charcoal/65 md:text-base">
            Upload your reference photos and measurements first. The booking calendar unlocks immediately after this is submitted.
          </p>
          {context?.email && (
            <p className="luxury-body mt-4 text-xs text-luxury-charcoal/50">
              Order contact: {context.email} · {context.phone}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl border border-luxury-cream bg-luxury-cream/20 p-5 md:p-6">
            <h2 className="luxury-heading mb-4 flex items-center gap-2 text-2xl text-luxury-charcoal">
              <Camera className="h-5 w-5 text-luxury-accent" />
              Photos
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <FileField
                id="full_front"
                label="Full front-facing image"
                helper="Stand straight, face the camera, use natural light, and wear fitted clothing."
                capture="environment"
                file={photos.full_front}
                onChange={(file) => setPhotos((prev) => ({ ...prev, full_front: file }))}
              />
              <FileField
                id="headshot"
                label="Headshot"
                helper="Face the camera clearly. No sunglasses. A simple selfie is fine."
                capture="user"
                file={photos.headshot}
                onChange={(file) => setPhotos((prev) => ({ ...prev, headshot: file }))}
              />
              <FileField
                id="side_profile"
                label="Side profile"
                helper="Stand sideways with your full frame visible from head to toe."
                capture="environment"
                file={photos.side_profile}
                onChange={(file) => setPhotos((prev) => ({ ...prev, side_profile: file }))}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-luxury-cream bg-white p-5 shadow-xl shadow-luxury-gold/5 md:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="luxury-heading flex items-center gap-2 text-2xl text-luxury-charcoal">
                <Ruler className="h-5 w-5 text-luxury-accent" />
                Measurements
              </h2>
              <div className="inline-flex rounded-full border border-luxury-cream bg-luxury-warm-white p-1">
                {(['in', 'cm'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setUnit(option)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${unit === option ? 'bg-luxury-accent text-white' : 'text-luxury-charcoal/60'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['chest', 'Chest'],
                ['waist', 'Waist'],
                ['shoulders', 'Shoulders'],
                ['hips', 'Hips'],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="luxury-body mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-luxury-charcoal/50">
                    {label} ({unit})
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    required
                    value={measurements[key as keyof typeof measurements]}
                    onChange={(event) => setMeasurements((prev) => ({ ...prev, [key]: event.target.value }))}
                    className="w-full rounded-2xl border border-luxury-cream bg-luxury-warm-white px-4 py-4 text-base text-luxury-charcoal outline-none transition focus:border-luxury-accent"
                    placeholder={unit === 'in' ? 'Example: 36' : 'Example: 92'}
                  />
                </label>
              ))}
            </div>
          </section>

          {submitError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!formComplete || submitting}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-luxury-accent px-7 py-4 text-sm font-bold text-white transition hover:bg-luxury-accent/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                <>
                  Submit and book
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PostPaymentIntakePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxury-warm-white" />
    }>
      <IntakePageContent />
    </Suspense>
  );
}
