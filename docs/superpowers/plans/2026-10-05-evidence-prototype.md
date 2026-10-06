# Evidence prototype implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task. User authorized completion of planning followed by autonomous execution.

**Goal:** Deliver a runnable offline evidence pipeline without claiming live retailer coverage.
**Architecture:** Pure TypeScript core with Python standard-library HTML capture and a transactional SQLite adapter. CLI imports and inspects captures; benchmark uses explicitly synthetic fixtures.
**Tech Stack:** Node.js 24.12+, Python 3.10+, node:test, node:sqlite.
**Spec:** docs/superpowers/specs/2026-10-05-evidence-prototype-design.md

## Global constraints
- Public source; private runtime data; generic branding and fixtures.
- Zero paid/API calls; no live acquisition in M0.
- USD integer minor units; no guessed context or numerical confidence.
- SQLite is prototype-only; PostgreSQL and browser acquisition remain explicit release gaps.
- Synthetic observations excluded from real history by default.

## Review focus
1. Caller-forged capture decision or malformed nested input must not bypass acceptance (core tests).
2. Conflicting identifiers and variants must never merge (identity tests).
3. Corrections, duplicate imports, and concurrent history must preserve original records (store tests).
4. Page-global or correlated evidence must not falsely validate prices (extraction tests).
5. Personal data, HTML, credentials, and unsafe URLs must not leak into public artifacts (privacy/CLI tests).

## Task 1: Core validation and evidence engine
Files: src/types.ts, src/validation.ts, src/identity.ts, src/engine.ts, tests/core.test.ts.
Interfaces: evaluate(capture: unknown, now: string): Evaluation; parseMoney(value: unknown): number; canonicalUrl(value: unknown): string; matchIdentity(a: ProductIdentity,b: ProductIdentity): MatchResult.
- [x] Write tests for strict prices, invalid URLs, context, freshness, GTIN conflict, evidence agreement and disagreement, conditional offers, correlated origins.
- [x] Run node --test tests/core.test.ts; expected missing modules before implementation.
- [x] Implement typed runtime validation, exact identity matching and reason-coded acceptance.
- [x] Run tests; expected all pass. Commit core.

## Task 2: Saved-page extraction
Files: scripts/html_capture.py, src/extract.ts, tests/extract.test.ts, fixtures/.
Interfaces: captureHtml(html: string, metadata: CaptureMetadata): Capture; JSON-LD Product/Offer resolution; selected context comes from metadata and DOM data-pi-selected-offer attributes only.
- [x] Test malformed scripts, @graph, @id, multiple products, aggregate price, selected vs page-global evidence, raw HTML size limit.
- [x] Run node --test tests/extract.test.ts; expected missing module.
- [x] Implement safe subprocess parser and candidate construction; never execute page scripts or fetch URLs.
- [x] Run extraction and core tests; expected pass. Commit extraction.

## Task 3: Persistent observations and corrections
Files: src/store.ts, tests/store.test.ts.
Interfaces: ObservationStore(path); ingest(capture,now); decide(id,status,reason); history(options); inspect(id); close().
- [x] Test actual SQLite immutable triggers, idempotency/conflict, rollback on bad capture, correction exclusion/restoration, synthetic default exclusion, partitioned history.
- [x] Run node --test tests/store.test.ts; expected missing module.
- [x] Implement SQLite schema and prepared statements with transactional capture/decision writes.
- [x] Run all tests; expected pass. Commit store.

## Task 4: CLI, benchmark, packaging and privacy
Files: src/cli.ts, scripts/benchmark.ts, scripts/privacy-check.ts, tests/cli.test.ts, README.md, SECURITY.md, .github/workflows/ci.yml, package.json.
Interfaces: import-json, import-html, inspect, history, decide, benchmark commands; all local paths explicitly supplied or private default data/.
- [x] Test CLI JSON import -> inspect -> history -> correction, malformed commands/files, and benchmark provenance.
- [x] Run CLI tests; expected missing entry point.
- [x] Implement CLI and benchmark; author setup/status/privacy documentation and minimal CI without secrets.
- [x] Run npm test, npm run benchmark, npm run privacy; expected pass with synthetic provenance.
- [x] Independent whole-project review; fix material findings with regression tests.
- [x] Commit verified source, package and save. Report live-network and GitHub-creation blockers honestly.
