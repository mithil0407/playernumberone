import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Neutral Undertone: Colour Guide for Indian Women — Iconik",
  description: "Neutral undertone is a balance of warm and cool — the most versatile undertone. Complete colour guide for neutral undertone Indian women, including identification tests and best colours.",
  keywords: "neutral undertone Indian women, neutral undertone colours India, neutral skin tone palette India, warm cool neutral undertone India, neutral undertone guide Indian skin",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/neutral-undertone" },
  openGraph: {
    title: "Neutral Undertone: Colour Guide for Indian Women — Iconik",
    description: "Neutral undertone is a balance of warm and cool. Complete colour guide and identification tests for Indian women.",
    url: "https://www.iconik.pro/colour-analysis/neutral-undertone",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Neutral undertone colour guide for Indian women — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Neutral Undertone: Colour Guide for Indian Women — Iconik",
    description: "Neutral undertone is a balance of warm and cool. Complete colour guide and identification tests for Indian women.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "How do I know if I have a neutral undertone?",
    a: "Signs of a neutral undertone: both gold and silver jewellery look equally flattering; your veins appear blue-green (not distinctly green or blue-purple); holding white paper next to your face shows no clear yellow or pink cast; and you look good in both warm earthy colours and cool jewel tones without either clearly dominating. If all three undertone tests give inconsistent results, neutral is the most likely answer.",
  },
  {
    q: "What is the difference between neutral undertone and no undertone?",
    a: "There is no such thing as 'no undertone'. Neutral is an undertone category in its own right — a genuine balance of warm and cool pigment. Neutral undertone women are not colourless; they are simply equally influenced by both warm and cool wavelengths. This gives them the widest colour range of any undertone category.",
  },
  {
    q: "Can neutral undertone Indian women wear both gold and silver jewellery?",
    a: "Yes — this is one of the clearest markers of neutral undertone. Both metals look equally flattering. Neutral undertone women are not locked into one metal as warm or cool undertone women are. Rose gold also tends to work exceptionally well for neutral undertones.",
  },
  {
    q: "What colours should neutral undertone Indian women avoid?",
    a: "Neutral undertone women generally look their best avoiding the most intensely saturated extremes — both the most electric jewel tones and the most vivid earthy brights. Muted, slightly greyed, or dusty versions of colours tend to be the most flattering. Very saturated colours can overwhelm a neutral undertone rather than harmonise with it.",
  },
  {
    q: "Is neutral undertone common in Indian women?",
    a: "Neutral undertone is the second most common undertone in Indian women, after warm. It is particularly common in women with wheatish or medium skin tones, where the balance of warm and cool pigments is less clearly weighted in one direction. Many Indian women who feel 'nothing suits me completely' often find they have a neutral undertone that needs a muted palette rather than saturated extremes.",
  },
];

export default function NeutralUndertonePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/neutral-undertone#article",
        "headline": "Neutral Undertone: Colour Guide for Indian Women",
        "description": "Complete colour guide for neutral undertone Indian women — identification tests, best colours, and how Chromatic Harmony Mapping™ works for neutral undertone skin.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-03-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/neutral-undertone" },
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
          { "@type": "ListItem", "position": 3, "name": "Neutral Undertone", "item": "https://www.iconik.pro/colour-analysis/neutral-undertone" },
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
              <li className="text-gray-800 font-medium">Neutral Undertone</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Neutral Undertone: Colour Guide for Indian Women
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Neutral undertone is a genuine balance of warm and cool pigment — not an absence of undertone. Neutral undertone Indian women have the widest colour range of any undertone category, but look their best in muted, slightly greyed versions of colours rather than full-saturation extremes. This guide explains how to identify a neutral undertone and which specific colours work best.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is a Neutral Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A neutral undertone means your skin has an approximately equal balance of warm (yellow/golden) and cool (pink/blue) pigment. It is the second most common undertone in Indian women, after warm, and is especially prevalent in women with wheatish or medium skin depths.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Neutral is not a default category for &quot;couldn&apos;t determine.&quot; It is a real undertone with its own characteristic palette. The key difference from warm and cool is that it responds best to colours that are somewhat desaturated — the vivid extremes of warm earthy colours AND cool jewel tones can feel equally off. Muted, dusty, and toned-down versions of both palettes tend to be the most flattering.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Many Indian women who feel that &quot;nothing quite right&quot; in standard warm or cool advice actually have a neutral undertone — they need a palette designed for them specifically, not a default version of the warm or cool palette.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Identify a Neutral Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Neutral undertone is identified by mixed or inconclusive signals across standard tests:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Vein colour:</strong> appears blue-green — neither clearly blue-purple nor clearly green</li>
              <li><strong>Jewellery:</strong> both gold and silver look equally flattering against your skin</li>
              <li><strong>White paper test:</strong> your skin shows no strong cast — neither clearly golden/olive nor clearly pink/grey</li>
              <li><strong>Clothing response:</strong> you look reasonably good in both warm and cool colours, but neither set is dramatically better than the other</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              If the three standard tests consistently give conflicting results, or if none of them produce a clear signal, neutral undertone is the most accurate classification. Take the full <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">at-home undertone test guide</Link> for a step-by-step walkthrough.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Colours for Neutral Undertone Indian Women</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Neutral undertone women can draw from both warm and cool palettes — but the key is to choose muted, slightly greyed, or dusty versions of colours rather than highly saturated extremes.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { name: "Dusty Rose", desc: "Muted pink — sits between warm and cool, universally flattering on neutral undertones" },
                { name: "Warm Taupe", desc: "Greyed warm neutral — sophisticated and grounding" },
                { name: "Muted Teal", desc: "Greyed blue-green — works beautifully because it is neither fully warm nor fully cool" },
                { name: "Soft Olive", desc: "Muted earthy green — a neutral that complements without overpowering" },
                { name: "Greyed Lavender", desc: "Dusty purple — the muted version is more flattering than vivid violet" },
                { name: "Blush Pink", desc: "Soft, muted pink-nude — works across neutral undertones at different skin depths" },
                { name: "Stone and Greige", desc: "Warm grey — a sophisticated neutral that anchors any look" },
                { name: "Soft Camel", desc: "Lighter, less saturated camel — bridges warm and cool tones" },
              ].map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-600 leading-relaxed">
              Beyond the muted palette, neutral undertone women can also experiment with both warm and cool colours — the key is to approach vivid colours with care and always check whether it is the warm or cool version of that colour that looks better on you.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Colours to Approach with Caution</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Neutral undertone women are most likely to clash with the most extreme versions of both warm and cool palettes:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Vivid, electric jewel tones at full saturation (cobalt, electric fuchsia) — can overwhelm</li>
              <li>Very vivid earthy brights (fire orange, neon terracotta) — similarly overwhelming</li>
              <li>Very icy, pale pastels — tend to wash out neutral undertones</li>
              <li>Very deep, highly saturated darks without a muted quality — can read harsh</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Chromatic Harmony Mapping™ Work for Neutral Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Neutral undertone is the most nuanced category to map correctly — because the palette is not simply &quot;any colour at medium saturation.&quot; The specific balance of warm and cool in a neutral undertone varies per individual, and the melanin depth affects which shade intensities work best.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Chromatic Harmony Mapping™ identifies whether a neutral undertone leans slightly warm or slightly cool, and builds a 10-colour palette calibrated to that specific balance — rather than defaulting to generic muted colours. The result is a palette that feels immediately right rather than merely acceptable.
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
              <li>→ <Link href="/colour-analysis/warm-cool-neutral-undertone-india" className="underline hover:opacity-70">Warm vs Cool vs Neutral Undertone: Complete Comparison</Link></li>
              <li>→ <Link href="/colour-analysis/warm-undertone" className="underline hover:opacity-70">Warm Undertone Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/cool-undertone" className="underline hover:opacity-70">Cool Undertone Colour Guide</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get your exact colour palette in 48 hours</h2>
            <p className="text-gray-600 mb-6">Chromatic Harmony Mapping™ identifies whether your neutral undertone leans warm or cool and builds your exact 10-colour palette — part of your Iconik Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Neutral Undertone: Colour Guide for Indian Women.&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis/neutral-undertone</p>
          </div>

        </div>
      </main>
    </>
  );
}
