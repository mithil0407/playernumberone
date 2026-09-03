# ICONIK Man Intake Photo Upload: Diagnosis and Reliability Plan

**Prepared:** 3 September 2026

**Incident:** Customer could not submit full-body, headshot, and side-profile photos from Android Chrome.

**Scope:** `/man/intake`, its upload-session APIs, and the `man-intake-photos` Supabase bucket.

## Implementation status — 3 September 2026

The immediate reliability work and telemetry foundation are implemented in this repository:

- photo bytes are no longer sent in the initial TUS creation request;
- uploads start when each photo is selected and continue while the questionnaire is completed;
- transient failures use bounded retries, then switch from the direct storage hostname to the project hostname and finally to a standard signed upload;
- storage is verified after every failed acknowledgement so an accepted photo is not reported as failed;
- expired signatures refresh once, and stale TUS URLs older than 23 hours are ignored;
- selected photo blobs and questionnaire answers survive refresh and browser restart for up to 48 hours;
- large browser-decodable photos are resized and stripped of metadata before transfer;
- customers see safe support codes and can retry only failed photos;
- structured append-only telemetry and a 30-day cleanup migration are ready;
- a production smoke command verifies all three transport routes with generated test data and deletes it immediately.

Verification completed: TypeScript, the production Next.js build, 23 upload/submission unit tests, and live smoke uploads through direct TUS, project-host TUS, and signed PUT.

Run `supabase/migrations/add_man_intake_upload_events.sql` once in the Supabase SQL Editor to enable append-only history. The application records backward-compatible snapshot diagnostics until that table exists.

The independent second-provider lane and private-bucket migration remain conditional Phase 4 work because they require provider credentials and coordinated changes to every stylist/admin photo reader. The release gates below still require 14 days of real traffic before the measured SLO can be declared achieved.

## Executive diagnosis

This was an intermittent transport failure between the customer's mobile browser and the Supabase TUS endpoint. It was not a bad file, a missing bucket, a database-schema error, an expired order, or a failure while saving the final intake.

The live upload-session record matches the screenshot:

| Evidence | Finding |
|---|---|
| Session created | 3 Sep 2026, 09:39:17 IST |
| Failure recorded | 3 Sep 2026, 09:58:41 IST |
| Photo | Full body |
| Size | 3,626,247 bytes (3.46 MiB) |
| Attempts | 6 total |
| Time spent retrying | 41,167 ms |
| Browser progress | 0% |
| HTTP response | None (`response code: n/a`) |
| Current state | Upload session active; no completed intake for the supplied account email |

Eight other upload sessions have submitted successfully since 30 August. Live CORS preflight checks to both Supabase hostnames returned HTTP 200 and allow the required TUS headers. The storage bucket is present. These facts rule out a continuing project-wide outage or a permanently invalid configuration.

The immediate trigger is a no-response network error during TUS upload creation. The implementation makes that transient error terminal in practice:

1. All uploads use `https://<project>.storage.supabase.co/storage/v1/upload/resumable`.
2. `uploadDataDuringCreation: true` puts file bytes in the creation `POST`.
3. If the `POST` fails before Supabase returns its `Location` header, no resumable upload URL exists.
4. The retry loop repeats the same failing creation request on the same hostname. It has no second transport.
5. After six attempts, the first photo fails and the sequential loop never starts the headshot or side profile. This is why the screenshot shows **Needs retry / Preparing / Preparing**.

The configured retry delays are 0, 3, 5, 10, and 20 seconds. They total 38 seconds; adding request overhead closely matches the recorded 41-second failure. The system behaved exactly as coded, but the retry policy could not recover from this failure mode.

## Contributing design problems

### Uploads start too late

Files are selected earlier in the intake, but network transfer begins only when the customer taps **Submit My Intake** at the final step. A customer can finish the full questionnaire before discovering that their network cannot reach the storage endpoint. This increases abandonment and concentrates all photo transfers in one fragile final action.

### “Resumable” is not resumable during the observed failure

The current option sends data during TUS resource creation. TUS can persist a resumable URL only after the creation request returns successfully. The screenshot says `failed to create upload`, so the client had no URL from which to resume.

### One route, repeated six times

The direct storage hostname is Supabase's preferred high-performance endpoint, but it can be affected by a specific mobile carrier, DNS resolver, IPv6 route, privacy filter, VPN, browser, or Cloudflare edge. The normal project hostname also exposes the TUS endpoint and passed the live preflight check, yet the client never tries it. Retrying the same route is weak redundancy.

### Stale TUS resumptions can outlive the server upload URL

The ICONIK upload session lasts 48 hours. Supabase documents TUS upload URLs as valid for up to 24 hours. The client accepts the first locally stored previous upload without checking its age. A customer returning after 24 hours can repeatedly resume an expired URL instead of creating a fresh upload.

### Telemetry loses the history needed to prevent recurrence

`diagnostics` stores only the last event for each photo kind. A later success overwrites earlier starts, retries, and failures. The current error classifier maps the screenshot's `[object ProgressEvent]` failure to `unknown`, so it cannot separate DNS, offline, CORS, timeout, connection reset, HTTP status, expired TUS URL, or signed-token failure. There is no request ID, endpoint name, browser/network context, or alert.

### Recovery depends on the same broken path

The page preserves completed objects, but a required-photo failure offers only another submission attempt through the same transport. There is no secure alternate upload link or second storage lane. Unfinished `File` objects are not preserved across a page close or browser restart.

### Client photos are in a public bucket

The live `man-intake-photos` bucket is public and submissions store public URLs. These are personal photos. This did not cause the incident, but the reliability rewrite should migrate the bucket to private access and store object paths, with short-lived signed URLs for authorized staff.

## Long-term target design

Use one upload manager shared by the men’s intake and, after proving it, the other ICONIK photo intakes. It should own a persistent state machine for each photo:

`selected → optimizing → preparing → creating → uploading → verifying → complete`

Every transition should be idempotent. Failures should retain a precise stage and choose the next recovery action rather than restarting the entire submission.

### Primary lane: corrected TUS upload

- Set `uploadDataDuringCreation: false`. Create the TUS resource with a small metadata-only `POST`, persist the returned upload URL, and send bytes by `PATCH`.
- Keep Supabase's required 6 MiB chunk size and existing signed-upload token model.
- Try the direct storage hostname first. On a no-response creation failure, retry once, then switch to the normal project hostname with a newly issued signed token.
- Accept a previous upload only when its fingerprint, object path, endpoint, and age all match. Discard entries older than 23 hours or entries that return 404/410.
- Refresh credentials and create a new TUS resource after 401/403, rather than retrying a known-invalid request.
- Retry only network errors, 408, 429, and 5xx responses. Do not blindly retry validation, authorization, conflict, or unsupported-media responses.
- Add a total attempt budget and jittered backoff so parallel customers do not retry in lockstep during a provider incident.

### Recovery lane: independent signed upload

- Optimize decodable JPEG/PNG/WEBP photos in the browser before upload: correct orientation, cap the long edge at about 2400 px, strip metadata, and target 2–3 MiB while preserving styling-analysis detail.
- For optimized files below the configured threshold, fall back to `uploadToSignedUrl` on the normal Supabase project hostname when TUS creation cannot establish a session.
- Keep HEIC/HEIF originals on TUS when the browser cannot decode them reliably.
- If both Supabase hostnames fail, show a one-time secure recovery link tied to the paid order and upload session. Back that link with a second provider using a presigned multipart upload. Copy the object into the canonical private Supabase bucket asynchronously and verify checksum/size before marking it complete.
- Do not route 20 MiB photos through a normal Vercel function body; that creates another size-dependent failure point.

The second provider is the actual provider-level escape route. The two Supabase hostnames improve carrier and edge routing but still share one storage service. Add the independent lane if the 14-day measurements after the primary fix do not meet the success SLO, or add it immediately if intake completion is revenue-critical enough to justify the extra storage integration.

### Upload as soon as a photo is selected

- Prepare the order-bound upload session when the first photo is selected.
- Upload each photo in the background while the customer continues the questionnaire.
- Verify the stored size, MIME type, and object checksum server-side.
- Make the final submit action save answers and already-verified object paths; it should not begin three new transfers.
- Keep concurrency at one on slow/mobile connections and at most two on good connections.
- Persist the upload session and answers in durable local storage. If unfinished photo blobs are temporarily stored in IndexedDB, delete them immediately after verified upload, submission, expiry, or explicit replacement.

### Secure recovery experience

- Replace the raw TUS exception and storage URL with a short message and support code such as `UPL-NET-CREATE`.
- After two no-response attempts, automatically try the alternate hostname and tell the customer that the connection is being switched.
- After both primary routes fail, offer **Use secure alternate upload** and **Try again**.
- Let the customer retry only the failed photo. Show the other photos as preserved and verified.
- Detect offline state and pause until the browser reports that it is online again.
- Never require the customer to repeat questionnaire answers because a photo transfer failed.

## Observability and operations

Create an append-only `man_intake_upload_events` table instead of overwriting the last event. Record:

- anonymous session ID and photo kind;
- event and stage (`prepare`, `create`, `patch`, `verify`, `submit`);
- endpoint alias (`direct`, `project`, `backup`), attempt, duration, and byte bucket;
- HTTP status or `no_response`, normalized error code, TUS request ID, and upload URL age;
- browser family/major version, OS family, online state, and coarse connection class when the browser exposes it;
- application release identifier.

Do not record names, photo URLs, tokens, raw photo metadata, answers, full user-agent strings, or raw third-party exception text.

Add dashboards and alerts for:

- upload success on the first attempt and eventual upload success;
- failure rate by stage, endpoint, browser, OS, and network class;
- time from photo selection to verified upload;
- sessions prepared but not submitted within 30 minutes;
- a rolling 15-minute alert when eventual success falls below 99% with a minimum traffic threshold;
- any synthetic upload failure on either Supabase endpoint.

Run a small synthetic upload through each primary endpoint every 15 minutes from at least Mumbai and one non-India region, verify it, and delete it. Ensure the expired-session cleanup endpoint is actually scheduled and alert when its last successful run becomes stale.

## Implementation sequence

### Phase 0 — Recover the current customer today

1. Keep the current session active; do not ask the customer to repeat the intake.
2. Reply with a secure alternative upload request. Until the recovery page exists, accept the three photos through the support mailbox only with the customer's explicit choice, then have an authorized admin attach them to a manually created intake.
3. Confirm receipt of both required photos and begin the Blueprint manually.
4. Preserve the incident time and failure code for engineering; do not retain the raw support screenshot longer than required.

### Phase 1 — Hotfix the unrecoverable creation path

1. Extract endpoint choice, retry policy, and TUS previous-upload selection into pure functions.
2. Disable creation-with-upload.
3. Add stale-upload rejection and credential refresh.
4. Add direct-to-project-host fallback for no-response creation failures.
5. Normalize `ProgressEvent` with no response to `network_no_response` and expose a safe customer support code.
6. Add a required-photo retry button and stop rendering raw exception text.

Deploy behind a percentage flag. Start at 10%, then 50%, then 100% after the live metrics meet the gates below.

### Phase 2 — Remove the final-submit bottleneck

1. Start each upload on selection.
2. Add browser-side optimization for supported formats.
3. Persist the state machine and restore it after refresh/restart.
4. Make final submission depend only on server-verified upload receipts.
5. Add the small-file signed-upload recovery lane.

### Phase 3 — Make failures measurable and supportable

1. Add the append-only event table with a 30-day retention policy.
2. Add request IDs, release IDs, structured server logs, dashboard, and alerts.
3. Add the two-region synthetic monitor.
4. Give support an internal lookup by order/email that shows photo states and a button to issue a recovery link without exposing storage tokens.

### Phase 4 — Privacy and provider resilience

1. Add the independent backup provider/recovery link if the measured SLO requires it.
2. Change new photo objects to a private bucket and store paths instead of public URLs.
3. Update stylist/admin reads to use short-lived signed URLs.
4. Migrate existing records in batches, verify staff access, and then disable public access.

## Tests that must pass

### Unit and integration

- A `ProgressEvent` with no response is classified as `network_no_response` at the `create` stage.
- 400/401/403/409 errors are not retried as network errors.
- 408/429/5xx and no-response errors follow the bounded retry policy.
- A failed direct-host creation switches to the project host with refreshed credentials.
- A TUS URL older than 23 hours is discarded.
- An interrupted `PATCH` resumes from the server-reported offset.
- Re-running verification and final submission is idempotent.
- A completed full-body upload remains complete when the headshot fails.

### Browser/device matrix

- Current Android Chrome on Wi-Fi and mobile data.
- Current iOS Safari with JPG and HEIC selections.
- Current desktop Chrome and Safari.
- Network interruption during TUS creation, during a `PATCH`, after all bytes but before response, and during final verification.
- Browser refresh, tab close/reopen, offline-to-online transition, expired signed token, and expired TUS URL.
- 1 MiB, 3.5 MiB, 6 MiB, and 20 MiB inputs.

Use a dedicated test bucket/project in CI. The production synthetic monitor should upload only generated non-personal test data and delete it after verification.

## Release gates and definition of done

Do not call the work complete until all of these hold:

- At least 99.5% of valid photo selections eventually verify without staff intervention over 14 consecutive days.
- At least 98% verify on the primary lane without customer action.
- No raw SDK error, endpoint URL, signed token, or object path appears in customer-facing UI.
- Every failure can be grouped by stage, endpoint, release, and normalized error code.
- A customer can refresh/reopen and continue without repeating answers or re-uploading completed photos.
- The final submit step performs no photo transfer in the normal path.
- Support can issue a secure recovery link and confirm each required photo's verified state.
- Private-bucket access has been verified for stylist and admin workflows before public access is removed.

## Files expected to change

- `src/lib/manIntakeResumableUpload.ts`: upload state machine, endpoint failover, retry policy, stale URL handling, request IDs.
- `src/app/man/intake/page.tsx`: upload-on-selection, durable recovery UI, safe error copy.
- `src/lib/manIntakeUploadSession.ts`: verification contract and structured event recording.
- `src/app/api/man-intake/uploads/*`: credential refresh, recovery links, event ingestion, verification.
- `src/app/api/man-intake-submit/route.ts`: accept only verified receipts and retain idempotency.
- `supabase/migrations/*`: append-only events, recovery tokens, private-path migration, retention/cleanup support.
- `src/lib/*test.ts` plus browser integration tests: interruption and failover coverage.

## External protocol references

- Supabase resumable uploads: <https://supabase.com/docs/guides/storage/uploads/resumable-uploads>
- tus-js-client API (`uploadDataDuringCreation`, request IDs, URL storage): <https://github.com/tus/tus-js-client/blob/main/docs/api.md>
- tus resumable flow and `Location` URL: <https://github.com/tus/tus-js-client/blob/main/docs/faq.md>
