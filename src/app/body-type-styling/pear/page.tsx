import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pear Body Shape Styling Guide for Indian Women — Iconik",
  description: "Complete pear body shape styling guide for Indian women. Discover which cuts, kurta styles, and silhouettes balance narrower shoulders with wider hips in both ethnic and western wear.",
  keywords: "pear body shape India, pear body type outfits Indian women, how to dress pear body type India, wide hips styling India, pear silhouette Indian fashion",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/pear" },
  openGraph: {
    title: "Pear Body Shape Styling Guide for Indian Women — Iconik",
    description: "Balance narrower shoulders with wider hips using the right cuts and Indian garment choices.",
    url: "https://www.iconik.pro/body-type-styling/pear",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Pear body shape styling guide — Iconik" }],
  },
};

const faqs = [
  {
    q: "How should a pear body type dress for work in India?",
    a: "For office wear, a pear silhouette benefits from structured shoulders — boat-neck or wide-neck kurtis with slight shoulder padding add visual width at the top. Pair with straight-cut or palazzo trousers rather than pencil skirts, which accentuate the hip line. Dark, solid colours for the lower half and brighter or textured fabrics on top create upward balance.",
  },
  {
    q: "What Indian ethnic wear suits a pear body type?",
    a: "A-line or flared kurtis that skim the hips without clinging are ideal. Anarkali suits work well if the yoke has embellishment or structure to add shoulder presence. For sarees, a structured blouse with a slightly padded shoulder and a saree pleated to fall away from the hips (rather than draping tightly across them) is most flattering.",
  },
  {
    q: "What cuts should a pear body type avoid?",
    a: "Avoid narrow, spaghetti-strap tops that emphasise the width disparity between shoulders and hips. Avoid pencil skirts and churidar pants that cling to the thigh and hip. Avoid heavy embroidery or print concentrated at the hip zone.",
  },
];

export default function PearBodyTypePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Pear Body Shape Styling Guide for Indian Women",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/pear" },
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "Body Type Styling", "item": "https://www.iconik.pro/body-type-styling" },
          { "@type": "ListItem", "position": 3, "name": "Pear Body Type", "item": "https://www.iconik.pro/body-type-styling/pear" },
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
              <li><Link href="/body-type-styling" className="hover:underline">Body Type Styling</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Pear Body Type</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Pear Body Shape Outfits: Complete Guide for Indian Women
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              A pear body shape has narrower shoulders and bust relative to wider hips and thighs. The styling goal is to balance the upper and lower body — adding visual width at the shoulders and reducing visual width at the hips — without shapewear or uncomfortable layering.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Identify a Pear Body Type</h2>
            <p className="text-gray-600 leading-relaxed">
              If your hip measurement is at least 5% wider than your shoulder measurement, and your waist is defined, you likely have a pear silhouette. Iconik&apos;s Geometric Silhouette Profiling™ also maps limb length and hip-to-thigh distribution to provide a more precise prescription — particularly useful for Indian women, where hip width often extends into the thigh differently than the Western framework assumes.
            </p>
          </section>

          <div className="mb-12">
            <Image
              src="/pear-styling-examples.webp"
              alt="Pear body type outfit examples for Indian women — boat-neck kurta, A-line suit, and Anarkali with structured yoke"
              width={800}
              height={600}
              className="w-full rounded-xl"
              priority
            />
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Styling Principle for Pear Silhouettes</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Add width and visual interest at the shoulders. Reduce volume and visual weight at the hips.</strong>
            </p>
            <p className="text-gray-600 leading-relaxed">
              This means structured necklines (boat neck, off-shoulder, wide square neck), embellished or textured fabric at the top half, and clean, flowing fabric at the bottom. Horizontal design elements belong above the waist; vertical or solid elements belong below it.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Indian Ethnic Wear for Pear Body Type</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Anarkali suits</strong> with an embellished or wide-yoke design — the yoke adds shoulder structure while the flared skirt skims the hips</li>
              <li><strong>A-line kurtis</strong> with a structured shoulder seam — flares away from the hip without clinging</li>
              <li><strong>Sarees</strong> draped in Nivi style with a structured blouse featuring padded or wide shoulders; avoid tight pallu tucking at the hip</li>
              <li><strong>Palazzo trousers</strong> with a fitted, structured top — the wide leg balances the hip visually</li>
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
              <li>→ <Link href="/body-type-styling/apple" className="underline hover:opacity-70">Apple Body Shape Guide</Link></li>
              <li>→ <Link href="/body-type-styling/rectangle" className="underline hover:opacity-70">Rectangle Body Shape Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Pear Body Shape Outfits: Complete Guide for Indian Women.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/pear</p>
          </div>
        </div>
      </main>
    </>
  );
}
