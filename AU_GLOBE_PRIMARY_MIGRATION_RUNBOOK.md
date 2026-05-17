# AU/Globe Primary Supabase Migration Runbook

This runbook moves the AU/Globe secondary Supabase project into the primary Supabase project.

## Prerequisites

- Apply `supabase/migrations/add_au_globe_primary_tables.sql` to the primary Supabase project.
- Keep the secondary Supabase project available with service-role read access until verification is complete.
- Confirm the primary project has these buckets:
  - `au-intake-photos`
  - `globe-intake-photos`
  - `globe-report-images`
- Freeze AU/global/globe writes during the copy window:
  - checkout/payment creation
  - subscriptions
  - intake submissions
  - quiz reminders
  - globe report generation/regeneration

## Required Environment Variables

```bash
export SOURCE_SUPABASE_URL="https://oczdqomlcmlrqmeaklrr.supabase.co"
export SOURCE_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jemRxb21sY21scnFtZWFrbHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY3MDU4MiwiZXhwIjoyMDg3MjQ2NTgyfQ.8rKujIvkhH6B4K6JU_zG3aB9GNoyVy3kAwdA9nSe7Ac"
export TARGET_SUPABASE_URL="https://igluqrlzulvzbieuslcd.supabase.co"
export TARGET_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbHVxcmx6dWx2emJpZXVzbGNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYyNDg1MCwiZXhwIjoyMDcxMjAwODUwfQ.sVKi1HWB8_Vrivi_KHcFp57m1gHJwNEww-Si_Xlj3Zg"
```

Optional:

```bash
export DRY_RUN=1
export MIGRATION_BATCH_SIZE=500
```

## Run

Dry run:

```bash
export DRY_RUN=1
npm run migrate:au-globe
```

Real run:

```bash
unset DRY_RUN
npm run migrate:au-globe
```

The script copies rows for the `au_*` and `globe_*` tables, copies all three storage buckets, rewrites intake photo URLs to the primary project, builds app-facing `globe_reports` rows from `globe_style_reports` plus `globe_report_assets`, and backfills missing AU/global/globe `revenue_events`.

## Deploy Cutover

- Deploy the app version where `supabaseAU`, `supabaseGlobe`, and `supabaseGlobeServer` all point to the primary project.
- Remove these secondary-project env vars from Vercel after deployment:
  - `NEXT_PUBLIC_SUPABASE_URL_AU`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY_AU`
  - `SUPABASE_SERVICE_ROLE_KEY_AU`
- Keep the primary env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Verification

- Compare row counts printed by the script.
- Test `/au/checkout` and `/au/intake`.
- Test `/global/checkout`, `/global/intake`, `/globe/checkout`, and `/globe/intake`.
- Confirm Razorpay confirm/webhook routes update primary `au_orders` and `globe_orders`.
- Confirm the revenue dashboard loads AU/global/globe rows from primary `revenue_events` and source tables.
- Open a historical globe report share token and verify signed report images render from the primary project.

Keep the secondary project read-only until at least one complete billing/reporting cycle has passed.
