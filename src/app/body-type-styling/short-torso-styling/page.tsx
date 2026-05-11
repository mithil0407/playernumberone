import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Dress for a Short Torso: Proportion Guide for Indian Women — Iconik",
  description: "Complete guide to dressing a short torso for Indian women. Which cuts elongate the torso, which Indian garments to choose, and how Geometric Silhouette Profiling™ handles torso-length styling.",
  keywords: "short torso styling India, how to dress short torso Indian women, petite torso fashion India, elongate short torso clothes India, short waist styling Indian women",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/short-torso-styling" },
  openGraph: {
    title: "How to Dress for a Short Torso: Proportion Guide for Indian Women — Iconik",
    description: "Exact cuts and Indian garment formulas to elongate a short torso — without heels or shapewear.",
    url: "https://www.iconik.pro/body-type-styling/short-torso-styling",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Short torso styling guide for Indian women — Iconik" }],
  },
};

const faqs = [
  {
    q: "Is a short torso the same as being petite?",
    a: "No. A short torso is a proportional characteristic — the torso-to-leg ratio. You can have a short torso and still be tall overall if your legs are long. Petite usually refers to overall height under 5'3\". Short torso styling addresses the torso length specifically, independent of overall height.",
  },
  {
    q: "Should a short-torso woman avoid high-waisted bottoms entirely?",
    a: "As a rule, yes. High-waisted garments sit at the already-short waist zone and divide the torso at an even higher point, making it appear shorter. Low-rise to mid-rise waistbands allow the torso to appear longer by not dividing it at a high point.",
  },
  {
    q: "What is the best saree blouse length for a short torso?",
    a: "A blouse that ends exactly at the natural waist — not cropped above it. Critically, the blouse should not expose a band of skin between blouse hem and petticoat waistband. This gap creates a visual horizontal division that makes the torso appear shorter.",
  },
  {
    q: "Can monochromatic kurta sets elongate a short torso?",
    a: "Yes, significantly. Wearing the same colour kurta and salwar removes the visual break at the waist entirely and creates an unbroken vertical line from shoulder to hem. The eye travels the full length without stopping at a colour contrast.",
  },
];

export default function ShortTorsoStylingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "How to Dress for a Short Torso: Proportion Guide for Indian Women",
        "description": "Proportion guide for short torso dressing — Indian garment formulas using Geometric Silhouette Profiling™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/short-torso-styling" },
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
          { "@type": "ListItem", "position": 3, "name": "Short Torso Styling", "item": "https://www.iconik.pro/body-type-styling/short-torso-styling" },
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
              <li className="text-gray-800 font-medium">Short Torso Styling</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              How to Dress for a Short Torso: Proportion Guide for Indian Women
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              A short torso means the distance from your shoulder to your natural waist is proportionally shorter than your hip-to-hem measurement. The styling goal is elongation — making the torso appear longer using vertical lines, strategic waistline placement, and garment length choices that don&apos;t cut the torso at a high point.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Defines a Short Torso?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Torso length is measured from the shoulder (at the base of the neck) to the natural waist. A short torso occurs when this measurement is proportionally shorter than the leg length (hip to floor). It is common in Indian women with petite or short-waisted frames.
            </p>
            <p className="text-gray-600 leading-relaxed">
              A short torso affects how garments sit: kurtis may hit at the wrong point relative to the waist, waistbands may sit higher on the body than expected, and cropped styles cut the torso at the wrong point. Geometric Silhouette Profiling™ identifies torso length as part of the limb proportion assessment.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Cuts Elongate a Short Torso?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>V-necks and deep necklines</strong> draw the eye downward, creating the visual impression of a longer distance from chin to waist. <strong>Low-to-mid-rise waistbands</strong> allow the torso to appear longer by not dividing it at a high point.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Monochromatic outfits</strong> — same colour top and bottom — create an unbroken vertical line from shoulder to hem. The eye travels the full length without stopping at a colour contrast at the waist. This is the single most effective technique for short torso elongation.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Empire waist garments can both help and hurt: they only work if the waist seam sits at the actual bust (sub-bust), not higher. If the empire seam sits above the bust, it creates a second horizontal division at a very high point on the torso.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Indian Ethnic Wear Works Best for a Short Torso?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Straight-cut kurtas</strong> are the strongest choice — they do not divide the torso at the waist, creating a clean vertical line from shoulder to hem. The same-colour kurta and salwar maximises this effect.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Anarkali suits</strong> with a long fitted bodice are excellent — the bodice covers the torso without dividing it, and the flare from the hip creates lower-body volume that makes the torso appear longer by contrast.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Straight-cut kurtas (same colour as salwar for maximum elongation)</li>
              <li>Anarkali suits with a long fitted bodice</li>
              <li>Palazzo sets in matching colours</li>
              <li>Sarees worn with the petticoat at natural waist (not high)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Cropped kurtis. Empire-waist garments with the seam above the bust. Heavy embellishment at the waist seam. Contrasting waistbands. Anything that creates a horizontal visual break high on the torso.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What to Avoid with a Short Torso</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The key category to avoid: anything that creates a horizontal line high on the body. This includes:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>High-waisted trousers, skirts, or palazzos (sit too high on the torso)</li>
              <li>Cropped tops and kurtis (cut the torso at its shortest point)</li>
              <li>Bolero jackets (create a horizontal edge across the upper torso)</li>
              <li>Wide statement belts worn at the natural waist</li>
              <li>Strong colour contrast between top and bottom (creates a visual horizontal divide)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Does Monochromatic Dressing Work So Well for Short Torsos?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              When you wear the same colour from shoulder to hem — a cobalt kurta with cobalt salwar, or a camel shirt with camel trousers — the eye has no colour contrast at the waist to stop on. It travels the full length of the garment in one movement. This makes the perceived torso-to-leg ratio appear far more balanced.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Your Chromatic Harmony Mapping™ palette is particularly useful here — it gives you your best undertone-matched colours to wear head-to-toe without looking washed out. A monochromatic look in the right colour is both elongating and striking.
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
              <li>→ <Link href="/body-type-styling/how-to-look-taller-clothing" className="underline hover:opacity-70">How to Look Taller with Clothing</Link></li>
              <li>→ <Link href="/body-type-styling/apple-body-shape-india" className="underline hover:opacity-70">Apple Body Shape India Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis including torso proportion, colour palette, and 16+ outfit recommendations.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;How to Dress for a Short Torso: Proportion Guide for Indian Women.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/short-torso-styling</p>
          </div>

        </div>
      </main>
    </>
  );
}
