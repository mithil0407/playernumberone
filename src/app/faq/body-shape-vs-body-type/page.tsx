import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Body Shape vs Body Type: What's the Difference? — Iconik",
  description: "What is the difference between body shape and body type? Are they the same thing? How each term is used in fashion and styling, and which framework produces more useful dressing guidance.",
  keywords: "body shape vs body type difference, what is body type vs body shape, body type vs body shape India, body shape body type same thing, difference body shape body type fashion",
  alternates: { canonical: "https://www.iconik.pro/faq/body-shape-vs-body-type" },
  openGraph: {
    title: "Body Shape vs Body Type: What's the Difference? — Iconik",
    description: "The difference between body shape and body type — and which produces more useful dressing guidance for Indian women.",
    url: "https://www.iconik.pro/faq/body-shape-vs-body-type",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Body shape vs body type India — Iconik" }],
  },
};

export default function BodyShapeVsBodyTypePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is the difference between body shape and body type?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "In most fashion contexts, 'body shape' and 'body type' are used interchangeably to refer to the same proportional classification (apple, pear, rectangle, hourglass, inverted triangle). However, some frameworks distinguish them: 'body shape' refers to the 2D visual silhouette (the outline of the body); 'body type' is a broader classification that may include additional variables like limb proportion, torso length, and posture. Iconik's Geometric Silhouette Profiling™ uses the term 'silhouette profile' to encompass all of these variables.",
            },
          },
          {
            "@type": "Question",
            "name": "Which is more useful for dressing — body shape or body type?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The most useful framework is one that includes both the 2D silhouette (shoulder vs hip ratio, waist definition) and proportional variables like torso length and limb proportion. Knowing you are a 'pear shape' helps with the shoulder-hip balance principle; knowing you also have a short torso adds another layer of guidance about waistline placement. The more variables included, the more precise the styling formula.",
            },
          },
          {
            "@type": "Question",
            "name": "Is the 5 body type (apple/pear/rectangle/hourglass/inverted triangle) model accurate for Indian women?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The 5-category model is a useful starting framework but is simplified. Many Indian women fall into hybrid categories — for example, a 'banana-pear' (rectangle proportions but with more hip than shoulder) or an 'apple-pear' (fuller both above and below the waist). Iconik's GSP™ accounts for these hybrid profiles using measurement ratios rather than forcing women into one of five fixed categories, which produces more accurate styling formulas for women who don't fit cleanly into a single category.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://www.iconik.pro/faq" },
          { "@type": "ListItem", "position": 3, "name": "Body Shape vs Body Type", "item": "https://www.iconik.pro/faq/body-shape-vs-body-type" },
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
              <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Body Shape vs Body Type</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Body Shape vs Body Type: What&apos;s the Difference?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              In most fashion contexts, &quot;body shape&quot; and &quot;body type&quot; mean the same thing. But there is a useful distinction: body shape describes the 2D visual silhouette; body type is a broader classification that includes proportion variables beyond the basic silhouette. Here is the distinction and why it matters for dressing.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How &quot;Body Shape&quot; and &quot;Body Type&quot; Are Usually Used</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              In everyday fashion usage, both terms refer to the proportional classification system: apple, pear, rectangle, hourglass, and inverted triangle. This system uses the ratio of shoulder width to hip width and the presence or absence of waist definition to categorise body proportions.
            </p>
            <p className="text-gray-600 leading-relaxed">
              This is a useful starting framework. Its limitation: it describes the body from a single angle (front-facing) and captures only three measurements (shoulder, waist, hip). It misses torso-to-leg proportion, arm length relative to torso, height distribution, and the many hybrid profiles that do not fit cleanly into one of five categories.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Geometric Silhouette Profiling™ Adds</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Iconik&apos;s GSP™ uses 7 measurements to produce a more complete proportional profile. Beyond the standard three:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Torso length:</strong> Determines whether short-torso or long-torso styling rules apply</li>
              <li><strong>Hip position:</strong> High hip vs full hip — affects where trousers and skirts sit on the body</li>
              <li><strong>Shoulder-to-bust ratio:</strong> Determines blouse and neckline guidance beyond just the shoulder width</li>
              <li><strong>Overall height:</strong> Affects garment length recommendations</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              This produces a silhouette profile that includes both the primary type (e.g., pear) and any modifying characteristics (e.g., short torso, high hip) — giving a more complete dressing formula.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Indian Women Often Fall Into Hybrid Categories</h2>
            <p className="text-gray-600 leading-relaxed">
              Indian women commonly have hip proportions that combine features of multiple standard categories — for example, a narrower high hip and wider full hip produces measurements that may classify as rectangle at one level and pear at another. A methodology that uses only three measurements and forces women into one of five categories will misclassify hybrid profiles. Measurement-based proportional analysis avoids this by operating on ratios rather than categories.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Hub</Link></li>
              <li>→ <Link href="/methodology/geometric-silhouette-profiling" className="underline hover:opacity-70">Geometric Silhouette Profiling™</Link></li>
              <li>→ <Link href="/faq/most-common-body-type-india" className="underline hover:opacity-70">Most Common Body Type in India</Link></li>
              <li>→ <Link href="/faq" className="underline hover:opacity-70">All FAQs</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get your precise silhouette profile</h2>
            <p className="text-gray-600 mb-6">GSP™ uses 7 measurements to build a complete proportional profile — including hybrid classifications that standard body type quizzes miss.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
