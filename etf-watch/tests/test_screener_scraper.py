import os

import pytest

from etf_watch.scrapers import screener

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def read_fixture(name):
    with open(os.path.join(FIXTURES, name), encoding="utf-8") as f:
        return f.read()


class FakeScreenerScraper(screener.ScreenerScraper):
    name = "ishares"
    issuer = "BlackRock / iShares"
    listing_url = "https://example.com/screener"


@pytest.fixture
def scraper(monkeypatch):
    monkeypatch.setattr(screener, "fetch_url", lambda url, binary=False: read_fixture("screener_page.html"))
    monkeypatch.setattr(screener, "fetch_url_js", lambda *a, **k: None)
    return FakeScreenerScraper()


def test_fetch_uses_static_html_when_isin_present(scraper):
    html = scraper.fetch()
    assert "IE00B4L5Y983" in html


def test_parse_finds_both_isins(scraper):
    html = scraper.fetch()
    products = scraper.parse(html)
    isins = {p.isin for p in products}
    assert isins == {"IE00B4L5Y983", "IE00B1XNHC34"}


def test_parse_extracts_ter_from_context_window(scraper):
    html = scraper.fetch()
    products = {p.isin: p for p in scraper.parse(html)}
    assert products["IE00B4L5Y983"].ter == "0.20%"
    assert products["IE00B1XNHC34"].ter == "0.65%"


def test_parse_dedupes_repeated_isin(monkeypatch):
    monkeypatch.setattr(
        screener, "fetch_url",
        lambda url, binary=False: "IE00B4L5Y983 appears twice IE00B4L5Y983 in this text",
    )
    s = FakeScreenerScraper()
    products = s.parse(s.fetch())
    assert len(products) == 1


def test_fetch_falls_back_to_js_when_no_isin(monkeypatch):
    calls = {"js_called": False}

    def fake_fetch_url(url, binary=False):
        return "<html>no product identifiers here</html>"

    def fake_fetch_url_js(url, wait_selector=None, timeout_ms=20000):
        calls["js_called"] = True
        return read_fixture("screener_page.html")

    monkeypatch.setattr(screener, "fetch_url", fake_fetch_url)
    monkeypatch.setattr(screener, "fetch_url_js", fake_fetch_url_js)

    s = FakeScreenerScraper()
    html = s.fetch()
    assert calls["js_called"] is True
    assert "IE00B4L5Y983" in html
