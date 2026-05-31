'use client';

import Image from 'next/image';
import type { ResolvedStyleEditImageUrls, StyleEditPageData } from '@/lib/styleEditTypes';

const INK = '#1B1815';
const SOFT = '#5A524A';
const ACCENT = '#B97A3A';
const IVORY = '#FBF8F4';
const SHELL = '#F5EFE5';
const BORDER = '#E8DDC9';

function VisualCard({ src, label }: { src?: string | null; label: string }) {
  if (!src) return null;
  return (
    <div className="relative overflow-hidden border" style={{ borderColor: BORDER, background: SHELL, aspectRatio: '4 / 5', borderRadius: 8 }}>
      <Image src={src} alt={label} fill sizes="(min-width: 900px) 33vw, 100vw" className="object-cover" />
    </div>
  );
}

export default function StyleEditIssuePage({
  data,
  imageUrls,
}: {
  data: StyleEditPageData;
  imageUrls?: ResolvedStyleEditImageUrls | null;
}) {
  return (
    <article style={{ background: IVORY, color: INK }}>
      <section className="px-5 md:px-12 py-12 md:py-16 min-h-[86vh] flex flex-col justify-between">
        <div className="max-w-5xl">
          <p className="text-[10px] uppercase font-bold mb-5" style={{ color: ACCENT, letterSpacing: '0.28em' }}>THE ICONIK EDIT · {data.weekLabel}</p>
          <h1 className="font-serif text-4xl md:text-7xl leading-tight max-w-4xl">{data.clientName}&apos;s {data.issueTitle}</h1>
          <p className="mt-5 text-lg md:text-xl max-w-2xl leading-relaxed" style={{ color: SOFT }}>{data.subtitle}</p>
        </div>
        <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-6 mt-10 items-end">
          <VisualCard src={imageUrls?.heroCard} label="ICONIK Edit weekly visual" />
          <div className="border p-6 md:p-8" style={{ borderColor: BORDER, background: '#FFFFFF', borderRadius: 8 }}>
            <p className="text-[10px] uppercase font-bold mb-3" style={{ color: ACCENT, letterSpacing: '0.22em' }}>This Week&apos;s Direction</p>
            <p className="text-base md:text-lg leading-8" style={{ color: SOFT }}>{data.diagnosis}</p>
          </div>
        </div>
      </section>

      <section className="px-5 md:px-12 py-12 border-y" style={{ borderColor: BORDER, background: SHELL }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] uppercase font-bold mb-6" style={{ color: ACCENT, letterSpacing: '0.24em' }}>Outfit Formulas</p>
          <div className="grid md:grid-cols-3 gap-4">
            {data.outfits.map((outfit, index) => (
              <div key={`${outfit.title}-${index}`} className="border bg-white p-5" style={{ borderColor: BORDER, borderRadius: 8 }}>
                <p className="text-[10px] uppercase font-bold mb-2" style={{ color: ACCENT, letterSpacing: '0.18em' }}>{outfit.occasion || `Look ${index + 1}`}</p>
                <h2 className="font-serif text-2xl mb-3">{outfit.title}</h2>
                <p className="text-sm leading-6 mb-3" style={{ color: SOFT }}>{outfit.formula}</p>
                <p className="text-sm leading-6 mb-3" style={{ color: SOFT }}><strong style={{ color: INK }}>Colour:</strong> {outfit.colourLogic}</p>
                <p className="text-sm leading-6" style={{ color: SOFT }}>{outfit.stylingNotes}</p>
              </div>
            ))}
          </div>
          {(imageUrls?.outfitCards ?? []).length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              {(imageUrls?.outfitCards ?? []).map((src, index) => <VisualCard key={index} src={src} label={`Outfit visual ${index + 1}`} />)}
            </div>
          )}
        </div>
      </section>

      <section className="px-5 md:px-12 py-12">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_1fr] gap-6">
          <div className="border bg-white p-6" style={{ borderColor: BORDER, borderRadius: 8 }}>
            <p className="text-[10px] uppercase font-bold mb-4" style={{ color: ACCENT, letterSpacing: '0.22em' }}>Palette + Shopping</p>
            <ul className="space-y-3 text-sm leading-6" style={{ color: SOFT }}>
              {[...data.paletteNotes, ...data.shoppingRules].map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
          <div className="border p-6" style={{ borderColor: BORDER, background: SHELL, borderRadius: 8 }}>
            <p className="text-[10px] uppercase font-bold mb-4" style={{ color: ACCENT, letterSpacing: '0.22em' }}>Avoid This Week</p>
            <ul className="space-y-3 text-sm leading-6" style={{ color: SOFT }}>
              {data.avoidThisWeek.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-6 border p-6 md:p-8 text-center" style={{ borderColor: BORDER, background: '#FFFFFF', borderRadius: 8 }}>
          <p className="font-serif text-2xl mb-2">{data.replyPrompt}</p>
          <p className="text-[10px] uppercase font-bold" style={{ color: ACCENT, letterSpacing: '0.22em' }}>Reply to your ICONIK email</p>
        </div>
      </section>
    </article>
  );
}
