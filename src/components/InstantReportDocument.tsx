'use client';

import Image from 'next/image';
import { Download, ShieldCheck } from 'lucide-react';
import type { InstantReportV1 } from '@/lib/styleScan';

function Page({ number, eyebrow, title, dark = false, children }: { number: number; eyebrow: string; title: string; dark?: boolean; children: React.ReactNode }) {
  return <section className={`instant-page relative mx-auto mb-5 min-h-[900px] max-w-[760px] overflow-hidden rounded-[28px] border p-8 sm:p-12 ${dark ? 'border-[#2C2622] bg-[#2C2622] text-white' : 'border-[#2C2622]/10 bg-[#F8F3E9] text-[#2C2622]'}`}>
    <div className={`iconik-micro mb-8 ${dark ? 'text-white/42' : 'text-[#B68C52]'}`}>{String(number).padStart(2, '0')} · {eyebrow}</div><h2 className="iconik-display max-w-2xl text-4xl leading-tight sm:text-6xl">{title}</h2><div className="mt-9">{children}</div><div className={`absolute bottom-7 right-8 iconik-mono text-[9px] ${dark ? 'text-white/30' : 'text-[#2C2622]/30'}`}>ICONIK · {String(number).padStart(2, '0')}</div>
  </section>;
}

function List({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return <div className="space-y-3">{items.map((item, index) => <div key={`${item}-${index}`} className={`rounded-2xl border p-5 text-sm leading-7 ${dark ? 'border-white/10 bg-white/5 text-white/70' : 'border-[#2C2622]/10 bg-white text-[#2C2622]/68'}`}><span className="mr-3 font-medium text-[#B68C52]">{String(index + 1).padStart(2, '0')}</span>{item}</div>)}</div>;
}

export default function InstantReportDocument({ data, imageUrls }: { data: InstantReportV1; imageUrls: Array<string | null> }) {
  return <div className="bg-[#E9E0D0] px-3 py-5 sm:px-6 sm:py-8">
    <style>{`@media print { body { background:#F8F3E9 !important; } .instant-toolbar { display:none !important; } .instant-page { border-radius:0 !important; margin:0 !important; min-height:100vh !important; max-width:none !important; page-break-after:always; break-after:page; box-shadow:none !important; } }`}</style>
    <div className="instant-toolbar mx-auto mb-5 flex max-w-[760px] items-center justify-between rounded-2xl bg-white px-5 py-4"><div><div className="iconik-display tracking-[.22em]">I C O N I K</div><div className="mt-1 text-[10px] text-[#2C2622]/45">Private · stylist-reviewed</div></div><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#2C2622] px-5 py-3 text-xs text-white"><Download className="h-4 w-4" /> Download / Save PDF</button></div>
    <Page number={1} eyebrow="Your Instant Style Report" title="Ten outfits. One personal system." dark><div className="mt-20"><div className="iconik-display-it text-3xl text-white/78">Built from your photos, geometry, colouring and real life.</div><div className="mt-16 flex items-center gap-3 border-t border-white/12 pt-7 text-sm text-white/62"><ShieldCheck className="h-5 w-5 text-[#C9A96E]" /> Reviewed and signed by {data.signature}</div></div></Page>
    <Page number={2} eyebrow="Personal Style Snapshot" title="The wardrobe we are building for you."><p className="max-w-2xl text-base leading-8 text-[#2C2622]/68">{data.snapshot}</p><div className="mt-10 rounded-[24px] bg-[#EFE7D8] p-7"><div className="iconik-micro mb-3 text-[#B68C52]">The governing idea</div><p className="iconik-display-it text-3xl">{data.outfitSystem}</p></div></Page>
    <Page number={3} eyebrow="Body Geometry" title={`${data.geometry.shape} · ${data.geometry.verticalLine}`} dark><p className="max-w-2xl text-base leading-8 text-white/68">{data.geometry.interpretation}</p></Page>
    <Page number={4} eyebrow="Proportion Rules" title="How every silhouette earns its place."><List items={data.proportionRules} /></Page>
    <Page number={5} eyebrow="Chromatic Profile" title="The colours that make the outfit feel right." dark><p className="max-w-2xl text-base leading-8 text-white/68">{data.chromaticProfile}</p><div className="mt-10"><div className="iconik-micro mb-4 text-white/42">Use carefully or avoid</div><div className="flex flex-wrap gap-2">{data.avoidColours.map(colour => <span key={colour} className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/62">{colour}</span>)}</div></div></Page>
    <Page number={6} eyebrow="Complete Wearable Palette" title="Your wardrobe colour vocabulary."><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{data.palette.map(colour => <div key={colour.hex} className="overflow-hidden rounded-2xl border border-[#2C2622]/10 bg-white"><div className="h-24" style={{ background: colour.hex }} /><div className="p-4"><div className="text-sm font-medium">{colour.name}</div><div className="mt-1 text-[10px] text-[#2C2622]/40">{colour.hex}</div><p className="mt-2 text-[11px] leading-5 text-[#2C2622]/55">{colour.use}</p></div></div>)}</div></Page>
    <Page number={7} eyebrow="Face, Neckline & Finish" title="Direct attention where it flatters most."><div className="grid gap-5 sm:grid-cols-3">{[['Necklines',data.faceGuidance.necklines],['Accessories',data.faceGuidance.accessories],['Hair',data.faceGuidance.hair]].map(([title,items]) => <div key={String(title)} className="rounded-2xl bg-white p-5"><h3 className="iconik-display text-2xl">{String(title)}</h3><ul className="mt-4 space-y-3 text-xs leading-5 text-[#2C2622]/60">{(items as string[]).map(item => <li key={item}>— {item}</li>)}</ul></div>)}</div></Page>
    <Page number={8} eyebrow="Your Ten-Outfit System" title="Variation without wardrobe chaos." dark><p className="max-w-2xl text-base leading-8 text-white/68">{data.outfitSystem}</p><div className="mt-10 grid grid-cols-2 gap-3">{data.outfits.map(outfit => <div key={outfit.number} className="rounded-2xl border border-white/10 p-4 text-xs text-white/62"><span className="mr-2 text-[#C9A96E]">{String(outfit.number).padStart(2,'0')}</span>{outfit.title}</div>)}</div></Page>
    {data.outfits.map((outfit, index) => <Page key={outfit.number} number={9 + index} eyebrow={outfit.context} title={outfit.title}>
      {imageUrls[index] && <div className="relative mb-7 aspect-[2/3] max-h-[560px] overflow-hidden rounded-[24px] bg-[#EFE7D8]"><Image src={imageUrls[index]!} alt={outfit.title} fill unoptimized className="object-cover" /></div>}
      <div className="rounded-2xl bg-white p-6"><div className="iconik-micro mb-3 text-[#B68C52]">Head-to-toe formula</div><p className="text-sm leading-7 text-[#2C2622]/72">{outfit.formula}</p></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">{[['Silhouette',outfit.silhouetteRationale],['Colour',outfit.colourRationale],['Fit & coverage',outfit.coverageNotes]].map(([title,copy]) => <div key={title} className="rounded-2xl border border-[#2C2622]/10 p-4"><div className="iconik-micro mb-2 text-[#2C2622]/40">{title}</div><p className="text-[11px] leading-5 text-[#2C2622]/60">{copy}</p></div>)}</div>
    </Page>)}
    <Page number={19} eyebrow="Fit & Shopping Rules" title="The filters to use before you buy."><List items={data.shoppingRules} /></Page>
    <Page number={20} eyebrow="Your Personal Checklist" title="Run every future outfit through this." dark><List items={data.checklist} dark /><div className="mt-12 border-t border-white/12 pt-7"><div className="iconik-display-it text-3xl text-white/78">Signed, {data.signature}</div><p className="mt-3 text-xs text-white/40">Preliminary scan analysis confirmed through the complete report system.</p></div></Page>
  </div>;
}

