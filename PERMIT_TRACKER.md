# Permit Tracker Bot

Daily permit-status monitoring for home builders, remodelers, pool contractors, solar installers, and other contractors that manage permits across multiple jurisdictions.

## What it does

1. Reads active permits from a Google Sheet.
2. Visits the permit-specific public status URL for each record.
3. Normalizes portal output into the same fields: status, milestone, inspection, fees.
4. Compares the new snapshot with the previous Sheet values.
5. Writes the latest status/check/error back to the Sheet.
6. Sends the assigned PM a Twilio SMS only when a tracked field changes.

The first successful read establishes a baseline and does not send an alert.

## Why adapters instead of one scraper

Cities use different land-management products and configurations. The system therefore uses a small adapter interface rather than pretending every portal behaves the same.

Included adapters:

- `accela` — for Accela/Citizen Access-style record pages.
- `generic-html` — for public record pages that expose status as readable HTML.
- `json` — for cities or data sources that expose a stable JSON endpoint.

For JavaScript-heavy, login-only, CAPTCHA-protected, or workflow-driven portals, add a browser automation adapter (Playwright/Browserbase/etc.) instead of trying to bypass the portal with brittle HTTP scraping.

## Sheet columns

Deploy `scripts/permit-sheet-apps-script.gs` into a Google Sheet. Running `setupPermitSheet()` creates/normalizes the `Permits` tab.

Core input columns:

| Column | Example |
| --- | --- |
| id | `job-1024-building` |
| projectName | `Smith Residence` |
| city | `El Paso` |
| state | `TX` |
| permitNumber | `BP-2026-12345` |
| portalUrl | direct public record/status URL |
| adapter | `accela` |
| pmPhone | `+19155551212` |
| active | `TRUE` |

The bot writes `status`, `milestone`, `inspection`, `fees`, `rawHash`, `lastChecked`, `lastChanged`, `changedFields`, and `lastError`.

For JSON endpoints, optional `statusPath`, `milestonePath`, `inspectionPath`, and `feesPath` support dot notation (for example `record.status`).

## Google Sheet bridge setup

1. Create/open a Google Sheet.
2. Extensions -> Apps Script.
3. Paste `scripts/permit-sheet-apps-script.gs`.
4. In Apps Script project settings, add Script Property `PERMIT_WEBHOOK_TOKEN` with a strong random value.
5. Run `setupPermitSheet()` once.
6. Deploy -> New deployment -> Web app.
7. Execute as yourself; choose the access level required for the deployment.
8. Copy the web-app URL to `PERMIT_SHEETS_WEBHOOK_URL` and the same token to `PERMIT_SHEETS_WEBHOOK_TOKEN` in Vercel.

## SMS setup

Set:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

If Twilio is not configured, checks and Sheet updates still run; SMS is skipped.

## Cron

`vercel.json` calls `/api/cron/permits` once daily at `0 13 * * *` (13:00 UTC).

Set `CRON_SECRET` in Vercel. The route requires `Authorization: Bearer <CRON_SECRET>` in production.

## City onboarding playbook

For each new city:

1. Find the city's official permit search/status portal.
2. Determine whether a permit has a stable public record URL, public JSON endpoint, or requires browser interaction.
3. Add a test permit and confirm the adapter extracts the correct fields.
4. Save the direct record URL in the Sheet, not just the city's portal home page.
5. Verify a no-change run produces no SMS.
6. Verify a known status change produces one SMS and updates `lastChanged`.

### Initial portal families verified during research

- El Paso, TX — City links to Accela Citizen Access for application status, invoices, and permits.
- Austin, TX — Austin Build + Connect provides public permit/case search without registration.
- Dallas, TX — DallasNow is Accela-backed and the city directs users to the portal for current status.
- Houston, TX — Houston Permit Portal exposes permit search/progress from submittal to issuance.

These are discovery targets, not a claim that every record can be fetched anonymously. Each city still needs one tested record URL/API path before production support is marked complete.

## Production hardening

Before selling this as a multi-city service:

- Add per-city fixtures/tests so portal redesigns are caught quickly.
- Add retries with exponential backoff and per-domain rate limits.
- Add a portal-health table and alert operations when extraction fails repeatedly.
- Add browser automation for dynamic/login-only portals.
- Encrypt any stored credentials and prefer contractor-owned portal accounts.
- Respect portal terms, robots policies, rate limits, and municipal access rules.
- Add PM/customer routing rules (SMS, email, Slack, webhook) rather than hard-coding one destination.

## Recommended product model

The contractor-facing product should be organized around **projects and permits**, not cities. A project can have building, electrical, plumbing, mechanical, pool, solar, ROW, or inspection records across different agencies. The city/portal connector should remain an implementation detail behind a normalized timeline.
