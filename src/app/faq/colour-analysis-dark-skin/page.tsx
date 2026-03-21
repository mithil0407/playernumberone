import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Colour Analysis for Dark Skin: Does It Work for Deep Indian Skin Tones? — Iconik",
  description: "Does colour analysis work for dark-skinned Indian women? How undertone identification differs for deeper melanin, why seasonal analysis fails dark skin, and what CHM™ does differently.",
  keywords: "colour analysis dark skin India, colour analysis deep skin tone India, colour analysis for dark Indian women, does colour analysis work dark skin, undertone dark skin India",
  alternates: { canonical: "https://www.iconik.pro/faq/colour-analysis-dark-skin" },
  openGraph: {
    title: "Colour Analysis for Dark Skin: Does It Work for Deep Indian Skin Tones? — Iconik",
    description: "How colour analysis works for darker Indian skin tones — why standard seasonal analysis fails and what CHM™ does instead.",
    url: "https://www.iconik.pro/faq/colour-analysis-dark-skin",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Colour analysis dark skin India — Iconik" }],
  },
};

export default function ColourAnalysisDarkSkinPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Does colour analysis work for dark-skinned Indian women?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes — when the methodology is undertone-based rather than surface-tone-based. The challenge with standard colour analysis for dark Indian skin is that most systems were designed for lighter European complexions where the undertone signal is more visible. With deeper melanin, the undertone is still present and still determines colour harmony — but identifying it requires specific techniques. The vein test in strong natural light and the white paper test are reliable for dark skin; the gold/silver test is also effective.",
            },
          },
          {
            "@type": "Question",
            "name": "Why does seasonal colour analysis fail dark-skinned Indian women?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Seasonal analysis (Spring, Summer, Autumn, Winter) was developed for European skin tones and does not account for the high-melanin undertone range common in South Asian women. The system places most dark-skinned women into 'Winter' by default — a category that recommends cool, high-contrast colours. But a dark-skinned woman with a warm undertone needs warm-earthy colours, not cool jewel tones. The category is wrong because it uses surface depth (dark = Winter) rather than undertone temperature.",
            },
          },
          {
            "@type": "Question",
            "name": "How does Chromatic Harmony Mapping™ handle dark skin tones?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CHM™ accounts for two variables simultaneously: undertone temperature (warm, cool, or neutral) and melanin depth. For darker skin tones, it specifically ensures the colour palette has sufficient chromatic intensity — very pale icy pastels can look washed out against deep melanin regardless of undertone temperature. The output is a 10-colour palette calibrated for both the undertone type and the melanin depth — rather than a generic 'works for dark skin' list.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://www.iconik.pro/faq" },
          { "@type": "ListItem", "position": 3, "name": "Colour Analysis Dark Skin", "item": "https://www.iconik.pro/faq/colour-analysis-dark-skin" },
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
              <li className="text-gray-800 font-medium">Colour Analysis for Dark Skin</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Colour Analysis for Dark Skin: Does It Work for Deep Indian Skin Tones?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Colour analysis works for every skin depth — including deep and dark Indian skin tones. The challenge is that most standard colour analysis systems were built for lighter European complexions and give unreliable results for deeper melanin. Here is what actually works and why.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Standard Colour Analysis Often Fails Dark Indian Skin</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The most common system — seasonal analysis (Spring, Summer, Autumn, Winter) — places most dark-skinned women into the &quot;Winter&quot; category by default, because Winter is associated with high contrast and deep colouring. This produces a palette recommendation: stark white, black, cool jewel tones.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The problem: a dark-skinned Indian woman with a warm undertone — which is very common — is not a Winter. She needs warm-toned colours: deep gold, terracotta, rust, warm burgundy, olive. The Winter recommendation is wrong because the system used surface depth (dark) as the deciding variable instead of undertone temperature.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Find Your Undertone with Deep Skin</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The vein test is the most reliable for deep skin — but it must be done in strong natural light (north-facing or overcast outdoor). In artificial light, a warm cast makes cool-undertone veins appear greenish, giving a false warm reading.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Check the inner wrist in strong natural daylight:</strong> Blue-purple = cool; Green = warm; Blue-green = neutral</li>
              <li><strong>The inner upper arm:</strong> Often more reliable than the inner wrist for deep-melanin skin — the veins may be more visible in a different location</li>
              <li><strong>Gold vs silver test:</strong> The metal comparison test is reliable for all skin depths</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Difference Between Undertone and Melanin Depth?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Melanin depth is what you see — the surface darkness of your skin, which changes with sun exposure and seasons. Undertone is what sits beneath the surface — the warm, cool, or neutral base that never changes.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Two dark-skinned Indian women can have opposite undertones. Colour harmony is determined by undertone temperature, not melanin depth. This is the foundational principle behind Chromatic Harmony Mapping™ — it measures both variables and accounts for both in the palette output.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/colour-analysis/best-colours-dusky-skin" className="underline hover:opacity-70">Best Colours for Dusky Skin</Link></li>
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone</Link></li>
              <li>→ <Link href="/methodology/chromatic-harmony-mapping" className="underline hover:opacity-70">Chromatic Harmony Mapping™</Link></li>
              <li>→ <Link href="/faq/what-is-seasonal-colour-analysis" className="underline hover:opacity-70">What Is Seasonal Colour Analysis?</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get colour analysis built for your skin</h2>
            <p className="text-gray-600 mb-6">CHM™ is calibrated for Indian undertone ranges across all melanin depths. Your palette in 48 hours.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
