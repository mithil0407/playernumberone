import { TrackedArticleLink } from "@/components/ArticleGrowthTracker";
import RegisteredSeoArticle from "@/components/seo/RegisteredSeoArticle";
import { SeoInsightCard, SeoTeachingVisual } from "@/components/seo/SeoEditorial";
import { buildSeoArticleMetadata, growthTrackingForArticle } from "@/lib/seoArticle";
import { getSeoArticle } from "@/lib/seoArticleRegistry";
import { BLUEPRINT_OFFER } from "@/lib/siteFacts";

const path = "/style-guides/diwali-outfit-body-type";
const article = getSeoArticle(path);
const tracking = growthTrackingForArticle(article);
const trackedQuery = new URLSearchParams({
  source: tracking.content_source,
  article_id: tracking.article_id,
  content_cluster: tracking.content_cluster,
  audience: tracking.audience,
  hook_type: tracking.hook_type,
  visual_id: tracking.visual_id ?? "diwali_outfit_formula",
  visual_variant: tracking.visual_variant ?? "article_4x5",
}).toString();

export const metadata = buildSeoArticleMetadata(article);

const faqs = [
  {
    q: "Which Diwali outfit works if I do not know my body type?",
    a: "Start with the event and one garment you already enjoy wearing. A straight kurta set, a well-fitted saree blouse with a manageable pallu, or a softly structured anarkali can all work. Check shoulder fit, where the fabric widens, and whether you can sit and move comfortably before worrying about a label.",
  },
  {
    q: "Can I wear a saree if I have a fuller midsection?",
    a: "Yes. Try a smooth, comfortable petticoat waistband, flatter front pleats, and a pallu direction you like. A blouse with enough room to move matters more than a prescribed neckline. Saree fabric and drape can be adjusted around your preference; no body shape rules it out.",
  },
  {
    q: "Is a lehenga or anarkali easier for a Diwali puja?",
    a: "The easier option is the one you can sit in and manage without repeatedly fixing it. Test a lehenga waistband while seated, the dupatta placement, and the skirt hem near lamps. An anarkali removes a separate skirt waistband, but its length and flare still need a movement check.",
  },
  {
    q: "Do I need a new outfit for Diwali?",
    a: "No. A well-fitted kurta with a festive dupatta, a re-stitched blouse for a saree you own, or fresh jewellery and footwear can create a complete look. Spend first on a fit change that makes an existing garment wearable; shop only for the missing piece.",
  },
  {
    q: "Can I wear a western outfit to a Diwali party?",
    a: "Yes, when the host's dress code allows it. Tailored trousers and a festive blouse, a satin skirt and structured jacket, or a dress with Indian jewellery can suit a dinner or office party. If a family puja is involved, ask the host what they expect and plan a simple layer or change of outfit.",
  },
];

export default function DiwaliOutfitBodyTypePage() {
  return (
    <RegisteredSeoArticle
      article={article}
      faqs={faqs}
      quickAnswer={
        <>
          A Diwali outfit by body type begins with the line you want to create, not a compulsory
          garment. For a balanced look, place detail where you want the eye to travel, choose a
          fabric that holds or falls as intended, and check the fit while sitting. A saree, kurta
          set, lehenga or fusion outfit can work for every shape.
        </>
      }
      quickAnswerDetail={
        <>
          Choose the celebration first: a home puja, a full evening of visiting, and an office
          party ask different things of the same outfit. Shape words are useful shortcuts, not
          verdicts about what you are allowed to wear.
        </>
      }
      cta={{
        title: "Build a festive outfit from your own proportions and preferences.",
        description: `The ${BLUEPRINT_OFFER.name} pairs a consultation with ${BLUEPRINT_OFFER.outfitFormulas} outfit formulas, a colour palette and practical styling guides.`,
        href: `${BLUEPRINT_OFFER.offerPath}?${trackedQuery}`,
        label: "Explore the Blueprint",
      }}
    >
      <section id="choose-occasion">
        <h2>What are you dressing for on Diwali?</h2>
        <p>
          Diwali outfit by body type is a useful search, but the occasion is the first decision.
          You may be hosting a puja, visiting relatives in the afternoon, travelling between
          homes, or going straight from work to dinner. Choose an outfit that lets you do those
          things. Ask your host about any family or religious dress expectations; they vary, and
          there is no single colour or garment rule for every celebration.
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Plan</th><th>Easy starting outfit</th><th>Check before leaving</th></tr></thead>
            <tbody>
              <tr><td>Home puja</td><td>Saree or kurta set with a secure pallu or dupatta</td><td>Sit on the floor; keep loose hems clear of lamps</td></tr>
              <tr><td>Visits across town</td><td>Light salwar suit, straight kurta set or soft anarkali</td><td>Walk, climb stairs and sit in a car</td></tr>
              <tr><td>Evening dinner</td><td>Lehenga, dressy saree, sharara or fusion separates</td><td>Try the full outfit after dinner, including footwear</td></tr>
              <tr><td>Office party</td><td>Festive jacket, blouse or kurta with tailored trousers</td><td>Match the invitation and your workplace</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          If you need one outfit for several stops, begin with a comfortable base and change one
          element: jewellery, dupatta, jacket or footwear. A neatly finished kurta and trousers
          can feel relaxed for a home visit and more polished with an embroidered layer for dinner.
        </p>
      </section>

      <section id="shape-choice">
        <h2>How can body shape guide a Diwali outfit without restricting it?</h2>
        <p>
          Look at shoulder, waist and hip relationships in a full-length photograph of an outfit
          you already like. The aim is to decide where you want visual weight and where you want
          a clean fall. A shape label cannot tell you your height, preferred fit, mobility needs
          or how a particular fabric behaves. ICONIK uses Geometric Silhouette Profiling™ as a
          styling framework for these choices; the <a href="/methodology/geometric-silhouette-profiling">methodology guide</a> explains its scope and limits.
        </p>
        <ul>
          <li><strong>Fuller through the middle:</strong> test a smooth front panel, a softly shaped kurta or a saree with flat pleats. Put detail at the neckline or pallu if you enjoy that direction.</li>
          <li><strong>Hips wider than shoulders:</strong> a worked blouse, textured dupatta or shoulder detail can bring the eye upward. Keep the skirt as full or quiet as you prefer.</li>
          <li><strong>Straighter waist:</strong> use a seam, belt, blouse hem or contrast to mark a waist if you want one. A straight unbroken column is equally valid.</li>
          <li><strong>Waist more defined:</strong> decide whether to show that line with a fitted blouse or let a relaxed garment fall past it. Fit at the bust and hip still matters.</li>
          <li><strong>Shoulders wider than hips:</strong> embroidery or volume lower down can balance the frame if that is your goal. A strong shoulder can also be the lead feature.</li>
        </ul>
        <SeoInsightCard title="A better fitting-room question" tone="bone">
          <p>Where does this outfit widen, narrow, and stop? Then ask whether those points make the complete look feel intentional to you.</p>
        </SeoInsightCard>
        <SeoTeachingVisual
          src="/images/seo/diwali-outfit-fabric-line-comparison-iconik.webp"
          alt="Illustration of one Indian woman in two festive kurta sets showing how fabric volume and dupatta direction alter the outfit line."
          caption="Illustration: changing fabric volume and dupatta direction changes the outline on the same body; neither version is a rule."
          width={900}
          height={1350}
        />
      </section>

      <section id="garment-formulas">
        <h2>Which saree, kurta, lehenga and salwar formulas are worth trying?</h2>
        <p>
          Begin with the garment you can wear for the whole event. Then change one variable at a
          time: blouse fit, waist placement, skirt flare or dupatta route. These formulas give
          you a testable starting point rather than a fixed “best outfit” for a body type.
        </p>
        <h3>Saree: blouse fit + pleat volume + pallu direction</h3>
        <p>
          A blouse should let you raise your arms and sit without pulling. Pin the saree at the
          height you will actually wear it; moving the waistband later changes the whole line.
          Flatten front pleats if you want a cleaner centre, or let them hold more volume if you
          like that shape. Compare a narrow pallu, a diagonal fall and an open shoulder drape in
          the same mirror and light. For more detail, use the <a href="/style-guides/saree-draping-body-type">saree draping guide</a>.
        </p>
        <SeoTeachingVisual
          src="/images/seo/diwali-saree-pallu-directions-iconik.webp"
          alt="Illustration comparing three pallu directions on the same Indian woman to show how vertical, diagonal and open drapes change visual emphasis."
          caption="Illustration: compare pallu direction on the same saree before changing fabric or blouse; the line often matters more than the shape label."
          width={1200}
          height={800}
        />
        <h3>Kurta or salwar: shoulder + hem + bottom width</h3>
        <p>
          A straight kurta with a clean shoulder and side slits is easy to restyle. Try it with
          straight trousers for one continuous line, or a sharara for movement and greater width
          below. A shorter kurta exposes more of a wide bottom; a longer hem makes the kurta the
          main shape. If the dupatta is heavily worked, let it be the focal point and keep the
          kurta surface calmer. The <a href="/style-guides/salwar-kameez-body-type">salwar kameez guide</a> explores these pairings.
        </p>
        <h3>Lehenga or anarkali: waistband + flare + movement</h3>
        <p>
          On a lehenga, check the waistband while standing and sitting. A simple skirt with a
          detailed blouse moves attention upward; a quieter blouse with a patterned skirt moves
          it lower. For an anarkali, look at where the flare begins and whether the hem clears
          your shoes. Neither garment belongs to one shape. If you like a full skirt, wear it;
          adjust the blouse and dupatta until the outfit feels balanced to you.
        </p>
        <p>
          Try two complete outfits before making a decision. For a family visit, pair a rust
          straight kurta with cream trousers, a light dupatta falling from one shoulder, small
          earrings and flat juttis. Change the colour to one that suits your wardrobe; the useful
          part is the controlled line and easy movement. For an evening dinner, try a plain
          lehenga skirt with a richly worked blouse and a dupatta pinned at one shoulder. This
          directs the eye toward the face while allowing the skirt to move. If you prefer the
          skirt as the statement, reverse the embroidery placement. Photograph both versions
          at the same distance instead of judging them from separate product photographs.
        </p>
        <SeoTeachingVisual
          src="/images/seo/diwali-outfit-formula-flatlay-iconik.webp"
          alt="Illustrated flat lay of a saree, kurta set and lehenga showing three practical Diwali garment formulas with matching fabrics."
          caption="Three starting formulas: saree plus fitted blouse, kurta plus trousers and dupatta, or lehenga plus a deliberate blouse contrast."
          width={1200}
          height={800}
        />
      </section>

      <section id="fabric-climate">
        <h2>Which fabrics work for your climate and the length of the celebration?</h2>
        <p>
          Fabric changes the silhouette as much as a cut does. Crisp organza stands away from the
          body; soft cotton silk and drapey crepe fall closer. A heavily gathered skirt adds more
          volume than a smooth A-line skirt in the same colour. Hold a fabric at the waist and
          shoulder before you buy it so you can see whether it makes the line you want.
        </p>
        <p>
          In a warm or humid city, look for breathable linings, manageable layers and sleeves you
          can move in. In a cooler evening, add a shawl, light jacket or heavier fabric without
          sacrificing movement. Air-conditioned offices and crowded homes may feel different from
          the weather outside. Try your outfit in the setting you expect, not just under a fitting
          room light.
        </p>
        <p>
          For a puja, check that the hem and dupatta stay away from diyas and that you can sit and
          stand easily. For travel, test the outfit in a chair and with your bag. Beadwork and net
          can catch on jewellery or seating; run a hand over the surface and inspect the lining.
        </p>
      </section>

      <section id="colour-and-fusion">
        <h2>How do colour, jewellery and western wear fit the look?</h2>
        <p>
          Choose a colour you enjoy near your face, then test it in daylight and evening light.
          Skin depth alone does not assign a palette. If you use Chromatic Harmony Mapping™,
          treat it as a styling framework and read the <a href="/methodology/chromatic-harmony-mapping">colour methodology</a> rather than treating any shade as forbidden.
          Our <a href="/colour-analysis/how-to-find-undertone">undertone guide</a> shows how to compare fabric drapes at home.
        </p>
        <p>
          A western or fusion outfit can be festive without trying to imitate a lehenga: pair a
          tailored waistcoat with wide-leg trousers and gold earrings, or a satin skirt with a
          blouse and a soft Indian dupatta. Keep one focal point. If the jacket is embroidered,
          choose simpler jewellery; if the clothing is plain, bring attention to the face with
          earrings or a necklace. Follow your host&apos;s dress expectations when a puja is part of
          the event.
        </p>
        <SeoTeachingVisual
          src="/images/seo/diwali-outfit-shape-options-iconik.webp"
          alt="Illustration of four Indian women in lehenga, anarkali, kurta set and festive tailoring showing varied proportions and styling preferences."
          caption="Illustration: festive dressing can use Indian wear or tailored separates across a wide range of skin depths and body proportions."
          width={1200}
          height={800}
        />
      </section>

      <section id="shop-and-check">
        <h2>How can you shop and check the outfit without overspending?</h2>
        <p>
          Start with your wardrobe. A changed blouse fit, fresh lining, adjusted kurta hem or
          different dupatta may do more than a new outfit. If you buy one piece, choose the gap
          you cannot solve at home. Browse broad marketplaces such as Myntra, Ajio or Nykaa
          Fashion for cut and fabric ideas, then compare them with local shops or a tailor who
          can adjust shoulder, sleeve and hem. Check return and alteration terms before ordering.
        </p>
        <p>
          Give the outfit a budget before opening a shopping app. Divide it into garment,
          alteration, footwear and accessories; an inexpensive garment with poor fit may need
          more work than a slightly dearer one that fits the shoulder. If the budget is tight,
          reuse the most expensive piece you own and change only the piece near the face or
          the garment that is uncomfortable. Ask a local tailor for an alteration quote before
          replacing a saree blouse or kurta. When shopping online, filter first by fabric and
          care instructions, then inspect garment measurements rather than relying on a size
          label. A festive look is easier to repeat when each piece also works separately.
        </p>
        <ol>
          <li>Photograph the complete outfit from the front and side, with the intended shoes.</li>
          <li>Sit, reach, walk, climb stairs and carry the bag you will use.</li>
          <li>Check the waistband, blouse armhole, skirt hem and dupatta security.</li>
          <li>Keep one main visual direction and change only one item if the look feels busy.</li>
        </ol>
        <p>
          If you want help locating your proportions, try the free <TrackedArticleLink
            href={`/tools/silhouette-scan?${trackedQuery}`}
            tracking={tracking}
          >silhouette scan</TrackedArticleLink>. It is a styling starting point, not a diagnosis. For
          broader body-shape guidance, visit the <a href="/body-type-styling">body type styling hub</a>.
        </p>
      </section>
    </RegisteredSeoArticle>
  );
}
