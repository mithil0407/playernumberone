import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SeoEditorialFooter, SeoEditorialHeader } from "@/components/seo/SeoEditorial";
import { buildArticleMetadata } from "@/lib/seo";
import { bodyTypeLinks } from "@/lib/seoContent";
import { FOUNDERS } from "@/lib/siteFacts";

export const metadata: Metadata = buildArticleMetadata({
  title: "How to Dress for Your Body Type in India",
  description: "A practical, size-inclusive guide to proportion, garment shape and Indian-wear choices using ICONIK's Geometric Silhouette Profiling framework.",
  path: "/body-type-styling",
  datePublished: "2025-01-01",
  dateModified: "2026-07-24",
  authorPath: "/about#jasmine-rana",
  keywords: [
    "how to dress for your body type India",
    "body type styling Indian women",
    "Geometric Silhouette Profiling",
    "body shape guide Indian women",
  ],
});

const silhouettes = [
  {
    name: "Apple",
    href: "/body-type-styling/apple-body-shape-india",
    definition: "An apple silhouette carries more volume in the midsection relative to the shoulders and hips, with slimmer legs and arms.",
    principle: "Elongate the torso, define the waist visually, and draw attention upward and downward away from the midsection.",
    outfits: ["Empire-waist kurtas that skim the stomach", "A-line kurtis with vertical print panels", "Straight-leg trousers with a V-neck blouse"],
  },
  {
    name: "Pear",
    href: "/body-type-styling/pear-body-shape-india",
    definition: "A pear silhouette has narrower shoulders and bust relative to wider hips and thighs.",
    principle: "Balance the upper and lower body by adding visual width to the shoulders and minimising volume at the hips.",
    outfits: ["Boat-neck or off-shoulder tops", "A-line skirts and palazzos", "Flared kurtis with slim-fit pants"],
  },
  {
    name: "Rectangle",
    href: "/body-type-styling/rectangle-body-shape-india",
    definition: "A rectangle silhouette has similar shoulder, waist, and hip measurements with minimal curve differentiation.",
    principle: "Create the illusion of a defined waist by adding curves with fabric, draping, and colour blocking.",
    outfits: ["Peplum kurtis", "Wrap-style blouses with a defined waist tie", "Sarees with a padded or structured blouse"],
  },
  {
    name: "Hourglass",
    href: "/body-type-styling/hourglass",
    definition: "An hourglass silhouette has balanced shoulder and hip width with a significantly narrower waist.",
    principle: "Celebrate the waist definition. The primary risk is clothing that obscures the waist rather than following it.",
    outfits: ["Wrap dresses and wrap-style kurtis", "Sarees with a fitted, waist-defining blouse", "Belted kurtas over straight trousers"],
  },
  {
    name: "Inverted Triangle",
    href: "/body-type-styling/inverted-triangle",
    definition: "An inverted-triangle silhouette has broader shoulders or upper-torso emphasis relative to the hips.",
    principle: "Keep the shoulder line clean and use shape, texture or movement below the waist when you want a more balanced visual line.",
    outfits: ["Clean V-neck kurtas with straight sleeves", "Wide-straight trousers with a simple top", "Sarees with restrained shoulder detail and a fluid lower drape"],
  },
];

const faqs = [
  {
    q: "How do I identify my body type?",
    a: "Compare the width of your shoulders, your waist, and your hips. The proportional relationship between these three zones determines your silhouette category. Iconik's Geometric Silhouette Profiling™ goes further — it accounts for soft tissue distribution and limb length to produce a more precise prescription than a standard body shape quiz.",
  },
  {
    q: "Why doesn't standard Western body type advice work for Indian women?",
    a: "Many popular body-shape guides use Western garment examples—dresses, jeans and blazers—and rarely address kurta length, saree drape, salwar shape or dupatta placement. ICONIK applies familiar proportion concepts to Indian and fusion garment categories without assuming that every person in a category needs the same solution.",
  },
  {
    q: "What is Geometric Silhouette Profiling™?",
    a: "Geometric Silhouette Profiling™ (GSP) is Iconik's proprietary body analysis method. It maps the proportional geometry of the human frame — shoulder width, bust span, waist-to-hip differential, and limb length — to five primary silhouette archetypes. Unlike traditional body shape quizzes, it accounts for both skeletal structure and soft tissue distribution.",
  },
  {
    q: "Can my body type change over time?",
    a: "Proportions and fit needs can change with weight, muscle, age, pregnancy, surgery and other life events. Re-measure and reassess when your existing recommendations stop matching the way garments sit; a category is only a working description, not a permanent identity.",
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
        "headline": "How to Dress for Your Body Type in India",
        "description": "A complete guide to body type styling for Indian women using Geometric Silhouette Profiling™.",
        "author": {
          "@type": "Person",
          "name": FOUNDERS[0].name,
          "jobTitle": FOUNDERS[0].title,
          "sameAs": FOUNDERS[0].linkedIn,
        },
        "reviewedBy": {
          "@type": "Person",
          "name": FOUNDERS[0].name,
          "jobTitle": FOUNDERS[0].title,
          "sameAs": FOUNDERS[0].linkedIn,
        },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" },
        },
        "datePublished": "2025-01-01",
        "dateModified": "2026-07-24",
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
    <div className="seo-editorial min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SeoEditorialHeader />
      <main className="px-4 py-16 md:py-24">
        <div className="seo-classic-article mx-auto max-w-3xl">

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
              How to Dress for Your Body Type in India
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Many body-shape guides stop at dresses and jeans. This practical guide applies proportion and fit decisions to kurtas, sarees, salwars, western wear and fusion wardrobes using <strong>Geometric Silhouette Profiling™</strong>—ICONIK&apos;s proprietary styling framework.
            </p>
            <p className="mt-4 text-sm text-gray-500">Updated 24 July 2026 · Reviewed by Jasmine Rana, Co-Founder and Head Stylist</p>
          </header>

          {/* Section 1 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Generic Body-Type Advice Can Be Hard to Apply
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Standard body type frameworks — apple, pear, rectangle, hourglass — were designed around Western garment categories: jeans, blazers, bodycon dresses. The advice tells you to &quot;balance proportions&quot; but rarely explains what that means when you&apos;re choosing between an Anarkali and a straight-cut kurta, or deciding how to drape a saree.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A broad label also hides meaningful differences in bust, torso length, shoulder line, hip shape and fabric preference. The category should narrow the questions you ask—not dictate what your body is allowed to wear.
            </p>
          </section>

          {/* Section 2 — GSP Definition */}
          <section className="mb-14 rounded-xl bg-gray-50 border border-gray-200 p-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              <Link href="/methodology/geometric-silhouette-profiling" className="underline decoration-gray-300 underline-offset-4">
                What Is Geometric Silhouette Profiling™?
              </Link>
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Geometric Silhouette Profiling™ is ICONIK&apos;s proprietary styling framework. It compares shoulder, bust, waist and hip relationships, torso and limb proportions, and the way garments currently fit. The result is a set of styling options—not a diagnosis or an obligation to make the body look smaller. Read the <Link href="/methodology/geometric-silhouette-profiling" className="font-medium underline">canonical method explanation</Link> for the full process and limitations.
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
                <div key={s.href} className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    <Link href={s.href} className="hover:underline">
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
                    href={s.href}
                    className="mt-4 inline-block text-sm font-semibold text-black underline underline-offset-4 hover:opacity-70"
                  >
                    Full {s.name} styling guide →
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <aside className="mb-14 rounded-xl border border-gray-200 bg-gray-50 p-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Plus size is a size range, not a body shape</h2>
            <p className="text-gray-600 leading-relaxed">
              A plus-size person can have any of the proportional relationships above. Start with fit, comfort and the garment outcome you want, then use the <Link href="/body-type-styling/plus-size" className="font-medium underline">plus-size styling guide</Link> for fabric, structure and sourcing considerations.
            </p>
          </aside>

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
              ICONIK&apos;s <Link href="/methodology/chromatic-harmony-mapping" className="underline font-medium">Chromatic Harmony Mapping™</Link> compares undertone, depth and contrast to create a practical palette for Indian ethnic wear, western wear and occasion dressing. <Link href="/methodology/facial-architecture-analysis" className="underline font-medium">Facial Architecture Analysis™</Link> adds guidance for necklines, eyewear, earrings and hairstyle direction.
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
              Want this done for you within 5 working days after the consultation?
            </h2>
            <p className="text-gray-600 mb-6">
              Your personalised Iconik Style Blueprint — body analysis, colour palette, and 20 outfit formulas.
            </p>
            <Link
              href="/offer-2699"
              className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          {/* Cite block */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Rana, Jasmine. &quot;How to Dress for Your Body Type in India.&quot; ICONIK LLP. Updated 24 July 2026. https://www.iconik.pro/body-type-styling</p>
          </div>

        </div>
      </main>
      <SeoEditorialFooter />
    </div>
  );
}
