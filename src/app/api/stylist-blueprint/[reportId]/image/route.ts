import { NextRequest, NextResponse } from 'next/server';
import { getStylistBlueprintDisplayImage } from '@/lib/stylistBlueprintImageDelivery';
import { signStylistBlueprintImagePath } from '@/lib/stylistBlueprintImageGenerator';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';

const SIGNED_URL_MS = 60 * 60 * 1000;

/**
 * A report image for the stylist studio, behind a link that never changes.
 * The browser caches the redirect, so reloading the report after an upload
 * reuses every picture it already has instead of downloading them all again.
 *
 * By default it serves the light 1200px copy the client report uses. `full=1`
 * serves the stored original, which the cropper needs for a sharp crop.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const path = request.nextUrl.searchParams.get('p') ?? '';
  const full = request.nextUrl.searchParams.get('full') === '1';
  const notFound = () => new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });

  // Only files inside this report's own folder.
  if (!path.startsWith(`${reportId}/`) || path.includes('..') || path.includes('\\')) return notFound();
  if (!(await canAccessBlueprintReport(reportId))) return notFound();

  let image: { url: string; expiresAt: number } | null = null;
  try {
    image = full
      ? { url: await signStylistBlueprintImagePath(path), expiresAt: Date.now() + SIGNED_URL_MS }
      : await getStylistBlueprintDisplayImage(path);
  } catch {
    image = null;
  }
  if (!image) return notFound();

  // Never cached for longer than the signed URL it points to stays valid.
  const cacheSeconds = Math.max(0, Math.min(30 * 60, Math.floor((image.expiresAt - Date.now()) / 1000) - 5 * 60));
  return NextResponse.redirect(image.url, {
    status: 302,
    headers: {
      'Cache-Control': cacheSeconds > 0 ? `private, max-age=${cacheSeconds}` : 'private, no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
