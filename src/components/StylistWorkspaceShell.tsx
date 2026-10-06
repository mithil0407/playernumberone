'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Pill } from './manAdmin/ui';
import './manAdmin/man-admin.css';
import './stylistStaff/stylist-staff.css';

export default function StylistWorkspaceShell({
  children,
  stylist,
  adminPreview = false,
}: {
  children: React.ReactNode;
  stylist: { name: string; slug: string };
  adminPreview?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const base = `/stylist/${stylist.slug}`;
  // The report studio owns its whole screen.
  if (pathname.startsWith(`${base}/reports/`)) return <div className="ma-root st-root">{children}</div>;

  const logout = async () => {
    if (adminPreview) { router.push('/stylist/admin/workspace'); return; }
    if (signingOut) return;
    setSigningOut(true); setLogoutError('');
    try {
      const response = await fetch('/api/stylist-workspace/auth/logout', { method: 'POST', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Could not sign out. Please try again.');
      // Discard private client state when ending the session.
      window.location.replace('/stylist/login');
    } catch {
      setLogoutError('Could not sign out. Check your connection and try again.');
      setSigningOut(false);
    }
  };

  // The dashboard carries its own tabs, so the shell is only identity and sign-out.
  return (
    <div className="ma-root st-root">
      <header className="ma-glass sticky top-0 z-40" style={{ borderBottom: '1px solid var(--ma-line-2)' }}>
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 sm:px-8">
          <Link href={`${base}/dashboard`} prefetch={false} className="shrink-0" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.34em' }}>
            ICONIK
            <span className="ml-2 ma-faint" style={{ letterSpacing: '0.12em', fontWeight: 500, fontSize: 11 }}>STUDIO</span>
          </Link>
          {adminPreview && <Pill tone="accent">Admin preview</Pill>}
          <span className="ml-auto flex min-w-0 items-center gap-2.5">
            <Avatar name={stylist.name} size={30} />
            <span className="hidden truncate text-[14px] sm:inline" style={{ fontWeight: 500 }}>{stylist.name}</span>
          </span>
          <button type="button" disabled={signingOut} onClick={logout} aria-label={adminPreview ? 'Back to team' : 'Sign out'} className="ma-btn ma-btn--ghost ma-btn--sm shrink-0">
            {adminPreview ? <ArrowLeft size={14} aria-hidden="true" /> : <LogOut size={14} aria-hidden="true" />}
            <span className="hidden sm:inline">{adminPreview ? 'Back to team' : signingOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>
        {logoutError && <p role="alert" className="mx-auto max-w-[1240px] px-4 pb-2 text-[13px] sm:px-8" style={{ color: 'var(--ma-red)' }}>{logoutError}</p>}
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
