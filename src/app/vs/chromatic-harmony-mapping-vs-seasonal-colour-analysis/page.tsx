import type { Metadata } from "next";
import Link from "next/link";
import { SeoTeachingVisual } from "@/components/seo/SeoEditorial";

export const metadata: Metadata = {
  title: "Chromatic Harmony Mapping vs Seasonal Colour Analysis — Iconik",
  description: "How Chromatic Harmony Mapping™ compares to Seasonal Colour Analysis — methodology, accuracy for Indian skin tones, key differences, and which system produces better results for Indian women.",
  keywords: "chromatic harmony mapping vs seasonal colour analysis, CHM vs seasonal colour analysis India, colour analysis Indian women comparison, seasonal colour analysis Indian skin, best colour analysis Indian women",
  alternates: { canonical: "https://www.iconik.pro/vs/chromatic-harmony-mapping-vs-seasonal-colour-analysis" },
  openGraph: {
    title: "Chromatic Harmony Mapping™ vs Seasonal Colour Analysis — Iconik",
    description: "How CHM™ compares to seasonal colour analysis — methodology, accuracy for Indian skin, and key differences.",
    url: "https://www.iconik.pro/vs/chromatic-harmony-mapping-vs-seasonal-colour-analysis",
    images: [{ url: "/images/seo/chromatic-harmony-vs-seasonal-levers-iconik-og.webp", width: 1200, height: 630, alt: "Four seasonal palettes compared with temperature, depth, clarity and contrast analysis — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chromatic Harmony Mapping™ vs Seasonal Colour Analysis — Iconik",
    description: "How CHM™ compares to seasonal colour analysis — methodology, accuracy for Indian skin, and key differences.",
    images: ["/images/seo/chromatic-harmony-vs-seasonal-levers-iconik-og.webp"],
  },
};

const faqs = [
  {
    q: "Is Chromatic Harmony Mapping the same as seasonal colour analysis?",
    a: "No. Both systems identify how colour interacts with skin tone, but they use different variables and frameworks. Seasonal colour analysis assigns people to one of four (or up to 16) seasonal archetypes — Spring, Summer, Autumn, Winter — built around Northern European skin colouring. Chromatic Harmony Mapping™ uses undertone (warm, cool, neutral) and melanin depth as independent variables, calibrated specifically for Indian skin tones, and produces an individual 10-colour palette rather than an archetype-based palette.",
  },
  {
    q: "Which is more accurate for Indian women — seasonal colour analysis or CHM™?",
    a: "Chromatic Harmony Mapping™ is more accurate for Indian women, for two reasons. First, CHM™ was calibrated for Indian skin — the undertone ranges, melanin depth classifications, and colour recommendations were built specifically for South Asian colouring. Seasonal colour analysis was built for Northern European skin and its archetypes do not map accurately onto Indian colouring. Second, CHM™ separates undertone and melanin depth as independent variables, which produces a more precise palette than forcing Indian colouring into a seasonal archetype.",
  },
  {
    q: "Can I use seasonal colour analysis if I am Indian?",
    a: "You can — but with caveats. The core principle (warm undertones suit warm colours, cool undertones suit cool colours) is correct and applies to Indian women. The limitation is the seasonal archetypes themselves: most Indian women get classified as Autumn or Winter regardless of their actual undertone, because those categories are broad enough to absorb most South Asian colouring. The resulting palette may be roughly correct but will miss nuances that a system built for Indian skin would catch. The warm/cool identification from seasonal analysis is useful; the specific seasonal palette is less reliable.",
  },
  {
    q: "Does CHM™ replace seasonal colour analysis or build on it?",
    a: "CHM™ builds on the same foundational principle as seasonal colour analysis — that undertone determines your best colours — but replaces the seasonal archetype framework with a system calibrated for Indian skin. It is not a seasonal system with Indian adjustments; it was designed from the ground up for Indian women, including guidance on Indian ethnic wear (sarees, kurtas, lehengas) that seasonal colour analysis, a Western system, never addressed.",
  },
  {
    q: "How does Iconik's CHM™ analysis work in practice?",
    a: "You submit photos (face in natural daylight, inner wrist) and a short intake form as part of the Iconik Style Blueprint. An Iconik stylist identifies your undertone (warm, cool, or neutral) and melanin depth (fair to deep), then builds a personalised 10-colour palette specific to your combination. The palette includes Western wear colours, Indian ethnic wear colours, saree colour guidance, and jewellery metal recommendations. It is delivered as part of your Style Blueprint within 5 working days after the consultation.",
  },
];

const comparison = [
  { feature: "Origin", seasonal: "1980s USA/Europe (Carole Jackson, Color Me Beautiful)", chm: "Built specifically for Indian women by Iconik" },
  { feature: "Calibrated for", seasonal: "Northern European skin tones", chm: "Indian skin tones — fair to deep, including olive and wheatish" },
  { feature: "Primary variable", seasonal: "Warm/cool + light/deep contrast", chm: "Undertone (warm, cool, neutral)" },
  { feature: "Secondary variable", seasonal: "Seasonal archetype (Spring/Summer/Autumn/Winter)", chm: "Melanin depth (fair → light → medium → medium-deep → deep)" },
  { feature: "Output", seasonal: "Seasonal archetype palette (shared by all in that category)", chm: "Individual 10-colour palette" },
  { feature: "Indian ethnic wear guidance", seasonal: "None", chm: "Yes — saree colours, zari, kurta, lehenga" },
  { feature: "Jewellery guidance", seasonal: "Gold vs silver", chm: "Gold, silver, antique gold, rose gold by undertone" },
  { feature: "Most common Indian result", seasonal: "Autumn or Winter (often imprecise)", chm: "Warm, cool, or neutral with melanin depth (precise)" },
  { feature: "Self-assessment possible", seasonal: "Yes — many online resources", chm: "Via Iconik Style Blueprint (professional assessment)" },
];

export default function CHMvsSeasonalPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/vs/chromatic-harmony-mapping-vs-seasonal-colour-analysis#article",
        "headline": "Chromatic Harmony Mapping™ vs Seasonal Colour Analysis",
        "description": "A direct methodology comparison of Chromatic Harmony Mapping™ and Seasonal Colour Analysis — origin, variables, accuracy for Indian skin, and practical differences in output.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-04-01",
        "dateModified": "2026-07-24",
        "image": "https://www.iconik.pro/images/seo/chromatic-harmony-vs-seasonal-levers-iconik.webp",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/vs/chromatic-harmony-mapping-vs-seasonal-colour-analysis" },
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
          { "@type": "ListItem", "position": 2, "name": "CHM™ vs Seasonal Colour Analysis", "item": "https://www.iconik.pro/vs/chromatic-harmony-mapping-vs-seasonal-colour-analysis" },
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
              <li className="text-gray-800 font-medium">CHM™ vs Seasonal Colour Analysis</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Chromatic Harmony Mapping™ vs Seasonal Colour Analysis
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Both Chromatic Harmony Mapping™ (CHM™) and Seasonal Colour Analysis identify how colour interacts with your skin. They share the same foundational insight — undertone determines your best colours. Where they differ is in the framework built on top of that insight. Seasonal colour analysis uses four archetypes calibrated for Northern European skin. CHM™ uses undertone and melanin depth calibrated specifically for Indian skin tones.
            </p>
          </header>

          <SeoTeachingVisual
            src="/images/seo/chromatic-harmony-vs-seasonal-levers-iconik.webp"
            alt="Indian woman beside four seasonal palettes and four colour-analysis levers: temperature, depth, clarity and contrast."
            caption="Seasonal labels can be useful shorthand; testing separate colour properties makes the reasoning more explicit and adaptable."
            width={1003}
            height={1568}
            priority
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Side-by-Side Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900 w-1/3">Feature</th>
                    <th className="text-left p-4 font-semibold text-gray-900 w-1/3">Seasonal Colour Analysis</th>
                    <th className="text-left p-4 font-semibold text-gray-900 w-1/3">Chromatic Harmony Mapping™</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparison.map(({ feature, seasonal, chm }) => (
                    <tr key={feature} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-700 font-medium">{feature}</td>
                      <td className="p-4 text-gray-500">{seasonal}</td>
                      <td className="p-4 text-gray-900">{chm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Seasonal Colour Analysis Gets Right</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The core principle of seasonal colour analysis — that warm undertones harmonise with warm colours and cool undertones with cool colours — is accurate and applies to Indian women. The system popularised colour analysis globally and introduced millions of women to the concept of undertone. For Indian women with a very strong warm or cool undertone, even a seasonal analysis may produce broadly accurate results.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The gold vs silver jewellery test and the fabric draping test, both staples of the seasonal analysis tradition, are also genuinely useful for Indian women. The limitation is not the test; it is what happens with the results.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Where Seasonal Colour Analysis Falls Short for Indian Women</h2>
            <div className="space-y-4">
              {[
                {
                  title: "The archetypes were not built for Indian skin",
                  body: "Spring, Summer, Autumn, and Winter archetypes were calibrated on Northern European hair, eye, and skin combinations. Most Indian women get classified as Autumn or Winter — not because they are, but because those two categories are broad enough to absorb most South Asian colouring. This produces palettes that are roughly correct but miss important nuances.",
                },
                {
                  title: "Melanin depth is not properly accounted for",
                  body: "Seasonal analysis conflates lightness/darkness of colouring with season, but this mapping does not hold for Indian skin. A deep-toned Indian woman with a cool undertone may get classified as 'Winter' — but the Winter palette, designed for a high-contrast European complexion, will not match her specific melanin depth and undertone combination.",
                },
                {
                  title: "No guidance for Indian ethnic wear",
                  body: "Seasonal colour analysis was developed for Western wardrobes. There is no framework within the system for saree colours, zari selection, kurta palettes, or lehenga styling — a significant practical gap for Indian women who wear ethnic clothing regularly.",
                },
                {
                  title: "Neutral undertone is often misclassified",
                  body: "The seasonal system handles neutral undertones poorly — neutral women are often told they are 'one foot in Autumn, one foot in Winter' without a clear palette. CHM™ identifies neutral undertone as its own category with a specific muted palette, which is more actionable.",
                },
              ].map((item) => (
                <div key={item.title} className="border border-gray-200 rounded-xl p-5">
                  <p className="font-semibold text-gray-900 mb-2">{item.title}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What CHM™ Does Differently</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Chromatic Harmony Mapping™ was built from the ground up for Indian skin — not adapted from a European system. The key methodological differences:
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Two independent variables, not one archetype",
                  body: "CHM™ identifies undertone (warm, cool, neutral) and melanin depth separately. These interact — a warm undertone at fair skin depth produces a different optimal palette than warm undertone at deep skin depth. Seasonal analysis collapses both into a single archetype, losing this precision.",
                },
                {
                  title: "Indian-specific calibration",
                  body: "The undertone ranges, melanin depth classifications, and colour-to-skin mappings in CHM™ were calibrated on Indian skin. The olive/wheatish complexion range, the higher melanin density of most Indian skin, and the specific undertone distribution in South Asian women are all accounted for.",
                },
                {
                  title: "Individual palette, not archetype palette",
                  body: "CHM™ produces a 10-colour palette specific to your undertone-depth combination. Seasonal analysis gives you the same palette as every other person in your seasonal category — a palette built for an archetype, not for you.",
                },
                {
                  title: "Ethnic wear integration",
                  body: "CHM™ includes specific colour recommendations for sarees (including body colour and zari), kurtas, lehengas, and jewellery metal. No seasonal colour analysis framework addresses these.",
                },
              ].map((item) => (
                <div key={item.title} className="border-l-4 border-gray-900 pl-5">
                  <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.body}</p>
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
              <li>→ <Link href="/colour-analysis/seasonal-colour-analysis-india" className="underline hover:opacity-70">Seasonal Colour Analysis for Indian Women: Does It Work?</Link></li>
              <li>→ <Link href="/methodology/chromatic-harmony-mapping" className="underline hover:opacity-70">How Chromatic Harmony Mapping™ Works</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones — Full Guide</Link></li>
              <li>→ <Link href="/colour-analysis/indian-skin-tones" className="underline hover:opacity-70">Why Standard Colour Analysis Fails Indian Women</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get CHM™ analysis built for your skin</h2>
            <p className="text-gray-600 mb-6">Chromatic Harmony Mapping™ is part of the Iconik Style Blueprint — a 10-colour palette calibrated to your undertone and melanin depth, with specific Indian ethnic wear guidance. Delivered within 5 working days after the consultation.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Chromatic Harmony Mapping™ vs Seasonal Colour Analysis.&quot; Iconik, 2025. https://www.iconik.pro/vs/chromatic-harmony-mapping-vs-seasonal-colour-analysis</p>
          </div>

        </div>
      </main>
    </>
  );
}
