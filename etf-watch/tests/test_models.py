from etf_watch.models import ETFProduct


def test_valid_product():
    p = ETFProduct(
        isin="FR0014017NX3", name="Amundi PEA Global MSCI ACWI",
        issuer="Amundi", source_name="amundi", source_url="https://example.com",
    )
    assert p.is_valid()


def test_invalid_isin_rejected():
    p = ETFProduct(
        isin="NOTANISIN", name="Some ETF",
        issuer="Amundi", source_name="amundi", source_url="https://example.com",
    )
    assert not p.is_valid()


def test_missing_name_rejected():
    p = ETFProduct(
        isin="FR0014017NX3", name="",
        issuer="Amundi", source_name="amundi", source_url="https://example.com",
    )
    assert not p.is_valid()


def test_to_row_contains_expected_keys():
    p = ETFProduct(
        isin="FR0014017NX3", name="Amundi PEA Global MSCI ACWI",
        issuer="Amundi", source_name="amundi", source_url="https://example.com",
        ticker="GPEA", ter="0.18%",
    )
    row = p.to_row()
    assert row["isin"] == "FR0014017NX3"
    assert row["ticker"] == "GPEA"
    assert row["ter"] == "0.18%"
    assert "index_tracked" in row
