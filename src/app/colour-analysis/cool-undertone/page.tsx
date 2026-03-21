import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cool Undertone Colour Guide for Indian Women — Iconik",
  description: "Cool undertone Indian women look best in jewel tones — navy, emerald, fuchsia, burgundy. Complete guide covering identification tests, saree colours, colours to avoid, and Chromatic Harmony Mapping™.",
  keywords: "cool undertone colours Indian women, best colours cool undertone India, pink undertone India, cool skin tone palette India, jewel tones Indian women",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/cool-undertone" },
  openGraph: {
    title: "Cool Undertone Colour Guide for Indian Women — Iconik",
    description: "The exact colours that flatter a cool, pink, or rosy undertone — calibrated for Indian skin.",
    url: "https://www.iconik.pro/colour-analysis/cool-undertone",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Cool undertone colour guide — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cool Undertone Colour Guide for Indian Women — Iconik",
    description: "The exact colours that flatter a cool, pink, or rosy undertone — calibrated for Indian skin.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "How do I know if I have a cool undertone?",
    a: "Signs of a cool undertone: veins appear blue-purple (not green) on your inner wrist in natural daylight; silver jewellery is more flattering than gold; your skin appears pinkish or rosy against a white background; you look vibrant in jewel tones like navy, emerald, and fuchsia rather than earthy tones like rust and mustard.",
  },
  {
    q: "What are the best saree colours for cool undertone Indian women?",
    a: "Cool undertone women look stunning in sarees in navy, royal blue, emerald green, fuchsia, cool purple, deep magenta, rose pink, burgundy (wine-toned rather than brick), and crisp white. These harmonise with the pink or blue base of cool undertones and make the complexion appear bright and vibrant.",
  },
  {
    q: "Can cool undertone Indian women wear warm colours like orange or yellow?",
    a: "Warm colours like orange and yellow can be worn by cool undertones, but the specific shade matters. Opt for cool-leaning versions: lemon yellow (rather than mustard), pink-tinged coral (rather than deep orange), and cool-toned jewel versions of normally warm colours. The key is to avoid the most intensely earthy, golden versions.",
  },
  {
    q: "I'm Indian and always told warm colours suit me — but I look better in blue. Why?",
    a: "Generic Indian styling advice defaults to warm undertones because they are the most common in the Indian population. But cool undertone is not rare in Indian women. If you consistently look more vibrant in blue, emerald, or fuchsia than in terracotta or mustard, you very likely have a cool undertone — and the generic advice has been wrong for you all along.",
  },
  {
    q: "What jewellery metal suits cool undertone Indian women?",
    a: "Silver, white gold, and platinum are most flattering for cool undertone women. Yellow gold can create a slight clash with the pink or blue base of cool undertones. Rose gold often works for cool undertones because of its pinkish hue — though how much depends on the individual.",
  },
];

export default function CoolUndertonePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/cool-undertone#article",
        "headline": "Cool Undertone Colour Guide for Indian Women",
        "description": "The best colours for cool undertone Indian women — jewel tones, blue-based hues, identification tests, and colours to avoid.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-01-01",
        "dateModified": new Date().toISOString().split("T")[0],
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
              Cool undertone Indian women look best in jewel tones — navy, emerald, fuchsia, burgundy, royal purple. A cool undertone means your skin has a pink, red, or blue base. Colours that harmonise with this base make your complexion appear bright and vibrant. Earthy, golden tones — terracotta, mustard, camel — read muddy or flat against cool skin.
            </p>
          </header>

          <div className="mb-12">
            <Image
              src="/colour-palette-swatches.webp"
              alt="Cool undertone colour palette for Indian women — jewel tones including navy, emerald, fuchsia and burgundy"
              width={900}
              height={300}
              className="w-full rounded-xl"
              priority
            />
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Identify a Cool Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Cool undertone is less commonly acknowledged in Indian styling advice — but it is not rare. Use these tests to confirm yours:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Vein colour:</strong> veins on your inner wrist appear blue-purple, not green, when checked in natural daylight</li>
              <li><strong>Jewellery:</strong> silver looks more flattering against your skin than yellow gold</li>
              <li><strong>White paper test:</strong> hold a white sheet next to your bare face — your skin appears pinkish or slightly greyish, not golden or olive</li>
              <li><strong>Clothing response:</strong> you look alive in navy, cobalt, emerald, and fuchsia; in terracotta or mustard, you look flat or sallow</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              If results are mixed, you may have a neutral undertone — a balance of warm and cool. See the <Link href="/colour-analysis/neutral-undertone" className="underline hover:opacity-70">neutral undertone guide</Link> or the <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">complete at-home test guide</Link>.
            </p>
          </section>

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
                { name: "Royal Purple", desc: "Cool-toned purple and amethyst create vivid harmony with cool undertones" },
                { name: "Cobalt Blue", desc: "Deeply saturated cool blue — makes the complexion appear bright and energised" },
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
              These colours introduce yellow warmth that clashes with a cool undertone&apos;s pink or blue base — making the skin appear grey, dull, or sallow:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Mustard yellow and golden yellow</li>
              <li>Terracotta and burnt orange</li>
              <li>Warm camel and tan</li>
              <li>Earthy brown and olive green</li>
              <li>Warm ivory (stark white is more flattering)</li>
              <li>Deep warm coral (cooler pink-coral versions work fine)</li>
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
              <li>→ <Link href="/colour-analysis/best-colours-dusky-skin" className="underline hover:opacity-70">Best Colours for Dusky Skin</Link></li>
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
            <p>Iconik Styling Team. &quot;Cool Undertone Colour Guide: Indian Women.&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis/cool-undertone</p>
          </div>
        </div>
      </main>
    </>
  );
}
