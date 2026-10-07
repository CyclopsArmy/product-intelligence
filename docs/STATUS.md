# Status and continuation

## Current continuation — exact prices and CLI history pages

The dashboard preserves exact integer cents across the full supported range, including the safe-integer boundary that previously displayed one cent too low. New `history-page` and `series` CLI commands expose the existing full SQL aggregates and bounded timelines, with synthetic exclusion, correction filtering and exact-offer separation. The legacy `history` command remains compatible. Pagination uses opaque cursors and does not provide a snapshot across concurrent changes.

Local verification passed **145 offline tests, two rendered Edge tests, strict type checking, 14 synthetic benchmark cases**, and a zero-finding source/history privacy scan. A real SQLite regression imports 10,001 synthetic observations and verifies complete aggregate values; the browser exercises the exact-cent boundary through the watch-target form. Independent review and final-head hosted checks are required before merge. Live acquisition and downstream production milestones retain their existing gates.

## Current continuation — strict development type checking

Pull request [#5](https://github.com/CyclopsArmy/product-intelligence/pull/5) adds pinned, strict no-emit checking for all 27 TypeScript files in `src/`, `scripts/`, and `tests/`, enforced on both CI platforms through the existing protected `test` job. The initial compiler errors in startup options, filesystem errors, query projections/cursors, and test helpers are resolved without changing the evidence acceptance rules. Fresh locked installation and a negative compiler probe also passed their checks. Local verification passed 141 offline tests, two rendered Edge tests, 14 synthetic benchmark cases, and the source/history privacy scan. Independent review found no actionable issues; hosted checks must pass for the final head before merge.

Browser JavaScript and existing explicit `any`/JSON boundaries remain documented limits of static checking. M1 acquisition remains blocked before a working adapter; this maintenance increment does not establish live accuracy or advance the PostgreSQL/scheduling gates.

## October 6 desktop verification

The dedicated Windows checkout preserves the complete published Git history. Node 24.19.0 and Python 3.12.14 satisfy the runtime requirements. Project-local ignored `.env` settings select Python and Edge; no global tool or account settings were changed.

The fresh baseline passed 137/140 tests, with three Windows restore failures (`fsync` on a read-only handle). Those failures are fixed using a writable staging handle; immutable evidence and atomic no-overwrite publication remain intact. Current local verification: **141 offline tests, two browser tests, 14 synthetic benchmark cases**, and a zero-finding source/history privacy scan. The browser flow covers all requested workflows, a downloaded archive restored into a second app, and 1440×1000 / 390×844 layouts. A separate delayed-response regression verifies session replacement. No unexpected app console errors or document overflow were observed. Synthetic screenshots stayed outside Git. This supersedes the earlier cloud-only browser blocker; it does not establish other-browser/accessibility certification or live retailer accuracy.

M1 has begun but is **blocked before a working adapter**. Policy endpoints were reachable; the Best Buy product HTTP check timed out and Edge failed with `ERR_HTTP2_PROTOCOL_ERROR`. Best Buy is the conditional first candidate, with API credentials and retention compatibility unresolved. Amazon's standard price-tracking restrictions and Newegg's seller API scope preclude treating them as ready alternatives. No real offer was validated. See [the timestamped assessment and acceptance plan](ACQUISITION.md). Production PostgreSQL, scheduling and alerts remain gated future work.

The branch adds pinned development-only Playwright tests and Ubuntu/Windows CI behind the unchanged required `test` check. Independent review is complete and its Important session-race finding was fixed with a failing-then-passing Edge regression. Pull request #4 run `37543650117`, for head `7774494d269ea12c550d49188c7d51f25685525b`, passed Ubuntu/Chromium and Windows/Edge, including 141 offline tests, two browser tests, 14 synthetic cases and privacy scans; the required aggregate `test` also passed. Any subsequent commit must pass the required checks again before merge. Historical verification records below retain their original scope.

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
- The legacy CLI `history` command retains its 10,000-observation guard. Use `history-page` and `series` for full SQL aggregates and bounded pages, also available in the dashboard. CLI inspect and the dashboard support bounded decision pagination. The logical backup still has its separate documented export limits.
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
- PostgreSQL, Docker, Crawlee and pg-boss scheduling: **not installed or tested** here. Edge browser validation is verified in the desktop continuation above.
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
