import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAdminAuthenticated } from '@/lib/adminAuth';

// Pages that belong to the India-only root funnel
const INDIA_ONLY_PATHS = ['/', '/checkout', '/checkout-monthly', '/monthly', '/offer-2699', '/offer-2699/checkout'];

// Client paths that don't need auth
const CLIENT_PUBLIC = [
  '/iconik-club/client/login',
  '/iconik-club/client/auth/callback',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Admin routes: simple cookie check ────────────────────────────────
  if (pathname.startsWith('/iconik-club/admin')) {
    if (!pathname.startsWith('/iconik-club/admin/login')) {
      if (!isAdminAuthenticated(request)) {
        const loginUrl = new URL('/iconik-club/admin/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl, { status: 307 });
      }
    }
    return NextResponse.next();
  }

  // ── 1b. Man admin routes: same cookie, separate login page ───────────────
  if (pathname.startsWith('/man/admin')) {
    if (!pathname.startsWith('/man/admin/login')) {
      if (!isAdminAuthenticated(request)) {
        const loginUrl = new URL('/man/admin/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl, { status: 307 });
      }
    }
    return NextResponse.next();
  }

  // ── 1c. Globe admin routes: same cookie, separate login page ─────────────
  if (pathname.startsWith('/globe/admin')) {
    if (!pathname.startsWith('/globe/admin/login')) {
      if (!isAdminAuthenticated(request)) {
        const loginUrl = new URL('/globe/admin/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl, { status: 307 });
      }
    }
    return NextResponse.next();
  }

  // ── 2. Client routes: Supabase Auth check ───────────────────────────────
  if (pathname.startsWith('/iconik-club/client')) {
    if (CLIENT_PUBLIC.some(p => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    const response = NextResponse.next({ request: { headers: request.headers } });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL('/iconik-club/client/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl, { status: 307 });
    }

    return response;
  }

  // ── 3. Geo-routing: India-only root funnel ───────────────────────────────
  // In local dev, use ?country=XX to simulate a geo (e.g. /?country=US to test redirect)
  const country =
    process.env.NODE_ENV === 'development'
      ? (request.nextUrl.searchParams.get('country') ??
         request.headers.get('x-vercel-ip-country'))
      : request.headers.get('x-vercel-ip-country');

  if (!country) return NextResponse.next();

  if (country !== 'IN') {
    if (INDIA_ONLY_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL('/globe', request.url), { status: 307 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/globe/admin/:path*',
    '/((?!globe|api|_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|avif|woff2?|ico)).*)',
  ],
};
