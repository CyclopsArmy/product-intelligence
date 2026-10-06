# Security and publication policy

## Public content boundary
Only source, generic documentation, and synthetic fixtures belong in Git. Never commit personal names, contact details, credentials, local watchlists, private URLs, real account captures, local databases, browser cookies, screenshots, session traces, logs, environment files, or conversation transcripts. Do not paste real sensitive values into a scanner test or denylist; that itself publishes them.

Keep runtime data private. `.gitignore` prevents accidental addition of common file types; it does not erase prior history or stop deliberate forced additions. Scanners catch known patterns, not every secret or identifying detail. Review files, history, author/committer metadata, commit messages, branch names, release files, and CI artifacts before first publication.

Enable GitHub secret scanning and push protection in repository/account settings once created. Do not claim these are enabled until verified. Store future credentials in deployment secrets or an ignored local environment file. Current tests require no credentials. Do not expose secrets to untrusted pull-request code. Do not use `pull_request_target` to execute external contributions.

## Runtime boundaries
There is no network acquisition or server in this increment. The URL allowlist is input validation, not a complete SSRF defense for a future fetcher. Live acquisition must independently validate redirects, DNS resolution and connected IPs; block private/link-local/metadata addresses; bound response size, decompression, duration and requests; and respect the configured access policy. Browser sessions must be isolated from personal signed-in accounts.

Only import captures from an authorized local process. A fabricated capture can fabricate evidence; this prototype provides structural validation and provenance labels, not authenticated acquisition attestation. The current saved-HTML helper does not establish the authenticity or independence of DOM/JSON-LD values.

Database triggers protect normal application writes, not a person with filesystem/database administrator access. Local data is unencrypted. Use an encrypted device or deployment volume before storing sensitive operational data. Backup/restore and PostgreSQL need verification before continuous operation.

## Reporting a problem
Do not open a public issue containing credentials, private data, or raw personalized pages. If a credential is exposed, revoke it first; deleting a file or rewriting history cannot retract copies already downloaded. A private reporting channel must be configured before public contributor onboarding.
