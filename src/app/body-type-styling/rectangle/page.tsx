import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rectangle Body Shape Styling Guide for Indian Women — Iconik",
  description: "Complete rectangle body shape styling guide for Indian women. Learn which cuts, fabrics, and Indian garment choices create the illusion of a defined waist and feminine curves.",
  keywords: "rectangle body type India, how to dress rectangle body type Indian women, straight body shape styling India, create curves rectangle body India",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/rectangle" },
  openGraph: {
    title: "Rectangle Body Shape Styling Guide for Indian Women — Iconik",
    description: "Create waist definition and curves using the right cuts and Indian garments.",
    url: "https://www.iconik.pro/body-type-styling/rectangle",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Rectangle body shape styling guide — Iconik" }],
  },
};

const faqs = [
  {
    q: "How should a rectangle body type create the appearance of curves?",
    a: "The rectangle silhouette benefits most from garments that cinch or define the waist — peplum kurtis, wrap-style blouses, belted kurtas, and sarees with a structured blouse that nips in at the waist. Colour blocking that places a different shade at the waist zone also creates the impression of indentation where there isn't one.",
  },
  {
    q: "What Indian ethnic wear works best for the rectangle body type?",
    a: "Sarees with a fitted, structured blouse are excellent — the blouse defines the upper body while the saree drape creates hip volume. Wrap-style kurtis with a side-tie create waist definition. Lehenga-choli sets with a fitted choli and a flared lehenga create an hourglass impression.",
  },
  {
    q: "What should a rectangle body type avoid?",
    a: "Avoid straight, boxy kurtis with no waist definition. Avoid shapeless, oversized silhouettes that obscure the entire body outline. Avoid vertical-only styling without any waist-defining element — this simply elongates the linear look.",
  },
];

export default function RectangleBodyTypePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Rectangle Body Shape Styling Guide for Indian Women",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/rectangle" },
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
          { "@type": "ListItem", "position": 3, "name": "Rectangle Body Type", "item": "https://www.iconik.pro/body-type-styling/rectangle" },
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
              <li className="text-gray-800 font-medium">Rectangle Body Type</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Rectangle Body Shape Fashion Guide for Indian Women
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              A rectangle body shape has similar shoulder, waist, and hip measurements with minimal curve differentiation. The styling goal is to create the illusion of a defined waist — adding curves with fabric structure, draping, and colour rather than relying on the body&apos;s natural geometry.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Styling Principle for Rectangle Silhouettes</h2>
            <p className="text-gray-600 leading-relaxed">
              <strong>Create waist definition where the body does not provide it naturally.</strong> This is achieved through garment structure (peplum, wrap cuts, belts), colour contrast at the waist zone, and fabric choices that drape to create an impression of curvature. The rectangle silhouette has the advantage of being able to wear structured garments without distortion — tailored pieces look excellent on this frame.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Cuts and Garments for the Rectangle Body Type</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Peplum kurtis</strong> — the flared peplum at the hip creates an instant waist-to-hip differential</li>
              <li><strong>Wrap-style blouses and kurtis</strong> — the diagonal neckline and side tie create a waist focal point</li>
              <li><strong>Belted kurtas</strong> — a structured belt at the natural waist breaks the linear silhouette</li>
              <li><strong>Lehenga-choli</strong> with a fitted, cropped choli and a full lehenga — defines the waist by contrast</li>
              <li><strong>Sarees</strong> with a structured, fitted blouse and a pleated pallu that adds hip volume</li>
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
              <li>→ <Link href="/body-type-styling/pear" className="underline hover:opacity-70">Pear Body Shape Guide</Link></li>
              <li>→ <Link href="/body-type-styling/hourglass" className="underline hover:opacity-70">Hourglass Body Shape Guide</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Rectangle Body Shape Fashion Guide for Indian Women.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/rectangle</p>
          </div>
        </div>
      </main>
    </>
  );
}
