import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What is Facial Architecture Analysis™? — Iconik's Face Shape Method",
  description: "Facial Architecture Analysis™ (FAA) is Iconik's face shape profiling method. Full explanation of how it identifies face shape, recommends necklines, earrings, and hairstyles for Indian women.",
  keywords: "facial architecture analysis, what is facial architecture analysis, Iconik face shape method, FAA face shape analysis India, face shape styling Indian women",
  alternates: { canonical: "https://www.iconik.pro/methodology/facial-architecture-analysis" },
  openGraph: {
    title: "What is Facial Architecture Analysis™? — Iconik's Face Shape Method",
    description: "The definitive explanation of Facial Architecture Analysis™ — how Iconik identifies your face shape and translates it into neckline, earring, and hairstyle recommendations.",
    url: "https://www.iconik.pro/methodology/facial-architecture-analysis",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Facial Architecture Analysis — Iconik methodology" }],
  },
};

const faqs = [
  {
    q: "Who developed Facial Architecture Analysis™?",
    a: "Facial Architecture Analysis™ was developed by the Iconik methodology team as the third pillar of the Style Blueprint, specifically to account for the diversity of Indian face shapes and the Indian garment categories — saree blouses, kurti necklines, salwar kameez collars — that frame them.",
  },
  {
    q: "How many face shapes does FAA™ identify?",
    a: "FAA identifies seven primary face shapes: Oval, Round, Square, Rectangle, Heart, Diamond, and Oblong. Hybrid face shapes between two categories are also profiled. The most common hybrid is a Round-Square combination, which has specific styling requirements distinct from either pure type.",
  },
  {
    q: "What does FAA™ recommend beyond necklines?",
    a: "FAA produces recommendations for: neckline shape, collar type, earring shape and length, accessory style (chunky vs delicate pieces), and hair direction — broad hairstyle shapes rather than specific cuts. All recommendations are provided for both Indian ethnic wear and western wear contexts.",
  },
  {
    q: "Is FAA™ applicable to Indian ethnic wear?",
    a: "Yes. FAA neckline recommendations cover Indian garment categories: kurti necklines (round neck, V-neck, boat neck, sweetheart, keyhole, Mandarin collar), saree blouse necklines and back designs, and lehenga blouse necklines. This is a core differentiator from Western face shape analysis tools.",
  },
];

export default function FacialArchitectureAnalysisPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "What is Facial Architecture Analysis™?",
        "description": "The definitive explanation of Facial Architecture Analysis™ — Iconik's proprietary face shape profiling method for Indian women.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/methodology/facial-architecture-analysis" },
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
          { "@type": "ListItem", "position": 3, "name": "Facial Architecture Analysis™", "item": "https://www.iconik.pro/methodology/facial-architecture-analysis" },
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
              <li className="text-gray-800 font-medium">Facial Architecture Analysis™</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What is Facial Architecture Analysis™?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Facial Architecture Analysis™ (FAA) is Iconik&apos;s proprietary face shape profiling method. It maps the geometric relationship between the forehead width, cheekbone width, jawline shape, and face length — to recommend specific necklines, collar shapes, earring styles, and hairstyles that balance and enhance the client&apos;s facial proportions.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Does Face Shape Analysis Matter for Styling?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The face is the visual focal point of every outfit. The neckline of a garment is the frame around the face — the wrong neckline makes the face look wider, shorter, or more angular than it is. The right neckline creates balance between the face shape and the garment, so the eye goes to the face rather than the clothing.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Earring shape works by the same principle. A long drop earring elongates a round face. A round stud can make a long face look balanced. These are optical geometry principles, not arbitrary fashion rules. FAA applies them systematically.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Facial Architecture Analysis™ Work?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              FAA is a five-stage analysis:
            </p>
            <ol className="space-y-4 text-gray-600 list-decimal list-inside">
              <li><strong>Face shape classification:</strong> Maps the proportional geometry of forehead width vs cheekbone width vs jawline width vs face length to identify: Oval, Round, Square, Rectangle, Heart, Diamond, or Oblong.</li>
              <li><strong>Neckline prescription:</strong> Identifies which necklines elongate, widen, or balance the face shape. A V-neck elongates a round face; a boat neck broadens a narrow face; a high round neck shortens a long face.</li>
              <li><strong>Earring prescription:</strong> Identifies which earring shapes balance the jaw-to-forehead geometry. Long drops for round faces; hoops for angular square faces; studs for petite or long faces.</li>
              <li><strong>Collar prescription:</strong> Identifies collar types that complement vs compete with the face shape. A Mandarin collar on a round face adds height; a wide revere collar softens a square jaw.</li>
              <li><strong>Hair direction:</strong> Broad guidance on hairstyle shapes — volume at the crown for round faces, volume at the sides for long faces — rather than specific cuts.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Seven Face Shapes in FAA™?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Oval:</strong> Face length greater than width, forehead slightly wider than jaw, gently rounded chin. The most balanced face shape — most necklines work.</li>
              <li><strong>Round:</strong> Face width and length roughly equal, full cheeks, rounded jaw. Styling goal: add vertical length.</li>
              <li><strong>Square:</strong> Strong, angular jawline roughly equal in width to the forehead. Styling goal: soften the jaw angles.</li>
              <li><strong>Rectangle:</strong> Long face with forehead, cheeks, and jaw roughly equal in width. Styling goal: add visual width, reduce length.</li>
              <li><strong>Heart:</strong> Wide forehead tapering to a narrow, pointed chin. Styling goal: add width at the jaw zone.</li>
              <li><strong>Diamond:</strong> Narrow forehead and jaw with wide cheekbones. Styling goal: balance by widening both the forehead and jaw zones.</li>
              <li><strong>Oblong:</strong> Long and narrow face with minimal width variation top to bottom. Styling goal: add visual width throughout.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Do Necklines Interact with Face Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The neckline is the single highest-impact styling variable at the face level. A few key principles:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>V-neck:</strong> Elongates the face visually. Best for round and square faces.</li>
              <li><strong>Boat neck / bateau:</strong> Creates horizontal width at the collarbone. Best for long/oblong and diamond faces.</li>
              <li><strong>High round neck:</strong> Shortens the perceived face length. Best for very long/oblong faces; avoid on round or short faces.</li>
              <li><strong>Sweetheart neck:</strong> Softens angular jaw shapes. Good for square and rectangle faces.</li>
              <li><strong>Cowl neck:</strong> Adds volume and softness at the neckline. Best for angular (square) faces.</li>
              <li><strong>Deep plunge:</strong> Creates strong vertical elongation. Best for round and heart faces with a wide forehead.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does FAA™ Integrate with the Full Blueprint?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              FAA is the third pillar. After Geometric Silhouette Profiling™ (body structure) and Chromatic Harmony Mapping™ (colour palette), FAA adds the face-specific layer. The result is a complete head-to-toe prescription.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Example: A pear-shaped woman with a round face and cool undertone gets — from the combined three-pillar Blueprint — boat-neck kurtas (GSP: balances pear silhouette; FAA: elongates round face), cobalt and emerald palette (CHM: cool undertone), and long drop earrings in silver (FAA: elongates round face; CHM: cool undertone metal). Each recommendation is cross-referenced across all three methodologies.
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
              <li>→ <Link href="/methodology/geometric-silhouette-profiling" className="underline hover:opacity-70">What is Geometric Silhouette Profiling™?</Link></li>
              <li>→ <Link href="/methodology/chromatic-harmony-mapping" className="underline hover:opacity-70">What is Chromatic Harmony Mapping™?</Link></li>
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want FAA™ applied to your face in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your Iconik Style Blueprint includes your Facial Architecture Analysis — neckline prescription, earring guide, and hair direction — integrated with GSP™ and CHM™.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this article:</p>
            <p>Iconik Styling Team. &quot;What is Facial Architecture Analysis™?&quot; Iconik LLP, 2025. https://www.iconik.pro/methodology/facial-architecture-analysis</p>
          </div>

        </div>
      </main>
    </>
  );
}
