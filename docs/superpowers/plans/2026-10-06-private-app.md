# Private Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Ship a usable private local evidence workspace with durable targets and validated recovery.
**Architecture:** Extend the SQLite store through focused query and archive modules. Serve a bundled dependency-free UI over a token-protected loopback API. Preserve all evidence rules.
**Tech Stack:** Node 24.12+ TypeScript, SQLite, Python 3.10+, browser JavaScript/CSS.
**Spec:** docs/superpowers/specs/2026-10-06-private-app-design.md

## Global Constraints
- No paid providers, outbound retailer requests, deployment, telemetry, cookies, or messaging.
- Source stays public; observations, targets and backups stay private.
- Page sizes default to 50 and never exceed 200.
- Synthetic data is excluded by default.
- Restore requires a new destination and never executes archive SQL.
- Bind only 127.0.0.1, default port 4317; authenticate every API request.

## Review Focus
- Corrections alter current counts/history without changing originals (Task 1).
- Inserts between pages do not duplicate earlier rows; malformed cursors fail (Task 1).
- Corrupt/tampered archives and failed restores cannot clobber any database (Task 2).
- Malicious website origins, DNS rebinding, oversized input and markup cannot expose evidence (Task 3).
- Empty, synthetic-only, stale and long-label states remain truthful and usable (Task 4).

### Task 1: Querying and durable targets
Files: src/store.ts, src/queries.ts, src/watchlist.ts, tests/workspace.test.ts.
Interfaces: ObservationStore.list(options), summary(options), series(offerKey,options), inspect(id,{after,limit}), targets({includeArchived}), saveTarget(input), archiveTarget(id,archived). Query helpers accept DatabaseSync.
- [x] Write failing tests for latest-decision search/counts, stable cursor pagination, exact-context series, default synthetic exclusion, schema migration, target validation/upsert/archive and persistence.
- [x] Run node --test tests/workspace.test.ts; verify missing behavior fails.
- [x] Implement schema 2 migration and bounded SQL queries, retaining legacy APIs.
- [x] Run full npm test and commit.

### Task 2: Recovery
Files: src/archive.ts, src/store.ts, src/cli.ts, tests/archive.test.ts, .gitignore.
Interfaces: store.exportArchive() returns a versioned checksummed object; restoreArchive(input,path) validates into a new file; CLI backup --file PATH --db PATH and restore --file PATH --db NEW_PATH.
- [x] Write failing tests: round trip captures/corrections/targets across restart, unchanged source, collision refusal, corrupt checksum, forged accepted correction, invalid timestamps and no partial file.
- [x] Run focused tests to verify failure.
- [x] Implement bounded transactional snapshots, full validation, new-file restore and CLI commands.
- [x] Run full npm test, benchmark, privacy; commit.

### Task 3: Private application service
Files: src/server.ts, src/app.ts, tests/server.test.ts, package.json.
Interfaces: startApp({dbPath,port}) returns {server,url,token,close}; server routes session-protected JSON requests to store/import/archive methods. app.ts owns process lifecycle and startup output.
- [x] Write failing real HTTP tests for auth, Host/Origin, body limits, safe errors, import/list/inspect/correct/history/targets/backup and assets.
- [x] Observe failures; implement explicit routes, loopback binding, header/timeout protections and shutdown cleanup.
- [x] Run full npm test and commit.

### Task 4: Workspace UI
Files: web/index.html, web/styles.css, web/app.js, web/view.js, tests/view.test.ts, docs/STATUS.md, README.md.
- [x] Test user-facing formatting and safe rendering with unknown, stale, synthetic and markup inputs.
- [x] Implement accessible navigation, filtered/paginated observations, evidence detail and corrections, history, targets, import and backup using the real API.
- [x] Exercise service integration and rendered flows where a supported browser is reachable; record limitations honestly.
- [x] Update usage/status documentation; run full verification; commit.

### Final review and publication
- [x] Fresh independent whole-branch review; fix material findings with regression tests.
- [ ] Publish reviewed source through privacy-safe commits; open and merge PR after required checks pass.
- [ ] Verify main CI, repository source identity and privacy; continue with any feasible remaining work.
