"""Shared logic for issuers that announce launches via a news/press-release
listing page (Vanguard, Amundi, BNP Paribas Easy): find links to articles
that look launch-related, fetch each one, and pull ISIN/ticker/TER/date out
of the article prose with the shared regex heuristics.

Subclasses only need to implement `_extract_candidate_links`, which knows
the specific listing page's markup.
"""

from __future__ import annotations

from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .. import config
from ..fetch import fetch_url
from ..models import ETFProduct
from ..pdf_utils import extract_pdf_text
from ..text_extract import find_isin, find_launch_date, find_ter, find_ticker, guess_asset_class, looks_like_launch
from .base import BaseScraper, logger


class PressReleaseScraper(BaseScraper):
    listing_url: str = ""
    max_articles: int = 15

    def fetch(self):
        return fetch_url(self.listing_url)

    def _extract_candidate_links(self, soup: BeautifulSoup) -> list[tuple[str, str]]:
        """Return a list of (absolute_url, title) tuples for links on the
        listing page whose visible text looks launch-related. Generic
        fallback implementation: scan every <a> tag; subclasses can
        override for a tighter, page-specific selector."""
        candidates = []
        seen_urls = set()
        for a in soup.find_all("a", href=True):
            title = a.get_text(" ", strip=True)
            if not title or len(title) < 8:
                continue
            if not looks_like_launch(title, config.LAUNCH_KEYWORDS):
                continue
            url = urljoin(self.listing_url, a["href"])
            if url in seen_urls:
                continue
            seen_urls.add(url)
            candidates.append((url, title))
        return candidates

    def _fetch_article_text(self, url: str) -> str | None:
        """Fetch an article, whether it's an HTML page or a linked PDF
        press release, and return its plain text."""
        if url.lower().endswith(".pdf"):
            pdf_bytes = fetch_url(url, binary=True)
            if not pdf_bytes:
                return None
            return extract_pdf_text(pdf_bytes)

        article_html = fetch_url(url)
        if not article_html:
            return None
        return BeautifulSoup(article_html, "lxml").get_text(" ", strip=True)

    def parse(self, html: str) -> list[ETFProduct]:
        soup = BeautifulSoup(html, "lxml")
        candidates = self._extract_candidate_links(soup)
        if not candidates:
            logger.info(
                "[%s] no launch-looking links found on listing page "
                "-- markup may have changed, see config.py", self.name
            )

        products: list[ETFProduct] = []
        for url, title in candidates[: self.max_articles]:
            article_text = self._fetch_article_text(url)
            if not article_text:
                continue

            isin = find_isin(article_text)
            if not isin:
                logger.info("[%s] no ISIN found in article, skipping: %s", self.name, url)
                continue

            products.append(
                ETFProduct(
                    isin=isin,
                    name=title,
                    issuer=self.issuer,
                    source_name=self.name,
                    source_url=url,
                    ticker=find_ticker(article_text),
                    ter=find_ter(article_text),
                    launch_date=find_launch_date(article_text),
                    asset_class=guess_asset_class(article_text),
                )
            )
        return products
