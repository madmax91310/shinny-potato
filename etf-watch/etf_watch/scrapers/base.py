"""Base class every source-specific scraper inherits from.

Design goal: a broken scraper (site redesign, network blip, bad markup)
must never take down the whole run. `run()` is the only method the
orchestrator calls, and it always returns a ScraperResult instead of
raising.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from ..logging_setup import get_logger
from ..models import ETFProduct

logger = get_logger(__name__)


@dataclass
class ScraperResult:
    products: list[ETFProduct] = field(default_factory=list)
    ok: bool = False  # True iff fetch() returned usable content
    error: str | None = None


class BaseScraper:
    name: str = "base"
    issuer: str = "Unknown"
    experimental: bool = False

    def fetch(self):
        """Return raw content (str/bytes) to parse, or None on failure."""
        raise NotImplementedError

    def parse(self, content) -> list[ETFProduct]:
        """Return a list of ETFProduct built from raw fetched content."""
        raise NotImplementedError

    def run(self) -> ScraperResult:
        try:
            content = self.fetch()
        except Exception as exc:
            logger.exception("[%s] fetch() raised an unexpected exception", self.name)
            return ScraperResult(ok=False, error=str(exc))

        if content is None:
            logger.warning("[%s] no content fetched, skipping this source for this run", self.name)
            return ScraperResult(ok=False, error="no content fetched")

        try:
            products = self.parse(content)
        except Exception as exc:
            logger.exception("[%s] parse() raised an unexpected exception", self.name)
            return ScraperResult(ok=False, error=str(exc))

        valid_products = []
        for product in products:
            if product.is_valid():
                valid_products.append(product)
            else:
                logger.warning(
                    "[%s] dropped a product with missing/invalid ISIN or name: %r",
                    self.name, product,
                )

        logger.info("[%s] found %d valid product(s)", self.name, len(valid_products))
        return ScraperResult(products=valid_products, ok=True)
