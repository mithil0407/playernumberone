import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ADMIN_COOKIE } from '@/lib/adminSessionCore';
import { verifyAdminCookieEdge } from '@/lib/adminAuthEdge';
import { isClientUploadPath, isCrossOriginWorkspaceMutation, isStylistPrivatePath, isStylistWorkspacePage, WORKSPACE_SECURITY_HEADERS } from '@/lib/stylistWorkspaceSecurity';

// Pages that belong to the India-only root funnel
const INDIA_ONLY_PATHS = ['/', '/checkout', '/checkout-monthly', '/monthly', '/offer-2699', '/offer-2699/checkout'];

// Client paths that don't need auth
const CLIENT_PUBLIC = [
  '/iconik-club/client/login',
  '/iconik-club/client/auth/callback',
];

// Crawlers skip the geo redirect so the India homepage is what gets indexed.
// AI answer engines crawl mostly from US data centres; without them here they
// only ever saw /globe and described ICONIK from the global offer.
const SEARCH_BOT_PATTERN =
  /(Googlebot|Google-InspectionTool|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|LinkedInBot|Twitterbot|OAI-SearchBot|ChatGPT-User|GPTBot|PerplexityBot|Perplexity-User|ClaudeBot|Claude-User|Claude-SearchBot|Applebot|Amazonbot|MistralAI-User)/i;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') ?? '';
  const isSearchBot = SEARCH_BOT_PATTERN.test(userAgent);
  const adminAuthenticated = await verifyAdminCookieEdge(request.cookies.get(ADMIN_COOKIE)?.value);

  if (pathname.startsWith('/api/') && request.cookies.has(ADMIN_COOKIE)
    && isCrossOriginWorkspaceMutation(request.method, request.headers, request.url)) {
    return NextResponse.json({ error: 'Cross-origin admin requests are not allowed' }, { status: 403 });
  }

  // Public report images set their own cache headers; the private no-store
  // headers below would stop browsers and the CDN reusing image redirects.
  if (pathname.startsWith('/api/stylist-blueprint/share/') && request.method === 'GET') {
    return NextResponse.next();
  }

  // The token in this URL is the client's key, so the page must never be
  // cached, indexed, framed or leak through a Referer header.
  if (isClientUploadPath(pathname)) {
    const response = pathname.startsWith('/api/') && isCrossOriginWorkspaceMutation(request.method, request.headers, request.url)
      ? NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
      : NextResponse.next();
    for (const [key, value] of Object.entries(WORKSPACE_SECURITY_HEADERS)) response.headers.set(key, value);
    return response;
  }

  if (isStylistPrivatePath(pathname)) {
    const privateResponse = (response: NextResponse) => {
      for (const [key, value] of Object.entries(WORKSPACE_SECURITY_HEADERS)) response.headers.set(key, value);
      return response;
    };
    if (pathname.startsWith('/api/') && isCrossOriginWorkspaceMutation(request.method, request.headers, request.url)) {
      return privateResponse(NextResponse.json({ error: 'Please submit this request from your ICONIK workspace.' }, { status: 403 }));
    }
    if (isStylistWorkspacePage(pathname) && !pathname.startsWith('/stylist/admin/')
      && !request.cookies.get('iconik_stylist_workspace')?.value && !adminAuthenticated) {
      const login = new URL('/stylist/login', request.url);
      login.searchParams.set('redirectTo', pathname + request.nextUrl.search);
      return privateResponse(NextResponse.redirect(login));
    }
    // Replace, never trust, an incoming path header. The layout uses this to
    // preserve the exact client/report/filter after an expired-session login.
    if (pathname.startsWith('/stylist/admin') && !pathname.startsWith('/stylist/admin/login') && !adminAuthenticated) {
      const login = new URL('/stylist/admin/login', request.url);
      login.searchParams.set('redirectTo', pathname + request.nextUrl.search);
      return privateResponse(NextResponse.redirect(login));
    }
    const headers = new Headers(request.headers);
    headers.set('x-iconik-workspace-path', pathname + request.nextUrl.search);
    return privateResponse(NextResponse.next({ request: { headers } }));
  }

  // ── 1. Admin routes: simple cookie check ────────────────────────────────
  if (pathname.startsWith('/iconik-club/admin') || pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (!pathname.startsWith('/iconik-club/admin/login')) {
      if (!adminAuthenticated) {
        const loginUrl = new URL('/iconik-club/admin/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl, { status: 307 });
      }
    }
    return NextResponse.next();
  }

  // ── 1b. Man admin routes: same cookie, separate login page ───────────────
  // ── ICONIK Agent analytics: same admin cookie, uses the Man admin login ────
  if (pathname.startsWith('/agent/admin')) {
    if (!adminAuthenticated) {
      const loginUrl = new URL('/man/admin/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl, { status: 307 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/man/admin')) {
    if (!pathname.startsWith('/man/admin/login')) {
      if (!adminAuthenticated) {
        const loginUrl = new URL('/man/admin/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl, { status: 307 });
      }
    }
    return NextResponse.next();
  }

  // ── 1c. Stylist admin routes: same cookie, separate login page ───────────
  if (pathname.startsWith('/stylist/admin')) {
    if (!pathname.startsWith('/stylist/admin/login')) {
      if (!adminAuthenticated) {
        const loginUrl = new URL('/stylist/admin/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl, { status: 307 });
      }
    }
    return NextResponse.next();
  }

  // ── 1d. Globe admin routes: same cookie, separate login page ─────────────
  if (pathname.startsWith('/globe/admin')) {
    if (!pathname.startsWith('/globe/admin/login')) {
      if (!adminAuthenticated) {
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

  if (!country || isSearchBot) return NextResponse.next();

  if (country !== 'IN') {
    if (INDIA_ONLY_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL('/globe', request.url), { status: 307 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/api/stylist-workspace/:path*',
    '/api/stylist-blueprint/:path*',
    '/globe/admin/:path*',
    '/((?!globe|api|_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|avif|woff2?|ico)).*)',
  ],
};
