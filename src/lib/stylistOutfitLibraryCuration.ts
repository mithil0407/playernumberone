import 'server-only';

import { supabaseAdmin } from './supabase';
import { getAllVerbatimLooks, setOutfitLibraryCuration, type VerbatimLook } from './stylistPinterestOutfits';
import {
  OUTFIT_LIBRARY_IMAGE_BUCKET,
  curationMode,
  isReviewableLook,
  lookCaption,
  outfitLibraryCuratorSlug,
  type OutfitLibraryCuration,
  type OutfitVerdict,
} from './stylistOutfitLibraryReview';

const REFRESH_MS = 60_000;
const SIGNED_URL_TTL = 6 * 60 * 60;
let loadedAt = 0;
let inFlight: Promise<void> | null = null;

async function loadCuration(): Promise<OutfitLibraryCuration | null> {
  const { data: curator, error: curatorError } = await supabaseAdmin
    .from('stylists').select('id').eq('slug', outfitLibraryCuratorSlug()).maybeSingle();
  if (curatorError) throw curatorError;
  if (!curator) return null;
  const [votes, images] = await Promise.all([
    supabaseAdmin.from('stylist_outfit_library_votes').select('look_id, verdict').eq('stylist_id', curator.id),
    supabaseAdmin.from('stylist_outfit_library_images').select('look_id'),
  ]);
  if (votes.error) throw votes.error;
  if (images.error) throw images.error;
  return {
    verdicts: new Map((votes.data ?? []).map(row => [row.look_id as string, row.verdict as OutfitVerdict])),
    imagedLookIds: new Set((images.data ?? []).map(row => row.look_id as string)),
  };
}

/**
 * Loads the curator's swipes for the women's outfit engine. Call before an
 * engine run; refreshes at most once a minute. A database problem keeps the
 * last known swipes (or the whole library) rather than failing a report.
 */
export async function primeOutfitLibraryCuration(options: { force?: boolean } = {}) {
  if (!options.force && Date.now() - loadedAt < REFRESH_MS) return;
  inFlight ??= loadCuration()
    .then(curation => {
      setOutfitLibraryCuration(curation);
      loadedAt = Date.now();
    })
    .catch(error => {
      console.error('[outfit-library] could not load the curator swipes; using the last known set', error);
      loadedAt = Date.now();
    })
    .finally(() => { inFlight = null; });
  await inFlight;
}

export interface OutfitReviewCard {
  id: string;
  imageUrl: string;
  caption: string;
  shoes: string;
  accessories: string;
  styling: string;
  capsule: string;
  ethnic: boolean;
  verdict: OutfitVerdict | null;
}

export interface OutfitReviewDeck {
  cards: OutfitReviewCard[];
  totalLooks: number;
  withPictures: number;
  liked: number;
  passed: number;
  isCurator: boolean;
  mode: ReturnType<typeof curationMode>;
}

function reviewableLooks() {
  return getAllVerbatimLooks().filter(isReviewableLook);
}

/** Every look with a picture, in a stable mixed order, with her verdict on each. */
export async function loadOutfitReviewDeck(stylist: { stylistId: string; slug: string }): Promise<OutfitReviewDeck> {
  const looks = reviewableLooks();
  const [images, votes] = await Promise.all([
    supabaseAdmin.from('stylist_outfit_library_images').select('look_id, storage_path, created_at').order('created_at', { ascending: true }),
    supabaseAdmin.from('stylist_outfit_library_votes').select('look_id, verdict').eq('stylist_id', stylist.stylistId),
  ]);
  if (images.error) throw images.error;
  if (votes.error) throw votes.error;
  const byId = new Map(looks.map(look => [look.id, look]));
  const verdicts = new Map((votes.data ?? []).map(row => [row.look_id as string, row.verdict as OutfitVerdict]));
  const rows = (images.data ?? []).filter(row => byId.has(row.look_id));
  const paths = rows.map(row => row.storage_path as string);
  const signed = paths.length
    ? await supabaseAdmin.storage.from(OUTFIT_LIBRARY_IMAGE_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
    : { data: [], error: null };
  if (signed.error) throw signed.error;
  const urlByPath = new Map((signed.data ?? []).map(item => [item.path, item.signedUrl]));
  const cards = rows.flatMap(row => {
    const look = byId.get(row.look_id) as VerbatimLook;
    const imageUrl = urlByPath.get(row.storage_path);
    if (!imageUrl) return [];
    return [{
      id: look.id,
      imageUrl,
      caption: lookCaption(look),
      shoes: look.shoes ?? '',
      accessories: look.accessories ?? '',
      styling: look.styling ?? '',
      capsule: look.capsules[0],
      ethnic: look.ethnic,
      verdict: verdicts.get(look.id) ?? null,
    }];
  });
  const isCurator = stylist.slug === outfitLibraryCuratorSlug();
  return {
    cards,
    totalLooks: looks.length,
    withPictures: cards.length,
    liked: cards.filter(card => card.verdict === 'like').length,
    passed: cards.filter(card => card.verdict === 'dislike').length,
    isCurator,
    mode: curationMode(looks, { verdicts, imagedLookIds: new Set(rows.map(row => row.look_id)) }),
  };
}

/** Saves one swipe, or clears it when she rewinds. */
export async function saveOutfitVerdict(stylistId: string, lookId: string, verdict: OutfitVerdict | null) {
  if (!reviewableLooks().some(look => look.id === lookId)) throw new Error('Unknown look');
  const result = verdict
    ? await supabaseAdmin.from('stylist_outfit_library_votes').upsert({
      stylist_id: stylistId,
      look_id: lookId,
      verdict,
      updated_at: new Date().toISOString(),
    })
    : await supabaseAdmin.from('stylist_outfit_library_votes').delete().eq('stylist_id', stylistId).eq('look_id', lookId);
  if (result.error) throw result.error;
  loadedAt = 0;
}
