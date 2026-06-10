'use client';

import type {
  BlueprintBlock,
  BlueprintColourUse,
  BlueprintPage,
  LegacyStylistBlueprintReportData,
  StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';
import {
  getStylistBlueprintAuditPage,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintMatrixPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPageCount,
  isVersionedStylistBlueprintReportData as isVersionedStylistBlueprintReportDataShared,
} from '@/lib/stylistBlueprintSchema';
import type { ResolvedStylistBlueprintImageUrls, StylistBlueprintImageSlotKey } from '@/lib/stylistBlueprintImageGenerator';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { createContext, type ElementType, type FocusEvent, type ReactNode, useContext } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

const SLATE = '#94A6AD';
const SLATE_LIGHT = '#A0B2B9';
const SLATE_DEEP = '#7E9098';
const IVORY = '#F4EFE5';
const BONE = '#EDE5D2';
const PAPER = '#F8F3E9';
const INK = '#2C2622';
const ROSE = '#D4537E';

function isVersionedStylistBlueprintReportData(data: unknown): data is StylistBlueprintReportData {
  return isVersionedStylistBlueprintReportDataShared(data);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function asItems(block?: BlueprintBlock) {
  return Array.isArray(block?.items) ? block.items : [];
}

type EditableReportContextValue = {
  editable: boolean;
  onPageChange?: (page: BlueprintPage) => void;
  onReportDataChange?: (data: StylistBlueprintReportData) => void;
  onImageRegenerate?: (slotKey: StylistBlueprintImageSlotKey) => void | Promise<void>;
  regeneratingImageSlot?: StylistBlueprintImageSlotKey | null;
  imageRegenerationDisabled?: boolean;
  reportData?: StylistBlueprintReportData;
};

const EditableReportContext = createContext<EditableReportContextValue>({ editable: false });

function EditableText({
  as,
  className,
  value,
  fallback = '',
  page,
  update,
  children,
}: {
  as?: ElementType;
  className?: string;
  value: string | undefined;
  fallback?: string;
  page: BlueprintPage;
  update: (value: string) => BlueprintPage;
  children?: ReactNode;
}) {
  const { editable, onPageChange } = useContext(EditableReportContext);
  const Component = as ?? 'span';
  if (!editable) return <Component className={className}>{children ?? value ?? fallback}</Component>;
  return (
    <Component
      className={className}
      contentEditable
      data-page-number={page.page_number}
      suppressContentEditableWarning
      onBlur={(event: FocusEvent<HTMLElement>) => {
        const nextValue = event.currentTarget.innerText.trim();
        if (nextValue !== (value ?? fallback)) onPageChange?.(update(nextValue));
      }}
      style={{ outline: 'none' }}
    >
      {children ?? value ?? fallback}
    </Component>
  );
}

function updateBlock(page: BlueprintPage, index: number, patch: Partial<BlueprintBlock>) {
  return {
    ...page,
    blocks: page.blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...patch } : block),
  };
}

function ImageSlotFrame({
  slotKey,
  className = '',
  label,
  children,
}: {
  slotKey: StylistBlueprintImageSlotKey;
  className?: string;
  label: string;
  children: ReactNode;
}) {
  const { onImageRegenerate, regeneratingImageSlot, imageRegenerationDisabled } = useContext(EditableReportContext);
  const canRegenerate = Boolean(onImageRegenerate);
  const isRegenerating = regeneratingImageSlot === slotKey;
  const disabled = Boolean(imageRegenerationDisabled || (regeneratingImageSlot && !isRegenerating));

  return (
    <div className={`image-slot-frame ${className}`}>
      {children}
      {canRegenerate && (
        <button
          type="button"
          className="image-regenerate-button"
          aria-label={`Regenerate ${label}`}
          title={`Regenerate ${label}`}
          disabled={disabled}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            void onImageRegenerate?.(slotKey);
          }}
        >
          {isRegenerating ? <Loader2 size={14} className="spin-icon" /> : <RefreshCw size={14} />}
        </button>
      )}
    </div>
  );
}

function ReportImage({
  src,
  className,
  priority = false,
}: {
  src: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      className={className}
      src={src}
      alt=""
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  );
}

function getField(item: unknown, keys: string[], fallback = '') {
  if (typeof item === 'string') return item;
  if (!isObject(item)) return fallback;
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value) && value.length) return value.map(String).join(', ');
    if (isObject(value)) return objectSummary(value);
  }
  return fallback;
}

function isHex(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function allReportColours(data: StylistBlueprintReportData): BlueprintColourUse[] {
  return [
    ...data.classification.colour.base_palette.map(colour => ({ name: colour.name, hex: colour.hex, role: 'support' as const })),
    ...data.classification.colour.accent_palette.map(colour => ({ name: colour.name, hex: colour.hex, role: 'accent' as const })),
  ].filter(colour => isHex(colour.hex));
}

const COMMON_COLOURS: Array<{ name: string; hex: string; role: BlueprintColourUse['role']; terms: string[] }> = [
  { name: 'Black', hex: '#111111', role: 'ground', terms: ['black'] },
  { name: 'White', hex: '#F7F4EE', role: 'support', terms: ['white', 'ivory', 'cream'] },
  { name: 'Navy', hex: '#1F2A36', role: 'ground', terms: ['navy'] },
  { name: 'Denim Blue', hex: '#355C7D', role: 'support', terms: ['denim', 'blue jean', 'indigo'] },
  { name: 'Brown', hex: '#5B3A29', role: 'ground', terms: ['brown', 'chocolate', 'cocoa'] },
  { name: 'Tan', hex: '#B08968', role: 'support', terms: ['tan', 'camel'] },
  { name: 'Grey', hex: '#7D807A', role: 'support', terms: ['grey', 'gray'] },
  { name: 'Red', hex: '#8F1D2C', role: 'accent', terms: ['red', 'burgundy', 'maroon'] },
  { name: 'Pink', hex: '#C9829A', role: 'accent', terms: ['pink', 'blush', 'fuchsia'] },
  { name: 'Mustard', hex: '#C5962D', role: 'accent', terms: ['mustard', 'yellow'] },
];

function inferColourFromText(text: string, data: StylistBlueprintReportData): BlueprintColourUse | null {
  const lower = text.toLowerCase();
  const hexMatch = text.match(/#[0-9a-f]{6}/i);
  if (hexMatch) return { name: hexMatch[0].toUpperCase(), hex: hexMatch[0].toUpperCase(), role: 'support' };

  const paletteMatch = allReportColours(data).find(colour => lower.includes(colour.name.toLowerCase()));
  if (paletteMatch) return paletteMatch;

  const common = COMMON_COLOURS.find(colour => colour.terms.some(term => lower.includes(term)));
  return common ? { name: common.name, hex: common.hex, role: common.role } : null;
}

function objectSummary(item: unknown): string {
  if (typeof item === 'string') return item;
  if (!isObject(item)) return String(item ?? '');
  return Object.entries(item)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${Array.isArray(value) ? value.join(', ') : isObject(value) ? objectSummary(value) : value}`)
    .join(' - ');
}

const OUTFIT_SLOT_KEYS = [
  'top',
  'bottom',
  'bottoms',
  'dress',
  'outerwear',
  'layer',
  'footwear',
  'shoes',
  'bag',
  'jewellery',
  'jewelry',
  'accessory',
  'accessories',
] as const;

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function normaliseFormulaItems(page: BlueprintPage): unknown[] {
  const formulaBlock = page.blocks.find(block => /formula|piece|look|outfit/i.test(`${block.label} ${block.heading}`))
    || page.blocks.find(block => asItems(block).length >= 3);
  const rawItems = asItems(formulaBlock);
  const objectItem = rawItems.length === 1 && isObject(rawItems[0]) ? rawItems[0] : null;
  const slotSource = objectItem && OUTFIT_SLOT_KEYS.some(key => objectItem[key] !== undefined)
    ? objectItem
    : null;

  if (slotSource) {
    return OUTFIT_SLOT_KEYS
      .map(key => {
        const value = slotSource[key];
        if (value === null || value === undefined || value === '') return null;
        return {
          slot: titleCase(key),
          piece: typeof value === 'string' ? value : objectSummary(value),
          structural_notes: getField(value, ['structural_notes', 'notes', 'reason', 'body'], ''),
        };
      })
      .filter(Boolean) as unknown[];
  }

  if (rawItems.length) return rawItems.slice(0, 8);

  return page.blocks
    .filter(block => block.heading || block.label || block.body || block.reason)
    .slice(0, 8);
}

function splitDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] || 'Your', rest: 'Blueprint' };
  return { first: parts.slice(0, -1).join(' '), rest: parts.at(-1) || '' };
}

function pageClass(pageNumber: number, pageType: BlueprintPage['page_type']) {
  if (pageNumber === 1 || pageType === 'continuation' || pageType === 'matrix') return 'slate';
  if ([4, 7, 8].includes(pageNumber)) return 'slate';
  if ([5, 6].includes(pageNumber)) return 'slate-deep';
  if (pageType === 'outfit') return 'bone';
  if ([2, 3, 9, 10, 11, 12, 13].includes(pageNumber) || pageType === 'audit') return 'ivory';
  return 'ivory';
}

function canonicalPageType(page: BlueprintPage, data?: StylistBlueprintReportData): BlueprintPage['page_type'] {
  return data ? getCanonicalTypeForData(page, data) : page.page_type;
}

function getCanonicalTypeForData(page: BlueprintPage, data: StylistBlueprintReportData): BlueprintPage['page_type'] {
  const pageNumber = page.page_number;
  if (pageNumber === 1) return 'cover';
  if (pageNumber === 2) return 'summary';
  if (pageNumber === 3) return 'reading_guide';
  if ([4, 5, 6, 7].includes(pageNumber)) return 'diagnosis';
  if (pageNumber === 8) return 'avoidance';
  if (pageNumber === 9) return 'palette';
  if ([10, 11].includes(pageNumber)) return 'rules';
  if (pageNumber === 12) return 'fabric';
  if (pageNumber === 13) return 'outfit_system';
  if (pageNumber >= getStylistBlueprintOutfitStartPage() && pageNumber <= getStylistBlueprintOutfitEndPage(data)) return 'outfit';
  if (pageNumber === getStylistBlueprintMatrixPage(data)) return 'matrix';
  if (pageNumber === getStylistBlueprintAuditPage(data)) return 'audit';
  if (pageNumber === getStylistBlueprintContinuationPage(data)) return 'continuation';
  return page.page_type;
}

function pageKicker(page: BlueprintPage, data?: StylistBlueprintReportData) {
  const outfitEndPage = getStylistBlueprintOutfitEndPage(data);
  if (page.page_number <= 3) return 'Opening';
  if (page.page_number <= 8) return `Pillar ${String(page.page_number - 3).padStart(2, '0')}`;
  if (page.page_number <= 12) return 'Act II - Prescription';
  if (page.page_number <= outfitEndPage) return 'Act III - Application';
  return 'Closing';
}

function imageForPage(page: BlueprintPage, imageUrls?: ResolvedStylistBlueprintImageUrls | null, data?: StylistBlueprintReportData) {
  const images = imageUrls;
  const continuationPage = getStylistBlueprintContinuationPage(data);
  const outfitEndPage = getStylistBlueprintOutfitEndPage(data);
  switch (page.page_number) {
    case 4: return images?.diagnosis?.silhouetteFront ?? null;
    case 5: return images?.diagnosis?.undertoneMap ?? null;
    case 6: return images?.diagnosis?.faceShapeDiagram ?? null;
    case 11: return images?.prescription?.hairDirections ?? null;
    default:
      if (page.page_number === continuationPage) return images?.closing?.editTeaser ?? null;
      if (page.page_number >= getStylistBlueprintOutfitStartPage() && page.page_number <= outfitEndPage) {
        return images?.application?.outfitFlatlays?.[page.page_number - 14] ?? null;
      }
      return null;
  }
}

function secondaryImageForPage(page: BlueprintPage, imageUrls?: ResolvedStylistBlueprintImageUrls | null, data?: StylistBlueprintReportData) {
  if (page.page_number >= getStylistBlueprintOutfitStartPage() && page.page_number <= getStylistBlueprintOutfitEndPage(data)) return null;
  if (page.page_number === 4) return imageUrls?.diagnosis?.silhouetteSide ?? null;
  if (page.page_number === 11) return imageUrls?.prescription?.eyewearFrames ?? null;
  return null;
}

function imageSlotForPage(page: BlueprintPage, data?: StylistBlueprintReportData): StylistBlueprintImageSlotKey | null {
  const continuationPage = getStylistBlueprintContinuationPage(data);
  const outfitEndPage = getStylistBlueprintOutfitEndPage(data);
  switch (page.page_number) {
    case 4: return 'diagnosis.silhouetteFront';
    case 5: return 'diagnosis.undertoneMap';
    case 6: return 'diagnosis.faceShapeDiagram';
    case 11: return 'prescription.hairDirections';
    default:
      if (page.page_number === continuationPage) return 'closing.editTeaser';
      if (page.page_number >= getStylistBlueprintOutfitStartPage() && page.page_number <= outfitEndPage) {
        return `application.outfitFlatlays.${page.page_number - 14}` as StylistBlueprintImageSlotKey;
      }
      return null;
  }
}

function secondaryImageSlotForPage(page: BlueprintPage): StylistBlueprintImageSlotKey | null {
  if (page.page_number === 4) return 'diagnosis.silhouetteSide';
  if (page.page_number === 11) return 'prescription.eyewearFrames';
  return null;
}

function firstBody(blocks: BlueprintBlock[], fallback = '') {
  return blocks.find(block => block.body)?.body || blocks.find(block => block.reason)?.reason || fallback;
}

function PageFrame({
  page,
  children,
  className = '',
}: {
  page: BlueprintPage;
  children: ReactNode;
  className?: string;
}) {
  const { reportData } = useContext(EditableReportContext);
  const pageType = canonicalPageType(page, reportData);
  const totalPages = getStylistBlueprintPageCount(reportData);
  return (
    <section className={`iconik-page ${pageClass(page.page_number, pageType)} ${className}`}>
      <div className="grain" />
      <div className="corner-tl">
        <div className="mono corner-kicker">{pageKicker(page, reportData)}</div>
        <EditableText
          page={page}
          value={page.title}
          update={value => ({ ...page, title: value })}
          className="small-caps corner-title"
        />
      </div>
      <div className="corner-tr">
        <div className="mono corner-kicker">{String(page.page_number).padStart(2, '0')} / {totalPages}</div>
      </div>
      {children}
    </section>
  );
}

function CoverPage({ page, data }: { page: BlueprintPage; data: StylistBlueprintReportData }) {
  const { editable, onReportDataChange } = useContext(EditableReportContext);
  const name = splitDisplayName(data.client.display_name);
  const totalPages = getStylistBlueprintPageCount(data);
  const updateDisplayName = (value: string) => {
    const nextName = value.replace(/\s+/g, ' ').trim();
    if (!nextName || nextName === data.client.display_name) return;
    onReportDataChange?.({
      ...data,
      client: {
        ...data.client,
        display_name: nextName,
      },
      classification: {
        ...data.classification,
        client: {
          ...data.classification.client,
          name: nextName,
        },
      },
    });
  };
  return (
    <section className="iconik-page slate cover-page">
      <div className="grain" />
      <div className="corner-tl">
        <div className="display wordmark">I C O N I K</div>
        <div className="micro muted">EST - MMXXIV</div>
      </div>
      <div className="corner-tr">
        <div className="micro muted">Volume I - Issue {String(Math.abs(data.client.email.length * 13)).padStart(3, '0')}</div>
        <div className="micro muted date-line">{data.client.month_year}</div>
      </div>
      <div className="cover-center">
        <div className="cover-rule">
          <span />
          <div className="micro">A Personal Blueprint</div>
          <span />
        </div>
        <h1
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={event => updateDisplayName(event.currentTarget.innerText)}
          style={{ outline: 'none' }}
        >
          <span className="display">{name.first}</span>
          <span className="display-it">{name.rest}</span>
        </h1>
        <div className="mono cover-number">No. {String(page.page_number).padStart(5, '0')} / bp.iconik.pro</div>
      </div>
      <div className="corner-bl">
        <div className="display-it cover-tag">Same body.</div>
        <div className="display-it cover-tag">Different science.</div>
      </div>
      <div className="corner-br"><div className="mono corner-kicker">01 / {totalPages}</div></div>
    </section>
  );
}

function SummaryPage({ page, data }: { page: BlueprintPage; data: StylistBlueprintReportData }) {
  const focus = data.analysis.proportional_focus.join('. ');
  const colourSummary = `Build outfits from ${data.classification.colour.base_palette.slice(0, 3).map(colour => colour.name).join(', ')}, then use ${data.classification.colour.accent_palette.slice(0, 2).map(colour => colour.name).join(' or ')} only as controlled accents.`;
  const cards = [
    ['01 - SILHOUETTE', data.analysis.silhouette_profile, 'relative body geometry', firstBody(page.blocks, data.classification.body.proportion_directive)],
    ['02 - CHROMATIC', data.analysis.chromatic_family, `${data.classification.colour.depth} depth`, colourSummary],
    ['03 - ARCHITECTURE', data.classification.face_hair_accessories.face_shape, 'face and neckline logic', data.classification.face_hair_accessories.face_direction],
    ['04 - DIRECTION', data.analysis.style_direction, data.classification.taste.moodboard, data.classification.client.lifestyle_summary],
  ];
  return (
    <PageFrame page={page} className="summary-page">
      <div className="summary-grid">
        <aside className="summary-rail">
          <div className="micro faded">Section</div>
          <div className="display rail-number">02</div>
          <Metric label="Reading time" value="4 min" />
          <Metric label="Axes measured" value="Five" />
          <Metric label="Confidence" value={`${data.analysis.confidence.body}/${data.analysis.confidence.colour}/${data.analysis.confidence.face}`} />
        </aside>
        <div className="summary-main">
          <div className="micro faded">The Summary</div>
          <h2><span className="display">Five measurements</span><span className="display-it">define everything.</span></h2>
          <div className="rule" />
          <div className="dossier-cards">
            {cards.map(([label, title, sub, body]) => (
              <div key={label} className="dossier-card">
                <div className="mono dossier-label">{label}</div>
                <div className="display dossier-title">{title}</div>
                <div className="display-it dossier-subtitle">{sub}</div>
                <div className="rule-thin" />
                <p>{body}</p>
              </div>
            ))}
          </div>
          <div className="rule thesis-rule" />
          <div className="thesis">
            <div className="mono faded">05</div>
            <div>
              <p className="display-it">&quot;{focus || data.analysis.style_direction}&quot;</p>
              <div className="micro faded">The Proportional Focus - your styling thesis</div>
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <div className="small-caps faded">{label}</div>
      <div className="display">{value}</div>
    </div>
  );
}

function ReadingGuidePage({ page }: { page: BlueprintPage }) {
  return (
    <PageFrame page={page} className="reading-page">
      <div className="reading-inner">
        <div className="micro faded">How to use this report</div>
        <h2><span className="display">Read the diagnosis.</span><span className="display-it">Then use the rules.</span></h2>
        <div className="rule" />
        <div className="reading-blocks">
          {page.blocks.map((block, index) => (
            <div key={index} className="glass-dark reading-card">
              <div className="mono dossier-label">{String(index + 1).padStart(2, '0')}</div>
              <EditableText
                as="h3"
                page={page}
                value={block.heading || block.label}
                update={value => updateBlock(page, index, block.heading !== undefined ? { heading: value } : { label: value })}
                className="display"
              />
              <EditableText
                as="p"
                page={page}
                value={block.body || block.reason}
                update={value => updateBlock(page, index, block.body !== undefined ? { body: value } : { reason: value })}
              />
            </div>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}

function SilhouetteFallback() {
  return (
    <svg viewBox="0 0 240 360" className="diagram-svg" xmlns="http://www.w3.org/2000/svg">
      <path d="M120 38Q105 38 105 53Q105 70 120 72Q135 70 135 53Q135 38 120 38Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M85 95Q120 86 155 95L172 165Q176 215 168 250L162 308L152 348L132 348L128 308L120 270L112 308L108 348L88 348L78 308L72 250Q64 215 68 165Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <line x1="48" y1="100" x2="192" y2="100" stroke="white" strokeWidth="1.5" />
      <circle cx="48" cy="100" r="3" fill="white" /><circle cx="192" cy="100" r="3" fill="white" />
      <line x1="42" y1="198" x2="198" y2="198" stroke="white" strokeWidth="1.5" />
      <circle cx="42" cy="198" r="3" fill="white" /><circle cx="198" cy="198" r="3" fill="white" />
      <path d="M76 168Q120 178 164 168" fill="none" stroke="white" strokeWidth="1" opacity="0.5" strokeDasharray="2 3" />
      <line x1="120" y1="28" x2="120" y2="354" stroke="white" strokeWidth="0.8" opacity="0.35" strokeDasharray="2 4" />
    </svg>
  );
}

function DiagnosisPage({
  page,
  data,
  imageUrls,
}: {
  page: BlueprintPage;
  data: StylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
}) {
  const { onImageRegenerate } = useContext(EditableReportContext);
  const image = imageForPage(page, imageUrls, data);
  const secondary = secondaryImageForPage(page, imageUrls, data);
  const imageSlot = imageSlotForPage(page, data);
  const secondarySlot = secondaryImageSlotForPage(page);
  const showSecondary = Boolean(secondary || (onImageRegenerate && secondarySlot));
  const statements = page.blocks.length ? page.blocks : [
    { label: 'Finding', body: data.classification.body.proportion_directive },
    { label: 'Implication', body: data.classification.body.silhouette_rules.join(' ') },
    { label: 'Discipline', body: data.analysis.evidence_notes.join(' ') },
  ];

  if (page.page_number === 5) return <ChromaticPage page={page} data={data} image={image} />;
  if (page.page_number === 7) return <ProportionalAxesPage page={page} data={data} />;

  return (
    <PageFrame page={page} className="diagnosis-page">
      <div className="diagnosis-grid">
        <div>
          <div className="diagram-card">
            <div className="mono figure-label">FIG. {String(page.page_number - 3).padStart(2, '0')} - PROFILE</div>
            {imageSlot ? (
              <ImageSlotFrame slotKey={imageSlot} label="diagnosis image" className={`diagram-media ${page.page_number === 4 ? 'silhouette-media' : ''}`}>
                {image ? <ReportImage src={image} /> : <SilhouetteFallback />}
              </ImageSlotFrame>
            ) : image ? <ReportImage src={image} /> : <SilhouetteFallback />}
          </div>
          {showSecondary && secondarySlot && (
            <ImageSlotFrame slotKey={secondarySlot} label="secondary diagnosis image" className={`secondary-strip ${page.page_number === 4 ? 'silhouette-secondary' : ''}`}>
              {secondary ? <ReportImage src={secondary} /> : <SilhouetteFallback />}
            </ImageSlotFrame>
          )}
        </div>
        <div className="diagnosis-copy">
          <h2>
            <EditableText
              page={page}
              value={page.page_number === 4 ? 'The body,' : page.title}
              update={value => ({ ...page, title: value })}
              className="display"
            />
            <EditableText
              page={page}
              value={page.page_number === 4 ? 'measured.' : page.subtitle || 'mapped.'}
              update={value => ({ ...page, subtitle: value })}
              className="display-it"
            />
          </h2>
          <div className="rule" />
          <div className="finding-list">
            {statements.slice(0, 4).map((block, index) => (
              <div key={index}>
                <EditableText
                  page={page}
                  value={block.label || block.heading || `Finding ${index + 1}`}
                  update={value => updateBlock(page, index, block.label !== undefined ? { label: value } : { heading: value })}
                  className="mono faded"
                />
                <EditableText
                  as="p"
                  page={page}
                  value={block.body || block.reason || objectSummary(asItems(block)[0])}
                  update={value => updateBlock(page, index, block.body !== undefined ? { body: value } : { reason: value })}
                />
              </div>
            ))}
          </div>
          <div className="rule quote-rule" />
          <p className="display-it diagnosis-quote">&quot;<EditableText page={page} value={page.subtitle || data.analysis.proportional_focus.join('. ')} update={value => ({ ...page, subtitle: value })} />&quot;</p>
        </div>
      </div>
    </PageFrame>
  );
}

function ChromaticPage({
  page,
  data,
  image,
}: {
  page: BlueprintPage;
  data: StylistBlueprintReportData;
  image: string | null;
}) {
  const depth = data.classification.colour.depth || 'medium';
  const contrast = data.classification.colour.contrast || 'medium';
  const undertonePosition = axisPosition(data.classification.colour.undertone_direction, 'undertone');
  const depthPosition = axisPosition(depth, 'depth');
  const contrastPosition = axisPosition(contrast, 'contrast');
  return (
    <PageFrame page={page} className="chromatic-page">
      <div className="chromatic-inner">
        <h2><span className="display">Colour, in</span><span className="display-it">three axes.</span></h2>
        <div className="rule" />
          <div className="chromatic-map">
          <ImageSlotFrame slotKey="diagnosis.undertoneMap" label="undertone image" className="axis-portrait">
            {image ? <ReportImage src={image} /> : <UndertoneBar position={undertonePosition} />}
          </ImageSlotFrame>
          <div className="chromatic-axes">
            <div className="axis-block">
              <div className="axis-head">
                <div className="mono faded">Axis 01 - Undertone</div>
                <div className="display axis-value">{data.classification.colour.undertone_direction}</div>
              </div>
              <UndertoneBar position={undertonePosition} />
              <div className="axis-scale mono faded"><span>Cool</span><span>Neutral</span><span>Warm</span></div>
            </div>
            <div className="mini-axis-grid">
              <MiniAxis label="Axis 02 - Depth" value={depth} position={depthPosition} />
              <MiniAxis label="Axis 03 - Contrast" value={contrast} position={contrastPosition} />
            </div>
          </div>
        </div>
        <div className="rule quote-rule" />
        <p className="display-it diagnosis-quote">&quot;{page.subtitle || data.analysis.chromatic_family}&quot;</p>
      </div>
    </PageFrame>
  );
}

function axisPosition(value: string, kind: 'undertone' | 'depth' | 'contrast') {
  const text = value.toLowerCase();
  if (kind === 'undertone') {
    if (text.includes('cool') && text.includes('warm')) return 50;
    if (text.includes('cool')) return text.includes('neutral') ? 32 : 14;
    if (text.includes('warm')) return text.includes('neutral') ? 68 : 86;
    return 50;
  }
  if (text.includes('low') || text.includes('light') || text.includes('soft')) return 16;
  if (text.includes('high') || text.includes('deep') || text.includes('dark')) return 84;
  if (text.includes('medium-high') || text.includes('medium high')) return 68;
  if (text.includes('medium-low') || text.includes('medium low')) return 32;
  return 50;
}

function UndertoneBar({ position }: { position: number }) {
  return (
    <div className="undertone-bar">
      <div className="undertone-marker" style={{ left: `${position}%` }} />
    </div>
  );
}

function MiniAxis({ label, value, position }: { label: string; value: string; position: number }) {
  const bars = Array.from({ length: 10 }, (_, index) => 30 + index * 7);
  const activeIndex = Math.max(0, Math.min(9, Math.round((position / 100) * 9)));
  return (
    <div>
      <div className="axis-head small">
        <div className="mono faded">{label}</div>
        <div className="display-it mini-axis-value">{value}</div>
      </div>
      <div className="bars">
        {bars.map((height, index) => <span key={index} style={{ height: `${height}%` }} className={index === activeIndex ? 'active' : ''} />)}
      </div>
    </div>
  );
}

function ProportionalAxesPage({ page, data }: { page: BlueprintPage; data: StylistBlueprintReportData }) {
  const blocks = page.blocks.length ? page.blocks : [
    { label: 'Axis 01', heading: 'Vertical balance', body: data.classification.body.proportion_directive },
    { label: 'Axis 02', heading: 'Horizontal balance', body: data.classification.body.silhouette_rules.join(' ') },
    { label: 'Axis 03', heading: 'Focal control', body: data.analysis.proportional_focus.join(', ') },
  ];
  return (
    <PageFrame page={page} className="proportion-page">
      <div className="proportion-inner">
        <div>
          <h2>
            <EditableText page={page} value={page.title} update={value => ({ ...page, title: value })} className="display" />
            <EditableText page={page} value={page.subtitle || 'aligned.'} update={value => ({ ...page, subtitle: value })} className="display-it" />
          </h2>
          <div className="rule" />
          <p className="display-it diagnosis-quote">&quot;{data.analysis.proportional_focus.join('. ')}&quot;</p>
        </div>
        <div className="proportion-card-grid">
          {blocks.slice(0, 6).map((block, index) => (
            <div key={index} className="glass-dark proportion-card">
              <div className="mono dossier-label">{block.label || `Axis ${String(index + 1).padStart(2, '0')}`}</div>
              <EditableText
                as="h3"
                page={page}
                value={block.heading || block.label || `Axis ${index + 1}`}
                update={value => updateBlock(page, index, block.heading !== undefined ? { heading: value } : { label: value })}
                className="display"
              />
              <EditableText
                as="p"
                page={page}
                value={block.body || block.reason || objectSummary(asItems(block)[0])}
                update={value => updateBlock(page, index, block.body !== undefined ? { body: value } : { reason: value })}
              />
            </div>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}

function PalettePage({ page, data }: { page: BlueprintPage; data: StylistBlueprintReportData }) {
  return (
    <PageFrame page={page} className="palette-page">
      <div className="palette-inner">
        <h2><span className="display">Fifteen</span><span className="display-it">colours, one rule.</span></h2>
        <p className="palette-intro">Ten base shades to build the wardrobe. Five accent shades for tension. Together they describe a complete chromatic territory - your territory.</p>
        <PaletteSwatchGrid title="The Base - 10 shades - 70% of the wardrobe" colours={data.classification.colour.base_palette} />
        <PaletteSwatchGrid title="The Accents - 5 shades - for emphasis" colours={data.classification.colour.accent_palette} accent />
      </div>
    </PageFrame>
  );
}

function PaletteSwatchGrid({
  title,
  colours,
  accent = false,
}: {
  title: string;
  colours: Array<{ name: string; hex: string; usage: string; avoid_for?: string }>;
  accent?: boolean;
}) {
  return (
    <div className="palette-section">
      <div className="rule" />
      <div className="palette-heading">
        <div className="mono faded">{title}</div>
        <div className="mono faded">{accent ? 'Use sparingly' : 'Deep -> light'}</div>
      </div>
      <div className="premium-swatches">
        {colours.map((colour, index) => (
          <div key={`${colour.hex}-${index}`} className="premium-swatch">
            <div className="swatch-tile" style={{ background: colour.hex }} />
            <div className="mono swatch-code">{String(index + 1).padStart(2, '0')} {colour.hex}</div>
            <div className="display-it swatch-name">{colour.name}</div>
            <p>{colour.usage}{colour.avoid_for ? ` Avoid for: ${colour.avoid_for}` : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function comparableText(value: string) {
  return value
    .toLowerCase()
    .replace(/^(why|reason|because)\s*:\s*/i, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function meaningfulReason(body: string, reason: string) {
  if (!reason.trim()) return '';
  const bodyText = comparableText(body);
  const reasonText = comparableText(reason);
  if (!reasonText || reasonText === bodyText) return '';
  return reason.trim();
}

function ruleCardFromItem(input: {
  block: BlueprintBlock;
  item: unknown;
  index: number;
  sourceIndex: number;
  titleField: 'heading' | 'label';
}) {
  const { block, item, index, sourceIndex, titleField } = input;
  const title = getField(
    item,
    ['name', 'heading', 'label', 'rule', 'question', 'filter', 'title'],
    block.heading || block.label || `Rule ${index + 1}`,
  );
  const body = getField(
    item,
    ['recommendation', 'guidance', 'answer', 'filter', 'note', 'body', 'instruction', 'action', 'piece'],
    '',
  );
  const reason = meaningfulReason(body, getField(item, ['reason', 'why'], block.reason || ''));

  return {
    label: block.label || block.heading || `Rule ${sourceIndex + 1}`,
    heading: title,
    body: body || reason,
    reason: body ? reason : '',
    sourceIndex,
    titleField,
  };
}

function RuleLikePage({ page, data, imageUrls }: { page: BlueprintPage; data: StylistBlueprintReportData; imageUrls?: ResolvedStylistBlueprintImageUrls | null }) {
  const image = imageForPage(page, imageUrls, data);
  const secondary = secondaryImageForPage(page, imageUrls, data);
  const cards: Array<{
    label: string;
    heading: string;
    body: string;
    reason: string;
    sourceIndex: number;
    titleField: 'heading' | 'label';
  }> = page.blocks.flatMap((block, sourceIndex) => {
    const items = asItems(block);
    const titleField = block.heading !== undefined ? 'heading' : 'label';
    if (!items.length) {
      const body = block.body || '';
      const reason = meaningfulReason(body, block.reason || '');
      return [{
        label: block.label || block.heading || `Rule ${sourceIndex + 1}`,
        heading: block.heading || block.label || `Rule ${sourceIndex + 1}`,
        body: body || reason,
        reason: body ? reason : '',
        sourceIndex,
        titleField,
      }];
    }
    return items.map((item, index) => ruleCardFromItem({ block, item, index, sourceIndex, titleField }));
  });
  return (
    <PageFrame page={page} className="rule-page">
      <div className="rule-layout">
        <div>
          <h2>
            <EditableText page={page} value={page.title} update={value => ({ ...page, title: value })} className="display" />
            {page.subtitle && <EditableText page={page} value={page.subtitle} update={value => ({ ...page, subtitle: value })} className="display-it" />}
          </h2>
          <EditableText
            as="p"
            page={page}
            value={firstBody(page.blocks, data.classification.body.proportion_directive)}
            update={value => updateBlock(page, page.blocks.findIndex(block => block.body || block.reason), { body: value })}
          />
        </div>
        <div className="rule-card-grid">
          {cards.slice(0, 8).map((block, index) => (
            <div key={index} className="glass-dark premium-rule-card">
              <div className="mono dossier-label">{String(index + 1).padStart(2, '0')}</div>
              <EditableText
                as="h3"
                page={page}
                value={block.heading || block.label}
                update={value => updateBlock(page, block.sourceIndex, block.titleField === 'heading' ? { heading: value } : { label: value })}
                className="display"
              />
              <EditableText
                as="p"
                page={page}
                value={block.body}
                update={value => updateBlock(page, block.sourceIndex, { body: value })}
              />
              {block.reason && (
                <p className="why">Why: <EditableText page={page} value={block.reason} update={value => updateBlock(page, block.sourceIndex, { reason: value })} /></p>
              )}
            </div>
          ))}
        </div>
      </div>
      {(image || secondary) && (
        <div className="reference-images">
          {image && <ReportImage src={image} />}
          {secondary && <ReportImage src={secondary} />}
        </div>
      )}
    </PageFrame>
  );
}

function FaceGridFallback() {
  return (
    <div className="face-grid-fallback">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index}>
          <i />
        </span>
      ))}
    </div>
  );
}

function HairFaceAccessoriesPage({ page, data, imageUrls }: { page: BlueprintPage; data: StylistBlueprintReportData; imageUrls?: ResolvedStylistBlueprintImageUrls | null }) {
  const hairImage = imageUrls?.prescription?.hairDirections ?? null;
  const eyewearImage = imageUrls?.prescription?.eyewearFrames ?? null;
  const cards = page.blocks.flatMap((block, sourceIndex) => {
    const items = asItems(block);
    const titleField = block.heading !== undefined ? 'heading' : 'label';
    if (!items.length) {
      const body = block.body || '';
      const reason = meaningfulReason(body, block.reason || '');
      return [{
        heading: block.heading || block.label || `Rule ${sourceIndex + 1}`,
        body: body || reason,
        sourceIndex,
        titleField,
      }];
    }
    return items.map((item, index) => ruleCardFromItem({ block, item, index, sourceIndex, titleField }));
  }).slice(0, 6);

  return (
    <PageFrame page={page} className="hair-page">
      <div className="hair-inner">
        <div className="hair-copy">
          <h2>
            <EditableText page={page} value={page.title} update={value => ({ ...page, title: value })} className="display" />
            <EditableText page={page} value={page.subtitle || 'framed.'} update={value => ({ ...page, subtitle: value })} className="display-it" />
          </h2>
          <div className="rule" />
          <p>{firstBody(page.blocks, data.classification.face_hair_accessories.face_direction)}</p>
        </div>
        <div className="face-visuals">
          <div className="face-panel">
            <div className="mono dossier-label">Hair direction - 2x2</div>
            <ImageSlotFrame slotKey="prescription.hairDirections" label="hair direction image" className="face-panel-media">
              {hairImage ? <ReportImage src={hairImage} /> : <FaceGridFallback />}
            </ImageSlotFrame>
          </div>
          <div className="face-panel">
            <div className="mono dossier-label">Eyeframes + sunglasses - 2x2</div>
            <ImageSlotFrame slotKey="prescription.eyewearFrames" label="eyewear image" className="face-panel-media">
              {eyewearImage ? <ReportImage src={eyewearImage} /> : <FaceGridFallback />}
            </ImageSlotFrame>
          </div>
        </div>
        <div className="hair-card-grid">
          {cards.map((card, index) => (
            <div key={index} className="glass-dark premium-rule-card">
              <div className="mono dossier-label">{String(index + 1).padStart(2, '0')}</div>
              <EditableText
                as="h3"
                page={page}
                value={card.heading}
                update={value => updateBlock(page, card.sourceIndex, card.titleField === 'heading' ? { heading: value } : { label: value })}
                className="display"
              />
              <EditableText
                as="p"
                page={page}
                value={card.body}
                update={value => updateBlock(page, card.sourceIndex, { body: value })}
              />
            </div>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}

function OutfitSystemPage({ page, data, imageUrls }: { page: BlueprintPage; data: StylistBlueprintReportData; imageUrls?: ResolvedStylistBlueprintImageUrls | null }) {
  const covers = imageUrls?.application?.capsuleCovers?.filter((url): url is string => Boolean(url)) ?? [];
  const outfitCount = getStylistBlueprintOutfitCount(data);
  const outfitLabel = outfitCount === 20 ? 'Twenty' : outfitCount === 12 ? 'Twelve' : String(outfitCount);
  return (
    <PageFrame page={page} className="outfit-system-page">
      <div className="system-inner">
        <h2><span className="display">{outfitLabel} formulas.</span><span className="display-it">One wardrobe system.</span></h2>
        <EditableText
          as="p"
          page={page}
          value={firstBody(page.blocks, 'The next pages organise your outfit formulas into four capsules. Each capsule solves a different context, while shared pieces make the system feel complete rather than episodic.')}
          update={value => updateBlock(page, page.blocks.findIndex(block => block.body || block.reason), { body: value })}
        />
        <div className="rule" />
        <div className="capsule-map">
          {page.blocks.flatMap(block => asItems(block).length ? asItems(block) : [block]).slice(0, 4).map((item, index) => (
            <div key={index} className="capsule-card">
              {covers[index] && <ReportImage src={covers[index]} />}
              <div className="mono faded">Capsule {String(index + 1).padStart(2, '0')}</div>
              <h3 className="display">{getField(item, ['heading', 'label', 'name', 'capsule'], `Capsule ${index + 1}`)}</h3>
              <p>{getField(item, ['recommendation', 'guidance', 'body', 'serves', 'note'], '')}</p>
            </div>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}

function SwatchDot({ hex }: { hex: string }) {
  return <span className="swatch-dot" style={{ background: hex }} />;
}

function colourForFormulaItem(item: unknown, page: BlueprintPage, data: StylistBlueprintReportData, index: number): BlueprintColourUse {
  const record = isObject(item) ? item : {};
  const metadataHex = typeof record.colour_hex === 'string' && isHex(record.colour_hex) ? record.colour_hex : '';
  const metadataName = typeof record.colour_name === 'string' && record.colour_name.trim() ? record.colour_name.trim() : '';
  const metadataRole = ['lead', 'support', 'ground', 'accent'].includes(String(record.palette_role))
    ? record.palette_role as BlueprintColourUse['role']
    : 'support';
  if (metadataHex) return { name: metadataName || metadataHex, hex: metadataHex, role: metadataRole };

  const text = objectSummary(item);
  const inferred = inferColourFromText(text, data);
  if (inferred) return inferred;

  const pageColour = page.palette_used?.[index % (page.palette_used.length || 1)];
  if (pageColour?.hex && isHex(pageColour.hex)) return pageColour;

  return allReportColours(data)[index % Math.max(allReportColours(data).length, 1)] ?? { name: 'Palette colour', hex: IVORY, role: 'support' };
}

function paletteForOutfitPage(page: BlueprintPage, data: StylistBlueprintReportData, items: unknown[]): BlueprintColourUse[] {
  const fromPage = page.palette_used?.filter(colour => isHex(colour.hex)) ?? [];
  if (fromPage.length) return fromPage;

  const inferred = items
    .map((item, index) => colourForFormulaItem(item, page, data, index))
    .filter((colour, index, arr) => arr.findIndex(existing => existing.hex.toLowerCase() === colour.hex.toLowerCase()) === index)
    .slice(0, 5);

  if (inferred.length) return inferred;
  return allReportColours(data).slice(0, 5);
}

function OutfitPage({ page, data, imageUrls }: { page: BlueprintPage; data: StylistBlueprintReportData; imageUrls?: ResolvedStylistBlueprintImageUrls | null }) {
  const image = imageForPage(page, imageUrls, data);
  const detail = secondaryImageForPage(page, imageUrls, data);
  const reasoning = page.blocks.find(block => block.reason || /reason|why|works/i.test(`${block.label} ${block.heading}`));
  const items = normaliseFormulaItems(page);
  const palette = paletteForOutfitPage(page, data, items);
  const outfitNumber = page.page_number - 13;
  const imageSlot = imageSlotForPage(page, data);
  return (
    <PageFrame page={page} className="outfit-page">
      <div className="outfit-hero">
        <div className="outfit-copy">
          <div className="display-it outfit-no">No. {String(outfitNumber).padStart(2, '0')}</div>
          <h2>
            <EditableText
              page={page}
              value={page.title}
              update={value => ({ ...page, title: value })}
              className="display"
            />
          </h2>
          <p className="display-it outfit-quote">&quot;<EditableText page={page} value={reasoning?.reason || reasoning?.body || page.subtitle || data.classification.body.proportion_directive} update={value => reasoning ? updateBlock(page, page.blocks.indexOf(reasoning), reasoning.reason !== undefined ? { reason: value } : { body: value }) : { ...page, subtitle: value }} />&quot;</p>
          <div className="rule" />
          <div className="outfit-meta">
            <div className="mono faded">Occasion</div>
            <EditableText as="p" page={page} value={page.subtitle || getField(page.blocks[0], ['body'], 'Context-specific formula')} update={value => ({ ...page, subtitle: value })} />
            <div className="mono faded">Palette</div>
            <div>{palette.map(colour => <SwatchDot key={`${colour.hex}-${colour.name}`} hex={colour.hex} />)}</div>
            <div className="mono faded">Logic</div>
            <EditableText as="p" page={page} value={reasoning?.body || reasoning?.reason || firstBody(page.blocks)} update={value => reasoning ? updateBlock(page, page.blocks.indexOf(reasoning), reasoning.body !== undefined ? { body: value } : { reason: value }) : page} />
          </div>
        </div>
        <div className="outfit-art">
          <div className="flatlay-frame">
            <div className="grain" />
            <div className="mono figure-label">Composition - {String(outfitNumber).padStart(2, '0')}</div>
            {imageSlot && (
              <ImageSlotFrame slotKey={imageSlot} label={`outfit ${outfitNumber} image`} className="flatlay-media">
                {image ? <ReportImage src={image} /> : <OutfitFallback palette={palette.map(colour => colour.hex)} />}
              </ImageSlotFrame>
            )}
          </div>
          {detail && <ReportImage className="detail-image" src={detail} />}
        </div>
      </div>
      <div className="rule formula-rule" />
      <div>
        <div className="mono faded formula-label">The Formula - {Math.max(items.length, 5)} pieces</div>
        <div className="formula-grid">
          {(items.length ? items : page.blocks.slice(0, 5)).map((item, index) => {
            const colour = colourForFormulaItem(item, page, data, index);
            return (
              <div key={index} className="formula-card">
                <SwatchDot hex={colour.hex} />
                <div className="mono dossier-label">{String(index + 1).padStart(2, '0')} - {getField(item, ['slot', 'category', 'label'], 'piece')}</div>
                <h3 className="display">{getField(item, ['piece', 'name', 'heading', 'rule'], getField(item, ['body'], `Piece ${index + 1}`))}</h3>
                <p>{getField(item, ['structural_notes', 'notes', 'guidance', 'body'], '')}</p>
              </div>
            );
          })}
        </div>
      </div>
    </PageFrame>
  );
}

function OutfitFallback({ palette }: { palette: string[] }) {
  const [a = IVORY, b = INK, c = ROSE, d = '#6B5840', e = '#C4A040'] = palette;
  return (
    <svg viewBox="0 0 240 320" className="outfit-svg" xmlns="http://www.w3.org/2000/svg">
      <path d="M82 28Q96 22 120 22Q144 22 158 28L168 90L174 175Q176 200 168 215L158 215L152 175L132 105L120 100L108 105L88 175L82 215L72 215Q64 200 66 175L72 90Z" fill={a} />
      <path d="M78 218L90 286L72 286L66 218Z" fill={b} />
      <path d="M150 218L168 218L162 286L144 286Z" fill={b} />
      <path d="M78 286L70 306L86 308L90 286Z" fill={c} />
      <path d="M150 286L144 308L160 306L162 286Z" fill={c} />
      <rect x="186" y="155" width="32" height="40" rx="3" fill={d} />
      <circle cx="98" cy="58" r="1.8" fill={e} />
      <circle cx="142" cy="58" r="1.8" fill={e} />
    </svg>
  );
}

function MatrixPage({ page, data }: { page: BlueprintPage; data: StylistBlueprintReportData }) {
  const outfitCount = getStylistBlueprintOutfitCount(data);
  const items = page.blocks.flatMap(block => asItems(block).length ? asItems(block) : [block]).slice(0, outfitCount);
  return (
    <PageFrame page={page} className="matrix-page">
      <div className="matrix-grid">
	        <div>
	          <h2><span className="display">The system,</span><span className="display-it">connected.</span></h2>
	          <p>{firstBody(page.blocks, `The formulas share anchor pieces, which turns ${outfitCount} outfit formulas into a wider wardrobe system.`)}</p>
          <div className="matrix-image" aria-hidden="true">
            <NodeMap count={outfitCount} />
          </div>
        </div>
        <div className="matrix-table">
          {items.map((item, index) => (
            <div key={index}>
              <div>
                <div className="mono faded">{String(index + 1).padStart(2, '0')}</div>
                <strong>{getField(item, ['piece', 'name', 'heading', 'label'], `Core piece ${index + 1}`)}</strong>
              </div>
              <span>{getField(item, ['appears_in', 'outfits', 'body', 'reason'], '')}</span>
            </div>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}

function NodeMap({ count = 12 }: { count?: number }) {
  return (
    <div className="node-map">
      {Array.from({ length: count }, (_, index) => <span key={index} style={{ transform: `rotate(${index * (360 / count)}deg) translateY(-120px)` }} />)}
      <div className="node-center" />
    </div>
  );
}

function ContinuationPage({ page, data, imageUrls }: { page: BlueprintPage; data: StylistBlueprintReportData; imageUrls?: ResolvedStylistBlueprintImageUrls | null }) {
  const { onImageRegenerate } = useContext(EditableReportContext);
  const image = imageForPage(page, imageUrls, data);
  const showImage = Boolean(image || onImageRegenerate);
  return (
    <PageFrame page={page} className="continuation-page">
      <div className={showImage ? 'continuation-layout' : 'continuation-inner'}>
        <div className="continuation-copy">
          <div className="display-it note">a note to the wearer</div>
          <h2><span className="display">Your Blueprint is</span><span className="display">the system.</span><span className="display-it">The Edit is the practice.</span></h2>
          <EditableText
            as="p"
            page={page}
            value={firstBody(page.blocks, 'A weekly study built on the data in this Blueprint. New outfit formulas, shopping intelligence, and styling logic matched to your palette and geometry.')}
            update={value => updateBlock(page, page.blocks.findIndex(block => block.body || block.reason), { body: value })}
          />
          <div className="edit-pill">
            <div className="display">$39<span>/mo</span></div>
            <i />
            <div className="display-it">Continue with the Edit &gt;</div>
          </div>
          <div className="short-rule" />
          <div className="display-it tagline">Same body. Different science.</div>
        </div>
        {showImage && (
          <ImageSlotFrame slotKey="closing.editTeaser" label="edit teaser image" className="continuation-image">
            {image ? <ReportImage src={image} /> : <OutfitFallback palette={[IVORY, INK, ROSE]} />}
          </ImageSlotFrame>
        )}
      </div>
    </PageFrame>
  );
}

function GenericPage({ page, data, imageUrls }: { page: BlueprintPage; data: StylistBlueprintReportData; imageUrls?: ResolvedStylistBlueprintImageUrls | null }) {
  const pageType = canonicalPageType(page, data);
  if (pageType === 'outfit') return <OutfitPage page={page} data={data} imageUrls={imageUrls} />;
  if (pageType === 'palette') return <PalettePage page={page} data={data} />;
  if (pageType === 'outfit_system') return <OutfitSystemPage page={page} data={data} imageUrls={imageUrls} />;
  if (pageType === 'matrix') return <MatrixPage page={page} data={data} />;
  if (pageType === 'continuation') return <ContinuationPage page={page} data={data} imageUrls={imageUrls} />;
  if (page.page_number === 11) return <HairFaceAccessoriesPage page={page} data={data} imageUrls={imageUrls} />;
  if (pageType === 'rules' || pageType === 'fabric' || pageType === 'avoidance' || pageType === 'audit') {
    return <RuleLikePage page={page} data={data} imageUrls={imageUrls} />;
  }
  if (pageType === 'diagnosis') return <DiagnosisPage page={page} data={data} imageUrls={imageUrls} />;
  return (
    <PageFrame page={page} className="generic-page">
      <div className="generic-inner">
        <h2>
          <EditableText page={page} value={page.title} update={value => ({ ...page, title: value })} className="display" />
          {page.subtitle && <EditableText page={page} value={page.subtitle} update={value => ({ ...page, subtitle: value })} className="display-it" />}
        </h2>
        <div className="rule" />
        <div className="generic-blocks">
          {page.blocks.map((block, index) => (
            <div key={index} className="glass-dark premium-rule-card">
              <EditableText page={page} value={block.label || String(index + 1).padStart(2, '0')} update={value => updateBlock(page, index, { label: value })} className="mono dossier-label" />
              <EditableText as="h3" page={page} value={block.heading} update={value => updateBlock(page, index, { heading: value })} className="display" />
              <EditableText as="p" page={page} value={block.body || block.reason} update={value => updateBlock(page, index, block.body !== undefined ? { body: value } : { reason: value })} />
            </div>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}

function LegacyReport({ data }: { data: LegacyStylistBlueprintReportData; imageUrls?: ResolvedStylistBlueprintImageUrls | null }) {
  const pages: BlueprintPage[] = Object.entries(data.sections ?? {}).map(([key, value], index) => ({
    page_number: index + 2,
    page_type: index === 0 ? 'summary' : 'diagnosis',
    title: key.replace(/^s\d_/, '').replace(/_/g, ' '),
    blocks: [{ body: value }],
  }));
  const reportData: StylistBlueprintReportData = {
    version: 'women_blueprint_28_v1',
    generated_at: data.generated_at,
    client: {
      display_name: data.classification.client.name,
      email: data.classification.client.email,
      month_year: new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(data.generated_at)),
    },
    analysis: {
      silhouette_profile: data.classification.body.geometry,
      chromatic_family: data.classification.colour.palette_name,
      facial_architecture: data.classification.face_hair_accessories.face_shape,
      style_direction: data.classification.taste.style_archetype,
      proportional_focus: data.classification.body.focus_areas,
      evidence_notes: [],
      confidence: { body: 'medium', colour: 'medium', face: 'medium' },
    },
    classification: data.classification,
    pages: [
      { page_number: 1, page_type: 'cover', title: 'Cover', blocks: [] },
      ...pages,
    ],
  };
  return <PremiumReport data={reportData} imageUrls={null} />;
}

function DeferredBlueprintPage({
  page,
  data,
  defer,
  children,
}: {
  page: BlueprintPage;
  data: StylistBlueprintReportData;
  defer: boolean;
  children: ReactNode;
}) {
  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold: 0,
    rootMargin: '700px 0px',
  });
  const shouldRender = !defer || hasIntersected;
  if (shouldRender) return <>{children}</>;

  const pageType = canonicalPageType(page, data);
  return (
    <div ref={elementRef} className={`iconik-page ${pageClass(page.page_number, pageType)} deferred-page`}>
      <div className="grain" />
      <div className="corner-tl">
        <div className="mono corner-kicker">{pageKicker(page, data)}</div>
        <div className="small-caps corner-title">{page.title}</div>
      </div>
      <div className="corner-tr">
        <div className="mono corner-kicker">{String(page.page_number).padStart(2, '0')} / {getStylistBlueprintPageCount(data)}</div>
      </div>
      <div className="deferred-skeleton" aria-hidden="true">
        <div className="deferred-kicker" />
        <div className="deferred-title" />
        <div className="deferred-title short" />
        <div className="deferred-rule" />
        <div className="deferred-grid">
          <div />
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}

function PremiumReport({
  data,
  imageUrls,
  focusPageNumber,
  deferPages = false,
  editable = false,
  onPageChange,
  onReportDataChange,
  onImageRegenerate,
  regeneratingImageSlot,
  imageRegenerationDisabled,
}: {
  data: StylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
  focusPageNumber?: number;
  deferPages?: boolean;
  editable?: boolean;
  onPageChange?: (page: BlueprintPage) => void;
  onReportDataChange?: (data: StylistBlueprintReportData) => void;
  onImageRegenerate?: (slotKey: StylistBlueprintImageSlotKey) => void | Promise<void>;
  regeneratingImageSlot?: StylistBlueprintImageSlotKey | null;
  imageRegenerationDisabled?: boolean;
}) {
  const pages = [...data.pages]
    .filter(page => !focusPageNumber || page.page_number === focusPageNumber)
    .sort((a, b) => a.page_number - b.page_number);
  return (
    <EditableReportContext.Provider value={{ editable, onPageChange, onReportDataChange, onImageRegenerate, regeneratingImageSlot, imageRegenerationDisabled, reportData: data }}>
      <article className={`iconik-report ${editable ? 'iconik-report-editable' : ''}`}>
        <BlueprintStyles />
        {pages.map(page => {
          let node: ReactNode;
          if (page.page_number === 1) node = <CoverPage page={page} data={data} />;
          else {
            const pageType = canonicalPageType(page, data);
            if (pageType === 'summary') node = <SummaryPage page={page} data={data} />;
            else if (pageType === 'reading_guide') node = <ReadingGuidePage page={page} />;
            else node = <GenericPage page={page} data={data} imageUrls={imageUrls} />;
          }
          return (
            <DeferredBlueprintPage
              key={page.page_number}
              page={page}
              data={data}
              defer={deferPages && !focusPageNumber && !editable && page.page_number > 2}
            >
              {node}
            </DeferredBlueprintPage>
          );
        })}
      </article>
    </EditableReportContext.Provider>
  );
}

export default function StylistBlueprintReport({
  data,
  imageUrls,
  focusPageNumber,
  deferPages,
  editable,
  onPageChange,
  onReportDataChange,
  onImageRegenerate,
  regeneratingImageSlot,
  imageRegenerationDisabled,
}: {
  data: StylistBlueprintReportData | LegacyStylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
  focusPageNumber?: number;
  deferPages?: boolean;
  editable?: boolean;
  onPageChange?: (page: BlueprintPage) => void;
  onReportDataChange?: (data: StylistBlueprintReportData) => void;
  onImageRegenerate?: (slotKey: StylistBlueprintImageSlotKey) => void | Promise<void>;
  regeneratingImageSlot?: StylistBlueprintImageSlotKey | null;
  imageRegenerationDisabled?: boolean;
}) {
  if (!isVersionedStylistBlueprintReportData(data)) return <LegacyReport data={data} imageUrls={imageUrls} />;
  return (
    <PremiumReport
      data={data}
      imageUrls={imageUrls}
      focusPageNumber={focusPageNumber}
      deferPages={deferPages}
      editable={editable}
      onPageChange={onPageChange}
      onReportDataChange={onReportDataChange}
      onImageRegenerate={onImageRegenerate}
      regeneratingImageSlot={regeneratingImageSlot}
      imageRegenerationDisabled={imageRegenerationDisabled}
    />
  );
}

function BlueprintStyles() {
  return (
    <style jsx global>{`
      .iconik-report {
        background: ${INK};
        color: ${INK};
        font-family: var(--font-inter), Inter, system-ui, sans-serif;
        font-weight: 300;
        padding: 20px;
      }
      .iconik-report-editable [contenteditable="true"] {
        cursor: text;
        border-radius: 6px;
        transition: background 140ms ease, box-shadow 140ms ease;
      }
      .iconik-report-editable [contenteditable="true"]:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      .iconik-report-editable [contenteditable="true"]:focus {
        background: rgba(255, 255, 255, 0.14);
        box-shadow: 0 0 0 2px rgba(201, 169, 110, 0.35);
        outline: none;
      }
      .image-slot-frame {
        position: relative;
        overflow: hidden;
      }
      .image-regenerate-button {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 5;
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        border: 1px solid rgba(244, 239, 229, 0.45);
        background: rgba(44, 38, 34, 0.62);
        color: ${IVORY};
        box-shadow: 0 8px 24px rgba(44, 38, 34, 0.2);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        cursor: pointer;
        transition: opacity 140ms ease, transform 140ms ease, background 140ms ease;
      }
      .image-regenerate-button:hover:not(:disabled) {
        background: rgba(44, 38, 34, 0.78);
        transform: translateY(-1px);
      }
      .image-regenerate-button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
      .spin-icon {
        animation: iconik-spin 900ms linear infinite;
      }
      @keyframes iconik-spin {
        to { transform: rotate(360deg); }
      }
      .display {
        font-family: var(--font-fraunces), Fraunces, Georgia, serif;
        font-weight: 300;
        letter-spacing: -0.025em;
        line-height: 0.95;
      }
      .display-it {
        font-family: var(--font-fraunces), Fraunces, Georgia, serif;
        font-weight: 300;
        font-style: italic;
        letter-spacing: -0.025em;
        line-height: 1.04;
      }
      .mono {
        font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
        font-weight: 400;
        letter-spacing: 0;
      }
      .micro {
        font-size: 9px;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        font-weight: 400;
      }
      .small-caps {
        font-size: 10px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        font-weight: 400;
      }
      .iconik-page {
        max-width: 1060px;
        min-height: 760px;
        margin: 0 auto 20px;
        border-radius: 20px;
        padding: 64px 56px;
        position: relative;
        overflow: hidden;
        page-break-after: always;
      }
      .iconik-page.slate {
        background: radial-gradient(ellipse 120% 80% at 25% 10%, ${SLATE_LIGHT} 0%, ${SLATE} 45%, ${SLATE_DEEP} 100%);
        color: ${IVORY};
      }
      .iconik-page.slate-deep {
        background: linear-gradient(155deg, ${SLATE_DEEP} 0%, #6B7F87 100%);
        color: ${IVORY};
      }
      .iconik-page.ivory {
        background: linear-gradient(180deg, ${PAPER} 0%, #F1E9D8 100%);
        color: ${INK};
      }
      .iconik-page.bone {
        background: ${BONE};
        color: ${INK};
      }
      .deferred-page {
        display: flex;
        align-items: center;
      }
      .deferred-skeleton {
        position: relative;
        z-index: 1;
        width: min(620px, 100%);
        margin: 74px auto 0;
      }
      .deferred-kicker,
      .deferred-title,
      .deferred-rule,
      .deferred-grid > div {
        border-radius: 999px;
        background: currentColor;
        opacity: 0.14;
        animation: iconik-pulse 1.6s ease-in-out infinite;
      }
      .deferred-kicker {
        width: 140px;
        height: 10px;
        margin-bottom: 26px;
      }
      .deferred-title {
        width: 78%;
        height: 44px;
        margin-bottom: 12px;
      }
      .deferred-title.short {
        width: 48%;
      }
      .deferred-rule {
        width: 100%;
        height: 1px;
        margin: 32px 0;
      }
      .deferred-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }
      .deferred-grid > div {
        height: 128px;
        border-radius: 18px;
      }
      @keyframes iconik-pulse {
        0%, 100% { opacity: 0.1; }
        50% { opacity: 0.22; }
      }
      .grain {
        position: absolute;
        inset: 0;
        opacity: 0.04;
        pointer-events: none;
        background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0);
        background-size: 3px 3px;
      }
      .rule, .rule-thin {
        height: 1px;
        background: currentColor;
        opacity: 0.18;
      }
      .rule-thin {
        opacity: 0.1;
      }
      .glass-dark {
        background: rgba(44, 38, 34, 0.03);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(44, 38, 34, 0.08);
        border-radius: 18px;
      }
      .slate .glass-dark, .slate-deep .glass-dark {
        background: rgba(244, 239, 229, 0.06);
        border-color: rgba(244, 239, 229, 0.15);
      }
      .corner-tl, .corner-tr, .corner-bl, .corner-br {
        position: absolute;
        z-index: 2;
      }
      .corner-tl { top: 28px; left: 32px; }
      .corner-tr { top: 28px; right: 32px; text-align: right; }
      .corner-bl { bottom: 28px; left: 32px; }
      .corner-br { bottom: 28px; right: 32px; text-align: right; }
      .corner-kicker, .faded, .muted {
        opacity: 0.55;
      }
      .corner-title {
        margin-top: 6px;
        opacity: 0.7;
      }
      .wordmark {
        font-size: 14px;
        letter-spacing: 0.42em;
        font-weight: 400;
      }
      .date-line {
        margin-top: 8px;
      }
      .cover-page {
        min-height: 720px;
      }
      .cover-center {
        position: absolute;
        top: 32%;
        left: 56px;
        right: 56px;
        z-index: 2;
      }
      .cover-portrait {
        position: absolute;
        right: 58px;
        bottom: 58px;
        width: min(34%, 320px);
        aspect-ratio: 2 / 3;
        border-radius: 28px;
        overflow: hidden;
        border: 1px solid rgba(244, 239, 229, 0.18);
        box-shadow: 0 28px 80px rgba(44, 38, 34, 0.18);
        z-index: 1;
      }
      .cover-portrait img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .cover-rule {
        display: flex;
        align-items: baseline;
        gap: 24px;
        margin-bottom: 36px;
      }
      .cover-rule span {
        height: 1px;
        flex: 1;
        background: rgba(244, 239, 229, 0.3);
      }
      .cover-rule div {
        opacity: 0.7;
      }
      .cover-center h1 {
        margin: 0;
        text-align: center;
      }
      .cover-center h1 span {
        display: block;
        font-size: clamp(62px, 11vw, 92px);
      }
      .cover-number {
        text-align: center;
        margin-top: 48px;
        font-size: 11px;
        opacity: 0.7;
      }
      .cover-tag {
        font-size: 15px;
        opacity: 0.85;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: 1fr 2.4fr;
        gap: 56px;
        min-height: 620px;
      }
      .summary-rail {
        border-right: 1px solid rgba(44, 38, 34, 0.12);
        padding-right: 32px;
      }
      .rail-number {
        font-size: 48px;
        margin-top: 8px;
        margin-bottom: 32px;
      }
      .metric {
        margin-bottom: 28px;
      }
      .metric .display {
        font-size: 22px;
        margin-top: 4px;
      }
      .summary-main h2,
      .reading-inner h2,
      .palette-inner h2,
      .diagnosis-copy h2,
      .chromatic-inner h2,
      .rule-layout h2,
      .system-inner h2,
      .outfit-copy h2,
      .matrix-grid h2,
      .continuation-inner h2,
      .generic-inner h2 {
        margin: 16px 0 40px;
      }
      .summary-main h2 span,
      .reading-inner h2 span,
      .palette-inner h2 span,
      .diagnosis-copy h2 span,
      .chromatic-inner h2 span,
      .rule-layout h2 span,
      .system-inner h2 span,
      .outfit-copy h2 span,
      .matrix-grid h2 span,
      .continuation-inner h2 span,
      .generic-inner h2 span {
        display: block;
        font-size: clamp(44px, 7vw, 80px);
      }
      .summary-main h2 span {
        font-size: clamp(42px, 6vw, 64px);
      }
      .dossier-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px 48px;
        margin-top: 32px;
      }
      .dossier-label {
        font-size: 10px;
        opacity: 0.45;
        text-transform: uppercase;
      }
      .dossier-title {
        font-size: 32px;
        margin-top: 8px;
      }
      .dossier-subtitle {
        font-size: 18px;
        opacity: 0.6;
        margin-top: 2px;
      }
      .dossier-card p, .palette-intro, .rule-layout p, .system-inner p, .matrix-grid p, .generic-blocks p {
        font-size: 13px;
        line-height: 1.6;
        opacity: 0.7;
      }
      .dossier-card .rule-thin {
        margin: 14px 0;
      }
      .thesis-rule {
        margin: 36px 0 24px;
      }
      .thesis {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }
      .thesis p {
        font-size: 22px;
        line-height: 1.4;
        margin: 0 0 14px;
      }
      .reading-inner, .palette-inner, .system-inner, .generic-inner {
        margin-top: 72px;
      }
      .reading-blocks, .generic-blocks {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 32px;
      }
      .reading-card, .premium-rule-card {
        padding: 24px;
      }
      .reading-card h3, .premium-rule-card h3 {
        font-size: 24px;
        margin: 10px 0 12px;
      }
      .reading-card p, .premium-rule-card p {
        font-size: 14px;
        line-height: 1.75;
        opacity: 0.72;
      }
      .diagnosis-grid {
        margin-top: 80px;
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 64px;
        align-items: start;
      }
      .diagram-card {
        background: rgba(244, 239, 229, 0.04);
        border: 1px solid rgba(244, 239, 229, 0.12);
        border-radius: 24px;
        padding: 32px;
        position: relative;
        color: ${IVORY};
      }
      .figure-label {
        font-size: 9px;
        opacity: 0.55;
        letter-spacing: 0.2em;
        margin-bottom: 20px;
        text-transform: uppercase;
      }
      .diagram-media,
      .secondary-strip,
      .reference-images img {
        width: 100%;
        border-radius: 18px;
        border: 1px solid rgba(244, 239, 229, 0.14);
      }
	      .diagram-media {
	        aspect-ratio: 4 / 5;
	      }
	      .diagram-media.silhouette-media,
	      .secondary-strip.silhouette-secondary {
	        aspect-ratio: 2 / 3;
	        background: rgba(244, 239, 229, 0.06);
	      }
	      .diagram-media img,
	      .diagram-media .diagram-svg,
	      .secondary-strip img,
	      .secondary-strip .diagram-svg {
        width: 100%;
        height: 100%;
	        display: block;
	        object-fit: cover;
	      }
	      .diagram-media.silhouette-media img,
	      .secondary-strip.silhouette-secondary img {
	        object-fit: contain;
	        object-position: center;
	      }
      .diagram-svg {
        width: 100%;
        height: auto;
      }
      .secondary-strip {
        margin-top: 12px;
        aspect-ratio: 4 / 3;
      }
      .finding-list {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 24px 32px;
      }
      .finding-list > div {
        display: contents;
      }
      .finding-list p {
        font-size: 15px;
        line-height: 1.75;
        opacity: 0.92;
        margin: 0;
      }
      .quote-rule {
        margin: 40px 0 24px;
      }
      .diagnosis-quote {
        font-size: 24px;
        opacity: 0.75;
        line-height: 1.5;
      }
      .chromatic-inner {
        margin-top: 70px;
      }
      .chromatic-map {
        display: grid;
        grid-template-columns: minmax(260px, 0.82fr) 1.18fr;
        gap: 36px;
        align-items: stretch;
        margin-top: 42px;
      }
      .axis-portrait {
        min-height: 360px;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid rgba(244, 239, 229, 0.18);
        background: rgba(244, 239, 229, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .axis-portrait img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .chromatic-axes {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .axis-block {
        margin: 48px 0 56px;
      }
      .axis-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 18px;
      }
      .axis-head.small {
        margin-bottom: 14px;
      }
      .axis-value {
        font-size: 28px;
      }
      .axis-image {
        width: 100%;
        max-height: 220px;
        object-fit: contain;
        border-radius: 14px;
        border: 1px solid rgba(244, 239, 229, 0.18);
        background: rgba(244, 239, 229, 0.08);
      }
      .undertone-bar {
        position: relative;
        height: 64px;
        border-radius: 12px;
        background: linear-gradient(90deg, #8FA8C0 0%, #B8B5A8 50%, #D4B896 100%);
        border: 1px solid rgba(244, 239, 229, 0.18);
      }
      .undertone-marker {
        position: absolute;
        left: 72%;
        top: -12px;
        bottom: -12px;
        width: 2px;
        background: ${IVORY};
      }
      .undertone-marker::before,
      .undertone-marker::after {
        content: '';
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${IVORY};
      }
      .undertone-marker::before { top: -10px; }
      .undertone-marker::after { bottom: -10px; }
      .axis-scale {
        display: flex;
        justify-content: space-between;
        margin-top: 14px;
        font-size: 10px;
        text-transform: uppercase;
      }
      .mini-axis-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      .mini-axis-value {
        font-size: 22px;
      }
      .bars {
        display: flex;
        gap: 4px;
        height: 42px;
        align-items: end;
      }
      .bars span {
        flex: 1;
        background: rgba(244, 239, 229, 0.22);
        border-radius: 4px 4px 2px 2px;
      }
      .bars span.active {
        background: ${IVORY};
      }
      .chromatic-secondary {
        max-height: 180px;
        object-fit: cover;
      }
      .proportion-inner {
        margin-top: 78px;
        display: grid;
        grid-template-columns: 0.84fr 1.16fr;
        gap: 46px;
      }
      .proportion-inner h2 span {
        display: block;
        font-size: clamp(48px, 7vw, 82px);
      }
      .proportion-card-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .proportion-card {
        padding: 24px;
      }
      .proportion-card h3 {
        font-size: 26px;
        margin: 12px 0;
      }
      .proportion-card p {
        font-size: 13px;
        line-height: 1.65;
        opacity: 0.78;
        margin: 0;
      }
      .palette-inner h2 {
        display: flex;
        align-items: baseline;
        gap: 28px;
      }
      .palette-inner h2 span:first-child {
        font-size: clamp(64px, 9vw, 92px);
      }
      .palette-inner h2 span:last-child {
        font-size: clamp(28px, 4vw, 36px);
        opacity: 0.6;
      }
      .palette-intro {
        max-width: 520px;
        margin: 24px 0 42px;
      }
      .palette-section .rule {
        margin: 36px 0 20px;
      }
      .palette-heading {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 20px;
        text-transform: uppercase;
      }
      .premium-swatches {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;
      }
      .swatch-tile {
        aspect-ratio: 1 / 1.15;
        border-radius: 14px;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
      }
      .swatch-code {
        font-size: 9px;
        opacity: 0.5;
        margin-top: 8px;
      }
      .swatch-name {
        font-size: 13px;
        margin-top: 2px;
      }
      .premium-swatch p {
        font-size: 10px;
        line-height: 1.45;
        opacity: 0.58;
        margin: 6px 0 0;
      }
      .rule-layout {
        margin-top: 78px;
        display: grid;
        grid-template-columns: 0.8fr 1.2fr;
        gap: 44px;
      }
      .rule-card-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .premium-rule-card .why {
        opacity: 0.9;
      }
      .reference-images {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 28px;
      }
      .reference-images img {
        aspect-ratio: 4 / 5;
        object-fit: cover;
      }
      .hair-inner {
        margin-top: 72px;
      }
      .hair-copy {
        display: grid;
        grid-template-columns: 0.9fr 1.1fr;
        gap: 44px;
        align-items: end;
      }
      .hair-copy h2 {
        margin: 0;
      }
      .hair-copy h2 span {
        display: block;
        font-size: clamp(44px, 7vw, 76px);
      }
      .hair-copy p {
        font-size: 14px;
        line-height: 1.7;
        opacity: 0.72;
        margin: 24px 0 0;
      }
      .face-visuals {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        margin-top: 34px;
      }
      .face-panel {
        background: rgba(44, 38, 34, 0.04);
        border: 1px solid rgba(44, 38, 34, 0.08);
        border-radius: 18px;
        padding: 16px;
      }
      .face-panel-media {
        aspect-ratio: 394 / 506;
        border-radius: 12px;
        margin-top: 12px;
        background: rgba(244, 239, 229, 0.28);
      }
      .face-panel-media img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        border-radius: 12px;
        display: block;
      }
      .face-panel-media .face-grid-fallback {
        width: 100%;
        height: 100%;
        border-radius: 12px;
      }
      .face-grid-fallback {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .face-grid-fallback span {
        border-radius: 12px;
        background: linear-gradient(160deg, ${SLATE_LIGHT}, ${SLATE_DEEP});
        position: relative;
      }
      .face-grid-fallback i {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 34%;
        height: 44%;
        transform: translate(-50%, -45%);
        border-radius: 50% 50% 42% 42%;
        border: 1px solid rgba(244, 239, 229, 0.65);
      }
      .hair-card-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-top: 18px;
      }
      .capsule-map {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-top: 36px;
      }
      .capsule-card {
        border-top: 1px solid rgba(44, 38, 34, 0.16);
        padding-top: 18px;
      }
      .capsule-card img {
        width: 100%;
        aspect-ratio: 4 / 5;
        object-fit: cover;
        border-radius: 18px;
        margin-bottom: 16px;
      }
      .capsule-card h3 {
        font-size: 24px;
        margin: 8px 0;
      }
      .capsule-card p {
        font-size: 12px;
        line-height: 1.6;
        opacity: 0.66;
      }
      .outfit-page {
        min-height: 820px;
      }
      .outfit-hero {
        margin-top: 70px;
        display: grid;
        grid-template-columns: 1.05fr 1fr;
        gap: 56px;
      }
      .outfit-no {
        font-size: 18px;
        opacity: 0.5;
      }
      .outfit-copy h2 span {
        font-size: clamp(58px, 8vw, 96px);
      }
      .outfit-quote {
        font-size: 20px;
        opacity: 0.7;
        line-height: 1.5;
        max-width: 400px;
        margin: 32px 0;
      }
      .outfit-meta {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 14px 24px;
        margin-top: 28px;
      }
      .outfit-meta p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }
      .swatch-dot {
        display: inline-block;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 1px solid rgba(44, 38, 34, 0.08);
        vertical-align: middle;
        margin-right: 6px;
      }
      .flatlay-frame {
        background: linear-gradient(160deg, ${SLATE} 0%, ${SLATE_DEEP} 100%);
        border-radius: 24px;
        padding: 20px;
        aspect-ratio: 2 / 3;
        position: relative;
        overflow: hidden;
        color: ${IVORY};
      }
      .flatlay-media {
        height: calc(100% - 28px);
        margin-top: 6px;
        border-radius: 16px;
      }
      .flatlay-media img,
      .flatlay-media .outfit-svg {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        border-radius: 16px;
        display: block;
      }
      .outfit-svg {
        width: 100%;
        height: auto;
      }
      .detail-image {
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 18px;
        margin-top: 12px;
      }
      .formula-rule {
        margin: 48px 0 32px;
      }
      .formula-label {
        font-size: 10px;
        margin-bottom: 24px;
        text-transform: uppercase;
      }
      .formula-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
      }
      .formula-card {
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(44, 38, 34, 0.08);
        border-radius: 16px;
        padding: 20px 18px;
      }
      .formula-card .swatch-dot {
        width: 32px;
        height: 32px;
        display: block;
        margin-bottom: 14px;
      }
      .formula-card h3 {
        font-size: 17px;
        line-height: 1.2;
        margin: 8px 0;
      }
      .formula-card p {
        font-size: 11px;
        opacity: 0.58;
        line-height: 1.5;
        margin: 10px 0 0;
      }
      .matrix-grid {
        margin-top: 78px;
        display: grid;
        grid-template-columns: 0.9fr 1.1fr;
        gap: 46px;
      }
      .matrix-image {
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 24px;
        margin-top: 28px;
        border: 1px solid rgba(244, 239, 229, 0.16);
        background: rgba(244, 239, 229, 0.08);
      }
      .matrix-image img,
      .matrix-image .node-map {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .matrix-image .node-map {
        margin-top: 0;
      }
      .node-map {
        position: relative;
        height: 320px;
        margin-top: 40px;
      }
      .node-map span {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${IVORY};
        transform-origin: 0 0;
      }
      .node-center {
        position: absolute;
        left: calc(50% - 24px);
        top: calc(50% - 24px);
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: ${IVORY};
      }
      .matrix-table {
        background: rgba(244, 239, 229, 0.08);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(244, 239, 229, 0.16);
        border-radius: 20px;
        padding: 20px 24px;
      }
      .matrix-table > div {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        padding: 14px 0;
        border-bottom: 1px solid rgba(244, 239, 229, 0.16);
      }
      .matrix-table > div:last-child {
        border-bottom: 0;
      }
      .matrix-table strong {
        display: block;
        margin-top: 4px;
      }
      .matrix-table span {
        font-size: 13px;
        line-height: 1.5;
        opacity: 0.72;
      }
      .continuation-page {
        min-height: 620px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .continuation-inner {
        max-width: 720px;
        margin: 0 auto;
        text-align: center;
      }
      .continuation-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(260px, 0.72fr);
        align-items: center;
        gap: 48px;
        width: 100%;
      }
      .continuation-copy {
        text-align: left;
      }
      .continuation-inner .continuation-copy {
        text-align: center;
      }
      .continuation-image {
        aspect-ratio: 2 / 3;
        border-radius: 28px;
        overflow: hidden;
        border: 1px solid rgba(244, 239, 229, 0.16);
        box-shadow: 0 24px 70px rgba(44, 38, 34, 0.18);
      }
      .continuation-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .continuation-image .outfit-svg {
        width: 100%;
        height: 100%;
        display: block;
        background: linear-gradient(160deg, ${SLATE} 0%, ${SLATE_DEEP} 100%);
      }
      .continuation-inner .note {
        font-size: 20px;
        opacity: 0.65;
        margin-bottom: 28px;
      }
      .continuation-copy .note {
        font-size: 20px;
        opacity: 0.65;
        margin-bottom: 28px;
      }
      .continuation-inner h2 span {
        font-size: clamp(44px, 7vw, 64px);
      }
      .continuation-copy h2 span {
        font-size: clamp(40px, 6vw, 58px);
      }
      .continuation-inner p {
        font-size: 15px;
        line-height: 1.85;
        opacity: 0.82;
        margin: 44px auto 0;
        max-width: 520px;
      }
      .continuation-copy p {
        font-size: 15px;
        line-height: 1.85;
        opacity: 0.82;
        margin: 36px 0 0;
        max-width: 520px;
      }
      .edit-pill {
        display: inline-flex;
        align-items: center;
        gap: 24px;
        margin-top: 48px;
        padding: 22px 36px;
        background: rgba(244, 239, 229, 0.08);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(244, 239, 229, 0.18);
        border-radius: 100px;
      }
      .edit-pill .display {
        font-size: 36px;
      }
      .edit-pill span {
        font-size: 14px;
        opacity: 0.6;
        margin-left: 2px;
      }
      .edit-pill i {
        width: 1px;
        height: 28px;
        background: rgba(244, 239, 229, 0.25);
      }
      .edit-pill .display-it {
        font-size: 18px;
      }
      .short-rule {
        width: 80px;
        height: 1px;
        background: currentColor;
        opacity: 0.18;
        margin: 64px auto 28px;
      }
      .tagline {
        font-size: 16px;
        opacity: 0.7;
      }

      @media (max-width: 900px) {
        .iconik-report {
          padding: 0;
        }
        .iconik-page {
          border-radius: 0;
          margin-bottom: 0;
          padding: 72px 20px 44px;
          min-height: auto;
        }
        .corner-tl, .corner-tr {
          top: 20px;
        }
        .corner-tl {
          left: 20px;
        }
        .corner-tr {
          right: 20px;
        }
        .summary-grid,
        .diagnosis-grid,
        .rule-layout,
        .chromatic-map,
        .proportion-inner,
        .hair-copy,
        .outfit-hero,
        .matrix-grid {
          grid-template-columns: 1fr;
          gap: 28px;
        }
        .summary-rail {
          border-right: 0;
          border-bottom: 1px solid rgba(44, 38, 34, 0.12);
          padding: 0 0 20px;
        }
        .dossier-cards,
        .reading-blocks,
        .rule-card-grid,
        .proportion-card-grid,
        .face-visuals,
        .hair-card-grid,
        .capsule-map,
        .mini-axis-grid,
        .reference-images {
          grid-template-columns: 1fr;
        }
        .premium-swatches,
        .formula-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .palette-inner h2 {
          display: block;
        }
        .cover-center {
          position: relative;
          top: auto;
          left: auto;
          right: auto;
          padding: 140px 0 32px;
        }
        .cover-portrait {
          position: relative;
          right: auto;
          bottom: auto;
          width: min(72%, 260px);
          margin: 0 auto 96px;
        }
        .continuation-layout {
          grid-template-columns: 1fr;
          gap: 32px;
        }
        .continuation-copy {
          text-align: center;
        }
        .continuation-image {
          width: min(78%, 280px);
          margin: 0 auto;
        }
        .finding-list,
        .outfit-meta {
          grid-template-columns: 1fr;
          gap: 8px;
        }
      }
    `}</style>
  );
}
