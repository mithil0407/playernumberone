'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Shirt,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

const NAV = [
  { href: '/iconik-club/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/iconik-club/admin/items',     label: 'Items',     icon: ShoppingBag },
  { href: '/iconik-club/admin/clients',   label: 'Clients',   icon: Users },
  { href: '/iconik-club/admin/outfits',   label: 'Outfits',   icon: Shirt },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/iconik-club/admin/logout', { method: 'POST' });
    router.push('/iconik-club/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex bg-[#f8f5f7]" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-30 w-60 bg-white border-r border-[#ffb3d1]/60
        flex flex-col transition-transform duration-200 shadow-lg shadow-black/5
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none
      `}>
        {/* Brand header */}
        <div className="px-5 py-5 border-b border-[#ffb3d1]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b9d] to-[#e85a8a] rounded-xl flex items-center justify-center shadow-sm shadow-[#ff6b9d]/30 flex-shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="leading-none">
              <p className="text-[11px] font-bold text-[#4a2c3e] tracking-[0.15em] uppercase">Iconik</p>
              <p className="text-[9px] text-[#ff6b9d] tracking-[0.2em] uppercase font-semibold">Admin</p>
            </div>
          </div>
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
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-[#fff0f5] text-[#ff6b9d] shadow-sm'
                    : 'text-[#4a2c3e]/60 hover:bg-[#fff8fb] hover:text-[#4a2c3e]'
                  }
                `}
              >
                <Icon size={17} className={active ? 'text-[#ff6b9d]' : 'text-[#4a2c3e]/40'} />
                {label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ff6b9d]" />}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-[#ffb3d1]/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#4a2c3e]/50 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3.5 bg-white border-b border-[#ffb3d1]/60">
          <button onClick={() => setOpen(true)} className="text-[#4a2c3e]/60 hover:text-[#4a2c3e]">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#ff6b9d] to-[#e85a8a] rounded-lg flex items-center justify-center">
              <Sparkles size={11} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[#4a2c3e] tracking-wide">Iconik Admin</span>
          </div>
          {open && (
            <button onClick={() => setOpen(false)} className="ml-auto text-[#4a2c3e]/60">
              <X size={20} />
            </button>
          )}
        </header>

        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
