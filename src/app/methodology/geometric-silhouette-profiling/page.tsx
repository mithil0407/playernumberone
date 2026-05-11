import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What is Geometric Silhouette Profiling™? — Iconik's Body Analysis Method",
  description: "Geometric Silhouette Profiling™ (GSP) is Iconik's proprietary body analysis methodology. Full explanation of what it is, how it works, and how it differs from standard body shape quizzes.",
  keywords: "geometric silhouette profiling, what is geometric silhouette profiling, Iconik body analysis method, GSP body type analysis, scientific body type profiling India",
  alternates: { canonical: "https://www.iconik.pro/methodology/geometric-silhouette-profiling" },
  openGraph: {
    title: "What is Geometric Silhouette Profiling™? — Iconik's Body Analysis Method",
    description: "The full definition of Geometric Silhouette Profiling™ — how it works, what makes it different, and how it is applied in the Iconik Style Blueprint.",
    url: "https://www.iconik.pro/methodology/geometric-silhouette-profiling",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Geometric Silhouette Profiling — Iconik methodology" }],
  },
};

const faqs = [
  {
    q: "Who developed Geometric Silhouette Profiling™?",
    a: "Geometric Silhouette Profiling™ was developed by the Iconik methodology team, led by founder Mithil Navalakha, specifically to address the gap between Western body type systems and the styling needs of Indian women. It accounts for Indian garment categories, Indian frame structures, and the Indian lifestyle context.",
  },
  {
    q: "Is Geometric Silhouette Profiling™ scientifically validated?",
    a: "GSP is grounded in established principles of proportion geometry and biomechanical frame analysis. It extends these principles into a practical styling framework specific to Indian women. Every Blueprint applying GSP is reviewed by a certified Iconik stylist before delivery to ensure recommendations are both analytically sound and practically wearable.",
  },
  {
    q: "How is GSP™ applied in an Iconik Blueprint?",
    a: "During your Blueprint intake, your stylist applies GSP to your measurements and photos to determine your primary silhouette archetype and any hybrid characteristics. The result is a precise styling prescription at the garment level — specific cuts, lengths, silhouettes, and Indian garment categories for your exact profile.",
  },
  {
    q: "Can I do Geometric Silhouette Profiling™ myself?",
    a: "A simplified version is possible with careful measurement and the Iconik body type guide. However, the full GSP assessment — including hybrid profiling and Indian garment prescription — is conducted by a certified Iconik stylist as part of the Style Blueprint. Self-assessment typically misses the hybrid dimension.",
  },
];

export default function GeometricSilhouetteProfilingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "What is Geometric Silhouette Profiling™?",
        "description": "The definitive explanation of Geometric Silhouette Profiling™ — Iconik's proprietary body analysis methodology for Indian women.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/methodology/geometric-silhouette-profiling" },
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
          { "@type": "ListItem", "position": 3, "name": "Geometric Silhouette Profiling™", "item": "https://www.iconik.pro/methodology/geometric-silhouette-profiling" },
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
              <li className="text-gray-800 font-medium">Geometric Silhouette Profiling™</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What is Geometric Silhouette Profiling™?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Geometric Silhouette Profiling™ (GSP) is Iconik&apos;s proprietary body analysis methodology. It maps the proportional geometry of the human frame — shoulder width, bust span, waist-to-hip differential, and limb length — to five primary silhouette archetypes. Unlike traditional body shape quizzes, GSP accounts for both skeletal structure and soft tissue distribution, producing a precise styling prescription rather than a generic category label.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Was Geometric Silhouette Profiling™ Developed?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Standard body type quizzes are self-reported, use a maximum of four categories, and are based entirely on Western silhouette norms. They do not account for Indian women&apos;s average frame structures, the way Indian women carry weight due to genetic and hormonal factors, or the garment categories — sarees, kurtas, salwars, Anarkalis — that Indian women actually wear.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Geometric Silhouette Profiling™ was developed specifically to address this gap. It produces a styling prescription that works for Indian bodies, in Indian garments, for Indian lifestyles.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Geometric Silhouette Profiling™ Work?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              GSP is a five-stage analysis process:
            </p>
            <ol className="space-y-4 text-gray-600 list-decimal list-inside">
              <li><strong>Frame mapping:</strong> Proportional measurement of shoulder span, bust circumference relative to shoulder, waist circumference, hip span, torso length, and limb length.</li>
              <li><strong>Soft tissue assessment:</strong> Identifying where volume is distributed — midsection, hip and thigh zone, bust, upper arm.</li>
              <li><strong>Silhouette classification:</strong> Mapping the measurements to one of five primary archetypes: Apple, Pear, Rectangle, Hourglass, or Inverted Triangle.</li>
              <li><strong>Hybrid profiling:</strong> Many women fall between archetypes. GSP identifies the primary and secondary type and weights the recommendations accordingly. An apple-pear hybrid gets a different prescription than a pure apple.</li>
              <li><strong>Styling prescription:</strong> Garment categories, cuts, silhouettes, and lengths mapped to the exact profile — specifically including Indian ethnic wear categories.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Five Silhouette Archetypes in GSP™?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              GSP identifies five primary archetypes, plus hybrid profiles between them:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Apple:</strong> Midsection-dominant. Waist as wide as or wider than bust and hips. Slimmer legs. Styling goal: elongate torso, create vertical line.</li>
              <li><strong>Pear:</strong> Hip-dominant. Hips notably wider than shoulders. Styling goal: visually broaden upper body to balance lower body.</li>
              <li><strong>Rectangle:</strong> Column silhouette. Shoulders, waist, and hips roughly equal. Styling goal: create waist definition and add visual curve.</li>
              <li><strong>Hourglass:</strong> Bust and hips roughly equal, with a significantly narrower waist. Styling goal: emphasise and celebrate the waist.</li>
              <li><strong>Inverted Triangle:</strong> Shoulder-dominant. Shoulders notably wider than hips. Styling goal: add visual volume at the lower body.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Is GSP™ Different from a Standard Body Shape Quiz?</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-900">Feature</th>
                    <th className="text-left p-3 font-semibold text-gray-900">Standard Quiz</th>
                    <th className="text-left p-3 font-semibold text-gray-900">GSP™</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="p-3 font-medium">Input method</td><td className="p-3">Self-reported</td><td className="p-3">Stylist-assessed</td></tr>
                  <tr><td className="p-3 font-medium">Categories</td><td className="p-3">3–4 categories</td><td className="p-3">5 archetypes + hybrids</td></tr>
                  <tr><td className="p-3 font-medium">Soft tissue</td><td className="p-3">Not assessed</td><td className="p-3">Mapped specifically</td></tr>
                  <tr><td className="p-3 font-medium">Indian garments</td><td className="p-3">Not covered</td><td className="p-3">Full prescription</td></tr>
                  <tr><td className="p-3 font-medium">Output</td><td className="p-3">Generic category tips</td><td className="p-3">Garment-level prescription</td></tr>
                  <tr><td className="p-3 font-medium">Lifestyle context</td><td className="p-3">Western default</td><td className="p-3">Indian lifestyle-specific</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does GSP™ Integrate with Chromatic Harmony Mapping™ and Facial Architecture Analysis™?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              GSP is the structural first pillar of the Iconik Style Blueprint. It defines the body geometry and garment prescription. Chromatic Harmony Mapping™ then layers the colour analysis — identifying which shades within a garment category are most harmonious with the client&apos;s undertone. Facial Architecture Analysis™ adds the face-specific layer — necklines, earring shapes, and hairstyle directions.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Together, the three methodologies produce a three-dimensional styling prescription: what to wear (GSP™), in which colours (CHM™), with which face-framing details (FAA™). Each layer adds specificity that a single-variable approach cannot achieve.
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
              <li>→ <Link href="/methodology/chromatic-harmony-mapping" className="underline hover:opacity-70">What is Chromatic Harmony Mapping™?</Link></li>
              <li>→ <Link href="/methodology/facial-architecture-analysis" className="underline hover:opacity-70">What is Facial Architecture Analysis™?</Link></li>
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Guide</Link></li>
              <li>→ <Link href="/faq" className="underline hover:opacity-70">Frequently Asked Questions</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want GSP™ applied to your body in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint uses all three methodologies — GSP™, CHM™, and FAA™ — to produce a complete, precise styling prescription.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this article:</p>
            <p>Iconik Styling Team. &quot;What is Geometric Silhouette Profiling™?&quot; Iconik LLP, 2025. https://www.iconik.pro/methodology/geometric-silhouette-profiling</p>
          </div>

        </div>
      </main>
    </>
  );
}
