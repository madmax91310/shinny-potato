"""AMF (Autorité des Marchés Financiers) GECO registry scraper.

EXPERIMENTAL and disabled by default (see config.py `SOURCES["amf"]`).

GECO (geco.amf-france.org) is AMF's public fund registry, which includes
"déclarations de commercialisation" for ETFs sold in France. Its search
request format could not be live-verified when this tool was built (this
sandbox's network egress was blocked to amf-france.org) -- so
SEARCH_URL_TEMPLATE below is a best guess, not a confirmed endpoint.

To make this scraper work:
1. Open https://geco.amf-france.org/accueil in a real browser, search for
   a management company (e.g. "Amundi"), and check the Network tab for
   the actual request the search box fires (URL + query params, and
   whether the response is HTML or JSON).
2. Update SEARCH_URL_TEMPLATE (and parse(), if the response turns out to
   be JSON rather than HTML) to match.
3. Set SOURCES["amf"]["enabled"] = True in config.py.
"""

from __future__ import annotations

from urllib.parse import quote

from .. import config
from ..fetch import fetch_url_js
from .base import logger
from .screener import ScreenerScraper

ISSUER_QUERY_NAMES = [
    "Vanguard", "BlackRock", "Amundi", "BNP Paribas", "State Street", "Invesco",
]

SEARCH_URL_TEMPLATE = "https://geco.amf-france.org/Bio/rech_opcvm?nomSG={query}"


class AMFScraper(ScreenerScraper):
    name = "amf"
    issuer = config.SOURCES["amf"]["issuer"]
    experimental = True

    def fetch(self):
        pages = []
        for issuer_name in ISSUER_QUERY_NAMES:
            url = SEARCH_URL_TEMPLATE.format(query=quote(issuer_name))
            html = fetch_url_js(url)
            if html:
                pages.append(html)
            else:
                logger.info(
                    "[%s] no result for issuer query %r (endpoint likely needs "
                    "verification -- see scrapers/amf.py docstring)",
                    self.name, issuer_name,
                )
        return "\n".join(pages) if pages else None

    def parse(self, html):
        products = super().parse(html)
        for product in products:
            product.source_url = config.SOURCES["amf"]["urls"][0]
        return products
