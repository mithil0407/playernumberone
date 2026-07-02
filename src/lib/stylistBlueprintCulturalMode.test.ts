import {
  STYLIST_BLUEPRINT_VERSION,
  buildReplacementOutfitContext,
  buildReplacementPlan,
  buildStylistBlueprintIntakeDigest,
  getStylistBlueprintOutfitStartPage,
  getStylistOutfitCulturalMode,
  replacementOutfitContextPrompt,
  validateStylistBlueprintReport,
  type BlueprintPage,
  type StylistBlueprintClassification,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from './stylistBlueprintGenerator';
import { WOMEN_OUTFIT_HARNESS_V2 } from './womenOutfitHarnessV2';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const baseSubmission: StylistIntakeSubmission = {
  id: 'submission-1',
  country: 'India',
  intake_source: 'customer_form',
  full_name: 'Client',
  customer_email: 'client@example.com',
  raw_consultation_notes: '',
};

const classification: StylistBlueprintClassification = {
  client: {
    name: 'Client',
    email: 'client@example.com',
    country: 'India',
    age_range: '35-44',
    language: 'English',
    lifestyle_summary: 'Office, dinners, and elevated everyday dressing.',
  },
  body: {
    geometry: 'balanced with soft waist',
    focus_areas: ['midsection'],
    proportion_directive: 'Create a long clean line.',
    coverage_rules: [],
    silhouette_rules: ['Use structure without cling.'],
  },
  colour: {
    undertone_direction: 'neutral warm',
    depth: 'medium',
    contrast: 'medium',
    palette_name: 'Warm elevated jewel neutrals',
    base_palette: Array.from({ length: 15 }, (_, index) => ({
      name: index % 2 === 0 ? 'Emerald' : 'Deep Teal',
      hex: index % 2 === 0 ? '#1F5B4D' : '#184A59',
      usage: 'Main garment colour.',
    })),
    accent_palette: Array.from({ length: 5 }, (_, index) => ({
      name: index % 2 === 0 ? 'Berry' : 'Burgundy',
      hex: index % 2 === 0 ? '#8A315A' : '#6E253B',
      usage: 'Finishing detail.',
    })),
    palette: [],
    avoid_colours: [],
  },
  face_hair_accessories: {
    face_shape: 'oval',
    face_direction: 'soft structure',
    hair_direction: 'polished soft waves',
    hair_colour_direction: 'warm chestnut',
    hair_colour_options: ['warm chestnut', 'soft caramel balayage', 'espresso gloss', 'honey face frame'],
    neckline_direction: 'open but modest',
    jewellery_direction: 'gold',
    eyewear_direction: 'soft rectangular',
    approved_necklines: ['boat neck', 'soft V neck'],
    hair_styles: ['soft waves', 'low bun', 'smooth blowout', 'side part'],
    eyewear_shapes: ['soft rectangular'],
    earring_shapes: ['small hoops'],
  },
  makeup: {
    style: 'natural everyday',
    everyday_direction: 'skin-first polish',
    steps: ['base', 'brows', 'eyes', 'cheeks', 'lips'],
    colours: ['rose-brown lip', 'warm peach cheek', 'soft brown eye'],
  },
  taste: {
    style_archetype: 'Western elevated minimalist',
    moodboard: 'Structured minimalist',
    signature_codes: ['tailoring', 'scarves', 'belts'],
    anti_codes: ['sloppy fits'],
    shopping_filters: ['polished fabrics'],
  },
  fabrics: {
    approved: [{ name: 'crepe', reason: 'clean fall' }],
    avoid: [{ name: 'clingy jersey', reason: 'too revealing' }],
  },
};

function formulaItem(slot: string, piece: string, colourName: string, colourHex: string, role: 'lead' | 'support' | 'ground' | 'accent') {
  return {
    slot,
    piece,
    colour_name: colourName,
    colour_hex: colourHex,
    palette_role: role,
    structural_notes: `${piece} supports the long clean line.`,
  };
}

function outfitPage(pageNumber: number, index: number, pieceOverride?: string): BlueprintPage {
  const group = index % 4;
  const professionalIndex = index % 5;
  const isProfessional = index < 5;
  const hasLayer = group === 2 || group === 3 || (isProfessional && [0, 2, 3].includes(professionalIndex));
  const onePiece = group === 1 || group === 3;
  const leadColours = [
    { name: 'Emerald', hex: '#1F5B4D' },
    { name: 'Berry', hex: '#8A315A' },
    { name: 'Deep Teal', hex: '#184A59' },
    { name: 'Burgundy', hex: '#6E253B' },
    { name: 'Olive', hex: '#5F6844' },
    { name: 'Cobalt', hex: '#2E4E9E' },
  ];
  const leadColour = leadColours[index % leadColours.length];
  const pattern = [1, 3, 6, 9, 12, 15].includes(index) ? ' with fine vertical pinstripe' : '';
  const basePiece = pieceOverride ?? (onePiece ? `${leadColour.name} crepe midi dress${pattern}` : `${leadColour.name} silk blouse${pattern}`);
  const items = [
    onePiece
      ? formulaItem('Dress', basePiece, leadColour.name, leadColour.hex, 'lead')
      : formulaItem('Top', basePiece, leadColour.name, leadColour.hex, 'lead'),
    ...(onePiece ? [] : [formulaItem('Bottom', 'Ivory wide-leg trousers', 'Ivory', '#F5F0E8', 'support')]),
    ...(hasLayer ? [formulaItem('Layer', isProfessional ? 'Ivory single-breasted blazer' : 'Ivory longline vest', 'Ivory', '#F5F0E8', 'support')] : []),
    formulaItem('Footwear', 'Chocolate leather pointed flats', 'Chocolate', '#4B2E24', 'ground'),
    formulaItem('Bag', 'Chocolate structured leather bag', 'Chocolate', '#4B2E24', 'ground'),
    formulaItem('Jewellery', 'Small gold hoops', 'Gold', '#B08D3F', 'accent'),
    ...(index < 8 ? [formulaItem('Finishing Detail', `${leadColour.name} silk scarf on bag handle`, leadColour.name, leadColour.hex, 'accent')] : []),
  ];
  return {
    page_number: pageNumber,
    page_type: 'outfit',
    title: `Outfit ${index + 1}`,
    subtitle: ['Professional', 'Social', 'Everyday', 'Occasion'][Math.floor(index / 5)] ?? 'Professional',
    blocks: [
      {
        label: 'Formula',
        heading: 'Harness formula',
        body: 'Archetype: Western Base + Elevated Finishing. Hero: main garment.',
        items,
      },
      { label: 'Why it works', heading: 'Harness styling logic', body: 'This works because the hero creates polish.', reason: 'This works because the hero creates polish.' },
      { label: 'Role breakdown', heading: 'Hero, anchor, bridge, finish', body: 'Hero: main garment. Face-lift: colour. Anchor: trousers. Bridge: leather. Finish: scarf.' },
      { label: 'Do not buy', heading: 'The version that breaks it', body: 'Do not buy the clingy version.' },
      { label: 'Score summary', heading: 'Harness score check', body: 'Body Geometry: 8+. Undertone Alignment: 8+. Visual Hierarchy: 8+. Realism: 8+.' },
    ],
    palette_used: [
      { name: leadColour.name, hex: leadColour.hex, role: 'lead' },
      { name: 'Ivory', hex: '#F5F0E8', role: 'support' },
      { name: 'Chocolate', hex: '#4B2E24', role: 'ground' },
    ],
    image_refs: [],
  };
}

function genericPage(pageNumber: number): BlueprintPage {
  return {
    page_number: pageNumber,
    page_type: pageNumber === 2 ? 'transformation' : 'diagnosis',
    title: `Page ${pageNumber}`,
    blocks: [
      { label: 'A', heading: 'Useful block', body: 'Useful content for the report.' },
      { label: 'B', heading: 'Useful block', body: 'Useful content for the report.' },
      { label: 'C', heading: 'Useful block', body: 'Useful content for the report.' },
    ],
    image_refs: [],
  };
}

function transformationPage(): BlueprintPage {
  return {
    page_number: 2,
    page_type: 'transformation',
    title: 'Transformation Preview',
    blocks: [1, 2, 3].map(index => ({
      label: `Look 0${index}`,
      heading: `Preview ${index}`,
      body: 'Preview direction.',
      items: [
        formulaItem('Top', `Preview emerald blouse ${index}`, 'Emerald', '#1F5B4D', 'lead'),
        formulaItem('Bottom', `Preview ivory trouser ${index}`, 'Ivory', '#F5F0E8', 'support'),
        formulaItem('Footwear', 'Chocolate leather pointed flats', 'Chocolate', '#4B2E24', 'ground'),
        formulaItem('Bag', 'Chocolate structured leather bag', 'Chocolate', '#4B2E24', 'ground'),
        formulaItem('Finishing Detail', `Emerald silk scarf ${index}`, 'Emerald', '#1F5B4D', 'accent'),
      ],
    })),
    image_refs: [],
  };
}

function reportWithOutfitOverride(pieceOverride?: string): StylistBlueprintReportData {
  const outfitStart = getStylistBlueprintOutfitStartPage(STYLIST_BLUEPRINT_VERSION);
  const pages = Array.from({ length: 41 }, (_, offset) => {
    const pageNumber = offset + 1;
    if (pageNumber === 2) return transformationPage();
    if (pageNumber >= outfitStart && pageNumber < outfitStart + 20) {
      return outfitPage(pageNumber, pageNumber - outfitStart, pageNumber === outfitStart ? pieceOverride : undefined);
    }
    return genericPage(pageNumber);
  });
  pages[17] = {
    page_number: 18,
    page_type: 'outfit_system',
    title: 'Outfit System',
    blocks: [{ label: 'Capsules', heading: 'Capsules', body: 'Professional, Social, Everyday, Occasion.' }],
    image_refs: [],
  };
  pages[38] = { ...genericPage(39), page_type: 'matrix' };
  pages[39] = { ...genericPage(40), page_type: 'audit' };
  pages[40] = { ...genericPage(41), page_type: 'continuation' };
  return {
    version: STYLIST_BLUEPRINT_VERSION,
    generated_at: '2026-07-01T00:00:00.000Z',
    client: { display_name: 'Client', email: 'client@example.com', month_year: 'July 2026' },
    analysis: {
      silhouette_profile: 'balanced',
      chromatic_family: 'neutral warm',
      facial_architecture: 'oval',
      style_direction: 'Western elevated',
      proportional_focus: ['length'],
      evidence_notes: ['synthetic test'],
      confidence: { body: 'medium', colour: 'medium', face: 'medium' },
    },
    classification,
    pages,
  };
}

export function runStylistBlueprintCulturalModeAssertions() {
  invariant(getStylistOutfitCulturalMode(baseSubmission) === 'western_default', 'India alone stays western_default');
  invariant(
    buildStylistBlueprintIntakeDigest(baseSubmission).includes('Outfit Cultural Mode: western_default'),
    'digest exposes western_default mode',
  );
  invariant(
    getStylistOutfitCulturalMode({
      ...baseSubmission,
      intake_source: 'manual_admin',
      raw_consultation_notes: 'Loves western, formals, trousers, tops, midis, belts.',
    }) === 'western_default',
    'manual western/formal notes stay western_default',
  );
  invariant(
    getStylistOutfitCulturalMode({
      ...baseSubmission,
      raw_consultation_notes: 'Needs a kurta and saree direction for festive events.',
    }) === 'ethnic_allowed',
    'explicit ethnic notes enable ethnic_allowed',
  );

  validateStylistBlueprintReport(reportWithOutfitOverride(), { culturalMode: 'western_default' });

  invariant(
    buildStylistBlueprintIntakeDigest(baseSubmission).includes('Do NOT use Indianwear'),
    'western_default prompt context still bans ethnicwear unless explicitly requested',
  );
  invariant(
    WOMEN_OUTFIT_HARNESS_V2.includes('dominant catalog source') &&
    WOMEN_OUTFIT_HARNESS_V2.includes('catalog-faithful adaptation, not reinvention') &&
    WOMEN_OUTFIT_HARNESS_V2.includes('Catalog skeleton first') &&
    WOMEN_OUTFIT_HARNESS_V2.includes('colour diversity') &&
    WOMEN_OUTFIT_HARNESS_V2.includes('at least 6 distinct lead colour families') &&
    WOMEN_OUTFIT_HARNESS_V2.includes('4 outfits maximum') &&
    WOMEN_OUTFIT_HARNESS_V2.includes('layer/no-layer diversity') &&
    WOMEN_OUTFIT_HARNESS_V2.includes('Do not add unnecessary detail to individual pieces') &&
    WOMEN_OUTFIT_HARNESS_V2.includes('Do not automatically turn modesty into only high necklines'),
    'harness master prompt strengthens library-led diversity guidance',
  );
  validateStylistBlueprintReport(reportWithOutfitOverride('Emerald straight kurta'), { culturalMode: 'western_default' });
  validateStylistBlueprintReport(reportWithOutfitOverride('Emerald straight kurta'), { culturalMode: 'ethnic_allowed' });

  const underFinished = reportWithOutfitOverride();
  underFinished.pages = underFinished.pages.map(page => page.page_type === 'outfit'
    ? {
      ...page,
      blocks: page.blocks.map(block => ({
        ...block,
        items: Array.isArray(block.items)
          ? block.items.filter(item => (item as { slot?: string }).slot !== 'Finishing Detail')
          : block.items,
      })),
    }
    : page);
  validateStylistBlueprintReport(underFinished, { culturalMode: 'western_default' });

  let missingPageRejected = false;
  const missingPageReport = reportWithOutfitOverride();
  missingPageReport.pages = missingPageReport.pages.filter(page => page.page_number !== getStylistBlueprintOutfitStartPage(STYLIST_BLUEPRINT_VERSION));
  try {
    validateStylistBlueprintReport(missingPageReport, { culturalMode: 'western_default' });
  } catch (error) {
    missingPageRejected = /Expected 41 pages|Missing page/i.test(error instanceof Error ? error.message : String(error));
  }
  invariant(missingPageRejected, 'lightweight validator still catches missing pages');

  const replacementReport = reportWithOutfitOverride();
  replacementReport.classification = {
    ...replacementReport.classification,
    colour: {
      ...replacementReport.classification.colour,
      base_palette: [
        { name: 'Emerald', hex: '#1F5B4D', usage: 'Existing rejected lead.' },
        { name: 'Deep Teal', hex: '#184A59', usage: 'Existing repeated lead.' },
        { name: 'Mustard', hex: '#B8872D', usage: 'Fresh replacement lead.' },
        ...replacementReport.classification.colour.base_palette.slice(3),
      ],
    },
  };
  const replacementPage = getStylistBlueprintOutfitStartPage(STYLIST_BLUEPRINT_VERSION);
  const replacementContext = buildReplacementOutfitContext(replacementReport, replacementPage);
  invariant(replacementContext?.replaced.lead_family === 'green', 'replacement context captures rejected lead colour family');
  invariant(replacementContext.used_lead_colours.includes('Deep Teal'), 'replacement context includes existing outfit colours');
  invariant(replacementContext.used_archetypes.includes('Western Base + Elevated Finishing'), 'replacement context includes existing style formulas');

  const replacementPrompt = replacementOutfitContextPrompt(replacementContext, 'try something more casual');
  invariant(
    replacementPrompt.includes('Do not repeat the rejected outfit') &&
    replacementPrompt.includes('Prefer a lead/main garment colour family') &&
    replacementPrompt.includes('Do not copy the same style world'),
    'replacement prompt tells the harness to avoid duplicate colour and style formulas',
  );

  const replacementPlan = buildReplacementPlan(replacementReport, replacementPage, '', undefined, 'western_default');
  invariant(replacementPlan.lead_colour.name !== 'Emerald', 'replacement plan avoids the replaced lead colour when alternatives exist');
  invariant(replacementPlan.library_reference?.source === 'women', 'replacement plan selects women library anchors when available');
  invariant(Boolean(replacementPlan.library_piece_logic?.length), 'replacement plan includes library_piece_logic for the harness');

  const libraryAnchoredReport = reportWithOutfitOverride();
  const currentLibraryRef = replacementPlan.library_reference;
  invariant(currentLibraryRef, 'replacement plan exposes a library reference');
  libraryAnchoredReport.pages = libraryAnchoredReport.pages.map(page => page.page_number === replacementPage
    ? { ...page, library_refs: [currentLibraryRef] }
    : page);
  const alternativeLibraryPlan = buildReplacementPlan(libraryAnchoredReport, replacementPage, '', undefined, 'western_default');
  invariant(
    alternativeLibraryPlan.library_reference?.id !== currentLibraryRef.id,
    'replacement planning avoids the rejected/current library id when another women anchor exists',
  );

  const casualReplacementPlan = buildReplacementPlan(replacementReport, replacementPage, 'make it more casual', undefined, 'western_default');
  invariant(casualReplacementPlan.formula_direction.includes('easy top + relaxed bottom'), 'replacement plan honours admin reason');
}
