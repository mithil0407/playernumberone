import assert from 'node:assert/strict';
import test from 'node:test';
import { supabaseAdmin } from './supabase.ts';
import { primeOutfitLibraryCuration } from './stylistOutfitLibraryCuration.ts';
import { getAllVerbatimLooks, getVerbatimLooks, setOutfitLibraryCuration } from './stylistPinterestOutfits.ts';

test('each run reloads the curator choices and a failed read clears earlier keeps', async t => {
  const [kept, passed] = getAllVerbatimLooks();
  let verdict = 'like';
  let fail = false;
  let missingCurator = false;
  const slugs: string[] = [];
  t.mock.method(console, 'error', () => {});
  t.mock.method(supabaseAdmin, 'from', (table: string) => ({
    select: () => ({
      eq: (_key: string, value: string) => {
        if (table === 'stylists') {
          slugs.push(value);
          return { maybeSingle: async () => ({ data: missingCurator ? null : { id: 'curator' }, error: null }) };
        }
        assert.equal(table, 'stylist_outfit_library_votes');
        assert.equal(value, 'curator');
        return Promise.resolve({ data: [{ look_id: kept.id, verdict }, { look_id: passed.id, verdict: 'dislike' }], error: fail ? new Error('database unavailable') : null });
      },
    }),
  }));
  try {
    await primeOutfitLibraryCuration();
    assert.deepEqual(getVerbatimLooks(), [kept]);
    verdict = 'dislike';
    await primeOutfitLibraryCuration();
    assert.deepEqual(getVerbatimLooks(), []);
    verdict = 'like';
    await primeOutfitLibraryCuration();
    assert.deepEqual(getVerbatimLooks(), [kept]);
    fail = true;
    await assert.rejects(primeOutfitLibraryCuration(), /Could not load the stylist's kept outfits/);
    assert.deepEqual(getVerbatimLooks(), []);
    fail = false;
    await primeOutfitLibraryCuration();
    assert.deepEqual(getVerbatimLooks(), [kept]);
    missingCurator = true;
    await assert.rejects(primeOutfitLibraryCuration(), /Could not load the stylist's kept outfits/);
    assert.deepEqual(getVerbatimLooks(), []);
    assert.equal(slugs.length, 6);
    assert.ok(slugs.every(slug => slug === (process.env.STYLIST_OUTFIT_CURATOR_SLUG || 'jazz')));
  } finally {
    setOutfitLibraryCuration(null);
  }
});
