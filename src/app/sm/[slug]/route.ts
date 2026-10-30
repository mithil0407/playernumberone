import { NextRequest, NextResponse } from 'next/server';

// Short links for Instagram: iconik.pro/sm/<reel-id> goes to the quiz tagged
// with that reel (utm_content=reel_<id>), so every reel's comment-keyword DM
// link can be traced to quiz starts, leads and members. /sm/bio is the
// price-first sales page for the bio link.

export function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return params.then(({ slug }) => {
    const id = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'unknown';
    const bio = id === 'bio';
    const target = new URL(bio ? '/style-membership/join' : '/style-membership', request.nextUrl.origin);
    target.searchParams.set('utm_source', 'instagram');
    target.searchParams.set('utm_medium', bio ? 'bio' : 'reel_dm');
    target.searchParams.set('utm_campaign', 'style_membership');
    target.searchParams.set('utm_content', bio ? 'bio' : `reel_${id}`);
    return NextResponse.redirect(target, 307);
  });
}
