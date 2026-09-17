'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

const COLORS = {
  bg: '#F4EFE5', shell: '#EDE5D2', ink: '#2C2622', muted: '#655E57', border: 'rgba(44,38,34,.10)',
};

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
  if (pathname.startsWith(`${base}/reports/`)) return <>{children}</>;

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
    <div className="min-h-screen" style={{ background: COLORS.bg, color: COLORS.ink }}>
      <header className="sticky top-0 z-20" style={{ background: COLORS.shell, borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="max-w-[1400px] mx-auto h-14 px-4 md:px-7 flex items-center gap-4">
          <Link href={`${base}/dashboard`} prefetch={false} className="iconik-display text-[13px] tracking-[.32em]">I C O N I K</Link>
          {adminPreview && <span className="luxury-body text-[11px] rounded-full px-2.5 py-1" style={{ background: COLORS.bg, color: COLORS.muted }}>Admin preview</span>}
          <span className="ml-auto luxury-body text-sm truncate">{stylist.name}</span>
          <button disabled={signingOut} onClick={logout} aria-label={adminPreview ? 'Back to team' : 'Sign out'} className="inline-flex items-center gap-2 luxury-body text-sm disabled:opacity-50" style={{ color: COLORS.muted }}>
            <LogOut size={15} aria-hidden="true" /><span className="hidden sm:inline">{adminPreview ? 'Back to team' : signingOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>
        {logoutError && <p role="alert" className="max-w-[1400px] mx-auto px-4 md:px-7 pb-2 text-xs text-red-800">{logoutError}</p>}
      </header>
      <main className="px-4 py-6 md:px-7 md:py-8">{children}</main>
    </div>
  );
}
