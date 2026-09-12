// Creates only disposable QA data; never sends messages or changes the source report.
// node --env-file=.env.local scripts/smoke-stylist-reports.mjs <source-report-id>
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'node:fs/promises';

const origin = process.env.STYLIST_TEST_ORIGIN || 'http://localhost:3002';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Smoke tests only run against localhost');
assert.ok(process.argv[2], 'A source report ID is required');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const auth = { Cookie: `iconik_admin_auth=${process.env.ICONIK_INTERNAL_SECRET}`, 'Content-Type': 'application/json' };
let intakeId;
let reportId;
let keep = false;
let checks = 0;
async function request(path, method = 'GET', body, authenticated = true) {
  const response = await fetch(`${origin}${path}`, { method, headers: authenticated ? auth : {}, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
function expectStatus(result, status, label) {
  assert.equal(result.status, status, `${label}: ${JSON.stringify(result.body).slice(0,300)}`);
  checks += 1;
  console.log(`PASS ${label}`);
}

try {
  const { data: source, error: sourceError } = await db.from('stylist_blueprint_reports').select('report_data').eq('id', process.argv[2]).single();
  assert.ifError(sourceError);
  assert.equal(source.report_data?.pages.length, 55, 'Source must be complete');
  const data = structuredClone(source.report_data);
  const names = [data.client?.display_name, data.classification?.client?.name].filter(Boolean);
  let serialized = JSON.stringify(data);
  for (const name of names) serialized = serialized.replaceAll(name, 'Report QA Fixture');
  const fixture = JSON.parse(serialized);
  delete fixture.outfit_engine;
  fixture.client.display_name = 'Report QA Fixture';
  fixture.studio.analysis_confirmed = false;
  const { data: intake, error: intakeError } = await db.from('stylist_intake_responses').insert({ full_name: 'Report QA Fixture', customer_email: 'qa@example.invalid', intake_source: 'manual_admin', photo_urls: {}, country: 'India' }).select('id').single();
  assert.ifError(intakeError);
  intakeId = intake.id;
  const { data: report, error } = await db.from('stylist_blueprint_reports').insert({ submission_id: intakeId, status: 'in_review', report_data: fixture, section_approvals: {}, image_urls: null }).select('id, share_token').single();
  assert.ifError(error);
  reportId = report.id;
  const path = `/api/stylist-blueprint/${reportId}`;
  expectStatus(await request(path, 'GET', undefined, false), 401, 'anonymous admin access rejected');
  const loaded = await request(`${path}?fresh=1`);
  expectStatus(loaded, 200, 'report loads');
  const status = await request(`/api/stylist-blueprint/status/${reportId}`);
  expectStatus(status, 200, 'status and required images load');
  assert.ok(status.body.imageCounts);
  expectStatus(await request(path, 'PATCH', { expectedRevision: '1' }), 400, 'invalid revision rejected');
  expectStatus(await request(path, 'PATCH', { report_data: { version: fixture.version, pages: [] } }), 400, 'malformed full report rejected');
  expectStatus(await request(path, 'PATCH', { page_approvals: { p1: 'false' } }), 400, 'string approvals rejected');
  expectStatus(await request(path, 'PATCH', { page: { page_number: 999 } }), 400, 'unknown page rejected');
  const current = loaded.body.report;
  const mutation = { page_approvals: { p1: true }, expectedRevision: current.revision, expectedUpdatedAt: current.updated_at };
  const concurrent = await Promise.all([request(path, 'PATCH', mutation), request(path, 'PATCH', mutation)]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
  console.log('PASS concurrent writes: one save succeeds, one conflicts'); checks += 1;
  const fresh = (await request(`${path}?fresh=1`)).body.report;
  fresh.report_data.pages.find(page => page.page_number === 3).title = 'Saved QA edit';
  fresh.report_data.studio.hidden_page_numbers = [4];
  expectStatus(await request(path, 'PATCH', { report_data: fresh.report_data, expectedRevision: fresh.revision, expectedUpdatedAt: fresh.updated_at }), 200, 'full report edits save');
  const saved = (await request(`${path}?fresh=1`)).body.report;
  assert.equal(saved.report_data.pages.find(page => page.page_number === 3).title, 'Saved QA edit');
  assert.equal(saved.section_approvals.p3, false);
  console.log('PASS edits persist and reset page approval'); checks += 1;
  expectStatus(await request(path, 'POST', { action: 'send' }), 400, 'unreviewed email delivery rejected before sending');
  const publicResult = await request(`/api/stylist-blueprint/public/${report.share_token}`, 'GET', undefined, false);
  expectStatus(publicResult, 200, 'client report loads');
  const publicReport = publicResult.body.report;
  assert.equal(publicReport.report_data.pages.some(page => page.page_number === 4), false);
  for (const key of ['share_token', 'submission_id', 'section_approvals', 'revision']) assert.equal(key in publicReport, false);
  assert.equal('customer_email' in publicReport.stylist_intake_responses, false);
  assert.equal('outfit_engine' in publicReport.report_data, false);
  console.log('PASS hidden pages and internal fields excluded from client response'); checks += 1;
  const { error: generationStateError } = await db.from('stylist_blueprint_reports').update({ status: 'generating' }).eq('id', reportId);
  assert.ifError(generationStateError);
  expectStatus(await request(path, 'POST', { action: 'approve_all' }), 400, 'bulk approval blocked during generation');
  expectStatus(await request(path, 'POST', { action: 'mark_in_review' }), 409, 'stale review action cannot interrupt generation');
  const { error: reviewStateError } = await db.from('stylist_blueprint_reports').update({ status: 'in_review' }).eq('id', reportId);
  assert.ifError(reviewStateError);
  const beforeApproval = (await request(`${path}?fresh=1`)).body.report;
  const approved = await request(path, 'POST', { action: 'approve_all' });
  expectStatus(approved, 200, 'bulk approval persists a new revision');
  assert.equal(approved.body.report.revision, beforeApproval.revision + 1);
  expectStatus(await request(`/api/stylist-workspace/worker`, 'GET', undefined, false), 401, 'worker requires cron authentication');
  if (process.env.STYLIST_KEEP_QA_FIXTURE === '1') {
    await writeFile('/private/tmp/stylist-audit-fixture.json', JSON.stringify({ reportId, intakeId, shareToken: report.share_token }), { mode: 0o600 });
    keep = true;
    console.log(`QA admin page: ${origin}/stylist/admin/report/${reportId}`);
  }
  console.log(`${checks} API smoke checks passed`);
} finally {
  if (intakeId && !keep) {
    const { error } = await db.from('stylist_intake_responses').delete().eq('id', intakeId).eq('full_name', 'Report QA Fixture');
    if (error) throw new Error(`QA cleanup failed: ${error.message}`);
  }
}
