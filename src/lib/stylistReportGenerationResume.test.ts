import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { isStylistWorkerRequestAuthorized } from './stylistWorkerAuth.ts';

const worker = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

test('the worker accepts its secret as a bearer token or ?key= and rejects everything else', () => {
  const secret = 's3cret-value';
  assert.equal(isStylistWorkerRequestAuthorized(worker('https://x.test/api/stylist-workspace/worker', { authorization: `Bearer ${secret}` }), secret), true);
  assert.equal(isStylistWorkerRequestAuthorized(worker(`https://x.test/api/stylist-workspace/worker?key=${secret}`), secret), true);
  assert.equal(isStylistWorkerRequestAuthorized(worker('https://x.test/api/stylist-workspace/worker?key=wrong-value!'), secret), false);
  assert.equal(isStylistWorkerRequestAuthorized(worker('https://x.test/api/stylist-workspace/worker', { authorization: 'Bearer nope' }), secret), false);
  // A wrong header is not rescued by a correct query key.
  assert.equal(isStylistWorkerRequestAuthorized(worker(`https://x.test/api/stylist-workspace/worker?key=${secret}`, { authorization: 'Bearer nope' }), secret), false);
  assert.equal(isStylistWorkerRequestAuthorized(worker(`https://x.test/api/stylist-workspace/worker?key=${secret}`), ''), false);
});

const jobs = readFileSync('src/lib/stylistWorkspaceJobs.ts', 'utf8');

test('a worker slice keeps going between checkpoints and hands over instead of waiting for a scheduler', () => {
  assert.match(jobs, /SLICE_BUDGET_MS = 230_000/);
  assert.match(jobs, /for \(;;\) \{[\s\S]*runStylistBlueprintTextPipeline\([\s\S]*maxWorkUnits: 1/);
  assert.match(jobs, /if \(process\.env\.NODE_ENV !== 'development' && moreWork\) await dispatchNextWorker\(\);/);
  for (const route of ['src/app/api/stylist-workspace/worker/route.ts', 'src/app/api/stylist-blueprint/[reportId]/resume-text/route.ts', 'src/app/api/stylist-workspace/reports/[reportId]/retry/route.ts', 'src/app/api/stylist-blueprint/status/[reportId]/route.ts']) {
    assert.match(readFileSync(route, 'utf8'), /export const maxDuration = 300;/, `${route} must allow a full slice`);
  }
});

test('continue generating never duplicates a live job and resumes a stalled one from its checkpoint', () => {
  const resume = jobs.slice(jobs.indexOf('export async function resumeStylistReportGeneration'));
  assert.match(resume, /if \(isAlive\(active\)\) return \{ ok: true as const, state: 'working'/);
  assert.match(resume, /updateJob\(active\.id, \{ status: 'queued', attempt_count: 0, next_run_at: now, locked_at: null, heartbeat_at: null/);
  assert.ok(resume.indexOf('isAlive(active)') < resume.indexOf("status: 'queued', attempt_count: 0"), 'the live-job check must run before requeueing');
  assert.match(jobs, /HEARTBEAT_STALE_MS = 2 \* 60_000/);
});

test('the editor offers one generation action and no separate unlock', () => {
  const editor = readFileSync('src/app/stylist/admin/report/[reportId]/page.tsx', 'utf8');
  assert.doesNotMatch(editor, /Unlock Stuck Job|Resume Text|Retry Generation|clear_progress_stage/);
  assert.equal(editor.match(/'Continue generating'/g)?.length, 1);
});
