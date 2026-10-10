from etf_watch.text_extract import (
    find_isin,
    find_launch_date,
    find_ter,
    find_ticker,
    guess_asset_class,
    looks_like_launch,
)


def test_find_isin():
    text = "Amundi PEA Global MSCI ACWI (ticker GPEA, ISIN FR0014017NX3) launched today."
    assert find_isin(text) == "FR0014017NX3"


def test_find_isin_none():
    assert find_isin("No fund identifier in this sentence.") is None


def test_find_ter_keyword_anchored():
    text = "The fund has a total expense ratio (TER) of 0.12% per annum."
    assert find_ter(text) == "0.12%"


def test_find_ter_french_frais_courants():
    text = "Les frais courants s'élèvent à 0,25% par an."
    assert find_ter(text) == "0.25%"


def test_find_ter_loose_fallback():
    text = "The fund charges 0.09% annually, among the cheapest in its category."
    assert find_ter(text) == "0.09%"


def test_find_ticker():
    text = "The ETF will trade under the ticker: VWCE on Xetra."
    assert find_ticker(text) == "VWCE"


def test_find_launch_date_english():
    text = "The ETF was launched on 15 July 2026 on the London Stock Exchange."
    assert find_launch_date(text) == "15 July 2026"


def test_find_launch_date_french():
    text = "Le fonds a été coté le 3 mars 2026 sur Euronext Paris."
    assert find_launch_date(text) == "3 mars 2026"


def test_find_launch_date_iso():
    text = "Launch date: 2026-03-15."
    assert find_launch_date(text) == "2026-03-15"


def test_guess_asset_class_equity():
    assert guess_asset_class("A new global equity ETF tracking the MSCI World index.") == "equity"


def test_guess_asset_class_fixed_income():
    assert guess_asset_class("Un nouvel ETF obligataire investi en obligations d'Etat.") == "fixed_income"


def test_guess_asset_class_none():
    assert guess_asset_class("A completely unrelated sentence about weather.") is None


def test_looks_like_launch_true():
    assert looks_like_launch("BNP Paribas launches new ETF", ["launch", "launches"])


def test_looks_like_launch_false():
    assert not looks_like_launch("Quarterly market commentary", ["launch", "launches"])
