'use client';

// ManReport.tsx
// Renders the full ICONIK Men's Blueprint report.
// Design matches the embedded report preview on /man landing page exactly.

import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import type { ReportData, ClassificationResult } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls } from '@/lib/manImageGenerator';
import { SPRING, staggerContainer, staggerItem, fadeUp } from '@/lib/reportAnimations';

// ─────────────────────────────────────────────────────────────
// Design tokens (matches /man/page.tsx embedded report)
// ─────────────────────────────────────────────────────────────

const GOLD    = '#b58e4d';
const BORDER  = '#f0ede8';
const CREAM   = '#faf9f6';
const CREAM2  = '#f5f3ef';

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
    };

    if (!currentCat) {
      currentCat = { name: 'Outfits', intro: '', outfits: [] };
      categories.push(currentCat);
    }
    currentCat.outfits.push(outfit);
  }

  return categories.filter(c => c.outfits.length > 0);
}

function extractOutfitBlock(s4Text: string, outfitNumber: number): string {
  const blocks = s4Text.split(/(?=(?:\*\*Outfit\s+\d+|\bOUTFIT\s+\d+))/i);
  const block = blocks.find(b => {
    const t = b.trim();
    return new RegExp(`^(?:\\*\\*Outfit|OUTFIT)\\s+${outfitNumber}\\s*[—–-]`).test(t);
  });
  return block?.trim() ?? '';
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
        <ul key={key++} className="space-y-2 my-3">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              {item.type === 'cross' ? (
                <span className="text-[10px] font-bold mt-0.5 flex-shrink-0" style={{ color: '#ef4444aa' }}>✗</span>
              ) : item.type === 'check' ? (
                <span className="text-[10px] font-bold mt-0.5 flex-shrink-0" style={{ color: GOLD }}>✓</span>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: GOLD + '66' }} />
              )}
              <span
                className="text-xs text-gray-600 font-light leading-relaxed"
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
        <ol key={key++} className="space-y-2 my-3">
          {orderedItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="text-[9px] font-black flex-shrink-0 mt-0.5 w-4" style={{ color: GOLD }}>{i + 1}.</span>
              <span
                className="text-xs text-gray-600 font-light leading-relaxed"
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
        <p key={key++} className="text-xs font-bold mt-6 mb-2" style={{ color: '#111111' }}>
          {line.slice(4).replace(/\*\*/g, '')}
        </p>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <p key={key++} className="text-[9px] font-black uppercase tracking-[0.3em] mt-5 mb-2" style={{ color: GOLD + 'cc' }}>
          {line.slice(3).replace(/\*\*/g, '')}
        </p>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <p key={key++} className="text-sm font-bold text-black mt-4 mb-2">{line.slice(2).replace(/\*\*/g, '')}</p>
      );
    } else if (/^\d+\.\s/.test(line)) {
      // Ordered list item
      listItems.length && flushList();
      orderedItems.push(line.replace(/^\d+\.\s+/, ''));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      orderedItems.length && flushList();
      listItems.push({ text: line.slice(2), type: 'bullet' });
    } else if (line.startsWith('✗ ') || line.startsWith('✘ ')) {
      orderedItems.length && flushList();
      listItems.push({ text: line.slice(2), type: 'cross' });
    } else if (line.startsWith('✓ ') || line.startsWith('✔ ')) {
      orderedItems.length && flushList();
      listItems.push({ text: line.slice(2), type: 'check' });
    } else if (/^(\*\*|__).+(\*\*|__)$/.test(line)) {
      // Standalone bold line = sub-label
      flushList();
      elements.push(
        <p key={key++} className="text-xs font-bold text-black mt-4 mb-1"
          dangerouslySetInnerHTML={{ __html: richify(line) }} />
      );
    } else if (/^═+$/.test(line) || /^─+$/.test(line) || /^━+$/.test(line)) {
      // Divider lines — skip
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-xs text-gray-600 font-light leading-relaxed my-1.5"
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

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-6 md:px-10 py-6 border-b flex items-center gap-3" style={{ borderColor: BORDER }}>
      <div className="h-px flex-1" style={{ background: BORDER }} />
      <span className="text-[9px] font-black uppercase tracking-[0.5em]" style={{ color: GOLD }}>{label}</span>
      <div className="h-px flex-1" style={{ background: BORDER }} />
    </div>
  );
}

function GoldPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-5 py-2 text-[9px] font-black uppercase tracking-widest" style={{ background: '#000', color: GOLD }}>
      {children}
    </span>
  );
}

function DataLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5" style={{ color: GOLD }}>
      {children}
    </span>
  );
}

function StylistNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 pl-5 py-1" style={{ borderColor: GOLD + '33' }}>
      <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 italic" style={{ color: GOLD }}>Stylist Rationale</p>
      <p className="text-xs text-gray-500 font-light italic leading-relaxed">&ldquo;{children}&rdquo;</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 01 — Face Architecture
// ─────────────────────────────────────────────────────────────

function FaceSection({ cls, text, hairstyleUrls, eyewearUrls }: { cls: ClassificationResult; text: string; hairstyleUrls?: (string | null)[]; eyewearUrls?: (string | null)[] }) {
  const { face } = cls;
  const hasHairstyleImages = hairstyleUrls && hairstyleUrls.some(Boolean);
  const hasEyewearImages   = eyewearUrls && eyewearUrls.some(Boolean);
  return (
    <div className="bg-white border-b" style={{ borderColor: BORDER }}>
      <SectionHeader label="Section 01 — Facial Architecture Analysis™" />
      <div className="p-6 md:p-10">
        <div className="flex items-center gap-4 mb-8">
          <GoldPill>{face.face_shape} Face</GoldPill>
          <span className="text-xs text-gray-400 font-light">{face.feature_type} feature type</span>
        </div>

        {/* Hairstyle images — two headshots side by side */}
        {hasHairstyleImages && (
          <div className="mb-8">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Your Hairstyle Options</p>
            <div className="grid grid-cols-2 gap-4">
              {hairstyleUrls!.slice(0, 2).map((url, i) => (
                <div key={i} className="flex flex-col gap-2">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`Hairstyle option ${i + 1}`}
                      loading="lazy"
                      className="w-full rounded-xl border object-cover object-top"
                      style={{ aspectRatio: '3/4', borderColor: BORDER, opacity: 0, transition: 'opacity 0.5s ease' }}
                      onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                    />
                  ) : (
                    <div className="w-full rounded-xl border skeleton-shimmer flex items-center justify-center"
                      style={{ aspectRatio: '3/4', borderColor: BORDER }}>
                      <span className="text-[8px] text-gray-300 uppercase tracking-widest">Not generated</span>
                    </div>
                  )}
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-center" style={{ color: GOLD }}>
                    Option {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eyewear images — two headshots side by side */}
        {hasEyewearImages && (
          <div className="mb-8">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Your Eyewear Options</p>
            <div className="grid grid-cols-2 gap-4">
              {eyewearUrls!.slice(0, 2).map((url, i) => (
                <div key={i} className="flex flex-col gap-2">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`Eyewear option ${i + 1}`}
                      loading="lazy"
                      className="w-full rounded-xl border object-cover object-top"
                      style={{ aspectRatio: '3/4', borderColor: BORDER, opacity: 0, transition: 'opacity 0.5s ease' }}
                      onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                    />
                  ) : (
                    <div className="w-full rounded-xl border skeleton-shimmer flex items-center justify-center"
                      style={{ aspectRatio: '3/4', borderColor: BORDER }}>
                      <span className="text-[8px] text-gray-300 uppercase tracking-widest">Not generated</span>
                    </div>
                  )}
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-center" style={{ color: GOLD }}>
                    Option {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eyewear & Facial Hair */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t" style={{ borderColor: BORDER }}>
          <div>
            <DataLabel>Eyewear</DataLabel>
            <span className="text-xs text-black font-light">{face.eyewear_shapes.join(' · ')}</span>
          </div>
          <div>
            <DataLabel>Facial Hair</DataLabel>
            <span className="text-xs text-black font-light">{face.facial_hair_recommendations}</span>
          </div>
        </div>

        {/* Narrative */}
        {text && (
          <div className="mt-8 pt-6 border-t" style={{ borderColor: BORDER }}>
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

function BodySection({ cls, text }: { cls: ClassificationResult; text: string }) {
  const { body } = cls;
  return (
    <div className="border-b" style={{ background: CREAM, borderColor: BORDER }}>
      <SectionHeader label="Section 02 — Body Geometry Analysis™" />
      <div className="bg-white p-6 md:p-10">
        <div className="flex items-center gap-4 mb-6">
          <GoldPill>{body.silhouette_type} Build</GoldPill>
          <span className="text-xs text-gray-400 font-light">Your dominant frame geometry</span>
        </div>

        {/* Silhouette rules grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Your Fit Blueprint</p>
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {body.silhouette_rules.map((rule, i) => (
                <motion.div key={i} className="flex items-start gap-2.5" variants={staggerItem}>
                  <span className="text-[9px] font-black mt-0.5 flex-shrink-0" style={{ color: GOLD }}>0{i + 1}</span>
                  <span className="text-xs text-black font-light leading-relaxed">{rule}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: '#ef4444' + 'aa' }}>Cuts to Avoid</p>
            <div className="space-y-2 mb-6">
              {body.avoid_cuts.map((cut, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-200 mt-1.5 flex-shrink-0" />
                  <span className="text-xs text-gray-400 font-light">{cut}</span>
                </div>
              ))}
            </div>

            <div className="border-l-2 pl-4" style={{ borderColor: GOLD + '33' }}>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 italic" style={{ color: GOLD }}>Height Equation</p>
              <p className="text-xs text-gray-500 font-light italic leading-relaxed">{body.height_adjustment}</p>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t" style={{ borderColor: BORDER }}>
          {[
            { label: 'Silhouette', value: body.silhouette_type },
            { label: 'Fit Directive', value: body.fit_directive },
            { label: 'Highlight', value: body.highlight_zone || 'None specified' },
            { label: 'Minimise', value: body.minimise_zone || 'None specified' },
          ].map((row, i) => (
            <div key={i}>
              <DataLabel>{row.label}</DataLabel>
              <span className="text-xs text-black font-light">{row.value}</span>
            </div>
          ))}
        </div>

        {text && (
          <div className="mt-8 pt-6 border-t" style={{ borderColor: BORDER }}>
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

function ColourSection({ cls, text: _text }: { cls: ClassificationResult; text: string }) {
  const { colour } = cls;
  return (
    <div className="bg-white border-b" style={{ borderColor: BORDER }}>
      <SectionHeader label="Section 03 — Chromatic Harmony Map™" />
      <div className="p-6 md:p-10">
        <div className="flex items-center gap-4 mb-8">
          <GoldPill>{colour.undertone} Undertone · {colour.skin_tone_depth}</GoldPill>
          <span className="text-xs text-gray-400 font-light">{colour.season}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
          {/* Primary palette */}
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-5">Your Primary Palette</p>
            <motion.div
              className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {colour.primary_palette.map((c, i) => (
                <motion.div key={i} className="flex flex-col items-center gap-2" variants={staggerItem}>
                  <div
                    className="w-full rounded-xl border shadow-sm"
                    style={{ backgroundColor: c.hex, borderColor: BORDER, aspectRatio: '1/1.3' }}
                    title={`${c.name} — ${c.usage}`}
                  />
                  <span className="text-[8px] sm:text-[7px] font-bold text-gray-500 uppercase tracking-wide text-center leading-tight px-0.5">{c.name}</span>
                </motion.div>
              ))}
            </motion.div>
            {/* Colour usage notes */}
            <div className="space-y-1.5">
              {colour.primary_palette.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 border" style={{ backgroundColor: c.hex, borderColor: BORDER }} />
                  <span className="text-[10px] text-gray-500 font-light leading-snug">
                    <strong className="font-semibold text-gray-700">{c.name}</strong> — {c.usage}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Avoid + Neutrals */}
          <div className="space-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: '#ef4444' + 'aa' }}>Eliminate These</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {colour.colours_to_avoid.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-full rounded-lg border-2 border-red-200 relative shadow-sm overflow-hidden" style={{ backgroundColor: c.hex, aspectRatio: '1/1.3' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-px bg-red-400 rotate-45 absolute" style={{ opacity: 0.7 }} />
                        <div className="w-full h-px bg-red-400 -rotate-45 absolute" style={{ opacity: 0.7 }} />
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-red-400 uppercase tracking-wide text-center leading-tight">{c.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 font-light italic">{colour.colours_to_avoid.map(c => c.reason).join(' · ')}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Neutral Base</p>
              <div className="flex gap-3">
                {colour.neutral_base_colours.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-lg border shadow-sm" style={{ backgroundColor: c.hex, borderColor: BORDER }} />
                    <span className="text-[7px] text-gray-500 text-center leading-tight max-w-[44px]">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Accent</p>
              <div className="flex gap-3">
                {colour.accent_colours.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-lg border shadow-sm" style={{ backgroundColor: c.hex, borderColor: BORDER }} />
                    <span className="text-[7px] text-gray-500 text-center leading-tight max-w-[44px]">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-l-2 pl-4" style={{ borderColor: GOLD + '33' }}>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 italic" style={{ color: GOLD }}>Pattern & Fabric</p>
              <p className="text-xs text-gray-500 font-light italic">{colour.pattern_guidance}</p>
              <p className="text-xs text-gray-500 font-light italic mt-1">{colour.fabric_tone_guidance}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 04 — 16 Outfits
// ─────────────────────────────────────────────────────────────

function OutfitsSection({
  cls, text, outfitImageUrls, adminMode, onRegenerateOutfit,
}: {
  cls: ClassificationResult;
  text: string;
  outfitImageUrls?: (string | null)[];
  adminMode?: boolean;
  onRegenerateOutfit?: (outfitNumber: number, newText: string) => Promise<string | null>;
}) {
  const [editingNumber, setEditingNumber] = useState<number | null>(null);
  const [editText, setEditText]           = useState('');
  const [regenerating, setRegenerating]   = useState(false);
  const [retryingSet, setRetryingSet]     = useState<Set<number>>(new Set());
  const [imageOverrides, setImageOverrides] = useState<Record<number, string>>({});

  const startEdit = (outfitNumber: number) => {
    setEditText(extractOutfitBlock(text, outfitNumber));
    setEditingNumber(outfitNumber);
  };
  const cancelEdit = () => { setEditingNumber(null); setEditText(''); };

  const handleRegenerate = async () => {
    if (!editingNumber || !onRegenerateOutfit) return;
    setRegenerating(true);
    try {
      const newUrl = await onRegenerateOutfit(editingNumber, editText);
      if (newUrl) setImageOverrides(prev => ({ ...prev, [editingNumber]: newUrl }));
      cancelEdit();
    } finally {
      setRegenerating(false);
    }
  };

  // Quick retry for failed images — no editing, just re-fires generation with current outfit text.
  // Multiple retries can run simultaneously — each outfit tracks its own loading state.
  const handleQuickRetry = async (outfitNumber: number) => {
    if (!onRegenerateOutfit) return;
    setRetryingSet(prev => new Set(prev).add(outfitNumber));
    try {
      const outfitBlock = extractOutfitBlock(text, outfitNumber);
      const newUrl = await onRegenerateOutfit(outfitNumber, outfitBlock);
      if (newUrl) setImageOverrides(prev => ({ ...prev, [outfitNumber]: newUrl }));
    } finally {
      setRetryingSet(prev => { const next = new Set(prev); next.delete(outfitNumber); return next; });
    }
  };

  const categories = useMemo(() => parseOutfitCategories(text), [text]);
  const split      = cls.outfit_split;

  // Fallback: if parsing failed, render raw markdown
  if (categories.length === 0 || categories.every(c => c.outfits.length === 0)) {
    return (
      <div className="border-b" style={{ background: CREAM, borderColor: BORDER }}>
        <SectionHeader label={`Section 04 — Your ${split.total} Outfit Formulas`} />
        <div className="bg-white p-6 md:p-10">
          <RenderMarkdown text={text} />
        </div>
      </div>
    );
  }

  return (
    <div className="border-b" style={{ background: CREAM, borderColor: BORDER }}>
      <SectionHeader label={`Section 04 — Your ${split.total} Outfit Formulas`} />

      {categories.map((cat, ci) => (
        <div key={ci}>
          {/* Category header */}
          <div className="bg-white px-6 md:px-10 py-5 border-b" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: GOLD }}>{cat.name}</span>
              {split.categories.find(c => c.category.toLowerCase().includes(cat.name.toLowerCase().slice(0, 4))) && (
                <span className="text-[9px] text-gray-400 font-light">
                  {split.categories.find(c => c.category.toLowerCase().includes(cat.name.toLowerCase().slice(0, 4)))?.count} outfits
                </span>
              )}
            </div>
            {cat.intro && <p className="text-xs text-gray-500 font-light italic">{cat.intro}</p>}
          </div>

          {/* Outfit cards */}
          {cat.outfits.map((outfit, oi) => {
            const outfitImg   = imageOverrides[outfit.number] ?? outfitImageUrls?.[outfit.number - 1] ?? null;
            const isEditing   = editingNumber === outfit.number;
            const isRegenning = regenerating && isEditing;
            const canEdit     = adminMode && !!onRegenerateOutfit;
            const prioritiseImage = outfit.number <= 2;
            return (
            <motion.div
              key={oi}
              className="flex flex-col md:flex-row bg-white border-b"
              style={{ borderColor: BORDER }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: oi * 0.03, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
            >
              {/* Left: outfit image or number placeholder — 40% card width */}
              <div
                className="w-full md:w-2/5 flex-shrink-0 border-b md:border-b-0 md:border-r overflow-hidden relative"
                style={{ background: CREAM2, borderColor: BORDER, aspectRatio: '3/4' }}
              >
                {outfitImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={outfitImg}
                    alt={`Outfit ${outfit.number} — ${outfit.label}`}
                    loading={prioritiseImage ? 'eager' : 'lazy'}
                    fetchPriority={prioritiseImage ? 'high' : 'auto'}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    style={{ opacity: 0, transition: 'opacity 0.5s ease' }}
                    onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                  />
                ) : canEdit ? (
                  /* Error state — image failed, show retry button */
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6"
                    style={{ background: '#FFF8F8' }}>
                    <AlertCircle size={28} style={{ color: '#ef4444', opacity: 0.6 }} />
                    <div className="flex flex-col items-center gap-1 text-center">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: '#ef4444', opacity: 0.7 }}>
                        Image failed
                      </p>
                      <p className="text-[9px] text-gray-400 font-light">Generation did not complete</p>
                    </div>
                    <motion.button
                      onClick={() => handleQuickRetry(outfit.number)}
                      disabled={retryingSet.has(outfit.number)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded text-[9px] font-black uppercase tracking-widest disabled:opacity-40"
                      style={{ background: GOLD, color: '#fff' }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      transition={SPRING}
                    >
                      {retryingSet.has(outfit.number)
                        ? <><Loader2 size={10} className="animate-spin" /> Retrying…</>
                        : <><RefreshCw size={10} /> Retry</>
                      }
                    </motion.button>
                  </div>
                ) : (
                  /* Public placeholder */
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <p className="text-[80px] font-black leading-none select-none" style={{ color: GOLD + '18' }}>
                      {String(outfit.number).padStart(2, '0')}
                    </p>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-px" style={{ background: GOLD + '40' }} />
                      <p className="text-[8px] font-black uppercase tracking-[0.4em]" style={{ color: GOLD + '60' }}>
                        {cat.name}
                      </p>
                      <p className="text-[9px] font-light italic text-center px-6 leading-relaxed" style={{ color: '#9ca3af' }}>
                        {outfit.label}
                      </p>
                    </div>
                  </div>
                )}
                {/* Edit toggle button */}
                {canEdit && (
                  <motion.button
                    onClick={() => isEditing ? cancelEdit() : startEdit(outfit.number)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded opacity-70 hover:opacity-100"
                    style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}
                    title={isEditing ? 'Cancel edit' : 'Edit outfit'}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.9 }}
                    transition={SPRING}
                  >
                    {isEditing ? <X size={11} /> : <Pencil size={11} />}
                  </motion.button>
                )}
                {/* Regenerating overlay */}
                {isRegenning && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2"
                    style={{ background: 'rgba(0,0,0,0.55)' }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: GOLD }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white">Generating…</span>
                  </div>
                )}
              </div>

              {/* Right: outfit details OR inline editor */}
              <AnimatePresence mode="wait" initial={false}>
              {isEditing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.16 }}
                  className="flex-1 p-5 flex flex-col gap-3"
                  style={{ background: '#fafafa' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: GOLD }}>
                      Edit Outfit {outfit.number}
                    </span>
                    <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="flex-1 font-mono text-[11px] text-gray-800 bg-white border border-gray-200 rounded-lg p-3 resize-none leading-relaxed focus:outline-none focus:ring-1"
                    style={{ minHeight: 320, focusRingColor: GOLD } as React.CSSProperties}
                    spellCheck={false}
                  />
                  <motion.button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wide disabled:opacity-40"
                    style={{ background: GOLD, color: '#fff' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING}
                  >
                    {regenerating
                      ? <><Loader2 size={13} className="animate-spin" /> Regenerating…</>
                      : 'Regenerate Image'
                    }
                  </motion.button>
                </motion.div>
              ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16 }}
                className="flex-1 p-5 md:p-8 flex flex-col"
              >
                {/* Header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.5em] px-2 py-1" style={{ color: GOLD, background: GOLD + '12' }}>{cat.name}</span>
                    <span className="text-[9px] text-gray-300 font-light">#{String(outfit.number).padStart(2, '0')}</span>
                  </div>
                  <h3 className="text-lg md:text-2xl font-light italic text-black leading-tight">{outfit.label}</h3>
                </div>

                {/* Composition — clean stacked rows */}
                <div className="mb-6">
                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.35em] mb-3">Outfit Composition</p>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Top',         value: outfit.top },
                      { label: 'Bottom',      value: outfit.bottom },
                      { label: 'Layer',       value: outfit.layer },
                      { label: 'Footwear',    value: outfit.footwear },
                      { label: 'Accessories', value: outfit.accessories },
                    ].map(({ label, value }) => value && value !== '—' ? (
                      <div key={label} className="flex items-baseline gap-3">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] flex-shrink-0 w-20" style={{ color: GOLD + 'cc' }}>{label}</span>
                        <span className="text-[11px] text-gray-700 font-light leading-snug">{value}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px mb-5" style={{ background: BORDER }} />

                {/* Rationale */}
                <div className="space-y-4 flex-1">
                  {outfit.whyItWorks && outfit.whyItWorks !== '—' && (
                    <StylistNote>{outfit.whyItWorks}</StylistNote>
                  )}
                  {outfit.fitNote && outfit.fitNote !== '—' && (
                    <div>
                      <DataLabel>Fit Note</DataLabel>
                      <span className="text-[11px] text-gray-500 font-light leading-relaxed">{outfit.fitNote}</span>
                    </div>
                  )}
                  {outfit.colourLogic && outfit.colourLogic !== '—' && (
                    <div>
                      <DataLabel>Colour Logic</DataLabel>
                      <span className="text-[11px] text-gray-500 font-light leading-relaxed">{stripHex(outfit.colourLogic)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          );
          })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 05 — Style Rules
// ─────────────────────────────────────────────────────────────

function StyleRulesSection({ text }: { text: string }) {
  return (
    <div className="bg-white border-b" style={{ borderColor: BORDER }}>
      <SectionHeader label="Section 05 — Your Style Rules" />
      <div className="p-6 md:p-10">
        <RenderMarkdown text={text} />
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
    <div className="border-b" style={{ background: CREAM, borderColor: BORDER }}>
      <SectionHeader label="Section 06 — Your Style Identity" />
      <div className="bg-white p-6 md:p-10">
        <div className="max-w-2xl">
          <div className="border-l-4 pl-6" style={{ borderColor: GOLD }}>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-4 italic" style={{ color: GOLD }}>Personal Statement</p>
            <p className="text-sm text-gray-700 font-light leading-relaxed italic"
              dangerouslySetInnerHTML={{ __html: richify(body) }} />
          </div>
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
  adminMode?: boolean;
  onRegenerateOutfit?: (outfitNumber: number, newText: string) => Promise<string | null>;
}

function ManReport({ data, imageUrls, adminMode, onRegenerateOutfit }: ManReportProps) {
  const { classification: cls, sections } = data;

  return (
    <div style={{ background: CREAM, fontFamily: 'var(--font-geist-sans, system-ui)' }} className="overflow-x-hidden">
      {/* Sticky Nav */}
      <motion.div
        className="sticky top-0 z-10 border-b px-5 md:px-10 h-12 md:h-14 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderColor: BORDER }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 md:w-7 md:h-7 bg-black flex items-center justify-center">
            <span className="text-[9px] md:text-[10px] font-black" style={{ color: GOLD }}>I</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black">
            Iconik <span style={{ color: GOLD }}>Blueprint</span>
          </span>
        </div>
        <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.3em] text-gray-300">Pro Edition // 2026</span>
      </motion.div>

      {/* Report Header */}
      <div className="px-5 md:px-10 py-8 md:py-12 border-b bg-white" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-3 mb-4 text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: GOLD }}>
          <span>✓</span> Analysis Verified
        </div>
        <h2 className="text-[2.6rem] md:text-6xl italic tracking-tighter leading-none text-black font-light">
          The Lookbook
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          <GoldPill>{cls.body.silhouette_type} Build</GoldPill>
          <span className="px-3 py-1.5 border text-[9px] font-black uppercase tracking-widest text-gray-400"
            style={{ background: CREAM, borderColor: BORDER }}>
            {cls.face.face_shape} Face
          </span>
          <span className="px-3 py-1.5 border text-[9px] font-black uppercase tracking-widest text-gray-400"
            style={{ background: CREAM, borderColor: BORDER }}>
            {cls.outfit_split.total} Ensembles
          </span>
          <span className="px-3 py-1.5 border text-[9px] font-black uppercase tracking-widest text-gray-400"
            style={{ background: CREAM, borderColor: BORDER }}>
            {cls.colour.season}
          </span>
        </div>
      </div>

      {/* Style Brief Summary */}
      <div className="bg-white border-b px-6 md:px-10 py-6" style={{ borderColor: BORDER }}>
        <div className="flex items-start gap-6 flex-wrap">
          <div>
            <DataLabel>Aesthetic Direction</DataLabel>
            <p className="text-xs text-gray-600 font-light max-w-sm">{cls.style_brief.aesthetic_direction}</p>
          </div>
          <div>
            <DataLabel>Primary Vision</DataLabel>
            <p className="text-xs text-gray-600 font-light max-w-sm italic">&ldquo;{cls.style_brief.primary_brief}&rdquo;</p>
          </div>
          <div>
            <DataLabel>Register</DataLabel>
            <p className="text-xs text-black font-light">{cls.style_brief.register}</p>
          </div>
        </div>
      </div>

      {/* 6 Sections — each fades up as it scrolls into view */}
      {([
        <FaceSection   key="s1" cls={cls} text={sections.s1_face} hairstyleUrls={imageUrls?.hairstyleCards ?? undefined} eyewearUrls={imageUrls?.eyewearCards ?? undefined} />,
        <BodySection   key="s2" cls={cls} text={sections.s2_body} />,
        <ColourSection key="s3" cls={cls} text={sections.s3_colour} />,
        <OutfitsSection
          key="s4"
          cls={cls}
          text={sections.s4_outfits}
          outfitImageUrls={imageUrls?.outfitCards ?? undefined}
          adminMode={adminMode}
          onRegenerateOutfit={onRegenerateOutfit}
        />,
        <StyleRulesSection key="s5" text={sections.s5_rules} />,
        <IdentitySection   key="s6" text={sections.s6_identity} />,
      ]).map((section, i) => (
        <motion.div
          key={i}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          {section}
        </motion.div>
      ))}

      {/* Footer */}
      <div className="bg-white px-6 md:px-10 py-10 text-center border-t" style={{ borderColor: BORDER }}>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
          ICONIK Blueprint · Personal · Confidential
        </p>
      </div>
    </div>
  );
}

export default memo(ManReport);
