import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Much Does a Personal Stylist Cost in India? — Iconik",
  description: "Personal stylist costs in India range from ₹1,500 to ₹1,00,000+ depending on the service. Online style blueprints, in-person consultations, wardrobe audits, and personal shopping — costs compared.",
  keywords: "personal stylist cost India, how much does personal stylist cost India, personal styling price India, wardrobe consultation cost India, online personal stylist India price, style consultation fees India",
  alternates: { canonical: "https://www.iconik.pro/faq/how-much-does-personal-stylist-cost-india" },
  openGraph: {
    title: "How Much Does a Personal Stylist Cost in India? — Iconik",
    description: "Personal stylist costs in India — online blueprints, in-person consultations, wardrobe audits, and personal shopping. All price ranges compared.",
    url: "https://www.iconik.pro/faq/how-much-does-personal-stylist-cost-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist cost India — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How Much Does a Personal Stylist Cost in India? — Iconik",
    description: "Personal stylist costs in India — online blueprints, in-person consultations, wardrobe audits, and personal shopping. All price ranges compared.",
    images: ["/og-image.webp"],
  },
};

const serviceTypes = [
  {
    type: "Online Style Blueprint",
    range: "₹1,500 – ₹5,000",
    what: "A digital analysis covering body type, colour palette, and outfit recommendations. Delivered remotely, typically within 24–72 hours. No in-person sessions required.",
    bestFor: "Women who want a science-backed foundation for their wardrobe without in-person scheduling constraints.",
    iconik: true,
  },
  {
    type: "In-Person Style Consultation",
    range: "₹3,000 – ₹15,000 per session",
    what: "A one-on-one session with a stylist, typically 1–3 hours. May include body type analysis, colour draping, and outfit direction. Quality and depth vary significantly by stylist.",
    bestFor: "Women who prefer face-to-face guidance and live in cities with access to experienced independent stylists.",
    iconik: false,
  },
  {
    type: "Wardrobe Audit",
    range: "₹8,000 – ₹40,000",
    what: "An in-home or in-store session where a stylist reviews your existing wardrobe, removes items that don't work, and identifies gaps. Typically 3–5 hours including travel.",
    bestFor: "Women who want to rationalise an existing wardrobe rather than build a new one from a framework.",
    iconik: false,
  },
  {
    type: "Personal Shopping",
    range: "₹10,000 – ₹1,00,000+",
    what: "The stylist shops with or for you — either accompanying you in-store or curating selections online. Cost depends on whether the stylist charges a flat fee, hourly rate, or percentage of the shopping spend.",
    bestFor: "Women who want someone else to manage the shopping process entirely, or who are preparing for a specific occasion.",
    iconik: false,
  },
  {
    type: "Monthly Styling Retainer",
    range: "₹5,000 – ₹30,000/month",
    what: "Ongoing access to a stylist for outfit reviews, shopping guidance, and seasonal wardrobe updates. Typically includes a set number of sessions or response hours per month.",
    bestFor: "Women in high-visibility professional roles or who want continuous styling support rather than a one-time analysis.",
    iconik: false,
  },
];

export default function PersonalStylistCostIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How much does a personal stylist cost in India?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Personal stylist costs in India range from ₹1,500 for an online style blueprint to ₹1,00,000+ for personal shopping or a monthly retainer. The main service types and their price ranges: Online style blueprint: ₹1,500–₹5,000. In-person consultation: ₹3,000–₹15,000 per session. Wardrobe audit: ₹8,000–₹40,000. Personal shopping: ₹10,000–₹1,00,000+. Monthly retainer: ₹5,000–₹30,000/month.",
            },
          },
          {
            "@type": "Question",
            "name": "Is ₹2,499 a reasonable price for a personal stylist in India?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes — ₹2,499 is at the lower end of the online style blueprint category (₹1,500–₹5,000). For that price, a comprehensive online blueprint like Iconik's covers body type analysis, colour palette, and 16+ outfit recommendations including Indian ethnic wear. An equivalent in-person consultation covering the same depth would typically cost ₹5,000–₹12,000.",
            },
          },
          {
            "@type": "Question",
            "name": "What is included in an online style blueprint?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "An online style blueprint typically covers: body type identification (using measurements or photos), colour palette based on undertone analysis, outfit formulas for your specific shape and colouring, and shopping guidance for building your wardrobe. Iconik's Style Blueprint specifically includes Geometric Silhouette Profiling™ for body type, Chromatic Harmony Mapping™ for colour palette (calibrated for Indian skin), 16+ outfit recommendations including Indian ethnic wear, and jewellery and accessory guidance.",
            },
          },
          {
            "@type": "Question",
            "name": "Is an online stylist as good as an in-person stylist?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For the foundational analysis — body type and colour palette — an online style blueprint using measurements and photos can be as accurate as in-person work, or more so. In-person colour draping (holding fabric swatches to the face) is a reliable colour analysis method, but it requires a trained stylist and cannot scale. Measurement-based body type analysis, as used in Iconik's Geometric Silhouette Profiling™, is more precise than visual in-person assessment because it eliminates the stylist's subjective perception of proportion. Where in-person styling has a real advantage is in personal shopping accompaniment and live outfit review.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://www.iconik.pro/faq" },
          { "@type": "ListItem", "position": 3, "name": "Personal Stylist Cost India", "item": "https://www.iconik.pro/faq/how-much-does-personal-stylist-cost-india" },
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
              <li className="text-gray-800 font-medium">Personal Stylist Cost India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              How Much Does a Personal Stylist Cost in India?
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Personal styling in India spans a wide price range — from ₹1,500 for an online style blueprint to ₹1,00,000+ for personal shopping and ongoing retainers. The right service depends on what you actually need. This guide breaks down every service type, its typical cost, and what you get for the money.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Styling Services and Costs in India</h2>
            <div className="space-y-5">
              {serviceTypes.map((s) => (
                <div key={s.type} className={`border rounded-xl p-5 ${s.iconik ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="font-semibold text-gray-900">{s.type}</p>
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{s.range}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 leading-relaxed">{s.what}</p>
                  <p className="text-sm text-gray-500"><span className="font-medium text-gray-700">Best for:</span> {s.bestFor}</p>
                  {s.iconik && (
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">Iconik&apos;s Style Blueprint is in this category — at ₹2,499, it covers body type, colour palette, and 16+ outfit recommendations including ethnic wear.</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Determines the Price?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Service format:</strong> Online services are lower cost than in-person due to lower overhead and no travel time. This is not a quality signal — measurement-based online analysis can be more precise than visual in-person assessment.</li>
              <li><strong>Depth of analysis:</strong> A full methodology-based analysis (body type + colour + outfit formulas) costs more than a single-focus consultation (colour draping only, or wardrobe edit only).</li>
              <li><strong>Stylist experience and demand:</strong> Senior stylists with a track record and waitlist charge more. Newer stylists may charge less but offer comparable quality for analysis-based work.</li>
              <li><strong>City:</strong> In-person stylists in Mumbai and Delhi tend to charge more than those in Tier 2 cities, reflecting higher operating costs.</li>
              <li><strong>Inclusions:</strong> Services that include shopping accompaniment or ongoing availability cost significantly more than one-time analysis and recommendations.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Service Type Is Right for You?</h2>
            <div className="space-y-3">
              {[
                { situation: "You want to understand your body type and colours from scratch", recommendation: "Online style blueprint — it gives you the foundational framework at the lowest cost" },
                { situation: "You have a full wardrobe and want to know what to keep and what to remove", recommendation: "Wardrobe audit — a stylist reviews what you have in person" },
                { situation: "You are preparing for a major event or season", recommendation: "Personal shopping or a one-time in-person consultation" },
                { situation: "You are in a high-visibility role and need ongoing support", recommendation: "Monthly retainer" },
                { situation: "You want maximum value for a complete framework — body, colour, outfits", recommendation: "Iconik's Style Blueprint — covers all three at ₹2,499" },
              ].map((item) => (
                <div key={item.situation} className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{item.situation}</p>
                  <p className="text-sm text-gray-600">→ {item.recommendation}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/blog/is-personal-stylist-worth-it-india" className="underline hover:opacity-70">Is a Personal Stylist Worth It in India?</Link></li>
              <li>→ <Link href="/vs/online-vs-inperson-styling" className="underline hover:opacity-70">Online vs In-Person Styling — What&apos;s the Difference?</Link></li>
              <li>→ <Link href="/faq/what-is-iconik-style-blueprint" className="underline hover:opacity-70">What Is the Iconik Style Blueprint?</Link></li>
              <li>→ <Link href="/faq" className="underline hover:opacity-70">All FAQ</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Complete body + colour + outfit analysis — ₹2,499</h2>
            <p className="text-gray-600 mb-6">Iconik&apos;s Style Blueprint covers everything: Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and 16+ personalised outfit recommendations including Indian ethnic wear. Delivered in 48 hours.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
