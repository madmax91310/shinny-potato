# Amundi index documents and return-review validation — 11 October 2026

Run [38136012513](https://github.com/madmax91310/shinny-potato/actions/runs/38136012513) encountered two independent failures: seven Amundi composition collectors received 404s from constructed dated URLs, and `audit:data-review` rejected an additional undated STOXX control after the return-convention migration in PR #485.

By the start of this correction, PR #490 had already restored the historical Price Return source alongside the new NET baseline, and the audit passed on `master`. This change prevents the same audit regression without introducing a whitelist of index IDs: the exact set of active undated **fields** must be reported. Additional regression cases verify that dated NET evidence never closes an undated Price control, never changes its historical values or certification date, and never substitutes one return convention for another.

## Official Amundi sources checked live

The stable monthly endpoint is `https://www.amundietf.fr/pdfDocuments/monthly-factsheet/{ISIN}/FRA/FRA/INSTITUTIONNEL/ETF`. All seven PDFs downloaded and passed the existing exact-share, replication, tracked-index, constituent-count, full-allocation and ten-holdings checks.

| Index | Exact document ISIN | Published composition date |
| --- | --- | --- |
| STOXX Europe 600 | LU0908500753 | 2026-08-31 |
| TOPIX | FR0013411980 | 2026-08-31 |
| EURO STOXX 50 | FR001400ZGP1 | 2026-09-30 |
| Russell 2000 | LU1681038672 | 2026-09-30 |
| S&P 500 | LU0496786574 | 2026-09-30 |
| Nasdaq-100 | FR0011871110 | 2026-09-30 |
| S&P 500 Equal Weight | LU2991918421 | 2026-09-30 |

The collector now requests this official live endpoint first. The PDF's validated date remains authoritative. Only one of the last two completed month-ends is accepted; the existing freshness limit still applies. A transport failure may try the two dated editions, each of which must match its requested month. A document with invalid identity, methodology, allocations or date fails closed instead of being hidden by an older edition. No substitution basket or ETF return is used as index data.

Missing or invalid observations remain explicit collection errors. Existing merge logic preserves the last validated field and its history; required-field failures still fail the automation. Composition and annual-return collection remain independent, including NET EUR STOXX returns.

Regression coverage includes live August/September editions, source provenance, dated fallback, wrong/stale/future publication dates, failed identity validation, all editions unavailable, unchanged retained observations, and separate Price/NET review controls. The existing daily workflow and push/PR triggers run these tests and the real collection before data publication.
