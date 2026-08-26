'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  Eye,
  Layers3,
  Palette,
  Ruler,
  Shirt,
  X,
} from 'lucide-react';
import type { ReportData } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls } from '@/lib/manImageGenerator';
import { buildTrustedBrandSearch } from '@/lib/manShopping';

const INK = '#171411';
const PAPER = '#F4EFE5';
const BRASS = '#D0A46B';

type SceneId = 'reveal' | 'face' | 'fit' | 'colour' | 'outfit';

interface CinematicPrototypeProps {
  data: ReportData;
  imageUrls?: ResolvedImageUrls | null;
}

interface ParsedHeroOutfit {
  number: number;
  context: string;
  occasion: string;
  garments: Array<{ key: string; label: string; value: string; y: string }>;
}

function cleanText(value: string) {
  return value
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[-–—:\s]+|[-–—:\s]+$/g, '')
    .trim();
}

function fieldFromBlock(block: string, label: string) {
  const match = block.match(new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?${label}(?:\\*\\*)?\\s*:\\s*(.+)`, 'i'));
  return cleanText(match?.[1] ?? '');
}

function parseHeroOutfit(data: ReportData): ParsedHeroOutfit {
  const number = data.deliverables?.strongestOutfitNumber || 1;
  const source = data.sections.s4_outfits || '';
  const escapedNumber = String(number).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(
    `(?:^|\\n)\\s*(?:\\*\\*)?OUTFIT\\s+${escapedNumber}\\s*[—–-]\\s*([^\\n*]+)(?:\\*\\*)?([\\s\\S]*?)(?=\\n\\s*(?:\\*\\*)?OUTFIT\\s+\\d+\\s*[—–-]|$)`,
    'i',
  ));
  const context = cleanText(match?.[1] || 'Your strongest look');
  const block = match?.[2] || source;
  const rawGarments = [
    { key: 'top', label: 'Top', value: fieldFromBlock(block, 'TOP'), y: '30%' },
    { key: 'layer', label: 'Layer', value: fieldFromBlock(block, 'LAYER'), y: '43%' },
    { key: 'bottom', label: 'Bottom', value: fieldFromBlock(block, 'BOTTOM'), y: '63%' },
    { key: 'footwear', label: 'Footwear', value: fieldFromBlock(block, 'FOOTWEAR'), y: '87%' },
  ];
  const garments = rawGarments.filter(item => item.value && !/^none$/i.test(item.value));
  return {
    number,
    context,
    occasion: fieldFromBlock(block, 'OCCASION ANCHOR') || 'A complete outfit formula built around your fit and colour direction.',
    garments: garments.length ? garments : rawGarments,
  };
}

function useSceneStep(ref: RefObject<HTMLElement | null>, count: number) {
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', value => {
    const next = Math.min(count - 1, Math.max(0, Math.floor(value * count)));
    setStep(current => current === next ? current : next);
  });
  return { step, progress: scrollYProgress };
}

function StoryCopy({ kicker, title, body, index }: { kicker: string; title: string; body: string; index: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${kicker}-${index}`}
        className="cinema-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="cinema-kicker">{kicker}</p>
        <h2>{title}</h2>
        <p className="cinema-body">{body}</p>
      </motion.div>
    </AnimatePresence>
  );
}

function SceneDots({ count, active }: { count: number; active: number }) {
  return (
    <div className="cinema-dots" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => <i className={index === active ? 'active' : ''} key={index} />)}
    </div>
  );
}

function FaceScene({ data, imageUrl }: { data: ReportData; imageUrl?: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const cls = data.classification;
  const copy = [
    {
      kicker: 'Your face',
      title: `${cls.face.face_shape} — strong and balanced.`,
      body: 'Your features already create presence. The goal is to keep that strength without adding unnecessary width.',
    },
    {
      kicker: 'Hair direction',
      title: 'Add height. Keep the sides controlled.',
      body: cleanText(cls.face.hairstyle_recommendations?.[0] || 'Use texture and a little height on top with shorter, cleaner sides.'),
    },
    {
      kicker: 'Facial hair',
      title: 'Keep the edge precise.',
      body: cleanText(cls.face.beard_style_recommendations?.[0] || cls.face.facial_hair_recommendations || 'Keep the cheek and neckline deliberate, with slightly more length through the chin.'),
    },
    {
      kicker: 'Eyewear',
      title: 'Use curves to balance the jaw.',
      body: `${cls.face.eyewear_shapes?.slice(0, 2).join(' and ') || 'Round and softly structured frames'} are your strongest starting points.`,
    },
  ];
  const { step, progress } = useSceneStep(ref, copy.length);

  return (
    <section ref={ref} id="cinema-face" data-cinema-scene="face" className="cinema-scene cinema-face-scene">
      <div className="cinema-sticky">
        <motion.div className="cinema-progress-local" style={{ scaleX: progress }} />
        <div className="cinema-visual">
          {imageUrl ? <motion.img src={imageUrl} alt="Your face analysis" loading="eager" animate={{ scale: 1 + step * 0.012 }} transition={{ duration: 0.6 }} /> : <div className="cinema-image-fallback"><Eye /></div>}
          <div className={`cinema-face-guide guide-${step}`} aria-hidden="true"><i /><i /><i /><i /></div>
          <span className={`cinema-focus-point face-point-${step}`} aria-hidden="true" />
          <div className="cinema-image-shade" />
        </div>
        <div className="cinema-content">
          <StoryCopy {...copy[step]} index={step} />
          <SceneDots count={copy.length} active={step} />
        </div>
      </div>
    </section>
  );
}

function FitScene({ data, imageUrl }: { data: ReportData; imageUrl?: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const cls = data.classification;
  const copy = [
    {
      kicker: 'Your frame',
      title: 'Build the shape at the shoulders.',
      body: cleanText(cls.body.fit_directive),
    },
    {
      kicker: 'The waist',
      title: 'Let fabric skim, never squeeze.',
      body: 'Shirts and jackets should close without pulling across the stomach. Structure belongs at the shoulder, not around the waist.',
    },
    {
      kicker: 'The trouser line',
      title: 'A clean fall makes everything sharper.',
      body: cleanText(cls.body.height_adjustment || 'Choose a secure mid-rise and a straight line to the shoe with little excess fabric at the hem.'),
    },
  ];
  const { step, progress } = useSceneStep(ref, copy.length);
  const markerClass = ['shoulder', 'waist', 'hem'][step];

  return (
    <section ref={ref} id="cinema-fit" data-cinema-scene="fit" className="cinema-scene cinema-fit-scene">
      <div className="cinema-sticky">
        <motion.div className="cinema-progress-local" style={{ scaleX: progress }} />
        <div className="cinema-visual cinema-fit-visual">
          {imageUrl ? <motion.img src={imageUrl} alt="Your fit analysis" loading="eager" animate={{ scale: step === 1 ? 1.035 : 1.015 }} transition={{ duration: 0.55 }} /> : <div className="cinema-image-fallback"><Ruler /></div>}
          <div className={`cinema-measure-line ${markerClass}`} aria-hidden="true"><span>{markerClass}</span></div>
          <div className="cinema-image-shade" />
        </div>
        <div className="cinema-content">
          <StoryCopy {...copy[step]} index={step} />
          <SceneDots count={copy.length} active={step} />
        </div>
      </div>
    </section>
  );
}

function ColourScene({ data, imageUrl }: { data: ReportData; imageUrl?: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const palette = data.classification.colour.primary_palette.slice(0, 6);
  const [selected, setSelected] = useState(0);
  const [manualPreview, setManualPreview] = useState(false);
  const { step, progress } = useSceneStep(ref, 3);
  const colour = palette[selected] ?? { name: 'Deep navy', hex: '#263A52', usage: 'Use it as a dependable wardrobe base.' };
  const copy = [
    {
      kicker: 'Your colour season',
      title: `${data.classification.colour.season}.`,
      body: `Your strongest colours have ${data.classification.colour.undertone.toLowerCase()} warmth and enough depth to hold their own near your face.`,
    },
    {
      kicker: 'The difference',
      title: 'Rich colour gives your face definition.',
      body: cleanText(data.diagnostics?.colourDrapeVerdict || data.classification.colour.fabric_tone_guidance),
    },
    {
      kicker: colour.name,
      title: colour.usage || 'One colour, used deliberately.',
      body: 'Tap another colour to see how your wardrobe palette changes around you.',
    },
  ];
  const displayedCopy = manualPreview
    ? {
        kicker: 'Your palette',
        title: colour.name,
        body: colour.usage || 'Use this colour as one deliberate part of the outfit and keep the remaining pieces quieter.',
      }
    : copy[step];

  return (
    <section ref={ref} id="cinema-colour" data-cinema-scene="colour" className="cinema-scene cinema-colour-scene" style={{ '--scene-colour': colour.hex } as CSSProperties}>
      <div className="cinema-sticky">
        <motion.div className="cinema-progress-local" style={{ scaleX: progress }} />
        <div className="cinema-visual cinema-colour-visual">
          {imageUrl ? <img src={imageUrl} alt="Your colour comparison" loading="eager" /> : <div className="cinema-image-fallback"><Palette /></div>}
          <div className="cinema-image-shade" />
        </div>
        <div className="cinema-content">
          <StoryCopy {...displayedCopy} index={step + selected * 10 + (manualPreview ? 100 : 0)} />
          <div className="cinema-swatches" aria-label="Explore your palette">
            {palette.map((item, index) => (
              <button
                type="button"
                key={`${item.name}-${index}`}
                className={selected === index ? 'active' : ''}
                style={{ '--swatch': item.hex } as CSSProperties}
                onClick={() => { setSelected(index); setManualPreview(true); }}
                aria-label={`Preview ${item.name}`}
              >
                <i />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OutfitScene({ data, imageUrl }: { data: ReportData; imageUrl?: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const outfit = useMemo(() => parseHeroOutfit(data), [data]);
  const { step, progress } = useSceneStep(ref, Math.max(outfit.garments.length, 1));
  const [manualSelection, setManualSelection] = useState<number | null>(null);
  const selectedIndex = manualSelection ?? Math.min(step, outfit.garments.length - 1);
  const garment = outfit.garments[selectedIndex] ?? outfit.garments[0];
  const search = buildTrustedBrandSearch(garment?.value || outfit.context);

  return (
    <section ref={ref} id="cinema-outfit" data-cinema-scene="outfit" className="cinema-scene cinema-outfit-scene">
      <div className="cinema-sticky">
        <motion.div className="cinema-progress-local" style={{ scaleX: progress }} />
        <div className="cinema-visual cinema-outfit-visual">
          {imageUrl ? <img src={imageUrl} alt={`Outfit ${outfit.number}: ${outfit.context}`} loading="eager" /> : <div className="cinema-image-fallback"><Shirt /></div>}
          <div className="cinema-image-shade" />
          {outfit.garments.map((item, index) => (
            <button
              type="button"
              className={`cinema-hotspot ${selectedIndex === index ? 'active' : ''}`}
              style={{ top: item.y } as CSSProperties}
              key={item.key}
              onClick={() => setManualSelection(index)}
              aria-label={`Show ${item.label}`}
            >
              <i />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="cinema-content cinema-outfit-content">
          <p className="cinema-kicker">Hero outfit {String(outfit.number).padStart(2, '0')} · {outfit.context}</p>
          <AnimatePresence mode="wait">
            <motion.div key={garment?.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <h2>{garment?.label}</h2>
              <p className="cinema-body">{garment?.value}</p>
              <a className="cinema-shop-link" href={search.url} target="_blank" rel="noreferrer">
                Search trusted brands <ArrowUpRight size={15} />
              </a>
            </motion.div>
          </AnimatePresence>
          <p className="cinema-occasion"><Check size={15} /> {outfit.occasion}</p>
          <SceneDots count={outfit.garments.length} active={selectedIndex} />
        </div>
      </div>
    </section>
  );
}

export default function ManReportCinematicPrototype({ data, imageUrls }: CinematicPrototypeProps) {
  const [activeScene, setActiveScene] = useState<SceneId>('reveal');
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const strongest = data.deliverables?.strongestOutfitNumber || 1;
  const faceImage = imageUrls?.diagnostic?.faceGeometry || imageUrls?.deliverables?.linkedinHeadshot || imageUrls?.hairstyleCards?.[0];
  const fitImage = imageUrls?.diagnostic?.frameFront || imageUrls?.diagnostic?.frameSide || imageUrls?.deliverables?.beforeImage;
  const colourImage = imageUrls?.diagnostic?.colourDrape || faceImage;
  const outfitImage = imageUrls?.outfitCards?.[strongest - 1] || imageUrls?.outfitCards?.find(Boolean);

  const sceneLinks: Array<{ id: SceneId; label: string; icon: typeof Eye }> = [
    { id: 'reveal', label: 'Your reveal', icon: Layers3 },
    { id: 'face', label: 'Face', icon: Eye },
    { id: 'fit', label: 'Fit', icon: Ruler },
    { id: 'colour', label: 'Colour', icon: Palette },
    { id: 'outfit', label: 'Hero outfit', icon: Shirt },
  ];

  useEffect(() => {
    const assets = [faceImage, fitImage, colourImage, outfitImage].filter((value): value is string => Boolean(value));
    assets.forEach(src => { const image = new Image(); image.src = src; });

    let frame = 0;
    const updateActiveScene = () => {
      frame = 0;
      const marker = window.innerHeight * 0.42;
      const scenes = [...document.querySelectorAll<HTMLElement>('[data-cinema-scene]')];
      const current = scenes.find(scene => {
        const rect = scene.getBoundingClientRect();
        return rect.top <= marker && rect.bottom > marker;
      });
      const id = current?.dataset.cinemaScene as SceneId | undefined;
      if (id) setActiveScene(previous => previous === id ? previous : id);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveScene);
    };
    updateActiveScene();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [colourImage, faceImage, fitImage, outfitImage]);

  const jumpTo = (id: SceneId) => {
    setActiveScene(id);
    document.getElementById(`cinema-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <main className="cinema-report">
      <header className="cinema-nav">
        <button type="button" className="cinema-nav-main" onClick={() => setMenuOpen(true)} aria-label="Open chapter navigation">
          <span className="cinema-wordmark">ICONIK</span>
          <span className="cinema-nav-scene">{sceneLinks.find(scene => scene.id === activeScene)?.label}</span>
          <ChevronDown size={15} />
        </button>
        <motion.i className="cinema-master-progress" style={{ scaleX: scrollYProgress }} />
      </header>

      <section id="cinema-reveal" data-cinema-scene="reveal" className="cinema-reveal">
        <div className="cinema-reveal-orbit orbit-one" />
        <div className="cinema-reveal-orbit orbit-two" />
        <div className="cinema-reveal-inner">
          <p className="cinema-kicker">Your personal blueprint</p>
          <h1><span>Four decisions.</span><em>One clear direction.</em></h1>
          <p>Your face, fit, colours and strongest outfit—revealed around you, not presented as another document.</p>
          <div className="cinema-reveal-facts">
            <span><b>{data.classification.face.face_shape}</b>Face</span>
            <span><b>{data.classification.colour.season}</b>Colour</span>
            <span><b>{data.classification.outfit_split.total}</b>Outfits</span>
          </div>
          <button type="button" className="cinema-begin" onClick={() => jumpTo('face')}>
            Begin your reveal <ArrowDown size={17} />
          </button>
        </div>
      </section>

      <FaceScene data={data} imageUrl={faceImage} />
      <FitScene data={data} imageUrl={fitImage} />
      <ColourScene data={data} imageUrl={colourImage} />
      <OutfitScene data={data} imageUrl={outfitImage} />

      <section className="cinema-close">
        <p className="cinema-kicker">This is only the beginning</p>
        <h2>Your complete wardrobe can now work this way.</h2>
        <p>The remaining outfits can become a fast visual library with the same garment hotspots, trusted-brand searches and save controls.</p>
        <button type="button" onClick={() => jumpTo('reveal')}>Return to the beginning</button>
      </section>

      {menuOpen && (
        <div className="cinema-menu" role="dialog" aria-modal="true" aria-label="Report chapters">
          <button type="button" className="cinema-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />
          <motion.div className="cinema-menu-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}>
            <div className="cinema-menu-head"><span>Explore your Blueprint</span><button type="button" onClick={() => setMenuOpen(false)}><X size={18} /></button></div>
            {sceneLinks.map(scene => {
              const Icon = scene.icon;
              return <button type="button" key={scene.id} className={activeScene === scene.id ? 'active' : ''} onClick={() => jumpTo(scene.id)}><Icon size={18} /><span>{scene.label}</span><ArrowUpRight size={15} /></button>;
            })}
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        html:has(.cinema-report) { scroll-behavior: auto; background: ${INK}; }
        body:has(.cinema-report) { background: ${INK}; }
        .cinema-report { min-height: 100dvh; overflow: clip; background: ${INK}; color: ${PAPER}; font-family: var(--font-inter), Inter, system-ui, sans-serif; }
        .cinema-report button, .cinema-report a { -webkit-tap-highlight-color: transparent; }
        .cinema-nav { position: fixed; z-index: 80; top: 0; left: 0; right: 0; color: ${PAPER}; background: linear-gradient(180deg, rgba(16,14,12,.9), rgba(16,14,12,.58) 70%, transparent); padding: calc(10px + env(safe-area-inset-top)) 18px 18px; pointer-events: none; }
        .cinema-nav-main { width: 100%; display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 9px; color: inherit; pointer-events: auto; text-align: left; }
        .cinema-wordmark { font-family: var(--font-fraunces), Fraunces, Georgia, serif; font-size: 15px; letter-spacing: .24em; }
        .cinema-nav-scene { font-size: 11px; font-weight: 600; color: rgba(244,239,229,.7); }
        .cinema-master-progress { position: absolute; left: 18px; right: 18px; bottom: 9px; height: 1px; display: block; transform-origin: left; background: rgba(244,239,229,.55); }
        .cinema-reveal { position: relative; min-height: 100svh; display: grid; place-items: center; overflow: hidden; padding: 110px 24px 50px; background: radial-gradient(circle at 50% 32%, #3c3128 0, #221d18 34%, ${INK} 70%); }
        .cinema-reveal::after { content: ''; position: absolute; inset: 0; opacity: .17; background-image: radial-gradient(circle at 1px 1px, ${PAPER} 1px, transparent 0); background-size: 4px 4px; mask-image: linear-gradient(to bottom, black, transparent 70%); }
        .cinema-reveal-inner { position: relative; z-index: 2; width: min(100%, 540px); text-align: center; }
        .cinema-kicker { margin: 0 0 13px; color: ${BRASS}; font-size: 10px; font-weight: 650; letter-spacing: .19em; text-transform: uppercase; }
        .cinema-reveal h1 { margin: 0; font-family: var(--font-fraunces), Fraunces, Georgia, serif; font-size: clamp(49px, 15vw, 78px); font-weight: 330; letter-spacing: -.045em; line-height: .91; }
        .cinema-reveal h1 span, .cinema-reveal h1 em { display: block; }
        .cinema-reveal h1 em { font-weight: 300; }
        .cinema-reveal-inner > p:not(.cinema-kicker) { max-width: 420px; margin: 25px auto 0; color: rgba(244,239,229,.7); font-size: 16px; line-height: 1.55; }
        .cinema-reveal-facts { display: grid; grid-template-columns: repeat(3,1fr); margin: 32px 0; border-top: 1px solid rgba(244,239,229,.13); border-bottom: 1px solid rgba(244,239,229,.13); }
        .cinema-reveal-facts span { min-width: 0; padding: 15px 7px; color: rgba(244,239,229,.5); font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
        .cinema-reveal-facts span + span { border-left: 1px solid rgba(244,239,229,.13); }
        .cinema-reveal-facts b { display: block; overflow: hidden; margin-bottom: 5px; color: ${PAPER}; font-family: var(--font-fraunces), Fraunces, Georgia, serif; font-size: 16px; font-weight: 400; letter-spacing: 0; text-overflow: ellipsis; text-transform: none; white-space: nowrap; }
        .cinema-begin { display: inline-flex; align-items: center; gap: 10px; border: 1px solid rgba(244,239,229,.2); border-radius: 999px; padding: 13px 18px; color: ${PAPER}; background: rgba(244,239,229,.08); font-size: 13px; font-weight: 600; backdrop-filter: blur(12px); }
        .cinema-reveal-orbit { position: absolute; border: 1px solid rgba(208,164,107,.18); border-radius: 50%; }
        .orbit-one { width: 72vw; height: 72vw; max-width: 430px; max-height: 430px; }
        .orbit-two { width: 115vw; height: 115vw; max-width: 680px; max-height: 680px; }
        .cinema-scene { position: relative; height: 330svh; background: ${INK}; }
        .cinema-fit-scene { background: #11191c; }
        .cinema-colour-scene { background: #1b1713; }
        .cinema-outfit-scene { height: 410svh; background: #11100e; }
        .cinema-sticky { position: sticky; top: 0; height: 100svh; min-height: 620px; overflow: hidden; isolation: isolate; }
        .cinema-progress-local { position: absolute; z-index: 20; top: calc(56px + env(safe-area-inset-top)); left: 18px; right: 18px; height: 2px; transform-origin: left; background: ${BRASS}; }
        .cinema-visual { position: absolute; inset: 0; overflow: hidden; background: #25211d; }
        .cinema-visual > img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: 50% 24%; filter: saturate(.88) contrast(1.02); }
        .cinema-fit-visual > img, .cinema-outfit-visual > img { object-fit: contain; object-position: 50% 44%; background: #82969e; }
        .cinema-colour-visual > img { object-position: center; }
        .cinema-image-shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(18,15,13,.05) 20%, rgba(18,15,13,.1) 46%, rgba(18,15,13,.93) 78%, ${INK} 100%); }
        .cinema-fit-scene .cinema-image-shade { background: linear-gradient(180deg, rgba(12,18,20,.08) 15%, rgba(12,18,20,.12) 48%, rgba(12,18,20,.95) 80%, #11191c 100%); }
        .cinema-colour-scene .cinema-image-shade { background: linear-gradient(180deg, rgba(20,16,12,.02) 18%, rgba(20,16,12,.12) 52%, rgba(20,16,12,.94) 79%, #1b1713 100%); }
        .cinema-content { position: absolute; z-index: 12; left: 0; right: 0; bottom: max(24px, env(safe-area-inset-bottom)); padding: 0 22px; }
        .cinema-copy { max-width: 520px; }
        .cinema-copy h2, .cinema-outfit-content h2 { margin: 0; max-width: 520px; font-family: var(--font-fraunces), Fraunces, Georgia, serif; font-size: clamp(38px, 11vw, 58px); font-weight: 330; letter-spacing: -.035em; line-height: .96; text-wrap: balance; }
        .cinema-body { max-width: 520px; margin: 15px 0 0; color: rgba(244,239,229,.78); font-size: 16.5px; font-weight: 420; line-height: 1.52; }
        .cinema-dots { display: flex; gap: 6px; margin-top: 20px; }
        .cinema-dots i { width: 18px; height: 2px; border-radius: 2px; background: rgba(244,239,229,.24); transition: width .28s ease, background .28s ease; }
        .cinema-dots i.active { width: 38px; background: ${PAPER}; }
        .cinema-image-fallback { width: 100%; height: 100%; display: grid; place-items: center; color: rgba(244,239,229,.35); }
        .cinema-image-fallback svg { width: 56px; height: 56px; stroke-width: 1; }
        .cinema-face-guide { position: absolute; z-index: 4; top: 16%; left: 24%; width: 52%; height: 47%; opacity: .75; transition: all .55s cubic-bezier(.22,1,.36,1); }
        .cinema-face-guide i { position: absolute; width: 27px; height: 27px; border-color: rgba(244,239,229,.78); }
        .cinema-face-guide i:nth-child(1) { top: 0; left: 0; border-top: 1px solid; border-left: 1px solid; }
        .cinema-face-guide i:nth-child(2) { top: 0; right: 0; border-top: 1px solid; border-right: 1px solid; }
        .cinema-face-guide i:nth-child(3) { bottom: 0; left: 0; border-bottom: 1px solid; border-left: 1px solid; }
        .cinema-face-guide i:nth-child(4) { right: 0; bottom: 0; border-right: 1px solid; border-bottom: 1px solid; }
        .cinema-face-guide.guide-1 { top: 9%; height: 32%; }
        .cinema-face-guide.guide-2 { top: 30%; height: 30%; }
        .cinema-face-guide.guide-3 { top: 20%; left: 18%; width: 64%; height: 29%; }
        .cinema-focus-point { position: absolute; z-index: 5; left: 50%; width: 8px; height: 8px; margin: -4px; border-radius: 50%; border: 2px solid ${PAPER}; box-shadow: 0 0 0 7px rgba(244,239,229,.12); transition: top .5s ease, left .5s ease; }
        .face-point-0 { top: 48%; left: 51%; } .face-point-1 { top: 24%; left: 51%; } .face-point-2 { top: 52%; left: 51%; } .face-point-3 { top: 37%; left: 63%; }
        .cinema-measure-line { position: absolute; z-index: 5; left: 20%; width: 60%; height: 1px; background: rgba(244,239,229,.84); box-shadow: 0 0 18px rgba(255,255,255,.28); transition: top .55s cubic-bezier(.22,1,.36,1); }
        .cinema-measure-line.shoulder { top: 35%; } .cinema-measure-line.waist { top: 46%; } .cinema-measure-line.hem { top: 74%; }
        .cinema-measure-line::before, .cinema-measure-line::after { content:''; position:absolute; top:-5px; width:1px; height:11px; background:inherit; }
        .cinema-measure-line::before { left:0; } .cinema-measure-line::after { right:0; }
        .cinema-measure-line span { position: absolute; right: 0; bottom: 9px; color: ${PAPER}; font-size: 9px; font-weight: 650; letter-spacing: .16em; text-transform: uppercase; }
        .cinema-swatches { display: flex; gap: 8px; overflow-x: auto; margin: 19px -22px 0; padding: 0 22px 5px; scrollbar-width: none; }
        .cinema-swatches::-webkit-scrollbar { display:none; }
        .cinema-swatches button { flex: 0 0 auto; display: flex; align-items: center; gap: 7px; border: 1px solid rgba(244,239,229,.15); border-radius: 999px; padding: 7px 10px 7px 7px; color: rgba(244,239,229,.66); background: rgba(18,15,13,.44); font-size: 10px; backdrop-filter: blur(12px); transition: border-color .2s ease, color .2s ease; }
        .cinema-swatches button.active { border-color: var(--scene-colour); color: ${PAPER}; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--scene-colour) 55%, transparent); }
        .cinema-swatches i { width: 22px; height: 22px; border-radius: 50%; background: var(--swatch); box-shadow: inset 0 0 0 1px rgba(255,255,255,.28); }
        .cinema-outfit-visual { bottom: 36%; padding: calc(58px + env(safe-area-inset-top)) 12px 8px; background: #82969e; }
        .cinema-outfit-visual > img { object-position: center bottom; background: transparent; }
        .cinema-outfit-visual .cinema-image-shade { background: linear-gradient(180deg, transparent 84%, rgba(17,16,14,.18) 100%); }
        .cinema-outfit-content { padding-top: 24px; padding-bottom: 2px; background: #11100e; }
        .cinema-outfit-content h2 { font-size: clamp(34px, 10vw, 50px); }
        .cinema-hotspot { position: absolute; z-index: 9; left: 60%; display: flex; align-items: center; gap: 8px; color: ${PAPER}; transform: translateY(-50%); }
        .cinema-hotspot::before { content:''; position:absolute; right:100%; width:64px; height:1px; background:rgba(244,239,229,.38); }
        .cinema-hotspot i { width: 12px; height: 12px; border: 2px solid ${PAPER}; border-radius: 50%; background: rgba(17,16,14,.35); box-shadow: 0 0 0 0 rgba(244,239,229,.3); transition: box-shadow .25s ease, background .25s ease; }
        .cinema-hotspot span { border: 1px solid rgba(244,239,229,.2); border-radius: 999px; padding: 5px 8px; background: rgba(17,16,14,.66); font-size: 9px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; backdrop-filter: blur(8px); }
        .cinema-hotspot.active i { background: ${PAPER}; box-shadow: 0 0 0 8px rgba(244,239,229,.16); }
        .cinema-shop-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; border-bottom: 1px solid rgba(244,239,229,.4); padding-bottom: 5px; color: ${PAPER}; font-size: 12px; font-weight: 650; }
        .cinema-occasion { display: flex; align-items: flex-start; gap: 9px; max-width: 520px; margin: 17px 0 0; border-top: 1px solid rgba(244,239,229,.13); padding-top: 14px; color: rgba(244,239,229,.61); font-size: 12px; line-height: 1.45; }
        .cinema-occasion svg { flex:0 0 auto; margin-top:1px; color:${BRASS}; }
        .cinema-close { min-height: 88svh; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 80px 24px; color: ${INK}; background: ${PAPER}; }
        .cinema-close h2 { max-width: 620px; margin: 0; font-family: var(--font-fraunces), Fraunces, Georgia, serif; font-size: clamp(45px, 13vw, 72px); font-weight: 330; letter-spacing: -.04em; line-height: .94; }
        .cinema-close > p:not(.cinema-kicker) { max-width: 580px; margin: 22px 0 0; color: #625950; font-size: 17px; line-height: 1.55; }
        .cinema-close button { margin-top: 30px; border: 1px solid rgba(23,20,17,.18); border-radius: 999px; padding: 13px 17px; color: ${INK}; font-size: 13px; font-weight: 650; }
        .cinema-menu { position: fixed; z-index: 100; inset: 0; }
        .cinema-menu-backdrop { position: absolute; inset: 0; width: 100%; background: rgba(8,7,6,.68); backdrop-filter: blur(5px); }
        .cinema-menu-sheet { position: absolute; left: 0; right: 0; bottom: 0; border-radius: 24px 24px 0 0; padding: 10px 14px calc(16px + env(safe-area-inset-bottom)); color: ${PAPER}; background: #211d19; box-shadow: 0 -24px 70px rgba(0,0,0,.35); }
        .cinema-menu-head { display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(244,239,229,.1); padding:10px 8px 14px; font-family:var(--font-fraunces), Fraunces, Georgia, serif; font-size:20px; }
        .cinema-menu-head button { padding:7px; color:${PAPER}; }
        .cinema-menu-sheet > button { width:100%; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:12px; border-radius:13px; padding:13px 12px; color:rgba(244,239,229,.66); text-align:left; }
        .cinema-menu-sheet > button.active { color:${PAPER}; background:rgba(244,239,229,.08); }
        .cinema-menu-sheet > button span { font-size:14px; font-weight:600; }
        @media (min-width: 760px) {
          .cinema-content { left: 8vw; bottom: 8vh; width: min(48vw, 590px); }
          .cinema-visual { left: 42%; }
          .cinema-image-shade { background: linear-gradient(90deg, ${INK} 0, rgba(23,20,17,.86) 7%, transparent 55%), linear-gradient(180deg, transparent 58%, rgba(23,20,17,.84)); }
          .cinema-fit-scene .cinema-image-shade { background: linear-gradient(90deg, #11191c 0, rgba(17,25,28,.8) 7%, transparent 55%); }
          .cinema-colour-scene .cinema-image-shade { background: linear-gradient(90deg, #1b1713 0, rgba(27,23,19,.8) 7%, transparent 55%); }
          .cinema-outfit-visual { bottom:0; padding: calc(58px + env(safe-area-inset-top)) 18px 18px; }
          .cinema-outfit-content { background:none; }
          .cinema-menu-sheet { left:50%; transform:translateX(-50%); max-width:520px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cinema-report *, .cinema-report *::before, .cinema-report *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
        }
      `}</style>
    </main>
  );
}
