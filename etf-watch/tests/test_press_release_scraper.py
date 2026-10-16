import os

import pytest

from etf_watch.scrapers import press_release

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def read_fixture(name):
    with open(os.path.join(FIXTURES, name), encoding="utf-8") as f:
        return f.read()


class FakeAmundiScraper(press_release.PressReleaseScraper):
    name = "amundi"
    issuer = "Amundi"
    listing_url = "https://example.com/news"


ARTICLE_MAP = {
    "https://example.com/news/amundi-launches-new-global-equity-etf": "article_equity.html",
    "https://example.com/news/amundi-lance-un-nouvel-etf-obligataire": "article_bond.html",
    "https://example.com/news/amundi-launches-new-website": "article_no_isin.html",
}


@pytest.fixture
def scraper(monkeypatch):
    def fake_fetch_url(url, binary=False):
        if url == "https://example.com/news":
            return read_fixture("listing_page.html")
        fixture_name = ARTICLE_MAP.get(url)
        if fixture_name:
            return read_fixture(fixture_name)
        return None

    monkeypatch.setattr(press_release, "fetch_url", fake_fetch_url)
    return FakeAmundiScraper()


def test_fetch_returns_listing_html(scraper):
    html = scraper.fetch()
    assert "Amundi launches new Global Equity ETF" in html


def test_parse_extracts_only_launch_products(scraper):
    html = scraper.fetch()
    products = scraper.parse(html)

    isins = {p.isin for p in products}
    assert isins == {"FR0013456789", "LU9876543210"}


def test_parse_extracts_fields_from_english_article(scraper):
    html = scraper.fetch()
    products = {p.isin: p for p in scraper.parse(html)}
    equity = products["FR0013456789"]

    assert equity.ticker == "AGEQ"
    assert equity.ter == "0.20%"
    assert equity.launch_date == "15 July 2026"
    assert equity.asset_class == "equity"
    assert equity.issuer == "Amundi"


def test_parse_extracts_fields_from_french_article(scraper):
    html = scraper.fetch()
    products = {p.isin: p for p in scraper.parse(html)}
    bond = products["LU9876543210"]

    assert bond.ticker == "AGOB"
    assert bond.ter == "0.15%"
    assert bond.launch_date == "3 mars 2026"
    assert bond.asset_class == "fixed_income"


def test_parse_skips_article_without_isin(scraper):
    html = scraper.fetch()
    products = scraper.parse(html)
    names = [p.name for p in products]
    assert not any("website" in n.lower() for n in names)


def test_run_end_to_end_returns_valid_products(scraper):
    result = scraper.run()
    assert result.ok
    assert len(result.products) == 2
    assert all(p.is_valid() for p in result.products)
