# M1 access assessment — 2026-10-06

## Result

No live retailer integration is verified. Best Buy is the first candidate to revisit, conditional on a permitted working acquisition route and compatible retention rights. It is not a working adapter. No live product prices entered the evidence database, and no real example has been validated. PostgreSQL and scheduling remain behind the reliable-acquisition gate.

## Observed access

These are observations from one Windows development machine, not retailer-wide success rates. The shell sandbox could not reach GitHub; the approved network path cloned the repository and installed the pinned test dependency. Local Edge browser automation and loopback UI requests worked. No proxy, CAPTCHA solving, stealth settings, account cookies, alternate network route, or paid provider was used for retailer access.

One identified HTTP GET per retailer fetched its robots policy on October 6, 2026:

| Retailer | UTC response time | HTTP | Bytes | Elapsed |
|---|---|---:|---:|---:|
| Best Buy | 22:43:15.393 | 200 | 15,016 | 117 ms |
| Amazon US | 22:43:15.514 | 200 | 7,887 | 120 ms |
| Newegg US | 22:43:15.575 | 200 | 4,596 | 61 ms |

Robots responses establish policy-file reachability only. They do not grant permission or prove product-page/API access. Relevant policies: [Best Buy robots](https://www.bestbuy.com/robots.txt), [Amazon robots](https://www.amazon.com/robots.txt), [Newegg robots](https://www.newegg.com/robots.txt).

The Best Buy probe used the public product URL for SKU 6523595, Samsung 990 PRO 2TB, as a prospective validation target, not a verified offer. HTTP stopped at the 20-second deadline at 22:45:25.803 UTC. An isolated, identified Edge session failed before reading product content; a diagnostic repeat recorded `net::ERR_HTTP2_PROTOCOL_ERROR` at 22:46:58.217 UTC. No transport flags, identity disguises or alternate endpoints were used to work around it. Browser navigation yielded no source evidence. Search-index snippets were not imported or treated as current observations.

## Official source comparison

| Source | Fit and blocker | Decision |
|---|---|---|
| Best Buy Products API | Documented product catalog with pricing and availability; developer account/key required. Standard terms limit storing/caching API content to 72 hours. That conflicts with indefinite immutable evidence/history. | Preferred candidate only after permitted access and retention are resolved. A key alone is insufficient. |
| Amazon Creators API | Requires Associates enrollment and API credentials; documentation states qualifying-sales requirements. Associates policy prohibits price tracking/alerts unless Amazon agrees. | Do not integrate under standard terms for this tracker. Require explicit compatible authorization. |
| Newegg Marketplace API | Seller-authorized item/order/account management, not an anonymous cross-seller consumer price feed. Site policy also restricts automated access. | Not selected. Seller API credentials alone do not establish rights or coverage for consumer-wide acquisition. |

Primary sources reviewed October 6: [Best Buy API catalog](https://developers.bestbuy.com/apis), [API documentation](https://bestbuyapis.github.io/api-documentation/), [API terms](https://developer.bestbuy.com/legal), [website terms](https://www.bestbuy.com/site/help-topics/terms-and-conditions/pcmcat204400050067.c?id=pcmcat204400050067); [Amazon Creators API prerequisites](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction), [Associates policies, Participation Requirements 2(y)](https://affiliate-program.amazon.com/help/operating/policies); [Newegg Marketplace API](https://developer.newegg.com/newegg_marketplace_api/), [Newegg site policy](https://kb.newegg.com/knowledge-base/policy-agreement).

No authenticated API call was attempted and no provider charge was incurred. Amazon/Newegg product-page benchmarks were not performed after reviewing these constraints. Permission and account eligibility are unresolved; they are not technical success or failure measurements. This is an implementation gate based on the published terms, not a legal determination.

## First integration acceptance plan

1. Obtain an approved source that permits collection, normalization, historical retention and private source verification. Configure credentials privately through environment settings or a secret store, never source, command arguments, screenshots or chat. Do not create accounts or accept a changed data-use agreement silently.
2. Choose 15–30 representative authorized examples across the three retailers when each becomes accessible. Split development and held-out examples before adapter tuning; record blocked retailers separately instead of reducing the denominator invisibly. Include variants, marketplace sellers, new/open-box/refurbished offers, conditional prices and unavailable items.
3. Implement one bounded, opt-in source adapter. Explicitly allowlist endpoints; cap bytes, time and attempts; reject redirects/challenges and do not use cookies or paid fallbacks. Record failed attempts as failures without inventing offers. Retain only the authorized minimum privately with documented retention limits.
4. Verify each retrieved example against the source at the recorded UTC observation time: exact product and variant; seller; condition; item price and currency; public/member/coupon eligibility; stock; delivery/pickup and any relevant location. Mark every unobserved value unknown. Source update time is distinct from fetch time. Preserve unknown shipping/tax.
5. Map evidence to existing Capture/Evaluation contracts without changing acceptance rules. Multiple fields in one API response are one upstream origin; API plus page can still be correlated. Establish independently scoped context before acceptance. Never fabricate `data-pi-*` attributes as retailer selectors or promote uncertain originals through corrections.
6. Publish only sanitized synthetic regressions and aggregate acquisition results. Report attempted/successful/usable/accepted counts, manually checked accepted correctness, acceptance coverage, freshness, latency and actual marginal cost separately. Zero successful live captures means correctness and live coverage are unmeasured, not 100% or 0% accuracy.
7. Only after reliable permitted acquisition, implement/test PostgreSQL migrations, immutable observations and append-only decisions, exact-offer partitions, and backup/restore. Then add opt-in scheduling with bounded retries, rate limits, health checks and staleness. External alerts and paid services still require explicit approval.

## Validation ledger

Real examples attempted: one Best Buy target, multiple transport checks as described. Real examples validated: zero. Exact product/variant, seller, condition, price, currency, eligibility, stock and fulfillment are all **unverified** for that target. The SKU/name identify the intended probe only. No personal watchlist, capture, database, backup, screenshot or browser trace belongs in this document or Git.
