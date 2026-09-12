import 'server-only';

import crypto from 'crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from './adminAuth';

export const STYLIST_WORKSPACE_COOKIE = 'iconik_stylist_workspace';
const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export interface StylistWorkspaceIdentity {
  sessionId: string;
  stylistId: string;
  name: string;
  slug: string;
  expiresAt: string;
}

function sessionHash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function fingerprint(value: string) {
  return crypto
    .createHmac('sha256', process.env.ICONIK_INTERNAL_SECRET || 'iconik-stylist-workspace')
    .update(value)
    .digest('hex');
}

export function requestIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  );
}

export async function getWorkspaceStylistBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('stylists')
    .select('id, name, slug, workspace_enabled, is_active')
    .eq('slug', slug)
    .eq('workspace_enabled', true)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as {
    id: string;
    name: string;
    slug: string;
    workspace_enabled: boolean;
    is_active: boolean;
  };
}

export async function isWorkspaceLoginLocked(stylistId: string, ip: string) {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
  const { count } = await supabaseAdmin
    .from('stylist_login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('stylist_id', stylistId)
    .eq('ip_hash', fingerprint(ip))
    .eq('succeeded', false)
    .gte('created_at', since);

  return (count ?? 0) >= MAX_FAILED_ATTEMPTS;
}

export async function recordWorkspaceLoginAttempt(stylistId: string, ip: string, succeeded: boolean) {
  await supabaseAdmin.from('stylist_login_attempts').insert({
    stylist_id: stylistId,
    ip_hash: fingerprint(ip),
    succeeded,
  });
}

export async function verifyWorkspacePin(stylistId: string, pin: string) {
  const { data, error } = await supabaseAdmin.rpc('verify_stylist_pin', {
    _stylist_id: stylistId,
    _pin: pin,
  });
  if (error) return false;
  return data === true;
}

export async function createWorkspaceSession(input: {
  stylistId: string;
  ip: string;
  userAgent?: string | null;
}) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('stylist_sessions')
    .insert({
      stylist_id: input.stylistId,
      token_hash: sessionHash(token),
      ip_hash: fingerprint(input.ip),
      user_agent: input.userAgent?.slice(0, 400) || null,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message || 'Could not create stylist session');
  return { token, sessionId: data.id as string, expiresAt };
}

export function setWorkspaceSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(STYLIST_WORKSPACE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearWorkspaceSessionCookie(response: NextResponse) {
  response.cookies.set(STYLIST_WORKSPACE_COOKIE, '', { maxAge: 0, path: '/' });
}

export const getStylistWorkspaceIdentity = cache(async (): Promise<StylistWorkspaceIdentity | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(STYLIST_WORKSPACE_COOKIE)?.value;
  if (!token) return null;

  const { data: session, error } = await supabaseAdmin
    .from('stylist_sessions')
    .select('id, stylist_id, last_seen_at, expires_at, revoked_at, stylists(id, name, slug, workspace_enabled, is_active)')
    .eq('token_hash', sessionHash(token))
    .maybeSingle();

  if (error || !session || session.revoked_at) return null;
  const now = Date.now();
  if (new Date(session.expires_at).getTime() <= now) return null;
  if (new Date(session.last_seen_at).getTime() < now - SESSION_IDLE_MS) {
    await supabaseAdmin
      .from('stylist_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', session.id);
    return null;
  }

  const stylist = Array.isArray(session.stylists) ? session.stylists[0] : session.stylists;
  if (!stylist?.slug || !stylist.workspace_enabled || !stylist.is_active) return null;
  if (now - new Date(session.last_seen_at).getTime() > 5 * 60 * 1000) {
    await supabaseAdmin
      .from('stylist_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', session.id);
  }

  return {
    sessionId: session.id as string,
    stylistId: stylist.id as string,
    name: stylist.name as string,
    slug: stylist.slug as string,
    expiresAt: session.expires_at as string,
  };
});

export async function revokeCurrentWorkspaceSession() {
  const identity = await getStylistWorkspaceIdentity();
  if (!identity) return;
  await supabaseAdmin
    .from('stylist_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', identity.sessionId);
}

export async function isAdminCookieAuthenticated() {
  const cookieStore = await cookies();
  return isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function getConsultationWorkspaceAccess(consultationId: string) {
  const admin = await isAdminCookieAuthenticated();
  const identity = admin ? null : await getStylistWorkspaceIdentity();
  if (!admin && !identity) return null;
  let query = supabaseAdmin.from('consultations').select('id, stylist_id').eq('id', consultationId);
  if (!admin) query = query.eq('stylist_id', identity!.stylistId);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return { stylistId: data.stylist_id as string | null, isAdmin: admin };
}

export async function canAccessConsultation(consultationId: string) {
  return Boolean(await getConsultationWorkspaceAccess(consultationId));
}

export async function canAccessBlueprintSubmission(submissionId: string) {
  if (await isAdminCookieAuthenticated()) return true;
  const identity = await getStylistWorkspaceIdentity();
  if (!identity) return false;
  const { data } = await supabaseAdmin
    .from('stylist_intake_responses')
    .select('id, consultation_id')
    .eq('id', submissionId)
    .eq('assigned_stylist_id', identity.stylistId)
    .maybeSingle();
  if (!data?.consultation_id) return false;
  const { data: consultation } = await supabaseAdmin
    .from('consultations')
    .select('id')
    .eq('id', data.consultation_id)
    .eq('stylist_id', identity.stylistId)
    .maybeSingle();
  return Boolean(consultation);
}

export async function canAccessBlueprintReport(reportId: string) {
  if (await isAdminCookieAuthenticated()) return true;
  const identity = await getStylistWorkspaceIdentity();
  if (!identity) return false;
  const { data: report } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('submission_id')
    .eq('id', reportId)
    .maybeSingle();
  if (!report?.submission_id) return false;
  const { data: intake } = await supabaseAdmin
    .from('stylist_intake_responses')
    .select('id, consultation_id')
    .eq('id', report.submission_id)
    .eq('assigned_stylist_id', identity.stylistId)
    .maybeSingle();
  if (!intake?.consultation_id) return false;
  const { data: consultation } = await supabaseAdmin
    .from('consultations')
    .select('id')
    .eq('id', intake.consultation_id)
    .eq('stylist_id', identity.stylistId)
    .maybeSingle();
  return Boolean(consultation);
}

export async function logStylistReportActivity(input: {
  action: string;
  reportId?: string | null;
  consultationId?: string | null;
  stylistId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await supabaseAdmin.from('stylist_report_activity').insert({
    action: input.action,
    report_id: input.reportId ?? null,
    consultation_id: input.consultationId ?? null,
    stylist_id: input.stylistId ?? null,
    metadata: input.metadata ?? {},
  });
}
