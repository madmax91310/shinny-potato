"""SPDR / State Street EMEA product-list PDF scraper.

The most structured public source for SPDR's EMEA range is a monthly PDF
product list (see config.py) rather than an HTML page. TER is often not
included in this summary list -- if you need it, extend this scraper to
also fetch each fund's individual factsheet PDF
(ssga.com/library-content/products/factsheets/etfs/emea/...).
"""

from __future__ import annotations

from .. import config
from ..fetch import fetch_url
from ..models import ISIN_RE, ETFProduct
from ..pdf_utils import extract_pdf_tables, extract_pdf_text
from .base import BaseScraper


class SPDRScraper(BaseScraper):
    name = "spdr"
    issuer = config.SOURCES["spdr"]["issuer"]
    pdf_url = config.SOURCES["spdr"]["urls"][0]

    def fetch(self):
        return fetch_url(self.pdf_url, binary=True)

    def parse(self, pdf_bytes: bytes) -> list[ETFProduct]:
        products = self._parse_tables(pdf_bytes)
        if not products:
            products = self._parse_text_fallback(pdf_bytes)
        return products

    def _parse_tables(self, pdf_bytes: bytes) -> list[ETFProduct]:
        products: list[ETFProduct] = []
        for table in extract_pdf_tables(pdf_bytes):
            if not table:
                continue
            header = [(cell or "").strip().lower() for cell in table[0]]
            isin_col = self._find_col(header, ["isin"])
            if isin_col is None:
                continue
            name_col = self._find_col(header, ["fund name", "name", "product"])
            ticker_col = self._find_col(header, ["ticker", "bloomberg", "code"])

            for row in table[1:]:
                if isin_col >= len(row):
                    continue
                isin_cell = (row[isin_col] or "").strip()
                if not ISIN_RE.fullmatch(isin_cell):
                    continue
                name = "Unnamed ETF"
                if name_col is not None and name_col < len(row) and row[name_col]:
                    name = row[name_col].strip()
                ticker = None
                if ticker_col is not None and ticker_col < len(row) and row[ticker_col]:
                    ticker = row[ticker_col].strip()
                products.append(
                    ETFProduct(
                        isin=isin_cell,
                        name=name,
                        issuer=self.issuer,
                        source_name=self.name,
                        source_url=self.pdf_url,
                        ticker=ticker,
                    )
                )
        return products

    def _parse_text_fallback(self, pdf_bytes: bytes) -> list[ETFProduct]:
        text = extract_pdf_text(pdf_bytes)
        if not text:
            return []
        products = []
        for match in ISIN_RE.finditer(text):
            isin = match.group(0)
            before = text[max(0, match.start() - 150): match.start()]
            name = before.strip()[-100:] or "Unnamed ETF"
            products.append(
                ETFProduct(
                    isin=isin,
                    name=name,
                    issuer=self.issuer,
                    source_name=self.name,
                    source_url=self.pdf_url,
                )
            )
        return products

    @staticmethod
    def _find_col(header: list[str], candidates: list[str]) -> int | None:
        for idx, col in enumerate(header):
            if any(c in col for c in candidates):
                return idx
        return None
