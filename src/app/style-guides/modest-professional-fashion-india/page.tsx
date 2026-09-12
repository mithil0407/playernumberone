import type { Metadata } from "next";
import Link from "next/link";
import {
  ArticleGrowthTracker,
  TrackedArticleCtaView,
  TrackedArticleLink,
} from "@/components/ArticleGrowthTracker";
import {
  SeoEditorialFooter,
  SeoEditorialHeader,
  SeoTeachingVisual,
} from "@/components/seo/SeoEditorial";
import { buildMetadata } from "@/lib/seo";
import { FOUNDERS } from "@/lib/siteFacts";

const path = "/style-guides/modest-professional-fashion-india";
const growthTracking = {
  article_id: "modest_professional_fashion_india",
  content_cluster: "work_occasion_dressing",
  audience: "women" as const,
  hook_type: "coverage_through_design",
  content_source: "seo_modest_professional_article",
};
const silhouetteQuizHref =
  "/tools/silhouette-scan?source=seo_modest_professional_article&article_id=modest_professional_fashion_india&content_cluster=work_occasion_dressing&audience=women&hook_type=coverage_through_design";

export const metadata: Metadata = buildMetadata({
  title: "Modest Office Wear for Indian Women: 12 Polished Formulas",
  description:
    "Modest professional outfit formulas for Indian offices: ethnic and western options, summer fabrics, sleeves, dupattas, fit and authority without unnecessary bulk.",
  path,
  type: "article",
  keywords: [
    "modest office wear India",
    "modest professional attire women",
    "modest work clothes Indian women",
    "professional modest outfits",
  ],
});

const faqs = [
  {
    q: "Can modest dressing still look authoritative in a corporate environment?",
    a: "Yes. Authority comes from deliberate construction: a clean shoulder, controlled ease, opaque fabric, a finished trouser or hem line, and accessories that support one visual hierarchy. Coverage and polish are compatible; the garment should allow movement without losing its structure.",
  },
  {
    q: "What is the most modest Indian professional outfit for a formal meeting?",
    a: "A reliable formal formula is a solid or low-contrast straight kurta with tonal straight trousers, a controlled dupatta or no dupatta, closed-toe shoes and one structured bag. A securely draped saree with an opaque blouse can be equally formal. Choose according to your workplace and movement needs.",
  },
  {
    q: "How do I add full sleeve coverage without overheating in Indian summers?",
    a: "Choose a loose-woven but opaque cotton, linen blend or lightweight viscose; allow ease through the armhole and upper arm; and use a three-quarter sleeve when your coverage preference allows it. Fibre labels do not guarantee comfort, so test opacity, airflow and movement in the actual garment.",
  },
  {
    q: "How should I style a dupatta professionally?",
    a: "Fold the dupatta to a controlled width, create one clear vertical or diagonal line, and secure one point at the shoulder or neckline when your work requires free hands. Keep the tail above the floor and test sitting, walking and reaching before leaving home.",
  },
];

const ethnicFormulas = [
  {
    name: "Tonal straight kurta set",
    formula: "Straight kurta + tonal straight trousers + structured tote",
    why: "A continuous colour line looks controlled, while the straight cut provides coverage without excess fabric.",
  },
  {
    name: "Controlled A-line set",
    formula: "Low-flare A-line kurta + narrow or straight trousers + watch",
    why: "A small amount of flare creates movement without turning the outfit festive or visually wide.",
  },
  {
    name: "Short kurta with wide-straight trousers",
    formula: "Mid-thigh kurta + high-rise wide-straight trousers + closed shoes",
    why: "The shorter top reveals the trouser line while the rise and full length maintain coverage.",
  },
  {
    name: "Secure saree formula",
    formula: "Opaque saree + practical blouse + pinned pallu + closed-toe shoes",
    why: "A secure diagonal pallu and clean blouse shoulder make the saree workable for meetings and movement.",
  },
  {
    name: "Kurta with controlled dupatta",
    formula: "Solid kurta set + medium-width dupatta + one secure shoulder point",
    why: "The dupatta becomes one vertical or diagonal line instead of a layer that needs constant adjustment.",
  },
  {
    name: "Long jacket set",
    formula: "Tonal inner column + open long jacket + straight trousers",
    why: "The open centre creates a vertical frame; keep the jacket fabric light enough for the climate.",
  },
];

const westernFormulas = [
  {
    name: "Shirt and straight trousers",
    formula: "Opaque collared shirt + high-rise straight trousers + loafers",
    why: "A defined shoulder and finished trouser break create polish without relying on a tight fit.",
  },
  {
    name: "Blouse and wide-straight trousers",
    formula: "Full or three-quarter sleeve blouse + wide-straight trousers + structured bag",
    why: "The trouser falls vertically from the hip while the blouse keeps the upper body visually precise.",
  },
  {
    name: "Controlled shirt dress",
    formula: "Midi shirt dress + adjustable waist + closed shoe",
    why: "Buttons and a collar provide structure; the waist should skim rather than grip.",
  },
  {
    name: "Longline tailoring",
    formula: "High-neck shell + longline blazer + matching trousers",
    why: "A single tailored outer line creates coverage and formality; remove the blazer when the climate requires it.",
  },
  {
    name: "Fine-knit column",
    formula: "Fine-gauge knit + midi skirt + low boot or loafer",
    why: "Fine fabric reduces bulk while the uninterrupted column keeps the outfit visually calm.",
  },
  {
    name: "Overshirt layer",
    formula: "Opaque base top + structured overshirt + full-length trousers",
    why: "The open overshirt adds coverage and a vertical frame without the heat or stiffness of a blazer.",
  },
];

export default function ModestProfessionalFashionPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Modest Office Wear for Indian Women: 12 Polished Formulas",
        "description": "A construction-first guide to modest Indian office wear with twelve ethnic and western formulas, fabric checks, dupatta direction and shopping advice.",
        "author": { "@type": "Person", "name": FOUNDERS[0].name, "jobTitle": FOUNDERS[0].title, "sameAs": FOUNDERS[0].linkedIn },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" } },
        "datePublished": "2026-03-21",
        "dateModified": "2026-07-23",
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
      <ArticleGrowthTracker {...growthTracking} />
      <div className="seo-editorial min-h-screen">
        <SeoEditorialHeader />
        <main>
          <div className="seo-editorial-shell">
            <div className="seo-classic-article mx-auto max-w-3xl py-16 md:py-24">

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
              Modest Office Wear for Indian Women: 12 Polished Formulas
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Modest professional dressing works best when coverage comes from garment design rather than simply adding size. Clean shoulders, breathable opaque fabric, deliberate sleeve and hem lengths, and one controlled silhouette create polish across Indian ethnic and western office wardrobes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full border border-gray-200 px-3 py-1">Published 21 March 2026</span>
              <span className="rounded-full border border-gray-200 px-3 py-1">Updated 23 July 2026</span>
              <Link href="/about" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50">Reviewed by {FOUNDERS[0].name}, {FOUNDERS[0].title}</Link>
            </div>
          </header>

          <aside className="mb-12 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#9aabb2_0%,#71858e_100%)] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.18)]">
            <div className="rounded-[1.8rem] border border-white/45 bg-white/10 p-6 text-white backdrop-blur-xl md:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/65">The short answer</p>
              <p className="font-serif text-2xl leading-relaxed text-[#fffaf1]">
                Build modest office outfits with coverage by construction: a fitted shoulder, opaque breathable fabric, intentional sleeve and hem lengths, and a visible or implied waist.
              </p>
              <p className="mt-4 leading-relaxed text-white/75">
                Reliable formulas include a straight kurta with tonal trousers, a structured blouse with wide-leg trousers, a shirt dress with a controlled waist, or a saree with a secure blouse and practical drape.
              </p>
            </div>
          </aside>

          <SeoTeachingVisual
            src="/images/seo/modest-office-wear-india-hero-iconik.webp"
            alt="Indian professional in a structured teal kurta beside clean shoulder, opaque fabric, controlled hem and tonal-line details."
            caption="Coverage looks intentional when it comes from garment construction: shoulder, opacity, hem and one clear line."
            width={1672}
            height={941}
            priority
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Does Modest Dressing Often Look Frumpy — And How Do You Fix It?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Modest dressing does not become frumpy because it covers the body. It loses clarity when several variables become uncontrolled at once: a dropped shoulder, excess fabric through the torso, an unfinished trouser line, a soft bag, a busy print and a dupatta that spreads horizontally across the outfit.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The solution is coverage through design. Fit the shoulder first, then choose enough ease to sit and move without pulling. Use an opaque fabric, an intentional sleeve length and a finished hem. The garment can be relaxed without becoming shapeless.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Run a movement test before judging the mirror: raise both arms, sit, reach forward and walk ten steps. A modest office outfit must function for the workday, not only look composed while standing still.
            </p>
          </section>

          <SeoTeachingVisual
            src="/images/seo/modest-office-structure-comparison-iconik.webp"
            alt="Same Indian woman in equally modest outfits comparing excess fabric with controlled ease and clean construction."
            caption="The coverage and body stay the same; shoulder placement, fabric volume, trouser finish and bag structure change the result."
            width={1003}
            height={1568}
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Six Modest Indian Office-Wear Formulas</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Choose the formula that fits your office, commute, climate and coverage preference. Each one has a clear lead line and can be made more formal through fabric, colour and accessories.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {ethnicFormulas.map((item, index) => (
                <article key={item.name} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Formula {index + 1}</p>
                  <h3 className="mb-2 font-semibold text-gray-900">{item.name}</h3>
                  <p className="mb-2 text-sm font-medium text-gray-700">{item.formula}</p>
                  <p className="text-sm leading-relaxed text-gray-600">{item.why}</p>
                </article>
              ))}
            </div>
          </section>

          <SeoTeachingVisual
            src="/images/seo/modest-ethnic-office-formulas-iconik.webp"
            alt="Three modest Indian office formulas showing a tonal straight set, controlled A-line and secure saree drape."
            caption="Ethnic office wear becomes easier to repeat when each formula has one clear vertical or diagonal lead line."
            width={1003}
            height={1568}
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Six Modest Western Office-Wear Formulas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {westernFormulas.map((item, index) => (
                <article key={item.name} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Formula {index + 7}</p>
                  <h3 className="mb-2 font-semibold text-gray-900">{item.name}</h3>
                  <p className="mb-2 text-sm font-medium text-gray-700">{item.formula}</p>
                  <p className="text-sm leading-relaxed text-gray-600">{item.why}</p>
                </article>
              ))}
            </div>
          </section>

          <SeoTeachingVisual
            src="/images/seo/modest-western-office-formulas-iconik.webp"
            alt="Three modest western office formulas with shirt and trousers, controlled shirt dress and longline tailoring."
            caption="Western modest workwear keeps structure visible through the shoulder, waist treatment and finished trouser line."
            width={1003}
            height={1568}
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Do Colours Affect Modest Dressing?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A covered outfit contains more uninterrupted fabric, so colour can occupy a larger visual area. Use one dominant colour, one supporting neutral and one controlled accent. This creates hierarchy without requiring the outfit to become dark or monochromatic.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Tonal dressing—related shades rather than one exact colour—can create a long visual line while preserving depth. For example, deep teal with soft navy, berry with cocoa, or warm ivory with camel. If you use print, let either the print or the accessory lead, not both.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Should You Drape a Dupatta for Work?</h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              Decide what the dupatta must do: provide neckline coverage, add a vertical line, or complete the colour palette. Fold it to a controlled width, secure one point when you need free hands, and keep the tail clear of the floor and chair wheels.
            </p>
            <ul className="space-y-3 text-gray-600 list-disc pl-6">
              <li><strong>One-shoulder vertical:</strong> best for an active workday; pin discreetly at the shoulder.</li>
              <li><strong>Centred stole:</strong> useful when both sides need coverage; keep the width narrow enough to preserve the kurta shape.</li>
              <li><strong>Diagonal pallu:</strong> formal and visually strong; secure at the shoulder and check the length while seated.</li>
            </ul>
          </section>

          <SeoTeachingVisual
            src="/images/seo/professional-dupatta-drape-comparison-iconik.webp"
            alt="Same Indian woman comparing a wide horizontal dupatta spread with a secure controlled vertical drape."
            caption="A professional dupatta stays modest and practical when its width, direction, secure point and tail length are controlled."
            width={1003}
            height={1568}
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Fabrics Work in Indian Office Weather?</h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              Fibre names are only a starting point. Cotton can be heavy; viscose can be breathable or clingy; linen blends can be cool but transparent. Test the actual fabric for opacity, airflow, recovery and movement.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Opacity", "Hold the fabric against daylight and check seams as well as the centre panel."],
                ["Airflow", "Wear it for ten minutes; check the back, underarm and elbow rather than touching it briefly."],
                ["Recovery", "Sit for five minutes and see whether the fabric crushes, bags or clings."],
                ["Movement", "Raise your arms and reach forward; the hem should not rise beyond your comfort level."],
              ].map(([title, copy]) => (
                <article key={title} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{copy}</p>
                </article>
              ))}
            </div>
          </section>

          <SeoTeachingVisual
            src="/images/seo/modest-office-wear-shopping-checklist-iconik.webp"
            alt="Modest office-wear shopping checklist showing shoulder, opacity, sleeve, hem and movement checks."
            caption="Test modest workwear in motion: raise your arms, sit, check opacity in daylight and walk before buying."
            width={1003}
            height={1568}
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Five-Minute Fitting-Room Test</h2>
            <ol className="space-y-3 text-gray-600 list-decimal pl-6">
              <li><strong>Shoulder:</strong> confirm the seam sits where the garment design intends and the neckline stays flat.</li>
              <li><strong>Opacity:</strong> inspect the front, back and seam allowances in bright light.</li>
              <li><strong>Sitting:</strong> sit fully; check pulling at the bust, stomach, hip, buttons and side slits.</li>
              <li><strong>Movement:</strong> raise both arms, reach forward and walk ten normal steps.</li>
              <li><strong>Workday finish:</strong> add your usual bag, footwear and dupatta; confirm the outfit still has one visual lead.</li>
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
              <li>→ <Link href="/style-guides/office-wear-indian-women" className="underline hover:opacity-70">Office Wear for Indian Women — Complete Guide</Link></li>
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Hub</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/style-guides/capsule-wardrobe-india" className="underline hover:opacity-70">Capsule Wardrobe for Indian Women</Link></li>
            </ul>
          </section>

          <section className="mb-10 overflow-hidden rounded-[2rem] bg-[#27353b] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.16)]">
            <TrackedArticleCtaView tracking={growthTracking} />
            <div className="rounded-[1.8rem] border border-white/15 bg-white/10 p-7 text-white backdrop-blur-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#f0cb80]">Free silhouette diagnostic</p>
              <h2 className="mb-3 font-serif text-3xl text-[#fffaf1]">Choose coverage that follows your proportions</h2>
              <p className="mb-6 leading-relaxed text-white/75">The Silhouette Scan uses four simple measurements to identify where your outfit needs structure, ease, and visual balance.</p>
              <TrackedArticleLink href={silhouetteQuizHref} tracking={growthTracking} className="inline-block rounded-full bg-[#f0cb80] px-7 py-3 font-semibold text-[#27353b] transition hover:bg-[#f6d99e]">
                Take the Free Silhouette Scan →
              </TrackedArticleLink>
            </div>
          </section>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Rana, Jasmine. &quot;Modest Office Wear for Indian Women: 12 Polished Formulas.&quot; Iconik, updated 23 July 2026. https://www.iconik.pro/style-guides/modest-professional-fashion-india</p>
          </div>

            </div>
          </div>
        </main>
        <SeoEditorialFooter />
      </div>
    </>
  );
}
