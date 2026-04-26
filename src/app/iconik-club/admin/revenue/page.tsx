'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';

type Currency = 'INR' | 'AUD' | 'USD';
type Market = 'india' | 'au' | 'global' | 'globe';

interface CurrencyKpis {
  totalRevenueMinor: number;
  currentMonthRevenueMinor: number;
  previousMonthRevenueMinor: number;
  momRevenueGrowthPct: number;
  currentMonthOrderCount: number;
  previousMonthOrderCount: number;
  momOrderGrowthPct: number;
  averageOrderValueMinor: number;
  oneTimeRevenueMinor: number;
  subscriptionRevenueMinor: number;
  monthlyRecurringRevenueMinor: number;
  annualRecurringRevenueMinor: number;
  failedPaymentCount: number;
  failedPaymentMinor: number;
}

interface DailyRow {
  day: string;
  label: string;
  oneTimeInrMinor: number;
  subscriptionInrMinor: number;
  totalInrMinor: number;
  paidCount: number;
  failedCount: number;
  averageOrderValueInrMinor: number;
}

interface RecentEvent {
  id: string;
  occurredAt: string;
  sourceMarket: Market;
  marketLabel: string;
  productType: string;
  productLabel: string;
  revenueKind: 'one_time' | 'subscription';
  eventType: string;
  customerEmail: string;
  customerName: string;
  amountMinor: number;
  amountInrMinor: number;
  currency: Currency;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  landingPage: string;
  status: 'paid' | 'failed' | 'pending';
  paymentId: string;
  synthetic: boolean;
}

interface RevenueAnalytics {
  generatedAt: string;
  currencies: Currency[];
  currencyView: 'inr' | 'native';
  kpisByCurrency: Record<Currency, CurrencyKpis>;
  inrKpis: {
    totalRevenueInrMinor: number;
    last30RevenueInrMinor: number;
    mtdRevenueInrMinor: number;
    todayRevenueInrMinor: number;
    yesterdayRevenueInrMinor: number;
    dayOverDayGrowthPct: number;
    averageDailyRevenueInrMinor: number;
    projectedMonthEndRevenueInrMinor: number;
    averageOrderValueInrMinor: number;
    paidOrderCount: number;
    failedPaymentCount: number;
    oneTimeRevenueInrMinor: number;
    subscriptionRevenueInrMinor: number;
    monthlyRecurringRevenueInrMinor: number;
    annualRecurringRevenueInrMinor: number;
    bestDay?: DailyRow;
    worstDay?: DailyRow;
  };
  summaryCounts: {
    customerCount: number;
    newCustomersThisMonth: number;
    repeatCustomers: number;
    activeSubscriptions: number;
    newSubscriptionsThisMonth: number;
    subscriptionCancellationsThisMonth: number;
    subscriptionChurnRatePct: number;
  };
  daily: DailyRow[];
  weekly: Array<{ week: string; label: string; totalInrMinor: number; paidCount: number; failedCount: number }>;
  attribution: {
    bySource: Array<{ label: string; amountInrMinor: number; paidCount: number }>;
    byMedium: Array<{ label: string; amountInrMinor: number; paidCount: number }>;
    byCampaign: Array<{ label: string; amountInrMinor: number; paidCount: number }>;
    byLandingPage: Array<{ label: string; amountInrMinor: number; paidCount: number }>;
    sourceProduct: Array<{ source: string; productType: string; productLabel: string; amountInrMinor: number; paidCount: number }>;
  };
  breakdowns: {
    byMarket: Array<{ market: Market; label: string; currency: Currency; amountMinor: number }>;
    byProductType: Array<{ productType: string; label: string; currency: Currency; amountMinor: number }>;
  };
  recentEvents: RecentEvent[];
  filters: {
    from: string | null;
    to: string | null;
    market: string;
    product: string;
    source: string;
    campaign: string;
    products: string[];
    sources: string[];
    campaigns: string[];
  };
  dataQuality: {
    ledgerEvents: number;
    syntheticEvents: number;
    returnedEvents: number;
    totalEventsBeforeFilters: number;
    unknownAttributionEvents: number;
    fxWarnings?: string[];
    missingTables?: Array<{ table: string; message: string }>;
    note: string;
  };
}

const CURRENCY_SYMBOLS: Record<Currency, string> = { INR: '₹', AUD: 'A$', USD: '$' };
const MARKETS: Array<{ value: 'all' | Market; label: string }> = [
  { value: 'all', label: 'All markets' },
  { value: 'india', label: 'India' },
  { value: 'au', label: 'AU' },
  { value: 'global', label: 'Global' },
  { value: 'globe', label: 'Globe' },
];

function formatInr(amountMinor: number, compact = false) {
  const value = amountMinor / 100;
  if (compact && Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (compact && Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatMoney(amountMinor: number, currency: Currency, compact = false) {
  if (currency === 'INR') return formatInr(amountMinor, compact);
  const value = amountMinor / 100;
  if (compact && Math.abs(value) >= 1000) return `${CURRENCY_SYMBOLS[currency]}${(value / 1000).toFixed(1)}k`;
  return `${CURRENCY_SYMBOLS[currency]}${Math.round(value).toLocaleString('en-IN')}`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'pink',
}: {
  label: string;
  value: string;
  helper?: string;
  icon: React.ElementType;
  tone?: 'pink' | 'emerald' | 'amber' | 'sky' | 'slate' | 'violet';
}) {
  const tones = {
    pink: 'bg-[#fff0f5] text-[#ff6b9d] border-[#ffb3d1]/60',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  };
  return (
    <div className="bg-white border border-[#ffb3d1]/50 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a2c3e]/45">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#4a2c3e] leading-tight">{value}</p>
          {helper && <p className="mt-1 text-xs font-medium text-[#4a2c3e]/50">{helper}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function DailyRevenueChart({ rows }: { rows: DailyRow[] }) {
  const max = Math.max(1, ...rows.map(row => row.totalInrMinor));
  return (
    <div className="bg-white border border-[#ffb3d1]/50 rounded-lg p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b9d]">Daily revenue</p>
          <h2 className="text-xl font-bold text-[#4a2c3e] mt-1">Last 30 days</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-[#4a2c3e]/55">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#ff6b9d]" />One-time</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />Subscription</span>
        </div>
      </div>
      <div className="h-72 grid gap-1.5 items-end" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
        {rows.map(row => {
          const oneTimeHeight = (row.oneTimeInrMinor / max) * 100;
          const subscriptionHeight = (row.subscriptionInrMinor / max) * 100;
          return (
            <div key={row.day} className="h-full flex flex-col justify-end gap-0.5" title={`${row.day}: ${formatInr(row.totalInrMinor)} · ${row.paidCount} paid · ${row.failedCount} failed`}>
              <div className="flex flex-col justify-end h-full rounded-md overflow-hidden bg-[#fff7fa] border border-[#ffb3d1]/35">
                <div className="bg-emerald-400 min-h-[2px]" style={{ height: `${subscriptionHeight}%` }} />
                <div className="bg-[#ff6b9d] min-h-[2px]" style={{ height: `${oneTimeHeight}%` }} />
              </div>
              <span className="text-[9px] font-semibold text-[#4a2c3e]/40 text-center truncate">{row.label.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankingPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; amountInrMinor: number; paidCount: number }>;
}) {
  const visible = rows.slice(0, 8);
  const max = Math.max(1, ...visible.map(row => row.amountInrMinor));
  return (
    <div className="bg-white border border-[#ffb3d1]/50 rounded-lg p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#4a2c3e] mb-4">{title}</h3>
      {visible.length === 0 ? (
        <p className="text-sm text-[#4a2c3e]/45 py-8 text-center">No attributed revenue yet.</p>
      ) : (
        <div className="space-y-3">
          {visible.map(row => (
            <div key={row.label}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-xs font-semibold text-[#4a2c3e]/70 truncate">{row.label}</span>
                <span className="text-xs font-bold text-[#4a2c3e]">{formatInr(row.amountInrMinor, true)} · {row.paidCount}</span>
              </div>
              <div className="h-2 rounded-full bg-[#fff0f5] overflow-hidden">
                <div className="h-full rounded-full bg-[#ff6b9d]" style={{ width: `${(row.amountInrMinor / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NativeCurrencyPanel({ data, currency, setCurrency }: { data: RevenueAnalytics; currency: Currency; setCurrency: (currency: Currency) => void }) {
  const kpis = data.kpisByCurrency[currency];
  return (
    <div className="bg-white border border-[#ffb3d1]/50 rounded-lg p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b9d]">Native reconciliation</p>
          <h2 className="text-xl font-bold text-[#4a2c3e] mt-1">Ledger currency view</h2>
        </div>
        <div className="inline-flex bg-[#fff9f5] border border-[#ffb3d1]/60 rounded-lg p-1">
          {data.currencies.map(option => (
            <button
              key={option}
              onClick={() => setCurrency(option)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold ${currency === option ? 'bg-[#ff6b9d] text-white' : 'text-[#4a2c3e]/55 hover:bg-white'}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="All time" value={formatMoney(kpis.totalRevenueMinor, currency)} helper="Native paid revenue" icon={WalletCards} tone="pink" />
        <StatCard label="This month" value={formatMoney(kpis.currentMonthRevenueMinor, currency)} helper={`${formatPercent(kpis.momRevenueGrowthPct)} vs previous`} icon={TrendingUp} tone="emerald" />
        <StatCard label="One-time" value={formatMoney(kpis.oneTimeRevenueMinor, currency)} helper={`${kpis.currentMonthOrderCount} current-month orders`} icon={CreditCard} tone="sky" />
        <StatCard label="Subscription" value={formatMoney(kpis.subscriptionRevenueMinor, currency)} helper={`MRR ${formatMoney(kpis.monthlyRecurringRevenueMinor, currency)}`} icon={CalendarDays} tone="violet" />
      </div>
    </div>
  );
}

function RevenueTable({ events }: { events: RecentEvent[] }) {
  const [status, setStatus] = useState('all');
  const [market, setMarket] = useState<'all' | Market>('all');
  const [source, setSource] = useState('all');
  const [campaign, setCampaign] = useState('all');
  const [query, setQuery] = useState('');
  const sources = Array.from(new Set(events.map(event => event.utmSource))).sort();
  const campaigns = Array.from(new Set(events.map(event => event.utmCampaign))).sort();
  const filtered = events.filter(event => {
    if (status !== 'all' && event.status !== status) return false;
    if (market !== 'all' && event.sourceMarket !== market) return false;
    if (source !== 'all' && event.utmSource !== source) return false;
    if (campaign !== 'all' && event.utmCampaign !== campaign) return false;
    if (query) {
      const haystack = `${event.customerEmail} ${event.customerName} ${event.paymentId} ${event.utmSource} ${event.utmCampaign}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const exportCsv = () => {
    const headers = ['date', 'customer_email', 'market', 'product', 'status', 'currency', 'amount_native', 'amount_inr', 'source', 'campaign', 'payment_id'];
    const lines = filtered.map(event => [
      event.occurredAt,
      event.customerEmail,
      event.marketLabel,
      event.productLabel,
      event.status,
      event.currency,
      String(event.amountMinor / 100),
      String(event.amountInrMinor / 100),
      event.utmSource,
      event.utmCampaign,
      event.paymentId,
    ].map(value => `"${String(value).replaceAll('"', '""')}"`).join(','));
    const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-events-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-[#ffb3d1]/50 rounded-lg shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#ffb3d1]/45">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b9d]">Revenue events</p>
            <h2 className="text-xl font-bold text-[#4a2c3e] mt-1">Filtered ledger rows</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <div className="relative col-span-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a2c3e]/35" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search" className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] text-xs font-medium text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/25" />
            </div>
            <select value={market} onChange={event => setMarket(event.target.value as 'all' | Market)} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] px-2 text-xs font-semibold text-[#4a2c3e]">
              {MARKETS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={status} onChange={event => setStatus(event.target.value)} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] px-2 text-xs font-semibold text-[#4a2c3e]">
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <select value={source} onChange={event => setSource(event.target.value)} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] px-2 text-xs font-semibold text-[#4a2c3e]">
              <option value="all">All sources</option>
              {sources.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={campaign} onChange={event => setCampaign(event.target.value)} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] px-2 text-xs font-semibold text-[#4a2c3e]">
              <option value="all">All campaigns</option>
              {campaigns.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-[#ffb3d1]/60 bg-white px-3 py-2 text-xs font-bold text-[#4a2c3e]/65 shadow-sm hover:bg-[#fff0f5]">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#fff9f5] border-b border-[#ffb3d1]/45">
              {['Date', 'Customer', 'Market', 'Product', 'Attribution', 'Native', 'INR', 'Status'].map(head => (
                <th key={head} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#4a2c3e]/45 ${['Native', 'INR'].includes(head) ? 'text-right' : 'text-left'}`}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ffb3d1]/30">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-[#4a2c3e]/45">No revenue events match these filters.</td></tr>
            ) : filtered.map(event => (
              <tr key={`${event.id}-${event.occurredAt}`} className="hover:bg-[#fff9f5]">
                <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold text-[#4a2c3e]/60">{formatDate(event.occurredAt)}</td>
                <td className="px-5 py-3 min-w-52">
                  <p className="font-semibold text-[#4a2c3e] truncate">{event.customerName || event.customerEmail || 'Unknown'}</p>
                  {event.customerEmail && <p className="text-xs text-[#4a2c3e]/45 truncate">{event.customerEmail}</p>}
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-xs font-bold text-[#4a2c3e]/70">{event.marketLabel}</td>
                <td className="px-5 py-3 whitespace-nowrap"><span className="inline-flex rounded-md bg-[#fff0f5] px-2 py-1 text-xs font-bold text-[#ff6b9d]">{event.productLabel}</span></td>
                <td className="px-5 py-3 min-w-48">
                  <p className="font-semibold text-[#4a2c3e] truncate">{event.utmSource}</p>
                  <p className="text-xs text-[#4a2c3e]/45 truncate">{event.utmCampaign}</p>
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap font-bold text-[#4a2c3e]">{formatMoney(event.amountMinor, event.currency)}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap font-bold text-[#4a2c3e]">{formatInr(event.amountInrMinor)}</td>
                <td className="px-5 py-3 whitespace-nowrap"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold capitalize ${event.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : event.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{event.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RevenueDashboardPage() {
  const [data, setData] = useState<RevenueAnalytics | null>(null);
  const [currency, setCurrency] = useState<Currency>('INR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ from: '', to: '', market: 'all', product: 'all', source: 'all', campaign: 'all' });

  const fetchRevenue = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ currencyView: 'inr' });
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.set(key, value);
      });
      const response = await fetch(`/api/iconik-club/admin/revenue?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load revenue analytics');
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const growthPositive = (data?.inrKpis.dayOverDayGrowthPct ?? 0) >= 0;
  const filterOptions = useMemo(() => data?.filters, [data]);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f7]">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[#ff6b9d]" />
          <p className="mt-3 text-sm font-medium text-[#4a2c3e]/55">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f7] p-6">
        <div className="bg-white border border-red-100 rounded-lg p-6 max-w-md text-center">
          <AlertCircle size={28} className="mx-auto text-red-500" />
          <h1 className="mt-3 text-lg font-bold text-[#4a2c3e]">Revenue dashboard unavailable</h1>
          <p className="mt-2 text-sm text-[#4a2c3e]/55">{error}</p>
          <button onClick={fetchRevenue} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ff6b9d] px-4 py-2 text-sm font-bold text-white">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#f8f5f7] p-5 lg:p-8">
      <div className="flex flex-col 2xl:flex-row 2xl:items-end 2xl:justify-between gap-4 mb-7">
        <div>
          <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-1">Revenue</p>
          <h1 className="luxury-heading text-3xl text-[#4a2c3e]">Analytics Dashboard</h1>
          <p className="mt-2 text-sm font-medium text-[#4a2c3e]/55">
            INR executive reporting, daily performance, and first-touch attribution across markets.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          <input type="date" value={filters.from} onChange={event => setFilters(prev => ({ ...prev, from: event.target.value }))} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-white px-2 text-xs font-semibold text-[#4a2c3e]" />
          <input type="date" value={filters.to} onChange={event => setFilters(prev => ({ ...prev, to: event.target.value }))} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-white px-2 text-xs font-semibold text-[#4a2c3e]" />
          <select value={filters.market} onChange={event => setFilters(prev => ({ ...prev, market: event.target.value }))} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-white px-2 text-xs font-semibold text-[#4a2c3e]">
            {MARKETS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={filters.product} onChange={event => setFilters(prev => ({ ...prev, product: event.target.value }))} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-white px-2 text-xs font-semibold text-[#4a2c3e]">
            <option value="all">All products</option>
            {(filterOptions?.products ?? []).map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={filters.source} onChange={event => setFilters(prev => ({ ...prev, source: event.target.value }))} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-white px-2 text-xs font-semibold text-[#4a2c3e]">
            <option value="all">All sources</option>
            {(filterOptions?.sources ?? []).map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={filters.campaign} onChange={event => setFilters(prev => ({ ...prev, campaign: event.target.value }))} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-white px-2 text-xs font-semibold text-[#4a2c3e]">
            <option value="all">All campaigns</option>
            {(filterOptions?.campaigns ?? []).map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <button onClick={fetchRevenue} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#ffb3d1]/60 bg-white px-3 py-2 text-xs font-bold text-[#4a2c3e]/65 shadow-sm hover:bg-[#fff0f5]">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Apply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-5">
        <StatCard label="Last 30 days" value={formatInr(data.inrKpis.last30RevenueInrMinor)} helper={`${data.dataQuality.returnedEvents} filtered events`} icon={WalletCards} tone="pink" />
        <StatCard label="MTD revenue" value={formatInr(data.inrKpis.mtdRevenueInrMinor)} helper={`Projected ${formatInr(data.inrKpis.projectedMonthEndRevenueInrMinor)}`} icon={TrendingUp} tone="emerald" />
        <StatCard label="Today" value={formatInr(data.inrKpis.todayRevenueInrMinor)} helper={`Yesterday ${formatInr(data.inrKpis.yesterdayRevenueInrMinor)}`} icon={CalendarDays} tone="sky" />
        <StatCard label="DoD growth" value={formatPercent(data.inrKpis.dayOverDayGrowthPct)} helper={growthPositive ? 'Revenue up vs yesterday' : 'Revenue down vs yesterday'} icon={growthPositive ? ArrowUpRight : ArrowDownRight} tone={growthPositive ? 'emerald' : 'amber'} />
        <StatCard label="AOV" value={formatInr(data.inrKpis.averageOrderValueInrMinor)} helper={`${data.inrKpis.paidOrderCount} paid orders`} icon={CreditCard} tone="violet" />
        <StatCard label="MRR" value={formatInr(data.inrKpis.monthlyRecurringRevenueInrMinor)} helper={`ARR ${formatInr(data.inrKpis.annualRecurringRevenueInrMinor)}`} icon={BarChart3} tone="slate" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="All filtered revenue" value={formatInr(data.inrKpis.totalRevenueInrMinor)} helper="Converted INR view" icon={WalletCards} tone="pink" />
        <StatCard label="Customers" value={String(data.summaryCounts.customerCount)} helper={`${data.summaryCounts.newCustomersThisMonth} new this month`} icon={Users} tone="sky" />
        <StatCard label="Active subs" value={String(data.summaryCounts.activeSubscriptions)} helper={`${data.summaryCounts.newSubscriptionsThisMonth} new this month`} icon={CalendarDays} tone="emerald" />
        <StatCard label="Churn" value={formatPercent(data.summaryCounts.subscriptionChurnRatePct)} helper={`${data.summaryCounts.subscriptionCancellationsThisMonth} cancellations`} icon={AlertCircle} tone="amber" />
      </div>

      <div className="mb-6 rounded-lg border border-[#ffb3d1]/50 bg-white px-4 py-3 text-xs font-medium text-[#4a2c3e]/55 shadow-sm">
        {data.dataQuality.note} Ledger events: {data.dataQuality.ledgerEvents}. Synthesized rows: {data.dataQuality.syntheticEvents}. Unknown attribution: {data.dataQuality.unknownAttributionEvents}.
        {(data.dataQuality.fxWarnings?.length ?? 0) > 0 && <span className="block mt-1 text-amber-700">{data.dataQuality.fxWarnings?.join(' ')}</span>}
        {(data.dataQuality.missingTables?.length ?? 0) > 0 && <span className="block mt-1 text-amber-700">Missing optional tables: {data.dataQuality.missingTables?.map(item => item.table).join(', ')}.</span>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="xl:col-span-2"><DailyRevenueChart rows={data.daily} /></div>
        <div className="space-y-5">
          <RankingPanel title="Top sources" rows={data.attribution.bySource} />
          <RankingPanel title="Top campaigns" rows={data.attribution.byCampaign} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <RankingPanel title="Top mediums" rows={data.attribution.byMedium} />
        <RankingPanel title="Top landing pages" rows={data.attribution.byLandingPage} />
        <RankingPanel title="Source x product" rows={data.attribution.sourceProduct.map(row => ({ label: `${row.source} · ${row.productLabel}`, amountInrMinor: row.amountInrMinor, paidCount: row.paidCount }))} />
      </div>

      <div className="mb-6">
        <NativeCurrencyPanel data={data} currency={currency} setCurrency={setCurrency} />
      </div>

      <RevenueTable events={data.recentEvents} />
    </div>
  );
}

