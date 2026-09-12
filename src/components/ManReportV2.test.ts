import { getManReportSlideMeta } from './ManReport';
import type { ReportData } from '@/lib/manReportGenerator';
import {
  buildComboGridImagePromptForReport,
  buildOutfitImagePromptForReport,
  mergeManReportImagePaths,
  type ManReportImagePaths,
} from '@/lib/manImageGenerator';
import { extractFullManIdentityStatement } from '@/lib/manReportPresentation';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const MAN_BLUEPRINT_V2_VERSION = 'man_blueprint_v2';

const outfits = Array.from({ length: 20 }, (_, index) => {
  const number = index + 1;
  const context = number <= 6
    ? 'OFFICE / FORMAL'
    : number <= 10
      ? 'SMART CASUAL'
      : number <= 15
        ? 'EVENING WEAR'
        : 'RELAXED CASUAL';
  return `OUTFIT ${number} — ${context}
TOP: Ivory cotton shirt
BOTTOM: Navy tailored trouser
LAYER: Camel blazer
FOOTWEAR: Brown leather loafer
ACCESSORIES: Steel watch
OCCASION ANCHOR: Wear this when polish matters.`;
}).join('\n\n');

function report(): ReportData {
  return {
    report_version: MAN_BLUEPRINT_V2_VERSION,
    classification: {
      client: { location_region: 'India', height_category: 'average', primary_goal: 'professional' },
      body: {
        silhouette_type: 'rectangle',
        fat_storage_zone: 'belly',
        highlight_zone: 'shoulders',
        minimise_zone: 'belly',
        fit_directive: 'structured but not tight',
        height_adjustment: 'quarter-break trousers',
        silhouette_rules: ['Add shoulder structure', 'Use open layers', 'Keep trouser line clean'],
        avoid_cuts: ['Skinny trousers', 'Boxy short jackets'],
      },
      face: {
        face_shape: 'oblong',
        feature_type: 'angular',
        hair_presence: 'full_hair',
        facial_hair_presence: 'stubble',
        grooming_focus: 'hairstyle',
        hairstyle_recommendations: ['Short textured crop', 'Side part', 'Crew cut', 'Brushed back'],
        beard_style_recommendations: ['Designer stubble', 'Short boxed beard', 'Clean shave', 'Light moustache'],
        beard_maintenance: 'Clean neckline every 3 days.',
        facial_hair_recommendations: 'Keep edges clean.',
        eyewear_shapes: ['Rectangular optical', 'Soft square optical', 'Wayfarer sunglasses', 'Aviator sunglasses'],
        skincare_routine: {
          morning: ['Cleanser', 'Moisturiser', 'Sunscreen'],
          evening: ['Cleanser', 'Moisturiser'],
          shaving_or_beard_area: 'Keep shave line clean.',
          skin_adjustment: 'Adjust texture by weather.',
        },
      },
      colour: {
        season: 'Warm Autumn',
        undertone: 'warm',
        skin_tone_depth: 'medium',
        primary_palette: [{ name: 'Olive', hex: '#6B6B00', usage: 'near face' }],
        neutral_base_colours: [{ name: 'Charcoal', hex: '#36454F' }],
        accent_colours: [{ name: 'Rust', hex: '#B7410E' }],
        colours_to_avoid: [{ name: 'Icy blue', hex: '#D9F0FF', reason: 'Too cool' }],
        pattern_guidance: 'Low contrast patterns.',
        fabric_tone_guidance: 'Matte texture.',
      },
      style_brief: {
        primary_brief: 'Polished professional',
        aesthetic_direction: 'Clean authority',
        tribes: ['power_classic'],
        register: 'work',
        expression: 'minimal',
        structure_level: 'structured',
        anti_preferences: '',
        style_blocker: '',
        key_aspiration: 'Look sharper',
      },
      outfit_split: {
        total: 20,
        categories: [
          { category: 'Office / Formal', count: 6, rationale: '' },
          { category: 'Smart Casual', count: 4, rationale: '' },
          { category: 'Evening Wear', count: 5, rationale: '' },
          { category: 'Relaxed Casual', count: 5, rationale: '' },
        ],
      },
    },
    diagnostics: {
      faceGeometryVerdict: 'Face geometry verdict.',
      frameFrontVerdict: 'Frame verdict.',
      frameSideVerdict: 'Side verdict.',
      frameSideFallback: 'No side photo.',
      frameTrainingDirection: { title: '4-week direction', weeks: 'Four weeks.', focus: ['Shoulders', 'Core', 'Posture'] },
      colourDrapeVerdict: 'Colour verdict.',
    },
    deliverables: {
      strongestOutfitNumber: 1,
      linkedinHeadshotSpec: 'Headshot spec.',
      datingProfileShots: [
        { title: 'Evening', outfitNumber: 11, scene: 'Dinner', usage: 'Primary' },
        { title: 'Candid', outfitNumber: 16, scene: 'Cafe', usage: 'Secondary' },
        { title: 'Activity', outfitNumber: 18, scene: 'Gallery', usage: 'Lifestyle' },
      ],
    },
    sections: {
      s0_snapshot: 'Snapshot',
      s1_face: 'Face',
      s2_body: 'Body',
      s3_colour: 'Colour',
      s4_outfits: outfits,
      s4_combo_grids: '### Office Basic Combinations',
      s5_shopping: '#### Buy First\n- Navy trouser',
      s5_grooming_skin: 'Grooming',
      s6_identity: 'You look intentional. Keep it consistent.',
    },
    generated_at: '2026-07-09T00:00:00.000Z',
  };
}

export function runManReportV2Assertions() {
  const slides = getManReportSlideMeta(report());
  invariant(slides.length === 36, `v2 report has 36 slides, got ${slides.length}`);
  invariant(slides[0].slideType === 'cover', 'first slide is cover');
  invariant(slides[1].slideType === 'overview', 'second slide is scorecard/overview');
  invariant(slides[2].slideType === 'face_geometry', 'face geometry starts the face pillar');
  invariant(!slides.some(slide => slide.title === 'Side Profile'), 'side-profile slide is removed even when legacy data exists');
  invariant(slides.every((slide, index) => slide.pageNumber === index + 1), 'visible v2 page numbers stay contiguous');
  invariant(slides[8].legacyPageNumber === 10, 'the first slide after removed side profile maps to its old approval page');
  invariant(slides[8].approvalKey === 'slide:frame_training', 'stable approval identity does not depend on page number');
  invariant(!slides.some(slide => slide.slideType === 'combo_grids'), 'combo grids are folded out of standalone v2 slide metadata');
  invariant(slides.filter(slide => slide.slideType === 'outfit').length === 20, 'v2 keeps 20 outfit slides');
  invariant(slides.some(slide => slide.title === 'Social Media Inspiration'), 'customer-facing social slide does not use dating language');
  invariant(slides.at(-1)?.slideType === 'shopping_identity', 'final v2 slide combines shopping and identity close');
  invariant(
    extractFullManIdentityStatement('## Identity\nFirst sentence. Final confidence sentence.') ===
      'First sentence. Final confidence sentence.',
    'v2 identity close keeps the complete identity statement without its markdown heading',
  );

  const outfitPrompt = buildOutfitImagePromptForReport(report().sections, report().classification, 2);
  invariant(outfitPrompt.includes('adjusting one cuff or the watch'), 'outfit prompt rotates to a stylish editorial pose');
  invariant(outfitPrompt.includes("do not copy its stance"), 'outfit prompt does not preserve the source stance');
  invariant(outfitPrompt.includes('must not hide the neckline'), 'outfit pose keeps fit and garment details visible');
  invariant(outfitPrompt.includes('no visible flooring or room'), 'outfit prompt enforces the light seamless studio background');
  invariant(outfitPrompt.includes('RGB 148, 166, 173'), 'outfit prompt locks the stylist-admin background colour');

  const comboPrompt = buildComboGridImagePromptForReport('office', report().sections, report().classification);
  invariant(comboPrompt.includes('different confident menswear pose in every column'), 'combination grid varies poses by column');
  invariant(comboPrompt.includes('Pose: Use a relaxed editorial weight shift'), 'combination grid assigns explicit per-column poses');

  const merged = mergeManReportImagePaths(null, {
    diagnostic: {
      faceGeometry: 'r/diagnostic_face_geometry.jpg',
      frameFront: 'r/diagnostic_frame_front.jpg',
      colourDrape: 'r/diagnostic_colour_drape.jpg',
    },
    deliverables: {
      beforeImage: 'r/before.jpg',
      afterImage: 'r/after.jpg',
      beforeAfter: 'r/before_after.jpg',
      linkedinHeadshot: 'r/linkedin.jpg',
      datingProfileShots: ['r/date1.jpg', 'r/date2.jpg', 'r/date3.jpg'],
    },
  } satisfies Partial<ManReportImagePaths>);

  invariant(merged.diagnostic?.faceGeometry === 'r/diagnostic_face_geometry.jpg', 'merges diagnostic face geometry path');
  invariant(merged.deliverables?.beforeImage === 'r/before.jpg', 'merges separate before path');
  invariant(merged.deliverables?.afterImage === 'r/after.jpg', 'merges separate after path');
  invariant(merged.deliverables?.beforeAfter === 'r/before_after.jpg', 'retains legacy comparison path');
  invariant(merged.deliverables?.datingProfileShots?.length === 3, 'merges dating profile shot paths');
}
