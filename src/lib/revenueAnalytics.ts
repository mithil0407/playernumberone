import 'server-only';

import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { supabaseGlobeServer } from '@/lib/serverSupabaseGlobe';
import type { RevenueCurrency, RevenueMarket, RevenueKind, RevenueStatus } from '@/lib/revenueEvents';
import { normalizeCurrency, toMinorUnits } from '@/lib/revenueEvents';

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
  currency: RevenueCurrency;
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
  currency: RevenueCurrency;
  status: SubscriptionStatus;
  planType: string;
  createdAt: string;
  startDate: string;
  cancelledAt: string;
}

const CURRENCIES: RevenueCurrency[] = ['INR', 'AUD', 'USD'];
const MARKETS: RevenueMarket[] = ['india', 'au', 'global', 'globe'];

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
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
    amountMinor: asNumber(row.amount_minor),
    currency: normalizeCurrency(row.currency, 'INR'),
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
    amountMinor: toMinorUnits(row.amount as number | string),
    currency: productType === 'man_blueprint_intl' ? 'USD' : 'INR',
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
    amountMinor: toMinorUnits(row.amount as number | string),
    currency,
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
  return {
    id: String(row.id ?? ''),
    sourceMarket,
    sourceTable,
    customerEmail: String(row.customer_email ?? ''),
    customerName: String(row.customer_name ?? ''),
    amountMinor: asNumber(row.amount),
    currency: normalizeCurrency(row.currency, fallbackCurrency),
    status: String(row.status ?? 'pending') as SubscriptionStatus,
    planType: String(row.plan_type ?? 'monthly'),
    createdAt: safeDate(row.created_at),
    startDate: typeof row.start_date === 'string' ? row.start_date : '',
    cancelledAt: typeof row.cancelled_at === 'string'
      ? row.cancelled_at
      : String(row.status ?? '') === 'cancelled' && typeof row.updated_at === 'string'
        ? row.updated_at
        : '',
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
    currency: sub.currency,
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

async function safeSelectGlobe(table: string, select: string, warnings: QueryWarning[]) {
  const { data, error } = await supabaseGlobeServer.from(table).select(select).order('created_at', { ascending: false });
  if (error) {
    if (isMissingTableError(error)) {
      warnings.push({ table, message: `${table} is not available in the AU/Globe Supabase project.` });
      return [];
    }
    console.error(`Revenue analytics query failed for ${table}:`, error);
    return [];
  }
  return (data ?? []) as unknown as Array<Record<string, unknown>>;
}

export async function buildRevenueAnalytics() {
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
    safeSelectGlobe('au_orders', '*', queryWarnings),
    safeSelectGlobe('au_subscriptions', '*', queryWarnings),
    safeSelectGlobe('au_customers', '*', queryWarnings),
    safeSelectGlobe('globe_orders', '*', queryWarnings),
    safeSelectGlobe('globe_subscriptions', '*', queryWarnings),
    safeSelectGlobe('globe_customers', '*', queryWarnings),
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

  const events = [...ledgerEvents, ...syntheticEvents]
    .filter(event => event.amountMinor >= 0)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

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
    currency: event.currency,
    status: event.status,
    paymentId: event.paymentId,
    synthetic: event.synthetic,
  }));

  return {
    generatedAt: new Date().toISOString(),
    currencies: CURRENCIES,
    currentMonth,
    previousMonth,
    kpisByCurrency,
    summaryCounts,
    monthly,
    breakdowns: {
      byMarket,
      byProductType,
      subscriptionStatus: Object.entries(subscriptionStatusCounts).map(([status, count]) => ({ status, count })),
      subscriptionTimeline,
    },
    recentEvents,
    dataQuality: {
      ledgerEvents: ledgerEvents.length,
      syntheticEvents: syntheticEvents.length,
      missingTables: queryWarnings,
      note: ledgerEvents.length === 0
        ? 'Using synthesized revenue from source tables until revenue_events is migrated/backfilled.'
        : 'Using revenue_events plus synthesized source rows that are not yet in the ledger.',
    },
  };
}
