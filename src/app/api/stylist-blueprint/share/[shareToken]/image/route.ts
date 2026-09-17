import { NextRequest, NextResponse } from 'next/server';
import { getStylistBlueprintClientImageSource } from '@/lib/stylistBlueprintLoader';
import { isStylistBlueprintImagePath, signStylistBlueprintImagePath } from '@/lib/stylistBlueprintImageGenerator';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';

/**
 * A report image behind a stable link. The client page only ever holds these
 * links, and each one signs a fresh storage URL when it is loaded, so images
 * keep working however long ago the page was cached or opened.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;
  const path = request.nextUrl.searchParams.get('p') ?? '';
  const notFound = () => new NextResponse(null, { status: 404 });

  const source = await getStylistBlueprintClientImageSource(shareToken);
  // Only paths this report actually references can be signed.
  if (!source || !isStylistBlueprintImagePath(source.imagePaths, path)) return notFound();
  // Before publishing, only the report's stylist or an admin (client preview) may load images.
  if (!source.live && !(await canAccessBlueprintReport(source.reportId))) return notFound();

  try {
    return NextResponse.redirect(await signStylistBlueprintImagePath(path), { status: 302, headers: { 'Referrer-Policy': 'no-referrer' } });
  } catch {
    return notFound();
  }
}
