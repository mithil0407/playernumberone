import type { Metadata } from "next";
import Link from "next/link";
import {
  ArticleGrowthTracker,
  TrackedArticleCtaView,
  TrackedArticleLink,
} from "@/components/ArticleGrowthTracker";
import { buildMetadata } from "@/lib/seo";
import { FOUNDERS } from "@/lib/siteFacts";
import {
  SeoEditorialFooter,
  SeoEditorialHeader,
  SeoTeachingVisual,
} from "@/components/seo/SeoEditorial";
import InstagramReelsForArticle from "@/components/seo/InstagramReelsForArticle";

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
      "author": { "@type": "Person", "name": FOUNDERS[0].name, "jobTitle": FOUNDERS[0].title, "sameAs": FOUNDERS[0].linkedIn },
      "publisher": {
        "@type": "Organization",
        "name": "Iconik",
        "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
      },
      "datePublished": "2026-03-23",
      "dateModified": "2026-07-23",
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
            "text": "Start with undertone, then refine by colour clarity and the amount of contrast you prefer. Warm deep skin often harmonises with terracotta, olive, coral, cocoa and warm ivory; cool deep skin often suits cobalt, emerald, berry, plum, charcoal and crisp white. These are useful starting points, not universal rules.",
          },
        },
        {
          "@type": "Question",
          "name": "Do bright colours work for dark skin Indian women?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Deep skin can create a clear contrast with bright colour, but brightness alone does not make a colour suitable. Compare warm and cool brights near the face, then check whether the colour sharpens facial definition or adds grey, yellow or red shadows.",
          },
        },
        {
          "@type": "Question",
          "name": "Should Indian women with dark skin avoid white?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Compare crisp white, soft white and warm ivory in the same daylight. The best version is the one that keeps the eyes, lips and skin clear without introducing an unwanted grey, yellow or red cast. Skin depth alone cannot choose the correct white.",
          },
        },
        {
          "@type": "Question",
          "name": "Can dark skin Indian women wear pastels?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Pastels are not designed for one skin depth. Test temperature, clarity and contrast: clear lilac or powder blue may suit one person, while warm peach or dusty rose suits another. If a pastel feels chalky, try a clearer version or add a deeper anchor such as navy or cocoa.",
          },
        },
        {
          "@type": "Question",
          "name": "What is the difference between 'dark skin' and 'dusky skin' in colour analysis?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Both are subjective appearance terms, not scientific colour categories. In everyday Indian usage, dusky often describes a medium-to-deep brown complexion and dark describes a deeper brown complexion. Neither term predicts undertone or one correct palette, so controlled fabric comparison is more useful than trying to fit a rigid label.",
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

      <div className="seo-editorial min-h-screen">
        <SeoEditorialHeader />
        <main>
          <div className="seo-editorial-shell">
            <div className="seo-classic-article mx-auto max-w-3xl py-16 text-gray-800 md:py-24">
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
          <span className="rounded-full border border-gray-200 px-3 py-1">Updated 23 July 2026</span>
          <Link href="/about" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50">Reviewed by {FOUNDERS[0].name}, {FOUNDERS[0].title}</Link>
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

        <SeoTeachingVisual
          src="/images/seo/dark-indian-skin-colour-guide-hero-iconik.webp"
          alt="Deep-skinned Indian woman beside terracotta, cobalt, ivory, emerald, berry and saffron fabric swatches."
          caption="Deep skin is not one palette: start with temperature, then refine colour clarity and outfit contrast."
          width={1672}
          height={941}
          priority
        />

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

        <SeoTeachingVisual
          src="/images/seo/dark-skin-depth-undertone-iconik.webp"
          alt="Deep Indian skin portrait with separate depth scale and warm, cool, neutral and olive undertone swatches."
          caption="Depth influences contrast; undertone influences colour temperature; clarity determines how soft or vivid the final colour should be."
          width={1122}
          height={1402}
        />

        {/* Find your undertone */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">How to Find Your Undertone With Dark Skin</h2>
          <p className="mb-4">
            Vein colour, jewellery preference and white-paper tests can be ambiguous on any skin depth. A controlled fabric comparison is more useful because it tests the actual decision you are making: what happens when a colour sits close to your face.
          </p>

          <h3 className="text-xl font-medium mb-2">The Fabric Draping Method</h3>
          <ol className="list-decimal pl-6 space-y-2 mb-4">
            <li>Stand in indirect daylight and turn off strongly coloured indoor lights.</li>
            <li>Keep your face, camera position and exposure unchanged; remove dominant makeup and large jewellery.</li>
            <li>Compare one pair at a time: warm ivory versus crisp white, terracotta versus cobalt, then gold-toned versus silver-toned fabric.</li>
            <li>Ignore which fabric you like more. Watch the eyes, lips, under-eye shadows, jawline and overall evenness of the face.</li>
            <li>Repeat the winning colours on a second day. One comparison is a clue; a repeated pattern is more useful.</li>
          </ol>

          <p className="mb-3">Record the pattern rather than forcing a label:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Warm-leaning pattern:</strong> warm ivory, terracotta and olive repeatedly create more facial clarity than their cooler comparison colours.</li>
            <li><strong>Cool-leaning pattern:</strong> crisp white, cobalt, berry or cool emerald repeatedly look cleaner near the face.</li>
            <li><strong>Neutral or olive pattern:</strong> temperature results are mixed, while clarity and the amount of grey in a colour make a larger difference.</li>
          </ul>
        </section>

        {/* Warm dark skin */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Best Colours for Warm Dark Skin</h2>
          <p className="mb-4">
            Use the list below as a testing rail, not a permission system. Warm deep skin often supports earthy reds, golden greens and warm lights, but the best version still depends on whether your colouring prefers softness or clarity.
          </p>

          <h3 className="text-xl font-medium mb-2">Your Best Colours</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { name: "Burnt Orange", note: "Compare clear and softened versions" },
              { name: "Saffron", note: "Use as a lead or smaller accent" },
              { name: "Brick Red", note: "A grounded warm red" },
              { name: "Terracotta", note: "Useful near-face test colour" },
              { name: "Olive Green", note: "Warm, practical wardrobe anchor" },
              { name: "Copper & Bronze", note: "Test beside yellow gold" },
              { name: "Cocoa Brown", note: "Deep neutral anchor" },
              { name: "Deep Coral", note: "Clearer alternative to pale peach" },
            ].map((c) => (
              <div key={c.name} className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm">
                <div className="font-medium">{c.name}</div>
                <div className="text-gray-500 text-xs mt-1">{c.note}</div>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-medium mb-2">How to rescue a difficult colour</h3>
          <p>
            If cobalt, lavender or a cool grey feels disconnected near the face, move it to trousers, a bag or footwear and place warm ivory, olive, coral or your preferred metal closer to the face. You do not need to discard an entire colour family.
          </p>
        </section>

        <SeoTeachingVisual
          src="/images/seo/warm-deep-skin-colour-palette-iconik.webp"
          alt="Warm deep Indian skin palette with terracotta, olive, coral, saffron, cocoa and warm ivory."
          caption="A wearable warm palette combines one hero colour, one deep neutral and one soft light."
          width={1003}
          height={1568}
        />

        {/* Cool dark skin */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Best Colours for Cool Dark Skin</h2>
          <p className="mb-4">
            Cool deep skin often works well with clear blues, blue-greens, berries and cool neutrals. If the brightest version overpowers you, keep the temperature and reduce the intensity rather than switching to a warm colour automatically.
          </p>

          <h3 className="text-xl font-medium mb-2">Your Best Colours</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { name: "Cobalt Blue", note: "Clear near-face test colour" },
              { name: "Emerald Green", note: "Compare blue-green and yellow-green" },
              { name: "Royal Purple", note: "Use clear or deep versions" },
              { name: "Berry", note: "Practical cool red family" },
              { name: "Crisp White", note: "High-contrast light option" },
              { name: "Fuchsia", note: "Test clarity before brightness" },
              { name: "Sapphire", note: "Deep blue wardrobe anchor" },
              { name: "Plum", note: "Softer alternative to black" },
            ].map((c) => (
              <div key={c.name} className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm">
                <div className="font-medium">{c.name}</div>
                <div className="text-gray-500 text-xs mt-1">{c.note}</div>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-medium mb-2">How to rescue a difficult colour</h3>
          <p>
            Warm mustard, camel or orange can move away from the face or be separated by a crisp white, navy, berry or charcoal neckline. Jewellery is a finishing variable, not a diagnosis: compare metals against the complete outfit.
          </p>
        </section>

        <SeoTeachingVisual
          src="/images/seo/cool-deep-skin-colour-palette-iconik.webp"
          alt="Cool deep Indian skin palette with cobalt, emerald, berry, plum, charcoal and crisp white."
          caption="Cool colour becomes easier to wear when one jewel tone is grounded by a cool neutral and a crisp light."
          width={1003}
          height={1568}
        />

        {/* Neutral dark skin */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">What About Neutral or Olive Deep Skin?</h2>
          <p className="mb-4">
            Neutral does not automatically mean muted, and olive does not automatically mean warm. If gold-versus-silver tests feel inconclusive, compare pink against olive, then compare soft colour against clear colour. The more useful question may be how much yellow, grey or brightness the face can carry.
          </p>

          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Balanced anchors:</strong> soft navy, cocoa, stone, charcoal and aubergine.</li>
            <li><strong>Useful comparison colours:</strong> dusty rose versus coral, muted teal versus olive, crisp white versus ivory.</li>
            <li><strong>Metal test:</strong> compare polished and brushed finishes as well as warm and cool metals; reflectiveness can matter as much as temperature.</li>
          </ul>
          <p>
            If a colour flattens facial definition, restore contrast with a deeper neckline, jacket, dupatta, bag or lip colour before rejecting the whole family.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Can Dark Skin Wear Pastels?</h2>
          <p className="mb-3">
            Yes. A pastel is simply a colour mixed with a large amount of white; it is not reserved for light skin. The failure point is often a chalky grey cast, an incompatible temperature or too little definition in the complete outfit.
          </p>
          <p className="mb-3">
            Compare clear lilac with dusty lavender, powder blue with blue-grey, and warm peach with icy pink. If the face looks less defined, try a clearer version or add one deeper anchor such as navy, cocoa, berry or forest green.
          </p>
          <p>
            Pastel sarees and kurtas can also gain definition through a deeper blouse, border, dupatta, bag or neckline. Evaluate the entire near-face composition rather than judging the fabric in isolation.
          </p>
        </section>

        <SeoTeachingVisual
          src="/images/seo/dark-skin-pastel-contrast-guide-iconik.webp"
          alt="Deep Indian skin with clear lilac, dusty rose, warm peach and powder blue pastels plus navy and cocoa anchors."
          caption="Pastels work when their temperature and clarity support the face and a deeper anchor preserves definition."
          width={1003}
          height={1568}
        />

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Which White and Jewellery Metal Should You Choose?</h2>
          <p className="mb-3">
            Compare crisp white, soft white and warm ivory in the same light. Crisp white creates the strongest edge; ivory softens the transition; soft white sits between them. Keep the version that sharpens the eyes and lips without making shadows look greyer, yellower or redder.
          </p>
          <p>
            For jewellery, compare equal-size pieces with similar shine. A polished silver earring reflects more light than a brushed gold earring, so finish can distort a simple warm-versus-cool test. Judge the metal with the neckline and outfit colour you will actually wear.
          </p>
        </section>

        <SeoTeachingVisual
          src="/images/seo/dark-skin-outfit-contrast-framework-iconik.webp"
          alt="Deep-skinned Indian woman in an emerald kurta showing near-face colour, outfit anchor and accent placement."
          caption="Build contrast intentionally: decide what sits near the face, which colour anchors the outfit and where the accent belongs."
          width={1003}
          height={1568}
        />

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">How to Build a Complete Outfit Instead of Collecting Colour Lists</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Choose the near-face colour:</strong> blouse, kurta, scarf, dupatta, jacket lapel or saree pallu.</li>
            <li><strong>Add one anchor:</strong> navy, cocoa, charcoal, ivory or another neutral that controls the outfit&apos;s contrast.</li>
            <li><strong>Place one accent:</strong> jewellery, bag, border, footwear or lip colour. It should support the lead colour rather than compete with it.</li>
            <li><strong>Take a mirror photo:</strong> if the garment is noticed before the face, reduce either brightness, pattern scale or the number of competing accents.</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">How to Apply the Palette to Indian Wear</h2>
          <p className="mb-3">
            Indian wear adds border, blouse, dupatta, embroidery and metalwork to the colour decision. Use those parts strategically instead of asking whether one saree or kurta colour is universally flattering.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Saree:</strong> the blouse and pallu sit closest to the face; test them before judging the body colour.</li>
            <li><strong>Kurta set:</strong> use a tonal trouser for length, then let the dupatta or neckline provide the near-face colour.</li>
            <li><strong>Occasion wear:</strong> balance rich fabric, embroidery and jewellery so only one element becomes the visual hero.</li>
            <li><strong>Pastel Indian wear:</strong> add definition through a deeper border, blouse, bag or metal rather than abandoning the pastel.</li>
          </ul>
        </section>

        {/* FAQs */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-1">What colours look best on dark skin Indian women?</h3>
              <p>Start with undertone, then refine by clarity and contrast. Warm deep skin often works with terracotta, olive, coral, cocoa and warm ivory; cool deep skin often works with cobalt, emerald, berry, plum, charcoal and crisp white.</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Do bright colours work for dark skin Indian women?</h3>
              <p>Yes — bright colours work very well because deep skin provides a high-contrast base that makes vibrant colours appear vivid. Choose brights in your undertone direction: jewel tones for cool skin, warm brights for warm skin.</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Should Indian women with dark skin avoid white?</h3>
              <p>No. Compare crisp white, soft white and warm ivory in the same daylight. Keep the version that makes the eyes, lips and skin appear clearest.</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Can dark skin Indian women wear pastels?</h3>
              <p>Yes. Pastels work best when their undertone is compatible and the outfit preserves enough contrast near the face. Compare a clear lilac with dusty lavender, or warm peach with icy pink, and keep the version that makes the eyes and skin appear clearer.</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">What is the difference between dark skin and dusky skin in colour analysis?</h3>
              <p>They are subjective appearance terms, not scientific colour categories. Everyday usage may use dusky for medium-to-deep brown and dark for a deeper brown complexion, but neither term predicts undertone or one correct palette.</p>
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

        <InstagramReelsForArticle articlePath={path} />

        {/* Cite */}
        <section className="border-t pt-6 mb-8 text-sm text-gray-500">
          <p><strong>Cite this guide:</strong> Rana, Jasmine. &ldquo;Best Clothing Colours for Dark Indian Skin by Undertone.&rdquo; Iconik. Updated 23 July 2026.</p>
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
            </div>
          </div>
        </main>
        <SeoEditorialFooter />
      </div>
    </>
  );
}
