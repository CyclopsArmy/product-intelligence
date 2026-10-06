# Implementation ledger

## October 6 desktop continuation

Plan: `docs/superpowers/plans/2026-10-06-desktop-verification-m1.md`. Fresh clone of main at `a5fe3bc`; complete public history preserved. Dedicated branch; runtime data and machine configuration ignored. Node 24.19.0 / Python 3.12.14 / installed Edge with pinned Playwright 1.62.1.

Baseline: 137/140 tests passed; all three failures were real Windows archive restores. Direct diagnosis found `EPERM` at `fsync` after opening staged SQLite read-only. A writable handle fixes those existing regressions; all nine archive cases passed afterward.

Rendered QA first failed when navigating from the unauthenticated app to a session-fragment link in the same tab: initialization only consumed fragments during page load. Session links are now consumed on hash navigation too, with invalid fragments clearing the stored token. The end-to-end regression subsequently passed through synthetic filtering, correction/removal/restoration of history, JSON/HTML file imports, unknown evidence, target archive/restore, downloaded backup and a second app using the restored database. Desktop/mobile screenshots were inspected privately; no console errors or document overflow were observed. Test setup issues (select label matching, browser-normalized minute input, and intentionally strict synthetic provenance) were corrected without weakening application validation.

Privacy regression: staged Playwright HTML reports were accepted before the new check. Reports, test result directories, traces, recordings and alternate screenshot formats are now ignored and rejected by the source/index/history scanner. Browser test artifacts stay in temporary directories; screenshots are opt-in and private.

M1 ruling: one Best Buy product transport probe timed out; identified browser navigation failed with HTTP/2 protocol errors. Robots-policy fetches succeeded for all three retailers, but that is not evidence of working acquisition. Published API terms and scope present additional retention/permission constraints. Best Buy remains a conditional candidate; no real captures, guessed context, adapter, PostgreSQL or scheduler are claimed. Details and next acceptance gates are in `docs/ACQUISITION.md`.

Independent read-only review found one Important session race: a late 401 from an old request could delete a newly installed token. An actual Edge test delayed the old responses, opened the valid session, released the 401s and reproduced authentication loss on Refresh. Each request now captures its token and clears only that still-current token. The new test passed after the fix; the full suite passed 141 offline tests and two browser tests. The reviewer found no other material restore, privacy or CI issue. Its unjudged live acquisition, permissions and retention questions remain blocked as documented; they are not waived release gates.

Post-review local verification: 141 offline tests, two rendered browser tests, 14 synthetic benchmark cases and zero privacy findings. Both author and committer use the repository-local account handle and requested GitHub noreply address. Hosted checks are tracked separately during publication; synthetic tests remain distinct from live acquisition validation.

Hosted verification: PR #4 head `7774494d269ea12c550d49188c7d51f25685525b` passed run `37543650117` on Ubuntu/Chromium and Windows/Edge. Both matrix jobs and the existing required `test` gate passed. The public branch contains no runtime artifacts; `.env`, databases and optional screenshots remain private. Final publication still requires checks on the latest head, with no branch-protection changes.

Plan: docs/superpowers/plans/2026-10-05-evidence-prototype.md

Pre-flight: core produces Capture/Evaluation; extractor produces Capture; store consumes validated Capture; CLI consumes all three. No incompatible interfaces found.

Task 1 complete: 60 core tests passed after the expected missing-module failure. Exact identity, USD, context, timestamps, origin agreement, and quarantine verified.
Task 2 complete: 11 parser tests passed after missing-module failure; total 71 passed. Python subprocess exercised directly.
Task 3 complete: 14 actual SQLite tests passed after missing-module failure and correction of an INSERT placeholder count mismatch. Named insert columns now match all 9 bindings. Transaction rollback, immutability, corrections and idempotency verified.
Task 4 implemented: CLI integration tests passed. Independent read-only review found four important issues; all were reproduced in failing regression tests and fixed: cross-candidate identity conflicts, coercible provenance/source enums, environment filename suffixes, and staged-only credential scanning. An additional regression exposed a renamed historical environment path sharing a safe-named blob; every reachable tree is now checked.

Final review: fresh independent reviewer used. No critical issues reported. Final acceptance is based on the regression suite after fixes, not an unperformed second review.

Deferred minors: identical capture retries after the freshness window require the original evaluation time; inspect returns the full decision history. Neither is suitable for unbounded production operation; both are documented limitations for this prototype.

Review scope rulings: live retailer acquisition/accuracy, browser/PostgreSQL/scheduling, static compiler validation, hosted CI and backups remain blocked or explicitly deferred. Generic HTML alone cannot produce an accepted offer and deliberately preserves unknowns. Fabricated trusted-input captures and database administrator tampering are outside the prototype trust boundary. Pattern scans cannot guarantee absence of all personal information; manual publication inspection supplements them. These constraints preserve an honest offline milestone and do not establish production readiness.

Rulings and operational limitations are documented in STATUS.md. No paid requests, deployment, real page capture or GitHub push has occurred.

Final verification: npm test passed 99/99; synthetic benchmark matched 14/14 expected cases (4 accepted); privacy scan passed with zero findings. Manual source/history review found no personal-context terms; the email-shaped scanner match in a URL-credentials rejection test was verified as a generic synthetic example.
# Publication verification

The public source snapshot was published through GitHub's web UI after verifying the account's email privacy and absence of a personal display name. All 28 file hashes and modes matched the reviewed source. The first hosted workflow passed 102 tests, all 14 synthetic benchmark expectations, and the privacy check. All 24 initial public commit identities were reviewed and used only the account handle/GitHub noreply identities. GitHub Secret Protection and push protection were confirmed enabled. The privacy scanner was tightened to require name/noreply-handle agreement and permit the exact GitHub web committer; two regressions failed before the fix, and the full suite then passed. Independent review found no material regression.

# Private application increment

Plan: docs/superpowers/plans/2026-10-06-private-app.md. User-directed autonomous continuation; no new planning approvals were required. Work used an isolated branch and the existing dependency-free stack.

Implemented bounded observation search, status counts, decision pagination, full SQL history aggregates and exact-offer timelines; schema-2 watch targets; checksummed logical export/new-database restore; a token-protected loopback service; and a bundled responsive local UI. New behavior tests failed before implementation. A JavaScript syntax check caught and corrected a template-expression error before application verification, and syntax checks now run in the standard test command.

Additional regressions reproduced two safety defects: restore could consume an existing destination sidecar, and a non-ASCII malformed bearer token caused a generic server error. Restore now stages and verifies a complete database before an atomic no-overwrite link, refuses destination sidecars, and removes only its own staging directory. Bearer comparisons check byte lengths. A staged-backup privacy regression failed before the scanner added explicit backup path checks.

Rendered browser QA remains blocked by the cloud browser's ERR_BLOCKED_BY_CLIENT response to the local app address. This was not worked around by changing exposure or network paths. Real loopback HTTP integration, data round trips, source syntax, and rendering-helper behavior are verified separately; those are not a substitute for rendered interaction/accessibility QA.

Independent review identified compact-vs-pretty archive size mismatch, replay/wall-clock timestamp confusion, stale detail callbacks, target canonical URL expansion, and oversized GET transport for valid offer keys. These were reproduced or controller-tested and corrected. Original capture URL acceptance remains compatible; the new canonical bound applies only to watch targets. History/series use authenticated bounded JSON POST reads, preserving the header limit. UI request gates invalidate old results on navigation, selection, close and synthetic filtering. CLI inspection now exposes bounded continuation flags. Final local suite: 140 tests; 14 synthetic expectations; zero privacy findings. Browser rendering remains blocked, not passed.
