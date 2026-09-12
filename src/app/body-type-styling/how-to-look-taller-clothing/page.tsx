import {
  TrackedArticleCtaView,
  TrackedArticleLink,
} from "@/components/ArticleGrowthTracker";
import RegisteredSeoArticle from "@/components/seo/RegisteredSeoArticle";
import {
  SeoInsightCard,
  SeoTeachingVisual,
} from "@/components/seo/SeoEditorial";
import { buildSeoArticleMetadata, growthTrackingForArticle } from "@/lib/seoArticle";
import { getSeoArticle } from "@/lib/seoArticleRegistry";

const path = "/body-type-styling/how-to-look-taller-clothing";
const article = getSeoArticle(path);
const growthTracking = growthTrackingForArticle(article);
const proportionQuizHref =
  "/tools/proportion-code?source=seo_look_taller_article&article_id=how_to_look_taller_clothing&content_cluster=silhouette_proportions&audience=women&hook_type=vertical_continuity&visual_id=height_line_system&visual_variant=article";

export const metadata = buildSeoArticleMetadata(article);

const faqs = [
  {
    q: "Do vertical stripes actually make you look taller?",
    a: "They can reinforce an upward-downward direction, but they are only one tool. A clean trouser crease, open jacket, tonal column, uninterrupted kurta line, or well-placed seam can do the same job. Fit, line placement, and the number of colour breaks matter more than stripes alone.",
  },
  {
    q: "Can petite women wear wide-leg jeans or palazzos?",
    a: "Yes. Choose a rise that relates well to your torso, a waistband that sits cleanly, and a leg that falls from the hip without excessive gathering. Keep the hem long enough to complete the line but short enough to avoid pooling. Width is not the problem; uncontrolled volume and an unfinished hem are.",
  },
  {
    q: "Do I need heels to look taller in clothes?",
    a: "No. Heels add physical height, but the clothing effect comes from proportion and continuity. Flat shoes can preserve the line when their colour relates to the trouser, salwar, or visible skin and the upper does not create a heavy ankle break.",
  },
  {
    q: "What kurta length helps a shorter woman look taller?",
    a: "There is no universal centimetre. Compare where the hem lands against your leg and the width of the bottom. A straight knee-length or longer kurta often works well with a tonal straight bottom, while a hem at the widest calf can interrupt the line. Photograph the complete outfit, not the kurta alone.",
  },
  {
    q: "Can skinny jeans make the upper body look heavier?",
    a: "They can when the upper body carries more visual volume and the very narrow leg makes the lower half recede. A straight, soft bootcut, or wide-straight shape can restore balance. The point is not to hide the upper body; it is to keep enough visual weight below it.",
  },
  {
    q: "Can a saree create a taller impression?",
    a: "Yes. Tonal blouse-and-saree combinations, a clean vertical pallu fall, controlled pleat bulk, and a border scaled to the wearer can create continuity. Strong contrast at the blouse, waist, or broad horizontal border creates more visible divisions, but that may still be a deliberate aesthetic choice.",
  },
];

const rules = [
  ["Fit the shoulder", "A clear shoulder seam gives the eye a reliable starting point."],
  ["Locate the waist", "Use the rise, tuck, seam, or crop to show where the legs visually begin."],
  ["Reduce random breaks", "Repeat or relate colours across the waistband, ankle, and footwear."],
  ["Finish the hem", "Remove stacking and puddling that compress the lower line."],
  ["Choose one lead shape", "Let either the top or bottom carry volume instead of making every layer equally wide."],
  ["Use open verticals", "An unbuttoned shirt, jacket, long shrug, or controlled dupatta creates a central channel."],
  ["Scale the print", "Narrower repeats usually preserve continuity better than large horizontal motifs."],
  ["Keep detail intentional", "Place contrast, borders, belts, and embellishment where you want the eye to pause."],
  ["Connect the shoe", "Relate footwear to the trouser, salwar, saree hem, or visible skin."],
  ["Control garment length", "Judge hems against your own knee, calf, hip, and waist—not generic petite labels."],
  ["Protect the vertical fall", "Choose fabric that hangs cleanly instead of clinging, ballooning, or collapsing."],
  ["Photograph the full outfit", "A mirror crop hides the exact proportion decisions you need to evaluate."],
] as const;

export default function HowToLookTallerPage() {
  return (
    <RegisteredSeoArticle
      article={article}
      faqs={faqs}
      quickAnswer={
        <>
          To create a taller impression, make the body easier for the eye to read vertically:
          fit the shoulder, place the waist deliberately, let the lower half fall cleanly, and
          reduce colour or fabric breaks that divide the frame.
        </>
      }
      quickAnswerDetail={
        <>
          This is visual proportion, not body correction. You can use relaxed clothing, flats,
          Indian wear, and wide-leg trousers. The useful question is not “Does this item make me
          taller?” but “Where does this complete outfit start, stop, widen, and change direction?”
        </>
      }
      cta={{
        title: "Turn proportion guidance into outfits made for your measurements.",
        description:
          "Your ICONIK Blueprint maps rise, garment length, silhouette, colour, hair, eyewear, and 20 outfit formulas to your real wardrobe and lifestyle.",
      }}
    >
      <section id="start-with-proportions">
        <p className="seo-eyebrow">Start here</p>
        <h2>Looking Taller Is About Ratios, Not Rules for “Petite” Bodies</h2>
        <p>
          Two women can be the same height and need different clothing adjustments. One may have
          relatively longer legs and a shorter torso; the other may have a longer torso and a lower
          visual waist. Shoulder width, bust, hip width, and where garments naturally break also
          change what the eye notices.
        </p>
        <p>
          Before buying anything, take one straight, full-length photograph in a fitted top and
          simple trousers. Mark the shoulder, natural waist, crotch level, knee, and floor. You are
          not measuring whether your body is “correct.” You are locating the divisions that
          clothing can repeat, raise, lower, or blur.
        </p>
        <SeoInsightCard
          eyebrow="A better objective"
          title="Create a clear visual route"
          tone="bone"
        >
          <p>
            The eye should find a starting point, a dominant direction, and a clean finish. When
            every seam, layer, colour, and hem creates a new stop, the outfit feels compressed even
            when each item is individually flattering.
          </p>
        </SeoInsightCard>
      </section>

      <section id="vertical-continuity">
        <p className="seo-eyebrow">Mechanism 01</p>
        <h2>Build Vertical Continuity Without Dressing Head-to-Toe in One Colour</h2>
        <p>
          Monochrome works because it removes colour breaks, but it is not the only solution.
          Vertical continuity can come from a central opening, a trouser crease, a long lapel, a
          matching blouse and saree, a narrow print repeat, or colours that are close enough in
          value that the eye moves through them.
        </p>
        <p>
          Start with a column: top and bottom in the same or neighbouring colours. Then add one
          layer that remains open, one accessory near the face, or one contrast shoe. If you want
          colour blocking, place the strongest break at the visual waist you intend to create
          instead of letting an untucked hem choose it accidentally.
        </p>
        <ul>
          <li><strong>Strong continuity:</strong> navy top, navy straight trouser, open ivory jacket.</li>
          <li><strong>Soft continuity:</strong> cocoa kurta, mushroom trouser, bronze footwear.</li>
          <li><strong>Deliberate contrast:</strong> cropped shirt ending at a true high-rise waistband.</li>
          <li><strong>Unplanned interruption:</strong> long contrast top ending low over a low-rise bottom.</li>
        </ul>
      </section>

      <section id="waist-and-rise">
        <p className="seo-eyebrow">Mechanism 02</p>
        <h2>Use Waist Placement to Change Where the Legs Visually Begin</h2>
        <p>
          Rise is powerful because the waistband becomes a map line. A higher rise can lengthen the
          visible leg, but only if the waistband sits smoothly and the top allows it to be read. A
          bulky tuck can add width and shorten the torso so abruptly that the outfit loses balance.
        </p>
        <p>
          If you have a short torso, do not automatically choose the highest rise available. Test a
          clean mid-high rise, partial tuck, or tonal top so the waist is present without climbing
          into the ribcage. If you have a longer torso, a clearer high rise and shorter top can
          create a more useful leg-to-torso ratio.
        </p>
        <SeoTeachingVisual
          src="/images/seo/look-taller-waist-rise-placement-iconik.webp"
          alt="Indian woman with low, balanced, and high visual waist markers showing how trouser rise changes the apparent leg-to-torso ratio."
          caption="The best rise is the one that creates a balanced division on your body while keeping the waistband and tuck clean."
          width={1024}
          height={1536}
        />
        <h3>Run the three-rise test</h3>
        <ol>
          <li>Photograph the same top with low, mid-high, and high-rise bottoms.</li>
          <li>Keep the camera, posture, footwear, and hem length unchanged.</li>
          <li>Compare the leg-to-torso ratio and whether the waistband adds bunching.</li>
          <li>Choose the cleanest proportion—not simply the highest waistband.</li>
        </ol>
      </section>

      <section id="jeans-and-trousers">
        <p className="seo-eyebrow">Mechanism 03</p>
        <h2>Choose Jeans by Vertical Fall and Upper-to-Lower Balance</h2>
        <p>
          Skinny jeans are not automatically slimming. When the bust, shoulders, arms, or stomach
          carry more visual volume, an extremely narrow leg can make the lower body recede. The
          upper body then appears heavier by comparison. The fix is not simply “wear loose jeans”;
          it is to restore proportion.
        </p>
        <p>
          Start with a high-rise straight leg, soft bootcut, or wide-straight jean in a clean medium
          or dark wash. Look for a leg line that leaves the hip without excessive whiskering, holds
          its direction through the knee, and finishes without stacks. A centre crease or pressed
          front amplifies the same effect in tailored trousers.
        </p>
        <SeoTeachingVisual
          src="/images/seo/look-taller-jeans-vertical-fall-iconik.webp"
          alt="Same Indian woman in very narrow jeans and straight-fall jeans demonstrating how lower-body width changes overall visual balance."
          caption="Same body, different line: a controlled straight fall can balance the torso and preserve length without adding shapeless volume."
          width={1672}
          height={941}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <SeoInsightCard title="Check in the fitting room" tone="ivory">
            <ul>
              <li>Waistband lies flat without folding.</li>
              <li>Hip and thigh have no forced horizontal pull lines.</li>
              <li>Leg shape remains readable below the knee.</li>
              <li>Hem finishes at the shoe without a fabric pile.</li>
            </ul>
          </SeoInsightCard>
          <SeoInsightCard title="Search terms that help" tone="slate">
            <ul>
              <li>High-rise straight leg</li>
              <li>Full-length wide straight</li>
              <li>Soft bootcut, clean wash</li>
              <li>Flat-front tailored trouser</li>
            </ul>
          </SeoInsightCard>
        </div>
      </section>

      <section id="tops-and-layers">
        <p className="seo-eyebrow">Mechanism 04</p>
        <h2>Make Top Length, Shoulder Fit, and Layer Direction Work Together</h2>
        <p>
          Oversized clothing does not automatically make a shorter woman look shorter. The problem
          appears when all construction points become ambiguous: the shoulder drops, the sleeve
          pools, the top ends at the widest hip, the waist disappears, and the trouser stacks. The
          eye reads width because it cannot find direction.
        </p>
        <p>
          A relaxed outfit can remain generous while restoring three anchors: an intentional
          shoulder, a readable waist or vertical opening, and a finished hem. If the top is long and
          wide, keep the lower line cleaner. If the trouser is wide, use a top that ends or tucks at
          a deliberate point.
        </p>
        <SeoTeachingVisual
          src="/images/seo/look-taller-top-layer-hem-guide-iconik.webp"
          alt="Editorial guide comparing top hems at the waist, widest hip, and upper thigh with an open vertical layer."
          caption="Top length controls where the torso ends; an open layer can restore a vertical route without making the outfit tight."
          width={1122}
          height={1402}
        />
        <h3>Use the palm test for hems</h3>
        <p>
          Move the same top up and down in a mirror by one palm-width. Notice when the leg suddenly
          appears longer or the hip appears wider. That change tells you more than a generic “petite
          length” label because it is tied to your actual division points.
        </p>
      </section>

      <section id="indian-wear">
        <p className="seo-eyebrow">Indian wardrobe application</p>
        <h2>Use the Same Logic for Kurtas, Sarees, Palazzos, and Dupattas</h2>
        <p>
          Indian wear contains more line-making elements than most western outfits: kurta hems,
          side slits, dupattas, borders, pleats, blouse contrast, and jewellery. That gives you more
          tools, not more restrictions.
        </p>
        <SeoTeachingVisual
          src="/images/seo/look-taller-indian-wear-line-guide-iconik.webp"
          alt="Indian wear styling guide showing a tonal kurta set, vertical dupatta, controlled saree pallu, and full-length palazzo line."
          caption="Tonal columns, vertical drape, controlled borders, and a clean floorward fall translate proportion logic into Indian wear."
          width={1672}
          height={941}
        />
        <ul>
          <li>
            <strong>Kurta sets:</strong> compare the kurta hem with the side-slit start. A tonal
            bottom keeps the lower line visible through the slit.
          </li>
          <li>
            <strong>Palazzos:</strong> choose a clean waistband and a leg that falls from the hip;
            avoid excess gathering concentrated at the stomach.
          </li>
          <li>
            <strong>Sarees:</strong> use pleat control and pallu direction. A broad contrast border
            creates a horizontal stop; a quieter border continues the line.
          </li>
          <li>
            <strong>Dupattas:</strong> one long vertical fall usually creates more length than an
            evenly spread horizontal chest drape.
          </li>
          <li>
            <strong>Anarkalis:</strong> check where the flare begins and whether the scale of the
            skirt overwhelms the shoulder; floor length alone does not guarantee elongation.
          </li>
        </ul>
      </section>

      <section id="shopping-checklist">
        <p className="seo-eyebrow">Save this resource</p>
        <h2>The 60-Second Shopping-Room Checklist</h2>
        <SeoTeachingVisual
          src="/images/seo/look-taller-shopping-checklist-iconik.webp"
          alt="Saveable checklist for shoulder fit, waist placement, colour breaks, vertical fall, hem finish, and footwear continuity."
          caption="Evaluate the complete line from shoulder to floor before deciding whether one garment earns a place in your wardrobe."
          width={1024}
          height={1536}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {rules.map(([title, description], index) => (
            <div key={title} className="rounded-2xl border border-[#2c2622]/10 bg-[#f7f3ed] p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a7d4a]">
                Rule {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="!m-0 !text-xl">{title}</h3>
              <p className="!mt-2 !text-sm">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="seo-eyebrow">A note on language</p>
        <h2>Your Body Is Not the Before Picture</h2>
        <p>
          “Look taller” is an aesthetic choice, not an obligation. Shortness, width, curves, and
          softness are not styling errors. The same horizontal border or oversized silhouette that
          reduces vertical continuity may be exactly right when you want drama, width, or visual
          ease. Use these mechanisms to control the result—not to make every outfit chase one ideal.
        </p>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-[#27353b] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.16)]">
        <TrackedArticleCtaView tracking={growthTracking} />
        <div className="rounded-[1.8rem] border border-white/15 bg-white/10 p-7 text-white backdrop-blur-xl md:p-9">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#f0cb80]">
            Free proportion test
          </p>
          <h2 className="mb-3 !text-[#fffaf1]">Find where your height actually sits</h2>
          <p className="mb-6 max-w-2xl !text-white/70">
            The Proportion Code uses your height, waist-to-floor measurement, and inseam to show
            whether your visual length sits in your torso, legs, or a balanced split—then explains
            rise, tuck, and crop placement.
          </p>
          <TrackedArticleLink
            href={proportionQuizHref}
            tracking={growthTracking}
            className="inline-flex rounded-full bg-[#f0cb80] px-7 py-3 font-semibold text-[#27353b] no-underline transition hover:bg-[#f6d99e]"
          >
            Take the Free Proportion Code →
          </TrackedArticleLink>
        </div>
      </section>
    </RegisteredSeoArticle>
  );
}
