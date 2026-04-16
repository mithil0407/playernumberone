'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, X, FileText } from 'lucide-react';

const NAV = [{ href: '/man/admin/dashboard', label: 'Submissions', icon: LayoutDashboard }];

export default function ManAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/iconik-club/admin/logout', { method: 'POST' });
    router.push('/man/admin/login');
    router.refresh();
  };

  if (pathname === '/man/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen flex" style={{ background: '#090909', fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      {open && (
        <div className="fixed inset-0 bg-black/70 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`
        fixed top-0 left-0 h-full z-30 w-56 flex flex-col
        border-r transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}
        style={{ background: '#0f0f0f', borderColor: '#1e1e1e' }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: '#1e1e1e' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)' }}
            >
              <FileText size={14} className="text-white" />
            </div>
            <div className="leading-none">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: '#f0ebe0' }}>
                Iconik
              </p>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#c9a96e' }}>
                Man · Admin
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? '#1e1a14' : 'transparent',
                  color: active ? '#c9a96e' : '#6b5f4a',
                  borderLeft: active ? '2px solid #c9a96e' : '2px solid transparent',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t" style={{ borderColor: '#1e1e1e' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-all"
            style={{ color: '#6b5f4a' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = '#1a0a0a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b5f4a';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ background: '#0f0f0f', borderColor: '#1e1e1e' }}
        >
          <button onClick={() => setOpen(true)} style={{ color: '#6b5f4a' }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)' }}
            >
              <FileText size={11} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-wide" style={{ color: '#f0ebe0' }}>
              Man Admin
            </span>
          </div>
          {open && (
            <button onClick={() => setOpen(false)} className="ml-auto" style={{ color: '#6b5f4a' }}>
              <X size={20} />
            </button>
          )}
        </header>

        <main className="flex-1 p-5 lg:p-8" style={{ background: '#090909' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
