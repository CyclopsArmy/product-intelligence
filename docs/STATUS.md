# Status and continuation

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
- `inspect` returns all correction events for an observation; bounded event pagination is needed before long-running deployment.
- Benchmark held-out labels were separated from the original development cases, but the same implementation agent authored them. They are not independent human ground truth.

## Not verified or not implemented
- Live retailer acquisition: **not performed**. This environment restricts outbound access; no retailer success rates or costs were measured.
- Retailer adapters: **not implemented**. JSON-LD parsing and the selected-offer interchange format are not retailer-specific adapters.
- PostgreSQL, Docker, Crawlee, browser binaries, pg-boss scheduling: **not installed or tested** here.
- Static TypeScript type checking: **not run**; Node's TypeScript stripping executes tests without checking types. Add a pinned compiler/lockfile once package installation is permitted.
- GitHub repository creation: **complete**. The public repository is accessible through the connected API. Source publication is in progress through the web UI with verified email privacy. CI execution and secret-scanning settings remain unverified until checked after publication.
- Product/variant/listing relational catalog, cross-retailer matching persistence, pack-size and location-aware comparisons, private evidence archive, backup/restore, private UI, alerts, discovery, paid providers and AI: later milestones.

## Continue with minimal setup
1. Finish publishing the reviewed source snapshot to the new public repository. The original neutral development history is retained in the saved source bundle; web publication has its own GitHub `noreply` history.
2. Configure a development environment with Node 24, Python 3, PostgreSQL, and permitted package/browser-download/retailer domains. This is an access/environment change, not a plugin installation.
3. Verify the published source snapshot and its public commit metadata, run CI, enable repository protections, and use the M1 acquisition plan below.

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
