# Dow Jones concentration failure — 9 November 2026

## Finding

Run [42658593944](https://github.com/madmax91310/shinny-potato/actions/runs/42658593944), job 129303712503, checked out `0f32d770d768e02f8ff60a36afed3751fe7b8661`.
The collector successfully extracted the 31 October index table. The only unknown reviewed security label was `APPLE INC`. Its missing ISIN made `aggregateCompanies` reject the candidate with `Identifiant, doublon ou poids de titre incohérent`. No company regrouping occurred for that rejected candidate.
`retainQualifiedComposition` then returned the complete 30 September qualified snapshot, with `retained: true` and a failed refresh. The assertion compared its 55.39% with the incoming October table's 54.59%. Its 0.80 percentage-point difference is not floating-point noise.

The test was comparing different economic dates, and the reviewed-label register also needed the newly observed Apple label. The concentration arithmetic and retention policy behaved as designed.

## Evidence and dates

- Artifact `complete-index-sheet-observations` (ID 13692898647), ZIP SHA-256 `129d35149358889eb6e8a9de66aedf23a3a3b93d99ff72849af5a734cdfc4c7b`, contains the exact October observation and qualification rejection. The fixture preserves this observation and the prior qualified record from the checkout above.
- Prior qualified economic date: **2026-09-30**; source check **2026-11-08**. Successful transport/extraction did not turn September into November data. Its original September history entry remains unchanged.
- Incoming economic/reporting date: **2026-10-31**; source check **2026-11-09**. The PDF separately gives NAV as 30 October; the index table belongs to the report dated 31 October. Countries, sectors and holdings come from this same document.
- [Amundi index table](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0007056841/FRA/FRA/INSTITUTIONNEL/ETF), downloaded again on 10 November, has SHA-256 `e1a6dca38e29f01db0d752a30b8fa45b118db01074f6bd6b22eabbf6405980a5`, identical to the run's observation. Page 3 explicitly says “Données de l’indice” and “Principales lignes de l’indice”. The fund is synthetic; its substitute portfolio is not used here.
- Apple identity: [official Invesco holdings response](https://dng-api.invesco.com/cache/v1/accounts/fr_FR/shareclasses/IE0000QLH0G6/holdings/index?idType=isin&loadType=initial), checked on 10 November, SHA-256 `29262cf6aef9016668fe89e2bb4cb4b07bee84233ffaaa97cc56dfd1da1d6a63`: `APPLE INC USD0.00001`, ISIN **US0378331005**, CUSIP `037833100`. This matches the existing canonical holdings register (6 November). Only the identity is taken from that response; no fund weight is substituted into the Dow table.

## Weight comparison

Values below are the published security weights, in percent. September's stored Alphabet entry is preserved as historical evidence, not rewritten or certified anew; its archived PDF was not recovered in this investigation. October's PDF explicitly lists Apple instead. The source URL and index scope did not change; its monthly content and SHA-256 did.

| Source label | Qualified September / retained calculation | October observation / corrected calculation |
| --- | ---: | ---: |
| GOLDMAN SACHS GROUP INC | 10.61 | 10.53 |
| CATERPILLAR INC | 9.57 | 7.35 |
| MICROSOFT CORP | 5.89 | 6.02 |
| AMGEN INC | 4.9 | 5.23 |
| UNITEDHEALTH GROUP INC | 4.34 | 4.67 |
| VISA INC-CLASS A SHARES | 4.23 | 4.66 |
| TRAVELERS COMPANIES | 4.2 | 4.52 |
| ALPHABET INC CL A | 3.95 | absent |
| JPMORGAN CHASE & CO | 3.88 | 3.9 |
| SHERWIN-WILLIAMS CO/THE | 3.82 | 3.75 |
| APPLE INC | absent | 3.96 |
| **Sum of the ten displayed weights** | **55.39** | **54.59** |
| **Remainder to 100** | **44.61** | **45.41** |

The PDF's separate total is 54.60%; the displayed rounded components sum to 54.59%. The program deliberately adds those published components without adjusting or renormalising them. With the reviewed Apple ISIN, ten distinct security/issuer identities remain ten companies, and the actual generator produces the same ten October weights and 54.59% sum.

## Scoped correction

- Add only `APPLE INC` → `US0378331005` to the reviewed-label register.
- Assert the Dow top weights against the retained render model's own `visualFacts` and economic date. For a non-retained record, still require those facts to equal the current observation.
- Exercise the actual builder with the frozen run observation in an isolated register: missing Apple identity must retain all previous weights, date, source metadata and visual facts; `--apply` must not alter the qualified register/history. With the reviewed identity, October qualifies unchanged and `--apply` appends October while preserving September history.
- No live observations, qualified compositions, histories, generated data, core arithmetic or retention rules are changed by this PR. The next ordinary approved collection can qualify its current source normally.

## Validation

Passed: `npm run test:index-concentration` (including native-index and isolated Dow refresh regressions), `test-index-proxy-identity.mjs`, `test-automated-index-sheets.mjs`, `test-automated-indices.mjs`, `audit-index-facts.mjs`; Python suites `test_index_companies.py`, `test_complete_index_sheets.py`, `test_world_sector_indices.py`, `test_index_composition_gate.py`, `test_korea_companies.py`, `test_index_report_ownership.py` (30 tests total).

Other qualification failures in the original run concern incompatible dates on unrelated indices; this change does not claim to repair those sources or make the whole workflow green. No workflow rerun, merge or deployment is requested or performed.
