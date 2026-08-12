"""Fetch the previous day's closing prices for the tracked assets."""

from __future__ import annotations

from dataclasses import dataclass

import yfinance as yf

TICKERS = {
    "cac40": "^FCHI",
    "sp500": "^GSPC",
    "bitcoin": "BTC-USD",
    "gold": "GC=F",
}

LABELS = {
    "cac40": "CAC 40",
    "sp500": "S&P 500",
    "bitcoin": "Bitcoin",
    "gold": "Or",
}


@dataclass
class MarketQuote:
    label: str
    ticker: str
    close: float | None
    change_pct: float | None


def fetch_quote(key: str, ticker: str) -> MarketQuote:
    history = yf.Ticker(ticker).history(period="5d")
    closes = history["Close"].dropna()
    if len(closes) < 2:
        return MarketQuote(LABELS[key], ticker, None, None)
    last_close = float(closes.iloc[-1])
    prev_close = float(closes.iloc[-2])
    change_pct = (last_close - prev_close) / prev_close * 100
    return MarketQuote(LABELS[key], ticker, last_close, change_pct)


def fetch_all_quotes() -> dict[str, MarketQuote]:
    return {key: fetch_quote(key, ticker) for key, ticker in TICKERS.items()}
