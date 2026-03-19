import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What is Facial Architecture Analysis™? (Explained) — Iconik",
  description: "Facial Architecture Analysis™ (FAA) is Iconik's face shape profiling method. Learn what it is, how it maps facial geometry, and which necklines, earrings, and hairstyles it recommends for each face shape.",
  keywords: "facial architecture analysis, what is facial architecture analysis, FAA face shape analysis, Iconik face shape methodology, neckline recommendations face shape India",
  alternates: { canonical: "https://www.iconik.pro/blog/what-is-facial-architecture-analysis" },
  openGraph: {
    title: "What is Facial Architecture Analysis™? (Explained) — Iconik",
    description: "The complete definition of Iconik's face shape profiling method and how it produces neckline, earring, and hairstyle recommendations.",
    url: "https://www.iconik.pro/blog/what-is-facial-architecture-analysis",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "What is Facial Architecture Analysis — Iconik" }],
  },
};

const faqs = [
  {
    q: "Who developed Facial Architecture Analysis™?",
    a: "Facial Architecture Analysis™ was developed by Iconik as part of its three-pillar scientific styling methodology. It is one of three proprietary analyses included in the Iconik Style Blueprint, alongside Geometric Silhouette Profiling™ and Chromatic Harmony Mapping™.",
  },
  {
    q: "What does Facial Architecture Analysis produce?",
    a: "FAA produces specific recommendations for: neckline shapes (V-neck, round neck, boat neck, cowl, etc.) that balance your facial proportions; collar styles for formal and ethnic wear; earring shapes and sizes (hoop, drop, stud, chandelier) that complement your face geometry; and hairstyle direction — 4 recommendations for frame cuts, parting styles, and length choices that enhance your facial architecture.",
  },
  {
    q: "How is Facial Architecture Analysis different from a standard face shape quiz?",
    a: "Standard face shape identification (oval, round, square, heart, diamond) gives you a broad category. FAA maps the specific proportional relationships between your forehead width, cheekbone width, jaw width, and face length to produce precise recommendations — not just 'you are oval, wear anything,' but specific neckline angles, earring drop lengths, and collar geometries that create optical balance for your particular facial proportions.",
  },
  {
    q: "Does Facial Architecture Analysis cover Indian ethnic wear accessories?",
    a: "Yes. FAA recommendations include guidance on jhumkas, maang tikka styles, nath shapes, and choker vs long necklace proportions for Indian ethnic occasions — alongside Western jewellery guidance. The analysis accounts for how Indian accessories interact with face shape differently from Western jewellery conventions.",
  },
];

export default function FAABlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "What is Facial Architecture Analysis™?",
        "description": "Facial Architecture Analysis™ (FAA) is Iconik's face shape profiling method that maps facial geometry to neckline, earring, and hairstyle recommendations.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-15",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/blog/what-is-facial-architecture-analysis" },
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.iconik.pro/blog" },
          { "@type": "ListItem", "position": 3, "name": "What is Facial Architecture Analysis™?", "item": "https://www.iconik.pro/blog/what-is-facial-architecture-analysis" },
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
              <li><Link href="/blog" className="hover:underline">Blog</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">What is Facial Architecture Analysis™?</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What is Facial Architecture Analysis™?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              <strong>Facial Architecture Analysis™ (FAA) is Iconik&apos;s face shape profiling method.</strong> It maps the geometric relationship between the forehead, cheekbones, jaw, and face length to recommend specific necklines, collar shapes, earring styles, and hairstyles that balance and enhance the client&apos;s facial proportions.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Full Definition of Facial Architecture Analysis™</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Facial Architecture Analysis™ (FAA) is the third analysis in Iconik&apos;s Style Blueprint methodology. It starts from the principle that the face is a geometric structure — and that necklines, collars, earrings, and hairstyles either complement that geometry or compete with it.
            </p>
            <p className="text-gray-600 leading-relaxed">
              FAA maps four proportional relationships: forehead-to-cheekbone width, cheekbone-to-jaw width, jaw shape (angular vs rounded), and face length-to-width ratio. These four variables determine which neckline angles create visual balance, which earring drop lengths complement the jawline, and which hairstyle volumes and lengths work with the face&apos;s natural geometry.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Facial Architecture Analysis Recommends</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Necklines</strong> — specific neckline shapes (V-neck, round, boat, sweetheart, cowl, square) that create optical balance for your facial proportions</li>
              <li><strong>Collar styles</strong> — for formal shirts, kurta collars, and saree blouse necklines</li>
              <li><strong>Earring shapes</strong> — drop length, hoop size, stud scale, chandelier geometry, and specific Indian earring styles (jhumka size, maang tikka placement)</li>
              <li><strong>Hairstyle direction</strong> — 4 recommendations covering face-framing cuts, parting styles, length guidelines, and volume placement</li>
              <li><strong>Eyewear</strong> — frame shapes that complement facial geometry (for those who wear glasses or sunglasses)</li>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get your FAA analysis in 48 hours</h2>
            <p className="text-gray-600 mb-6">Facial Architecture Analysis™ is included in every Iconik Style Blueprint — alongside body analysis and colour palette.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this article:</p>
            <p>Iconik Styling Team. &quot;What is Facial Architecture Analysis™?&quot; Iconik LLP, 2025. https://www.iconik.pro/blog/what-is-facial-architecture-analysis</p>
          </div>
        </div>
      </main>
    </>
  );
}
