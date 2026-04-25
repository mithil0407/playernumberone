'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CreditCard,
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

interface MonthCurrencyBucket {
  oneTimeMinor: number;
  subscriptionMinor: number;
  totalMinor: number;
  orderCount: number;
  subscriptionChargeCount: number;
  failedMinor: number;
  failedCount: number;
  momGrowthPct: number;
}

interface MonthlyRow {
  month: string;
  label: string;
  currencies: Record<Currency, MonthCurrencyBucket>;
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
  currency: Currency;
  status: 'paid' | 'failed' | 'pending';
  paymentId: string;
  synthetic: boolean;
}

interface RevenueAnalytics {
  generatedAt: string;
  currencies: Currency[];
  currentMonth: string;
  previousMonth: string;
  kpisByCurrency: Record<Currency, CurrencyKpis>;
  summaryCounts: {
    customerCount: number;
    newCustomersThisMonth: number;
    repeatCustomers: number;
    activeSubscriptions: number;
    pendingSubscriptions: number;
    cancelledSubscriptions: number;
    expiredSubscriptions: number;
    newSubscriptionsThisMonth: number;
    subscriptionCancellationsThisMonth: number;
    subscriptionChurnRatePct: number;
  };
  monthly: MonthlyRow[];
  breakdowns: {
    byMarket: Array<{ market: Market; label: string; currency: Currency; amountMinor: number }>;
    byProductType: Array<{ productType: string; label: string; currency: Currency; amountMinor: number }>;
    subscriptionStatus: Array<{ status: string; count: number }>;
    subscriptionTimeline: Array<{ month: string; label: string; newSubscriptions: number; cancelledSubscriptions: number }>;
  };
  recentEvents: RecentEvent[];
  dataQuality: {
    ledgerEvents: number;
    syntheticEvents: number;
    missingTables?: Array<{ table: string; message: string }>;
    note: string;
  };
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  AUD: 'A$',
  USD: '$',
};

const MARKET_OPTIONS: Array<{ value: 'all' | Market; label: string }> = [
  { value: 'all', label: 'All markets' },
  { value: 'india', label: 'India' },
  { value: 'au', label: 'AU' },
  { value: 'global', label: 'Global' },
  { value: 'globe', label: 'Globe' },
];

function formatMoney(amountMinor: number, currency: Currency, compact = false) {
  const amount = amountMinor / 100;
  if (compact && Math.abs(amount) >= 100000) {
    return `${CURRENCY_SYMBOLS[currency]}${(amount / 100000).toFixed(1)}L`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    return `${CURRENCY_SYMBOLS[currency]}${(amount / 1000).toFixed(1)}k`;
  }
  return `${CURRENCY_SYMBOLS[currency]}${Math.round(amount).toLocaleString('en-IN')}`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: React.ElementType;
  tone: 'pink' | 'emerald' | 'amber' | 'sky' | 'slate' | 'violet';
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

function CurrencyTabs({
  currencies,
  selected,
  onSelect,
}: {
  currencies: Currency[];
  selected: Currency;
  onSelect: (currency: Currency) => void;
}) {
  return (
    <div className="inline-flex bg-white border border-[#ffb3d1]/60 rounded-lg p-1 shadow-sm">
      {currencies.map(currency => (
        <button
          key={currency}
          onClick={() => onSelect(currency)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            selected === currency
              ? 'bg-[#ff6b9d] text-white'
              : 'text-[#4a2c3e]/55 hover:bg-[#fff0f5] hover:text-[#4a2c3e]'
          }`}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}

function RevenueTrendChart({ monthly, currency }: { monthly: MonthlyRow[]; currency: Currency }) {
  const maxRevenue = Math.max(1, ...monthly.map(row => row.currencies[currency].totalMinor));
  const linePoints = monthly.map((row, index) => {
    const x = 18 + index * (624 / Math.max(1, monthly.length - 1));
    const clamped = Math.max(-100, Math.min(100, row.currencies[currency].momGrowthPct));
    const y = 90 - (clamped / 100) * 62;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white border border-[#ffb3d1]/50 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b9d]">Revenue trend</p>
          <h2 className="text-xl font-bold text-[#4a2c3e] mt-1">12-month revenue</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-[#4a2c3e]/55">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#ff6b9d]" />One-time</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />Subscription</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-4 h-0.5 bg-sky-500" />MoM</span>
        </div>
      </div>

      <div className="relative h-64">
        <svg className="absolute inset-0 w-full h-44 pointer-events-none" viewBox="0 0 660 180" preserveAspectRatio="none">
          <line x1="0" y1="90" x2="660" y2="90" stroke="#e8d9e1" strokeDasharray="4 5" />
          <polyline points={linePoints} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>

        <div className="absolute inset-x-0 bottom-8 top-0 grid gap-2" style={{ gridTemplateColumns: `repeat(${monthly.length}, minmax(0, 1fr))` }}>
          {monthly.map(row => {
            const bucket = row.currencies[currency];
            const oneTimeHeight = Math.max(0, (bucket.oneTimeMinor / maxRevenue) * 100);
            const subscriptionHeight = Math.max(0, (bucket.subscriptionMinor / maxRevenue) * 100);

            return (
              <div key={row.month} className="flex flex-col justify-end min-w-0">
                <div className="h-full flex flex-col justify-end rounded-md overflow-hidden bg-[#fff7fa] border border-[#ffb3d1]/35">
                  <div
                    className="bg-emerald-400 min-h-[2px]"
                    style={{ height: `${subscriptionHeight}%` }}
                    title={`Subscription ${formatMoney(bucket.subscriptionMinor, currency)}`}
                  />
                  <div
                    className="bg-[#ff6b9d] min-h-[2px]"
                    style={{ height: `${oneTimeHeight}%` }}
                    title={`One-time ${formatMoney(bucket.oneTimeMinor, currency)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute inset-x-0 bottom-0 grid gap-2 text-[10px] font-semibold text-[#4a2c3e]/45" style={{ gridTemplateColumns: `repeat(${monthly.length}, minmax(0, 1fr))` }}>
          {monthly.map(row => <span key={row.month} className="truncate text-center">{row.label.replace(' ', '\n')}</span>)}
        </div>
      </div>
    </div>
  );
}

function HorizontalBreakdown({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: Array<{ label: string; amountMinor: number; currency: Currency }>;
  currency: Currency;
}) {
  const filtered = rows.filter(row => row.currency === currency).sort((a, b) => b.amountMinor - a.amountMinor);
  const max = Math.max(1, ...filtered.map(row => row.amountMinor));

  return (
    <div className="bg-white border border-[#ffb3d1]/50 rounded-lg p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#4a2c3e] mb-4">{title}</h3>
      {filtered.length === 0 ? (
        <p className="text-sm text-[#4a2c3e]/45 py-8 text-center">No {currency} revenue yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(row => (
            <div key={`${row.label}-${row.currency}`}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-xs font-semibold text-[#4a2c3e]/70 truncate">{row.label}</span>
                <span className="text-xs font-bold text-[#4a2c3e]">{formatMoney(row.amountMinor, currency, true)}</span>
              </div>
              <div className="h-2 rounded-full bg-[#fff0f5] overflow-hidden">
                <div className="h-full rounded-full bg-[#ff6b9d]" style={{ width: `${(row.amountMinor / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubscriptionPanel({ data }: { data: RevenueAnalytics }) {
  const statuses = data.breakdowns.subscriptionStatus;
  const maxTimeline = Math.max(
    1,
    ...data.breakdowns.subscriptionTimeline.map(row => row.newSubscriptions + row.cancelledSubscriptions)
  );

  return (
    <div className="bg-white border border-[#ffb3d1]/50 rounded-lg p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#4a2c3e] mb-4">Subscriptions</h3>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {statuses.map(row => (
          <div key={row.status} className="rounded-lg border border-[#ffb3d1]/45 bg-[#fff9f5] p-3">
            <p className="text-xl font-bold text-[#4a2c3e]">{row.count}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a2c3e]/45">{row.status}</p>
          </div>
        ))}
      </div>
      <div className="h-28 grid gap-1.5 items-end" style={{ gridTemplateColumns: `repeat(${data.breakdowns.subscriptionTimeline.length}, minmax(0, 1fr))` }}>
        {data.breakdowns.subscriptionTimeline.map(row => (
          <div key={row.month} className="h-full flex flex-col justify-end gap-0.5">
            <div
              className="rounded-t-sm bg-emerald-400 min-h-[2px]"
              style={{ height: `${(row.newSubscriptions / maxTimeline) * 100}%` }}
              title={`${row.newSubscriptions} new`}
            />
            <div
              className="rounded-t-sm bg-red-400 min-h-[2px]"
              style={{ height: `${(row.cancelledSubscriptions / maxTimeline) * 100}%` }}
              title={`${row.cancelledSubscriptions} cancelled`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-[#4a2c3e]/55">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm" />New</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-400 rounded-sm" />Cancelled</span>
      </div>
    </div>
  );
}

function RevenueTable({ events }: { events: RecentEvent[] }) {
  const [month, setMonth] = useState('all');
  const [market, setMarket] = useState<'all' | Market>('all');
  const [product, setProduct] = useState('all');
  const [status, setStatus] = useState('all');
  const [currency, setCurrency] = useState<'all' | Currency>('all');
  const [query, setQuery] = useState('');

  const months = Array.from(new Set(events.map(event => event.occurredAt.slice(0, 7))));
  const products = Array.from(new Set(events.map(event => event.productType))).sort();

  const filtered = events.filter(event => {
    if (month !== 'all' && event.occurredAt.slice(0, 7) !== month) return false;
    if (market !== 'all' && event.sourceMarket !== market) return false;
    if (product !== 'all' && event.productType !== product) return false;
    if (status !== 'all' && event.status !== status) return false;
    if (currency !== 'all' && event.currency !== currency) return false;
    if (query) {
      const haystack = `${event.customerEmail} ${event.customerName} ${event.paymentId}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="bg-white border border-[#ffb3d1]/50 rounded-lg shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#ffb3d1]/45">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b9d]">Revenue events</p>
            <h2 className="text-xl font-bold text-[#4a2c3e] mt-1">Recent payments</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
            <div className="relative col-span-2 md:col-span-3 xl:col-span-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a2c3e]/35" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] text-xs font-medium text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/25"
              />
            </div>
            <select value={month} onChange={event => setMonth(event.target.value)} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] px-2 text-xs font-semibold text-[#4a2c3e]">
              <option value="all">All months</option>
              {months.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={market} onChange={event => setMarket(event.target.value as 'all' | Market)} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] px-2 text-xs font-semibold text-[#4a2c3e]">
              {MARKET_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={product} onChange={event => setProduct(event.target.value)} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] px-2 text-xs font-semibold text-[#4a2c3e]">
              <option value="all">All products</option>
              {products.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={status} onChange={event => setStatus(event.target.value)} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] px-2 text-xs font-semibold text-[#4a2c3e]">
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <select value={currency} onChange={event => setCurrency(event.target.value as 'all' | Currency)} className="h-9 rounded-lg border border-[#ffb3d1]/70 bg-[#fff9f5] px-2 text-xs font-semibold text-[#4a2c3e]">
              <option value="all">All currency</option>
              <option value="INR">INR</option>
              <option value="AUD">AUD</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#fff9f5] border-b border-[#ffb3d1]/45">
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#4a2c3e]/45">Date</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#4a2c3e]/45">Customer</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#4a2c3e]/45">Market</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#4a2c3e]/45">Product</th>
              <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#4a2c3e]/45">Amount</th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#4a2c3e]/45">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ffb3d1]/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#4a2c3e]/45">No revenue events match these filters.</td>
              </tr>
            ) : (
              filtered.map(event => (
                <tr key={`${event.id}-${event.occurredAt}`} className="hover:bg-[#fff9f5]">
                  <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold text-[#4a2c3e]/60">{formatDate(event.occurredAt)}</td>
                  <td className="px-5 py-3 min-w-52">
                    <p className="font-semibold text-[#4a2c3e] truncate">{event.customerName || event.customerEmail || 'Unknown'}</p>
                    {event.customerEmail && <p className="text-xs text-[#4a2c3e]/45 truncate">{event.customerEmail}</p>}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-xs font-bold text-[#4a2c3e]/70">{event.marketLabel}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="inline-flex rounded-md bg-[#fff0f5] px-2 py-1 text-xs font-bold text-[#ff6b9d]">{event.productLabel}</span>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap font-bold text-[#4a2c3e]">{formatMoney(event.amountMinor, event.currency)}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold capitalize ${
                      event.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-600'
                        : event.status === 'failed'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-600'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
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

  const fetchRevenue = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/iconik-club/admin/revenue', { cache: 'no-store' });
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
  }, []);

  const kpis = data?.kpisByCurrency[currency];
  const growthPositive = (kpis?.momRevenueGrowthPct ?? 0) >= 0;

  const currentMonthLabel = useMemo(() => {
    if (!data) return '';
    return new Date(`${data.currentMonth}-01T00:00:00.000Z`).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }, [data]);

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
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || !kpis) return null;

  return (
    <div className="min-h-screen bg-[#f8f5f7] p-5 lg:p-8">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-7">
        <div>
          <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-1">Revenue</p>
          <h1 className="luxury-heading text-3xl text-[#4a2c3e]">Analytics Dashboard</h1>
          <p className="mt-2 text-sm font-medium text-[#4a2c3e]/55">
            {currentMonthLabel} performance across orders, subscriptions, markets, and currencies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CurrencyTabs currencies={data.currencies} selected={currency} onSelect={setCurrency} />
          <button
            onClick={fetchRevenue}
            className="inline-flex items-center gap-2 rounded-lg border border-[#ffb3d1]/60 bg-white px-3 py-2 text-xs font-bold text-[#4a2c3e]/65 shadow-sm hover:bg-[#fff0f5]"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-5">
        <StatCard label="This month" value={formatMoney(kpis.currentMonthRevenueMinor, currency)} helper={`Prev ${formatMoney(kpis.previousMonthRevenueMinor, currency)}`} icon={WalletCards} tone="pink" />
        <StatCard
          label="MoM growth"
          value={formatPercent(kpis.momRevenueGrowthPct)}
          helper={growthPositive ? 'Revenue up vs previous month' : 'Revenue down vs previous month'}
          icon={growthPositive ? ArrowUpRight : ArrowDownRight}
          tone={growthPositive ? 'emerald' : 'amber'}
        />
        <StatCard label="Paid orders" value={String(kpis.currentMonthOrderCount)} helper={`${formatPercent(kpis.momOrderGrowthPct)} order growth`} icon={CreditCard} tone="sky" />
        <StatCard label="AOV" value={formatMoney(kpis.averageOrderValueMinor, currency)} helper="Current month one-time orders" icon={BarChart3} tone="violet" />
        <StatCard label="MRR" value={formatMoney(kpis.monthlyRecurringRevenueMinor, currency)} helper={`ARR ${formatMoney(kpis.annualRecurringRevenueMinor, currency)}`} icon={TrendingUp} tone="emerald" />
        <StatCard label="Active subs" value={String(data.summaryCounts.activeSubscriptions)} helper={`${data.summaryCounts.newSubscriptionsThisMonth} new this month`} icon={Calendar} tone="slate" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total revenue" value={formatMoney(kpis.totalRevenueMinor, currency)} helper="All-time native currency" icon={WalletCards} tone="pink" />
        <StatCard label="Customers" value={String(data.summaryCounts.customerCount)} helper={`${data.summaryCounts.newCustomersThisMonth} new this month`} icon={Users} tone="sky" />
        <StatCard label="Repeat customers" value={String(data.summaryCounts.repeatCustomers)} helper="2+ paid events" icon={RefreshCw} tone="violet" />
        <StatCard label="Churn" value={formatPercent(data.summaryCounts.subscriptionChurnRatePct)} helper={`${data.summaryCounts.subscriptionCancellationsThisMonth} cancellations`} icon={AlertCircle} tone="amber" />
      </div>

      <div className="mb-6 rounded-lg border border-[#ffb3d1]/50 bg-white px-4 py-3 text-xs font-medium text-[#4a2c3e]/55 shadow-sm">
        {data.dataQuality.note} Ledger events: {data.dataQuality.ledgerEvents}. Synthesized source rows: {data.dataQuality.syntheticEvents}.
        {data.dataQuality.missingTables && data.dataQuality.missingTables.length > 0 && (
          <span className="block mt-1 text-amber-700">
            Missing optional tables: {data.dataQuality.missingTables.map(item => item.table).join(', ')}.
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="xl:col-span-2">
          <RevenueTrendChart monthly={data.monthly} currency={currency} />
        </div>
        <SubscriptionPanel data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <HorizontalBreakdown title="Revenue by market" rows={data.breakdowns.byMarket} currency={currency} />
        <HorizontalBreakdown title="Revenue by product" rows={data.breakdowns.byProductType} currency={currency} />
      </div>

      <RevenueTable events={data.recentEvents} />
    </div>
  );
}
