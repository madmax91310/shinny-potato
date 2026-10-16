from .. import config
from .press_release import PressReleaseScraper


class VanguardScraper(PressReleaseScraper):
    name = "vanguard"
    issuer = config.SOURCES["vanguard"]["issuer"]
    listing_url = config.SOURCES["vanguard"]["urls"][0]
    # Vanguard often links out to PDF press releases rather than HTML
    # articles; PressReleaseScraper._fetch_article_text handles both.
