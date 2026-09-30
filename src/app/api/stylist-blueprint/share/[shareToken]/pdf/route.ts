import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPublicStylistBlueprintByShareToken } from '@/lib/stylistBlueprintLoader';
import { isVersionedStylistBlueprintReportData } from '@/lib/stylistBlueprintSchema';
import { renderReportPdf } from '@/lib/reportPdf';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * The client's report as a PDF, rendered on the server so it comes out the
 * same on every device (see src/lib/reportPdf.ts). A PDF is rendered once per
 * version of the published report and kept in storage; later downloads are a
 * signed link to that file.
 *
 * GET redirects to the file, so the link itself works anywhere. `?format=json`
 * returns `{ url }` instead, which the report's button uses to show progress
 * while a first render runs.
 */
const BUCKET = 'stylist-blueprint-images';
// Bump when the PDF output changes (renderer, print CSS) so stored PDFs are made again.
const PDF_RENDER_VERSION = 1;
const SIGNED_URL_SECONDS = 10 * 60;

const inFlight = new Map<string, Promise<void>>();

function pdfFolder(reportId: string) {
  return `${reportId}/pdf`;
}

function fileName(clientName: string) {
  const safe = clientName.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, ' ');
  return `${safe ? `${safe} ` : ''}ICONIK Blueprint.pdf`;
}

async function signedPdfUrl(path: string, download: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS, { download });
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
  const report = await getPublicStylistBlueprintByShareToken(shareToken);
  if (!report?.report_data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  }

  // Keyed on exactly what the client page renders, so a republished report gets a fresh PDF.
  const version = createHash('sha256')
    .update(JSON.stringify({ v: PDF_RENDER_VERSION, data: report.report_data, images: report.image_urls }))
    .digest('hex')
    .slice(0, 24);
  const path = `${pdfFolder(report.id)}/${version}.pdf`;
  const clientName = isVersionedStylistBlueprintReportData(report.report_data) ? report.report_data.client.display_name : '';
  const download = fileName(clientName);

  let url = await signedPdfUrl(path, download);
  if (!url) {
    let render = inFlight.get(path);
    if (!render) {
      const reportUrl = `${request.nextUrl.origin}/stylist/report/${encodeURIComponent(shareToken)}`;
      render = renderAndStore(reportUrl, report.id, path).finally(() => inFlight.delete(path));
      inFlight.set(path, render);
    }
    try {
      await render;
    } catch (error) {
      console.error('[stylist-blueprint-pdf] render failed', { reportId: report.id, error: error instanceof Error ? error.message : error });
      return NextResponse.json({ error: 'The PDF could not be prepared. Please try again.' }, { status: 502, headers: { 'Cache-Control': 'private, no-store' } });
    }
    url = await signedPdfUrl(path, download);
  }
  if (!url) {
    return NextResponse.json({ error: 'The PDF could not be prepared. Please try again.' }, { status: 502, headers: { 'Cache-Control': 'private, no-store' } });
  }

  const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
  if (request.nextUrl.searchParams.get('format') === 'json') return NextResponse.json({ url }, { headers });
  return NextResponse.redirect(url, { status: 302, headers });
}
