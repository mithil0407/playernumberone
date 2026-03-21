import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Warm Undertone: Best Colours for Indian Women — Iconik",
  description: "Warm undertone Indian women look best in earthy, golden tones — terracotta, mustard, olive, burnt orange. Complete guide covering identification, saree colours, colours to avoid, and Chromatic Harmony Mapping™.",
  keywords: "warm undertone colours Indian women, best colours warm undertone India, warm skin tone palette India, golden undertone colour guide India",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/warm-undertone" },
  openGraph: {
    title: "Warm Undertone Colour Guide for Indian Women — Iconik",
    description: "The exact colours that flatter a warm, golden, or peachy undertone — calibrated for Indian skin.",
    url: "https://www.iconik.pro/colour-analysis/warm-undertone",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Warm undertone colour guide — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Warm Undertone Colour Guide for Indian Women — Iconik",
    description: "The exact colours that flatter a warm, golden, or peachy undertone — calibrated for Indian skin.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "How do I know if I have a warm undertone?",
    a: "Signs of a warm undertone include: veins appearing greenish (not blue-purple) on your inner wrist in natural light; gold jewellery looking more flattering than silver; your skin appearing golden or olive against a white background; and you looking better in earthy tones like rust, mustard, and olive than in cool tones like navy or fuchsia.",
  },
  {
    q: "What are the best saree colours for warm undertone Indian women?",
    a: "Warm undertone women look luminous in sarees in terracotta, burnt orange, mustard yellow, olive green, warm burgundy (brick-red rather than cool wine), camel, gold, warm ivory, and deep browns. These colours harmonise with the golden base of warm undertones.",
  },
  {
    q: "Can warm undertone Indian women wear black?",
    a: "Yes — black is a neutral and works across all undertones. For warm undertones, pairing black with warm accent colours (gold jewellery, a warm-toned dupatta, or a warm lip colour) keeps the look harmonious. Stark, cool black-and-white combinations may read slightly cold on warm undertones.",
  },
  {
    q: "Why does mustard yellow suit Indian women with warm undertones specifically?",
    a: "Mustard is a warm, golden-yellow colour. It creates harmony with warm undertone skin because it echoes the yellow-golden base of the undertone. For cool undertone women, mustard introduces a yellow cast that can make the skin appear sallow or jaundiced — this is why the same colour looks flattering on one Indian woman and wrong on another.",
  },
];

export default function WarmUndertonePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/warm-undertone#article",
        "headline": "Warm Undertone: Best Colours for Indian Women",
        "description": "The best colours for warm undertone Indian women — earthy tones, identification tests, saree colours, and colours to avoid.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-01-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/warm-undertone" },
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "Colour Analysis", "item": "https://www.iconik.pro/colour-analysis" },
          { "@type": "ListItem", "position": 3, "name": "Warm Undertone", "item": "https://www.iconik.pro/colour-analysis/warm-undertone" },
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
              <li className="text-gray-800 font-medium">Warm Undertone</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Warm Undertone: Best Colours for Indian Women
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Warm undertone Indian women look best in earthy, golden tones — terracotta, mustard, burnt orange, olive green, camel. A warm undertone means your skin has a yellow, golden, or peachy base. Colours that harmonise with this base will make your complexion look luminous. Colours that clash with it — cool blues, stark pinks, icy pastels — will make you look sallow or washed out.
            </p>
          </header>

          <div className="mb-12">
            <Image
              src="/undertone-comparison.webp"
              alt="Warm undertone identification — green veins on Indian women's inner wrist indicate warm undertone"
              width={900}
              height={400}
              className="w-full rounded-xl"
              priority
            />
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Identify a Warm Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Warm undertone is the most common undertone in Indian women. Use these tests to confirm yours:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Vein colour:</strong> veins on your inner wrist appear greenish, not blue-purple, when checked in natural daylight</li>
              <li><strong>Jewellery:</strong> yellow gold looks more flattering against your skin than silver</li>
              <li><strong>White paper test:</strong> hold a white sheet next to your bare face — your skin appears golden, olive, or peachy rather than pinkish or grey</li>
              <li><strong>Clothing response:</strong> you look alive in terracotta, mustard, and burnt orange; in cobalt or fuchsia, you look flat</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              If results are mixed, you may have a neutral undertone. See the <Link href="/colour-analysis/neutral-undertone" className="underline hover:opacity-70">neutral undertone guide</Link> or take the full <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">at-home undertone test</Link>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Colours for Warm Undertone Indian Women</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Terracotta", desc: "The quintessential warm undertone colour — earthy, rich, vibrant" },
                { name: "Mustard Yellow", desc: "Golden-toned yellow that harmonises with golden undertones" },
                { name: "Olive Green", desc: "Earthy green with yellow base — flatters warm undertones across all skin depths" },
                { name: "Burnt Orange", desc: "Rich, warm orange — excellent for ethnic occasions" },
                { name: "Warm Burgundy", desc: "Brick-red rather than cool wine — the warm version of deep red" },
                { name: "Camel and Tan", desc: "Neutral warm tones that complement without overpowering" },
                { name: "Coral and Peach", desc: "Warm pink-orange tones that glow against golden undertones" },
                { name: "Warm Brown", desc: "Cognac, chocolate, and warm tan — rich neutrals that ground any look" },
              ].map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Colours to Approach with Caution</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              These colours do not necessarily look bad on warm undertones — but they require more careful pairing (warm jewellery, warm makeup) to avoid reading cool against a golden base:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Icy pastels (baby pink, baby blue, lavender)</li>
              <li>Blue-based reds (cool cherry, fuchsia)</li>
              <li>Stark, cool white (ivory or off-white is better)</li>
              <li>Blue-based purples (warm plum is fine; cool violet less so)</li>
            </ul>
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
              <li>→ <Link href="/colour-analysis/neutral-undertone" className="underline hover:opacity-70">Neutral Undertone Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-wheatish-skin-india" className="underline hover:opacity-70">Best Colours for Wheatish Skin</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get your personalised colour palette in 48 hours</h2>
            <p className="text-gray-600 mb-6">Chromatic Harmony Mapping™ — included in every Iconik Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Warm Undertone: Best Colours for Indian Women.&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis/warm-undertone</p>
          </div>
        </div>
      </main>
    </>
  );
}
