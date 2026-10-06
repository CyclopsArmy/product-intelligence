# Desktop verification and M1 access increment

User-directed continuation of the existing private-app and evidence specifications. Routine implementation, tests, fixes, documentation, branches and pull requests are authorized. No new deployment, spending, notifications or access-control bypass is authorized.

## Sequence and acceptance

- [x] Clone latest main with history; inspect instructions, Node 24.12–24.x and Python 3.10+, network and browser capabilities.
- [x] Re-run offline baseline; reproduce Windows restore failures, correct the writable flush handle and retain no-overwrite publication.
- [x] Exercise actual UI with isolated synthetic data: imports, synthetic controls, details/corrections, offer history, targets, backup download and restored app. Add a reproducible browser flow; fix session-link navigation that fails in an already-open tab.
- [x] Keep Python/browser paths in ignored local environment configuration. Pin browser tooling and protect reports/traces/screenshots with ignores plus a failing-then-passing privacy regression.
- [x] Assess official API and public access feasibility for the three target retailers. Record source links, timestamped failures, unknowns and the conditional retailer selection in `docs/ACQUISITION.md`.
- [ ] Verify a permitted live source, validate real examples and implement the first adapter. Blocked on usable access/permission and compatible retention; no speculative client is shipped.
- [ ] Advance PostgreSQL then scheduling only after the preceding live-acquisition gate passes.
- [ ] Independently review the complete diff, run tests/benchmark/privacy, inspect source and commit metadata, open a PR and merge only after required checks pass.

## Interface review

Archive export -> restore -> restored UI retains the same logical archive and schema. The restore fix changes only the file handle used for flushing staged bytes. Browser -> session API retains bearer authentication and loopback-only access. Browser tooling is development-only; it never fetches retailer data. The existing required `test` check aggregates both platform jobs without altering protection.

## Rulings

Continue in the new branch of this freshly cloned, dedicated checkout to honor the requested folder and preserve unrelated projects. The user's autonomous-work instruction supersedes repeat planning approval prompts. No original completed implementation task is repeated except verification.

Do not substitute synthetic data or search snippets for real source validation. Do not erase immutable history to accommodate a provider's retention restriction. The cost of leaving the acquisition gate closed is delayed M2/M3 work; the alternative would misstate feasibility and change the evidence model without authorization.
