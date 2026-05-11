import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What is Geometric Silhouette Profiling™? (Explained)",
  description: "Geometric Silhouette Profiling™ (GSP) is Iconik's proprietary body analysis methodology. Learn what it is, how it works, and how it produces more precise styling prescriptions than standard body shape quizzes.",
  keywords: "geometric silhouette profiling, what is geometric silhouette profiling, GSP body analysis, Iconik methodology, body type analysis India scientific",
  alternates: { canonical: "https://www.iconik.pro/blog/what-is-geometric-silhouette-profiling" },
  openGraph: {
    title: "What is Geometric Silhouette Profiling™? (Explained) — Iconik",
    description: "The complete definition of Iconik's proprietary body analysis methodology.",
    url: "https://www.iconik.pro/blog/what-is-geometric-silhouette-profiling",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "What is Geometric Silhouette Profiling — Iconik" }],
  },
};

const faqs = [
  {
    q: "Who developed Geometric Silhouette Profiling™?",
    a: "Geometric Silhouette Profiling™ was developed by Iconik, India's scientific personal styling service, founded by Mithil Navalakha in 2024. It is one of three proprietary methodologies that form the Iconik Style Blueprint — alongside Chromatic Harmony Mapping™ and Facial Architecture Analysis™.",
  },
  {
    q: "Is Geometric Silhouette Profiling the same as a body shape quiz?",
    a: "No. Standard body shape quizzes rely on self-reported measurements and assign a broad category (apple, pear, rectangle, etc.) based on simple ratios. Geometric Silhouette Profiling™ maps the proportional geometry of the entire frame — shoulder width, bust span, waist-to-hip differential, and limb length — to five primary silhouette archetypes, accounting for both skeletal structure and soft tissue distribution. The result is a more precise, actionable prescription.",
  },
  {
    q: "How is Geometric Silhouette Profiling™ used in the Iconik Style Blueprint?",
    a: "GSP is the first of three analyses in the Iconik Style Blueprint. It produces your primary silhouette profile — which includes your archetype, the styling principles specific to your frame geometry, and the garment categories and cuts that create the most harmonious proportional result. This analysis is then layered with Chromatic Harmony Mapping™ (colour) and Facial Architecture Analysis™ (face shape) to produce the full Blueprint.",
  },
  {
    q: "Can Geometric Silhouette Profiling™ be used for plus-size bodies?",
    a: "Yes. GSP maps the proportional geometry of any frame regardless of size. Plus-size bodies can exhibit apple, pear, rectangle, hourglass, or inverted triangle geometry — the same five archetypes apply at any size. The styling prescriptions are adapted for fuller proportions, but the geometric logic is the same.",
  },
];

export default function GSPBlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "What is Geometric Silhouette Profiling™?",
        "description": "Geometric Silhouette Profiling™ (GSP) is Iconik's proprietary body analysis methodology. A complete explanation of what it is, how it works, and how it differs from standard body shape quizzes.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/blog/what-is-geometric-silhouette-profiling" },
      },
      {
        "@type": "HowTo",
        "name": "How Geometric Silhouette Profiling Works",
        "description": "A step-by-step explanation of Iconik's Geometric Silhouette Profiling™ methodology",
        "step": [
          { "@type": "HowToStep", "name": "Frame measurement", "text": "The proportional measurements of the frame are assessed — shoulder width, bust span, waist circumference, hip width, and limb length." },
          { "@type": "HowToStep", "name": "Soft tissue mapping", "text": "Soft tissue distribution (where volume sits in the body) is assessed to distinguish between skeletal geometry and body composition effects." },
          { "@type": "HowToStep", "name": "Archetype assignment", "text": "The frame geometry is mapped to one of five primary silhouette archetypes: Apple, Pear, Rectangle, Hourglass, or Inverted Triangle." },
          { "@type": "HowToStep", "name": "Prescription generation", "text": "A styling prescription is generated covering garment cuts, silhouette categories, and specific Indian garment recommendations for the identified archetype." },
        ],
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
          { "@type": "ListItem", "position": 3, "name": "What is Geometric Silhouette Profiling™?", "item": "https://www.iconik.pro/blog/what-is-geometric-silhouette-profiling" },
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
              <li className="text-gray-800 font-medium">What is Geometric Silhouette Profiling™?</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What is Geometric Silhouette Profiling™?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              <strong>Geometric Silhouette Profiling™ (GSP) is a body analysis methodology developed by Iconik that maps the proportional frame geometry of the human body to five primary silhouette archetypes, producing precise styling prescriptions.</strong> Unlike standard body shape quizzes, GSP accounts for both skeletal structure and soft tissue distribution to generate actionable recommendations rather than broad category labels.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              The Full Definition of Geometric Silhouette Profiling™
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Geometric Silhouette Profiling™ is Iconik&apos;s proprietary body analysis method. It maps the proportional geometry of the human frame — shoulder width, bust span, waist-to-hip differential, and limb length — to five primary silhouette archetypes: Apple, Pear, Rectangle, Hourglass, and Inverted Triangle.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Unlike traditional body shape quizzes that rely on self-reported measurements and assign a single broad category, GSP analyses the structural relationship between frame zones and soft tissue distribution. This produces a more precise prescription — not &quot;you are a pear,&quot; but &quot;your hip-to-shoulder differential is significant, your waist definition is moderate, and your thighs carry proportionally more volume than your hips, which means these specific cuts work for these specific reasons.&quot;
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How Does Geometric Silhouette Profiling Work?
            </h2>
            <ol className="space-y-4 text-gray-600 list-decimal list-inside">
              <li><strong>Frame measurement</strong> — proportional measurements of shoulder width, bust span, waist circumference, hip width, and limb length are assessed</li>
              <li><strong>Soft tissue mapping</strong> — where volume sits in the body is assessed to distinguish between skeletal geometry and body composition effects</li>
              <li><strong>Archetype assignment</strong> — the frame geometry is mapped to one of five primary silhouette archetypes</li>
              <li><strong>Prescription generation</strong> — a styling prescription is produced covering garment cuts, silhouette categories, and specific Indian garment recommendations</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">
              GSP vs Standard Body Type Quizzes
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border border-gray-200 font-semibold">Feature</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Geometric Silhouette Profiling™</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Standard Body Shape Quiz</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-gray-200">Soft tissue analysis</td>
                    <td className="p-3 border border-gray-200">✅ Included</td>
                    <td className="p-3 border border-gray-200">❌ Not included</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Indian garment recommendations</td>
                    <td className="p-3 border border-gray-200">✅ Yes — kurtas, sarees, salwar included</td>
                    <td className="p-3 border border-gray-200">❌ Western only</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">Human stylist review</td>
                    <td className="p-3 border border-gray-200">✅ Every analysis reviewed</td>
                    <td className="p-3 border border-gray-200">❌ Automated</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Output precision</td>
                    <td className="p-3 border border-gray-200">Specific cuts, garments, reasons</td>
                    <td className="p-3 border border-gray-200">Broad category only</td>
                  </tr>
                </tbody>
              </table>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get your GSP analysis in 48 hours</h2>
            <p className="text-gray-600 mb-6">Geometric Silhouette Profiling™ is included in every Iconik Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this article:</p>
            <p>Iconik Styling Team. &quot;What is Geometric Silhouette Profiling™?&quot; Iconik LLP, 2025. https://www.iconik.pro/blog/what-is-geometric-silhouette-profiling</p>
          </div>
        </div>
      </main>
    </>
  );
}
