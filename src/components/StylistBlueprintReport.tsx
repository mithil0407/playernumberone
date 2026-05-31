'use client';

import type {
  BlueprintBlock,
  BlueprintPage,
  LegacyStylistBlueprintReportData,
  StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';
import type { ResolvedStylistBlueprintImageUrls } from '@/lib/stylistBlueprintImageGenerator';

const SLATE = '#94a6ad';
const SLATE_LIGHT = '#A0B2B9';
const IVORY = '#F5F0E8';
const INK = '#1B1815';
const MUTED = 'rgba(245,240,232,0.72)';
const GLASS = 'rgba(255, 255, 255, 0.08)';
const BORDER = 'rgba(255, 255, 255, 0.15)';

const GLASS_PAGES = new Set([2, 10, 11, 26, 27]);

function isVersionedStylistBlueprintReportData(data: unknown): data is StylistBlueprintReportData {
  return Boolean(data && typeof data === 'object' && 'version' in data && (data as { version?: string }).version === 'women_blueprint_28_v1');
}

function imageForPage(page: BlueprintPage, imageUrls?: ResolvedStylistBlueprintImageUrls | null) {
  const images = imageUrls;
  switch (page.page_number) {
    case 1: return images?.cover?.portrait ?? null;
    case 4: return images?.diagnosis?.silhouetteFront ?? null;
    case 5: return images?.diagnosis?.undertoneMap ?? null;
    case 6: return images?.diagnosis?.faceShapeDiagram ?? null;
    case 7: return images?.diagnosis?.combinedAxes ?? null;
    case 8: return images?.diagnosis?.avoidanceGrid ?? null;
    case 9: return images?.prescription?.basePalette ?? null;
    case 10: return images?.prescription?.necklineGrid ?? null;
    case 11: return images?.prescription?.hairDirections ?? null;
    case 12: return images?.prescription?.approvedFabrics ?? null;
    case 13: return images?.closing?.combinationMatrix ?? null;
    case 26: return images?.closing?.combinationMatrix ?? null;
    case 28: return images?.closing?.editTeaser ?? null;
    default:
      if (page.page_number >= 14 && page.page_number <= 25) {
        return images?.application?.outfitFlatlays?.[page.page_number - 14] ?? null;
      }
      return null;
  }
}

function secondaryImageForPage(page: BlueprintPage, imageUrls?: ResolvedStylistBlueprintImageUrls | null) {
  if (page.page_number >= 14 && page.page_number <= 25) {
    return imageUrls?.application?.outfitDetails?.[page.page_number - 14] ?? null;
  }
  if (page.page_number === 4) return imageUrls?.diagnosis?.silhouetteSide ?? null;
  if (page.page_number === 5) return imageUrls?.diagnosis?.depthContrastMatrix ?? null;
  if (page.page_number === 6) return imageUrls?.diagnosis?.necklinePreview ?? null;
  if (page.page_number === 7) return imageUrls?.diagnosis?.focalHeatmap ?? null;
  if (page.page_number === 9) return imageUrls?.prescription?.accentPalette ?? null;
  if (page.page_number === 10) return imageUrls?.prescription?.sleeveWaistGrid ?? null;
  if (page.page_number === 11) return imageUrls?.prescription?.eyewearFrames ?? null;
  if (page.page_number === 12) return imageUrls?.prescription?.avoidedFabrics ?? null;
  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function itemText(item: unknown) {
  if (typeof item === 'string') return item;
  if (!isObject(item)) return String(item ?? '');
  return [
    item.label,
    item.name,
    item.piece,
    item.question,
    item.rule,
    item.heading,
    item.body,
    item.reason ? `Why: ${item.reason}` : null,
    item.appears_in ? `Appears in: ${Array.isArray(item.appears_in) ? item.appears_in.join(', ') : item.appears_in}` : null,
  ].filter(Boolean).join(' - ');
}

function Block({ block, glass }: { block: BlueprintBlock; glass: boolean }) {
  const body = block.body || block.reason;
  const items = block.items ?? [];
  return (
    <div className={glass ? 'blueprint-glass-card' : 'blueprint-block'}>
      {block.label && <p className="blueprint-label">{block.label}</p>}
      {block.heading && <h3>{block.heading}</h3>}
      {block.body && <p>{block.body}</p>}
      {block.reason && block.reason !== body && <p className="blueprint-reason">{block.reason}</p>}
      {items.length > 0 && (
        <ul>
          {items.map((item, index) => <li key={index}>{itemText(item)}</li>)}
        </ul>
      )}
    </div>
  );
}

function PalettePage({ data }: { data: StylistBlueprintReportData }) {
  const colours = [...data.classification.colour.base_palette, ...data.classification.colour.accent_palette];
  return (
    <div className="palette-grid">
      {colours.map((colour, index) => (
        <div className="palette-swatch" key={`${colour.hex}-${index}`}>
          <div style={{ background: colour.hex }} />
          <p>{colour.name}</p>
          <span>{colour.hex}</span>
          <small>{colour.usage}{colour.avoid_for ? ` Avoid for: ${colour.avoid_for}` : ''}</small>
        </div>
      ))}
    </div>
  );
}

function BlueprintPageView({
  page,
  data,
  imageUrls,
}: {
  page: BlueprintPage;
  data: StylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
}) {
  const glass = GLASS_PAGES.has(page.page_number);
  const image = imageForPage(page, imageUrls);
  const secondaryImage = secondaryImageForPage(page, imageUrls);
  const isCover = page.page_number === 1;
  const isOutfit = page.page_type === 'outfit';
  const sectionClass = glass ? 'blueprint-page glass-page' : `blueprint-page flat-page ${isOutfit ? 'outfit-page' : ''}`;

  return (
    <section className={sectionClass}>
      <div className="page-number">{String(page.page_number).padStart(2, '0')}</div>
      {isCover ? (
        <div className="cover-layout">
          <p className="wordmark">ICONIK</p>
          {image && <img src={image} alt="" className="cover-portrait" />}
          <div className="cover-title">
            <h1>{data.client.display_name}</h1>
            <p>Personal Blueprint · {data.client.month_year}</p>
          </div>
          <p className="cover-line">Same body. Different science.</p>
        </div>
      ) : (
        <div className="page-inner">
          <header className="page-header">
            <p className="eyebrow">{page.page_type.replace(/_/g, ' ')}</p>
            <h2>{page.title}</h2>
            {page.subtitle && <p className="subtitle">{page.subtitle}</p>}
          </header>

          {(image || secondaryImage) && (
            <div className={secondaryImage ? 'image-pair' : 'image-single'}>
              {image && <img src={image} alt="" />}
              {secondaryImage && <img src={secondaryImage} alt="" />}
            </div>
          )}

          {page.page_type === 'summary' && (
            <div className="dossier">
              <div><span>Silhouette Profile</span><strong>{data.analysis.silhouette_profile}</strong></div>
              <div><span>Chromatic Family</span><strong>{data.analysis.chromatic_family}</strong></div>
              <div><span>Facial Architecture</span><strong>{data.analysis.facial_architecture}</strong></div>
              <div><span>Style Direction</span><strong>{data.analysis.style_direction}</strong></div>
              <div><span>Proportional Focus</span><strong>{data.analysis.proportional_focus.join(', ')}</strong></div>
            </div>
          )}

          {page.page_type === 'palette' && <PalettePage data={data} />}

          <div className={glass ? 'blocks glass-blocks' : 'blocks'}>
            {page.blocks.map((block, index) => <Block key={index} block={block} glass={glass} />)}
          </div>
        </div>
      )}
    </section>
  );
}

function LegacyReport({
  data,
  imageUrls,
}: {
  data: LegacyStylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
}) {
  const sections = Object.entries(data.sections ?? {});
  return (
    <article className="legacy-blueprint">
      <section className="blueprint-page flat-page">
        <div className="page-inner">
          <p className="eyebrow">ICONIK BLUEPRINT</p>
          <h2>{data.classification.client.name || 'Your'} Style Blueprint</h2>
          <p className="subtitle">{data.classification.taste.style_archetype} · {data.classification.colour.palette_name}</p>
          {imageUrls?.bodyGeometryCard && <img src={imageUrls.bodyGeometryCard} alt="" className="legacy-image" />}
        </div>
      </section>
      {sections.map(([key, text], index) => (
        <section key={key} className="blueprint-page flat-page">
          <div className="page-inner">
            <p className="eyebrow">{String(index + 1).padStart(2, '0')}</p>
            <h2>{key.replace(/^s\d_/, '').replace(/_/g, ' ')}</h2>
            <p className="legacy-text">{text}</p>
          </div>
        </section>
      ))}
    </article>
  );
}

export default function StylistBlueprintReport({
  data,
  imageUrls,
}: {
  data: StylistBlueprintReportData | LegacyStylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
}) {
  if (!isVersionedStylistBlueprintReportData(data)) {
    return <LegacyReport data={data} imageUrls={imageUrls} />;
  }

  return (
    <article className="blueprint-report">
      {data.pages.sort((a, b) => a.page_number - b.page_number).map(page => (
        <BlueprintPageView key={page.page_number} page={page} data={data} imageUrls={imageUrls} />
      ))}

      <style jsx global>{`
        .blueprint-report, .legacy-blueprint {
          background: ${INK};
          color: ${IVORY};
          font-family: Arial, Helvetica, sans-serif;
        }
        .blueprint-page {
          position: relative;
          min-height: 100vh;
          padding: 56px 24px;
          overflow: hidden;
          page-break-after: always;
        }
        .flat-page {
          background: ${SLATE};
        }
        .glass-page {
          background:
            radial-gradient(circle at 64% 32%, rgba(245,240,232,0.15), transparent 28%),
            radial-gradient(circle at 50% 50%, ${SLATE_LIGHT} 0%, ${SLATE} 72%);
        }
        .page-number {
          position: absolute;
          top: 28px;
          right: 32px;
          color: rgba(245,240,232,0.42);
          font-size: 11px;
          letter-spacing: 0.24em;
        }
        .page-inner {
          max-width: 1120px;
          margin: 0 auto;
        }
        .page-header {
          max-width: 820px;
          margin-bottom: 32px;
        }
        .eyebrow, .blueprint-label {
          color: rgba(245,240,232,0.62);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .page-header h2, .cover-title h1, .legacy-blueprint h2 {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 400;
          letter-spacing: 0;
          color: ${IVORY};
        }
        .page-header h2 {
          font-size: clamp(2.5rem, 7vw, 5.8rem);
          line-height: 0.96;
          margin: 0;
          max-width: 900px;
        }
        .subtitle {
          color: ${MUTED};
          line-height: 1.7;
          margin-top: 18px;
          max-width: 720px;
        }
        .image-single, .image-pair {
          display: grid;
          gap: 18px;
          margin: 28px 0 34px;
        }
        .image-pair {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .image-single img, .image-pair img {
          width: 100%;
          max-height: 560px;
          object-fit: cover;
          border: 1px solid rgba(245,240,232,0.18);
          background: ${SLATE};
        }
        .blocks {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
        }
        .blueprint-block {
          border-top: 1px solid rgba(245,240,232,0.22);
          padding-top: 18px;
        }
        .blueprint-block h3, .blueprint-glass-card h3 {
          font-size: 19px;
          margin: 0 0 10px;
          color: ${IVORY};
        }
        .blueprint-block p, .blueprint-glass-card p, .blueprint-block li, .blueprint-glass-card li {
          color: ${MUTED};
          line-height: 1.72;
          font-size: 15px;
        }
        .blueprint-block ul, .blueprint-glass-card ul {
          padding-left: 18px;
          margin: 12px 0 0;
        }
        .blueprint-reason {
          color: rgba(245,240,232,0.88) !important;
        }
        .blueprint-glass-card {
          background: ${GLASS};
          backdrop-filter: blur(20px);
          border: 1px solid ${BORDER};
          border-radius: 16px;
          padding: 24px 28px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }
        .cover-layout {
          min-height: calc(100vh - 112px);
          display: grid;
          grid-template-rows: auto 1fr auto;
          align-items: center;
          max-width: 980px;
          margin: 0 auto;
          text-align: center;
        }
        .wordmark {
          align-self: start;
          letter-spacing: 0.42em;
          font-size: 13px;
          font-weight: 700;
        }
        .cover-portrait {
          width: min(420px, 82vw);
          aspect-ratio: 4 / 5;
          object-fit: cover;
          margin: 0 auto 28px;
          opacity: .92;
          border: 1px solid rgba(245,240,232,.18);
        }
        .cover-title h1 {
          font-size: clamp(3rem, 9vw, 7rem);
          line-height: 0.95;
          margin: 0 0 18px;
        }
        .cover-title p, .cover-line {
          color: ${MUTED};
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 12px;
        }
        .dossier {
          display: grid;
          gap: 12px;
          margin-bottom: 28px;
        }
        .dossier div {
          display: grid;
          grid-template-columns: minmax(180px, 260px) 1fr;
          gap: 20px;
          padding: 18px 0;
          border-bottom: 1px solid rgba(245,240,232,.22);
        }
        .dossier span {
          color: rgba(245,240,232,.52);
          text-transform: uppercase;
          letter-spacing: .2em;
          font-size: 11px;
          font-weight: 700;
        }
        .dossier strong {
          color: ${IVORY};
          font-size: 18px;
          font-weight: 500;
        }
        .palette-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 14px;
          margin: 24px 0 34px;
        }
        .palette-swatch {
          border: 1px solid rgba(245,240,232,.18);
          padding: 10px;
          background: rgba(0,0,0,.08);
        }
        .palette-swatch div {
          height: 96px;
          margin-bottom: 12px;
        }
        .palette-swatch p {
          margin: 0;
          color: ${IVORY};
          font-weight: 700;
        }
        .palette-swatch span, .palette-swatch small {
          display: block;
          color: ${MUTED};
          margin-top: 4px;
          line-height: 1.5;
        }
        .legacy-image {
          width: 100%;
          max-width: 420px;
          margin-top: 32px;
        }
        .legacy-text {
          white-space: pre-wrap;
          color: ${MUTED};
          line-height: 1.8;
          max-width: 820px;
        }
        @media (max-width: 720px) {
          .blueprint-page {
            padding: 44px 18px;
          }
          .image-pair {
            grid-template-columns: 1fr;
          }
          .dossier div {
            grid-template-columns: 1fr;
            gap: 6px;
          }
          .blocks {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </article>
  );
}
