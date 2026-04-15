'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Loader2, CheckCircle, X, Send, MessageCircle } from 'lucide-react';

type Step = 'form' | 'generating' | 'done';

interface CreatedProfile {
  id: string;
  name: string;
  email: string;
  preview_token: string;
}

export default function NewClientPage() {
  const router = useRouter();

  const [step, setStep]         = useState<Step>('form');
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent]       = useState(false);

  // Form fields
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [bustCm, setBustCm]     = useState('');
  const [waistCm, setWaistCm]   = useState('');
  const [hipsCm, setHipsCm]     = useState('');
  const [styleRestrictions, setStyleRestrictions] = useState<string[]>([]);
  const [styleNotes, setStyleNotes] = useState('');
  const [likedOutfitExamplesText, setLikedOutfitExamplesText] = useState('');

  // Photos
  const [headshot, setHeadshot]         = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState('');
  const [bodyPhoto, setBodyPhoto]       = useState<File | null>(null);
  const [bodyPreview, setBodyPreview]   = useState('');

  const [profile, setProfile]   = useState<CreatedProfile | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const headshotInputRef  = useRef<HTMLInputElement>(null);
  const bodyInputRef      = useRef<HTMLInputElement>(null);

  const handlePhoto = useCallback((file: File, type: 'headshot' | 'body') => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are supported.');
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === 'headshot') { setHeadshot(file); setHeadshotPreview(url); }
    else                     { setBodyPhoto(file); setBodyPreview(url); }
    setError('');
  }, []);

  // Paste support
  useEffect(() => {
    if (step !== 'form') return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            // Assign to whichever is missing first
            if (!headshot) handlePhoto(file, 'headshot');
            else if (!bodyPhoto) handlePhoto(file, 'body');
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step, headshot, bodyPhoto, handlePhoto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return; }
    if (!headshot)  { setError('Please upload a headshot.'); return; }
    if (!bodyPhoto) { setError('Please upload a full-body photo.'); return; }

    setSaving(true);

    try {
      const fd = new FormData();
      fd.append('name',     name.trim());
      fd.append('email',    email.trim());
      fd.append('phone',    phone.trim());
      fd.append('headshot', headshot);
      fd.append('body_photo', bodyPhoto);
      if (heightCm) fd.append('height_cm', heightCm);
      if (bustCm)   fd.append('bust_cm',   bustCm);
      if (waistCm)  fd.append('waist_cm',  waistCm);
      if (hipsCm)   fd.append('hips_cm',   hipsCm);
      fd.append('style_restrictions', JSON.stringify(styleRestrictions));
      const likedExamples = likedOutfitExamplesText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
      if (likedExamples.length) fd.append('liked_outfit_examples', JSON.stringify(likedExamples));
      if (styleNotes.trim()) fd.append('style_notes', styleNotes.trim());

      const res  = await fetch('/api/iconik-club/admin/clients/create', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to create client.');
        setSaving(false);
        return;
      }

      const created: CreatedProfile = data.profile;
      setProfile(created);
      setStep('generating');
      setSaving(false);

      // Trigger outfit generation
      const genRes  = await fetch(`/api/iconik-club/admin/clients/${created.id}/generate`, { method: 'POST' });
      const genData = await genRes.json();

      const token = genData.preview_token ?? created.preview_token;
      const baseUrl = window.location.origin;
      setPreviewUrl(`${baseUrl}/iconik-club/preview/${token}`);
      setStep('done');

    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const openWhatsApp = () => {
    const firstName = name.trim().split(' ')[0];
    const rawPhone  = phone.replace(/\D/g, '');
    const waPhone   = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
    const message   = `Hi ${firstName}! Your personal style edit from Iconik Club is ready 🎉\n\nView your 6 curated outfits here:\n${previewUrl}\n\nEvery piece has a direct shopping link. This preview is valid for 30 days.`;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendPreview = async () => {
    if (!profile) return;
    setSendingEmail(true);
    try {
      await fetch(`/api/iconik-club/admin/clients/${profile.id}/send-preview`, { method: 'POST' });
      setEmailSent(true);
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Done state ────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={26} className="text-emerald-500" />
          </div>
          <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-1">Complete</p>
          <h2 className="luxury-heading text-3xl text-[#4a2c3e] mb-2">Outfits generated</h2>
          <p className="text-sm text-[#4a2c3e]/50">for {profile?.name}</p>
        </div>

        <div className="bg-[#fff9f5] rounded-2xl border border-[#ffb3d1]/60 p-5 mb-6">
          <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-2">Preview link</p>
          <p className="text-xs text-[#4a2c3e] break-all font-mono mb-4">{previewUrl}</p>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => { navigator.clipboard.writeText(previewUrl); }}
              className="flex-1 text-xs font-semibold border border-[#ffb3d1] text-[#4a2c3e] rounded-xl py-2.5 hover:bg-[#fff0f5] transition-colors"
            >
              Copy link
            </button>
            <button
              onClick={sendPreview}
              disabled={sendingEmail || emailSent}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#ff6b9d] text-white rounded-xl py-2.5 hover:bg-[#ff4d8d] disabled:opacity-60 transition-colors"
            >
              {sendingEmail ? (
                <Loader2 size={13} className="animate-spin" />
              ) : emailSent ? (
                <><CheckCircle size={13} /> Sent</>
              ) : (
                <><Send size={13} /> Email</>
              )}
            </button>
          </div>
          {/* WhatsApp button — only shown if phone was provided */}
          {phone.trim() && (
            <button
              onClick={openWhatsApp}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold bg-[#25D366] text-white rounded-xl py-2.5 hover:bg-[#1ebe5d] transition-colors"
            >
              <MessageCircle size={13} />
              Send via WhatsApp
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/iconik-club/admin/clients')}
            className="flex-1 text-xs font-semibold border border-[#ffb3d1] text-[#4a2c3e] rounded-xl py-3 hover:bg-[#fff0f5] transition-colors"
          >
            Back to clients
          </button>
          <button
            onClick={() => {
              setStep('form'); setProfile(null); setPreviewUrl('');
              setName(''); setEmail(''); setPhone('');
              setHeadshot(null); setHeadshotPreview('');
              setBodyPhoto(null); setBodyPreview('');
              setHeightCm(''); setBustCm(''); setWaistCm(''); setHipsCm('');
              setStyleNotes(''); setStyleRestrictions([]);
              setLikedOutfitExamplesText('');
              setEmailSent(false);
            }}
            className="flex-1 text-xs font-semibold bg-[#4a2c3e] text-white rounded-xl py-3 hover:bg-[#3a1c2e] transition-colors"
          >
            Add another client
          </button>
        </div>
      </div>
    );
  }

  // ── Generating state ──────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <Loader2 size={28} className="animate-spin text-[#ff6b9d] mx-auto mb-6" />
        <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-2">Please wait</p>
        <h2 className="luxury-heading text-3xl text-[#4a2c3e] mb-3">Curating outfits</h2>
        <p className="text-sm text-[#4a2c3e]/40 max-w-xs mx-auto leading-relaxed">
          AI is generating 6 personalised outfit sets for {profile?.name}. This takes about 30–60 seconds.
        </p>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center gap-4 mb-7">
        <Link href="/iconik-club/admin/clients" className="p-2 rounded-xl border border-[#ffb3d1] text-[#4a2c3e]/50 hover:bg-[#fff0f5] transition-colors">
          <ArrowLeft size={14} />
        </Link>
        <div>
          <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-0.5">New</p>
          <h2 className="luxury-heading text-3xl text-[#4a2c3e]">Add Client</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">

        {/* Client details */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm space-y-4">
          <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-1">Client details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4a2c3e]/60 mb-1.5">Full name *</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Priya Sharma"
                className="w-full px-3 py-2.5 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4a2c3e]/60 mb-1.5">Email *</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="priya@example.com"
                className="w-full px-3 py-2.5 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4a2c3e]/60 mb-1.5">Phone</label>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2.5 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition"
              />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-4">Photos <span className="text-[#ff6b9d]">*</span></p>
          <div className="grid grid-cols-2 gap-4">

            {/* Headshot */}
            <div>
              <p className="text-xs font-semibold text-[#4a2c3e]/60 mb-2">Headshot</p>
              {headshotPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={headshotPreview} alt="Headshot" className="w-full aspect-square object-cover rounded-xl border border-[#ffb3d1]/60" />
                  <button
                    type="button"
                    onClick={() => { setHeadshot(null); setHeadshotPreview(''); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full border border-[#ffb3d1] flex items-center justify-center hover:bg-[#fff0f5] transition-colors"
                  >
                    <X size={10} className="text-[#4a2c3e]" />
                  </button>
                </div>
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
              <input
                ref={headshotInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f, 'headshot'); }}
              />
            </div>

            {/* Body photo */}
            <div>
              <p className="text-xs font-semibold text-[#4a2c3e]/60 mb-2">Full-body photo</p>
              {bodyPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bodyPreview} alt="Body photo" className="w-full aspect-square object-cover rounded-xl border border-[#ffb3d1]/60" />
                  <button
                    type="button"
                    onClick={() => { setBodyPhoto(null); setBodyPreview(''); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full border border-[#ffb3d1] flex items-center justify-center hover:bg-[#fff0f5] transition-colors"
                  >
                    <X size={10} className="text-[#4a2c3e]" />
                  </button>
                </div>
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
              <input
                ref={bodyInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f, 'body'); }}
              />
            </div>
          </div>
          <p className="text-[10px] text-[#4a2c3e]/30 mt-3">You can also paste images with Cmd+V</p>
        </div>

        {/* Measurements (optional) */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-1">Measurements <span className="font-normal normal-case text-[#4a2c3e]/30">(optional)</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Height', value: heightCm, set: setHeightCm, unit: 'cm' },
              { label: 'Bust',   value: bustCm,   set: setBustCm,   unit: 'cm' },
              { label: 'Waist',  value: waistCm,  set: setWaistCm,  unit: 'cm' },
              { label: 'Hips',   value: hipsCm,   set: setHipsCm,   unit: 'cm' },
            ].map(({ label, value, set, unit }) => (
              <div key={label}>
                <label className="block text-[10px] font-semibold text-[#4a2c3e]/40 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type="number" value={value} onChange={e => set(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2.5 pr-8 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#4a2c3e]/30">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Style Preferences */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-1">Style Preferences <span className="font-normal normal-case text-[#4a2c3e]/30">(optional)</span></p>

          <div className="mt-4 mb-5">
            <label className="block text-xs font-semibold text-[#4a2c3e]/60 mb-1.5">Liked outfit examples</label>
            <p className="text-[11px] text-[#4a2c3e]/40 mb-2 leading-relaxed">One line per outfit formula or style cue the client already loves. This becomes the primary taste signal.</p>
            <textarea
              value={likedOutfitExamplesText}
              onChange={e => setLikedOutfitExamplesText(e.target.value)}
              placeholder={`e.g. Cream blazer with wide-leg trousers and pointed heels\nIvory midi dress with tan structured bag\nDark jeans, tucked knit top, loafers`}
              rows={4}
              className="w-full px-3 py-2.5 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition placeholder:text-[#4a2c3e]/30 resize-none leading-relaxed"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-[#4a2c3e]/60 mb-1.5">Style notes</label>
            <p className="text-[11px] text-[#4a2c3e]/40 mb-2 leading-relaxed">Brands, aesthetics, outfit vibes the client loves. Fed directly into the AI stylist prompt.</p>
            <textarea
              value={styleNotes}
              onChange={e => setStyleNotes(e.target.value)}
              placeholder="e.g. Loves neutral minimal looks — beige, white, black. Wide-leg trousers with simple tops. Brands: Zara, Mango. Avoids loud prints."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition placeholder:text-[#4a2c3e]/30 resize-none leading-relaxed"
            />
          </div>

          <p className="text-xs text-[#4a2c3e]/30 mb-3">Style restrictions — boundaries the AI must respect.</p>
          <div className="space-y-3">
            {[
              { key: 'no_sleeveless', label: 'No sleeveless', description: 'Avoid tops, dresses, or jumpsuits without sleeves' },
              { key: 'cover_tummy',   label: 'Cover tummy',   description: 'Avoid crop tops and styles that emphasise the midsection' },
            ].map(({ key, label, description }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={styleRestrictions.includes(key)}
                    onChange={e =>
                      setStyleRestrictions(prev =>
                        e.target.checked ? [...prev, key] : prev.filter(r => r !== key)
                      )
                    }
                    className="w-4 h-4 accent-[#ff6b9d] cursor-pointer"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#4a2c3e] group-hover:text-[#ff6b9d] transition-colors">{label}</p>
                  <p className="text-xs text-[#4a2c3e]/40">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#ff6b9d] text-white font-semibold text-sm rounded-2xl py-4 hover:bg-[#ff4d8d] disabled:opacity-60 transition-colors shadow-sm shadow-[#ff6b9d]/20"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Creating client…</>
          ) : (
            'Save & Generate Outfits'
          )}
        </button>
      </form>
    </div>
  );
}
