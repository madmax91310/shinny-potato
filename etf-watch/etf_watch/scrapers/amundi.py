from .. import config
from .press_release import PressReleaseScraper


class AmundiScraper(PressReleaseScraper):
    name = "amundi"
    issuer = config.SOURCES["amundi"]["issuer"]
    listing_url = config.SOURCES["amundi"]["urls"][0]
