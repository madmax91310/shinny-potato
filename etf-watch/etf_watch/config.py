"""Central configuration: URLs, selectors, and scraping etiquette settings.

Selectors are best-effort, based on documented site structure at the time
this tool was built (site markup was not live-verified from the dev
environment used to write this tool -- see README "Maintenance" section).
When a source's HTML changes, this is the file to fix first.
"""

import os

USER_AGENT = os.environ.get(
    "ETF_WATCH_USER_AGENT",
    "ETFLaunchWatcher/0.1 (+contact: set ETF_WATCH_CONTACT env var; "
    "personal research/monitoring bot, low request volume)",
)

# Minimum delay (seconds) enforced between two requests to the *same* host.
REQUEST_DELAY_SECONDS = float(os.environ.get("ETF_WATCH_DELAY", "3"))
REQUEST_TIMEOUT_SECONDS = 20
MAX_RETRIES = 2

DB_PATH = os.environ.get(
    "ETF_WATCH_DB",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "etf_watch.db"),
)
LOG_PATH = os.environ.get(
    "ETF_WATCH_LOG",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "etf_watch.log"),
)

# Per-source configuration. `requires_js=True` sources will try a plain
# requests fetch first and only fall back to Playwright if that yields no
# usable content and playwright is installed.
SOURCES = {
    "vanguard": {
        "issuer": "Vanguard",
        "urls": ["https://www.vanguard.co.uk/professional/press-centre"],
        "requires_js": False,
    },
    "ishares": {
        "issuer": "BlackRock / iShares",
        "urls": ["https://www.ishares.com/uk/individual/en/products/etf-investments"],
        "requires_js": True,
    },
    "amundi": {
        "issuer": "Amundi",
        "urls": ["https://www.amundietf.fr/fr/professionnels/a-propos/actualites"],
        "requires_js": False,
    },
    "bnpparibas": {
        "issuer": "BNP Paribas Easy",
        "urls": ["https://www.bnpparibas-am.com/en/media-centre/"],
        "requires_js": False,
    },
    "spdr": {
        "issuer": "SPDR / State Street",
        "urls": [
            "https://www.ssga.com/library-content/products/fund-docs/etfs/emea/product-list-emea.pdf"
        ],
        "requires_js": False,
        "is_pdf": True,
    },
    "invesco": {
        "issuer": "Invesco",
        "urls": ["https://www.invesco.com/uk/en/financial-products/etfs.html"],
        "requires_js": True,
    },
    "amf": {
        "issuer": "Multiple (AMF registry)",
        "urls": ["https://geco.amf-france.org/accueil"],
        "requires_js": True,
        "experimental": True,
        # Disabled by default: GECO's search request format was not
        # live-verified when this tool was built (see README). Inspect
        # geco.amf-france.org's network tab in a browser, fix
        # scrapers/amf.py's SEARCH_URL_TEMPLATE, then flip this to True.
        "enabled": False,
    },
    "justetf": {
        "issuer": "Multiple (justETF aggregator)",
        "urls": ["https://www.justetf.com/en/market-overview/newest-etfs.html"],
        "requires_js": False,
    },
}

# Keywords used to filter press-release/news listing links down to ones
# that plausibly announce a *new product launch* (as opposed to results,
# ESG reports, personnel news, etc.). Case-insensitive substring match.
LAUNCH_KEYWORDS = [
    "launch", "launches", "lists", "listing", "new etf", "new fund",
    "lance", "lancement", "cote", "cotation", "nouvel etf", "nouveau etf",
    "introduces", "expands range", "debuts",
]
