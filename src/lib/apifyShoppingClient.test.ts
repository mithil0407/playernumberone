// Exercises APIFY_MOCK mode end-to-end: run start → status → item fetch.
// Run with: APIFY_MOCK=1 npx tsx src/lib/apifyShoppingClient.test.ts

process.env.APIFY_MOCK = '1';
process.env.SHOPPING_MAX_RESULTS_PER_QUERY = '5';

import {
  fetchShoppingItems,
  getShoppingMaxResultsPerQuery,
  getShoppingRunStatus,
  startShoppingRun,
} from './apifyShoppingClient';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  invariant(getShoppingMaxResultsPerQuery() === 5, 'reads maxResults from env');

  const queries = ['ivory cotton oxford shirt slim fit men', 'black leather derby men'];
  const run = await startShoppingRun(queries, { maxResults: 5, country: 'in' });
  invariant(run.runId.startsWith('mock:'), 'mock run id is tagged');
  invariant(run.datasetId === run.runId, 'mock dataset id mirrors run id');

  const status = await getShoppingRunStatus(run.runId);
  invariant(status === 'SUCCEEDED', 'mock runs always succeed');

  const items = await fetchShoppingItems(run.datasetId);
  invariant(items.length === queries.length * 5, `expected ${queries.length * 5} items, got ${items.length}`);

  for (const query of queries) {
    const queryItems = items.filter(item => item.query === query);
    invariant(queryItems.length === 5, `every query yields maxResults items (${query})`);
    for (const item of queryItems) {
      invariant(item.title.length > 0 && item.productUrl.startsWith('https://'), 'items have title + https url');
      invariant(item.currency === 'INR', 'mock prices are INR');
      invariant(typeof item.priceNumeric === 'number' && item.priceNumeric >= 799, 'mock prices are plausible');
    }
  }

  const again = await fetchShoppingItems(run.datasetId);
  invariant(
    JSON.stringify(again) === JSON.stringify(items),
    'mock items are deterministic for the same dataset id',
  );

  console.log('apifyShoppingClient.test.ts passed');
}

void main();
