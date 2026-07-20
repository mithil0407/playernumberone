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
}: {
  children: React.ReactNode;
  stylist: { name: string; slug: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const base = `/stylist/${stylist.slug}`;
  if (pathname.startsWith(`${base}/reports/`)) return <>{children}</>;
  const nav = [
    { href: `${base}/dashboard`, label: 'Today & Queue', icon: LayoutDashboard },
    { href: `${base}/dashboard?bucket=needs_review`, label: 'Reports to Review', icon: ClipboardList },
    { href: `${base}/dashboard?bucket=needs_attention`, label: 'Needs Attention', icon: AlertTriangle },
  ];

  const logout = async () => {
    await fetch('/api/stylist-workspace/auth/logout', { method: 'POST' });
    router.replace('/stylist/login');
    router.refresh();
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
            <button className="lg:hidden" onClick={() => setOpen(false)} style={{ color: COLORS.muted }}><X size={18} /></button>
          </div>
        </div>
        <div className="px-4 py-5">
          <div className="rounded-2xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            <p className="iconik-micro" style={{ color: COLORS.muted }}>Signed in as</p>
            <p className="iconik-display text-xl mt-1">{stylist.name}</p>
            <div className="flex items-center gap-2 mt-3 text-xs luxury-body" style={{ color: '#5A8B6A' }}>
              <span className="w-2 h-2 rounded-full bg-[#5A8B6A]" /> Pilot workspace active
            </div>
          </div>
        </div>
        <nav className="px-3 space-y-1 flex-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const hrefBucket = new URLSearchParams(href.split('?')[1] ?? '').get('bucket') ?? 'today';
            const currentBucket = searchParams.get('bucket') ?? 'today';
            const active = pathname === href.split('?')[0] && currentBucket === hrefBucket;
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm luxury-body transition"
                style={{ background: active ? COLORS.ink : 'transparent', color: active ? COLORS.bg : COLORS.muted }}>
                <Icon size={16} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <button onClick={logout} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm luxury-body" style={{ color: COLORS.muted }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3" style={{ background: COLORS.shell, borderBottom: `1px solid ${COLORS.border}` }}>
          <button onClick={() => setOpen(true)}><Menu size={20} /></button>
          <span className="iconik-display text-[13px] tracking-[.25em]">I C O N I K</span>
          <span className="ml-auto luxury-body text-sm" style={{ color: COLORS.muted }}>{stylist.name}</span>
        </header>
        <main className="p-4 md:p-7 xl:p-10">{children}</main>
      </div>
    </div>
  );
}
