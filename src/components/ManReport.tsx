// ManReport.tsx
// Renders the full ICONIK Men's Blueprint report.
// Design matches the embedded report preview on /man landing page exactly.

import type { ReportData, ClassificationResult } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls } from '@/lib/manImageGenerator';

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

function getField(block: string, label: string): string {
  const pattern = new RegExp(`-\\s*${label}\\s*:\\s*(.+?)(?=\\n-|\\n\\n|\\n\\*\\*|$)`, 'si');
  return block.match(pattern)?.[1]?.replace(/\n/g, ' ').trim() ?? '—';
}

function parseOutfitCategories(text: string): OutfitCategory[] {
  // Split on outfit block headers, keeping them
  const outfitBlocks = text.split(/(?=\*\*Outfit\s+\d+)/i);

  // First block may contain category intro text before any outfit
  // Group outfits under their categories
  const categories: OutfitCategory[] = [];
  let currentCat: OutfitCategory | null = null;

  // Extract category intro lines (lines that don't start an outfit)
  const catIntroPattern = /^(?:\*\*)?(?:###\s*)?([A-Z][^*\n]{2,50})(?:\*\*)?[\s\n]/;

  for (const block of outfitBlocks) {
    const outfitMatch = block.match(/\*\*Outfit\s+(\d+)\s*[—–-]\s*([^*\n]+)\*\*/i);

    if (!outfitMatch) {
      // This is a category header block
      const catLine = block.split('\n').find(l => l.trim().length > 4 && !l.startsWith('#'));
      const catName = catLine?.replace(/\*\*/g, '').replace(/###/, '').trim() ?? '';
      if (catName && catName.length > 3 && catName.length < 60) {
        const introLines = block.split('\n').filter(l => l.trim() && !l.match(/^#+/) && !l.match(/\*\*Outfit/));
        const intro = introLines.slice(1).join(' ').trim();
        currentCat = { name: catName, intro, outfits: [] };
        categories.push(currentCat);
      }
      continue;
    }

    const outfit: ParsedOutfit = {
      number:      parseInt(outfitMatch[1]),
      label:       outfitMatch[2].trim(),
      top:         getField(block, 'Top'),
      bottom:      getField(block, 'Bottom'),
      layer:       getField(block, 'Layer(?:\\/Outerwear)?(?:\\/Layer)?'),
      footwear:    getField(block, 'Footwear'),
      accessories: getField(block, 'Accessories'),
      fitNote:     getField(block, 'Fit note'),
      colourLogic: getField(block, 'Colour logic'),
      whyItWorks:  getField(block, 'Why it works'),
    };

    if (!currentCat) {
      currentCat = { name: 'Outfits', intro: '', outfits: [] };
      categories.push(currentCat);
    }
    currentCat.outfits.push(outfit);
  }

  return categories.filter(c => c.outfits.length > 0);
}

// ─────────────────────────────────────────────────────────────
// Markdown renderer — handles ###, **bold**, - lists, paragraphs
// ─────────────────────────────────────────────────────────────

function boldify(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function RenderMarkdown({ text, skipH2 = true }: { text: string; skipH2?: boolean }) {
  const lines    = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (!listItems.length) return;
    elements.push(
      <ul key={key++} className="space-y-2 my-3">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: GOLD + '66' }} />
            <span
              className="text-xs text-gray-600 font-light leading-relaxed"
              dangerouslySetInnerHTML={{ __html: boldify(item) }}
            />
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith('## ') && skipH2) continue;

    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <p key={key++} className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mt-6 mb-3" style={{ color: '#9ca3af' }}>
          {line.slice(4)}
        </p>
      );
    } else if (line.match(/^(\*\*|__)[^*]+(\*\*|__)$/)) {
      // Standalone bold line = sub-label
      flushList();
      elements.push(
        <p key={key++} className="text-xs font-bold text-black mt-4 mb-1"
          dangerouslySetInnerHTML={{ __html: boldify(line) }} />
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
    } else if (line.trim()) {
      flushList();
      elements.push(
        <p key={key++} className="text-xs text-gray-600 font-light leading-relaxed my-1.5"
          dangerouslySetInnerHTML={{ __html: boldify(line) }} />
      );
    } else {
      flushList();
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

function FaceSection({ cls, text }: { cls: ClassificationResult; text: string }) {
  const { face } = cls;
  return (
    <div className="bg-white border-b" style={{ borderColor: BORDER }}>
      <SectionHeader label="Section 01 — Facial Architecture Analysis™" />
      <div className="p-6 md:p-10">
        <div className="flex items-center gap-4 mb-6">
          <GoldPill>{face.face_shape} Face</GoldPill>
          <span className="text-xs text-gray-400 font-light">{face.feature_type} feature type</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Recommended */}
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-5">Recommended For You</p>
            <div className="space-y-4">
              {face.neckline_recommendations.map((n, i) => (
                <div key={i}>
                  <DataLabel>Collar {i + 1}</DataLabel>
                  <span className="text-xs text-black font-light">{n}</span>
                </div>
              ))}
              <div>
                <DataLabel>Eyewear</DataLabel>
                <span className="text-xs text-black font-light">{face.eyewear_shapes.join(' · ')}</span>
              </div>
              <div>
                <DataLabel>Facial Hair</DataLabel>
                <span className="text-xs text-black font-light">{face.facial_hair_recommendations}</span>
              </div>
            </div>
          </div>

          {/* Hairstyles */}
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-5">Hairstyle Recommendations</p>
            <div className="space-y-3">
              {face.hairstyle_recommendations.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-[9px] font-black mt-0.5 flex-shrink-0" style={{ color: GOLD }}>0{i + 1}</span>
                  <span className="text-xs text-gray-600 font-light leading-relaxed">{h}</span>
                </div>
              ))}
            </div>

            {face.necklines_to_avoid.length > 0 && (
              <div className="mt-6">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: '#ef4444' + 'aa' }}>Avoid</p>
                <div className="space-y-2">
                  {face.necklines_to_avoid.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-200 mt-1.5 flex-shrink-0" />
                      <span className="text-xs text-gray-400 font-light">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <div className="space-y-3">
              {body.silhouette_rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-[9px] font-black mt-0.5 flex-shrink-0" style={{ color: GOLD }}>0{i + 1}</span>
                  <span className="text-xs text-black font-light leading-relaxed">{rule}</span>
                </div>
              ))}
            </div>
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

function ColourSection({ cls, text }: { cls: ClassificationResult; text: string }) {
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
            <div className="grid grid-cols-6 gap-2 mb-4">
              {colour.primary_palette.map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-full aspect-square rounded-lg border shadow-sm"
                    style={{ backgroundColor: c.hex, borderColor: BORDER }}
                    title={`${c.name} — ${c.usage}`}
                  />
                  <span className="text-[7px] font-bold text-gray-300 uppercase tracking-wide text-center leading-none">{c.hex}</span>
                </div>
              ))}
            </div>
            {/* Colour names */}
            <div className="space-y-1">
              {colour.primary_palette.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: c.hex }} />
                  <span className="text-[10px] text-gray-500 font-light">
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
                    <div className="w-full aspect-square rounded-lg border-2 border-red-200 relative shadow-sm" style={{ backgroundColor: c.hex }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-px bg-red-300 rotate-45 absolute" />
                        <div className="w-full h-px bg-red-300 -rotate-45 absolute" />
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-red-300 uppercase tracking-wide text-center">{c.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 font-light italic">{colour.colours_to_avoid.map(c => c.reason).join(' · ')}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Neutral Base</p>
              <div className="flex gap-2">
                {colour.neutral_base_colours.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-md" style={{ backgroundColor: c.hex }} />
                    <span className="text-[7px] text-gray-400 text-center leading-none">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Accent</p>
              <div className="flex gap-2">
                {colour.accent_colours.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-md" style={{ backgroundColor: c.hex }} />
                    <span className="text-[7px] text-gray-400 text-center leading-none">{c.name}</span>
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

function OutfitsSection({ cls, text, outfitImageUrls }: { cls: ClassificationResult; text: string; outfitImageUrls?: (string | null)[] }) {
  const categories = parseOutfitCategories(text);
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
            const outfitImg = outfitImageUrls?.[outfit.number - 1] ?? null;
            return (
            <div key={oi} className="flex flex-col md:flex-row bg-white border-b" style={{ borderColor: BORDER }}>
              {/* Left: outfit image or number placeholder */}
              <div
                className="w-full md:w-[180px] flex-shrink-0 border-r overflow-hidden flex items-center justify-center"
                style={{ background: CREAM2, borderColor: BORDER, minHeight: 200 }}
              >
                {outfitImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={outfitImg}
                    alt={`Outfit ${outfit.number} — ${outfit.label}`}
                    className="w-full h-full object-cover"
                    style={{ minHeight: 200 }}
                  />
                ) : (
                  <div className="text-center px-4">
                    <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: GOLD + '80' }}>Outfit</p>
                    <p className="text-3xl font-black text-gray-200">{String(outfit.number).padStart(2, '0')}</p>
                  </div>
                )}
              </div>

              {/* Right: outfit details */}
              <div className="flex-1 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: GOLD }}>{cat.name} Ensemble</span>
                  <div className="h-px w-8" style={{ background: GOLD + '44' }} />
                </div>
                <h3 className="text-2xl font-light italic text-black mb-5 leading-tight">{outfit.label}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  {/* Composition */}
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Composition</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Top',         value: outfit.top },
                        { label: 'Bottom',      value: outfit.bottom },
                        { label: 'Layer',       value: outfit.layer },
                        { label: 'Footwear',    value: outfit.footwear },
                        { label: 'Accessories', value: outfit.accessories },
                      ].map(({ label, value }) => value && value !== '—' ? (
                        <div key={label}>
                          <DataLabel>{label}</DataLabel>
                          <span className="text-xs text-black font-light leading-relaxed">{value}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="space-y-4">
                    {outfit.whyItWorks && outfit.whyItWorks !== '—' && (
                      <StylistNote>{outfit.whyItWorks}</StylistNote>
                    )}
                    {outfit.fitNote && outfit.fitNote !== '—' && (
                      <div>
                        <DataLabel>Fit Note</DataLabel>
                        <span className="text-xs text-gray-500 font-light leading-relaxed">{outfit.fitNote}</span>
                      </div>
                    )}
                    {outfit.colourLogic && outfit.colourLogic !== '—' && (
                      <div>
                        <DataLabel>Colour Logic</DataLabel>
                        <span className="text-xs text-gray-500 font-light leading-relaxed">{outfit.colourLogic}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
              dangerouslySetInnerHTML={{ __html: boldify(body) }} />
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
}

export default function ManReport({ data, imageUrls }: ManReportProps) {
  const { classification: cls, sections } = data;

  return (
    <div style={{ background: CREAM, fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      {/* Sticky Nav */}
      <div className="sticky top-0 z-10 border-b px-6 md:px-10 h-14 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderColor: BORDER }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-black flex items-center justify-center">
            <span className="text-[10px] font-black" style={{ color: GOLD }}>I</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black">
            Iconik <span style={{ color: GOLD }}>Blueprint</span>
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-300">Pro Edition // 2026</span>
      </div>

      {/* Report Header */}
      <div className="px-6 md:px-10 py-10 border-b bg-white" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-3 mb-3 text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: GOLD }}>
          <span>✓</span> Analysis Verified
        </div>
        <h2 className="text-4xl md:text-6xl italic tracking-tighter leading-none text-black font-light">
          The Lookbook
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <GoldPill>{cls.body.silhouette_type} Build</GoldPill>
          <span className="px-4 py-2 border text-[9px] font-black uppercase tracking-widest text-gray-400"
            style={{ background: CREAM, borderColor: BORDER }}>
            {cls.face.face_shape} Face
          </span>
          <span className="px-4 py-2 border text-[9px] font-black uppercase tracking-widest text-gray-400"
            style={{ background: CREAM, borderColor: BORDER }}>
            {cls.outfit_split.total} Ensembles
          </span>
          <span className="px-4 py-2 border text-[9px] font-black uppercase tracking-widest text-gray-400"
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

      {/* 6 Sections */}
      <FaceSection   cls={cls} text={sections.s1_face} />
      <BodySection   cls={cls} text={sections.s2_body} />
      <ColourSection cls={cls} text={sections.s3_colour} />
      <OutfitsSection cls={cls} text={sections.s4_outfits} outfitImageUrls={imageUrls?.outfitCards ?? undefined} />
      <StyleRulesSection text={sections.s5_rules} />
      <IdentitySection   text={sections.s6_identity} />

      {/* Footer */}
      <div className="bg-white px-6 md:px-10 py-10 text-center border-t" style={{ borderColor: BORDER }}>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
          ICONIK Blueprint · Personal · Confidential
        </p>
      </div>
    </div>
  );
}
