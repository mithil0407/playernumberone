import 'server-only';

import { supabaseAdmin } from './supabase';
import { getAllVerbatimLooks, setOutfitLibraryCuration, type VerbatimLook } from './stylistPinterestOutfits';
import {
  OUTFIT_LIBRARY_IMAGE_BUCKET,
  isReviewableLook,
  lookCaption,
  outfitLibraryCuratorSlug,
  type OutfitLibraryCuration,
  type OutfitVerdict,
} from './stylistOutfitLibraryReview';

const SIGNED_URL_TTL = 6 * 60 * 60;

async function loadCuration(): Promise<OutfitLibraryCuration> {
  const { data: curator, error: curatorError } = await supabaseAdmin
    .from('stylists').select('id').eq('slug', outfitLibraryCuratorSlug()).maybeSingle();
  if (curatorError) throw curatorError;
  if (!curator) throw new Error('The outfit curator could not be found. Check the stylist account before recommending outfits.');
  const votes = await supabaseAdmin.from('stylist_outfit_library_votes').select('look_id, verdict').eq('stylist_id', curator.id);
  if (votes.error) throw votes.error;
  return {
    verdicts: new Map((votes.data ?? []).map(row => [row.look_id as string, row.verdict as OutfitVerdict])),
  };
}

/**
 * Loads the curator's swipes for the women's outfit engine. Call before an
 * engine run so a new Pass or undo takes effect on the next recommendation.
 * If the saved choices cannot be read, stop instead of recommending unchecked
 * looks or using an older Keep that the curator may have since removed.
 */
export async function primeOutfitLibraryCuration() {
  try {
    setOutfitLibraryCuration(await loadCuration());
  } catch (error) {
    setOutfitLibraryCuration(null);
    console.error('[outfit-library] could not load the curator choices', error);
    throw new Error('Could not load the stylist\'s kept outfits. Retry before generating recommendations.');
  }
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
  mode: 'likes_only';
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
    mode: 'likes_only',
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
  setOutfitLibraryCuration(null);
}
