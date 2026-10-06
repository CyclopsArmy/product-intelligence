# Product Intelligence

A standalone, evidence-first price tracking prototype. Public source code is separate from private observations and configuration.

**Current scope: working offline prototype.** It validates normalized captures, parses saved HTML, preserves observations and corrections in SQLite, and reports synthetic regression results. It does not fetch retailer pages, run scheduled scraping, or claim validated Best Buy/Amazon/Newegg coverage. See [status](docs/STATUS.md).

## Run without downloading dependencies

Requires Node.js **24.12 or newer within version 24** and Python **3.10+**. Node executes the TypeScript directly; there is no build step and no npm package installation. Python is only needed for HTML parsing/tests. On Windows, set `PYTHON_BIN=python` if `python3` is unavailable. Node's built-in SQLite API is used only for this prototype.

```bash
npm test
npm run benchmark
npm run cli -- help
npm run cli -- evaluate --file fixtures/accepted.json --at 2026-01-15T12:00:00.000Z
npm run cli -- import-json --file fixtures/accepted.json --at 2026-01-15T12:00:00.000Z
npm run cli -- inspect --id fixture-001
npm run cli -- history
npm run cli -- history --include-synthetic
npm run cli -- decide --id fixture-001 --status uncertain --reason RECHECK_REQUIRED
```

The bundled example is **synthetic**. `--at` explicitly replays validation at a historical timestamp; it does not make an old price fresh. The default history is empty after importing only synthetic examples. Runtime data is written to ignored `data/observations.sqlite`; override with `--db PATH`. Back up that private data separately from source control.

## Inspection and acceptance

Every price candidate carries product/variant, seller, condition, availability, eligibility, fulfillment, source, origin, and locator. USD money uses integer cents. Acceptance requires complete selected context, fresh timestamps, valid identifiers, and agreement of two scoped origin groups. This is a deterministic evidence rule, **not a statistical probability or proof that a retailer's data is true**. Two page surfaces may still share an upstream source; adapters must account for that before real-world promotion.

Unknown fields are not guessed. Different sellers/conditions/variants, unsupported currency, conditional prices, conflicting values, malformed evidence, and insufficient origin groups do not enter accepted history. Financing and reference prices remain excluded evidence. Shipping and tax stay unknown; summaries are item prices only.

## Saved HTML

```bash
npm run cli -- import-html --file captures/page.html --metadata captures/context.json --at 2026-01-15T12:00:00.000Z
```

`context.json` contains the same metadata and `context` object as `fixtures/accepted.json`, omitting `schemaVersion`, `candidates`, and `issues`. Use `method: "saved-html"`, `synthetic: false` for real saved pages. Omit `--at` to enforce present-time freshness. Capture HTML only through permitted acquisition outside this prototype.

The helper extracts JSON-LD `Product`/`Offer` and same-document `@id` references. A JSON-LD SKU becomes variant `sku:<value>`; an adapter must verify that it denotes the selected variant. JSON-LD alone is deliberately insufficient for acceptance. The generic helper does not infer eligibility or fulfillment, so its JSON-LD offers remain uncertain until a retailer adapter supplies independently verified context.

`data-pi-selected-offer` attributes are an **adapter interchange format**, not selectors present on retailer websites. They can describe separately captured DOM evidence. The helper does not execute JavaScript, access a browser session, or retain raw HTML. It records a SHA-256 fingerprint; a fingerprint alone cannot reconstruct a page. Private evidence retention is a later acquisition-layer responsibility.

## Persistence

SQLite transactions atomically insert observations and initial decisions. Re-importing identical captures is idempotent within the validation window; a later replay must supply the original `--at` time. Capture ID collisions with different content fail. Triggers reject updates/deletes of original observations and decisions. Corrections append decisions; the newest controls inclusion in history. An uncertain original cannot be manually promoted to accepted without a new validated capture. `inspect` currently returns all correction events; add pagination before long-running operation.

Histories remain partitioned by listing, exact identity, variant, seller, condition, currency, fulfillment, and eligibility. Summaries cover accepted in-stock observations only, and are labeled **lowest/highest/latest observed item price**. They are not comprehensive market history or current availability guarantees. The local history command refuses over 10,000 matching observations rather than silently returning partial statistics. Cross-retailer merging, localized prices, pack-quantity normalization, temporal weighting, and pagination require later work before production.

## Public repository preparation

Read [SECURITY.md](SECURITY.md) before publishing. Run `npm run privacy` from a Git checkout. The check scans tracked/untracked eligible files, reachable history blobs, and author metadata for common credential patterns/private artifacts. It cannot prove the absence of every kind of personal information. Manually inspect first-publication content and history as well.

The original development history uses a neutral project identity with an intentionally non-deliverable example email. Web publication uses the account's verified GitHub `noreply` address and account handle; GitHub may sign those commits with its own web committer identity. The scanner rejects personal display names even when paired with a `noreply` email. Inspect public metadata before future uploads. No account settings have been changed by this source package.

The GitHub workflow runs offline tests and synthetic benchmarks on standard Ubuntu runners with read-only permissions. It neither deploys nor receives application secrets. Local execution and the first GitHub-hosted CI run both passed: 102 tests, 14 synthetic benchmark cases, and the source/history privacy scan. See [status](docs/STATUS.md) for the publication verification record.

## Project files

| Path | Responsibility |
|---|---|
| `src/validation.ts` | Runtime contract, exact USD parsing, URL and timestamp validation |
| `src/identity.ts` | Conservative exact identifier/variant matching |
| `src/engine.ts` | Accepted/uncertain/rejected evidence decisions |
| `src/extract.ts`, `scripts/html_capture.py` | Bounded saved HTML extraction |
| `src/store.ts` | Transactional immutable observations and correction history |
| `src/cli.ts` | Local inspection and import commands |
| `fixtures/` | Synthetic, non-personal examples and regression labels |
| `scripts/benchmark.ts` | Labeled acceptance correctness and coverage |
| `docs/superpowers/` | Specification and implementation plan |

No third-party repository code was copied. There is no open-source license grant in this prototype yet. Public visibility alone is not a reuse license.
