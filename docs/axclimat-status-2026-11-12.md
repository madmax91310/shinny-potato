# AxClimat I: official subscription evidence, 12 November 2026

## Diagnosis

The official financed-operations page still identifies **AxClimat I** as
**Clôturé le 04/02/2026**. Its live HTML now uses an
`article.front-card[data-item][data-cls="fund"]`, an exact
`h3.front-card-title` and a `.front-tag--status` inside that same card.
The former `#campaign-widget-axclimat-i` and `data-campaign-state` are absent.
This is an HTML redesign, not evidence of reopened subscriptions or loss of
the dated closure evidence. Generic “Investir” buttons on the marketing page
are not subscription-status evidence.

Official sources fetched directly over HTTPS on 12 November 2026 around
18:11–18:14 UTC (both HTTP 200):

- https://www.anaxago.com/operations-financees
  - Full response SHA-256: `a70aebef570432a7b63a4ea960c7bbcae2128ae68d3cad8255a4b7fcfe97a8f3`
  - The exact AxClimat I article is retained as the regression fixture
    `scripts/fixtures/presentation-actors/anaxago-financed-card.html` (BeautifulSoup
    serialization; its bytes differ from the full-response digest).
- https://www.anaxago.com/axclimat
  - Full response SHA-256: `1b6fcfbd8dd55868c30af262db54f01dbd0cd26fce6731f72ddc36e117c3cecf`
  - The existing parser succeeds on the current terms with the status fix.

The 16:32 UTC run's refresh job 131327539007 logs the Anaxago failure at
16:34:13 UTC with `AxClimat subscription status changed; qualify new offer status`:
https://github.com/madmax91310/shinny-potato/actions/runs/43259744863
Its refresh and publish jobs succeeded; `report-failures` correctly failed
because one actor remained unqualified. The error message conflated a missing
HTML widget with a changed offer status.

## Preserved qualified terms

| Part | Minimum | Entry fee | Recurring management fee |
| --- | --- | --- | --- |
| E | €20,000 | 3% | 1.90%/year; no taper |
| B | €100,000 | 3% | 1.70%/year from N to N+5, then published reduction of 0.1 percentage point/year from year six |

The parsed access and fee text is identical to the stored 8 November record
for both offer identities (`axclimat-i`, `axclimat-i-b`). The schedule published
for subscriptions of at least €100,000 remains scoped to B; it is not inferred
for E. Underlying costs, fee bases and possible performance fees still require
the relevant part documents. No realized return is inferred from target IRR.

## Proposed correction and validation

Accept either the old official widget or the redesigned card. Require a unique
exact fund identity, a single explicit dated closure status within that card,
and a valid non-future date. Accept both the old `Cloturé` spelling and current
`Clôturé`. Reject duplicate cards/widgets, missing status, reopening, conflicting
old/new proofs, different funds, dates outside the card and invalid/future dates.
Failed refreshes retain both prior offers and their verification dates atomically.

No production JSON, terms, workflow or publication configuration is changed.
After approval and merge, normal collection can renew verification using freshly
fetched official responses; this investigation does not publish observations.

Validation:

- Actor collector suite: 9 tests passed, including old/new layout equivalence
  and 14 negative cases asserting atomic retention.
- Current live official responses: parsed successfully; both parts remain closed
  as of 2026-02-04; access/fee text unchanged.
- `node scripts/test-presentations.mjs`: passed.
- `git diff --check`: passed.

Merge and deployment require the user's explicit approval.
