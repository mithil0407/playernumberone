import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { hasUnpublishedChanges, isPublishedReport, isRevisedReport, publishedVersion } from './stylistReportPublication.ts';
import {
  MAX_PARSED_REVISION_ITEMS,
  MAX_REVISION_SCOPE_ITEMS,
  assertRevisionScope,
  isRevisionOverdue,
  parseRevisionRequest,
  revisionDueAt,
  revisionProgress,
  revisionScopePages,
} from './stylistReportRevisions.ts';
import { isOverdue, matchesWorkspaceView, workspaceCounts, workspaceDue, workspaceNextAction, workspaceQueueItem, type QueueReport, type QueueRevision } from './stylistWorkspaceQueueModel.ts';

function report(overrides: Partial<QueueReport> = {}): QueueReport {
  return {
    id: 'report-1', status: 'delivered', progress_stage: null, error_message: null,
    published_at: '2026-09-18T05:00:00.000Z', delivered_at: '2026-09-18T05:47:00.000Z',
    revision: 65, published_revision: 65, published_version: 1,
    created_at: '2026-09-10T05:00:00.000Z', updated_at: '2026-09-18T05:47:00.000Z', ...overrides,
  };
}

function openRevision(overrides: Partial<QueueRevision> = {}): QueueRevision {
  return {
    id: 'revision-1', status: 'open', due_at: '2026-09-21T09:00:00.000Z', created_at: '2026-09-19T09:00:00.000Z',
    scope: [
      { id: 'item-1', label: 'Can you change look 4?', page_number: null, outfit_number: 4, done: false },
      { id: 'item-2', label: 'Also please add more office wear.', page_number: null, outfit_number: null, done: false },
    ],
    ...overrides,
  };
}

function queueItem(reportOverrides: Partial<QueueReport> | null, overrides: Record<string, unknown> = {}) {
  return workspaceQueueItem({
    id: 'consultation-1', stylist_id: 'stylist-1', client_name: 'Aditi', client_phone: '9999999999',
    consultation_date: '2026-09-05T10:00:00.000Z', images_received_at: null,
    report_due_at: '2026-09-13T10:00:00.000Z', delivered_at: null, status: 'delivered',
    created_at: '2026-09-05T10:00:00.000Z', updated_at: '2026-09-18T05:47:00.000Z',
    form_occupation: 'Doctor', form_body_shape: 'Pear', form_reason: 'Wardrobe reset',
    consultation_upload_links: null,
    stylist_intake_responses: reportOverrides ? [{ id: 'intake-1', stylist_blueprint_reports: [report(reportOverrides)] }] : [],
    ...overrides,
  } as never);
}

test('the dashboard reads the same fact from a summary row, without report bodies', () => {
  // The queue must not start selecting snapshot columns: it carries headlines
  // only, and a select for a column the database lacks would take it down.
  const queue = readFileSync('src/lib/stylistWorkspaceQueue.ts', 'utf8');
  assert.doesNotMatch(queue, /published_report_data|published_revision|published_version/);
  const published = { published_at: '2026-09-18T05:00:00.000Z' };
  assert.equal(hasUnpublishedChanges({ ...published, status: 'delivered' }), false);
  assert.equal(hasUnpublishedChanges({ ...published, status: 'approved' }), false);
  assert.equal(hasUnpublishedChanges({ ...published, status: 'in_review' }), true);
  // Revisions win when the row carries them, whatever the status says.
  assert.equal(hasUnpublishedChanges({ ...published, status: 'in_review', revision: 9, published_revision: 9 }), false);
});

test('a report is only "changed" once its published snapshot falls behind the draft', () => {
  assert.equal(hasUnpublishedChanges(report()), false);
  // The stylist saved an edit for a revision: the draft moved on, the client's copy did not.
  assert.equal(hasUnpublishedChanges(report({ revision: 66 })), true);
  // Nothing published yet, so there is no snapshot to differ from.
  assert.equal(hasUnpublishedChanges(report({ published_at: null, published_revision: null, published_version: 0, revision: 8 })), false);
  assert.equal(hasUnpublishedChanges(null), false);
});

test('publication state reads the same for a first delivery and a revision', () => {
  assert.equal(isPublishedReport(report()), true);
  assert.equal(isPublishedReport(report({ published_at: null })), false);
  assert.equal(publishedVersion(report()), 1);
  assert.equal(isRevisedReport(report()), false);
  assert.equal(isRevisedReport(report({ published_version: 2 })), true);
  assert.equal(publishedVersion(null), 0);
});

test('editing a delivered report for a revision never marks its card overdue', () => {
  const now = Date.parse('2026-09-19T09:00:00.000Z');
  // Mid-revision: back in To do, six days past the original due date.
  const revising = queueItem({ status: 'in_review', revision: 66 });
  assert.equal(revising.bucket, 'needs_review');
  assert.equal(revising.report?.hasUnpublishedChanges, true);
  assert.equal(isOverdue(revising, now), false);
  // A report that has never been published is still held to its due date.
  const late = queueItem({ status: 'in_review', published_at: null, delivered_at: null, published_revision: null, published_version: 0 });
  assert.equal(isOverdue(late, now), true);
  // And so is a consultation that has no report yet.
  assert.equal(isOverdue(queueItem(null, { status: 'review' }), now), true);
});

test('an edit leaves the delivered copy published, so the client link stays live', () => {
  const patch = readFileSync('src/app/api/stylist-blueprint/[reportId]/route.ts', 'utf8');
  // The bug this replaced: any save cleared these, and the client's link 404ed
  // until the stylist finished reviewing and republished.
  assert.doesNotMatch(patch, /patch\.published_at = null/);
  assert.doesNotMatch(patch, /patch\.delivered_at = null/);
  // An edit is still unreviewed work, so it returns to the stylist's To do.
  assert.match(patch, /patch\.report_data = body\.report_data;[\s\S]{0,400}patch\.status = 'in_review';/);
});

test('publishing freezes the copy the client reads and counts the version', () => {
  const delivery = readFileSync('src/app/api/stylist-workspace/reports/[reportId]/delivery/route.ts', 'utf8');
  assert.match(delivery, /published_report_data: reportData,/);
  assert.match(delivery, /published_image_urls: report\.image_urls,/);
  assert.match(delivery, /published_revision: report\.revision,/);
  assert.match(delivery, /published_version: publishedVersion,/);
  // Resending an unchanged report must not bump the version or re-publish it.
  assert.match(delivery, /if \(hasUnpublishedChanges\(report\) \|\| !report\.published_at\) \{/);
  // Delivery can only be confirmed for what the client can actually open.
  assert.match(delivery, /if \(hasUnpublishedChanges\(report\)\) \{\s*return NextResponse\.json\(\{ error: 'You have changes that are not published yet/);
  // An update has to tell her to open the same link again.
  assert.match(delivery, /deliveredVersion > 1\s*\?\s*`\$\{greeting\}, I have updated your ICONIK Style Blueprint/);
});

test('a client reads the published snapshot while her stylist previews the draft', () => {
  const loader = readFileSync('src/lib/stylistBlueprintLoader.ts', 'utf8');
  const viewed = loader.slice(loader.indexOf('function viewedReport'), loader.indexOf('async function publicReport'));
  assert.match(viewed, /const snapshot = view === 'published' && row\.published_report_data != null;/);
  // Falling back to the live row keeps every report that has never published
  // — customer-form and manual reports included — behaving exactly as before.
  assert.match(viewed, /report_data: snapshot \? row\.published_report_data \?\? null : row\.report_data,/);
  assert.match(viewed, /image_urls: snapshot \? row\.published_image_urls \?\? null : row\.image_urls,/);
  // Only the staff preview asks for the draft.
  assert.match(loader, /export async function getStylistBlueprintClientPreviewByShareToken\(shareToken: string\) \{\s*return loadClientReportByShareToken\(shareToken, \{ view: 'draft' \}\);/);
  assert.match(loader, /imagePaths: publishedPaths \?\? draftPaths,/);
  // Both reads survive a database that has not run the snapshot migration yet.
  assert.match(loader, /const PUBLIC_REPORT_SELECT_WITH_SOURCE = '\*, stylist_intake_responses/);
  assert.match(loader, /const fallback = snapshot\.error\s*\? await select\('id, image_urls, published_at, stylist_intake_responses\(intake_source\)'\)/);
});

test('the migration backfills live reports so existing links keep working', () => {
  const migration = readFileSync('supabase/migrations/add_stylist_report_published_snapshots.sql', 'utf8');
  assert.match(migration, /ADD COLUMN IF NOT EXISTS published_report_data jsonb/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS published_image_urls jsonb/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS published_revision integer/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS published_version integer NOT NULL DEFAULT 0/);
  assert.match(migration, /SET published_report_data = COALESCE\(published_report_data, report_data\)/);
  assert.match(migration, /WHERE published_at IS NOT NULL;/);
});

// --- Reading a pasted WhatsApp message -------------------------------------

test("a client's message becomes a checklist, with her pleasantries left out", () => {
  const items = parseRevisionRequest(
    'Hi Samiya! Thank you so much, I loved the report 🙏 Can you change look 4? The pink saree is not my style. Also please add more office wear.',
  );
  assert.deepEqual(items.map(item => item.label), [
    'Can you change look 4?',
    'The pink saree is not my style.',
    'Also please add more office wear.',
  ]);
  assert.equal(items[0].outfit_number, 4);
  assert.equal(items[0].done, false);
  assert.equal(items[1].outfit_number, null);
});

test('the checklist picks up the look or page the client named, however she counts it', () => {
  assert.equal(parseRevisionRequest('please replace the 2nd outfit')[0].outfit_number, 2);
  assert.equal(parseRevisionRequest('can you change look #7')[0].outfit_number, 7);
  assert.equal(parseRevisionRequest('I want another look three instead')[0].outfit_number, 3);
  assert.equal(parseRevisionRequest('the colours on page 12 are too dark')[0].page_number, 12);
  assert.equal(parseRevisionRequest('the colours on page 12 are too dark')[0].outfit_number, null);
});

test('bullet points and line breaks each become their own change', () => {
  const items = parseRevisionRequest('- swap look 1\n- more ethnic please\n• remove the crop top');
  assert.deepEqual(items.map(item => item.label), ['swap look 1', 'more ethnic please', 'remove the crop top']);
});

test('a message with nothing recognisable is kept whole rather than dropped', () => {
  const items = parseRevisionRequest('the saree bit');
  assert.equal(items.length, 1);
  assert.equal(items[0].label, 'the saree bit');
  assert.deepEqual(parseRevisionRequest('   '), []);
});

test('a long message is capped so the checklist stays workable', () => {
  const items = parseRevisionRequest(Array.from({ length: 20 }, (_, index) => `please change look ${index + 1}.`).join(' '));
  assert.equal(items.length, MAX_PARSED_REVISION_ITEMS);
});

test('a stored checklist is validated, not trusted', () => {
  assert.throws(() => assertRevisionScope('nope'), /must be a list/);
  assert.throws(() => assertRevisionScope([{ label: '  ' }]), /needs a description/);
  assert.throws(() => assertRevisionScope(Array.from({ length: MAX_REVISION_SCOPE_ITEMS + 1 }, () => ({ label: 'x' }))), /at most 30 changes/);
  const [item] = assertRevisionScope([{ label: ' swap  look 1 ', page_number: '14', outfit_number: 'nonsense', done: 'yes' }]);
  assert.equal(item.label, 'swap look 1');
  assert.equal(item.page_number, 14);
  assert.equal(item.outfit_number, null);
  // Only a real boolean ticks a change off.
  assert.equal(item.done, false);
  assert.equal(item.id, 'item-1');
});

test('a revision carries its own two-day clock, not the original due date', () => {
  const now = Date.parse('2026-09-19T09:00:00.000Z');
  assert.equal(revisionDueAt(now), '2026-09-21T09:00:00.000Z');
  const open = { status: 'open' as const, due_at: revisionDueAt(now) };
  assert.equal(isRevisionOverdue(open, now), false);
  assert.equal(isRevisionOverdue(open, now + 3 * 86_400_000), true);
  // A published revision is never late.
  assert.equal(isRevisionOverdue({ status: 'published', due_at: revisionDueAt(now) }, now + 3 * 86_400_000), false);
});

test('progress and the pages to re-open come straight off the checklist', () => {
  const revision = { scope: assertRevisionScope([
    { label: 'swap look 4', page_number: 15, done: true },
    { label: 'more office wear', page_number: 15 },
    { label: 'lighter colours', page_number: 9 },
    { label: 'no page named' },
  ]) };
  assert.deepEqual(revisionProgress(revision), { done: 1, total: 4 });
  assert.deepEqual(revisionScopePages(revision), [9, 15]);
});

// --- The dashboard, once a client has asked for something ------------------

test('an open request puts the client at the top of To do with her ask on the card', () => {
  const now = Date.parse('2026-09-19T10:00:00.000Z');
  const item = queueItem({ stylist_report_revisions: [openRevision()] });
  assert.equal(item.bucket, 'revision_requested');
  assert.equal(item.revision?.changes[0], 'Can you change look 4?');
  assert.deepEqual({ done: item.revision?.done, total: item.revision?.total }, { done: 0, total: 2 });
  assert.equal(matchesWorkspaceView(item, 'reports', now), true);
  assert.equal(matchesWorkspaceView(item, 'delivered', now), false);
  assert.equal(workspaceCounts([item], now).revision_requested, 1);
  assert.equal(workspaceNextAction(item).label, 'Start revision');
});

test('a request in progress says so, and a published one leaves the card alone', () => {
  const started = queueItem({ stylist_report_revisions: [openRevision({
    scope: [{ id: 'item-1', label: 'swap look 4', page_number: null, outfit_number: 4, done: true }],
  })] });
  assert.equal(workspaceNextAction(started).label, 'Continue revision');
  // Published: the brief is closed, so the card is a delivered report again.
  const finished = queueItem({ stylist_report_revisions: [openRevision({ status: 'published' })] });
  assert.equal(finished.bucket, 'delivered');
  assert.equal(finished.revision, null);
});

test('an open revision brings its own clock to the card', () => {
  const item = queueItem({ stylist_report_revisions: [openRevision()] });
  assert.deepEqual(workspaceDue(item), { at: '2026-09-21T09:00:00.000Z', kind: 'revision' });
  assert.equal(isOverdue(item, Date.parse('2026-09-20T09:00:00.000Z')), false);
  // Late on the revision, not on the original consultation deadline.
  assert.equal(isOverdue(item, Date.parse('2026-09-22T09:00:00.000Z')), true);
  // Without a revision the card falls back to the consultation's own date.
  assert.deepEqual(workspaceDue(queueItem({})), { at: '2026-09-13T10:00:00.000Z', kind: 'report' });
});

test('the queue asks for revisions but never needs them to exist', () => {
  const queue = readFileSync('src/lib/stylistWorkspaceQueue.ts', 'utf8');
  assert.match(queue, /stylist_report_revisions\(id, status, due_at, created_at, scope\)/);
  assert.match(queue, /if \(error && missingRevisionsTable\(error\)\) \{\s*\(\{ data, error \} = await page\(WORKSPACE_QUEUE_SELECT_WITHOUT_REVISIONS\)\);/);
  // The fallback query must not carry the embed it is falling back from.
  const fallback = queue.slice(queue.indexOf('WORKSPACE_QUEUE_SELECT_WITHOUT_REVISIONS = `'), queue.indexOf('function missingRevisionsTable'));
  assert.doesNotMatch(fallback, /stylist_report_revisions/);
});

test('publishing the update closes the brief without ever failing the delivery', () => {
  const delivery = readFileSync('src/app/api/stylist-workspace/reports/[reportId]/delivery/route.ts', 'utf8');
  assert.match(delivery, /\.from\('stylist_report_revisions'\)\s*\.update\(\{ status: 'published', published_version: publishedVersion/);
  assert.match(delivery, /\.eq\('report_id', reportId\)\s*\.eq\('status', 'open'\);/);
  // Logged, not thrown: the report is published either way.
  assert.match(delivery, /if \(revisionError\) console\.error/);
});

test('a revision can only be recorded against a report the client already has', () => {
  const route = readFileSync('src/app/api/stylist-workspace/reports/[reportId]/revisions/route.ts', 'utf8');
  assert.match(route, /if \(!report\.published_at\) \{/);
  assert.match(route, /has not been delivered yet, so there is nothing to revise/);
  // One open brief per report: a second ask joins it, including one that races the insert.
  assert.match(route, /\.eq\('status', 'open'\)\s*\.maybeSingle\(\)/);
  assert.match(route, /mergeRevisionScope\(current\.scope, input\.scope\)/);
  assert.match(route, /if \(error\?\.code === '23505' && !input\.retried\) return recordRevision/);
  // The checklist is derived when the stylist does not send one, and validated when she does.
  assert.match(route, /body\.scope === undefined \? \(pasted \? parseRevisionRequest\(pasted\) : \[\]\) : assertRevisionScope\(body\.scope\)/);
  // Chosen looks become blank revised pages before the brief is recorded.
  assert.match(route, /addRevisedOutfits\(report\.report_data as StylistBlueprintReportData/);
  const single = readFileSync('src/app/api/stylist-workspace/reports/[reportId]/revisions/[revisionId]/route.ts', 'utf8');
  // Only publishing can mark a revision delivered.
  assert.match(single, /A revision closes when you publish the update/);
  assert.match(single, /\.eq\('status', 'open'\)/);
});

test('the workspace offers the capture where the stylist finds the client', () => {
  const dashboard = readFileSync('src/components/StylistWorkspaceDashboard.tsx', 'utf8');
  // Available on every delivered report; an open revision takes more looks.
  assert.match(dashboard, /function canRequestRevision\(item: WorkspaceQueueItem\) \{\s*return Boolean\(item\.report\?\.publishedAt\);/);
  // Both layouts: delivered clients are looked up as rows, worked as cards.
  assert.equal(dashboard.match(/Revise report/g)?.length, 2);
  assert.match(dashboard, /<StylistRevisionRequestDialog/);
  const dialog = readFileSync('src/components/StylistRevisionRequestDialog.tsx', 'utf8');
  // The checklist previews as she pastes, and her words are what gets stored.
  assert.match(dialog, /useMemo\(\(\) => parseRevisionRequest\(text\), \[text\]\)/);
  assert.match(dialog, /Save and open the report/);
  assert.match(dialog, /Create \$\{count\} revised look/);
  const studio = readFileSync('src/app/stylist/admin/report/[reportId]/page.tsx', 'utf8');
  assert.match(studio, /<StylistRevisionPanel\s+revision=\{revision\}/);
  assert.match(studio, /outfitStartPage=\{getStylistBlueprintOutfitStartPage\(reviewData\)\}/);
});

test('a preview mid-revision tells the stylist it is her draft, not the client copy', () => {
  const banner = readFileSync('src/components/StylistBlueprintPreviewBanner.tsx', 'utf8');
  assert.match(banner, /const state = !live \? 'Not live yet' : hasUnpublishedChanges \? 'Your unpublished draft' : 'Link is live';/);
  assert.match(banner, /Your client still sees the version you published/);
  const page = readFileSync('src/app/stylist/report/[shareToken]/page.tsx', 'utf8');
  assert.match(page, /preview: \{ live: loaded\.live, publishedVersion: loaded\.publishedVersion, hasUnpublishedChanges: loaded\.hasUnpublishedChanges \}/);
  // The preview reads the draft; only the public loader reads the snapshot.
  const loader = readFileSync('src/lib/stylistBlueprintLoader.ts', 'utf8');
  assert.match(loader, /hasUnpublishedChanges: hasUnpublishedChanges\(row\)/);
});
