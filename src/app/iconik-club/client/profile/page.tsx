'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, ImagePlus, Loader2, Save, X } from 'lucide-react';
import type { BudgetLevel, ClientProfile } from '@/lib/supabase';

const RESTRICTION_OPTIONS = [
  { value: 'no_sleeveless', label: 'No sleeveless' },
  { value: 'cover_tummy', label: 'Cover tummy' },
];

function parseNumber(value: number | undefined): string {
  return value != null ? String(value) : '';
}

export default function ClientProfilePage() {
  const router = useRouter();
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [styleNotes, setStyleNotes] = useState('');
  const [likedOutfitExamplesText, setLikedOutfitExamplesText] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel | ''>('');

  const [headshot, setHeadshot] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState('');
  const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);
  const [bodyPreview, setBodyPreview] = useState('');

  const populate = useCallback((profile: ClientProfile) => {
    setName(profile.name ?? '');
    setPhone(profile.phone ?? '');
    setHeight(parseNumber(profile.height_cm));
    setWeight(parseNumber(profile.weight_kg));
    setBust(parseNumber(profile.bust_cm));
    setWaist(parseNumber(profile.waist_cm));
    setHips(parseNumber(profile.hips_cm));
    setStyleNotes(profile.style_notes ?? '');
    setLikedOutfitExamplesText((profile.liked_outfit_examples ?? []).join('\n'));
    setRestrictions(profile.style_restrictions ?? []);
    setBudgetLevel(profile.budget_level ?? '');
    setHeadshotPreview(profile.headshot_url ?? '');
    setBodyPreview(profile.body_photo_url ?? '');
    setHeadshot(null);
    setBodyPhoto(null);
  }, []);

  useEffect(() => {
    fetch('/api/iconik-club/clients/profile')
      .then(r => r.json())
      .then(data => {
        if (!data.profile) {
          router.replace('/iconik-club/client/onboarding');
          return;
        }
        populate(data.profile);
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [populate, router]);

  const handlePhoto = useCallback((file: File, type: 'headshot' | 'body') => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.');
      return;
    }

    const url = URL.createObjectURL(file);
    if (type === 'headshot') {
      setHeadshot(file);
      setHeadshotPreview(url);
    } else {
      setBodyPhoto(file);
      setBodyPreview(url);
    }
    setError('');
    setSaved(false);
  }, []);

  const toggleRestriction = (value: string) => {
    setRestrictions(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value],
    );
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    setSaved(false);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      formData.append('height_cm', height);
      formData.append('weight_kg', weight);
      formData.append('bust_cm', bust);
      formData.append('waist_cm', waist);
      formData.append('hips_cm', hips);
      formData.append('style_notes', styleNotes.trim());
      formData.append('style_restrictions', JSON.stringify(restrictions));
      formData.append(
        'liked_outfit_examples',
        JSON.stringify(
          likedOutfitExamplesText
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean),
        ),
      );
      formData.append('budget_level', budgetLevel);
      if (headshot) formData.append('headshot', headshot);
      if (bodyPhoto) formData.append('body_photo', bodyPhoto);

      const response = await fetch('/api/iconik-club/clients/profile', {
        method: 'PATCH',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.detail ?? data.error ?? 'Save failed.');
        return;
      }

      populate(data.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-[#ffb3d1] bg-white text-[#4a2c3e] text-sm outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition placeholder:text-[#4a2c3e]/30";
  const labelCls = "block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={22} className="animate-spin text-[#ff6b9d]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9f5] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/iconik-club/client/outfits')}
          className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#4a2c3e]/40 hover:text-[#4a2c3e] transition-colors mb-7"
        >
          <ArrowLeft size={12} /> Outfits
        </button>

        <div className="mb-8">
          <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-0.5">Profile</p>
          <h1 className="luxury-heading text-3xl text-[#4a2c3e]">Your style profile</h1>
          <p className="text-sm text-[#4a2c3e]/50 mt-2">Update your measurements, photos, and style preferences.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
            <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-5">Photos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Headshot</label>
                <div className="relative">
                  {headshotPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={headshotPreview} alt="Headshot" className="w-full aspect-square object-cover rounded-xl border border-[#ffb3d1]/60" />
                      <button
                        type="button"
                        onClick={() => headshotInputRef.current?.click()}
                        className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white text-[#4a2c3e] text-[11px] font-semibold border border-[#ffb3d1] shadow-sm hover:bg-[#fff0f5]"
                      >
                        Replace
                      </button>
                      {headshot && (
                        <button
                          type="button"
                          onClick={() => { setHeadshot(null); setHeadshotPreview(''); }}
                          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#4a2c3e] text-white flex items-center justify-center"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => headshotInputRef.current?.click()}
                      className="w-full aspect-square rounded-xl border-2 border-dashed border-[#ffb3d1] bg-[#fff9f5] flex flex-col items-center justify-center gap-2 hover:border-[#ff6b9d] hover:bg-[#fff0f5] transition-colors"
                    >
                      <ImagePlus size={18} className="text-[#4a2c3e]/30" />
                      <span className="text-[10px] text-[#4a2c3e]/40 font-medium">Upload</span>
                    </button>
                  )}
                </div>
                <input
                  ref={headshotInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) handlePhoto(file, 'headshot');
                  }}
                />
              </div>

              <div>
                <label className={labelCls}>Full-body photo</label>
                <div className="relative">
                  {bodyPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bodyPreview} alt="Full body" className="w-full aspect-square object-cover rounded-xl border border-[#ffb3d1]/60" />
                      <button
                        type="button"
                        onClick={() => bodyInputRef.current?.click()}
                        className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white text-[#4a2c3e] text-[11px] font-semibold border border-[#ffb3d1] shadow-sm hover:bg-[#fff0f5]"
                      >
                        Replace
                      </button>
                      {bodyPhoto && (
                        <button
                          type="button"
                          onClick={() => { setBodyPhoto(null); setBodyPreview(''); }}
                          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#4a2c3e] text-white flex items-center justify-center"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => bodyInputRef.current?.click()}
                      className="w-full aspect-square rounded-xl border-2 border-dashed border-[#ffb3d1] bg-[#fff9f5] flex flex-col items-center justify-center gap-2 hover:border-[#ff6b9d] hover:bg-[#fff0f5] transition-colors"
                    >
                      <ImagePlus size={18} className="text-[#4a2c3e]/30" />
                      <span className="text-[10px] text-[#4a2c3e]/40 font-medium">Upload</span>
                    </button>
                  )}
                </div>
                <input
                  ref={bodyInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) handlePhoto(file, 'body');
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
            <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-5">Basic info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Name</label>
                <input type="text" value={name} onChange={event => setName(event.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={phone} onChange={event => setPhone(event.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
            <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-5">Measurements</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Height (cm)</label>
                <input type="number" value={height} onChange={event => setHeight(event.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input type="number" value={weight} onChange={event => setWeight(event.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Bust (cm)</label>
                <input type="number" value={bust} onChange={event => setBust(event.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Waist (cm)</label>
                <input type="number" value={waist} onChange={event => setWaist(event.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Hips (cm)</label>
                <input type="number" value={hips} onChange={event => setHips(event.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
            <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-5">Style preferences</p>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Liked outfit examples</label>
                <textarea
                  value={likedOutfitExamplesText}
                  onChange={event => setLikedOutfitExamplesText(event.target.value)}
                  rows={5}
                  className={`${inputCls} resize-none leading-relaxed`}
                />
              </div>
              <div>
                <label className={labelCls}>Style notes</label>
                <textarea
                  value={styleNotes}
                  onChange={event => setStyleNotes(event.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none leading-relaxed`}
                />
              </div>
              <div>
                <label className={labelCls}>Style restrictions</label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTION_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleRestriction(option.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        restrictions.includes(option.value)
                          ? 'bg-[#ff6b9d] text-white border-[#ff6b9d]'
                          : 'bg-white text-[#4a2c3e]/60 border-[#ffb3d1] hover:border-[#ff6b9d] hover:text-[#4a2c3e]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Budget level</label>
                <div className="flex gap-2">
                  {(['low', 'mid', 'high'] as BudgetLevel[]).map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setBudgetLevel(prev => prev === level ? '' : level)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-colors ${
                        budgetLevel === level
                          ? 'bg-[#ff6b9d] text-white border-[#ff6b9d]'
                          : 'bg-white text-[#4a2c3e]/60 border-[#ffb3d1] hover:border-[#ff6b9d] hover:text-[#4a2c3e]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#ff6b9d] hover:bg-[#e85a8a] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-[#ff6b9d]/20"
          >
            {saving ? (
              <><Loader2 size={15} className="animate-spin" /> Saving...</>
            ) : saved ? (
              <><CheckCircle size={15} /> Saved</>
            ) : (
              <><Save size={15} /> Save profile</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
