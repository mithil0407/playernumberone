import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { indexedSeoPages, noindexSeoPages, redirectSeoPages, seoPageInventory } from './seoContent.ts';
import { buildMetadata, SITE_URL } from './seo.ts';
import { leadMagnetDefinitions } from './leadMagnets.ts';
import nextConfig from '../../next.config.ts';

test('metadata is emitted in the initial head for both crawlers and browsers', () => {
  assert.ok(nextConfig.htmlLimitedBots?.test('Googlebot'));
  assert.ok(nextConfig.htmlLimitedBots?.test('Mozilla/5.0 Chrome/154.0'));
});

test('SEO inventory assigns one policy per route and includes current public products', () => {
  const paths = seoPageInventory.map(entry => entry.path);
  assert.equal(new Set(paths).size, paths.length, 'Duplicate/conflicting indexing policy');
  for (const pathname of ['/style-scan', '/instant-report']) {
    assert.ok(indexedSeoPages.some(entry => entry.path === pathname));
  }
  for (const entry of indexedSeoPages) {
    assert.ok(!entry.path.includes('?') && !entry.path.includes('#'));
    assert.ok(!noindexSeoPages.some(excluded => entry.path === excluded.path || entry.path.startsWith(excluded.path + '/')));
    assert.ok(!redirectSeoPages.some(redirect => entry.path === redirect.path));
  }
});

test('every page route has an intentional indexing policy', () => {
  const root = path.resolve('src/app');
  const routes: string[] = [];
  function walk(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(directory, entry.name));
      else if (entry.name === 'page.tsx') routes.push('/' + path.relative(root, directory).split(path.sep).join('/'));
    }
  }
  walk(root);
  const exact = new Set(seoPageInventory.map(entry => entry.path));
  const missing = routes.filter(route => !exact.has(route)
    && !noindexSeoPages.some(entry => route.startsWith(entry.path + '/'))
    && route !== '/tools/[slug]'
    && !/^\/stylist\/\[stylistSlug\]\/(?:dashboard|consultations|reports)(?:\/|$)/.test(route));
  assert.deepEqual(missing, [], 'Add new public, private or redirect routes to the SEO inventory');
  for (const tool of leadMagnetDefinitions) assert.ok(exact.has(`/tools/${tool.slug}`));
  const implemented = new Set(routes);
  for (const entry of indexedSeoPages) {
    assert.ok(implemented.has(entry.path) || leadMagnetDefinitions.some(tool => entry.path === `/tools/${tool.slug}`),
      `Sitemap URL has no page: ${entry.path}`);
  }
});

test('new public metadata produces a clean canonical and private metadata excludes Googlebot', () => {
  const publicPage = buildMetadata({ title: 'Colour Analysis', description: 'A public colour guide', path: '/style-scan' });
  assert.equal(publicPage.alternates?.canonical, SITE_URL + '/style-scan');
  const privatePage = buildMetadata({ title: 'Private', description: 'Client report', path: '/stylist/report', noIndex: true });
  assert.equal((privatePage.robots as { index: boolean }).index, false);
  assert.equal((privatePage.robots as { googleBot: { index: boolean } }).googleBot.index, false);
});
