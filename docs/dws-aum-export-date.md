# DWS dated AUM recovery — 13 October 2026

Run 38320643713 collected at 2026-10-12T23:12:21Z. Its saved observation reports `Official document date is missing, future or stale` for the AUM of IE00BM67HV82 and IE00BM67HQ30. Neither required AUM field was removed, and both previous observations were preserved.

Live official `historicaldata/download` workbooks now supply both AUMs. The Industrials workbook's `As of` header reads 13.10.2026 even when requesting an end date of 12 October; its latest valuation is 09.10.2026. The product API's NAV date agrees. The midnight diagnosis is consistent with the saved failure and reproduced by passing a valid export to the parser at 23:12 UTC on the preceding day. The original failing raw workbook was not retained, so its exact export header cannot be verified retrospectively.

The header is checked against the European export calendar (`Europe/Berlin`). Actual valuation dates still use the original UTC freshness/future checks, and the latest value must still match the official NAV date. An export cannot predate its values. Exact ISIN, USD currency, positive amount, duplicate dates, formula/size limits and fund scope remain mandatory. No estimate, currency conversion, cached fixture fallback or weakened valuation threshold is introduced.

Regression tests cover the midnight boundary, genuinely future exports, future valuations, and exports preceding valuations. A focused Actions job collects both official DWS sources through the production refresh/merge path, then checks the round-four issuer and monthly consumers. Existing daily issuer refresh remains unchanged.
