import Link from "next/link";
import RegisteredSeoArticle from "@/components/seo/RegisteredSeoArticle";
import { buildSeoArticleMetadata } from "@/lib/seoArticle";
import { getSeoArticle } from "@/lib/seoArticleRegistry";

const article = getSeoArticle("/body-type-styling/apple-body-shape-india");
export const metadata = buildSeoArticleMetadata(article);

const faqs = [
  {
    q: "What is the difference between apple and plus-size body shape?",
    a: "Plus-size refers to size — the clothing size range — not shape geometry. An apple body shape can be any size. Apple describes a proportional distribution: midsection wider than shoulders and hips, regardless of the overall size of the person. You can have an apple silhouette at a size 8 or a size 22.",
  },
  {
    q: "Can an apple body shape wear sarees?",
    a: "Yes. The key is draping method, blouse cut, and fabric. Side-pleat draping avoids adding bulk at the front. A structured blouse with slight shoulder definition and a boat or sweetheart neckline balances the silhouette upward. A shorter, padded-shoulder blouse creates upper body width that offsets the midsection.",
  },
  {
    q: "What kurta length is best for apple body shape?",
    a: "Hip-length — ending just below the hip at its widest point. This creates a clean vertical line without cutting the silhouette at the midsection. Longer kurtas (knee-length or floor-length Anarkali-style) also work if they maintain a straight or flared line without gathering at the waist.",
  },
  {
    q: "Is an apple body shape the same as having a tummy?",
    a: "Similar but not identical. An apple silhouette describes the overall proportional structure of the body. Dressing for a tummy is a subset — it addresses midsection styling specifically. An apple body shape guide covers the full outfit geometry, including lower body, upper body, and proportion balance — not just the midsection.",
  },
];

export default function AppleBodyShapeIndiaPage() {
  return (
    <RegisteredSeoArticle
      article={article}
      faqs={faqs}
      quickAnswer={<>An apple silhouette is defined by proportion—not clothing size—and benefits from clear shoulder direction, controlled drape, and uninterrupted vertical lines.</>}
      quickAnswerDetail={<>The goal is not to conceal the midsection. It is to give the whole outfit a deliberate structure so no single area carries all the visual emphasis.</>}
      cta={{
        title: "Map your real silhouette before choosing garment formulas.",
        description: "Geometric Silhouette Profiling identifies dominant and secondary proportions, then builds Indian and western outfits around them.",
      }}
    >
          <section id="define-apple-shape" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Defines an Apple Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              An apple silhouette is a broad styling description for a body that carries more visible emphasis through the middle relative to the hip line, often with proportionally slimmer legs. Bust, shoulder width, torso length, and where the waist sits can still vary substantially.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              ICONIK does not assign the category from one waist-to-hip threshold. The stylist compares shoulder, bust, waist, and hip relationships, torso length, limb proportion, photographs, and the way current garments fit.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The label is not a diagnosis and does not explain why the body has this distribution. Use it only when it helps you test garment shape, drape, and hem placement; discard any rule that conflicts with comfort or preference.
            </p>
          </section>

          <section id="identify-apple-shape" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Is Apple Body Shape Identified in Indian Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A single measurement can miss the relationship between shoulder line, bust, waist, hip, and torso length. Many people also sit between broad shape descriptions—for example, with midsection emphasis and a narrower shoulder line.
            </p>
            <p className="text-gray-600 leading-relaxed">
              GSP™ records a primary and secondary pattern when that is useful, then translates the observation into options rather than forcing a binary category. Read the <Link href="/methodology/geometric-silhouette-profiling" className="underline">canonical methodology page</Link> for the framework&apos;s scope and limitations.
            </p>
          </section>

          <section id="apple-ethnic-wear" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Best Indian Ethnic Wear for an Apple Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Anarkali suits</strong> can work when the yoke sits comfortably and the flare begins from a deliberate point rather than adding tight gathering at the stomach. For work, test a restrained flare in breathable fabric and a length that suits your dress code.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Straight-cut kurtas</strong> at hip length worn over cigarette trousers or straight-leg salwars create a clean vertical line from shoulder to hem. The kurta must end at or just below the hip — not at the midsection.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Anarkali suits with fitted yoke and full flare</li>
              <li>Straight-cut hip-length kurtas over straight trousers</li>
              <li>Palazzo sets in solid colours</li>
              <li>Floor-length kaftans (casual occasions)</li>
              <li>Sarees with side-pleat draping and structured blouse</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Test carefully:</strong> short kurtis ending at the fullest point, tight horizontal embellishment at the waist, cropped layers that stop where you do not want emphasis, and bulky front pleating. These are adjustment prompts, not prohibited garments.
            </p>
          </section>

          <section id="apple-western-wear" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Best Western Wear for an Apple Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Wide-leg trousers</strong> with a structured blazer worn open creates a strong vertical line. The blazer lapels frame the chest and draw attention upward. <strong>Wrap blouses</strong> that cross under the bust (empire-waist-adjacent cut) create a visual waist above the midsection.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Straight or wide-leg trousers with a structured open blazer</li>
              <li>Wrap blouses crossing under the bust</li>
              <li>V-neck and boat-neck tops (upward focal points)</li>
              <li>A-line midi skirts with a structured fitted top</li>
              <li>Shift dresses in structured fabric (not jersey)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Test carefully:</strong> cropped jackets that stop at the fullest point, very tight tucks, rigid waistbands, and high-contrast horizontal breaks. Any of these can still work when the fit, fabric, and rest of the outfit create enough direction.
            </p>
          </section>

          <section id="apple-saree" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Should an Apple Body Shape Wear a Saree?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A tightly packed Nivi pleat can add fabric at the front waist. If that placement feels bulky, reduce the number or thickness of pleats, shift them slightly, or choose a more fluid saree. There is no need to abandon the Nivi drape.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Better draping options:</strong> Side-pleat style (pleats to the side rather than straight front). Box-pleat Gujarati drape. Seedha pallu with minimal front pleating. The goal is to reduce the volume of fabric sitting at the front of the waist.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Blouse:</strong> Boat neck or sweetheart neck in structured fabric (crepe, dupion). Slightly padded shoulders to balance the width upward. Full-length or 3/4 sleeve. A structured, fitted blouse with shoulder definition is the most flattering frame for an apple silhouette in a saree.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Colours and Prints Work for an Apple Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Use colour to create hierarchy rather than assuming the midsection must be dark. Tonal dressing can extend the line; a brighter neckline can draw the eye upward; and a deliberate lower-body colour can distribute emphasis across the outfit.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Test carefully:</strong> large horizontal motifs at the waist, high-shine fabric across a tight area, or a sharp contrast line at the fullest point. If you enjoy them, adjust scale, placement, or the surrounding silhouette instead of treating them as forbidden.
            </p>
          </section>

    </RegisteredSeoArticle>
  );
}
