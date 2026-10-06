# Private application and recovery

## Outcome
Turn the evidence engine into a usable private local application. Users can import captures, inspect reasons and corrections, browse price history, maintain watch targets, and export a recoverable private archive. Source stays public; observations, targets and backups stay private. This is an architectural increment executed under the user's request for autonomous continuation.

## Decisions
Use the existing Node 24.12+ and SQLite implementation with no downloaded runtime dependencies. A loopback-only HTTP server serves bundled HTML/CSS/JavaScript and a JSON API. This avoids an untested framework installation and preserves an executable application in the constrained environment. A hosted private service and a static-only viewer were considered: hosting adds authentication/deployment requirements; a static viewer cannot safely persist imports and corrections.

## Data
Migrate database schema 1 to 2 transactionally, adding watch targets keyed by canonical retailer URL. Targets hold a bounded label and optional positive integer USD price threshold. They are private organizational records, not active scraping jobs. Archive/unarchive is reversible. No deletions of observation evidence.

Add bounded observation search with latest decision, counts by status, paginated correction events, full-history SQL aggregates, and a paginated chronological offer timeline. Page sizes default to 50 and never exceed 200. Stable integer row cursors prevent new inserts from duplicating earlier results. Synthetic data is excluded by default. Offer history stays separated by product, variant, seller, condition, currency, fulfillment and eligibility. Shipping and tax remain unknown. Prices always state observation time; no claim of current retailer availability.

## Recovery
A versioned logical JSON archive contains captures, original evaluation times, correction events and watch targets. Export uses one database read transaction for consistency; bounded at 5,000 observations, 50,000 total decisions and 1,000 targets / 50 MiB. SHA-256 verifies accidental corruption, not authenticity or encryption. Restore validates every capture and decision, re-evaluates at its recorded original evaluation time, preserves correction order/timestamps and requires a new destination file. Invalid restores leave no partial destination. Never execute SQL supplied by an archive. HTTP restore is omitted to prevent overwriting an active database; CLI restore is available offline. Backups are private, ignored artifacts.

## Local service
Bind only 127.0.0.1, default port 4317. Require a random per-process bearer token for every API route and mutations. Pass the token in the initial URL fragment, keep it in session storage, then remove it from browser history. Never put it in query strings, logs after startup, HTML, or source. Validate Host and Origin exactly; no CORS, no remote listening flag. Require application/json, cap import bodies to 4 MiB (HTML itself remains 2 MiB), bound request time and headers. Return reason codes without raw inputs, paths or stack traces. Serve an explicit static-file allowlist with CSP, no external assets, no cache and no referrer. No paid providers, outbound retailer requests, deployment, telemetry, cookies, or messaging.

## User interface
A restrained slate/teal workspace with left navigation: Overview, Observations, History, Watch targets, Import, Backup. Responsive tables with clear status labels and useful empty/error/loading states. Observation detail shows product context, candidates, excluded evidence and paginated decisions; corrections append with reason codes and cannot promote an originally uncertain offer. Saved JSON and HTML imports support explicit historical replay. A labeled demo imports only synthetic observations. History presents lowest/highest/latest observed item prices and a selected offer's dated price points. Backup download stays local. No user-specific branding or real captures in fixtures.

## Verification
Real temporary SQLite databases and real loopback HTTP requests cover pagination, migrations, atomic restore, source protection, token/Origin/Host enforcement, request limits and import/correction flows. UI formatting and routing logic use deterministic tests. Render and exercise the UI with an available supported browser if reachable; otherwise record the exact validation blocker. Run the full test suite, synthetic benchmark and privacy/history scan before publication. Independently review the complete branch. No live retailer accuracy claim is permitted.
