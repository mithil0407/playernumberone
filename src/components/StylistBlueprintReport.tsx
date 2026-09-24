'use client';

import type {
  BlueprintBlock,
  BlueprintColourUse,
  BlueprintPage,
  LegacyStylistBlueprintReportData,
  SilhouetteProofOutfit,
  StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';
import {
  getStylistBlueprintAuditPage,
  getStylistBlueprintAvoidancePage,
  getStylistBlueprintBodyGeometryPage,
  getStylistBlueprintChromaticPage,
  getStylistBlueprintColourDrapePage,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintEyeframePage,
  getStylistBlueprintFabricPage,
  getStylistBlueprintFaceArchitecturePage,
  getStylistBlueprintHairColourPage,
  getStylistBlueprintHairFaceAccessoriesPage,
  getStylistBlueprintHairstylePage,
  getStylistBlueprintMakeupPage,
  getStylistBlueprintMatrixPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintOutfitSystemPage,
  getStylistBlueprintPageCount,
  getStylistBlueprintPalettePage,
  getStylistBlueprintProportionPage,
  getStylistBlueprintReadingGuidePage,
  getStylistBlueprintRulesStartPage,
  getStylistBlueprintSummaryPage,
  getStylistBlueprintShoppingPlanPage,
  getStylistBlueprintStudioGuidePages,
  getStylistBlueprintTransformationPage,
  getStylistBlueprintSectionLabel,
  getVisibleStylistBlueprintPages,
  isVersionedStylistBlueprintReportData as isVersionedStylistBlueprintReportDataShared,
} from '@/lib/stylistBlueprintSchema';
import type { ResolvedStylistBlueprintImageUrls, StylistBlueprintImageSlotKey } from '@/lib/stylistBlueprintImageGenerator';
import { reportHairstyles, withHairstyleEdit } from '@/lib/stylistHairstyleGuide';
import { createContext, type ElementType, type FocusEvent, type FormEvent, type ReactNode, type Ref, useContext, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ImageCropSource } from '@/components/ImageCropDialog';

// Studio-only image editing. Clients never mount these, so they never download them.
const ImageCropDialog = dynamic(() => import('@/components/ImageCropDialog'), { ssr: false });
const ImageSlotStudioTools = dynamic(() => import('@/components/ImageSlotStudioTools'), { ssr: false });

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
  /**
   * Admin-only. The client report never passes these, so a prompt cannot reach
   * a client view even by mistake — there is nothing for it to render.
   */
  imagePrompts?: Partial<Record<StylistBlueprintImageSlotKey, string>>;
  onImageUpload?: (slotKey: StylistBlueprintImageSlotKey, file: File) => void | boolean | Promise<void | boolean>;
  uploadingImageSlot?: StylistBlueprintImageSlotKey | null;
  reportData?: StylistBlueprintReportData;
  visibleTotalPages?: number;
  visiblePageNumbers?: number[];
};

const EditableReportContext = createContext<EditableReportContextValue>({ editable: false });

/**
 * A caret-safe inline editor. `onCommit` receives the trimmed text whenever it
 * differs from `value`; pages commit through `EditableText`, report-level data
 * (the cover name, the hair page) through their own callback.
 */
function EditableNode({
  as,
  className,
  value,
  fallback = '',
  pageNumber,
  placeholder,
  onCommit,
  children,
}: {
  as?: ElementType;
  className?: string;
  value: string | undefined;
  fallback?: string;
  pageNumber: number;
  /** Shown while the field is empty; never saved. */
  placeholder?: string;
  onCommit: (value: string) => void;
  children?: ReactNode;
}) {
  const { editable } = useContext(EditableReportContext);
  const Component = as ?? 'span';
  const elementRef = useRef<HTMLElement | null>(null);
  const commitTimerRef = useRef<number | undefined>(undefined);
  const incoming = value ?? fallback;
  const incomingRef = useRef(incoming);
  incomingRef.current = incoming;
  // Captured once. After mount the browser owns this node's text, not React:
  // re-rendering children under a live caret is what sent the cursor back to
  // the start of the field whenever a save landed mid-sentence.
  const initialRef = useRef(incoming);

  // Pull server-side changes (a regenerated page, an undo) into the DOM, but
  // never into the field the stylist is currently typing in.
  useEffect(() => {
    const element = elementRef.current;
    if (!element || document.activeElement === element) return;
    if (element.innerText === incoming) return;
    element.innerText = incoming;
  }, [incoming]);

  useEffect(() => () => window.clearTimeout(commitTimerRef.current), []);

  if (!editable) return <Component className={className}>{children ?? value ?? fallback}</Component>;

  // Commit while typing, not only on blur. Blur-only meant nothing reached
  // React state — and so nothing reached the autosave — until the stylist
  // clicked away, and an edit typed just before a reload or a toolbar action
  // was simply lost.
  const commit = (next: string) => {
    const trimmed = next.trim();
    if (trimmed === incomingRef.current) return;
    onCommit(trimmed);
  };

  return (
    <Component
      ref={elementRef as Ref<HTMLElement>}
      className={className}
      contentEditable
      data-page-number={pageNumber}
      data-placeholder={placeholder}
      suppressContentEditableWarning
      onInput={(event: FormEvent<HTMLElement>) => {
        const next = event.currentTarget.innerText;
        window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = window.setTimeout(() => commit(next), 400);
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        window.clearTimeout(commitTimerRef.current);
        commit(event.currentTarget.innerText);
      }}
      // Line breaks the stylist types are kept in the stored string, so they
      // have to survive rendering too.
      style={{ outline: 'none', whiteSpace: 'pre-wrap' }}
    >
      {initialRef.current}
    </Component>
  );
}

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
  const { onPageChange } = useContext(EditableReportContext);
  return (
    <EditableNode as={as} className={className} value={value} fallback={fallback} pageNumber={page.page_number} onCommit={next => onPageChange?.(update(next))}>
      {children}
    </EditableNode>
  );
}

function updateBlock(page: BlueprintPage, index: number, patch: Partial<BlueprintBlock>) {
  return {
    ...page,
    blocks: page.blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...patch } : block),
  };
}

function updateItem(page: BlueprintPage, blockIndex: number, itemIndex: number, patch: Record<string, unknown>): BlueprintPage {
  return {
    ...page,
    blocks: page.blocks.map((block, bi) => {
      if (bi !== blockIndex) return block;
      const items = Array.isArray(block.items) ? block.items : [];
      return {
        ...block,
        items: items.map((item, ii) => ii !== itemIndex ? item : { ...(item && typeof item === 'object' ? item : {}), ...patch }),
      };
    }),
  };
}

// Returns the outfit formula items plus, when they map 1:1 to a real items
// array on a single block, the block index so each piece can be edited inline.
function formulaItemsForOutfit(page: BlueprintPage): { items: unknown[]; blockIndex: number; editable: boolean } {
  let blockIndex = page.blocks.findIndex(block => /formula|piece|look|outfit/i.test(`${block.label} ${block.heading}`));
  if (blockIndex < 0) blockIndex = page.blocks.findIndex(block => asItems(block).length >= 3);
  const rawItems = blockIndex >= 0 ? asItems(page.blocks[blockIndex]) : [];
  const objectItem = rawItems.length === 1 && isObject(rawItems[0]) ? rawItems[0] : null;
  const isSlotSource = objectItem && OUTFIT_SLOT_KEYS.some(key => objectItem[key] !== undefined);
  if (rawItems.length && !isSlotSource) {
    return { items: rawItems.slice(0, 9), blockIndex, editable: true };
  }
  return { items: normaliseFormulaItems(page), blockIndex: -1, editable: false };
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
  const {
    onImageRegenerate,
    regeneratingImageSlot,
    imageRegenerationDisabled,
    imagePrompts,
    onImageUpload,
    uploadingImageSlot,
  } = useContext(EditableReportContext);
  const canRegenerate = Boolean(onImageRegenerate);
  const isRegenerating = regeneratingImageSlot === slotKey;
  const disabled = Boolean(imageRegenerationDisabled || (regeneratingImageSlot && !isRegenerating));

  const prompt = imagePrompts?.[slotKey];
  const canUpload = Boolean(onImageUpload);
  // Studio tools appear only when the report studio passes editing handlers; the client report passes none.
  const isStudio = canUpload || canRegenerate || Boolean(prompt);
  const isUploading = uploadingImageSlot === slotKey;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cropSource, setCropSource] = useState<ImageCropSource | null>(null);
  const [cropAspect, setCropAspect] = useState<number | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  useEffect(() => {
    if (!isStudio) return;
    // The slot's children decide what is shown, so read the rendered image rather than threading URLs through every page.
    const image = frameRef.current?.querySelector<HTMLImageElement>(':scope > img');
    const next = image?.currentSrc || image?.src || '';
    if (next !== currentImageUrl) setCurrentImageUrl(next);
  }, [isStudio, children, currentImageUrl]);

  const uploadDisabledReason = uploadingImageSlot
    ? isUploading ? 'Saving this photo…' : 'Wait for the other photo to finish saving.'
    : disabled ? 'Available once the report has finished generating.' : '';
  const regenerateDisabledReason = isRegenerating ? 'Creating a new image…' : disabled ? 'Available once the report has finished generating.' : '';

  const openCropper = (source: ImageCropSource) => {
    if (!onImageUpload || uploadDisabledReason) return;
    const rect = frameRef.current?.getBoundingClientRect();
    setCropAspect(rect && rect.width > 8 && rect.height > 8 ? rect.width / rect.height : null);
    setCropSource(source);
  };
  const acceptFile = (file: File | null | undefined) => {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return;
    openCropper({ kind: 'file', file });
  };
  const uploadCropped = async (file: File) => {
    if (!onImageUpload) return false;
    if ((await onImageUpload(slotKey, file)) === false) return false;
    setCropSource(null);
  };

  return (
    <div
      ref={frameRef}
      data-image-slot={slotKey}
      className={`image-slot-frame ${className} ${isStudio ? 'is-studio-slot' : ''} ${dragging ? 'slot-dragging' : ''}`}
      onDragOver={canUpload ? event => { event.preventDefault(); setDragging(true); } : undefined}
      onDragLeave={canUpload ? () => setDragging(false) : undefined}
      onDrop={canUpload ? event => {
        event.preventDefault();
        setDragging(false);
        acceptFile(event.dataTransfer?.files?.[0]);
      } : undefined}
    >
      {children}
      {dragging && <div className="slot-drop-hint">Drop to {currentImageUrl ? 'replace' : 'add'} photo</div>}
      {canUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={event => { acceptFile(event.target.files?.[0]); event.currentTarget.value = ''; }}
        />
      )}
      {isStudio && (
        <ImageSlotStudioTools
          frameRef={frameRef}
          label={label}
          hasImage={Boolean(currentImageUrl)}
          prompt={prompt}
          canUpload={canUpload}
          canRegenerate={canRegenerate}
          isUploading={isUploading}
          isRegenerating={isRegenerating}
          uploadDisabledReason={uploadDisabledReason}
          regenerateDisabledReason={regenerateDisabledReason}
          onUpload={() => inputRef.current?.click()}
          onCrop={() => currentImageUrl && openCropper({ kind: 'url', url: currentImageUrl })}
          onRegenerate={() => { void onImageRegenerate?.(slotKey); }}
        />
      )}
      {cropSource && (
        <ImageCropDialog
          source={cropSource}
          frameAspect={cropAspect}
          title={cropSource.kind === 'url' ? 'Crop this image' : 'Crop before uploading'}
          subtitle={`${label.charAt(0).toUpperCase()}${label.slice(1)} · drag to position, scroll or pinch to zoom`}
          confirmLabel={cropSource.kind === 'url' ? 'Save crop' : 'Crop & upload'}
          onCancel={() => setCropSource(null)}
          onConfirm={uploadCropped}
          onUseOriginal={uploadCropped}
        />
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

const HIDDEN_SUMMARY_FIELDS = new Set([
  'structural_notes',
  'image_prompt',
  'prompt',
  'generation_prompt',
  'visual_prompt',
  'colour_hex',
  'hex',
  'palette_role',
  'image_slot',
  'slot',
  'example_outfit',
]);

/** Joins separate rules into readable prose instead of one run-on line. */
function sentenceList(values: string[] | null | undefined) {
  return (values ?? [])
    .map(value => value.trim())
    .filter(Boolean)
    .map(value => (/[.!?]$/.test(value) ? value : `${value}.`))
    .join(' ');
}

/**
 * Intake focus areas are checkbox labels ("Hips/Thighs"), never prose. This
 * wraps them in a sentence so they are readable wherever body copy is required;
 * where the layout allows, prefer rendering them as chips instead.
 */
function focusAreaSentence(data: StylistBlueprintReportData) {
  const areas = data.analysis.proportional_focus.map(area => area.trim().toLowerCase()).filter(Boolean);
  if (!areas.length) return data.classification.body.proportion_directive;
  const list = areas.length === 1
    ? areas[0]
    : `${areas.slice(0, -1).join(', ')} and ${areas[areas.length - 1]}`;
  return `Your outfits are built around ${list}. ${data.classification.body.proportion_directive}`;
}

/**
 * The large italic quote on diagnosis pages. It used to read `page.subtitle`,
 * which is also the second half of the page headline, so the same string was
 * printed twice and editing one silently rewrote the other. It now has its own
 * field, and refuses anything that is not a real sentence — joined intake
 * fragments such as "Hips/Thighs. Mid-section definition" are never a quote.
 */
function pullQuoteFor(page: BlueprintPage, data: StylistBlueprintReportData, fallback?: string) {
  const quote = page.pull_quote?.trim();
  if (quote) return quote;
  const candidate = (fallback ?? '').trim();
  if (isClientSentence(candidate)) return candidate;
  return data.classification.body.proportion_directive;
}

/** A sentence a client can read aloud, not a label or a joined list. */
function isClientSentence(value: string) {
  const text = value.trim();
  if (text.split(/\s+/).length < 5) return false;
  return !/[\/|]|\s-\s/.test(text);
}

// Order matters: this is the sequence the fields read in as a sentence.
const SUMMARY_FIELD_ORDER = [
  'question',
  'answer',
  'name',
  'piece',
  'heading',
  'rule',
  'guidance',
  'recommendation',
  'body',
  'note',
  'reason',
  'why',
];

function summaryFieldValue(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(summaryFieldValue).filter(Boolean).join(', ');
  if (isObject(value)) return objectSummary(value);
  return '';
}

/**
 * Renders a structured item as client-readable prose. It used to emit
 * "name: X - guidance: Y - reason: Z", which put our own schema keys in front of
 * the client on every fallback path — the exact thing the generation prompt
 * forbids the model from doing. Keys are now dropped and the values are joined
 * as sentences.
 */
function objectSummary(item: unknown): string {
  if (typeof item === 'string') return item;
  if (!isObject(item)) return String(item ?? '');
  const seen = new Set<string>();
  const ordered = [
    ...SUMMARY_FIELD_ORDER.filter(key => key in item),
    ...Object.keys(item).filter(key => !SUMMARY_FIELD_ORDER.includes(key)),
  ];
  const parts: string[] = [];
  for (const key of ordered) {
    if (HIDDEN_SUMMARY_FIELDS.has(key) || seen.has(key)) continue;
    seen.add(key);
    const text = summaryFieldValue(item[key]);
    if (!text) continue;
    parts.push(/[.!?]$/.test(text) ? text : `${text}.`);
  }
  return parts.join(' ');
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
  'eyewear',
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

  if (rawItems.length) return rawItems.slice(0, 9);

  return page.blocks
    .filter(block => block.heading || block.label || block.body || block.reason)
    .slice(0, 9);
}

function splitDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] || 'Your', rest: 'Blueprint' };
  return { first: parts.slice(0, -1).join(' '), rest: parts.at(-1) || '' };
}

/**
 * The cover prints the client's name at 80px, so it has to be typed the way she
 * would write it. Intake gives us whatever the stylist entered — "dr swathi v s"
 * — and honorifics need their own casing rather than the generic title-case.
 */
const HONORIFICS: Record<string, string> = {
  dr: 'Dr', 'dr.': 'Dr', mr: 'Mr', 'mr.': 'Mr', mrs: 'Mrs', 'mrs.': 'Mrs',
  ms: 'Ms', 'ms.': 'Ms', prof: 'Prof', 'prof.': 'Prof',
};

function coverName(raw: string) {
  const parts = (raw ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!parts.length) return 'Your Blueprint';
  return parts
    .map((word, index) => {
      const honorific = index === 0 ? HONORIFICS[word.toLowerCase()] : undefined;
      if (honorific) return honorific;
      // A lone letter is an initial: "v s" -> "V S".
      if (word.length === 1) return word.toUpperCase();
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function pageClass(pageNumber: number, pageType: BlueprintPage['page_type']) {
  if (pageNumber === 1 || pageType === 'continuation' || pageType === 'matrix') return 'slate';
  if (pageType === 'transformation') return 'slate-deep';
  if (pageType === 'colour_drape' || pageType === 'hair' || pageType === 'hair_colour' || pageType === 'eyewear' || pageType === 'makeup') return 'ivory';
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
  if (pageNumber === getStylistBlueprintTransformationPage(data)) return 'transformation';
  if (pageNumber === getStylistBlueprintSummaryPage(data)) return 'summary';
  if (pageNumber === getStylistBlueprintReadingGuidePage(data)) return 'reading_guide';
  if ([
    getStylistBlueprintBodyGeometryPage(data),
    getStylistBlueprintChromaticPage(data),
    getStylistBlueprintFaceArchitecturePage(data),
    getStylistBlueprintProportionPage(data),
  ].includes(pageNumber)) return 'diagnosis';
  if (pageNumber === getStylistBlueprintAvoidancePage(data)) return 'avoidance';
  if (pageNumber === getStylistBlueprintPalettePage(data)) return 'palette';
  if (pageNumber === getStylistBlueprintColourDrapePage(data)) return 'colour_drape';
  if (pageNumber === getStylistBlueprintHairstylePage(data)) return 'hair';
  if (pageNumber === getStylistBlueprintHairColourPage(data)) return 'hair_colour';
  if (pageNumber === getStylistBlueprintEyeframePage(data)) return 'eyewear';
  if (pageNumber === getStylistBlueprintMakeupPage(data)) return 'makeup';
  if ([getStylistBlueprintRulesStartPage(data), getStylistBlueprintHairFaceAccessoriesPage(data)].includes(pageNumber)) return 'rules';
  if (pageNumber === getStylistBlueprintFabricPage(data)) return 'fabric';
  if (getStylistBlueprintStudioGuidePages(data).some(guide => guide.page === pageNumber)) return 'wardrobe_guide';
  if (pageNumber === getStylistBlueprintOutfitSystemPage(data)) return 'outfit_system';
  if (pageNumber >= getStylistBlueprintOutfitStartPage(data) && pageNumber <= getStylistBlueprintOutfitEndPage(data)) return 'outfit';
  if (pageNumber === getStylistBlueprintMatrixPage(data)) return 'matrix';
  if (pageNumber === getStylistBlueprintAuditPage(data)) return 'audit';
  if (pageNumber === getStylistBlueprintShoppingPlanPage(data)) return 'shopping_plan';
  if (pageNumber === getStylistBlueprintContinuationPage(data)) return 'continuation';
  return page.page_type;
}

/**
 * Section label in the page corner. These used to be our internal pipeline
 * stage names ("Pillar 03", "Act II - Prescription"), which mean nothing to a
 * client.
 */
function pageKicker(page: BlueprintPage, data?: StylistBlueprintReportData) {
  return getStylistBlueprintSectionLabel(page.page_number, data);
}

function imageForPage(page: BlueprintPage, imageUrls?: ResolvedStylistBlueprintImageUrls | null, data?: StylistBlueprintReportData) {
  const images = imageUrls;
  const continuationPage = getStylistBlueprintContinuationPage(data);
  const outfitEndPage = getStylistBlueprintOutfitEndPage(data);
  if (page.page_number === getStylistBlueprintBodyGeometryPage(data)) return images?.diagnosis?.silhouetteFront ?? null;
  if (page.page_number === getStylistBlueprintChromaticPage(data)) return images?.diagnosis?.undertoneMap ?? null;
  if (page.page_number === getStylistBlueprintFaceArchitecturePage(data)) return images?.diagnosis?.faceShapeDiagram ?? null;
  if (page.page_number === getStylistBlueprintColourDrapePage(data)) return images?.prescription?.colourDrapeComparison ?? null;
  if (page.page_number === getStylistBlueprintHairstylePage(data)) return images?.prescription?.hairDirections ?? null;
  if (page.page_number === getStylistBlueprintHairColourPage(data)) return images?.prescription?.hairColourDirections ?? null;
  if (page.page_number === getStylistBlueprintEyeframePage(data)) return images?.prescription?.eyewearFrames ?? null;
  if (page.page_number === getStylistBlueprintMakeupPage(data)) return images?.prescription?.makeupLook ?? null;
  if (page.page_number === getStylistBlueprintHairFaceAccessoriesPage(data)) return images?.prescription?.hairDirections ?? null;
  if (page.page_number === continuationPage) return images?.closing?.editTeaser ?? null;
  if (page.page_number >= getStylistBlueprintOutfitStartPage(data) && page.page_number <= outfitEndPage) {
    return images?.application?.outfitFlatlays?.[page.page_number - getStylistBlueprintOutfitStartPage(data)] ?? null;
  }
  return null;
}

function secondaryImageForPage(page: BlueprintPage, imageUrls?: ResolvedStylistBlueprintImageUrls | null, data?: StylistBlueprintReportData) {
  if (page.page_number >= getStylistBlueprintOutfitStartPage(data) && page.page_number <= getStylistBlueprintOutfitEndPage(data)) return null;
  if (page.page_number === getStylistBlueprintBodyGeometryPage(data)) return imageUrls?.diagnosis?.silhouetteSide ?? null;
  if (page.page_number === getStylistBlueprintHairFaceAccessoriesPage(data)) return imageUrls?.prescription?.eyewearFrames ?? null;
  return null;
}

function imageSlotForPage(page: BlueprintPage, data?: StylistBlueprintReportData): StylistBlueprintImageSlotKey | null {
  const continuationPage = getStylistBlueprintContinuationPage(data);
  const outfitEndPage = getStylistBlueprintOutfitEndPage(data);
  if (page.page_number === getStylistBlueprintBodyGeometryPage(data)) return 'diagnosis.silhouetteFront';
  if (page.page_number === getStylistBlueprintChromaticPage(data)) return 'diagnosis.undertoneMap';
  if (page.page_number === getStylistBlueprintFaceArchitecturePage(data)) return 'diagnosis.faceShapeDiagram';
  if (page.page_number === getStylistBlueprintColourDrapePage(data)) return 'prescription.colourDrapeComparison';
  if (page.page_number === getStylistBlueprintHairstylePage(data)) return 'prescription.hairDirections';
  if (page.page_number === getStylistBlueprintHairColourPage(data)) return 'prescription.hairColourDirections';
  if (page.page_number === getStylistBlueprintEyeframePage(data)) return 'prescription.eyewearFrames';
  if (page.page_number === getStylistBlueprintMakeupPage(data)) return 'prescription.makeupLook';
  if (page.page_number === getStylistBlueprintHairFaceAccessoriesPage(data)) return 'prescription.hairDirections';
  if (page.page_number === continuationPage) return 'closing.editTeaser';
  if (page.page_number >= getStylistBlueprintOutfitStartPage(data) && page.page_number <= outfitEndPage) {
    return `application.outfitFlatlays.${page.page_number - getStylistBlueprintOutfitStartPage(data)}` as StylistBlueprintImageSlotKey;
  }
  return null;
}

function secondaryImageSlotForPage(page: BlueprintPage, data?: StylistBlueprintReportData): StylistBlueprintImageSlotKey | null {
  if (page.page_number === getStylistBlueprintBodyGeometryPage(data)) return 'diagnosis.silhouetteSide';
  if (page.page_number === getStylistBlueprintHairFaceAccessoriesPage(data)) return 'prescription.eyewearFrames';
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
  const { visibleTotalPages, visiblePageNumbers } = useContext(EditableReportContext);
  const totalPages = visibleTotalPages ?? getStylistBlueprintPageCount(reportData);
  const displayPageNumber = Math.max(1, (visiblePageNumbers?.indexOf(page.page_number) ?? page.page_number - 1) + 1);
  return (
    <section
      className={`iconik-page ${pageClass(page.page_number, pageType)} ${className}`}
      data-blueprint-page-number={page.page_number}
    >
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
        <div className="mono corner-kicker">{String(displayPageNumber).padStart(2, '0')} / {totalPages}</div>
      </div>
      {children}
    </section>
  );
}

function CoverPage({ page, data }: { page: BlueprintPage; data: StylistBlueprintReportData }) {
  const { editable, onReportDataChange, visibleTotalPages } = useContext(EditableReportContext);
  const totalPages = visibleTotalPages ?? getStylistBlueprintPageCount(data);
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
    <section className="iconik-page slate cover-page" data-blueprint-page-number={page.page_number}>
      <div className="grain" />
      <div className="corner-tl">
        <div className="display wordmark">I C O N I K</div>
      </div>
      <div className="corner-tr">
        <div className="micro muted date-line">{data.client.month_year}</div>
      </div>
      <div className="cover-center">
        <div className="cover-rule">
          <span />
          <div className="micro">A Personal Blueprint</div>
          <span />
        </div>
        {/* One editable node, not two styled spans: splitting the name meant
            React rewrote both halves under the caret on every keystroke, and it
            broke "Dr Swathi V S" onto a line of its own trailing initial. */}
        <h1
          className="display cover-name"
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={event => updateDisplayName(event.currentTarget.innerText)}
          style={{ outline: 'none' }}
        >
          {coverName(data.client.display_name)}
        </h1>
        <div className="cover-tagline">
          <span className="display-it">Same body.</span>
          <span className="display-it cover-tagline-accent">Different science.</span>
        </div>
        <div className="cover-swatches" aria-hidden="true">
          {data.classification.colour.base_palette.slice(0, 9).map((colour, index) => (
            <span
              key={`${colour.hex}-${index}`}
              style={{ background: colour.hex, ['--i' as string]: index }}
            />
          ))}
        </div>
        {/* Two lines by construction, so a wrap can never strand a separator
            at the start of the second one. */}
        <div className="micro cover-caption">
          <span>{data.classification.colour.palette_name}</span>
          <span>{getStylistBlueprintOutfitCount(data)} outfits · {totalPages} pages</span>
        </div>
      </div>
      <div className="corner-br"><div className="mono corner-kicker">01 / {totalPages}</div></div>
      {/* The cover fills the first screen, so without a cue a first-time reader
          on a phone has no hint that fifty-four pages follow. */}
      {!editable && (
        <div className="cover-scroll-cue" aria-hidden="true">
          <span className="micro">Scroll</span>
          <i />
        </div>
      )}
    </section>
  );
}

function SummaryPage({ page, data }: { page: BlueprintPage; data: StylistBlueprintReportData }) {
  const colourSummary = `Your palette is built from grounded neutrals you can wear every day, plus a smaller set of colours chosen to suit your skin.`;
  const cards = [
    ['01 - YOUR SHAPE', data.analysis.silhouette_profile, 'how your body reads', firstBody(page.blocks, data.classification.body.proportion_directive)],
    ['02 - YOUR COLOURS', data.analysis.chromatic_family, `${data.classification.colour.depth} depth`, colourSummary],
    ['03 - YOUR FACE', data.classification.face_hair_accessories.face_shape, 'necklines and collars', data.classification.face_hair_accessories.face_direction],
    ['04 - YOUR STYLE', data.analysis.style_direction, data.classification.taste.moodboard, data.classification.client.lifestyle_summary],
  ];
  const focusAreas = data.analysis.proportional_focus.filter(area => area.trim());
  return (
    <PageFrame page={page} className="summary-page">
      <div className="summary-grid">
        <aside className="summary-rail">
          <div className="micro faded">In this report</div>
          <Metric label="Pages" value={String(getStylistBlueprintPageCount(data))} />
          <Metric label="Outfits" value={String(getStylistBlueprintOutfitCount(data))} />
          <Metric label="Colours" value={String(data.classification.colour.base_palette.length + data.classification.colour.accent_palette.length)} />
        </aside>
        <div className="summary-main">
          <div className="micro faded">The short version</div>
          <h2><span className="display">Four things</span><span className="display-it">we found.</span></h2>
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
            <div>
              <p className="display-it">&quot;{page.pull_quote || data.classification.body.proportion_directive}&quot;</p>
              {focusAreas.length > 0 && (
                <>
                  <div className="micro faded">What we keep coming back to</div>
                  <div className="focus-chips">
                    {focusAreas.map(area => <span key={area} className="focus-chip">{area}</span>)}
                  </div>
                </>
              )}
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

function TransformationPage({
  page,
  imageUrls,
}: {
  page: BlueprintPage;
  data: StylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
}) {
  const blocks = page.blocks.slice(0, 3);
  return (
    <PageFrame page={page} className="transformation-page">
      <div className="transformation-inner">
        <div className="transformation-grid">
          {blocks.map((block, index) => {
            const slotKey = `application.transformationLooks.${index}` as StylistBlueprintImageSlotKey;
            const image = imageUrls?.application?.transformationLooks?.[index] ?? null;
            const items = asItems(block).slice(0, 5);
            // Images only by design — this page is a visual preview, not a
            // written section.
            return (
              <div key={index} className="transformation-card">
                <div className="transformation-label">Look {index + 1}</div>
                <ImageSlotFrame slotKey={slotKey} label={`transformation look ${index + 1}`} className="transformation-media">
                  {image ? <ReportImage src={image} /> : <OutfitFallback palette={items.map(item => getField(item, ['colour_hex', 'hex'], SLATE))} />}
                </ImageSlotFrame>
              </div>
            );
          })}
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
  const { onImageRegenerate, onImageUpload } = useContext(EditableReportContext);
  const image = imageForPage(page, imageUrls, data);
  const secondary = secondaryImageForPage(page, imageUrls, data);
  const imageSlot = imageSlotForPage(page, data);
  const secondarySlot = secondaryImageSlotForPage(page, data);
  // Empty image spots appear wherever the studio can fill them. Showing them only
  // to admins (who can regenerate) left stylists blocked by a delivery check for
  // an image they had no place to upload.
  const showSecondary = Boolean(secondary || ((onImageRegenerate || onImageUpload) && secondarySlot));
  const statements = page.blocks.length ? page.blocks : [
    { label: 'What we saw', body: data.classification.body.proportion_directive },
    { label: 'What that means', body: sentenceList(data.classification.body.silhouette_rules) },
    { label: 'How we worked it out', body: sentenceList(data.analysis.evidence_notes) },
  ];

  if (page.page_number === getStylistBlueprintChromaticPage(data)) return <ChromaticPage page={page} data={data} image={image} />;
  if (page.page_number === getStylistBlueprintProportionPage(data)) return <ProportionalAxesPage page={page} data={data} />;

  return (
    <PageFrame page={page} className="diagnosis-page">
      <div className="diagnosis-grid">
        <div>
          <div className="diagram-card">
            <div className="mono figure-label">FIG. {String(page.page_number - getStylistBlueprintReadingGuidePage(data)).padStart(2, '0')} - PROFILE</div>
            {imageSlot ? (
              <ImageSlotFrame slotKey={imageSlot} label="diagnosis image" className={`diagram-media ${page.page_number === getStylistBlueprintBodyGeometryPage(data) ? 'silhouette-media' : ''}`}>
                {image ? <ReportImage src={image} /> : <SilhouetteFallback />}
              </ImageSlotFrame>
            ) : image ? <ReportImage src={image} /> : <SilhouetteFallback />}
          </div>
          {showSecondary && secondarySlot && (
            <ImageSlotFrame slotKey={secondarySlot} label="secondary diagnosis image" className={`secondary-strip ${page.page_number === getStylistBlueprintBodyGeometryPage(data) ? 'silhouette-secondary' : ''}`}>
              {secondary ? <ReportImage src={secondary} /> : <SilhouetteFallback />}
            </ImageSlotFrame>
          )}
        </div>
        <div className="diagnosis-copy">
          <h2>
            <EditableText
              page={page}
              value={page.page_number === getStylistBlueprintBodyGeometryPage(data) ? 'The body,' : page.title}
              update={value => ({ ...page, title: value })}
              className="display"
            />
            <EditableText
              page={page}
              value={page.page_number === getStylistBlueprintBodyGeometryPage(data) ? 'measured.' : page.subtitle || 'mapped.'}
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
          <p className="display-it diagnosis-quote">&quot;<EditableText page={page} value={pullQuoteFor(page, data)} update={value => ({ ...page, pull_quote: value })} />&quot;</p>
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
        <p className="display-it diagnosis-quote">&quot;{pullQuoteFor(page, data)}&quot;</p>
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
    { label: '01', heading: 'Height and line', body: data.classification.body.proportion_directive },
    { label: '02', heading: 'Width and balance', body: sentenceList(data.classification.body.silhouette_rules) },
    { label: '03', heading: 'Where the eye lands', body: focusAreaSentence(data) },
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
          <p className="display-it diagnosis-quote">&quot;{pullQuoteFor(page, data)}&quot;</p>
        </div>
        <div className="proportion-card-grid">
          {blocks.slice(0, 6).map((block, index) => (
            <div key={index} className="glass-dark proportion-card">
              <div className="mono dossier-label">{block.label || String(index + 1).padStart(2, '0')}</div>
              <EditableText
                as="h3"
                page={page}
                value={block.heading || block.label || `Point ${index + 1}`}
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

function PalettePage({ page, data }: { page: BlueprintPage; data: StylistBlueprintReportData; imageUrls?: ResolvedStylistBlueprintImageUrls | null }) {
  const base = data.classification.colour.base_palette;
  const accents = data.classification.colour.accent_palette;
  return (
    <PageFrame page={page} className="palette-page">
      <div className="palette-inner">
        <div className="palette-copy">
          <h2><span className="display">Your colours,</span><span className="display-it">and what each one is for.</span></h2>
          <p className="palette-intro">
            The first set is your everyday wardrobe: the colours to buy trousers, shirts, knitwear and coats in.
            The second set is for one piece at a time — a knit, a scarf, a bag — when you want the outfit to lift.
          </p>
          <PaletteSwatchGrid title={`Everyday colours - ${base.length} shades`} colours={base} />
          <PaletteSwatchGrid title={`Lift colours - ${accents.length} shades, one at a time`} colours={accents} />
        </div>
      </div>
    </PageFrame>
  );
}

function PaletteSwatchGrid({
  title,
  colours,
}: {
  title: string;
  colours: Array<{ name: string; hex: string; usage: string; avoid_for?: string }>;
}) {
  return (
    <div className="palette-section">
      <div className="rule" />
      <div className="palette-heading">
        <div className="mono faded">{title}</div>
      </div>
      <div className="premium-swatches">
        {colours.map((colour, index) => (
          <div key={`${colour.hex}-${index}`} className="premium-swatch">
            <div className="swatch-tile" style={{ background: colour.hex }} />
            <div className="display-it swatch-name">{colour.name}</div>
            {colour.usage && <div className="swatch-usage">{colour.usage}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ColourDrapePage({ page, imageUrls }: { page: BlueprintPage; data: StylistBlueprintReportData; imageUrls?: ResolvedStylistBlueprintImageUrls | null }) {
  const image = imageUrls?.prescription?.colourDrapeComparison ?? null;
  return (
    <PageFrame page={page} className="colour-drape-page">
      <div className="colour-drape-inner">
        <div className="micro faded">Professional colour analysis</div>
        <h2><span className="display">Professional</span><span className="display-it">colour drape.</span></h2>
        <ImageSlotFrame slotKey="prescription.colourDrapeComparison" label="colour drape comparison" className="colour-drape-hero-frame">
          {image ? <ReportImage src={image} /> : <div className="drape-fallback" />}
        </ImageSlotFrame>
      </div>
    </PageFrame>
  );
}

/**
 * Returns only the directions we actually have. This used to pad to four by
 * repeating the same fallback paragraph, which rendered four identical cards.
 */
function directionCards(input: string[] | null | undefined, fallback: string) {
  const values = (input ?? []).map(item => item.trim()).filter(Boolean);
  return values.length ? values.slice(0, 4) : (fallback.trim() ? [fallback.trim()] : []);
}

function VisualDirectionPage({
  page,
  data,
  imageUrls,
  kind,
}: {
  page: BlueprintPage;
  data: StylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
  kind: 'hair' | 'hair_colour' | 'eyewear';
}) {
  const face = data.classification.face_hair_accessories;
  const config: Record<'hair' | 'hair_colour' | 'eyewear', {
    image: string | null;
    slotKey: StylistBlueprintImageSlotKey;
    title: [string, string];
    micro: string;
    label: string;
    intro: string;
    cards: string[];
  }> = {
    hair: {
      image: imageUrls?.prescription?.hairDirections ?? null,
      slotKey: 'prescription.hairDirections',
      title: ['Hairstyle', 'direction.'],
      micro: 'Hair analysis',
      label: 'hair direction image',
      intro: face.hair_direction,
      cards: directionCards(face.hair_styles, face.hair_direction),
    },
    hair_colour: {
      image: imageUrls?.prescription?.hairColourDirections ?? null,
      slotKey: 'prescription.hairColourDirections',
      title: ['Hair colour', 'direction.'],
      micro: 'Colour analysis',
      label: 'hair colour direction image',
      intro: face.hair_colour_direction,
      cards: directionCards(face.hair_colour_options, face.hair_colour_direction),
    },
    eyewear: {
      image: imageUrls?.prescription?.eyewearFrames ?? null,
      slotKey: 'prescription.eyewearFrames',
      title: ['Eyeframe', 'direction.'],
      micro: 'Frame analysis',
      label: 'eyewear image',
      intro: face.eyewear_direction,
      cards: directionCards(face.eyewear_shapes, face.eyewear_direction),
    },
  };
  const { image, slotKey, title, micro, label, intro, cards: sourceCards } = config[kind];
  const { editable, onReportDataChange } = useContext(EditableReportContext);
  // Hairstyles are edited in place: the names are also what the 2x2 grid prompt
  // reads, so changing one here changes the image the stylist regenerates.
  const hairstyles = kind === 'hair' ? reportHairstyles(face) : [];
  const updateFace = (next: StylistBlueprintReportData['classification']['face_hair_accessories']) => onReportDataChange?.({
    ...data,
    classification: { ...data.classification, face_hair_accessories: next },
  });
  return (
    <PageFrame page={page} className="visual-direction-page">
      <div className="visual-direction-inner">
        <div className="visual-direction-copy">
          <div className="micro faded">{micro}</div>
          <h2><span className="display">{title[0]}</span><span className="display-it">{title[1]}</span></h2>
          {kind === 'hair'
            ? <EditableNode as="p" value={intro} pageNumber={page.page_number} placeholder="The goal for her face shape" onCommit={hair_direction => updateFace({ ...face, hair_direction })} />
            : <p>{intro}</p>}
        </div>
        <ImageSlotFrame slotKey={slotKey} label={label} className="visual-direction-media">
          {image ? <ReportImage src={image} /> : <FaceGridFallback />}
        </ImageSlotFrame>
        <div className="visual-direction-cards">
          {hairstyles.length
            ? hairstyles.map((hairstyle, index) => (
              <div key={index} className="visual-direction-card">
                <div className="mono dossier-label">{String(index + 1).padStart(2, '0')}</div>
                <EditableNode as="div" className="direction-name" value={hairstyle.name} pageNumber={page.page_number} placeholder="Hairstyle name" onCommit={name => { if (name) updateFace(withHairstyleEdit(face, index, { name })); }} />
                {(hairstyle.why || editable) && (
                  <EditableNode as="div" className="direction-why" value={hairstyle.why} pageNumber={page.page_number} placeholder="Why it suits her face shape" onCommit={why => updateFace(withHairstyleEdit(face, index, { why }))} />
                )}
              </div>
            ))
            : sourceCards.map((card, index) => (
              <div key={`${card}-${index}`} className="visual-direction-card">
                <div className="mono dossier-label">{String(index + 1).padStart(2, '0')}</div>
                <div className="direction-copy">{card}</div>
              </div>
            ))}
        </div>
      </div>
    </PageFrame>
  );
}

function MakeupPage({
  page,
  data,
  imageUrls,
}: {
  page: BlueprintPage;
  data: StylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
}) {
  const makeup = data.classification.makeup;
  const image = imageUrls?.prescription?.makeupLook ?? null;
  const steps = (makeup?.steps ?? []).map(step => step.trim()).filter(Boolean);
  const colours = (makeup?.colours ?? []).map(colour => colour.trim()).filter(Boolean);
  return (
    <PageFrame page={page} className="visual-direction-page">
      <div className="visual-direction-inner">
        <div className="visual-direction-copy">
          <div className="micro faded">Everyday beauty</div>
          <h2><span className="display">Makeup for</span><span className="display-it">everyday looks.</span></h2>
          <p>{makeup?.everyday_direction || makeup?.style}</p>
          {colours.length > 0 && (
            <div className="visual-direction-cards">
              {colours.map((colour, index) => (
                <div key={`${colour}-${index}`} className="visual-direction-card">
                  <div className="mono dossier-label">SHADE</div>
                  <div className="direction-copy">{colour}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <ImageSlotFrame slotKey="prescription.makeupLook" label="everyday makeup look image" className="visual-direction-media">
          {image ? <ReportImage src={image} /> : <FaceGridFallback />}
        </ImageSlotFrame>
        <div className="visual-direction-cards">
          {steps.map((step, index) => (
            <div key={`${step}-${index}`} className="visual-direction-card">
              <div className="mono dossier-label">{`STEP ${String(index + 1).padStart(2, '0')}`}</div>
              <div className="direction-copy">{step}</div>
            </div>
          ))}
        </div>
      </div>
    </PageFrame>
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
  const itemRecord = isObject(item) ? item : {};
  const proofOutfit = (itemRecord.example_outfit ?? block.example_outfit ?? null) as SilhouetteProofOutfit | null;

  return {
    label: block.label || block.heading || `Rule ${sourceIndex + 1}`,
    heading: title,
    body: body || reason,
    reason: body ? reason : '',
    sourceIndex,
    titleField,
    exampleOutfit: proofOutfit,
  };
}

function RuleProofOutfit({
  proof,
  imageUrls,
}: {
  proof: SilhouetteProofOutfit | null;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
}) {
  if (!proof) return null;
  const slotIndex = Number(proof.image_slot.split('.').at(-1));
  const image = Number.isInteger(slotIndex) ? imageUrls?.application?.silhouetteProofs?.[slotIndex] ?? null : null;
  const items = Array.isArray(proof.formula_items) ? proof.formula_items : [];
  const palette = proof.palette_used?.length
    ? proof.palette_used.map(colour => colour.hex)
    : items.map(item => getField(item, ['colour_hex', 'hex'], SLATE)).filter(Boolean);

  return (
    <div className="rule-proof">
      <ImageSlotFrame slotKey={`application.silhouetteProofs.${slotIndex}` as StylistBlueprintImageSlotKey} label={`rule example ${slotIndex + 1}`} className="rule-proof-media">
        {image ? <ReportImage src={image} /> : <OutfitFallback palette={palette} />}
      </ImageSlotFrame>
    </div>
  );
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
    exampleOutfit: SilhouetteProofOutfit | null;
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
        exampleOutfit: block.example_outfit ?? null,
      }];
    }
    return items.map((item, index) => ruleCardFromItem({ block, item, index, sourceIndex, titleField }));
  });
  return (
    <PageFrame page={page} className="rule-page">
      <div className="rule-layout">
        <div className="rule-head">
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
              {/* Copy is wrapped so the card is a simple two-column row. Letting
                  the proof image span auto rows made the grid share its height
                  out between the number, title and body as dead gaps. */}
              <div className="rule-card-copy">
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
              <RuleProofOutfit
                proof={block.exampleOutfit}
                imageUrls={imageUrls}
              />
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

/**
 * A Google Shopping search for one garment.
 *
 * This deliberately builds a *search*, not a deep link to a single product
 * page. A specific product URL cannot be produced reliably without a shopping
 * feed behind it: any hard-coded listing goes out of stock, gets re-slugged, or
 * is regional, and a paid report full of dead links is worse than none. A
 * well-formed query lands her on live, buyable results for the exact piece.
 *
 * The library writes descriptions for a stylist, not for a search box, so the
 * clause after the garment ("with a fine white border and a plain body") and our
 * own heel annotation ("1.2-2 inch") are stripped — both wreck the results.
 */
function shoppingQuery(piece: string, colourName: string) {
  const head = (piece ?? '')
    .split(',')[0]
    .split(/\s+(?:with|that|featuring|worn|in a|on a)\s+/i)[0];
  const cleaned = head
    .replace(/\b\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?\s*inch(?:es)?\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const lead = (colourName ?? '').trim().split(/\s+/)[0] ?? '';
  const alreadyNamesColour = lead
    ? new RegExp(`\\b${lead.replace(/[^\p{L}\p{N}]/gu, '')}\\b`, 'iu').test(cleaned)
    : true;
  return `${alreadyNamesColour ? '' : `${colourName} `}${cleaned} women`.replace(/\s+/g, ' ').trim();
}

function shoppingUrl(query: string, country: string | undefined) {
  // udm=28 is Google's current Shopping surface. The older tbm=shop still works
  // but is served as a redirect to this, so we send the canonical form and skip
  // the hop. If Google retires the parameter the link degrades to an ordinary
  // search for the same garment rather than breaking.
  const params = new URLSearchParams({ q: query, udm: '28', hl: 'en' });
  // Scope to her market so prices and retailers are ones she can actually use.
  if (/india/i.test(country ?? '')) params.set('gl', 'in');
  return `https://www.google.com/search?${params.toString()}`;
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
  // The pull-quote and the Logic row must never render the same string: pick the
  // quote first, then give Logic whatever text the quote did not take.
  const quoteText = page.pull_quote?.trim() || reasoning?.reason?.trim() || reasoning?.body?.trim() || '';
  const logicCandidates = [reasoning?.body?.trim(), reasoning?.reason?.trim(), firstBody(page.blocks).trim()];
  const logicRaw = logicCandidates.find(value => value && value !== quoteText) ?? '';
  // Equality alone was not enough: the body opens with the very sentence used
  // as the pull quote, so the page printed it twice, once in quotes and once
  // again three lines below. Keep the remainder instead of dropping the block.
  const logicTrimmed = quoteText && logicRaw.startsWith(quoteText)
    ? logicRaw.slice(quoteText.length).trim()
    : logicRaw;
  const logicText = logicTrimmed || logicRaw;
  const formula = formulaItemsForOutfit(page);
  const items = formula.items;
  const palette = paletteForOutfitPage(page, data, items);
  const outfitNumber = page.page_number - getStylistBlueprintOutfitStartPage(data) + 1;
  const imageSlot = imageSlotForPage(page, data);
  const formulaPieceCount = (items.length ? items : page.blocks.slice(0, 5)).length;
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
          <p className="display-it outfit-quote">&quot;<EditableText page={page} value={quoteText || data.classification.body.proportion_directive} update={value => ({ ...page, pull_quote: value })} />&quot;</p>
          <div className="rule" />
          <div className="outfit-meta">
            <div className="mono faded">Occasion</div>
            <EditableText as="p" page={page} value={page.subtitle || getField(page.blocks[0], ['body'], 'Context-specific formula')} update={value => ({ ...page, subtitle: value })} />
            <div className="mono faded">Palette</div>
            <div>{palette.map((colour, index) => <SwatchDot key={`${colour.hex}-${colour.name}-${index}`} hex={colour.hex} />)}</div>
            <div className="mono faded">Why it works</div>
            <EditableText as="p" page={page} value={logicText} update={value => reasoning ? updateBlock(page, page.blocks.indexOf(reasoning), reasoning.body !== undefined ? { body: value } : { reason: value }) : page} />
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
        <div className="formula-head">
          <div className="mono faded formula-label">{formulaPieceCount === 1 ? 'The outfit - 1 piece' : `The outfit - ${formulaPieceCount} pieces`}</div>
          <div className="formula-hint">Each piece opens a live shopping search in your colour.</div>
        </div>
        <div className="formula-grid">
          {(items.length ? items : page.blocks.slice(0, 5)).map((item, index) => {
            const colour = colourForFormulaItem(item, page, data, index);
            const pieceValue = getField(item, ['piece', 'name', 'heading', 'rule'], getField(item, ['body'], `Piece ${index + 1}`));
            const query = shoppingQuery(pieceValue, colour.name);
            return (
              <div key={index} className="formula-card">
                <SwatchDot hex={colour.hex} />
                <div className="mono dossier-label">{String(index + 1).padStart(2, '0')} - {getField(item, ['slot', 'category', 'label'], 'piece')}</div>
                <h3 className="display">
                  {formula.editable
                    ? <EditableText page={page} value={pieceValue} update={value => updateItem(page, formula.blockIndex, index, { piece: value })} />
                    : pieceValue}
                </h3>
                {query && (
                  <a
                    className="formula-shop"
                    href={shoppingUrl(query, data.classification.client.country)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Shop for ${query} on Google Shopping`}
                    title={query}
                  >
                    <svg className="formula-shop-bag" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <path d="M3.2 5.5h9.6l-.7 7.3a1 1 0 0 1-1 .9H4.9a1 1 0 0 1-1-.9z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                      <path d="M5.6 5.5V4.6a2.4 2.4 0 0 1 4.8 0v.9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <span>Shop</span>
                    <svg className="formula-shop-arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                      <path d="M3 9L9 3M9 3H4.2M9 3v4.8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                )}
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
  const { onImageRegenerate, onImageUpload } = useContext(EditableReportContext);
  const image = imageForPage(page, imageUrls, data);
  const showImage = Boolean(image || onImageRegenerate || onImageUpload);
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
          {/* The price was hardcoded as "$39/mo" — wrong currency for an Indian
              client base, and not sourced from any pricing config. Left out
              until an ICONIK Edit price exists in indiaBlueprintPricing.ts. */}
          <div className="edit-pill">
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
  if (pageType === 'transformation') return <TransformationPage page={page} data={data} imageUrls={imageUrls} />;
  if (pageType === 'palette') return <PalettePage page={page} data={data} imageUrls={imageUrls} />;
  if (pageType === 'colour_drape') return <ColourDrapePage page={page} data={data} imageUrls={imageUrls} />;
  if (pageType === 'hair') return <VisualDirectionPage page={page} data={data} imageUrls={imageUrls} kind="hair" />;
  if (pageType === 'hair_colour') return <VisualDirectionPage page={page} data={data} imageUrls={imageUrls} kind="hair_colour" />;
  if (pageType === 'eyewear') return <VisualDirectionPage page={page} data={data} imageUrls={imageUrls} kind="eyewear" />;
  if (pageType === 'makeup') return <MakeupPage page={page} data={data} imageUrls={imageUrls} />;
  if (pageType === 'outfit_system') return <OutfitSystemPage page={page} data={data} imageUrls={imageUrls} />;
  if (pageType === 'matrix') return <MatrixPage page={page} data={data} />;
  if (pageType === 'continuation') return <ContinuationPage page={page} data={data} imageUrls={imageUrls} />;
  if (page.page_number === getStylistBlueprintHairFaceAccessoriesPage(data)) return <HairFaceAccessoriesPage page={page} data={data} imageUrls={imageUrls} />;
  if (pageType === 'rules' || pageType === 'fabric' || pageType === 'wardrobe_guide' || pageType === 'avoidance' || pageType === 'audit' || pageType === 'shopping_plan') {
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

function DeferredBlueprintPage({ defer, children }: {
  page: BlueprintPage;
  data: StylistBlueprintReportData;
  defer: boolean;
  totalPages?: number;
  displayPageNumber?: number;
  children: ReactNode;
}) {
  // Keep every page in the document for print, find-in-page and accessibility.
  // The browser skips layout/paint for distant pages without omitting content.
  if (!defer) return <>{children}</>;
  return <div className="blueprint-deferred-shell" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 1100px' }}>{children}</div>;
}

function PremiumReport({
  data,
  imageUrls,
  focusPageNumber,
  deferPages = false,
  hideContinuationPage = false,
  editable = false,
  onPageChange,
  onReportDataChange,
  onImageRegenerate,
  regeneratingImageSlot,
  imageRegenerationDisabled,
  imagePrompts,
  onImageUpload,
  uploadingImageSlot,
}: {
  data: StylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
  focusPageNumber?: number;
  deferPages?: boolean;
  hideContinuationPage?: boolean;
  editable?: boolean;
  onPageChange?: (page: BlueprintPage) => void;
  onReportDataChange?: (data: StylistBlueprintReportData) => void;
  onImageRegenerate?: (slotKey: StylistBlueprintImageSlotKey) => void | Promise<void>;
  regeneratingImageSlot?: StylistBlueprintImageSlotKey | null;
  imageRegenerationDisabled?: boolean;
  imagePrompts?: Partial<Record<StylistBlueprintImageSlotKey, string>>;
  onImageUpload?: (slotKey: StylistBlueprintImageSlotKey, file: File) => void | boolean | Promise<void | boolean>;
  uploadingImageSlot?: StylistBlueprintImageSlotKey | null;
}) {
  const visiblePages = getVisibleStylistBlueprintPages(data, { hideContinuationPage, includeHidden: editable });
  const pages = visiblePages.filter(page => !focusPageNumber || page.page_number === focusPageNumber);
  const visibleTotalPages = visiblePages.length;
  return (
    <EditableReportContext.Provider value={{ editable, onPageChange, onReportDataChange, onImageRegenerate, regeneratingImageSlot, imageRegenerationDisabled, imagePrompts, onImageUpload, uploadingImageSlot, reportData: data, visibleTotalPages, visiblePageNumbers: visiblePages.map(page => page.page_number) }}>
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
              totalPages={visibleTotalPages}
              displayPageNumber={visiblePages.findIndex(item => item.page_number === page.page_number) + 1}
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
  hideContinuationPage,
  editable,
  onPageChange,
  onReportDataChange,
  onImageRegenerate,
  regeneratingImageSlot,
  imageRegenerationDisabled,
  imagePrompts,
  onImageUpload,
  uploadingImageSlot,
}: {
  data: StylistBlueprintReportData | LegacyStylistBlueprintReportData;
  imageUrls?: ResolvedStylistBlueprintImageUrls | null;
  focusPageNumber?: number;
  deferPages?: boolean;
  hideContinuationPage?: boolean;
  editable?: boolean;
  onPageChange?: (page: BlueprintPage) => void;
  onReportDataChange?: (data: StylistBlueprintReportData) => void;
  onImageRegenerate?: (slotKey: StylistBlueprintImageSlotKey) => void | Promise<void>;
  regeneratingImageSlot?: StylistBlueprintImageSlotKey | null;
  imageRegenerationDisabled?: boolean;
  imagePrompts?: Partial<Record<StylistBlueprintImageSlotKey, string>>;
  onImageUpload?: (slotKey: StylistBlueprintImageSlotKey, file: File) => void | boolean | Promise<void | boolean>;
  uploadingImageSlot?: StylistBlueprintImageSlotKey | null;
}) {
  if (!isVersionedStylistBlueprintReportData(data)) return <LegacyReport data={data} imageUrls={imageUrls} />;
  return (
    <PremiumReport
      data={data}
      imageUrls={imageUrls}
      focusPageNumber={focusPageNumber}
      deferPages={deferPages}
      hideContinuationPage={hideContinuationPage}
      editable={editable}
      onPageChange={onPageChange}
      onReportDataChange={onReportDataChange}
      onImageRegenerate={onImageRegenerate}
      regeneratingImageSlot={regeneratingImageSlot}
      imageRegenerationDisabled={imageRegenerationDisabled}
      imagePrompts={imagePrompts}
      onImageUpload={onImageUpload}
      uploadingImageSlot={uploadingImageSlot}
    />
  );
}

function BlueprintStyles() {
  return (
    <style jsx global>{`
      /* One typeface for the whole document. Manrope carries the display sizes
         at a tight -0.04em and still sets clean body copy, so the report reads
         as a single voice instead of a serif/sans/mono collage. */
      /* Slides lay out by the report's own width, not the window's. In the
         studio the report sits beside a 310px sidebar, so a laptop window gave
         slides the desktop layout squeezed into ~700px. */
      .iconik-report {
        container: iconik-report / inline-size;
        background: ${INK};
        color: ${INK};
        font-family: var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif;
        font-weight: 400;
        letter-spacing: -0.011em;
        font-variant-numeric: tabular-nums;
        padding: 20px;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
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
      .image-slot-frame.slot-dragging {
        outline: 2px dashed rgba(201, 169, 110, 0.9);
        outline-offset: -4px;
      }
      .slot-drop-hint {
        position: absolute;
        inset: 0;
        z-index: 6;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(44, 38, 34, 0.55);
        color: ${IVORY};
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        pointer-events: none;
      }
      .spin-icon {
        animation: iconik-spin 900ms linear infinite;
      }
      @keyframes iconik-spin {
        to { transform: rotate(360deg); }
      }
      .display {
        font-family: var(--font-manrope), Manrope, ui-sans-serif, sans-serif;
        font-weight: 600;
        letter-spacing: -0.04em;
        line-height: 0.98;
        text-wrap: balance;
      }
      /* Manrope has no true italic, and a synthesised slant on a geometric sans
         looks broken. The secondary voice is carried by weight and colour
         instead, which keeps the contrast without faking a cut that does not
         exist. */
      .display-it {
        font-family: var(--font-manrope), Manrope, ui-sans-serif, sans-serif;
        font-weight: 300;
        font-style: normal;
        letter-spacing: -0.035em;
        line-height: 1.14;
        text-wrap: balance;
      }
      .mono {
        font-family: var(--font-manrope), Manrope, ui-sans-serif, sans-serif;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.02em;
      }
      /* Uppercase needs positive tracking to stay readable — the -0.04em above
         is for the display sizes, not for 10px capitals. */
      .micro {
        font-size: 10px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .small-caps {
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .iconik-page {
        max-width: 1060px;
        min-height: 760px;
        margin: 0 auto 20px;
        border-radius: 20px;
        /* The running header (corner-tl/tr) is absolutely positioned, so the
           content box has to start below it. At 64px the page title sat on top
           of the first line of content — "Style Summary Dossier" printed
           straight through "Pages". */
        padding: 116px 56px 92px;
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
      /* No backdrop blur: every card sits on a flat page, so blurring it changed
         nothing visible but made long reports stutter while scrolling on phones. */
      .glass-dark {
        background: rgba(44, 38, 34, 0.03);
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
      .corner-tl { top: 40px; left: 56px; right: 56px; }
      .corner-tr { top: 40px; right: 56px; text-align: right; }
      .corner-bl { bottom: 36px; left: 56px; }
      .corner-br { bottom: 36px; right: 56px; text-align: right; }
      /* The page number must never be overlapped by a long page title. */
      .corner-tl { padding-right: 92px; }
      .corner-tr { z-index: 3; }
      .corner-kicker, .faded, .muted {
        opacity: 0.55;
      }
      .corner-title {
        display: block;
        margin-top: 7px;
        opacity: 0.72;
      }
      .wordmark {
        font-size: 14px;
        letter-spacing: 0.42em;
        font-weight: 400;
      }
      .date-line {
        margin-top: 8px;
      }
      /* ── Opening sequence ────────────────────────────────────────────────
         The share link is the first time she sees any of this, so the cover
         assembles rather than simply appearing: rule, name, promise, then her
         own palette wiping in one colour at a time.

         Every animation uses fill-mode backwards, which means the "from"
         state exists only while the animation is pending. If motion is turned
         off, or the animation never runs at all, every element sits at its
         normal visible style — the page can never get stuck invisible. The
         sequence is skipped in the editor, where a stylist would sit through it
         on every reload. */
      @keyframes blueprint-rise {
        from { opacity: 0; transform: translate3d(0, 18px, 0); }
        to { opacity: 1; transform: none; }
      }
      @keyframes blueprint-draw {
        from { opacity: 0; transform: scaleX(0.2); }
        to { opacity: 1; transform: none; }
      }
      @keyframes blueprint-swatch {
        from { opacity: 0; transform: scaleX(0) translate3d(0, 4px, 0); }
        to { opacity: 1; transform: none; }
      }
      /* The panel itself never fades: starting it at zero opacity showed a blank
         ink screen with only the contents bar for the first second. The copy
         inside still rises in. */
      @keyframes blueprint-panel {
        from { transform: scale(1.012); }
        to { transform: none; }
      }
      @media (prefers-reduced-motion: no-preference) {
        .iconik-report:not(.iconik-report-editable) .cover-page {
          animation: blueprint-panel 1100ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        .iconik-report:not(.iconik-report-editable) .cover-rule {
          animation: blueprint-draw 900ms cubic-bezier(0.16, 1, 0.3, 1) 140ms backwards;
        }
        .iconik-report:not(.iconik-report-editable) .cover-name {
          animation: blueprint-rise 1000ms cubic-bezier(0.16, 1, 0.3, 1) 260ms backwards;
        }
        .iconik-report:not(.iconik-report-editable) .cover-tagline {
          animation: blueprint-rise 900ms cubic-bezier(0.16, 1, 0.3, 1) 460ms backwards;
        }
        .iconik-report:not(.iconik-report-editable) .cover-swatches span {
          transform-origin: left center;
          animation: blueprint-swatch 620ms cubic-bezier(0.16, 1, 0.3, 1) calc(640ms + var(--i, 0) * 65ms) backwards;
        }
        .iconik-report:not(.iconik-report-editable) .cover-caption {
          animation: blueprint-rise 900ms cubic-bezier(0.16, 1, 0.3, 1) 1180ms backwards;
        }
        .iconik-report:not(.iconik-report-editable) .cover-page .corner-tl,
        .iconik-report:not(.iconik-report-editable) .cover-page .corner-tr,
        .iconik-report:not(.iconik-report-editable) .cover-page .corner-br {
          animation: blueprint-rise 800ms ease-out 1320ms backwards;
        }
        .iconik-report:not(.iconik-report-editable) .cover-scroll-cue {
          animation: blueprint-rise 800ms ease-out 1800ms backwards;
        }
        .iconik-report:not(.iconik-report-editable) .cover-scroll-cue i {
          animation: blueprint-cue 2200ms cubic-bezier(0.4, 0, 0.2, 1) 2400ms infinite;
        }
        /* ── Reading sequence ──────────────────────────────────────────────
           Every page after the cover settles into place as it enters the
           viewport. The hidden state is only ever applied once the viewer
           chrome has mounted and is observing (.iconik-report-reveal), and a
           page is released the moment any part of it intersects, so a page can
           never be left invisible by a timeline that failed to advance. */
        .iconik-report-reveal .iconik-page:not(.cover-page) {
          transition: opacity 720ms cubic-bezier(0.16, 1, 0.3, 1), transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .iconik-report-reveal .iconik-page:not(.cover-page):not(.is-in-view) {
          opacity: 0;
          transform: translate3d(0, 28px, 0);
        }
        .iconik-report-reveal .iconik-page:not(.cover-page) > *:not(.grain) {
          transition: opacity 640ms ease-out, transform 820ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .iconik-report-reveal .iconik-page:not(.cover-page):not(.is-in-view) > *:not(.grain) {
          opacity: 0;
          transform: translate3d(0, 14px, 0);
        }
        .iconik-report-reveal .iconik-page.is-in-view > *:not(.grain):nth-child(3) { transition-delay: 80ms; }
        .iconik-report-reveal .iconik-page.is-in-view > *:not(.grain):nth-child(4) { transition-delay: 160ms; }
        .iconik-report-reveal .iconik-page.is-in-view > *:not(.grain):nth-child(5) { transition-delay: 240ms; }
        .iconik-report-reveal .iconik-page.is-in-view > *:not(.grain):nth-child(n+6) { transition-delay: 300ms; }
      }
      /* Images that open in the viewer's lightbox. */
      .iconik-report-interactive .flatlay-media img,
      .iconik-report-interactive .transformation-media img,
      .iconik-report-interactive .diagram-media img,
      .iconik-report-interactive .secondary-strip img,
      .iconik-report-interactive .axis-portrait img,
      .iconik-report-interactive .visual-direction-media img,
      .iconik-report-interactive .colour-drape-hero-frame img,
      .iconik-report-interactive .rule-proof-media img,
      .iconik-report-interactive .continuation-image img {
        cursor: zoom-in;
      }
      /* A scroll-driven fade for the other fifty-four pages was tried and
         removed. Its resting state before the scroll range begins is a faded
         page, so any device where the timeline does not advance as expected
         leaves a page of a paid report sitting at partial opacity. The opening
         is the moment worth animating; the rest of the document should just be
         legible. */
      @media print {
        .iconik-report *, .iconik-report {
          animation: none !important;
          transition: none !important;
        }
      }
      .cover-page {
        /* The cover owns the first screen: nothing of page two shows until she
           scrolls, so the opening reads as a title card rather than the top of
           a long document. The 40px is the report's own padding. */
        min-height: max(780px, calc(100svh - 40px));
        display: flex;
        align-items: center;
        justify-content: center;
        /* Equal top and bottom so the centred block is actually centred; the
           running head and page number sit in the margins either way. */
        padding-top: 104px;
        padding-bottom: 104px;
      }
      /* Optically centred rather than measured: the running head and the page
         number sit in the margins, so a mathematically centred block reads low.
         Flex centring plus a small lift puts the name on the eye line. */
      .cover-center {
        position: relative;
        width: 100%;
        max-width: 720px;
        margin: 0 auto;
        transform: translateY(-14px);
        text-align: center;
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
        align-items: center;
        gap: 20px;
        margin-bottom: 30px;
        opacity: 0.9;
      }
      .cover-rule span {
        height: 1px;
        flex: 1;
        background: rgba(244, 239, 229, 0.3);
      }
      .cover-rule div {
        opacity: 0.7;
      }
      /* A soft bloom behind the name so the type sits in the page rather than
         floating on a flat panel. */
      .cover-center::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 46%;
        width: 132%;
        aspect-ratio: 2 / 1;
        transform: translate(-50%, -50%);
        background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0) 68%);
        pointer-events: none;
        z-index: -1;
      }
      .cover-name {
        margin: 0;
        /* Scales with the name's length so a long one never breaks to an
           orphaned initial the way "Dr Swathi V / S" did. */
        font-size: clamp(46px, 7.6cqi, 88px);
        font-weight: 550;
        letter-spacing: -0.045em;
        line-height: 0.94;
        text-wrap: balance;
      }
      .cover-tagline {
        margin-top: 30px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-size: clamp(16px, 1.6cqi, 20px);
        line-height: 1.28;
        opacity: 0.72;
      }
      .cover-tagline-accent {
        font-weight: 600;
        letter-spacing: -0.04em;
        opacity: 1;
      }
      /* Her actual palette, on the cover. The opening should already be about
         her rather than about us. */
      .cover-swatches {
        margin: 42px auto 0;
        display: flex;
        justify-content: center;
        gap: 8px;
      }
      .cover-swatches span {
        width: 34px;
        height: 5px;
        border-radius: 999px;
        box-shadow: inset 0 0 0 1px rgba(244, 239, 229, 0.24);
      }
      .cover-caption {
        margin-top: 20px;
        opacity: 0.55;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px 14px;
      }
      .cover-caption span + span::before {
        content: '·';
        margin-right: 14px;
        opacity: 0.6;
      }
      .cover-scroll-cue {
        position: absolute;
        left: 50%;
        bottom: 34px;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        opacity: 0.55;
        z-index: 2;
      }
      .cover-scroll-cue .micro {
        letter-spacing: 0.3em;
        font-size: 9px;
      }
      .cover-scroll-cue i {
        display: block;
        width: 1px;
        height: 36px;
        background: linear-gradient(to bottom, rgba(244, 239, 229, 0.9), rgba(244, 239, 229, 0));
        transform-origin: top center;
      }
      @keyframes blueprint-cue {
        0% { transform: scaleY(0); opacity: 0; }
        35% { transform: scaleY(1); opacity: 1; }
        100% { transform: scaleY(1) translateY(14px); opacity: 0; }
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
      /* The rail heading was sitting on top of the first metric label. */
      .summary-rail > .micro {
        display: block;
        margin-bottom: 26px;
      }
      .rail-number {
        font-size: 48px;
        margin-top: 8px;
        margin-bottom: 32px;
      }
      .metric {
        margin-bottom: 26px;
      }
      .metric .small-caps {
        display: block;
        margin-bottom: 4px;
      }
      .metric .display {
        font-size: 30px;
        font-weight: 500;
        letter-spacing: -0.045em;
        line-height: 1;
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
        font-size: clamp(34px, 5.4cqi, 64px);
        overflow-wrap: break-word;
        /* Auto-hyphenation on display type ("Architec-tural") reads as a
           typesetting fault. It is enabled again below 900px, where a single
           long word can otherwise overflow the column. */
        hyphens: manual;
      }
      .summary-main h2 span {
        font-size: clamp(42px, 6cqi, 64px);
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
        font-size: 14px;
        line-height: 1.75;
        opacity: 0.86;
        max-width: 52ch;
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
      .focus-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .focus-chip {
        border: 1px solid rgba(244, 239, 229, 0.24);
        border-radius: 999px;
        padding: 5px 12px;
        font-size: 12px;
        line-height: 1.2;
        opacity: 0.86;
      }
      .reading-inner, .palette-inner, .system-inner, .generic-inner {
        margin-top: 72px;
      }
      .transformation-inner {
        margin-top: 72px;
      }
      .transformation-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 22px;
      }
      .transformation-card {
        background: rgba(244, 239, 229, 0.08);
        border: 1px solid rgba(244, 239, 229, 0.16);
        border-radius: 18px;
        overflow: hidden;
        position: relative;
      }
      .transformation-label {
        position: absolute;
        z-index: 2;
        left: 16px;
        top: 16px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(44, 38, 34, 0.72);
        color: ${IVORY};
        font-family: var(--font-manrope), Manrope, ui-sans-serif, sans-serif;
        font-weight: 600;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
      }
      .transformation-media {
        aspect-ratio: 2 / 3;
        background: rgba(244, 239, 229, 0.06);
      }
      .transformation-media img,
      .transformation-media svg {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
      }
      .reading-blocks, .generic-blocks {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
        margin-top: 32px;
        align-items: start;
      }
      .reading-card, .premium-rule-card {
        padding: 26px 26px 28px;
        display: flex;
        flex-direction: column;
        align-items: stretch;
      }
      .reading-card .dossier-label, .premium-rule-card .dossier-label {
        margin-bottom: 14px;
      }
      .reading-card h3, .premium-rule-card h3 {
        font-size: 21px;
        line-height: 1.2;
        margin: 0 0 12px;
        max-width: 22ch;
      }
      .reading-card p, .premium-rule-card p {
        font-size: 14px;
        line-height: 1.75;
        opacity: 0.88;
        margin: 0;
        max-width: 46ch;
      }
      .reading-card p + p, .premium-rule-card p + p {
        margin-top: 12px;
      }
      .direction-copy {
        font-size: 14px;
        line-height: 1.6;
        margin-top: 6px;
      }
      .direction-name {
        font-size: 15px;
        line-height: 1.45;
        font-weight: 500;
        margin-top: 6px;
      }
      .direction-why {
        font-size: 13px;
        line-height: 1.6;
        opacity: 0.8;
      }
      .direction-name:empty::before, .direction-why:empty::before, .visual-direction-copy p:empty::before {
        content: attr(data-placeholder);
        opacity: 0.45;
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
        font-size: clamp(44px, 6.2cqi, 76px);
      }
      /* The subtitle ("Mastering the Petite 152cm Frame") ran at the title's
         size and wrapped five lines deep; it now reads as a supporting line. */
      .proportion-inner h2 span.display-it {
        font-size: clamp(26px, 3.2cqi, 40px);
        margin-top: 8px;
        opacity: 0.85;
      }
      .proportion-inner .rule {
        margin: 26px 0 22px;
      }
      /* Below full desktop width the headline sits as a band above the cards,
         which then get the whole page instead of about half of it. */
      @container iconik-report (max-width: 1100px) {
        .proportion-inner {
          grid-template-columns: minmax(0, 1fr);
          gap: 34px;
        }
      }
      .proportion-card-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        align-items: start;
      }
      .proportion-card {
        padding: 26px 26px 28px;
        display: flex;
        flex-direction: column;
      }
      .proportion-card .dossier-label {
        margin-bottom: 14px;
      }
      .proportion-card h3 {
        font-size: 21px;
        line-height: 1.2;
        margin: 0 0 12px;
        max-width: 22ch;
      }
      .proportion-card p {
        font-size: 14px;
        line-height: 1.75;
        opacity: 0.88;
        margin: 0;
        max-width: 46ch;
      }
      .palette-inner h2 {
        display: flex;
        align-items: baseline;
        gap: 28px;
      }
      .palette-inner.with-drape {
        display: grid;
        grid-template-columns: minmax(0, 1.24fr) minmax(300px, 0.76fr);
        gap: 34px;
        align-items: start;
      }
      .palette-inner h2 span:first-child {
        font-size: clamp(64px, 9cqi, 92px);
      }
      .palette-inner h2 span:last-child {
        font-size: clamp(28px, 4cqi, 36px);
        opacity: 0.6;
      }
      .palette-intro {
        max-width: 520px;
        margin: 24px 0 42px;
      }
      .palette-drape-panel {
        position: sticky;
        top: 24px;
        background: rgba(44, 38, 34, 0.04);
        border: 1px solid rgba(44, 38, 34, 0.12);
        border-radius: 18px;
        padding: 18px;
      }
      .colour-drape-frame {
        margin-top: 12px;
        aspect-ratio: 3 / 2;
        border-radius: 14px;
        overflow: hidden;
        background: ${BONE};
        border: 1px solid rgba(44, 38, 34, 0.12);
      }
      .colour-drape-frame img,
      .drape-fallback {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
      }
      .drape-fallback {
        background: linear-gradient(90deg, #C9B79F 0 50%, #7F8F77 50% 100%);
      }
      .colour-drape-inner {
        margin-top: 64px;
      }
      .colour-drape-inner h2 {
        margin: 14px 0 30px;
      }
      .colour-drape-inner h2 span {
        display: block;
        font-size: clamp(48px, 7cqi, 78px);
      }
      .colour-drape-hero-frame {
        width: min(100%, 920px);
        margin: 0 auto;
        aspect-ratio: 3 / 2;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid rgba(44, 38, 34, 0.12);
        background: ${BONE};
      }
      .colour-drape-hero-frame img,
      .colour-drape-hero-frame .drape-fallback {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        display: block;
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
      .swatch-name {
        font-size: 15px;
        margin-top: 8px;
      }
      .swatch-usage {
        font-size: 11px;
        line-height: 1.45;
        margin-top: 4px;
        opacity: 0.68;
      }
      /* The headline used to sit in a 0.68fr column beside the rules, which gave
         a 64px display face about 300px to wrap into: "Rules / for your /
         silhouette" ran six lines deep and pushed the first rule below the fold.
         It now runs as a band across the top, and the rules get the full width. */
      .rule-layout {
        margin-top: 78px;
        display: block;
        container: rule-layout / inline-size;
      }
      .rule-head {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.7fr);
        gap: 40px;
        align-items: end;
        margin-bottom: 30px;
      }
      .rule-head h2 {
        margin: 0;
      }
      /* Sized to sit on one or two lines across the band rather than the three
         to six the narrow column forced. */
      .rule-head h2 span {
        font-size: clamp(30px, 3.4cqi, 46px);
      }
      .rule-head h2 span.display-it {
        font-size: clamp(22px, 2.4cqi, 32px);
        margin-top: 6px;
        opacity: 0.85;
      }
      .rule-head p {
        margin: 0 0 8px;
        max-width: 46ch;
      }
      /* Rule cards size themselves from the width the rules get, so the proof
         image stays in proportion to the copy beside it:
           narrow  (< 460px): the proof fills the card width above the copy
           medium  (460-839px): one column, proof beside the copy at ~34%
           wide    (840px+): two columns, proof beside the copy at ~42%
         A fixed 108px proof beside the copy left ~130px for text when the page
         was narrower than the window, and cards ran 500px deep beside a thumbnail. */
      .rule-card-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }
      .rule-card-grid .premium-rule-card {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 20px 22px;
      }
      .rule-card-copy {
        flex: 1 1 auto;
        min-width: 0;
      }
      /* The proof is a full-body outfit, so it always keeps its portrait crop. */
      .rule-card-grid .premium-rule-card .rule-proof {
        order: -1;
        flex: 0 0 auto;
        width: 100%;
        margin-top: 0;
        padding-top: 0;
        border-top: none;
      }
      @container rule-layout (min-width: 460px) {
        .rule-card-grid .premium-rule-card {
          flex-direction: row;
          align-items: flex-start;
          gap: 22px;
        }
        .rule-card-grid .premium-rule-card .rule-proof {
          order: 1;
          width: auto;
          flex: 0 0 clamp(150px, 34%, 240px);
        }
      }
      @container rule-layout (min-width: 840px) {
        .rule-card-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .rule-card-grid .premium-rule-card .rule-proof {
          flex-basis: clamp(140px, 42%, 220px);
        }
      }
      .rule-card-grid .premium-rule-card h3 {
        max-width: none;
      }
      .rule-card-grid .premium-rule-card p {
        max-width: none;
      }
      .premium-rule-card .why {
        opacity: 0.9;
      }
      .rule-proof {
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px solid rgba(44, 38, 34, 0.12);
      }
      .rule-proof-media {
        width: 100%;
        aspect-ratio: 2 / 3;
        border-radius: 8px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.45);
      }
      .rule-proof-media img,
      .rule-proof-media .outfit-svg {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
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
      .visual-direction-inner {
        margin-top: 58px;
        display: grid;
        grid-template-columns: minmax(280px, 0.72fr) minmax(420px, 1.28fr);
        gap: 34px;
        align-items: start;
      }
      .visual-direction-copy h2 {
        margin: 12px 0 22px;
      }
      .visual-direction-copy h2 span {
        display: block;
        font-size: clamp(44px, 7cqi, 76px);
      }
      .visual-direction-copy p {
        font-size: 14px;
        line-height: 1.7;
        opacity: 0.72;
      }
      .visual-direction-media {
        grid-row: span 2;
        aspect-ratio: 1 / 1;
        border-radius: 18px;
        overflow: hidden;
        background: rgba(244, 239, 229, 0.28);
        border: 1px solid rgba(44, 38, 34, 0.08);
      }
      .visual-direction-media img,
      .visual-direction-media .face-grid-fallback {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        display: block;
      }
      .visual-direction-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .visual-direction-card {
        border-top: 1px solid rgba(44, 38, 34, 0.12);
        padding-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .visual-direction-card .direction-copy {
        font-size: 15px;
        line-height: 1.6;
        margin-top: 0;
        max-width: 42ch;
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
        font-size: clamp(44px, 7cqi, 76px);
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
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-top: 18px;
        align-items: start;
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
        margin-top: 42px;
        display: grid;
        grid-template-columns: minmax(280px, 0.78fr) minmax(500px, 1.22fr);
        gap: 34px;
        align-items: start;
      }
      .outfit-no {
        font-size: 18px;
        opacity: 0.5;
      }
      /* Sized from the copy column itself: at a report-wide size a 355px column
         could not hold "Professional" and the title broke mid-word. */
      .outfit-copy {
        container: outfit-copy / inline-size;
      }
      .outfit-copy h2 span {
        font-size: clamp(32px, 14.5cqi, 64px);
      }
      .outfit-quote {
        font-size: 17px;
        opacity: 0.7;
        line-height: 1.5;
        max-width: 400px;
        margin: 32px 0;
      }
      .outfit-meta {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 16px 24px;
        margin-top: 28px;
        align-items: start;
      }
      .outfit-meta > .mono {
        font-size: 10px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 600;
        padding-top: 4px;
        white-space: nowrap;
      }
      .outfit-meta p {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
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
        padding: 16px;
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
      /* The pieces read as a quiet shopping list under the look: hairline rows,
         a small swatch, and a light "Shop" link beside the category. As cards
         with a full-width ink button each piece took ~140px and every button
         competed with the outfit image for attention. */
      .formula-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
        column-gap: 40px;
        border-top: 1px solid rgba(44, 38, 34, 0.12);
      }
      .formula-card {
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr) auto;
        grid-template-areas: 'dot label shop' 'dot title title';
        column-gap: 14px;
        row-gap: 3px;
        align-items: center;
        /* Rows beside a two-line piece keep their content at the top edge. */
        align-content: start;
        padding: 14px 0 16px;
        border-bottom: 1px solid rgba(44, 38, 34, 0.12);
      }
      .formula-head {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px 24px;
        margin-bottom: 24px;
      }
      .formula-head .formula-label {
        margin-bottom: 0;
      }
      .formula-hint {
        font-size: 12px;
        opacity: 0.55;
      }
      /* Still easy to find and tap, but light: an outlined pill that sits
         beside the category instead of an ink bar under every piece. */
      .formula-shop {
        grid-area: shop;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        min-height: 30px;
        padding: 0 11px;
        border-radius: 999px;
        border: 1px solid rgba(44, 38, 34, 0.2);
        background: transparent;
        color: ${INK};
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0;
        text-decoration: none;
        white-space: nowrap;
        transition: background 160ms ease, border-color 160ms ease;
      }
      .formula-shop-bag {
        display: none;
      }
      .formula-shop-arrow {
        width: 10px;
        height: 10px;
        opacity: 0.6;
        transition: transform 160ms ease, opacity 160ms ease;
      }
      .formula-shop:hover,
      .formula-shop:focus-visible {
        background: rgba(44, 38, 34, 0.06);
        border-color: rgba(44, 38, 34, 0.45);
      }
      .formula-shop:hover .formula-shop-arrow,
      .formula-shop:focus-visible .formula-shop-arrow {
        transform: translate(1px, -1px);
        opacity: 1;
      }
      .formula-shop:focus-visible {
        outline: 2px solid rgba(201, 169, 110, 0.9);
        outline-offset: 2px;
      }
      /* A printed report cannot be clicked. */
      @media print {
        .formula-shop { display: none; }
      }
      .formula-card .swatch-dot {
        grid-area: dot;
        align-self: start;
        width: 22px;
        height: 22px;
        margin: 4px 0 0;
        display: block;
        /* Ivory and white swatches would otherwise vanish on the bone page. */
        border-color: rgba(44, 38, 34, 0.2);
      }
      .formula-card .dossier-label {
        grid-area: label;
        margin: 0;
      }
      .formula-card h3 {
        grid-area: title;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.4;
        letter-spacing: -0.01em;
        margin: 0;
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
        font-size: clamp(44px, 7cqi, 64px);
      }
      .continuation-copy h2 span {
        font-size: clamp(40px, 6cqi, 58px);
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
      }
      @container iconik-report (max-width: 900px) {
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
          right: 20px;
          padding-right: 76px;
        }
        .corner-tr {
          right: 20px;
        }
        /* The share link is opened on a phone far more often than on a desktop,
           so the opening has to be composed for this width, not merely survive
           it. */
        .cover-page {
          min-height: 100svh;
          padding-top: 72px;
          padding-bottom: 72px;
        }
        .cover-scroll-cue {
          bottom: 22px;
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
          hyphens: auto;
        }
        /* On a phone the look itself leads; the copy about it follows. */
        .outfit-art {
          order: -1;
        }
        .outfit-hero {
          margin-top: 28px;
        }
        .outfit-quote {
          margin: 20px 0;
        }
        .outfit-meta {
          gap: 14px 16px;
          grid-template-columns: auto 1fr;
        }
        .formula-head {
          margin-bottom: 18px;
        }
        .cover-center {
          max-width: none;
          transform: none;
        }
        .cover-rule {
          gap: 14px;
          margin-bottom: 24px;
        }
        .cover-name {
          font-size: clamp(38px, 12.5cqi, 60px);
        }
        .cover-tagline {
          margin-top: 22px;
          font-size: 16px;
        }
        .cover-swatches {
          margin-top: 32px;
          gap: 6px;
        }
        .cover-swatches span {
          width: 22px;
          height: 4px;
        }
        /* "· 55 PAGES" was breaking so that "PAGES" landed alone on its own
           line under the rest of the caption. */
        .cover-caption {
          font-size: 9px;
          letter-spacing: 0.14em;
          line-height: 1.8;
          flex-direction: column;
          gap: 5px;
        }
        .cover-caption span + span::before {
          content: none;
        }
        .summary-grid,
        .diagnosis-grid,
        .rule-layout,
        .rule-head,
        .chromatic-map,
        .proportion-inner,
        .palette-inner,
        .visual-direction-inner,
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
        .transformation-grid,
        .reading-blocks,
        .proportion-card-grid,
        .face-visuals,
        .hair-card-grid,
        .visual-direction-cards,
        .capsule-map,
        .mini-axis-grid,
        .reference-images {
          grid-template-columns: 1fr;
        }
        .premium-swatches {
          grid-template-columns: repeat(2, 1fr);
        }
        .palette-inner h2 {
          display: block;
        }
        .palette-drape-panel {
          position: relative;
          top: auto;
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
        .finding-list {
          grid-template-columns: 1fr;
          gap: 8px;
        }
      }
      @media print {
        @page { size: A4 portrait; margin: 0; }
        /* Browsers drop backgrounds unless "Background graphics" is ticked, which
           printed the cover and every slate page as white text on white. */
        html, body { background: ${INK} !important; }
        .iconik-report, .iconik-report * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        /* Lay the report out at desktop width and scale it onto A4. At a true
           210mm width every slide took the phone layout and ran over two or three
           sheets. 0.72 gives ~1100 CSS px across and one A4 sheet per slide. */
        .iconik-report { padding: 0 !important; background: ${INK} !important; zoom: 0.72; }
        .iconik-page {
          width: auto !important;
          max-width: none !important;
          min-height: 412.4mm !important;
          margin: 0 !important;
          border-radius: 0 !important;
          break-after: page;
          page-break-after: always;
          box-shadow: none !important;
        }
        .cover-page { min-height: 412.4mm !important; }
        /* A slide that is still taller than a sheet breaks between cards, never through one. */
        .glass, .glass-dark, .premium-rule-card, .proportion-card, .dossier-card, .formula-card,
        .image-slot-frame, .outfit-art, .flatlay-frame, .diagram-card, .capsule-card, h2, h3 {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .slot-studio-toolbar, .slot-studio-empty, .slot-studio-busy, .slot-studio-saved, .slot-drop-hint, .cover-scroll-cue { display: none !important; }
        /* The paper-grain overlay is a screen texture; in a PDF it embeds an image
           per page (tens of MB) and prints as a dot screen. */
        .grain { display: none !important; }
        .iconik-report-reveal .iconik-page, .iconik-report-reveal .iconik-page > * { opacity: 1 !important; transform: none !important; }
        .iconik-report:not(.iconik-report-editable) .cover-page, .iconik-report:not(.iconik-report-editable) .cover-page * { animation: none !important; }
        .blueprint-deferred-shell { content-visibility: visible !important; contain-intrinsic-size: none !important; }
      }
    `}</style>
  );
}
