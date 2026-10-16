"""Heuristic extraction of ETF fields from free-flowing press-release prose.

Several issuers (Vanguard, Amundi, BNP Paribas Easy) announce launches in
article/PDF text rather than structured tables, so ISIN/TER/date have to be
pulled out with regex + nearby-keyword heuristics rather than a clean
selector. This is inherently best-effort: verify important figures against
the source before publishing.
"""

from __future__ import annotations

import re

from .models import ISIN_RE

TER_RE = re.compile(
    r"(?:TER|OCF|ongoing charge[s]?|frais(?:\s+courants)?|expense ratio)"
    r"[^%\n\d]{0,25}(\d{1,2}[.,]\d{1,3})\s*%",
    re.IGNORECASE,
)
# Fallback: any "0.NN%" figure below 3% (typical ETF TER range) if the
# keyword-anchored pattern above finds nothing.
LOOSE_PERCENT_RE = re.compile(r"\b(0[.,]\d{1,3}|1[.,]\d{1,3}|2[.,]\d{1,3})\s*%")

TICKER_RE = re.compile(
    r"(?:ticker|code(?:\s+mnémonique)?|symbol)\s*[:\-]?\s*([A-Z0-9]{2,6})",
    re.IGNORECASE,
)

DATE_PATTERNS = [
    # 15 July 2026 / 15 juillet 2026
    re.compile(
        r"\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|"
        r"September|October|November|December|janvier|février|mars|avril|mai|"
        r"juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})\b",
        re.IGNORECASE,
    ),
    # 2026-07-15 or 15/07/2026
    re.compile(r"\b(\d{4}-\d{2}-\d{2})\b"),
    re.compile(r"\b(\d{1,2}/\d{1,2}/\d{4})\b"),
]

ASSET_CLASS_KEYWORDS = {
    "equity": ["equity", "equities", "stock", "actions"],
    "fixed_income": ["bond", "fixed income", "obligation", "obligataire", "treasury", "gilt"],
    "commodity": ["commodity", "commodities", "matières premières", "gold", "or "],
    "multi_asset": ["multi-asset", "multi asset", "diversifié"],
    "money_market": ["money market", "monétaire"],
    "crypto": ["bitcoin", "crypto", "ethereum"],
}


def find_isin(text: str) -> str | None:
    match = ISIN_RE.search(text)
    return match.group(0) if match else None


def find_all_isins(text: str) -> list[str]:
    return ISIN_RE.findall(text)


def find_ter(text: str) -> str | None:
    match = TER_RE.search(text)
    if match:
        return match.group(1).replace(",", ".") + "%"
    match = LOOSE_PERCENT_RE.search(text)
    if match:
        return match.group(1).replace(",", ".") + "%"
    return None


def find_ticker(text: str) -> str | None:
    match = TICKER_RE.search(text)
    return match.group(1).upper() if match else None


def find_launch_date(text: str) -> str | None:
    for pattern in DATE_PATTERNS:
        match = pattern.search(text)
        if match:
            return match.group(1)
    return None


def guess_asset_class(text: str) -> str | None:
    lowered = text.lower()
    for asset_class, keywords in ASSET_CLASS_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            return asset_class
    return None


def looks_like_launch(text: str, keywords: list[str]) -> bool:
    lowered = text.lower()
    return any(kw.lower() in lowered for kw in keywords)
