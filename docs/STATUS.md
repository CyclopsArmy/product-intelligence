# Status and continuation

## Current continuation — October 6 desktop verification

The dedicated Windows checkout preserves the complete published Git history. Node 24.19.0 and Python 3.12.14 satisfy the runtime requirements. Project-local ignored `.env` settings select Python and Edge; no global tool or account settings were changed.

The fresh baseline passed 137/140 tests, with three Windows restore failures (`fsync` on a read-only handle). Those failures are fixed using a writable staging handle; immutable evidence and atomic no-overwrite publication remain intact. Current local verification: **141 offline tests, one full rendered browser workflow, 14 synthetic benchmark cases**. The browser flow covers all requested workflows, a downloaded archive restored into a second app, and 1440×1000 / 390×844 layouts. No app console errors or document overflow were observed. Synthetic screenshots stayed outside Git. This supersedes the earlier cloud-only browser blocker; it does not establish other-browser/accessibility certification or live retailer accuracy.

M1 has begun but is **blocked before a working adapter**. Policy endpoints were reachable; the Best Buy product HTTP check timed out and Edge failed with `ERR_HTTP2_PROTOCOL_ERROR`. Best Buy is the conditional first candidate, with API credentials and retention compatibility unresolved. Amazon's standard price-tracking restrictions and Newegg's seller API scope preclude treating them as ready alternatives. No real offer was validated. See [the timestamped assessment and acceptance plan](ACQUISITION.md). Production PostgreSQL, scheduling and alerts remain gated future work.

The branch adds pinned development-only Playwright tests and Ubuntu/Windows CI behind the unchanged required `test` check. Hosted checks and review are verified separately during publication. Historical verification records below retain their original scope.

## Implemented locally
- Written specification and scoped implementation plan.
- Strict USD/identity/context/freshness validation and reason-coded evidence decisions.
- Saved HTML parsing with bounded input and no script execution.
- Immutable SQLite observations, idempotent imports, append-only corrections and partitioned history.
- CLI import/evaluate/inspect/history/correction commands.
- Synthetic regression benchmark, standard-runner CI configuration, privacy/history scanner.
- Independent review completed; material findings corrected with failing-then-passing regression tests.

## Known prototype limitations
- An identical capture retried after its 24-hour validation window must use its original `--at` evaluation time. It is not treated as a fresh observation.
- The legacy CLI history command has a 10,000-observation guard. The local dashboard uses full SQL aggregates and bounded pages. CLI inspect and the dashboard both support bounded decision pagination.
- Benchmark held-out labels were separated from the original development cases, but the same implementation agent authored them. They are not independent human ground truth.

## Verified publication
- The reviewed 28-file source snapshot is published in a public GitHub repository; every published file hash and mode matched the reviewed source.
- GitHub Actions run `37404691405`, for commit `c5af78b2f707667d86c22c6ee5daa0945565e273`, passed all 102 tests, 14 synthetic benchmark cases, and the privacy scan.
- All 24 initial publication commits used the account handle with its GitHub `noreply` email and GitHub's web committer identity. No personal display name or personal email was used in those commits.
- GitHub Secret Protection and push protection were verified enabled. These complement the local scanner; neither guarantees detection of every private value.
- The original neutral development history remains on the local development branch and in the previously saved source bundle. Public history records the reviewed snapshot publication.

## Not verified or not implemented
- Live retailer acquisition: **not verified**. The desktop continuation attempted bounded feasibility probes; no live offers or retailer-wide success rates were measured. See the assessment above.
- Retailer adapters: **not implemented**. JSON-LD parsing and the selected-offer interchange format are not retailer-specific adapters.
- PostgreSQL, Docker, Crawlee, browser binaries, pg-boss scheduling: **not installed or tested** here.
- Static TypeScript type checking: **not run**; Node's TypeScript stripping executes tests without checking types. Add a pinned compiler/lockfile once package installation is permitted.
- Product/variant/listing relational catalog, cross-retailer matching persistence, pack-size and location-aware comparisons, retained raw evidence archive, alerts, discovery, paid providers and AI: later milestones. A local UI and logical backup/restore are implemented below.

## Continue with minimal setup
1. Configure a development environment with Node 24, Python 3, PostgreSQL, and permitted package/browser-download/retailer domains. This is an access/environment change, not a plugin installation.
2. Preserve the publication privacy checks and verify CI on future branches; use the M1 acquisition plan below before live acquisition.

## M1 acquisition plan
- Obtain explicit permitted networking and review configured retailer access policy before requests.
- Benchmark official/provider APIs alongside HTTP and Playwright, without paid fallbacks enabled.
- Select 15-30 representative pages across the three target retailers; label selected variant, seller, condition, eligibility, fulfillment/location, price role, stock, timestamps and exact identifiers.
- Implement one adapter first based on usable-observation results. Require independently scoped context; no artificial `data-pi-*` attributes assumed on real pages.
- Save minimal sanitized fixtures; retain authorized raw evidence privately with retention limits. Partition development and held-out live examples before adapter tuning.
- Report acquisition success separately from accepted correctness, coverage, latency, freshness, and actual marginal cost. No extrapolated 99% claims from a small set.
- Add PostgreSQL migration/adapter integration tests and restore verification before persistent scheduling.

## Engineering decisions
- The user authorized completing planning followed by autonomous implementation; no extra planning approval was requested.
- SQLite is an explicit prototype adapter because PostgreSQL is absent. Cost: production persistence still needs a tested adapter and migrations.
- Python standard-library HTMLParser avoids downloading a dependency in this restricted environment. Cost: saved-page parsing requires Python as well as Node.
- Live acquisition is deferred rather than inventing retailer adapters or bypassing network restrictions. Cost: the primary real-world feasibility question remains open.
- Neutral commit identity prevents publishing a personal email. Cost: initial commits are not attributed to the owner's GitHub contribution graph.

## Private local application increment
- Loopback-only Node service with per-process bearer token, exact Host/Origin validation, restrictive asset allowlist/CSP, bounded input and safe error codes.
- Bundled responsive UI: overview, observation filters, candidate/context inspection, append-only review decisions, exact-offer history, reversible watch targets, saved JSON/HTML import, and private backup download.
- Schema 2 adds watch targets while preserving schema-1 observations and immutable decision triggers.
- Bounded observation/decision/timeline queries and full SQL history aggregates. Synthetic data stays excluded unless explicitly selected.
- Versioned checksummed logical archive revalidates captures at their original evaluation time, preserves decisions and targets, and restores only into a new destination. Internal sequence cursors may change. Archives are private and unencrypted.
- Browser validation is blocked: the cloud browser refused local app navigation with `ERR_BLOCKED_BY_CLIENT`. Source syntax, view-formatting behavior, real loopback HTTP integration, actual SQLite migration and archive round trips were tested. No rendered desktop/mobile QA or browser accessibility claim is made.
- No paid requests, retailer requests, public deployment, scheduler, or notifications were enabled.

Local verification for the private app: 140 tests, 14 synthetic benchmark expectations, JavaScript syntax checks, and a zero-finding source/history privacy scan. Independent review findings were fixed with targeted regressions, including legacy capture recovery, large archive encoding and stale detail responses. Hosted CI for this increment is checked separately during publication.

## Private app publication verified
- Pull request #2 merged the private application into `main` at `c582021801a50ca1c2e74ef4f5f2fb0ba3be619e`.
- The full 46-file published source tree matched the reviewed local source byte-for-byte, including file modes.
- The nine publication commits and merge commit use the account handle and GitHub `noreply` identity; GitHub verified their signatures.
- Pull-request run `37537481227` and merged-main run `37537607950` passed the required test job: 140 tests, 14 synthetic benchmark expectations, and the source/history privacy scan.
- The app remains local-only. Retailer acquisition, production persistence and rendered browser validation retain the limitations above.
