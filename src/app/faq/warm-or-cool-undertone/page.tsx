import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Am I Warm or Cool Undertone? 3 Tests for Indian Skin — Iconik",
  description: "How to tell if you have a warm or cool undertone — 3 reliable at-home tests for Indian women. Why the vein test works, what the paper test reveals, and how to interpret results for Indian skin.",
  keywords: "am I warm or cool undertone India, how to find undertone Indian skin, warm vs cool undertone test India, skin undertone test Indian women, how to tell undertone Indian skin",
  alternates: { canonical: "https://www.iconik.pro/faq/warm-or-cool-undertone" },
  openGraph: {
    title: "Am I Warm or Cool Undertone? 3 Tests for Indian Skin — Iconik",
    description: "3 reliable tests to determine warm vs cool undertone for Indian women — with Indian skin-specific guidance.",
    url: "https://www.iconik.pro/faq/warm-or-cool-undertone",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Warm or cool undertone India — Iconik" }],
  },
};

export default function WarmOrCoolUndertonePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Am I warm or cool undertone?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Test 1 — Vein test: Check the inner wrist veins in natural daylight. Blue-purple veins = cool undertone. Green veins = warm undertone. Blue-green = neutral. Test 2 — White paper test: Hold a white sheet near your face in natural light. If your skin appears golden or olive = warm. If it appears pinkish or greyish = cool. Test 3 — Gold vs silver: Gold jewellery flattering = warm undertone. Silver more flattering = cool. Both equal = neutral.",
            },
          },
          {
            "@type": "Question",
            "name": "Why is undertone identification harder for Indian women?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Indian skin has more melanin depth than European skin, which can make the vein and paper tests harder to read. The veins are more visible in natural light than artificial light — most people make the mistake of checking in yellow indoor lighting, which adds a warm cast to everything. Always use north-facing natural daylight or overcast outdoor light for the most accurate reading.",
            },
          },
          {
            "@type": "Question",
            "name": "Can an Indian woman have a cool undertone?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Cool undertones are found across all South Asian skin depths — from fair to deep. A cool undertone Indian woman has a pink or blue-red base to her complexion. This is often visible in the lip colour (naturally pink or bluish-pink rather than peach or brown-pink) and the inner arm skin. Cool undertone Indian women look best in jewel tones — cobalt blue, emerald green, deep fuchsia — not warm earthy tones.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://www.iconik.pro/faq" },
          { "@type": "ListItem", "position": 3, "name": "Warm or Cool Undertone", "item": "https://www.iconik.pro/faq/warm-or-cool-undertone" },
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
              <li className="text-gray-800 font-medium">Warm or Cool Undertone?</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Am I Warm or Cool Undertone? 3 Tests for Indian Skin
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Undertone — warm, cool, or neutral — is the single most important variable in determining which colours flatter you. And it can be identified at home in 5 minutes using three tests. Here is how to do each one accurately for Indian skin.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test 1: The Vein Test</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Hold your inner wrist under natural daylight — north-facing light or overcast outdoor light is best. Artificial lighting adds warmth that skews results.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Blue or purple veins:</strong> Cool undertone</li>
              <li><strong>Green veins:</strong> Warm undertone (the skin&apos;s yellow-golden base makes veins appear green)</li>
              <li><strong>Blue-green, cannot tell:</strong> Neutral undertone</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test 2: The White Paper Test</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Hold a pure white sheet of paper next to your bare face in natural light. Observe the colour cast that the white creates on your skin.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Skin appears golden, peachy, or olive next to white:</strong> Warm undertone</li>
              <li><strong>Skin appears pink, rosy, or greyish next to white:</strong> Cool undertone</li>
              <li><strong>Skin appears both or neither:</strong> Neutral undertone</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test 3: The Gold vs Silver Test</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Hold a gold accessory and a silver accessory against your face or inner arm in natural light.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Gold makes your skin glow and silver looks harsh:</strong> Warm undertone</li>
              <li><strong>Silver makes your skin look bright and gold looks muddy:</strong> Cool undertone</li>
              <li><strong>Both look equally good:</strong> Neutral undertone</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Is Undertone Identification Harder for Indian Skin?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Higher melanin concentration makes the vein test and paper test subtler — the colour cues are less obvious than on lighter European skin. Two common mistakes:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Testing in artificial light:</strong> Yellow indoor light adds a warm cast to everything and will make a cool undertone woman appear warm. Always use natural daylight.</li>
              <li><strong>Confusing surface tone with undertone:</strong> Your skin darkens in summer sun — this does not change your undertone. The vein test is the most resistant to sun exposure and is the most reliable baseline.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Does Knowing Your Undertone Change?</h2>
            <p className="text-gray-600 leading-relaxed">
              Your undertone determines your entire colour palette. A warm undertone woman&apos;s best colours — camel, terracotta, mustard, olive, rust — are completely different from a cool undertone woman&apos;s — cobalt, emerald, burgundy, fuchsia, lavender. Wearing the wrong undertone colours creates a washed-out, sallow, or harsh impression; the right undertone colour makes the skin glow and the face look energised. Chromatic Harmony Mapping™ uses your undertone type as the foundation of your personal 10-colour palette.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone: 3 At-Home Tests (Full Guide)</Link></li>
              <li>→ <Link href="/colour-analysis/warm-cool-neutral-undertone-india" className="underline hover:opacity-70">Warm vs Cool vs Neutral Undertone</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/faq" className="underline hover:opacity-70">All FAQs</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get your undertone confirmed and your palette built</h2>
            <p className="text-gray-600 mb-6">Iconik&apos;s Chromatic Harmony Mapping™ identifies your exact undertone and contrast level, then delivers your personal 10-colour palette in 48 hours.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
