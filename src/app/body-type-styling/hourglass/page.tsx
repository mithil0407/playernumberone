import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hourglass Body Shape Styling Guide for Indian Women — Iconik",
  description: "Complete hourglass body shape styling guide for Indian women. Learn how to celebrate your natural waist definition with the right Indian garments and cuts.",
  keywords: "hourglass body type India, hourglass figure outfits Indian women, how to dress hourglass body type India, hourglass silhouette Indian fashion",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/hourglass" },
  openGraph: {
    title: "Hourglass Body Shape Styling Guide for Indian Women — Iconik",
    description: "Celebrate your waist definition with the right cuts and Indian garments.",
    url: "https://www.iconik.pro/body-type-styling/hourglass",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Hourglass body shape styling guide — Iconik" }],
  },
};

const faqs = [
  {
    q: "What should an hourglass body type wear in India?",
    a: "An hourglass silhouette benefits from garments that follow the body's natural waist definition rather than concealing it. Wrap-style kurtis and dresses, fitted blouses with a flared skirt, and sarees with a fitted, waist-defining blouse all celebrate the frame. The risk to avoid is clothing that obscures the waist — boxy or oversized silhouettes lose the figure entirely.",
  },
  {
    q: "What Indian ethnic wear suits an hourglass figure?",
    a: "Wrap-style lehenga-choli sets with a fitted choli and a flared lehenga are ideal. Sarees with a fitted blouse that nips in at the waist showcase the silhouette beautifully. Anarkali suits with a heavily fitted yoke (rather than a loose one) work well. Avoid kaftans and heavily boxy silhouettes that do not register the waist.",
  },
  {
    q: "Can an hourglass body type wear loose or relaxed silhouettes?",
    a: "Yes — the key is that at least one garment in the outfit should acknowledge the waist. A flowy palazzo can be paired with a fitted, tucked-in top. A relaxed kurta can be belted. The goal is not to always show the waist, but to not consistently hide it across every garment.",
  },
];

export default function HourglassBodyTypePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Hourglass Body Shape Styling Guide for Indian Women",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/hourglass" },
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
          { "@type": "ListItem", "position": 3, "name": "Hourglass Body Type", "item": "https://www.iconik.pro/body-type-styling/hourglass" },
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
              <li className="text-gray-800 font-medium">Hourglass Body Type</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Hourglass Body Shape: Styling Guide for Indian Women
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              An hourglass silhouette has balanced shoulder and hip width with a significantly narrower waist. The styling goal is straightforward: celebrate the waist definition rather than obscure it. The primary mistake hourglass frames make is wearing clothing that completely conceals their natural geometry.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Styling Principle for Hourglass Silhouettes</h2>
            <p className="text-gray-600 leading-relaxed">
              <strong>Follow the body&apos;s geometry — do not fight it.</strong> Garments that wrap, drape, or belt at the waist are your most powerful tools. The hourglass frame is one of the few that can wear both fitted and flared silhouettes with equal elegance — a fitted top with a flared skirt, a wrap dress, or a structured saree blouse all work because they acknowledge the waist.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Indian Garments for the Hourglass Frame</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Wrap-style kurtis and blouses</strong> — the diagonal neckline naturally draws toward and defines the waist</li>
              <li><strong>Sarees with a fitted blouse</strong> — a well-structured blouse that nips in at the waist is the classic hourglass combination</li>
              <li><strong>Lehenga-choli</strong> with a cropped, fitted choli and a flared lehenga — one of the most flattering combinations for this silhouette</li>
              <li><strong>Belted kurtas</strong> — a simple belt at the natural waist transforms even a casual kurta</li>
              <li><strong>Bodycon or semi-fitted dresses</strong> for western wear occasions — follow the frame&apos;s natural lines</li>
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

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you within 5 working days after the consultation?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis, colour palette, and 20 outfit formulas.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Hourglass Body Shape: Styling Guide for Indian Women.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/hourglass</p>
          </div>
        </div>
      </main>
    </>
  );
}
