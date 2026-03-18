'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

type Mode = 'login' | 'signup';

function ClientLoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirectTo') ?? '/iconik-club/client/outfits';

  const [mode, setMode]         = useState<Mode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (signUpError) { setError(signUpError.message); return; }
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
          setSuccess('Account created! Please sign in.');
          setMode('login');
          return;
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) { setError('Invalid email or password.'); return; }
      }

      // Check if user has already completed onboarding to avoid showing it again
      const profileRes = await fetch('/api/iconik-club/clients/profile');
      const profileData = await profileRes.json();
      const destination = profileData.profile?.onboarding_complete
        ? redirectTo
        : '/iconik-club/client/onboarding';
      router.push(destination);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-[#ffb3d1] bg-[#fff9f5] text-[#4a2c3e] text-sm outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition placeholder:text-[#4a2c3e]/30";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* ── Brand panel (desktop only) ───────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#ff6b9d] via-[#f0579d] to-[#c9457a] relative overflow-hidden flex-col items-center justify-center p-14">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 rounded-full" />
        <div className="absolute -bottom-28 -right-20 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute top-1/2 right-12 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10 text-white text-center max-w-xs">
          <div className="flex items-center justify-center gap-2 mb-10">
            <Sparkles size={16} className="opacity-80" />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase opacity-80">Iconik Club</span>
          </div>
          <h2 className="luxury-heading text-5xl leading-tight mb-6">
            Your personal<br />style edit.
          </h2>
          <p className="text-sm opacity-70 leading-relaxed mb-10">
            AI-curated outfits from our luxury catalog, styled uniquely for you.
          </p>
          <div className="flex flex-col gap-3 text-sm text-left">
            {['Personalised to your body & colouring', 'Curated from premium brands', 'Shop directly from your outfit'].map(pt => (
              <div key={pt} className="flex items-center gap-3 opacity-70">
                <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                {pt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form panel ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-[#fff9f5] px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles size={14} className="text-[#ff6b9d]" />
              <p className="text-xs font-semibold text-[#ff6b9d] tracking-widest uppercase">Iconik Club</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="luxury-heading text-4xl text-[#4a2c3e] mb-2">
              {mode === 'login' ? 'Welcome back.' : 'Join us.'}
            </h1>
            <p className="text-sm text-[#4a2c3e]/55">
              {mode === 'login' ? 'Sign in to see your curated outfits' : 'Create your account to get started'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#ffb3d1] p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5">Your name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Priya Sharma" className={inputCls} />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className={inputCls} />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a2c3e]/40 hover:text-[#4a2c3e] transition-colors">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}
              {success && <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#ff6b9d] hover:bg-[#e85a8a] text-white text-sm font-semibold tracking-wide transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1 shadow-md shadow-[#ff6b9d]/20"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-[#ffb3d1]/50 text-center">
              <p className="text-sm text-[#4a2c3e]/50">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
                  className="text-[#ff6b9d] font-semibold hover:underline"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fff9f5]"><Loader2 size={22} className="animate-spin text-[#ff6b9d]" /></div>}>
      <ClientLoginContent />
    </Suspense>
  );
}
