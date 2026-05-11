import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Many Outfits Can a Capsule Wardrobe Make? — Iconik",
  description: "How many outfits does a 15-piece capsule wardrobe create? The maths of capsule wardrobe outfit multiplication — and why most estimates are overstated.",
  keywords: "capsule wardrobe how many outfits India, capsule wardrobe outfit count, how many outfits from capsule wardrobe, capsule wardrobe combinations India, minimal wardrobe outfits India",
  alternates: { canonical: "https://www.iconik.pro/faq/capsule-wardrobe-how-many-outfits" },
  openGraph: {
    title: "How Many Outfits Can a Capsule Wardrobe Make? — Iconik",
    description: "The honest maths of capsule wardrobe outfit count — and why the '300 outfits from 33 pieces' claim is misleading.",
    url: "https://www.iconik.pro/faq/capsule-wardrobe-how-many-outfits",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Capsule wardrobe outfit count India — Iconik" }],
  },
};

export default function CapsuleWardrobeHowManyOutfitsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How many outfits can a 15-piece capsule wardrobe create?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A 15-piece capsule with 5 tops, 4 bottoms, 2 dresses, 2 blazers, and 2 statement pieces creates approximately 30–50 practical daily outfits, depending on how many combinations are genuinely wearable together. The theoretical maximum (all mathematical combinations) is much higher but includes pairings that do not work aesthetically. A well-designed capsule with a coordinated colour palette maximises the practical wearable count.",
            },
          },
          {
            "@type": "Question",
            "name": "Why do most capsule wardrobe outfit counts seem inflated?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The inflated counts (e.g., '300 outfits from 33 pieces') include every mathematical combination, including those that do not coordinate aesthetically, are not weather-appropriate, or are contextually wrong (e.g., a swimsuit with a blazer). A realistic count of genuinely wearable combinations for an Indian professional wardrobe is closer to 40–60 outfits from a 15-piece capsule — which is still excellent, but more accurate.",
            },
          },
          {
            "@type": "Question",
            "name": "What is the actual goal of a capsule wardrobe?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The goal is not maximum outfit count — it is decision ease and daily consistency. A well-built capsule means every item works with every other item in the same colour category. You can reach into the wardrobe and pull out any combination with confidence. The value is not in 300 theoretical outfits; it is in 40 outfits you will actually wear, where getting dressed takes 5 minutes instead of 20.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://www.iconik.pro/faq" },
          { "@type": "ListItem", "position": 3, "name": "Capsule Wardrobe How Many Outfits", "item": "https://www.iconik.pro/faq/capsule-wardrobe-how-many-outfits" },
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
              <li className="text-gray-800 font-medium">Capsule Wardrobe: How Many Outfits?</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              How Many Outfits Can a Capsule Wardrobe Make?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              The honest answer: 30–60 practically wearable outfits from a 15-piece capsule — not 300. Here is what the maths actually looks like, why the inflated counts are misleading, and what actually matters about capsule wardrobe value.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Honest Maths of a 15-Piece Capsule</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A 15-piece Indian capsule with 5 tops, 4 bottoms, 2 dresses, 2 blazers, and 2 statement pieces (one formal outfit + one dupatta):
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>5 tops × 4 bottoms = 20 top-bottom combinations</li>
              <li>20 combinations × 2 blazer variants (with or without) = 40 work/casual outfit options</li>
              <li>2 dresses × 2 blazer variants = 4 more outfits</li>
              <li>Add dupatta as a layering piece to any of the 20 base outfits = 20 elevated variants</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Mathematical total: 44+ combinations. Practically wearable combinations (aesthetically coordinated, contextually appropriate): approximately 30–40. Still excellent — this covers 6 weeks of daily outfit changes with minimal repetition.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Coordinated Colour Palettes Are the Key Variable</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The difference between a capsule that creates 30 practical outfits and one that creates 10 is colour coordination. If every piece shares the same 3–4 neutral base and 2–3 accent colours, any combination is guaranteed to coordinate aesthetically.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Without a colour strategy, a 15-piece wardrobe creates fewer wearable combinations than a 10-piece colour-coordinated capsule. This is why building from a Chromatic Harmony Mapping™ palette — where every piece sits within the same undertone family — maximises the practical outfit count of any capsule.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Indian Occasion Context: Why the Count Is Higher for Indian Wardrobes</h2>
            <p className="text-gray-600 leading-relaxed">
              An Indian capsule with ethnic pieces has an additional multiplication: a single dupatta in an accent colour can convert a casual salwar suit into a formal outfit, and a churidar can pair with multiple different kurtas. A well-built Indian capsule with 3 kurtas, 2 bottoms, and 2 dupattas already creates 3 × 2 × 3 (with and without dupatta variants) = 18 ethnic wear combinations — before any western pieces are included.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/style-guides/capsule-wardrobe-india" className="underline hover:opacity-70">Capsule Wardrobe for Indian Women — Complete Build Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Hub</Link></li>
              <li>→ <Link href="/faq" className="underline hover:opacity-70">All FAQs</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get a capsule that actually maximises your outfit count</h2>
            <p className="text-gray-600 mb-6">Your Iconik Style Blueprint builds your capsule from a coordinated colour palette and body-type-specific silhouettes — every piece guaranteed to work with every other piece.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
