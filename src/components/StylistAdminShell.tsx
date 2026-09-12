'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardCheck, FilePlus2, LayoutDashboard, LogOut, Mail, Menu, UsersRound, X } from 'lucide-react';

const NAV = [
  { href: '/stylist/admin/workspace', label: 'Stylist Workspaces', icon: UsersRound },
  { href: '/stylist/admin/dashboard', label: 'Blueprints', icon: LayoutDashboard },
  { href: '/stylist/admin/instant', label: 'Instant Reports', icon: ClipboardCheck },
  { href: '/stylist/admin/manual', label: 'Manual Reports', icon: FilePlus2 },
  { href: '/stylist/admin/edit', label: 'ICONIK Edit', icon: Mail },
];

const S = {
  bg: '#F4EFE5',
  sidebar: '#EDE5D2',
  border: 'rgba(44,38,34,0.1)',
  ink: '#2C2622',
  muted: 'rgba(44,38,34,0.4)',
  slate: '#94A6AD',
  activeLink: '#F4EFE5',
  activeBg: '#2C2622',
  hoverBg: 'rgba(44,38,34,0.05)',
};

export default function StylistAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/iconik-club/admin/logout', { method: 'POST' });
    router.push('/stylist/admin/login');
    router.refresh();
  };

  if (pathname === '/stylist/admin/login') return <>{children}</>;
  if (pathname.startsWith('/stylist/admin/report/')) {
    return <div className="min-h-screen" style={{ background: S.bg, fontFamily: 'var(--font-inter, system-ui)' }}>{children}</div>;
  }

  return (
    <div className="min-h-screen flex" style={{ background: S.bg, fontFamily: 'var(--font-inter, system-ui)' }}>
      {open && <div className="fixed inset-0 z-20 lg:hidden" style={{ background: 'rgba(44,38,34,0.4)' }} onClick={() => setOpen(false)} />}
      <aside
        className={`fixed top-0 left-0 h-full z-30 w-56 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}
        style={{ background: S.sidebar, borderRight: `1px solid ${S.border}` }}
      >
        {/* Brand */}
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${S.border}` }}>
          <div className="iconik-display" style={{ fontSize: '13px', letterSpacing: '0.32em', color: S.ink }}>I C O N I K</div>
          <div className="iconik-micro mt-1.5" style={{ color: S.muted }}>Stylist · Admin</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  background: active ? S.activeBg : 'transparent',
                  color: active ? S.activeLink : S.muted,
                }}
              >
                <Icon size={15} />
                <span className="luxury-body" style={{ fontWeight: active ? 500 : 400 }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4" style={{ borderTop: `1px solid ${S.border}` }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg luxury-body transition"
            style={{ color: S.muted }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3.5" style={{ background: S.sidebar, borderBottom: `1px solid ${S.border}` }}>
          <button onClick={() => setOpen(true)} style={{ color: S.muted }}><Menu size={20} /></button>
          <span className="iconik-display" style={{ fontSize: '13px', letterSpacing: '0.28em', color: S.ink }}>I C O N I K</span>
          {open && <button onClick={() => setOpen(false)} className="ml-auto" style={{ color: S.muted }}><X size={20} /></button>}
        </header>
        <main className="flex-1 p-5 lg:p-8" style={{ background: S.bg }}>{children}</main>
      </div>
    </div>
  );
}
