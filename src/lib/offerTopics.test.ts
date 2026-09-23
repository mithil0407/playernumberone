import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { OFFER_TOPICS, OFFER_TOPIC_KEYS, offerCheckoutHref, parseOfferTopicKey } from './offerTopics.ts';

test('builds topic checkout links on the shared offer checkout', () => {
  assert.equal(offerCheckoutHref('general'), '/offer-2699/checkout');
  assert.equal(offerCheckoutHref('sleeves'), '/offer-2699/checkout?topic=sleeves');
  assert.equal(offerCheckoutHref('modest', 'abc 1'), '/offer-2699/checkout?topic=modest&scan=abc+1');
});

test('ignores unknown topic query values', () => {
  assert.equal(parseOfferTopicKey('sleeves'), 'sleeves');
  assert.equal(parseOfferTopicKey('general'), 'general');
  assert.equal(parseOfferTopicKey('<script>'), undefined);
  assert.equal(parseOfferTopicKey(undefined), undefined);
});

test('every topic page uses the offer price, its own topic and the shared Meta entry', async () => {
  for (const key of OFFER_TOPIC_KEYS) {
    const topic = OFFER_TOPICS[key];
    const file = key === 'general' ? '../app/offer-2699/page.tsx' : `../app/offer-2699/${key}/page.tsx`;
    const page = await readFile(new URL(file, import.meta.url), 'utf8');

    assert.match(page, /variant="offer2699"/);
    assert.match(page, new RegExp(`topic="${key}"`));
    assert.match(page, new RegExp(`offerCheckoutHref\\('${key}'`));
    assert.match(page, /INDIA_OFFER_2699_BLUEPRINT_PRICE/);
    // A separate trackingEntry would split the Meta content category.
    assert.doesNotMatch(page, /trackingEntry=/);
    assert.equal(topic.path, key === 'general' ? '/offer-2699' : `/offer-2699/${key}`);
  }
});
