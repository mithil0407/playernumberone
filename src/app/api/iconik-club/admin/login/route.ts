import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, createAdminSessionToken, ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS } from '@/lib/adminAuth';
import { adminLoginIdentity, checkAdminLoginLimit, markAdminLoginSucceeded, recordAdminLoginAttempt } from '@/lib/adminLoginProtection';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 320 || password.length > 1024) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const { accountHash, ipHash } = adminLoginIdentity(request, email);
    if (await checkAdminLoginLimit(accountHash, ipHash)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': '900' } });
    }
    const attemptId = await recordAdminLoginAttempt(accountHash, ipHash);

    if (!verifyAdminCredentials(email, password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    await markAdminLoginSucceeded(attemptId);

    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Sign-in is temporarily unavailable.' }, { status: 503 });
  }
}
