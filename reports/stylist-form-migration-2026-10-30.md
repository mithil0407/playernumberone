# Stylist form migration verification — 30 October 2026

Scope: production iconik.pro. The older Flow application was used only as a
reference for field names and historical data. No changes to that application
or database permissions are needed for this fix.

## Findings

- Both applications use the same Supabase project and `consultations.client_data`.
  Production contains **1,148 saved consultation forms** across 1,635 consultation
  records. Empty imported bookings account for the other records.
- The production new-client parser carries every input field from the latest
  Flow intake form, including its choices and compatibility aliases. The review
  page previously showed only some of those answers.
- Dashboard grouping could hide separate filled forms for the same client on
  the same day. There are seven such groups containing fourteen saved forms.
- There are 1,022 upload-link records, including 189 submitted and 153 currently
  active links at verification time. The 613 forms without a link were created
  before the upload-link feature; the latest is from 26 June 2026. No form
  created in the last thirty days lacks a link.

## Changes

- Add an explicit **View form** action to client rows and cards, including
  delivered clients and clients with an existing report. The forms view opens
  the consultation form directly.
- Display every saved answer with its label, including historical fields and
  any unfamiliar saved fields. Keep distinct legacy answers, suppress duplicate
  compatibility aliases, and provide **Copy form**.
- Preserve every saved form when grouping duplicate imported bookings. Access
  still uses the existing assigned-stylist or admin authorization.

## Verification

- All 238 stylist and consultation tests pass, including new field-coverage,
  historical-answer, and same-day-form retention tests. TypeScript and the
  production build pass. The complete saved form and dashboard form actions
  were checked in an authenticated local production-build preview.
- Production upload URLs on `https://www.iconik.pro/upload/[token]` return the
  correct active, submitted, and expired states, with private caching and
  no-index headers. A sampled historical private photo returns HTTP 200.
- An unauthenticated consultation API request returns HTTP 401.
- Production verification was read-only: no live consultation was submitted,
  no photos were uploaded, and no client messages were sent. Actual live upload
  submission was not tested; its code and measurement/link tests were reviewed.

This checks form visibility and migration fidelity, not the unrelated payment
and Man intake rollout described in the earlier security status.
