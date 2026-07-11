'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Users,
  Shirt,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { CLUB } from '@/components/IconikClubAdminUI';

const NAV = [
  { href: '/iconik-club/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/iconik-club/admin/clients', label: 'Members', icon: Users },
  { href: '/iconik-club/admin/outfits', label: 'Outfits', icon: Shirt },
  { href: '/iconik-club/admin/items', label: 'Catalogue', icon: ShoppingBag },
  { href: '/iconik-club/admin/revenue', label: 'Revenue', icon: BarChart3 },
];

export default function IconikClubAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/iconik-club/admin/logout', { method: 'POST' });
    router.push('/iconik-club/admin/login');
    router.refresh();
  };

  const isLoginPage = pathname === '/iconik-club/admin/login';

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="iconik-club-admin min-h-screen flex" style={{ background: CLUB.bg, fontFamily: 'var(--font-inter, system-ui)' }}>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`
        fixed top-0 left-0 h-full z-30 w-56
        flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}
        style={{ background: CLUB.card, borderRight: `1px solid ${CLUB.border}` }}
      >
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${CLUB.border}` }}>
          <div className="iconik-display" style={{ fontSize: 13, letterSpacing: '0.32em', color: CLUB.ink }}>I C O N I K</div>
          <div className="iconik-micro mt-1.5" style={{ color: CLUB.muted }}>Club · Admin</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{ background: active ? CLUB.ink : 'transparent', color: active ? CLUB.bg : CLUB.muted }}
              >
                <Icon size={15} />
                <span className="luxury-body" style={{ fontWeight: active ? 500 : 400 }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: `1px solid ${CLUB.border}` }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg luxury-body transition-all hover:bg-black/5"
            style={{ color: CLUB.muted }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3.5" style={{ background: CLUB.card, borderBottom: `1px solid ${CLUB.border}` }}>
          <button onClick={() => setOpen(true)} aria-label="Open navigation" style={{ color: CLUB.muted }}>
            <Menu size={20} />
          </button>
          <span className="iconik-display" style={{ fontSize: 13, letterSpacing: '0.28em', color: CLUB.ink }}>I C O N I K</span>
          {open && (
            <button onClick={() => setOpen(false)} aria-label="Close navigation" className="ml-auto" style={{ color: CLUB.muted }}>
              <X size={20} />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8" style={{ background: CLUB.bg }}>{children}</main>
      </div>
    </div>
  );
}
