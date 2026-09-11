// TEMPORARY design preview of the client-facing share page.
// Renders the real report for 4ec6da7f with the redesigned styles, without
// publishing the live record. Delete this folder before committing:
//   rm -rf src/app/blueprint-preview
import StylistBlueprintReport from '@/components/StylistBlueprintReport';
import { resolveStylistBlueprintImageUrls } from '@/lib/stylistBlueprintImageGenerator';
import type { StylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';
import fixture from './data.json';
import { notFound } from 'next/navigation';
import { isAdminCookieAuthenticated } from '@/lib/stylistWorkspaceAuth';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function BlueprintPreview({
  searchParams,
}: { searchParams: Promise<{ copy?: string; noimg?: string }> }) {
  if (process.env.NODE_ENV === 'production' || !(await isAdminCookieAuthenticated())) notFound();
  const { copy, noimg } = await searchParams;
  // ?copy=saved shows the text that is in the database today; the default shows
  // the copy the Replace All Outfits button would produce.
  const data = (copy === 'saved' ? fixture.saved : fixture.regenerated) as unknown as StylistBlueprintReportData;
  const imageUrls = noimg ? null : await resolveStylistBlueprintImageUrls(fixture.image_paths as never);

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
        body { overscroll-behavior-y: none; background: #2C2622; }
        * { -webkit-tap-highlight-color: transparent; }
        .blueprint-progress {
          position: fixed; inset: 0 0 auto 0; height: 2px; z-index: 40;
          background: linear-gradient(90deg, #C9A96E, #E4D5BC);
          transform-origin: 0 50%;
          animation: blueprint-read linear both;
          animation-timeline: scroll(root block);
        }
        @supports not (animation-timeline: scroll(root block)) { .blueprint-progress { display: none; } }
        @keyframes blueprint-read { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      `}</style>
      <div className="blueprint-progress" aria-hidden="true" />
      <div className="iconik-theme min-h-screen min-h-dvh" style={{ background: '#2C2622' }}>
        <StylistBlueprintReport data={data} imageUrls={imageUrls} deferPages />
        <div className="px-5 md:px-12 py-10 text-center" style={{ background: '#2C2622', color: '#F4EFE5' }}>
          <p className="iconik-micro" style={{ opacity: 0.5 }}>ICONIK</p>
          <p className="iconik-micro" style={{ opacity: 0.32, marginTop: 10 }}>Prepared privately for you · For your eyes only</p>
        </div>
      </div>
    </>
  );
}
