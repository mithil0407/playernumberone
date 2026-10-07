'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import './manAdmin/man-admin.css';
import './stylistStaff/stylist-staff.css';

const NAV = [
  { href: '/stylist/admin/workspace', label: 'Workspaces' },
  { href: '/stylist/admin/dashboard', label: 'Blueprints' },
  { href: '/stylist/admin/instant', label: 'Instant' },
  { href: '/stylist/admin/manual', label: 'Manual' },
  { href: '/stylist/admin/edit', label: 'ICONIK Edit' },
];

export default function StylistAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/iconik-club/admin/logout', { method: 'POST' });
    router.push('/stylist/admin/login');
    router.refresh();
  };

  // Login and the report studio own their whole screen.
  if (pathname === '/stylist/admin/login' || pathname.startsWith('/stylist/admin/report/')) {
    return <div className="ma-root st-root">{children}</div>;
  }

  return (
    <div className="ma-root st-root">
      <header className="ma-glass sticky top-0 z-40" style={{ borderBottom: '1px solid var(--ma-line-2)' }}>
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-6 px-4 sm:px-8">
          <Link href="/stylist/admin/workspace" className="shrink-0" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.34em' }}>
            ICONIK
            <span className="ml-2 ma-faint" style={{ letterSpacing: '0.12em', fontWeight: 500, fontSize: 11 }}>STYLIST</span>
          </Link>
          <nav className="ma-seg min-w-0" aria-label="Admin sections">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined}>
                <span className="ma-seg__item" data-active={pathname.startsWith(href)}>{label}</span>
              </Link>
            ))}
          </nav>
          <button type="button" onClick={handleLogout} className="ma-btn ma-btn--ghost ma-btn--sm ml-auto shrink-0" aria-label="Sign out">
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
