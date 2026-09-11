# Stylist report release audit — 9 September 2026

## Result

The failing report `ed9f4d41-86fa-4a13-9407-3847cf88db42` has recovered from a provider 504 deadline failure. It contains all 55 generated pages, has no generation error or active progress stage, and is now in review. The consultation view intentionally shows 54 pages because the continuation promotion is excluded.

The application passes the local checks below, including a production build served locally. This is not a verification of the deployed hosting environment. No deployment, client email, WhatsApp message, or publication was performed.

The report itself still requires **36 images, analysis confirmation, and approval of its 54 visible pages**. Its quality panel also has one subtitle-length warning on page 2. Delivery remains disabled until the required review and image work is complete.

## Repairs

### Generation and recovery

- Recognize the actual provider deadline failure as retryable, while excluding authentication failures.
- Generate the long prescription section in four-page batches and save each completed batch. Resuming skips saved pages.
- Surface Resume on failed reports even when the stored progress stage is empty.
- Queue generation durably for admin generation and resume. Workers yield after a saved unit of work, requeue remaining work, and retain their retry budget after successful progress.
- Check database write failures instead of silently continuing after a failed checkpoint or job update.
- Add the worker cron configuration to `vercel.json`. Local development drains immediately available work; production invocations process bounded slices.
- Include both new outfit library files in production function tracing for blueprint and workspace APIs.

### Editing and review

- Save against both the report revision and update timestamp; simultaneous saves cannot silently overwrite one another.
- Preserve text typed while an earlier save is in flight. Save responses no longer replace newer local edits.
- Warn before leaving with unsaved edits, surface load/save conflicts, and block conflicting uploads and generation actions.
- Persist pending analysis edits before confirming the analysis.
- Reset approvals when content changes, and reset analysis confirmation when the underlying analysis changes.
- Validate report drafts, complete reports, page numbers, approval booleans, hidden pages, and page ordering at the API boundary.
- Apply revision/conflict protection to bulk approval; reject approval during generation and stale actions that could otherwise move a generating report into review.

### Images, viewing, and delivery

- Validate upload type, size, nonempty content, image decoding, and pixel limits. Normalize orientation and store a JPEG.
- Save image paths and approval/publication invalidation together with a timestamp conflict check.
- Count only visible, required image slots. Remove the invisible legacy face-ratio requirement and respect hidden report pages.
- Add upload and prompt controls for all four silhouette-rule example images.
- Route consultation reports to Publish & Deliver in the admin editor.
- Require complete content, analysis confirmation, visible-page approvals, and required images at delivery endpoints.
- Check for concurrent changes during publication and delivery confirmation.
- Exclude hidden-page content, internal recommendation data, contact details, and administrative fields from public API responses.
- Preserve unpublished consultation access restrictions and set private caching, no-referrer, and noindex headers.
- Disable the client-data preview route in production and require admin access locally.
- Keep all client report pages mounted with browser rendering deferral, so print preparation does not leave unloaded page skeletons. Print preparation makes images eager, waits for decoding/fonts, and removes editing/upload controls.

### Dependencies and checks

- Update Next.js and its ESLint configuration to 15.5.25, Sharp to 0.35.4, and Nodemailer to 10.0.1.
- Remove the unused Cashfree SDK and update vulnerable transitive dependencies; override PostCSS to 8.5.28.
- Add a common test runner, explicit typecheck command, report regression tests, and a reusable disposable-fixture API smoke script.
- Run seven previously exported legacy assertion suites through the test runner.
- Allow an isolated build directory so production builds do not disrupt the running development server.

## Verification evidence

| Check | Result |
| --- | --- |
| Full automated suite (`npm test`) | 171 passed, 0 failed |
| TypeScript (`npm run typecheck`) | Passed |
| Production build including lint/type validation | Passed; 49 lint warnings remain across the application, mainly image-element recommendations, unused code, and hook warnings |
| Live API smoke checks, development server | 17 passed |
| Same API smoke checks, locally served production build | 17 passed |
| Production preview protection | `/blueprint-preview` returned 404 |
| Production anonymous admin access | Returned 401 |
| Unpublished consultation public API | Returned 404 |
| Client page privacy headers | Verified noindex and no-referrer |
| Dependency audit, including development dependencies | 0 known vulnerabilities reported |
| Patch whitespace (`git diff --check`) | Passed |

The API smoke checks cover authentication, report/status loading, invalid revisions, malformed reports, invalid approvals, unknown pages, simultaneous write conflicts, saved edits and approval invalidation, delivery rejection before any email is sent, public response redaction, hidden pages, bulk approval safeguards, stale review actions, and worker authentication.

Browser verification used a disposable QA report for editing and upload mutations. A newer edit survived an in-flight save, a second save, and a reload. A test image uploaded and rendered at its expected dimensions. A client report at a 390px viewport had no horizontal document overflow or editing/upload controls. All 53 visible fixture pages were mounted with no deferred skeletons (54 consultation-style pages minus the deliberately hidden test page). Print preparation entered the full, read-only report view. The recovered source report showed the corrected 0/36 image count and all four rule-example upload controls.

The disposable QA report, intake, and uploaded storage image were removed and their removal verified. Later smoke runs cleaned up their own fixtures automatically. Existing unrelated workspace changes were preserved.

## Remaining release verification

1. **Hosted worker:** confirm the deployment applies `vercel.json`, supports the configured every-minute schedule and the worker's 300-second execution setting, and sends the configured `CRON_SECRET`. Verify a fresh disposable report completes across multiple production worker invocations and recovers after an interrupted invocation. The recovered real report proves the generation/checkpoint recovery path, but hosted scheduling was not exercised. A global worker test was deliberately not invoked because an unrelated active job existed in the connected database.
2. **PDF output:** export a completed image-filled report in the target browser and visually inspect every exported page for clipping and pagination. DOM readiness and print controls were checked; an actual exported PDF was not inspected.
3. **Delivery:** after stylist review and images are complete, verify publication, client opening, and any intended email/WhatsApp delivery with an explicitly approved test recipient. No outbound send was performed during this audit.
4. **Production configuration:** verify the production values of `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ICONIK_INTERNAL_SECRET`, `GOOGLE_AI_API_KEY`, `CRON_SECRET`, and `NEXT_PUBLIC_SITE_URL`. Email delivery additionally uses `GMAIL_USER` and `GMAIL_APP_PASSWORD`; optional image generation uses its configured provider keys. Confirm the deployed database has the workspace/job migrations and private image storage. No secret values are stored in this document.

## Repeatable local checks

From the application directory, with the normal local environment configured:

```sh
npm test
npm run typecheck
NEXT_BUILD_DIR=.next-audit npm run build
npm audit
npm run smoke:stylist-reports -- ed9f4d41-86fa-4a13-9407-3847cf88db42
```

The smoke command defaults to `http://localhost:3002`, refuses non-local origins, creates a separate fixture, and removes it afterward. Set `STYLIST_TEST_ORIGIN=http://localhost:3102` to test a locally served production build. Do not set `STYLIST_KEEP_QA_FIXTURE=1` unless intentionally retaining a fixture for a browser walkthrough.

The development server remains available on port 3002. Changes remain uncommitted for review.
