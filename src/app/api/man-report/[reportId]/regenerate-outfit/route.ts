import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import {
  regenerateSingleOutfitImage,
  resolveManReportImageUrls,
  type ManReportImagePaths,
} from '@/lib/manImageGenerator';

// Replace the outfit block for `outfitNumber` in the full s4_outfits string.
function replaceOutfitBlock(s4Text: string, outfitNumber: number, newBlock: string): string {
  const blocks = s4Text.split(/(?=\*\*Outfit\s+\d+)/i);
  const idx = blocks.findIndex(b =>
    new RegExp(`^\\*\\*Outfit\\s+${outfitNumber}\\s*[—–-]`).test(b.trim())
  );
  if (idx === -1) return s4Text;
  blocks[idx] = newBlock.trimEnd() + '\n\n';
  return blocks.join('');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json();
  const { outfitNumber, outfitText, imageModel } = body as {
    outfitNumber: number;
    outfitText: string;
    imageModel?: string;
  };

  if (!outfitNumber || !outfitText) {
    return NextResponse.json({ error: 'outfitNumber and outfitText are required' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data, image_urls')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const imagePaths = report.image_urls as ManReportImagePaths | null;
  if (!imagePaths?.baseModel) {
    return NextResponse.json({ error: 'No base model image found — generate images first' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classification = (report.report_data as any)?.classification;
  if (!classification) {
    return NextResponse.json({ error: 'No classification data found' }, { status: 400 });
  }

  const newPath = await regenerateSingleOutfitImage(
    reportId,
    outfitNumber,
    outfitText,
    imagePaths.baseModel,
    classification,
    imageModel ?? 'gemini-3.1-flash-image-preview',
  );

  // Patch outfitCards array (preserve all other slots)
  const currentCards = imagePaths.outfitCards ?? new Array(16).fill(null);
  const newCards = [...currentCards];
  newCards[outfitNumber - 1] = newPath;
  const newImagePaths: ManReportImagePaths = { baseModel: imagePaths.baseModel, outfitCards: newCards };

  // Patch s4_outfits text (replace just this outfit block)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentS4 = (report.report_data as any)?.sections?.s4_outfits ?? '';
  const newS4 = replaceOutfitBlock(currentS4, outfitNumber, outfitText);

  await supabaseAdmin
    .from('man_reports')
    .update({
      image_urls:  newImagePaths,
      report_data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(report.report_data as any),
        sections: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(report.report_data as any)?.sections,
          s4_outfits: newS4,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  const resolved = await resolveManReportImageUrls(newImagePaths);
  const imageUrl = resolved?.outfitCards?.[outfitNumber - 1] ?? null;

  return NextResponse.json({ imageUrl, storagePath: newPath });
}
