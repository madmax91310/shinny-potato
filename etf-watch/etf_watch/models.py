"""Data model for a scraped ETF product."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone

ISIN_RE = re.compile(r"\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b")


@dataclass
class ETFProduct:
    isin: str
    name: str
    issuer: str
    source_name: str
    source_url: str
    ticker: str | None = None
    index: str | None = None
    ter: str | None = None
    asset_class: str | None = None
    region: str | None = None
    launch_date: str | None = None
    currency: str | None = None
    scraped_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(timespec="seconds")
    )

    def is_valid(self) -> bool:
        return bool(self.isin and ISIN_RE.fullmatch(self.isin) and self.name)

    def to_row(self) -> dict:
        return {
            "isin": self.isin,
            "name": self.name,
            "issuer": self.issuer,
            "ticker": self.ticker,
            "index_tracked": self.index,
            "ter": self.ter,
            "asset_class": self.asset_class,
            "region": self.region,
            "launch_date": self.launch_date,
            "currency": self.currency,
            "source_name": self.source_name,
            "source_url": self.source_url,
            "scraped_at": self.scraped_at,
        }
