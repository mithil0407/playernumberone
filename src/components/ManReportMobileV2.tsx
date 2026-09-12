'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Download,
  Eye,
  Grid3x3,
  Palette,
  Ruler,
  Scissors,
  Share2,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import type { ReportData } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls } from '@/lib/manImageGenerator';
import { formatManReportOpeningNeed } from '@/lib/manReportPresentation';
import {
  buildFallbackSearchUrl,
  buildTrustedBrandSearch,
  type ManShoppingSlotName,
} from '@/lib/manShopping';

/* ────────────────────────────────────────────────────────────
   ICONIK Man — Blueprint, mobile.

   Two modes, because the report has two jobs that want opposite
   designs. The Reveal is the first viewing: paced, once, and it
   ends at a door. The Reference is every viewing after: fast,
   dense, and built to answer a question in a changing room.
   ──────────────────────────────────────────────────────────── */


const SEEN_KEY = 'iconik-bp-m2-seen:';
const SAVED_KEY = 'iconik-bp-m2-saved:';

type Mode = 'checking' | 'cover' | 'reveal' | 'reference';

interface Props {
  shareToken: string;
  data: ReportData;
  imageUrls?: ResolvedImageUrls | null;
  stylistReviewed?: boolean;
}

/** Garment rows map onto the shopping pipeline's four shoppable slots. */
const SHOPPING_SLOT_BY_KEY: Record<string, ManShoppingSlotName | undefined> = {
  top: 'top',
  layer: 'layer',
  bottom: 'bottom',
  footwear: 'footwear',
};

/* ── text helpers ─────────────────────────────────────────── */

function clean(v: string) {
  return (v || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();
}

function titleCase(v: string) {
  return (v || '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
}

function sentence(v: string) {
  const t = clean(v);
  if (!t) return '';
  const s = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(s) ? s : s + '.';
}

function fieldFrom(block: string, label: string) {
  const m = block.match(new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?${label}(?:\\*\\*)?\\s*:\\s*(.+)`, 'i'));
  return clean(m?.[1] ?? '');
}

/* ── outfit parsing ───────────────────────────────────────── */

export interface ParsedOutfit {
  number: number;
  context: string;
  top: string;
  layer: string;
  bottom: string;
  footwear: string;
  accessories: string;
  occasion: string;
}

function parseOutfits(data: ReportData): ParsedOutfit[] {
  const source = data.sections.s4_outfits || '';
  const re = /(?:^|\n)\s*(?:\*\*)?OUTFIT\s+(\d+)\s*[—–-]\s*([^\n*]+?)(?:\*\*)?\s*\n([\s\S]*?)(?=\n\s*(?:\*\*)?OUTFIT\s+\d+\s*[—–-]|$)/gi;
  const out: ParsedOutfit[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const block = m[3] || '';
    out.push({
      number: Number(m[1]),
      context: clean(m[2]),
      top: fieldFrom(block, 'TOP'),
      layer: fieldFrom(block, 'LAYER'),
      bottom: fieldFrom(block, 'BOTTOM'),
      footwear: fieldFrom(block, 'FOOTWEAR'),
      accessories: fieldFrom(block, 'ACCESSORIES'),
      occasion: fieldFrom(block, 'OCCASION ANCHOR'),
    });
  }
  return out;
}

const GARMENT_KEYS = ['top', 'layer', 'bottom', 'footwear', 'accessories'] as const;

function garmentRows(o: ParsedOutfit) {
  return GARMENT_KEYS
    .map(k => ({ key: k, label: titleCase(k), value: o[k] }))
    .filter(r => r.value && !/^none$/i.test(r.value));
}

/* ── combination parsing (recovers a section the old report drops) ── */

interface ParsedCombo {
  group: string;
  title: string;
  summary: string;
  logic: string;
  sourceOutfit: number | null;
}

function parseCombos(data: ReportData): ParsedCombo[] {
  const src = data.sections.s4_combo_grids || '';
  if (!src.trim()) return [];
  const out: ParsedCombo[] = [];
  let group = '';
  const chunks = src.split(/\n(?=###\s)/);
  for (const chunk of chunks) {
    const gm = chunk.match(/^###\s+(?!#)(.+)/);
    if (gm) group = clean(gm[1]);
    const re = /####\s+(.+?)\n([\s\S]*?)(?=\n####\s|\n###\s|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(chunk)) !== null) {
      const body = m[2];
      const sm = body.match(/Source:\s*Derived from Outfit\s*#?(\d+)/i);
      out.push({
        group,
        title: clean(m[1]),
        summary: fieldFrom(body, 'Outfit summary'),
        logic: fieldFrom(body, 'Logic'),
        sourceOutfit: sm ? Number(sm[1]) : null,
      });
    }
  }
  return out;
}

/* ── minimal markdown for the Reference chapters ──────────── */

function Markdown({ source }: { source?: string }) {
  const blocks = useMemo(() => {
    if (!source) return [] as ReactNode[];
    const lines = source.split('\n');
    const nodes: ReactNode[] = [];
    let bullets: { label: string; text: string }[] = [];
    let key = 0;

    const flush = () => {
      if (!bullets.length) return;
      const items = bullets;
      bullets = [];
      nodes.push(
        <ul className="md-list" key={`u${key++}`}>
          {items.map((b, i) => (
            <li key={i}>
              {b.label ? <span className="md-term">{b.label}</span> : null}
              <span className="md-def">{b.text}</span>
            </li>
          ))}
        </ul>,
      );
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { flush(); continue; }
      if (/^##\s+SECTION/i.test(line)) continue;           // chapter titles come from our nav
      if (/^####\s+/.test(line)) { flush(); nodes.push(<h4 className="md-h4" key={`h${key++}`}>{clean(line.replace(/^####\s+/, ''))}</h4>); continue; }
      if (/^###\s+/.test(line)) { flush(); nodes.push(<h3 className="md-h3" key={`h${key++}`}>{clean(line.replace(/^###\s+/, ''))}</h3>); continue; }
      if (/^##\s+/.test(line)) { flush(); nodes.push(<h3 className="md-h3" key={`h${key++}`}>{clean(line.replace(/^##\s+/, ''))}</h3>); continue; }
      if (/^[-*]\s+/.test(line)) {
        const rest = line.replace(/^[-*]\s+/, '');
        const lm = rest.match(/^\*\*(.+?):?\*\*:?\s*(.*)$/);
        if (lm) bullets.push({ label: clean(lm[1]), text: clean(lm[2]) });
        else bullets.push({ label: '', text: clean(rest) });
        continue;
      }
      flush();
      nodes.push(<p className="md-p" key={`p${key++}`}>{clean(line)}</p>);
    }
    flush();
    return nodes;
  }, [source]);

  return <div className="md">{blocks}</div>;
}

/* ── small pieces ─────────────────────────────────────────── */

function Swatch({ hex, name, sub, size = 'md' }: { hex: string; name: string; sub?: string; size?: 'sm' | 'md' }) {
  return (
    <div className={`sw sw-${size}`}>
      <i style={{ background: hex }} />
      <span className="sw-name">{name}</span>
      {sub ? <span className="sw-sub">{sub}</span> : null}
    </div>
  );
}

function Figure({ src, alt, ratio, priority }: { src?: string | null; alt: string; ratio?: string; priority?: boolean }) {
  if (!src) return null;
  return (
    <div className="fig" style={{ aspectRatio: ratio || '3 / 4' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" />
    </div>
  );
}

/* ── the reveal beats ─────────────────────────────────────── */

function Beat({ children, tone }: { children: ReactNode; tone?: 'ink' | 'slate' | 'warm' }) {
  return <section className={`beat beat-${tone || 'ink'}`}>{children}</section>;
}

/* The drape is a two-panel image. Showing both at once throws the
   comparison away — so the wrong colour lands alone first, and the
   right one arrives beside it only when he taps. */
function DrapeReveal({ src, wrongName, rightName, verdict }: {
  src?: string | null; wrongName: string; rightName: string; verdict: string;
}) {
  const [open, setOpen] = useState(false);
  const [panelAspect, setPanelAspect] = useState<number | null>(null);
  const reduce = useReducedMotion();
  if (!src) return null;

  const capturePanelAspect = (image: HTMLImageElement) => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    setPanelAspect((image.naturalWidth / 2) / image.naturalHeight);
  };

  return (
    <div className="drape">
      <div className={`drape-stage ${open ? 'is-open' : ''}`}>
        <div className="drape-cell" style={{ aspectRatio: panelAspect ?? '3 / 4' }}>
          <span className="drape-img drape-img-left">
            {/* One source contains both colour panels. It is cropped across two
                viewports instead of stretched to a hard-coded aspect ratio. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${wrongName} colour comparison`} loading="lazy" decoding="async" onLoad={event => capturePanelAspect(event.currentTarget)} />
          </span>
          <span className="drape-tag drape-tag-wrong">{wrongName}</span>
        </div>
        <motion.div
          className="drape-cell"
          style={{ aspectRatio: panelAspect ?? '3 / 4' }}
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden={!open}
        >
          <span className="drape-img drape-img-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${rightName} colour comparison`} loading="lazy" decoding="async" />
          </span>
          <span className="drape-tag drape-tag-right">{rightName}</span>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {!open ? (
          <motion.div key="a" className="drape-copy" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <p className="beat-body">This is <em>{wrongName.toLowerCase()}</em> against your skin. It is also, roughly, what most of your wardrobe is doing to you right now.</p>
            <button type="button" className="btn-line" onClick={() => setOpen(true)}>
              Now show me mine <ArrowDown size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.div key="b" className="drape-copy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.45 }}>
            <p className="beat-body">{sentence(verdict)}</p>
            <p className="drape-note">Same face. Same light. Same camera. Only the colour changed.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── verdict card, built to be screenshotted ──────────────── */

function VerdictCard({ data, blueprintNo }: { data: ReportData; blueprintNo: string }) {
  const c = data.classification;
  const [shared, setShared] = useState(false);
  const share = useCallback(async () => {
    const text = `My ICONIK Blueprint — ${titleCase(c.body.silhouette_type)} frame · ${titleCase(c.colour.season)} · ${titleCase(c.face.face_shape)} face`;
    try {
      if (navigator.share) await navigator.share({ title: 'My ICONIK Blueprint', text });
      else { await navigator.clipboard.writeText(text); setShared(true); setTimeout(() => setShared(false), 2200); }
    } catch { /* dismissed */ }
  }, [c]);

  return (
    <div className="vcard">
      <div className="vcard-top">
        <span className="vcard-mark">ICONIK</span>
        <span className="vcard-no">No. {blueprintNo}</span>
      </div>
      <div className="vcard-rows">
        <div><span>Frame</span><b>{titleCase(c.body.silhouette_type)}</b></div>
        <div><span>Palette</span><b>{titleCase(c.colour.season)}</b></div>
        <div><span>Face</span><b>{titleCase(c.face.face_shape)}</b></div>
      </div>
      <div className="vcard-strip">
        {c.colour.primary_palette.slice(0, 6).map(p => <i key={p.hex} style={{ background: p.hex }} />)}
      </div>
      <button type="button" className="btn-line vcard-share" onClick={share}>
        {shared ? <><Check size={14} /> Copied</> : <><Share2 size={14} /> Share your verdict</>}
      </button>
    </div>
  );
}

/* ── shopping mode: the pocket card ───────────────────────── */

function PocketCard({ data, onClose }: { data: ReportData; onClose: () => void }) {
  const c = data.classification;
  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-label="Shopping mode">
      <button type="button" className="sheet-scrim" onClick={onClose} aria-label="Close" />
      <motion.div className="sheet pocket" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <div>
            <span className="eyebrow">Shopping mode</span>
            <h3 className="sheet-title">In the changing room</h3>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="pocket-body">
          <div className="pocket-block">
            <span className="pocket-label">Yours — buy in these</span>
            <div className="pocket-sw">
              {c.colour.primary_palette.map(p => <Swatch key={p.hex} hex={p.hex} name={p.name} size="sm" />)}
            </div>
          </div>

          {c.colour.neutral_base_colours?.length ? (
            <div className="pocket-block">
              <span className="pocket-label">Safe neutrals</span>
              <div className="pocket-sw">
                {c.colour.neutral_base_colours.map(p => <Swatch key={p.hex} hex={p.hex} name={p.name} size="sm" />)}
              </div>
            </div>
          ) : null}

          <div className="pocket-block">
            <span className="pocket-label pocket-label-no">Put it back</span>
            <div className="pocket-sw">
              {c.colour.colours_to_avoid.map(p => <Swatch key={p.hex} hex={p.hex} name={p.name} size="sm" />)}
            </div>
          </div>

          <div className="pocket-block">
            <span className="pocket-label">Fit rules</span>
            <ul className="pocket-list">
              {c.body.silhouette_rules.map(r => <li key={r}><Check size={13} />{r}</li>)}
              {c.body.avoid_cuts.map(r => <li className="no" key={r}><X size={13} />{r}</li>)}
            </ul>
          </div>

          <div className="pocket-block">
            <span className="pocket-label">Near your face</span>
            <ul className="pocket-list">
              <li><Check size={13} />{c.face.eyewear_shapes?.[0] || 'Round or soft-cornered frames'}</li>
              <li><Check size={13} />{sentence(c.colour.pattern_guidance)}</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── outfit detail sheet ──────────────────────────────────── */

function OutfitSheet({ outfit, image, onClose, saved, onToggleSave }: {
  outfit: ParsedOutfit; image?: string | null; onClose: () => void;
  saved: boolean; onToggleSave: () => void;
}) {
  const rows = garmentRows(outfit);
  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-label={`Outfit ${outfit.number}`}>
      <button type="button" className="sheet-scrim" onClick={onClose} aria-label="Close" />
      <motion.div className="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <div>
            <span className="eyebrow">Outfit {String(outfit.number).padStart(2, '0')}</span>
            <h3 className="sheet-title">{titleCase(outfit.context)}</h3>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="sheet-body">
          <Figure src={image} alt={`Outfit ${outfit.number}`} ratio="2 / 3" priority />
          <dl className="spec">
            {rows.map(r => {
              const slotName = SHOPPING_SLOT_BY_KEY[r.key];
              // The search is rebuilt from this garment's descriptor, so it keeps
              // working when a curated product sells out or a slot never ranked.
              const trusted = slotName ? buildTrustedBrandSearch(r.value) : null;
              return (
                <div key={r.key}>
                  <dt>{r.label}</dt>
                  <dd>
                    {r.value}
                    {trusted ? (
                      <span className="shop-block">
                        <a className="shop-go" href={trusted.url} target="_blank" rel="noopener noreferrer nofollow">
                          Shop this piece <ArrowUpRight size={13} />
                        </a>
                        <span className="shop-brands">Recommended: {[...trusted.categorySpecialists, ...trusted.popularBrands].slice(0, 6).join(' · ')}</span>
                        <a className="shop-wide" href={buildFallbackSearchUrl(r.value)} target="_blank" rel="noopener noreferrer nofollow">
                          Broaden the search
                        </a>
                      </span>
                    ) : null}
                  </dd>
                </div>
              );
            })}
          </dl>
          {outfit.occasion ? (
            <p className="occasion"><Sparkles size={13} /> {outfit.occasion}</p>
          ) : null}
          <div className="sheet-actions">
            <button type="button" className={`btn-chip ${saved ? 'on' : ''}`} onClick={onToggleSave}>
              {saved ? <><Check size={14} /> Saved</> : <>Save to my looks</>}
            </button>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── deliverable mocks ──
   The headshot and the social frames are worth more shown in place
   than shown as files: he sees exactly what they will look like
   where he is actually going to use them. */

function LinkedInMock({ data, imageUrl }: { data: ReportData; imageUrl?: string | null }) {
  const sb = data.classification.style_brief;
  const headline = clean(sb.primary_brief || sb.key_aspiration) || 'Polished professional presence';
  // location_region carries the intake's full tier descriptor
  // ("India — Tier 1 (Mumbai, Delhi, ...)"); a profile line wants the place.
  const location = clean((data.classification.client.location_region || '').split(/[—–(]/)[0])
    || 'Your location';
  return (
    <div className="li-mock">
      <div className="li-cover"><span className="li-badge">in</span></div>
      <div className="li-body">
        <div className="li-avatar">
          {imageUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={imageUrl} alt="Your LinkedIn headshot" loading="lazy" decoding="async" />
            : <span>Photo</span>}
        </div>
        <div className="li-pills"><span>Open to</span><span>Add section</span></div>
        <h4 className="li-name">Your professional profile</h4>
        <p className="li-headline">{headline}</p>
        <p className="li-loc">{location} · Contact info</p>
        <div className="li-about">
          <span className="pocket-label">About your visual presence</span>
          <p>{data.deliverables?.linkedinHeadshotSpec}</p>
        </div>
        {imageUrl ? (
          <a className="btn-chip li-dl" href={imageUrl} target="_blank" rel="noopener noreferrer" download>
            <Download size={14} /> Save headshot
          </a>
        ) : null}
      </div>
    </div>
  );
}

function InstagramMock({ data, imageUrls, avatarUrl }: {
  data: ReportData; imageUrls?: (string | null)[]; avatarUrl?: string | null;
}) {
  const shots = data.deliverables?.datingProfileShots ?? [];
  const live = (imageUrls ?? []).filter(Boolean).length;
  return (
    <div className="ig-mock">
      <div className="ig-bar"><strong>iconik.men</strong><span>•••</span></div>
      <div className="ig-head">
        <div className="ig-avatar">
          {avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatarUrl} alt="Your profile" loading="lazy" decoding="async" />
            : <span>ICONIK</span>}
        </div>
        <div className="ig-stats">
          <div><strong>{live}</strong><span>posts</span></div>
          <div><strong>Your</strong><span>blueprint</span></div>
        </div>
      </div>
      <div className="ig-tabs"><i /></div>
      <div className="ig-grid">
        {[0, 1, 2].map(i => {
          const url = imageUrls?.[i];
          return url ? (
            <a className="ig-tile" key={i} href={url} target="_blank" rel="noopener noreferrer" download>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={shots[i]?.title ?? `Social frame ${i + 1}`} loading="lazy" decoding="async" />
              <i className="ig-dl"><Download size={12} /></i>
            </a>
          ) : (
            <div className="ig-tile ig-tile-empty" key={i}>{i + 1}</div>
          );
        })}
      </div>
    </div>
  );
}

/* ── main ─────────────────────────────────────────────────── */

export default function ManReportMobileV2({ shareToken, data, imageUrls, stylistReviewed = false }: Props) {
  const c = data.classification;
  const outfits = useMemo(() => parseOutfits(data), [data]);
  const combos = useMemo(() => parseCombos(data), [data]);
  const reduce = useReducedMotion();

  const blueprintNo = useMemo(() => {
    const n = parseInt(shareToken.replace(/[^0-9a-f]/gi, '').slice(0, 5), 16);
    return String((Number.isFinite(n) ? n : 0) % 9000 + 1000);
  }, [shareToken]);

  const dateLabel = useMemo(() => {
    const d = data.generated_at ? new Date(data.generated_at) : new Date();
    if (Number.isNaN(d.getTime())) return 'Date prepared on request';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [data.generated_at]);

  const [mode, setMode] = useState<Mode>('checking');
  const [chapter, setChapter] = useState('outfits');
  const [openOutfit, setOpenOutfit] = useState<ParsedOutfit | null>(null);
  const [pocket, setPocket] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);
  const chapterNavRef = useRef<HTMLElement>(null);

  // Returning readers land in the Reference — the ceremony is a first-night thing.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('reveal');
    if (p === '1' || p === 'replay') { setMode('cover'); return; }
    try {
      setMode(localStorage.getItem(SEEN_KEY + shareToken) ? 'reference' : 'cover');
      const raw = localStorage.getItem(SAVED_KEY + shareToken);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSaved(parsed.filter(value => Number.isInteger(value) && value > 0));
        }
      }
    } catch { setMode('cover'); }
  }, [shareToken]);

  // Treat outfit and shopping sheets like real mobile dialogs: freeze the
  // document behind them, support Escape, and return focus to the opener.
  useEffect(() => {
    if (!openOutfit && !pocket) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('.sheet-root .icon-btn')?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (openOutfit) setOpenOutfit(null);
      else setPocket(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [openOutfit, pocket]);

  const finishReveal = useCallback(() => {
    try { localStorage.setItem(SEEN_KEY + shareToken, new Date().toISOString()); } catch { /* ignore */ }
    setMode('reference');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [shareToken]);

  const toggleSave = useCallback((n: number) => {
    setSaved(prev => {
      const next = prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n];
      try { localStorage.setItem(SAVED_KEY + shareToken, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [shareToken]);

  const outfitImage = useCallback((n: number) => imageUrls?.outfitCards?.[n - 1] ?? null, [imageUrls]);
  const heroNumber = data.deliverables?.strongestOutfitNumber || 1;
  const heroOutfit = outfits.find(o => o.number === heroNumber) || outfits[0];

  const chapters = useMemo(() => ([
    { id: 'outfits', label: 'Outfits', icon: Grid3x3 },
    { id: 'colour', label: 'Colour', icon: Palette },
    { id: 'fit', label: 'Fit', icon: Ruler },
    { id: 'face', label: 'Face', icon: User },
    { id: 'grooming', label: 'Grooming', icon: Scissors },
    { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
    { id: 'shots', label: 'Your shots', icon: Eye },
  ]), []);

  const jumpChapter = useCallback((id: string) => {
    setChapter(id);
    const el = document.getElementById(`ch-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(top, 0), behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [reduce]);

  // Keep the chapter pill in sync with what is actually on screen.
  useEffect(() => {
    if (mode !== 'reference') return;
    const els = chapters.map(ch => document.getElementById(`ch-${ch.id}`)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) setChapter(e.target.id.replace('ch-', ''));
      }
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [mode, chapters]);

  // Keep the active chapter visible inside the horizontally scrolling rail.
  useEffect(() => {
    if (mode !== 'reference') return;
    const nav = chapterNavRef.current;
    const active = nav?.querySelector<HTMLElement>(`[data-chapter="${chapter}"]`);
    if (!nav || !active) return;
    const left = active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2;
    nav.scrollTo({ left: Math.max(left, 0), behavior: reduce ? 'auto' : 'smooth' });
  }, [chapter, mode, reduce]);

  const wrongColour = c.colour.colours_to_avoid?.[0]?.name || 'The wrong colour';
  const rightColour = c.colour.primary_palette?.[0]?.name || 'Yours';
  const reviewLabel = stylistReviewed ? 'Prepared and reviewed by an ICONIK stylist' : 'Your personal Blueprint is ready';
  const reviewSignature = stylistReviewed ? 'Reviewed and signed off by your ICONIK stylist' : 'Prepared as your personal ICONIK Blueprint';

  if (mode === 'checking') {
    return (
      <main className="bp">
        <section className="cover cover-checking" aria-label="Preparing your Blueprint">
          <div className="cover-grain" aria-hidden="true" />
          <span className="cover-mark">ICONIK</span>
          <i className="checking-rule" />
          <span className="eyebrow">Preparing your Blueprint</span>
        </section>
        <Styles />
      </main>
    );
  }

  /* ── cover ─────────────────────────────────────────────── */
  if (mode === 'cover') {
    return (
      <main className="bp">
        <section className="cover">
          <div className="cover-grain" aria-hidden="true" />
          <div className="cover-in">
            <span className="cover-mark">ICONIK</span>
            <div className="cover-rule" />
            <span className="eyebrow cover-no">Blueprint No. {blueprintNo}</span>
            <h1 className="cover-title">The<br /><em>Blueprint.</em></h1>
            <div className="cover-verdict">
              <span><small>Frame</small><strong>{titleCase(c.body.silhouette_type)}</strong></span>
              <span><small>Palette</small><strong>{titleCase(c.colour.season)}</strong></span>
              <span><small>Face</small><strong>{titleCase(c.face.face_shape)}</strong></span>
            </div>
            <p className="cover-meta">
              {reviewLabel}<br />
              <span>{dateLabel}</span>
            </p>
            <button type="button" className="btn-solid" onClick={() => setMode('reveal')}>
              Open your Blueprint <ArrowDown size={15} />
            </button>
            <p className="cover-foot">Personal · Confidential · Yours to keep</p>
          </div>
        </section>
        <Styles />
      </main>
    );
  }

  /* ── reveal ────────────────────────────────────────────── */
  if (mode === 'reveal') {
    return (
      <main className="bp">
        <header className="rv-nav">
          <span className="rv-mark">ICONIK</span>
          <button type="button" className="rv-skip" onClick={finishReveal}>Skip <X size={13} /></button>
        </header>

        {/* His own words, before anything we made */}
        <Beat tone="ink">
          <span className="eyebrow">What you came in with</span>
          {/* Presented as a finding, not a quotation: style_blocker is generated
              from the intake, not the client's own words. Only render this as a
              quote once verbatim intake text (freeTextNote) is carried through. */}
          <p className="opening-line">{formatManReportOpeningNeed(c.style_brief.style_blocker, c.body.silhouette_type)}</p>
          <p className="beat-body">
            That was never a taste problem. It is four decisions nobody has ever made for you —
            your face, your frame, your colour and the way they combine. We made them.
          </p>
          <p className="beat-goal"><span>Your goal</span>{sentence(c.style_brief.key_aspiration)}</p>
        </Beat>

        <Beat tone="ink">
          <span className="eyebrow">01 · Your face</span>
          <h2 className="beat-title">{titleCase(c.face.face_shape)}.</h2>
          <Figure src={imageUrls?.diagnostic?.faceGeometry} alt="Your face geometry" priority />
          <p className="beat-body">{sentence(data.diagnostics?.faceGeometryVerdict || c.face.facial_hair_recommendations)}</p>
        </Beat>

        <Beat tone="slate">
          <span className="eyebrow">02 · Your frame</span>
          <h2 className="beat-title">{titleCase(c.body.silhouette_type)}.</h2>
          <Figure src={imageUrls?.diagnostic?.frameFront} alt="Your frame, front" />
          <p className="beat-body">{sentence(data.diagnostics?.frameFrontVerdict || c.body.fit_directive)}</p>
          {/* The side profile is generated for every report and has never been shown. */}
          {imageUrls?.diagnostic?.frameSide ? (
            <>
              <Figure src={imageUrls.diagnostic.frameSide} alt="Your frame, side" />
              <p className="beat-body beat-body-sm">{sentence(data.diagnostics?.frameSideVerdict || '')}</p>
            </>
          ) : null}
        </Beat>

        <Beat tone="warm">
          <span className="eyebrow">03 · Your colour</span>
          <h2 className="beat-title">{titleCase(c.colour.season)}.</h2>
          <DrapeReveal
            src={imageUrls?.diagnostic?.colourDrape}
            wrongName={wrongColour}
            rightName={rightColour}
            verdict={data.diagnostics?.colourDrapeVerdict || ''}
          />
          <div className="pal">
            {c.colour.primary_palette.map(p => <Swatch key={p.hex} hex={p.hex} name={p.name} sub={p.usage} />)}
          </div>
        </Beat>

        {heroOutfit ? (
          <Beat tone="ink">
            <span className="eyebrow">04 · Put together</span>
            <h2 className="beat-title">Your strongest look.</h2>
            <Figure src={outfitImage(heroOutfit.number)} alt={`Outfit ${heroOutfit.number}`} ratio="2 / 3" />
            <dl className="spec">
              {garmentRows(heroOutfit).map(r => (
                <div key={r.key}><dt>{r.label}</dt><dd>{r.value}</dd></div>
              ))}
            </dl>
            {heroOutfit.occasion ? <p className="occasion"><Sparkles size={13} /> {heroOutfit.occasion}</p> : null}
          </Beat>
        ) : null}

        <Beat tone="ink">
          <span className="eyebrow">Your verdict</span>
          <h2 className="beat-title">Three words that end the guessing.</h2>
          <VerdictCard data={data} blueprintNo={blueprintNo} />
        </Beat>

        {/* The door — a reveal has to end somewhere that isn't the beginning */}
        <section className="door">
          <span className="eyebrow">That&apos;s the direction</span>
          <h2 className="door-title">Everything else lives in your Reference.</h2>
          <p className="door-body">
            {outfits.length} complete outfits, your shopping plan, grooming, and the pocket card
            you&apos;ll actually open in a changing room.
          </p>
          <button type="button" className="btn-solid" onClick={finishReveal}>
            Open the Reference <ArrowUpRight size={15} />
          </button>
          <p className="door-sig">{reviewSignature} · {dateLabel}</p>
        </section>

        <Styles />
      </main>
    );
  }

  /* ── reference ─────────────────────────────────────────── */
  return (
    <main className="bp bp-ref">
      <header className="ref-nav">
        <div className="ref-nav-top">
          <span className="rv-mark">ICONIK</span>
          <span className="ref-no">No. {blueprintNo}</span>
          <button type="button" className="ref-pocket" onClick={() => setPocket(true)}>
            <ShoppingBag size={14} /> Shopping mode
          </button>
        </div>
        <nav className="ref-chips" aria-label="Chapters" ref={chapterNavRef}>
          {chapters.map(ch => (
            <button
              type="button"
              key={ch.id}
              data-chapter={ch.id}
              className={chapter === ch.id ? 'on' : ''}
              aria-current={chapter === ch.id ? 'location' : undefined}
              onClick={() => jumpChapter(ch.id)}
            >
              <ch.icon size={13} />{ch.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="ref-body">

        {/* Contact sheet — the wardrobe as one object, not a 29,000px wall */}
        <section id="ch-outfits" className="ch">
          <span className="eyebrow">Your wardrobe</span>
          <h2 className="ch-title">{outfits.length} looks, at a glance.</h2>
          <p className="ch-lede">Tap any look for the full breakdown and where to shop it.</p>
          <div className="sheet-grid">
            {outfits.map(o => {
              const image = outfitImage(o.number);
              return (
                <button type="button" key={o.number} className="tile" onClick={() => setOpenOutfit(o)} aria-label={`Open outfit ${o.number}: ${o.context}`}>
                  <span className={`tile-img ${image ? '' : 'missing'}`}>
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={`Outfit ${o.number}: ${o.context}`}
                        loading={o.number <= 3 ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={o.number <= 3 ? 'high' : 'auto'}
                        onLoad={event => event.currentTarget.parentElement?.classList.add('loaded')}
                        onError={event => event.currentTarget.parentElement?.classList.add('missing')}
                      />
                    ) : <span className="tile-blank">Image pending</span>}
                    {saved.includes(o.number) ? <i className="tile-save"><Check size={11} /></i> : null}
                  </span>
                  <span className="tile-n">{String(o.number).padStart(2, '0')}</span>
                  <span className="tile-ctx">{o.context}</span>
                </button>
              );
            })}
          </div>

          {saved.length ? (
            <div className="saved-strip">
              <span className="eyebrow">Your saved looks</span>
              <div className="saved-row">
                {saved.map(n => {
                  const o = outfits.find(x => x.number === n);
                  if (!o) return null;
                  return (
                    <button type="button" key={n} className="saved-chip" onClick={() => setOpenOutfit(o)}>
                      {String(n).padStart(2, '0')} · {o.context}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Combinations — written in every report, rendered in none of them */}
          {combos.length ? (
            <div className="combos">
              <span className="eyebrow">Repeatable combinations</span>
              <h3 className="ch-sub">Formulas, not costumes.</h3>
              {combos.map(cb => (
                <div className="combo" key={cb.title}>
                  {cb.sourceOutfit && outfitImage(cb.sourceOutfit) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={outfitImage(cb.sourceOutfit) as string} alt={cb.title} loading="lazy" decoding="async" />
                  ) : <span className="combo-blank" />}
                  <div className="combo-txt">
                    <span className="combo-group">{cb.group}</span>
                    <b>{cb.title}</b>
                    <p>{cb.summary}</p>
                    <p className="combo-logic">{cb.logic}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section id="ch-colour" className="ch">
          <span className="eyebrow">Chapter · Colour</span>
          <h2 className="ch-title">Your colour guide.</h2>
          <div className="pal pal-ref">
            {c.colour.primary_palette.map(p => <Swatch key={p.hex} hex={p.hex} name={p.name} sub={p.usage} />)}
          </div>
          <div className="avoid">
            <span className="eyebrow eyebrow-no">Keep these away from your face</span>
            {c.colour.colours_to_avoid.map(p => (
              <div className="avoid-row" key={p.hex}>
                <i style={{ background: p.hex }} />
                <div><b>{p.name}</b><p>{p.reason}</p></div>
              </div>
            ))}
          </div>
          <Markdown source={data.sections.s3_colour} />
        </section>

        <section id="ch-fit" className="ch">
          <span className="eyebrow">Chapter · Fit</span>
          <h2 className="ch-title">Your fit guide.</h2>
          <Figure src={imageUrls?.diagnostic?.frameFront} alt="Your frame" />
          <Markdown source={data.sections.s2_body} />
        </section>

        <section id="ch-face" className="ch">
          <span className="eyebrow">Chapter · Face</span>
          <h2 className="ch-title">Face, hair &amp; eyewear.</h2>
          <Figure src={imageUrls?.diagnostic?.faceGeometry} alt="Your face geometry" />
          {imageUrls?.hairstyleCards?.[0] ? (
            <><span className="fig-cap">Hairstyle directions</span><Figure src={imageUrls.hairstyleCards[0]} alt="Hairstyle options" ratio="1 / 1" /></>
          ) : null}
          {imageUrls?.beardCards?.[0] ? (
            <><span className="fig-cap">Beard shapes</span><Figure src={imageUrls.beardCards[0]} alt="Beard options" ratio="1 / 1" /></>
          ) : null}
          {imageUrls?.eyewearCards?.[0] ? (
            <><span className="fig-cap">Eyewear</span><Figure src={imageUrls.eyewearCards[0]} alt="Eyewear options" ratio="1 / 1" /></>
          ) : null}
          <Markdown source={data.sections.s1_face} />
        </section>

        <section id="ch-grooming" className="ch">
          <span className="eyebrow">Chapter · Grooming</span>
          <h2 className="ch-title">Grooming &amp; skin.</h2>
          <Markdown source={data.sections.s5_grooming_skin} />
        </section>

        <section id="ch-shopping" className="ch">
          <span className="eyebrow">Chapter · Shopping</span>
          <h2 className="ch-title">Buy less. Choose better.</h2>
          <button type="button" className="btn-solid btn-block" onClick={() => setPocket(true)}>
            <ShoppingBag size={15} /> Open shopping mode
          </button>
          <Markdown source={data.sections.s5_shopping} />
        </section>

        <section id="ch-shots" className="ch">
          <span className="eyebrow">Chapter · Yours to use</span>
          <h2 className="ch-title">Your shots.</h2>
          <p className="ch-lede">Built from your Blueprint. Save them and use them today.</p>

          {imageUrls?.deliverables?.beforeImage && imageUrls?.deliverables?.afterImage ? (
            <div className="ba">
              <div>
                <span className="ba-tag">Before</span>
                <Figure src={imageUrls.deliverables.beforeImage} alt="Before" ratio="2 / 3" />
              </div>
              <div>
                <span className="ba-tag ba-tag-on">After</span>
                <Figure src={imageUrls.deliverables.afterImage} alt="After" ratio="2 / 3" />
              </div>
            </div>
          ) : null}

          {imageUrls?.deliverables?.linkedinHeadshot ? (
            <>
              <span className="fig-cap">On LinkedIn</span>
              <LinkedInMock data={data} imageUrl={imageUrls.deliverables.linkedinHeadshot} />
            </>
          ) : null}

          {imageUrls?.deliverables?.datingProfileShots?.filter(Boolean).length ? (
            <>
              <span className="fig-cap">On your feed</span>
              <InstagramMock
                data={data}
                imageUrls={imageUrls.deliverables.datingProfileShots}
                avatarUrl={imageUrls.deliverables.linkedinHeadshot}
              />
            </>
          ) : null}
        </section>

        <section className="ch ch-close">
          <span className="eyebrow">Your style, in one line</span>
          <p className="close-line">{sentence(c.style_brief.primary_brief)}</p>
          <div className="close-sig">
            <span>{reviewSignature}</span>
            <b>Blueprint No. {blueprintNo} · {dateLabel}</b>
          </div>
          <button type="button" className="btn-line" onClick={() => { setMode('cover'); window.scrollTo({ top: 0 }); }}>
            <ArrowLeft size={14} /> Replay the reveal
          </button>
        </section>
      </div>

      <button type="button" className="fab" onClick={() => setPocket(true)} aria-label="Open shopping mode">
        <ShoppingBag size={18} />
      </button>

      <AnimatePresence>
        {openOutfit ? (
          <OutfitSheet
            key="outfit"
            outfit={openOutfit}
            image={outfitImage(openOutfit.number)}
            onClose={() => setOpenOutfit(null)}
            saved={saved.includes(openOutfit.number)}
            onToggleSave={() => toggleSave(openOutfit.number)}
          />
        ) : null}
        {pocket ? <PocketCard key="pocket" data={data} onClose={() => setPocket(false)} /> : null}
      </AnimatePresence>

      <Styles />
    </main>
  );
}

/* ── styles ───────────────────────────────────────────────── */

function Styles() {
  return (
    <style jsx global>{`
      /* ──────────────────────────────────────────────────────────
         Two materials, because the Blueprint has two jobs.
         The Reveal is a screening room: warm filmic dark, woven
         texture, light falling from above. The Reference is a
         printed manual: warm paper, ink, brass rules. Walking
         out of one and into the other is the point.
         ────────────────────────────────────────────────────────── */

      html:has(.bp), body:has(.bp) { background: #16120F; }
      html:has(.bp-ref), body:has(.bp-ref) { background: #E9E0CE; }

      .bp {
        /* screening room */
        --ink:#16120F; --ink-2:#1D1712; --ink-3:#261E17;
        --paper:#F2EADC;
        --t1:#F2EADC; --t2:rgba(242,234,220,.76); --t3:rgba(242,234,220,.5);
        --line:rgba(242,234,220,.14); --line-2:rgba(242,234,220,.26);
        --brass:#C9A06A; --slate:#93AAB2; --alarm:#D08878;
        --weave:rgba(242,234,220,.016);
        --card:rgba(242,234,220,.035);

        position:relative;
        max-width:640px; margin:0 auto; min-height:100dvh;
        background:#16120F; color:var(--t1);
        font-family:var(--font-newsreader), Newsreader, Georgia, serif;
        font-weight:340; font-size:17px; line-height:1.62;
        overflow-x:hidden;
        -webkit-font-smoothing:antialiased;
      }
      /* woven twill — menswear cloth, not a flat fill */
      .bp::before{
        content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
        background-image:
          repeating-linear-gradient(52deg, var(--weave) 0 1px, transparent 1px 4px),
          repeating-linear-gradient(-52deg, var(--weave) 0 1px, transparent 1px 4px);
      }
      .bp > * { position:relative; z-index:1; }

      .bp *, .bp *::before, .bp *::after { box-sizing:border-box; }
      .bp button, .bp a { -webkit-tap-highlight-color:transparent; font-family:inherit; }
      .bp img { display:block; width:100%; height:100%; object-fit:cover; }
      .bp button:focus-visible, .bp a:focus-visible {
        outline:2px solid var(--brass); outline-offset:3px;
      }

      /* ── the printed manual ── */
      .bp-ref {
        --ink:#F1EADC; --ink-2:#E7DDC8; --ink-3:#DED2B9;
        --paper:#241D16;
        --t1:#241D16; --t2:rgba(36,29,22,.76); --t3:rgba(36,29,22,.5);
        --line:rgba(36,29,22,.16); --line-2:rgba(36,29,22,.3);
        --brass:#94713C; --slate:#5F7780; --alarm:#9E4A38;
        --weave:rgba(36,29,22,.022);
        --card:rgba(36,29,22,.035);
        background:#F1EADC; color:var(--t1);
      }

      /* ── type roles ──
         Fraunces sets the voice, Newsreader carries the reading,
         and the mono is the instrument: labels, specs, numbers. */
      .eyebrow, .cover-no, .ref-no, .rv-skip, .vcard-no, .vcard-rows span,
      .spec dt, .md-h4, .md-term, .pocket-label, .drape-tag, .tile-ctx,
      .ba-tag, .combo-group, .cover-foot, .close-sig b {
        font-family:var(--font-jetbrains-mono), ui-monospace, monospace;
      }
      .eyebrow { display:block; font-size:9.5px; font-weight:700; letter-spacing:.24em;
        text-transform:uppercase; color:var(--brass); margin-bottom:14px; }
      .eyebrow-no { color:var(--alarm); }

      /* ── controls ── */
      .btn-solid { display:inline-flex; align-items:center; justify-content:center; gap:9px;
        border:none; border-radius:2px; padding:16px 26px; background:var(--t1); color:var(--ink);
        font-family:var(--font-jetbrains-mono), monospace; font-size:12px; font-weight:700;
        letter-spacing:.12em; text-transform:uppercase; cursor:pointer; }
      .btn-block { width:100%; margin-bottom:26px; }
      .btn-line { display:inline-flex; align-items:center; gap:9px; border:1px solid var(--line-2);
        border-radius:2px; padding:13px 20px; background:transparent; color:var(--t1);
        font-family:var(--font-jetbrains-mono), monospace; font-size:11px; font-weight:700;
        letter-spacing:.12em; text-transform:uppercase; cursor:pointer; }
      .btn-chip { display:inline-flex; align-items:center; gap:8px; border:1px solid var(--line-2);
        border-radius:2px; padding:11px 16px; background:var(--card); color:var(--t1);
        font-family:var(--font-jetbrains-mono), monospace; font-size:10.5px; font-weight:700;
        letter-spacing:.1em; text-transform:uppercase; text-decoration:none; cursor:pointer; }
      .btn-chip.on { background:var(--brass); color:var(--ink); border-color:var(--brass); }
      .icon-btn { border:none; background:transparent; color:var(--t1); padding:6px; cursor:pointer; }

      /* ── cover: light falling into a dark room ── */
      .cover { position:relative; min-height:100dvh; display:grid; place-items:center;
        padding:56px 28px; text-align:center;
        background:
          radial-gradient(120% 62% at 50% -8%, rgba(201,160,106,.2) 0, transparent 62%),
          radial-gradient(90% 50% at 50% 108%, rgba(147,170,178,.09) 0, transparent 70%),
          linear-gradient(#1B1611 0%, #16120F 52%, #100D0B 100%); }
      .cover-grain { position:absolute; inset:0; opacity:.2; pointer-events:none;
        background-image:radial-gradient(circle at 1px 1px, #F2EADC 1px, transparent 0);
        background-size:4px 4px;
        mask-image:radial-gradient(120% 70% at 50% 0%, black, transparent 72%); }
      .cover-in { position:relative; z-index:2; width:100%; }
      .cover-checking { display:flex; flex-direction:column; gap:18px; }
      .cover-checking .eyebrow { margin:0; color:var(--t3); }
      .checking-rule { display:block; width:46px; height:1px;
        background:linear-gradient(90deg,transparent,var(--brass),transparent); }
      .cover-mark { font-family:var(--font-fraunces), Fraunces, Georgia, serif;
        font-size:14px; letter-spacing:.42em; text-indent:.42em; color:var(--t2); }
      .cover-rule { width:1px; height:44px; background:linear-gradient(var(--brass), transparent);
        margin:22px auto; }
      .cover-no { font-size:9.5px; letter-spacing:.26em; text-transform:uppercase;
        color:var(--t3); margin-bottom:28px; }
      .cover-title { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-weight:300;
        font-size:clamp(58px,18vw,84px); line-height:.86; letter-spacing:-.05em; margin:0 0 30px; }
      .cover-title em { font-style:italic; font-weight:300;
        background:linear-gradient(96deg,#E4BD86,#C9A06A 46%,#9C7B4C);
        -webkit-background-clip:text; background-clip:text; color:transparent; }
      .cover-verdict { display:grid; grid-template-columns:repeat(3,minmax(0,1fr));
        border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
      .cover-verdict > span { min-width:0; padding:14px 6px 16px; }
      .cover-verdict > span + span { border-left:1px solid var(--line); }
      .cover-verdict small { display:block; margin-bottom:5px; color:var(--t3);
        font-family:var(--font-jetbrains-mono),ui-monospace,monospace; font-size:7.5px;
        font-weight:700; letter-spacing:.18em; line-height:1.2; text-transform:uppercase; }
      .cover-verdict strong { display:block; overflow:hidden; color:var(--t1);
        font-family:var(--font-fraunces),Fraunces,Georgia,serif; font-size:15px;
        font-weight:400; line-height:1.18; text-overflow:ellipsis; }
      .cover-meta { margin:26px 0 32px; font-size:15px; color:var(--t3); line-height:1.72; }
      .cover-meta span { color:var(--t2); }
      .cover-foot { margin:26px 0 0; font-size:9px; letter-spacing:.24em; text-transform:uppercase;
        color:rgba(242,234,220,.3); }

      /* ── reveal ── */
      .rv-nav { position:sticky; top:0; z-index:40; display:flex; align-items:center;
        justify-content:space-between; padding:calc(13px + env(safe-area-inset-top)) 22px 13px;
        background:linear-gradient(180deg,#16120F 58%, transparent); }
      .rv-mark { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-size:12.5px;
        letter-spacing:.34em; text-indent:.34em; }
      .rv-skip { display:inline-flex; align-items:center; gap:6px; border:none; background:transparent;
        color:var(--t3); font-size:9.5px; font-weight:700; letter-spacing:.18em;
        text-transform:uppercase; cursor:pointer; }

      .beat { position:relative; padding:52px 24px 60px; }
      .beat + .beat::before { content:''; position:absolute; top:0; left:24px; right:24px;
        height:1px; background:linear-gradient(90deg, var(--brass), transparent 62%); opacity:.45; }
      .beat-ink   { background:linear-gradient(180deg,#16120F,#191410); }
      .beat-slate { background:linear-gradient(180deg,#101819 0%,#141E20 48%,#101718 100%); }
      .beat-warm  { background:linear-gradient(180deg,#1E1610 0%,#241A11 46%,#191309 100%); }
      .beat-title { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-weight:300;
        font-size:clamp(42px,12.5vw,58px); line-height:.94; letter-spacing:-.05em;
        margin:0 0 26px; text-wrap:balance; }
      .beat-body { margin:22px 0 0; font-size:17px; line-height:1.62; color:var(--t2); }
      .beat-body-sm { font-size:15.5px; color:var(--t3); }
      .beat-body em { font-style:italic; color:var(--t1); }
      .opening-line { margin:0; font-family:var(--font-fraunces), Fraunces, Georgia, serif;
        font-weight:300; font-style:italic; font-size:clamp(28px,8.2vw,38px); line-height:1.2;
        letter-spacing:-.035em; color:var(--t1); padding-left:20px;
        border-left:1px solid var(--brass); }
      .beat-goal { margin:26px 0 0; border-top:1px solid var(--line); padding-top:18px;
        font-size:16px; color:var(--t2); }
      .beat-goal span { display:block; font-family:var(--font-jetbrains-mono), monospace;
        font-size:9.5px; font-weight:700; letter-spacing:.24em; text-transform:uppercase;
        color:var(--t3); margin-bottom:8px; }

      .fig { position:relative; width:100%; overflow:hidden; border-radius:2px;
        background:var(--ink-2); margin-top:10px;
        box-shadow:0 1px 0 var(--line-2), 0 24px 50px rgba(0,0,0,.34); }
      .bp-ref .fig { box-shadow:0 1px 0 rgba(36,29,22,.1), 0 16px 34px rgba(36,29,22,.14); }
      .fig-cap { display:block; margin:30px 0 10px; font-family:var(--font-jetbrains-mono), monospace;
        font-size:9.5px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:var(--t3); }

      /* ── the drape ── */
      .drape-stage { display:grid; grid-template-columns:1fr 0fr; border-radius:2px; overflow:hidden;
        transition:grid-template-columns .68s cubic-bezier(.22,1,.36,1); background:var(--ink-2);
        box-shadow:0 24px 50px rgba(0,0,0,.4); }
      .drape-stage.is-open { grid-template-columns:1fr 1fr; gap:2px; }
      .drape-cell { position:relative; aspect-ratio:3/4; min-width:0; overflow:hidden; }
      .drape-img { position:absolute; inset:0; overflow:hidden; }
      .bp .drape-img img { position:absolute; top:0; width:200%; max-width:none; height:100%;
        object-fit:cover; object-position:center; }
      .drape-img-left img { left:0; }
      .drape-img-right img { right:0; }
      .drape-tag { position:absolute; left:9px; bottom:9px; border-radius:2px; padding:6px 10px;
        background:rgba(10,8,7,.76); backdrop-filter:blur(8px); font-size:9px; font-weight:700;
        letter-spacing:.16em; text-transform:uppercase; }
      .drape-tag-wrong { color:var(--alarm); box-shadow:inset 0 0 0 1px rgba(208,136,120,.4); }
      .drape-tag-right { color:var(--brass); box-shadow:inset 0 0 0 1px rgba(201,160,106,.46); }
      .drape-copy { margin-top:22px; }
      .drape-copy .btn-line { margin-top:18px; }
      .drape-note { margin:12px 0 0; font-size:15px; color:var(--t3); font-style:italic; }

      /* ── swatches ── */
      .pal { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-top:30px; }
      .pal-ref { margin-top:10px; }
      .sw { display:flex; flex-direction:column; gap:7px; border:1px solid var(--line);
        border-radius:2px; padding:13px; background:var(--card); }
      .sw i { width:100%; height:38px; border-radius:1px; box-shadow:inset 0 0 0 1px rgba(255,255,255,.12); }
      .bp-ref .sw i { box-shadow:inset 0 0 0 1px rgba(36,29,22,.16); }
      .sw-name { font-size:14.5px; font-weight:500; }
      .sw-sub { font-size:13px; color:var(--t3); line-height:1.45; }
      .sw-sm { padding:9px; gap:6px; }
      .sw-sm i { height:28px; }
      .sw-sm .sw-name { font-size:12px; }

      /* ── spec sheet: the instrument register ── */
      .spec { margin:26px 0 0; display:grid; }
      .spec > div { display:grid; grid-template-columns:84px 1fr; gap:14px; padding:14px 0;
        border-top:1px solid var(--line); }
      .spec dt { font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
        color:var(--brass); padding-top:4px; }
      .spec dd { margin:0; font-size:15.5px; color:var(--t2); line-height:1.5; }
      .occasion { display:flex; gap:10px; margin:20px 0 0; border-top:1px solid var(--line);
        padding-top:16px; font-size:15px; font-style:italic; color:var(--t3); line-height:1.55; }
      .occasion svg { flex:0 0 auto; margin-top:4px; color:var(--brass); }

      /* ── verdict card ── */
      .vcard { border:1px solid rgba(201,160,106,.36); border-radius:2px; padding:22px;
        background:linear-gradient(158deg,#251D14,#161210);
        box-shadow:0 22px 46px rgba(0,0,0,.4); }
      .vcard-top { display:flex; justify-content:space-between; align-items:baseline;
        border-bottom:1px solid var(--line); padding-bottom:14px; }
      .vcard-mark { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-size:12.5px;
        letter-spacing:.34em; text-indent:.34em; }
      .vcard-no { font-size:9.5px; letter-spacing:.18em; color:var(--t3); }
      .vcard-rows > div { display:flex; justify-content:space-between; align-items:baseline;
        padding:14px 0; border-bottom:1px solid var(--line); }
      .vcard-rows span { font-size:9px; font-weight:700; letter-spacing:.22em;
        text-transform:uppercase; color:var(--t3); }
      .vcard-rows b { font-family:var(--font-fraunces), Fraunces, Georgia, serif;
        font-weight:400; font-size:21px; letter-spacing:-.02em; }
      .vcard-strip { display:flex; gap:3px; margin:18px 0; }
      .vcard-strip i { flex:1; height:30px; border-radius:1px;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.1); }
      .vcard-share { width:100%; justify-content:center; }

      /* ── the door: paper arrives ── */
      .door { padding:72px 24px 84px; color:#241D16;
        background:linear-gradient(180deg,#F1EADC,#E6DBC5); }
      .door .eyebrow { color:#94713C; }
      .door-title { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-weight:300;
        font-size:clamp(36px,10.5vw,50px); line-height:1; letter-spacing:-.045em;
        margin:0 0 20px; text-wrap:balance; }
      .door-body { font-size:17px; color:rgba(36,29,22,.68); line-height:1.6; margin:0 0 30px; }
      .door .btn-solid { background:#241D16; color:#F1EADC; }
      .door-sig { margin:28px 0 0; font-size:14px; font-style:italic; color:rgba(36,29,22,.5); }

      /* ── reference ── */
      .ref-nav { position:sticky; top:0; z-index:50; background:rgba(241,234,220,.93);
        backdrop-filter:blur(14px); border-bottom:1px solid var(--line); }
      .ref-nav-top { display:flex; align-items:center; gap:10px;
        padding:calc(12px + env(safe-area-inset-top)) 18px 10px; }
      .ref-no { font-size:9.5px; letter-spacing:.16em; color:var(--t3);
        margin-right:auto; margin-left:14px; }
      .ref-pocket { display:inline-flex; align-items:center; gap:7px; border:1px solid var(--brass);
        border-radius:2px; padding:8px 13px; background:transparent; color:var(--brass);
        font-family:var(--font-jetbrains-mono), monospace; font-size:9.5px; font-weight:700;
        letter-spacing:.12em; text-transform:uppercase; cursor:pointer; }
      .ref-chips { display:flex; gap:8px; overflow-x:auto; padding:0 18px 11px; scrollbar-width:none; }
      .ref-chips::-webkit-scrollbar { display:none; }
      .ref-chips button { flex:0 0 auto; display:inline-flex; align-items:center; gap:7px;
        border:1px solid var(--line); border-radius:2px; padding:9px 14px; background:transparent;
        color:var(--t3); font-family:var(--font-jetbrains-mono), monospace; font-size:10px;
        font-weight:700; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; }
      .ref-chips button.on { color:var(--ink); background:var(--t1); border-color:var(--t1); }

      .ch { padding:44px 20px 52px; border-top:1px solid var(--line); scroll-margin-top:104px; }
      .ch:first-child { border-top:none; }
      .ch-title { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-weight:300;
        font-size:clamp(32px,9vw,44px); line-height:1; letter-spacing:-.045em;
        margin:0 0 14px; text-wrap:balance; }
      .ch-sub { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-weight:400;
        font-style:italic; font-size:23px; letter-spacing:-.02em; margin:0 0 18px; }
      .ch-lede { font-size:16px; color:var(--t3); margin:0 0 26px; }

      /* contact sheet */
      .sheet-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
      .tile { display:flex; flex-direction:column; gap:6px; border:none; padding:0;
        background:transparent; color:inherit; text-align:left; cursor:pointer; }
      .tile-img { position:relative; display:block; aspect-ratio:2/3; border-radius:1px;
        overflow:hidden; background:var(--ink-3);
        box-shadow:0 1px 0 var(--line-2), 0 8px 18px rgba(36,29,22,.16); }
      .tile-img::before { content:''; position:absolute; inset:0; z-index:0;
        background:linear-gradient(105deg,var(--ink-3) 28%,rgba(255,255,255,.18) 42%,var(--ink-3) 58%);
        background-size:220% 100%; animation:tile-shimmer 1.5s ease-in-out infinite; }
      .tile-img img { position:relative; z-index:1; opacity:0; transition:opacity .32s ease; }
      .tile-img.loaded img { opacity:1; }
      .tile-img.loaded::before, .tile-img.missing::before { display:none; }
      .tile-img.missing::after { content:'Image pending'; position:absolute; inset:0; display:grid; place-items:center;
        padding:16px; color:rgba(243,239,230,.42); font:600 9px/1.4 var(--sans); letter-spacing:.14em;
        text-align:center; text-transform:uppercase; }
      .tile-blank { position:relative; z-index:1; display:grid; place-items:center; width:100%; height:100%;
        background:linear-gradient(160deg,var(--ink-2),var(--ink-3)); color:var(--t3);
        font-family:var(--font-jetbrains-mono),monospace; font-size:7.5px; letter-spacing:.14em;
        text-transform:uppercase; }
      @keyframes tile-shimmer { from { background-position:100% 0; } to { background-position:-100% 0; } }
      .tile-save { position:absolute; right:6px; top:6px; display:grid; place-items:center;
        width:20px; height:20px; border-radius:50%; background:var(--brass); color:#F1EADC; }
      .tile-n { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-size:13px;
        color:var(--brass); }
      .tile-ctx { font-size:8.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
        color:var(--t3); line-height:1.35; }

      .saved-strip { margin-top:34px; border-top:1px solid var(--line); padding-top:22px; }
      .saved-row { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; }
      .saved-row::-webkit-scrollbar { display:none; }
      .saved-chip { flex:0 0 auto; border:1px solid var(--line); border-radius:2px; padding:9px 14px;
        background:var(--card); color:var(--t2); font-family:var(--font-jetbrains-mono), monospace;
        font-size:10px; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; }

      /* combinations */
      .combos { margin-top:42px; border-top:1px solid var(--line); padding-top:30px; }
      .combo { display:grid; grid-template-columns:92px 1fr; gap:16px; padding:18px 0;
        border-top:1px solid var(--line); }
      .combo:first-of-type { border-top:none; }
      .combo img, .combo-blank { width:92px; aspect-ratio:2/3; border-radius:1px; object-fit:cover;
        background:linear-gradient(160deg,var(--ink-2),var(--ink-3)); }
      .combo-group { display:block; font-size:8.5px; font-weight:700; letter-spacing:.2em;
        text-transform:uppercase; color:var(--brass); margin-bottom:6px; }
      .combo-txt b { display:block; font-family:var(--font-fraunces), Fraunces, Georgia, serif;
        font-weight:400; font-size:19px; letter-spacing:-.02em; margin-bottom:7px; }
      .combo-txt p { margin:0 0 7px; font-size:14.5px; color:var(--t2); line-height:1.5; }
      .combo-logic { color:var(--t3) !important; font-style:italic; }

      /* avoid block */
      .avoid { margin:30px 0; border:1px solid rgba(158,74,56,.3); border-radius:2px;
        padding:20px; background:rgba(158,74,56,.06); }
      .avoid-row { display:grid; grid-template-columns:38px 1fr; gap:14px; padding:12px 0; }
      .avoid-row i { width:38px; height:38px; border-radius:1px;
        box-shadow:inset 0 0 0 1px rgba(36,29,22,.18); }
      .avoid-row b { display:block; font-size:15px; margin-bottom:4px; }
      .avoid-row p { margin:0; font-size:14px; color:var(--t3); line-height:1.5; }

      /* prose */
      .md { margin-top:10px; }
      .md-h3 { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-weight:400;
        font-style:italic; font-size:22px; letter-spacing:-.02em; margin:34px 0 14px; }
      .md-h4 { font-size:9.5px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
        color:var(--brass); margin:26px 0 10px; }
      .md-p { margin:0 0 16px; font-size:16.5px; line-height:1.66; color:var(--t2); }
      .md-list { margin:0 0 18px; padding:0; list-style:none; }
      .md-list li { padding:13px 0; border-top:1px solid var(--line); font-size:16px;
        line-height:1.58; color:var(--t2); }
      .md-term { display:block; font-size:9px; font-weight:700; letter-spacing:.2em;
        text-transform:uppercase; color:var(--brass); margin-bottom:5px; }

      /* deliverables */
      .ba { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:30px; }
      .ba-tag { display:block; margin-bottom:8px; font-size:9px; font-weight:700; letter-spacing:.2em;
        text-transform:uppercase; color:var(--t3); }
      .ba-tag-on { color:var(--brass); }
      .dl { display:grid; grid-template-columns:110px 1fr; gap:16px; align-items:start;
        border-top:1px solid var(--line); padding-top:24px; }
      .dl .fig { margin-top:0; }
      .dl-txt b { display:block; font-size:16px; margin-bottom:7px; }
      .dl-txt p { margin:0 0 14px; font-size:14.5px; color:var(--t3); line-height:1.52; }
      .shots { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
      .shot { position:relative; display:block; aspect-ratio:2/3; border-radius:1px;
        overflow:hidden; background:var(--ink-3); }
      .shot i { position:absolute; right:7px; bottom:7px; display:grid; place-items:center;
        width:26px; height:26px; border-radius:50%; background:rgba(10,8,7,.7);
        backdrop-filter:blur(6px); color:#F1EADC; }

      /* ── LinkedIn profile mock ──
         A real white platform card on the cream page. The headshot is
         the product here, so it gets the room it deserves. */
      .li-mock { border:1px solid rgba(36,29,22,.13); border-radius:12px; overflow:hidden;
        background:#fff; color:#1b1f23; box-shadow:0 18px 40px rgba(36,29,22,.18);
        font-family:var(--font-inter), Inter, system-ui, sans-serif; }
      .li-cover { position:relative; height:116px;
        background:
          radial-gradient(120% 150% at 12% 0%, rgba(255,255,255,.24), transparent 58%),
          linear-gradient(122deg,#004182,#0a66c2 46%,#4d93cc); }
      .li-badge { position:absolute; right:16px; top:14px; display:grid; place-items:center;
        width:30px; height:30px; border-radius:6px; background:#fff; color:#0a66c2;
        font-weight:800; font-size:15px; letter-spacing:-.05em; }
      .li-body { position:relative; padding:0 20px 22px; }
      .li-avatar { position:relative; width:132px; height:132px; margin:-66px 0 14px;
        border:4px solid #fff; border-radius:50%; overflow:hidden; background:#e8eef3;
        display:grid; place-items:center; color:#5b6b78; font-size:11px;
        box-shadow:0 8px 22px rgba(27,31,35,.2); }
      .li-avatar img { width:100%; height:100%; object-fit:cover; object-position:50% 22%; }
      .li-name { margin:0 0 6px; font-size:23px; font-weight:600; letter-spacing:-.02em; color:#1b1f23; }
      .li-headline { margin:0 0 8px; font-size:14.5px; line-height:1.45; color:#3d454c; }
      .li-loc { margin:0 0 14px; font-size:12.5px; color:#6b7680; }
      .li-pills { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px; }
      .li-pills span { border-radius:999px; padding:7px 16px; font-size:12.5px; font-weight:600; }
      .li-pills span:first-child { background:#0a66c2; color:#fff; }
      .li-pills span:last-child { border:1px solid #0a66c2; color:#0a66c2; }
      .li-about { border-top:1px solid #e6e9ec; padding-top:16px; }
      .li-about .pocket-label { color:#0a66c2; margin-bottom:8px; }
      .li-about p { margin:0; font-size:14px; line-height:1.6; color:#3d454c; }
      .li-dl { margin-top:18px; border-color:rgba(10,102,194,.4); color:#0a66c2;
        background:rgba(10,102,194,.06); }

      /* ── Instagram profile mock ──
         Chrome stays minimal so the frames read the way they would
         on a real profile: pictures first, almost no copy. */
      .ig-mock { border:1px solid rgba(36,29,22,.13); border-radius:12px; overflow:hidden;
        background:#fff; color:#111; box-shadow:0 18px 40px rgba(36,29,22,.16);
        font-family:var(--font-inter), Inter, system-ui, sans-serif; }
      .ig-bar { display:flex; align-items:center; justify-content:space-between;
        border-bottom:1px solid #efefef; padding:12px 14px; }
      .ig-bar strong { font-size:14px; font-weight:600; }
      .ig-bar span { color:#8e8e8e; letter-spacing:.06em; }
      .ig-head { display:flex; align-items:center; gap:24px; padding:14px 14px 12px; }
      .ig-avatar { flex:0 0 auto; width:62px; height:62px; border-radius:50%; overflow:hidden;
        display:grid; place-items:center; background:#fafafa; color:#8e8e8e; font-size:8.5px;
        letter-spacing:.14em; box-shadow:0 0 0 2px #fff, 0 0 0 4px #e1306c; }
      .ig-avatar img { width:100%; height:100%; object-fit:cover; object-position:50% 22%; }
      .ig-stats { display:flex; gap:26px; }
      .ig-stats div { display:flex; flex-direction:column; }
      .ig-stats strong { font-size:16px; font-weight:600; }
      .ig-stats span { font-size:12px; color:#6b6b6b; }
      .ig-tabs { display:flex; align-items:center; justify-content:center;
        border-top:1px solid #efefef; padding:9px 0; }
      .ig-tabs i { width:13px; height:13px; border:1.5px solid #111; border-radius:1px; }
      .ig-grid { display:grid; grid-template-columns:1fr; gap:3px; background:#fff; }
      .ig-tile { position:relative; display:block; aspect-ratio:4/5; overflow:hidden; background:#f1f1f1; }
      .ig-tile img { width:100%; height:100%; object-fit:cover; object-position:50% 42%; }
      .ig-dl { position:absolute; right:10px; bottom:10px; display:grid; place-items:center;
        width:30px; height:30px; border-radius:50%; background:rgba(0,0,0,.5);
        backdrop-filter:blur(6px); color:#fff; }
      .ig-tile-empty { display:grid; place-items:center; color:#c4c4c4;
        font-size:13px; font-weight:600; }

      .shop-block { display:flex; flex-direction:column; align-items:flex-start; gap:6px;
        margin-top:12px; }
      .shop-go { display:inline-flex; align-items:center; gap:7px; border:1px solid var(--brass);
        border-radius:2px; padding:9px 14px; background:rgba(201,160,106,.1); color:var(--brass);
        font-family:var(--font-jetbrains-mono), monospace; font-size:10px; font-weight:700;
        letter-spacing:.12em; text-transform:uppercase; text-decoration:none; }
      .shop-brands { font-family:var(--font-jetbrains-mono), monospace; font-size:9px;
        letter-spacing:.08em; text-transform:uppercase; color:var(--t3); line-height:1.5; }
      .shop-wide { font-size:13px; font-style:italic; color:var(--t3);
        text-decoration:underline; text-underline-offset:3px; }

      .ch-close { padding-bottom:120px; }
      .close-line { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-weight:300;
        font-style:italic; font-size:25px; line-height:1.36; letter-spacing:-.025em;
        color:var(--t1); margin:0 0 30px; }
      .close-sig { border-top:1px solid var(--line); padding-top:18px; margin-bottom:26px; }
      .close-sig span { display:block; font-size:15px; font-style:italic;
        color:var(--t3); margin-bottom:7px; }
      .close-sig b { font-size:10px; font-weight:700; letter-spacing:.14em;
        text-transform:uppercase; color:var(--t2); }

      /* fab + sheets */
      .fab { position:fixed; right:18px; bottom:calc(20px + env(safe-area-inset-bottom)); z-index:60;
        display:grid; place-items:center; width:54px; height:54px; border:none; border-radius:50%;
        background:#241D16; color:#E4BD86; box-shadow:0 12px 30px rgba(36,29,22,.34); cursor:pointer; }
      @media (min-width:641px){ .fab { right:calc(50vw - 320px + 18px); } }

      .sheet-root { position:fixed; inset:0; z-index:100; }
      .sheet-scrim { position:absolute; inset:0; width:100%; border:none;
        background:rgba(14,11,9,.66); backdrop-filter:blur(5px); cursor:pointer; }
      .sheet { position:absolute; left:0; right:0; bottom:0; max-width:640px; margin:0 auto;
        max-height:92dvh; overflow-y:auto; border-radius:6px 6px 0 0; background:var(--ink);
        color:var(--t1); box-shadow:0 -22px 64px rgba(0,0,0,.44);
        font-family:var(--font-newsreader), Newsreader, Georgia, serif;
        overscroll-behavior:contain; -webkit-overflow-scrolling:touch; }
      .sheet-grab { width:40px; height:3px; border-radius:99px; background:var(--line-2);
        margin:11px auto 4px; }
      .sheet-head { position:sticky; top:0; z-index:3; display:flex; align-items:flex-start;
        justify-content:space-between; gap:12px; padding:13px 20px 15px; background:var(--ink);
        border-bottom:1px solid var(--line); }
      .sheet-title { font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-weight:300;
        font-size:26px; line-height:1.1; letter-spacing:-.035em; margin:0; }
      .sheet-head .eyebrow { margin-bottom:8px; }
      .sheet-body { padding:18px 20px calc(30px + env(safe-area-inset-bottom)); }
      .sheet-actions { display:flex; gap:10px; margin-top:24px; }

      /* the field card stays dark — it is read under shop lighting */
      .pocket { --ink:#191410; --t1:#F2EADC; --t2:rgba(242,234,220,.78);
        --t3:rgba(242,234,220,.52); --line:rgba(242,234,220,.15);
        --line-2:rgba(242,234,220,.28); --brass:#C9A06A; --alarm:#D08878;
        --card:rgba(242,234,220,.05);
        background:linear-gradient(178deg,#1E1811,#141010); color:#F2EADC; }
      .pocket .sheet-head { background:#1B1610; }
      .pocket .sw i { box-shadow:inset 0 0 0 1px rgba(255,255,255,.14); }
      .pocket-body { padding:20px 20px calc(32px + env(safe-area-inset-bottom)); display:grid; gap:28px; }
      .pocket-label { display:block; font-size:9px; font-weight:700; letter-spacing:.24em;
        text-transform:uppercase; color:var(--brass); margin-bottom:13px; }
      .pocket-label-no { color:var(--alarm); }
      .pocket-sw { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; }
      .pocket-list { margin:0; padding:0; list-style:none; }
      .pocket-list li { display:flex; gap:10px; padding:11px 0; border-top:1px solid var(--line);
        font-size:15.5px; line-height:1.5; color:var(--t2); }
      .pocket-list li svg { flex:0 0 auto; margin-top:5px; color:var(--brass); }
      .pocket-list li.no { color:var(--t3); }
      .pocket-list li.no svg { color:var(--alarm); }

      @media (prefers-reduced-motion: reduce) {
        .bp *, .bp *::before, .bp *::after {
          animation-duration:.01ms !important; transition-duration:.01ms !important;
        }
      }
    `}</style>
  );
}
