import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Is Seasonal Colour Analysis and Why Doesn't It Work for Indian Women? — Iconik",
  description: "What is seasonal colour analysis (Spring, Summer, Autumn, Winter)? Why was it developed, how it works, and why it produces unreliable results for Indian and South Asian women.",
  keywords: "what is seasonal colour analysis India, seasonal colour analysis Indian women, spring summer autumn winter colour analysis India, does seasonal colour analysis work Indian skin, seasonal analysis vs CHM India",
  alternates: { canonical: "https://www.iconik.pro/faq/what-is-seasonal-colour-analysis" },
  openGraph: {
    title: "What Is Seasonal Colour Analysis and Why Doesn't It Work for Indian Women? — Iconik",
    description: "What seasonal colour analysis is, why it was developed, and why it fails for Indian skin tones.",
    url: "https://www.iconik.pro/faq/what-is-seasonal-colour-analysis",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Seasonal colour analysis India — Iconik" }],
  },
};

export default function WhatIsSeasonalColourAnalysisPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is seasonal colour analysis?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Seasonal colour analysis is a colour categorisation system developed by Carole Jackson (popularised in the 1980 book 'Color Me Beautiful') that assigns people to one of four seasonal palettes: Spring (warm, light, clear), Summer (cool, muted, soft), Autumn (warm, deep, earthy), and Winter (cool, deep, high contrast). Each season has an associated palette of colours recommended for clothing.",
            },
          },
          {
            "@type": "Question",
            "name": "Why does seasonal colour analysis often fail for Indian women?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Three reasons: (1) The system was developed primarily for European complexion ranges, which have less melanin variation and a narrower undertone range. Indian skin tones span a wide range of warm-olive, golden, and cool-brown-pink undertones that do not map cleanly onto the four European seasonal categories. (2) The system places most dark-skinned women into 'Winter' by default — a category that recommends cool, high-contrast colours. Many dark Indian women have warm undertones and need warm palettes, not cool ones. (3) The 4-season and even 12-season extensions were not calibrated against South Asian skin tone data.",
            },
          },
          {
            "@type": "Question",
            "name": "What is the alternative to seasonal analysis for Indian women?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Chromatic Harmony Mapping™ (CHM™) replaces the seasonal framework with a two-variable analysis: undertone temperature (warm, cool, or neutral) and contrast level (high, medium, or low). These two variables determine which specific colours create harmony with any Indian complexion — regardless of whether that complexion fits into a European seasonal category. The output is a 10-colour palette calibrated for the specific undertone and contrast combination, rather than an approximated seasonal category.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://www.iconik.pro/faq" },
          { "@type": "ListItem", "position": 3, "name": "What Is Seasonal Colour Analysis", "item": "https://www.iconik.pro/faq/what-is-seasonal-colour-analysis" },
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
              <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">What Is Seasonal Colour Analysis?</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What Is Seasonal Colour Analysis and Why Doesn&apos;t It Work for Indian Women?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Seasonal colour analysis — the Spring, Summer, Autumn, Winter system — is the most widely known colour categorisation framework. It was also developed for European complexion ranges in the 1980s. Here is what it is, why it often produces wrong results for Indian women, and what Chromatic Harmony Mapping™ does differently.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Seasonal Colour Analysis System?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Seasonal analysis categorises people into four types based on their overall colouring — hair, skin, and eye colour considered together:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Spring:</strong> Warm undertone, light to medium depth, clear and bright colouring</li>
              <li><strong>Summer:</strong> Cool undertone, light to medium depth, soft and muted colouring</li>
              <li><strong>Autumn:</strong> Warm undertone, medium to deep depth, rich and earthy colouring</li>
              <li><strong>Winter:</strong> Cool undertone, deep colouring, high contrast between features</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Each season has a recommended palette — Spring gets warm pastels and clear warm tones; Winter gets stark whites, black, and cool jewel tones; etc.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Problem for Indian Skin Tones</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The system works reasonably well for European complexion ranges because it was built from European colouring data. For Indian skin, three problems emerge:
            </p>
            <ol className="space-y-3 text-gray-600 list-decimal list-inside">
              <li><strong>Most Indian women are placed into Winter by default</strong> — because they have deep colouring. But Winter recommends cool colours, and many deep Indian women have warm undertones. They get the wrong palette.</li>
              <li><strong>The Autumn category misses many warm Indian undertones</strong> — Autumn assumes earthy, muted warm tones, but warm undertone Indian women can have much richer, more saturated warm colouring that needs a different palette intensity.</li>
              <li><strong>The system has no category for the neutral-warm-olive combination</strong> that is extremely common in Indian women — this undertone profile falls between categories and gets misassigned.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Chromatic Harmony Mapping™ Differs</h2>
            <p className="text-gray-600 leading-relaxed">
              CHM™ does not use seasonal categories at all. It analyses two objective variables — undertone temperature and contrast level — using tests calibrated for the Indian complexion range. The output is a specific 10-colour palette built from these two variables, not approximated from a European seasonal category. For Indian women, this produces more accurate and more useful colour recommendations than any seasonal analysis.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/methodology/chromatic-harmony-mapping" className="underline hover:opacity-70">Chromatic Harmony Mapping™ — How It Works</Link></li>
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/faq/colour-analysis-at-home" className="underline hover:opacity-70">Can I Do Colour Analysis at Home?</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get colour analysis built for Indian skin</h2>
            <p className="text-gray-600 mb-6">CHM™ replaces seasonal categories with a methodology calibrated for Indian undertone ranges — your exact 10-colour palette in 48 hours.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
