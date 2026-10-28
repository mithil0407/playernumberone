import { NextRequest, NextResponse } from 'next/server';
import { getStylistWorkspaceIdentity, getWorkspaceStylistBySlug, isAdminCookieAuthenticated } from '@/lib/stylistWorkspaceAuth';
import { loadOutfitReviewDeck, saveOutfitVerdict } from '@/lib/stylistOutfitLibraryCuration';

const noStore = { 'Cache-Control': 'private, no-store' };

/** The signed-in stylist, or the stylist an admin is previewing. */
async function reviewer(request: NextRequest) {
  const previewSlug = request.nextUrl.searchParams.get('stylistSlug');
  if (previewSlug && await isAdminCookieAuthenticated()) {
    const stylist = await getWorkspaceStylistBySlug(previewSlug);
    return stylist ? { stylistId: stylist.id, slug: stylist.slug, adminPreview: true } : null;
  }
  const identity = await getStylistWorkspaceIdentity();
  return identity ? { stylistId: identity.stylistId, slug: identity.slug, adminPreview: false } : null;
}

export async function GET(request: NextRequest) {
  const who = await reviewer(request);
  if (!who) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const deck = await loadOutfitReviewDeck(who);
    return NextResponse.json({ ...deck, adminPreview: who.adminPreview }, { headers: noStore });
  } catch (error) {
    console.error('[outfit-review] deck failed', error);
    return NextResponse.json({ error: 'Could not load the outfits. Please retry.' }, { status: 500, headers: noStore });
  }
}

export async function POST(request: NextRequest) {
  const who = await reviewer(request);
  if (!who) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // An admin preview looks; only the stylist herself swipes.
  if (who.adminPreview) return NextResponse.json({ error: 'Admin preview is read-only.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { lookId?: unknown; verdict?: unknown } | null;
  const lookId = typeof body?.lookId === 'string' ? body.lookId : '';
  const verdict = body?.verdict === 'like' || body?.verdict === 'dislike' ? body.verdict : body?.verdict === null ? null : undefined;
  if (!/^(pinterest|ethnic-office)-[0-9]+[a-z]?$/.test(lookId) || verdict === undefined) {
    return NextResponse.json({ error: 'Choose a look and like or pass.' }, { status: 400 });
  }
  try {
    await saveOutfitVerdict(who.stylistId, lookId, verdict);
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    console.error('[outfit-review] save failed', error);
    return NextResponse.json({ error: 'Could not save that swipe. Check your connection and try again.' }, { status: 500, headers: noStore });
  }
}
