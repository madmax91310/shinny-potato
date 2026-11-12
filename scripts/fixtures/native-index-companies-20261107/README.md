# Native index company-view regression fixtures

Financial records copied without modification from the existing complete holdings register at commit `6841e92c2054d43d6be377e0c95e55ba41cb4be1` (7 November2026). Source URLs, response hashes, dates, complete-source census and exact-share benchmark proofs remain inside each record. These are offline regression fixtures, not new supplier controls.

The independent oracle uses Python Decimal over every published weight and only the existing reviewed ISIN-to-issuer links. No name join or weight renormalisation. The source may publish rounded rows summing slightly above100%; the signed rounding remainder is preserved. All-source qualification precedes deriving the ten-company view.

Uncompressed financial fixture SHA256: `56f08f9c7774ff4fe962a6fa2dc714532a213aa45c5645d794f839fb18fb318a`.

`dax-new-entrant.json` reproduces the October DAX source table and the independently consulted official Deutsche Börse exchange identity for its new top-ten entrant. It is a regression fixture, not a fresh source control.
