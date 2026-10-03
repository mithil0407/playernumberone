'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

function ManAdminLoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirectTo') ?? '/man/admin/dashboard';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/iconik-club/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { setError('Invalid email or password.'); return; }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.34em' }}>ICONIK</div>
          <h1 className="ma-title mt-5">Men&apos;s <em>studio</em></h1>
          <p className="ma-faint mt-2 text-[14px]">Sign in to review and send Blueprints.</p>
        </div>

        <form onSubmit={handleSubmit} className="ma-card space-y-4 p-7">
          <label className="block">
            <span className="ma-label">Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" className="ma-input" />
          </label>
          <label className="block">
            <span className="ma-label">Password</span>
            <span className="relative block">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="ma-input"
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="ma-faint absolute right-3.5 top-1/2 -translate-y-1/2" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          {error && <p className="rounded-xl px-4 py-2.5 text-[13px]" style={{ background: 'var(--ma-red-soft)', color: 'var(--ma-red)' }}>{error}</p>}

          <button type="submit" disabled={loading} className="ma-btn ma-btn--primary ma-btn--lg w-full">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ManAdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={22} className="animate-spin ma-faint" />
      </div>
    }>
      <ManAdminLoginContent />
    </Suspense>
  );
}
