import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPublicManReportByShareToken } from '@/lib/manReportLoader';
import { renderReportPdf } from '@/lib/reportPdf';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * The client's Blueprint as a PDF, rendered on the server so it comes out the
 * same on every device (see src/lib/reportPdf.ts). Phone browsers cannot print
 * the report properly, and in-app browsers (WhatsApp, Instagram) cannot print
 * at all. A PDF is rendered once per version of the published report and kept
 * in storage; later downloads are a signed link to that file.
 *
 * GET redirects to the file, so the link itself works anywhere. `?format=json`
 * returns `{ url }` instead, which the report's button uses to show progress
 * while a first render runs.
 */
const BUCKET = 'man-report-images';
// Bump when the PDF output changes (renderer, print CSS) so stored PDFs are made again.
const PDF_RENDER_VERSION = 1;
const SIGNED_URL_SECONDS = 10 * 60;
const FILE_NAME = 'ICONIK Blueprint.pdf';

const inFlight = new Map<string, Promise<void>>();

function pdfFolder(reportId: string) {
  return `${reportId}/pdf`;
}

async function signedPdfUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS, { download: FILE_NAME });
  return error || !data?.signedUrl ? null : data.signedUrl;
}

async function renderAndStore(reportUrl: string, reportId: string, path: string) {
  const pdf = await renderReportPdf(reportUrl);
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, pdf, {
    contentType: 'application/pdf', upsert: true, cacheControl: '31536000',
  });
  if (error) throw new Error(`PDF upload failed: ${error.message}`);
  // Earlier versions of this report's PDF are never served again.
  const folder = pdfFolder(reportId);
  const { data: existing } = await supabaseAdmin.storage.from(BUCKET).list(folder);
  const stale = (existing ?? []).map(file => `${folder}/${file.name}`).filter(other => other !== path);
  if (stale.length) await supabaseAdmin.storage.from(BUCKET).remove(stale);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;
  const report = await getPublicManReportByShareToken(shareToken);
  const failure = (error: string, status: number) =>
    NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'private, no-store' } });
  if (!report?.report_data) return failure('Report not found', 404);

  // Keyed on exactly what the client page renders, so a republished report gets a
  // fresh PDF. The loader's image URLs are signed and change on every load, so the
  // key uses the stored image paths instead.
  const { data: stored } = await supabaseAdmin.from('man_reports').select('image_urls').eq('id', report.id).single();
  const version = createHash('sha256')
    .update(JSON.stringify({ v: PDF_RENDER_VERSION, data: report.report_data, images: stored?.image_urls ?? null, shopping: report.shopping_data }))
    .digest('hex')
    .slice(0, 24);
  const path = `${pdfFolder(report.id)}/${version}.pdf`;

  let url = await signedPdfUrl(path);
  if (!url) {
    let render = inFlight.get(path);
    if (!render) {
      // opening=skip: the renderer must land on the report, not the opening sequence.
      const reportUrl = `${request.nextUrl.origin}/man/report/${encodeURIComponent(shareToken)}?opening=skip`;
      render = renderAndStore(reportUrl, report.id, path).finally(() => inFlight.delete(path));
      inFlight.set(path, render);
    }
    try {
      await render;
    } catch (error) {
      console.error('[man-report-pdf] render failed', { reportId: report.id, error: error instanceof Error ? error.message : error });
      return failure('The PDF could not be prepared. Please try again.', 502);
    }
    url = await signedPdfUrl(path);
  }
  if (!url) return failure('The PDF could not be prepared. Please try again.', 502);

  const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
  if (request.nextUrl.searchParams.get('format') === 'json') return NextResponse.json({ url }, { headers });
  return NextResponse.redirect(url, { status: 302, headers });
}
