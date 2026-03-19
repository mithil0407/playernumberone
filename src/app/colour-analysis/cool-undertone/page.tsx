import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cool Undertone Colour Guide for Indian Women — Iconik",
  description: "Complete cool undertone colour guide for Indian women. Discover which jewel tones, blue-based colours, and palettes complement a cool, pink, or rosy skin undertone.",
  keywords: "cool undertone colours Indian women, best colours cool undertone India, pink undertone India, cool skin tone palette India, jewel tones Indian women",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/cool-undertone" },
  openGraph: {
    title: "Cool Undertone Colour Guide for Indian Women — Iconik",
    description: "The exact colours that flatter a cool, pink, or rosy undertone — calibrated for Indian skin.",
    url: "https://www.iconik.pro/colour-analysis/cool-undertone",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Cool undertone colour guide — Iconik" }],
  },
};

const faqs = [
  {
    q: "How do I know if I have a cool undertone?",
    a: "Signs of a cool undertone: veins appear blue-purple (not green) on your inner wrist; silver jewellery is more flattering than gold; your skin appears pinkish or rosy against a white background; you look vibrant in jewel tones like navy, emerald, and fuchsia rather than earthy tones like rust and mustard.",
  },
  {
    q: "What are the best saree colours for cool undertone Indian women?",
    a: "Cool undertone women look stunning in sarees in navy, royal blue, emerald green, fuchsia, cool purple, deep magenta, rose pink, burgundy (wine-toned rather than brick), and crisp white. These harmonise with the pink or blue base of cool undertones and make the complexion appear bright and vibrant.",
  },
  {
    q: "Can cool undertone Indian women wear warm colours like orange or yellow?",
    a: "Warm colours like orange and yellow can be worn by cool undertones, but the specific shade matters. Opt for cool-leaning versions: lemon yellow (rather than mustard), pink-tinged coral (rather than deep orange), and cool-toned jewel versions of normally warm colours. The key is to avoid the most intensely earthy, golden versions.",
  },
];

export default function CoolUndertonePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Cool Undertone Colour Guide for Indian Women",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/cool-undertone" },
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
          { "@type": "ListItem", "position": 3, "name": "Cool Undertone", "item": "https://www.iconik.pro/colour-analysis/cool-undertone" },
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
              <li className="text-gray-800 font-medium">Cool Undertone</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Cool Undertone Colour Guide: Indian Women
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              A cool undertone means your skin has a pink, red, or blue base. Colours that harmonise with this base — jewel tones, blue-based hues, crisp whites — make your complexion appear bright and vibrant. Earthy, golden tones can read muddy or flat against cool undertones.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Colours for Cool Undertone Indian Women</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Navy Blue", desc: "The anchor cool-tone colour — structured, elegant, universally flattering on cool undertones" },
                { name: "Emerald Green", desc: "A rich jewel green that complements the rosy base of cool undertones" },
                { name: "Fuchsia and Magenta", desc: "High-impact, blue-based pinks that make cool skin glow" },
                { name: "Burgundy (wine)", desc: "Cool, wine-toned red — not brick or tomato red" },
                { name: "Rose Pink", desc: "Soft, pink-based rose works beautifully on cool undertones" },
                { name: "Crisp White", desc: "Stark white with a blue base is more flattering than warm ivory for cool undertones" },
              ].map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.desc}</p>
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
                  <p className="text-gray-600 leading-relaxed faq-answer">{faq.a}</p>
                </div>
              ))}
            </div>
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
            <p>Iconik Styling Team. &quot;Cool Undertone Colour Guide: Indian Women.&quot; Iconik LLP, 2025. https://www.iconik.pro/colour-analysis/cool-undertone</p>
          </div>
        </div>
      </main>
    </>
  );
}
