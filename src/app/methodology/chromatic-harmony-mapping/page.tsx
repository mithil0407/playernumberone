import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What is Chromatic Harmony Mapping™? — Iconik's Colour Analysis Method",
  description: "Chromatic Harmony Mapping™ (CHM) is Iconik's proprietary colour analysis protocol for Indian skin tones. Full explanation of how it works, what undertones it identifies, and how it differs from standard colour analysis.",
  keywords: "chromatic harmony mapping, what is chromatic harmony mapping, Iconik colour analysis method, CHM colour analysis India, scientific colour analysis Indian skin",
  alternates: { canonical: "https://www.iconik.pro/methodology/chromatic-harmony-mapping" },
  openGraph: {
    title: "What is Chromatic Harmony Mapping™? — Iconik's Colour Analysis Method",
    description: "The definitive explanation of Chromatic Harmony Mapping™ — Iconik's colour analysis protocol designed for Indian skin tones.",
    url: "https://www.iconik.pro/methodology/chromatic-harmony-mapping",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Chromatic Harmony Mapping — Iconik methodology" }],
  },
};

const faqs = [
  {
    q: "Who developed Chromatic Harmony Mapping™?",
    a: "Chromatic Harmony Mapping™ was developed by the Iconik methodology team specifically to address the shortcomings of Western seasonal colour analysis for Indian women. The protocol accounts for the full spectrum of Indian skin undertones and melanin depths.",
  },
  {
    q: "What undertones does CHM™ identify?",
    a: "CHM identifies three primary undertones: warm (yellow/golden base), cool (pink/blue/red base), and neutral (a balance of both). Within each, it further calibrates for melanin depth and contrast level — producing a palette that is precise to the individual, not just the undertone category.",
  },
  {
    q: "Is Chromatic Harmony Mapping™ the same as seasonal colour analysis?",
    a: "No. CHM does not use seasons (Spring/Summer/Autumn/Winter). It uses a three-part framework: undertone type, melanin depth, and contrast level. This produces an exact 10-colour palette rather than a seasonal category. Seasonal analysis was developed for Caucasian skin and does not account for Indian melanin diversity.",
  },
  {
    q: "How is CHM™ delivered in an Iconik Blueprint?",
    a: "Your Blueprint includes your identified undertone, your 10-colour harmony palette with exact colour names and references, your 3 best neutrals, your 3 strongest accent colours, colours to avoid, and a guide to applying those colours to your most common garment categories including Indian ethnic wear.",
  },
];

export default function ChromaticHarmonyMappingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "What is Chromatic Harmony Mapping™?",
        "description": "The definitive explanation of Chromatic Harmony Mapping™ — Iconik's proprietary colour analysis protocol for Indian skin tones.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/methodology/chromatic-harmony-mapping" },
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
          { "@type": "ListItem", "position": 2, "name": "Methodology", "item": "https://www.iconik.pro/methodology" },
          { "@type": "ListItem", "position": 3, "name": "Chromatic Harmony Mapping™", "item": "https://www.iconik.pro/methodology/chromatic-harmony-mapping" },
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
              <li><Link href="/methodology" className="hover:underline">Methodology</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Chromatic Harmony Mapping™</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What is Chromatic Harmony Mapping™?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Chromatic Harmony Mapping™ (CHM) is Iconik&apos;s colour analysis protocol designed specifically for the full spectrum of Indian skin tones. It identifies the undertone (warm, cool, or neutral), maps it to a curated palette of colours that create visual harmony with the client&apos;s complexion, and produces an exact colour prescription — not just a general season or broad category.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Does Standard Colour Analysis Fail Indian Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Western seasonal colour analysis — the Spring, Summer, Autumn, Winter system — was developed based on research conducted primarily on Caucasian skin. The system uses hair colour, eye colour, and skin tone as input variables, and was calibrated for a melanin range it does not fully apply to Indian skin.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The most common result for Indian women using seasonal analysis: classified as &quot;Autumn&quot; (because they have brown or dark colouring), which prescribes earthy, muted tones. But many Indian women have cool undertones — and warm earthy tones actively clash with their complexion. The seasonal system has no mechanism to address this.
            </p>
            <p className="text-gray-600 leading-relaxed">
              CHM was developed to solve this. It uses undertone + melanin depth + contrast level as its three-variable framework — producing results that are accurate for the full range of Indian skin.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Chromatic Harmony Mapping™ Work?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              CHM is a five-stage protocol:
            </p>
            <ol className="space-y-4 text-gray-600 list-decimal list-inside">
              <li><strong>Undertone identification:</strong> Using the vein test, white paper test, and fabric draping test in natural light to identify warm, cool, or neutral undertone.</li>
              <li><strong>Melanin depth assessment:</strong> Identifying the depth of pigmentation — fair, medium, deep, or very deep — which determines how chromatic vs muted the palette recommendations should be.</li>
              <li><strong>Harmony palette construction:</strong> Mapping undertone + depth to identify the 10 exact colours that create the strongest visual harmony with the complexion.</li>
              <li><strong>Contrast level assessment:</strong> Determining whether the client has high-contrast colouring (e.g., very dark hair, fair skin) or low-contrast colouring — which affects whether high-contrast or tone-on-tone colour combinations work best.</li>
              <li><strong>Application guide:</strong> Translating the palette into practical guidance for Indian garment categories — which colours to use in sarees, kurtas, blouses, salwars, and dupattas.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Does CHM™ Produce?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The CHM output delivered in your Style Blueprint includes:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Your identified undertone (warm / cool / neutral)</li>
              <li>10 exact colours in your harmony palette, with colour names and references</li>
              <li>Your 3 best neutrals (for everyday wear foundations)</li>
              <li>Your 3 strongest accent colours (for statement pieces)</li>
              <li>Colours to avoid and why they clash with your undertone</li>
              <li>Guidance on applying the palette to Indian ethnic garment categories</li>
              <li>Your best white (stark white vs ivory vs warm cream)</li>
              <li>Your best metal for jewellery (gold vs silver vs both)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Is CHM™ Different from Seasonal Colour Analysis?</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-900">Feature</th>
                    <th className="text-left p-3 font-semibold text-gray-900">Seasonal Analysis</th>
                    <th className="text-left p-3 font-semibold text-gray-900">CHM™</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="p-3 font-medium">Framework</td><td className="p-3">4 seasons</td><td className="p-3">Undertone + depth + contrast</td></tr>
                  <tr><td className="p-3 font-medium">Indian skin calibration</td><td className="p-3">Not calibrated</td><td className="p-3">Designed for Indian spectrum</td></tr>
                  <tr><td className="p-3 font-medium">Output</td><td className="p-3">Season category + general palette</td><td className="p-3">10 exact colours + application guide</td></tr>
                  <tr><td className="p-3 font-medium">Indian garments</td><td className="p-3">Not addressed</td><td className="p-3">Specific to kurta, saree, salwar categories</td></tr>
                  <tr><td className="p-3 font-medium">Melanin depth</td><td className="p-3">Not calibrated for deep Indian tones</td><td className="p-3">Explicitly accounts for melanin depth</td></tr>
                </tbody>
              </table>
            </div>
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
              <li>→ <Link href="/methodology/geometric-silhouette-profiling" className="underline hover:opacity-70">What is Geometric Silhouette Profiling™?</Link></li>
              <li>→ <Link href="/methodology/facial-architecture-analysis" className="underline hover:opacity-70">What is Facial Architecture Analysis™?</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/colour-analysis/indian-skin-tones" className="underline hover:opacity-70">Indian Skin Tone Colour Guide</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want CHM™ applied to your skin in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your Iconik Style Blueprint includes your full Chromatic Harmony Mapping™ colour palette — 10 exact colours, application guide, and Indian garment colour prescription.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this article:</p>
            <p>Iconik Styling Team. &quot;What is Chromatic Harmony Mapping™?&quot; Iconik LLP, 2025. https://www.iconik.pro/methodology/chromatic-harmony-mapping</p>
          </div>

        </div>
      </main>
    </>
  );
}
