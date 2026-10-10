from .. import config
from .screener import ScreenerScraper


class InvescoScraper(ScreenerScraper):
    name = "invesco"
    issuer = config.SOURCES["invesco"]["issuer"]
    listing_url = config.SOURCES["invesco"]["urls"][0]
