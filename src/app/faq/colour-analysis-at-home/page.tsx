import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Can I Do Colour Analysis at Home? What Works and What Doesn't — Iconik",
  description: "Can colour analysis be done at home? What the at-home vein test and paper test actually tell you, what they miss, and where professional analysis adds precision for Indian women.",
  keywords: "colour analysis at home India, DIY colour analysis Indian women, how to do colour analysis at home India, undertone test at home India, free colour analysis Indian women",
  alternates: { canonical: "https://www.iconik.pro/faq/colour-analysis-at-home" },
  openGraph: {
    title: "Can I Do Colour Analysis at Home? What Works and What Doesn't — Iconik",
    description: "What at-home colour analysis can and cannot tell you — and where professional analysis adds precision for Indian skin.",
    url: "https://www.iconik.pro/faq/colour-analysis-at-home",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Colour analysis at home India — Iconik" }],
  },
};

export default function ColourAnalysisAtHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Can colour analysis be done at home?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Partially. The at-home vein test, paper test, and gold/silver test can accurately identify warm vs cool vs neutral undertone in most cases. What at-home testing cannot determine precisely: contrast level (high vs medium vs low, which requires observing multiple colour tests against the face simultaneously), and the exact intensity and saturation range of colours that work best for your specific undertone type and melanin depth. Professional analysis adds these precision layers.",
            },
          },
          {
            "@type": "Question",
            "name": "What is the most reliable at-home colour analysis test for Indian skin?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The vein test in natural daylight is the most reliable at-home test for Indian skin. Check the inner wrist veins in north-facing natural light or overcast outdoor light — never in artificial light. Blue-purple veins indicate cool undertone; green veins indicate warm; blue-green indicates neutral. This single test is sufficient to start building your colour direction, even if it does not give you the complete palette.",
            },
          },
          {
            "@type": "Question",
            "name": "What does professional colour analysis add that at-home testing cannot?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Professional analysis adds three things: (1) Contrast level assessment — how much contrast is between your hair, skin, and eyes — which determines whether high-contrast or tonal colour combinations are more flattering. (2) Intensity calibration — whether your palette needs muted, clear, or deep colours within your undertone family. (3) The specific palette output — the exact 10 colours that work for your specific undertone + contrast + intensity combination. At-home testing gives you warm/cool/neutral; professional analysis gives you the complete palette.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://www.iconik.pro/faq" },
          { "@type": "ListItem", "position": 3, "name": "Colour Analysis at Home", "item": "https://www.iconik.pro/faq/colour-analysis-at-home" },
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
              <li className="text-gray-800 font-medium">Colour Analysis at Home</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Can I Do Colour Analysis at Home? What Works and What Doesn&apos;t
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              You can identify your undertone direction at home — warm, cool, or neutral — using reliable tests that take 5 minutes. What you cannot do at home is build a precise 10-colour palette with contrast-level and intensity calibration. Here is exactly what each approach tells you.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What At-Home Tests Actually Tell You</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Three reliable at-home tests:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Vein test (inner wrist in natural light):</strong> Blue-purple = cool; Green = warm; Blue-green = neutral. Accuracy: high, when done in natural daylight.</li>
              <li><strong>White paper test (white sheet near face in natural light):</strong> Skin appears golden/olive = warm; pinkish/greyish = cool. Accuracy: medium — depends on the quality of natural light and the observer&apos;s colour perception.</li>
              <li><strong>Gold vs silver test (metal comparison in natural light):</strong> Gold more flattering = warm; silver more flattering = cool. Accuracy: medium-high.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Combined, these three tests give you a reliable warm/cool/neutral direction. This is the foundation of colour analysis and is genuinely useful — you can start building a colour strategy from this alone.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What At-Home Testing Cannot Determine</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Contrast level:</strong> Whether you are high, medium, or low contrast (the relationship between your hair depth, skin depth, and eye depth). This requires side-by-side colour draping tests that are not possible at home alone.</li>
              <li><strong>Intensity calibration:</strong> Whether your palette needs muted/greyed colours vs clear/bright vs deep/rich — within the same undertone family.</li>
              <li><strong>Specific palette output:</strong> Exactly which cobalt vs which navy, which rust vs which terracotta — the specific hue values within the undertone family that work best for your particular combination of variables.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Practical Approach: Start at Home, Then Refine</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Do the three at-home tests to determine your undertone direction. Use this to filter your colour choices: if you are warm, stop buying cool pastels; if you are cool, stop buying mustard and terracotta. This alone will improve your colour choices significantly.
            </p>
            <p className="text-gray-600 leading-relaxed">
              When you want the complete palette — the specific 10 colours that work for your undertone + contrast + intensity combination — that is when professional analysis like Chromatic Harmony Mapping™ adds the precision that at-home testing cannot provide.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone: Full Guide</Link></li>
              <li>→ <Link href="/faq/warm-or-cool-undertone" className="underline hover:opacity-70">Am I Warm or Cool Undertone?</Link></li>
              <li>→ <Link href="/methodology/chromatic-harmony-mapping" className="underline hover:opacity-70">Chromatic Harmony Mapping™</Link></li>
              <li>→ <Link href="/faq" className="underline hover:opacity-70">All FAQs</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get the complete palette, not just the direction</h2>
            <p className="text-gray-600 mb-6">CHM™ builds your exact 10-colour palette from undertone, contrast level, and intensity — the precision that at-home testing cannot produce.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
