import 'server-only';

import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import type { RevenueCurrency, RevenueMarket, RevenueKind, RevenueStatus } from '@/lib/revenueEvents';
import { normalizeCurrency, toMinorUnits } from '@/lib/revenueEvents';
import { attributionFromRow } from '@/lib/attribution';
import { convertMinorToInr, getFxWarnings } from '@/lib/fxRates';

type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'pending' | 'completed';

interface NormalizedRevenueEvent {
  id: string;
  eventKey: string;
  sourceMarket: RevenueMarket;
  sourceTable: string;
  sourceId: string;
  revenueKind: RevenueKind;
  eventType: string;
  productType: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  amountMinor: number;
  amountInrMinor: number;
  currency: RevenueCurrency;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  referrer: string;
  landingPage: string;
  firstTouchAt: string;
  status: RevenueStatus;
  paymentId: string;
  razorpayOrderId: string;
  razorpaySubscriptionId: string;
  planType: string;
  occurredAt: string;
  synthetic: boolean;
}

interface NormalizedSubscription {
  id: string;
  sourceMarket: RevenueMarket;
  sourceTable: string;
  customerEmail: string;
  customerName: string;
  amountMinor: number;
  amountInrMinor: number;
  currency: RevenueCurrency;
  status: SubscriptionStatus;
  planType: string;
  createdAt: string;
  startDate: string;
  cancelledAt: string;
  attribution: ReturnType<typeof attributionFromRow>;
}

const CURRENCIES: RevenueCurrency[] = ['INR', 'AUD', 'USD'];
const MARKETS: RevenueMarket[] = ['india', 'au', 'global', 'globe'];
const IST_TIME_ZONE = 'Asia/Kolkata';

export interface RevenueAnalyticsOptions {
  from?: string | null;
  to?: string | null;
  market?: string | null;
  product?: string | null;
  source?: string | null;
  campaign?: string | null;
  currencyView?: 'inr' | 'native';
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function dayKey(date: Date, timeZone = IST_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function dayLabel(key: string) {
  return new Date(`${key}T00:00:00.000+05:30`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: IST_TIME_ZONE,
  });
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function startOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function planMonthlyAmount(amountMinor: number, planType: string) {
  const normalized = planType.toLowerCase();
  if (normalized === 'quarterly') return amountMinor / 3;
  if (normalized === 'yearly' || normalized === 'annual') return amountMinor / 12;
  return amountMinor;
}

function safeDate(value: unknown) {
  return typeof value === 'string' && value ? value : new Date().toISOString();
}

function asNumber(value: unknown) {
  const number = typeof value === 'string' ? Number(value) : Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function asText(value: unknown, fallback = 'unknown') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function inrMinorFor(amountMinor: number, currency: RevenueCurrency, row?: Record<string, unknown>) {
  const existing = asNumber(row?.amount_inr_minor);
  if (existing > 0 || currency === 'INR') return currency === 'INR' && existing === 0 ? amountMinor : existing;
  return convertMinorToInr(amountMinor, currency).amountInrMinor ?? 0;
}

function sourceKey(sourceTable: string, sourceId: string, eventType: string) {
  return `${sourceTable}:${sourceId}:${eventType}`;
}

function productLabel(productType: string) {
  switch (productType) {
    case 'man_blueprint':
      return 'Man Blueprint';
    case 'man_blueprint_intl':
      return 'Man Blueprint Intl';
    case 'au_blueprint':
      return 'AU Blueprint';
    case 'global_blueprint':
      return 'Global Blueprint';
    case 'globe_blueprint':
      return 'Globe Blueprint';
    case 'subscription':
      return 'Subscription';
    case 'consultation':
    default:
      return 'Consultation';
  }
}

function marketLabel(market: RevenueMarket) {
  switch (market) {
    case 'india':
      return 'India';
    case 'au':
      return 'AU';
    case 'global':
      return 'Global';
    case 'globe':
      return 'Globe';
  }
}

function emptyCurrencyMap<T>(factory: () => T): Record<RevenueCurrency, T> {
  return {
    INR: factory(),
    AUD: factory(),
    USD: factory(),
  };
}

function normalizeLedgerEvent(row: Record<string, unknown>): NormalizedRevenueEvent {
  const attribution = attributionFromRow(row);
  const currency = normalizeCurrency(row.currency, 'INR');
  const amountMinor = asNumber(row.amount_minor);
  return {
    id: String(row.id ?? row.event_key ?? ''),
    eventKey: String(row.event_key ?? ''),
    sourceMarket: MARKETS.includes(row.source_market as RevenueMarket) ? row.source_market as RevenueMarket : 'india',
    sourceTable: String(row.source_table ?? ''),
    sourceId: String(row.source_id ?? ''),
    revenueKind: row.revenue_kind === 'subscription' ? 'subscription' : 'one_time',
    eventType: String(row.event_type ?? ''),
    productType: String(row.product_type ?? (row.revenue_kind === 'subscription' ? 'subscription' : 'consultation')),
    customerEmail: String(row.customer_email ?? ''),
    customerName: String(row.customer_name ?? ''),
    customerPhone: String(row.customer_phone ?? ''),
    amountMinor,
    amountInrMinor: inrMinorFor(amountMinor, currency, row),
    currency,
    utmSource: asText(attribution.utm_source),
    utmMedium: asText(attribution.utm_medium),
    utmCampaign: asText(attribution.utm_campaign),
    utmTerm: asText(attribution.utm_term),
    utmContent: asText(attribution.utm_content),
    referrer: asText(attribution.referrer),
    landingPage: asText(attribution.landing_page),
    firstTouchAt: attribution.first_touch_at ?? '',
    status: row.status === 'failed' || row.status === 'pending' ? row.status : 'paid',
    paymentId: String(row.payment_id ?? ''),
    razorpayOrderId: String(row.razorpay_order_id ?? ''),
    razorpaySubscriptionId: String(row.razorpay_subscription_id ?? ''),
    planType: String(row.plan_type ?? ''),
    occurredAt: safeDate(row.occurred_at),
    synthetic: false,
  };
}

function normalizeMainOrder(row: Record<string, unknown>, hasLedgerEvent: boolean): NormalizedRevenueEvent | null {
  if (hasLedgerEvent) return null;
  if (!['paid', 'completed'].includes(String(row.status ?? ''))) return null;

  const customer = row.customers as Record<string, unknown> | null | undefined;
  const productType = String(row.product_type ?? 'consultation');
  const id = String(row.id ?? '');
  if (!id) return null;
  const currency: RevenueCurrency = productType === 'man_blueprint_intl' ? 'USD' : 'INR';
  const amountMinor = toMinorUnits(row.amount as number | string);
  const attribution = attributionFromRow(row);

  return {
    id: `synthetic-orders-${id}`,
    eventKey: sourceKey('orders', id, 'one_time_payment'),
    sourceMarket: 'india',
    sourceTable: 'orders',
    sourceId: id,
    revenueKind: 'one_time',
    eventType: 'one_time_payment',
    productType,
    customerEmail: String(row.customer_email ?? customer?.email ?? ''),
    customerName: String(customer?.name ?? ''),
    customerPhone: String(customer?.phone ?? ''),
    amountMinor,
    amountInrMinor: inrMinorFor(amountMinor, currency, row),
    currency,
    utmSource: asText(attribution.utm_source),
    utmMedium: asText(attribution.utm_medium),
    utmCampaign: asText(attribution.utm_campaign),
    utmTerm: asText(attribution.utm_term),
    utmContent: asText(attribution.utm_content),
    referrer: asText(attribution.referrer),
    landingPage: asText(attribution.landing_page),
    firstTouchAt: attribution.first_touch_at ?? '',
    status: 'paid',
    paymentId: String(row.razorpay_payment_id ?? row.payment_id ?? ''),
    razorpayOrderId: String(row.razorpay_order_id ?? ''),
    razorpaySubscriptionId: '',
    planType: '',
    occurredAt: safeDate(row.created_at),
    synthetic: true,
  };
}

function normalizeMarketOrder(
  row: Record<string, unknown>,
  sourceMarket: RevenueMarket,
  sourceTable: string,
  currency: RevenueCurrency,
  productType: string,
  hasLedgerEvent: boolean
): NormalizedRevenueEvent | null {
  if (hasLedgerEvent) return null;
  if (!['paid', 'completed'].includes(String(row.status ?? ''))) return null;
  const id = String(row.id ?? '');
  if (!id) return null;
  const amountMinor = toMinorUnits(row.amount as number | string);
  const attribution = attributionFromRow(row);

  return {
    id: `synthetic-${sourceTable}-${id}`,
    eventKey: sourceKey(sourceTable, id, 'one_time_payment'),
    sourceMarket,
    sourceTable,
    sourceId: id,
    revenueKind: 'one_time',
    eventType: 'one_time_payment',
    productType,
    customerEmail: String(row.customer_email ?? ''),
    customerName: String(row.customer_name ?? ''),
    customerPhone: String(row.customer_phone ?? ''),
    amountMinor,
    amountInrMinor: inrMinorFor(amountMinor, currency, row),
    currency,
    utmSource: asText(attribution.utm_source),
    utmMedium: asText(attribution.utm_medium),
    utmCampaign: asText(attribution.utm_campaign),
    utmTerm: asText(attribution.utm_term),
    utmContent: asText(attribution.utm_content),
    referrer: asText(attribution.referrer),
    landingPage: asText(attribution.landing_page),
    firstTouchAt: attribution.first_touch_at ?? '',
    status: 'paid',
    paymentId: String(row.razorpay_payment_id ?? ''),
    razorpayOrderId: String(row.razorpay_order_id ?? ''),
    razorpaySubscriptionId: '',
    planType: '',
    occurredAt: safeDate(row.created_at),
    synthetic: true,
  };
}

function normalizeSubscription(
  row: Record<string, unknown>,
  sourceMarket: RevenueMarket,
  sourceTable: string,
  fallbackCurrency: RevenueCurrency
): NormalizedSubscription {
  const currency = normalizeCurrency(row.currency, fallbackCurrency);
  const amountMinor = asNumber(row.amount);
  const attribution = attributionFromRow(row);
  return {
    id: String(row.id ?? ''),
    sourceMarket,
    sourceTable,
    customerEmail: String(row.customer_email ?? ''),
    customerName: String(row.customer_name ?? ''),
    amountMinor,
    amountInrMinor: inrMinorFor(amountMinor, currency, row),
    currency,
    status: String(row.status ?? 'pending') as SubscriptionStatus,
    planType: String(row.plan_type ?? 'monthly'),
    createdAt: safeDate(row.created_at),
    startDate: typeof row.start_date === 'string' ? row.start_date : '',
    cancelledAt: typeof row.cancelled_at === 'string'
      ? row.cancelled_at
      : String(row.status ?? '') === 'cancelled' && typeof row.updated_at === 'string'
        ? row.updated_at
        : '',
    attribution,
  };
}

function subscriptionToSyntheticEvent(sub: NormalizedSubscription, hasInitialLedgerEvent: boolean): NormalizedRevenueEvent | null {
  if (hasInitialLedgerEvent) return null;
  if (!['active', 'completed', 'expired'].includes(sub.status)) return null;
  if (!sub.id) return null;

  return {
    id: `synthetic-${sub.sourceTable}-${sub.id}`,
    eventKey: sourceKey(sub.sourceTable, sub.id, 'subscription_initial'),
    sourceMarket: sub.sourceMarket,
    sourceTable: sub.sourceTable,
    sourceId: sub.id,
    revenueKind: 'subscription',
    eventType: 'subscription_initial',
    productType: 'subscription',
    customerEmail: sub.customerEmail,
    customerName: sub.customerName,
    customerPhone: '',
    amountMinor: sub.amountMinor,
    amountInrMinor: sub.amountInrMinor,
    currency: sub.currency,
    utmSource: asText(sub.attribution.utm_source),
    utmMedium: asText(sub.attribution.utm_medium),
    utmCampaign: asText(sub.attribution.utm_campaign),
    utmTerm: asText(sub.attribution.utm_term),
    utmContent: asText(sub.attribution.utm_content),
    referrer: asText(sub.attribution.referrer),
    landingPage: asText(sub.attribution.landing_page),
    firstTouchAt: sub.attribution.first_touch_at ?? '',
    status: 'paid',
    paymentId: '',
    razorpayOrderId: '',
    razorpaySubscriptionId: '',
    planType: sub.planType,
    occurredAt: sub.startDate || sub.createdAt,
    synthetic: true,
  };
}

interface QueryWarning {
  table: string;
  message: string;
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return error?.code === 'PGRST205' || error?.message?.includes('Could not find the table');
}

async function safeSelect(
  client: ReturnType<typeof createSupabaseAdminServerClient>,
  table: string,
  select: string,
  warnings: QueryWarning[]
) {
  const { data, error } = await client.from(table).select(select).order('created_at', { ascending: false });
  if (error) {
    if (isMissingTableError(error)) {
      warnings.push({ table, message: `${table} is not available in this Supabase project.` });
      return [];
    }
    console.error(`Revenue analytics query failed for ${table}:`, error);
    return [];
  }
  return (data ?? []) as unknown as Array<Record<string, unknown>>;
}

export async function buildRevenueAnalytics(options: RevenueAnalyticsOptions = {}) {
  const primary = createSupabaseAdminServerClient();
  const queryWarnings: QueryWarning[] = [];

  const [
    ledgerRows,
    mainOrders,
    mainSubscriptions,
    mainCustomers,
    auOrders,
    auSubscriptions,
    auCustomers,
    globeOrders,
    globeSubscriptions,
    globeCustomers,
  ] = await Promise.all([
    safeSelect(primary, 'revenue_events', '*', queryWarnings),
    safeSelect(primary, 'orders', '*, customers(name,email,phone)', queryWarnings),
    safeSelect(primary, 'subscriptions', '*', queryWarnings),
    safeSelect(primary, 'customers', '*', queryWarnings),
    safeSelect(primary, 'au_orders', '*', queryWarnings),
    safeSelect(primary, 'au_subscriptions', '*', queryWarnings),
    safeSelect(primary, 'au_customers', '*', queryWarnings),
    safeSelect(primary, 'globe_orders', '*', queryWarnings),
    safeSelect(primary, 'globe_subscriptions', '*', queryWarnings),
    safeSelect(primary, 'globe_customers', '*', queryWarnings),
  ]);

  const ledgerEvents = ledgerRows.map(normalizeLedgerEvent);
  const ledgerSourceEvents = new Set(
    ledgerEvents.map(event => sourceKey(event.sourceTable, event.sourceId, event.eventType))
  );

  const subscriptions = [
    ...mainSubscriptions.map(row => normalizeSubscription(row, 'india', 'subscriptions', 'INR')),
    ...auSubscriptions.map(row => normalizeSubscription(row, 'au', 'au_subscriptions', 'AUD')),
    ...globeSubscriptions.map(row => {
      const source = String(row.source ?? '').startsWith('global') ? 'global' : 'globe';
      return normalizeSubscription(row, source as RevenueMarket, 'globe_subscriptions', 'USD');
    }),
  ];

  const syntheticEvents = [
    ...mainOrders.map(row => normalizeMainOrder(row, ledgerSourceEvents.has(sourceKey('orders', String(row.id ?? ''), 'one_time_payment')))),
    ...auOrders.map(row => normalizeMarketOrder(
      row,
      'au',
      'au_orders',
      'AUD',
      'au_blueprint',
      ledgerSourceEvents.has(sourceKey('au_orders', String(row.id ?? ''), 'one_time_payment'))
    )),
    ...globeOrders.map(row => {
      const id = String(row.id ?? '');
      const market: RevenueMarket = String(row.razorpay_order_id ?? '').startsWith('global_') ? 'global' : 'globe';
      const productType = market === 'global' ? 'global_blueprint' : 'globe_blueprint';
      return normalizeMarketOrder(
        row,
        market,
        'globe_orders',
        'USD',
        productType,
        ledgerSourceEvents.has(sourceKey('globe_orders', id, 'one_time_payment'))
      );
    }),
    ...subscriptions.map(sub => subscriptionToSyntheticEvent(
      sub,
      ledgerSourceEvents.has(sourceKey(sub.sourceTable, sub.id, 'subscription_initial'))
    )),
  ].filter((event): event is NormalizedRevenueEvent => Boolean(event));

  const allEvents = [...ledgerEvents, ...syntheticEvents]
    .filter(event => event.amountMinor >= 0)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const filterFrom = options.from || null;
  const filterTo = options.to || null;
  const filteredEvents = allEvents.filter(event => {
    const eventDay = dayKey(new Date(event.occurredAt));
    if (filterFrom && eventDay < filterFrom) return false;
    if (filterTo && eventDay > filterTo) return false;
    if (options.market && options.market !== 'all' && event.sourceMarket !== options.market) return false;
    if (options.product && options.product !== 'all' && event.productType !== options.product) return false;
    if (options.source && options.source !== 'all' && event.utmSource !== options.source) return false;
    if (options.campaign && options.campaign !== 'all' && event.utmCampaign !== options.campaign) return false;
    return true;
  });

  const events = filteredEvents;

  const now = new Date();
  const currentMonth = monthKey(now);
  const previousMonth = monthKey(addUtcMonths(startOfUtcMonth(now), -1));
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = addUtcMonths(startOfUtcMonth(now), index - 11);
    return monthKey(date);
  });

  const monthly = months.map(key => ({
    month: key,
    label: monthLabel(key),
    currencies: emptyCurrencyMap(() => ({
      oneTimeMinor: 0,
      subscriptionMinor: 0,
      totalMinor: 0,
      orderCount: 0,
      subscriptionChargeCount: 0,
      failedMinor: 0,
      failedCount: 0,
      momGrowthPct: 0,
    })),
  }));

  const monthIndex = new Map(monthly.map((row, index) => [row.month, index]));

  for (const event of events) {
    const key = monthKey(new Date(event.occurredAt));
    const index = monthIndex.get(key);
    if (index === undefined) continue;

    const bucket = monthly[index].currencies[event.currency];
    if (event.status === 'failed') {
      bucket.failedMinor += event.amountMinor;
      bucket.failedCount += 1;
      continue;
    }
    if (event.status !== 'paid') continue;

    if (event.revenueKind === 'subscription') {
      bucket.subscriptionMinor += event.amountMinor;
      bucket.subscriptionChargeCount += 1;
    } else {
      bucket.oneTimeMinor += event.amountMinor;
      bucket.orderCount += 1;
    }
    bucket.totalMinor += event.amountMinor;
  }

  for (const currency of CURRENCIES) {
    for (let index = 0; index < monthly.length; index += 1) {
      const current = monthly[index].currencies[currency].totalMinor;
      const previous = index > 0 ? monthly[index - 1].currencies[currency].totalMinor : 0;
      monthly[index].currencies[currency].momGrowthPct = percentChange(current, previous);
    }
  }

  const paidEvents = events.filter(event => event.status === 'paid');
  const failedEvents = events.filter(event => event.status === 'failed');

  const kpisByCurrency = emptyCurrencyMap(() => ({
    totalRevenueMinor: 0,
    currentMonthRevenueMinor: 0,
    previousMonthRevenueMinor: 0,
    momRevenueGrowthPct: 0,
    currentMonthOrderCount: 0,
    previousMonthOrderCount: 0,
    momOrderGrowthPct: 0,
    averageOrderValueMinor: 0,
    oneTimeRevenueMinor: 0,
    subscriptionRevenueMinor: 0,
    monthlyRecurringRevenueMinor: 0,
    annualRecurringRevenueMinor: 0,
    failedPaymentCount: 0,
    failedPaymentMinor: 0,
  }));

  for (const event of paidEvents) {
    const kpi = kpisByCurrency[event.currency];
    const key = monthKey(new Date(event.occurredAt));
    kpi.totalRevenueMinor += event.amountMinor;
    if (event.revenueKind === 'subscription') {
      kpi.subscriptionRevenueMinor += event.amountMinor;
    } else {
      kpi.oneTimeRevenueMinor += event.amountMinor;
    }
    if (key === currentMonth) {
      kpi.currentMonthRevenueMinor += event.amountMinor;
      if (event.revenueKind === 'one_time') kpi.currentMonthOrderCount += 1;
    }
    if (key === previousMonth) {
      kpi.previousMonthRevenueMinor += event.amountMinor;
      if (event.revenueKind === 'one_time') kpi.previousMonthOrderCount += 1;
    }
  }

  for (const event of failedEvents) {
    const kpi = kpisByCurrency[event.currency];
    kpi.failedPaymentCount += 1;
    kpi.failedPaymentMinor += event.amountMinor;
  }

  for (const sub of subscriptions) {
    if (sub.status !== 'active') continue;
    const kpi = kpisByCurrency[sub.currency];
    kpi.monthlyRecurringRevenueMinor += planMonthlyAmount(sub.amountMinor, sub.planType);
    kpi.annualRecurringRevenueMinor = kpi.monthlyRecurringRevenueMinor * 12;
  }

  for (const currency of CURRENCIES) {
    const kpi = kpisByCurrency[currency];
    kpi.momRevenueGrowthPct = percentChange(kpi.currentMonthRevenueMinor, kpi.previousMonthRevenueMinor);
    kpi.momOrderGrowthPct = percentChange(kpi.currentMonthOrderCount, kpi.previousMonthOrderCount);
    kpi.averageOrderValueMinor = kpi.currentMonthOrderCount > 0
      ? kpi.currentMonthRevenueMinor / kpi.currentMonthOrderCount
      : 0;
  }

  const allCustomers = [...mainCustomers, ...auCustomers, ...globeCustomers];
  const currentStart = startOfUtcMonth(now).getTime();
  const nextStart = addUtcMonths(startOfUtcMonth(now), 1).getTime();
  const isCurrentMonth = (value: string) => {
    const time = new Date(value).getTime();
    return time >= currentStart && time < nextStart;
  };

  const subscriptionStatusCounts = subscriptions.reduce<Record<string, number>>((acc, sub) => {
    acc[sub.status] = (acc[sub.status] ?? 0) + 1;
    return acc;
  }, {});

  const cancellationsThisMonth = subscriptions.filter(sub => sub.status === 'cancelled' && sub.cancelledAt && isCurrentMonth(sub.cancelledAt)).length;
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const activeAtMonthStartApprox = activeSubscriptions + cancellationsThisMonth;

  const customerEventCounts = paidEvents.reduce<Record<string, number>>((acc, event) => {
    const email = event.customerEmail.toLowerCase();
    if (!email) return acc;
    acc[email] = (acc[email] ?? 0) + 1;
    return acc;
  }, {});

  const summaryCounts = {
    customerCount: new Set(allCustomers.map(customer => String(customer.email ?? '').toLowerCase()).filter(Boolean)).size,
    newCustomersThisMonth: allCustomers.filter(customer => isCurrentMonth(safeDate(customer.created_at))).length,
    repeatCustomers: Object.values(customerEventCounts).filter(count => count > 1).length,
    activeSubscriptions,
    pendingSubscriptions: subscriptions.filter(sub => sub.status === 'pending').length,
    cancelledSubscriptions: subscriptions.filter(sub => sub.status === 'cancelled').length,
    expiredSubscriptions: subscriptions.filter(sub => sub.status === 'expired' || sub.status === 'completed').length,
    newSubscriptionsThisMonth: subscriptions.filter(sub => isCurrentMonth(sub.createdAt)).length,
    subscriptionCancellationsThisMonth: cancellationsThisMonth,
    subscriptionChurnRatePct: activeAtMonthStartApprox > 0
      ? (cancellationsThisMonth / activeAtMonthStartApprox) * 100
      : 0,
  };

  const todayKey = dayKey(now);
  const yesterdayKey = dayKey(new Date(now.getTime() - 86400000));
  const currentIstMonth = todayKey.slice(0, 7);
  const [istYear, istMonth, istDay] = todayKey.split('-').map(Number);
  const daysInCurrentMonth = new Date(istYear, istMonth, 0).getDate();
  const last30DayKeys = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now.getTime() - (29 - index) * 86400000);
    return dayKey(date);
  });

  const daily = last30DayKeys.map(key => {
    const dayEvents = paidEvents.filter(event => dayKey(new Date(event.occurredAt)) === key);
    const dayFailedEvents = failedEvents.filter(event => dayKey(new Date(event.occurredAt)) === key);
    const oneTimeInrMinor = dayEvents
      .filter(event => event.revenueKind === 'one_time')
      .reduce((sum, event) => sum + event.amountInrMinor, 0);
    const subscriptionInrMinor = dayEvents
      .filter(event => event.revenueKind === 'subscription')
      .reduce((sum, event) => sum + event.amountInrMinor, 0);
    const paidCount = dayEvents.length;
    const totalInrMinor = oneTimeInrMinor + subscriptionInrMinor;
    return {
      day: key,
      label: dayLabel(key),
      oneTimeInrMinor,
      subscriptionInrMinor,
      totalInrMinor,
      paidCount,
      failedCount: dayFailedEvents.length,
      averageOrderValueInrMinor: paidCount > 0 ? Math.round(totalInrMinor / paidCount) : 0,
    };
  });

  const weekly = Array.from({ length: Math.ceil(daily.length / 7) }, (_, index) => {
    const rows = daily.slice(index * 7, index * 7 + 7);
    const totalInrMinor = rows.reduce((sum, row) => sum + row.totalInrMinor, 0);
    return {
      week: `${rows[0]?.day ?? ''}:${rows[rows.length - 1]?.day ?? ''}`,
      label: rows.length ? `${rows[0].label} - ${rows[rows.length - 1].label}` : '',
      totalInrMinor,
      paidCount: rows.reduce((sum, row) => sum + row.paidCount, 0),
      failedCount: rows.reduce((sum, row) => sum + row.failedCount, 0),
    };
  });

  const last30RevenueInrMinor = daily.reduce((sum, row) => sum + row.totalInrMinor, 0);
  const todayRevenueInrMinor = daily.find(row => row.day === todayKey)?.totalInrMinor ?? 0;
  const yesterdayRevenueInrMinor = daily.find(row => row.day === yesterdayKey)?.totalInrMinor ?? 0;
  const mtdRevenueInrMinor = paidEvents
    .filter(event => dayKey(new Date(event.occurredAt)).slice(0, 7) === currentIstMonth)
    .reduce((sum, event) => sum + event.amountInrMinor, 0);
  const paidOrderCount = paidEvents.filter(event => event.revenueKind === 'one_time').length;
  const subscriptionRevenueInrMinor = paidEvents
    .filter(event => event.revenueKind === 'subscription')
    .reduce((sum, event) => sum + event.amountInrMinor, 0);
  const oneTimeRevenueInrMinor = paidEvents
    .filter(event => event.revenueKind === 'one_time')
    .reduce((sum, event) => sum + event.amountInrMinor, 0);
  const mrrInrMinor = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + planMonthlyAmount(sub.amountInrMinor, sub.planType), 0);
  const bestDay = daily.reduce((best, row) => row.totalInrMinor > best.totalInrMinor ? row : best, daily[0]);
  const worstDay = daily.reduce((worst, row) => row.totalInrMinor < worst.totalInrMinor ? row : worst, daily[0]);

  const inrKpis = {
    totalRevenueInrMinor: paidEvents.reduce((sum, event) => sum + event.amountInrMinor, 0),
    last30RevenueInrMinor,
    mtdRevenueInrMinor,
    todayRevenueInrMinor,
    yesterdayRevenueInrMinor,
    dayOverDayGrowthPct: percentChange(todayRevenueInrMinor, yesterdayRevenueInrMinor),
    averageDailyRevenueInrMinor: Math.round(last30RevenueInrMinor / Math.max(1, daily.length)),
    projectedMonthEndRevenueInrMinor: Math.round((mtdRevenueInrMinor / Math.max(1, istDay)) * daysInCurrentMonth),
    averageOrderValueInrMinor: paidOrderCount > 0 ? Math.round(oneTimeRevenueInrMinor / paidOrderCount) : 0,
    paidOrderCount,
    failedPaymentCount: failedEvents.length,
    oneTimeRevenueInrMinor,
    subscriptionRevenueInrMinor,
    monthlyRecurringRevenueInrMinor: Math.round(mrrInrMinor),
    annualRecurringRevenueInrMinor: Math.round(mrrInrMinor * 12),
    bestDay,
    worstDay,
  };

  function attributionRows(field: keyof NormalizedRevenueEvent) {
    const grouped = paidEvents.reduce<Record<string, { label: string; amountInrMinor: number; paidCount: number }>>((acc, event) => {
      const value = asText(event[field], 'unknown');
      acc[value] = acc[value] ?? { label: value, amountInrMinor: 0, paidCount: 0 };
      acc[value].amountInrMinor += event.amountInrMinor;
      acc[value].paidCount += 1;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.amountInrMinor - a.amountInrMinor);
  }

  const sourceProduct = Object.values(paidEvents.reduce<Record<string, {
    source: string;
    productType: string;
    productLabel: string;
    amountInrMinor: number;
    paidCount: number;
  }>>((acc, event) => {
    const source = asText(event.utmSource);
    const key = `${source}:${event.productType}`;
    acc[key] = acc[key] ?? {
      source,
      productType: event.productType,
      productLabel: productLabel(event.productType),
      amountInrMinor: 0,
      paidCount: 0,
    };
    acc[key].amountInrMinor += event.amountInrMinor;
    acc[key].paidCount += 1;
    return acc;
  }, {})).sort((a, b) => b.amountInrMinor - a.amountInrMinor);

  const byMarket = MARKETS.flatMap(market => CURRENCIES.map(currency => {
    const amountMinor = paidEvents
      .filter(event => event.sourceMarket === market && event.currency === currency)
      .reduce((sum, event) => sum + event.amountMinor, 0);
    return { market, label: marketLabel(market), currency, amountMinor };
  })).filter(row => row.amountMinor > 0);

  const productTypes = Array.from(new Set(paidEvents.map(event => event.productType)));
  const byProductType = productTypes.flatMap(productType => CURRENCIES.map(currency => {
    const amountMinor = paidEvents
      .filter(event => event.productType === productType && event.currency === currency)
      .reduce((sum, event) => sum + event.amountMinor, 0);
    return { productType, label: productLabel(productType), currency, amountMinor };
  })).filter(row => row.amountMinor > 0);

  const subscriptionTimeline = months.map(key => ({
    month: key,
    label: monthLabel(key),
    newSubscriptions: subscriptions.filter(sub => monthKey(new Date(sub.createdAt)) === key).length,
    cancelledSubscriptions: subscriptions.filter(sub => sub.cancelledAt && monthKey(new Date(sub.cancelledAt)) === key).length,
  }));

  const recentEvents = events.slice(0, 150).map(event => ({
    id: event.id,
    occurredAt: event.occurredAt,
    sourceMarket: event.sourceMarket,
    marketLabel: marketLabel(event.sourceMarket),
    productType: event.productType,
    productLabel: productLabel(event.productType),
    revenueKind: event.revenueKind,
    eventType: event.eventType,
    customerEmail: event.customerEmail,
    customerName: event.customerName,
    amountMinor: event.amountMinor,
    amountInrMinor: event.amountInrMinor,
    currency: event.currency,
    utmSource: event.utmSource,
    utmMedium: event.utmMedium,
    utmCampaign: event.utmCampaign,
    landingPage: event.landingPage,
    status: event.status,
    paymentId: event.paymentId,
    synthetic: event.synthetic,
  }));

  const filterProducts = Array.from(new Set(allEvents.map(event => event.productType))).sort();
  const filterSources = Array.from(new Set(allEvents.map(event => event.utmSource))).sort();
  const filterCampaigns = Array.from(new Set(allEvents.map(event => event.utmCampaign))).sort();
  const unknownAttributionEvents = allEvents.filter(event => event.utmSource === 'unknown' && event.utmCampaign === 'unknown').length;

  return {
    generatedAt: new Date().toISOString(),
    currencies: CURRENCIES,
    currencyView: options.currencyView ?? 'inr',
    currentMonth,
    previousMonth,
    kpisByCurrency,
    inrKpis,
    summaryCounts,
    monthly,
    daily,
    weekly,
    attribution: {
      bySource: attributionRows('utmSource'),
      byMedium: attributionRows('utmMedium'),
      byCampaign: attributionRows('utmCampaign'),
      byLandingPage: attributionRows('landingPage'),
      sourceProduct,
    },
    breakdowns: {
      byMarket,
      byProductType,
      subscriptionStatus: Object.entries(subscriptionStatusCounts).map(([status, count]) => ({ status, count })),
      subscriptionTimeline,
    },
    recentEvents,
    filters: {
      from: filterFrom,
      to: filterTo,
      market: options.market ?? 'all',
      product: options.product ?? 'all',
      source: options.source ?? 'all',
      campaign: options.campaign ?? 'all',
      products: filterProducts,
      sources: filterSources,
      campaigns: filterCampaigns,
    },
    dataQuality: {
      ledgerEvents: ledgerEvents.length,
      syntheticEvents: syntheticEvents.length,
      returnedEvents: events.length,
      totalEventsBeforeFilters: allEvents.length,
      unknownAttributionEvents,
      fxWarnings: getFxWarnings(CURRENCIES),
      missingTables: queryWarnings,
      note: ledgerEvents.length === 0
        ? 'Using synthesized revenue from source tables until revenue_events is migrated/backfilled.'
        : unknownAttributionEvents > 0
          ? 'Using revenue_events plus synthesized source rows. Some historical rows have unknown attribution.'
          : 'Using revenue_events plus synthesized source rows that are not yet in the ledger.',
    },
  };
}
