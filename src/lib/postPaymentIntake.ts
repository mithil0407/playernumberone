import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase';
import { assertCrmSupabaseConfigured, crmSupabase } from '@/lib/crmSupabase';

export const POST_PAYMENT_INTAKE_BUCKET = 'consultation-images';
export const POST_PAYMENT_INTAKE_TOKEN_TTL_DAYS = 14;

export type PostPaymentIntakeSource = 'root_checkout' | 'offer_2699_checkout';
export type PostPaymentIntakePhotoType = 'full_front' | 'headshot' | 'side_profile';

export interface PostPaymentIntakeTokenRow {
  id: string;
  token_hash: string;
  order_id: string | null;
  customer_id: string | null;
  customer_email: string;
  customer_phone: string;
  customer_name: string | null;
  source: PostPaymentIntakeSource;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  submitted_at: string | null;
  expires_at: string;
  created_at: string;
}

type RazorpayPaymentDetails = {
  id: string;
  order_id?: string;
  status?: string;
  captured?: boolean;
};

function getSiteBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://www.iconik.pro';
}

export function hashPostPaymentIntakeToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createRawPostPaymentIntakeToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function buildPostPaymentIntakeUrl(token: string, paymentId?: string | null): string {
  const url = new URL('/checkout/intake', getSiteBaseUrl());
  url.searchParams.set('t', token);
  if (paymentId) url.searchParams.set('payment_id', paymentId);
  return url.toString();
}

export async function createPostPaymentIntakeToken(input: {
  orderId?: string | null;
  customerId?: string | null;
  customerEmail: string;
  customerPhone: string;
  customerName?: string | null;
  source: PostPaymentIntakeSource;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
}): Promise<{ token: string; url: string }> {
  const token = createRawPostPaymentIntakeToken();
  const expiresAt = new Date(Date.now() + POST_PAYMENT_INTAKE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from('post_payment_intake_tokens')
    .insert([{
      token_hash: hashPostPaymentIntakeToken(token),
      order_id: input.orderId || null,
      customer_id: input.customerId || null,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      customer_name: input.customerName || input.customerEmail.split('@')[0],
      source: input.source,
      razorpay_order_id: input.razorpayOrderId || null,
      razorpay_payment_id: input.razorpayPaymentId || null,
      expires_at: expiresAt,
    }]);

  if (error) throw error;

  return {
    token,
    url: buildPostPaymentIntakeUrl(token, input.razorpayPaymentId),
  };
}

export async function findPostPaymentIntakeSourceForOrder(orderId: string): Promise<PostPaymentIntakeSource | null> {
  const { data, error } = await supabaseAdmin
    .from('post_payment_intake_tokens')
    .select('source')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.source) return null;
  return data.source as PostPaymentIntakeSource;
}

export async function loadPostPaymentIntakeToken(token: string): Promise<PostPaymentIntakeTokenRow | null> {
  const { data, error } = await supabaseAdmin
    .from('post_payment_intake_tokens')
    .select('*')
    .eq('token_hash', hashPostPaymentIntakeToken(token))
    .single();

  if (error || !data) return null;
  return data as PostPaymentIntakeTokenRow;
}

export async function verifyRazorpayPaymentForToken(row: PostPaymentIntakeTokenRow, paymentId: string): Promise<RazorpayPaymentDetails> {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured');
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const payment = await razorpay.payments.fetch(paymentId) as RazorpayPaymentDetails;
  const expectedOrderId = row.razorpay_order_id;

  if (!payment?.id || payment.id !== paymentId) {
    throw new Error('Payment could not be verified');
  }
  if (expectedOrderId && payment.order_id !== expectedOrderId) {
    throw new Error('Payment does not match this order');
  }
  if (!(payment.status === 'captured' || payment.status === 'authorized' || payment.captured === true)) {
    throw new Error('Payment is not successful yet');
  }

  await supabaseAdmin
    .from('post_payment_intake_tokens')
    .update({ razorpay_payment_id: paymentId })
    .eq('id', row.id);

  if (row.order_id) {
    await supabaseAdmin
      .from('orders')
      .update({ razorpay_payment_id: paymentId, status: 'paid' })
      .eq('id', row.order_id)
      .in('status', ['pending', 'completed']);
  }

  return payment;
}

export async function verifyPostPaymentIntakeAccess(input: {
  token?: string | null;
  paymentId?: string | null;
}): Promise<PostPaymentIntakeTokenRow> {
  if (!input.token) throw new Error('Missing intake token');
  if (!input.paymentId) throw new Error('Missing payment ID');

  const row = await loadPostPaymentIntakeToken(input.token);
  if (!row) throw new Error('Invalid intake link');
  if (row.submitted_at) throw new Error('This intake has already been submitted');
  if (new Date(row.expires_at).getTime() < Date.now()) throw new Error('This intake link has expired');

  await verifyRazorpayPaymentForToken(row, input.paymentId);
  return { ...row, razorpay_payment_id: input.paymentId };
}

async function hasSubmittedPostPaymentIntakeForContext(row: PostPaymentIntakeTokenRow, paymentId: string): Promise<boolean> {
  if (row.submitted_at) return true;

  const checks: Array<{ column: 'order_id' | 'razorpay_order_id' | 'razorpay_payment_id'; value: string }> = [];
  if (row.order_id) checks.push({ column: 'order_id', value: row.order_id });
  if (row.razorpay_order_id) checks.push({ column: 'razorpay_order_id', value: row.razorpay_order_id });
  if (paymentId) checks.push({ column: 'razorpay_payment_id', value: paymentId });

  for (const check of checks) {
    const { data, error } = await supabaseAdmin
      .from('post_payment_intake_tokens')
      .select('id')
      .eq(check.column, check.value)
      .not('submitted_at', 'is', null)
      .limit(1)
      .single();

    if (data?.id) return true;
    if (error && error.code !== 'PGRST116') {
      console.error('Post-payment intake submitted-state lookup failed:', error);
    }
  }

  return false;
}

export async function verifyPostPaymentIntakePageAccess(input: {
  token?: string | null;
  paymentId?: string | null;
}): Promise<{ row: PostPaymentIntakeTokenRow; submitted: boolean }> {
  if (!input.token) throw new Error('Missing intake token');
  if (!input.paymentId) throw new Error('Missing payment ID');

  const row = await loadPostPaymentIntakeToken(input.token);
  if (!row) throw new Error('Invalid intake link');
  if (new Date(row.expires_at).getTime() < Date.now()) throw new Error('This intake link has expired');

  await verifyRazorpayPaymentForToken(row, input.paymentId);
  const verifiedRow = { ...row, razorpay_payment_id: input.paymentId };
  const submitted = await hasSubmittedPostPaymentIntakeForContext(verifiedRow, input.paymentId);

  return { row: verifiedRow, submitted };
}

function sanitizeFileNamePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function extensionForUpload(input: { fileName?: string | null; contentType?: string | null }): string {
  const fromName = input.fileName?.split('.').pop();
  if (fromName && /^[a-z0-9]{2,5}$/i.test(fromName)) return sanitizeFileNamePart(fromName);
  if (input.contentType === 'image/png') return 'png';
  if (input.contentType === 'image/webp') return 'webp';
  if (input.contentType === 'image/heic') return 'heic';
  if (input.contentType === 'image/heif') return 'heif';
  return 'jpg';
}

function isAllowedPhotoType(value: string): value is PostPaymentIntakePhotoType {
  return value === 'full_front' || value === 'headshot' || value === 'side_profile';
}

export function assertPostPaymentIntakePhotoType(value: string): PostPaymentIntakePhotoType {
  if (!isAllowedPhotoType(value)) throw new Error(`Invalid photo type: ${value}`);
  return value;
}

export async function createPendingIntakePhotoUploadUrl(input: {
  pendingIntakeId: string;
  photoType: PostPaymentIntakePhotoType;
  fileName?: string | null;
  contentType?: string | null;
}): Promise<{ bucket: string; path: string; signedUrl: string; token: string }> {
  assertCrmSupabaseConfigured();

  if (input.contentType && !input.contentType.startsWith('image/')) {
    throw new Error(`${input.photoType} must be an image`);
  }

  const ext = extensionForUpload({ fileName: input.fileName, contentType: input.contentType });
  const storagePath = `post-payment-intakes/${input.pendingIntakeId}/${Date.now()}_${input.photoType}.${ext}`;
  const { data, error } = await crmSupabase.storage
    .from(POST_PAYMENT_INTAKE_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (error || !data?.signedUrl || !data?.token) {
    throw new Error(`CRM signed upload URL failed: ${error?.message || 'No signed URL returned'}`);
  }

  return {
    bucket: POST_PAYMENT_INTAKE_BUCKET,
    path: storagePath,
    signedUrl: data.signedUrl,
    token: data.token,
  };
}

export async function assertPendingIntakePhotosExist(
  photos: Record<PostPaymentIntakePhotoType, { bucket: string; path: string }>,
): Promise<void> {
  assertCrmSupabaseConfigured();

  await Promise.all(Object.entries(photos).map(async ([photoType, photo]) => {
    const { data, error } = await crmSupabase.storage
      .from(photo.bucket)
      .info(photo.path);

    if (error || !data) {
      throw new Error(`Uploaded ${photoType.replace('_', ' ')} image could not be confirmed`);
    }
  }));
}

export async function upsertPendingCrmIntakeShell(row: PostPaymentIntakeTokenRow, paymentId: string): Promise<{ pendingIntakeId: string }> {
  assertCrmSupabaseConfigured();

  const phone = row.customer_phone;
  const name = row.customer_name || row.customer_email.split('@')[0];
  const now = new Date().toISOString();

  const { data: existing, error: fetchError } = await crmSupabase
    .from('post_payment_client_intakes')
    .select('id')
    .eq('client_phone', phone)
    .is('consumed_at', null)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`CRM pending intake lookup failed: ${fetchError.message}`);
  }

  const shell = {
    client_name: name,
    client_email: row.customer_email,
    client_phone: phone,
    source: row.source,
    order_id: row.order_id,
    razorpay_order_id: row.razorpay_order_id,
    payment_id: paymentId,
    submitted_at: now,
  };

  if (existing?.id) {
    const { data: updated, error: updateError } = await crmSupabase
      .from('post_payment_client_intakes')
      .update(shell)
      .eq('id', existing.id)
      .select('id')
      .single();

    if (updateError || !updated?.id) {
      throw new Error(`CRM pending intake update failed: ${updateError?.message || 'No pending intake ID returned'}`);
    }

    return { pendingIntakeId: updated.id };
  }

  const { data: created, error: insertError } = await crmSupabase
    .from('post_payment_client_intakes')
    .insert([shell])
    .select('id')
    .single();

  if (insertError || !created?.id) {
    throw new Error(`CRM pending intake insert failed: ${insertError?.message || 'No pending intake ID returned'}`);
  }

  return { pendingIntakeId: created.id };
}

export async function savePendingCrmIntake(input: {
  pendingIntakeId: string;
  row: PostPaymentIntakeTokenRow;
  measurements: Record<string, number | string>;
  photos: Record<string, { bucket: string; path: string }>;
  paymentId: string;
}): Promise<{ pendingIntakeId: string }> {
  assertCrmSupabaseConfigured();

  const phone = input.row.customer_phone;
  const submittedAt = new Date().toISOString();

  const { data, error } = await crmSupabase
    .from('post_payment_client_intakes')
    .update({
      client_name: input.row.customer_name || input.row.customer_email.split('@')[0],
      client_email: input.row.customer_email,
      client_phone: phone,
      source: input.row.source,
      order_id: input.row.order_id,
      razorpay_order_id: input.row.razorpay_order_id,
      payment_id: input.paymentId,
      measurements: input.measurements,
      photos: input.photos,
      submitted_at: submittedAt,
    })
    .eq('id', input.pendingIntakeId)
    .select('id')
    .single();

  if (error || !data?.id) {
    throw new Error(`CRM pending intake save failed: ${error?.message || 'No pending intake ID returned'}`);
  }

  return { pendingIntakeId: data.id };
}
