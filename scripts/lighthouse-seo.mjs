#!/usr/bin/env node
// Requires Lighthouse CLI: npm exec --package=lighthouse -- lighthouse --version
// LIGHTHOUSE_CLI=/path/to/lighthouse/cli/index.js npm run seo:lighthouse -- --site https://www.iconik.pro
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const site = option('--site', 'https://www.iconik.pro').replace(/\/$/, '');
const output = option('--output', 'reports/lighthouse-seo');
const concurrency = Number(option('--concurrency', '2'));
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error('Concurrency must be between 1 and 4');
await mkdir(output, { recursive: true });
const response = await fetch(`${site}/sitemap.xml`);
if (!response.ok) throw new Error(`Sitemap HTTP ${response.status}`);
const xml = await response.text();
if (/<sitemapindex\b/.test(xml)) throw new Error('Use a URL sitemap, not a sitemap index');
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/gs)].map(match => new URL(match[1].replace(/&amp;/g, '&')).pathname);
if (!urls.length) throw new Error('No sitemap URLs');
const cli = process.env.LIGHTHOUSE_CLI;
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < urls.length) {
    const pathname = urls[cursor++];
    const name = pathname === '/' ? 'home' : pathname.slice(1).replaceAll('/', '__');
    const filename = path.resolve(output, `${name}.json`);
    if (args.includes('--resume')) {
      try {
        const previous = JSON.parse(await readFile(filename, 'utf8'));
        if (previous.categories.seo.score === 1 && !previous.runtimeError && !previous.runWarnings?.length
          && new URL(previous.finalDisplayedUrl ?? previous.finalUrl).pathname === pathname) {
          results.push({ path: pathname, score: 1, failures: [], exitCode: 0, reused: true });
          continue;
        }
      } catch { /* No usable completed audit. */ }
    }
    // Advertising/analytics endpoints can hang and do not affect page SEO.
    // Blocking them is ONLY for this SEO batch; performance audits retain them.
    const flags = [site + pathname, '--chrome-flags=--headless --no-first-run', '--only-categories=seo',
      '--blocked-url-patterns=*connect.facebook.net/*', '--blocked-url-patterns=*connect.iconik.pro/*',
      '--blocked-url-patterns=*googletagmanager.com/*', '--blocked-url-patterns=*clarity.ms/*',
      '--blocked-url-patterns=*facebook.com/tr/*',
      '--throttling-method=provided', '--max-wait-for-load=45000', '--output=json', `--output-path=${filename}`, '--quiet'];
    const command = cli ? process.execPath : 'lighthouse';
    const child = spawn(command, cli ? [cli, ...flags] : flags, { env: process.env });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    // Bound hung Chrome sessions and record them as failures rather than successes.
    const timer = setTimeout(() => child.kill('SIGTERM'), 120000);
    const code = await new Promise(resolve => {
      child.once('error', error => { stderr += error.message; resolve(-1); });
      child.once('close', resolve);
    });
    clearTimeout(timer);
    try {
      const report = JSON.parse(await readFile(filename, 'utf8'));
      const failures = report.categories.seo.auditRefs.map(ref => report.audits[ref.id])
        .filter(audit => audit.score !== null && audit.score < 1)
        .map(audit => ({ id: audit.id, title: audit.title, details: audit.details }));
      const finalPath = new URL(report.finalDisplayedUrl ?? report.finalUrl).pathname;
      const result = { path: pathname, score: report.categories.seo.score, failures,
        runtimeError: report.runtimeError, runWarnings: report.runWarnings,
        ...(finalPath !== pathname ? { redirectedTo: finalPath } : {}), exitCode: code };
      results.push(result);
      console.log(`${pathname}: ${result.score === null ? 'ERROR' : Math.round(result.score * 100)}${failures.length ? ` (${failures.map(f => f.id).join(', ')})` : ''}${result.redirectedTo ? ` REDIRECT ${result.redirectedTo}` : ''}`);
    } catch (error) {
      results.push({ path: pathname, exitCode: code, error: error.message, stderr });
      console.error(`${pathname}: ERROR ${stderr.slice(-500)}`);
    }
    await writeFile(path.join(output, 'summary.json'), JSON.stringify(results.sort((a, b) => a.path.localeCompare(b.path)), null, 2));
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
if (results.some(result => result.exitCode !== 0 || result.runtimeError || result.error || result.score !== 1 || result.redirectedTo || result.runWarnings?.length)) process.exitCode = 1;
