# Implementation ledger

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
