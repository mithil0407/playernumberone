'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import './manAdmin/man-admin.css';

const NAV = [
  { href: '/man/admin/dashboard', label: 'Blueprints' },
  { href: '/man/admin/edit', label: 'ICONIK Edit' },
];

export default function ManAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/iconik-club/admin/logout', { method: 'POST' });
    router.push('/man/admin/login');
    router.refresh();
  };

  // Login and the report workspace own their whole screen.
  if (pathname === '/man/admin/login' || pathname.startsWith('/man/admin/report/')) {
    return <div className="ma-root">{children}</div>;
  }

  return (
    <div className="ma-root">
      <header className="ma-glass sticky top-0 z-40" style={{ borderBottom: '1px solid var(--ma-line-2)' }}>
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-6 px-4 sm:px-8">
          <Link href="/man/admin/dashboard" className="shrink-0" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.34em' }}>
            ICONIK
            <span className="ml-2 ma-faint" style={{ letterSpacing: '0.12em', fontWeight: 500, fontSize: 11 }}>MAN</span>
          </Link>
          <nav className="ma-seg" aria-label="Admin sections">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined}>
                <span className="ma-seg__item" data-active={pathname.startsWith(href)}>{label}</span>
              </Link>
            ))}
          </nav>
          <button type="button" onClick={handleLogout} className="ma-btn ma-btn--ghost ma-btn--sm ml-auto" aria-label="Sign out">
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
