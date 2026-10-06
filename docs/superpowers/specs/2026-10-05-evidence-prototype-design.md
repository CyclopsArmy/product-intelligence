# Product Intelligence: evidence prototype specification

## Purpose and boundaries
Build a standalone consumer-product price tracker with auditable observations. Source code may be public; runtime data, credentials, personalized pages, and private identifiers must remain outside Git. Project branding and fixtures are generic. Account ownership visibility is acceptable. Paid acquisition and AI remain disabled. This specification authorizes no purchases or production deployment.

This first increment is an offline-capable evidence prototype, not a validated three-retailer scraper. Evaluate Best Buy, Amazon US, and Newegg US as initial acquisition targets when networking is available. API sources and HTML sources are peers. Never infer live success from synthetic examples.

## Architecture and environment decision
Node.js 24.12+ executes erasable TypeScript. Python 3.10+ standard-library HTMLParser supplies safe, non-executing HTML parsing without downloading an unverified HTML parser. A capture helper extracts JSON-LD script contents and separately scoped selected-offer DOM evidence. The TypeScript engine validates, resolves candidates, matches identifiers, and persists results. SQLite is a local prototype adapter, using Node's built-in SQLite API; PostgreSQL remains the production target. There is no claimed PostgreSQL compatibility test in this increment.

Production extension boundaries: acquisition capture -> candidate extraction -> offer validation -> immutable observation -> append-only decision -> history projection. A CLI makes each stage inspectable. No scheduling, AI, proxy, public HTTP service, or universal discovery is included in this increment. Do not publish a bespoke untested HTTP acquisition client; live acquisition remains explicitly disabled in this build.

## Capture contract
A versioned Capture contains captureId, sourceUrl, observedAt (UTC ISO timestamp), sourceObservedAt (nullable), method (synthetic-fixture, saved-html, api), synthetic boolean, and bounded evidence. A source URL must be HTTPS, port 443/default, without credentials, fragment, query, encoded path separators, or ambiguous hostname. Initially allow exact www.bestbuy.com, www.amazon.com, www.newegg.com and bare equivalents only. Invalid URLs never enter the store. Canonicalization removes www and trailing slash; tracking links must be cleaned before capture. Arbitrary URLs and redirects are not fetched.

Saved HTML can contain personal data. Process locally, never execute scripts, cap bytes at 2 MiB, cap JSON nesting, candidate count, script count, and string lengths; record SHA-256 but do not retain raw HTML by default. Extract JSON-LD Product/Offer objects, including @graph and same-document @id references. Unresolved references, malformed JSON-LD, multiple products, aggregate prices, unknown variant, missing seller/condition/currency/availability, and mixed price roles cause quarantine. Synthetic fixtures are explicitly labeled and excluded from real history by default.

## Offer and identity rules
Represent money as integer minor units; initial currency support USD only. Strictly parse decimal USD prices (max two fraction digits, optional valid comma grouping); reject exponents, negatives, zero, financing suffixes, ranges, NaN and unsafe integers. Reference price is a separate field and never assumed MSRP. No coupon, membership, trade-in, shipping, or tax adjustments without explicit evidence. Shipping/tax may remain unknown; such prices are labeled item-only and never advertised as delivered prices.

Every candidate includes exact product identifiers, selected variant key, seller, condition, availability, price role, currency, evidence channel, origin group, and locator. Supported accepted conditions are new, used, refurbished, and open-box. Availability is in-stock, out-of-stock, preorder, or backorder. Unknown stays unknown. Conditional offers remain quarantined in this increment. A safe match requires a valid equal GTIN plus matching brand and variant, or equal brand + exact MPN/model plus matching variant. Conflicting GTIN/MPN/model or variant blocks matching even when another identifier agrees. Validate GTIN check digits. Fuzzy matching is deferred. Do not automatically merge products across retailers in this prototype.

Selected page context supplied explicitly by an adapter/capture is required to bind variant, seller, condition, and product. Product identifiers in that context must agree with the candidate. Multiple Product nodes are quarantined instead of guessed. Page-global DOM prices do not corroborate selected offers.

## Evidence decisions
Use accepted, uncertain, and rejected with reason codes, never invented confidence percentages. Acceptance requires complete offer identity/context, valid price/time, and agreement of at least two distinct origin groups on the same offer price. JSON-LD and a parser reading that JSON-LD count as one origin. Any conflicting current price for the same offer quarantines it. Reference/financing prices remain visible as excluded candidates and cannot win selection. Unknown-role candidates quarantine rather than being silently discarded. An out-of-stock price may be observed but is not a purchasable current price.

Initial freshness rule: observedAt cannot exceed evaluation time by more than 5 minutes, observation age cannot exceed 24 hours, and an explicit sourceObservedAt must not exceed observedAt by more than 5 minutes or precede it by over 24 hours. Unknown upstream source time is reported, not invented. Importing a historical capture uses an explicitly supplied evaluation time; no live freshness claim is made.

## Storage, corrections, and history
Database lives in ignored data/. Insert a capture and its decision transactionally. Repeating an identical captureId is idempotent; different content under an existing ID is an error. Immutable observation payloads are protected from UPDATE and DELETE by triggers. Append-only decision events allow quarantine/rejection corrections and restoration only for records originally accepted by the engine. Latest decision controls history membership. Never manufacture an accepted offer from an uncertain payload.

History groups by canonical listing URL, product identity, variant, seller, condition, currency, fulfillment context, and eligibility. Include synthetic history only with an explicit flag. Exclude non-purchasable observations from current purchasing summaries; retain them in evidence history. Report lowest observed, highest observed, and latest observed item price, sample count, first/last observation; do not claim all-time market coverage or time-weighted typical price in this increment. Bound database listing commands and do not expose credentials or raw HTML in CLI errors.

## Public-source privacy and security
Ignore .env*, data/, raw captures, screenshots, traces, databases, logs, node_modules, and generated reports; explicitly permit .env.example. Public fixtures contain synthetic identifiers and generic product/seller names. Use no personally identifying author metadata. Scan staged files and all Git history before packaging. CI uses standard Ubuntu runner, read-only permissions, no secrets, no paid services, no external PR code with elevated credentials, timeouts and cancellation of obsolete runs. Runtime ingestion must reject unexpected fields, oversized strings, malformed timestamps, invalid encodings, and schema drift. Stored data is private local data, not automatically public because source code is public.

## Verification and measurable acceptance
Unit tests cover money ambiguity, URL attacks, timestamps, GTIN/variant conflicts, correlated evidence, conditional offers, seller/condition confusion, unknowns, and conflicting evidence. Integration tests use real SQLite transactions, trigger protection, idempotency, corrected history, and process-level CLI/HTML helper execution. Benchmark reports correctness of accepted results AND acceptance coverage, includes labels and synthetic/live provenance, and never treats fixtures as retailer success measurements. Held-out fixtures test changes not used as development examples. No broad 99% accuracy claims from a small sample.

## Roadmap and release gates
M0 (this increment): specification, portable offline engine, parser, CLI, evidence database, synthetic benchmark, CI, privacy checks.
M1: permitted live HTTP/API/browser acquisition; retailer-specific selected-offer context; manually verified, timestamped dataset; per-retailer usable observation/latency/cost report. Full real acquisition validation is a blocker for production.
M2: tested PostgreSQL migrations and adapter, immutable decisions, cross-retailer identity review, backup-and-restore test.
M3: pg-boss scheduling, total retry budget, health canaries, staleness, rate limits, rollout/rollback.
M4: private authenticated UI, alerts, discovery and measured paid/AI fallbacks with reserved concurrent budgets and provider caps.

The next milestones require their own scoped implementation plans. No library from previous research is incorporated solely because it was mentioned. Third-party licenses are reviewed before copying code. This project has no open-source license grant yet; select an explicit license before inviting external reuse.
