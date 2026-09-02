'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/stylist-workspace/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'jazz', pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign in failed');
      router.replace(search.get('redirectTo') || '/stylist/jazz/dashboard');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: '#F4EFE5', color: '#2C2622' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5" style={{ background: '#2C2622', color: '#F4EFE5' }}><Sparkles size={22} /></div>
          <p className="iconik-micro mb-2" style={{ color: '#C9A96E' }}>ICONIK · INDIA CONSULTATIONS</p>
          <h1 className="iconik-display text-4xl">Welcome, Jazz</h1>
          <p className="luxury-body text-sm mt-3" style={{ color: 'rgba(44,38,34,.52)' }}>Enter your stylist PIN to open today’s report queue.</p>
        </div>
        <form onSubmit={submit} className="rounded-3xl p-7 md:p-9" style={{ background: '#EDE5D2', border: '1px solid rgba(44,38,34,.10)' }}>
          <label className="iconik-micro" style={{ color: 'rgba(44,38,34,.48)' }}>Stylist PIN</label>
          <div className="relative mt-3">
            <input autoFocus inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={12} required value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))}
              type={showPin ? 'text' : 'password'} placeholder="••••" className="w-full rounded-2xl px-5 py-4 pr-12 text-xl tracking-[.3em] outline-none"
              style={{ background: '#F4EFE5', border: '1px solid rgba(44,38,34,.12)' }} />
            <button type="button" onClick={() => setShowPin(value => !value)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(44,38,34,.45)' }}>
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <p className="mt-4 rounded-xl px-4 py-3 text-sm luxury-body" style={{ color: '#A8433B', background: 'rgba(196,100,90,.10)' }}>{error}</p>}
          <button disabled={loading} className="mt-5 w-full rounded-2xl py-4 flex items-center justify-center gap-2 luxury-body text-sm disabled:opacity-50" style={{ background: '#2C2622', color: '#F4EFE5' }}>
            {loading && <Loader2 size={16} className="animate-spin" />} {loading ? 'Opening workspace…' : 'Open workspace'}
          </button>
        </form>
        <div className="text-center mt-5"><Link href="/stylist/admin/workspace" className="luxury-body text-sm underline" style={{ color: '#746D65' }}>Admin: all stylists & clients</Link></div>
        <p className="text-center iconik-micro mt-6" style={{ color: 'rgba(44,38,34,.32)' }}>Private stylist access · Session expires daily</p>
      </div>
    </div>
  );
}

export default function StylistWorkspaceLogin() {
  return <Suspense><LoginForm /></Suspense>;
}
