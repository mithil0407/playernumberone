import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Clock3, ImageIcon, ShieldCheck, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ICONIK Instant Style Report — 10 Personal Outfits for ₹999',
  description: 'Turn your ICONIK Style Scan into a stylist-reviewed report with ten visual outfit formulas, your palette, geometry and shopping rules.',
};

export default async function InstantReportSalesPage({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan = '' } = await searchParams;
  const checkout = scan ? `/instant-report/checkout?scan=${encodeURIComponent(scan)}` : '/style-scan';
  const sections = [
    'Your body geometry and proportion rules', 'Undertone, depth, contrast and complete wearable palette',
    'Face, neckline, accessory and hair direction', '10 complete outfit formulas with generated visuals',
    'Fit rules, shopping filters and final checklist', 'Reviewed and signed by the ICONIK Styling Team',
  ];
  return <div className="min-h-screen bg-[#F8F3E9] text-[#2C2622]">
    <header className="border-b border-[#2C2622]/10"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><span className="iconik-display tracking-[.3em]">I C O N I K</span><span className="iconik-micro text-[#2C2622]/45">INSTANT REPORT</span></div></header>
    <main>
      <section className="px-5 py-16 sm:py-24"><div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <div><div className="iconik-micro mb-6 text-[#B68C52]">YOUR SCAN, TURNED INTO A WARDROBE SYSTEM</div><h1 className="iconik-display text-5xl leading-[.97] sm:text-7xl lg:text-[84px]">10 outfits. Zero guesswork.</h1><p className="mt-7 max-w-2xl text-base leading-7 text-[#2C2622]/65">A personal style report built from your photos and Style Scan—then checked and signed by the ICONIK Styling Team.</p>
          <div className="mt-8 flex items-end gap-3"><span className="iconik-display text-5xl">₹999</span><span className="pb-2 text-xs text-[#2C2622]/45">one-time · no subscription</span></div>
          <Link href={checkout} className="mt-8 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#2C2622] px-8 text-sm font-medium text-white">Get My 10-Outfit Report <ArrowRight className="h-4 w-4" /></Link>
          {!scan && <p className="mt-3 text-xs text-[#A34D3F]">Complete the free Style Scan first so your report has the two required photos.</p>}
        </div>
        <div className="rounded-[32px] bg-[#2C2622] p-7 text-white sm:p-10"><div className="iconik-micro mb-6 text-white/45">WHAT ARRIVES</div>{sections.map(item => <div key={item} className="mb-3 flex items-start gap-3 rounded-2xl border border-white/10 p-4 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-[#C9A96E]" />{item}</div>)}</div>
      </div></section>
      <section className="bg-[#EFE7D8] px-5 py-16"><div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">{[
        [Sparkles, 'Built from you', 'Your two photos, five scan answers and two-minute refinement—not a generic body-type template.'],
        [ImageIcon, 'Ten visual formulas', 'Every outfit is specified head-to-toe and paired with its own editorial visual.'],
        [Clock3, 'Within 24 hours', 'The clock starts after payment and your short refinement are both complete.'],
      ].map(([Icon, title, copy]) => { const C = Icon as typeof Sparkles; return <article key={String(title)} className="rounded-2xl bg-white p-7"><C className="mb-5 h-5 w-5 text-[#B68C52]" /><h2 className="iconik-display text-2xl">{String(title)}</h2><p className="mt-3 text-xs leading-6 text-[#2C2622]/60">{String(copy)}</p></article>; })}</div></section>
      <section className="px-5 py-16 text-center"><ShieldCheck className="mx-auto mb-5 h-6 w-6 text-[#66806B]" /><h2 className="iconik-display text-4xl sm:text-6xl">Stylist-signed before you see it.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#2C2622]/60">Automation builds the first draft. A human reviewer checks the report as one complete system and publishes it under the ICONIK Styling Team signature.</p><Link href={checkout} className="mt-8 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#2C2622] px-8 text-sm font-medium text-white">Start My Report <ArrowRight className="h-4 w-4" /></Link></section>
    </main>
  </div>;
}

