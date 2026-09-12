import Link from "next/link";
import RegisteredSeoArticle from "@/components/seo/RegisteredSeoArticle";
import { buildSeoArticleMetadata } from "@/lib/seoArticle";
import { getSeoArticle } from "@/lib/seoArticleRegistry";

const article = getSeoArticle("/colour-analysis/olive-skin-india");
export const metadata = buildSeoArticleMetadata(article);

const faqs = [
  {
    q: "Is olive skin warm or cool undertone?",
    a: "Olive skin can be warm, cool, or neutral undertone — olive is a surface quality, not an undertone. Olive describes the greenish or grey-green cast on the surface of the skin, which is caused by a specific combination of melanin and carotenoid pigments. Underneath this surface cast, the undertone — the warm, cool, or neutral base — varies from person to person. Two olive-skinned Indian women can have opposite undertones and need completely different colour palettes.",
  },
  {
    q: "Why is olive skin hard to analyse with standard colour tests?",
    a: "The standard undertone tests — vein colour, white paper, gold vs silver — are less reliable for olive skin because the greenish surface cast interferes with the reading. The vein test in particular is harder to read on olive skin because the green surface pigment can make veins appear greenish regardless of undertone. The gold vs silver jewellery test and the fabric-draping method (holding warm and cool fabrics next to the bare face in natural light) tend to be more reliable for olive skin.",
  },
  {
    q: "What colours should olive skin Indian women avoid?",
    a: "This depends on your undertone — but across both warm and cool olive undertones, the colours most likely to clash are those that emphasise the greenish surface cast rather than the underlying undertone. Specifically: muted khaki greens can look flat against olive skin; very yellow neons can read sallow; and very icy cool pastels tend to wash out olive skin regardless of undertone. Saturated, clear colours generally work better than muted or greyed versions for olive skin.",
  },
  {
    q: "Can olive-skinned Indian women wear black?",
    a: "Yes — black tends to work well for most olive-skinned women because it provides contrast without conflicting with the surface pigment. Black reads as a neutral and does not create the same undertone clash that a specific warm or cool colour might. That said, navy, charcoal, and deep jewel tones often look even better than black on olive skin with cool undertone, while deep chocolate brown and deep forest green can be stronger on warm olive skin.",
  },
  {
    q: "Does olive skin suit gold or silver jewellery?",
    a: "This depends on your undertone. Olive skin with warm undertone: gold jewellery is the stronger choice, harmonising with the golden and olive pigments in the skin. Olive skin with cool undertone: silver is more flattering, cutting through the surface greenish cast and harmonising with the cool base. Olive skin with neutral undertone: rose gold is often the most flattering, bridging warm and cool. If you find both gold and silver equally flattering, your olive skin likely has a neutral undertone.",
  },
];

export default function OliveSkinIndiaPage() {
  return (
    <RegisteredSeoArticle
      article={article}
      faqs={faqs}
      quickAnswer={<>Olive describes a green-grey surface cast. It does not tell you whether the undertone beneath it is warm, cool, or neutral.</>}
      quickAnswerDetail={<>Use fabric draping and jewellery comparisons to identify the underlying direction, then choose saturated, nuanced colours that support both undertone and contrast level.</>}
      cta={{
        title: "Separate your olive surface tone from your actual undertone.",
        description: "Chromatic Harmony Mapping identifies your underlying direction and turns it into a practical wardrobe palette.",
      }}
    >
          <section id="olive-is-a-surface-quality" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is Olive Skin — and Why It Is Not an Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Olive skin describes a greenish or greyish-green cast on the surface of the skin. It is particularly common in South Asian, Southeast Asian, Mediterranean, and Middle Eastern women. The olive quality is caused by a combination of melanin pigment and carotenoids (yellow-orange pigments from diet) that together create a slightly muted, greenish-toned surface appearance.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              This surface cast is distinct from undertone. Undertone is the warm (yellow/golden/peachy), cool (pink/blue/rosy), or neutral base pigment of the skin — the colour that comes through from beneath. Olive is a surface characteristic; undertone is a depth characteristic. They are different variables.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The practical consequence: if you have olive skin and someone tells you &quot;olive is a warm undertone,&quot; they may be wrong about you specifically. Your olive surface tone can sit on top of a warm, cool, or neutral undertone — and the wrong palette advice, based on treating all olive skin as warm, will look consistently off without you being able to explain why.
            </p>
          </section>

          <section id="identify-olive-undertone" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Identify Your Undertone Within Olive Skin</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Standard undertone tests are less reliable on olive skin because the greenish surface cast interferes. The most reliable methods for olive skin:
            </p>
            <div className="space-y-4 mb-4">
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-2">The fabric draping test (most reliable for olive skin)</p>
                <p className="text-gray-600 text-sm leading-relaxed">In natural daylight, hold a warm-toned fabric (golden yellow, terracotta) next to your bare face, then a cool-toned fabric (cobalt blue, fuchsia). One will make your complexion look brighter and more alive; the other will make it look slightly dull or greenish. The fabric that makes you look better indicates your undertone.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-2">The gold vs silver test</p>
                <p className="text-gray-600 text-sm leading-relaxed">Hold gold jewellery, then silver, against your inner wrist in natural light. Warm olive undertone: gold looks harmonious, silver looks slightly stark or cool. Cool olive undertone: silver looks clean and bright, gold looks yellowish or warm. Neutral: both look equally flattering.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-2">The sun reaction test</p>
                <p className="text-gray-600 text-sm leading-relaxed">Warm olive skin tends to tan easily and deeply with sun exposure. Cool olive skin may burn slightly before tanning, or tan without burning but remain lighter than warm olive skin at the same depth. This is a supplementary indicator only — use it alongside the draping or jewellery test.</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              See the full undertone identification guide: <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone at Home</Link>.
            </p>
          </section>

          <section id="warm-olive-colours" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Colours for Olive Skin with Warm Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Warm olive skin responds to golden, earthy, and rich warm colours. These harmonise with both the surface olive quality and the warm undertone beneath it, creating a cohesive glow.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { name: "Deep Terracotta and Rust", desc: "The single most flattering colour for warm olive skin — brings out the golden-earthy quality of the complexion" },
                { name: "Forest and Olive Green", desc: "Harmonises directly with the surface olive pigment while warming the overall look" },
                { name: "Mustard and Deep Amber", desc: "The golden warmth in mustard echoes the warm undertone and lifts the complexion" },
                { name: "Rich Burgundy (warm-toned)", desc: "A red-brown burgundy — not the blue-based version — is deeply flattering on warm olive skin" },
                { name: "Warm Bronze and Copper", desc: "Metallic tones that echo the warmth without being bright gold" },
                { name: "Deep Chocolate Brown", desc: "Earthy and rich — particularly flattering in silk and structured fabrics" },
                { name: "Warm Coral", desc: "Orange-based coral (not pink-based) works well — choose one with visible warmth, not a pink cast" },
                { name: "Camel and Warm Tan", desc: "Neutral but warm — understated and very harmonious against olive skin with warm undertone" },
              ].map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="cool-olive-colours" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Colours for Olive Skin with Cool Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Cool olive skin has an interesting quality: the blue-pink undertone beneath the greenish surface creates a complex, unusual complexion that responds best to saturated cool colours. These cut through the surface olive cast and make the skin look luminous rather than dull.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { name: "Royal Blue and Cobalt", desc: "Works exceptionally well — the strong cool hue cuts through the olive surface cast and creates striking contrast" },
                { name: "Deep Fuchsia and Magenta", desc: "Blue-based pinks are one of the most flattering colours for cool olive skin" },
                { name: "Emerald Green", desc: "Blue-based green — harmonises with both the cool undertone and the olive surface pigment" },
                { name: "Deep Plum and Aubergine", desc: "Rich, jewel-toned purples work beautifully for cool olive skin" },
                { name: "Teal", desc: "Blue-green — harmonises with the olive surface tone while reinforcing the cool undertone" },
                { name: "Berry Red and Deep Crimson", desc: "Blue-based reds, not orange-based — the cool version of red works for cool olive undertone" },
                { name: "Charcoal and Deep Navy", desc: "Stronger for cool olive skin than black — these provide contrast with a cool quality" },
                { name: "Cool White", desc: "True white (not cream) — the cool quality cuts through the olive surface rather than dulling it" },
              ].map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="neutral-olive-colours" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Colours for Olive Skin with Neutral Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Neutral olive skin has flexibility across both palettes, but tends to look best in slightly muted, complex colours — those with some grey or depth rather than pure bright saturation. The greenish surface tone plus a balanced undertone creates a complexion that suits sophisticated, nuanced colours particularly well.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { name: "Muted Teal", desc: "Greyed teal — one of the most universally flattering colours for neutral olive skin" },
                { name: "Dusty Rose", desc: "Muted pink — bridges warm and cool without emphasising either" },
                { name: "Warm Taupe and Greige", desc: "Sophisticated neutrals that harmonise with the olive surface quality" },
                { name: "Soft Olive and Sage", desc: "Muted greens that echo the surface tone — flattering rather than clashing" },
                { name: "Mauve", desc: "A complex colour that sits between warm and cool — suits neutral olive skin well" },
                { name: "Slate Blue", desc: "Greyed blue — cooler than teal but muted enough for neutral undertone" },
              ].map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

    </RegisteredSeoArticle>
  );
}
