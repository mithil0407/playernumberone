import { NextRequest, NextResponse } from 'next/server';

// Returns the user's country code for the /man funnel geo-pricing.
// Uses Vercel's x-vercel-ip-country header in production.
// In development, accepts ?country=XX query param to simulate different regions.
export async function GET(request: NextRequest) {
  const country =
    process.env.NODE_ENV === 'development'
      ? (new URL(request.url).searchParams.get('country') ??
         request.headers.get('x-vercel-ip-country') ??
         'IN')
      : (request.headers.get('x-vercel-ip-country') ?? 'IN');

  return NextResponse.json({ country });
}
