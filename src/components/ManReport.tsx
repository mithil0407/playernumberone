'use client';

// ManReport.tsx
// Renders the full ICONIK Men's Blueprint report.
// Design matches the embedded report preview on /man landing page exactly.

import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import type { ReportData, ClassificationResult } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls } from '@/lib/manImageGenerator';
import { SPRING } from '@/lib/reportAnimations';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { FaceImageKind } from '@/lib/manImageGenerator';

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
const KNOWN_CONTEXTS = new Set(['FORMAL', 'SMART CASUAL', 'EVENING WEAR', 'RELAXED CASUAL']);

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
      top:         getField(block, 'Top'),
      bottom:      getField(block, 'Bottom'),
      layer:       getField(block, 'Layer(?:\\/Outerwear)?(?:\\/Layer)?'),
      footwear:    getField(block, 'Footwear'),
      accessories: getField(block, 'Accessorys?'),  // handles ACCESSORY and Accessories
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
    // Skip the outfit section confirmation line (e.g. "Total: 16 outfits confirmed…")
    if (/^total.*\d+.*outfits?\s+(confirmed|=)/i.test(line.trim())) continue;

    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <p key={key++} className="text-[14px] mt-7 mb-2 italic" style={{ fontFamily: SERIF, color: INK, fontWeight: 500 }}>
          {line.slice(4).replace(/\*\*/g, '')}
        </p>
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
function SectionHeader({ label, number }: { label: string; number?: string }) {
  return (
    <div className="px-6 md:px-12 pt-10 md:pt-14 pb-5 flex items-baseline gap-5">
      {number && (
        <span
          className="italic text-2xl md:text-3xl"
          style={{ fontFamily: SERIF, color: ACCENT, fontWeight: 300 }}
        >
          §&nbsp;{number}
        </span>
      )}
      <span
        className="text-[11px] font-medium uppercase tracking-[0.18em] flex-1"
        style={{ color: INK_SOFT }}
      >
        {label}
      </span>
      <span className="hidden md:block h-px w-16" style={{ background: BORDER }} />
    </div>
  );
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

// Subtler data label — sentence case, smaller tracking, normal weight.
function DataLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="block text-[10px] font-semibold uppercase tracking-[0.14em] mb-1.5"
      style={{ color: ACCENT_INK }}
    >
      {children}
    </span>
  );
}

// "Stylist note" pull-quote — uses the editorial serif and a soft amber rule.
function StylistNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-5 py-1" style={{ borderLeft: `2px solid ${ACCENT}55` }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: ACCENT_INK }}>
        Stylist Rationale
      </p>
      <p className="text-[14px] italic leading-relaxed" style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
        &ldquo;{children}&rdquo;
      </p>
    </div>
  );
}

// Thin hairline divider — replaces the old `h-px bg-BORDER` everywhere.
function HairRule({ className = '' }: { className?: string }) {
  return <div className={className} style={{ height: 1, background: BORDER }} />;
}

// ─────────────────────────────────────────────────────────────
// Section 01 — Face Architecture
// ─────────────────────────────────────────────────────────────

interface FaceImageRegenerationResult {
  kind: FaceImageKind;
  optionIndex: number;
  imageUrl: string;
}

function FaceSection({
  cls,
  text,
  hairstyleUrls,
  eyewearUrls,
  adminMode,
  onRegenerateFaceImage,
  onRetryMissingImages,
}: {
  cls: ClassificationResult;
  text: string;
  hairstyleUrls?: (string | null)[];
  eyewearUrls?: (string | null)[];
  adminMode?: boolean;
  onRegenerateFaceImage?: (
    kind: FaceImageKind,
    optionIndex: number,
  ) => Promise<FaceImageRegenerationResult | null>;
  onRetryMissingImages?: () => Promise<void>;
}) {
  const { face } = cls;
  const [retryingSlots, setRetryingSlots] = useState<Set<string>>(new Set());
  const [hairstyleOverrides, setHairstyleOverrides] = useState<Record<number, string>>({});
  const [eyewearOverrides, setEyewearOverrides] = useState<Record<number, string>>({});
  const hasHairstyleImages = hairstyleUrls && hairstyleUrls.some(Boolean);
  const hasEyewearImages   = eyewearUrls && eyewearUrls.some(Boolean);

  const handleRetryFaceImage = async (kind: FaceImageKind, optionIndex: number) => {
    if (!onRetryMissingImages && !onRegenerateFaceImage) return;
    const slotKey = `${kind}-${optionIndex}`;
    setRetryingSlots(prev => new Set(prev).add(slotKey));
    try {
      if (onRetryMissingImages) {
        await onRetryMissingImages();
        return;
      }

      if (!onRegenerateFaceImage) return;
      const result = await onRegenerateFaceImage(kind, optionIndex);
      if (!result) return;
      if (kind === 'hairstyle') {
        setHairstyleOverrides(prev => ({ ...prev, [optionIndex]: result.imageUrl }));
      } else {
        setEyewearOverrides(prev => ({ ...prev, [optionIndex]: result.imageUrl }));
      }
    } finally {
      setRetryingSlots(prev => {
        const next = new Set(prev);
        next.delete(slotKey);
        return next;
      });
    }
  };

  const renderFaceImageSlot = (kind: FaceImageKind, url: string | null | undefined, optionIndex: number) => {
    const effectiveUrl = kind === 'hairstyle'
      ? hairstyleOverrides[optionIndex] ?? url
      : eyewearOverrides[optionIndex] ?? url;
    const canRetry = adminMode && (!!onRetryMissingImages || !!onRegenerateFaceImage);
    const slotKey = `${kind}-${optionIndex}`;
    const isRetrying = retryingSlots.has(slotKey);

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
            />
          ) : canRetry ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
              style={{ background: SHELL }}
            >
              <AlertCircle size={26} style={{ color: OXBLOOD, opacity: 0.7 }} />
              <div className="flex flex-col items-center gap-1">
                <p className="text-[12px] font-medium" style={{ color: OXBLOOD }}>Image failed</p>
                <p className="text-[11px]" style={{ color: INK_SOFT }}>Generation did not complete</p>
              </div>
              <motion.button
                onClick={() => handleRetryFaceImage(kind, optionIndex)}
                disabled={isRetrying}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-[11px] font-medium disabled:opacity-40"
                style={{ background: ACCENT, color: '#fff' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING}
              >
                {isRetrying
                  ? <><Loader2 size={12} className="animate-spin" /> Retrying…</>
                  : <><RefreshCw size={12} /> Retry</>
                }
              </motion.button>
            </div>
          ) : (
            <div className="w-full h-full skeleton-shimmer flex items-center justify-center">
              <span className="text-[11px]" style={{ color: INK_SOFT }}>Generating…</span>
            </div>
          )}
        </div>
        <span
          className="text-center text-[12px] italic"
          style={{ fontFamily: SERIF, color: ACCENT_INK, fontWeight: 400 }}
        >
          Option {optionIndex}
        </span>
      </div>
    );
  };

  return (
    <div style={{ background: '#fff' }}>
      <SectionHeader number="01" label="Facial Architecture" />
      <div className="px-6 md:px-12 pb-14">
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <GoldPill>{face.face_shape} face</GoldPill>
          <span className="text-[12px]" style={{ color: INK_SOFT }}>
            {face.feature_type} feature type
          </span>
        </div>

        {/* Hairstyle images — two headshots side by side */}
        {(hasHairstyleImages || (adminMode && (!!onRetryMissingImages || !!onRegenerateFaceImage))) && (
          <div className="mb-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-5" style={{ color: ACCENT_INK }}>
              Hairstyle options
            </p>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {[1, 2].map(optionIndex =>
                renderFaceImageSlot('hairstyle', hairstyleUrls?.[optionIndex - 1] ?? null, optionIndex),
              )}
            </div>
          </div>
        )}

        {/* Eyewear images — two headshots side by side */}
        {(hasEyewearImages || (adminMode && (!!onRetryMissingImages || !!onRegenerateFaceImage))) && (
          <div className="mb-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-5" style={{ color: ACCENT_INK }}>
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
          <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
            <RenderMarkdown text={text} />
          </div>
        )}
      </div>
    </div>
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
    <div style={{ background: SHELL }}>
      <SectionHeader number="02" label="Body Geometry" />
      <div className="px-6 md:px-12 pb-14">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <GoldPill>{body.silhouette_type} build</GoldPill>
          <span className="text-[12px]" style={{ color: INK_SOFT }}>Your dominant frame geometry</span>
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
            <RenderMarkdown text={text} />
          </div>
        )}
      </div>
    </div>
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
    <div style={{ background: '#fff' }}>
      <SectionHeader number="03" label="Chromatic Harmony" />
      <div className="px-6 md:px-12 pb-14">
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <GoldPill>{colour.undertone} undertone · {colour.skin_tone_depth}</GoldPill>
          <span className="text-[12px]" style={{ color: INK_SOFT }}>{colour.season}</span>
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 04 — 16 Outfits
// ─────────────────────────────────────────────────────────────

interface OutfitEditResult {
  imageUrl: string | null;
  updatedS4Outfits: string;
  imageStatus: 'generated' | 'failed';
  error?: string;
}

function OutfitsSection({
  cls, text, outfitImageUrls, adminMode, onRegenerateOutfit, onRetryMissingImages, qaPassedOutfits,
}: {
  cls: ClassificationResult;
  text: string;
  outfitImageUrls?: (string | null)[];
  adminMode?: boolean;
  onRegenerateOutfit?: (
    outfitNumber: number,
    newText: string,
  ) => Promise<OutfitEditResult | null>;
  onRetryMissingImages?: () => Promise<void>;
  qaPassedOutfits?: Set<number>; // outfit numbers without QA errors
}) {
  const [editingNumber, setEditingNumber] = useState<number | null>(null);
  const [editText, setEditText]           = useState('');
  const [editError, setEditError]         = useState<string | null>(null);
  const [sectionNotice, setSectionNotice] = useState<string | null>(null);
  const [regenerating, setRegenerating]   = useState(false);
  const [retryingSet, setRetryingSet]     = useState<Set<number>>(new Set());
  const [imageOverrides, setImageOverrides] = useState<Record<number, string>>({});

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

  // Quick retry for failed images. In admin report view this starts the resumable
  // missing-image pipeline; completed images are preserved.
  const handleQuickRetry = async (outfitNumber: number) => {
    if (!onRetryMissingImages && !onRegenerateOutfit) return;
    setRetryingSet(prev => new Set(prev).add(outfitNumber));
    try {
      if (onRetryMissingImages) {
        await onRetryMissingImages();
        return;
      }

      if (!onRegenerateOutfit) return;
      const outfitBlock = extractOutfitBlock(text, outfitNumber);
      if (!outfitBlock) {
        setSectionNotice(`Could not locate Outfit ${outfitNumber} in Section 4 text. Open the full Section 4 editor to repair the outfit headers.`);
        return;
      }
      const result = await onRegenerateOutfit(outfitNumber, outfitBlock);
      if (result?.imageUrl) setImageOverrides(prev => ({ ...prev, [outfitNumber]: result.imageUrl! }));
    } finally {
      setRetryingSet(prev => { const next = new Set(prev); next.delete(outfitNumber); return next; });
    }
  };

  const categories = useMemo(() => parseOutfitCategories(text), [text]);
  const split      = cls.outfit_split;

  // Fallback: if parsing failed, render raw markdown
  if (categories.length === 0 || categories.every(c => c.outfits.length === 0)) {
    return (
      <div style={{ background: SHELL }}>
        <SectionHeader number="04" label={`Your ${split.total} Outfit Formulas`} />
        <div className="px-6 md:px-12 pb-14">
          <RenderMarkdown text={text} />
        </div>
      </div>
    );
  }

  const editingOutfit = editingNumber
    ? categories.flatMap(category => category.outfits).find(outfit => outfit.number === editingNumber) ?? null
    : null;

  // Render an individual outfit row — image left, details right.
  const renderOutfitCard = (cat: OutfitCategory, outfit: ParsedOutfit) => {
    const outfitImg   = imageOverrides[outfit.number] ?? outfitImageUrls?.[outfit.number - 1] ?? null;
    const isEditing   = editingNumber === outfit.number;
    const isRegenning = regenerating && isEditing;
    const canEdit     = adminMode && !!onRegenerateOutfit;
    const canRetryImage = adminMode && (!!onRetryMissingImages || !!onRegenerateOutfit);
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
            />
          ) : canRetryImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <AlertCircle size={26} style={{ color: OXBLOOD, opacity: 0.7 }} />
              <div className="flex flex-col items-center gap-1">
                <p className="text-[12px] font-medium" style={{ color: OXBLOOD }}>Image failed</p>
                <p className="text-[11px]" style={{ color: INK_SOFT }}>Generation did not complete</p>
              </div>
              <motion.button
                onClick={() => handleQuickRetry(outfit.number)}
                disabled={retryingSet.has(outfit.number)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-[11px] font-medium disabled:opacity-40"
                style={{ background: ACCENT, color: '#fff' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING}
              >
                {retryingSet.has(outfit.number)
                  ? <><Loader2 size={12} className="animate-spin" /> Retrying…</>
                  : <><RefreshCw size={12} /> Retry</>
                }
              </motion.button>
            </div>
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
              title={isEditing ? 'Cancel edit' : 'Edit outfit'}
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
            </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div style={{ background: SHELL }}>
      <SectionHeader number="04" label={`Your ${split.total} Outfit Formulas`} />

      <div className="px-4 md:px-8 pb-14 space-y-14">
        {(editError || sectionNotice) && (
          <div
            className="mx-2 md:mx-4 flex items-start gap-2 rounded-2xl px-4 py-3"
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

        {categories.map((cat, ci) => {
          const catCount = split.categories.find(c =>
            c.category.toLowerCase().includes(cat.name.toLowerCase().slice(0, 4))
          )?.count;

          return (
            <div key={ci} className="space-y-6">
              {/* Category cover — big serif heading + count + intro */}
              <div className="px-2 md:px-4 pt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] mb-2" style={{ color: ACCENT_INK }}>
                    {ci + 1} of {categories.length} · {cat.name}
                  </p>
                  <h3
                    className="text-3xl md:text-4xl italic leading-[1.05]"
                    style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}
                  >
                    {cat.name}
                  </h3>
                  {cat.intro && (
                    <p className="mt-3 text-[14px] italic leading-relaxed max-w-2xl"
                      style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
                      {cat.intro}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: INK_SOFT }}>
                    {catCount ?? cat.outfits.length} outfits
                  </p>
                </div>
              </div>

              {/* Outfit cards stacked vertically with breathing room */}
              <div className="space-y-6">
                {cat.outfits.map((outfit) => renderOutfitCard(cat, outfit))}
              </div>
            </div>
          );
        })}
      </div>

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
                  Saves this outfit text first, then regenerates only this outfit image.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => cancelEdit()}
                    disabled={regenerating}
                    className="px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleRegenerate}
                    disabled={regenerating || !editText.trim()}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: ACCENT, color: '#fff' }}
                    whileHover={!regenerating ? { scale: 1.02 } : undefined}
                    whileTap={!regenerating ? { scale: 0.98 } : undefined}
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
    </div>
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
      <div style={{ background: '#fff' }}>
        <SectionHeader number="05" label="Your Style Rules" />
        <div className="px-6 md:px-12 pb-14">
          <RenderMarkdown text={text} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff' }}>
      <SectionHeader number="05" label="Your Style Rules" />
      <div className="px-6 md:px-12 pb-14">
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
    </div>
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
    <div style={{ background: SHELL }}>
      <SectionHeader number="06" label="Your Style Identity" />
      <div className="px-6 md:px-12 pb-16">
        <div
          className="rounded-3xl p-8 md:p-12 max-w-3xl"
          style={{ background: '#fff', boxShadow: '0 30px 80px -50px rgba(27,24,21,0.30)' }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] mb-5" style={{ color: ACCENT_INK }}>
            Personal statement
          </p>
          <p
            className="text-xl md:text-2xl italic leading-relaxed"
            style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}
            dangerouslySetInnerHTML={{ __html: richify(body) }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

interface ManReportProps {
  data: ReportData;
  imageUrls?: ResolvedImageUrls | null;
  viewerMode?: 'admin' | 'public';
  motionMode?: 'reduced' | 'standard';
  deferSections?: boolean;
  adminMode?: boolean;
  onRegenerateOutfit?: (
    outfitNumber: number,
    newText: string,
  ) => Promise<OutfitEditResult | null>;
  onRegenerateFaceImage?: (
    kind: FaceImageKind,
    optionIndex: number,
  ) => Promise<FaceImageRegenerationResult | null>;
  onRetryMissingImages?: () => Promise<void>;
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
          {cls.outfit_split.total} outfits · 6 chapters
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
  viewerMode = 'public',
  motionMode = 'standard',
  deferSections = false,
  adminMode,
  onRegenerateOutfit,
  onRegenerateFaceImage,
  onRetryMissingImages,
}: ManReportProps) {
  const { classification: cls, sections } = data;
  const isAdminViewer = viewerMode === 'admin' || adminMode === true;
  const reportDate    = formatReportDate(data.generated_at);
  const identityExcerpt = useMemo(() => extractIdentityExcerpt(sections.s6_identity), [sections.s6_identity]);

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
        background: 'rgba(251,248,244,0.86)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center"
          style={{ background: INK }}
        >
          <span
            className="text-[12px] md:text-[13px] italic"
            style={{ fontFamily: SERIF, color: ACCENT, fontWeight: 500 }}
          >
            I
          </span>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: INK }}>
          Iconik <span style={{ color: ACCENT_INK }}>Blueprint</span>
        </span>
      </div>
      <span className="text-[10px] italic" style={{ fontFamily: SERIF, color: INK_SOFT }}>
        {reportDate}
      </span>
    </div>
  );

  const sectionConfigs = [
    {
      key: 's1',
      label: 'Facial Architecture',
      estimatedHeight: 980,
      background: '#ffffff',
      node: (
        <FaceSection
          key="s1"
          cls={cls}
          text={sections.s1_face}
          hairstyleUrls={imageUrls?.hairstyleCards ?? undefined}
          eyewearUrls={imageUrls?.eyewearCards ?? undefined}
          adminMode={isAdminViewer}
          onRegenerateFaceImage={onRegenerateFaceImage}
          onRetryMissingImages={onRetryMissingImages}
        />
      ),
    },
    {
      key: 's2',
      label: 'Body Geometry',
      estimatedHeight: 860,
      background: SHELL,
      node: <BodySection key="s2" cls={cls} text={sections.s2_body} />,
    },
    {
      key: 's3',
      label: 'Chromatic Harmony',
      estimatedHeight: 900,
      background: '#ffffff',
      node: <ColourSection key="s3" cls={cls} text={sections.s3_colour} />,
    },
    {
      key: 's4',
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
          onRetryMissingImages={onRetryMissingImages}
          qaPassedOutfits={qaPassedOutfits}
        />
      ),
    },
    {
      key: 's5',
      label: 'Your Style Rules',
      estimatedHeight: 560,
      background: '#ffffff',
      node: <StyleRulesSection key="s5" text={sections.s5_rules} />,
    },
    {
      key: 's6',
      label: 'Your Style Identity',
      estimatedHeight: 420,
      background: SHELL,
      node: <IdentitySection key="s6" text={sections.s6_identity} />,
    },
  ] as const;

  return (
    <div
      className="overflow-x-hidden"
      style={{ background: IVORY, color: INK, fontFamily: 'var(--font-geist-sans, system-ui)' }}
    >
      {/* Sticky Nav */}
      {motionMode === 'standard' ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: SECTION_REVEAL_EASE }}
        >
          {stickyHeader}
        </motion.div>
      ) : stickyHeader}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative px-5 md:px-12 pt-12 md:pt-20 pb-14 md:pb-20" style={{ background: IVORY }}>
        {/* Decorative gradient blob — soft modern depth, not filigree */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: -120,
            right: -120,
            width: 420,
            height: 420,
            background: `radial-gradient(circle at center, ${ACCENT}1A 0%, ${ACCENT}00 70%)`,
            filter: 'blur(20px)',
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          <div className="lg:col-span-7 min-w-0">
            <p
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] mb-5"
              style={{ color: ACCENT_INK }}
            >
              <span style={{ fontSize: 13 }}>✦</span>
              <span>Analysis verified</span>
              <span style={{ color: BORDER }}>·</span>
              <span style={{ color: INK_SOFT, letterSpacing: '0.16em' }}>{reportDate}</span>
            </p>

            <h1
              className="leading-[0.95] tracking-tight"
              style={{
                fontFamily: SERIF,
                color: INK,
                fontWeight: 350,
                fontSize: 'clamp(56px, 9vw, 112px)',
              }}
            >
              <span className="italic">The</span>{' '}
              <span className="italic" style={{ color: ACCENT_INK }}>Lookbook</span>
            </h1>

            {identityExcerpt && (
              <p
                className="mt-6 max-w-xl italic leading-relaxed"
                style={{ fontFamily: SERIF, color: INK_SOFT, fontSize: 18, fontWeight: 350 }}
              >
                &ldquo;{identityExcerpt}&rdquo;
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-2.5">
              <GoldPill>{cls.body.silhouette_type} build</GoldPill>
              <span
                className="inline-flex items-center px-3.5 py-1.5 text-[11px] rounded-full"
                style={{ background: '#fff', color: INK, border: `1px solid ${BORDER}` }}
              >
                {cls.face.face_shape} face
              </span>
              <span
                className="inline-flex items-center px-3.5 py-1.5 text-[11px] rounded-full"
                style={{ background: '#fff', color: INK, border: `1px solid ${BORDER}` }}
              >
                {cls.colour.season}
              </span>
              <span
                className="inline-flex items-center px-3.5 py-1.5 text-[11px] rounded-full"
                style={{ background: '#fff', color: INK, border: `1px solid ${BORDER}` }}
              >
                {cls.outfit_split.total} ensembles
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 min-w-0">
            <BlueprintCard cls={cls} />
          </div>
        </div>
      </div>

      {/* Style Brief strip */}
      <div className="px-6 md:px-12 py-7" style={{ background: '#fff', borderTop: `1px solid ${BORDER}` }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          <div>
            <DataLabel>Aesthetic direction</DataLabel>
            <p className="text-[13px] leading-relaxed" style={{ color: INK }}>{cls.style_brief.aesthetic_direction}</p>
          </div>
          <div>
            <DataLabel>Primary vision</DataLabel>
            <p className="text-[14px] italic leading-relaxed" style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
              &ldquo;{cls.style_brief.primary_brief}&rdquo;
            </p>
          </div>
          <div>
            <DataLabel>Register</DataLabel>
            <p className="text-[13px]" style={{ color: INK }}>{cls.style_brief.register}</p>
          </div>
        </div>
      </div>

      {sectionConfigs.map((section, index) => (
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
      <div className="px-6 md:px-12 py-12 text-center" style={{ background: '#fff', borderTop: `1px solid ${BORDER}` }}>
        <p
          className="text-2xl italic mb-2"
          style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}
        >
          Iconik <span style={{ color: ACCENT_INK }}>Blueprint</span>
        </p>
        <p className="text-[11px] tracking-[0.18em] uppercase" style={{ color: INK_SOFT }}>
          Personal · Confidential · {reportDate}
        </p>
      </div>
    </div>
  );
}

export default memo(ManReport);
