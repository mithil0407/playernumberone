'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, CheckCircle, FileEdit, Archive, Plus, ArrowRight, Users, UserCheck, Clock } from 'lucide-react';

interface ItemStats   { total: number; active: number; draft: number; archived: number; }
interface ClientStats { total: number; active: number; pending: number; }

function StatCard({
  label, value, icon: Icon, gradient, loading,
}: {
  label: string; value: number; icon: React.ElementType; gradient: string; loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${gradient}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        {loading
          ? <div className="h-7 w-12 bg-[#ffb3d1]/30 rounded-lg animate-pulse mb-1" />
          : <p className="text-2xl font-bold text-[#4a2c3e]">{value}</p>
        }
        <p className="text-xs text-[#4a2c3e]/50 font-medium uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [itemStats,   setItemStats]   = useState<ItemStats>({ total: 0, active: 0, draft: 0, archived: 0 });
  const [clientStats, setClientStats] = useState<ClientStats>({ total: 0, active: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/iconik-club/items/list?status=all&limit=1').then(r => r.json()),
      fetch('/api/iconik-club/items/list?status=active&limit=1').then(r => r.json()),
      fetch('/api/iconik-club/items/list?status=draft&limit=1').then(r => r.json()),
      fetch('/api/iconik-club/items/list?status=archived&limit=1').then(r => r.json()),
      fetch('/api/iconik-club/admin/clients?limit=1').then(r => r.json()),
      fetch('/api/iconik-club/admin/clients?limit=1&onboarding_complete=true').then(r => r.json()),
      fetch('/api/iconik-club/admin/clients?limit=1&onboarding_complete=false').then(r => r.json()),
    ])
      .then(([all, active, draft, archived, allClients, activeClients, pendingClients]) => {
        setItemStats({
          total:    all.total      ?? 0,
          active:   active.total   ?? 0,
          draft:    draft.total    ?? 0,
          archived: archived.total ?? 0,
        });
        setClientStats({
          total:   allClients.total     ?? 0,
          active:  activeClients.total  ?? 0,
          pending: pendingClients.total ?? 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-1">Overview</p>
          <h2 className="luxury-heading text-3xl text-[#4a2c3e]">Dashboard</h2>
        </div>
        <Link
          href="/iconik-club/admin/items/upload"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#ff6b9d] hover:bg-[#e85a8a] text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-[#ff6b9d]/20"
        >
          <Plus size={15} />
          Upload item
        </Link>
      </div>

      {/* Client stats */}
      <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-3">Members</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total members"     value={clientStats.total}   icon={Users}       gradient="bg-gradient-to-br from-violet-400 to-violet-600"  loading={loading} />
        <StatCard label="Onboarded"         value={clientStats.active}  icon={UserCheck}   gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"  loading={loading} />
        <StatCard label="Pending onboarding" value={clientStats.pending} icon={Clock}       gradient="bg-gradient-to-br from-amber-400 to-amber-500"      loading={loading} />
      </div>

      {/* Item stats */}
      <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-3">Catalogue items</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total items" value={itemStats.total}    icon={ShoppingBag} gradient="bg-gradient-to-br from-[#ff6b9d] to-[#e85a8a]"    loading={loading} />
        <StatCard label="Active"      value={itemStats.active}   icon={CheckCircle} gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"   loading={loading} />
        <StatCard label="Drafts"      value={itemStats.draft}    icon={FileEdit}    gradient="bg-gradient-to-br from-amber-400 to-amber-500"        loading={loading} />
        <StatCard label="Archived"    value={itemStats.archived} icon={Archive}     gradient="bg-gradient-to-br from-slate-400 to-slate-500"        loading={loading} />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
        <p className="text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest mb-4">Quick actions</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'View all clients',  href: '/iconik-club/admin/clients' },
            { label: 'Pending onboarding', href: '/iconik-club/admin/clients?onboarding=false' },
            { label: 'Upload new item',   href: '/iconik-club/admin/items/upload' },
            { label: 'Review drafts',     href: '/iconik-club/admin/items?status=draft' },
            { label: 'Browse all items',  href: '/iconik-club/admin/items' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-[#ffb3d1] text-[#4a2c3e] rounded-xl hover:bg-[#fff0f5] hover:border-[#ff6b9d] hover:text-[#ff6b9d] transition-all group"
            >
              {label}
              <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
