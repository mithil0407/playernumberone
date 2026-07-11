'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Clock, IndianRupee, PackageOpen, Plus, Shirt, Sparkles, Users } from 'lucide-react';
import { AdminCard, AdminPageHeader, CLUB, LoadingState, primaryButtonClass, StatusBadge } from '@/components/IconikClubAdminUI';

interface OverviewStats {
  members: number;
  pendingMembers: number;
  outfits: number;
  generatingOutfits: number;
  failedOutfits: number;
  catalogue: number;
  draftItems: number;
  revenueMinor: number;
}

const EMPTY: OverviewStats = { members: 0, pendingMembers: 0, outfits: 0, generatingOutfits: 0, failedOutfits: 0, catalogue: 0, draftItems: 0, revenueMinor: 0 };

function money(minor: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(minor / 100);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setError('');
      try {
        const urls = [
          '/api/iconik-club/admin/clients?limit=1',
          '/api/iconik-club/admin/clients?limit=1&onboarding_complete=false',
          '/api/iconik-club/admin/outfits?limit=1',
          '/api/iconik-club/admin/outfits?limit=1&status=generating',
          '/api/iconik-club/admin/outfits?limit=1&status=failed',
          '/api/iconik-club/items/list?limit=1&status=all',
          '/api/iconik-club/items/list?limit=1&status=draft',
          '/api/iconik-club/admin/revenue?currencyView=inr',
        ];
        const responses = await Promise.all(urls.map(url => fetch(url, { cache: 'no-store' })));
        if (responses.some(response => !response.ok)) throw new Error('Some overview data could not be loaded.');
        const [members, pending, outfits, generating, failed, catalogue, drafts, revenue] = await Promise.all(responses.map(response => response.json()));
        setStats({
          members: members.total ?? 0,
          pendingMembers: pending.total ?? 0,
          outfits: outfits.total ?? 0,
          generatingOutfits: generating.total ?? 0,
          failedOutfits: failed.total ?? 0,
          catalogue: catalogue.total ?? 0,
          draftItems: drafts.total ?? 0,
          revenueMinor: revenue.inrKpis?.last30RevenueInrMinor ?? 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Overview could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const work = [
    { label: 'Members awaiting onboarding', count: stats.pendingMembers, href: '/iconik-club/admin/clients?onboarding=pending', icon: Clock, tone: 'warning' as const, action: 'Review members' },
    { label: 'Outfits currently generating', count: stats.generatingOutfits, href: '/iconik-club/admin/outfits?status=generating', icon: Sparkles, tone: 'accent' as const, action: 'View progress' },
    { label: 'Outfit generations needing attention', count: stats.failedOutfits, href: '/iconik-club/admin/outfits?status=failed', icon: AlertCircle, tone: 'danger' as const, action: 'Resolve failures' },
    { label: 'Catalogue drafts to review', count: stats.draftItems, href: '/iconik-club/admin/items?status=draft', icon: PackageOpen, tone: 'neutral' as const, action: 'Review drafts' },
  ];

  const summary = [
    { label: 'Members', value: String(stats.members), icon: Users },
    { label: 'Outfits', value: String(stats.outfits), icon: Shirt },
    { label: 'Catalogue', value: String(stats.catalogue), icon: PackageOpen },
    { label: 'Revenue · 30 days', value: money(stats.revenueMinor), icon: IndianRupee },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader eyebrow="ICONIK Club" title="Overview" description="The work that needs attention across members, outfits and the catalogue." actions={<Link href="/iconik-club/admin/clients/new" className={primaryButtonClass}><Plus size={15} /> Add member</Link>} />

      {error && <div role="alert" className="mb-5 rounded-xl border px-4 py-3 text-sm" style={{ color: CLUB.red, borderColor: 'rgba(180,94,85,.2)', background: 'rgba(180,94,85,.06)' }}>{error}</div>}

      {loading ? <LoadingState label="Preparing your work queue…" /> : (
        <>
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between"><h2 className="iconik-micro" style={{ color: CLUB.muted }}>Work queue</h2><span className="text-xs" style={{ color: CLUB.faint }}>Open a queue to continue</span></div>
            <AdminCard className="divide-y" >
              {work.map(({ label, count, href, icon: Icon, tone, action }) => (
                <Link key={label} href={href} className="group flex items-center gap-4 px-4 py-4 transition hover:bg-black/[0.025] sm:px-5" style={{ borderColor: CLUB.border }}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: CLUB.card, color: count ? CLUB.ink : CLUB.faint }}><Icon size={17} /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium" style={{ color: CLUB.ink }}>{label}</p><p className="mt-0.5 text-xs" style={{ color: CLUB.muted }}>{count ? action : 'Nothing needs attention'}</p></div>
                  <StatusBadge tone={count ? tone : 'success'}>{count}</StatusBadge>
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" style={{ color: CLUB.faint }} />
                </Link>
              ))}
            </AdminCard>
          </div>

          <div>
            <h2 className="iconik-micro mb-3" style={{ color: CLUB.muted }}>Business summary</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {summary.map(({ label, value, icon: Icon }) => <AdminCard key={label} className="p-4 sm:p-5"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: CLUB.card, color: CLUB.gold }}><Icon size={16} /></div><p className="iconik-display text-2xl sm:text-[28px]" style={{ color: CLUB.ink }}>{value}</p><p className="iconik-micro mt-2" style={{ color: CLUB.muted }}>{label}</p></AdminCard>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
