'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

function ClientLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/iconik-club/client/outfits';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createSupabaseBrowserClient();

    try {
      const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError || !user) { setError('Invalid email or password.'); return; }

      const { data: profile } = await supabase
        .from('client_profiles')
        .select('onboarding_complete')
        .eq('user_id', user.id)
        .single();

      router.push(profile?.onboarding_complete ? redirectTo : '/iconik-club/client/onboarding');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-luxury-cream bg-white text-luxury-charcoal text-sm outline-none focus:ring-2 focus:ring-luxury-accent/30 focus:border-luxury-accent transition placeholder:text-luxury-charcoal/30";

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── Brand panel (desktop only) ───────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-luxury-charcoal relative overflow-hidden flex-col items-center justify-center p-14">
        {/* Subtle, elegant environmental lighting/shapes */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-luxury-cream/5 rounded-full blur-3xl mix-blend-screen" />
        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-luxury-accent/10 rounded-full blur-3xl mix-blend-screen" />
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-luxury-gold/5 rounded-full blur-2xl mix-blend-screen" />

        <div className="relative z-10 text-luxury-warm-white text-center max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-12">
            <Sparkles size={16} className="text-luxury-accent opacity-80" />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase opacity-80">Iconik Club</span>
          </div>
          <h2 className="luxury-heading text-6xl leading-tight mb-6">
            Your personal<br /><span className="text-luxury-accent italic">style edit.</span>
          </h2>
          <p className="luxury-body text-base opacity-70 leading-relaxed mb-12 text-luxury-cream">
            Curated outfits from our luxury catalog, styled explicitly for your unique geometry and coloring.
          </p>
          <div className="flex flex-col gap-4 text-sm text-left px-8">
            {['Personalized to your structural geometry', 'Curated from premium, handpicked brands', 'Shop directly from your secure vault'].map(pt => (
              <div key={pt} className="flex items-center gap-4 opacity-70 text-luxury-cream luxury-body">
                <div className="w-1.5 h-1.5 rounded-full bg-luxury-accent flex-shrink-0" />
                {pt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form panel ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-luxury-warm-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile-only brand header */}
          <div className="lg:hidden text-center mb-10">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles size={16} className="text-luxury-accent" />
              <p className="text-xs font-semibold text-luxury-accent tracking-widest uppercase">Iconik Club</p>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="luxury-heading text-4xl lg:text-5xl text-luxury-charcoal mb-3">Welcome back.</h1>
            <p className="luxury-body text-base text-luxury-charcoal/60">Unlock your private styling vault.</p>
          </div>

          <div className="bg-white rounded-3xl border border-luxury-cream p-8 md:p-10 shadow-2xl shadow-luxury-charcoal/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-luxury-charcoal/60 uppercase tracking-widest mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your.name@example.com" className={inputCls} />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-luxury-charcoal/60 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-luxury-charcoal/40 hover:text-luxury-charcoal transition-colors focus:outline-none">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="luxury-body text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 rounded-full bg-luxury-accent hover:bg-luxury-accent/90 text-white luxury-body text-base font-semibold tracking-wide transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-luxury-accent/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-luxury-accent/30"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Authenticating…' : 'Enter Vault'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-luxury-cream">
              <p className="luxury-body text-xs text-center text-luxury-charcoal/50 leading-relaxed">
                Your private access credentials were provided via secure email upon joining the Iconik Club.
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-luxury-warm-white"><Loader2 size={24} className="animate-spin text-luxury-accent" /></div>}>
      <ClientLoginContent />
    </Suspense>
  );
}
