import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Online vs In-Person Styling: Which Is Better for Indian Women? — Iconik",
  description: "Online styling vs in-person personal styling — what each delivers, where each falls short, and which is right for Indian women. An honest comparison.",
  keywords: "online personal stylist India vs in-person, online styling India comparison, personal stylist online India, in-person vs online styling India, best way to get styled India",
  alternates: { canonical: "https://www.iconik.pro/vs/online-vs-inperson-styling" },
  openGraph: {
    title: "Online vs In-Person Styling: Which Is Better for Indian Women? — Iconik",
    description: "An honest comparison of online and in-person personal styling for Indian women — what each delivers and what each cannot.",
    url: "https://www.iconik.pro/vs/online-vs-inperson-styling",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Online vs in-person styling India — Iconik" }],
  },
};

const faqs = [
  {
    q: "Can an online stylist really assess body type accurately?",
    a: "Yes, when the methodology is measurement-based rather than photo-based. Iconik's Geometric Silhouette Profiling™ uses 7 body measurements to calculate proportions — not photographs, which distort perspective. This is more precise than many in-person visual assessments that rely on stylist eye rather than quantified data.",
  },
  {
    q: "What can in-person styling do that online cannot?",
    a: "Touch and fabric assessment: an in-person stylist can feel fabric drape, weight, and texture — variables that matter for final garment selection. They can also see how a garment moves on the body in real time. For bespoke tailoring decisions, in-person assessment provides data an online methodology cannot fully replicate.",
  },
  {
    q: "Is online styling suitable for Indian occasions like weddings?",
    a: "For outfit formulas, colour guidance, and silhouette recommendations — yes. For selecting a specific lehenga or saree where drape and fabric quality are critical — in-person or an in-store appointment is better. Iconik's Style Blueprint gives you the formula (colour, silhouette, fabric category); the shopping or selection can then be done with that precision guide in hand.",
  },
  {
    q: "Why is online styling often cheaper than in-person for equivalent output?",
    a: "In-person styling costs include stylist travel, client meeting time, physical wardrobe review, and often accompanies shopping trips. Online styling eliminates all of these overheads. Iconik's ₹2,499 Style Blueprint delivers output that would cost ₹5,000–20,000 from an equivalent in-person stylist — at a fraction of the cost because the methodology is structured, not ad hoc.",
  },
];

export default function OnlineVsInpersonStylingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Online vs In-Person Styling: Which Is Better for Indian Women?",
        "description": "Honest comparison of online and in-person personal styling for Indian women.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/vs/online-vs-inperson-styling" },
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
          { "@type": "ListItem", "position": 2, "name": "Comparisons", "item": "https://www.iconik.pro/vs" },
          { "@type": "ListItem", "position": 3, "name": "Online vs In-Person Styling", "item": "https://www.iconik.pro/vs/online-vs-inperson-styling" },
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
              <li className="text-gray-800 font-medium">Online vs In-Person Styling</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Online vs In-Person Styling: Which Is Better for Indian Women?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Both online and in-person styling can deliver excellent outcomes. They have different strengths and different limitations. The right choice depends on what you need: body analysis and colour mapping (both deliver this), or real-time physical garment assessment and shopping accompaniment (only in-person delivers this). Here is an honest breakdown.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Does Online Styling Deliver?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A good online styling service delivers the analytical foundation of personal styling: body type identification, proportion assessment, undertone and colour palette analysis, and outfit formula recommendations. When the methodology is structured and measurement-based, online styling can be more precise than in-person visual assessment.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Iconik&apos;s online Style Blueprint delivers three outputs: your Geometric Silhouette Profile (body type and proportion analysis), your Chromatic Harmony Mapping™ palette (10-colour palette based on undertone and contrast), and 16+ outfit formulas for your specific silhouette, lifestyle, and colour profile. The output is a documented reference — not a verbal consultation that you have to remember.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Does In-Person Styling Deliver That Online Cannot?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              In-person styling adds the physical dimension: a stylist can see how a garment drapes on your specific body in real time, feel fabric weight and quality, assess fit at the shoulder and hip with hands-on precision, and make instant adjustments. For:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Bespoke tailoring consultation — in-person is superior</li>
              <li>Shopping trip accompaniment — in-person is required</li>
              <li>Real-time fit assessment — in-person is superior</li>
              <li>Fabric selection for a specific garment — in-person is superior</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              For body analysis, colour mapping, outfit strategy, and wardrobe planning — online methodology that uses measurements rather than photographs is equally precise and often faster.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Direct Comparison: Online vs In-Person Styling</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-3 pr-4 font-semibold text-gray-900 w-1/3">Factor</th>
                    <th className="py-3 pr-4 font-semibold text-gray-900 w-1/3">Online (Iconik)</th>
                    <th className="py-3 font-semibold text-gray-900 w-1/3">In-Person</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr><td className="py-3 pr-4 font-medium">Body type analysis</td><td className="py-3 pr-4">Measurement-based precision</td><td className="py-3">Visual + hands-on</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">Colour analysis</td><td className="py-3 pr-4">Undertone + contrast mapping</td><td className="py-3">Draping + observation</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">Outfit formulas</td><td className="py-3 pr-4">16+ documented formulas</td><td className="py-3">Variable by stylist</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">Physical fit check</td><td className="py-3 pr-4">Not applicable</td><td className="py-3">Real-time</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">Turnaround</td><td className="py-3 pr-4">48 hours</td><td className="py-3">Appointment-dependent</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">Cost range</td><td className="py-3 pr-4">₹2,499</td><td className="py-3">₹5,000–25,000+</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">Location requirement</td><td className="py-3 pr-4">None</td><td className="py-3">Same city</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">Reference document</td><td className="py-3 pr-4">Permanent PDF blueprint</td><td className="py-3">Varies — often verbal</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Should You Choose?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Choose online (Iconik) if:</strong> You want body analysis, colour mapping, and outfit formulas delivered fast, at a fixed price, with a documented output you can reference when shopping.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Choose in-person if:</strong> You need shopping accompaniment, bespoke tailoring consultation, or a stylist who can handle the physical garment selection for a specific occasion with you present.
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
              <li>→ <Link href="/blog/is-personal-stylist-worth-it-india" className="underline hover:opacity-70">Is a Personal Stylist Worth It in India?</Link></li>
              <li>→ <Link href="/vs/style-blueprint-vs-quiz" className="underline hover:opacity-70">Style Blueprint vs Style Quiz — What&apos;s the Difference?</Link></li>
              <li>→ <Link href="/methodology/geometric-silhouette-profiling" className="underline hover:opacity-70">Geometric Silhouette Profiling™ — How It Works</Link></li>
              <li>→ <Link href="/faq" className="underline hover:opacity-70">Frequently Asked Questions</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get the online version — delivered in 48 hours</h2>
            <p className="text-gray-600 mb-6">Body analysis, colour palette, and 16+ outfit formulas. Documented, precise, and available anywhere in India.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Online vs In-Person Styling: Which Is Better for Indian Women?&quot; Iconik LLP, 2025. https://www.iconik.pro/vs/online-vs-inperson-styling</p>
          </div>

        </div>
      </main>
    </>
  );
}
