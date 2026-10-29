/**
 * The women's report style library: what the report says for each fixed
 * category, written once and approved by the styling team.
 *
 * The model only picks the categories (body shape, face shape, undertone).
 * Every page drawn from this library follows that pick, so when a stylist
 * changes Apple to Pear, all of it changes with it. Keep every line short and
 * in plain English: one idea, no styling jargon.
 */

export const BODY_SHAPE_KEYS = ['hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle'] as const;
export type BodyShapeKey = typeof BODY_SHAPE_KEYS[number];

export const FACE_SHAPE_KEYS = ['oval', 'round', 'square', 'heart', 'oblong'] as const;
export type FaceShapeKey = typeof FACE_SHAPE_KEYS[number];

export const UNDERTONE_KEYS = ['warm', 'cool', 'neutral'] as const;
export type UndertoneKey = typeof UNDERTONE_KEYS[number];

/** The clothing pages, in reading order. Four cards each, per body shape. */
export const GUIDE_CATEGORIES = [
  { key: 'tops', title: 'Tops for you' },
  { key: 'bottoms', title: 'Bottoms for you' },
  { key: 'dresses', title: 'Dresses & Indian wear' },
  { key: 'layers', title: 'Jackets & layers' },
  { key: 'footwear', title: 'Footwear for you' },
] as const;
export type GuideCategoryKey = typeof GUIDE_CATEGORIES[number]['key'];

export type LibraryCard = {
  /** Stable id; also the image file name. */
  id: string;
  name: string;
  /** One short line: why it works on this shape. */
  line: string;
  /** What the picture shows, for drawing it. Not shown to the client. */
  look: string;
};

/**
 * A mark drawn over a styling-goal picture, like the lines on her own body
 * analysis. Positions are shares of the picture's width (x) and height (y),
 * set by eye for each picture so they land on the waist, hem or shoulders.
 *   vertical: one long line, top to bottom
 *   level:    a dashed line across one height (a waist or seam)
 *   span:     a width marker with end caps (shoulders, hips, a hem)
 */
export type GoalMark =
  | { kind: 'vertical'; x: number; from: number; to: number; label: string }
  | { kind: 'level' | 'span'; y: number; from: number; to: number; label: string };

export type GoalCard = LibraryCard & { marks: GoalMark[] };

export type BodyShapeEntry = {
  label: string;
  /** One sentence the client reads under her shape. */
  summary: string;
  /** How the picture model is built, so every image for this shape shows the same body. */
  model: string;
  goals: [GoalCard, GoalCard];
  skip: string[];
  guides: Record<GuideCategoryKey, [LibraryCard, LibraryCard, LibraryCard, LibraryCard]>;
  /** Four fabrics that work on this shape. `id` names the shared fabric picture. */
  fabrics: [LibraryCard, LibraryCard, LibraryCard, LibraryCard];
  fabricSkip: string[];
};

const card = (id: string, name: string, line: string, look: string): LibraryCard => ({ id, name, line, look });
const goal = (id: string, name: string, line: string, look: string, marks: GoalMark[]): GoalCard => ({ id, name, line, look, marks });
/** A fabric card: its picture is shared by every shape that lists it. */
const fabric = (id: FabricKey, line: string): LibraryCard => ({ id, name: FABRIC_LIBRARY[id].name, line, look: FABRIC_LIBRARY[id].look });

/** Each fabric drawn once, as a macro close-up with no person in it. */
export const FABRIC_LIBRARY = {
  matte_crepe: { name: 'Matte crepe', look: 'matte crepe in a dusty taupe, smooth with a fine grainy surface' },
  georgette: { name: 'Georgette', look: 'sheer, lightweight georgette in a soft blush pink, slightly crinkled' },
  viscose: { name: 'Viscose', look: 'soft, fluid viscose (rayon) in a muted sage green with a gentle sheen' },
  cotton_mulmul: { name: 'Cotton mulmul', look: 'fine, airy cotton mulmul in warm ivory, soft and slightly sheer' },
  cotton_poplin: { name: 'Cotton poplin', look: 'crisp cotton poplin in pale sky blue, smooth with crisp folds' },
  ponte_knit: { name: 'Ponte knit', look: 'thick, smooth ponte knit in deep navy, folding in soft rounded folds' },
  chanderi: { name: 'Chanderi', look: 'chanderi silk-cotton in pale gold with a soft natural sheen and a fine woven texture' },
  fine_jersey: { name: 'Fine jersey', look: 'fine cotton-modal jersey knit in charcoal grey, soft and stretchy' },
  silk_crepe: { name: 'Silk crepe', look: 'silk crepe de chine in deep wine, fluid with a soft lustre' },
  stretch_denim: { name: 'Stretch denim', look: 'dark indigo stretch denim with a visible twill weave' },
  linen: { name: 'Linen', look: 'natural oatmeal linen with visible slubs and soft creases' },
  tweed: { name: 'Textured tweed', look: 'cream and black boucle tweed with a nubby woven texture' },
  organza: { name: 'Organza', look: 'crisp silk organza in champagne, translucent and holding stiff sculpted folds' },
  crinkle_cotton: { name: 'Crinkle cotton', look: 'crinkled cotton in terracotta with a crushed, textured surface' },
} as const satisfies Record<string, { name: string; look: string }>;
export type FabricKey = keyof typeof FABRIC_LIBRARY;

export function fabricImagePath(id: string) {
  return `/report-library/fabrics/${id}.webp`;
}

export const BODY_SHAPE_LIBRARY: Record<BodyShapeKey, BodyShapeEntry> = {
  apple: {
    label: 'Apple',
    summary: 'You carry more through your middle, with slimmer legs. Long lines and a lifted waist suit you best.',
    model: 'an Indian woman with an apple body shape (about UK size 16-18): fuller bust and a fuller, rounded midsection with little waist definition, flatter hips, and slimmer legs',
    goals: [
      goal('goal-1', 'Wear one long line', 'One colour from top to toe, or an open jacket, makes you look taller and slimmer.', 'a head-to-toe tonal camel outfit: camel knit top, matching camel straight trousers and an open longline camel cardigan falling to mid-thigh, nude block heels', [
        { kind: 'vertical', x: 0.47, from: 0.03, to: 0.92, label: 'One unbroken line' },
      ]),
      goal('goal-2', 'Mark under the bust', 'Pick tops and dresses that go in just under the bust and flow over the tummy.', 'a navy empire-line midi dress with a gathered seam just under the bust and a soft flowing skirt, tan sandals', [
        { kind: 'level', y: 0.21, from: 0.22, to: 0.78, label: 'Seam under the bust' },
      ]),
    ],
    skip: ['Tight tops that cling to the middle', 'Thick belts at the natural waist', 'Cropped tops and boxy short jackets'],
    fabrics: [
      fabric('matte_crepe', 'Drapes over the middle without clinging.'),
      fabric('georgette', 'Light and flowing, so it moves away from the body.'),
      fabric('viscose', 'Soft and fluid, so tops skim the tummy.'),
      fabric('cotton_mulmul', 'Breathable and soft for kurtas and everyday tops.'),
    ],
    fabricSkip: ['Thin, clingy lycra or jersey', 'Stiff, heavy brocade around the middle'],
    guides: {
      tops: [
        card('tops-1', 'V-neck tops', 'The deep V draws the eye up and makes your top half look longer.', 'a soft ivory V-neck top with a deep V, untucked, hip length, worn with black straight trousers'),
        card('tops-2', 'Wrap tops', 'The cross-over skims your middle and shapes a waist where you want one.', 'a terracotta wrap top tied at the side, hip length, worn with dark blue straight jeans'),
        card('tops-3', 'Peplum tops', 'Fitted above the waist, then flares softly over the tummy.', 'a black peplum top with a fitted bodice and a soft flared peplum ending at the hip, worn with camel straight trousers'),
        card('tops-4', 'Long tunics', 'Falling past the hip, they skim the middle without clinging.', 'an olive green straight tunic shirt with side slits ending at mid-thigh, worn with black slim trousers'),
      ],
      bottoms: [
        card('bottoms-1', 'Straight-leg trousers', 'One clean line from waist to floor makes your legs look longer.', 'high-rise straight-leg trousers in camel crepe with a flat front and pressed crease, worn with a black tucked top'),
        card('bottoms-2', 'Bootcut jeans', 'The small flare at the hem balances your top half.', 'dark indigo high-rise bootcut jeans, worn with an untucked white shirt'),
        card('bottoms-3', 'Fluid wide-leg pants', 'Soft fabric moves away from the body, so the middle is not the focus.', 'navy fluid wide-leg pants with a flat elastic-back waistband, worn with an ivory blouse'),
        card('bottoms-4', 'A-line midi skirts', 'Shows off your slimmer legs and skims the hips.', 'a chocolate brown A-line midi skirt, worn with a tucked-out black V-neck top'),
      ],
      dresses: [
        card('dresses-1', 'Empire-line dresses', 'The seam under the bust lifts the waist and flows over the middle.', 'a teal empire-line knee-length dress with short flutter sleeves'),
        card('dresses-2', 'Wrap dresses', 'The V-neck and side tie shape you without clinging.', 'a rust wrap midi dress with three-quarter sleeves and a side tie'),
        card('dresses-3', 'Straight kurta with slits', 'Long side slits keep the line long and easy over the middle.', 'a long straight ivory cotton kurta with high side slits, worn with matching straight pants and a light dupatta over one shoulder'),
        card('dresses-4', 'Anarkali with empire seam', 'Fitted just under the bust, then flows out to the floor.', 'a deep plum empire-waist Anarkali kurta falling below the knee, worn with matching slim pants'),
      ],
      layers: [
        card('layers-1', 'Longline open blazers', 'Worn open, they draw two long lines down the front.', 'an open longline beige blazer ending at mid-thigh over a black top and black straight trousers'),
        card('layers-2', 'Long cardigans', 'Soft and open, they add length and hide nothing awkwardly.', 'an open long olive knit cardigan reaching the knee over a white top and dark jeans'),
        card('layers-3', 'Nehru jackets', 'The straight cut and open front add structure without bulk.', 'an open navy printed Nehru jacket over a plain maroon straight kurta and pants'),
        card('layers-4', 'Shirt jackets', 'Worn open like a layer, they frame the body in a straight line.', 'an open light denim shirt jacket over a black dress, hip length'),
      ],
      footwear: [
        card('footwear-1', 'Pointed flats', 'A pointed toe makes your legs look longer, even with no heel.', 'black pointed-toe ballet flats'),
        card('footwear-2', 'Block heels', 'Steady height that lifts the whole line.', 'tan suede block-heel pumps with a 2-inch heel'),
        card('footwear-3', 'Nude slingbacks', 'Skin-tone shoes carry the leg line down to the floor.', 'nude pointed slingback kitten heels'),
        card('footwear-4', 'Ankle boots', 'A slim boot under straight trousers keeps the line clean.', 'black sleek ankle boots with a low block heel under straight trousers'),
      ],
    },
  },
  pear: {
    label: 'Pear',
    summary: 'Your hips are wider than your shoulders, with a clear waist. Detail on top and clean lines below balance you.',
    model: 'an Indian woman with a pear body shape (about UK size 12 top and 16 bottom): narrower shoulders and smaller bust, a clearly defined waist, and fuller hips and thighs',
    goals: [
      goal('goal-1', 'Colour and detail on top', 'Wear your brighter colours, prints and sleeve details on your top half.', 'a bright coral puff-sleeve blouse with a boat neckline tucked into dark navy straight trousers, nude heels', [
        { kind: 'span', y: 0.12, from: 0.21, to: 0.79, label: 'Wider on top' },
        { kind: 'span', y: 0.34, from: 0.27, to: 0.71, label: 'Balances the hips' },
      ]),
      goal('goal-2', 'Plain and dark below', 'Keep trousers and skirts simple and darker, so they skim your hips.', 'a printed ivory and blue top tucked into a plain black A-line midi skirt, black block heels', [
        { kind: 'vertical', x: 0.86, from: 0.23, to: 0.76, label: 'Plain, dark skirt' },
      ]),
    ],
    skip: ['Skinny jeans with a short top', 'Hip pockets, prints or shine on bottoms', 'Narrow straps and tiny necklines'],
    fabrics: [
      fabric('cotton_poplin', 'Crisp shape on top balances your hips.'),
      fabric('matte_crepe', 'Smooth trousers and skirts that skim the hips.'),
      fabric('ponte_knit', 'Thick, smooth knit that keeps bottoms clean.'),
      fabric('chanderi', 'A light sheen for kurtas and festive tops.'),
    ],
    fabricSkip: ['Shiny satin on trousers or skirts', 'Thick, bulky fabrics on the bottom half'],
    guides: {
      tops: [
        card('tops-1', 'Boat necks', 'A wide neckline makes your shoulders look broader.', 'an ivory boat-neck fitted top tucked into dark straight jeans'),
        card('tops-2', 'Puff or flutter sleeves', 'Volume at the shoulder balances fuller hips.', 'a dusty pink puff-sleeve blouse tucked into black straight trousers'),
        card('tops-3', 'Printed tops', 'Print and colour on top pull the eye up.', 'a bright printed floral blouse tucked into a plain navy A-line skirt'),
        card('tops-4', 'Fitted, tucked tops', 'Tucking in shows off your waist, your best point.', 'a fitted rust knit top neatly tucked into high-rise black wide-leg trousers'),
      ],
      bottoms: [
        card('bottoms-1', 'Wide-leg trousers', 'They fall straight from the hip and balance the whole line.', 'high-rise black wide-leg trousers with a flat front, worn with a fitted white top'),
        card('bottoms-2', 'Bootcut jeans', 'The flare at the hem balances fuller thighs.', 'dark indigo high-rise bootcut jeans with no back-pocket detail, worn with a tucked-in striped top'),
        card('bottoms-3', 'A-line skirts', 'Fitted at the waist, then skims over hips and thighs.', 'a plain navy A-line midi skirt, worn with a tucked-in mustard blouse'),
        card('bottoms-4', 'Dark straight pants', 'Plain dark colours keep the lower half calm.', 'charcoal straight-leg trousers with a flat front, worn with a printed blouse'),
      ],
      dresses: [
        card('dresses-1', 'Fit-and-flare dresses', 'Shows your waist and floats over the hips.', 'a navy fit-and-flare midi dress with a fitted bodice and full skirt'),
        card('dresses-2', 'Wrap dresses', 'The waist tie marks your slimmest point.', 'an emerald green wrap midi dress with flutter sleeves'),
        card('dresses-3', 'Kurta with flared bottom', 'A flared kurta skims the hips and keeps the waist.', 'a yellow A-line flared kurta to the knee with a detailed yoke, worn with ivory straight pants'),
        card('dresses-4', 'Saree with a detailed blouse', 'A bright, detailed blouse draws the eye up.', 'a plain dark green chiffon saree with a bright gold embroidered blouse'),
      ],
      layers: [
        card('layers-1', 'Cropped jackets', 'Ends at the waist, so it adds width only on top.', 'a cropped light denim jacket at waist length over a white dress'),
        card('layers-2', 'Structured blazers', 'Defined shoulders balance your hips.', 'a structured ivory blazer with defined shoulders, hip length, over black wide-leg trousers'),
        card('layers-3', 'Shrugs and boleros', 'Short layers add shape on top only.', 'a short black knit bolero shrug over a fitted maroon dress'),
        card('layers-4', 'Short shackets', 'Worn open, a short layer keeps the eye up.', 'an open olive cropped shirt jacket over a white top and dark straight jeans'),
      ],
      footwear: [
        card('footwear-1', 'Pointed heels', 'They make your legs look longer and slimmer.', 'black pointed-toe court heels'),
        card('footwear-2', 'Block heels', 'Steady height that suits wide-leg pants.', 'tan block-heel sandals under wide-leg trousers'),
        card('footwear-3', 'Nude flats', 'Skin-tone shoes keep the line long.', 'nude pointed ballet flats'),
        card('footwear-4', 'Wedges', 'A solid wedge balances fuller calves.', 'woven jute wedge sandals'),
      ],
    },
  },
  hourglass: {
    label: 'Hourglass',
    summary: 'Your bust and hips are balanced, with a clearly defined waist. Follow your natural curves.',
    model: 'an Indian woman with an hourglass body shape (about UK size 14): bust and hips about the same width, with a clearly defined narrow waist',
    goals: [
      goal('goal-1', 'Show your waist', 'Choose belts, wrap styles and fitted cuts that go in at your waist.', 'a red wrap midi dress tied at the waist, nude heels', [
        { kind: 'level', y: 0.21, from: 0.3, to: 0.75, label: 'Waist marked' },
      ]),
      goal('goal-2', 'Soft, fitted clothes', 'Fabrics that follow your shape look better than stiff or boxy ones.', 'a fitted black knit top tucked into a camel high-rise pencil skirt, black heels', [
        { kind: 'level', y: 0.22, from: 0.3, to: 0.7, label: 'Waist' },
        { kind: 'span', y: 0.38, from: 0.27, to: 0.72, label: 'Follows the hips' },
      ]),
    ],
    skip: ['Boxy, shapeless tops and dresses', 'Stiff fabrics that add bulk', 'Low-rise pants that hide your waist'],
    fabrics: [
      fabric('fine_jersey', 'A soft knit that follows your curves.'),
      fabric('silk_crepe', 'Drapes over curves in dresses and blouses.'),
      fabric('stretch_denim', 'Hugs the hips and holds the waist.'),
      fabric('georgette', 'Flows well in wrap dresses and sarees.'),
    ],
    fabricSkip: ['Stiff, boxy linen', 'Heavy tweed that hides your shape'],
    guides: {
      tops: [
        card('tops-1', 'Wrap tops', 'The cross-over follows your curves and shows your waist.', 'a navy wrap top tucked into black straight trousers'),
        card('tops-2', 'Fitted knits', 'Soft knits that skim show off your shape.', 'a fitted ivory ribbed knit top tucked into a camel skirt'),
        card('tops-3', 'Sweetheart or scoop necks', 'A curved neckline echoes your curves.', 'a black scoop-neck fitted top tucked into dark blue jeans'),
        card('tops-4', 'Tucked shirts', 'A tucked shirt with a belt keeps your waist in view.', 'a white shirt tucked into high-rise camel trousers with a slim belt'),
      ],
      bottoms: [
        card('bottoms-1', 'High-rise straight trousers', 'Sit at the waist and fall in a clean line.', 'high-rise straight black trousers with a tucked emerald top'),
        card('bottoms-2', 'Pencil skirts', 'Follow your curves to the knee.', 'a camel high-rise pencil skirt to the knee with a tucked black top'),
        card('bottoms-3', 'High-rise bootcut jeans', 'Hug the hips and balance with a slight flare.', 'dark high-rise bootcut jeans with a tucked white top'),
        card('bottoms-4', 'Wide-leg pants with a belt', 'A belt at the waist keeps the shape.', 'ivory wide-leg pants with a thin tan belt and a tucked brown top'),
      ],
      dresses: [
        card('dresses-1', 'Wrap dresses', 'Made for your shape: fitted waist, soft skirt.', 'a burgundy wrap midi dress'),
        card('dresses-2', 'Sheath dresses', 'A fitted, simple cut follows your curves.', 'a navy fitted knee-length sheath dress'),
        card('dresses-3', 'Fitted kurta sets', 'A kurta shaped at the waist shows your curves.', 'a teal fitted kurta shaped at the waist with matching straight pants'),
        card('dresses-4', 'Saree, neatly pleated', 'A fitted blouse and neat drape follow your shape.', 'a soft pink georgette saree with a fitted blouse and neat pleats'),
      ],
      layers: [
        card('layers-1', 'Belted blazers', 'A belt over a blazer keeps your waist in view.', 'a camel blazer with a slim belt at the waist over black trousers'),
        card('layers-2', 'Fitted jackets', 'Short fitted jackets follow your shape.', 'a fitted black jacket to the hip over a red dress'),
        card('layers-3', 'Belted trench coats', 'A tie waist keeps the hourglass line.', 'a beige trench coat tied at the waist'),
        card('layers-4', 'Wrap cardigans', 'Soft and tied, they mark your waist.', 'an ivory wrap cardigan tied at the waist over dark jeans'),
      ],
      footwear: [
        card('footwear-1', 'Pointed heels', 'A sleek heel finishes fitted looks.', 'black pointed stiletto court heels'),
        card('footwear-2', 'Strappy sandals', 'Light straps keep the look feminine.', 'tan strappy heeled sandals'),
        card('footwear-3', 'Ankle-strap heels', 'Work well with skirts and dresses.', 'nude ankle-strap block heels'),
        card('footwear-4', 'Loafers', 'For easy days with straight trousers.', 'brown leather loafers under straight trousers'),
      ],
    },
  },
  rectangle: {
    label: 'Rectangle',
    summary: 'Your shoulders, waist and hips are about the same width. Building a waist and adding shape suits you.',
    model: 'an Indian woman with a rectangle body shape (about UK size 10-12): shoulders, waist and hips about the same width, with little waist definition and a straight frame',
    goals: [
      goal('goal-1', 'Make a waistline', 'A belt, peplum or wrap pulls in at the middle and gives you a waist.', 'a printed peplum top over black straight trousers with a slim belt, nude heels', [
        { kind: 'level', y: 0.21, from: 0.32, to: 0.68, label: 'New waistline' },
      ]),
      goal('goal-2', 'Add soft shape', 'Ruffles, pleats and flared skirts add curves to a straight frame.', 'a ruffled ivory blouse tucked into a full pleated olive midi skirt, tan heels', [
        { kind: 'span', y: 0.66, from: 0.23, to: 0.73, label: 'Fullness adds curves' },
      ]),
    ],
    skip: ['Straight, shapeless shift dresses', 'Very boxy, oversized layers', 'Long tops with no shape at the waist'],
    fabrics: [
      fabric('cotton_poplin', 'Crisp enough to hold belts, ruffles and peplums.'),
      fabric('linen', 'Adds easy texture and shape.'),
      fabric('tweed', 'Texture and structure add curves to a straight frame.'),
      fabric('organza', 'Holds volume in skirts and festive wear.'),
    ],
    fabricSkip: ['Thin, limp jersey', 'Very clingy stretch fabric'],
    guides: {
      tops: [
        card('tops-1', 'Peplum tops', 'The flare adds a waist and hips.', 'a mustard peplum top over dark straight jeans'),
        card('tops-2', 'Ruffled blouses', 'Ruffles add softness and curve.', 'an ivory ruffle-front blouse tucked into black trousers'),
        card('tops-3', 'Wrap tops', 'The tie creates a waist where there is none.', 'a printed wrap top tied at the side over white jeans'),
        card('tops-4', 'Belted shirts', 'A belt over a shirt draws in the waist.', 'a blue striped shirt with a tan belt at the waist over navy trousers'),
      ],
      bottoms: [
        card('bottoms-1', 'Paper-bag trousers', 'The gathered waist adds shape.', 'camel paper-bag waist trousers with a tie belt and a tucked black top'),
        card('bottoms-2', 'Pleated skirts', 'Volume below the waist creates curves.', 'an olive pleated midi skirt with a tucked white top'),
        card('bottoms-3', 'Flared jeans', 'The flare adds shape to straight legs.', 'mid-blue high-rise flared jeans with a tucked striped top'),
        card('bottoms-4', 'Wide-leg trousers', 'Volume below balances a straight top half.', 'ivory high-rise wide-leg trousers with a fitted black top'),
      ],
      dresses: [
        card('dresses-1', 'Fit-and-flare dresses', 'A fitted top and full skirt build an hourglass.', 'a red fit-and-flare midi dress'),
        card('dresses-2', 'Belted shirt dresses', 'A belt pulls in the waist on a straight dress.', 'a navy shirt dress with a self-tie belt at the waist'),
        card('dresses-3', 'Angrakha kurtas', 'The side tie shapes the waist.', 'a mustard angrakha-style kurta tied at the side with ivory palazzos'),
        card('dresses-4', 'Lehenga or flared skirt sets', 'A flared skirt adds curve below a fitted top.', 'a light blue flared lehenga skirt with a fitted short blouse and a sheer dupatta'),
      ],
      layers: [
        card('layers-1', 'Belted blazers', 'Draws in the waist while adding structure.', 'a black blazer with a belt at the waist over white trousers'),
        card('layers-2', 'Peplum jackets', 'The flare at the hip adds curve.', 'an ivory peplum jacket over black trousers'),
        card('layers-3', 'Cropped jackets', 'Shorter layers break up a straight line.', 'a cropped tweed jacket at the waist over a black dress'),
        card('layers-4', 'Waistcoats', 'A fitted waistcoat shapes the middle.', 'a fitted camel waistcoat over a white shirt and dark jeans'),
      ],
      footwear: [
        card('footwear-1', 'Strappy heels', 'Light, feminine straps soften the line.', 'black strappy heeled sandals'),
        card('footwear-2', 'Mary Janes', 'A rounded shape adds softness.', 'burgundy block-heel Mary Jane shoes'),
        card('footwear-3', 'Ankle boots', 'Work with flared jeans and dresses.', 'tan suede ankle boots'),
        card('footwear-4', 'Embellished juttis', 'Detail at the feet for Indian wear.', 'gold embroidered juttis'),
      ],
    },
  },
  inverted_triangle: {
    label: 'Inverted triangle',
    summary: 'Your shoulders are wider than your hips. Soft tops and fuller bottoms balance you.',
    model: 'an Indian woman with an inverted triangle body shape (about UK size 12-14 top and 10 bottom): broad shoulders and fuller bust, narrower waist, and narrow hips with slim legs',
    goals: [
      goal('goal-1', 'Keep the top simple', 'Plain tops and V-necks make your shoulders look narrower.', 'a plain black V-neck top with raglan sleeves tucked into a full printed midi skirt, tan sandals', [
        { kind: 'span', y: 0.08, from: 0.25, to: 0.72, label: 'Plain on top' },
        { kind: 'span', y: 0.72, from: 0.22, to: 0.76, label: 'Fuller below' },
      ]),
      goal('goal-2', 'Add fullness below', 'Wide trousers, flared skirts and A-lines balance broad shoulders.', 'a plain navy fitted top with mustard high-rise wide-leg trousers, nude heels', [
        { kind: 'span', y: 0.07, from: 0.27, to: 0.71, label: 'Shoulders' },
        { kind: 'span', y: 0.9, from: 0.25, to: 0.7, label: 'Wide legs balance' },
      ]),
    ],
    skip: ['Puff sleeves and shoulder pads', 'Boat necks and wide necklines', 'Skinny pants with a bulky top'],
    fabrics: [
      fabric('georgette', 'Soft on top, so shoulders look narrower.'),
      fabric('viscose', 'Drapes softly instead of adding width.'),
      fabric('cotton_mulmul', 'Light kurtas and tops with no stiffness.'),
      fabric('crinkle_cotton', 'Full, textured skirts and palazzos add volume below.'),
    ],
    fabricSkip: ['Stiff fabrics with built-up shoulders', 'Heavy brocade on the top half'],
    guides: {
      tops: [
        card('tops-1', 'V-necks', 'Narrows the shoulder line.', 'a plain navy V-neck top tucked into ivory wide-leg trousers'),
        card('tops-2', 'Raglan sleeves', 'The diagonal seam softens the shoulders.', 'a plain solid grey raglan-sleeve knit top with no print, tucked into dark trousers'),
        card('tops-3', 'Halter necks', 'Cuts in at the shoulder to make it look narrower.', 'a black halter-neck top with flared mid-blue jeans'),
        card('tops-4', 'Plain, dark tops', 'Simple colour on top keeps it calm.', 'a plain chocolate brown fitted top with a bright pleated skirt'),
      ],
      bottoms: [
        card('bottoms-1', 'Wide-leg trousers', 'Volume below balances the shoulders.', 'mustard high-rise wide-leg trousers with a plain black top'),
        card('bottoms-2', 'Flared jeans', 'The flare adds width at the hem.', 'light blue high-rise flared jeans with a plain white top'),
        card('bottoms-3', 'Full or pleated skirts', 'Adds curve to the lower half.', 'a printed full pleated midi skirt with a plain black top'),
        card('bottoms-4', 'Printed or light bottoms', 'Brighter colour below draws the eye down.', 'ivory printed palazzo pants with a plain navy top'),
      ],
      dresses: [
        card('dresses-1', 'Fit-and-flare dresses', 'Plain on top, full below.', 'a dark green fit-and-flare midi dress with a V-neck and a full skirt'),
        card('dresses-2', 'Wrap dresses with a full skirt', 'The V softens the shoulders.', 'a navy and white printed wrap dress with a flowing skirt'),
        card('dresses-3', 'Anarkalis', 'The flowing flare balances the shoulders.', 'a floor-length maroon Anarkali with plain sleeves and a full flare'),
        card('dresses-4', 'Kurta with palazzos', 'Wide pants add volume below.', 'a plain dark blue straight kurta with wide printed palazzos'),
      ],
      layers: [
        card('layers-1', 'Soft open cardigans', 'No structure at the shoulder.', 'a soft open grey cardigan over a white top and wide-leg jeans'),
        card('layers-2', 'Longline waterfall jackets', 'The draped front pulls the eye down.', 'a black waterfall-front long jacket over a fitted top and slim trousers'),
        card('layers-3', 'Unstructured blazers', 'Soft shoulders, no padding.', 'a soft unstructured beige blazer with no shoulder pads over a black dress'),
        card('layers-4', 'Long shrugs', 'Lightweight layers that skim.', 'a long lightweight ivory shrug over a plain navy dress'),
      ],
      footwear: [
        card('footwear-1', 'Chunky heels', 'More weight at the feet balances the top.', 'black chunky block heels'),
        card('footwear-2', 'Platforms', 'Adds weight below for balance.', 'tan platform sandals'),
        card('footwear-3', 'Ankle-strap sandals', 'Draw the eye down to the feet.', 'brown ankle-strap flat sandals'),
        card('footwear-4', 'Bold-colour shoes', 'A bright shoe pulls attention down.', 'red pointed block-heel pumps'),
      ],
    },
  },
};

export type FaceShapeEntry = { label: string; summary: string; wear: string[]; skip: string[] };

/** Necklines, earrings and glasses for each face shape. Hair stays in stylistHairstyleGuide. */
export const FACE_SHAPE_LIBRARY: Record<FaceShapeKey, FaceShapeEntry> = {
  oval: { label: 'Oval', summary: 'Your face is balanced, a little longer than it is wide. Most shapes suit you.', wear: ['Most necklines', 'Any earring shape', 'Most frame shapes'], skip: ['Very heavy frames that hide your face'] },
  round: { label: 'Round', summary: 'Your cheeks are the widest part. Open, deeper necklines make your face look longer.', wear: ['V-necks and open collars', 'Long drop earrings', 'Rectangle frames'], skip: ['High round necks and chokers', 'Round studs and round frames'] },
  square: { label: 'Square', summary: 'Your jaw is strong and as wide as your forehead. Soft, curved shapes balance it.', wear: ['Scoop and sweetheart necks', 'Hoops and round earrings', 'Round or oval frames'], skip: ['Square necklines', 'Square, angular frames'] },
  heart: { label: 'Heart', summary: 'Your forehead is wider than your chin. Width lower down balances you.', wear: ['Sweetheart and scoop necks', 'Teardrop earrings', 'Light or rimless frames'], skip: ['Very wide boat necks', 'Heavy top-line frames'] },
  oblong: { label: 'Oblong', summary: 'Your face is longer than it is wide. Width at the sides balances it.', wear: ['Boat necks and high necks', 'Studs and short hoops', 'Wide, deep frames'], skip: ['Deep V-necks', 'Long drop earrings'] },
};

export type PaletteColour = { name: string; hex: string };
export type UndertoneEntry = {
  label: string;
  summary: string;
  neutrals: PaletteColour[];
  main: PaletteColour[];
  accents: PaletteColour[];
  skip: PaletteColour[];
  jewellery: string;
  makeup: Array<{ product: string; shade: string }>;
};

const c = (name: string, hex: string): PaletteColour => ({ name, hex });

export const UNDERTONE_LIBRARY: Record<UndertoneKey, UndertoneEntry> = {
  warm: {
    label: 'Warm',
    summary: 'Your skin has golden or peachy tones. Earthy, warm colours make it glow.',
    neutrals: [c('Camel', '#C19A6B'), c('Chocolate', '#5C3A24'), c('Olive', '#6B6B3A'), c('Cream', '#F3E9D2')],
    main: [c('Rust', '#B7472A'), c('Mustard', '#D4A017'), c('Teal', '#2A7F7A'), c('Warm red', '#C0392B')],
    accents: [c('Coral', '#F27D62'), c('Terracotta', '#C8664A'), c('Gold', '#C9A24B'), c('Peach', '#F4B183')],
    skip: [c('Icy pastels', '#DCE6F2'), c('Optic white', '#FFFFFF'), c('Cool grey', '#9AA3AD')],
    jewellery: 'Gold, rose gold and antique gold.',
    makeup: [
      { product: 'Foundation', shade: 'Golden or warm beige' },
      { product: 'Blush', shade: 'Peach or soft coral' },
      { product: 'Lips', shade: 'Brick red, warm nude, terracotta' },
      { product: 'Eyes', shade: 'Bronze, copper, warm brown' },
    ],
  },
  cool: {
    label: 'Cool',
    summary: 'Your skin has pink or blue-ish tones. Clear, cool colours make it glow.',
    neutrals: [c('Navy', '#1F2A44'), c('Charcoal', '#36454F'), c('Soft white', '#F5F5F2'), c('Cool taupe', '#8B8589')],
    main: [c('Emerald', '#1F7A5A'), c('Royal blue', '#2952A3'), c('Berry', '#8E2453'), c('Plum', '#5E2A5C')],
    accents: [c('Fuchsia', '#C2185B'), c('Lavender', '#A99BD1'), c('Silver', '#C0C0C0'), c('Icy pink', '#F2C4D6')],
    skip: [c('Orange', '#E67E22'), c('Mustard', '#D4A017'), c('Camel', '#C19A6B')],
    jewellery: 'Silver, white gold and platinum.',
    makeup: [
      { product: 'Foundation', shade: 'Rosy or neutral-pink beige' },
      { product: 'Blush', shade: 'Soft pink or berry' },
      { product: 'Lips', shade: 'Berry, rose, mauve' },
      { product: 'Eyes', shade: 'Plum, taupe, grey-brown' },
    ],
  },
  neutral: {
    label: 'Neutral',
    summary: 'Your skin sits between warm and cool. Soft, balanced colours from both sides suit you.',
    neutrals: [c('Taupe', '#8B7D6B'), c('Navy', '#1F2A44'), c('Ivory', '#F4EFE1'), c('Mocha', '#7A5C4B')],
    main: [c('Jade', '#4A8C7A'), c('Dusty rose', '#C08081'), c('Soft teal', '#4F8A8B'), c('Wine', '#722F37')],
    accents: [c('Soft coral', '#E8836B'), c('Mauve', '#A07A8C'), c('Rose gold', '#B76E79'), c('Sage', '#9CAF88')],
    skip: [c('Harsh orange', '#E8590C'), c('Very icy pastels', '#E3EEF7')],
    jewellery: 'Both gold and silver; rose gold is easiest.',
    makeup: [
      { product: 'Foundation', shade: 'Neutral beige' },
      { product: 'Blush', shade: 'Soft rose or dusty peach' },
      { product: 'Lips', shade: 'Rosy nude, mauve, soft red' },
      { product: 'Eyes', shade: 'Taupe, soft brown, mauve' },
    ],
  },
};

/** Where a card's picture lives, under /public. */
export function libraryImagePath(shape: BodyShapeKey, cardId: string) {
  return `/report-library/${shape}/${cardId}.webp`;
}

/** Every picture the library needs for one shape: two goals, then four cards per clothing page. */
export function libraryCardsFor(shape: BodyShapeKey) {
  const entry = BODY_SHAPE_LIBRARY[shape];
  return [
    ...entry.goals.map(item => ({ category: 'goals' as const, card: item })),
    ...GUIDE_CATEGORIES.flatMap(category => entry.guides[category.key].map(item => ({ category: category.key, card: item }))),
  ];
}

const normalise = (value: unknown) => String(value ?? '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();

/** Maps whatever the model or an old report wrote onto one of the five body shapes. */
export function toBodyShapeKey(value: unknown): BodyShapeKey | null {
  const text = normalise(value);
  if (!text) return null;
  if (/inverted|strawberry|v shape|broad shoulder/.test(text)) return 'inverted_triangle';
  if (/apple|oval|round/.test(text)) return 'apple';
  if (/pear|triangle|spoon/.test(text)) return 'pear';
  if (/hourglass/.test(text)) return 'hourglass';
  if (/rectangle|straight|column|banana|athletic/.test(text)) return 'rectangle';
  return null;
}

/** Maps any face shape (including the old Diamond and Triangle) onto the five. */
export function toFaceShapeKey(value: unknown): FaceShapeKey | null {
  const text = normalise(value);
  if (!text) return null;
  if (/oblong|long|rectangle/.test(text)) return 'oblong';
  if (/heart|diamond/.test(text)) return 'heart';
  if (/square|triangle|pear/.test(text)) return 'square';
  if (/round/.test(text)) return 'round';
  if (/oval/.test(text)) return 'oval';
  return null;
}

/** Maps any undertone wording onto warm, cool or neutral. Olive reads as neutral-warm, so neutral. */
export function toUndertoneKey(value: unknown): UndertoneKey | null {
  const text = normalise(value);
  if (!text) return null;
  const warm = /warm|golden|yellow|peach/.test(text);
  const cool = /cool|pink|rosy|blue/.test(text);
  if (warm && cool) return 'neutral';
  if (/neutral|olive/.test(text)) return 'neutral';
  if (warm) return 'warm';
  if (cool) return 'cool';
  return null;
}

/** What the model and the analysis read, loosely typed so this file needs nothing from the generator. */
type ClassificationLike = {
  body?: { shape?: string; geometry?: string; focus_areas?: string[] };
  colour?: { undertone?: string; undertone_direction?: string };
  face_hair_accessories?: { face_shape?: string };
};

/**
 * The three picks for a report: the model's fixed-list answer when it gave
 * one, otherwise the closest match to what it wrote. Always returns a full
 * set, so every new report gets the library layout.
 */
export function styleLibraryPicksFor(classification: ClassificationLike) {
  const body = classification.body ?? {};
  return {
    body_shape: toBodyShapeKey(body.shape) ?? toBodyShapeKey(body.geometry) ?? toBodyShapeKey((body.focus_areas ?? []).join(' ')) ?? 'rectangle',
    face_shape: toFaceShapeKey(classification.face_hair_accessories?.face_shape) ?? 'oval',
    undertone: toUndertoneKey(classification.colour?.undertone) ?? toUndertoneKey(classification.colour?.undertone_direction) ?? 'neutral',
  } satisfies { body_shape: BodyShapeKey; face_shape: FaceShapeKey; undertone: UndertoneKey };
}

/** The fixed-list instructions for the analysis model. */
export const STYLE_LIBRARY_CLASSIFICATION_RULES = `Fixed categories (the report is built from these, so pick exactly one from each list):
- body.shape: exactly one of Hourglass, Pear, Apple, Rectangle, Inverted triangle. Judge from the front and side photos and any measurements:
  Hourglass: bust and hips about the same width, clearly defined waist.
  Pear: hips clearly wider than shoulders, defined waist.
  Apple: fullest through the middle, waist not defined, often slimmer legs.
  Rectangle: shoulders, waist and hips about the same width, little waist definition.
  Inverted triangle: shoulders or bust clearly wider than hips.
- colour.undertone: exactly one of Warm, Cool, Neutral. Warm: golden, peachy or olive-golden skin. Cool: pink, rosy or blue-ish skin. Neutral: only when it genuinely sits in the middle; if it leans one way, pick that side.
- face_hair_accessories.face_shape: exactly one of Oval, Round, Square, Heart, Oblong. A diamond-shaped face is Heart; a triangle-shaped face (jaw wider than forehead) is Square.`;
