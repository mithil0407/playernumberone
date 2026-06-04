'use client';

// ManReport.tsx
// Renders the full ICONIK Men's Blueprint report.
// Design matches the embedded report preview on /man landing page exactly.

import { useState, useMemo, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, Loader2, AlertCircle, Copy, Upload } from 'lucide-react';
import type { ReportData, ClassificationResult } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls } from '@/lib/manImageGenerator';
import { SPRING } from '@/lib/reportAnimations';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { FaceImageKind } from '@/lib/manImageGenerator';
import type { ManReportQaIssue } from '@/lib/manReportQa';
import {
  comboGridGroupTitle,
  getComboGridGroupRawText,
  getComboGridGroupText,
  normaliseComboGridGroupText,
  normaliseComboGridText,
  stripComboGridTableSeparators,
  type ComboGridKind,
} from '@/lib/manComboGridSection';

// ─────────────────────────────────────────────────────────────
// Design tokens — modern editorial palette (refresh 2026-05)
// ─────────────────────────────────────────────────────────────

const ACCENT     = '#B97A3A';   // warm amber, less filigreed than the old gold
const ACCENT_INK = '#8C5621';   // deeper amber for text on light backgrounds
const INK        = '#1B1815';   // near-black for body copy
const INK_SOFT   = '#5A524A';   // muted ink for secondary copy
const IVORY      = '#FBF8F4';   // page background
const SHELL      = '#F5EFE5';   // soft shell for alternating sections
const BORDER     = '#E8DDC9';   // hairline divider
const SAGE       = '#8FA088';   // accent for "always do" rules
const OXBLOOD    = '#8A3A3A';   // accent for "never do" rules

// Blueprint page palette — matches the women's StylistBlueprintReport
const SLATE      = '#94A6AD';
const SLATE_LIGHT = '#A0B2B9';
const SLATE_DEEP = '#7E9098';
const PAPER      = '#F8F3E9';
const BONE       = '#EDE5D2';

const SECTION_REVEAL_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

// Editorial serif family — preferred order:
//   1. Playfair Display via CSS variable (already loaded in app/layout.tsx)
//   2. Fraunces / Tiempos / Cormorant if the host page injected them
//   3. Georgia as a last resort
const SERIF      = "var(--font-playfair, 'Fraunces'), 'Tiempos Headline', 'Cormorant Garamond', Georgia, serif";

// ─────────────────────────────────────────────────────────────
// Parsing helpers
// ─────────────────────────────────────────────────────────────

interface ParsedOutfit {
  number:      number;
  label:       string;
  context:     string;
  top:         string;
  bottom:      string;
  layer:       string;
  footwear:    string;
  accessories: string;
  fitNote:     string;
  colourLogic: string;
  whyItWorks:  string;
  shoppingTranslation: string;
  acceptableSubstitutes: string;
  doNotBuy: string;
}

interface OutfitCategory {
  name: string;
  intro: string;
  outfits: ParsedOutfit[];
}

export type ManReportSectionKey = 's0' | 's1' | 's2' | 's3' | 's4' | 's4g' | 's5s' | 's5g' | 's6';
export type ManReportSlideGroup = 'Opening' | 'Diagnosis' | 'Prescription' | 'Outfits' | 'Closing';

export interface ManReportSlideMeta {
  pageNumber: number;
  title: string;
  group: ManReportSlideGroup;
  sectionKey: ManReportSectionKey;
  slideType:
    | 'cover'
    | 'overview'
    | 'snapshot'
    | 'face'
    | 'body'
    | 'colour'
    | 'outfit_system'
    | 'outfit'
    | 'combo_grids'
    | 'shopping'
    | 'grooming'
    | 'identity';
  outfitNumber?: number;
}

// Strips hex colour codes like (FFFDD0) or (#FFFDD0) from outfit text
function stripHex(text: string): string {
  return text.replace(/\s*\(#?[0-9A-Fa-f]{3,6}\)/g, '').trim();
}

function getField(block: string, label: string): string {
  // Handles all known formats:
  //   "- Label: value"        (dash + title case)
  //   "LABEL: value"          (uppercase plain)
  //   "**Label:** value"      (AI-generated bold markdown)
  //   "**Label:** **value**"  (double bold)
  const pattern = new RegExp(
    `(?:^|\\n)[ \\t]*-?[ \\t]*\\*{0,2}${label}\\*{0,2}[ \\t]*:[ \\t]*\\*{0,2}(.+?)\\*{0,2}(?=\\n[ \\t]*-?[ \\t]*\\*{0,2}[\\w]|\\n\\n|\\n\\*\\*|$)`,
    'si'
  );
  const raw = block.match(pattern)?.[1]?.replace(/\n/g, ' ').trim() ?? '—';
  return stripHex(raw);
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Known context names from new format — used to detect if label IS the category
const KNOWN_CONTEXTS = new Set(['OFFICE / FORMAL', 'FORMAL', 'SMART CASUAL', 'EVENING WEAR', 'RELAXED CASUAL']);

function inferContextName(rawLabel: string, outfitNumber: number): string {
  if (/\boffice\b|\bformal\b/i.test(rawLabel)) return 'Office / Formal';
  if (/\bsmart\s+casual\b/i.test(rawLabel)) return 'Smart Casual';
  if (/\bevening\b/i.test(rawLabel)) return 'Evening Wear';
  if (/\brelaxed\s+casual\b|\bcasual\b/i.test(rawLabel)) return 'Relaxed Casual';
  if (outfitNumber >= 1 && outfitNumber <= 6) return 'Office / Formal';
  if (outfitNumber >= 7 && outfitNumber <= 10) return 'Smart Casual';
  if (outfitNumber >= 11 && outfitNumber <= 15) return 'Evening Wear';
  if (outfitNumber >= 16 && outfitNumber <= 20) return 'Relaxed Casual';
  return 'Outfits';
}

function parseOutfitCategories(text: string): OutfitCategory[] {
  // Supports both formats:
  //   Old: "**Outfit N — Descriptive Label**" with preceding category header blocks
  //   New: "OUTFIT N — CONTEXT NAME" (plain uppercase, context embedded in header)
  const outfitBlocks = text.split(/(?=(?:\*\*Outfit\s+\d+|\bOUTFIT\s+\d+))/i);

  const categories: OutfitCategory[] = [];
  let currentCat: OutfitCategory | null = null;

  for (const block of outfitBlocks) {
    const boldMatch  = block.match(/\*\*Outfit\s+(\d+)\s*[—–-]\s*([^*\n]+)\*\*/i);
    const plainMatch = block.match(/^OUTFIT\s+(\d+)\s*[—–-]\s*(.+)/im);
    const outfitMatch = boldMatch ?? plainMatch;

    if (!outfitMatch) {
      // Old format: category header block between outfits
      const catLine = block.split('\n').find(l => l.trim().length > 4 && !l.startsWith('#'));
      const catName = catLine?.replace(/\*\*/g, '').replace(/###/, '').trim() ?? '';
      if (catName && catName.length > 3 && catName.length < 60) {
        const introLines = block.split('\n').filter(l => l.trim() && !l.match(/^#+/) && !l.match(/\*\*Outfit|^OUTFIT/i));
        const intro = introLines.slice(1).join(' ').trim();
        currentCat = { name: catName, intro, outfits: [] };
        categories.push(currentCat);
      }
      continue;
    }

    const outfitNum  = parseInt(outfitMatch[1]);
    // Strip any residual ** markdown from the label (AI sometimes omits closing **)
    const rawLabel   = outfitMatch[2].replace(/\*+/g, '').trim();
    const isNewFormat = !boldMatch && !!plainMatch;

    // New format: label IS the context (e.g. "FORMAL") — group by it
    if (isNewFormat && KNOWN_CONTEXTS.has(rawLabel.toUpperCase())) {
      const catName = toTitleCase(rawLabel);
      let cat = categories.find(c => c.name === catName);
      if (!cat) {
        cat = { name: catName, intro: '', outfits: [] };
        categories.push(cat);
      }
      currentCat = cat;
    }

    const outfit: ParsedOutfit = {
      number:      outfitNum,
      label:       rawLabel,
      context:     inferContextName(rawLabel, outfitNum),
      top:         getField(block, 'Top'),
      bottom:      getField(block, 'Bottom'),
      layer:       getField(block, 'Layer(?:\\/Outerwear)?(?:\\/Layer)?'),
      footwear:    getField(block, 'Footwear'),
      accessories: getField(block, 'Accessor(?:y|ies)'),  // handles Accessory and Accessories
      fitNote:     getField(block, 'Fit note'),
      colourLogic: getField(block, 'Colour logic'),
      // "Occasion anchor" is the current prompt field; "Why it works" is the legacy field
      whyItWorks: (() => {
        const v = getField(block, 'Occasion anchor');
        return v !== '—' ? v : getField(block, 'Why it works(?:\\s+for\\s+you)?');
      })(),
      shoppingTranslation: getField(block, 'Shopping translation'),
      acceptableSubstitutes: getField(block, 'Acceptable substitutes'),
      doNotBuy: getField(block, 'Do not buy'),
    };

    if (!currentCat) {
      currentCat = { name: 'Outfits', intro: '', outfits: [] };
      categories.push(currentCat);
    }
    currentCat.outfits.push(outfit);
  }

  return categories.filter(c => c.outfits.length > 0);
}

export function getManReportSlideMeta(data: ReportData): ManReportSlideMeta[] {
  const sections = data.sections ?? {};
  const categories = parseOutfitCategories(sections.s4_outfits ?? '');
  const outfits = categories.flatMap(category => category.outfits.map(outfit => ({ category, outfit })));
  const slides: Omit<ManReportSlideMeta, 'pageNumber'>[] = [
    { title: 'Cover', group: 'Opening', sectionKey: 's0', slideType: 'cover' },
    { title: 'Overview', group: 'Opening', sectionKey: 's0', slideType: 'overview' },
  ];

  if (sections.s0_snapshot?.trim()) {
    slides.push({ title: 'Personal Style Snapshot', group: 'Opening', sectionKey: 's0', slideType: 'snapshot' });
  }

  slides.push(
    { title: 'Face Architecture', group: 'Diagnosis', sectionKey: 's1', slideType: 'face' },
    { title: 'Body Geometry', group: 'Diagnosis', sectionKey: 's2', slideType: 'body' },
    { title: 'Chromatic Harmony', group: 'Diagnosis', sectionKey: 's3', slideType: 'colour' },
    { title: 'Outfit System', group: 'Prescription', sectionKey: 's4', slideType: 'outfit_system' },
  );

  if (outfits.length > 0) {
    for (const { outfit } of outfits) {
      slides.push({
        title: `Outfit ${String(outfit.number).padStart(2, '0')}: ${outfit.label}`,
        group: 'Outfits',
        sectionKey: 's4',
        slideType: 'outfit',
        outfitNumber: outfit.number,
      });
    }
  } else if (sections.s4_outfits?.trim()) {
    slides.push({ title: 'Outfit Formulas', group: 'Outfits', sectionKey: 's4', slideType: 'outfit' });
  }

  if (sections.s4_combo_grids?.trim()) {
    slides.push({ title: 'Combination Grids', group: 'Outfits', sectionKey: 's4g', slideType: 'combo_grids' });
  }
  if ((sections.s5_shopping ?? sections.s5_rules)?.trim()) {
    slides.push({ title: 'Shopping & Fit', group: 'Prescription', sectionKey: 's5s', slideType: 'shopping' });
  }
  if (sections.s5_grooming_skin?.trim()) {
    slides.push({ title: 'Grooming & Skincare', group: 'Prescription', sectionKey: 's5g', slideType: 'grooming' });
  }
  slides.push({ title: 'Identity Statement', group: 'Closing', sectionKey: 's6', slideType: 'identity' });

  return slides.map((slide, index) => ({ ...slide, pageNumber: index + 1 }));
}

function extractOutfitBlock(s4Text: string, outfitNumber: number): string | null {
  const headerPattern = /(?:\*\*Outfit|OUTFIT)\s+(\d+)\s*[—–-][^\n]*/gi;
  const matches = Array.from(s4Text.matchAll(headerPattern));
  const matchIndex = matches.findIndex(match => Number(match[1]) === outfitNumber);
  if (matchIndex === -1) return null;

  const start = matches[matchIndex].index ?? 0;
  const end = matches[matchIndex + 1]?.index ?? s4Text.length;
  return s4Text.slice(start, end).trim();
}

// ─────────────────────────────────────────────────────────────
// Markdown renderer — handles ###, **bold**, - lists, paragraphs
// ─────────────────────────────────────────────────────────────

function richify(text: string): string {
  return text
    // bold must come before italic to avoid double-processing
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    // clean up any residual lone asterisks not part of formatting
    .replace(/(^|\s)\*(\s|$)/g, '$1$2');
}

interface ListItem { text: string; type: 'bullet' | 'cross' | 'check' }

function RenderMarkdown({ text, skipH2 = true }: { text: string; skipH2?: boolean }) {
  const lines    = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: ListItem[] = [];
  let orderedItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={key++} className="space-y-2.5 my-4">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              {item.type === 'cross' ? (
                <span className="text-[12px] font-medium mt-0.5 flex-shrink-0" style={{ color: OXBLOOD }}>✗</span>
              ) : item.type === 'check' ? (
                <span className="text-[12px] font-medium mt-0.5 flex-shrink-0" style={{ color: SAGE }}>✓</span>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: ACCENT + '88' }} />
              )}
              <span
                className="text-[13px] leading-relaxed"
                style={{ color: INK_SOFT, fontWeight: 400 }}
                dangerouslySetInnerHTML={{ __html: richify(item.text) }}
              />
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
    if (orderedItems.length) {
      elements.push(
        <ol key={key++} className="space-y-2.5 my-4">
          {orderedItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="text-[12px] flex-shrink-0 mt-0.5 w-5 italic"
                style={{ fontFamily: SERIF, color: ACCENT_INK, fontWeight: 500 }}
              >
                {i + 1}.
              </span>
              <span
                className="text-[13px] leading-relaxed"
                style={{ color: INK_SOFT, fontWeight: 400 }}
                dangerouslySetInnerHTML={{ __html: richify(item) }}
              />
            </li>
          ))}
        </ol>
      );
      orderedItems = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) { flushList(); continue; }
    if (line.startsWith('## ') && skipH2) continue;
    // Skip the outfit section confirmation line (e.g. "Total: 20 outfits confirmed…")
    if (/^total.*\d+.*outfits?\s+(confirmed|=)/i.test(line.trim())) continue;

    if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <p
          key={key++}
          className="text-[10px] font-semibold uppercase tracking-[0.16em] mt-6 mb-3 pl-3 py-1.5"
          style={{ color: ACCENT_INK, borderLeft: `2px solid ${ACCENT}66` }}
        >
          {line.slice(5).replace(/\*\*/g, '')}
        </p>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <div
          key={key++}
          className="mt-8 mb-4 pt-6"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <p className="text-[18px] md:text-[20px] italic leading-snug" style={{ fontFamily: SERIF, color: INK, fontWeight: 400 }}>
          {line.slice(4).replace(/\*\*/g, '')}
          </p>
        </div>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <p key={key++} className="text-[11px] font-medium uppercase tracking-[0.18em] mt-6 mb-3" style={{ color: ACCENT_INK }}>
          {line.slice(3).replace(/\*\*/g, '')}
        </p>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <p key={key++} className="text-lg italic mt-5 mb-2" style={{ fontFamily: SERIF, color: INK, fontWeight: 400 }}>
          {line.slice(2).replace(/\*\*/g, '')}
        </p>
      );
    } else if (/^\d+\.\s/.test(line)) {
      // Ordered list item
      if (listItems.length) flushList();
      orderedItems.push(line.replace(/^\d+\.\s+/, ''));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (orderedItems.length) flushList();
      listItems.push({ text: line.slice(2), type: 'bullet' });
    } else if (line.startsWith('✗ ') || line.startsWith('✘ ')) {
      if (orderedItems.length) flushList();
      listItems.push({ text: line.slice(2), type: 'cross' });
    } else if (line.startsWith('✓ ') || line.startsWith('✔ ')) {
      if (orderedItems.length) flushList();
      listItems.push({ text: line.slice(2), type: 'check' });
    } else if (/^(\*\*|__).+(\*\*|__)$/.test(line)) {
      // Standalone bold line = sub-label
      flushList();
      elements.push(
        <p key={key++} className="text-[13px] mt-5 mb-1.5"
          style={{ color: INK, fontWeight: 600 }}
          dangerouslySetInnerHTML={{ __html: richify(line) }} />
      );
    } else if (/^═+$/.test(line) || /^─+$/.test(line) || /^━+$/.test(line)) {
      // Divider lines — skip
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-[13px] leading-relaxed my-2"
          style={{ color: INK_SOFT, fontWeight: 400 }}
          dangerouslySetInnerHTML={{ __html: richify(line) }} />
      );
    }
  }

  flushList();
  return <div>{elements}</div>;
}

// ─────────────────────────────────────────────────────────────
// Shared section-header component
// ─────────────────────────────────────────────────────────────

// Section header: hairline + section number in serif italic on the left,
// label in soft caps on the right. Reads like a magazine spread, not a CSV row.
// SectionHeader is intentionally a no-op — section identity lives in ManPageFrame corner markers.
function SectionHeader({}: { label: string; number?: string }) {
  return null;
}

// Soft "stamp" — used sparingly. Replaces the heavy black GoldPill.
function GoldPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-3.5 py-1.5 text-[11px] font-medium tracking-wide rounded-full"
      style={{ background: ACCENT + '14', color: ACCENT_INK, border: `1px solid ${ACCENT}33` }}
    >
      {children}
    </span>
  );
}

// Data label — uses inherited page color so it reads on both slate and ivory pages.
function DataLabel({ children }: { children: React.ReactNode }) {
  return <span className="dossier-label">{children}</span>;
}

// "Stylist note" pull-quote — inherits page color, works on both slate and ivory pages.
function StylistNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-5 py-1" style={{ borderLeft: `2px solid ${ACCENT}55` }}>
      <p className="dossier-label" style={{ marginBottom: 8 }}>Stylist Rationale</p>
      <p className="display-it diagnosis-quote">&ldquo;{children}&rdquo;</p>
    </div>
  );
}

// Thin hairline divider — replaces the old `h-px bg-BORDER` everywhere.
function HairRule({ className = '' }: { className?: string }) {
  return <div className={`rule ${className}`} />;
}

type ManualImageTarget =
  | { imageType: 'face'; faceKind: FaceImageKind }
  | { imageType: 'outfit'; outfitNumber: number }
  | { imageType: 'comboGrid'; comboGridKind: ComboGridKind };

interface ManualImageUploadOptions {
  replace?: boolean;
}

interface ManualImageActionsProps {
  target: ManualImageTarget;
  onCopyImagePrompt?: (target: ManualImageTarget) => Promise<string | null>;
  onUploadManualImage?: (target: ManualImageTarget, file: File, options?: ManualImageUploadOptions) => Promise<string | null>;
  onUploaded?: (imageUrl: string) => void;
  title: string;
  description: string;
  disabled?: boolean;
}

function ManualImageActions({
  target,
  onCopyImagePrompt,
  onUploadManualImage,
  onUploaded,
  title,
  description,
  disabled,
}: ManualImageActionsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copying, setCopying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!onCopyImagePrompt || copying || disabled) return;
    setCopying(true);
    setNotice(null);
    try {
      const prompt = await onCopyImagePrompt(target);
      if (!prompt) {
        setNotice('Prompt unavailable');
        return;
      }
      await navigator.clipboard.writeText(prompt);
      setNotice('Prompt copied');
      setTimeout(() => setNotice(null), 1800);
    } catch {
      setNotice('Could not copy prompt');
    } finally {
      setCopying(false);
    }
  };

  const uploadFile = async (file: File | null | undefined) => {
    if (!onUploadManualImage || uploading || disabled) return;
    if (!file) {
      setNotice('Drop an image file');
      return;
    }
    if (file.type && !file.type.startsWith('image/')) {
      setNotice('Only image files can be uploaded');
      return;
    }
    setUploading(true);
    setNotice(null);
    try {
      const imageUrl = await onUploadManualImage(target, file, { replace: true });
      if (!imageUrl) {
        setNotice('Upload failed');
        return;
      }
      onUploaded?.(imageUrl);
      setNotice('Image uploaded');
      setTimeout(() => setNotice(null), 1800);
    } catch {
      setNotice('Upload failed');
    } finally {
      setUploading(false);
      setDragging(false);
    }
  };

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{
        background: dragging ? '#F1E7D7' : SHELL,
        border: dragging ? `2px dashed ${ACCENT}` : undefined,
      }}
      onDragEnter={event => {
        if (!onUploadManualImage || disabled) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={event => {
        if (!onUploadManualImage || disabled) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => {
        if (!onUploadManualImage || disabled) return;
        event.preventDefault();
        setDragging(false);
        void uploadFile(event.dataTransfer.files?.[0]);
      }}
    >
      <AlertCircle size={26} style={{ color: OXBLOOD, opacity: 0.7 }} />
      <div className="flex flex-col items-center gap-1">
        <p className="text-[12px] font-medium" style={{ color: OXBLOOD }}>{title}</p>
        <p className="text-[11px]" style={{ color: INK_SOFT }}>{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {onCopyImagePrompt && (
          <button
            onClick={handleCopy}
            disabled={copying || uploading || disabled}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-medium disabled:opacity-40"
            style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
          >
            {copying ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
            Copy prompt
          </button>
        )}
        {onUploadManualImage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={event => {
                void uploadFile(event.target.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={copying || uploading || disabled}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-medium disabled:opacity-40"
              style={{ background: ACCENT, color: '#fff', border: `1px solid ${ACCENT}` }}
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Upload image
            </button>
          </>
        )}
      </div>
      {onUploadManualImage && (
        <p className="text-[10px] leading-snug" style={{ color: dragging ? ACCENT_INK : INK_SOFT }}>
          {uploading ? 'Uploading image...' : dragging ? 'Release to place image' : 'Drop the downloaded image anywhere here'}
        </p>
      )}
      {notice && (
        <p className="text-[10px] leading-snug" style={{ color: notice.includes('failed') || notice.includes('Could') || notice.includes('Only') || notice.includes('Drop') ? OXBLOOD : SAGE }}>
          {notice}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 01 — Face Architecture
// ─────────────────────────────────────────────────────────────

interface FaceImageRegenerationResult {
  kind: FaceImageKind;
  optionIndex: number;
  imageUrl: string;
}

interface FaceStyleSwapDraftResult {
  candidateStyle: string;
  currentStyle: string;
  baseUpdatedAt: string;
  currentStyleHash: string;
}

interface FaceStyleSwapApplyResult {
  kind: FaceImageKind;
  optionIndex: number;
  imageUrl: string | null;
  candidateStyle: string;
  updatedFace: ReportData['classification']['face'];
}

function FaceSection({
  cls,
  text,
  hairstyleUrls,
  beardUrls,
  eyewearUrls,
  adminMode,
  onRegenerateFaceImage,
  onDraftFaceStyleSwap,
  onApplyFaceStyleSwap,
  onCopyImagePrompt,
  onUploadManualImage,
}: {
  cls: ClassificationResult;
  text: string;
  hairstyleUrls?: (string | null)[];
  beardUrls?: (string | null)[];
  eyewearUrls?: (string | null)[];
  adminMode?: boolean;
  onRegenerateFaceImage?: (
    kind: FaceImageKind,
    optionIndex: number,
  ) => Promise<FaceImageRegenerationResult | null>;
  onDraftFaceStyleSwap?: (input: {
    kind: FaceImageKind;
    optionIndex: number;
    reason: string;
    notes: string;
    replacementText: string;
    inspirationImage: File | null;
  }) => Promise<FaceStyleSwapDraftResult | null>;
  onApplyFaceStyleSwap?: (input: {
    kind: FaceImageKind;
    optionIndex: number;
    candidateStyle: string;
    baseUpdatedAt: string;
    currentStyleHash: string;
    reason: string;
    notes: string;
  }) => Promise<FaceStyleSwapApplyResult | null>;
  onRetryMissingImages?: () => Promise<void>;
  onCopyImagePrompt?: (target: ManualImageTarget) => Promise<string | null>;
  onUploadManualImage?: (target: ManualImageTarget, file: File, options?: ManualImageUploadOptions) => Promise<string | null>;
}) {
  const { face } = cls;
  const [hairstyleOverrides, setHairstyleOverrides] = useState<Record<number, string>>({});
  const [beardOverrides, setBeardOverrides] = useState<Record<number, string>>({});
  const [eyewearOverrides, setEyewearOverrides] = useState<Record<number, string>>({});
  const [brokenFaceImages, setBrokenFaceImages] = useState<Record<string, boolean>>({});
  const [styleSwapTarget, setStyleSwapTarget] = useState<{ kind: FaceImageKind; optionIndex: number } | null>(null);
  const [styleSwapReason, setStyleSwapReason] = useState('');
  const [styleSwapNotes, setStyleSwapNotes] = useState('');
  const [styleSwapText, setStyleSwapText] = useState('');
  const [styleSwapFile, setStyleSwapFile] = useState<File | null>(null);
  const [styleSwapPreview, setStyleSwapPreview] = useState<string | null>(null);
  const [styleSwapDraft, setStyleSwapDraft] = useState<FaceStyleSwapDraftResult | null>(null);
  const [styleSwapError, setStyleSwapError] = useState<string | null>(null);
  const [draftingStyleSwap, setDraftingStyleSwap] = useState(false);
  const [applyingStyleSwap, setApplyingStyleSwap] = useState(false);
  const [regeneratingGrid, setRegeneratingGrid] = useState<FaceImageKind | null>(null);
  const hasHairstyleImages = hairstyleUrls && hairstyleUrls.some(Boolean);
  const hasBeardImages = beardUrls && beardUrls.some(Boolean);
  const hasEyewearImages   = eyewearUrls && eyewearUrls.some(Boolean);
  const canStyleSwap = adminMode && !!onDraftFaceStyleSwap && !!onApplyFaceStyleSwap;
  const canRegenerateGrid = adminMode && !!onRegenerateFaceImage;

  const getCurrentFaceStyle = (kind: FaceImageKind, optionIndex: number): string => {
    if (kind === 'hairstyle') return face.hairstyle_recommendations?.[optionIndex - 1] ?? '';
    if (kind === 'beard') return face.beard_style_recommendations?.[optionIndex - 1] ?? '';
    return face.eyewear_shapes?.[optionIndex - 1] ?? '';
  };

  const closeStyleSwap = (force = false) => {
    if (!force && (draftingStyleSwap || applyingStyleSwap)) return;
    setStyleSwapTarget(null);
    setStyleSwapReason('');
    setStyleSwapNotes('');
    setStyleSwapText('');
    setStyleSwapFile(null);
    if (styleSwapPreview) URL.revokeObjectURL(styleSwapPreview);
    setStyleSwapPreview(null);
    setStyleSwapDraft(null);
    setStyleSwapError(null);
  };

  const startStyleSwap = (kind: FaceImageKind, optionIndex: number) => {
    if (!canStyleSwap || draftingStyleSwap || applyingStyleSwap) return;
    setStyleSwapTarget({ kind, optionIndex });
    setStyleSwapReason('');
    setStyleSwapNotes('');
    setStyleSwapText(getCurrentFaceStyle(kind, optionIndex));
    setStyleSwapFile(null);
    if (styleSwapPreview) URL.revokeObjectURL(styleSwapPreview);
    setStyleSwapPreview(null);
    setStyleSwapDraft(null);
    setStyleSwapError(null);
  };

  const handleStyleSwapImageChange = (file: File | null) => {
    setStyleSwapFile(file);
    setStyleSwapDraft(null);
    setStyleSwapError(null);
    if (styleSwapPreview) URL.revokeObjectURL(styleSwapPreview);
    setStyleSwapPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleDraftStyleSwap = async () => {
    if (!styleSwapTarget || !onDraftFaceStyleSwap) return;
    setDraftingStyleSwap(true);
    setStyleSwapDraft(null);
    setStyleSwapError(null);
    try {
      const result = await onDraftFaceStyleSwap({
        ...styleSwapTarget,
        reason: styleSwapReason,
        notes: styleSwapNotes,
        replacementText: styleSwapText,
        inspirationImage: styleSwapFile,
      });
      if (!result) {
        setStyleSwapError('Could not draft a replacement style. Please try again.');
        return;
      }
      setStyleSwapDraft(result);
    } finally {
      setDraftingStyleSwap(false);
    }
  };

  const handleApplyStyleSwap = async () => {
    if (!styleSwapTarget || !styleSwapDraft || !onApplyFaceStyleSwap) return;
    setApplyingStyleSwap(true);
    setStyleSwapError(null);
    try {
      const result = await onApplyFaceStyleSwap({
        ...styleSwapTarget,
        candidateStyle: styleSwapDraft.candidateStyle,
        baseUpdatedAt: styleSwapDraft.baseUpdatedAt,
        currentStyleHash: styleSwapDraft.currentStyleHash,
        reason: styleSwapReason,
        notes: styleSwapNotes,
      });
      if (!result) {
        setStyleSwapError('Could not apply the replacement style. Please try again.');
        return;
      }

      if (result.imageUrl) {
        if (result.kind === 'hairstyle') {
          setHairstyleOverrides(prev => ({ ...prev, 0: result.imageUrl!, [result.optionIndex]: result.imageUrl! }));
        } else if (result.kind === 'beard') {
          setBeardOverrides(prev => ({ ...prev, 0: result.imageUrl!, [result.optionIndex]: result.imageUrl! }));
        } else {
          setEyewearOverrides(prev => ({ ...prev, 0: result.imageUrl!, [result.optionIndex]: result.imageUrl! }));
        }
      }
      closeStyleSwap(true);
    } finally {
      setApplyingStyleSwap(false);
    }
  };

  const renderFaceImageSlot = (kind: FaceImageKind, url: string | null | undefined, optionIndex: number) => {
    const imageKey = `${kind}:${optionIndex}`;
    const sourceUrl = kind === 'hairstyle'
      ? hairstyleOverrides[optionIndex] ?? url
      : kind === 'beard'
        ? beardOverrides[optionIndex] ?? url
      : eyewearOverrides[optionIndex] ?? url;
    const effectiveUrl = brokenFaceImages[imageKey] ? null : sourceUrl;
    const canManualRecover = adminMode && (!!onCopyImagePrompt || !!onUploadManualImage);
    const currentStyle = getCurrentFaceStyle(kind, optionIndex);

    return (
      <div key={optionIndex} className="flex flex-col gap-3">
        <div
          className="w-full overflow-hidden relative rounded-2xl"
          style={{
            aspectRatio: '3/4',
            background: SHELL,
            boxShadow: '0 24px 60px -36px rgba(27,24,21,0.35)',
          }}
        >
          {effectiveUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={effectiveUrl}
              alt={`${kind} option ${optionIndex}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top"
              style={{ opacity: 0, transition: 'opacity 0.5s ease' }}
              onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
              onError={() => setBrokenFaceImages(prev => ({ ...prev, [imageKey]: true }))}
            />
          ) : canManualRecover ? (
            <ManualImageActions
              target={{ imageType: 'face', faceKind: kind }}
              title="Image failed"
              description={sourceUrl ? 'Image could not load' : 'Generation did not complete'}
              onCopyImagePrompt={onCopyImagePrompt}
              onUploadManualImage={onUploadManualImage}
              onUploaded={imageUrl => {
                setBrokenFaceImages(prev => ({ ...prev, [imageKey]: false, [`${kind}:0`]: false }));
                if (kind === 'hairstyle') {
                  setHairstyleOverrides(prev => ({ ...prev, 0: imageUrl, [optionIndex]: imageUrl }));
                } else if (kind === 'beard') {
                  setBeardOverrides(prev => ({ ...prev, 0: imageUrl, [optionIndex]: imageUrl }));
                } else {
                  setEyewearOverrides(prev => ({ ...prev, 0: imageUrl, [optionIndex]: imageUrl }));
                }
              }}
            />
          ) : (
            <div className="w-full h-full skeleton-shimmer flex items-center justify-center">
              <span className="text-[11px]" style={{ color: INK_SOFT }}>Generating…</span>
            </div>
          )}
        </div>
        {currentStyle && (
          <p
            className="text-center text-[12px] leading-snug px-1"
            style={{ color: INK_SOFT }}
          >
            {currentStyle}
          </p>
        )}
        <span
          className="text-center text-[12px] italic"
          style={{ fontFamily: SERIF, color: ACCENT_INK, fontWeight: 400 }}
        >
          Option {optionIndex}
        </span>
        {canStyleSwap && (
          <button
            onClick={() => startStyleSwap(kind, optionIndex)}
            disabled={draftingStyleSwap || applyingStyleSwap}
            className="mx-auto px-3 py-1.5 rounded-full text-[11px] font-medium disabled:opacity-40"
            style={{ background: SHELL, color: INK_SOFT, border: `1px solid ${BORDER}` }}
          >
            Edit / Swap
          </button>
        )}
      </div>
    );
  };

  const getGridUrl = (kind: FaceImageKind, urls: (string | null)[] | undefined): string | null | undefined => {
    if (kind === 'hairstyle') return hairstyleOverrides[0] ?? urls?.[0];
    if (kind === 'beard') return beardOverrides[0] ?? urls?.[0];
    return eyewearOverrides[0] ?? urls?.[0];
  };

  const getFaceOptions = (kind: FaceImageKind): string[] => {
    if (kind === 'hairstyle') return face.hairstyle_recommendations ?? [];
    if (kind === 'beard') return face.beard_style_recommendations ?? [];
    return face.eyewear_shapes ?? [];
  };

  const renderFaceGrid = (
    kind: FaceImageKind,
    urls: (string | null)[] | undefined,
    title: string,
  ) => {
    const imageKey = `${kind}:0`;
    const sourceGridUrl = getGridUrl(kind, urls);
    const gridUrl = brokenFaceImages[imageKey] ? null : sourceGridUrl;
    const canManualRecover = adminMode && (!!onCopyImagePrompt || !!onUploadManualImage);
    const options = getFaceOptions(kind).slice(0, 4);
    const labels = kind === 'eyewear'
      ? ['Top left optical frame', 'Top right optical frame', 'Bottom left sunglasses', 'Bottom right sunglasses']
      : ['Top left', 'Top right', 'Bottom left', 'Bottom right'];

    const handleRegenerateGrid = async () => {
      if (!onRegenerateFaceImage) return;
      setRegeneratingGrid(kind);
      try {
        const result = await onRegenerateFaceImage(kind, 1);
        if (!result?.imageUrl) return;
        setBrokenFaceImages(prev => ({ ...prev, [imageKey]: false }));
        if (kind === 'hairstyle') {
          setHairstyleOverrides(prev => ({ ...prev, 0: result.imageUrl, 1: result.imageUrl }));
        } else if (kind === 'beard') {
          setBeardOverrides(prev => ({ ...prev, 0: result.imageUrl, 1: result.imageUrl }));
        } else {
          setEyewearOverrides(prev => ({ ...prev, 0: result.imageUrl, 1: result.imageUrl }));
        }
      } finally {
        setRegeneratingGrid(null);
      }
    };

    return (
      <div className="mb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: ACCENT_INK }}>
            {title}
          </p>
          {canRegenerateGrid && (
            <button
              onClick={handleRegenerateGrid}
              disabled={regeneratingGrid === kind}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium disabled:opacity-45"
              style={{ background: SHELL, color: INK_SOFT, border: `1px solid ${BORDER}` }}
            >
              {regeneratingGrid === kind ? <Loader2 size={11} className="animate-spin" /> : null}
              {regeneratingGrid === kind ? 'Regenerating...' : 'Regenerate grid'}
            </button>
          )}
        </div>
        <div
          className="w-full overflow-hidden relative rounded-2xl"
          style={{
            ...(gridUrl ? {} : { aspectRatio: '1/1' }),
            background: SHELL,
            boxShadow: '0 24px 60px -36px rgba(27,24,21,0.35)',
          }}
        >
          {gridUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gridUrl}
              alt={`${kind} 2x2 recommendation grid`}
              loading="lazy"
              decoding="async"
              className="w-full h-auto block"
              style={{ opacity: 0, transition: 'opacity 0.5s ease' }}
              onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
              onError={() => setBrokenFaceImages(prev => ({ ...prev, [imageKey]: true }))}
            />
          ) : canManualRecover ? (
            <ManualImageActions
              target={{ imageType: 'face', faceKind: kind }}
              title="Grid failed"
              description={sourceGridUrl ? 'Grid image could not load' : 'Generation did not complete'}
              onCopyImagePrompt={onCopyImagePrompt}
              onUploadManualImage={onUploadManualImage}
              onUploaded={imageUrl => {
                setBrokenFaceImages(prev => ({ ...prev, [imageKey]: false, [`${kind}:1`]: false }));
                if (kind === 'hairstyle') {
                  setHairstyleOverrides(prev => ({ ...prev, 0: imageUrl, 1: imageUrl }));
                } else if (kind === 'beard') {
                  setBeardOverrides(prev => ({ ...prev, 0: imageUrl, 1: imageUrl }));
                } else {
                  setEyewearOverrides(prev => ({ ...prev, 0: imageUrl, 1: imageUrl }));
                }
              }}
            />
          ) : (
            <div className="w-full h-full skeleton-shimmer flex items-center justify-center">
              <span className="text-[11px]" style={{ color: INK_SOFT }}>Generating…</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
          {[0, 1, 2, 3].map(index => (
            <div key={index} className="rounded-2xl p-4" style={{ background: SHELL, border: `1px solid ${BORDER}` }}>
              <DataLabel>{labels[index]}</DataLabel>
              <p className="text-[12px] leading-relaxed" style={{ color: INK_SOFT }}>
                {options[index] || 'Recommendation pending'}
              </p>
              {canStyleSwap && (
                <button
                  onClick={() => startStyleSwap(kind, index + 1)}
                  disabled={draftingStyleSwap || applyingStyleSwap}
                  className="mt-3 px-3 py-1.5 rounded-full text-[11px] font-medium disabled:opacity-40"
                  style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                >
                  Edit / Swap
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="man-page slate">
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Section</div>
        <div className="man-small-caps corner-title">Facial Architecture</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">01</div>
      </div>
      <SectionHeader number="01" label="Facial Architecture" />
      <div className="man-page-inner">
        <h2>
          <span className="display">Face</span>
          <span className="display-it">architecture.</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <GoldPill>{face.face_shape} face</GoldPill>
          <span className="text-[12px] faded">
            {face.feature_type} feature type
          </span>
        </div>

        {/* New reports store one 2x2 grid at index 0; old reports with multiple cards use the legacy card layout. */}
        {(face.hairstyle_recommendations?.length ?? 0) >= 4 || ((hairstyleUrls?.length ?? 0) === 1 && !!hairstyleUrls?.[0])
          ? renderFaceGrid('hairstyle', hairstyleUrls, 'Hairstyle options')
          : hasHairstyleImages && (
            <div className="mb-10">
              <p className="dossier-label" style={{ fontSize: 11, marginBottom: 20 }}>
                Hairstyle options
              </p>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {[1, 2].map(optionIndex =>
                  renderFaceImageSlot('hairstyle', hairstyleUrls?.[optionIndex - 1] ?? null, optionIndex),
                )}
              </div>
            </div>
          )}

        {(face.beard_style_recommendations?.length ?? 0) >= 4 || ((beardUrls?.length ?? 0) === 1 && !!beardUrls?.[0])
          ? renderFaceGrid('beard', beardUrls, 'Beard & facial hair options')
          : hasBeardImages && (
            <div className="mb-10">
              <p className="dossier-label" style={{ fontSize: 11, marginBottom: 20 }}>
                Beard & facial hair options
              </p>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {[1, 2].map(optionIndex =>
                  renderFaceImageSlot('beard', beardUrls?.[optionIndex - 1] ?? null, optionIndex),
                )}
              </div>
            </div>
          )}

        {(face.eyewear_shapes?.length ?? 0) >= 4 || ((eyewearUrls?.length ?? 0) === 1 && !!eyewearUrls?.[0])
          ? renderFaceGrid('eyewear', eyewearUrls, 'Eyewear options')
          : hasEyewearImages && (
            <div className="mb-10">
              <p className="dossier-label" style={{ fontSize: 11, marginBottom: 20 }}>
                Eyewear options
              </p>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {[1, 2].map(optionIndex =>
                  renderFaceImageSlot('eyewear', eyewearUrls?.[optionIndex - 1] ?? null, optionIndex),
                )}
              </div>
            </div>
          )}

        {/* Eyewear & Facial Hair */}
        <HairRule className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <DataLabel>Eyewear</DataLabel>
            <span className="text-[14px]" style={{ color: INK }}>{face.eyewear_shapes.join(' · ')}</span>
          </div>
          <div>
            <DataLabel>Facial Hair</DataLabel>
            <span className="text-[14px]" style={{ color: INK }}>{face.facial_hair_recommendations}</span>
          </div>
        </div>

        {/* Narrative */}
        {text && (
          <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(244,239,229,0.18)' }}>
            <div className="glass-dark" style={{ padding: '24px 28px' }}>
              <RenderMarkdown text={text} />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {styleSwapTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(27,24,21,0.58)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <motion.div
              className="w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col"
              style={{ background: IVORY, maxHeight: '90vh', boxShadow: '0 35px 110px -45px rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={SPRING}
            >
              <div className="flex items-start justify-between gap-4 px-6 py-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] mb-1" style={{ color: ACCENT_INK }}>
                    Edit / Swap {styleSwapTarget.kind} option {styleSwapTarget.optionIndex}
                  </p>
                  <p className="text-xl italic leading-tight" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
                    Replace the recommendation text and regenerate this one image.
                  </p>
                </div>
                <button
                  onClick={() => closeStyleSwap()}
                  disabled={draftingStyleSwap || applyingStyleSwap}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
                  style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="rounded-2xl p-4" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                    <DataLabel>Rejection reason</DataLabel>
                    <input
                      value={styleSwapReason}
                      onChange={e => {
                        setStyleSwapReason(e.target.value);
                        setStyleSwapDraft(null);
                      }}
                      placeholder="Wrong style, too close to original, needs stronger direction..."
                      className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
                      style={{ background: IVORY, border: `1px solid ${BORDER}`, color: INK }}
                    />
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                    <DataLabel>Replacement style text</DataLabel>
                    <textarea
                      value={styleSwapText}
                      onChange={e => {
                        setStyleSwapText(e.target.value);
                        setStyleSwapDraft(null);
                      }}
                      placeholder="Describe the exact beard, hairstyle, or eyewear frame to apply."
                      className="w-full min-h-[110px] rounded-xl px-3 py-2 text-[12px] leading-relaxed outline-none resize-none"
                      style={{ background: IVORY, border: `1px solid ${BORDER}`, color: INK }}
                    />
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                    <DataLabel>Inspiration image</DataLabel>
                    <label
                      className="block rounded-2xl overflow-hidden cursor-pointer"
                      style={{ background: SHELL, border: `1px dashed ${ACCENT}66`, aspectRatio: '4/3' }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleStyleSwapImageChange(e.target.files?.[0] ?? null)}
                      />
                      {styleSwapPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={styleSwapPreview} alt="Style inspiration" className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center px-5 text-center">
                          <span className="text-[12px]" style={{ color: INK_SOFT }}>Upload a reference image</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                    <DataLabel>Internal notes</DataLabel>
                    <textarea
                      value={styleSwapNotes}
                      onChange={e => {
                        setStyleSwapNotes(e.target.value);
                        setStyleSwapDraft(null);
                      }}
                      placeholder="Optional"
                      className="w-full min-h-[80px] rounded-xl px-3 py-2 text-[12px] leading-relaxed outline-none resize-none"
                      style={{ background: IVORY, border: `1px solid ${BORDER}`, color: INK }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl p-4 min-h-[360px]" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <DataLabel>Replacement preview</DataLabel>
                    {styleSwapDraft && (
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: SAGE }}>
                        Ready
                      </span>
                    )}
                  </div>

                  {styleSwapError && (
                    <div className="flex items-start gap-2 rounded-xl px-3 py-2 mb-4" style={{ background: '#fff2f2', color: OXBLOOD }}>
                      <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] leading-relaxed">{styleSwapError}</p>
                    </div>
                  )}

                  {draftingStyleSwap ? (
                    <div className="h-full min-h-[260px] flex flex-col items-center justify-center gap-3">
                      <Loader2 size={22} className="animate-spin" style={{ color: ACCENT }} />
                      <p className="text-[12px]" style={{ color: INK_SOFT }}>Drafting replacement…</p>
                    </div>
                  ) : styleSwapDraft ? (
                    <div className="space-y-4">
                      <div>
                        <DataLabel>Current style</DataLabel>
                        <p className="text-[12px] leading-relaxed" style={{ color: INK_SOFT }}>{styleSwapDraft.currentStyle}</p>
                      </div>
                      <HairRule />
                      <div>
                        <DataLabel>Replacement style</DataLabel>
                        <p className="text-xl italic leading-snug" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
                          {styleSwapDraft.candidateStyle}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[260px] flex items-center justify-center px-6 text-center">
                      <p className="text-[12px] leading-relaxed" style={{ color: INK_SOFT }}>
                        Draft a replacement first. The report will not change until you apply it.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                <p className="text-[11px] leading-relaxed" style={{ color: INK_SOFT }}>
                  Apply commits only after the replacement image is generated successfully.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => closeStyleSwap()}
                    disabled={draftingStyleSwap || applyingStyleSwap}
                    className="px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleDraftStyleSwap}
                    disabled={draftingStyleSwap || applyingStyleSwap || (!styleSwapReason && !styleSwapNotes && !styleSwapText && !styleSwapFile)}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: SHELL, color: INK, border: `1px solid ${BORDER}` }}
                    whileHover={!draftingStyleSwap && !applyingStyleSwap ? { scale: 1.02 } : undefined}
                    whileTap={!draftingStyleSwap && !applyingStyleSwap ? { scale: 0.98 } : undefined}
                    transition={SPRING}
                  >
                    {draftingStyleSwap ? <><Loader2 size={13} className="animate-spin" /> Drafting…</> : 'Draft style'}
                  </motion.button>
                  <motion.button
                    onClick={handleApplyStyleSwap}
                    disabled={applyingStyleSwap || draftingStyleSwap || !styleSwapDraft}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: ACCENT, color: '#fff' }}
                    whileHover={!applyingStyleSwap ? { scale: 1.02 } : undefined}
                    whileTap={!applyingStyleSwap ? { scale: 0.98 } : undefined}
                    transition={SPRING}
                  >
                    {applyingStyleSwap ? <><Loader2 size={13} className="animate-spin" /> Applying + generating…</> : 'Apply replacement'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 02 — Body Geometry
// ─────────────────────────────────────────────────────────────

// Tiny SVG icons that anchor abstract fit instructions to something visual.
function FitDiagram({ kind }: { kind: 'top' | 'trouser' | 'shoulder' }) {
  const stroke = ACCENT;
  const soft = ACCENT + '33';
  const common = { width: 64, height: 64, viewBox: '0 0 64 64', fill: 'none' } as const;
  if (kind === 'top') {
    return (
      <svg {...common}>
        <path d="M16 18 L24 12 L40 12 L48 18 L48 50 L16 50 Z" stroke={stroke} strokeWidth={1.4} />
        <path d="M24 12 Q32 18 40 12" stroke={soft} strokeWidth={1.2} />
        <path d="M16 50 L48 50" stroke={stroke} strokeWidth={1.4} />
      </svg>
    );
  }
  if (kind === 'trouser') {
    return (
      <svg {...common}>
        <path d="M22 10 H42 L40 36 L38 56 H32 L31 36 L30 56 H24 L22 36 Z" stroke={stroke} strokeWidth={1.4} />
        <path d="M30 36 L34 36" stroke={soft} strokeWidth={1.2} />
        <path d="M28 52 L32 56" stroke={soft} strokeWidth={1.2} />
        <path d="M36 52 L32 56" stroke={soft} strokeWidth={1.2} />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 28 Q32 14 52 28" stroke={stroke} strokeWidth={1.4} />
      <circle cx={32} cy={20} r={4} stroke={stroke} strokeWidth={1.4} />
      <path d="M14 32 L50 32" stroke={soft} strokeWidth={1.2} />
    </svg>
  );
}

function BodySection({ cls, text }: { cls: ClassificationResult; text: string }) {
  const { body } = cls;

  // Pull short directive copy from the classification — fall back gracefully if absent.
  const fitNotes = [
    { kind: 'shoulder' as const, label: 'Shoulder line', note: body.silhouette_rules?.[0] ?? body.fit_directive },
    { kind: 'top' as const,      label: 'Top fit',       note: body.silhouette_rules?.[1] ?? body.fit_directive },
    { kind: 'trouser' as const,  label: 'Trouser break', note: body.silhouette_rules?.[2] ?? 'Slight break, tapered.' },
  ];

  return (
    <section className="man-page ivory">
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Section</div>
        <div className="man-small-caps corner-title">Body Geometry</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">02</div>
      </div>
      <SectionHeader number="02" label="Body Geometry" />
      <div className="man-page-inner">
        <h2>
          <span className="display">Body</span>
          <span className="display-it">geometry.</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <GoldPill>{body.silhouette_type} build</GoldPill>
          <span className="text-[12px] faded">Your dominant frame geometry</span>
        </div>

        {/* Fit diagram strip — visual anchor for abstract fit copy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          {fitNotes.map((row) => (
            <div
              key={row.kind}
              className="rounded-2xl p-5 flex items-start gap-4"
              style={{ background: '#fff', boxShadow: '0 18px 40px -32px rgba(27,24,21,0.18)' }}
            >
              <FitDiagram kind={row.kind} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] mb-1.5" style={{ color: ACCENT_INK }}>
                  {row.label}
                </p>
                <p className="text-[13px] leading-snug" style={{ color: INK }}>{row.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two-column body content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-5" style={{ color: ACCENT_INK }}>
              Your fit blueprint
            </p>
            <div className="space-y-4">
              {body.silhouette_rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span
                    className="text-[14px] italic flex-shrink-0 mt-0.5"
                    style={{ fontFamily: SERIF, color: ACCENT, fontWeight: 500 }}
                  >
                    0{i + 1}
                  </span>
                  <span className="text-[13px] leading-relaxed" style={{ color: INK }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-5" style={{ color: OXBLOOD }}>
              Cuts to avoid
            </p>
            <div className="space-y-3 mb-8">
              {body.avoid_cuts.map((cut, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[12px] mt-0.5 flex-shrink-0" style={{ color: OXBLOOD }}>✗</span>
                  <span className="text-[13px] leading-relaxed" style={{ color: INK_SOFT }}>{cut}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-5" style={{ background: '#fff', boxShadow: '0 18px 40px -32px rgba(27,24,21,0.18)' }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] mb-2" style={{ color: ACCENT_INK }}>
                Height equation
              </p>
              <p className="text-[14px] italic leading-relaxed" style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
                {body.height_adjustment}
              </p>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
          {[
            { label: 'Silhouette',    value: body.silhouette_type },
            { label: 'Fit directive', value: body.fit_directive },
            { label: 'Highlight',     value: body.highlight_zone || '—' },
            { label: 'Minimise',      value: body.minimise_zone  || '—' },
          ].map((row, i) => (
            <div key={i}>
              <DataLabel>{row.label}</DataLabel>
              <span className="text-[13px]" style={{ color: INK }}>{row.value}</span>
            </div>
          ))}
        </div>

        {text && (
          <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div
              className="rounded-3xl p-6 md:p-8"
              style={{ background: '#fff', border: `1px solid ${BORDER}`, boxShadow: '0 22px 50px -42px rgba(27,24,21,0.25)' }}
            >
              <RenderMarkdown text={text} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 03 — Chromatic Harmony Map
// ─────────────────────────────────────────────────────────────

// Circular swatch with name underneath in serif italic.
function Swatch({
  hex, name, size = 56, strikethrough = false,
}: { hex: string; name: string; size?: number; strikethrough?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: hex,
            boxShadow: '0 8px 22px -10px rgba(27,24,21,0.35), inset 0 0 0 1px rgba(255,255,255,0.45)',
          }}
        />
        {strikethrough && (
          <>
            <span className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.35)' }} />
            <span className="absolute left-1 right-1 top-1/2 h-px rotate-12" style={{ background: OXBLOOD }} />
          </>
        )}
      </div>
      <span
        className="text-[11px] italic text-center leading-tight max-w-[90px]"
        style={{ fontFamily: SERIF, color: INK, fontWeight: 400 }}
      >
        {name}
      </span>
    </div>
  );
}

function ColourSection({ cls }: { cls: ClassificationResult; text: string }) {
  const { colour } = cls;
  return (
    <section className="man-page bone">
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Section</div>
        <div className="man-small-caps corner-title">Chromatic Harmony</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">03</div>
      </div>
      <SectionHeader number="03" label="Chromatic Harmony" />
      <div className="man-page-inner">
        <h2>
          <span className="display">Chromatic</span>
          <span className="display-it">harmony.</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <GoldPill>{colour.undertone} undertone · {colour.skin_tone_depth}</GoldPill>
          <span className="text-[12px] faded">{colour.season}</span>
        </div>

        {/* Primary palette — full-width hero strip */}
        <div className="mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-6" style={{ color: ACCENT_INK }}>
            Your primary palette
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-7 mb-8">
            {colour.primary_palette.map((c, i) => (
              <Swatch key={i} hex={c.hex} name={c.name} size={68} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
            {colour.primary_palette.map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: c.hex, boxShadow: '0 0 0 1px rgba(27,24,21,0.08)' }}
                />
                <span className="text-[12px] leading-snug" style={{ color: INK_SOFT }}>
                  <strong style={{ color: INK, fontWeight: 600 }}>{c.name}</strong> — {c.usage}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Three-column block: avoid / neutrals / accents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-10">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-5" style={{ color: OXBLOOD }}>
              Eliminate these
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-6">
              {colour.colours_to_avoid.map((c, i) => (
                <Swatch key={i} hex={c.hex} name={c.name} size={48} strikethrough />
              ))}
            </div>
            {colour.colours_to_avoid.length > 0 && (
              <p className="mt-5 text-[12px] italic leading-relaxed" style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
                {colour.colours_to_avoid.map(c => c.reason).join(' · ')}
              </p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-5" style={{ color: ACCENT_INK }}>
              Neutral base
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-6">
              {colour.neutral_base_colours.map((c, i) => (
                <Swatch key={i} hex={c.hex} name={c.name} size={48} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-5" style={{ color: ACCENT_INK }}>
              Accent
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-6">
              {colour.accent_colours.map((c, i) => (
                <Swatch key={i} hex={c.hex} name={c.name} size={48} />
              ))}
            </div>
          </div>
        </div>

        {/* Pattern & Fabric pull-quote */}
        <div
          className="rounded-2xl p-6 md:p-7"
          style={{ background: SHELL, boxShadow: '0 18px 40px -32px rgba(27,24,21,0.18)' }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] mb-3" style={{ color: ACCENT_INK }}>
            Pattern & fabric
          </p>
          <p className="text-[14px] italic leading-relaxed" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
            {colour.pattern_guidance}
          </p>
          <p className="text-[14px] italic leading-relaxed mt-3" style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
            {colour.fabric_tone_guidance}
          </p>
        </div>
      </div>
    </section>
  );
}

function SnapshotSection({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <section className="man-page ivory">
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Section</div>
        <div className="man-small-caps corner-title">Personal Style Snapshot</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">00</div>
      </div>
      <SectionHeader number="00" label="Personal Style Snapshot" />
      <div className="man-page-inner">
        <h2>
          <span className="display">Personal</span>
          <span className="display-it">snapshot.</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />
        <div
          className="rounded-3xl p-7 md:p-9"
          style={{ background: 'rgba(44,38,34,0.04)', border: `1px solid ${BORDER}` }}
        >
          <RenderMarkdown text={text} />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 04 — 20 Outfits
// ─────────────────────────────────────────────────────────────

interface OutfitEditResult {
  imageUrl: string | null;
  updatedS4Outfits: string;
  imageStatus: 'generated' | 'failed';
  error?: string;
}

interface OutfitSaveTextResult {
  updatedS4Outfits: string;
}

interface ComboGridSaveTextResult {
  updatedComboGridText: string;
}

interface ComboGridRegenerationResult {
  updatedComboGridText: string;
  comboGridCards?: ResolvedImageUrls['comboGridCards'];
  imageStatus: 'generated' | 'partial' | 'failed';
  gridErrors?: Partial<Record<'office' | 'evening' | 'relaxed', string>>;
  error?: string | null;
  kind?: ComboGridKind | null;
}

interface OutfitSwapDraftResult {
  candidateBlock: string;
  parsedPreview: ParsedOutfit | null;
  qaIssues: ManReportQaIssue[];
  blockingIssues: ManReportQaIssue[];
  baseUpdatedAt: string;
  currentOutfitHash: string;
}

interface OutfitSwapApplyResult {
  imageUrl: string | null;
  updatedS4Outfits: string;
  qa?: ReportData['qa'];
}

function OutfitsSection({
  cls, text, outfitImageUrls, adminMode, onRegenerateOutfit, onSaveOutfitText, onDraftOutfitSwap, onApplyOutfitSwap, onCopyImagePrompt, onUploadManualImage, qaPassedOutfits, focusPageNumber, slideMeta,
}: {
  cls: ClassificationResult;
  text: string;
  outfitImageUrls?: (string | null)[];
  adminMode?: boolean;
  onRegenerateOutfit?: (
    outfitNumber: number,
    newText: string,
  ) => Promise<OutfitEditResult | null>;
  onSaveOutfitText?: (
    outfitNumber: number,
    newText: string,
  ) => Promise<OutfitSaveTextResult | null>;
  onDraftOutfitSwap?: (input: {
    outfitNumber: number;
    reason: string;
    notes: string;
    inspirationText: string;
    inspirationImage: File | null;
  }) => Promise<OutfitSwapDraftResult | null>;
  onApplyOutfitSwap?: (input: {
    outfitNumber: number;
    candidateBlock: string;
    baseUpdatedAt: string;
    currentOutfitHash: string;
    reason: string;
    notes: string;
  }) => Promise<OutfitSwapApplyResult | null>;
  onCopyImagePrompt?: (target: ManualImageTarget) => Promise<string | null>;
  onUploadManualImage?: (target: ManualImageTarget, file: File, options?: ManualImageUploadOptions) => Promise<string | null>;
  qaPassedOutfits?: Set<number>; // outfit numbers without QA errors
  focusPageNumber?: number;
  slideMeta: ManReportSlideMeta[];
}) {
  const [editingNumber, setEditingNumber] = useState<number | null>(null);
  const [editText, setEditText]           = useState('');
  const [editError, setEditError]         = useState<string | null>(null);
  const [sectionNotice, setSectionNotice] = useState<string | null>(null);
  const [regenerating, setRegenerating]   = useState(false);
  const [savingText, setSavingText]       = useState(false);
  const [imageOverrides, setImageOverrides] = useState<Record<number, string>>({});
  const [brokenOutfitImages, setBrokenOutfitImages] = useState<Record<number, boolean>>({});
  const [swapNumber, setSwapNumber] = useState<number | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [swapNotes, setSwapNotes] = useState('');
  const [swapInspirationText, setSwapInspirationText] = useState('');
  const [swapImageFile, setSwapImageFile] = useState<File | null>(null);
  const [swapImagePreview, setSwapImagePreview] = useState<string | null>(null);
  const [swapDraft, setSwapDraft] = useState<OutfitSwapDraftResult | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [draftingSwap, setDraftingSwap] = useState(false);
  const [applyingSwap, setApplyingSwap] = useState(false);

  const closeSwap = () => {
    if (draftingSwap || applyingSwap) return;
    setSwapNumber(null);
    setSwapReason('');
    setSwapNotes('');
    setSwapInspirationText('');
    setSwapImageFile(null);
    setSwapImagePreview(null);
    setSwapDraft(null);
    setSwapError(null);
  };

  const startSwap = (outfitNumber: number) => {
    if (regenerating || draftingSwap || applyingSwap) return;
    setSwapNumber(outfitNumber);
    setSwapReason('');
    setSwapNotes('');
    setSwapInspirationText('');
    setSwapImageFile(null);
    setSwapImagePreview(null);
    setSwapDraft(null);
    setSwapError(null);
  };

  const handleSwapImageChange = (file: File | null) => {
    setSwapImageFile(file);
    setSwapDraft(null);
    setSwapError(null);
    if (swapImagePreview) URL.revokeObjectURL(swapImagePreview);
    setSwapImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleDraftSwap = async () => {
    if (!swapNumber || !onDraftOutfitSwap) return;
    setDraftingSwap(true);
    setSwapError(null);
    setSwapDraft(null);
    try {
      const result = await onDraftOutfitSwap({
        outfitNumber: swapNumber,
        reason: swapReason,
        notes: swapNotes,
        inspirationText: swapInspirationText,
        inspirationImage: swapImageFile,
      });
      if (!result) {
        setSwapError('Could not draft a replacement. Please try again.');
        return;
      }
      setSwapDraft(result);
    } finally {
      setDraftingSwap(false);
    }
  };

  const handleApplySwap = async () => {
    if (!swapNumber || !swapDraft || !onApplyOutfitSwap) return;
    setApplyingSwap(true);
    setSwapError(null);
    try {
      const result = await onApplyOutfitSwap({
        outfitNumber: swapNumber,
        candidateBlock: swapDraft.candidateBlock,
        baseUpdatedAt: swapDraft.baseUpdatedAt,
        currentOutfitHash: swapDraft.currentOutfitHash,
        reason: swapReason,
        notes: swapNotes,
      });
      if (!result) {
        setSwapError('Could not apply the replacement. Please try again.');
        return;
      }
      setImageOverrides(prev => {
        const next = { ...prev };
        if (result.imageUrl) next[swapNumber] = result.imageUrl;
        return next;
      });
      setSwapNumber(null);
      setSwapReason('');
      setSwapNotes('');
      setSwapInspirationText('');
      setSwapImageFile(null);
      if (swapImagePreview) URL.revokeObjectURL(swapImagePreview);
      setSwapImagePreview(null);
      setSwapDraft(null);
      setSwapError(null);
      setSectionNotice(`Outfit ${swapNumber} was replaced and its image was regenerated.`);
    } finally {
      setApplyingSwap(false);
    }
  };

  const startEdit = (outfitNumber: number) => {
    if (regenerating) return;
    const outfitBlock = extractOutfitBlock(text, outfitNumber);
    if (!outfitBlock) {
      setEditError(`Could not locate Outfit ${outfitNumber} in Section 4 text. Open the full Section 4 editor to repair the outfit headers.`);
      setEditingNumber(null);
      setEditText('');
      return;
    }
    setEditError(null);
    setSectionNotice(null);
    setEditingNumber(outfitNumber);
    setEditText(outfitBlock);
  };
  const cancelEdit = (force = false) => {
    if (regenerating && !force) return;
    setEditingNumber(null);
    setEditText('');
    setEditError(null);
  };

  const handleRegenerate = async () => {
    if (!editingNumber || !onRegenerateOutfit) return;
    if (!editText.trim()) {
      setEditError('Outfit text cannot be empty.');
      return;
    }
    setRegenerating(true);
    setEditError(null);
    setSectionNotice(null);
    try {
      const result = await onRegenerateOutfit(editingNumber, editText);
      if (!result) {
        setEditError('Could not save outfit edit. Please try again.');
        return;
      }
      setImageOverrides(prev => {
        const next = { ...prev };
        if (result.imageUrl) next[editingNumber] = result.imageUrl;
        else delete next[editingNumber];
        return next;
      });
      if (result.imageStatus === 'failed') {
        setSectionNotice(`Outfit ${editingNumber} text was saved, but image regeneration failed. Use Retry on the image placeholder when Gemini is available.`);
      }
      cancelEdit(true);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveTextOnly = async () => {
    if (!editingNumber || !onSaveOutfitText) return;
    if (!editText.trim()) {
      setEditError('Outfit text cannot be empty.');
      return;
    }
    setSavingText(true);
    setEditError(null);
    setSectionNotice(null);
    try {
      const result = await onSaveOutfitText(editingNumber, editText);
      if (!result) {
        setEditError('Could not save outfit text. Please try again.');
        return;
      }
      setSectionNotice(`Outfit ${editingNumber} text saved. The existing image was not changed.`);
      cancelEdit(true);
    } finally {
      setSavingText(false);
    }
  };

  const categories = useMemo(() => parseOutfitCategories(text), [text]);
  const split      = cls.outfit_split;
  const shouldShowSlide = (slideType: ManReportSlideMeta['slideType'], outfitNumber?: number) => {
    const slide = slideMeta.find(item => item.slideType === slideType && (outfitNumber === undefined || item.outfitNumber === outfitNumber));
    if (!slide) return false;
    return !focusPageNumber || slide.pageNumber === focusPageNumber;
  };
  const slideNumber = (slideType: ManReportSlideMeta['slideType'], outfitNumber?: number) => {
    return slideMeta.find(item => item.slideType === slideType && (outfitNumber === undefined || item.outfitNumber === outfitNumber))?.pageNumber;
  };

  // Fallback: if parsing failed, render raw markdown
  if (categories.length === 0 || categories.every(c => c.outfits.length === 0)) {
    if (!shouldShowSlide('outfit')) return null;
    return (
      <section className="man-page bone">
        <div className="grain" />
        <div className="corner-tl">
          <div className="man-mono corner-kicker">Section</div>
          <div className="man-small-caps corner-title">Your Outfit Formulas</div>
        </div>
        <div className="corner-tr">
          <div className="man-mono corner-kicker">04</div>
        </div>
        <SectionHeader number="04" label={`Your ${split.total} Outfit Formulas`} />
        <div className="man-page-inner">
          <h2>
            <span className="display">Outfit</span>
            <span className="display-it">formulas.</span>
          </h2>
          <div className="rule" style={{ marginBottom: 40 }} />
          <RenderMarkdown text={text} />
        </div>
      </section>
    );
  }

  const editingOutfit = editingNumber
    ? categories.flatMap(category => category.outfits).find(outfit => outfit.number === editingNumber) ?? null
    : null;

  // Render an individual outfit row — image left, details right.
  const renderOutfitCard = (cat: OutfitCategory, outfit: ParsedOutfit) => {
    const sourceOutfitImg = imageOverrides[outfit.number] ?? outfitImageUrls?.[outfit.number - 1] ?? null;
    const outfitImg   = brokenOutfitImages[outfit.number] ? null : sourceOutfitImg;
    const isEditing   = editingNumber === outfit.number;
    const isRegenning = regenerating && isEditing;
    const canEdit     = adminMode && !!onRegenerateOutfit;
    const canSwap     = adminMode && !!onDraftOutfitSwap && !!onApplyOutfitSwap;
    const canManualRecover = adminMode && (!!onCopyImagePrompt || !!onUploadManualImage);
    const prioritiseImage = outfit.number <= 2;
    const isVerified  = qaPassedOutfits?.has(outfit.number) ?? false;

    return (
      <div
        key={outfit.number}
        className="flex flex-col md:flex-row rounded-3xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 30px 80px -50px rgba(27,24,21,0.30)' }}
      >
        {/* Left: outfit image or number placeholder */}
        <div
          className="w-full md:w-[44%] flex-shrink-0 overflow-hidden relative"
          style={{ background: SHELL, aspectRatio: '3/4' }}
        >
          {outfitImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={outfitImg}
              alt={`Outfit ${outfit.number} — ${outfit.label}`}
              loading={prioritiseImage ? 'eager' : 'lazy'}
              fetchPriority={prioritiseImage ? 'high' : 'auto'}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{ opacity: 0, transition: 'opacity 0.5s ease' }}
              onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
              onError={() => setBrokenOutfitImages(prev => ({ ...prev, [outfit.number]: true }))}
            />
          ) : canManualRecover ? (
            <ManualImageActions
              target={{ imageType: 'outfit', outfitNumber: outfit.number }}
              title="Image failed"
              description={sourceOutfitImg ? 'Image could not load' : 'Generation did not complete'}
              onCopyImagePrompt={onCopyImagePrompt}
              onUploadManualImage={onUploadManualImage}
              onUploaded={imageUrl => {
                setBrokenOutfitImages(prev => ({ ...prev, [outfit.number]: false }));
                setImageOverrides(prev => ({ ...prev, [outfit.number]: imageUrl }));
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <p className="text-[96px] leading-none select-none italic" style={{ fontFamily: SERIF, color: ACCENT + '22', fontWeight: 300 }}>
                {String(outfit.number).padStart(2, '0')}
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-px" style={{ background: ACCENT + '55' }} />
                <p className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: ACCENT_INK }}>
                  {cat.name}
                </p>
                <p className="text-[12px] italic text-center px-6 leading-relaxed" style={{ fontFamily: SERIF, color: INK_SOFT }}>
                  {outfit.label}
                </p>
              </div>
            </div>
          )}

          {/* Verified ribbon */}
          {isVerified && outfitImg && (
            <span
              className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.92)', color: SAGE, fontSize: 10, fontWeight: 500, letterSpacing: '0.04em' }}
              title="Stylist QA passed — no errors flagged"
            >
              <span style={{ fontSize: 11, lineHeight: 1 }}>✓</span> Stylist verified
            </span>
          )}

          {canEdit && (
            <motion.button
              onClick={() => isEditing ? cancelEdit() : startEdit(outfit.number)}
              disabled={regenerating}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(27,24,21,0.7)', color: '#fff', backdropFilter: 'blur(6px)' }}
              title={isEditing ? 'Cancel edit' : 'Advanced edit'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={SPRING}
            >
              {isEditing ? <X size={12} /> : <Pencil size={12} />}
            </motion.button>
          )}

          {isRegenning && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2"
              style={{ background: 'rgba(27,24,21,0.55)' }}>
              <Loader2 size={28} className="animate-spin" style={{ color: '#fff' }} />
              <span className="text-[11px] font-medium tracking-wide text-white">Generating…</span>
            </div>
          )}
        </div>

        {/* Right: outfit details */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
              key="details"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.16 }}
              className="flex-1 p-6 md:p-9 flex flex-col"
            >
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2.5">
                  <span
                    className="text-[10px] font-medium uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
                    style={{ color: ACCENT_INK, background: ACCENT + '14' }}
                  >
                    {cat.name}
                  </span>
                  <span className="text-[11px]" style={{ color: INK_SOFT }}>
                    №{String(outfit.number).padStart(2, '0')}
                  </span>
                </div>
                <h3
                  className="text-2xl md:text-3xl italic leading-tight"
                  style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}
                >
                  {outfit.label}
                </h3>
              </div>

              <div className="mb-7">
                <DataLabel>Outfit composition</DataLabel>
                <div className="space-y-2.5">
                  {[
                    { label: 'Top',         value: outfit.top },
                    { label: 'Bottom',      value: outfit.bottom },
                    { label: 'Layer',       value: outfit.layer },
                    { label: 'Footwear',    value: outfit.footwear },
                    { label: 'Accessories', value: outfit.accessories },
                  ].map(({ label, value }) => value && value !== '—' ? (
                    <div key={label} className="flex items-baseline gap-3">
                      <span
                        className="text-[10px] font-medium uppercase tracking-[0.16em] flex-shrink-0 w-24"
                        style={{ color: ACCENT_INK }}
                      >
                        {label}
                      </span>
                      <span className="text-[13px] leading-snug" style={{ color: INK }}>{value}</span>
                    </div>
                  ) : null)}
                </div>
              </div>

              <HairRule className="mb-6" />

              <div className="space-y-5 flex-1">
                {outfit.whyItWorks && outfit.whyItWorks !== '—' && (
                  <StylistNote>{outfit.whyItWorks}</StylistNote>
                )}
                {outfit.fitNote && outfit.fitNote !== '—' && (
                  <div>
                    <DataLabel>Fit note</DataLabel>
                    <span className="text-[13px] leading-relaxed" style={{ color: INK_SOFT }}>{outfit.fitNote}</span>
                  </div>
                )}
                {outfit.colourLogic && outfit.colourLogic !== '—' && (
                  <div>
                    <DataLabel>Colour logic</DataLabel>
                    <span className="text-[13px] leading-relaxed" style={{ color: INK_SOFT }}>{stripHex(outfit.colourLogic)}</span>
                  </div>
                )}
                {outfit.shoppingTranslation && outfit.shoppingTranslation !== '—' && (
                  <div>
                    <DataLabel>Shopping translation</DataLabel>
                    <span className="text-[13px] leading-relaxed" style={{ color: INK_SOFT }}>{outfit.shoppingTranslation}</span>
                  </div>
                )}
                {outfit.acceptableSubstitutes && outfit.acceptableSubstitutes !== '—' && (
                  <div>
                    <DataLabel>Acceptable substitutes</DataLabel>
                    <span className="text-[13px] leading-relaxed" style={{ color: INK_SOFT }}>{outfit.acceptableSubstitutes}</span>
                  </div>
                )}
                {outfit.doNotBuy && outfit.doNotBuy !== '—' && (
                  <div>
                    <DataLabel>Do not buy</DataLabel>
                    <span className="text-[13px] leading-relaxed" style={{ color: INK_SOFT }}>{outfit.doNotBuy}</span>
                  </div>
                )}
              </div>
              {(canSwap || canEdit) && (
                <div className="mt-7 flex flex-wrap items-center gap-2">
                  {canSwap && (
                    <motion.button
                      onClick={() => startSwap(outfit.number)}
                      disabled={draftingSwap || applyingSwap || regenerating}
                      className="px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                      style={{ background: ACCENT, color: '#fff' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={SPRING}
                    >
                      Reject / Swap
                    </motion.button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => startEdit(outfit.number)}
                      disabled={regenerating}
                      className="px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                      style={{ background: SHELL, color: INK_SOFT, border: `1px solid ${BORDER}` }}
                    >
                      Advanced edit
                    </button>
                  )}
                </div>
              )}
            </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {shouldShowSlide('outfit_system') && (
        <section className="man-page bone">
          <div className="grain" />
          <div className="corner-tl">
            <div className="man-mono corner-kicker">Act III - Application</div>
            <div className="man-small-caps corner-title">Your Outfit Formulas</div>
          </div>
          <div className="corner-tr">
            <div className="man-mono corner-kicker">{String(slideNumber('outfit_system') ?? 1).padStart(2, '0')} / {slideMeta.length}</div>
          </div>
          <SectionHeader number="04" label={`Your ${split.total} Outfit Formulas`} />

          <div className="man-page-inner space-y-12">
            <div>
              <h2>
                <span className="display">Outfit</span>
                <span className="display-it">system.</span>
              </h2>
              <div className="rule" style={{ marginBottom: 0 }} />
            </div>
            {(editError || sectionNotice) && (
              <div
                className="flex items-start gap-2 rounded-2xl px-4 py-3"
                style={{
                  background: editError ? '#fff2f2' : '#f4efe4',
                  border: `1px solid ${editError ? '#f0cccc' : BORDER}`,
                  color: editError ? OXBLOOD : INK_SOFT,
                }}
              >
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p className="text-[12px] leading-relaxed">{editError ?? sectionNotice}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {categories.map((cat, ci) => {
                const catCount = split.categories.find(c =>
                  c.category.toLowerCase().includes(cat.name.toLowerCase().slice(0, 4))
                )?.count;
                return (
                  <div key={ci} className="rounded-3xl p-6 md:p-7" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] mb-2" style={{ color: ACCENT_INK }}>
                      {ci + 1} of {categories.length}
                    </p>
                    <h3 className="text-3xl italic leading-[1.05]" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
                      {cat.name}
                    </h3>
                    {cat.intro && (
                      <p className="mt-3 text-[13px] italic leading-relaxed" style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
                        {cat.intro}
                      </p>
                    )}
                    <div className="rule-thin" style={{ margin: '22px 0 14px' }} />
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: INK_SOFT }}>
                      {catCount ?? cat.outfits.length} outfits
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {categories.flatMap(cat => cat.outfits.map(outfit => shouldShowSlide('outfit', outfit.number) ? (
        <section key={outfit.number} className="man-page bone man-outfit-slide">
          <div className="grain" />
          <div className="corner-tl">
            <div className="man-mono corner-kicker">Act III - Application</div>
            <div className="man-small-caps corner-title">{cat.name}</div>
          </div>
          <div className="corner-tr">
            <div className="man-mono corner-kicker">{String(slideNumber('outfit', outfit.number) ?? 1).padStart(2, '0')} / {slideMeta.length}</div>
          </div>
          <div className="man-page-inner">
            {renderOutfitCard(cat, outfit)}
          </div>
        </section>
      ) : null))}

      <AnimatePresence>
        {swapNumber && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(27,24,21,0.58)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <motion.div
              className="w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col"
              style={{ background: IVORY, maxHeight: '90vh', boxShadow: '0 35px 110px -45px rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={SPRING}
            >
              <div className="flex items-start justify-between gap-4 px-6 py-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] mb-1" style={{ color: ACCENT_INK }}>
                    Reject / Swap outfit {swapNumber}
                  </p>
                  <p className="text-xl italic leading-tight" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
                    Copy your text or image into the report before changing anything.
                  </p>
                </div>
                <button
                  onClick={closeSwap}
                  disabled={draftingSwap || applyingSwap}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
                  style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="rounded-2xl p-4" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                    <DataLabel>Rejection reason</DataLabel>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {['Too basic', 'Wrong vibe', 'Bad colour', 'Too formal', 'Too casual', 'Not wearable'].map(reason => (
                        <button
                          key={reason}
                          onClick={() => {
                            setSwapReason(reason);
                            setSwapDraft(null);
                          }}
                          className="px-3 py-1.5 rounded-full text-[11px] font-medium"
                          style={{
                            background: swapReason === reason ? ACCENT : SHELL,
                            color: swapReason === reason ? '#fff' : INK_SOFT,
                            border: `1px solid ${swapReason === reason ? ACCENT : BORDER}`,
                          }}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    <input
                      value={swapReason}
                      onChange={e => {
                        setSwapReason(e.target.value);
                        setSwapDraft(null);
                      }}
                      placeholder="Custom reason"
                      className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
                      style={{ background: IVORY, border: `1px solid ${BORDER}`, color: INK }}
                    />
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                    <DataLabel>Inspiration image</DataLabel>
                    <label
                      className="block rounded-2xl overflow-hidden cursor-pointer"
                      style={{ background: SHELL, border: `1px dashed ${ACCENT}66`, aspectRatio: '4/3' }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleSwapImageChange(e.target.files?.[0] ?? null)}
                      />
                      {swapImagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={swapImagePreview} alt="Outfit inspiration" className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center px-5 text-center">
                          <span className="text-[12px]" style={{ color: INK_SOFT }}>Upload a screenshot or reference outfit</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                    <DataLabel>Inspiration text / notes</DataLabel>
                    <textarea
                      value={swapInspirationText}
                      onChange={e => {
                        setSwapInspirationText(e.target.value);
                        setSwapDraft(null);
                      }}
                      placeholder="Paste the exact outfit to apply. The system will preserve the garments, colours, fit, styling, footwear, and accessories as literally as possible."
                      className="w-full min-h-[120px] rounded-xl px-3 py-2 text-[12px] leading-relaxed outline-none resize-none"
                      style={{ background: IVORY, border: `1px solid ${BORDER}`, color: INK }}
                    />
                    <textarea
                      value={swapNotes}
                      onChange={e => {
                        setSwapNotes(e.target.value);
                        setSwapDraft(null);
                      }}
                      placeholder="Internal notes, optional"
                      className="w-full mt-3 min-h-[80px] rounded-xl px-3 py-2 text-[12px] leading-relaxed outline-none resize-none"
                      style={{ background: IVORY, border: `1px solid ${BORDER}`, color: INK }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl p-4 min-h-[420px]" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <DataLabel>Replacement preview</DataLabel>
                    {swapDraft && (
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: SAGE }}>
                        Replacement ready
                      </span>
                    )}
                  </div>

                  {swapError && (
                    <div className="flex items-start gap-2 rounded-xl px-3 py-2 mb-4" style={{ background: '#fff2f2', color: OXBLOOD }}>
                      <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] leading-relaxed">{swapError}</p>
                    </div>
                  )}

                  {draftingSwap ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3">
                      <Loader2 size={22} className="animate-spin" style={{ color: ACCENT }} />
                      <p className="text-[12px]" style={{ color: INK_SOFT }}>Drafting replacement…</p>
                    </div>
                  ) : swapDraft?.parsedPreview ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-2xl italic leading-tight" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
                          {swapDraft.parsedPreview.label}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: INK_SOFT }}>
                          {swapDraft.parsedPreview.context} · Outfit {swapDraft.parsedPreview.number}
                        </p>
                      </div>
                      {[
                        ['Top', swapDraft.parsedPreview.top],
                        ['Bottom', swapDraft.parsedPreview.bottom],
                        ['Layer', swapDraft.parsedPreview.layer],
                        ['Footwear', swapDraft.parsedPreview.footwear],
                        ['Accessories', swapDraft.parsedPreview.accessories],
                        ['Fit note', swapDraft.parsedPreview.fitNote],
                        ['Colour logic', swapDraft.parsedPreview.colourLogic],
                      ].map(([label, value]) => value && value !== '—' ? (
                        <div key={label}>
                          <DataLabel>{label}</DataLabel>
                          <p className="text-[12px] leading-relaxed" style={{ color: INK }}>{value}</p>
                        </div>
                      ) : null)}
                      {swapDraft.blockingIssues.length > 0 && (
                        <div className="rounded-xl px-3 py-2" style={{ background: '#fff2f2', color: OXBLOOD }}>
                          <p className="text-[11px] font-medium mb-1">Blocking QA issue</p>
                          {swapDraft.blockingIssues.slice(0, 3).map((issue, index) => (
                            <p key={`${issue.code}-${index}`} className="text-[11px] leading-relaxed">{issue.message}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full min-h-[300px] flex items-center justify-center px-6 text-center">
                      <p className="text-[12px] leading-relaxed" style={{ color: INK_SOFT }}>
                        Add inspiration and generate a replacement. The report will not change until you apply it.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                <p className="text-[11px] leading-relaxed" style={{ color: INK_SOFT }}>
                  Apply commits only after the copied outfit image is generated successfully.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={closeSwap}
                    disabled={draftingSwap || applyingSwap}
                    className="px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleDraftSwap}
                    disabled={draftingSwap || applyingSwap || (!swapReason && !swapNotes && !swapInspirationText && !swapImageFile)}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: SHELL, color: INK, border: `1px solid ${BORDER}` }}
                    whileHover={!draftingSwap && !applyingSwap ? { scale: 1.02 } : undefined}
                    whileTap={!draftingSwap && !applyingSwap ? { scale: 0.98 } : undefined}
                    transition={SPRING}
                  >
                    {draftingSwap ? <><Loader2 size={13} className="animate-spin" /> Extracting…</> : 'Extract outfit'}
                  </motion.button>
                  <motion.button
                    onClick={handleApplySwap}
                    disabled={applyingSwap || draftingSwap || !swapDraft || swapDraft.blockingIssues.length > 0}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: ACCENT, color: '#fff' }}
                    whileHover={!applyingSwap ? { scale: 1.02 } : undefined}
                    whileTap={!applyingSwap ? { scale: 0.98 } : undefined}
                    transition={SPRING}
                  >
                    {applyingSwap ? <><Loader2 size={13} className="animate-spin" /> Applying + generating image…</> : 'Apply copied outfit'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingNumber && editingOutfit && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(27,24,21,0.58)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <motion.div
              className="w-full max-w-3xl rounded-3xl overflow-hidden flex flex-col"
              style={{ background: IVORY, maxHeight: '86vh', boxShadow: '0 35px 110px -45px rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={SPRING}
            >
              <div className="flex items-start justify-between gap-4 px-6 py-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] mb-1" style={{ color: ACCENT_INK }}>
                    Edit outfit {editingNumber}
                  </p>
                  <p className="text-xl italic leading-tight" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
                    {editingOutfit.label}
                  </p>
                </div>
                <button
                  onClick={() => cancelEdit()}
                  disabled={regenerating}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
                  style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 flex-1 min-h-0 flex flex-col gap-3">
                {editError && (
                  <div className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: '#fff2f2', color: OXBLOOD }}>
                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] leading-relaxed">{editError}</p>
                  </div>
                )}
                <textarea
                  value={editText}
                  onChange={e => {
                    setEditText(e.target.value);
                    if (editError) setEditError(null);
                  }}
                  className="font-mono text-[12px] rounded-2xl p-4 resize-none leading-relaxed focus:outline-none flex-1 min-h-[420px]"
                  style={{ background: '#fff', border: `1px solid ${BORDER}`, color: INK }}
                  spellCheck={false}
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                <p className="text-[11px] leading-relaxed" style={{ color: INK_SOFT }}>
                  {onSaveOutfitText
                    ? 'Save text only keeps the current image intact. Save + regenerate replaces it.'
                    : 'Saves this outfit text first, then regenerates only this outfit image.'
                  }
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => cancelEdit()}
                    disabled={regenerating || savingText}
                    className="px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                  >
                    Cancel
                  </button>
                  {onSaveOutfitText && (
                    <motion.button
                      onClick={handleSaveTextOnly}
                      disabled={savingText || regenerating || !editText.trim()}
                      className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                      style={{ background: SHELL, color: INK, border: `1px solid ${BORDER}` }}
                      whileHover={!savingText && !regenerating ? { scale: 1.02 } : undefined}
                      whileTap={!savingText && !regenerating ? { scale: 0.98 } : undefined}
                      transition={SPRING}
                    >
                      {savingText
                        ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
                        : 'Save text only'
                      }
                    </motion.button>
                  )}
                  <motion.button
                    onClick={handleRegenerate}
                    disabled={regenerating || savingText || !editText.trim()}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: ACCENT, color: '#fff' }}
                    whileHover={!regenerating && !savingText ? { scale: 1.02 } : undefined}
                    whileTap={!regenerating && !savingText ? { scale: 0.98 } : undefined}
                    transition={SPRING}
                  >
                    {regenerating
                      ? <><Loader2 size={13} className="animate-spin" /> Saving + regenerating…</>
                      : 'Save + regenerate image'
                    }
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ComboGridSection({
  text,
  comboGridCards,
  adminMode,
  onSaveComboGridText,
  onRegenerateComboGrid,
  onCopyImagePrompt,
  onUploadManualImage,
}: {
  text?: string;
  comboGridCards?: ResolvedImageUrls['comboGridCards'];
  adminMode?: boolean;
  onSaveComboGridText?: (kind: ComboGridKind, newText: string) => Promise<ComboGridSaveTextResult | null>;
  onRegenerateComboGrid?: (kind: ComboGridKind, newText: string) => Promise<ComboGridRegenerationResult | null>;
  onCopyImagePrompt?: (target: ManualImageTarget) => Promise<string | null>;
  onUploadManualImage?: (target: ManualImageTarget, file: File, options?: ManualImageUploadOptions) => Promise<string | null>;
}) {
  const [activeKind, setActiveKind] = useState<ComboGridKind>('office');
  const [editingKind, setEditingKind] = useState<ComboGridKind | null>(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [sectionNotice, setSectionNotice] = useState<string | null>(null);
  const [savingText, setSavingText] = useState(false);
  const [regeneratingKind, setRegeneratingKind] = useState<ComboGridKind | null>(null);
  const [gridOverrides, setGridOverrides] = useState<Partial<Record<ComboGridKind, string>>>({});
  const [brokenGridImages, setBrokenGridImages] = useState<Partial<Record<ComboGridKind, boolean>>>({});
  const parsed = useMemo(() => text ? normaliseComboGridText(text) : null, [text]);
  const parsedGroups = parsed?.groups ?? [];
  const grids = [
    { key: 'office' as const, label: 'Formal', title: 'Formal outfit combinations', sourceUrl: gridOverrides.office ?? comboGridCards?.office },
    { key: 'relaxed' as const, label: 'Relaxed Casual', title: 'Relaxed casual combinations', sourceUrl: gridOverrides.relaxed ?? comboGridCards?.relaxed },
    { key: 'evening' as const, label: 'Evening', title: 'Evening outfit combinations', sourceUrl: gridOverrides.evening ?? comboGridCards?.evening },
  ].map(grid => ({
    ...grid,
    url: brokenGridImages[grid.key] ? null : grid.sourceUrl,
  }));
  const editingGrid = editingKind ? grids.find(grid => grid.key === editingKind) : null;
  const hasContent = !!text || grids.some(grid => !!grid.url);
  const canEdit = adminMode && (!!onSaveComboGridText || !!onRegenerateComboGrid) && !!text;
  if (!hasContent) return null;
  const isBusy = savingText || !!regeneratingKind;

  const startEdit = (kind: ComboGridKind) => {
    if (!text) return;
    const groupText = getComboGridGroupText(text, kind) ?? getComboGridGroupRawText(text, kind);
    if (!groupText) {
      setActiveKind(kind);
      setEditText([
        `### ${comboGridGroupTitle(kind)}`,
        '',
        '#### Look 1',
        '- Outfit summary: ',
        '- Logic: ',
        '- Source: ',
        '',
        '#### Look 2',
        '- Outfit summary: ',
        '- Logic: ',
        '- Source: ',
        '',
        '#### Look 3',
        '- Outfit summary: ',
        '- Logic: ',
        '- Source: ',
      ].join('\n'));
      setEditError(null);
      setSectionNotice(null);
      setEditingKind(kind);
      return;
    }

    setActiveKind(kind);
    setEditText(groupText);
    setEditError(null);
    setSectionNotice(null);
    setEditingKind(kind);
  };

  const closeEdit = () => {
    if (isBusy) return;
    setEditingKind(null);
    setEditText('');
    setEditError(null);
  };

  const handleSaveText = async () => {
    if (!editingKind || !onSaveComboGridText) return;
    const validation = normaliseComboGridGroupText(editingKind, editText);
    if (!validation.ok) {
      setEditError(validation.error);
      return;
    }

    setSavingText(true);
    setEditError(null);
    setSectionNotice(null);
    try {
      const result = await onSaveComboGridText(editingKind, validation.text);
      if (!result) {
        setEditError('Could not save combination grid text. Please try again.');
        return;
      }
      setSectionNotice(`${editingGrid?.label ?? 'Combination grid'} text saved. Existing images were not changed.`);
      setEditingKind(null);
      setEditText('');
    } finally {
      setSavingText(false);
    }
  };

  const handleRegenerate = async () => {
    if (!editingKind || !onRegenerateComboGrid) return;
    const kind = editingKind;
    const label = editingGrid?.label ?? 'Combination grid';
    const validation = normaliseComboGridGroupText(kind, editText);
    if (!validation.ok) {
      setEditError(validation.error);
      return;
    }

    setRegeneratingKind(kind);
    setEditError(null);
    setSectionNotice(null);
    try {
      const result = await onRegenerateComboGrid(kind, validation.text);
      if (!result) {
        setEditError('Could not regenerate this combination grid image. Please try again.');
        return;
      }

      setEditingKind(null);
      setEditText('');
      if (result.imageStatus === 'generated') {
        setSectionNotice(`${label} text saved and its grid image was regenerated.`);
        return;
      }

      setSectionNotice(`${label} text saved, but its grid image could not be regenerated.`);
    } finally {
      setRegeneratingKind(null);
    }
  };

  return (
    <section className="man-page slate">
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Section</div>
        <div className="man-small-caps corner-title">Combination Grids</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">05</div>
      </div>
      <SectionHeader number="05" label="Combination Grids" />
      <div className="man-page-inner space-y-8">
        <div>
          <h2>
            <span className="display">The system,</span>
            <span className="display-it">connected.</span>
          </h2>
          <div className="rule" style={{ marginBottom: 0 }} />
        </div>
        <div className="flex flex-col gap-4">
          {sectionNotice && (
            <div
              className="flex items-start gap-2 rounded-2xl px-4 py-3"
              style={{ background: '#f4efe4', border: `1px solid ${BORDER}`, color: INK_SOFT }}
            >
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <p className="text-[12px] leading-relaxed">{sectionNotice}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {grids.map(grid => (
              <button
                key={grid.key}
                onClick={() => {
                  setActiveKind(grid.key);
                  setEditError(null);
                }}
                className="px-4 py-2 rounded-full text-[12px] font-medium"
                style={{
                  background: activeKind === grid.key ? ACCENT : SHELL,
                  color: activeKind === grid.key ? '#fff' : INK_SOFT,
                  border: `1px solid ${activeKind === grid.key ? ACCENT : BORDER}`,
                }}
              >
                {grid.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-7">
          {grids.map(grid => {
            const isRegenning = regeneratingKind === grid.key;
            const group = parsedGroups.find(candidate => candidate.kind === grid.key);
            const isActive = activeKind === grid.key;
            return (
            <div key={grid.key} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: ACCENT_INK }}>
                  {grid.title}
                </p>
                {isActive && (
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: SAGE }}>
                    Selected
                  </span>
                )}
              </div>
              <div
                className="overflow-hidden rounded-3xl relative"
                style={{
                  background: SHELL,
                  border: `1px solid ${BORDER}`,
                  aspectRatio: grid.url ? undefined : '16/9',
                }}
              >
                {grid.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={grid.url}
                    alt={grid.title}
                    loading="lazy"
                    decoding="async"
                    className="block w-full h-auto"
                    onError={() => setBrokenGridImages(prev => ({ ...prev, [grid.key]: true }))}
                  />
                ) : (
                  <div className="h-full min-h-[220px] md:min-h-[320px] flex flex-col items-center justify-center gap-4 px-6 text-center">
                    {adminMode && (onCopyImagePrompt || onUploadManualImage) ? (
                      <ManualImageActions
                        target={{ imageType: 'comboGrid', comboGridKind: grid.key }}
                        title="Grid failed"
                        description={grid.sourceUrl ? 'Grid image could not load' : 'Generation did not complete'}
                        onCopyImagePrompt={onCopyImagePrompt}
                        onUploadManualImage={onUploadManualImage}
                        onUploaded={imageUrl => {
                          setBrokenGridImages(prev => ({ ...prev, [grid.key]: false }));
                          setGridOverrides(prev => ({ ...prev, [grid.key]: imageUrl }));
                        }}
                      />
                    ) : (
                      <span className="text-[12px]" style={{ color: INK_SOFT }}>Grid image pending</span>
                    )}
                  </div>
                )}
                {isRegenning && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(27,24,21,0.55)' }}>
                    <Loader2 size={26} className="animate-spin" style={{ color: '#fff' }} />
                    <span className="text-[11px] font-medium tracking-wide text-white">Generating...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveKind(grid.key);
                    setEditError(null);
                  }}
                  className="px-4 py-2 rounded-full text-[12px] font-medium"
                  style={{ background: isActive ? ACCENT + '18' : SHELL, color: isActive ? ACCENT_INK : INK_SOFT, border: `1px solid ${BORDER}` }}
                >
                  Show text
                </button>
                {canEdit && (
                  <button
                    onClick={() => startEdit(grid.key)}
                    disabled={isBusy}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                  >
                    <Pencil size={12} />
                    Advanced edit
                  </button>
                )}
              </div>
              {isActive && group && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {group.looks.map(look => (
                    <div
                      key={look.name}
                      className="rounded-2xl p-5"
                      style={{ background: IVORY, border: `1px solid ${BORDER}` }}
                    >
                      <h4
                        className="text-lg italic leading-snug mb-4"
                        style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}
                      >
                        {look.name}
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <DataLabel>Outfit summary</DataLabel>
                          <p className="text-[12px] leading-relaxed" style={{ color: INK }}>{look.outfitSummary}</p>
                        </div>
                        <div>
                          <DataLabel>Logic</DataLabel>
                          <p className="text-[12px] leading-relaxed" style={{ color: INK_SOFT }}>{look.logic}</p>
                        </div>
                        <div>
                          <DataLabel>Source</DataLabel>
                          <p className="text-[11px] leading-relaxed" style={{ color: ACCENT_INK }}>{look.source}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )})}
        </div>

        {text && !parsed?.ok && (
          <div className="pt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
            <RenderMarkdown text={stripComboGridTableSeparators(text)} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingKind && editingGrid && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(27,24,21,0.58)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <motion.div
              className="w-full max-w-3xl rounded-3xl overflow-hidden flex flex-col"
              style={{ background: IVORY, maxHeight: '90vh', boxShadow: '0 35px 110px -45px rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={SPRING}
            >
              <div className="flex items-start justify-between gap-4 px-6 py-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] mb-1" style={{ color: ACCENT_INK }}>
                    Advanced edit
                  </p>
                  <p className="text-xl italic leading-tight" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
                    {editingGrid.label}
                  </p>
                </div>
                <button
                  onClick={closeEdit}
                  disabled={isBusy}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
                  style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 flex-1 min-h-0 flex flex-col gap-3">
                <p className="text-[11px] leading-relaxed" style={{ color: INK_SOFT }}>
                  This category must include three looks with Outfit summary, Logic, and Source fields. Saving here changes only the {editingGrid.label} grid.
                </p>
                {editError && (
                  <div className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: '#fff2f2', color: OXBLOOD }}>
                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] leading-relaxed">{editError}</p>
                  </div>
                )}
                <textarea
                  value={editText}
                  onChange={event => {
                    setEditText(event.target.value);
                    if (editError) setEditError(null);
                  }}
                  className="font-mono text-[12px] rounded-2xl p-4 resize-none leading-relaxed focus:outline-none flex-1 min-h-[420px]"
                  style={{ background: '#fff', border: `1px solid ${BORDER}`, color: INK }}
                  spellCheck={false}
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                <p className="text-[11px] leading-relaxed" style={{ color: INK_SOFT }}>
                  Save text only keeps the current image intact. Save + regenerate replaces only this grid image.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={closeEdit}
                    disabled={isBusy}
                    className="px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleSaveText}
                    disabled={isBusy || !editText.trim() || !onSaveComboGridText}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: SHELL, color: INK, border: `1px solid ${BORDER}` }}
                    whileHover={!isBusy ? { scale: 1.02 } : undefined}
                    whileTap={!isBusy ? { scale: 0.98 } : undefined}
                    transition={SPRING}
                  >
                    {savingText ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : 'Save text only'}
                  </motion.button>
                  {onRegenerateComboGrid && (
                    <motion.button
                      onClick={handleRegenerate}
                      disabled={isBusy || !editText.trim()}
                      className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                      style={{ background: ACCENT, color: '#fff' }}
                      whileHover={!isBusy ? { scale: 1.02 } : undefined}
                      whileTap={!isBusy ? { scale: 0.98 } : undefined}
                      transition={SPRING}
                    >
                      {!!regeneratingKind
                        ? <><Loader2 size={13} className="animate-spin" /> Saving + regenerating...</>
                        : 'Save + regenerate image'
                      }
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 05 — Style Rules
// ─────────────────────────────────────────────────────────────

// Parses the markdown of section 5 into three buckets — "always", "never",
// and an optional "power move" line. Falls back to raw render if the markdown
// doesn't conform (e.g. on legacy reports).
interface ParsedRules { always: string[]; never: string[]; powerMove: string | null }

function parseStyleRules(text: string): ParsedRules | null {
  const lines = text.split('\n').map(l => l.trim());
  const always: string[] = [];
  const never:  string[] = [];
  let   powerMove: string | null = null;

  type Bucket = 'always' | 'never' | 'power' | null;
  let bucket: Bucket = null;

  for (const raw of lines) {
    if (!raw) continue;
    const lower = raw.toLowerCase();
    const heading = raw.replace(/^#+\s*/, '').replace(/\*\*/g, '').toLowerCase();

    if (/^#+\s/.test(raw) || /^\*\*[^*]+\*\*$/.test(raw)) {
      if (heading.includes('always') || heading.includes('do this') || heading.startsWith('do ')) bucket = 'always';
      else if (heading.includes('never') || heading.includes('avoid') || heading.includes("don't") || heading.includes('do not')) bucket = 'never';
      else if (heading.includes('power move') || heading.includes('signature') || heading.includes('your move')) bucket = 'power';
      else bucket = null;
      continue;
    }

    const item = raw.replace(/^[-*•✓✗✘✔]\s+/, '').replace(/\*\*/g, '').trim();
    if (!item) continue;

    if (bucket === 'always') always.push(item);
    else if (bucket === 'never') never.push(item);
    else if (bucket === 'power' && !powerMove) powerMove = item;
    else if (raw.startsWith('✓ ') || raw.startsWith('✔ ')) always.push(item);
    else if (raw.startsWith('✗ ') || raw.startsWith('✘ ')) never.push(item);
    else if (lower.startsWith('always ')) always.push(item);
    else if (lower.startsWith('never ')) never.push(item);
  }

  if (always.length === 0 && never.length === 0 && !powerMove) return null;
  return { always, never, powerMove };
}

function StyleRulesSection({ text }: { text: string }) {
  const parsed = useMemo(() => parseStyleRules(text), [text]);

  if (!parsed) {
    // Fallback for unrecognised markdown — keep behaviour unchanged.
    return (
      <section className="man-page ivory">
        <div className="grain" />
        <div className="corner-tl">
          <div className="man-mono corner-kicker">Section</div>
          <div className="man-small-caps corner-title">Your Style Rules</div>
        </div>
        <div className="corner-tr">
          <div className="man-mono corner-kicker">05</div>
        </div>
        <SectionHeader number="05" label="Your Style Rules" />
        <div className="man-page-inner">
          <h2>
            <span className="display">Always.</span>
            <span className="display-it">Never.</span>
          </h2>
          <div className="rule" style={{ marginBottom: 40 }} />
          <RenderMarkdown text={text} />
        </div>
      </section>
    );
  }

  return (
    <section className="man-page ivory">
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Section</div>
        <div className="man-small-caps corner-title">Your Style Rules</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">05</div>
      </div>
      <SectionHeader number="05" label="Your Style Rules" />
      <div className="man-page-inner">
        <h2>
          <span className="display">Always.</span>
          <span className="display-it">Never.</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {/* Always */}
          <div
            className="rounded-3xl p-7"
            style={{ background: SAGE + '12', border: `1px solid ${SAGE}33` }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-4" style={{ color: SAGE }}>
              Always
            </p>
            <h4 className="text-2xl italic leading-tight mb-5"
              style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
              Five things you keep doing.
            </h4>
            <ul className="space-y-3">
              {parsed.always.slice(0, 6).map((rule, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[13px] mt-0.5 flex-shrink-0" style={{ color: SAGE }}>✓</span>
                  <span className="text-[13px] leading-relaxed" style={{ color: INK }}>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Never */}
          <div
            className="rounded-3xl p-7"
            style={{ background: OXBLOOD + '0e', border: `1px solid ${OXBLOOD}33` }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-4" style={{ color: OXBLOOD }}>
              Never
            </p>
            <h4 className="text-2xl italic leading-tight mb-5"
              style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
              Three things you stop today.
            </h4>
            <ul className="space-y-3">
              {parsed.never.slice(0, 5).map((rule, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[13px] mt-0.5 flex-shrink-0" style={{ color: OXBLOOD }}>✗</span>
                  <span className="text-[13px] leading-relaxed" style={{ color: INK }}>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Power Move */}
        {parsed.powerMove && (
          <div
            className="mt-6 rounded-3xl p-8 md:p-10 text-center"
            style={{ background: INK, color: '#fff' }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] mb-4" style={{ color: ACCENT }}>
              Your power move
            </p>
            <p className="text-2xl md:text-3xl italic leading-snug max-w-3xl mx-auto"
              style={{ fontFamily: SERIF, fontWeight: 350 }}>
              &ldquo;{parsed.powerMove}&rdquo;
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function TextReportSection({
  number,
  label,
  text,
  background = '#fff',
}: {
  number: string;
  label: string;
  text?: string;
  background?: string;
}) {
  if (!text) return null;
  // Map legacy background prop to blueprint page variant
  const variant = background === SHELL || background === BONE ? 'bone' : 'ivory';
  const panelBg = variant === 'bone' ? 'rgba(44,38,34,0.04)' : SHELL;
  return (
    <section className={`man-page ${variant}`}>
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Section</div>
        <div className="man-small-caps corner-title">{label}</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">{number}</div>
      </div>
      <SectionHeader number={number} label={label} />
      <div className="man-page-inner">
        <h2>
          <span className="display-it">{label}</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />
        <div
          className="rounded-3xl p-6 md:p-8"
          style={{ background: panelBg, border: `1px solid ${BORDER}` }}
        >
          <RenderMarkdown text={text} />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 06 — Style Identity Statement
// ─────────────────────────────────────────────────────────────

function IdentitySection({ text }: { text: string }) {
  // Extract just the paragraph (strip the section header line)
  const lines = text.split('\n').filter(l => !l.startsWith('## ') && !l.startsWith('# '));
  const body  = lines.join('\n').trim();

  return (
    <section className="man-page slate">
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Closing</div>
        <div className="man-small-caps corner-title">Style Identity</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">08</div>
      </div>
      <SectionHeader number="08" label="Your Style Identity" />
      <div className="man-page-inner">
        <h2>
          <span className="display">Your style</span>
          <span className="display-it">identity.</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />
        <div className="glass-dark" style={{ padding: '32px 40px', maxWidth: 720 }}>
          <p className="dossier-label" style={{ marginBottom: 16 }}>Personal statement</p>
          <p
            className="display-it"
            style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', lineHeight: 1.55, opacity: 0.85 }}
            dangerouslySetInnerHTML={{ __html: richify(body) }}
          />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

interface ManReportProps {
  data: ReportData;
  imageUrls?: ResolvedImageUrls | null;
  focusPageNumber?: number;
  viewerMode?: 'admin' | 'public';
  motionMode?: 'reduced' | 'standard';
  deferSections?: boolean;
  adminMode?: boolean;
  onRegenerateOutfit?: (
    outfitNumber: number,
    newText: string,
  ) => Promise<OutfitEditResult | null>;
  onSaveOutfitText?: (
    outfitNumber: number,
    newText: string,
  ) => Promise<OutfitSaveTextResult | null>;
  onSaveComboGridText?: (
    kind: ComboGridKind,
    newText: string,
  ) => Promise<ComboGridSaveTextResult | null>;
  onRegenerateComboGrid?: (
    kind: ComboGridKind,
    newText: string,
  ) => Promise<ComboGridRegenerationResult | null>;
  onDraftOutfitSwap?: (input: {
    outfitNumber: number;
    reason: string;
    notes: string;
    inspirationText: string;
    inspirationImage: File | null;
  }) => Promise<OutfitSwapDraftResult | null>;
  onApplyOutfitSwap?: (input: {
    outfitNumber: number;
    candidateBlock: string;
    baseUpdatedAt: string;
    currentOutfitHash: string;
    reason: string;
    notes: string;
  }) => Promise<OutfitSwapApplyResult | null>;
  onRegenerateFaceImage?: (
    kind: FaceImageKind,
    optionIndex: number,
  ) => Promise<FaceImageRegenerationResult | null>;
  onDraftFaceStyleSwap?: (input: {
    kind: FaceImageKind;
    optionIndex: number;
    reason: string;
    notes: string;
    replacementText: string;
    inspirationImage: File | null;
  }) => Promise<FaceStyleSwapDraftResult | null>;
  onApplyFaceStyleSwap?: (input: {
    kind: FaceImageKind;
    optionIndex: number;
    candidateStyle: string;
    baseUpdatedAt: string;
    currentStyleHash: string;
    reason: string;
    notes: string;
  }) => Promise<FaceStyleSwapApplyResult | null>;
  onRetryMissingImages?: () => Promise<void>;
  onCopyImagePrompt?: (target: ManualImageTarget) => Promise<string | null>;
  onUploadManualImage?: (target: ManualImageTarget, file: File, options?: ManualImageUploadOptions) => Promise<string | null>;
}

function DeferredSection({
  children,
  label,
  estimatedHeight,
  background,
  motionMode,
  defer,
}: {
  children: React.ReactNode;
  label: string;
  estimatedHeight: number;
  background: string;
  motionMode: 'reduced' | 'standard';
  defer: boolean;
}) {
  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold: 0,
    rootMargin: '600px 0px',
  });

  const shouldRender = !defer || hasIntersected;

  if (!shouldRender) {
    return (
      <div
        ref={elementRef}
        style={{ background, minHeight: estimatedHeight }}
      >
        <div className="px-6 md:px-12 py-12">
          <div className="flex items-baseline gap-5 mb-6">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: INK_SOFT }}>
              {label}
            </span>
            <span className="hidden md:block flex-1 h-px" style={{ background: BORDER }} />
          </div>
          <div className="space-y-3 animate-pulse">
            <div className="h-7 w-56 rounded-full" style={{ background: BORDER }} />
            <div className="h-4 w-full max-w-xl rounded-full" style={{ background: BORDER }} />
            <div className="h-4 w-full max-w-lg rounded-full" style={{ background: BORDER }} />
            <div className="h-4 w-full max-w-md rounded-full" style={{ background: BORDER }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={elementRef}>
      {motionMode === 'standard' ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: SECTION_REVEAL_EASE }}
        >
          {children}
        </motion.div>
      ) : children}
    </div>
  );
}

// Pull the first sentence (or two) of the identity statement to use as a hero pull-quote.
function extractIdentityExcerpt(text: string): string {
  const stripped = text
    .split('\n')
    .filter(l => !l.startsWith('#'))
    .join(' ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!stripped) return '';
  // First two sentences, or 220 chars — whichever is shorter.
  const sentenceMatch = stripped.match(/^(?:[^.!?]+[.!?]){1,2}/);
  const candidate = sentenceMatch ? sentenceMatch[0].trim() : stripped;
  return candidate.length > 240 ? candidate.slice(0, 238).trimEnd() + '…' : candidate;
}

// Format today's date the way an editorial spread would: "May 2026".
function formatReportDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// Compact "Blueprint card" — the one-glance summary that lives in the hero.
function BlueprintCard({ cls }: { cls: ClassificationResult }) {
  const heroColours = cls.colour.primary_palette.slice(0, 5);
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Build',       value: cls.body.silhouette_type },
    { label: 'Face',        value: cls.face.face_shape },
    { label: 'Season',      value: cls.colour.season },
    { label: 'Direction',   value: cls.style_brief.aesthetic_direction },
  ];

  return (
    <div
      className="rounded-3xl p-7 md:p-9"
      style={{ background: '#fff', boxShadow: '0 30px 80px -50px rgba(27,24,21,0.30)' }}
    >
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: ACCENT_INK }}>
          The blueprint
        </p>
        <p className="text-[11px]" style={{ color: INK_SOFT }}>
          {cls.outfit_split.total} outfits · 9 chapters
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6 mb-7">
        {rows.map(row => (
          <div key={row.label}>
            <DataLabel>{row.label}</DataLabel>
            <span className="text-[14px] leading-snug" style={{ color: INK }}>{row.value}</span>
          </div>
        ))}
      </div>

      <HairRule className="mb-5" />

      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: ACCENT_INK }}>
          Hero colours
        </p>
        <div className="flex gap-2.5 flex-wrap">
          {heroColours.map((c, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full"
              title={`${c.name} — ${c.usage}`}
              style={{
                backgroundColor: c.hex,
                boxShadow: '0 6px 18px -10px rgba(27,24,21,0.45), inset 0 0 0 1px rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ManReport({
  data,
  imageUrls,
  focusPageNumber,
  viewerMode = 'public',
  motionMode = 'standard',
  deferSections = false,
  adminMode,
  onRegenerateOutfit,
  onSaveOutfitText,
  onSaveComboGridText,
  onRegenerateComboGrid,
  onDraftOutfitSwap,
  onApplyOutfitSwap,
  onRegenerateFaceImage,
  onDraftFaceStyleSwap,
  onApplyFaceStyleSwap,
  onCopyImagePrompt,
  onUploadManualImage,
}: ManReportProps) {
  const { classification: cls, sections } = data;
  const isAdminViewer = viewerMode === 'admin' || adminMode === true;
  const reportDate    = formatReportDate(data.generated_at);
  const identityExcerpt = useMemo(() => extractIdentityExcerpt(sections.s6_identity), [sections.s6_identity]);
  const slideMeta = useMemo(() => getManReportSlideMeta(data), [data]);
  const totalSlides = slideMeta.length;
  const shouldRenderSlide = (slideType: ManReportSlideMeta['slideType'], outfitNumber?: number) => {
    const slide = slideMeta.find(item => item.slideType === slideType && (outfitNumber === undefined || item.outfitNumber === outfitNumber));
    if (!slide) return false;
    return !focusPageNumber || slide.pageNumber === focusPageNumber;
  };

  // Outfit numbers that have NO QA errors — used to show "Stylist verified" ribbon.
  // QA issues encode the outfit number inside the message (e.g. "Outfit 3 …"),
  // so we extract it via regex rather than relying on a structured field.
  const qaPassedOutfits = useMemo(() => {
    const total = cls.outfit_split.total;
    const errorOutfits = new Set<number>();
    for (const issue of data.qa?.section4?.issues ?? []) {
      if (issue.severity !== 'error') continue;
      const m = issue.message.match(/Outfit\s+(\d+)/i);
      if (m) errorOutfits.add(parseInt(m[1], 10));
    }
    const passed = new Set<number>();
    for (let n = 1; n <= total; n++) if (!errorOutfits.has(n)) passed.add(n);
    return passed;
  }, [cls.outfit_split.total, data.qa]);

  const stickyHeader = (
    <div
      className="sticky top-0 z-10 px-5 md:px-12 h-12 md:h-14 flex items-center justify-between"
      style={{
        background: 'rgba(244,239,229,0.94)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(44,38,34,0.10)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center"
          style={{ background: '#2C2622' }}
        >
          <span className="man-display-it" style={{ fontSize: 13, color: '#F4EFE5', fontWeight: 500 }}>
            I
          </span>
        </div>
        <span className="man-mono" style={{ color: '#2C2622', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          Iconik <span style={{ color: SLATE_DEEP }}>Blueprint</span>
        </span>
      </div>
      <span className="man-display-it" style={{ fontSize: 11, color: 'rgba(44,38,34,0.55)' }}>
        {reportDate}
      </span>
    </div>
  );

  const sectionConfigs = [
    {
      key: 's0',
      slideType: 'snapshot',
      label: 'Personal Style Snapshot',
      estimatedHeight: 420,
      background: '#ffffff',
      node: <SnapshotSection key="s0" text={sections.s0_snapshot} />,
    },
    {
      key: 's1',
      slideType: 'face',
      label: 'Facial Architecture',
      estimatedHeight: 980,
      background: '#ffffff',
      node: (
        <FaceSection
          key="s1"
          cls={cls}
          text={sections.s1_face}
          hairstyleUrls={imageUrls?.hairstyleCards ?? undefined}
          beardUrls={imageUrls?.beardCards ?? undefined}
          eyewearUrls={imageUrls?.eyewearCards ?? undefined}
          adminMode={isAdminViewer}
          onRegenerateFaceImage={onRegenerateFaceImage}
          onDraftFaceStyleSwap={onDraftFaceStyleSwap}
          onApplyFaceStyleSwap={onApplyFaceStyleSwap}
          onCopyImagePrompt={onCopyImagePrompt}
          onUploadManualImage={onUploadManualImage}
        />
      ),
    },
    {
      key: 's2',
      slideType: 'body',
      label: 'Body Geometry',
      estimatedHeight: 860,
      background: SHELL,
      node: <BodySection key="s2" cls={cls} text={sections.s2_body} />,
    },
    {
      key: 's3',
      slideType: 'colour',
      label: 'Chromatic Harmony',
      estimatedHeight: 900,
      background: '#ffffff',
      node: <ColourSection key="s3" cls={cls} text={sections.s3_colour} />,
    },
    {
      key: 's4',
      slideType: 'outfit_system',
      label: `Your ${cls.outfit_split.total} Outfit Formulas`,
      estimatedHeight: 2400,
      background: SHELL,
      node: (
        <OutfitsSection
          key="s4"
          cls={cls}
          text={sections.s4_outfits}
          outfitImageUrls={imageUrls?.outfitCards ?? undefined}
          adminMode={isAdminViewer}
          onRegenerateOutfit={onRegenerateOutfit}
          onSaveOutfitText={onSaveOutfitText}
          onDraftOutfitSwap={onDraftOutfitSwap}
          onApplyOutfitSwap={onApplyOutfitSwap}
          onCopyImagePrompt={onCopyImagePrompt}
          onUploadManualImage={onUploadManualImage}
          qaPassedOutfits={qaPassedOutfits}
          focusPageNumber={focusPageNumber}
          slideMeta={slideMeta}
        />
      ),
    },
    {
      key: 's4g',
      slideType: 'combo_grids',
      label: 'Combination Grids',
      estimatedHeight: 900,
      background: '#ffffff',
      node: (
        <ComboGridSection
          key="s4g"
          text={sections.s4_combo_grids}
          comboGridCards={imageUrls?.comboGridCards}
          adminMode={isAdminViewer}
          onSaveComboGridText={onSaveComboGridText}
          onRegenerateComboGrid={onRegenerateComboGrid}
          onCopyImagePrompt={onCopyImagePrompt}
          onUploadManualImage={onUploadManualImage}
        />
      ),
    },
    {
      key: 's5s',
      slideType: 'shopping',
      label: 'Shopping & Fit System',
      estimatedHeight: 720,
      background: SHELL,
      node: sections.s5_shopping ? (
        <TextReportSection key="s5s" number="06" label="Shopping & Ready-To-Wear Fit System" text={sections.s5_shopping} background={SHELL} />
      ) : (
        <StyleRulesSection key="s5s" text={sections.s5_rules ?? ''} />
      ),
    },
    {
      key: 's5g',
      slideType: 'grooming',
      label: 'Grooming & Basic Skincare',
      estimatedHeight: 680,
      background: '#ffffff',
      node: <TextReportSection key="s5g" number="07" label="Grooming & Basic Skincare" text={sections.s5_grooming_skin} />,
    },
    {
      key: 's6',
      slideType: 'identity',
      label: 'Your Style Identity',
      estimatedHeight: 420,
      background: SHELL,
      node: <IdentitySection key="s6" text={sections.s6_identity} />,
    },
  ] as const;

  return (
    <div
      className="man-report overflow-x-hidden"
      style={{ color: INK }}
    >
      {/* Sticky Nav */}
      {viewerMode === 'public' && !focusPageNumber && (motionMode === 'standard' ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: SECTION_REVEAL_EASE }}
        >
          {stickyHeader}
        </motion.div>
      ) : stickyHeader)}

      {/* ── Cover page ─────────────────────────────────────────────────────── */}
      {shouldRenderSlide('cover') && <section className="man-page slate man-cover">
        <div className="grain" />
        <div className="corner-tl">
          <div className="man-display man-wordmark">I C O N I K</div>
          <div className="man-micro muted">EST · MMXXIV</div>
        </div>
        <div className="corner-tr" style={{ textAlign: 'right' }}>
          <div className="man-micro muted">Analysis Verified</div>
          <div className="man-micro muted" style={{ marginTop: 8 }}>{reportDate}</div>
        </div>
        <div className="man-cover-center">
          <div className="man-cover-rule">
            <span /><div className="man-micro">A Personal Blueprint</div><span />
          </div>
          <h1 className="man-cover-heading">
            <span className="man-display">The</span>
            <span className="man-display-it">Lookbook</span>
          </h1>
          {identityExcerpt && (
            <p className="man-display-it man-cover-excerpt">&ldquo;{identityExcerpt}&rdquo;</p>
          )}
          <div className="man-mono man-cover-number">bp.iconik.pro</div>
        </div>
        <div className="corner-bl">
          <div className="man-display-it man-cover-tag">Same man.</div>
          <div className="man-display-it man-cover-tag">Different science.</div>
        </div>
        <div className="corner-br">
          <div className="man-mono corner-kicker">01 / {totalSlides}</div>
        </div>
      </section>}

      {/* ── Summary page — blueprint card + style brief ──────────────────── */}
      {shouldRenderSlide('overview') && <section className="man-page ivory">
        <div className="grain" />
        <div className="corner-tl">
          <div className="man-mono corner-kicker">The Blueprint</div>
          <div className="man-small-caps corner-title">Overview</div>
        </div>
        <div className="corner-tr">
          <div className="man-mono corner-kicker">{String(slideMeta.find(item => item.slideType === 'overview')?.pageNumber ?? 2).padStart(2, '0')} / {totalSlides}</div>
        </div>
        <div className="man-page-inner">
          <div className="flex flex-wrap gap-2.5 mb-8">
            <GoldPill>{cls.body.silhouette_type} build</GoldPill>
            <GoldPill>{cls.face.face_shape} face</GoldPill>
            <GoldPill>{cls.colour.season}</GoldPill>
            <GoldPill>{cls.outfit_split.total} ensembles</GoldPill>
          </div>
          <BlueprintCard cls={cls} />
          <div className="man-rule" style={{ margin: '40px 0 32px' }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            <div>
              <DataLabel>Aesthetic direction</DataLabel>
              <p style={{ fontSize: 13, color: INK, lineHeight: 1.6 }}>{cls.style_brief.aesthetic_direction}</p>
            </div>
            <div>
              <DataLabel>Primary vision</DataLabel>
              <p style={{ fontSize: 14, fontFamily: SERIF, color: INK_SOFT, fontStyle: 'italic', fontWeight: 350, lineHeight: 1.6 }}>
                &ldquo;{cls.style_brief.primary_brief}&rdquo;
              </p>
            </div>
            <div>
              <DataLabel>Register</DataLabel>
              <p style={{ fontSize: 13, color: INK, lineHeight: 1.6 }}>{cls.style_brief.register}</p>
            </div>
          </div>
        </div>
      </section>}

      {sectionConfigs
        .filter(section => section.key === 's4' ? (!focusPageNumber || slideMeta.find(item => item.pageNumber === focusPageNumber)?.sectionKey === 's4') : shouldRenderSlide(section.slideType))
        .map((section, index) => (
        <DeferredSection
          key={section.key}
          label={section.label}
          estimatedHeight={section.estimatedHeight}
          background={section.background}
          motionMode={motionMode}
          defer={deferSections && index >= 2}
        >
          {section.node}
        </DeferredSection>
      ))}

      {/* Footer */}
      {!focusPageNumber && <div className="man-footer">
        <p className="man-display-it man-footer-wordmark">
          Iconik <span style={{ color: ACCENT }}>Blueprint</span>
        </p>
        <p className="man-mono" style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(244,239,229,0.45)', marginTop: 10 }}>
          Personal · Confidential · {reportDate}
        </p>
      </div>}

      <ManBlueprintStyles />
    </div>
  );
}

function ManBlueprintStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,300;9..144,0,400;9..144,1,300;9..144,1,400&family=JetBrains+Mono:wght@400;500&display=swap');

      .man-report {
        background: #F8F3E9;
      }

      /* ── Page frame ────────────────────────────────────────── */
      .man-page {
        max-width: 1060px;
        margin: 0 auto 20px;
        border-radius: 20px;
        padding: 64px 56px;
        position: relative;
        overflow: hidden;
      }

      .man-page.slate {
        background: radial-gradient(ellipse 120% 80% at 25% 10%, ${SLATE_LIGHT} 0%, ${SLATE} 45%, ${SLATE_DEEP} 100%);
        color: #F4EFE5;
      }

      .man-page.ivory {
        background: linear-gradient(180deg, ${PAPER} 0%, #F1E9D8 100%);
        color: ${INK};
      }

      .man-page.bone {
        background: ${BONE};
        color: ${INK};
      }

      .man-cover {
        min-height: 720px;
      }

      /* ── Grain texture ─────────────────────────────────────── */
      .grain {
        position: absolute;
        inset: 0;
        opacity: 0.04;
        pointer-events: none;
        background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0);
        background-size: 3px 3px;
      }

      /* ── Corner markers ────────────────────────────────────── */
      .corner-tl, .corner-tr, .corner-bl, .corner-br {
        position: absolute;
        z-index: 2;
      }
      .corner-tl { top: 28px; left: 32px; }
      .corner-tr { top: 28px; right: 32px; text-align: right; }
      .corner-bl { bottom: 28px; left: 32px; }
      .corner-br { bottom: 28px; right: 32px; text-align: right; }
      .corner-kicker, .faded, .muted { opacity: 0.55; }
      .corner-title { margin-top: 6px; opacity: 0.7; }

      /* ── Typography ────────────────────────────────────────── */
      .man-display {
        font-family: 'Fraunces', serif;
        font-weight: 300;
        font-style: normal;
        letter-spacing: -0.025em;
        line-height: 0.95;
      }
      .man-display-it {
        font-family: 'Fraunces', serif;
        font-weight: 300;
        font-style: italic;
        letter-spacing: -0.025em;
        line-height: 1.04;
      }
      .man-mono {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 400;
        font-size: 11px;
        letter-spacing: 0;
      }
      .man-micro {
        font-size: 9px;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        font-weight: 400;
      }
      .man-small-caps {
        font-size: 10px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        font-weight: 400;
      }

      /* ── Dividers & layout ─────────────────────────────────── */
      .man-rule {
        height: 1px;
        background: currentColor;
        opacity: 0.18;
      }
      .man-page-inner {
        margin-top: 64px;
      }

      /* ── Cover page ────────────────────────────────────────── */
      .man-wordmark {
        font-size: 14px;
        letter-spacing: 0.42em;
      }
      .man-cover-center {
        position: absolute;
        top: 34%;
        left: 56px;
        right: 56px;
        z-index: 1;
        text-align: center;
      }
      .man-cover-rule {
        display: flex;
        align-items: baseline;
        gap: 24px;
        margin-bottom: 36px;
      }
      .man-cover-rule span {
        height: 1px;
        flex: 1;
        background: rgba(244,239,229,0.3);
      }
      .man-cover-rule div { opacity: 0.7; }
      .man-cover-heading {
        margin: 0;
        text-align: center;
      }
      .man-cover-heading .man-display,
      .man-cover-heading .man-display-it {
        display: block;
        font-size: clamp(72px, 12vw, 108px);
      }
      .man-cover-excerpt {
        font-size: 17px;
        opacity: 0.72;
        max-width: 520px;
        margin: 28px auto 0;
        line-height: 1.55;
      }
      .man-cover-number {
        text-align: center;
        margin-top: 40px;
        font-size: 11px;
        opacity: 0.6;
      }
      .man-cover-tag {
        font-size: 14px;
        opacity: 0.82;
      }

      /* ── Footer ────────────────────────────────────────────── */
      .man-footer {
        text-align: center;
        padding: 56px 24px;
        background: #1B1815;
      }
      .man-footer-wordmark {
        font-size: 26px;
        color: #F4EFE5;
        display: block;
        margin-bottom: 8px;
      }

      /* ── Typography utilities (mirror women's blueprint exactly) ─── */
      .display {
        font-family: 'Fraunces', serif;
        font-weight: 300;
        letter-spacing: -0.025em;
        line-height: 0.95;
      }
      .display-it {
        font-family: 'Fraunces', serif;
        font-weight: 300;
        font-style: italic;
        letter-spacing: -0.025em;
        line-height: 1.04;
      }
      .mono {
        font-family: 'JetBrains Mono', monospace;
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
      .faded { opacity: 0.55; }

      /* ── Glass card ──────────────────────────────────────────── */
      .glass-dark {
        background: rgba(244,239,229,0.06);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(244,239,229,0.15);
        border-radius: 18px;
      }
      .slate .glass-dark {
        background: rgba(244,239,229,0.06);
        border-color: rgba(244,239,229,0.15);
      }

      /* ── Rule ────────────────────────────────────────────────── */
      .rule, .rule-thin {
        height: 1px;
        background: currentColor;
        opacity: 0.18;
      }
      .rule-thin { opacity: 0.1; }
      .quote-rule { margin: 40px 0 24px; }

      /* ── Section editorial h2 headings ───────────────────────── */
      .man-page h2 {
        margin: 0 0 40px;
      }
      .man-page h2 span {
        display: block;
        font-size: clamp(44px, 7vw, 80px);
      }

      /* ── Dossier label (inherits page color, no hardcoded amber) ─ */
      .dossier-label {
        display: block;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        opacity: 0.45;
        text-transform: uppercase;
        letter-spacing: 0.10em;
        margin-bottom: 6px;
      }

      /* ── Diagnosis quote ─────────────────────────────────────── */
      .diagnosis-quote {
        font-family: 'Fraunces', serif;
        font-weight: 300;
        font-style: italic;
        font-size: 22px;
        opacity: 0.75;
        line-height: 1.5;
        letter-spacing: -0.025em;
      }

      /* ── Slate page: force readable colors on all inner content ─
         Inline styles (color: #8C5621 etc.) are dark and unreadable
         on the slate blue background — override them site-wide.    */
      .man-page.slate .man-page-inner p,
      .man-page.slate .man-page-inner li,
      .man-page.slate .man-page-inner span,
      .man-page.slate .man-page-inner em,
      .man-page.slate .man-page-inner td,
      .man-page.slate .man-page-inner label {
        color: rgba(244,239,229,0.78) !important;
      }
      .man-page.slate .man-page-inner h2,
      .man-page.slate .man-page-inner h3,
      .man-page.slate .man-page-inner h4,
      .man-page.slate .man-page-inner strong,
      .man-page.slate .man-page-inner b {
        color: rgba(244,239,229,0.88) !important;
      }
      /* Cards inside slate sections: glass-dark instead of white/cream */
      .man-page.slate .man-page-inner .rounded-2xl,
      .man-page.slate .man-page-inner .rounded-3xl {
        background: rgba(244,239,229,0.07) !important;
        border-color: rgba(244,239,229,0.14) !important;
        box-shadow: none !important;
      }
      /* Skeleton shimmer on slate */
      .man-page.slate .skeleton-shimmer {
        background: rgba(244,239,229,0.07);
      }

      /* ── Responsive ────────────────────────────────────────── */
      @media (max-width: 900px) {
        .man-page {
          border-radius: 0;
          margin-bottom: 0;
          padding: 72px 20px 44px;
        }
        .corner-tl, .corner-tr {
          top: 20px;
        }
        .corner-tl { left: 20px; }
        .corner-tr { right: 20px; }
        .man-cover-center {
          position: relative;
          top: auto;
          left: auto;
          right: auto;
          padding: 140px 0 80px;
        }
      }
    `}</style>
  );
}

export default memo(ManReport);
