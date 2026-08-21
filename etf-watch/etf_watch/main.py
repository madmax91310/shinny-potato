"""CLI entrypoint: run all (enabled) source scrapers, diff against the
local SQLite DB, and report newly-detected ETF launches.

Usage:
    python -m etf_watch.main                 # normal run (cron-friendly)
    python -m etf_watch.main --once           # same as above, explicit
    python -m etf_watch.main --source vanguard --source amundi
    python -m etf_watch.main --dry-run        # scrape + diff, don't write to DB
    python -m etf_watch.main --list-sources

Exit codes: 0 = ran fine (regardless of whether new launches were found),
1 = every enabled source failed to fetch anything (likely a real problem
worth investigating), never raises for a single-source failure.
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone

from . import config, db
from .logging_setup import get_logger
from .models import ETFProduct
from .scrapers import (
    AMFScraper,
    AmundiScraper,
    BNPParibasScraper,
    InvescoScraper,
    ISharesScraper,
    JustETFScraper,
    SPDRScraper,
    VanguardScraper,
)
from .summarize import build_digest

logger = get_logger(__name__)

SCRAPER_CLASSES = {
    "vanguard": VanguardScraper,
    "ishares": ISharesScraper,
    "amundi": AmundiScraper,
    "bnpparibas": BNPParibasScraper,
    "spdr": SPDRScraper,
    "invesco": InvescoScraper,
    "amf": AMFScraper,
    "justetf": JustETFScraper,
}


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="ETF launch watch tool")
    parser.add_argument(
        "--once", action="store_true",
        help="Run a single pass (default behaviour either way; kept for explicitness in cron jobs).",
    )
    parser.add_argument(
        "--source", action="append", dest="sources", metavar="NAME",
        help="Limit the run to one or more sources (repeatable). Default: all enabled sources.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Scrape and diff against the DB but don't persist new rows (for testing).",
    )
    parser.add_argument(
        "--list-sources", action="store_true", help="Print configured sources and exit.",
    )
    parser.add_argument(
        "--db", dest="db_path", default=None, help="Override the SQLite DB path.",
    )
    return parser.parse_args(argv)


def enabled_source_names(requested: list[str] | None) -> list[str]:
    if requested:
        unknown = set(requested) - set(SCRAPER_CLASSES)
        if unknown:
            raise SystemExit(f"Unknown source(s): {', '.join(sorted(unknown))}")
        return requested
    return [
        name for name, cfg in config.SOURCES.items() if cfg.get("enabled", True)
    ]


def run(argv=None) -> int:
    args = parse_args(argv)

    if args.list_sources:
        for name, cfg in config.SOURCES.items():
            status = "enabled" if cfg.get("enabled", True) else "disabled"
            tag = " [experimental]" if cfg.get("experimental") else ""
            print(f"{name:12s} {cfg['issuer']:30s} {status}{tag}")
        return 0

    db_path = args.db_path or config.DB_PATH
    db.init_db(db_path)

    source_names = enabled_source_names(args.sources)
    started_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    logger.info("Starting run for sources: %s", ", ".join(source_names))

    with db.connect(db_path) as conn:
        is_first_ever_run = conn.execute("SELECT COUNT(*) AS c FROM runs").fetchone()["c"] == 0
        known_isins = db.get_known_isins(conn)

    all_products: list[ETFProduct] = []
    sources_ok, sources_failed = [], []

    for name in source_names:
        scraper = SCRAPER_CLASSES[name]()
        try:
            result = scraper.run()
        except Exception:
            logger.exception("[%s] unexpected top-level failure", name)
            sources_failed.append(name)
            continue

        if result.ok:
            sources_ok.append(name)
        else:
            sources_failed.append(name)
        all_products.extend(result.products)

    # Dedup across sources by ISIN (same ETF can appear on an issuer page
    # and on an aggregator like justETF).
    by_isin: dict[str, ETFProduct] = {}
    for product in all_products:
        by_isin.setdefault(product.isin, product)

    new_products = [p for isin, p in by_isin.items() if isin not in known_isins]

    if is_first_ever_run and new_products:
        logger.info(
            "First-ever run: recording %d product(s) as the baseline catalogue "
            "without emitting launch alerts for them.", len(new_products)
        )
        products_to_announce: list[ETFProduct] = []
    else:
        products_to_announce = new_products

    if not args.dry_run:
        with db.connect(db_path) as conn:
            for product in new_products:
                db.insert_new_etf(conn, product)
            db.record_run(
                conn,
                started_at=started_at,
                finished_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
                sources_ok=sources_ok,
                sources_failed=sources_failed,
                products_seen=len(by_isin),
                new_products=len(new_products),
                errors=len(sources_failed),
            )

    digest = build_digest(products_to_announce)
    print(digest)

    logger.info(
        "Run finished: %d product(s) seen, %d new, %d source(s) failed/empty (%s)",
        len(by_isin), len(new_products), len(sources_failed), ", ".join(sources_failed) or "none",
    )

    return 0 if sources_ok or not source_names else 1


if __name__ == "__main__":
    sys.exit(run())
