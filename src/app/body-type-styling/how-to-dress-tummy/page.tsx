import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Dress if You Have a Tummy: The Science (Not the Rules) — Iconik",
  description: "Science-backed guide to dressing a tummy for Indian women. Which cuts elongate the torso, which fabrics to avoid, and how Geometric Silhouette Profiling™ handles midsection styling.",
  keywords: "how to dress if you have a tummy India, clothes to hide tummy fat Indian women, what to wear with a tummy India, tummy styling tips Indian women, hide belly fat with clothing India",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/how-to-dress-tummy" },
  openGraph: {
    title: "How to Dress if You Have a Tummy: The Science (Not the Rules) — Iconik",
    description: "The geometry of dressing a tummy — which cuts, fabrics, and Indian garments actually work and why.",
    url: "https://www.iconik.pro/body-type-styling/how-to-dress-tummy",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Tummy styling guide for Indian women — Iconik" }],
  },
};

const faqs = [
  {
    q: "Should I always wear dark colours to hide my tummy?",
    a: "No. Dark colours at the midsection help by creating visual recession, but restricting yourself to black and navy misses the opportunity to use your full colour palette. The cut matters more than the colour. A well-cut garment in a bright undertone-matched colour looks better than a poorly cut garment in black.",
  },
  {
    q: "Does Spanx or shapewear fix the problem?",
    a: "Shapewear can help for one-off occasions, but it does not address the root styling problem: the wrong cut. A garment with the right silhouette flatters without compression. Shapewear under a wrong-cut garment still produces a wrong-cut garment.",
  },
  {
    q: "What is the best kurta length for hiding a tummy?",
    a: "Hip-length — covering the full hip and ending at the widest point of the hip or just below. Too short cuts the torso at its widest point. Too long can visually shorten the legs. Hip-length is the sweet spot that creates a clean vertical line from shoulder to hem.",
  },
  {
    q: "Can the Iconik Blueprint help with tummy-specific styling?",
    a: "Yes. Geometric Silhouette Profiling™ identifies your precise silhouette category — including midsection-forward profiles like Apple or Rectangle with abdominal weight — and produces garment-level recommendations specific to your body, not a generic body type category.",
  },
];

export default function HowToDressTummyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "How to Dress if You Have a Tummy: The Science (Not the Rules)",
        "description": "Science-backed guide to midsection styling for Indian women using Geometric Silhouette Profiling™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/how-to-dress-tummy" },
      },
      {
        "@type": "HowTo",
        "name": "How to Dress if You Have a Tummy",
        "description": "A science-based approach to midsection styling for Indian women",
        "step": [
          { "@type": "HowToStep", "name": "Identify your silhouette", "text": "Determine whether your midsection weight puts you in the Apple category or another midsection-forward silhouette using Geometric Silhouette Profiling™." },
          { "@type": "HowToStep", "name": "Choose cuts that create vertical lines", "text": "Select empire waists, A-line silhouettes, and straight-cut garments that skim rather than cling. The goal is an unbroken vertical line from shoulder to hem." },
          { "@type": "HowToStep", "name": "Select the right Indian garments", "text": "Anarkali suits with a fitted yoke, straight-cut hip-length kurtas, and sarees with side-pleat draping all create the right visual geometry for the midsection." },
          { "@type": "HowToStep", "name": "Apply colour strategy", "text": "Use darker shades from your Chromatic Harmony Mapping™ palette at the midsection zone. Avoid bold horizontal prints at the waist." },
        ],
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
          { "@type": "ListItem", "position": 3, "name": "How to Dress if You Have a Tummy", "item": "https://www.iconik.pro/body-type-styling/how-to-dress-tummy" },
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
              <li className="text-gray-800 font-medium">How to Dress if You Have a Tummy</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              How to Dress if You Have a Tummy: The Science (Not the Rules)
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              The standard advice — wear dark colours and avoid tight clothes — is incomplete. Dressing a tummy well is a geometry problem: you need to redirect visual attention, create vertical lines, and choose fabrics that skim without clinging. Here is the science behind why certain cuts work, not just a list of what works.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Does Generic Advice Fail Indian Women With a Tummy?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Western styling advice assumes Western garment shapes. Kurtas, Anarkalis, sarees, and churidars each behave differently on a midsection — and each requires its own specific formula. A rule that works for a fitted Western blouse does not transfer directly to a kurta.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Additionally, Indian women have a wider range of torso-to-hip proportions than Western sizing systems assume. An apple-shaped Indian woman may have a more pronounced midsection relative to her hips than a Western apple shape — and needs a more precise approach, not a generic one.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Cuts Actually Create a Slimmer Midsection?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The core principle is the <strong>vertical line</strong>. Any cut that creates an unbroken vertical line from shoulder to hem elongates the torso and redirects the eye downward rather than outward. Empire waistlines, A-line flares, and straight-cut garments all achieve this.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The mechanism: when a garment defines the waist at its widest point (midsection), the eye is drawn directly to that measurement. When the garment skims past it in a vertical line, the eye follows the line instead of stopping at the circumference.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The fabric principle: semi-structured fabric that holds its shape without clinging — &quot;float, don&apos;t cling&quot; — is the sweet spot. Crepe, georgette, and cotton-linen blends all achieve this. Jersey and spandex cling to every contour.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Indian Ethnic Wear Works Best for a Tummy?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Anarkali suits</strong> are the single best Indian garment for midsection styling. The fitted yoke defines the upper body, and the flared skirt falls from the hip — bypassing the midsection entirely without adding volume to it. The floor-length cut creates maximum vertical elongation.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Straight-cut kurtas at hip length</strong> work well over straight-leg or cigarette trousers. The key: the kurta must end at or just below the widest point of the hip, not above it. A kurta that ends at the midsection cuts the silhouette at exactly the wrong point.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Anarkali suits — fitted yoke, full flare from hip</li>
              <li>Straight-cut kurtas at hip length over cigarette trousers</li>
              <li>Palazzo sets — loose palazzo + flowing top creates vertical line</li>
              <li>Sarees with side-pleat draping (not tight Nivi front-pleat style)</li>
              <li>Floor-length kaftans for casual occasions</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Short kurtis (ending at the midsection), salwar kameez with horizontal embellishment at the waist, churidars with a cropped kurti, gathered skirts tied at the natural waist.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Western Wear Works for a Tummy in Indian Contexts?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Wide-leg trousers</strong> with a structured blazer create excellent elongation. The blazer&apos;s vertical line from shoulder to hip, combined with the straight fall of wide-leg trousers, creates an unbroken column silhouette.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Wide-leg or straight-leg trousers with a structured blazer</li>
              <li>Wrap blouses that cross under the bust (empire-adjacent)</li>
              <li>Shift dresses in structured fabric (not jersey)</li>
              <li>V-neck or high-neck tops — both create upward focal points</li>
              <li>A-line midi skirts with a tucked-in fitted top</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Cropped jackets, bodycon dresses, high-waisted pencil skirts that sit at the midsection, any garment with horizontal design details at the waist zone.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Fabrics Work and Which Ones Make It Worse?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Work well:</strong> Crepe (structured, holds shape, wrinkle-resistant). Georgette (flowing, doesn&apos;t cling). Cotton-linen blends (breathable, semi-structured). Dupion silk (stiff enough to hold a clean line). Viscose (soft drape without cling).
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Jersey (clings to every contour). Spandex blends (same issue). Sheer fabrics without an opaque underlayer (worse than nothing). Very stiff fabrics like heavy raw khadi (can add visual bulk without draping away from the body).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Should You Use Colour and Print Around the Midsection?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Within your undertone palette from Chromatic Harmony Mapping™, apply darker or more muted shades to garments covering the midsection. Darker colours create visual recession — the midsection appears to recede rather than advance. Lighter and brighter shades on the upper chest and lower body draw the eye away from the centre.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Large horizontal prints at the waist. Oversized florals across the midsection. Metallic fabrics at the belly. Bold colour-blocking with the contrast line at the waistline — this draws the eye directly to the measurement you are trying to redirect from.
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
              <li>→ <Link href="/body-type-styling/apple-body-shape-india" className="underline hover:opacity-70">Apple Body Shape: Complete Indian Women&apos;s Guide</Link></li>
              <li>→ <Link href="/body-type-styling/heavy-arms-styling" className="underline hover:opacity-70">Heavy Arms Styling Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations specific to your silhouette.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;How to Dress if You Have a Tummy: The Science (Not the Rules).&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/how-to-dress-tummy</p>
          </div>

        </div>
      </main>
    </>
  );
}
