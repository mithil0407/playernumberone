import { createHmac } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ACCOUNT_FAILURES = 10;
const MAX_IP_FAILURES = 20;

function fingerprint(value: string) {
  const secret = process.env.ICONIK_ADMIN_SESSION_SECRET || process.env.ICONIK_INTERNAL_SECRET;
  if (!secret) throw new Error('Admin login protection is not configured');
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function adminLoginIdentity(request: NextRequest, email: string) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip') || 'unknown';
  return { accountHash: fingerprint(`account:${email.trim().toLowerCase()}`), ipHash: fingerprint(`ip:${ip}`) };
}

export async function checkAdminLoginLimit(accountHash: string, ipHash: string) {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const [account, ip] = await Promise.all([
    supabaseAdmin.from('admin_login_attempts').select('id', { count: 'exact', head: true })
      .eq('account_hash', accountHash).eq('succeeded', false).gte('created_at', since),
    supabaseAdmin.from('admin_login_attempts').select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash).eq('succeeded', false).gte('created_at', since),
  ]);
  if (account.error || ip.error) throw new Error('Admin login protection is unavailable');
  return (account.count || 0) >= MAX_ACCOUNT_FAILURES || (ip.count || 0) >= MAX_IP_FAILURES;
}

export async function recordAdminLoginAttempt(accountHash: string, ipHash: string) {
  const { data, error } = await supabaseAdmin.from('admin_login_attempts')
    .insert({ account_hash: accountHash, ip_hash: ipHash, succeeded: false })
    .select('id').single();
  if (error || !data) throw new Error('Admin login protection is unavailable');
  return data.id as number;
}

export async function markAdminLoginSucceeded(attemptId: number) {
  const { error } = await supabaseAdmin.from('admin_login_attempts')
    .update({ succeeded: true }).eq('id', attemptId);
  if (error) throw new Error('Admin login protection is unavailable');
}
