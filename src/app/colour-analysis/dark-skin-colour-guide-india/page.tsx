import type { Metadata } from "next";
import Link from "next/link";
import {
  ArticleGrowthTracker,
  TrackedArticleCtaView,
  TrackedArticleLink,
} from "@/components/ArticleGrowthTracker";
import { buildMetadata } from "@/lib/seo";

const path = "/colour-analysis/dark-skin-colour-guide-india";
const growthTracking = {
  article_id: "dark_skin_colour_guide_india",
  content_cluster: "colour_intelligence",
  audience: "women" as const,
  hook_type: "depth_contrast_undertone",
  content_source: "seo_dark_skin_article",
};
const glowTestHref =
  "/tools/glow-test?source=seo_dark_skin_article&article_id=dark_skin_colour_guide_india&content_cluster=colour_intelligence&audience=women&hook_type=depth_contrast_undertone";

export const metadata: Metadata = buildMetadata({
  title: "Best Clothing Colours for Dark Indian Skin by Undertone",
  description:
    "A practical clothing-colour guide for deep Indian skin: warm, cool, neutral and olive undertones, contrast, whites, pastels, jewellery and Indian occasion wear.",
  path,
  type: "article",
  keywords: [
    "best colours for dark skin Indian women",
    "which colour suits dark skin female Indian",
    "dark skin tone dress colour",
    "Indian dark skin colour palette",
  ],
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://www.iconik.pro/colour-analysis/dark-skin-colour-guide-india#article",
      "headline": "Best Colours for Dark Skin Indian Women — Complete Colour Guide",
      "description": "How to find the best clothing colours for dark skin Indian women by identifying your undertone — warm, cool, or neutral.",
      "author": { "@type": "Organization", "name": "Iconik" },
      "publisher": {
        "@type": "Organization",
        "name": "Iconik",
        "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
      },
      "datePublished": "2026-03-23",
      "dateModified": "2026-07-11",
      "mainEntityOfPage": "https://www.iconik.pro/colour-analysis/dark-skin-colour-guide-india",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What colours look best on dark skin Indian women?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The best colours for dark skin Indian women depend on your undertone, not just your skin depth. Warm dark skin (golden/orange undertone) looks best in earth tones, burnt orange, mustard, warm reds, and gold jewellery. Cool dark skin (blue/purple undertone) looks best in jewel tones — emerald, cobalt, magenta, royal purple — and silver jewellery. Neutral dark skin can wear both warm and cool palettes.",
          },
        },
        {
          "@type": "Question",
          "name": "Do bright colours work for dark skin Indian women?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes — bright colours generally work very well for dark skin because deep skin tones provide a high-contrast base that makes vibrant colours appear more vivid. However, the specific bright colours that work best depend on your undertone. Cool dark skin: bright jewel tones (cobalt, magenta, emerald). Warm dark skin: bright warm tones (coral, golden yellow, tomato red). Avoid pastels, which are designed for light skin and appear washed out against deep skin.",
          },
        },
        {
          "@type": "Question",
          "name": "Should Indian women with dark skin avoid white?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No — white works well for dark skin Indian women, particularly bright white (which complements cool undertones) and off-white or ivory (which complements warm undertones). The idea that dark skin should avoid white is a misconception. White provides a striking high-contrast look that works with deep skin tones. The question is which white: bright white vs. warm cream/ivory.",
          },
        },
        {
          "@type": "Question",
          "name": "Can dark skin Indian women wear pastels?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Pastels are generally not the most flattering choice for dark skin tones because they are designed for light skin — they have low saturation and low contrast, and tend to wash out against deep skin rather than complementing it. If you love pastels, choose deeply saturated versions (dusty rose rather than baby pink, sage rather than mint) and pair them with statement accessories in your best metals.",
          },
        },
        {
          "@type": "Question",
          "name": "What is the difference between 'dark skin' and 'dusky skin' in colour analysis?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "In Indian colour analysis, 'dusky' typically refers to medium-deep to deep brown skin with warm or neutral undertones — often medium Fitzpatrick IV. 'Dark skin' refers to Fitzpatrick V-VI, or very deep brown to ebony skin tones. The key difference for colour selection is that dark skin provides more contrast with both light and bright colours, making high-saturation and deep jewel tones generally more effective. Both groups still need undertone analysis to identify their specific best palette.",
          },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Colour Analysis", "item": "https://www.iconik.pro/colour-analysis" },
        { "@type": "ListItem", "position": 3, "name": "Dark Skin Colour Guide — India", "item": "https://www.iconik.pro/colour-analysis/dark-skin-colour-guide-india" },
      ],
    },
  ],
};

export default function DarkSkinColourGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleGrowthTracker {...growthTracking} />

      <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:underline">Home</Link> › <Link href="/colour-analysis" className="hover:underline">Colour Analysis</Link> › Dark Skin Colour Guide — India
        </nav>

        <h1 className="text-3xl font-bold mb-4">Best Colours for Dark Skin Indian Women</h1>
        <p className="text-lg text-gray-600 mb-8">
          The best colours for dark skin Indian women are not a single list — they depend on your undertone. Two women with equally deep skin tones can have completely different undertones, which means completely different colour palettes. This guide covers how to find your undertone and which colours will genuinely flatter your skin.
        </p>
        <div className="mb-8 flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="rounded-full border border-gray-200 px-3 py-1">Published 23 March 2026</span>
          <span className="rounded-full border border-gray-200 px-3 py-1">Reviewed 11 July 2026</span>
          <Link href="/about" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50">Reviewed by Mithil Navalakha</Link>
        </div>

        <aside className="mb-10 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#9aabb2_0%,#71858e_100%)] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.18)]">
          <div className="rounded-[1.8rem] border border-white/45 bg-white/10 p-6 text-white backdrop-blur-xl md:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/65">The short answer</p>
            <p className="font-serif text-2xl leading-relaxed text-[#fffaf1]">
              Deep skin can carry warm, cool, neutral, or olive undertones. Choose colour temperature from undertone, then use contrast and saturation to control how strongly the outfit frames the face.
            </p>
            <p className="mt-4 leading-relaxed text-white/75">
              Warm deep skin often harmonises with terracotta, coral, olive, and warm cream. Cool deep skin often suits cobalt, emerald, berry, and clean white. Pastels can work when their temperature and clarity support the wearer.
            </p>
          </div>
        </aside>

        {/* The fundamental principle */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">The Most Important Thing to Understand</h2>
          <p className="mb-3">
            Skin depth (how dark or light your skin is) and skin undertone (the warm, cool, or neutral quality beneath the surface) are two different things. Dark skin does not automatically mean warm undertone — many women with deep skin have distinctly cool undertones.
          </p>
          <p className="mb-3">
            The colours that will genuinely flatter you are determined primarily by your undertone, not your skin depth. Getting the undertone right is step one.
          </p>
          <p>
            <strong>Additionally:</strong> Deep skin can create striking contrast with light and bright colours. Saturated colours are useful, but intensity still needs to match the wearer&apos;s undertone and natural contrast. Pastels are not prohibited; some need clearer colour or intentional contrast elsewhere in the outfit.
          </p>
        </section>

        {/* Find your undertone */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">How to Find Your Undertone With Dark Skin</h2>
          <p className="mb-4">Standard undertone tests (vein test, white paper test) are less reliable for very dark skin because the surface colour can obscure the undertone signal. The most reliable method for dark skin is fabric draping.</p>

          <h3 className="text-xl font-medium mb-2">The Fabric Draping Method</h3>
          <ol className="list-decimal pl-6 space-y-2 mb-4">
            <li>Go to natural daylight (not artificial lighting)</li>
            <li>Remove any makeup and jewellery</li>
            <li>Hold a piece of bright gold fabric under your chin and note how your face looks — does your skin appear vibrant, or dull?</li>
            <li>Replace with bright silver fabric and note the difference</li>
            <li>If gold makes your skin glow, you have a warm undertone. If silver does, you have a cool undertone. If both work equally, you are neutral.</li>
          </ol>

          <p className="mb-3">You can also observe these signals:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Warm undertone dark skin</strong>: Your skin has golden, bronze, or orange-red richness. The sun brings out warmth in your complexion. You look best in gold jewellery.</li>
            <li><strong>Cool undertone dark skin</strong>: Your skin has blue-black, reddish-brown, or ashy undertones in certain lights. Silver jewellery makes your skin look vibrant. You may notice a blue or purple quality in your darkest areas.</li>
            <li><strong>Neutral undertone dark skin</strong>: Neither gold nor silver significantly outperforms the other. You don&rsquo;t notice a strong warm or cool cast.</li>
          </ul>
        </section>

        {/* Warm dark skin */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Best Colours for Warm Dark Skin</h2>
          <p className="mb-4">If you have warm undertones with deep skin, you have one of the richest, most striking colour profiles. Earth tones and warm jewel tones genuinely glow against your complexion.</p>

          <h3 className="text-xl font-medium mb-2">Your Best Colours</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { name: "Burnt Orange", note: "Stunning on warm dark skin" },
              { name: "Mustard Yellow", note: "Deepens skin's warmth" },
              { name: "Brick Red", note: "Rich, not harsh" },
              { name: "Warm Terracotta", note: "Earth tone that glows" },
              { name: "Forest Green", note: "Earthy, not cool" },
              { name: "Copper & Bronze", note: "Your jewellery metals too" },
              { name: "Chocolate Brown", note: "Tone-on-tone richness" },
              { name: "Deep Coral", note: "Vibrant without clashing" },
            ].map((c) => (
              <div key={c.name} className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm">
                <div className="font-medium">{c.name}</div>
                <div className="text-gray-500 text-xs mt-1">{c.note}</div>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-medium mb-2">What to Approach Carefully</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Cool jewel tones (cobalt blue, royal purple, fuchsia) — these can clash with warm undertones, especially in large quantities</li>
            <li>Pastels — low contrast and the wrong undertone for warm dark skin</li>
            <li>Silver jewellery — gold is your metal</li>
          </ul>
        </section>

        {/* Cool dark skin */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Best Colours for Cool Dark Skin</h2>
          <p className="mb-4">Cool undertone dark skin is stunning with jewel tones — the combination of deep skin and cool-toned saturated colour creates a high-drama, high-fashion look that few skin types can achieve.</p>

          <h3 className="text-xl font-medium mb-2">Your Best Colours</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { name: "Cobalt Blue", note: "Your signature colour" },
              { name: "Emerald Green", note: "Rich and vibrant" },
              { name: "Royal Purple", note: "Deep regal tone" },
              { name: "Magenta", note: "Cool-based bright" },
              { name: "Bright White", note: "High contrast, stunning" },
              { name: "Hot Pink (cool)", note: "Fuchsia, not coral" },
              { name: "Sapphire", note: "Deep blue jewel" },
              { name: "Plum", note: "Deep cool purple" },
            ].map((c) => (
              <div key={c.name} className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm">
                <div className="font-medium">{c.name}</div>
                <div className="text-gray-500 text-xs mt-1">{c.note}</div>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-medium mb-2">What to Approach Carefully</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Orange-based warm tones (burnt orange, mustard, terracotta) — they can create a subtle clash with cool undertones</li>
            <li>Gold jewellery — silver is your metal</li>
            <li>Earth tones — these read as warm and don&rsquo;t harmonise with cool undertones as effectively</li>
          </ul>
        </section>

        {/* Neutral dark skin */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Best Colours for Neutral Dark Skin</h2>
          <p className="mb-4">Neutral undertone dark skin is the most flexible — you can wear both warm and cool palettes without clashing. The key is to choose the most saturated, richest version of any colour you love.</p>

          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Deep jewel tones</strong>: emerald, sapphire, amethyst, ruby — all work</li>
            <li><strong>Rich earth tones</strong>: terracotta, burnt sienna, forest green — all work</li>
            <li><strong>Deep neutrals</strong>: charcoal, deep navy, espresso brown — all excellent</li>
            <li><strong>Both gold and silver jewellery</strong> — rose gold is a particularly good metal for neutral undertones</li>
          </ul>
          <p>
            Test very pale or muted colours near the face. If they flatten contrast, restore definition through a deeper neckline, jacket, dupatta, jewellery metal, or lip colour rather than discarding the entire colour family.
          </p>
        </section>

        {/* Colours that universally work */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Colours That Work for Almost All Dark Skin Tones</h2>
          <p className="mb-4">Regardless of undertone, these colours tend to be universally flattering for deep Indian skin:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Deep jewel tones</strong> — the richness and saturation complement deep skin at any undertone</li>
            <li><strong>White</strong> — bright white (cool skin) or cream (warm skin) — the contrast is always striking</li>
            <li><strong>Black</strong> — high contrast, always clean; pair with statement jewellery in your best metal</li>
            <li><strong>Deep, saturated colours in general</strong> — the rule for dark skin is saturation and depth; avoid pale and muted</li>
          </ul>
        </section>

        {/* Ethnic wear note */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">A Note on Ethnic Wear and Dark Skin</h2>
          <p className="mb-3">
            Traditional Indian occasion wear — particularly bridal wear and heavily embellished pieces — tends to be richly coloured and embroidered, which works naturally in favour of dark skin. The challenge is more often in everyday and professional wear, where plain, dull fabrics in the wrong undertone palette can look flat.
          </p>
          <p className="mb-3">
            <strong>Sarees</strong>: Kanjeevarams and Banarasis in rich jewel tones and warm earth tones are excellent for dark skin. Avoid pale or pastel sarees.
          </p>
          <p>
            <strong>Salwar kameez and kurtas</strong>: Choose deep, rich colours. If you wear the wrong undertone, embellishments and embroidery in your correct metals (gold vs silver) can partially compensate by bringing light close to your face.
          </p>
        </section>

        {/* FAQs */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-1">What colours look best on dark skin Indian women?</h3>
              <p>It depends on your undertone. Warm dark skin: earth tones, burnt orange, mustard, brick red. Cool dark skin: jewel tones — cobalt, emerald, magenta, royal purple. Neutral dark skin: both palettes. All dark skin: deep, saturated colours over pastels.</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Do bright colours work for dark skin Indian women?</h3>
              <p>Yes — bright colours work very well because deep skin provides a high-contrast base that makes vibrant colours appear vivid. Choose brights in your undertone direction: jewel tones for cool skin, warm brights for warm skin.</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Should Indian women with dark skin avoid white?</h3>
              <p>No. White works well for dark skin — the high contrast is striking. Choose bright white for cool undertones and ivory or cream for warm undertones.</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Can dark skin Indian women wear pastels?</h3>
              <p>Yes. Pastels work best when their undertone is compatible and the outfit preserves enough contrast near the face. Compare a clear lilac with dusty lavender, or warm peach with icy pink, and keep the version that makes the eyes and skin appear clearer.</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">What is the difference between dark skin and dusky skin in colour analysis?</h3>
              <p>&ldquo;Dusky&rdquo; in Indian usage typically refers to medium-deep brown skin (Fitzpatrick IV), often with warm undertones. &ldquo;Dark&rdquo; refers to deeper Fitzpatrick V-VI tones. Both groups need undertone analysis — skin depth and undertone are different things, and the undertone determines which specific colours will flatter.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-10 overflow-hidden rounded-[2rem] bg-[#27353b] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.16)]">
          <TrackedArticleCtaView tracking={growthTracking} />
          <div className="rounded-[1.8rem] border border-white/15 bg-white/10 p-7 text-white backdrop-blur-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#f0cb80]">Free three-minute diagnostic</p>
          <h2 className="mb-2 font-serif text-3xl text-[#fffaf1]">Compare colours from your own wardrobe</h2>
          <p className="mb-4">
            Use the Glow Test to compare tops, dupattas, scarves, or saree fabrics in the same daylight and score clarity, lift, shadows, and dullness.
          </p>
          <TrackedArticleLink
            href={glowTestHref}
            tracking={growthTracking}
            className="inline-block rounded-full bg-[#f0cb80] px-6 py-3 font-semibold text-[#27353b] transition hover:bg-[#f6d99e]"
          >
            Take the Free Glow Test →
          </TrackedArticleLink>
          </div>
        </section>

        {/* Cite */}
        <section className="border-t pt-6 mb-8 text-sm text-gray-500">
          <p><strong>Cite this guide:</strong> Navalakha, Mithil. &ldquo;Best Clothing Colours for Dark Indian Skin by Undertone.&rdquo; Iconik. Reviewed 11 July 2026.</p>
        </section>

        {/* Related */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Related Guides</h2>
          <ul className="space-y-2 text-blue-700 underline">
            <li><a href="/colour-analysis/best-colours-dusky-skin">Best Colours for Dusky Skin</a></li>
            <li><a href="/colour-analysis/indian-skin-tones">Indian Skin Tones — Complete Guide</a></li>
            <li><a href="/colour-analysis/warm-undertone">Warm Undertone Colour Guide</a></li>
            <li><a href="/colour-analysis/cool-undertone">Cool Undertone Colour Guide</a></li>
            <li><a href="/colour-analysis/how-to-find-undertone">How to Find Your Undertone</a></li>
            <li><a href="/colour-analysis">All Colour Analysis Guides</a></li>
          </ul>
        </section>
      </main>
    </>
  );
}
