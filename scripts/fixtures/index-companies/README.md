# Company concentration fixtures

Captured on 21 October 2026 from public issuer/provider sources. Fixtures fix their
own historical dates; tests never fix values expected from a live refresh.

- `korea.txt`: MSCI Korea official factsheet, 30 September 2026,
  https://www.msci.com/documents/10199/255599/msci-korea-index.pdf
- `hanaro-2026-10-20.html`: complete 75-row physical subscription portfolio
  component, including its explicit date/count and KRW cash line, from
  https://www.hanaroetf.com/fund/CEBA1E927AC1478B
- `korea-security-attributes-2026-10-20.json`: only ISIN, name, sector, country,
  asset class and snapshot date from the BlackRock issuer component configured in
  `index-company-sources.json`. No capped-fund weight is present or used.

HANARO's live prospectus is linked in the same configuration. The exact benchmark
and full-replication wording are checked on every collection. Holdings and their
classification must have the same date; a failure retains the previous qualified
composition. The native portfolio is an explicit approximation, not an official
MSCI composition.
