import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that belong to the India-only root funnel
const INDIA_ONLY_PATHS = ['/', '/checkout', '/thankyou', '/intake', '/au'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get country from Vercel's geo header (only present in Vercel deployments)
    const country = request.headers.get('x-vercel-ip-country');

    // If the header is absent (local dev), do nothing
    if (!country) {
        return NextResponse.next();
    }

    const isIndiaVisitor = country === 'IN';

    // Only redirect non-India visitors who are on the root funnel
    if (!isIndiaVisitor) {
        const isOnRootFunnel =
            INDIA_ONLY_PATHS.includes(pathname) ||
            pathname.startsWith('/au/');

        if (isOnRootFunnel) {
            const redirectUrl = new URL('/globe', request.url);
            return NextResponse.redirect(redirectUrl, { status: 307 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all paths EXCEPT:
         * - /globe and /globe/* (UAE funnel — always allowed)
         * - /api/* (backend routes)
         * - /_next/* (Next.js internals)
         * - Static files: images, fonts, favicon, etc.
         */
        '/((?!globe|api|_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|avif|woff2?|ico)).*)',
    ],
};
