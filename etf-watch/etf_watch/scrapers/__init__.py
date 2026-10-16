from .amf import AMFScraper
from .amundi import AmundiScraper
from .bnpparibas import BNPParibasScraper
from .invesco import InvescoScraper
from .ishares import ISharesScraper
from .justetf import JustETFScraper
from .spdr import SPDRScraper
from .vanguard import VanguardScraper

ALL_SCRAPERS = [
    VanguardScraper,
    ISharesScraper,
    AmundiScraper,
    BNPParibasScraper,
    SPDRScraper,
    InvescoScraper,
    AMFScraper,
    JustETFScraper,
]

__all__ = [
    "ALL_SCRAPERS",
    "VanguardScraper",
    "ISharesScraper",
    "AmundiScraper",
    "BNPParibasScraper",
    "SPDRScraper",
    "InvescoScraper",
    "AMFScraper",
    "JustETFScraper",
]
