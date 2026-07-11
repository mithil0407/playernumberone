'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, CheckCircle, Sparkles, Upload, X } from 'lucide-react';
import type { ClientProfile, BudgetLevel } from '@/lib/supabase';
import { CLUB, primaryButtonClass } from '@/components/IconikClubAdminUI';

const RESTRICTION_OPTIONS = [
  { value: 'no_sleeveless', label: 'No sleeveless' },
  { value: 'cover_tummy',   label: 'Cover tummy' },
];

export default function AdminClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient]   = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  const [generatingProfile, setGeneratingProfile] = useState(false);
  const [profileGenError, setProfileGenError]     = useState('');

  // Form fields
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [height,     setHeight]     = useState('');
  const [weight,     setWeight]     = useState('');
  const [bust,       setBust]       = useState('');
  const [waist,      setWaist]      = useState('');
  const [hips,       setHips]       = useState('');
  const [styleNotes, setStyleNotes] = useState('');
  const [likedOutfitExamplesText, setLikedOutfitExamplesText] = useState('');
  const [visualProfile, setVisualProfile] = useState('');
  const [preferenceProfileText, setPreferenceProfileText] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel | ''>('');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [generatingPreferenceProfile, setGeneratingPreferenceProfile] = useState(false);
  const [preferenceProfileGenError, setPreferenceProfileGenError] = useState('');
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [bodyPhotoFile, setBodyPhotoFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState('');
  const [bodyPhotoPreview, setBodyPhotoPreview] = useState('');
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  const populate = useCallback((c: ClientProfile) => {
    setClient(c);
    setName(c.name ?? '');
    setEmail(c.email ?? '');
    setPhone(c.phone ?? '');
    setHeight(c.height_cm != null ? String(c.height_cm) : '');
    setWeight(c.weight_kg != null ? String(c.weight_kg) : '');
    setBust(c.bust_cm != null ? String(c.bust_cm) : '');
    setWaist(c.waist_cm != null ? String(c.waist_cm) : '');
    setHips(c.hips_cm != null ? String(c.hips_cm) : '');
    setStyleNotes(c.style_notes ?? '');
    setLikedOutfitExamplesText((c.liked_outfit_examples ?? []).join('\n'));
    setVisualProfile(c.visual_profile ?? '');
    setPreferenceProfileText(c.preference_profile ? JSON.stringify(c.preference_profile, null, 2) : '');
    setRestrictions(c.style_restrictions ?? []);
    setBudgetLevel(c.budget_level ?? '');
    setOnboardingComplete(c.onboarding_complete ?? false);
    setHeadshotPreview(c.headshot_url ?? '');
    setBodyPhotoPreview(c.body_photo_url ?? '');
    setHeadshotFile(null);
    setBodyPhotoFile(null);
  }, []);

  useEffect(() => {
    fetch(`/api/iconik-club/admin/clients/${id}`)
      .then(r => r.json())
      .then(d => { if (d.client) populate(d.client); })
      .finally(() => setLoading(false));
  }, [id, populate]);

  const toggleRestriction = (val: string) => {
    setRestrictions(prev =>
      prev.includes(val) ? prev.filter(r => r !== val) : [...prev, val]
    );
  };

  const handlePhoto = useCallback((file: File, type: 'headshot' | 'body') => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.');
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === 'headshot') {
      setHeadshotFile(file);
      setHeadshotPreview(url);
    } else {
      setBodyPhotoFile(file);
      setBodyPhotoPreview(url);
    }
    setSaved(false);
    setError('');
  }, []);

  const handleGenerateProfile = async () => {
    setProfileGenError('');
    setGeneratingProfile(true);
    try {
      const res  = await fetch(`/api/iconik-club/admin/clients/${id}/visual-profile`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setProfileGenError(data.error ?? 'Generation failed'); return; }
      setVisualProfile(data.visual_profile ?? '');
    } catch {
      setProfileGenError('Network error. Please try again.');
    } finally {
      setGeneratingProfile(false);
    }
  };

  const handleGeneratePreferenceProfile = async () => {
    setPreferenceProfileGenError('');
    setGeneratingPreferenceProfile(true);
    try {
      const res = await fetch(`/api/iconik-club/admin/clients/${id}/preference-profile`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setPreferenceProfileGenError(data.error ?? 'Generation failed');
        return;
      }
      setPreferenceProfileText(data.preference_profile ? JSON.stringify(data.preference_profile, null, 2) : '');
      if (data.client) populate(data.client);
    } catch {
      setPreferenceProfileGenError('Network error. Please try again.');
    } finally {
      setGeneratingPreferenceProfile(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    setSaved(false);

    const body: Record<string, unknown> = {
      name:                name.trim(),
      email:               email.trim(),
      phone:               phone.trim() || null,
      height_cm:           height ? parseFloat(height) : null,
      weight_kg:           weight ? parseFloat(weight) : null,
      bust_cm:             bust   ? parseFloat(bust)   : null,
      waist_cm:            waist  ? parseFloat(waist)  : null,
      hips_cm:             hips   ? parseFloat(hips)   : null,
      style_notes:         styleNotes.trim() || null,
      visual_profile:      visualProfile.trim() || null,
      style_restrictions:  restrictions,
      budget_level:        budgetLevel || null,
      liked_outfit_examples: likedOutfitExamplesText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean),
      onboarding_complete: onboardingComplete,
    };

    try {
      const hasPhotoChanges = !!headshotFile || !!bodyPhotoFile;
      const requestInit: RequestInit = hasPhotoChanges
        ? {
            method: 'PATCH',
            body: (() => {
              const formData = new FormData();
              for (const [key, value] of Object.entries(body)) {
                if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
                else if (typeof value === 'boolean') formData.append(key, String(value));
                else formData.append(key, value == null ? '' : String(value));
              }
              if (headshotFile) formData.append('headshot', headshotFile);
              if (bodyPhotoFile) formData.append('body_photo', bodyPhotoFile);
              return formData;
            })(),
          }
        : {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
          };

      const res  = await fetch(`/api/iconik-club/admin/clients/${id}`, requestInit);
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? data.error ?? 'Save failed'); return; }
      populate(data.client);
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

  if (!client) {
    return (
      <div className="text-center py-32">
        <p className="text-[#4a2c3e]/40 text-sm mb-4">Client not found.</p>
        <button onClick={() => router.back()} className="text-xs text-[#ff6b9d] hover:underline">← Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl pb-20">

      {/* Back */}
      <button
        onClick={() => router.push('/iconik-club/admin/clients')}
        className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#4a2c3e]/40 hover:text-[#4a2c3e] transition-colors mb-7"
      >
        <ArrowLeft size={12} /> All members
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {client.headshot_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={client.headshot_url} alt={client.name} className="w-14 h-14 rounded-full object-cover border border-[#ffb3d1]/60 flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#fff0f5] border border-[#ffb3d1]/60 flex items-center justify-center text-[#ff6b9d] font-bold text-lg flex-shrink-0">
            {client.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
        )}
        <div>
          <p className="iconik-micro mb-1" style={{ color: CLUB.gold }}>Member profile</p>
          <h2 className="luxury-heading text-2xl text-[#4a2c3e]">{client.name}</h2>
          <p className="text-xs text-[#4a2c3e]/40 mt-0.5">{client.email}</p>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── Photos ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-5">Photos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Headshot</label>
              <div className="relative">
                {headshotPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={headshotPreview} alt="Client headshot" className="w-full aspect-square object-cover rounded-xl border border-[#ffb3d1]/60" />
                    <button
                      type="button"
                      onClick={() => headshotInputRef.current?.click()}
                      className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white text-[#4a2c3e] text-[11px] font-semibold border border-[#ffb3d1] shadow-sm hover:bg-[#fff0f5]"
                    >
                      Replace
                    </button>
                    {headshotFile && (
                      <button
                        type="button"
                        onClick={() => { setHeadshotFile(null); setHeadshotPreview(client.headshot_url ?? ''); }}
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
                    <Upload size={18} className="text-[#4a2c3e]/30" />
                    <span className="text-[10px] text-[#4a2c3e]/40 font-medium">Upload</span>
                  </button>
                )}
              </div>
              <input
                ref={headshotInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handlePhoto(file, 'headshot');
                }}
              />
            </div>

            <div>
              <label className={labelCls}>Full-body photo</label>
              <div className="relative">
                {bodyPhotoPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bodyPhotoPreview} alt="Client full body" className="w-full aspect-square object-cover rounded-xl border border-[#ffb3d1]/60" />
                    <button
                      type="button"
                      onClick={() => bodyInputRef.current?.click()}
                      className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white text-[#4a2c3e] text-[11px] font-semibold border border-[#ffb3d1] shadow-sm hover:bg-[#fff0f5]"
                    >
                      Replace
                    </button>
                    {bodyPhotoFile && (
                      <button
                        type="button"
                        onClick={() => { setBodyPhotoFile(null); setBodyPhotoPreview(client.body_photo_url ?? ''); }}
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
                    <Upload size={18} className="text-[#4a2c3e]/30" />
                    <span className="text-[10px] text-[#4a2c3e]/40 font-medium">Upload</span>
                  </button>
                )}
              </div>
              <input
                ref={bodyInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handlePhoto(file, 'body');
                }}
              />
            </div>
          </div>
          {(headshotFile || bodyPhotoFile) && (
            <p className="text-[11px] text-[#4a2c3e]/40 mt-3">
              Replacement photos will be uploaded when you save changes.
            </p>
          )}
        </div>

        {/* ── Basic info ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-5">Profile</p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91…" className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Measurements ────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-5">Measurements</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Height (cm)</label>
                <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="165" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="60" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Bust (cm)</label>
                <input type="number" value={bust} onChange={e => setBust(e.target.value)} placeholder="88" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Waist (cm)</label>
                <input type="number" value={waist} onChange={e => setWaist(e.target.value)} placeholder="70" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Hips (cm)</label>
                <input type="number" value={hips} onChange={e => setHips(e.target.value)} placeholder="96" className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Style ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-5">Preferences</p>
          <div className="space-y-5">

            <div>
              <label className={labelCls}>Liked outfit examples</label>
              <p className="text-[11px] text-[#4a2c3e]/40 mb-2 leading-relaxed">
                One outfit formula per line. This is the primary taste signal the new generator learns from.
              </p>
              <textarea
                value={likedOutfitExamplesText}
                onChange={e => setLikedOutfitExamplesText(e.target.value)}
                placeholder={`e.g. White shirt + high-waist trousers + pointed flats\nStructured midi dress + tan bag\nDark jeans + blazer + simple heels`}
                rows={5}
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </div>

            <div>
              <label className={labelCls}>Style notes</label>
              <p className="text-[11px] text-[#4a2c3e]/40 mb-2 leading-relaxed">
                Brands, aesthetics, outfit vibes the client already loves. Fed directly into the AI stylist.
              </p>
              <textarea
                value={styleNotes}
                onChange={e => setStyleNotes(e.target.value)}
                placeholder="e.g. Loves neutral minimal looks — beige, white, black. Wide-leg trousers with simple tops. Brands: Zara, Mango. Avoids loud prints."
                rows={4}
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </div>

            <div>
              <label className={labelCls}>Style restrictions</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {RESTRICTION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleRestriction(opt.value)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      restrictions.includes(opt.value)
                        ? 'bg-[#ff6b9d] text-white border-[#ff6b9d]'
                        : 'bg-white text-[#4a2c3e]/60 border-[#ffb3d1] hover:border-[#ff6b9d] hover:text-[#4a2c3e]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Budget level</label>
              <p className="text-[11px] text-[#4a2c3e]/40 mb-2 leading-relaxed">
                Controls which price tier of items the AI prioritises when building outfits.
              </p>
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
                    {level === 'low' ? 'Low' : level === 'mid' ? 'Mid' : 'High'}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Visual profile ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-1">
            <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Visual profile</p>
            <button
              type="button"
              onClick={handleGenerateProfile}
              disabled={generatingProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fff0f5] border border-[#ffb3d1] text-[#ff6b9d] text-[11px] font-semibold hover:bg-[#ffe0ee] disabled:opacity-50 transition-colors shrink-0"
            >
              {generatingProfile
                ? <><Loader2 size={11} className="animate-spin" /> Analysing…</>
                : <><Sparkles size={11} /> {visualProfile ? 'Regenerate' : 'Generate from photos'}</>
              }
            </button>
          </div>
          <p className="text-[11px] text-[#4a2c3e]/40 mb-4 leading-relaxed">
            AI-generated appearance description from client photos — age range, skin tone &amp; undertone, body shape, build, hair. Drives colour palette and silhouette choices in outfit generation. Auto-populated on onboarding; use the button to generate or regenerate for existing clients.
          </p>
          {profileGenError && <p className="text-xs text-red-500 mb-3">{profileGenError}</p>}
          <textarea
            value={visualProfile}
            onChange={e => setVisualProfile(e.target.value)}
            placeholder="e.g. Late 20s. Medium warm-toned skin, Indian wheatish complexion, warm undertone. Pear shape — hips wider than shoulders, defined waist. Average height, medium build. Dark brown straight hair, long past shoulders."
            rows={4}
            className={`${inputCls} resize-none leading-relaxed`}
          />
        </div>

        {/* ── Preference profile ─────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-1">
            <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Preference profile</p>
            <button
              type="button"
              onClick={handleGeneratePreferenceProfile}
              disabled={generatingPreferenceProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fff0f5] border border-[#ffb3d1] text-[#ff6b9d] text-[11px] font-semibold hover:bg-[#ffe0ee] disabled:opacity-50 transition-colors shrink-0"
            >
              {generatingPreferenceProfile
                ? <><Loader2 size={11} className="animate-spin" /> Building…</>
                : <><Sparkles size={11} /> {preferenceProfileText ? 'Regenerate' : 'Generate'}</>
              }
            </button>
          </div>
          <p className="text-[11px] text-[#4a2c3e]/40 mb-4 leading-relaxed">
            Stored taste profile derived from liked outfit examples, style notes, and visual profile. Outfit generation now uses this as the stable source of truth.
          </p>
          {preferenceProfileGenError && <p className="text-xs text-red-500 mb-3">{preferenceProfileGenError}</p>}
          <textarea
            value={preferenceProfileText}
            readOnly
            placeholder="No preference profile generated yet."
            rows={12}
            className={`${inputCls} resize-none leading-relaxed font-mono text-[11px]`}
          />
        </div>

        {/* ── Account status ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-5">Account</p>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setOnboardingComplete(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${onboardingComplete ? 'bg-[#ff6b9d]' : 'bg-[#ffb3d1]/50'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${onboardingComplete ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#4a2c3e]">Onboarding complete</p>
              <p className="text-[11px] text-[#4a2c3e]/40">Controls access to the outfits page</p>
            </div>
          </label>
        </div>

        {/* ── Save ────────────────────────────────────── */}
        <div className="sticky bottom-3 z-10 rounded-2xl border p-3 shadow-xl" style={{ background: CLUB.surface, borderColor: CLUB.border }}>
        {error && <p className="mb-2 text-center text-xs text-red-500">{error}</p>}
        <button onClick={handleSave} disabled={saving} className={`${primaryButtonClass} w-full`}>
          {saving ? (
            <><Loader2 size={15} className="animate-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle size={15} /> Saved</>
          ) : (
            <><Save size={15} /> Save changes</>
          )}
        </button></div>

      </div>
    </div>
  );
}
