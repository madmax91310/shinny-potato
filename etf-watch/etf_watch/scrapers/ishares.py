from .. import config
from .screener import ScreenerScraper


class ISharesScraper(ScreenerScraper):
    name = "ishares"
    issuer = config.SOURCES["ishares"]["issuer"]
    listing_url = config.SOURCES["ishares"]["urls"][0]
