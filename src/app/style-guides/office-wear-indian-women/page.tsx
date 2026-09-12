import RegisteredSeoArticle from "@/components/seo/RegisteredSeoArticle";
import { buildSeoArticleMetadata } from "@/lib/seoArticle";
import { getSeoArticle } from "@/lib/seoArticleRegistry";

const article = getSeoArticle("/style-guides/office-wear-indian-women");
export const metadata = buildSeoArticleMetadata(article);

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
  return (
    <RegisteredSeoArticle
      article={article}
      faqs={faqs}
      quickAnswer={<>Professional dressing begins with fit and context—not with choosing between ethnic and western clothing.</>}
      quickAnswerDetail={<>Use clean construction, climate-appropriate fabric, a controlled colour palette, and an outfit formula that supports your silhouette and workplace culture.</>}
      cta={{
        title: "Build a professional wardrobe that already works together.",
        description: "Your Iconik Style Blueprint includes office outfit formulas calibrated to your silhouette, undertone, role, and real dress code.",
      }}
    >
          <section id="why-generic-advice-fails" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Does Generic Work Fashion Advice Fail Indian Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Western workwear guides assume air-conditioned offices with European temperatures, western garment categories, and a limited size range. Indian professional culture spans a much wider spectrum: traditional corporate (law, banking, government) where sarees and Anarkalis are appropriate daily; tech-startup culture (smart casual); and multinational corporate (western-leaning with occasional formal).
            </p>
            <p className="text-gray-600 leading-relaxed">
              Body-type styling matters even more in the workplace — fit is directly linked to the perception of professionalism. Ill-fitting clothes read as careless, regardless of how formal the garment is. A well-fitted kurta looks more professional than a poorly fitted blazer.
            </p>
          </section>

          <section id="body-type-formulas" className="mb-12">
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

          <section id="ethnic-office-wear" className="mb-12">
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

          <section id="western-office-wear" className="mb-12">
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

          <section id="professional-colours" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Colours Work Best for Indian Office Wear?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Build your professional wardrobe from your Chromatic Harmony Mapping™ palette. An understated professional palette has: 2–3 neutrals as the wardrobe foundation (navy, charcoal, camel, or cream depending on undertone), and 2–3 accent colours for statement pieces.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Prints for office wear: small repeating geometric prints, fine stripes, subtle paisleys. Avoid: oversized florals, logo prints, neon, animal prints. The principle: the outfit should support the professional impression, not compete with it.
            </p>
          </section>

          <section id="professional-capsule" className="mb-12">
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

    </RegisteredSeoArticle>
  );
}
