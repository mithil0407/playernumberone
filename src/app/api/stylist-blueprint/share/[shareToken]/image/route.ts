import { NextRequest, NextResponse } from 'next/server';
import { getStylistBlueprintClientImageSource } from '@/lib/stylistBlueprintLoader';
import { isStylistBlueprintImagePath } from '@/lib/stylistBlueprintImageGenerator';
import { getStylistBlueprintDisplayImage } from '@/lib/stylistBlueprintImageDelivery';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';

/**
 * A report image behind a stable link. The client page only ever holds these
 * links, and each one resolves to a valid signed URL when it is loaded, so
 * images keep working however long ago the page was cached or opened.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;
  const path = request.nextUrl.searchParams.get('p') ?? '';
  const notFound = () => new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });

  const source = await getStylistBlueprintClientImageSource(shareToken);
  // Only paths this report actually references can be signed.
  if (!source || !isStylistBlueprintImagePath(source.imagePaths, path)) return notFound();
  // Before publishing, only the report's stylist or an admin (client preview) may load images.
  if (!source.live && !(await canAccessBlueprintReport(source.reportId))) return notFound();

  const image = await getStylistBlueprintDisplayImage(path);
  if (!image) return notFound();

  // A published report's redirect can be cached by the browser and the CDN,
  // but never for longer than the signed URL it points to stays valid.
  const cacheSeconds = Math.max(0, Math.min(30 * 60, Math.floor((image.expiresAt - Date.now()) / 1000) - 5 * 60));
  return NextResponse.redirect(image.url, {
    status: 302,
    headers: {
      'Cache-Control': source.live && cacheSeconds > 0 ? `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}` : 'private, no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
