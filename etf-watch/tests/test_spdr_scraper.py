from etf_watch.scrapers import spdr


def test_parse_tables_extracts_products(monkeypatch):
    fake_table = [
        ["Fund Name", "Ticker", "ISIN"],
        ["SPDR S&P 500 UCITS ETF", "SPY5", "IE00B6YX5C33"],
        ["SPDR MSCI World UCITS ETF", "SPPW", "IE00BFY0GT14"],
        ["", "", "not-an-isin"],  # malformed row should be skipped
    ]
    monkeypatch.setattr(spdr, "extract_pdf_tables", lambda pdf_bytes: [fake_table])

    s = spdr.SPDRScraper()
    products = s.parse(b"fake-pdf-bytes")

    isins = {p.isin for p in products}
    assert isins == {"IE00B6YX5C33", "IE00BFY0GT14"}
    by_isin = {p.isin: p for p in products}
    assert by_isin["IE00B6YX5C33"].ticker == "SPY5"
    assert by_isin["IE00B6YX5C33"].name == "SPDR S&P 500 UCITS ETF"


def test_parse_falls_back_to_text_when_no_tables(monkeypatch):
    monkeypatch.setattr(spdr, "extract_pdf_tables", lambda pdf_bytes: [])
    monkeypatch.setattr(
        spdr, "extract_pdf_text",
        lambda pdf_bytes: "SPDR MSCI Europe UCITS ETF IE00BKWQ0DQ4 detailed elsewhere",
    )

    s = spdr.SPDRScraper()
    products = s.parse(b"fake-pdf-bytes")

    assert len(products) == 1
    assert products[0].isin == "IE00BKWQ0DQ4"


def test_parse_returns_empty_when_nothing_found(monkeypatch):
    monkeypatch.setattr(spdr, "extract_pdf_tables", lambda pdf_bytes: [])
    monkeypatch.setattr(spdr, "extract_pdf_text", lambda pdf_bytes: None)

    s = spdr.SPDRScraper()
    assert s.parse(b"fake-pdf-bytes") == []
