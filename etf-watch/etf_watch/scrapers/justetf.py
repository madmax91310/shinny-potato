from .. import config
from .screener import ScreenerScraper


class JustETFScraper(ScreenerScraper):
    name = "justetf"
    issuer = config.SOURCES["justetf"]["issuer"]
    listing_url = config.SOURCES["justetf"]["urls"][0]
    # justETF's "newest ETFs" page is largely server-rendered per known
    # open-source scrapers, so the Playwright fallback should rarely
    # trigger here -- if it does, that's a signal the page changed.
