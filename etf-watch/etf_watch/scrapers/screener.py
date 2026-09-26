"""Generic scraper for JS-heavy 'screener' style listing pages (iShares,
Invesco, justETF) where each ETF's ISIN appears somewhere on the rendered
page but there's no guaranteed table/row structure to rely on.

Strategy: try a plain requests fetch first; if the resulting HTML contains
no ISIN at all (a strong sign the content is client-side rendered), fall
back to Playwright to get the fully rendered DOM. Either way, extract one
candidate product per distinct ISIN found, using a window of text
immediately surrounding each occurrence for the product name / ticker /
TER / asset class.

This is intentionally conservative: it is much more reliable at detecting
"this ISIN exists on the page" than at perfectly parsing every field.
Expect `ticker` / `ter` / `launch_date` to be missing more often than with
the press-release scrapers -- treat extracted fields as a starting point
to verify, not as guaranteed-accurate.
"""

from __future__ import annotations

import re

from bs4 import BeautifulSoup

from ..fetch import fetch_url, fetch_url_js
from ..models import ISIN_RE, ETFProduct
from ..text_extract import find_launch_date, find_ter, find_ticker, guess_asset_class
from .base import BaseScraper, logger

_WHITESPACE_RE = re.compile(r"\s+")


class ScreenerScraper(BaseScraper):
    listing_url: str = ""
    js_wait_selector: str | None = None
    context_chars: int = 220

    def fetch(self):
        html = fetch_url(self.listing_url)
        if html and ISIN_RE.search(html):
            return html

        logger.info(
            "[%s] static fetch had no ISIN matches, trying Playwright fallback", self.name
        )
        js_html = fetch_url_js(self.listing_url, wait_selector=self.js_wait_selector)
        if js_html:
            return js_html

        return html

    def parse(self, html: str) -> list[ETFProduct]:
        text = _WHITESPACE_RE.sub(" ", BeautifulSoup(html, "lxml").get_text(" ", strip=True))
        matches = list(ISIN_RE.finditer(text))
        if not matches:
            logger.info(
                "[%s] no ISINs found even after fallback -- page structure "
                "has likely changed or is behind stronger bot protection", self.name
            )
            return []

        products = []
        seen_isins = set()
        for i, match in enumerate(matches):
            isin = match.group(0)
            if isin in seen_isins:
                continue
            seen_isins.add(isin)

            # Bound the context window by the neighbouring ISIN matches so
            # a dense table doesn't leak one row's TER/ticker into the
            # next row's product.
            prev_end = matches[i - 1].end() if i > 0 else 0
            next_start = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            before_start = max(prev_end, match.start() - self.context_chars)
            after_end = min(next_start, match.end() + self.context_chars)

            before = text[before_start: match.start()]
            after = text[match.end(): after_end]
            window = before + " " + after

            # Ticker conventionally precedes the ISIN ("... ticker: X,
            # ISIN Y..." / table column order Name/Ticker/ISIN); TER
            # conventionally follows it (table column order .../ISIN/TER).
            # Check the same-row-likely side first so a neighbouring row's
            # value in a dense table doesn't win a leftmost regex match.
            products.append(
                ETFProduct(
                    isin=isin,
                    name=self._guess_name(before),
                    issuer=self.issuer,
                    source_name=self.name,
                    source_url=self.listing_url,
                    ticker=find_ticker(before) or find_ticker(after),
                    ter=find_ter(after) or find_ter(before),
                    launch_date=find_launch_date(window),
                    asset_class=guess_asset_class(window),
                )
            )
        return products

    @staticmethod
    def _guess_name(text_before_isin: str) -> str:
        segment = text_before_isin.strip()
        for sep in (" | ", " - ", ". ", " · "):
            if sep in segment:
                segment = segment.rsplit(sep, 1)[-1]
        return segment[-120:].strip() or "Unnamed ETF"
