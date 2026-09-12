import RegisteredSeoArticle from "@/components/seo/RegisteredSeoArticle";
import { buildSeoArticleMetadata } from "@/lib/seoArticle";
import { getSeoArticle } from "@/lib/seoArticleRegistry";

const article = getSeoArticle("/colour-analysis/saree-colours-by-undertone");
export const metadata = buildSeoArticleMetadata(article);

const faqs = [
  {
    q: "Can cool undertone Indian women wear red sarees?",
    a: "Yes — but the specific shade of red matters enormously. Cool undertone women look best in blue-based reds: deep burgundy, wine, berry red, and crimson. Avoid orange-based reds like tomato red or brick red, which clash with a cool undertone. For bridal wear, a deep blue-red (not orange-red) in silk with silver zari is the most harmonious choice.",
  },
  {
    q: "What colour saree suits wheatish skin tone?",
    a: "Wheatish skin is a surface depth, not an undertone — so the answer depends on whether your wheatish skin has a warm or cool undertone. Warm wheatish skin looks best in terracotta, mustard, olive, and deep burnt orange. Cool wheatish skin looks best in cobalt, teal, fuchsia, and plum. If you are unsure of your undertone, the vein test and the gold vs silver jewellery test are the fastest ways to identify it.",
  },
  {
    q: "Does the saree border or zari colour matter for undertone?",
    a: "Yes — significantly. Gold zari harmonises with warm undertones; silver zari harmonises with cool undertones. Antique gold (slightly muted, less bright) can work for neutral undertones. This is why many Indian women feel certain sarees 'clash' even when they love the body colour — it is often the border or zari that is creating the dissonance, not the main fabric.",
  },
  {
    q: "What colour bridal saree is best for my undertone?",
    a: "Warm undertone brides look stunning in deep terracotta-red, golden yellow, warm burgundy, and rich copper with gold zari. Cool undertone brides look best in deep plum-red, royal blue-red, rich magenta, and emerald with silver or white gold zari. Neutral undertone brides can wear muted versions of both — dusty rose, off-white, or a warm-cool balanced red with antique gold zari.",
  },
  {
    q: "I have dark skin — which saree colours should I choose?",
    a: "Dark or dusky skin with a warm undertone: terracotta, rust, mustard, deep olive, warm burgundy, copper — all look exceptional. Dark skin with a cool undertone: cobalt, emerald, fuchsia, deep plum, and royal blue are your strongest colours. Avoid generic 'bright colours suit dark skin' advice — what matters is whether the colour is the warm or cool version of that hue, matched to your specific undertone.",
  },
];

export default function SareeColoursByUndertonePage() {
  return (
    <RegisteredSeoArticle
      article={article}
      faqs={faqs}
      quickAnswer={<>Choose the undertone direction first, then the saree hue, border, and zari as one complete colour relationship.</>}
      quickAnswerDetail={<>Warm undertones generally harmonise with golden and earthy versions of colour; cool undertones with blue-based jewel tones and silver; neutral undertones with balanced or muted combinations.</>}
      cta={{
        title: "Build a saree palette around your actual undertone.",
        description: "Chromatic Harmony Mapping identifies the hues, metallics, and contrast levels that work across festive, bridal, and everyday sarees.",
      }}
    >
          <section id="undertone-over-depth" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Undertone Matters More Than Skin Depth for Sarees</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Most advice you&apos;ll find online says things like &quot;bright colours suit dark skin&quot; or &quot;pastels suit fair skin.&quot; This is surface-level advice that ignores the single most important variable: undertone.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Two women can both have wheatish skin — one with a warm golden undertone, one with a cool pinkish undertone — and the colours that look stunning on one will look wrong on the other. The warm undertone woman will glow in mustard and terracotta. The cool undertone woman will look washed out. Put her in cobalt or fuchsia and she glows instead.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The same principle applies to saree colours. The body of the saree, the border, the zari, and the blouse fabric all interact with your undertone. Getting undertone right means every element works together.
            </p>
          </section>

          <section id="warm-undertone-sarees" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Saree Colours for Warm Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Warm undertone skin has a golden, peachy, or olive base. The most flattering saree colours share this warmth — they harmonise rather than contrast with the skin&apos;s base tone.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { name: "Terracotta and Rust", desc: "The strongest colour for warm undertone — brings out golden and olive skin beautifully" },
                { name: "Mustard and Deep Yellow", desc: "A classic for warm undertones; avoid neon yellow which reads cool" },
                { name: "Warm Olive Green", desc: "Earthy, harmonious, particularly flattering on golden Indian skin" },
                { name: "Deep Burnt Orange", desc: "Rich and warm — looks exceptional in silk like Kanjivaram or Banarasi" },
                { name: "Warm Burgundy", desc: "A red with brown-orange warmth — distinct from the blue-based burgundy that suits cool undertones" },
                { name: "Copper and Bronze", desc: "Metallic tones — ideal for festive and bridal wear with gold zari borders" },
                { name: "Camel and Warm Beige", desc: "Understated elegance — especially beautiful in chiffon and georgette" },
                { name: "Deep Chocolate Brown", desc: "Grounding and rich — best in silk weaves with gold thread detailing" },
              ].map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="font-semibold text-amber-900 mb-2">Zari and border guidance for warm undertone</p>
              <p className="text-amber-800 text-sm leading-relaxed">Gold zari is your strongest choice — it harmonises directly with warm skin. Antique gold (slightly muted) works beautifully for daywear. Avoid silver or white gold zari, which will create a subtle cool contrast that fights your undertone.</p>
            </div>
          </section>

          <section id="cool-undertone-sarees" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Saree Colours for Cool Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Cool undertone skin has a pink, blue, or rosy base. The most flattering saree colours have a blue-based or jewel-toned quality — they share the cool wavelength of your skin and make your complexion appear bright and luminous.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { name: "Cobalt and Royal Blue", desc: "The single most flattering colour for cool undertone — creates dramatic contrast and luminosity" },
                { name: "Emerald Green", desc: "Blue-based green — harmonises with cool undertones; avoid yellow-green which is warm" },
                { name: "Fuchsia and Hot Pink", desc: "Strong, striking, suits cool undertone far better than the orange-based warm pink" },
                { name: "Deep Plum and Purple", desc: "One of the most elegant choices for cool undertone — rich and jewel-toned" },
                { name: "Berry Red and Crimson", desc: "Blue-based reds — cool undertone women should avoid orange-based tomato red" },
                { name: "Teal", desc: "Blue-green — works beautifully for cool undertones, especially in silk" },
                { name: "Soft Lavender", desc: "Delicate and luminous — especially flattering in chiffon and georgette" },
                { name: "Cool White and Ivory", desc: "True white (not cream) — harmonises with cool undertones; cream reads warm" },
              ].map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="font-semibold text-blue-900 mb-2">Zari and border guidance for cool undertone</p>
              <p className="text-blue-800 text-sm leading-relaxed">Silver and white gold zari is your strongest choice. It harmonises with the cool base of your skin. Gold zari can work when paired with a cool-toned saree body colour, but silver will always be more precise. Avoid heavily antique-gold bordered sarees, which tend to look warm and slightly off against cool skin.</p>
            </div>
          </section>

          <section id="neutral-undertone-sarees" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Saree Colours for Neutral Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Neutral undertone women can wear both warm and cool colours — but look their best in muted, slightly greyed versions of both palettes rather than full-saturation extremes. The widest colour range of any undertone, but with specific saturation preferences.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { name: "Dusty Rose", desc: "Muted pink — sits between warm and cool, universally flattering for neutral undertone" },
                { name: "Muted Teal", desc: "Slightly greyed teal — neither fully warm nor fully cool, works beautifully" },
                { name: "Warm Taupe and Greige", desc: "Sophisticated neutral — elegant in silk georgette and tussar" },
                { name: "Soft Olive", desc: "Earthy muted green — flatters without the intensity of pure warm olive" },
                { name: "Mauve", desc: "Muted lavender-pink — a distinctive colour that is very hard to wear unless you have a neutral undertone" },
                { name: "Off-White and Cream", desc: "The middle ground between true white (cool) and warm beige — ideal for neutral" },
              ].map((c) => (
                <div key={c.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-gray-900 mb-2">Zari and border guidance for neutral undertone</p>
              <p className="text-gray-600 text-sm leading-relaxed">Both gold and silver zari look flattering on neutral undertones — this flexibility is one of the clearest markers of a neutral undertone. Rose gold is particularly flattering. Antique gold tends to be the most universally harmonious for neutral undertone in ethnic wear.</p>
            </div>
          </section>

          <section id="bridal-sarees" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bridal Sarees by Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Bridal saree colour is one of the most significant styling decisions an Indian woman makes. Most brides default to the traditional red — but the <em>shade</em> of red makes an enormous difference to how well it harmonises with your skin.
            </p>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-2">Warm undertone brides</p>
                <p className="text-gray-600 text-sm leading-relaxed">Deep terracotta-red, brick red, vermillion with warm orange tones, golden yellow, and warm burgundy. Gold zari, gold temple borders, copper embroidery. Kanjivaram in deep rust or warm red is a classic match.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-2">Cool undertone brides</p>
                <p className="text-gray-600 text-sm leading-relaxed">Deep crimson, berry red, wine, and plum-toned reds. Rich magenta, royal blue, and emerald for non-red bridal choices. Silver zari, white gold embroidery, platinum thread. Banarasi silk in deep jewel tones is particularly striking.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-2">Neutral undertone brides</p>
                <p className="text-gray-600 text-sm leading-relaxed">Muted deep red, dusty rose, off-white, mauve, or warm taupe for non-traditional brides. Antique gold embroidery and zari. Both warm and cool reds can work depending on which shade is more muted and less saturated.</p>
              </div>
            </div>
          </section>

    </RegisteredSeoArticle>
  );
}
