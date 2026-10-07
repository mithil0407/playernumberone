'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { stylistWorkspaceDestination } from '@/lib/stylistWorkspaceNavigation';
import '@/components/manAdmin/man-admin.css';
import '@/components/stylistStaff/stylist-staff.css';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [pin, setPin] = useState('');
  const requestedSlug = search.get('stylist') || search.get('redirectTo')?.match(/^\/stylist\/([^/]+)\//)?.[1] || '';
  const [slug, setSlug] = useState(requestedSlug);
  const [stylists, setStylists] = useState<Array<{name: string; slug: string}>>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterRetry, setRosterRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setRosterLoading(true);
    void fetch('/api/stylist-workspace/auth/stylists', { signal: abort.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStylists(data.stylists); setError('');
    }).catch(caught => { if (!abort.signal.aborted) setError(caught.message || 'Could not load stylists'); })
      .finally(() => { if (!abort.signal.aborted) setRosterLoading(false); });
    return () => abort.abort();
  }, [rosterRetry]);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/stylist-workspace/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, pin }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign in failed');
      router.replace(stylistWorkspaceDestination(data.stylist.slug, search.get('redirectTo')));
      setPin('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign in failed');
      setLoading(false);
    }
  };

  const chosen = stylists.find(person => person.slug === slug)?.name;
  return (
    <div className="ma-root st-root flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.34em' }}>ICONIK</div>
          <h1 className="ma-title mt-5">{chosen ? <>Welcome, <em>{chosen}</em></> : <>Stylist <em>studio</em></>}</h1>
          <p className="ma-faint mt-2 text-[14px]">Choose your name and enter your stylist PIN.</p>
        </div>
        <form onSubmit={submit} className="ma-card space-y-4 p-7">
          <label className="block">
            <span className="ma-label">Your name</span>
            <select required aria-label="Your name" value={slug} onChange={event => { setSlug(event.target.value); setPin(''); setError(''); }} disabled={rosterLoading} className="ma-select">
              <option value="">{rosterLoading ? 'Loading your team…' : 'Choose your name'}</option>
              {stylists.map(person => <option key={person.slug} value={person.slug}>{person.name}</option>)}
            </select>
          </label>
          {!rosterLoading && !stylists.length && <button type="button" onClick={() => setRosterRetry(value => value + 1)} className="ma-btn ma-btn--ghost ma-btn--sm">Reload stylist list</button>}
          <label htmlFor="stylist-pin" className="block">
            <span className="ma-label">Stylist PIN</span>
            <span className="relative block">
              <input id="stylist-pin" autoComplete="current-password" inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={12} required value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))}
                type={showPin ? 'text' : 'password'} placeholder="••••" className="ma-input"
                style={{ height: 52, paddingRight: 44, fontSize: 20, letterSpacing: '0.3em' }} />
              <button type="button" aria-label={showPin ? 'Hide PIN' : 'Show PIN'} onClick={() => setShowPin(value => !value)} className="ma-faint absolute right-3.5 top-1/2 -translate-y-1/2">
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
          {error && <p role="alert" className="rounded-xl px-4 py-2.5 text-[13px]" style={{ background: 'var(--ma-red-soft)', color: 'var(--ma-red)' }}>{error}</p>}
          <button type="submit" disabled={loading || rosterLoading || !stylists.some(person => person.slug === slug)} className="ma-btn ma-btn--primary ma-btn--lg w-full">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Opening workspace…' : 'Open workspace'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/stylist/admin/workspace" className="ma-btn ma-btn--ghost ma-btn--sm">Admin: all stylists &amp; clients</Link>
        </div>
        <p className="ma-eyebrow mt-4 text-center">Private stylist access</p>
      </div>
    </div>
  );
}

export default function StylistWorkspaceLogin() {
  return <Suspense><LoginForm /></Suspense>;
}
