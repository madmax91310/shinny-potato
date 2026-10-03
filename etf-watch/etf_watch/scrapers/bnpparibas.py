from .. import config
from .press_release import PressReleaseScraper


class BNPParibasScraper(PressReleaseScraper):
    name = "bnpparibas"
    issuer = config.SOURCES["bnpparibas"]["issuer"]
    listing_url = config.SOURCES["bnpparibas"]["urls"][0]
