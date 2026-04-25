'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

function ManAdminLoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirectTo') ?? '/globe/admin/dashboard';

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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#090909' }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)' }}
          >
            <ShieldCheck size={22} className="text-white" />
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#c9a96e' }}>
            ICONIK Globe
          </p>
          <h1 className="text-3xl font-light tracking-wide" style={{ color: '#f0ebe0' }}>
            Admin Portal
          </h1>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border p-8" style={{ background: '#111111', borderColor: '#2a2a2a' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: '#6b5f4a' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  color: '#f0ebe0',
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#c9a96e'; }}
                onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = '#2a2a2a'; }}
              />
            </div>

            <div>
              <label
                className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: '#6b5f4a' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl text-sm outline-none transition"
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    color: '#f0ebe0',
                  }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#c9a96e'; }}
                  onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = '#2a2a2a'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#6b5f4a' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm rounded-xl px-4 py-2.5" style={{ color: '#ef4444', background: '#1a0a0a', border: '1px solid #3a1010' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ManAdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#090909' }}>
        <Loader2 size={22} className="animate-spin" style={{ color: '#c9a96e' }} />
      </div>
    }>
      <ManAdminLoginContent />
    </Suspense>
  );
}
