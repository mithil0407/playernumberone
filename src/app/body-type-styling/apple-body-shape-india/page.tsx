import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What is an Apple Body Shape? Complete Indian Women's Guide — Iconik",
  description: "Apple body shape guide for Indian women — how to identify it, the best Indian garments (kurtas, Anarkalis, sarees), and the science behind why certain cuts work for this silhouette.",
  keywords: "apple body shape India, apple body type Indian women, apple silhouette India, how to dress apple body shape India, apple body shape kurta India",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/apple-body-shape-india" },
  openGraph: {
    title: "What is an Apple Body Shape? Complete Indian Women's Guide — Iconik",
    description: "Identify your apple body shape and learn the exact Indian garment formulas — kurtas, Anarkalis, sarees — that work for this silhouette.",
    url: "https://www.iconik.pro/body-type-styling/apple-body-shape-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Apple body shape guide for Indian women — Iconik" }],
  },
};

const faqs = [
  {
    q: "What is the difference between apple and plus-size body shape?",
    a: "Plus-size refers to size — the clothing size range — not shape geometry. An apple body shape can be any size. Apple describes a proportional distribution: midsection wider than shoulders and hips, regardless of the overall size of the person. You can have an apple silhouette at a size 8 or a size 22.",
  },
  {
    q: "Can an apple body shape wear sarees?",
    a: "Yes. The key is draping method, blouse cut, and fabric. Side-pleat draping avoids adding bulk at the front. A structured blouse with slight shoulder definition and a boat or sweetheart neckline balances the silhouette upward. A shorter, padded-shoulder blouse creates upper body width that offsets the midsection.",
  },
  {
    q: "What kurta length is best for apple body shape?",
    a: "Hip-length — ending just below the hip at its widest point. This creates a clean vertical line without cutting the silhouette at the midsection. Longer kurtas (knee-length or floor-length Anarkali-style) also work if they maintain a straight or flared line without gathering at the waist.",
  },
  {
    q: "Is an apple body shape the same as having a tummy?",
    a: "Similar but not identical. An apple silhouette describes the overall proportional structure of the body. Dressing for a tummy is a subset — it addresses midsection styling specifically. An apple body shape guide covers the full outfit geometry, including lower body, upper body, and proportion balance — not just the midsection.",
  },
];

export default function AppleBodyShapeIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "What is an Apple Body Shape? Complete Indian Women's Guide",
        "description": "Complete guide to the apple body shape for Indian women — identification, Indian garment formulas, and Geometric Silhouette Profiling™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/apple-body-shape-india" },
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
          { "@type": "ListItem", "position": 2, "name": "Body Type Styling", "item": "https://www.iconik.pro/body-type-styling" },
          { "@type": "ListItem", "position": 3, "name": "Apple Body Shape India", "item": "https://www.iconik.pro/body-type-styling/apple-body-shape-india" },
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
              <li className="text-gray-800 font-medium">Apple Body Shape India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What is an Apple Body Shape? Complete Indian Women&apos;s Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              An apple body shape carries more volume at the midsection relative to the shoulders and hips, with proportionally slimmer legs. In the Indian context, it is one of the most common silhouettes — and one of the most poorly served by Western styling guides that assume different garment categories and different frame structures.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Defines an Apple Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The apple silhouette is characterised by a midsection that is as wide as or wider than both the shoulders and the hips. The waist measurement is similar to or larger than the hip measurement. Legs are typically slimmer in proportion. The chest may be full.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              In Geometric Silhouette Profiling™, the apple category is defined by a waist-to-hip ratio above 0.85, combined with visual midsection dominance when the body is viewed as a whole. GSP also maps soft tissue distribution — where volume actually sits — rather than relying solely on circumference measurements.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Indian women frequently have this distribution due to hormonal and genetic factors that concentrate fat storage in the abdominal zone. This shape has a clear, precise styling logic — it is not a problem to solve but a geometry to dress.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Is Apple Body Shape Identified in Indian Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Standard body type quizzes use waist-to-hip ratio alone. GSP™ goes further — it maps the proportional relationship between the shoulder span, the midsection width, and the hip span as a three-point geometry. This matters because Indian women often have a hybrid profile: narrower shoulders relative to hip width (a pear characteristic) combined with midsection weight (an apple characteristic).
            </p>
            <p className="text-gray-600 leading-relaxed">
              This hybrid apple-pear distribution is extremely common in Indian women and completely unaddressed by Western body type systems. GSP™ identifies it as a primary type and produces a styling prescription for the specific combination rather than forcing a binary category.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Best Indian Ethnic Wear for an Apple Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Anarkali suits</strong> are the strongest choice. The fitted yoke defines and frames the upper body, while the full flare falls from the hip — bypassing the midsection entirely. The floor-length cut creates maximum vertical elongation. For work, an Anarkali in crepe or georgette in a solid undertone-matched colour is both professional and flattering.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Straight-cut kurtas</strong> at hip length worn over cigarette trousers or straight-leg salwars create a clean vertical line from shoulder to hem. The kurta must end at or just below the hip — not at the midsection.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Anarkali suits with fitted yoke and full flare</li>
              <li>Straight-cut hip-length kurtas over straight trousers</li>
              <li>Palazzo sets in solid colours</li>
              <li>Floor-length kaftans (casual occasions)</li>
              <li>Sarees with side-pleat draping and structured blouse</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Short kurtis ending at the midsection. Salwar kameez with horizontal embellishment at the waist. Churidar sets with a cropped kurti. Heavy saree borders along the front pleating zone.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Best Western Wear for an Apple Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Wide-leg trousers</strong> with a structured blazer worn open creates a strong vertical line. The blazer lapels frame the chest and draw attention upward. <strong>Wrap blouses</strong> that cross under the bust (empire-waist-adjacent cut) create a visual waist above the midsection.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Straight or wide-leg trousers with a structured open blazer</li>
              <li>Wrap blouses crossing under the bust</li>
              <li>V-neck and boat-neck tops (upward focal points)</li>
              <li>A-line midi skirts with a structured fitted top</li>
              <li>Shift dresses in structured fabric (not jersey)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Cropped jackets (cut across the midsection). Bodycon dresses (outline the midsection circumference). High-waisted pencil skirts that sit at the waist. Horizontal colour-blocking with the contrast at the waistline.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Should an Apple Body Shape Wear a Saree?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The standard Nivi drape — with tight, neatly pleated fabric tucked into the waist — adds a shelf of fabric directly at the midsection. For apple silhouettes, this is the least flattering draping style.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Better draping options:</strong> Side-pleat style (pleats to the side rather than straight front). Box-pleat Gujarati drape. Seedha pallu with minimal front pleating. The goal is to reduce the volume of fabric sitting at the front of the waist.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Blouse:</strong> Boat neck or sweetheart neck in structured fabric (crepe, dupion). Slightly padded shoulders to balance the width upward. Full-length or 3/4 sleeve. A structured, fitted blouse with shoulder definition is the most flattering frame for an apple silhouette in a saree.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Colours and Prints Work for an Apple Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Use your Chromatic Harmony Mapping™ palette as the foundation. Within that palette, apply darker or more muted shades to garments covering the midsection. Brighter or lighter shades from the same palette work well at the upper chest and lower body — drawing attention away from the centre.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Large horizontal prints at the waist. Loud prints concentrated at the midsection. Metallic fabrics across the belly zone. Bold colour-blocking with a contrast line at the natural waist.
            </p>
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
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Hub</Link></li>
              <li>→ <Link href="/body-type-styling/apple" className="underline hover:opacity-70">Apple Body Type: Styling Guide</Link></li>
              <li>→ <Link href="/body-type-styling/how-to-dress-tummy" className="underline hover:opacity-70">How to Dress if You Have a Tummy</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations specific to your silhouette.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;What is an Apple Body Shape? Complete Indian Women&apos;s Guide.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/apple-body-shape-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
