import type { Metadata } from "next";
import Link from "next/link";
import { SeoTeachingVisual } from "@/components/seo/SeoEditorial";

export const metadata: Metadata = {
  title: "Colour Analysis for Indian Weddings: Complete Guide — Iconik",
  description: "How undertone determines your best colours for Indian wedding occasions — bridal wear, mehendi, haldi, sangeet, reception, and wedding guest outfits. Complete guide by undertone.",
  keywords: "colour analysis Indian wedding, best colours Indian wedding undertone, bridal lehenga colour by undertone, wedding guest outfit colours India, mehendi outfit colour undertone, sangeet outfit colour India",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/colour-analysis-for-indian-weddings" },
  openGraph: {
    title: "Colour Analysis for Indian Weddings: Complete Guide — Iconik",
    description: "Best wedding colours by undertone — bridal wear, mehendi, sangeet, reception, and wedding guest outfits for Indian women.",
    url: "https://www.iconik.pro/colour-analysis/colour-analysis-for-indian-weddings",
    images: [{ url: "/images/seo/indian-wedding-colour-palette-iconik-og.webp", width: 1200, height: 630, alt: "Peacock, ruby, marigold, plum, antique gold and ivory Indian wedding palette — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Colour Analysis for Indian Weddings: Complete Guide — Iconik",
    description: "Best wedding colours by undertone — bridal wear, mehendi, sangeet, reception, and wedding guest outfits for Indian women.",
    images: ["/images/seo/indian-wedding-colour-palette-iconik-og.webp"],
  },
};

const faqs = [
  {
    q: "Can a cool undertone Indian bride wear red?",
    a: "Yes — but the specific red matters. Cool undertone brides look best in blue-based reds: deep crimson, berry red, wine, and magenta-red. Avoid orange-based reds like brick red or tomato red, which clash with a cool undertone. The classic Kanjivaram or Banarasi in a deep crimson with silver zari is one of the most stunning choices for a cool undertone bride.",
  },
  {
    q: "What colour lehenga suits warm undertone?",
    a: "Warm undertone brides look best in terracotta-red, deep burnt orange, golden yellow, warm burgundy, and rich copper. These harmonise with the golden-peachy base of warm skin. Gold zari and antique gold embroidery are the most flattering metallic choices. A warm terracotta-red Banarasi or a deep golden Kanjivaram are classic choices for warm undertone brides.",
  },
  {
    q: "What should a wedding guest with cool undertone wear?",
    a: "Cool undertone wedding guests look best in jewel tones — cobalt blue, emerald green, deep fuchsia, plum, and royal purple. These are also festive enough for Indian wedding occasions without clashing with the bride. Avoid the bride's specific colour (often red) as a matter of etiquette, and avoid very muted or pastel versions of cool colours which may not read well in wedding photography.",
  },
  {
    q: "Which colour is best for a mehendi outfit?",
    a: "Mehendi outfits are traditionally yellow or green — but the shade depends on your undertone. Warm undertone: warm marigold yellow, mustard, turmeric yellow, or warm olive green. Cool undertone: soft lemon yellow (cooler, not orange-based), pastel mint green, or dusty sage. Neutral undertone: soft gold-yellow or muted olive. For mehendi specifically, the occasion's warmth means warm undertone women have the most natural colour alignment — but cool undertone women can wear a cooler lemon yellow without it looking wrong.",
  },
  {
    q: "What colour saree should I wear as a wedding guest?",
    a: "For wedding guest sarees, choose your most flattering colour from your undertone palette — and then apply two etiquette rules: avoid white (associated with mourning in most Indian traditions) and avoid the exact colour the bride is wearing. Beyond those two rules, any colour from your palette that reads as festive is appropriate. Cool undertone guests look stunning in cobalt, emerald, and deep fuchsia sarees with silver zari. Warm undertone guests shine in terracotta, deep olive, and warm gold sarees with gold zari.",
  },
];

const occasions = [
  {
    name: "Haldi",
    description: "Yellow is traditional. The shade of yellow makes the difference.",
    warm: "Warm marigold, mustard, deep turmeric yellow — harmonise naturally with warm undertone",
    cool: "Soft lemon yellow, pale gold with cool quality, or pastel mint — cooler yellows that don't clash",
    neutral: "Soft gold-yellow or pale mustard — the midpoint between warm and cool yellow",
  },
  {
    name: "Mehendi",
    description: "Traditional greens and yellows. Both warm and cool versions exist.",
    warm: "Warm olive green, forest green, deep mustard, warm coral",
    cool: "Mint green, sage, soft lime, cool-toned teal",
    neutral: "Muted sage, soft olive, warm taupe — gentle neutrals that work for both",
  },
  {
    name: "Sangeet",
    description: "The most festive occasion — full saturation, bolder colour choices work well.",
    warm: "Bright terracotta, warm coral, deep orange, rich warm pink, golden yellow",
    cool: "Cobalt blue, fuchsia, deep teal, emerald, electric violet",
    neutral: "Dusty rose, muted teal, mauve, warm bronze — festive but not extreme",
  },
  {
    name: "Wedding / Pheras",
    description: "The centrepiece occasion. Bridal colours should be the most considered.",
    warm: "Deep terracotta-red, warm burgundy, golden yellow, burnt orange — with gold zari",
    cool: "Deep crimson, berry red, royal blue, deep plum — with silver or white gold zari",
    neutral: "Muted deep red, dusty rose, off-white, champagne, mauve — with antique gold zari",
  },
  {
    name: "Reception",
    description: "More formal and evening-focused — richer, more structured choices.",
    warm: "Rich gold, deep warm burgundy, copper, warm bronze — in silk or structured fabrics",
    cool: "Deep emerald, royal blue, deep plum, midnight navy — in silk or structured fabrics",
    neutral: "Warm champagne, dusty rose, greige, soft gold — elegant and versatile",
  },
];

export default function ColourAnalysisIndianWeddingsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/colour-analysis-for-indian-weddings#article",
        "headline": "Colour Analysis for Indian Weddings: Complete Guide",
        "description": "Complete guide to choosing wedding colours by undertone for Indian women — covering every occasion from mehendi and haldi through sangeet, pheras, and reception.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-04-01",
        "dateModified": "2026-07-24",
        "image": "https://www.iconik.pro/images/seo/indian-wedding-colour-palette-iconik.webp",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/colour-analysis-for-indian-weddings" },
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "Colour Analysis", "item": "https://www.iconik.pro/colour-analysis" },
          { "@type": "ListItem", "position": 3, "name": "Colour Analysis for Indian Weddings", "item": "https://www.iconik.pro/colour-analysis/colour-analysis-for-indian-weddings" },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">

          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
            <ol className="flex items-center gap-2 flex-wrap">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link href="/colour-analysis" className="hover:underline">Colour Analysis</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Colour Analysis for Indian Weddings</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Colour Analysis for Indian Weddings: Complete Guide
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Indian weddings involve multiple occasions, each with its own colour conventions and occasion wear requirements. Most colour advice for weddings focuses on skin depth — fair, wheatish, dusky — and produces recommendations that work for some women and not others. Undertone is what actually determines which colours look stunning on you. This guide breaks down the best colours for every Indian wedding occasion, organised by undertone.
            </p>
          </header>

          <SeoTeachingVisual
            src="/images/seo/indian-wedding-colour-palette-iconik.webp"
            alt="Indian wedding guest in peacock teal beside ruby, marigold, plum, antique-gold and ivory fabric swatches."
            caption="Build the wedding palette in order: undertone, occasion contrast, then the metal direction that completes the outfit."
            width={1003}
            height={1568}
            priority
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Undertone Matters More at Weddings</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              At weddings, you are seen up close, photographed extensively, and typically wearing your most expensive and considered outfits. The stakes for getting the colour right are higher than for everyday wear. A colour that slightly clashes with your undertone in a casual outfit is merely suboptimal; the same clash in a lehenga or silk saree in high-resolution photographs is much more visible.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The good news: the same undertone principle that applies to everyday colour selection applies to wedding colours. Warm undertones harmonise with golden, earthy, and orange-based colours. Cool undertones harmonise with jewel tones and blue-based colours. Neutral undertones work across both but look best in muted, slightly desaturated versions.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Colours by Occasion and Undertone</h2>
            <div className="space-y-6">
              {occasions.map((occ) => (
                <div key={occ.name} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                    <p className="font-bold text-gray-900">{occ.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{occ.description}</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <div className="px-5 py-3 flex gap-3">
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap h-fit mt-0.5">Warm</span>
                      <p className="text-sm text-gray-600">{occ.warm}</p>
                    </div>
                    <div className="px-5 py-3 flex gap-3">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 whitespace-nowrap h-fit mt-0.5">Cool</span>
                      <p className="text-sm text-gray-600">{occ.cool}</p>
                    </div>
                    <div className="px-5 py-3 flex gap-3">
                      <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 whitespace-nowrap h-fit mt-0.5">Neutral</span>
                      <p className="text-sm text-gray-600">{occ.neutral}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Zari and Embellishment by Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              For Indian ethnic wear, the border, zari, and embellishment colour are as important as the fabric body colour. The wrong zari on the right fabric colour can still create a clash.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Warm Undertone", zari: "Gold zari, antique gold, copper thread, warm bronze — harmonise directly with warm skin's golden base", bg: "bg-amber-50 border-amber-200" },
                { label: "Cool Undertone", zari: "Silver zari, white gold, platinum thread — harmonise with the cool undertone's pink-blue base", bg: "bg-blue-50 border-blue-200" },
                { label: "Neutral Undertone", zari: "Antique gold or rose gold — bridges warm and cool, works for the balanced neutral undertone", bg: "bg-gray-50 border-gray-200" },
              ].map((z) => (
                <div key={z.label} className={`border rounded-xl p-4 ${z.bg}`}>
                  <p className="font-semibold text-gray-900 mb-2 text-sm">{z.label}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{z.zari}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Wedding Guest Colour Guide</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Wedding guest outfit colour selection follows the same undertone principles — choose from your undertone palette, apply the occasion&apos;s festivity level, and observe two etiquette rules: avoid white (associated with mourning in most Indian traditions) and avoid the bride&apos;s specific colour.
            </p>
            <div className="space-y-3">
              {[
                { undertone: "Warm undertone guest", colours: "Terracotta, deep olive, warm gold, mustard, warm burgundy, rich coral — with gold jewellery and gold zari" },
                { undertone: "Cool undertone guest", colours: "Cobalt blue, emerald, deep fuchsia, plum, teal, navy — with silver jewellery and silver or white zari" },
                { undertone: "Neutral undertone guest", colours: "Dusty rose, muted teal, mauve, warm champagne, soft olive — with rose gold or antique gold jewellery" },
              ].map((g) => (
                <div key={g.undertone} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{g.undertone}</p>
                  <p className="text-sm text-gray-600">{g.colours}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="divide-y divide-gray-200">
              {faqs.map((faq, i) => (
                <div key={i} className="py-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones — Full Guide</Link></li>
              <li>→ <Link href="/colour-analysis/saree-colours-by-undertone" className="underline hover:opacity-70">Saree Colours by Undertone</Link></li>
              <li>→ <Link href="/colour-analysis/warm-undertone" className="underline hover:opacity-70">Warm Undertone Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/cool-undertone" className="underline hover:opacity-70">Cool Undertone Colour Guide</Link></li>
              <li>→ <Link href="/style-guides/indian-wedding-guest-outfit" className="underline hover:opacity-70">Indian Wedding Guest Outfit Guide</Link></li>
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone at Home</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Know your exact colours before the wedding season</h2>
            <p className="text-gray-600 mb-6">Chromatic Harmony Mapping™ identifies your undertone and builds a 10-colour palette with specific wedding occasion guidance — bridal, guest, and festive wear included. Part of your Iconik Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Colour Analysis for Indian Weddings: Complete Guide.&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis/colour-analysis-for-indian-weddings</p>
          </div>

        </div>
      </main>
    </>
  );
}
