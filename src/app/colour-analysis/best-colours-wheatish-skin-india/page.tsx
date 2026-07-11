import type { Metadata } from "next";
import Link from "next/link";
import {
  ArticleGrowthTracker,
  TrackedArticleCtaView,
  TrackedArticleLink,
} from "@/components/ArticleGrowthTracker";
import { buildMetadata } from "@/lib/seo";

const path = "/colour-analysis/best-colours-wheatish-skin-india";
const growthTracking = {
  article_id: "best_colours_wheatish_skin_india",
  content_cluster: "colour_intelligence",
  audience: "women" as const,
  hook_type: "wheatish_meaning_undertone",
  content_source: "seo_wheatish_skin_article",
};
const glowTestHref =
  "/tools/glow-test?source=seo_wheatish_skin_article&article_id=best_colours_wheatish_skin_india&content_cluster=colour_intelligence&audience=women&hook_type=wheatish_meaning_undertone";

export const metadata: Metadata = buildMetadata({
  title: "Wheatish Skin Tone: Meaning, Undertones and Best Colours",
  description:
    "What does wheatish skin tone mean? Find clothing colours for warm, cool, neutral and olive wheatish Indian skin, including pastels, whites and jewellery.",
  path,
  type: "article",
  keywords: [
    "wheatish skin tone meaning",
    "best colours for wheatish skin India",
    "wheatish skin colour palette",
    "clothing colours for wheatish skin",
  ],
});

const faqs = [
  {
    q: "What colours suit wheatish skin Indian women?",
    a: "The colours that suit wheatish skin depend entirely on undertone — not the 'wheatish' label itself. Wheatish women with warm undertones look best in terracotta, mustard, olive green, burnt orange, and camel. Wheatish women with cool undertones look best in navy, emerald, fuchsia, royal purple, and burgundy. Wheatish women with neutral undertones look best in dusty rose, muted teal, warm taupe, and greyed lavender. Two women with identical wheatish skin tones can need completely opposite colour palettes.",
  },
  {
    q: "Is wheatish skin warm or cool undertone?",
    a: "Wheatish skin can have a warm, cool, or neutral undertone — the surface description 'wheatish' says nothing about the undertone. Warm undertone is more statistically common in Indian women overall, but many wheatish-skinned women have cool or neutral undertones. The only way to know is to run the undertone identification tests: vein colour, white paper test, and gold vs silver jewellery.",
  },
  {
    q: "Why does 'wear bold colours for wheatish skin' advice often feel wrong?",
    a: "Because 'bold colours' is not an undertone prescription — it is a contrast prescription based on surface depth. Bold warm colours look great on warm-undertone wheatish women but can look garish on cool-undertone wheatish women. Bold cool colours look electric on cool-undertone wheatish women but can make warm-undertone women look sallow. The undertone, not the 'boldness', is the operative variable.",
  },
  {
    q: "What jewellery metal works for wheatish skin?",
    a: "For warm undertone wheatish women: yellow gold. For cool undertone: silver or white gold. For neutral undertone: both work equally. The common assumption that all Indian women suit gold is based on the statistical prevalence of warm undertones — but it actively clashes with cool-undertone women regardless of their surface skin depth.",
  },
  {
    q: "Can wheatish skin wear pastels?",
    a: "Yes. Warm-undertone wheatish women look great in warm pastels: peach, warm blush, soft coral, muted warm yellow. Cool-undertone wheatish women look great in cool pastels: dusty rose, soft lavender, powder blue. The key is matching the pastel's temperature to your undertone — not avoiding the pastel category based on skin depth.",
  },
];

export default function BestColoursWheatishSkinPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/best-colours-wheatish-skin-india#article",
        "headline": "Best Colours for Wheatish Skin Indian Women",
        "description": "Colour science for wheatish skin Indian women — why undertone determines your palette and how Chromatic Harmony Mapping™ works for medium Indian skin tones.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2026-03-21",
        "dateModified": "2026-07-11",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/best-colours-wheatish-skin-india" },
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
          { "@type": "ListItem", "position": 2, "name": "Colour Analysis", "item": "https://www.iconik.pro/colour-analysis" },
          { "@type": "ListItem", "position": 3, "name": "Best Colours for Wheatish Skin", "item": "https://www.iconik.pro/colour-analysis/best-colours-wheatish-skin-india" },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleGrowthTracker {...growthTracking} />
      <main className="min-h-screen bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">

          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
            <ol className="flex items-center gap-2 flex-wrap">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link href="/colour-analysis" className="hover:underline">Colour Analysis</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Best Colours for Wheatish Skin</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Wheatish Skin Tone: Meaning, Undertones and Best Colours
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              &quot;Wheatish&quot; describes a surface skin depth — medium, between fair and dusky. It says nothing about your undertone. And it is undertone — warm, cool, or neutral — that determines which colours create harmony with your complexion. Two women with identical wheatish skin can need completely different colour palettes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full border border-gray-200 px-3 py-1">Published 21 March 2026</span>
              <span className="rounded-full border border-gray-200 px-3 py-1">Reviewed 11 July 2026</span>
              <Link href="/about" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50">Reviewed by Mithil Navalakha</Link>
            </div>
          </header>

          <aside className="mb-12 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#9aabb2_0%,#71858e_100%)] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.18)]">
            <div className="rounded-[1.8rem] border border-white/45 bg-white/10 p-6 text-white backdrop-blur-xl md:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/65">The short answer</p>
              <p className="font-serif text-2xl leading-relaxed text-[#fffaf1]">
                Wheatish describes a medium beige-to-brown surface depth, often with a golden or olive cast. It is not an undertone diagnosis.
              </p>
              <p className="mt-4 leading-relaxed text-white/75">
                Warm wheatish skin often harmonises with terracotta, olive, coral, and cream; cool wheatish skin often suits navy, berry, emerald, and crisp white. Neutral or olive skin benefits from controlled fabric comparisons rather than a rigid label.
              </p>
            </div>
          </aside>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">What Does Wheatish Skin Tone Mean in India?</h2>
            <p className="leading-relaxed text-gray-600">
              In Indian usage, wheatish usually describes a medium complexion between common descriptions of fair and dusky. The term is subjective and should not be used to predict undertone, ethnicity, or one universal palette. For clothing decisions, treat it as skin depth and test temperature, clarity, and contrast separately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Is Colour Advice for Wheatish Skin So Generic?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Wheatish skin is the most common skin description in India — which means there is an enormous amount of colour advice aimed at it. Almost all of it is wrong, because it treats &quot;wheatish&quot; as a single colouring category rather than a surface depth that can contain any undertone.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Advice like &quot;wear bright colours&quot;, &quot;avoid pastels&quot;, or &quot;terracotta suits everyone wheatish&quot; are surface-depth prescriptions that ignore the undertone variable entirely. A wheatish woman with a cool undertone wearing terracotta will look sallow. A wheatish woman with a warm undertone wearing cobalt will look flat. The undertone is the operative variable — always.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Identify Your Undertone Within Wheatish Skin</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Wheatish skin can carry a warm, cool, or neutral undertone. The surface depth does not predict the undertone. Use the three standard tests:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Vein colour:</strong> inner wrist in natural daylight — green veins (warm), blue-purple (cool), blue-green mix (neutral)</li>
              <li><strong>White paper test:</strong> hold white paper next to your bare face in natural light — golden/olive cast (warm), pink/grey cast (cool), no clear cast (neutral)</li>
              <li><strong>Gold vs silver:</strong> hold gold jewellery against your inner wrist, then silver — whichever looks more radiant indicates your undertone</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              For a full step-by-step walkthrough, see the <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">complete at-home undertone test guide</Link>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Colours for Wheatish Skin with Warm Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Warm undertone wheatish skin has a golden, yellow, or peachy base. Earthy, golden colours with sufficient depth create the most harmony:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Terracotta, rust, and burnt orange</li>
              <li>Mustard yellow and golden yellow</li>
              <li>Olive green and warm khaki</li>
              <li>Camel, warm beige, and warm cream</li>
              <li>Warm reds — brick red, tomato red, fire red</li>
              <li>Coral and warm peach</li>
              <li>Earthy browns — cognac, chocolate, warm tan</li>
              <li>Ivory (more flattering than stark white)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Icy blue, cool lavender, stark white, ashy grey, cool fuchsia. These introduce coolness that clashes with the yellow-golden base.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Colours for Wheatish Skin with Cool Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Cool undertone wheatish skin has a pink, blue, or red base. Jewel tones and blue-based colours create the most vibrant effect:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Navy and midnight blue</li>
              <li>Emerald green and jewel green</li>
              <li>Royal purple and amethyst</li>
              <li>Fuchsia and hot pink</li>
              <li>Burgundy and deep wine</li>
              <li>Cobalt blue and sapphire</li>
              <li>Rose pink and dusty rose</li>
              <li>Stark white (creates clean, fresh contrast)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Mustard yellow, warm orange, camel, earthy brown. These introduce yellow warmth that clashes with the pink or blue base of a cool undertone.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Colours for Wheatish Skin with Neutral Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Neutral undertone wheatish skin has a balance of warm and cool. It is particularly common in the wheatish skin depth. The most flattering approach is muted, slightly greyed versions of both warm and cool palettes:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Dusty rose and soft blush</li>
              <li>Warm taupe and stone</li>
              <li>Muted teal and soft jade</li>
              <li>Greyed lavender and dusty lilac</li>
              <li>Soft olive and warm sage</li>
              <li>Camel and warm beige</li>
              <li>Soft mauve and muted plum</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              See the full <Link href="/colour-analysis/neutral-undertone" className="underline hover:opacity-70">neutral undertone guide</Link> for a deeper breakdown.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Chromatic Harmony Mapping™ Work for Wheatish Skin?</h2>
            <p className="text-gray-600 leading-relaxed">
              CHM identifies undertone type (warm, cool, or neutral) and melanin depth simultaneously. For wheatish skin, the undertone identification step is particularly critical because the surface depth is not itself a predictor of undertone — unlike deeper skin tones where melanin intensity creates more visible constraints on palette intensity. The result is a 10-colour palette calibrated to your specific undertone and melanin depth, not a generic &quot;wheatish skin&quot; category.
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
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones — Full Guide</Link></li>
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone: 3 At-Home Tests</Link></li>
              <li>→ <Link href="/colour-analysis/warm-cool-neutral-undertone-india" className="underline hover:opacity-70">Warm vs Cool vs Neutral Undertone: Complete Comparison</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-dusky-skin" className="underline hover:opacity-70">Best Colours for Dusky Skin</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-fair-skin-india" className="underline hover:opacity-70">Best Colours for Fair Skin</Link></li>
            </ul>
          </section>

          <section className="mb-10 overflow-hidden rounded-[2rem] bg-[#27353b] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.16)]">
            <TrackedArticleCtaView tracking={growthTracking} />
            <div className="rounded-[1.8rem] border border-white/15 bg-white/10 p-7 text-white backdrop-blur-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#f0cb80]">Free three-minute diagnostic</p>
              <h2 className="mb-3 font-serif text-3xl text-[#fffaf1]">Test colours already in your wardrobe</h2>
              <p className="mb-6 leading-relaxed text-white/75">Compare tops, dupattas, scarves, or saree fabrics in consistent daylight and score what happens to facial clarity, lift, shadows, and dullness.</p>
              <TrackedArticleLink href={glowTestHref} tracking={growthTracking} className="inline-block rounded-full bg-[#f0cb80] px-7 py-3 font-semibold text-[#27353b] transition hover:bg-[#f6d99e]">
                Take the Free Glow Test →
              </TrackedArticleLink>
            </div>
          </section>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Navalakha, Mithil. &quot;Wheatish Skin Tone: Meaning, Undertones and Best Colours.&quot; Iconik, reviewed 11 July 2026. https://www.iconik.pro/colour-analysis/best-colours-wheatish-skin-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
