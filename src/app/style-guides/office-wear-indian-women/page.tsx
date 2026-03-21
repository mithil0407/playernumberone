import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Office Wear for Indian Women: The Complete Professional Style Guide — Iconik",
  description: "The complete professional style guide for Indian working women. Body-type-specific office outfit formulas, best fabrics for Indian work culture, and how to build a professional wardrobe that actually works.",
  keywords: "office wear Indian women, professional fashion India, work clothes Indian women 2025, corporate outfit Indian women, what to wear work India",
  alternates: { canonical: "https://www.iconik.pro/style-guides/office-wear-indian-women" },
  openGraph: {
    title: "Office Wear for Indian Women: The Complete Professional Style Guide — Iconik",
    description: "Body-type-specific office outfit formulas for Indian working women — ethnic and western wear, fabrics, and the 10-piece professional capsule.",
    url: "https://www.iconik.pro/style-guides/office-wear-indian-women",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Office wear guide for Indian women — Iconik" }],
  },
};

const faqs = [
  {
    q: "Can Indian women wear kurtas to corporate offices?",
    a: "Yes, in most Indian corporate environments. A well-tailored straight-cut kurta in crepe or cotton-linen, worn with straight trousers, reads as professional. The key is silhouette — the kurta should be structured, not boxy. Avoid casual cotton kurtas or heavily embellished ones for daily office wear.",
  },
  {
    q: "Is a saree appropriate for everyday office wear?",
    a: "For most Indian offices, a saree for everyday wear suits senior-management level or above, or traditional sectors like law, banking, and academia. For important meetings and formal occasions, sarees are always appropriate and highly professional at any level.",
  },
  {
    q: "What is the best office outfit formula for an apple body type?",
    a: "Straight-cut kurta at hip length + cigarette trousers + a structured dupatta draped over one shoulder. This creates a clean vertical line and draws attention away from the midsection. In western wear: structured blazer worn open + wide-leg trousers + fitted V-neck blouse.",
  },
  {
    q: "How should I dress for a job interview in India?",
    a: "One level above the company's standard dress code. For a startup: formal kurta-trouser set or a tailored midi dress. For corporate: a formal Anarkali, saree, or blazer-trouser set. Choose your undertone-matched colour — a colour that makes you look energised and authoritative.",
  },
];

export default function OfficeWearIndianWomenPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Office Wear for Indian Women: The Complete Professional Style Guide",
        "description": "Body-type-specific professional style guide for Indian working women.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/office-wear-indian-women" },
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
          { "@type": "ListItem", "position": 3, "name": "Office Wear for Indian Women", "item": "https://www.iconik.pro/style-guides/office-wear-indian-women" },
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
              <li className="text-gray-800 font-medium">Office Wear for Indian Women</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Office Wear for Indian Women: The Complete Professional Style Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Indian office wear sits at the intersection of professionalism, cultural context, climate, and body-specific fit. Generic workwear guides built for Western offices miss every one of these variables. This guide builds your professional wardrobe from first principles — using your silhouette, your undertone, and your specific work environment.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Does Generic Work Fashion Advice Fail Indian Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Western workwear guides assume air-conditioned offices with European temperatures, western garment categories, and a limited size range. Indian professional culture spans a much wider spectrum: traditional corporate (law, banking, government) where sarees and Anarkalis are appropriate daily; tech-startup culture (smart casual); and multinational corporate (western-leaning with occasional formal).
            </p>
            <p className="text-gray-600 leading-relaxed">
              Body-type styling matters even more in the workplace — fit is directly linked to the perception of professionalism. Ill-fitting clothes read as careless, regardless of how formal the garment is. A well-fitted kurta looks more professional than a poorly fitted blazer.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Body-Type Office Formula for Each Silhouette?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Each silhouette type has a specific office formula that maximises both professionalism and fit:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Apple:</strong> Straight-cut kurta at hip length + cigarette trousers. The vertical line elongates the torso. V-neck or boat neck.</li>
              <li><strong>Pear:</strong> Printed or embellished top + plain wide-leg trousers or A-line skirt. Upper body takes the visual interest; lower body stays quiet.</li>
              <li><strong>Rectangle:</strong> Defined-waist wrap blouse or belted blazer + straight trousers. Creates the waist that the silhouette lacks naturally.</li>
              <li><strong>Hourglass:</strong> Fitted kurta with defined waist seam + straight trousers or A-line skirt. The silhouette already has shape — it just needs garments that honour it.</li>
              <li><strong>Inverted Triangle:</strong> Wide-leg trousers + boat-neck or V-neck top. Adds lower body volume to balance the wide shoulders.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Best Indian Ethnic Office Wear?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The most professional Indian ethnic outfits share three characteristics: clean silhouette, muted or jewel-tone colours from your CHM™ palette, and minimal embellishment that doesn&apos;t distract.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Straight-cut salwar kameez in crepe or cotton-linen (professional daily wear)</li>
              <li>Anarkali suits in georgette or crepe for formal occasions</li>
              <li>Sarees for senior-level, formal, or traditional sectors</li>
              <li>Sharara sets with a fitted, structured top</li>
              <li>Palazzo sets in solid undertone-matched colours</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What makes ethnic wear professional:</strong> Clean silhouette (no excessive gathering or volume), muted palette from your undertone, minimal embellishment, good quality fabric that holds its shape.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Best Western Office Wear for Indian Women?</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Tailored straight or wide-leg trousers + structured blazer</li>
              <li>Midi skirts (A-line or straight based on body type) + structured blouse</li>
              <li>Wrap dresses in structured fabric (crepe, viscose, ponte)</li>
              <li>Shirt dresses in cotton-linen or structured viscose</li>
              <li>Blazer + tailored trouser as a matching set</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Very fitted bodycon dresses (reads as too casual or inappropriate in most Indian offices). Plunging necklines. Overly casual fabrics (jersey, denim). Anything that requires constant adjustment during the workday.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Colours Work Best for Indian Office Wear?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Build your professional wardrobe from your Chromatic Harmony Mapping™ palette. An understated professional palette has: 2–3 neutrals as the wardrobe foundation (navy, charcoal, camel, or cream depending on undertone), and 2–3 accent colours for statement pieces.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Prints for office wear: small repeating geometric prints, fine stripes, subtle paisleys. Avoid: oversized florals, logo prints, neon, animal prints. The principle: the outfit should support the professional impression, not compete with it.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the 10-Piece Indian Professional Capsule Wardrobe?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Ten pieces that create 30+ work outfits:
            </p>
            <ol className="space-y-2 text-gray-600 list-decimal list-inside">
              <li>2 pairs of trousers — one straight-leg, one wide-leg — in neutral undertone colours</li>
              <li>1 A-line or straight midi skirt in a neutral</li>
              <li>2 straight-cut kurtas in solid undertone-matched colours</li>
              <li>1 structured blazer (in your best neutral)</li>
              <li>2 work blouses — one structured, one wrap-style</li>
              <li>1 wrap dress or formal dress in a solid undertone colour</li>
              <li>1 formal Anarkali or saree for high-level occasions</li>
            </ol>
            <p className="text-gray-600 mt-4 leading-relaxed">
              Every item from this list must fit your silhouette guidelines and sit within your Chromatic Harmony Mapping™ colour palette. This ensures everything works with everything else.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Fabrics Work Best for Indian Office Wear?</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Crepe:</strong> Professional, wrinkle-resistant, holds shape — best for kurtas and trousers</li>
              <li><strong>Cotton-linen blend:</strong> Breathable for Indian heat, structured enough for office</li>
              <li><strong>Viscose:</strong> Soft drape, appropriate for blouses and wrap styles</li>
              <li><strong>Georgette:</strong> Excellent for Anarkalis and dressy kurtas — formal occasions</li>
              <li><strong>Ponte:</strong> Structured knit — good for western blazers and structured dresses</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid for office:</strong> Jersey (too casual and clingy), chiffon without lining, synthetic satin (reflective, looks cheap), heavily textured or embellished fabrics for daily wear.
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
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/style-guides/capsule-wardrobe-india" className="underline hover:opacity-70">Capsule Wardrobe for Indian Women</Link></li>
              <li>→ <Link href="/faq" className="underline hover:opacity-70">Frequently Asked Questions</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint includes work outfit formulas specific to your silhouette, your undertone palette, and your lifestyle context.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Office Wear for Indian Women: The Complete Professional Style Guide.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/office-wear-indian-women</p>
          </div>

        </div>
      </main>
    </>
  );
}
