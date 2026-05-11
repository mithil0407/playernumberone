import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Modest Fashion That Doesn't Look Boring: The Indian Professional — Iconik",
  description: "How to dress modestly for Indian professional environments without sacrificing style. Coverage-first formulas for corporate, startup, and traditional workplaces — ethnic and western.",
  keywords: "modest professional fashion India, modest work clothes Indian women, covered office wear India, conservative dress code India, modest corporate fashion Indian women",
  alternates: { canonical: "https://www.iconik.pro/style-guides/modest-professional-fashion-india" },
  openGraph: {
    title: "Modest Fashion That Doesn't Look Boring: The Indian Professional — Iconik",
    description: "Coverage-first office formulas for Indian professional women — ethnic and western wear that is both modest and authoritative.",
    url: "https://www.iconik.pro/style-guides/modest-professional-fashion-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Modest professional fashion India — Iconik" }],
  },
};

const faqs = [
  {
    q: "Can modest dressing still look authoritative in a corporate environment?",
    a: "Yes — and often more so. Modesty in Indian corporate culture is associated with seniority and self-possession. A well-fitted straight kurta with a structured dupatta, or a full-sleeve blouse with tailored trousers, reads as deliberate and controlled rather than understated. The key variable is fit: a modest outfit that fits well commands more authority than a revealing outfit that fits badly.",
  },
  {
    q: "What is the most modest Indian professional outfit for a formal meeting?",
    a: "A straight-cut Anarkali in a jewel tone (deep teal, burgundy, navy) with a matching churidar. The full coverage, structured silhouette, and jewel-tone palette create an impression of authority and seniority. In western wear, a full-sleeve structured blouse with wide-leg trousers and a blazer achieves the same effect.",
  },
  {
    q: "How do I add full sleeve coverage without overheating in Indian summers?",
    a: "Fabric choice solves this. Lightweight cotton-linen blends, crepe, and cotton voile provide full sleeve coverage without trapping heat. A three-quarter sleeve in a structured fabric with a contrasting dupatta is a practical alternative to a full sleeve for transitional weather. Avoid polyester or thick ponte — they do not breathe.",
  },
  {
    q: "How should I style a dupatta professionally?",
    a: "The most professional dupatta draping styles: over one shoulder with the tail pinned or tucked at the back (no dangling fabric that can catch on things); draped symmetrically over both shoulders and pinned at the centre; worn as a stole over a structured top. Avoid the traditional free-flowing dupatta for active work environments — it creates a trip hazard and requires constant adjustment.",
  },
];

export default function ModestProfessionalFashionPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Modest Fashion That Doesn't Look Boring: The Indian Professional",
        "description": "Coverage-first professional style guide for Indian women — modest dressing that maintains authority.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/modest-professional-fashion-india" },
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
          { "@type": "ListItem", "position": 2, "name": "Style Guides", "item": "https://www.iconik.pro/style-guides" },
          { "@type": "ListItem", "position": 3, "name": "Modest Professional Fashion India", "item": "https://www.iconik.pro/style-guides/modest-professional-fashion-india" },
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
              <li><Link href="/style-guides" className="hover:underline">Style Guides</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Modest Professional Fashion India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Modest Fashion That Doesn&apos;t Look Boring: The Indian Professional
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Modest professional dressing is not a constraint — it is a design challenge with excellent solutions. Indian garment traditions are built around coverage-first aesthetics, and the most authoritative professional outfits in Indian culture are also the most modest. This guide gives you coverage-first formulas that project confidence, authority, and style simultaneously.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Does Modest Dressing Often Look Frumpy — And How Do You Fix It?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The frumpy problem in modest dressing comes from one source: oversizing. When women add coverage by going up in size — a larger kurta to cover the arms, a longer tunic to hide the hips — the garment loses its shape. A garment without shape looks careless, not modest.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The solution is coverage through design, not through size. A well-fitted full-sleeve blouse provides the same arm coverage as an oversized tunic — but projects completely different levels of authority. Your size stays the same; the design feature (full sleeve, high neckline, longer hem) provides the coverage.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Modest Indian Ethnic Professional Outfits?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Indian ethnic wear provides the most naturally modest professional wardrobe of any garment category. The strongest coverage-first formulas:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Straight-cut churidar kameez:</strong> The churidar provides full leg coverage; the kameez covers the torso. In crepe or cotton-linen, this is the single most versatile modest professional outfit.</li>
              <li><strong>Anarkali suits:</strong> Full arm and leg coverage, structured silhouette, formal enough for any meeting level. The most authoritative modest Indian office garment.</li>
              <li><strong>Palazzo kameez sets:</strong> Wide palazzo provides full leg coverage; pairs well with a straight or A-line kameez. Cooler than churidars in summer.</li>
              <li><strong>Sarees with full-sleeve blouse:</strong> A saree with a full-sleeve blouse in the same or tonal colour is the most formal modest professional outfit available.</li>
              <li><strong>Patiala salwar with structured kameez:</strong> Traditional full coverage with volume in the salwar — visually interesting without compromising coverage.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Modest Western Professional Outfits for Indian Women?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Full-sleeve structured blouse + wide-leg trousers:</strong> Classic modest western professional. The sleeve and trouser provide full arm and leg coverage; a blazer adds an additional layer.</li>
              <li><strong>Midi dress (full-sleeve or 3/4 sleeve):</strong> A full-coverage dress in ponte or structured crepe is both modest and completely professional. Knee-to-ankle length is appropriate for any Indian corporate context.</li>
              <li><strong>Shirt dress:</strong> A button-through shirt dress in cotton-linen or structured viscose — full arm and leg coverage, professional silhouette.</li>
              <li><strong>Blazer + matching straight-leg trousers + turtleneck:</strong> Maximum coverage, maximum authority. Turtleneck replaces the need for a neckline decision entirely.</li>
              <li><strong>3/4 sleeve blouse + A-line midi skirt:</strong> A soft modest option — the midi length provides full leg coverage, the 3/4 sleeve provides partial arm coverage.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Do Colours Affect Modest Dressing?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Modest dressing is most effective when the colour palette comes from your Chromatic Harmony Mapping™ undertone palette. The right colour for your undertone makes a modest outfit look intentional and polished — not washed out or severe.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Monochromatic colour-blocking (same colour top to bottom) is particularly effective for modest dressing: it creates a clean vertical line that reads as deliberate and elegant, while providing complete coverage. A single jewel tone worn head to toe — deep teal churidar set, navy palazzo set — projects more authority than a mixed-colour modest outfit.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Modest Styling Techniques Work Across Both Ethnic and Western Wear?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Layer strategically:</strong> A structured blazer or shrug adds coverage to a sleeveless or short-sleeve base without changing the outfit structure.</li>
              <li><strong>Use dupattas as stoles:</strong> A dupatta worn as a stole over western wear adds a cultural layer of coverage and interest to a blouse-trouser combination.</li>
              <li><strong>Prioritise opaque fabrics:</strong> Sheer fabrics require layering — which adds bulk and heat. Start with opaque fabrics (crepe, cotton-linen, ponte) and coverage is built in from the first layer.</li>
              <li><strong>Ensure correct fit across the shoulders:</strong> A garment that fits well at the shoulders creates a clean vertical line — modest outfits look most authoritative when the shoulder seam sits exactly at the shoulder point.</li>
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

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/style-guides/office-wear-indian-women" className="underline hover:opacity-70">Office Wear for Indian Women — Complete Guide</Link></li>
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Hub</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/style-guides/capsule-wardrobe-india" className="underline hover:opacity-70">Capsule Wardrobe for Indian Women</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint includes modest-dressing formulas specific to your silhouette, undertone palette, and workplace context.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Modest Fashion That Doesn&apos;t Look Boring: The Indian Professional.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/modest-professional-fashion-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
