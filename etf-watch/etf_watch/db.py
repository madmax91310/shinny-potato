"""SQLite storage. ISIN is the unique key used to detect new launches."""

from __future__ import annotations

import contextlib
import os
import sqlite3
from datetime import datetime, timezone

from . import config
from .models import ETFProduct

SCHEMA = """
CREATE TABLE IF NOT EXISTS etfs (
    isin TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    issuer TEXT,
    ticker TEXT,
    index_tracked TEXT,
    ter TEXT,
    asset_class TEXT,
    region TEXT,
    launch_date TEXT,
    currency TEXT,
    source_name TEXT,
    source_url TEXT,
    scraped_at TEXT,
    first_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    sources_ok TEXT,
    sources_failed TEXT,
    products_seen INTEGER,
    new_products INTEGER,
    errors INTEGER
);
"""


@contextlib.contextmanager
def connect(db_path: str | None = None):
    path = db_path or config.DB_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(db_path: str | None = None) -> None:
    with connect(db_path) as conn:
        conn.executescript(SCHEMA)


def get_known_isins(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("SELECT isin FROM etfs").fetchall()
    return {row["isin"] for row in rows}


def insert_new_etf(conn: sqlite3.Connection, product: ETFProduct) -> None:
    row = product.to_row()
    row["first_seen_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    conn.execute(
        """
        INSERT OR IGNORE INTO etfs (
            isin, name, issuer, ticker, index_tracked, ter, asset_class,
            region, launch_date, currency, source_name, source_url,
            scraped_at, first_seen_at
        ) VALUES (
            :isin, :name, :issuer, :ticker, :index_tracked, :ter, :asset_class,
            :region, :launch_date, :currency, :source_name, :source_url,
            :scraped_at, :first_seen_at
        )
        """,
        row,
    )


def record_run(
    conn: sqlite3.Connection,
    *,
    started_at: str,
    finished_at: str,
    sources_ok: list[str],
    sources_failed: list[str],
    products_seen: int,
    new_products: int,
    errors: int,
) -> None:
    conn.execute(
        """
        INSERT INTO runs (
            started_at, finished_at, sources_ok, sources_failed,
            products_seen, new_products, errors
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            started_at,
            finished_at,
            ",".join(sources_ok),
            ",".join(sources_failed),
            products_seen,
            new_products,
            errors,
        ),
    )
