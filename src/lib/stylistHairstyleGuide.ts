// Face shape → hairstyle guide for the women's Blueprint.
//
// Hairstyles used to come from a blank `hair_styles` field in the classification
// prompt, so the model fell back on the same four suggestions for everyone (a low
// bun, side-parted waves, half-up with crown volume, a lob). This guide fixes the
// vocabulary: the model reads the face shape, then may only choose from that
// shape's list, and every choice carries the reason it suits that shape.

export const FACE_SHAPES = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'triangle'] as const;
export type FaceShape = typeof FACE_SHAPES[number];

export interface HairstyleOption {
  name: string;
  kind: 'cut' | 'style';
  why: string;
}

export interface FaceShapeHairGuide {
  label: string;
  /** How to recognise the shape from a front headshot. */
  signs: string;
  /** What the hair has to do for this face. */
  goal: string;
  options: HairstyleOption[];
  avoid: string[];
}

export const FACE_SHAPE_HAIR_GUIDE: Record<FaceShape, FaceShapeHairGuide> = {
  oval: {
    label: 'Oval',
    signs: 'Face about one and a half times as long as it is wide; forehead slightly wider than the jaw; jaw softly rounded; cheekbones the widest point by only a little.',
    goal: 'Your face is already balanced, so the hair only needs to show it off, not correct anything.',
    options: [
      { name: 'Long soft layers', kind: 'cut', why: 'An oval face is already balanced, so long layers add movement without having to correct anything.' },
      { name: 'Collarbone-length lob', kind: 'cut', why: 'The even length-to-width ratio carries a clean lob, and ending at the collarbone frames the neck without shortening the face.' },
      { name: 'Jaw-length blunt bob', kind: 'cut', why: 'Oval faces are among the few that can wear a jaw-length bob, because the jaw needs neither softening nor hiding.' },
      { name: 'Curtain bangs with long layers', kind: 'cut', why: 'Curtain bangs part at the centre and frame the cheekbones, which suits the even proportions of an oval face.' },
      { name: 'Sleek middle part', kind: 'style', why: 'A centre part shows off the natural symmetry of an oval face.' },
      { name: 'High polished ponytail', kind: 'style', why: 'Pulling the hair up and back works because there is no width or length to disguise.' },
      { name: 'Soft bouncy blow-dry', kind: 'style', why: 'Even volume all round keeps the balance an oval face already has.' },
      { name: 'Low twisted bun', kind: 'style', why: 'An oval face holds its shape with the hair pulled away, so a clean low bun looks polished rather than severe.' },
    ],
    avoid: ['A heavy blunt fringe that covers the forehead and hides the balance of the face', 'Hair dragged flat and forward over the cheeks'],
  },
  round: {
    label: 'Round',
    signs: 'Face about as long as it is wide; full cheeks are the widest point; jaw soft and rounded with no clear angle; short chin.',
    goal: 'Add length and a little angle, and keep width away from the cheeks.',
    options: [
      { name: 'Long layers starting below the chin', kind: 'cut', why: 'Layers that begin below the chin draw the eye down and lengthen the face instead of adding width at the cheeks.' },
      { name: 'Collarbone lob with a side part', kind: 'cut', why: 'Ending below the jaw keeps the line long, and the side part cuts an angle across the roundness.' },
      { name: 'Long side-swept fringe', kind: 'cut', why: 'A diagonal fringe crosses the width of the forehead and cheeks, so the face reads longer.' },
      { name: 'Face-framing layers from the chin down', kind: 'cut', why: 'Pieces that start at the chin make vertical lines beside the cheeks, slimming the widest point.' },
      { name: 'Deep side part', kind: 'style', why: 'An off-centre part adds asymmetry and height, which offsets the width of a round face.' },
      { name: 'High ponytail with crown lift', kind: 'style', why: 'Height at the crown lengthens the face, and smooth sides keep width off the cheeks.' },
      { name: 'Half-up with crown volume', kind: 'style', why: 'Lift on top adds length while the loose lengths frame the face in vertical lines.' },
      { name: 'Sleek straight blow-dry past the shoulders', kind: 'style', why: 'Long straight lines lengthen and slim a round face.' },
    ],
    avoid: ['A chin-length rounded bob', 'A blunt straight-across fringe', 'Volume or curls sitting at cheek level', 'A flat centre part with no height'],
  },
  square: {
    label: 'Square',
    signs: 'Face about as long as it is wide; forehead, cheekbones and jaw close to the same width; strong, angular jaw with a flat chin.',
    goal: 'Soften the angles of the jaw and forehead with movement and curves.',
    options: [
      { name: 'Layered lob falling past the jaw', kind: 'cut', why: 'Ending below the jaw moves the hemline away from the strongest angle and softens it.' },
      { name: 'Long layers with wispy face-framing', kind: 'cut', why: 'Soft pieces around the face blur the straight lines of the forehead and jaw.' },
      { name: 'Side-swept fringe', kind: 'cut', why: 'A diagonal fringe breaks up the width of a square forehead and adds softness.' },
      { name: 'Curtain bangs', kind: 'cut', why: 'Curved bangs round off the corners of the forehead.' },
      { name: 'Soft waves around the jaw', kind: 'style', why: 'Movement at the jawline blurs its angles.' },
      { name: 'Side part with soft volume', kind: 'style', why: 'Asymmetry softens a symmetrical, angular frame.' },
      { name: 'Loose low bun with face-framing tendrils', kind: 'style', why: 'Loose strands at the jaw stop an updo from exposing the full angle of the jaw.' },
      { name: 'Tousled half-up', kind: 'style', why: 'Texture and a relaxed shape counter the straight lines of a square face.' },
    ],
    avoid: ['A blunt jaw-length bob', 'Severe slicked-back styles', 'A heavy straight-across fringe', 'A centre part with dead-straight hair'],
  },
  heart: {
    label: 'Heart',
    signs: 'Forehead is the widest part; cheekbones high; face narrows to a small, pointed chin.',
    goal: 'Add fullness near the chin and keep volume off the crown, so the wider forehead is balanced.',
    options: [
      { name: 'Chin-to-collarbone bob with fuller ends', kind: 'cut', why: 'Fullness at the ends adds width near the narrow chin, balancing the wider forehead.' },
      { name: 'Side-swept fringe', kind: 'cut', why: 'A diagonal fringe narrows the forehead visually.' },
      { name: 'Long layers that flip out at the jaw', kind: 'cut', why: 'Volume below the cheekbones fills in around the chin.' },
      { name: 'Curtain bangs', kind: 'cut', why: 'Curtain bangs cover the width of the forehead at the temples.' },
      { name: 'Waves from the jaw down', kind: 'style', why: 'Keeping the volume low balances the wider top of the face.' },
      { name: 'Low side bun', kind: 'style', why: 'A low, off-centre bun keeps height off the crown.' },
      { name: 'Deep side part', kind: 'style', why: 'An off-centre part breaks up the width of the forehead.' },
      { name: 'Low ponytail with face-framing pieces', kind: 'style', why: 'A low tie keeps the crown flat while loose pieces soften the chin.' },
    ],
    avoid: ['Volume or height at the crown', 'A slicked-back high ponytail', 'Short top layers', 'A blunt chin-length cut with flat ends'],
  },
  oblong: {
    label: 'Oblong',
    signs: 'Face clearly longer than it is wide; forehead, cheekbones and jaw similar in width; long straight cheek line.',
    goal: 'Add width at the sides and shorten the face visually.',
    options: [
      { name: 'Soft curtain fringe', kind: 'cut', why: 'A fringe shortens a long face by covering part of the forehead.' },
      { name: 'Shoulder-length cut with side volume', kind: 'cut', why: 'Width at the sides balances the length of the face.' },
      { name: 'Layered mid-length cut', kind: 'cut', why: 'Layers at cheek level add fullness exactly where a long face needs it.' },
      { name: 'Chin-length bob', kind: 'cut', why: 'A horizontal line at the chin makes the face read shorter.' },
      { name: 'Voluminous waves at cheek level', kind: 'style', why: 'Width at the cheeks counters the length of the face.' },
      { name: 'Low ponytail with volume at the sides', kind: 'style', why: 'A low tie adds no height, and side volume adds width.' },
      { name: 'Low loose bun', kind: 'style', why: 'Keeps height off the crown so the face does not look longer.' },
      { name: 'Centre part with soft volume at the cheeks', kind: 'style', why: 'Fullness beside the cheeks widens a narrow, long face.' },
    ],
    avoid: ['Very long, straight, flat hair', 'Height at the crown', 'High top knots', 'A sleek middle part with no volume'],
  },
  diamond: {
    label: 'Diamond',
    signs: 'Cheekbones clearly the widest point; forehead and jaw both narrow; chin fairly pointed.',
    goal: 'Add width at the forehead and chin, and keep volume away from the cheekbones.',
    options: [
      { name: 'Chin-length bob', kind: 'cut', why: 'A bob ending at the chin adds width at the narrow jaw.' },
      { name: 'Side-swept fringe', kind: 'cut', why: 'A fringe across the forehead widens a narrow brow line.' },
      { name: 'Long layers with fullness at the chin', kind: 'cut', why: 'Layers that open out at the chin balance the width of the cheekbones.' },
      { name: 'Curtain bangs', kind: 'cut', why: 'Bangs that sweep to the temples add width at the top of the face.' },
      { name: 'Hair tucked behind the ears', kind: 'style', why: 'Tucking shows off the cheekbones while the lengths add width at the jaw.' },
      { name: 'Deep side part', kind: 'style', why: 'An off-centre part adds width across a narrow forehead.' },
      { name: 'Half-up with volume at the hairline', kind: 'style', why: 'Lift at the hairline widens the forehead to match the cheekbones.' },
      { name: 'Soft waves below the cheekbones', kind: 'style', why: 'Movement below the cheekbones fills in around the narrow jaw.' },
    ],
    avoid: ['Volume at the cheekbones', 'A centre part with a flat top', 'A very short crop', 'Slicked-back styles that expose a narrow forehead'],
  },
  triangle: {
    label: 'Triangle',
    signs: 'Jaw is the widest part; forehead narrower than the jaw; full, strong jawline.',
    goal: 'Add width and lift at the top of the head, and keep volume away from the jaw.',
    options: [
      { name: 'Layered cut with volume at the crown', kind: 'cut', why: 'Lift at the crown widens the top of the face to balance a stronger jaw.' },
      { name: 'Side-swept fringe', kind: 'cut', why: 'A fringe widens a narrower forehead.' },
      { name: 'Shoulder-length layers past the jaw', kind: 'cut', why: 'Ending below the jaw moves the hemline away from its widest point.' },
      { name: 'Curtain bangs', kind: 'cut', why: 'Bangs that sweep to the temples add width at the top of the face.' },
      { name: 'Textured blow-dry with root lift', kind: 'style', why: 'Volume at the roots adds width where the face is narrowest.' },
      { name: 'Half-up top knot', kind: 'style', why: 'Height on top balances the width of the jaw.' },
      { name: 'Side part with lift', kind: 'style', why: 'Lift at the part widens the forehead line.' },
      { name: 'Soft waves from the cheekbones up', kind: 'style', why: 'Movement at the top half of the face balances a strong jaw.' },
    ],
    avoid: ['A chin-length blunt bob', 'Volume or curls at the jawline', 'A sleek, flat top'],
  },
};

/** One canonical shape, or the two named in a blend such as "Oval-Round". */
export function normaliseFaceShape(raw: string | null | undefined): { primary: FaceShape; secondary?: FaceShape } | null {
  const text = (raw ?? '').toLowerCase();
  const found: Array<{ shape: FaceShape; at: number }> = [];
  const add = (shape: FaceShape, pattern: RegExp) => {
    const match = pattern.exec(text);
    if (match && !found.some(item => item.shape === shape)) found.push({ shape, at: match.index });
  };
  // "Inverted triangle" is a heart; check it before plain "triangle".
  add('heart', /\bheart\b|\binverted[\s-]*triangle\b/);
  add('triangle', /\b(?<!inverted[\s-]*)triangle\b|\bpear\b/);
  add('oval', /\boval\b/);
  add('round', /\bround\b|\bcircular\b/);
  add('square', /\bsquare\b/);
  add('oblong', /\boblong\b|\blong\b|\brectangle\b|\brectangular\b/);
  add('diamond', /\bdiamond\b/);
  if (!found.length) return null;
  found.sort((a, b) => a.at - b.at);
  // Oval is the balanced reference shape. In a blend such as "Oval-Round" the
  // other shape is what the hair has to address, so it leads.
  const ordered = found.length > 1 && found[0].shape === 'oval' ? [found[1], found[0], ...found.slice(2)] : found;
  return { primary: ordered[0].shape, secondary: ordered[1]?.shape };
}

export interface HairstyleDirection extends HairstyleOption {
  face_shape: string;
}

const comparable = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const words = (value: string) => new Set(comparable(value).split(' ').filter(word => word.length > 2));

function closestOption(choice: string, options: HairstyleOption[]): HairstyleOption | undefined {
  const exact = options.find(option => comparable(option.name) === comparable(choice));
  if (exact) return exact;
  const chosen = words(choice);
  let best: { option: HairstyleOption; score: number } | undefined;
  for (const option of options) {
    const own = words(option.name);
    const shared = [...own].filter(word => chosen.has(word)).length;
    const score = shared / new Set([...own, ...chosen]).size;
    if (score >= 0.6 && (!best || score > best.score)) best = { option, score };
  }
  return best?.option;
}

/**
 * The options a face may choose from. Only the leading shape's list: a blend's
 * second shape can recommend what the first must avoid (an oval face wears a
 * jaw-length bob; a round one should not), so it never adds options.
 */
export function hairstyleOptionsForFaceShape(raw: string | null | undefined): { guide: FaceShapeHairGuide; options: HairstyleOption[] } {
  const shape = normaliseFaceShape(raw) ?? { primary: 'oval' as const };
  const guide = FACE_SHAPE_HAIR_GUIDE[shape.primary];
  return { guide, options: guide.options };
}

/**
 * Four hairstyle directions for this face: two cuts and two styles, taken only
 * from the face shape's guide. The model's picks are kept when they are on the
 * list; anything else is replaced from the guide in its fixed order, so the
 * result is never random.
 */
export function selectHairstyleDirections(faceShapeRaw: string | null | undefined, modelChoices: string[] = []): HairstyleDirection[] {
  const { guide, options } = hairstyleOptionsForFaceShape(faceShapeRaw);
  const picked: HairstyleOption[] = [];
  for (const choice of modelChoices) {
    const option = closestOption(choice, options);
    if (option && !picked.includes(option)) picked.push(option);
  }
  const take = (kind: HairstyleOption['kind']) => {
    const chosen = picked.filter(option => option.kind === kind).slice(0, 2);
    for (const option of options) {
      if (chosen.length >= 2) break;
      if (option.kind === kind && !chosen.includes(option)) chosen.push(option);
    }
    return chosen;
  };
  return [...take('cut'), ...take('style')].map(option => ({ ...option, face_shape: guide.label }));
}

/** The guide as prompt text: how to read each shape and what each may wear. */
export function faceShapeHairGuidePrompt() {
  return FACE_SHAPES.map(shape => {
    const guide = FACE_SHAPE_HAIR_GUIDE[shape];
    const cuts = guide.options.filter(option => option.kind === 'cut').map(option => option.name).join('; ');
    const styles = guide.options.filter(option => option.kind === 'style').map(option => option.name).join('; ');
    return `${guide.label}
  Signs: ${guide.signs}
  Goal: ${guide.goal}
  Cuts: ${cuts}
  Styles: ${styles}
  Avoid: ${guide.avoid.join('; ')}`;
  }).join('\n');
}

// --- Stylist edits -----------------------------------------------------------
// The hair page and the 2x2 grid prompt both read the same two fields, so an
// edit written here changes what the client reads and what the image shows.

interface HairFields {
  face_shape: string;
  hair_styles: string[];
  hair_style_directions?: HairstyleDirection[];
}

/** The hairstyles on the page, for reports saved before reasons existed too. */
export function reportHairstyles(face: HairFields): HairstyleDirection[] {
  if (face.hair_style_directions?.length) return face.hair_style_directions.slice(0, 4);
  const { guide, options } = hairstyleOptionsForFaceShape(face.face_shape);
  return face.hair_styles.filter(name => name.trim()).slice(0, 4).map(name => {
    const known = closestOption(name, options);
    return { name, kind: known?.kind ?? 'style', why: known?.why ?? '', face_shape: guide.label };
  });
}

/** One hairstyle edited by a stylist, with the name list the image prompt reads kept in step. */
export function withHairstyleEdit<T extends HairFields>(face: T, index: number, patch: Partial<Pick<HairstyleDirection, 'name' | 'why'>>): T {
  const hairstyles = reportHairstyles(face).map((hairstyle, i) => i === index ? { ...hairstyle, ...patch } : hairstyle);
  return { ...face, hair_style_directions: hairstyles, hair_styles: hairstyles.map(hairstyle => hairstyle.name) };
}

/** Whether the hairstyles the grid image shows have changed, ignoring case and punctuation. */
export function hairstyleNamesChanged(before: Pick<HairFields, 'hair_styles'> | null | undefined, after: Pick<HairFields, 'hair_styles'> | null | undefined) {
  const names = (face: typeof before) => (face?.hair_styles ?? []).map(comparable).join('|');
  return names(before) !== names(after);
}
