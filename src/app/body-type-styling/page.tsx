import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { bodyTypeLinks } from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "How to Dress for Your Body Type in India — Complete Guide",
  description: "The complete scientific guide to body type styling for Indian women. Learn how Geometric Silhouette Profiling™ maps your frame to the exact cuts, silhouettes, and Indian garments that work for your body.",
  keywords: "how to dress for your body type India, body type styling Indian women, geometric silhouette profiling, apple body type India, pear body type India, plus size styling India, body shape guide Indian women",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling" },
  openGraph: {
    title: "How to Dress for Your Body Type in India — Iconik Complete Guide",
    description: "Science-backed body type styling guide for Indian women. Covers all 5 silhouette types with Indian garment recommendations.",
    url: "https://www.iconik.pro/body-type-styling",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Body type styling guide for Indian women — Iconik" }],
  },
};

const silhouettes = [
  {
    name: "Apple",
    slug: "apple",
    definition: "An apple silhouette carries more volume in the midsection relative to the shoulders and hips, with slimmer legs and arms.",
    principle: "Elongate the torso, define the waist visually, and draw attention upward and downward away from the midsection.",
    outfits: ["Empire-waist kurtas that skim the stomach", "A-line kurtis with vertical print panels", "Straight-leg trousers with a V-neck blouse"],
  },
  {
    name: "Pear",
    slug: "pear",
    definition: "A pear silhouette has narrower shoulders and bust relative to wider hips and thighs.",
    principle: "Balance the upper and lower body by adding visual width to the shoulders and minimising volume at the hips.",
    outfits: ["Boat-neck or off-shoulder tops", "A-line skirts and palazzos", "Flared kurtis with slim-fit pants"],
  },
  {
    name: "Rectangle",
    slug: "rectangle",
    definition: "A rectangle silhouette has similar shoulder, waist, and hip measurements with minimal curve differentiation.",
    principle: "Create the illusion of a defined waist by adding curves with fabric, draping, and colour blocking.",
    outfits: ["Peplum kurtis", "Wrap-style blouses with a defined waist tie", "Sarees with a padded or structured blouse"],
  },
  {
    name: "Plus Size",
    slug: "plus-size",
    definition: "Plus-size silhouettes encompass a range of body geometries with fuller proportions across one or more zones of the body.",
    principle: "The goal is never to minimise your body — it is to find the proportions and fabrics that make you feel composed, elegant, and aligned.",
    outfits: ["Anarkali suits with a fitted yoke", "Straight-cut kurtas at tunic length", "Palazzo pants with a structured tunic"],
  },
  {
    name: "Hourglass",
    slug: "hourglass",
    definition: "An hourglass silhouette has balanced shoulder and hip width with a significantly narrower waist.",
    principle: "Celebrate the waist definition. The primary risk is clothing that obscures the waist rather than following it.",
    outfits: ["Wrap dresses and wrap-style kurtis", "Sarees with a fitted, waist-defining blouse", "Belted kurtas over straight trousers"],
  },
];

const faqs = [
  {
    q: "How do I identify my body type?",
    a: "Compare the width of your shoulders, your waist, and your hips. The proportional relationship between these three zones determines your silhouette category. Iconik's Geometric Silhouette Profiling™ goes further — it accounts for soft tissue distribution and limb length to produce a more precise prescription than a standard body shape quiz.",
  },
  {
    q: "Why doesn't standard Western body type advice work for Indian women?",
    a: "Western body type frameworks were developed around Western garment categories — dresses, jeans, blazers. They rarely address kurta lengths, saree draping options, salwar silhouettes, or dupatta placement. Indian women also carry weight differently due to skeletal and soft tissue variation. Iconik's methodology was built specifically around the Indian body and Indian clothing vocabulary.",
  },
  {
    q: "What is Geometric Silhouette Profiling™?",
    a: "Geometric Silhouette Profiling™ (GSP) is Iconik's proprietary body analysis method. It maps the proportional geometry of the human frame — shoulder width, bust span, waist-to-hip differential, and limb length — to five primary silhouette archetypes. Unlike traditional body shape quizzes, it accounts for both skeletal structure and soft tissue distribution.",
  },
  {
    q: "Can my body type change over time?",
    a: "Your skeletal frame is fixed, but your soft tissue distribution changes with weight, age, and life events like pregnancy or menopause. Iconik recommends updating your Blueprint after significant body changes. The styling principles remain the same; the specific recommendations may be refined.",
  },
  {
    q: "Does the Blueprint cover both ethnic and western wear?",
    a: "Yes. Every Iconik Style Blueprint includes outfit recommendations across all wardrobe categories relevant to your lifestyle — ethnic wear, western wear, fusion, and occasion dressing.",
  },
];

export default function BodyTypeStylingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/body-type-styling/#article",
        "headline": "How to Dress for Your Body Type in India: The Complete Scientific Guide",
        "description": "A complete guide to body type styling for Indian women using Geometric Silhouette Profiling™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" },
        },
        "datePublished": "2025-01-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling" },
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
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Body Type Styling</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              How to Dress for Your Body Type in India: The Complete Scientific Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Most body type advice was built for Western wardrobes. It ignores kurta lengths, saree draping, salwar geometry, and the actual proportions of Indian women&apos;s frames. This guide uses <strong>Geometric Silhouette Profiling™</strong> — Iconik&apos;s proprietary methodology — to give you styling principles that actually work in an Indian context.
            </p>
          </header>

          {/* Section 1 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Does Generic Body Type Advice Fail Indian Women?
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Standard body type frameworks — apple, pear, rectangle, hourglass — were designed around Western garment categories: jeans, blazers, bodycon dresses. The advice tells you to &quot;balance proportions&quot; but rarely explains what that means when you&apos;re choosing between an Anarkali and a straight-cut kurta, or deciding how to drape a saree.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Indian women also carry weight in culturally and genetically distinct patterns. A framework that treats all &quot;apple&quot; bodies identically will miss the difference between a woman whose weight sits primarily at the midriff versus one with a fuller bust-to-hip ratio. Geometric Silhouette Profiling™ maps these distinctions precisely.
            </p>
          </section>

          {/* Section 2 — GSP Definition */}
          <section className="mb-14 rounded-xl bg-gray-50 border border-gray-200 p-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              What Is Geometric Silhouette Profiling™?
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Geometric Silhouette Profiling™ is Iconik&apos;s proprietary body analysis method. It maps the proportional geometry of the human frame — shoulder width, bust span, waist-to-hip differential, and limb length — to five primary silhouette archetypes. Unlike traditional body shape quizzes, it accounts for both skeletal structure and soft tissue distribution, producing a precise styling prescription rather than a generic category label.
            </p>
          </section>

          {/* Body type diagram */}
          <div className="mb-14">
            <Image
              src="/body-type-diagram.webp"
              alt="The 5 primary silhouette types: Apple, Pear, Rectangle, Hourglass, Inverted Triangle — Iconik Geometric Silhouette Profiling™"
              width={1200}
              height={500}
              className="w-full rounded-xl"
              priority
            />
          </div>

          {/* Section 3 — 5 Silhouettes */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              The 5 Primary Silhouettes — And How to Dress Each One
            </h2>
            <div className="space-y-8">
              {silhouettes.map((s) => (
                <div key={s.slug} className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    <Link href={`/body-type-styling/${s.slug}`} className="hover:underline">
                      {s.name} Body Type
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-3 leading-relaxed">
                    <strong>Definition:</strong> {s.definition}
                  </p>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    <strong>Core styling principle:</strong> {s.principle}
                  </p>
                  <ul className="space-y-1 text-gray-600 list-disc list-inside">
                    {s.outfits.map((outfit, i) => (
                      <li key={i}>{outfit}</li>
                    ))}
                  </ul>
                  <Link
                    href={`/body-type-styling/${s.slug}`}
                    className="mt-4 inline-block text-sm font-semibold text-black underline underline-offset-4 hover:opacity-70"
                  >
                    Full {s.name} styling guide →
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 — Indian garments */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How Indian Clothing Categories Map to Body Geometry
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              One of the most underserved aspects of styling for Indian women is the intersection of silhouette principles with ethnic garment design. Here is a quick reference:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border border-gray-200 font-semibold">Garment</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Apple</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Pear</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Rectangle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-gray-200">Kurta length</td>
                    <td className="p-3 border border-gray-200">Hip-length or longer, empire cut</td>
                    <td className="p-3 border border-gray-200">Tunic length, A-line</td>
                    <td className="p-3 border border-gray-200">Peplum or belted waist</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Saree draping</td>
                    <td className="p-3 border border-gray-200">Avoid tight pleating at the front; opt for side pleats</td>
                    <td className="p-3 border border-gray-200">Classic Nivi drape; wide pleats</td>
                    <td className="p-3 border border-gray-200">Seedha pallu; structured blouse with padded shoulders</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">Salwar style</td>
                    <td className="p-3 border border-gray-200">Straight-cut, not churidar</td>
                    <td className="p-3 border border-gray-200">Palazzo or flared</td>
                    <td className="p-3 border border-gray-200">Cigarette pants or dhoti</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5 — Colour layer */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Silhouette Alone Is Not Enough: The Colour Layer
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Silhouette analysis tells you <em>which shapes</em> to wear. Colour analysis tells you <em>which shades</em> to wear within those shapes. An outfit built on the right silhouette but in the wrong colour palette will still look off — the complexion will appear sallow, tired, or flat.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Iconik&apos;s <Link href="/colour-analysis" className="underline font-medium">Chromatic Harmony Mapping™</Link> identifies your skin undertone (warm, cool, or neutral) and maps it to a curated palette of 10 exact colours — including shades for Indian ethnic wear, western wear, and occasion dressing. Every Style Blueprint includes both analyses.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">All Body Type Styling Guides</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {bodyTypeLinks
                .filter((link) => link.href !== "/body-type-styling")
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl border border-gray-200 p-5 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-semibold text-gray-900 mb-2">{link.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{link.description}</p>
                  </Link>
                ))}
            </div>
          </section>

          <section className="mb-14 rounded-2xl border border-gray-200 bg-gray-50 p-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Free body and proportion tools
            </h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Use these interactive diagnostics if you want to test your own measurements before reading the deeper guides.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/tools/silhouette-scan" className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors">
                <p className="font-semibold text-gray-900 mb-2">Silhouette Scan</p>
                <p className="text-sm text-gray-600 leading-relaxed">Enter shoulder, bust, waist, and hip measurements to discover your geometric silhouette.</p>
              </Link>
              <Link href="/tools/proportion-code" className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors">
                <p className="font-semibold text-gray-900 mb-2">Proportion Code</p>
                <p className="text-sm text-gray-600 leading-relaxed">Find whether you are long-waisted, balanced, or long-legged, then get rise and tuck rules.</p>
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-14">
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

          {/* CTA */}
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Want this done for you in 48 hours?
            </h2>
            <p className="text-gray-600 mb-6">
              Your personalised Iconik Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations.
            </p>
            <Link
              href="/"
              className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          {/* Cite block */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;How to Dress for Your Body Type in India: The Complete Scientific Guide.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling</p>
          </div>

        </div>
      </main>
    </>
  );
}
