/**
 * Jazz's visual review of the women's outfit library.
 *
 * Every Pinterest and ethnic office look gets one studio picture (made on the
 * operator's Mac with the signed-in ChatGPT account, see
 * scripts/outfit-library-images.mts). The curator stylist swipes each picture
 * like or pass at /stylist/<slug>/outfit-review, and the women's outfit engine
 * then recommends only what she liked:
 *
 * - a look she passed on is never recommended again, from the moment she swipes;
 * - once she has been through every picture, looks she has not liked (new or
 *   picture-less ones included) drop out too, so only her likes are used.
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

/** The curator's verdicts, plus which looks have a picture she can judge. */
export interface OutfitLibraryCuration {
  verdicts: Map<string, OutfitVerdict>;
  imagedLookIds: Set<string>;
}

/**
 * The likes-only switch is held back until she has liked at least this many
 * looks, so a half-finished or very harsh pass can never leave clients short
 * of outfits. Below it, only her passes are removed.
 */
export const MIN_LIKES_FOR_LIKES_ONLY = 120;

export type CurationMode = 'off' | 'drop_passes' | 'likes_only';

export function curationMode(looks: Pick<VerbatimLook, 'id'>[], curation: OutfitLibraryCuration | null): CurationMode {
  if (!curation || curation.verdicts.size === 0) return 'off';
  let likes = 0;
  let pending = 0;
  for (const look of looks) {
    const verdict = curation.verdicts.get(look.id);
    if (verdict === 'like') likes += 1;
    else if (!verdict && curation.imagedLookIds.has(look.id)) pending += 1;
  }
  return pending === 0 && likes >= MIN_LIKES_FOR_LIKES_ONLY ? 'likes_only' : 'drop_passes';
}

/** The library as the engine should see it, after the curator's swipes. */
export function applyOutfitLibraryCuration<T extends Pick<VerbatimLook, 'id'>>(looks: T[], curation: OutfitLibraryCuration | null): T[] {
  const mode = curationMode(looks, curation);
  if (mode === 'off' || !curation) return looks;
  if (mode === 'likes_only') return looks.filter(look => curation.verdicts.get(look.id) === 'like');
  return looks.filter(look => curation.verdicts.get(look.id) !== 'dislike');
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
