import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fashion for Women in Their 40s India: Dressing with Authority — Iconik",
  description: "How Indian women in their 40s can dress to project authority, confidence, and contemporary style. Body-type-specific formulas, what to stop avoiding, and building a wardrobe that reflects where you are now.",
  keywords: "fashion for women 40s India, style guide Indian women 40s, how to dress 40s India, what to wear in your 40s Indian women, Indian women fashion after 40",
  alternates: { canonical: "https://www.iconik.pro/style-guides/fashion-40s-india" },
  openGraph: {
    title: "Fashion for Women in Their 40s India: Dressing with Authority — Iconik",
    description: "Style for Indian women in their 40s — body-specific formulas, authority dressing, and what to stop avoiding.",
    url: "https://www.iconik.pro/style-guides/fashion-40s-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Fashion for women in 40s India — Iconik" }],
  },
};

const faqs = [
  {
    q: "Is there a list of things Indian women in their 40s should stop wearing?",
    a: "No — and any guide that gives you one is applying age rules rather than fit and proportion rules. The question is never 'is this for my age?' It is 'does this fit well, suit my current proportions, and project the impression I want?' A 45-year-old in a well-fitted mini skirt in the right colour looks excellent. A 45-year-old in an ill-fitting 'age-appropriate' kurta looks dated. Fit and proportion are the only rules.",
  },
  {
    q: "How does my colour palette change in my 40s?",
    a: "Your undertone — warm, cool, or neutral — does not change with age. What can change: contrast. Many women notice their hair lightens or greys in their 40s, which changes the contrast between hair, skin, and eyes. If this has happened to you, re-assess your contrast level: you may now be lower contrast than before, which means softer tonal combinations rather than high-contrast outfits read better. The CHM™ undertone type stays constant; contrast level may need updating.",
  },
  {
    q: "What is the most common fashion mistake women in their 40s make in India?",
    a: "Dressing conservatively as a default, believing it is 'appropriate for their age.' The result is a wardrobe of safe, shapeless, muted pieces that do not project authority or personality. Forty is not a retirement from colour, print, or strong silhouettes. The women who look most striking in their 40s are those who dress with intention — not those who have retreated to safety.",
  },
  {
    q: "How should I handle the saree for formal occasions in my 40s?",
    a: "The saree becomes an increasingly powerful choice in your 40s — particularly in professional and formal contexts, where it projects seniority, authority, and cultural confidence. The key variables are: an undertone-matched colour, a blouse that fits perfectly at the shoulder (a common issue — most blouses are not tailored well), and a draping style that suits your current silhouette. A well-draped saree in your best jewel tone is among the most authoritative outfits available to an Indian woman.",
  },
];

export default function Fashion40sIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Fashion for Women in Their 40s India: Dressing with Authority",
        "description": "Style guide for Indian women in their 40s — authority dressing, body-specific formulas, what to stop avoiding.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/fashion-40s-india" },
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
          { "@type": "ListItem", "position": 3, "name": "Fashion for 40s India", "item": "https://www.iconik.pro/style-guides/fashion-40s-india" },
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
              <li className="text-gray-800 font-medium">Fashion for 40s India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Fashion for Women in Their 40s India: Dressing with Authority
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Your 40s are not a time to retreat from style — they are a time to dress with precision. You have greater clarity about what works for your body, more authority in your professional and social contexts, and less tolerance for clothes that do not deliver. This guide builds on that clarity to give you Indian and western formulas for dressing at your peak.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Body Changes Affect Dressing in Your 40s?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The body changes that most affect dressing in the 40s:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Midsection weight redistribution:</strong> Even without overall weight gain, many women find weight redistributes toward the abdomen and away from the hips in their 40s. This can change the silhouette type from pear toward apple.</li>
              <li><strong>Shoulder width relative to hip:</strong> Can shift as body composition changes — the shoulder-to-hip ratio that defined your body type in your 20s may have changed.</li>
              <li><strong>Skin tone depth and contrast:</strong> Skin can lose melanin depth slightly; hair often lightens or greys — both affect which colours and contrast levels are most flattering.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              The response to these changes is to re-assess your current silhouette and contrast level — not to dress &quot;conservatively&quot; as a default assumption.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Indian Ethnic Outfits Work Best in Your 40s?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Indian ethnic wear in your 40s becomes a vehicle for authority rather than just tradition:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Sarees:</strong> In your 40s, the saree becomes a statement of cultural authority and seniority. Wear it in your best jewel tones — deep teal, midnight blue, rich burgundy — with a perfectly fitted blouse. Crepe, silk georgette, and cotton silk are the most versatile fabrics.</li>
              <li><strong>Anarkali suits in jewel tones:</strong> The most striking Indian professional and semi-formal outfit for this age group. Full coverage, structured silhouette, effortlessly authoritative.</li>
              <li><strong>Structured salwar kameez sets:</strong> A tailored straight-cut kameez with a crisp churidar and structured dupatta is the everyday Indian professional outfit — refined, covered, and age-neutral.</li>
              <li><strong>Fusion kurta over straight trousers:</strong> A structured kurta (embroidered, textured, or in a bold undertone colour) over well-fitted trousers is a modern Indian professional look that works across corporate and creative environments.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Western Outfit Formulas Work Best in Your 40s?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Tailored blazer + matching wide-leg trouser:</strong> The power suit in your best neutral. The matching set reads as deliberate and authoritative.</li>
              <li><strong>Wrap dress in structured fabric:</strong> The wrap silhouette is universally flattering and requires no age adjustment — it works by proportional principle, not trend.</li>
              <li><strong>Midi length as a default for skirts and dresses:</strong> The midi length (calf to ankle) is proportionally balanced and appropriate across contexts without being conservative.</li>
              <li><strong>Bold colour statement in one piece:</strong> A cobalt blue structured blouse with neutral trousers. A deep rust wrap dress with nude heels. Using your best undertone accent colour in one strong piece is more striking than a muted head-to-toe look.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Should Indian Women Stop Avoiding in Their 40s?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The most common &quot;avoiding&quot; patterns that actually work against you:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Bold colour:</strong> Jewel tones project authority. Muted beige projects nothing.</li>
              <li><strong>Form-fitting garments:</strong> A well-fitted kurta or dress that shows shape is more authoritative than an oversized garment that hides it.</li>
              <li><strong>Prints:</strong> A bold geometric or fine botanical print in your undertone palette reads as intentional and distinctive. Avoiding print altogether makes a wardrobe look generic.</li>
              <li><strong>Short lengths:</strong> There is no age cutoff for skirt or dress length. The question is always proportion — what length suits your leg length and overall height, regardless of age.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Key Investment Pieces for Your 40s Wardrobe?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              In your 40s, buying fewer pieces at higher quality creates more impact than fast-fashion volume:
            </p>
            <ol className="space-y-2 text-gray-600 list-decimal list-inside">
              <li>One perfectly tailored blazer (the single most versatile piece in an Indian professional wardrobe)</li>
              <li>Two sarees in your two best jewel tones (with perfectly fitted blouses)</li>
              <li>One Anarkali suit in a deep jewel tone</li>
              <li>Two pairs of well-fitted trousers in your core neutrals</li>
              <li>One wrap dress in your best accent colour</li>
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
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Hub</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/style-guides/office-wear-indian-women" className="underline hover:opacity-70">Office Wear for Indian Women</Link></li>
              <li>→ <Link href="/style-guides/capsule-wardrobe-india" className="underline hover:opacity-70">Capsule Wardrobe for Indian Women</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you within 5 working days after the consultation?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis, updated colour palette, and 20 outfit formulas for where you are now.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Fashion for Women in Their 40s India: Dressing with Authority.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/fashion-40s-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
