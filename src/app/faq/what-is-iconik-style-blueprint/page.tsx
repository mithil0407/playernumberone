import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Is the Iconik Style Blueprint? — Iconik",
  description: "What is the Iconik Style Blueprint? What it includes, how it's built, what you receive, and how to use it. A complete explanation of Iconik's signature styling service.",
  keywords: "what is Iconik Style Blueprint, Iconik style blueprint explained, Iconik styling service India, what does Iconik include, personal styling India blueprint",
  alternates: { canonical: "https://www.iconik.pro/faq/what-is-iconik-style-blueprint" },
  openGraph: {
    title: "What Is the Iconik Style Blueprint? — Iconik",
    description: "What the Iconik Style Blueprint includes, how it's built, and how to use it — a complete explanation.",
    url: "https://www.iconik.pro/faq/what-is-iconik-style-blueprint",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "What is Iconik Style Blueprint — Iconik" }],
  },
};

export default function WhatIsIconikStyleBlueprintPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is the Iconik Style Blueprint?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Iconik Style Blueprint is a personalised styling document that contains: (1) Your Geometric Silhouette Profile — your body type classification and specific outfit formulas for your proportions. (2) Your Chromatic Harmony Mapping™ palette — your 10 best colours based on undertone and contrast analysis. (3) Your Facial Architecture Analysis™ — face shape classification and neckline/accessory guidance. (4) 16+ outfit formulas combining all three analyses across work, casual, and occasion contexts. (5) A personalised capsule wardrobe list. The Blueprint is delivered as a PDF document within 48 hours.",
            },
          },
          {
            "@type": "Question",
            "name": "How is the Style Blueprint built?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You submit a questionnaire with 7 body measurements, undertone self-test results, lifestyle context (work environment, occasions), and style preferences. Iconik's team applies Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™ to these inputs, then builds the personalised Blueprint document. A human stylist reviews the output before delivery.",
            },
          },
          {
            "@type": "Question",
            "name": "How do I use the Style Blueprint after I receive it?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Three primary uses: (1) Shopping filter — refer to your Blueprint before any purchase. Does it match your silhouette formula? Is the colour in your palette? (2) Getting dressed — use the outfit formulas as a daily reference. Within 2–3 weeks of using the formulas, the decision-making becomes habitual and you no longer need to check. (3) Wardrobe audit — use the capsule list to identify gaps and remove pieces that do not fit the Blueprint.",
            },
          },
          {
            "@type": "Question",
            "name": "How long does the Style Blueprint remain accurate?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The colour analysis portion (CHM™) remains accurate for life — undertone does not change. The body type analysis portion (GSP™) remains accurate until significant body changes occur — weight gain or loss of more than 10kg, pregnancy, or other changes that shift body proportions. The Blueprint can be updated with new measurements if proportions change significantly.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://www.iconik.pro/faq" },
          { "@type": "ListItem", "position": 3, "name": "What Is the Iconik Style Blueprint", "item": "https://www.iconik.pro/faq/what-is-iconik-style-blueprint" },
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
              <li className="text-gray-800 font-medium">What Is the Iconik Style Blueprint?</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What Is the Iconik Style Blueprint?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              The Iconik Style Blueprint is a personalised PDF document that contains your complete styling framework: body type analysis, colour palette, face shape analysis, and 16+ outfit formulas. It is built using three proprietary methodologies and delivered within 48 hours.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Does the Blueprint Include?</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">1. Geometric Silhouette Profile (GSP™)</h3>
                <p className="text-gray-600">Your body type classification (apple, pear, rectangle, hourglass, inverted triangle) calculated from 7 body measurements. Includes specific outfit formulas for each garment category — kurta silhouettes, trouser styles, dress types, necklines — matched to your proportions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2. Chromatic Harmony Mapping™ Palette (CHM™)</h3>
                <p className="text-gray-600">Your 10 best colours based on undertone type and contrast level. Includes your core neutrals (3–4 colours that form the wardrobe foundation) and accent colours (3–4 colours for statement pieces). Both warm-weather and formal occasion recommendations are included.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3. Facial Architecture Analysis™ (FAA™)</h3>
                <p className="text-gray-600">Your face shape classification and corresponding neckline recommendations for Indian and western garments. Includes eyewear frame guidance and jewellery shape recommendations.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4. 16+ Outfit Formulas</h3>
                <p className="text-gray-600">Specific outfit combinations built from your GSP™ and CHM™ analysis, organised by context: work (daily, formal meeting, interview), casual, and occasion (festival, wedding guest, formal event). Includes Indian ethnic and western wear.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">5. Personalised Capsule Wardrobe List</h3>
                <p className="text-gray-600">A 15-piece capsule wardrobe list with specific garment categories, colours from your CHM™ palette, and silhouette guidance from your GSP™ profile.</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Is the Blueprint Built?</h2>
            <ol className="space-y-3 text-gray-600 list-decimal list-inside">
              <li>You complete Iconik&apos;s intake questionnaire — includes 7 body measurements, undertone self-test results, lifestyle context (work environment, occasion types), and any specific styling goals</li>
              <li>Iconik&apos;s team applies GSP™, CHM™, and FAA™ to your inputs</li>
              <li>A human stylist reviews the analysis and builds your Blueprint document</li>
              <li>The Blueprint PDF is delivered to your email within 48 hours</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Do You Use the Blueprint?</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Shopping:</strong> Before any purchase, check: Is this silhouette in my formula? Is this colour in my palette?</li>
              <li><strong>Getting dressed:</strong> Refer to the outfit formulas for 2–3 weeks until the patterns become habitual</li>
              <li><strong>Wardrobe audit:</strong> Use the capsule list to identify gaps and remove items that do not fit the Blueprint</li>
              <li><strong>Occasion dressing:</strong> Use the occasion-specific formulas for weddings, festivals, and professional events</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/methodology/geometric-silhouette-profiling" className="underline hover:opacity-70">Geometric Silhouette Profiling™</Link></li>
              <li>→ <Link href="/methodology/chromatic-harmony-mapping" className="underline hover:opacity-70">Chromatic Harmony Mapping™</Link></li>
              <li>→ <Link href="/methodology/facial-architecture-analysis" className="underline hover:opacity-70">Facial Architecture Analysis™</Link></li>
              <li>→ <Link href="/vs/style-blueprint-vs-quiz" className="underline hover:opacity-70">Style Blueprint vs Style Quiz</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get your Style Blueprint in 48 hours</h2>
            <p className="text-gray-600 mb-6">Body analysis, colour palette, face shape guide, and 16+ outfit formulas — your complete styling framework, delivered.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
