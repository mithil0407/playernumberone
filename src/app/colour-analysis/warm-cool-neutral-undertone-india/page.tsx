import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Warm vs Cool vs Neutral Undertone for Indian Women — Iconik",
  description: "Understand the difference between warm, cool, and neutral undertones for Indian women. Which colours suit each undertone, how to identify yours, and how Chromatic Harmony Mapping™ works.",
  keywords: "warm vs cool undertone India, neutral undertone Indian skin, undertone guide Indian women, warm undertone colours India, cool undertone Indian skin tone",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/warm-cool-neutral-undertone-india" },
  openGraph: {
    title: "Warm vs Cool vs Neutral Undertone for Indian Women — Iconik",
    description: "The definitive undertone comparison guide for Indian women — what each means, which colours work, and the science behind Chromatic Harmony Mapping™.",
    url: "https://www.iconik.pro/colour-analysis/warm-cool-neutral-undertone-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Warm vs cool vs neutral undertone guide for Indian women — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Warm vs Cool vs Neutral Undertone for Indian Women — Iconik",
    description: "The definitive undertone comparison guide for Indian women — what each means, which colours work.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "Can Indian women have a cool undertone?",
    a: "Yes. Undertone is not correlated with Indian ethnicity or skin depth. Many Indian women have cool undertones and look washed out in warm earth tones. They look their best in jewel tones — cobalt, emerald, royal purple. Chromatic Harmony Mapping™ accounts for this full range.",
  },
  {
    q: "What undertone is most common in Indian women?",
    a: "Warm undertone is the most common in Indian women, followed by neutral. Cool undertone is less frequent but far from rare. The dominance of warm undertones in the population has led to most generic Indian styling advice defaulting to warm palettes — which fails a significant portion of Indian women.",
  },
  {
    q: "What if I look good in both warm and cool colours?",
    a: "You likely have a neutral undertone. Neutral is not the absence of an undertone — it is a balance of both warm and cool. Chromatic Harmony Mapping™ helps neutral-undertone women identify the specific muted or greyed palette that works best, rather than wearing extremes of either category.",
  },
  {
    q: "Why do generic colour guides for Indians get it wrong?",
    a: "They conflate surface skin tone with undertone. Advice like 'best colours for dusky skin' or 'best colours for fair Indian skin' ignores the undertone variable entirely. Two women with identical surface tones can have opposite undertones and need completely different colour palettes.",
  },
];

export default function WarmCoolNeutralUndertonePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/warm-cool-neutral-undertone-india#article",
        "headline": "Warm vs Cool vs Neutral Undertone: The Complete Indian Skin Guide",
        "description": "Comprehensive comparison of warm, cool, and neutral undertones for Indian women — with colour palettes and the science behind Chromatic Harmony Mapping™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-01-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/warm-cool-neutral-undertone-india" },
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
          { "@type": "ListItem", "position": 3, "name": "Warm vs Cool vs Neutral Undertone", "item": "https://www.iconik.pro/colour-analysis/warm-cool-neutral-undertone-india" },
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
              <li className="text-gray-800 font-medium">Warm vs Cool vs Neutral</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Warm vs Cool vs Neutral Undertone: The Complete Indian Skin Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Your undertone is the fixed, underlying tone beneath your surface skin colour. For Indian women, correctly identifying undertone is the single biggest unlock in dressing well — it determines which colours energise your complexion and which ones drain it. Here is the complete breakdown.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is the Difference Between Skin Tone and Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Skin tone describes the surface depth of your skin — fair, medium, wheatish, dusky, or deep. It changes with sun exposure, seasons, and age. Undertone is the fixed hue that lives beneath the surface — warm, cool, or neutral — and it never changes.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Two women can have identical surface skin tones and completely opposite undertones. This is why generic &quot;colours for wheatish skin&quot; or &quot;colours for dusky Indian women&quot; advice fails so consistently — it addresses the wrong variable. The determining factor for colour harmony is always undertone, not surface depth.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Iconik&apos;s Chromatic Harmony Mapping™ addresses both variables: undertone type AND melanin depth — producing a palette that is precise rather than generic.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is a Warm Undertone — and What Does It Mean for Indian Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A warm undertone has a yellow, golden, or peachy base. It is the most common undertone in Indian women. Veins appear greenish on the inner wrist. Gold jewellery looks more flattering than silver. Ivory and off-white look better against the skin than stark white.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Best colours for warm undertone:</strong> Terracotta, burnt orange, rust, mustard yellow, olive green, camel, warm reds (tomato red, brick red), coral, peach, earthy browns, gold, warm cream.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Colours to approach with caution:</strong> Icy pastels, cool lavender, ashy grey, stark white, cool fuchsia. These create a clash with the yellow-based undertone, making the skin appear sallow or dull.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is a Cool Undertone — and What Does It Mean for Indian Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A cool undertone has a pink, blue, or red base. It is less frequently acknowledged in Indian styling contexts — but it is not rare. Veins appear blue-purple on the inner wrist. Silver and white gold look more flattering than yellow gold. Stark white looks clean and fresh against the skin.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Best colours for cool undertone:</strong> Cobalt blue, emerald green, royal purple, fuchsia, magenta, burgundy, cool pinks, navy, icy pastels, jewel tones across the spectrum.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Colours to approach with caution:</strong> Mustard, warm orange, earthy brown, camel, gold. These introduce a yellow warmth that clashes with the pink or blue base of a cool undertone, making the skin appear greyish or tired.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is a Neutral Undertone — and Why Is It Often Overlooked?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A neutral undertone is a genuine balance of both warm and cool. It is not the absence of an undertone — it is an undertone in its own right. Both gold and silver jewellery look equally flattering. Veins appear blue-green. Skin looks neither clearly yellow nor clearly pink next to white paper.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Neutral undertone women have the widest colour range — they can wear both warm and cool colours. However, they typically look their best in muted, slightly greyed versions of colours rather than the full-saturation extremes of either category.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Best colours for neutral undertone:</strong> Dusty rose, muted teal, warm taupe, greyed lavender, soft olive, camel, blush pink, stone, greyed blue. Colours that are neither fully saturated warm nor fully saturated cool. See the <Link href="/colour-analysis/neutral-undertone" className="underline hover:opacity-70">complete neutral undertone guide</Link>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Undertone Comparison at a Glance</h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              In summary: warm undertone is identified by greenish veins, gold jewellery preference, and flattery from earthy tones. Cool undertone by blue-purple veins, silver preference, and jewel tones. Neutral by mixed signals across tests and equal flattery from both warm and cool colours at reduced saturation.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-900">Feature</th>
                    <th className="text-left p-3 font-semibold text-gray-900">Warm</th>
                    <th className="text-left p-3 font-semibold text-gray-900">Cool</th>
                    <th className="text-left p-3 font-semibold text-gray-900">Neutral</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="p-3 font-medium">Vein colour</td><td className="p-3">Greenish</td><td className="p-3">Blue-purple</td><td className="p-3">Blue-green mix</td></tr>
                  <tr><td className="p-3 font-medium">Best jewellery</td><td className="p-3">Gold</td><td className="p-3">Silver</td><td className="p-3">Both</td></tr>
                  <tr><td className="p-3 font-medium">White paper test</td><td className="p-3">Yellow/olive cast</td><td className="p-3">Pink/grey cast</td><td className="p-3">No clear cast</td></tr>
                  <tr><td className="p-3 font-medium">Best white</td><td className="p-3">Ivory, off-white</td><td className="p-3">Stark white</td><td className="p-3">Either</td></tr>
                  <tr><td className="p-3 font-medium">Signature colours</td><td className="p-3">Terracotta, mustard, coral</td><td className="p-3">Cobalt, emerald, fuchsia</td><td className="p-3">Dusty rose, muted teal, taupe</td></tr>
                  <tr><td className="p-3 font-medium">Avoid</td><td className="p-3">Icy pastels, ashy grey</td><td className="p-3">Mustard, warm orange</td><td className="p-3">Saturated extremes</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Chromatic Harmony Mapping™ Go Further?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Identifying your undertone category (warm, cool, or neutral) is the first step. Chromatic Harmony Mapping™ goes further by mapping your undertone together with your melanin depth to identify the exact shades within your category that work best.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Two warm undertone women — one fair-skinned, one deep-skinned — share the same undertone category but need different shade intensities. A deep warm undertone woman needs colours with higher chromatic intensity to create visual harmony. A fair warm undertone woman may suit softer, peachy versions of the same palette. CHM accounts for both variables simultaneously, producing a 10-colour palette that is exact rather than categorical.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="divide-y divide-gray-200">
              {faqs.map((faq, i) => (
                <div key={i} className="py-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600 leading-relaxed faq-answer">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones — Full Guide</Link></li>
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone: 3 At-Home Tests</Link></li>
              <li>→ <Link href="/colour-analysis/indian-skin-tones" className="underline hover:opacity-70">Indian Skin Tone Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/warm-undertone" className="underline hover:opacity-70">Warm Undertone: Full Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/cool-undertone" className="underline hover:opacity-70">Cool Undertone: Full Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/neutral-undertone" className="underline hover:opacity-70">Neutral Undertone: Full Colour Guide</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your exact colour palette within 5 working days after the consultation?</h2>
            <p className="text-gray-600 mb-6">Iconik&apos;s Chromatic Harmony Mapping™ identifies your undertone and melanin depth, then maps them to an exact 10-colour palette — part of your personalised Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Warm vs Cool vs Neutral Undertone: The Complete Indian Skin Guide.&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis/warm-cool-neutral-undertone-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
