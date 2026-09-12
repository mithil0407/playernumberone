'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock3, RefreshCw } from 'lucide-react';

interface ReportRow { id: string; status: string; progress_stage?: string | null; error_message?: string | null; sla_due_at: string; created_at: string; stylist_orders?: { customer_name?: string; customer_email?: string; customer_phone?: string } | null }
export default function InstantReportsAdminPage() {
  const [reports, setReports] = useState<ReportRow[]>([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); const response = await fetch('/api/instant-report/admin', { cache: 'no-store' }); if (response.status === 401) { window.location.assign('/stylist/admin/login'); return; } const data = await response.json(); setReports(data.reports || []); setLoading(false); }, []);
  useEffect(() => { void load(); }, [load]);
  return <div><div className="mb-7 flex items-center justify-between"><div><div className="iconik-micro mb-2 text-[#2C2622]/40">₹999 PRODUCT</div><h1 className="iconik-display text-3xl text-[#2C2622]">Instant Reports</h1></div><button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-[#2C2622]/10 bg-[#EDE5D2] px-4 py-2.5 text-sm text-[#2C2622]/60"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
    <div className="overflow-hidden rounded-2xl border border-[#2C2622]/10 bg-[#F4EFE5]"><table className="w-full"><thead className="bg-[#EDE5D2]"><tr>{['Client','Status','SLA due','Created','Action'].map(head => <th key={head} className="px-4 py-3 text-left iconik-micro text-[#2C2622]/40">{head}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={5} className="p-10 text-center text-sm text-[#2C2622]/40">Loading…</td></tr> : reports.map(report => <tr key={report.id} className="border-t border-[#2C2622]/10"><td className="px-4 py-4"><div className="text-sm font-medium">{report.stylist_orders?.customer_name || report.stylist_orders?.customer_email || 'Customer'}</div><div className="mt-1 text-xs text-[#2C2622]/40">{report.stylist_orders?.customer_email}</div></td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${report.status === 'review_required' ? 'bg-amber-100 text-amber-800' : report.status === 'published' ? 'bg-green-100 text-green-800' : report.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-[#EDE5D2] text-[#2C2622]/55'}`}>{report.status.replace(/_/g,' ')}</span></td><td className="px-4 py-4 text-xs text-[#2C2622]/55"><span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" />{new Date(report.sla_due_at).toLocaleString('en-IN')}</span></td><td className="px-4 py-4 text-xs text-[#2C2622]/45">{new Date(report.created_at).toLocaleDateString('en-IN')}</td><td className="px-4 py-4"><Link href={`/stylist/admin/instant/${report.id}`} className="text-sm font-medium underline">Review</Link></td></tr>)}</tbody></table></div>
  </div>;
}

