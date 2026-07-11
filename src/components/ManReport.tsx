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
import { hasPlaceholderOutfitValue } from '@/lib/manOutfitPlaceholders';
import {
  buildFallbackSearchUrl,
  buildShoppingSlotKey,
  descriptorHash,
  normalizeDescriptor,
  MAN_SHOPPING_MAX_SELECTED,
  type ManProductLink,
  type ManShoppingSlot,
  type ManShoppingSlotName,
  type ManShoppingState,
} from '@/lib/manShopping';

// ─────────────────────────────────────────────────────────────
// Design tokens — modern editorial palette (refresh 2026-05)
// ─────────────────────────────────────────────────────────────

const ACCENT     = '#D4537E';   // stylist blueprint rose accent
const ACCENT_INK = '#A33C61';   // deeper rose for text on light backgrounds
const INK        = '#1B1815';   // near-black for body copy
const INK_SOFT   = '#5A524A';   // muted ink for secondary copy
const IVORY      = '#FBF8F4';   // page background
const SHELL      = '#F5EFE5';   // soft shell for alternating sections
const BORDER     = '#E6DAC5';   // hairline divider matched to blueprint paper
const SAGE       = '#8FA088';   // accent for "always do" rules
const OXBLOOD    = '#8A3A3A';   // accent for "never do" rules

// Blueprint page palette — matches the women's StylistBlueprintReport
const SLATE      = '#94A6AD';
const SLATE_LIGHT = '#A0B2B9';
const SLATE_DEEP = '#7E9098';
const PAPER      = '#F8F3E9';
const BONE       = '#EDE5D2';

const SECTION_REVEAL_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

// Match the women's blueprint typography stack.
const SERIF      = "var(--font-fraunces), Fraunces, Georgia, serif";
const MAN_BLUEPRINT_V2_VERSION = 'man_blueprint_v2';

// ─────────────────────────────────────────────────────────────
// Parsing helpers
// ─────────────────────────────────────────────────────────────

interface ParsedOutfit {
  number:      number;
  occurrenceIndex: number;
  blockStart: number;
  block: string;
  identityKey: string;
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
    | 'reading_guide'
    | 'snapshot'
    | 'face_geometry'
    | 'hairstyle_grid'
    | 'beard_grid'
    | 'skin_grooming_system'
    | 'frame_analysis'
    | 'side_profile'
    | 'frame_training'
    | 'colour_drape'
    | 'face'
    | 'grooming_direction'
    | 'eyewear_direction'
    | 'body'
    | 'colour'
    | 'fit_rules'
    | 'fabric'
    | 'outfit_system'
    | 'outfit'
    | 'combo_grids'
    | 'shopping'
    | 'before_after'
    | 'linkedin_headshot'
    | 'dating_profile_shots'
    | 'shopping_identity'
    | 'grooming'
    | 'identity';
  outfitNumber?: number;
  outfitIdentityKey?: string;
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
  let cursor = 0;
  let occurrenceIndex = 0;

  for (const block of outfitBlocks) {
    const blockStart = text.indexOf(block, cursor);
    if (blockStart >= 0) cursor = blockStart + block.length;

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
      occurrenceIndex,
      blockStart: blockStart >= 0 ? blockStart : occurrenceIndex,
      block:       block.trim(),
      identityKey: `outfit-${outfitNum}-at-${blockStart >= 0 ? blockStart : occurrenceIndex}`,
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
        return v !== '—' && !hasPlaceholderOutfitValue(v)
          ? v
          : getField(block, 'Why it works(?:\\s+for\\s+you)?');
      })(),
      shoppingTranslation: getField(block, 'Shopping translation'),
      acceptableSubstitutes: getField(block, 'Acceptable substitutes'),
      doNotBuy: getField(block, 'Do not buy'),
    };
    occurrenceIndex += 1;

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
  const isV2 = data.report_version === MAN_BLUEPRINT_V2_VERSION;

  if (isV2) {
    const slides: Omit<ManReportSlideMeta, 'pageNumber'>[] = [
      { title: 'Cover', group: 'Opening', sectionKey: 's0', slideType: 'cover' },
      { title: 'Your Scorecard', group: 'Opening', sectionKey: 's0', slideType: 'overview' },
      { title: 'Face Geometry Analysis', group: 'Diagnosis', sectionKey: 's1', slideType: 'face_geometry' },
      { title: 'Hairstyle Grid', group: 'Diagnosis', sectionKey: 's1', slideType: 'hairstyle_grid' },
      { title: 'Beard Grid', group: 'Diagnosis', sectionKey: 's1', slideType: 'beard_grid' },
      { title: 'Eyewear Grid', group: 'Diagnosis', sectionKey: 's1', slideType: 'eyewear_direction' },
      { title: 'Skin & Grooming System', group: 'Prescription', sectionKey: 's5g', slideType: 'skin_grooming_system' },
      { title: 'Frame Analysis', group: 'Diagnosis', sectionKey: 's2', slideType: 'frame_analysis' },
      { title: 'Side Profile', group: 'Diagnosis', sectionKey: 's2', slideType: 'side_profile' },
      { title: 'Frame Training Direction', group: 'Prescription', sectionKey: 's2', slideType: 'frame_training' },
      { title: 'Fit Rules', group: 'Prescription', sectionKey: 's2', slideType: 'fit_rules' },
      { title: 'Colour Drape Comparison', group: 'Diagnosis', sectionKey: 's3', slideType: 'colour_drape' },
      { title: 'Palette', group: 'Prescription', sectionKey: 's3', slideType: 'colour' },
    ];

    if (outfits.length > 0) {
      for (const { outfit } of outfits) {
        slides.push({
          title: `Outfit ${String(outfit.number).padStart(2, '0')}: ${outfit.label}`,
          group: 'Outfits',
          sectionKey: 's4',
          slideType: 'outfit',
          outfitNumber: outfit.number,
          outfitIdentityKey: outfit.identityKey,
        });
      }
    } else if (sections.s4_outfits?.trim()) {
      slides.push({ title: 'Outfit Formulas', group: 'Outfits', sectionKey: 's4', slideType: 'outfit' });
    }

    slides.push(
      { title: 'Before / After Transformation', group: 'Closing', sectionKey: 's4', slideType: 'before_after' },
      { title: 'LinkedIn Headshot', group: 'Closing', sectionKey: 's5g', slideType: 'linkedin_headshot' },
      { title: 'Social Media Inspiration', group: 'Closing', sectionKey: 's4', slideType: 'dating_profile_shots' },
      { title: 'Shopping + Identity Close', group: 'Closing', sectionKey: 's5s', slideType: 'shopping_identity' },
    );

    return slides.map((slide, index) => ({ ...slide, pageNumber: index + 1 }));
  }

  const slides: Omit<ManReportSlideMeta, 'pageNumber'>[] = [
    { title: 'Cover', group: 'Opening', sectionKey: 's0', slideType: 'cover' },
    { title: 'Overview', group: 'Opening', sectionKey: 's0', slideType: 'overview' },
    { title: 'How To Read This Report', group: 'Opening', sectionKey: 's0', slideType: 'reading_guide' },
  ];

  if (sections.s0_snapshot?.trim()) {
    slides.push({ title: 'Personal Style Snapshot', group: 'Opening', sectionKey: 's0', slideType: 'snapshot' });
  }

  slides.push(
    { title: 'Body Geometry', group: 'Diagnosis', sectionKey: 's2', slideType: 'body' },
    { title: 'Chromatic Harmony', group: 'Diagnosis', sectionKey: 's3', slideType: 'colour' },
    { title: 'Face Architecture', group: 'Diagnosis', sectionKey: 's1', slideType: 'face' },
    { title: 'Grooming Direction', group: 'Prescription', sectionKey: 's5g', slideType: 'grooming_direction' },
    { title: 'Eyewear Direction', group: 'Prescription', sectionKey: 's1', slideType: 'eyewear_direction' },
    { title: 'Fit Rules', group: 'Prescription', sectionKey: 's2', slideType: 'fit_rules' },
    { title: 'Fabric & Texture', group: 'Prescription', sectionKey: 's3', slideType: 'fabric' },
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
        outfitIdentityKey: outfit.identityKey,
      });
    }
  } else if (sections.s4_outfits?.trim()) {
    slides.push({ title: 'Outfit Formulas', group: 'Outfits', sectionKey: 's4', slideType: 'outfit' });
  }

  if (sections.s4_combo_grids?.trim()) {
    slides.push({ title: 'Combination Grids', group: 'Outfits', sectionKey: 's4g', slideType: 'combo_grids' });
  }
  if ((sections.s5_shopping ?? sections.s5_rules)?.trim()) {
    slides.push({ title: 'Shopping Filter', group: 'Closing', sectionKey: 's5s', slideType: 'shopping' });
  }
  slides.push({ title: 'Identity Statement', group: 'Closing', sectionKey: 's6', slideType: 'identity' });

  return slides.map((slide, index) => ({ ...slide, pageNumber: index + 1 }));
}

// ─────────────────────────────────────────────────────────────
// Markdown renderer — handles ###, **bold**, - lists, paragraphs
// ─────────────────────────────────────────────────────────────

function richify(text: string): string {
  return text
    // bold must come before emphasis to avoid double-processing
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
                className="text-[12px] flex-shrink-0 mt-0.5 w-5"
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
          <p className="text-[18px] md:text-[20px] leading-snug" style={{ fontFamily: SERIF, color: INK, fontWeight: 400 }}>
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
        <p key={key++} className="text-lg mt-5 mb-2" style={{ fontFamily: SERIF, color: INK, fontWeight: 400 }}>
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

function plainText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/^\s*[-*•✓✗✘✔]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentenceClamp(text: string, maxSentences = 2, maxChars = 260): string {
  const clean = plainText(text);
  if (!clean) return '';
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(sentence => sentence.trim()).filter(Boolean) ?? [clean];
  const joined = sentences.slice(0, maxSentences).join(' ');
  if (joined.length <= maxChars) return joined;
  return `${joined.slice(0, maxChars).replace(/\s+\S*$/, '')}...`;
}

function markdownBullets(text: string, maxItems = 6): string[] {
  const items = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^[-*•✓✗✘✔]\s+/.test(line))
    .map(line => plainText(line.replace(/^[-*•✓✗✘✔]\s+/, '')))
    .filter(Boolean);
  return items.slice(0, maxItems);
}

function firstMarkdownParagraph(text: string, fallback = ''): string {
  const paragraph = text
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .find(block => block && !/^#{1,6}\s/.test(block) && !/^[-*•✓✗✘✔]\s+/.test(block));
  return sentenceClamp(paragraph ?? fallback, 2);
}

function extractHeadingBlock(text: string, patterns: RegExp[], maxItems = 5): string[] {
  const lines = text.split('\n');
  const start = lines.findIndex(line => {
    const heading = line.replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').trim();
    return patterns.some(pattern => pattern.test(heading));
  });
  if (start < 0) return [];
  const collected: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^#{1,6}\s+/.test(line) || /^\*\*[^*]+\*\*$/.test(line)) break;
    if (/^[-*•✓✗✘✔]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      collected.push(plainText(line.replace(/^([-*•✓✗✘✔]|\d+\.)\s+/, '')));
    } else if (collected.length === 0) {
      collected.push(sentenceClamp(line, 1, 180));
    }
    if (collected.length >= maxItems) break;
  }
  return collected.filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
// Shared section-header component
// ─────────────────────────────────────────────────────────────

// Section header: hairline + section number on the left,
// label in soft caps on the right. Reads like a magazine spread, not a CSV row.
// SectionHeader is intentionally a no-op — section identity lives in ManPageFrame corner markers.
function SectionHeader({}: { label: string; number?: string }) {
  return null;
}

// Soft neutral stamp used sparingly for compact report metadata.
function GoldPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-3.5 py-1.5 text-[11px] font-medium tracking-wide rounded-full"
      style={{ background: 'rgba(27,24,21,0.045)', color: INK_SOFT, border: `1px solid ${BORDER}` }}
    >
      {children}
    </span>
  );
}

// Data label — uses inherited page color so it reads on both slate and ivory pages.
function DataLabel({ children }: { children: React.ReactNode }) {
  return <span className="dossier-label">{children}</span>;
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
  mode = 'architecture',
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
  mode?: 'architecture' | 'grooming' | 'eyewear';
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
  const pageCopy = {
    architecture: {
      className: 'slate',
      corner: 'Facial Architecture',
      kicker: 'Diagnosis',
      h1: 'Face',
      h2: 'architecture.',
      number: '04',
    },
    grooming: {
      className: 'ivory',
      corner: 'Grooming Direction',
      kicker: 'Prescription',
      h1: 'Grooming',
      h2: 'direction.',
      number: '06',
    },
    eyewear: {
      className: 'bone',
      corner: 'Eyewear Direction',
      kicker: 'Prescription',
      h1: 'Eyewear',
      h2: 'direction.',
      number: '07',
    },
  }[mode];

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
          className="text-center text-[12px]"
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
    <section className={`iconik-page man-page ${pageCopy.className}`}>
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">{pageCopy.kicker}</div>
        <div className="man-small-caps corner-title">{pageCopy.corner}</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">{pageCopy.number}</div>
      </div>
      <SectionHeader number={pageCopy.number} label={pageCopy.corner} />
      <div className="man-page-inner">
        <h2>
          <span className="display">{pageCopy.h1}</span>
          <span className="display-it">{pageCopy.h2}</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />

        {mode === 'architecture' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[0.85fr_1.45fr] gap-5 md:gap-8">
              <div className="space-y-3">
                {[
                  ['Face shape', `${face.face_shape} face`],
                  ['Feature type', face.feature_type],
                  ['Hair state', face.hair_presence ? face.hair_presence.replace(/_/g, ' ') : 'assessed visually'],
                  ['Facial hair', face.facial_hair_presence ? face.facial_hair_presence.replace(/_/g, ' ') : 'assessed visually'],
                ].map(([label, value]) => (
                  <div key={label} className="glass-dark rounded-2xl p-4">
                    <DataLabel>{label}</DataLabel>
                    <p className="display-it text-[21px] md:text-[23px] leading-tight">{value}</p>
                  </div>
                ))}
              </div>
              <div className="glass-dark rounded-3xl p-5 md:p-7">
                <DataLabel>What this means</DataLabel>
                <p className="display-it text-[22px] md:text-[28px] leading-snug">
                  {firstMarkdownParagraph(text, `${face.face_shape} face geometry needs grooming, collar lines, and eyewear that sharpen the frame without overpowering ${face.feature_type} features.`)}
                </p>
                <div className="rule my-5 md:my-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(face.beard_style_recommendations ?? []).slice(0, 2).map((item, index) => (
                    <div key={item} className="rounded-2xl p-3" style={{ background: 'rgba(244,239,229,0.08)', border: '1px solid rgba(244,239,229,0.14)' }}>
                      <DataLabel>{index === 0 ? 'Best grooming anchor' : 'Alternative'}</DataLabel>
                      <p className="text-[13px] leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {mode === 'grooming' && (
          <>
            <div className="visual-man-intro">
              <GoldPill>{face.grooming_focus === 'beard' ? 'Beard-led grooming' : 'Hair-led grooming'}</GoldPill>
              <p>{sentenceClamp(face.facial_hair_recommendations || face.beard_maintenance || firstMarkdownParagraph(text), 2, 220)}</p>
            </div>
            {(face.hairstyle_recommendations?.length ?? 0) >= 4 || ((hairstyleUrls?.length ?? 0) === 1 && !!hairstyleUrls?.[0])
              ? renderFaceGrid('hairstyle', hairstyleUrls, 'Hairstyle / scalp grooming options')
              : hasHairstyleImages && (
                <div className="mb-10">
                  <p className="dossier-label" style={{ fontSize: 11, marginBottom: 20 }}>Hairstyle options</p>
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {[1, 2].map(optionIndex => renderFaceImageSlot('hairstyle', hairstyleUrls?.[optionIndex - 1] ?? null, optionIndex))}
                  </div>
                </div>
              )}
            {(face.beard_style_recommendations?.length ?? 0) >= 4 || ((beardUrls?.length ?? 0) === 1 && !!beardUrls?.[0])
              ? renderFaceGrid('beard', beardUrls, 'Beard & facial hair options')
              : hasBeardImages && (
                <div className="mb-10">
                  <p className="dossier-label" style={{ fontSize: 11, marginBottom: 20 }}>Beard & facial hair options</p>
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {[1, 2].map(optionIndex => renderFaceImageSlot('beard', beardUrls?.[optionIndex - 1] ?? null, optionIndex))}
                  </div>
                </div>
              )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                ['Maintenance', face.beard_maintenance || 'Keep lines clean and repeatable.'],
                ['Morning', face.skincare_routine?.morning?.join(' · ') || 'Cleanser · moisturiser · sunscreen'],
                ['Evening', face.skincare_routine?.evening?.join(' · ') || 'Cleanser · moisturiser'],
              ].map(([label, value]) => (
                <div key={label} className="visual-card-light">
                  <DataLabel>{label}</DataLabel>
                  <p>{value}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {mode === 'eyewear' && (
          <>
            <div className="visual-man-intro">
              <GoldPill>{face.face_shape} face</GoldPill>
              <p>Use frames to sharpen the face architecture, balance feature scale, and keep the overall look polished without changing your clothing style.</p>
            </div>
            {(face.eyewear_shapes?.length ?? 0) >= 4 || ((eyewearUrls?.length ?? 0) === 1 && !!eyewearUrls?.[0])
              ? renderFaceGrid('eyewear', eyewearUrls, 'Eyewear options')
              : hasEyewearImages && (
                <div className="mb-10">
                  <p className="dossier-label" style={{ fontSize: 11, marginBottom: 20 }}>Eyewear options</p>
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {[1, 2].map(optionIndex => renderFaceImageSlot('eyewear', eyewearUrls?.[optionIndex - 1] ?? null, optionIndex))}
                  </div>
                </div>
              )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {face.eyewear_shapes.slice(0, 4).map((frame, index) => (
                <div key={`${frame}-${index}`} className="visual-card-light">
                  <DataLabel>{index < 2 ? `Optical ${index + 1}` : `Sunglasses ${index - 1}`}</DataLabel>
                  <p>{frame}</p>
                </div>
              ))}
            </div>
          </>
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
                  <p className="text-xl leading-tight" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
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
                        <p className="text-xl leading-snug" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
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

function BodySection({ cls }: { cls: ClassificationResult }) {
  const { body } = cls;

  // Pull short directive copy from the classification — fall back gracefully if absent.
  const fitNotes = [
    { kind: 'shoulder' as const, label: 'Shoulder line', note: body.silhouette_rules?.[0] ?? body.fit_directive },
    { kind: 'top' as const,      label: 'Top fit',       note: body.silhouette_rules?.[1] ?? body.fit_directive },
    { kind: 'trouser' as const,  label: 'Trouser break', note: body.silhouette_rules?.[2] ?? 'Slight break, tapered.' },
  ];

  return (
    <section className="iconik-page man-page ivory">
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
                    className="text-[14px] flex-shrink-0 mt-0.5"
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
              <p className="text-[14px] leading-relaxed" style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
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

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 03 — Chromatic Harmony Map
// ─────────────────────────────────────────────────────────────

// Circular swatch with name underneath in clean display type.
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
        className="text-[11px] text-center leading-tight max-w-[90px]"
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
    <section className="iconik-page man-page bone">
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
              <p className="mt-5 text-[12px] leading-relaxed" style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
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
          <p className="text-[14px] leading-relaxed" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
            {colour.pattern_guidance}
          </p>
          <p className="text-[14px] leading-relaxed mt-3" style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
            {colour.fabric_tone_guidance}
          </p>
        </div>
      </div>
    </section>
  );
}

function FitRulesPage({ cls, text }: { cls: ClassificationResult; text?: string }) {
  const { body } = cls;
  const always = body.silhouette_rules?.filter(Boolean).slice(0, 4) ?? [];
  const never = body.avoid_cuts?.filter(Boolean).slice(0, 4) ?? [];
  const extra = markdownBullets(text ?? '', 4).filter(item =>
    !always.some(rule => rule.toLowerCase() === item.toLowerCase()) &&
    !never.some(rule => rule.toLowerCase() === item.toLowerCase())
  );

  return (
    <section className="iconik-page man-page slate">
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Prescription</div>
        <div className="man-small-caps corner-title">Silhouette Rules</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">08</div>
      </div>
      <div className="man-page-inner">
        <h2>
          <span className="display">Fit rules.</span>
          <span className="display-it">No guesswork.</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-dark rounded-3xl p-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-5" style={{ color: '#F4EFE5' }}>
              Always build around
            </p>
            <div className="space-y-4">
              {always.map((rule, index) => (
                <div key={`${rule}-${index}`} className="flex items-start gap-3">
                  <span style={{ color: SAGE }}>✓</span>
                  <p className="text-[13px] leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-dark rounded-3xl p-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-5" style={{ color: '#F4EFE5' }}>
              Avoid immediately
            </p>
            <div className="space-y-4">
              {never.map((rule, index) => (
                <div key={`${rule}-${index}`} className="flex items-start gap-3">
                  <span style={{ color: OXBLOOD }}>✗</span>
                  <p className="text-[13px] leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ['Fit directive', body.fit_directive],
            ['Height equation', body.height_adjustment],
            ['Priority zone', `Highlight ${body.highlight_zone}; reduce focus on ${body.minimise_zone}.`],
            ...extra.map((item, index) => [`RTW check ${index + 1}`, item] as [string, string]),
          ].slice(0, 6).map(([label, value]) => (
            <div key={label} className="glass-dark rounded-2xl p-5">
              <DataLabel>{label}</DataLabel>
              <p className="text-[13px] leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FabricDirectionPage({ cls, text }: { cls: ClassificationResult; text?: string }) {
  const { colour, client } = cls;
  const fabricBullets = [
    colour.fabric_tone_guidance,
    colour.pattern_guidance,
    ...extractHeadingBlock(text ?? '', [/fabric/i, /texture/i, /weight/i], 4),
  ].filter(Boolean).slice(0, 6);
  const climate = /india|uae|dubai|mumbai|delhi|bangalore|hyderabad|chennai|kolkata/i.test(client.location_region)
    ? 'Warm-climate fabric priority'
    : 'Layerable fabric priority';

  return (
    <section className="iconik-page man-page ivory">
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Prescription</div>
        <div className="man-small-caps corner-title">Fabric & Texture</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">09</div>
      </div>
      <div className="man-page-inner">
        <h2>
          <span className="display">Fabric</span>
          <span className="display-it">direction.</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />
        <div className="visual-man-intro">
          <GoldPill>{climate}</GoldPill>
          <p>{sentenceClamp(colour.fabric_tone_guidance || colour.pattern_guidance, 2, 230)}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fabricBullets.map((item, index) => (
            <div key={`${item}-${index}`} className="visual-card-light">
              <DataLabel>{index === 0 ? 'Texture logic' : `Rule ${String(index + 1).padStart(2, '0')}`}</DataLabel>
              <p>{sentenceClamp(item, 1, 180)}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-3xl p-6 md:p-8" style={{ background: SHELL, border: `1px solid ${BORDER}` }}>
          <DataLabel>Colour temperature in fabric</DataLabel>
          <div className="flex flex-wrap gap-3 mt-4">
            {[...colour.neutral_base_colours, ...colour.accent_colours].slice(0, 5).map(item => (
              <span key={`${item.name}-${item.hex}`} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px]" style={{ background: '#fff', color: INK, border: `1px solid ${BORDER}` }}>
                <i className="w-3 h-3 rounded-full" style={{ background: item.hex }} />
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SnapshotSection({ text }: { text?: string }) {
  if (!text) return null;
  const intro = firstMarkdownParagraph(text);
  const priorities = extractHeadingBlock(text, [/top\s*3/i, /priorit/i], 3);
  return (
    <section className="iconik-page man-page ivory">
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
          <p className="display-it" style={{ fontSize: 'clamp(22px, 3vw, 34px)', lineHeight: 1.32, color: INK }}>
            {intro}
          </p>
          <div className="rule" style={{ margin: '28px 0' }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(priorities.length ? priorities : markdownBullets(text, 3)).slice(0, 3).map((item, index) => (
              <div key={`${item}-${index}`} className="visual-card-light">
                <DataLabel>Priority {String(index + 1).padStart(2, '0')}</DataLabel>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidenceImage({
  src,
  alt,
  fallback,
}: {
  src?: string | null;
  alt: string;
  fallback: string;
}) {
  return (
    <div className="v2-evidence-frame">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      ) : (
        <div className="v2-evidence-fallback">
          <AlertCircle size={20} />
          <p>{fallback}</p>
        </div>
      )}
    </div>
  );
}

function V2RuleCards({ dos, avoids }: { dos: string[]; avoids: string[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {dos.slice(0, 3).map((item, index) => (
        <div key={`do-${index}`} className="visual-card-light md:col-span-1">
          <DataLabel>Do {index + 1}</DataLabel>
          <p>{sentenceClamp(item, 1, 150)}</p>
        </div>
      ))}
      {avoids.slice(0, 2).map((item, index) => (
        <div key={`avoid-${index}`} className="visual-card-light md:col-span-1" style={{ borderColor: `${OXBLOOD}44` }}>
          <DataLabel>Avoid {index + 1}</DataLabel>
          <p>{sentenceClamp(item, 1, 150)}</p>
        </div>
      ))}
    </div>
  );
}

function V2DiagnosticSlide({
  title,
  italic,
  kicker,
  pageNumber,
  totalSlides,
  imageUrl,
  imageAlt,
  fallback,
  verdict,
  dos,
  avoids,
  variant = 'ivory',
}: {
  title: string;
  italic: string;
  kicker: string;
  pageNumber?: number;
  totalSlides: number;
  imageUrl?: string | null;
  imageAlt: string;
  fallback: string;
  verdict: string;
  dos: string[];
  avoids: string[];
  variant?: 'ivory' | 'bone' | 'slate';
}) {
  return (
    <section className={`iconik-page man-page ${variant}`} data-blueprint-page-number={pageNumber}>
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">{kicker}</div>
        <div className="man-small-caps corner-title">{title}</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">{String(pageNumber ?? 1).padStart(2, '0')} / {totalSlides}</div>
      </div>
      <div className="man-page-inner">
        <h2>
          <span className="display">{title}</span>
          <span className="display-it">{italic}</span>
        </h2>
        <div className="rule" style={{ marginBottom: 32 }} />
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-7 items-start">
          <EvidenceImage src={imageUrl} alt={imageAlt} fallback={fallback} />
          <div className={variant === 'slate' ? 'glass-dark rounded-3xl p-7' : 'rounded-3xl p-7'} style={variant === 'slate' ? undefined : { background: '#fff', border: `1px solid ${BORDER}` }}>
            <DataLabel>Verdict</DataLabel>
            <p className="display-it text-[26px] leading-snug" style={{ color: variant === 'slate' ? '#F4EFE5' : INK }}>
              {sentenceClamp(verdict, 1, 220)}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <V2RuleCards dos={dos} avoids={avoids} />
        </div>
      </div>
    </section>
  );
}

function V2FaceGridSlide({
  cls,
  kind,
  imageUrl,
  pageNumber,
  totalSlides,
}: {
  cls: ClassificationResult;
  kind: 'hairstyle' | 'beard' | 'eyewear';
  imageUrl?: string | null;
  pageNumber?: number;
  totalSlides: number;
}) {
  const options = kind === 'hairstyle'
    ? cls.face.hairstyle_recommendations ?? []
    : kind === 'beard'
      ? cls.face.beard_style_recommendations ?? []
      : cls.face.eyewear_shapes ?? [];
  const title = kind === 'hairstyle' ? 'Hairstyle' : kind === 'beard' ? 'Beard' : 'Eyewear';
  const italic = kind === 'eyewear' ? 'grid.' : 'direction.';
  const verdict = kind === 'hairstyle'
    ? `${cls.face.face_shape} face shape needs hair or scalp grooming that controls height and keeps the sides intentional.`
    : kind === 'beard'
      ? `${cls.face.facial_hair_presence?.replace(/_/g, ' ') || 'Facial hair'} should sharpen the lower face without looking accidental.`
      : `Frame width should relate to cheekbone width and keep ${cls.face.feature_type} features balanced.`;

  return (
    <section className="iconik-page man-page bone" data-blueprint-page-number={pageNumber}>
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Face</div>
        <div className="man-small-caps corner-title">{title} Grid</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">{String(pageNumber ?? 1).padStart(2, '0')} / {totalSlides}</div>
      </div>
      <div className="man-page-inner">
        <h2>
          <span className="display">{title}</span>
          <span className="display-it">{italic}</span>
        </h2>
        <div className="rule" style={{ marginBottom: 32 }} />
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-7">
          <EvidenceImage src={imageUrl} alt={`${title} recommendation grid`} fallback={`${title} grid pending. Retry image generation when Gemini capacity is available.`} />
          <div>
            <div className="rounded-3xl p-6 mb-4" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
              <DataLabel>Verdict</DataLabel>
              <p className="display-it text-[24px] leading-snug" style={{ color: INK }}>{verdict}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {options.slice(0, 4).map((option, index) => (
                <div key={`${option}-${index}`} className="visual-card-light">
                  <DataLabel>{kind === 'eyewear' ? (index < 2 ? `Optical ${index + 1}` : `Sunglasses ${index - 1}`) : `Option ${index + 1}`}</DataLabel>
                  <p>{option}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function V2SkinGroomingSlide({ cls, pageNumber, totalSlides }: { cls: ClassificationResult; pageNumber?: number; totalSlides: number }) {
  const morning = cls.face.skincare_routine?.morning ?? ['Cleanser', 'Moisturiser', 'Sunscreen'];
  const evening = cls.face.skincare_routine?.evening ?? ['Cleanser', 'Moisturiser'];
  return (
    <section className="iconik-page man-page ivory" data-blueprint-page-number={pageNumber}>
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Face</div>
        <div className="man-small-caps corner-title">Skin & Grooming System</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">{String(pageNumber ?? 1).padStart(2, '0')} / {totalSlides}</div>
      </div>
      <div className="man-page-inner">
        <h2><span className="display">Grooming</span><span className="display-it">system.</span></h2>
        <div className="rule" style={{ marginBottom: 32 }} />
        <div className="visual-man-intro">
          <GoldPill>{cls.face.grooming_focus === 'beard' ? 'Beard-led' : 'Hair-led'} routine</GoldPill>
          <p>{sentenceClamp(cls.face.beard_maintenance || cls.face.facial_hair_recommendations, 1, 220)}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="visual-card-light"><DataLabel>Daily AM</DataLabel><p>{morning.join(' · ')}</p></div>
          <div className="visual-card-light"><DataLabel>Daily PM</DataLabel><p>{evening.join(' · ')}</p></div>
          <div className="visual-card-light"><DataLabel>Beard / shave</DataLabel><p>{cls.face.skincare_routine?.shaving_or_beard_area || cls.face.beard_maintenance}</p></div>
          <div className="visual-card-light"><DataLabel>Adjustment</DataLabel><p>{cls.face.skincare_routine?.skin_adjustment || 'Keep the routine simple and consistent.'}</p></div>
        </div>
      </div>
    </section>
  );
}

function V2FrameTrainingSlide({ data, pageNumber, totalSlides }: { data: ReportData; pageNumber?: number; totalSlides: number }) {
  const training = data.diagnostics?.frameTrainingDirection;
  const focus = training?.focus ?? data.classification.body.silhouette_rules ?? [];
  return (
    <section className="iconik-page man-page slate" data-blueprint-page-number={pageNumber}>
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Frame</div>
        <div className="man-small-caps corner-title">Training Direction</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">{String(pageNumber ?? 1).padStart(2, '0')} / {totalSlides}</div>
      </div>
      <div className="man-page-inner">
        <h2><span className="display">Frame</span><span className="display-it">training.</span></h2>
        <div className="rule" style={{ marginBottom: 32 }} />
        <div className="glass-dark rounded-3xl p-8 mb-5">
          <DataLabel>{training?.title ?? '4-week silhouette direction'}</DataLabel>
          <p className="display-it text-[30px] leading-snug">{training?.weeks ?? 'Keep this non-medical, form-first, and silhouette-led.'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {focus.slice(0, 3).map((item, index) => (
            <div key={`${item}-${index}`} className="glass-dark rounded-2xl p-5">
              <DataLabel>Focus {index + 1}</DataLabel>
              <p className="text-[13px] leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeforeAfterComparison({
  beforeImage,
  afterImage,
  legacyImage,
}: {
  beforeImage?: string | null;
  afterImage?: string | null;
  legacyImage?: string | null;
}) {
  const [position, setPosition] = useState(50);

  if (!beforeImage || !afterImage) {
    return (
      <EvidenceImage
        src={legacyImage}
        alt="Before and after transformation"
        fallback="Before/after comparison pending. Retry image generation to create the interactive comparison."
      />
    );
  }

  return (
    <div className="before-after-comparison">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={afterImage} alt="After styling transformation" className="before-after-image" />
      <div className="before-after-reveal" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeImage} alt="" className="before-after-image" />
      </div>
      <div className="before-after-label before-after-label-before">Before</div>
      <div className="before-after-label before-after-label-after">After</div>
      <div className="before-after-divider" style={{ left: `${position}%` }} aria-hidden="true">
        <span>‹ ›</span>
      </div>
      <input
        className="before-after-range"
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={event => setPosition(Number(event.target.value))}
        aria-label="Reveal before or after transformation"
        aria-valuetext={`${position}% before image revealed`}
      />
    </div>
  );
}

function V2BeforeAfterSlide({ beforeImage, afterImage, legacyImage, pageNumber, totalSlides }: { beforeImage?: string | null; afterImage?: string | null; legacyImage?: string | null; pageNumber?: number; totalSlides: number }) {
  return (
    <section className="iconik-page man-page bone" data-blueprint-page-number={pageNumber}>
      <div className="grain" />
      <div className="corner-tl"><div className="man-mono corner-kicker">Deliverable</div><div className="man-small-caps corner-title">Before / After Transformation</div></div>
      <div className="corner-tr"><div className="man-mono corner-kicker">{String(pageNumber ?? 1).padStart(2, '0')} / {totalSlides}</div></div>
      <div className="man-page-inner">
        <h2><span className="display">Slide to see</span><span className="display-it">the transformation.</span></h2>
        <div className="rule" style={{ marginBottom: 32 }} />
        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-7 items-start">
          <BeforeAfterComparison beforeImage={beforeImage} afterImage={afterImage} legacyImage={legacyImage} />
          <div className="rounded-3xl p-7" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
            <DataLabel>Transformation benchmark</DataLabel>
            <p className="display-it text-[27px] leading-snug mb-6" style={{ color: INK }}>Your strongest outfit, grooming, and colour direction should read as one immediate transformation.</p>
            <p className="text-[13px] leading-relaxed" style={{ color: INK_SOFT }}>Drag the handle—or use the arrow keys when it is focused—to compare fit, polish, and visual impact.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function V2LinkedinSlide({ data, imageUrl, pageNumber, totalSlides }: { data: ReportData; imageUrl?: string | null; pageNumber?: number; totalSlides: number }) {
  const headline = data.classification.style_brief.primary_brief || data.classification.style_brief.key_aspiration || 'Polished professional presence';
  const location = data.classification.client.location_region || 'Your location';
  return (
    <section className="iconik-page man-page ivory" data-blueprint-page-number={pageNumber}>
      <div className="grain" />
      <div className="corner-tl"><div className="man-mono corner-kicker">Deliverable</div><div className="man-small-caps corner-title">LinkedIn Headshot</div></div>
      <div className="corner-tr"><div className="man-mono corner-kicker">{String(pageNumber ?? 1).padStart(2, '0')} / {totalSlides}</div></div>
      <div className="man-page-inner">
        <h2><span className="display">LinkedIn</span><span className="display-it">headshot.</span></h2>
        <div className="rule" style={{ marginBottom: 32 }} />
        <div className="linkedin-profile-mock">
          <div className="linkedin-cover"><span className="linkedin-in-badge">in</span></div>
          <div className="linkedin-profile-body">
            <div className="linkedin-avatar">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="LinkedIn headshot" />
              ) : <span>Photo</span>}
            </div>
            <div className="linkedin-actions"><span>Open to</span><span>Profile guide</span></div>
            <div className="linkedin-profile-copy">
              <DataLabel>Profile preview</DataLabel>
              <h3>Your professional profile</h3>
              <p className="linkedin-headline">{headline}</p>
              <p className="linkedin-location">{location} · Contact info</p>
              <div className="linkedin-about">
                <DataLabel>About your visual presence</DataLabel>
                <p>{data.deliverables?.linkedinHeadshotSpec}</p>
              </div>
              {imageUrl && <a className="v2-download" href={imageUrl} download>Download headshot</a>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function V2DatingSlide({ data, imageUrls, avatarUrl, pageNumber, totalSlides }: { data: ReportData; imageUrls?: (string | null)[]; avatarUrl?: string | null; pageNumber?: number; totalSlides: number }) {
  const shots = data.deliverables?.datingProfileShots ?? [];
  return (
    <section className="iconik-page man-page bone" data-blueprint-page-number={pageNumber}>
      <div className="grain" />
      <div className="corner-tl"><div className="man-mono corner-kicker">Deliverable</div><div className="man-small-caps corner-title">Social Media Inspiration</div></div>
      <div className="corner-tr"><div className="man-mono corner-kicker">{String(pageNumber ?? 1).padStart(2, '0')} / {totalSlides}</div></div>
      <div className="man-page-inner">
        <h2><span className="display">Social media</span><span className="display-it">inspiration.</span></h2>
        <div className="rule" style={{ marginBottom: 32 }} />
        <div className="instagram-profile-mock">
          <div className="instagram-topbar"><strong>@your.style.blueprint</strong><span>•••</span></div>
          <div className="instagram-profile-header">
            <div className="instagram-avatar">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Your style profile avatar" />
              ) : <span>ICONIK</span>}
            </div>
            <div className="instagram-stat"><strong>3</strong><span>posts</span></div>
            <div className="instagram-private-note"><strong>Private inspiration</strong><span>A visual direction for your own feed</span></div>
          </div>
          <div className="instagram-bio"><strong>Your style blueprint</strong><span>Polished lifestyle frames built around your strongest outfits.</span></div>
          <div className="instagram-tabs"><span>▦</span><span>Style inspiration grid</span></div>
          <div className="instagram-grid">
            {[0, 1, 2].map(index => imageUrls?.[index] ? (
              <div className="instagram-tile" key={index}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrls[index] ?? ''} alt={shots[index]?.title ?? `Social media inspiration ${index + 1}`} />
              </div>
            ) : (
              <div className="instagram-tile instagram-tile-empty" key={index}>Post {index + 1}<span>pending</span></div>
            ))}
          </div>
          <div className="instagram-downloads">
            {imageUrls?.map((url, index) => url && <a className="v2-download" key={`${url}-${index}`} href={url} download>Download post {index + 1}</a>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function V2ShoppingIdentitySlide({ data, pageNumber, totalSlides }: { data: ReportData; pageNumber?: number; totalSlides: number }) {
  const shopping = data.sections.s5_shopping ?? data.sections.s5_rules ?? '';
  const identity = extractIdentityExcerpt(data.sections.s6_identity);
  return (
    <section className="iconik-page man-page slate" data-blueprint-page-number={pageNumber}>
      <div className="grain" />
      <div className="corner-tl"><div className="man-mono corner-kicker">Close</div><div className="man-small-caps corner-title">Shopping + Identity</div></div>
      <div className="corner-tr"><div className="man-mono corner-kicker">{String(pageNumber ?? 1).padStart(2, '0')} / {totalSlides}</div></div>
      <div className="man-page-inner">
        <h2><span className="display">Buy less.</span><span className="display-it">Choose better.</span></h2>
        <div className="rule" style={{ marginBottom: 32 }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-dark rounded-3xl p-7">
            <DataLabel>Shopping filter</DataLabel>
            <RenderMarkdown text={shopping} />
          </div>
          <div className="glass-dark rounded-3xl p-7">
            <DataLabel>Identity close</DataLabel>
            <p className="display-it text-[28px] leading-snug">{identity}</p>
          </div>
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
  enrichedOutfitText?: string;
  imageStatus: 'generated' | 'failed';
  error?: string;
}

interface OutfitSaveTextResult {
  updatedS4Outfits: string;
  enrichedOutfitText?: string;
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

interface OutfitSwapPreview {
  number: number;
  label: string;
  context: string;
  top: string;
  bottom: string;
  layer: string;
  footwear: string;
  accessories: string;
  fitNote: string;
  colourLogic: string;
  whyItWorks: string;
  shoppingTranslation: string;
  acceptableSubstitutes: string;
  doNotBuy: string;
}

interface OutfitSwapDraftResult {
  candidateBlock: string;
  parsedPreview: OutfitSwapPreview | null;
  qaIssues: ManReportQaIssue[];
  blockingIssues: ManReportQaIssue[];
  baseUpdatedAt: string;
  currentOutfitHash: string;
}

// ─────────────────────────────────────────────────────────────
// Shopping links (per garment slot)
// ─────────────────────────────────────────────────────────────

export interface ShoppingSelectPayload {
  action: 'pick' | 'manual' | 'none';
  pickedUrls?: string[];
  manualUrl?: string;
}

const SHOPPING_SLOT_BY_LABEL: Record<string, ManShoppingSlotName> = {
  Top: 'top',
  Bottom: 'bottom',
  Layer: 'layer',
  Footwear: 'footwear',
};

function formatLinkPrice(link: ManProductLink): string {
  if (typeof link.price !== 'number') return '';
  const symbol = !link.currency || link.currency === 'INR' ? '₹' : `${link.currency} `;
  return `${symbol}${Math.round(link.price).toLocaleString('en-IN')}`;
}

function ShoppingLinkChip({ link }: { link: ManProductLink }) {
  const price = formatLinkPrice(link);
  return (
    <a
      className="shop-chip"
      href={link.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title={link.title}
    >
      <span className="shop-chip-merchant">{link.merchant}</span>
      {price && <span className="shop-chip-price">{price}</span>}
    </a>
  );
}

function ShoppingLinksBlock({
  outfitNumber,
  slotName,
  descriptor,
  slot,
  adminMode,
  onSelect,
}: {
  outfitNumber: number;
  slotName: ManShoppingSlotName;
  descriptor: string;
  slot: ManShoppingSlot | undefined;
  adminMode?: boolean;
  onSelect?: (outfitNumber: number, slot: ManShoppingSlotName, payload: ShoppingSelectPayload) => Promise<boolean>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedUrls, setPickedUrls] = useState<string[]>([]);
  const [manualUrl, setManualUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentHash = useMemo(() => descriptorHash(normalizeDescriptor(descriptor)), [descriptor]);
  const isCurrent = !!slot && slot.descriptorHash === currentHash && slot.status !== 'stale';

  // Client view: only ever show links the stylist-approved flow produced for
  // the garment text as it stands now — a stale slot renders nothing.
  if (!adminMode) {
    if (!slot || !isCurrent || slot.status === 'skipped') return null;
    if (slot.status === 'no_results') {
      return (
        <div className="shop-links">
          <a
            className="shop-chip shop-chip-fallback"
            href={buildFallbackSearchUrl(descriptor)}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            Search similar →
          </a>
        </div>
      );
    }
    if (slot.selected.length === 0) return null;
    return (
      <div className="shop-links">
        {slot.selected.map(link => <ShoppingLinkChip key={link.url} link={link} />)}
      </div>
    );
  }

  const runAction = async (payload: ShoppingSelectPayload) => {
    if (!onSelect || busy) return;
    setBusy(true);
    setActionError(null);
    const ok = await onSelect(outfitNumber, slotName, payload);
    setBusy(false);
    if (!ok) {
      setActionError('Could not save the link selection. Try again.');
      return;
    }
    setPickerOpen(false);
    setManualUrl('');
  };

  const statusTone =
    !slot ? { label: 'no links yet', color: INK_SOFT }
    : !isCurrent || slot.status === 'stale' ? { label: 'stale — re-approve outfits to refetch', color: '#B07A2A' }
    : slot.status === 'low_confidence' ? { label: 'low confidence — review picks', color: '#B07A2A' }
    : slot.status === 'no_results' ? { label: 'no results', color: INK_SOFT }
    : slot.status === 'skipped' ? { label: 'no link (stylist choice)', color: INK_SOFT }
    : slot.status === 'manual' ? { label: 'manual link', color: SAGE }
    : { label: 'links ready', color: SAGE };

  const openPicker = () => {
    if (!slot) return;
    setPickedUrls(slot.selected.map(link => link.url));
    setPickerOpen(open => !open);
    setActionError(null);
  };

  const togglePicked = (url: string) => {
    setPickedUrls(previous => previous.includes(url)
      ? previous.filter(item => item !== url)
      : previous.length >= MAN_SHOPPING_MAX_SELECTED ? previous : [...previous, url]);
  };

  return (
    <div className="shop-links shop-links-admin">
      <div className="shop-status">
        <span className="shop-status-dot" style={{ background: statusTone.color }} />
        <span className="mono shop-status-label" style={{ color: statusTone.color }}>{statusTone.label}</span>
      </div>

      {slot && slot.selected.length > 0 && (
        <div className="shop-selected">
          {slot.selected.map(link => <ShoppingLinkChip key={link.url} link={link} />)}
        </div>
      )}

      <div className="shop-actions">
        {slot && slot.candidates.length > 0 && (
          <button type="button" className="shop-action-btn" onClick={openPicker} disabled={busy}>
            {pickerOpen ? 'Close' : `Choose (${slot.candidates.length})`}
          </button>
        )}
        {slot && slot.status !== 'skipped' && (
          <button type="button" className="shop-action-btn" onClick={() => void runAction({ action: 'none' })} disabled={busy}>
            No link
          </button>
        )}
        {slot && (
          <a
            className="shop-action-btn shop-action-link"
            href={buildFallbackSearchUrl(descriptor)}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            Search ↗
          </a>
        )}
      </div>

      {pickerOpen && slot && (
        <div className="shop-picker">
          {slot.candidates.map(candidate => {
            const picked = pickedUrls.includes(candidate.url);
            const price = formatLinkPrice(candidate);
            return (
              <button
                key={candidate.url}
                type="button"
                className={`shop-candidate${picked ? ' picked' : ''}`}
                onClick={() => togglePicked(candidate.url)}
              >
                <span className="shop-candidate-check">{picked ? '✓' : ''}</span>
                <span className="shop-candidate-title">{candidate.title}</span>
                <span className="shop-candidate-meta">
                  {candidate.merchant}{price ? ` · ${price}` : ''}
                  {typeof candidate.confidence === 'number' ? ` · ${Math.round(candidate.confidence * 100)}%` : ''}
                </span>
              </button>
            );
          })}
          <div className="shop-picker-footer">
            <button
              type="button"
              className="shop-action-btn"
              onClick={() => void runAction({ action: 'pick', pickedUrls })}
              disabled={busy || pickedUrls.length === 0}
            >
              {busy ? 'Saving…' : `Save ${pickedUrls.length} link${pickedUrls.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      )}

      {slot && (
        <div className="shop-manual">
          <input
            type="url"
            className="shop-manual-input"
            placeholder="Paste product URL (https://…)"
            value={manualUrl}
            onChange={event => setManualUrl(event.target.value)}
            disabled={busy}
          />
          <button
            type="button"
            className="shop-action-btn"
            onClick={() => void runAction({ action: 'manual', manualUrl })}
            disabled={busy || !manualUrl.trim()}
          >
            Add
          </button>
        </div>
      )}

      {actionError && <p className="shop-error">{actionError}</p>}
    </div>
  );
}

interface OutfitSwapApplyResult {
  imageUrl: string | null;
  updatedS4Outfits: string;
  qa?: ReportData['qa'];
}

function OutfitsSection({
  cls, text, outfitImageUrls, adminMode, onRegenerateOutfit, onSaveOutfitText, onDraftOutfitSwap, onApplyOutfitSwap, onCopyImagePrompt, onUploadManualImage, qaPassedOutfits, focusPageNumber, slideMeta, shopping, onSelectShoppingLink,
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
  shopping?: ManShoppingState | null;
  onSelectShoppingLink?: (outfitNumber: number, slot: ManShoppingSlotName, payload: ShoppingSelectPayload) => Promise<boolean>;
}) {
  const [editingTarget, setEditingTarget] = useState<{ number: number; identityKey: string } | null>(null);
  const [editText, setEditText]           = useState('');
  const [editError, setEditError]         = useState<string | null>(null);
  const [sectionNotice, setSectionNotice] = useState<string | null>(null);
  const [regenerating, setRegenerating]   = useState(false);
  const [savingText, setSavingText]       = useState(false);
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>({});
  const [brokenOutfitImages, setBrokenOutfitImages] = useState<Record<string, boolean>>({});
  const [swapNumber, setSwapNumber] = useState<number | null>(null);
  const [swapIdentityKey, setSwapIdentityKey] = useState<string | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [swapNotes, setSwapNotes] = useState('');
  const [swapInspirationText, setSwapInspirationText] = useState('');
  const [swapImageFile, setSwapImageFile] = useState<File | null>(null);
  const [swapImagePreview, setSwapImagePreview] = useState<string | null>(null);
  const [swapDraft, setSwapDraft] = useState<OutfitSwapDraftResult | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [draftingSwap, setDraftingSwap] = useState(false);
  const [applyingSwap, setApplyingSwap] = useState(false);
  const isOutfitOperationBusy = regenerating || savingText || draftingSwap || applyingSwap;

  const closeSwap = () => {
    if (isOutfitOperationBusy) return;
    setSwapNumber(null);
    setSwapIdentityKey(null);
    setSwapReason('');
    setSwapNotes('');
    setSwapInspirationText('');
    setSwapImageFile(null);
    setSwapImagePreview(null);
    setSwapDraft(null);
    setSwapError(null);
  };

  const startSwap = (outfit: ParsedOutfit) => {
    if (isOutfitOperationBusy) return;
    setEditingTarget(null);
    setEditText('');
    setEditError(null);
    setSwapNumber(outfit.number);
    setSwapIdentityKey(outfit.identityKey);
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
        if (result.imageUrl && swapIdentityKey) next[swapIdentityKey] = result.imageUrl;
        return next;
      });
      setSwapNumber(null);
      setSwapIdentityKey(null);
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

  const startEdit = (outfit: ParsedOutfit) => {
    if (isOutfitOperationBusy) return;
    const outfitBlock = outfit.block?.trim();
    if (!outfitBlock) {
      setEditError(`Could not load Outfit ${outfit.number} text. Open the full Section 4 editor to repair the outfit headers.`);
      setEditingTarget(null);
      setEditText('');
      return;
    }
    setEditError(null);
    setSwapError(null);
    setSwapDraft(null);
    setSwapNumber(null);
    setSwapIdentityKey(null);
    setSectionNotice(null);
    setEditingTarget({ number: outfit.number, identityKey: outfit.identityKey });
    setEditText(outfitBlock);
  };
  const cancelEdit = (force = false) => {
    if (isOutfitOperationBusy && !force) return;
    setEditingTarget(null);
    setEditText('');
    setEditError(null);
  };

  const handleRegenerate = async () => {
    if (!editingTarget || !onRegenerateOutfit) return;
    if (!editText.trim()) {
      setEditError('Outfit text cannot be empty.');
      return;
    }
    setRegenerating(true);
    setEditError(null);
    setSectionNotice(null);
    try {
      const result = await onRegenerateOutfit(editingTarget.number, editText);
      if (!result) {
        setEditError('Could not save outfit edit. Please try again.');
        return;
      }
      setImageOverrides(prev => {
        const next = { ...prev };
        if (result.imageUrl) next[editingTarget.identityKey] = result.imageUrl;
        else delete next[editingTarget.identityKey];
        return next;
      });
      if (result.imageStatus === 'failed') {
        setSectionNotice(`Outfit ${editingTarget.number} text was saved, but image regeneration failed. Use Retry on the image placeholder when Gemini is available.`);
      }
      cancelEdit(true);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveTextOnly = async () => {
    if (!editingTarget || !onSaveOutfitText) return;
    if (!editText.trim()) {
      setEditError('Outfit text cannot be empty.');
      return;
    }
    setSavingText(true);
    setEditError(null);
    setSectionNotice(null);
    try {
      const result = await onSaveOutfitText(editingTarget.number, editText);
      if (!result) {
        setEditError('Could not save outfit text. Please try again.');
        return;
      }
      setSectionNotice(`Outfit ${editingTarget.number} text saved. The existing image was not changed.`);
      cancelEdit(true);
    } finally {
      setSavingText(false);
    }
  };

  const categories = useMemo(() => parseOutfitCategories(text), [text]);
  const allOutfits = useMemo(() => categories.flatMap(category => category.outfits), [categories]);
  const duplicateOutfitNumbers = useMemo(() => {
    const seen = new Set<number>();
    const duplicates = new Set<number>();
    for (const outfit of allOutfits) {
      if (seen.has(outfit.number)) duplicates.add(outfit.number);
      seen.add(outfit.number);
    }
    return duplicates;
  }, [allOutfits]);
  const split      = cls.outfit_split;
  const shouldShowSlide = (slideType: ManReportSlideMeta['slideType'], outfit?: ParsedOutfit) => {
    const slide = slideMeta.find(item => item.slideType === slideType && (!outfit || item.outfitIdentityKey === outfit.identityKey));
    if (!slide) return false;
    return !focusPageNumber || slide.pageNumber === focusPageNumber;
  };
  const slideNumber = (slideType: ManReportSlideMeta['slideType'], outfit?: ParsedOutfit) => {
    return slideMeta.find(item => item.slideType === slideType && (!outfit || item.outfitIdentityKey === outfit.identityKey))?.pageNumber;
  };

  // Fallback: if parsing failed, render raw markdown
  if (categories.length === 0 || categories.every(c => c.outfits.length === 0)) {
    if (!shouldShowSlide('outfit')) return null;
    return (
      <section className="iconik-page man-page bone" data-blueprint-page-number={slideNumber('outfit') ?? undefined}>
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

  const editingOutfit = editingTarget
    ? allOutfits.find(outfit => outfit.identityKey === editingTarget.identityKey) ?? null
    : null;

  // Render an individual outfit row — image left, details right.
  const renderOutfitCard = (cat: OutfitCategory, outfit: ParsedOutfit) => {
    const sourceOutfitImg = imageOverrides[outfit.identityKey] ?? outfitImageUrls?.[outfit.number - 1] ?? null;
    const outfitImg   = brokenOutfitImages[outfit.identityKey] ? null : sourceOutfitImg;
    const isEditing   = editingTarget?.identityKey === outfit.identityKey;
    const isRegenning = regenerating && isEditing;
    const hasDuplicateNumber = duplicateOutfitNumbers.has(outfit.number);
    const canUseNumberIndexedActions = !hasDuplicateNumber;
    const canRequestEdit = adminMode && !!onRegenerateOutfit;
    const canEdit     = canRequestEdit && canUseNumberIndexedActions && !!outfit.block?.trim();
    const canSwap     = adminMode && !!onDraftOutfitSwap && !!onApplyOutfitSwap && canUseNumberIndexedActions;
    const canManualRecover = adminMode && (!!onCopyImagePrompt || !!onUploadManualImage) && canUseNumberIndexedActions;
    const editDisabledReason = !canRequestEdit
      ? ''
      : hasDuplicateNumber
        ? `Outfit ${outfit.number} has a duplicate number. Renumber Section 4 before using per-outfit advanced edit.`
        : !outfit.block?.trim()
          ? `Could not load Outfit ${outfit.number} text. Use the full Section 4 editor to repair this report.`
          : isOutfitOperationBusy
            ? 'Another outfit operation is currently running.'
            : '';
    const prioritiseImage = outfit.number <= 2;
    const isVerified  = qaPassedOutfits?.has(outfit.number) ?? false;
    const showStylistField = (value: string) => value && !hasPlaceholderOutfitValue(value);
    const palette = [
      ...(cls.colour.primary_palette ?? []),
      ...(cls.colour.neutral_base_colours ?? []),
      ...(cls.colour.accent_colours ?? []),
    ].slice(0, 5);
    const formulaItems = [
      { label: 'Top',         value: outfit.top },
      { label: 'Bottom',      value: outfit.bottom },
      { label: 'Layer',       value: outfit.layer },
      { label: 'Footwear',    value: outfit.footwear },
      { label: 'Accessories', value: outfit.accessories },
    ].filter(item => item.value && item.value !== '—');

    return (
      <div
        key={outfit.identityKey}
        className="man-outfit-layout"
      >
        <div className="outfit-hero">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.16 }}
              className="outfit-copy"
            >
              <div className="display-it outfit-no">No. {String(outfit.number).padStart(2, '0')}</div>
              <h3 className="display man-outfit-title">
                {outfit.label}
              </h3>
              <div className="outfit-quote">
                {showStylistField(outfit.whyItWorks) && (
                  <span>&ldquo;{outfit.whyItWorks}&rdquo;</span>
                )}
              </div>
              <div className="rule" />
              <div className="outfit-meta">
                <div className="mono faded">Occasion</div>
                <p>{cat.name}</p>
                {palette.length > 0 && (
                  <>
                    <div className="mono faded">Palette</div>
                    <div>
                      {palette.map((colour, index) => (
                        <span
                          key={`${colour.name}-${colour.hex}-${index}`}
                          className="swatch-dot"
                          title={colour.name}
                          style={{ background: colour.hex }}
                        />
                      ))}
                    </div>
                  </>
                )}
                {showStylistField(outfit.whyItWorks) && (
                  <>
                    <div className="mono faded">Logic</div>
                    <p>{outfit.whyItWorks}</p>
                  </>
                )}
              </div>
              {(canSwap || canRequestEdit) && (
                <div className="mt-7 flex flex-wrap items-center gap-2">
                  {canSwap && (
                    <motion.button
                      onClick={() => startSwap(outfit)}
                      disabled={isOutfitOperationBusy}
                      className="px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                      style={{ background: ACCENT, color: '#fff' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={SPRING}
                    >
                      Reject / Swap
                    </motion.button>
                  )}
                  {canRequestEdit && (
                    <button
                      onClick={() => startEdit(outfit)}
                      disabled={isOutfitOperationBusy || !canEdit}
                      className="px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                      style={{ background: SHELL, color: INK_SOFT, border: `1px solid ${BORDER}` }}
                      title={editDisabledReason || 'Advanced edit'}
                    >
                      Advanced edit
                    </button>
                  )}
                  {canRequestEdit && editDisabledReason && !isOutfitOperationBusy && (
                    <p className="basis-full text-[11px] leading-relaxed" style={{ color: OXBLOOD }}>
                      {editDisabledReason}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="outfit-art flatlay-frame">
            <div className="grain" />
            <div className="mono figure-label">Composition - {String(outfit.number).padStart(2, '0')}</div>
            {outfitImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={outfitImg}
                alt={`Outfit ${outfit.number} — ${outfit.label}`}
                loading={prioritiseImage ? 'eager' : 'lazy'}
                fetchPriority={prioritiseImage ? 'high' : 'auto'}
                decoding="async"
                className="flatlay-media-image"
                style={{ opacity: 0, transition: 'opacity 0.5s ease' }}
                onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                onError={() => setBrokenOutfitImages(prev => ({ ...prev, [outfit.identityKey]: true }))}
              />
            ) : canManualRecover ? (
              <ManualImageActions
                target={{ imageType: 'outfit', outfitNumber: outfit.number }}
                title="Image failed"
                description={sourceOutfitImg ? 'Image could not load' : 'Generation did not complete'}
                onCopyImagePrompt={onCopyImagePrompt}
                onUploadManualImage={onUploadManualImage}
                onUploaded={imageUrl => {
                  setBrokenOutfitImages(prev => ({ ...prev, [outfit.identityKey]: false }));
                  setImageOverrides(prev => ({ ...prev, [outfit.identityKey]: imageUrl }));
                }}
              />
            ) : (
              <div className="outfit-fallback-panel">
                <p className="text-[96px] leading-none select-none" style={{ fontFamily: SERIF, color: ACCENT + '22', fontWeight: 300 }}>
                  {String(outfit.number).padStart(2, '0')}
                </p>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-px" style={{ background: ACCENT + '55' }} />
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: ACCENT_INK }}>
                    {cat.name}
                  </p>
                  <p className="text-[12px] text-center px-6 leading-relaxed" style={{ fontFamily: SERIF, color: INK_SOFT }}>
                    {outfit.label}
                  </p>
                </div>
              </div>
            )}

            {isVerified && outfitImg && (
              <span
                className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.92)', color: SAGE, fontSize: 10, fontWeight: 500, letterSpacing: '0.04em' }}
                title="Stylist QA passed — no errors flagged"
              >
                <span style={{ fontSize: 11, lineHeight: 1 }}>✓</span> Stylist verified
              </span>
            )}

            {canRequestEdit && (
              <motion.button
                onClick={() => isEditing ? cancelEdit() : startEdit(outfit)}
                disabled={isOutfitOperationBusy || !canEdit}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(27,24,21,0.7)', color: '#fff', backdropFilter: 'blur(6px)' }}
                title={isEditing ? 'Cancel edit' : editDisabledReason || 'Advanced edit'}
                whileHover={!isOutfitOperationBusy && canEdit ? { scale: 1.1 } : undefined}
                whileTap={!isOutfitOperationBusy && canEdit ? { scale: 0.9 } : undefined}
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
        </div>

        <div className="rule formula-rule" />
        <div>
          <div className="mono faded formula-label">The Formula - {formulaItems.length} pieces</div>
          <div className="formula-grid man-formula-grid">
            {formulaItems.map(({ label, value }, index) => {
              const shoppingSlotName = SHOPPING_SLOT_BY_LABEL[label];
              const shoppingSlot = shoppingSlotName && shopping
                ? shopping.slots?.[buildShoppingSlotKey(outfit.number, shoppingSlotName)]
                : undefined;
              return (
                <div key={label} className="formula-card">
                  <span className="swatch-dot" style={{ background: palette[index % Math.max(palette.length, 1)]?.hex ?? ACCENT }} />
                  <span className="mono dossier-label">
                    {String(index + 1).padStart(2, '0')} - {label}
                  </span>
                  <h4 className="display">{value}</h4>
                  {shoppingSlotName && shopping && !hasDuplicateNumber && (
                    <ShoppingLinksBlock
                      outfitNumber={outfit.number}
                      slotName={shoppingSlotName}
                      descriptor={value}
                      slot={shoppingSlot}
                      adminMode={adminMode}
                      onSelect={onSelectShoppingLink}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {!adminMode && shopping && formulaItems.some(({ label, value }) => {
            const slotName = SHOPPING_SLOT_BY_LABEL[label];
            const slot = slotName ? shopping.slots?.[buildShoppingSlotKey(outfit.number, slotName)] : undefined;
            return !!slot && slot.descriptorHash === descriptorHash(normalizeDescriptor(value)) && slot.status !== 'stale' && slot.selected.length > 0;
          }) && (
            <p className="mono faded shop-disclaimer">
              Shop links are curated matches from Indian retailers. Prices and availability may change.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {shouldShowSlide('outfit_system') && (
        <section className="iconik-page man-page bone" data-blueprint-page-number={slideNumber('outfit_system') ?? undefined}>
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
            {adminMode && duplicateOutfitNumbers.size > 0 && (
              <div
                className="flex items-start gap-2 rounded-2xl px-4 py-3"
                style={{
                  background: '#fff7ed',
                  border: `1px solid ${ACCENT}55`,
                  color: ACCENT_INK,
                }}
              >
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p className="text-[12px] leading-relaxed">
                  Duplicate outfit number{duplicateOutfitNumbers.size > 1 ? 's' : ''} detected: {[...duplicateOutfitNumbers].join(', ')}. Per-outfit image upload, regenerate, and swap actions are disabled for those cards until Section 4 is renumbered and saved.
                </p>
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
                    <h3 className="text-3xl leading-[1.05]" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
                      {cat.name}
                    </h3>
                    {cat.intro && (
                      <p className="mt-3 text-[13px] leading-relaxed" style={{ fontFamily: SERIF, color: INK_SOFT, fontWeight: 350 }}>
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

      {categories.flatMap(cat => cat.outfits.map(outfit => shouldShowSlide('outfit', outfit) ? (
        <section key={outfit.identityKey} className="iconik-page man-page bone man-outfit-slide" data-blueprint-page-number={slideNumber('outfit', outfit) ?? undefined}>
          <div className="grain" />
          <div className="corner-tl">
            <div className="man-mono corner-kicker">Act III - Application</div>
            <div className="man-small-caps corner-title">{cat.name}</div>
          </div>
          <div className="corner-tr">
            <div className="man-mono corner-kicker">{String(slideNumber('outfit', outfit) ?? 1).padStart(2, '0')} / {slideMeta.length}</div>
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
                  <p className="text-xl leading-tight" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
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
                        <p className="text-2xl leading-tight" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
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
                        ['Occasion', swapDraft.parsedPreview.whyItWorks],
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
        {editingTarget && editingOutfit && (
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
                    Edit outfit {editingTarget.number}
                  </p>
                  <p className="text-xl leading-tight" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
                    {editingOutfit.label}
                  </p>
                </div>
                <button
                  onClick={() => cancelEdit()}
                  disabled={isOutfitOperationBusy}
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
                  disabled={isOutfitOperationBusy}
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
                    disabled={isOutfitOperationBusy}
                    className="px-4 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: '#fff', color: INK_SOFT, border: `1px solid ${BORDER}` }}
                  >
                    Cancel
                  </button>
                  {onSaveOutfitText && (
                    <motion.button
                      onClick={handleSaveTextOnly}
                      disabled={isOutfitOperationBusy || !editText.trim()}
                      className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                      style={{ background: SHELL, color: INK, border: `1px solid ${BORDER}` }}
                      whileHover={!isOutfitOperationBusy ? { scale: 1.02 } : undefined}
                      whileTap={!isOutfitOperationBusy ? { scale: 0.98 } : undefined}
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
                    disabled={isOutfitOperationBusy || !editText.trim()}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-medium disabled:opacity-40"
                    style={{ background: ACCENT, color: '#fff' }}
                    whileHover={!isOutfitOperationBusy ? { scale: 1.02 } : undefined}
                    whileTap={!isOutfitOperationBusy ? { scale: 0.98 } : undefined}
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
    <section className="iconik-page man-page slate">
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
                        className="text-lg leading-snug mb-4"
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
                  <p className="text-xl leading-tight" style={{ fontFamily: SERIF, color: INK, fontWeight: 350 }}>
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
    return <TextReportSection number="Filter" label="Shopping Filter" text={text} background={SHELL} />;
  }

  return (
    <section className="iconik-page man-page ivory">
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
            <h4 className="text-2xl leading-tight mb-5"
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
            <h4 className="text-2xl leading-tight mb-5"
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
            <p className="text-2xl md:text-3xl leading-snug max-w-3xl mx-auto"
              style={{ fontFamily: SERIF, fontWeight: 350 }}>
              &ldquo;{parsed.powerMove}&rdquo;
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ShoppingAuditSection({ text }: { text?: string }) {
  if (!text) return null;
  const buyFirst = extractHeadingBlock(text, [/buy\s*first/i], 4);
  const upgradeNext = extractHeadingBlock(text, [/upgrade\s*next/i], 4);
  const skip = extractHeadingBlock(text, [/skip\s*for\s*now/i], 4);
  const never = extractHeadingBlock(text, [/never\s*buy/i], 4);
  const groups = [
    { label: 'Buy first', items: buyFirst, tone: ACCENT_INK },
    { label: 'Upgrade next', items: upgradeNext, tone: SAGE },
    { label: 'Skip for now', items: skip, tone: INK_SOFT },
    { label: 'Never buy', items: never, tone: OXBLOOD },
  ].filter(group => group.items.length > 0);

  if (groups.length === 0) {
    return <StyleRulesSection text={text} />;
  }

  return (
    <section className="iconik-page man-page bone">
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Closing</div>
        <div className="man-small-caps corner-title">Shopping Filter</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">Audit</div>
      </div>
      <div className="man-page-inner">
        <h2>
          <span className="display">Shopping</span>
          <span className="display-it">filter.</span>
        </h2>
        <div className="rule" style={{ marginBottom: 40 }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => (
            <div key={group.label} className="rounded-3xl p-6" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-5" style={{ color: group.tone }}>
                {group.label}
              </p>
              <div className="space-y-3">
                {group.items.slice(0, 4).map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-start gap-3">
                    <span className="mono text-[11px] mt-0.5" style={{ color: group.tone }}>{String(index + 1).padStart(2, '0')}</span>
                    <p className="text-[13px] leading-relaxed" style={{ color: INK }}>{sentenceClamp(item, 1, 180)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
    <section className={`iconik-page man-page ${variant}`}>
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
    <section className="iconik-page man-page slate">
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
  shopping?: ManShoppingState | null;
  onSelectShoppingLink?: (outfitNumber: number, slot: ManShoppingSlotName, payload: ShoppingSelectPayload) => Promise<boolean>;
}

function DeferredSection({
  children,
  label,
  estimatedHeight,
  background,
  motionMode,
  defer,
  pageNumber,
}: {
  children: React.ReactNode;
  label: string;
  estimatedHeight: number;
  background: string;
  motionMode: 'reduced' | 'standard';
  defer: boolean;
  pageNumber?: number;
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
        className="iconik-page-frame"
        data-blueprint-page-number={pageNumber}
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
    <div ref={elementRef} className="iconik-page-frame" data-blueprint-page-number={pageNumber}>
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

// Stylist-style summary spread for the men blueprint overview.
function BlueprintSummary({ cls, totalSlides }: { cls: ClassificationResult; totalSlides: number }) {
  const heroColours = cls.colour.primary_palette.slice(0, 5);
  const cards: Array<{ label: string; title: string; sub: string; body: string }> = [
    {
      label: '01 - BUILD',
      title: cls.body.silhouette_type,
      sub: cls.body.fit_directive || 'fit architecture',
      body: cls.body.highlight_zone
        ? `Build the silhouette around ${cls.body.highlight_zone.toLowerCase()} while controlling ${cls.body.minimise_zone || 'visual imbalance'}.`
        : 'The report calibrates shoulder line, torso balance, trouser break, and vertical proportion.',
    },
    {
      label: '02 - FACE',
      title: cls.face.face_shape,
      sub: cls.face.feature_type || 'face architecture',
      body: [
        cls.face.hairstyle_recommendations?.[0],
        cls.face.beard_style_recommendations?.[0] ?? cls.face.facial_hair_recommendations,
        cls.face.eyewear_shapes?.[0],
      ].filter(Boolean).join(' · ') || 'Hair, beard, eyewear, and neckline choices are tuned to the face architecture.',
    },
    {
      label: '03 - SEASON',
      title: cls.colour.season,
      sub: `${cls.colour.undertone} undertone`,
      body: `${cls.colour.skin_tone_depth} depth with a palette built from controlled neutrals, useful accents, and repeatable wardrobe anchors.`,
    },
    {
      label: '04 - DIRECTION',
      title: cls.style_brief.aesthetic_direction,
      sub: cls.style_brief.register || 'style register',
      body: cls.style_brief.primary_brief || 'A controlled visual direction for work, casual, evening, and relaxed outfits.',
    },
  ];

  return (
    <div className="man-summary-grid">
      <aside className="man-summary-rail">
        <div className="man-micro faded">Section</div>
        <div className="display man-rail-number">02</div>
        <SummaryMetric label="Outfits" value={String(cls.outfit_split.total)} />
        <SummaryMetric label="Chapters" value="Nine" />
        <SummaryMetric label="Pages" value={String(totalSlides)} />
      </aside>

      <div className="man-summary-main">
        <div className="man-micro faded">The Summary</div>
        <h2>
          <span className="display">Four measurements</span>
          <span className="display-it">define the wardrobe.</span>
        </h2>
        <div className="rule" />
        <div className="man-dossier-cards">
          {cards.map(card => (
            <div key={card.label} className="man-dossier-card">
              <div className="man-mono dossier-label">{card.label}</div>
              <div className="display man-dossier-title">{card.title}</div>
              <div className="display-it man-dossier-subtitle">{card.sub}</div>
              <div className="rule-thin" />
              <p>{card.body}</p>
            </div>
          ))}
        </div>

        <div className="rule man-palette-rule" />
        <div className="man-palette-row">
          <div>
            <div className="man-mono dossier-label">05 - HERO COLOURS</div>
            <p>{heroColours.map(c => c.name).join(' · ') || 'Palette pending'}</p>
          </div>
          <div className="man-palette-swatches">
            {heroColours.map((c, i) => (
              <span
                key={i}
                title={`${c.name} - ${c.usage}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="man-summary-metric">
      <div className="man-small-caps faded">{label}</div>
      <div className="display">{value}</div>
    </div>
  );
}

function ReadingGuideSection({ totalSlides }: { totalSlides: number }) {
  const cards = [
    {
      label: '01',
      title: 'Read the diagnosis.',
      body: 'Start with body geometry, chromatic harmony, and face architecture. These pages explain the rules behind every recommendation.',
    },
    {
      label: '02',
      title: 'Use the prescriptions.',
      body: 'Grooming, eyewear, fit, fabric, and shopping filters are the repeatable decisions to use before buying anything new.',
    },
    {
      label: '03',
      title: 'Build from formulas.',
      body: 'Each outfit page gives a complete visual composition, garment breakdown, and one real-life occasion anchor.',
    },
  ];

  return (
    <section className="iconik-page man-page ivory reading-page" data-blueprint-page-number={3}>
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">Opening</div>
        <div className="man-small-caps corner-title">Reading Guide</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">03 / {totalSlides}</div>
      </div>
      <div className="reading-inner">
        <div className="micro faded">How to use this report</div>
        <h2><span className="display">Read the diagnosis.</span><span className="display-it">Then use the rules.</span></h2>
        <div className="rule" />
        <div className="reading-blocks">
          {cards.map(card => (
            <div key={card.label} className="glass-dark reading-card">
              <div className="mono dossier-label">{card.label}</div>
              <h3 className="display">{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
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
  shopping,
  onSelectShoppingLink,
}: ManReportProps) {
  const { classification: cls, sections } = data;
  const isV2 = data.report_version === MAN_BLUEPRINT_V2_VERSION;
  const isAdminViewer = viewerMode === 'admin' || adminMode === true;
  const reportDate    = formatReportDate(data.generated_at);
  const identityExcerpt = useMemo(() => extractIdentityExcerpt(sections.s6_identity), [sections.s6_identity]);
  const slideMeta = useMemo(() => getManReportSlideMeta(data), [data]);
  const totalSlides = slideMeta.length;
  const pageNumberFor = (slideType: ManReportSlideMeta['slideType'], outfitNumber?: number) =>
    slideMeta.find(item => item.slideType === slideType && (outfitNumber === undefined || item.outfitNumber === outfitNumber))?.pageNumber;
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

  const legacySectionConfigs = [
    {
      key: 's0',
      slideType: 'snapshot',
      label: 'Personal Style Snapshot',
      estimatedHeight: 420,
      background: '#ffffff',
      node: <SnapshotSection key="s0" text={sections.s0_snapshot} />,
    },
    {
      key: 's2',
      slideType: 'body',
      label: 'Body Geometry',
      estimatedHeight: 860,
      background: SHELL,
      node: <BodySection key="s2" cls={cls} />,
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
      key: 's1',
      slideType: 'face',
      label: 'Facial Architecture',
      estimatedHeight: 760,
      background: '#ffffff',
      node: (
        <FaceSection
          key="s1"
          mode="architecture"
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
      key: 's5g',
      slideType: 'grooming_direction',
      label: 'Grooming Direction',
      estimatedHeight: 1120,
      background: '#ffffff',
      node: (
        <FaceSection
          key="s5g-direction"
          mode="grooming"
          cls={cls}
          text={sections.s5_grooming_skin ?? sections.s1_face}
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
      key: 's1e',
      slideType: 'eyewear_direction',
      label: 'Eyewear Direction',
      estimatedHeight: 880,
      background: '#ffffff',
      node: (
        <FaceSection
          key="s1-eyewear"
          mode="eyewear"
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
      key: 's2r',
      slideType: 'fit_rules',
      label: 'Silhouette Rules',
      estimatedHeight: 760,
      background: '#ffffff',
      node: <FitRulesPage key="s2r" cls={cls} text={sections.s2_body} />,
    },
    {
      key: 's3f',
      slideType: 'fabric',
      label: 'Fabric & Texture Direction',
      estimatedHeight: 760,
      background: '#ffffff',
      node: <FabricDirectionPage key="s3f" cls={cls} text={sections.s5_shopping ?? sections.s3_colour} />,
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
          shopping={shopping}
          onSelectShoppingLink={onSelectShoppingLink}
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
      label: 'Shopping Filter',
      estimatedHeight: 720,
      background: SHELL,
      node: <ShoppingAuditSection key="s5s" text={sections.s5_shopping ?? sections.s5_rules} />,
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

  const v2SectionConfigs = [
    {
      key: 'face_geometry',
      slideType: 'face_geometry',
      label: 'Face Geometry Analysis',
      estimatedHeight: 900,
      background: '#ffffff',
      node: (
        <V2DiagnosticSlide
          key="face_geometry"
          title="Face"
          italic="geometry."
          kicker="Pillar 1"
          pageNumber={pageNumberFor('face_geometry')}
          totalSlides={totalSlides}
          imageUrl={imageUrls?.diagnostic?.faceGeometry}
          imageAlt="Face geometry diagnostic overlay"
          fallback="Face geometry diagnostic pending. Retry image generation when Gemini capacity is available."
          verdict={data.diagnostics?.faceGeometryVerdict ?? `${cls.face.face_shape} face architecture guides the grooming, beard, and eyewear system.`}
          dos={[
            cls.face.hairstyle_recommendations?.[0] ?? 'Keep hair/scalp grooming realistic and controlled.',
            cls.face.beard_style_recommendations?.[0] ?? cls.face.facial_hair_recommendations ?? 'Keep facial-hair edges intentional.',
            cls.face.eyewear_shapes?.[0] ?? 'Use frames that relate to cheekbone width.',
          ]}
          avoids={[
            'Do not add height or width without geometric reason.',
            'Do not let grooming lines look accidental or unfinished.',
          ]}
        />
      ),
    },
    {
      key: 'hairstyle_grid',
      slideType: 'hairstyle_grid',
      label: 'Hairstyle Grid',
      estimatedHeight: 900,
      background: '#ffffff',
      node: <V2FaceGridSlide key="hairstyle_grid" cls={cls} kind="hairstyle" imageUrl={imageUrls?.hairstyleCards?.[0]} pageNumber={pageNumberFor('hairstyle_grid')} totalSlides={totalSlides} />,
    },
    {
      key: 'beard_grid',
      slideType: 'beard_grid',
      label: 'Beard Grid',
      estimatedHeight: 900,
      background: '#ffffff',
      node: <V2FaceGridSlide key="beard_grid" cls={cls} kind="beard" imageUrl={imageUrls?.beardCards?.[0]} pageNumber={pageNumberFor('beard_grid')} totalSlides={totalSlides} />,
    },
    {
      key: 'eyewear_direction',
      slideType: 'eyewear_direction',
      label: 'Eyewear Grid',
      estimatedHeight: 900,
      background: '#ffffff',
      node: <V2FaceGridSlide key="eyewear_direction" cls={cls} kind="eyewear" imageUrl={imageUrls?.eyewearCards?.[0]} pageNumber={pageNumberFor('eyewear_direction')} totalSlides={totalSlides} />,
    },
    {
      key: 'skin_grooming_system',
      slideType: 'skin_grooming_system',
      label: 'Skin & Grooming System',
      estimatedHeight: 720,
      background: '#ffffff',
      node: <V2SkinGroomingSlide key="skin_grooming_system" cls={cls} pageNumber={pageNumberFor('skin_grooming_system')} totalSlides={totalSlides} />,
    },
    {
      key: 'frame_analysis',
      slideType: 'frame_analysis',
      label: 'Frame Analysis',
      estimatedHeight: 900,
      background: '#ffffff',
      node: (
        <V2DiagnosticSlide
          key="frame_analysis"
          title="Frame"
          italic="analysis."
          kicker="Pillar 2"
          pageNumber={pageNumberFor('frame_analysis')}
          totalSlides={totalSlides}
          imageUrl={imageUrls?.diagnostic?.frameFront}
          imageAlt="Front frame diagnostic overlay"
          fallback="Front frame diagnostic pending. Retry image generation when Gemini capacity is available."
          verdict={data.diagnostics?.frameFrontVerdict ?? `${cls.body.silhouette_type} frame: ${cls.body.fit_directive}`}
          dos={cls.body.silhouette_rules ?? []}
          avoids={cls.body.avoid_cuts ?? []}
          variant="bone"
        />
      ),
    },
    {
      key: 'side_profile',
      slideType: 'side_profile',
      label: 'Side Profile',
      estimatedHeight: 900,
      background: '#ffffff',
      node: (
        <V2DiagnosticSlide
          key="side_profile"
          title="Side"
          italic="profile."
          kicker="Pillar 2"
          pageNumber={pageNumberFor('side_profile')}
          totalSlides={totalSlides}
          imageUrl={imageUrls?.diagnostic?.frameSide}
          imageAlt="Side profile diagnostic overlay"
          fallback={data.diagnostics?.frameSideFallback ?? 'No side-profile photo was supplied; use front-frame rules and tailoring notes instead.'}
          verdict={imageUrls?.diagnostic?.frameSide ? (data.diagnostics?.frameSideVerdict ?? 'Side profile validates posture, abdomen projection, and layer drape.') : (data.diagnostics?.frameSideFallback ?? 'No side-profile photo was supplied.')}
          dos={[
            cls.body.fit_directive,
            cls.body.silhouette_rules?.[0] ?? 'Use layers that fall cleanly from shoulder to hem.',
            cls.body.height_adjustment,
          ].filter(Boolean)}
          avoids={cls.body.avoid_cuts ?? []}
        />
      ),
    },
    {
      key: 'frame_training',
      slideType: 'frame_training',
      label: 'Frame Training Direction',
      estimatedHeight: 760,
      background: '#ffffff',
      node: <V2FrameTrainingSlide key="frame_training" data={data} pageNumber={pageNumberFor('frame_training')} totalSlides={totalSlides} />,
    },
    {
      key: 'fit_rules',
      slideType: 'fit_rules',
      label: 'Fit Rules',
      estimatedHeight: 760,
      background: '#ffffff',
      node: <FitRulesPage key="fit_rules" cls={cls} text={sections.s2_body} />,
    },
    {
      key: 'colour_drape',
      slideType: 'colour_drape',
      label: 'Colour Drape Comparison',
      estimatedHeight: 900,
      background: '#ffffff',
      node: (
        <V2DiagnosticSlide
          key="colour_drape"
          title="Colour"
          italic="drape."
          kicker="Pillar 3"
          pageNumber={pageNumberFor('colour_drape')}
          totalSlides={totalSlides}
          imageUrl={imageUrls?.diagnostic?.colourDrape}
          imageAlt="Colour drape comparison"
          fallback="Colour drape comparison pending. Retry image generation when Gemini capacity is available."
          verdict={data.diagnostics?.colourDrapeVerdict ?? `${cls.colour.season} works when depth and undertone are controlled near the face.`}
          dos={[
            `Anchor near-face colour in ${cls.colour.primary_palette?.[0]?.name ?? cls.colour.season}.`,
            cls.colour.pattern_guidance,
            cls.colour.fabric_tone_guidance,
          ].filter(Boolean)}
          avoids={(cls.colour.colours_to_avoid ?? []).map(item => `${item.name}: ${item.reason}`)}
          variant="bone"
        />
      ),
    },
    {
      key: 'palette',
      slideType: 'colour',
      label: 'Palette',
      estimatedHeight: 900,
      background: '#ffffff',
      node: <ColourSection key="palette" cls={cls} text={sections.s3_colour} />,
    },
    {
      key: 's4',
      slideType: 'outfit',
      label: `Your ${cls.outfit_split.total} Outfit Formulas`,
      estimatedHeight: 2400,
      background: SHELL,
      node: (
        <OutfitsSection
          key="s4-v2"
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
          shopping={shopping}
          onSelectShoppingLink={onSelectShoppingLink}
        />
      ),
    },
    {
      key: 'before_after',
      slideType: 'before_after',
      label: 'Before / After Transformation',
      estimatedHeight: 900,
      background: '#ffffff',
      node: <V2BeforeAfterSlide key="before_after" beforeImage={imageUrls?.deliverables?.beforeImage} afterImage={imageUrls?.deliverables?.afterImage} legacyImage={imageUrls?.deliverables?.beforeAfter} pageNumber={pageNumberFor('before_after')} totalSlides={totalSlides} />,
    },
    {
      key: 'linkedin_headshot',
      slideType: 'linkedin_headshot',
      label: 'LinkedIn Headshot',
      estimatedHeight: 900,
      background: '#ffffff',
      node: <V2LinkedinSlide key="linkedin_headshot" data={data} imageUrl={imageUrls?.deliverables?.linkedinHeadshot} pageNumber={pageNumberFor('linkedin_headshot')} totalSlides={totalSlides} />,
    },
    {
      key: 'dating_profile_shots',
      slideType: 'dating_profile_shots',
      label: 'Social Media Inspiration',
      estimatedHeight: 900,
      background: '#ffffff',
      node: <V2DatingSlide key="dating_profile_shots" data={data} imageUrls={imageUrls?.deliverables?.datingProfileShots} avatarUrl={imageUrls?.deliverables?.linkedinHeadshot} pageNumber={pageNumberFor('dating_profile_shots')} totalSlides={totalSlides} />,
    },
    {
      key: 'shopping_identity',
      slideType: 'shopping_identity',
      label: 'Shopping + Identity Close',
      estimatedHeight: 760,
      background: SHELL,
      node: <V2ShoppingIdentitySlide key="shopping_identity" data={data} pageNumber={pageNumberFor('shopping_identity')} totalSlides={totalSlides} />,
    },
  ] as const;

  const sectionConfigs = isV2 ? v2SectionConfigs : legacySectionConfigs;

  return (
    <div
      className="iconik-report man-report overflow-x-hidden"
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
      {shouldRenderSlide('cover') && <section className="iconik-page man-page slate man-cover cover-page" data-blueprint-page-number={pageNumberFor('cover') ?? 1}>
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
            <span className="man-display-it">Blueprint</span>
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

      {/* ── Summary page — dossier grid + palette row ────────────────────── */}
      {shouldRenderSlide('overview') && <section className="iconik-page man-page ivory" data-blueprint-page-number={pageNumberFor('overview') ?? 2}>
        <div className="grain" />
        <div className="corner-tl">
          <div className="man-mono corner-kicker">The Blueprint</div>
          <div className="man-small-caps corner-title">Overview</div>
        </div>
        <div className="corner-tr">
          <div className="man-mono corner-kicker">{String(slideMeta.find(item => item.slideType === 'overview')?.pageNumber ?? 2).padStart(2, '0')} / {totalSlides}</div>
        </div>
        <div className="man-page-inner">
          <BlueprintSummary cls={cls} totalSlides={totalSlides} />
        </div>
      </section>}

      {!isV2 && shouldRenderSlide('reading_guide') && (
        <ReadingGuideSection totalSlides={totalSlides} />
      )}

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
          pageNumber={section.key === 's4' ? undefined : pageNumberFor(section.slideType)}
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
      .man-report,
      .man-report.iconik-report {
        background: ${INK};
        color: ${INK};
        font-family: var(--font-inter), Inter, system-ui, sans-serif;
        font-weight: 300;
        padding: 18px;
      }

      .iconik-page-frame {
        max-width: 1060px;
        margin: 0 auto 20px;
      }

      /* ── Page frame ────────────────────────────────────────── */
      .man-page {
        max-width: 1060px;
        min-height: 720px;
        margin: 0 auto 20px;
        border-radius: 20px;
        padding: 58px 52px;
        position: relative;
        overflow: hidden;
        page-break-after: always;
      }

      .man-page.slate,
      .iconik-page.slate {
        background: radial-gradient(ellipse 120% 80% at 25% 10%, ${SLATE_LIGHT} 0%, ${SLATE} 45%, ${SLATE_DEEP} 100%);
        color: #F4EFE5;
      }

      .man-page.ivory,
      .iconik-page.ivory {
        background: linear-gradient(180deg, ${PAPER} 0%, #F1E9D8 100%);
        color: ${INK};
      }

      .man-page.bone,
      .iconik-page.bone {
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
        font-family: var(--font-fraunces), Fraunces, Georgia, serif;
        font-weight: 300;
        font-style: normal;
        letter-spacing: -0.025em;
        line-height: 0.95;
      }
      .man-display-it {
        font-family: var(--font-fraunces), Fraunces, Georgia, serif;
        font-weight: 300;
        font-style: italic;
        letter-spacing: -0.025em;
        line-height: 1.04;
      }
      .man-mono {
        font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
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
        margin-top: 56px;
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
        font-family: var(--font-fraunces), Fraunces, Georgia, serif;
        font-weight: 300;
        font-style: normal;
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
      .man-report em { font-style: italic; }
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

      .visual-man-intro {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 14px 18px;
        margin-bottom: 32px;
      }
      .visual-man-intro p {
        margin: 0;
        max-width: 620px;
        font-size: 14px;
        line-height: 1.65;
        color: ${INK_SOFT};
      }
      .slate .visual-man-intro p {
        color: rgba(244,239,229,0.76);
      }
      .visual-card-light {
        border-radius: 16px;
        padding: 16px;
        background: #fff;
        border: 1px solid ${BORDER};
        box-shadow: none;
      }
      .visual-card-light p {
        margin: 0;
        font-size: 13px;
        line-height: 1.55;
        color: ${INK};
      }
      .v2-evidence-frame {
        position: relative;
        width: 100%;
        min-height: 360px;
        aspect-ratio: 4 / 5;
        overflow: hidden;
        border-radius: 18px;
        background: ${SHELL};
        border: 1px solid ${BORDER};
      }
      .v2-evidence-frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .v2-evidence-fallback {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 28px;
        text-align: center;
        color: ${INK_SOFT};
        background: linear-gradient(135deg, ${SHELL}, ${PAPER});
      }
      .v2-evidence-fallback p {
        max-width: 280px;
        margin: 0;
        font-size: 12px;
        line-height: 1.55;
      }
      .before-after-comparison { position: relative; width: 100%; aspect-ratio: 2 / 3; max-height: 590px; overflow: hidden; border-radius: 24px; border: 1px solid ${BORDER}; background: ${SHELL}; touch-action: pan-y; box-shadow: 0 18px 48px rgba(44,38,34,0.12); }
      .before-after-image, .before-after-reveal { position: absolute; inset: 0; width: 100%; height: 100%; }
      .before-after-image { object-fit: cover; display: block; }
      .before-after-reveal { z-index: 1; }
      .before-after-divider { position: absolute; z-index: 3; top: 0; bottom: 0; width: 2px; background: #fff; transform: translateX(-50%); pointer-events: none; box-shadow: 0 0 0 1px rgba(44,38,34,0.16); }
      .before-after-divider span { position: absolute; top: 50%; left: 50%; width: 48px; height: 48px; border-radius: 999px; transform: translate(-50%, -50%); display: grid; place-items: center; background: #fff; color: ${INK}; font: 700 17px/1 var(--font-dm-mono), monospace; box-shadow: 0 6px 22px rgba(44,38,34,0.24); }
      .before-after-label { position: absolute; z-index: 4; top: 16px; padding: 7px 11px; border-radius: 999px; background: rgba(44,38,34,0.78); color: #fff; font: 700 9px/1 var(--font-dm-mono), monospace; letter-spacing: 0.14em; text-transform: uppercase; pointer-events: none; }
      .before-after-label-before { left: 16px; }
      .before-after-label-after { right: 16px; }
      .before-after-range { position: absolute; z-index: 5; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: ew-resize; }

      .linkedin-profile-mock { max-width: 760px; margin: 0 auto; overflow: hidden; border: 1px solid #d0d7de; border-radius: 18px; background: #fff; box-shadow: 0 18px 52px rgba(0,0,0,0.1); }
      .linkedin-cover { position: relative; height: 132px; background: linear-gradient(125deg, #0a66c2, #3d7fb8 52%, ${SLATE_LIGHT}); }
      .linkedin-in-badge { position: absolute; right: 24px; top: 22px; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 4px; background: rgba(255,255,255,0.94); color: #0a66c2; font: 800 21px/1 Arial, sans-serif; }
      .linkedin-profile-body { position: relative; padding: 70px 28px 28px; }
      .linkedin-avatar { position: absolute; top: -70px; left: 28px; width: 132px; height: 132px; overflow: hidden; border: 5px solid #fff; border-radius: 50%; background: ${SHELL}; display: grid; place-items: center; color: ${INK_SOFT}; }
      .linkedin-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .linkedin-actions { position: absolute; top: 18px; right: 26px; display: flex; gap: 8px; }
      .linkedin-actions span { padding: 7px 14px; border: 1px solid #0a66c2; border-radius: 999px; color: #0a66c2; font: 700 11px/1 Arial, sans-serif; }
      .linkedin-actions span:first-child { background: #0a66c2; color: #fff; }
      .linkedin-profile-copy h3 { margin: 5px 0 4px; color: #191919; font: 700 26px/1.2 Arial, sans-serif; }
      .linkedin-headline { color: #333; font: 400 15px/1.45 Arial, sans-serif; }
      .linkedin-location { margin-top: 5px; color: #666; font: 400 12px/1.4 Arial, sans-serif; }
      .linkedin-about { margin: 22px -8px 18px; padding: 20px; border: 1px solid #e6e6e6; border-radius: 12px; }
      .linkedin-about p { margin: 6px 0 0; color: #333; font: 400 13px/1.55 Arial, sans-serif; }

      .instagram-profile-mock { max-width: 720px; margin: 0 auto; overflow: hidden; border: 1px solid #dbdbdb; border-radius: 18px; background: #fff; color: #1b1b1b; box-shadow: 0 18px 52px rgba(44,38,34,0.1); }
      .instagram-topbar { display: flex; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #efefef; font: 600 14px/1.2 Arial, sans-serif; }
      .instagram-profile-header { display: grid; grid-template-columns: 94px 70px 1fr; gap: 18px; align-items: center; padding: 22px 28px 14px; }
      .instagram-avatar { width: 86px; height: 86px; padding: 3px; overflow: hidden; border: 3px solid transparent; border-radius: 50%; background: linear-gradient(#fff,#fff) padding-box, linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7) border-box; display: grid; place-items: center; font: 700 10px/1 Arial, sans-serif; }
      .instagram-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
      .instagram-stat, .instagram-private-note { display: flex; flex-direction: column; gap: 3px; }
      .instagram-stat strong { font: 700 18px/1 Arial, sans-serif; }
      .instagram-stat span, .instagram-private-note span { color: #737373; font: 400 11px/1.35 Arial, sans-serif; }
      .instagram-private-note strong { font: 600 13px/1.2 Arial, sans-serif; }
      .instagram-bio { display: flex; flex-direction: column; gap: 4px; padding: 0 28px 18px; font: 400 12px/1.4 Arial, sans-serif; }
      .instagram-bio strong { font-weight: 600; }
      .instagram-tabs { display: flex; justify-content: center; gap: 9px; padding: 11px; border-top: 1px solid #efefef; color: #555; font: 600 10px/1 Arial, sans-serif; letter-spacing: 0.08em; text-transform: uppercase; }
      .instagram-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3px; background: #fff; }
      .instagram-tile { position: relative; aspect-ratio: 1; overflow: hidden; background: ${SHELL}; }
      .instagram-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .instagram-tile-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; color: ${INK_SOFT}; font: 600 11px/1.3 Arial, sans-serif; }
      .instagram-tile-empty span { font-weight: 400; }
      .instagram-downloads { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 18px; border-top: 1px solid #efefef; }

      @media (max-width: 640px) {
        .linkedin-cover { height: 108px; }
        .linkedin-profile-body { padding: 66px 18px 22px; }
        .linkedin-avatar { left: 18px; width: 112px; height: 112px; top: -58px; }
        .linkedin-actions { right: 16px; top: 16px; }
        .linkedin-actions span { padding: 6px 9px; font-size: 9px; }
        .instagram-profile-header { grid-template-columns: 72px 52px 1fr; gap: 12px; padding: 18px 16px 12px; }
        .instagram-avatar { width: 68px; height: 68px; }
        .instagram-bio { padding-left: 16px; padding-right: 16px; }
      }
      .v2-download {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 10px 14px;
        background: ${INK};
        color: #fff;
        font-size: 12px;
        font-weight: 500;
        text-decoration: none;
      }

      /* ── Glass card ──────────────────────────────────────────── */
      .glass-dark {
        background: rgba(244,239,229,0.055);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(244,239,229,0.15);
        border-radius: 16px;
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
        margin: 0 0 32px;
      }
      .man-page h2 span {
        display: block;
        font-size: clamp(40px, 6.4vw, 72px);
      }

      /* ── Overview dossier grid ─────────────────────────────── */
      .man-summary-grid {
        display: grid;
        grid-template-columns: 1fr 2.4fr;
        gap: 48px;
        min-height: 560px;
      }
      .man-summary-rail {
        border-right: 1px solid rgba(27,24,21,0.12);
        padding-right: 32px;
      }
      .man-rail-number {
        font-size: 48px;
        margin-top: 8px;
        margin-bottom: 32px;
      }
      .man-summary-metric {
        margin-bottom: 28px;
      }
      .man-summary-metric .display {
        font-size: 22px;
        margin-top: 4px;
      }
      .man-summary-main h2 {
        margin: 16px 0 40px;
      }
      .man-summary-main h2 span {
        font-size: clamp(42px, 6vw, 64px);
      }
      .man-dossier-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 26px 38px;
        margin-top: 28px;
      }
      .man-dossier-title {
        font-size: 32px;
        margin-top: 8px;
        overflow-wrap: anywhere;
      }
      .man-dossier-subtitle {
        font-size: 18px;
        opacity: 0.6;
        margin-top: 2px;
      }
      .man-dossier-card p {
        font-size: 13px;
        line-height: 1.6;
        opacity: 0.7;
        margin: 0;
      }
      .man-dossier-card .rule-thin {
        margin: 14px 0;
      }
      .man-palette-rule {
        margin: 36px 0 24px;
      }
      .man-palette-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
      }
      .man-palette-row p {
        margin-top: 8px;
        font-size: 13px;
        line-height: 1.6;
        color: ${INK_SOFT};
      }
      .man-palette-swatches {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
        min-width: 180px;
      }
      .man-palette-swatches span {
        width: 32px;
        height: 32px;
        border-radius: 999px;
        box-shadow: 0 8px 22px -12px rgba(27,24,21,0.45), inset 0 0 0 1px rgba(255,255,255,0.45);
      }

      /* ── Stylist blueprint reading guide ───────────────────── */
      .reading-inner {
        margin-top: 64px;
        max-width: 850px;
      }
      .reading-inner h2 {
        margin: 16px 0 28px;
      }
      .reading-inner h2 span {
        display: block;
        font-size: clamp(42px, 6.6vw, 74px);
      }
      .reading-blocks {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 34px;
      }
      .reading-card {
        padding: 20px;
        min-height: 190px;
      }
      .reading-card h3 {
        font-size: 28px;
        line-height: 1;
        margin: 18px 0 18px;
      }
      .reading-card p {
        margin: 0;
        color: ${INK_SOFT};
        font-size: 13px;
        line-height: 1.65;
      }

      /* ── Stylist blueprint outfit pages ────────────────────── */
      .man-outfit-layout {
        margin-top: 42px;
      }
      .outfit-hero {
        display: grid;
        grid-template-columns: minmax(280px, 0.78fr) minmax(500px, 1.22fr);
        gap: 34px;
        align-items: start;
      }
      .outfit-copy {
        min-width: 0;
        padding-top: 0;
        order: 1;
      }
      .outfit-no {
        color: ${INK_SOFT};
        font-size: 18px;
        line-height: 1;
        opacity: 0.55;
      }
      .man-outfit-title {
        color: ${INK};
        font-size: clamp(42px, 6vw, 68px);
        line-height: 0.94;
        margin: 8px 0 0;
        overflow-wrap: anywhere;
      }
      .outfit-quote {
        color: ${INK_SOFT};
        font-size: 17px;
        line-height: 1.5;
        max-width: 400px;
        margin: 32px 0;
        opacity: 0.78;
        font-family: ${SERIF};
        font-style: italic;
        font-weight: 300;
      }
      .outfit-meta {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 14px 24px;
        margin-top: 28px;
      }
      .outfit-meta p {
        margin: 0;
        color: ${INK};
        font-size: 14px;
        line-height: 1.5;
      }
      .outfit-art {
        min-width: 0;
        order: 2;
      }
      .flatlay-frame {
        position: relative;
        overflow: hidden;
        aspect-ratio: 2 / 3;
        min-height: 0;
        border-radius: 24px;
        padding: 16px;
        background: linear-gradient(160deg, ${SLATE} 0%, ${SLATE_DEEP} 100%);
        border: 0;
        box-shadow: none;
        color: ${IVORY};
      }
      .flatlay-media-image {
        position: relative;
        width: 100%;
        height: calc(100% - 28px);
        margin-top: 6px;
        object-fit: contain;
        object-position: center;
        border-radius: 16px;
        display: block;
      }
      .figure-label {
        position: absolute;
        top: 18px;
        left: 18px;
        z-index: 2;
        color: rgba(251,248,244,0.68);
        font-size: 10px;
        text-transform: uppercase;
      }
      .outfit-fallback-panel {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 32px;
        text-align: center;
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
      .man-formula-grid {
        margin-top: 0;
      }
      .formula-card {
        min-height: 0;
        border-radius: 16px;
        padding: 20px 18px;
        background: rgba(255,255,255,0.6);
        border: 1px solid rgba(44,38,34,0.08);
        backdrop-filter: blur(20px);
      }
      .formula-card .display {
        display: block;
        margin: 8px 0 0;
        color: ${INK};
        font-family: ${SERIF};
        font-size: 17px;
        font-weight: 300;
        line-height: 1.2;
        overflow-wrap: anywhere;
      }
      .swatch-dot {
        display: inline-block;
        width: 18px;
        height: 18px;
        border-radius: 999px;
        margin-right: 6px;
        vertical-align: middle;
        box-shadow: 0 0 0 1px rgba(44,38,34,0.1), inset 0 0 0 1px rgba(255,255,255,0.38);
      }
      .formula-card .swatch-dot {
        display: block;
        width: 32px;
        height: 32px;
        margin: 0 0 14px;
      }

      /* ── Shopping links (per garment slot) ─ */
      .shop-links {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .shop-links .shop-chip,
      .shop-selected .shop-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        width: fit-content;
        max-width: 100%;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid rgba(44,38,34,0.14);
        background: rgba(255,255,255,0.75);
        font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
        font-size: 10.5px;
        letter-spacing: 0.02em;
        color: ${INK};
        text-decoration: none;
      }
      .shop-chip:hover { border-color: ${ACCENT}; color: ${ACCENT_INK}; }
      .shop-chip-merchant { font-weight: 600; }
      .shop-chip-price { color: ${INK_SOFT}; }
      .shop-chip-fallback { color: ${INK_SOFT}; font-style: italic; }
      .shop-disclaimer {
        margin-top: 14px;
        font-size: 10px;
        letter-spacing: 0.04em;
      }
      .shop-status { display: flex; align-items: center; gap: 6px; }
      .shop-status-dot { width: 7px; height: 7px; border-radius: 999px; flex-shrink: 0; }
      .shop-status-label { font-size: 9.5px; letter-spacing: 0.05em; text-transform: uppercase; }
      .shop-selected { display: flex; flex-wrap: wrap; gap: 6px; }
      .shop-actions { display: flex; flex-wrap: wrap; gap: 6px; }
      .shop-action-btn {
        padding: 3px 10px;
        border-radius: 999px;
        border: 1px solid rgba(44,38,34,0.18);
        background: transparent;
        font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
        font-size: 10px;
        color: ${INK_SOFT};
        cursor: pointer;
        text-decoration: none;
      }
      .shop-action-btn:hover:not(:disabled) { border-color: ${ACCENT}; color: ${ACCENT_INK}; }
      .shop-action-btn:disabled { opacity: 0.5; cursor: default; }
      .shop-picker {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 240px;
        overflow-y: auto;
        padding: 8px;
        border-radius: 12px;
        border: 1px solid rgba(44,38,34,0.12);
        background: rgba(255,255,255,0.85);
      }
      .shop-candidate {
        display: grid;
        grid-template-columns: 14px 1fr;
        gap: 2px 6px;
        text-align: left;
        padding: 6px 8px;
        border-radius: 8px;
        border: 1px solid transparent;
        background: transparent;
        cursor: pointer;
      }
      .shop-candidate.picked { border-color: ${SAGE}; background: rgba(143,160,136,0.12); }
      .shop-candidate-check { grid-row: span 2; color: ${SAGE}; font-size: 11px; }
      .shop-candidate-title { font-size: 11px; color: ${INK}; line-height: 1.3; overflow-wrap: anywhere; }
      .shop-candidate-meta {
        grid-column: 2;
        font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
        font-size: 9.5px;
        color: ${INK_SOFT};
      }
      .shop-picker-footer { display: flex; justify-content: flex-end; padding-top: 4px; }
      .shop-manual { display: flex; gap: 6px; }
      .shop-manual-input {
        flex: 1;
        min-width: 0;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid rgba(44,38,34,0.14);
        background: rgba(255,255,255,0.75);
        font-size: 11px;
        color: ${INK};
      }
      .shop-error { font-size: 10px; color: ${OXBLOOD}; }

      /* ── Dossier label (inherits page color, no hardcoded amber) ─ */
      .dossier-label {
        display: block;
        font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
        font-size: 10px;
        opacity: 0.45;
        text-transform: uppercase;
        letter-spacing: 0.10em;
        margin-bottom: 6px;
      }

      /* ── Diagnosis quote ─────────────────────────────────────── */
      .diagnosis-quote {
        font-family: var(--font-fraunces), Fraunces, Georgia, serif;
        font-weight: 300;
        font-style: normal;
        font-size: 22px;
        opacity: 0.75;
        line-height: 1.5;
        letter-spacing: 0;
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
        .man-report,
        .man-report.iconik-report {
          padding: 0;
        }
        .man-page {
          border-radius: 0;
          margin-bottom: 0;
          min-height: auto;
          padding: 60px 16px 32px;
        }
        .corner-tl, .corner-tr {
          top: 16px;
        }
        .corner-tl { left: 16px; }
        .corner-tr { right: 16px; }
        .corner-title {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .man-page-inner {
          margin-top: 42px;
        }
        .man-page h2 {
          margin-bottom: 24px;
        }
        .man-page h2 span,
        .reading-inner h2 span,
        .man-summary-main h2 span {
          font-size: clamp(34px, 11vw, 54px);
        }
        .man-cover-center {
          position: relative;
          top: auto;
          left: auto;
          right: auto;
          padding: 112px 0 64px;
        }
        .man-cover-heading .man-display,
        .man-cover-heading .man-display-it {
          font-size: clamp(58px, 18vw, 82px);
        }
        .man-cover-excerpt {
          font-size: 14px;
          margin-top: 22px;
        }
        .man-summary-grid {
          grid-template-columns: 1fr;
          gap: 24px;
          min-height: 0;
        }
        .man-summary-rail {
          border-right: 0;
          border-bottom: 1px solid rgba(27,24,21,0.12);
          padding-right: 0;
          padding-bottom: 16px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .man-summary-rail .man-micro,
        .man-rail-number {
          grid-column: 1 / -1;
        }
        .man-rail-number {
          margin-bottom: 4px;
        }
        .man-dossier-cards {
          grid-template-columns: 1fr;
          gap: 18px;
          margin-top: 24px;
        }
        .man-dossier-title {
          font-size: 26px;
        }
        .man-dossier-subtitle {
          font-size: 16px;
        }
        .man-palette-row {
          align-items: flex-start;
          flex-direction: column;
        }
        .man-palette-swatches {
          justify-content: flex-start;
          min-width: 0;
        }
        .reading-blocks {
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: 24px;
        }
        .reading-card {
          min-height: 0;
          padding: 16px;
        }
        .reading-card h3 {
          font-size: 22px;
          margin: 10px 0;
        }
        .outfit-hero {
          grid-template-columns: 1fr;
          gap: 22px;
        }
        .flatlay-frame {
          min-height: 380px;
          border-radius: 18px;
        }
        .formula-grid {
          grid-template-columns: 1fr;
        }
        .formula-card {
          min-height: 0;
          padding: 12px;
        }
        .formula-card .display {
          font-size: 18px;
        }
        .man-outfit-title {
          font-size: clamp(34px, 11vw, 52px);
        }
        .visual-man-intro {
          gap: 10px;
          margin-bottom: 22px;
        }
        .visual-card-light {
          padding: 14px;
        }
        .man-footer {
          padding: 34px 16px;
        }
      }
    `}</style>
  );
}

export default memo(ManReport);
