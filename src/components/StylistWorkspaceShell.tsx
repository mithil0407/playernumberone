'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ClipboardList, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const COLORS = {
  bg: '#F4EFE5', shell: '#EDE5D2', ink: '#2C2622', muted: 'rgba(44,38,34,.48)',
  border: 'rgba(44,38,34,.10)', slate: '#94A6AD', gold: '#C9A96E',
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
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const base = `/stylist/${stylist.slug}`;
  if (pathname.startsWith(`${base}/reports/`)) return <>{children}</>;
  const nav = [
    { href: `${base}/dashboard?bucket=reports`, label: 'My report desk', icon: LayoutDashboard },
    { href: `${base}/dashboard?bucket=needs_review`, label: 'Continue reviewing', icon: ClipboardList },
    { href: `${base}/dashboard?bucket=all`, label: 'All my clients', icon: LayoutDashboard },
    { href: `${base}/dashboard?bucket=delivered`, label: 'Delivered reports', icon: ClipboardList },
    { href: `${base}/dashboard?bucket=needs_attention`, label: 'Needs attention', icon: AlertTriangle },
  ];

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

  return (
    <div className="min-h-screen flex" style={{ background: COLORS.bg, color: COLORS.ink }}>
      {open && <button aria-label="Close menu" className="fixed inset-0 z-30 lg:hidden" style={{ background: 'rgba(44,38,34,.38)' }} onClick={() => setOpen(false)} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-[250px] shrink-0 flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: COLORS.shell, borderRight: `1px solid ${COLORS.border}` }}
      >
        <div className="px-6 py-6" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="iconik-display text-[13px] tracking-[.32em]">I C O N I K</p>
              <p className="iconik-micro mt-2" style={{ color: COLORS.muted }}>Stylist Workspace</p>
            </div>
            <button aria-label="Close navigation" className="lg:hidden" onClick={() => setOpen(false)} style={{ color: COLORS.muted }}><X size={18} /></button>
          </div>
        </div>
        <div className="px-4 py-5">
          <div className="rounded-2xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            <p className="iconik-micro" style={{ color: COLORS.muted }}>{adminPreview ? 'Admin preview' : 'Your workspace'}</p>
            <p className="iconik-display text-xl mt-1">{stylist.name}</p>
            <div className="flex items-center gap-2 mt-3 text-xs luxury-body" style={{ color: '#5A8B6A' }}>
              <span className="w-2 h-2 rounded-full bg-[#5A8B6A]" /> Private client workspace
            </div>
          </div>
        </div>
        <nav className="px-3 space-y-1 flex-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const hrefBucket = new URLSearchParams(href.split('?')[1] ?? '').get('bucket');
            const currentBucket = searchParams.get('bucket') ?? 'reports';
            const active = pathname === href.split('?')[0] && (hrefBucket ? currentBucket === hrefBucket : !['needs_review', 'needs_attention'].includes(currentBucket));
            return (
              <Link key={href} href={href} prefetch={false} onClick={event => {
                setOpen(false);
                if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0 && pathname === href.split('?')[0]) {
                  event.preventDefault();
                  window.history.pushState(null, '', href);
                }
              }} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm luxury-body transition"
                style={{ background: active ? COLORS.ink : 'transparent', color: active ? COLORS.bg : COLORS.muted }}>
                <Icon size={16} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {logoutError && <p role="alert" className="px-4 pb-2 text-xs text-red-800">{logoutError}</p>}
          <button disabled={signingOut} onClick={logout} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm luxury-body disabled:opacity-50" style={{ color: COLORS.muted }}>
            <LogOut size={15} /> {adminPreview ? 'Back to team overview' : signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3" style={{ background: COLORS.shell, borderBottom: `1px solid ${COLORS.border}` }}>
          <button aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <span className="iconik-display text-[13px] tracking-[.25em]">I C O N I K</span>
          <span className="ml-auto luxury-body text-sm" style={{ color: COLORS.muted }}>{stylist.name}</span>
        </header>
        <main className="p-4 md:p-7 xl:p-10">{children}</main>
      </div>
    </div>
  );
}
