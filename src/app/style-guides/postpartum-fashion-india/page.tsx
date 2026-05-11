import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Postpartum Fashion India: Dressing Your Body After Baby — Iconik",
  description: "How to dress confidently in the postpartum period. Practical Indian and western outfit formulas for new mothers — breastfeeding-compatible styles, body changes, and rebuilding your wardrobe.",
  keywords: "postpartum fashion India, dressing after pregnancy India, new mother outfit India, post baby body clothes India, maternity to postpartum fashion Indian women",
  alternates: { canonical: "https://www.iconik.pro/style-guides/postpartum-fashion-india" },
  openGraph: {
    title: "Postpartum Fashion India: Dressing Your Body After Baby — Iconik",
    description: "Practical postpartum styling for Indian mothers — breastfeeding-compatible, body-specific, and rebuilding your wardrobe after baby.",
    url: "https://www.iconik.pro/style-guides/postpartum-fashion-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Postpartum fashion India — Iconik" }],
  },
};

const faqs = [
  {
    q: "When should I start thinking about rebuilding my postpartum wardrobe?",
    a: "At 6–8 weeks postpartum, when your body has stabilised enough to assess its current proportions. Do not buy a full wardrobe immediately — your body continues to change for 6–12 months postpartum (especially if breastfeeding). Buy 4–6 pieces that work at your current size, then reassess at 6 months.",
  },
  {
    q: "What Indian ethnic wear is most practical for breastfeeding?",
    a: "A wrap-style kurta with front ties or side slits is the most practical ethnic option — access is easy without removing the garment. A saree with a blouse that has a front hook or snap closure (rather than back hooks) is also practical. Avoid kurtis with front embellishment or heavy embroidery — they cannot be lifted easily.",
  },
  {
    q: "How do I deal with a changed bust size after pregnancy and breastfeeding?",
    a: "Your bust size can change significantly — often up 1–2 cup sizes. Garments that fit at the bust without requiring a specific bra size (wrap styles, A-line kurtas, drape tops) are most flexible. Avoid tight-fitted blouses or structured bodices during this period — the fit will change as breastfeeding continues. V-neck and wrap necklines accommodate bust changes most gracefully.",
  },
  {
    q: "What is the fastest way to look put-together in the postpartum period?",
    a: "Two things: fit and colour. A single piece in your best undertone colour that fits well at the shoulder creates an immediate impression of being dressed intentionally. An Indian cotton kurta in your best colour, worn over comfortable leggings that fit well at the hip, with hair pulled back cleanly — is a complete, confident postpartum look that requires minimal effort.",
  },
];

export default function PostpartumFashionPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Postpartum Fashion India: Dressing Your Body After Baby",
        "description": "Practical postpartum fashion guide for Indian women — body-specific, breastfeeding-compatible styling.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/postpartum-fashion-india" },
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
          { "@type": "ListItem", "position": 3, "name": "Postpartum Fashion India", "item": "https://www.iconik.pro/style-guides/postpartum-fashion-india" },
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
              <li className="text-gray-800 font-medium">Postpartum Fashion India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Postpartum Fashion India: Dressing Your Body After Baby
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              The postpartum body is a body in transition — proportions change month to month, breastfeeding affects bust size and neckline access, and energy is limited. This guide gives Indian mothers practical, body-specific outfit formulas that work through the postpartum period without requiring a complete wardrobe overhaul or aspirational thinking.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Body Changes Should You Expect to Dress For Postpartum?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The postpartum body changes in predictable ways that affect dressing:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Midsection:</strong> The uterus takes 6–8 weeks to return to pre-pregnancy size. The abdominal muscles may have separated (diastasis recti) — this affects how garments sit at the stomach and waist.</li>
              <li><strong>Bust:</strong> Breastfeeding increases bust size by 1–2 cup sizes and requires easy front access. Even post-weaning, the bust may remain larger than pre-pregnancy for some months.</li>
              <li><strong>Hips:</strong> Relaxin released during pregnancy widens the hip joint. Hips often remain wider than pre-pregnancy even after weight loss.</li>
              <li><strong>Waist:</strong> The natural waist may be less defined and more tender in the early weeks — waistbands and belts can be uncomfortable.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              The wardrobe strategy follows from these changes: prioritise garments that do not require a defined waist, provide easy chest access (for breastfeeding), fit well at the new hip measurement, and are comfortable enough to sleep in if necessary.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Postpartum Indian Ethnic Outfit Formulas?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Wrap-style kurta:</strong> Front-tie or side-slit wrap kurtas are the most practical for breastfeeding. They adjust to changing proportions and provide easy access. In cotton or cotton-linen for comfort.</li>
              <li><strong>A-line kurta over comfortable palazzo or leggings:</strong> The A-line silhouette does not require waist definition — it fits at the shoulder and flares past the midsection. Palazzo or churidar bottoms provide comfort without waistband pressure.</li>
              <li><strong>Straight-cut salwar kameez:</strong> The elasticated salwar waist accommodates midsection changes; the straight kameez falls cleanly past the hip.</li>
              <li><strong>Feeding-accessible saree:</strong> A saree can be re-pinned and re-draped as proportions change; a blouse with front hooks replaces the traditional back-hook style for nursing access.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Western Outfits Work Best Postpartum?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Wrap dress:</strong> The self-tie waist adjusts to changing proportions month by month. V-neck provides breastfeeding access. The single most practical western dress silhouette postpartum.</li>
              <li><strong>Button-front shirt dress:</strong> Button access through the chest for breastfeeding; the shirt silhouette does not require a defined waist. In cotton or lightweight viscose for comfort.</li>
              <li><strong>Elastic-waist wide-leg trousers + flowing blouse:</strong> Elastic waist accommodates midsection changes; a flowing blouse does not need to tuck and can be lifted for access.</li>
              <li><strong>Maxi dress in jersey or soft crepe:</strong> Covers all changes, requires minimal decision-making, and stretchy fabric accommodates the still-fluctuating body.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Fabrics Are Best for the Postpartum Body?</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Cotton:</strong> Breathable, washable, comfortable against sensitive skin</li>
              <li><strong>Cotton-linen blend:</strong> Structured enough to look intentional, breathable enough for comfort</li>
              <li><strong>Soft jersey:</strong> No waistband, stretches with the body, machine-washable</li>
              <li><strong>Viscose/rayon:</strong> Soft drape, does not constrict — good for tops and dresses</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid postpartum:</strong> Dry-clean-only fabrics (impractical with a baby), stiff brocades or heavy embellishment, structured waistbands, anything that takes more than 30 seconds to put on or remove.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Minimum Postpartum Capsule Wardrobe?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              You do not need to rebuild your entire wardrobe postpartum. A minimum functional wardrobe covers all occasions:
            </p>
            <ol className="space-y-2 text-gray-600 list-decimal list-inside">
              <li>3 A-line or wrap kurtas in undertone-matched colours (daily wear + casual outings)</li>
              <li>2 pairs of comfortable high-waisted or elasticated palazzo / leggings</li>
              <li>1 wrap dress or button-front dress (formal outings, events)</li>
              <li>1 blazer that fits at the new shoulder measurement (for professional re-entry)</li>
              <li>2 night / feeding tops in soft cotton</li>
            </ol>
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
              <li>→ <Link href="/style-guides/dressing-after-weight-gain" className="underline hover:opacity-70">Dressing After Weight Gain</Link></li>
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Hub</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/style-guides/capsule-wardrobe-india" className="underline hover:opacity-70">Capsule Wardrobe for Indian Women</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis for your current postpartum silhouette, undertone palette, and practical outfit formulas for this stage.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Postpartum Fashion India: Dressing Your Body After Baby.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/postpartum-fashion-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
