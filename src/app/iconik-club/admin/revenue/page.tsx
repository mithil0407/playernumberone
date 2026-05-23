'use client';

import { useEffect, useMemo, useState, type Dispatch, type ElementType, type SetStateAction } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CreditCard,
  Database,
  Download,
  Filter,
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

type DashboardFilters = {
  from: string;
  to: string;
  market: string;
  product: string;
  source: string;
  campaign: string;
};

type Tone = 'brand' | 'emerald' | 'amber' | 'sky' | 'slate' | 'violet' | 'red';

const CURRENCY_SYMBOLS: Record<Currency, string> = { INR: '₹', AUD: 'A$', USD: '$' };
const MARKETS: Array<{ value: 'all' | Market; label: string }> = [
  { value: 'all', label: 'All markets' },
  { value: 'india', label: 'India' },
  { value: 'au', label: 'AU' },
  { value: 'global', label: 'Global' },
  { value: 'globe', label: 'Globe' },
];

const toneClasses: Record<Tone, { icon: string; accent: string; badge: string }> = {
  brand: {
    icon: 'border-[#ffb3d1]/70 bg-[#fff0f5] text-[#ff4f8c]',
    accent: 'bg-[#ff6b9d]',
    badge: 'border-[#ffb3d1]/70 bg-[#fff0f5] text-[#b83267]',
  },
  emerald: {
    icon: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    accent: 'bg-emerald-500',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  amber: {
    icon: 'border-amber-200 bg-amber-50 text-amber-700',
    accent: 'bg-amber-500',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  sky: {
    icon: 'border-sky-200 bg-sky-50 text-sky-700',
    accent: 'bg-sky-500',
    badge: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  slate: {
    icon: 'border-slate-200 bg-slate-50 text-slate-700',
    accent: 'bg-slate-500',
    badge: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  violet: {
    icon: 'border-violet-200 bg-violet-50 text-violet-700',
    accent: 'bg-violet-500',
    badge: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  red: {
    icon: 'border-red-200 bg-red-50 text-red-700',
    accent: 'bg-red-500',
    badge: 'border-red-200 bg-red-50 text-red-700',
  },
};

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

function formatGeneratedAt(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-bold uppercase text-slate-500">{children}</span>;
}

function controlClass() {
  return 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#ff6b9d] focus:ring-2 focus:ring-[#ff6b9d]/15';
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: string;
  helper?: string;
  icon: ElementType;
  tone?: Tone;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold text-slate-950 tabular-nums">{value}</p>
          {helper && <p className="mt-1 truncate text-xs font-medium text-slate-500">{helper}</p>}
        </div>
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border ${toneClasses[tone].icon}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function FilterToolbar({
  filters,
  setFilters,
  filterOptions,
  generatedAt,
  loading,
  onApply,
}: {
  filters: DashboardFilters;
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
  filterOptions?: RevenueAnalytics['filters'];
  generatedAt: string;
  loading: boolean;
  onApply: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <Filter size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Reporting filters</p>
            <p className="text-xs font-medium text-slate-500">Generated {formatGeneratedAt(generatedAt)}</p>
          </div>
        </div>
        <button
          onClick={onApply}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing' : 'Apply filters'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <label className="space-y-1.5">
          <FormLabel>From</FormLabel>
          <input
            type="date"
            value={filters.from}
            onChange={event => setFilters(prev => ({ ...prev, from: event.target.value }))}
            className={controlClass()}
          />
        </label>
        <label className="space-y-1.5">
          <FormLabel>To</FormLabel>
          <input
            type="date"
            value={filters.to}
            onChange={event => setFilters(prev => ({ ...prev, to: event.target.value }))}
            className={controlClass()}
          />
        </label>
        <label className="space-y-1.5">
          <FormLabel>Market</FormLabel>
          <select
            value={filters.market}
            onChange={event => setFilters(prev => ({ ...prev, market: event.target.value }))}
            className={controlClass()}
          >
            {MARKETS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <FormLabel>Product</FormLabel>
          <select
            value={filters.product}
            onChange={event => setFilters(prev => ({ ...prev, product: event.target.value }))}
            className={controlClass()}
          >
            <option value="all">All products</option>
            {(filterOptions?.products ?? []).map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <FormLabel>Source</FormLabel>
          <select
            value={filters.source}
            onChange={event => setFilters(prev => ({ ...prev, source: event.target.value }))}
            className={controlClass()}
          >
            <option value="all">All sources</option>
            {(filterOptions?.sources ?? []).map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <FormLabel>Campaign</FormLabel>
          <select
            value={filters.campaign}
            onChange={event => setFilters(prev => ({ ...prev, campaign: event.target.value }))}
            className={controlClass()}
          >
            <option value="all">All campaigns</option>
            {(filterOptions?.campaigns ?? []).map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

function RevenueTrendChart({ rows }: { rows: DailyRow[] }) {
  const max = Math.max(1, ...rows.map(row => row.totalInrMinor));
  const peak = rows.reduce<DailyRow | null>((best, row) => (!best || row.totalInrMinor > best.totalInrMinor ? row : best), null);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase text-[#b83267]">Daily revenue</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Last 30 days</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            One-time and subscription revenue converted to INR.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-900" />One-time</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Subscription</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-500">
          No daily revenue in this filter range.
        </div>
      ) : (
        <div className="h-72 min-w-[680px]">
          <div className="grid h-full items-end gap-2" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
            {rows.map(row => {
              const oneTimeHeight = (row.oneTimeInrMinor / max) * 100;
              const subscriptionHeight = (row.subscriptionInrMinor / max) * 100;
              return (
                <div
                  key={row.day}
                  className="group flex h-full flex-col justify-end gap-1"
                  title={`${row.day}: ${formatInr(row.totalInrMinor)} | ${row.paidCount} paid | ${row.failedCount} failed`}
                >
                  <div className="flex h-full flex-col justify-end overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    <div className="min-h-[2px] bg-emerald-500 transition-opacity group-hover:opacity-80" style={{ height: `${subscriptionHeight}%` }} />
                    <div className="min-h-[2px] bg-slate-900 transition-opacity group-hover:opacity-80" style={{ height: `${oneTimeHeight}%` }} />
                  </div>
                  <span className="truncate text-center text-[9px] font-semibold text-slate-400">{row.label.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 text-xs font-medium text-slate-500 md:grid-cols-3">
        <p>Average daily revenue <span className="font-bold text-slate-950">{formatInr(Math.round(rows.reduce((sum, row) => sum + row.totalInrMinor, 0) / Math.max(1, rows.length)))}</span></p>
        <p>Peak day <span className="font-bold text-slate-950">{peak ? `${formatDate(peak.day)} (${formatInr(peak.totalInrMinor)})` : 'None'}</span></p>
        <p>Failed payments <span className="font-bold text-slate-950">{rows.reduce((sum, row) => sum + row.failedCount, 0)}</span></p>
      </div>
    </section>
  );
}

function RankingList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; amountInrMinor: number; paidCount: number }>;
}) {
  const visible = rows.slice(0, 8);
  const max = Math.max(1, ...visible.map(row => row.amountInrMinor));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
          Top {visible.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-500">
          No attributed revenue yet.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(row => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="truncate text-xs font-semibold text-slate-700">{row.label || 'Unknown'}</span>
                <span className="whitespace-nowrap text-xs font-bold text-slate-950 tabular-nums">
                  {formatInr(row.amountInrMinor, true)} / {row.paidCount}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#ff6b9d]" style={{ width: `${(row.amountInrMinor / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CurrencyReconciliation({
  data,
  currency,
  setCurrency,
}: {
  data: RevenueAnalytics;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}) {
  const kpis = data.kpisByCurrency[currency];
  const rows = [
    { label: 'All time paid', value: formatMoney(kpis.totalRevenueMinor, currency), helper: 'Native ledger total' },
    { label: 'This month', value: formatMoney(kpis.currentMonthRevenueMinor, currency), helper: `${formatPercent(kpis.momRevenueGrowthPct)} vs previous` },
    { label: 'One-time revenue', value: formatMoney(kpis.oneTimeRevenueMinor, currency), helper: `${kpis.currentMonthOrderCount} current-month orders` },
    { label: 'Subscription revenue', value: formatMoney(kpis.subscriptionRevenueMinor, currency), helper: `MRR ${formatMoney(kpis.monthlyRecurringRevenueMinor, currency)}` },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-[#b83267]">Native reconciliation</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Ledger currency view</h2>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {data.currencies.map(option => (
            <button
              key={option}
              onClick={() => setCurrency(option)}
              className={`h-8 rounded-md px-3 text-xs font-bold transition ${currency === option ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-950'}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-slate-200 border-t border-slate-200 md:grid-cols-4 md:divide-x md:divide-y-0">
        {rows.map(row => (
          <div key={row.label} className="py-4 md:px-4 first:md:pl-0 last:md:pr-0">
            <p className="text-[10px] font-bold uppercase text-slate-500">{row.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-950 tabular-nums">{row.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{row.helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DataQualityBanner({ data }: { data: RevenueAnalytics['dataQuality'] }) {
  const hasWarnings = (data.fxWarnings?.length ?? 0) > 0 || (data.missingTables?.length ?? 0) > 0;

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${hasWarnings ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-600'}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${hasWarnings ? 'border-amber-200 bg-white text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            <Database size={15} />
          </div>
          <div>
            <p className="text-sm font-semibold">{hasWarnings ? 'Revenue data needs review' : 'Revenue data status'}</p>
            <p className="mt-1 text-xs font-medium leading-5 opacity-80">
              {data.note} Ledger events: {data.ledgerEvents}. Synthesized rows: {data.syntheticEvents}. Unknown attribution: {data.unknownAttributionEvents}.
            </p>
            {(data.fxWarnings?.length ?? 0) > 0 && <p className="mt-1 text-xs font-semibold">{data.fxWarnings?.join(' ')}</p>}
            {(data.missingTables?.length ?? 0) > 0 && (
              <p className="mt-1 text-xs font-semibold">
                Missing optional tables: {data.missingTables?.map(item => item.table).join(', ')}.
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold sm:grid-cols-4 lg:min-w-[420px]">
          <span className="rounded-md border border-current/10 bg-white/60 px-3 py-2">Returned {data.returnedEvents}</span>
          <span className="rounded-md border border-current/10 bg-white/60 px-3 py-2">Total {data.totalEventsBeforeFilters}</span>
          <span className="rounded-md border border-current/10 bg-white/60 px-3 py-2">Ledger {data.ledgerEvents}</span>
          <span className="rounded-md border border-current/10 bg-white/60 px-3 py-2">Synthetic {data.syntheticEvents}</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RecentEvent['status'] }) {
  const classes = {
    paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    failed: 'border-red-200 bg-red-50 text-red-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold capitalize ${classes[status]}`}>
      {status}
    </span>
  );
}

function RevenueEventsTable({ events }: { events: RecentEvent[] }) {
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
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#b83267]">Revenue events</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Filtered ledger rows</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">{filtered.length} of {events.length} loaded events shown</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6 2xl:min-w-[840px]">
            <div className="relative col-span-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search customer, source, payment"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#ff6b9d] focus:ring-2 focus:ring-[#ff6b9d]/15"
              />
            </div>
            <select value={market} onChange={event => setMarket(event.target.value as 'all' | Market)} className={controlClass()}>
              {MARKETS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={status} onChange={event => setStatus(event.target.value)} className={controlClass()}>
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <select value={source} onChange={event => setSource(event.target.value)} className={controlClass()}>
              <option value="all">All sources</option>
              {sources.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={campaign} onChange={event => setCampaign(event.target.value)} className={controlClass()}>
              <option value="all">All campaigns</option>
              {campaigns.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <div className="max-h-[620px] overflow-auto">
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Date', 'Customer', 'Market', 'Product', 'Attribution', 'Native', 'INR', 'Status'].map(head => (
                <th
                  key={head}
                  className={`px-5 py-3 text-[10px] font-bold uppercase text-slate-500 ${['Native', 'INR'].includes(head) ? 'text-right' : 'text-left'}`}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                  No revenue events match these filters.
                </td>
              </tr>
            ) : filtered.map(event => (
              <tr key={`${event.id}-${event.occurredAt}`} className="transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-500">{formatDate(event.occurredAt)}</td>
                <td className="min-w-60 px-5 py-3">
                  <p className="max-w-56 truncate font-semibold text-slate-950">{event.customerName || event.customerEmail || 'Unknown'}</p>
                  {event.customerEmail && <p className="max-w-56 truncate text-xs font-medium text-slate-500">{event.customerEmail}</p>}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-xs font-bold text-slate-600">{event.marketLabel}</td>
                <td className="whitespace-nowrap px-5 py-3">
                  <span className="inline-flex rounded-md border border-[#ffb3d1]/70 bg-[#fff0f5] px-2 py-1 text-xs font-bold text-[#b83267]">
                    {event.productLabel}
                  </span>
                </td>
                <td className="min-w-56 px-5 py-3">
                  <p className="max-w-52 truncate font-semibold text-slate-800">{event.utmSource || 'Unknown'}</p>
                  <p className="max-w-52 truncate text-xs font-medium text-slate-500">{event.utmCampaign || 'No campaign'}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-950 tabular-nums">{formatMoney(event.amountMinor, event.currency)}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-950 tabular-nums">{formatInr(event.amountInrMinor)}</td>
                <td className="whitespace-nowrap px-5 py-3"><StatusBadge status={event.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function RevenueDashboardPage() {
  const [data, setData] = useState<RevenueAnalytics | null>(null);
  const [currency, setCurrency] = useState<Currency>('INR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<DashboardFilters>({ from: '', to: '', market: 'all', product: 'all', source: 'all', campaign: 'all' });

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-[#ff6b9d]" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
          <AlertCircle size={28} className="mx-auto text-red-500" />
          <h1 className="mt-3 text-lg font-semibold text-slate-950">Revenue dashboard unavailable</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">{error}</p>
          <button onClick={fetchRevenue} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-950 lg:p-6 xl:p-8">
      <div className="mx-auto max-w-[1680px] space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase text-[#b83267]">Revenue</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">Analytics Dashboard</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              INR executive reporting, daily performance, attribution, and native ledger reconciliation across markets.
            </p>
          </div>
          {error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              Last refresh failed: {error}
            </div>
          )}
        </div>

        <FilterToolbar
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          generatedAt={data.generatedAt}
          loading={loading}
          onApply={fetchRevenue}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Last 30 days" value={formatInr(data.inrKpis.last30RevenueInrMinor)} helper={`${data.dataQuality.returnedEvents} filtered events`} icon={WalletCards} tone="brand" />
          <MetricCard label="MTD revenue" value={formatInr(data.inrKpis.mtdRevenueInrMinor)} helper={`Projected ${formatInr(data.inrKpis.projectedMonthEndRevenueInrMinor)}`} icon={TrendingUp} tone="emerald" />
          <MetricCard label="Today" value={formatInr(data.inrKpis.todayRevenueInrMinor)} helper={`Yesterday ${formatInr(data.inrKpis.yesterdayRevenueInrMinor)}`} icon={CalendarDays} tone="sky" />
          <MetricCard label="DoD growth" value={formatPercent(data.inrKpis.dayOverDayGrowthPct)} helper={growthPositive ? 'Revenue up vs yesterday' : 'Revenue down vs yesterday'} icon={growthPositive ? ArrowUpRight : ArrowDownRight} tone={growthPositive ? 'emerald' : 'amber'} />
          <MetricCard label="AOV" value={formatInr(data.inrKpis.averageOrderValueInrMinor)} helper={`${data.inrKpis.paidOrderCount} paid orders`} icon={CreditCard} tone="violet" />
          <MetricCard label="MRR" value={formatInr(data.inrKpis.monthlyRecurringRevenueInrMinor)} helper={`ARR ${formatInr(data.inrKpis.annualRecurringRevenueInrMinor)}`} icon={BarChart3} tone="slate" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="All filtered revenue" value={formatInr(data.inrKpis.totalRevenueInrMinor)} helper="Converted INR view" icon={WalletCards} tone="brand" />
          <MetricCard label="Customers" value={String(data.summaryCounts.customerCount)} helper={`${data.summaryCounts.newCustomersThisMonth} new this month`} icon={Users} tone="sky" />
          <MetricCard label="Active subscriptions" value={String(data.summaryCounts.activeSubscriptions)} helper={`${data.summaryCounts.newSubscriptionsThisMonth} new this month`} icon={CalendarDays} tone="emerald" />
          <MetricCard label="Churn" value={formatPercent(data.summaryCounts.subscriptionChurnRatePct)} helper={`${data.summaryCounts.subscriptionCancellationsThisMonth} cancellations`} icon={AlertCircle} tone="amber" />
        </div>

        <DataQualityBanner data={data.dataQuality} />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="overflow-x-auto xl:col-span-2">
            <RevenueTrendChart rows={data.daily} />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-1">
            <RankingList title="Top sources" rows={data.attribution.bySource} />
            <RankingList title="Top campaigns" rows={data.attribution.byCampaign} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <RankingList title="Top mediums" rows={data.attribution.byMedium} />
          <RankingList title="Top landing pages" rows={data.attribution.byLandingPage} />
          <RankingList
            title="Source x product"
            rows={data.attribution.sourceProduct.map(row => ({
              label: `${row.source} / ${row.productLabel}`,
              amountInrMinor: row.amountInrMinor,
              paidCount: row.paidCount,
            }))}
          />
        </div>

        <CurrencyReconciliation data={data} currency={currency} setCurrency={setCurrency} />
        <RevenueEventsTable events={data.recentEvents} />
      </div>
    </div>
  );
}
