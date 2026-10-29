/**
 * Jazz's visual review of the women's outfit library.
 *
 * Every Pinterest and ethnic office look gets one studio picture (made on the
 * operator's Mac with the signed-in ChatGPT account, see
 * scripts/outfit-library-images.mts). The curator stylist swipes each picture
 * like or pass at /stylist/<slug>/outfit-review, and the women's outfit engine
 * then recommends only what she liked:
 *
 * Only an explicit Keep makes a look eligible. Passed, unreviewed, new and
 * picture-less looks stay out, even while she is still reviewing the library.
 * Missing review data never opens the full library to recommendations.
 *
 * This file is pure so the engine and its tests can use it without a database.
 */
import { createHash } from 'node:crypto';
import { bannedOutfitFor } from './stylistBannedOutfits.ts';
import type { VerbatimLook } from './stylistPinterestOutfits.ts';

export const OUTFIT_LIBRARY_IMAGE_PROMPT_VERSION = 'library_studio_v1';
export const OUTFIT_LIBRARY_IMAGE_BUCKET = 'stylist-outfit-library';

/** Whose swipes steer the engine. One stylist curates; others can look. */
export function outfitLibraryCuratorSlug() {
  return (process.env.STYLIST_OUTFIT_CURATOR_SLUG ?? '').trim().toLowerCase() || 'jazz';
}

export type OutfitVerdict = 'like' | 'dislike';

/** The curator's saved verdicts. */
export interface OutfitLibraryCuration {
  verdicts: Map<string, OutfitVerdict>;
}

/** The library as the engine should see it, after the curator's swipes. */
export function applyOutfitLibraryCuration<T extends Pick<VerbatimLook, 'id'>>(looks: T[], curation: OutfitLibraryCuration | null): T[] {
  return looks.filter(look => curation?.verdicts.get(look.id) === 'like');
}

/** Already banned looks are never recommended, so they are not worth her time. */
export function isReviewableLook(look: VerbatimLook) {
  return !bannedOutfitFor([look.top, look.dress, look.layer, look.bottom]);
}

function cleanPiece(value: string | undefined) {
  const text = (value ?? '').trim().replace(/\.$/, '');
  if (!text || /^(none|no layer|n\/a|-|—)$/i.test(text)) return '';
  return text;
}

/** The outfit lines the picture is drawn from, exactly as the library has them. */
export function lookOutfitLines(look: VerbatimLook) {
  const shoes = cleanPiece(look.shoes);
  return [
    look.dress ? `Dress: ${cleanPiece(look.dress)}` : '',
    cleanPiece(look.top) ? `Top: ${cleanPiece(look.top)}` : '',
    cleanPiece(look.layer) ? `Layer: ${cleanPiece(look.layer)}` : '',
    cleanPiece(look.bottom) && !/^(dress|built-in|attached)/i.test(cleanPiece(look.bottom)) ? `Bottom: ${cleanPiece(look.bottom)}` : '',
    shoes && !/not visible|hidden/i.test(shoes) ? `Shoes: ${shoes}` : 'Shoes: simple shoes that suit the outfit, in a quiet neutral',
    cleanPiece(look.accessories) ? `Accessories: ${cleanPiece(look.accessories)}` : '',
  ].filter(Boolean);
}

/**
 * One studio picture of a look on a consistent model, so Jazz judges the
 * outfit rather than the setting. White studio only: invented real-world
 * settings read as fake (owner feedback, 2026-10-10).
 */
export function buildOutfitLibraryImagePrompt(look: VerbatimLook) {
  const styling = cleanPiece(look.styling);
  return `Create a photorealistic full-body fashion catalogue photograph of an Indian woman in her early thirties wearing the outfit below.

She has an average, healthy build (about UK size 12, 5'4"), medium-brown skin and dark hair styled neatly to suit the outfit, with soft natural makeup. Relaxed natural stance, weight on one leg, arms loose so every garment is visible, a gentle smile.

Plain white seamless studio background, soft even light, a soft shadow on the floor. Head to toe in frame, portrait 2:3, nothing cropped. True-to-life colours and fabrics. No text, logos or watermarks.

Outfit:
${lookOutfitLines(look).map(line => `- ${line}`).join('\n')}

${styling ? `Worn: ${styling}. Nothing tucked, belted or added unless stated.` : 'Nothing tucked, belted or added unless stated.'}`;
}

/** Changes when the look's words or the prompt change, so stale pictures are redrawn. */
export function outfitLibraryImageHash(look: VerbatimLook) {
  return createHash('sha1').update(`${OUTFIT_LIBRARY_IMAGE_PROMPT_VERSION}\n${buildOutfitLibraryImagePrompt(look)}`).digest('hex').slice(0, 12);
}

/** A short line for the card under the picture. */
export function lookCaption(look: VerbatimLook) {
  return [look.dress, look.top, look.layer, look.bottom].map(cleanPiece).filter(Boolean).join(' · ');
}
