#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SOURCE_URL = process.env.SOURCE_SUPABASE_URL;
const SOURCE_SERVICE_ROLE_KEY = process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY;
const TARGET_URL = process.env.TARGET_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const TARGET_SERVICE_ROLE_KEY =
  process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const BATCH_SIZE = Number(process.env.MIGRATION_BATCH_SIZE || 500);
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

const TABLES_IN_ORDER = [
  'au_customers',
  'au_intake_submissions',
  'au_orders',
  'au_subscriptions',
  'globe_customers',
  'globe_intake_submissions',
  'globe_orders',
  'globe_subscriptions',
  'globe_style_reports',
  'globe_report_jobs',
  'globe_report_assets',
];

const STORAGE_BUCKETS = [
  'au-intake-photos',
  'globe-intake-photos',
  'globe-report-images',
];

function requireEnv(name, value) {
  if (!value) throw new Error(`Missing required env var: ${name}`);
}

function createAdminClient(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isMissingTableError(error) {
  return error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    String(error?.message || '').includes('Could not find the table') ||
    String(error?.message || '').includes('does not exist');
}

function normalizePath(path) {
  return String(path || '').replace(/^\/+/, '');
}

function storagePathFromUrl(value, bucket) {
  if (!value) return null;
  const raw = String(value);
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    return normalizePath(raw);
  }

  try {
    const url = new URL(raw);
    const publicNeedle = `/storage/v1/object/public/${bucket}/`;
    const signedNeedle = `/storage/v1/object/sign/${bucket}/`;
    const decodedPath = decodeURIComponent(url.pathname);
    if (decodedPath.includes(publicNeedle)) {
      return normalizePath(decodedPath.split(publicNeedle)[1]);
    }
    if (decodedPath.includes(signedNeedle)) {
      return normalizePath(decodedPath.split(signedNeedle)[1]);
    }
  } catch {
    return null;
  }

  return null;
}

function publicObjectUrl(baseUrl, bucket, path) {
  return `${baseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${normalizePath(path)}`;
}

function toMinorUnits(amountMajor) {
  const value = typeof amountMajor === 'string' ? Number(amountMajor) : amountMajor;
  return Math.round((Number.isFinite(value) ? value : 0) * 100);
}

function rowAttribution(row) {
  return {
    utm_source: row.utm_source ?? null,
    utm_medium: row.utm_medium ?? null,
    utm_campaign: row.utm_campaign ?? null,
    utm_term: row.utm_term ?? null,
    utm_content: row.utm_content ?? null,
    referrer: row.referrer ?? null,
    landing_page: row.landing_page ?? null,
    first_touch_at: row.first_touch_at ?? null,
    attribution_payload: row.attribution_payload ?? {},
  };
}

async function fetchAllRows(client, table) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await client
      .from(table)
      .select('*')
      .range(from, to);

    if (error) {
      if (isMissingTableError(error)) {
        console.warn(`[skip] ${table}: table not present in source`);
        return [];
      }
      throw new Error(`[${table}] select failed: ${error.message}`);
    }

    if (!data?.length) break;
    rows.push(...data);
    if (data.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }

  return rows;
}

async function upsertRows(client, table, rows) {
  if (!rows.length) return;
  if (DRY_RUN) {
    console.log(`[dry-run] would upsert ${rows.length} rows into ${table}`);
    return;
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await client
      .from(table)
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });
    if (error) throw new Error(`[${table}] upsert failed: ${error.message}`);
  }
}

async function migrateTable(source, target, table) {
  const rows = await fetchAllRows(source, table);
  console.log(`[table] ${table}: ${rows.length} source rows`);
  await upsertRows(target, table, rows);
}

async function listStorageObjects(client, bucket, prefix = '') {
  const paths = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client.storage
      .from(bucket)
      .list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.warn(`[skip] ${bucket}/${prefix}: ${error.message}`);
      return paths;
    }

    if (!data?.length) break;

    for (const item of data) {
      const itemPath = normalizePath(prefix ? `${prefix}/${item.name}` : item.name);
      if (item.metadata === null || item.id === null) {
        paths.push(...await listStorageObjects(client, bucket, itemPath));
      } else {
        paths.push(itemPath);
      }
    }

    if (data.length < 1000) break;
    offset += 1000;
  }

  return paths;
}

async function copyStorageObject(source, target, bucket, path) {
  const { data, error } = await source.storage.from(bucket).download(path);
  if (error) {
    console.warn(`[storage] failed to download ${bucket}/${path}: ${error.message}`);
    return;
  }

  if (DRY_RUN) {
    console.log(`[dry-run] would upload ${bucket}/${path}`);
    return;
  }

  const { error: uploadError } = await target.storage.from(bucket).upload(path, data, {
    upsert: true,
    contentType: data.type || undefined,
  });

  if (uploadError) {
    throw new Error(`[storage] failed to upload ${bucket}/${path}: ${uploadError.message}`);
  }
}

async function copyStorageBucket(source, target, bucket) {
  const paths = await listStorageObjects(source, bucket);
  console.log(`[storage] ${bucket}: ${paths.length} source objects`);

  for (const path of paths) {
    await copyStorageObject(source, target, bucket, path);
  }
}

async function rewriteIntakeUrls(target, table, bucket) {
  const rows = await fetchAllRows(target, table);
  const updates = [];

  for (const row of rows) {
    const next = { id: row.id };
    const fullbodyPath = storagePathFromUrl(row.photo_fullbody_url, bucket);
    const headshotPath = storagePathFromUrl(row.photo_headshot_url, bucket);

    if (fullbodyPath) {
      next.photo_fullbody_url = publicObjectUrl(TARGET_URL, bucket, fullbodyPath);
    }
    if (headshotPath) {
      next.photo_headshot_url = publicObjectUrl(TARGET_URL, bucket, headshotPath);
    }
    if (next.photo_fullbody_url || next.photo_headshot_url) {
      updates.push(next);
    }
  }

  console.log(`[rewrite] ${table}: ${updates.length} photo URL rows`);
  await upsertRows(target, table, updates);
}

function mapStyleReportStatus(status) {
  switch (status) {
    case 'queued':
      return 'pending';
    case 'processing':
    case 'generating_images':
      return 'generating';
    case 'completed':
      return 'draft_ready';
    case 'failed':
      return 'error';
    default:
      return 'pending';
  }
}

function buildImageUrlsForReport(assets) {
  const byType = new Map();

  for (const asset of assets) {
    const path = storagePathFromUrl(asset.asset_url, 'globe-report-images') || asset.asset_url;
    if (!byType.has(asset.asset_type)) byType.set(asset.asset_type, []);
    byType.get(asset.asset_type).push({ key: String(asset.asset_key || ''), path });
  }

  const sortedPaths = (type) => (byType.get(type) || [])
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }))
    .map((entry) => entry.path);

  return {
    hairstyleCards: sortedPaths('hairstyle'),
    eyewearCards: sortedPaths('eyewear'),
    outfitCards: [
      ...sortedPaths('outfit'),
      ...sortedPaths('signature_outfit'),
    ],
  };
}

async function buildGlobeReportsCompatibility(target) {
  const styleReports = await fetchAllRows(target, 'globe_style_reports');
  const assets = await fetchAllRows(target, 'globe_report_assets');
  const assetsByReportId = new Map();

  for (const asset of assets) {
    if (!assetsByReportId.has(asset.report_id)) assetsByReportId.set(asset.report_id, []);
    assetsByReportId.get(asset.report_id).push(asset);
  }

  const rows = styleReports.map((report) => ({
    id: report.id,
    submission_id: report.submission_id,
    status: mapStyleReportStatus(report.status),
    progress_stage: null,
    error_message: report.error_summary,
    report_data: report.report_json || {},
    image_urls: buildImageUrlsForReport(assetsByReportId.get(report.id) || []),
    share_token: report.public_token ? String(report.public_token) : undefined,
    section_approvals: {
      s1: false,
      s2: false,
      s3: false,
      s4: false,
      s5: false,
      s6: false,
    },
    generated_at: report.generated_at,
    sent_at: null,
    created_at: report.created_at,
    updated_at: report.updated_at,
  }));

  console.log(`[compat] globe_reports: ${rows.length} rows from globe_style_reports`);
  await upsertRows(target, 'globe_reports', rows);
}

async function backfillRevenueEvents(target) {
  const [
    auOrders,
    globeOrders,
    auSubscriptions,
    globeSubscriptions,
    existingRevenueEvents,
  ] = await Promise.all([
    fetchAllRows(target, 'au_orders'),
    fetchAllRows(target, 'globe_orders'),
    fetchAllRows(target, 'au_subscriptions'),
    fetchAllRows(target, 'globe_subscriptions'),
    fetchAllRows(target, 'revenue_events'),
  ]);

  const revenueEvents = [];
  const existingSourceEvents = new Set(
    existingRevenueEvents.map((event) => `${event.source_table}:${event.source_id}:${event.event_type}`)
  );

  for (const order of auOrders) {
    if (!['paid', 'completed'].includes(String(order.status || ''))) continue;
    if (existingSourceEvents.has(`au_orders:${order.id}:one_time_payment`)) continue;
    revenueEvents.push({
      event_key: `au_orders:${order.id}:one_time_payment`,
      source_market: 'au',
      source_table: 'au_orders',
      source_id: String(order.id),
      revenue_kind: 'one_time',
      event_type: 'one_time_payment',
      product_type: 'au_blueprint',
      customer_email: order.customer_email ?? null,
      customer_name: order.customer_name ?? null,
      customer_phone: order.customer_phone ?? null,
      amount_minor: toMinorUnits(order.amount),
      currency: 'AUD',
      status: 'paid',
      payment_id: order.razorpay_payment_id ?? null,
      razorpay_order_id: order.razorpay_order_id ?? null,
      occurred_at: order.created_at ?? new Date().toISOString(),
      metadata: { source: 'au-globe-migration', synthetic_backfill: true },
      ...rowAttribution(order),
    });
  }

  for (const order of globeOrders) {
    if (!['paid', 'completed'].includes(String(order.status || ''))) continue;
    if (existingSourceEvents.has(`globe_orders:${order.id}:one_time_payment`)) continue;
    const sourceMarket = String(order.razorpay_order_id || '').startsWith('global_') ? 'global' : 'globe';
    revenueEvents.push({
      event_key: `globe_orders:${order.id}:one_time_payment`,
      source_market: sourceMarket,
      source_table: 'globe_orders',
      source_id: String(order.id),
      revenue_kind: 'one_time',
      event_type: 'one_time_payment',
      product_type: sourceMarket === 'global' ? 'global_blueprint' : 'globe_blueprint',
      customer_email: order.customer_email ?? null,
      customer_name: order.customer_name ?? null,
      customer_phone: order.customer_phone ?? null,
      amount_minor: toMinorUnits(order.amount),
      currency: 'USD',
      status: 'paid',
      payment_id: order.razorpay_payment_id ?? null,
      razorpay_order_id: order.razorpay_order_id ?? null,
      occurred_at: order.created_at ?? new Date().toISOString(),
      metadata: { source: 'au-globe-migration', synthetic_backfill: true },
      ...rowAttribution(order),
    });
  }

  for (const subscription of auSubscriptions) {
    if (!['active', 'completed', 'expired'].includes(String(subscription.status || ''))) continue;
    if (existingSourceEvents.has(`au_subscriptions:${subscription.id}:subscription_initial`)) continue;
    revenueEvents.push({
      event_key: `au_subscriptions:${subscription.id}:subscription_initial`,
      source_market: 'au',
      source_table: 'au_subscriptions',
      source_id: String(subscription.id),
      revenue_kind: 'subscription',
      event_type: 'subscription_initial',
      product_type: 'subscription',
      customer_email: subscription.customer_email ?? null,
      customer_name: subscription.customer_name ?? null,
      customer_phone: subscription.customer_phone ?? null,
      amount_minor: Math.round(Number(subscription.amount || 0)),
      currency: 'AUD',
      status: 'paid',
      payment_id: subscription.razorpay_payment_id ?? null,
      razorpay_subscription_id: subscription.razorpay_subscription_id ?? null,
      plan_type: subscription.plan_type ?? null,
      occurred_at: subscription.created_at ?? new Date().toISOString(),
      metadata: { source: 'au-globe-migration', synthetic_backfill: true },
      ...rowAttribution(subscription),
    });
  }

  for (const subscription of globeSubscriptions) {
    if (!['active', 'completed', 'expired'].includes(String(subscription.status || ''))) continue;
    if (existingSourceEvents.has(`globe_subscriptions:${subscription.id}:subscription_initial`)) continue;
    const sourceMarket = String(subscription.source || '').startsWith('global') ? 'global' : 'globe';
    revenueEvents.push({
      event_key: `globe_subscriptions:${subscription.id}:subscription_initial`,
      source_market: sourceMarket,
      source_table: 'globe_subscriptions',
      source_id: String(subscription.id),
      revenue_kind: 'subscription',
      event_type: 'subscription_initial',
      product_type: 'subscription',
      customer_email: subscription.customer_email ?? null,
      customer_name: subscription.customer_name ?? null,
      customer_phone: subscription.customer_phone ?? null,
      amount_minor: Math.round(Number(subscription.amount || 0)),
      currency: 'USD',
      status: 'paid',
      payment_id: subscription.razorpay_payment_id ?? null,
      razorpay_subscription_id: subscription.razorpay_subscription_id ?? null,
      plan_type: subscription.plan_type ?? null,
      occurred_at: subscription.created_at ?? new Date().toISOString(),
      metadata: { source: 'au-globe-migration', synthetic_backfill: true },
      ...rowAttribution(subscription),
    });
  }

  console.log(`[revenue] revenue_events: ${revenueEvents.length} historical rows`);
  if (!revenueEvents.length) return;

  if (DRY_RUN) {
    console.log(`[dry-run] would upsert ${revenueEvents.length} rows into revenue_events`);
    return;
  }

  for (let i = 0; i < revenueEvents.length; i += BATCH_SIZE) {
    const batch = revenueEvents.slice(i, i + BATCH_SIZE);
    const { error } = await target
      .from('revenue_events')
      .upsert(batch, { onConflict: 'event_key', ignoreDuplicates: false });
    if (error) throw new Error(`[revenue_events] upsert failed: ${error.message}`);
  }
}

async function printCounts(client, label) {
  console.log(`\n[counts] ${label}`);
  for (const table of TABLES_IN_ORDER.concat('globe_reports')) {
    const { count, error } = await client
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ${table}: unavailable (${error.message})`);
    } else {
      console.log(`  ${table}: ${count ?? 0}`);
    }
  }
}

async function main() {
  requireEnv('SOURCE_SUPABASE_URL', SOURCE_URL);
  requireEnv('SOURCE_SUPABASE_SERVICE_ROLE_KEY', SOURCE_SERVICE_ROLE_KEY);
  requireEnv('TARGET_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL', TARGET_URL);
  requireEnv('TARGET_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY', TARGET_SERVICE_ROLE_KEY);

  const source = createAdminClient(SOURCE_URL, SOURCE_SERVICE_ROLE_KEY);
  const target = createAdminClient(TARGET_URL, TARGET_SERVICE_ROLE_KEY);

  console.log(`Starting AU/Globe migration${DRY_RUN ? ' (dry run)' : ''}`);
  await printCounts(source, 'source before');
  await printCounts(target, 'target before');

  for (const table of TABLES_IN_ORDER) {
    await migrateTable(source, target, table);
  }

  for (const bucket of STORAGE_BUCKETS) {
    await copyStorageBucket(source, target, bucket);
  }

  await rewriteIntakeUrls(target, 'au_intake_submissions', 'au-intake-photos');
  await rewriteIntakeUrls(target, 'globe_intake_submissions', 'globe-intake-photos');
  await buildGlobeReportsCompatibility(target);
  await backfillRevenueEvents(target);

  await printCounts(target, 'target after');
  console.log('AU/Globe migration complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
