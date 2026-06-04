export type LeadMagnetId =
  | "contrast_scan"
  | "glow_test"
  | "silhouette_scan"
  | "proportion_code"
  | "face_architecture_scan";

export type LeadMagnetAnswerValue = string | number | boolean | null | Record<string, unknown> | Array<unknown>;
export type LeadMagnetAnswers = Record<string, LeadMagnetAnswerValue>;

export type LeadMagnetResult = {
  key: string;
  label: string;
  summary: string;
  reveal: string;
  gap: string;
  rules: string[];
  nextStepHref: string;
  nextStepLabel: string;
  paidCta: string;
  shareTitle: string;
  shareSubtitle: string;
  payload: Record<string, unknown>;
};

export type LeadMagnetDefinition = {
  id: LeadMagnetId;
  version: string;
  slug: string;
  title: string;
  eyebrow: string;
  pillar: string;
  physicalAction: string;
  h1: string;
  seoTitle: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intro: string;
  aha: string;
  faq: { q: string; a: string }[];
  relatedLinks: { href: string; title: string }[];
};

export const leadMagnetDefinitions: LeadMagnetDefinition[] = [
  {
    id: "contrast_scan",
    version: "v1",
    slug: "contrast-scan",
    title: "The Contrast Scan",
    eyebrow: "Chromatic Harmony",
    pillar: "Chromatic Harmony Mapping",
    physicalAction: "Take a selfie and view it in black and white.",
    h1: "What is my natural colour contrast?",
    seoTitle: "What Is My Colour Contrast? Free Contrast Scan",
    description: "Take Iconik's free Contrast Scan to see whether you are high, medium, or low contrast and learn how much light-dark contrast your outfits need.",
    primaryKeyword: "what is my colour contrast",
    secondaryKeywords: ["high contrast vs low contrast dressing", "value contrast personal colour"],
    intro: "Your best colours are not only about warm or cool undertone. The amount of contrast between your hair, skin, and eyes changes how much light-dark contrast your outfits can carry.",
    aha: "When your selfie turns black and white, contrast becomes visible. You can see whether your features are sharp and separated, softly blended, or somewhere in between.",
    faq: [
      {
        q: "What is colour contrast in personal styling?",
        a: "Colour contrast is the visible light-dark difference between your hair, skin, eyes, and features. It helps decide whether outfits should use strong contrast, soft contrast, or tonal combinations.",
      },
      {
        q: "Is this the same as undertone?",
        a: "No. Undertone tells you whether colours should lean warm, cool, or neutral. Contrast tells you how much light-dark difference your outfit should carry.",
      },
      {
        q: "Does the Contrast Scan upload my selfie?",
        a: "No. In v1, your selfie is processed locally in your browser with a black-and-white preview. It is not uploaded or stored.",
      },
    ],
    relatedLinks: [
      { href: "/colour-analysis", title: "Colour Analysis Guide" },
      { href: "/colour-analysis/indian-skin-tones", title: "Indian Skin Tone Guide" },
      { href: "/free-colour-analysis-quiz", title: "Free Colour Analysis Quiz" },
    ],
  },
  {
    id: "glow_test",
    version: "v1",
    slug: "glow-test",
    title: "The Glow Test",
    eyebrow: "Colour Draping at Home",
    pillar: "Chromatic Harmony Mapping",
    physicalAction: "Hold tops from your closet under your chin and compare what happens to your face.",
    h1: "Which colours suit me best?",
    seoTitle: "Which Colours Suit Me? Free At-Home Glow Test",
    description: "Use your own clothes to run a free at-home colour draping test and find which colours make your skin look clearer, lifted, or dull.",
    primaryKeyword: "which colours suit me",
    secondaryKeywords: ["colour draping at home", "how to know what colours look good on me"],
    intro: "The fastest colour test uses clothes you already own. When you compare colours under the same light, the best and worst shades are easier to spot.",
    aha: "The winning colour usually makes the skin look clearer and the eyes more awake. The weakest colour often adds shadows, yellowing, redness, or dullness.",
    faq: [
      {
        q: "How do I do colour draping at home?",
        a: "Stand in the same natural light, hold each colour under your chin, and compare skin clarity, shadows, dullness, yellowing, and eye brightness.",
      },
      {
        q: "Do I need special draping cloths?",
        a: "No. V1 uses tops, dupattas, scarves, or saree fabric from your own closet because real wardrobe colours are more useful than abstract swatches.",
      },
      {
        q: "Are my photos uploaded?",
        a: "No. Photo previews stay local in your browser. The saved lead stores only labels and scores, not photos.",
      },
    ],
    relatedLinks: [
      { href: "/colour-analysis/how-to-find-undertone", title: "How to Find Your Undertone" },
      { href: "/colour-analysis/best-colours-dusky-skin", title: "Best Colours for Dusky Skin" },
      { href: "/colour-analysis/best-colours-wheatish-skin-india", title: "Best Colours for Wheatish Skin" },
    ],
  },
  {
    id: "silhouette_scan",
    version: "v1",
    slug: "silhouette-scan",
    title: "The Silhouette Scan",
    eyebrow: "Geometric Silhouette",
    pillar: "Geometric Silhouette Profiling",
    physicalAction: "Enter shoulder, bust, waist, and hip measurements.",
    h1: "What is my body shape by measurements?",
    seoTitle: "Body Shape Calculator India: Free Silhouette Scan",
    description: "Use four guided measurements to discover your geometric silhouette and the one proportion your wardrobe should balance.",
    primaryKeyword: "body shape calculator India",
    secondaryKeywords: ["what is my body shape measurements", "how to measure body shape"],
    intro: "Most body-shape quizzes ask you to pick a picture. The Silhouette Scan uses real measurements so the result feels diagnostic, not vague.",
    aha: "Your silhouette is not a label. It is a proportion map that explains where outfits need structure, balance, length, or waist definition.",
    faq: [
      {
        q: "Which measurements do I need for body shape?",
        a: "You need shoulder, bust, waist, and hip measurements. Measure parallel to the floor and keep the tape snug but not tight.",
      },
      {
        q: "Is this body shape calculator built for Indian wardrobes?",
        a: "Yes. The guidance connects the result to kurtas, sarees, trousers, waist definition, neckline balance, and Indian occasion dressing.",
      },
      {
        q: "Can my body shape change?",
        a: "Your skeleton stays stable, but soft-tissue distribution can change with weight, age, pregnancy, or training. Recheck after major body changes.",
      },
    ],
    relatedLinks: [
      { href: "/body-type-styling", title: "Body Type Styling Guide" },
      { href: "/body-shape-consultation-india", title: "Body Shape Consultation" },
      { href: "/methodology/geometric-silhouette-profiling", title: "Geometric Silhouette Profiling" },
    ],
  },
  {
    id: "proportion_code",
    version: "v1",
    slug: "proportion-code",
    title: "The Proportion Code",
    eyebrow: "Vertical Proportion",
    pillar: "Geometric Silhouette Profiling",
    physicalAction: "Measure height, natural waist-to-floor, and inseam.",
    h1: "Am I long-waisted or long-legged?",
    seoTitle: "Long-Waisted or Long-Legged Test: Free Proportion Code",
    description: "Use three guided measurements to learn whether you are long-waisted, balanced, or long-legged and what rise, tuck, and crop lengths work best.",
    primaryKeyword: "long waisted or short waisted test",
    secondaryKeywords: ["how to find my body proportions", "what rise jeans for my body"],
    intro: "Many jeans, crop tops, and tucked outfits fail because of vertical proportion, not size. Your waist and leg balance changes where clothing should visually divide the body.",
    aha: "Once you know your Proportion Code, rise height, crop length, tuck strategy, and waist placement become much easier to choose.",
    faq: [
      {
        q: "How do I know if I am long-waisted?",
        a: "Compare your natural waist-to-floor measurement and inseam against your full height. A longer torso and shorter leg share usually means long-waisted.",
      },
      {
        q: "What jeans work for long-waisted bodies?",
        a: "High-rise or carefully placed mid-high rise usually works better because it visually lengthens the leg line and reduces torso dominance.",
      },
      {
        q: "Is this the same as petite styling?",
        a: "No. Petite is about total height. Proportion Code is about where your length sits: torso, legs, or balanced.",
      },
    ],
    relatedLinks: [
      { href: "/body-type-styling/petite-india", title: "Petite Styling India" },
      { href: "/body-type-styling/how-to-look-taller-clothing", title: "How to Look Taller" },
      { href: "/body-type-styling/short-torso-styling", title: "Short Torso Styling" },
    ],
  },
  {
    id: "face_architecture_scan",
    version: "v1",
    slug: "face-architecture-scan",
    title: "The Face Architecture Scan",
    eyebrow: "Facial Architecture",
    pillar: "Facial Architecture Analysis",
    physicalAction: "Align your face to a grid or enter simple face measurements.",
    h1: "What is my face shape?",
    seoTitle: "What Is My Face Shape? Free Face Architecture Scan",
    description: "Decode your face architecture and get neckline, collar, earring, and glasses guidance based on face length, width, jaw, and feature softness.",
    primaryKeyword: "what is my face shape",
    secondaryKeywords: ["best neckline for my face shape", "glasses for my face shape"],
    intro: "Face shape changes what works close to your face: necklines, collars, earrings, glasses, and even haircut direction.",
    aha: "The right neckline or earring shape can make your face look more balanced before you change anything else in the outfit.",
    faq: [
      {
        q: "How do I find my face shape?",
        a: "Compare face length, cheekbone width, forehead width, jaw width, and whether your feature lines look soft or angular.",
      },
      {
        q: "Why does face shape matter for clothing?",
        a: "Necklines and collars sit close to the face. Repeating or balancing your face lines can make outfits look more intentional.",
      },
      {
        q: "Does this tool upload my face photo?",
        a: "No. The image preview is local only. V1 stores your measurement answers and result, not the photo.",
      },
    ],
    relatedLinks: [
      { href: "/methodology/facial-architecture-analysis", title: "Facial Architecture Analysis" },
      { href: "/faq/neckline-guide-face-shape-india", title: "Neckline Guide by Face Shape" },
      { href: "/faq/neckline-round-face", title: "Best Neckline for a Round Face" },
    ],
  },
];

export const leadMagnetLinks = leadMagnetDefinitions.map((tool) => ({
  href: `/tools/${tool.slug}`,
  title: tool.title,
  description: tool.description,
}));

export function getLeadMagnetBySlug(slug: string) {
  return leadMagnetDefinitions.find((tool) => tool.slug === slug);
}

export function getLeadMagnetById(id: string) {
  return leadMagnetDefinitions.find((tool) => tool.id === id);
}

function asNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function contrastResult(answers: LeadMagnetAnswers): LeadMagnetResult {
  const selected = String(answers.contrastLevel || "medium");
  const data = {
    high: {
      label: "High Contrast",
      summary: "Your features carry a strong light-dark gap, so outfits usually need visible contrast to look intentional.",
      rules: ["Use clear light-dark pairings near the face.", "Avoid too many mid-tone neutrals in one outfit.", "Repeat one dark anchor with one bright or light element."],
      gap: "If your wardrobe is mostly soft mid-tones, your outfits may look flatter than your natural features.",
    },
    medium: {
      label: "Medium Contrast",
      summary: "Your features can handle contrast, but the best outfits usually keep it controlled rather than extreme.",
      rules: ["Use one clear contrast point, not three competing ones.", "Try tonal outfits with a defined dark or light anchor.", "Keep prints medium-scale rather than very sharp."],
      gap: "If outfits feel inconsistent, your palette may need both contrast control and undertone precision.",
    },
    low: {
      label: "Low Contrast",
      summary: "Your features look more blended, so softer tonal combinations usually look more expensive than harsh contrast.",
      rules: ["Use tonal dressing and soft transitions.", "Avoid stark black-white blocks near the face.", "Choose muted contrast through texture, sheen, or depth shifts."],
      gap: "If your wardrobe uses harsh contrast, it may be overpowering your natural softness.",
    },
  }[selected] ?? {
    label: "Medium Contrast",
    summary: "Your features sit in the middle, so controlled contrast will usually work best.",
    rules: ["Use one clear contrast point.", "Avoid extremes until your full palette is mapped.", "Balance dark and light pieces intentionally."],
    gap: "Your contrast needs a full colour map to become easy to shop with.",
  };

  return {
    key: selected,
    label: data.label,
    summary: data.summary,
    reveal: `Your Contrast Code is ${data.label}.`,
    gap: data.gap,
    rules: data.rules,
    nextStepHref: "/colour-analysis",
    nextStepLabel: "Read the Colour Analysis Guide",
    paidCta: "Unlock My Full Colour Blueprint",
    shareTitle: `My ICONIK Contrast Code: ${data.label}`,
    shareSubtitle: "I tested my natural light-dark contrast.",
    payload: { contrastLevel: selected },
  };
}

function glowResult(answers: LeadMagnetAnswers): LeadMagnetResult {
  const swatches = Array.isArray(answers.swatches) ? answers.swatches as Array<Record<string, unknown>> : [];
  const scored = swatches.map((swatch, index) => {
    const clarity = asNumber(swatch.clarity);
    const lift = asNumber(swatch.lift);
    const shadows = asNumber(swatch.shadows);
    const dullness = asNumber(swatch.dullness);
    return {
      name: String(swatch.name || `Colour ${index + 1}`),
      score: clarity + lift - shadows - dullness,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0] ?? { name: "your clearest colour", score: 0 };
  const worst = scored[scored.length - 1] ?? { name: "your weakest colour", score: 0 };
  const direction = best.score >= 4 ? "Clear Glow" : best.score >= 1 ? "Soft Lift" : "Needs Full Draping";

  return {
    key: direction.toLowerCase().replace(/\s+/g, "_"),
    label: direction,
    summary: `${best.name} performed best in your closet test; ${worst.name} appears to be working hardest against you.`,
    reveal: `${best.name} is your strongest glow signal from this test.`,
    gap: `${worst.name} may be creating dullness, shadows, or unevenness. Your full palette maps which versions of each colour family work reliably.`,
    rules: [
      `Repeat what ${best.name} is doing: clearer skin, brighter eyes, or a more lifted face.`,
      `Be cautious with colours that behave like ${worst.name}.`,
      "Retest in daylight before buying expensive pieces in a new colour family.",
    ],
    nextStepHref: "/colour-analysis/how-to-find-undertone",
    nextStepLabel: "Find Your Undertone",
    paidCta: "Unlock My 30-Colour Palette",
    shareTitle: `My ICONIK Glow Signal: ${best.name}`,
    shareSubtitle: "I tested colours from my own closet.",
    payload: { best, worst, swatches },
  };
}

function silhouetteResult(answers: LeadMagnetAnswers): LeadMagnetResult {
  const shoulders = asNumber(answers.shoulders);
  const bust = asNumber(answers.bust);
  const waist = asNumber(answers.waist);
  const hips = asNumber(answers.hips);
  const upper = Math.max(shoulders, bust);
  const lower = hips;
  const waistDiff = waist > 0 ? (Math.max(upper, lower) - waist) / Math.max(upper, lower) : 0;
  let key = "rectangle";
  if (waistDiff > 0.22 && Math.abs(upper - lower) / Math.max(upper, lower) < 0.08) key = "hourglass";
  else if (lower > upper * 1.08) key = "pear";
  else if (upper > lower * 1.08) key = "inverted_triangle";
  else if (waist >= Math.min(upper, lower) * 0.9) key = "apple";

  const map = {
    hourglass: ["Hourglass", "Keep waist definition visible without adding unnecessary bulk.", ["Choose wrap, belted, or shaped garments.", "Avoid boxy pieces that hide the waist.", "Keep top and bottom volume balanced."]],
    pear: ["Pear", "Balance the lower body by adding structure and attention near the shoulder/neckline.", ["Use stronger necklines, collars, or sleeves.", "Keep lower-half fabrics clean and skimming.", "Use A-line rather than cling at the hip."]],
    inverted_triangle: ["Inverted Triangle", "Balance stronger shoulders by adding ease, drape, or volume below.", ["Keep shoulder details clean.", "Use fuller trousers, A-line skirts, or softer bottoms.", "Avoid heavy shoulder emphasis."]],
    apple: ["Apple", "Create vertical length and avoid cling through the midsection.", ["Use open layers and V-necklines.", "Choose fabric that skims rather than grips.", "Shift focus to legs, neckline, or colour near the face."]],
    rectangle: ["Rectangle", "Create shape through waist placement, layering, and controlled volume.", ["Use belts, peplum, wrap shapes, or colour blocking.", "Avoid flat straight columns with no focal point.", "Add curves through fabric and proportion."]],
  } as const;
  const [label, summary, rules] = map[key as keyof typeof map];

  return {
    key,
    label,
    summary,
    reveal: `Your geometric silhouette reads closest to ${label}.`,
    gap: "A body label is only useful when it becomes cut-by-cut rules. Your full Body Blueprint maps those rules across Indian and western garments.",
    rules: [...rules],
    nextStepHref: "/body-type-styling",
    nextStepLabel: "Read the Body Type Guide",
    paidCta: "Unlock My Body Blueprint",
    shareTitle: `My ICONIK Silhouette: ${label}`,
    shareSubtitle: "I measured my real proportions.",
    payload: { shoulders, bust, waist, hips },
  };
}

function proportionResult(answers: LeadMagnetAnswers): LeadMagnetResult {
  const height = asNumber(answers.height);
  const waistToFloor = asNumber(answers.waistToFloor);
  const inseam = asNumber(answers.inseam);
  const torsoShare = height > 0 ? (height - waistToFloor) / height : 0.42;
  const legShare = height > 0 ? inseam / height : 0.46;
  let key = "balanced";
  if (torsoShare > 0.45 || legShare < 0.44) key = "long_waisted";
  if (legShare > 0.49 && torsoShare < 0.41) key = "long_legged";
  const proportionMap = {
    long_waisted: {
      label: "Long-Waisted",
      summary: "Your torso reads longer relative to your legs, so rise height and waist placement matter heavily.",
      rules: ["Use high or mid-high rises.", "Avoid long untucked tops that extend the torso.", "Place visual waistlines slightly higher."],
      gap: "Mid-rise cuts and long tops may be shortening your leg line.",
    },
    balanced: {
      label: "Balanced Proportion",
      summary: "Your torso and legs read fairly balanced, so you can use both tucked and untucked formulas with control.",
      rules: ["Use rise height based on outfit mood, not correction.", "Keep crop lengths intentional.", "Use belts or tucks when the outfit needs structure."],
      gap: "Your wardrobe issue is likely more silhouette or colour than vertical proportion alone.",
    },
    long_legged: {
      label: "Long-Legged",
      summary: "Your legs read longer relative to your torso, so you can handle lower rises and longer tops more easily.",
      rules: ["Mid-rise can work well.", "Longer tops and relaxed tucks are safer on you.", "Avoid over-shortening the torso with very high rises plus cropped tops."],
      gap: "Very high waistlines may make your upper body look compressed.",
    },
  };
  const map = proportionMap[key as keyof typeof proportionMap];

  return {
    key,
    label: map.label,
    summary: map.summary,
    reveal: `Your Proportion Code is ${map.label}.`,
    gap: map.gap,
    rules: map.rules,
    nextStepHref: "/body-type-styling/how-to-look-taller-clothing",
    nextStepLabel: "Read Vertical Styling Rules",
    paidCta: "Unlock My Fit Guide",
    shareTitle: `My ICONIK Proportion Code: ${map.label}`,
    shareSubtitle: "I tested where my length actually sits.",
    payload: { height, waistToFloor, inseam, torsoShare, legShare },
  };
}

function faceResult(answers: LeadMagnetAnswers): LeadMagnetResult {
  const faceLength = asNumber(answers.faceLength);
  const forehead = asNumber(answers.foreheadWidth);
  const cheekbones = asNumber(answers.cheekboneWidth);
  const jaw = asNumber(answers.jawWidth);
  const line = String(answers.lineQuality || "soft");
  const maxWidth = Math.max(forehead, cheekbones, jaw, 1);
  const ratio = faceLength / maxWidth;
  let key = "oval";
  if (ratio > 1.45) key = "oblong";
  else if (jaw >= cheekbones * 0.96 && line === "angular") key = "square";
  else if (cheekbones > forehead * 1.06 && cheekbones > jaw * 1.06) key = "diamond";
  else if (forehead > jaw * 1.1) key = "heart";
  else if (ratio < 1.18 && line === "soft") key = "round";

  const map = {
    oval: ["Oval", "Your face is balanced, so most neckline and earring families can work if they match your outfit structure.", ["Use the outfit's silhouette to decide neckline.", "Repeat either softness or structure intentionally.", "Avoid extremes only when they fight your body proportions."]],
    round: ["Round", "Your face benefits from vertical and slightly angular lines that add length.", ["Try V-necks, open collars, and longer earrings.", "Avoid high round necklines when you want lift.", "Use vertical hair and accessory lines."]],
    square: ["Square", "Your face carries structure, so soft curves or clean geometry can both work depending on the outfit mood.", ["Use soft V, scoop, or open necklines for balance.", "Choose earrings with curve or length.", "Avoid stacking too many sharp lines at once."]],
    heart: ["Heart", "Your upper face reads broader than the jaw, so necklines and earrings should avoid adding too much width high up.", ["Use open necklines and medium length earrings.", "Avoid heavy width at the temple area.", "Use softness near the jawline."]],
    diamond: ["Diamond", "Your cheekbones are the strongest point, so balance comes from softening width and adding clean vertical lines.", ["Use open necklines and balanced earrings.", "Avoid extreme cheekbone-width emphasis.", "Choose frames that do not overextend past the cheekbones."]],
    oblong: ["Oblong", "Your face reads longer, so width, softness, and medium-scale details can create balance.", ["Use boat, scoop, or softly open necklines.", "Avoid very long earrings with deep V-necks together.", "Add width through hair, collars, or earrings."]],
  } as const;
  const [label, summary, rules] = map[key as keyof typeof map];

  return {
    key,
    label,
    summary,
    reveal: `Your Face Architecture reads closest to ${label}.`,
    gap: "Face shape is only one layer. The full Blueprint aligns face architecture with body geometry and colour so the whole outfit works together.",
    rules: [...rules],
    nextStepHref: "/methodology/facial-architecture-analysis",
    nextStepLabel: "Read the Face Architecture Method",
    paidCta: "Unlock My Full Style Profile",
    shareTitle: `My ICONIK Face Architecture: ${label}`,
    shareSubtitle: "I decoded what works near my face.",
    payload: { faceLength, forehead, cheekbones, jaw, lineQuality: line, ratio },
  };
}

export function computeLeadMagnetResult(toolId: LeadMagnetId, answers: LeadMagnetAnswers): LeadMagnetResult {
  if (toolId === "contrast_scan") return contrastResult(answers);
  if (toolId === "glow_test") return glowResult(answers);
  if (toolId === "silhouette_scan") return silhouetteResult(answers);
  if (toolId === "proportion_code") return proportionResult(answers);
  return faceResult(answers);
}
