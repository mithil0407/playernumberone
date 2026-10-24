import { NextRequest, NextResponse } from 'next/server';
import { MembershipError } from '@/lib/styleMembershipServer';

export function requestMeta(request: NextRequest) {
  return {
    userAgent: request.headers.get('user-agent'),
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
  };
}

export async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const text = await request.text();
    const parsed = text ? JSON.parse(text) : {};
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

/** Errors meant for her are shown as written; anything else is logged and kept vague. */
export function errorResponse(error: unknown, context: string) {
  if (error instanceof MembershipError) {
    return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status });
  }
  console.error(`[style-membership] ${context}:`, error);
  return NextResponse.json({ ok: false, error: 'Something went wrong on our side. Please try again.', code: 'server_error' }, { status: 500 });
}

export const noStore = { 'Cache-Control': 'private, no-store' };
