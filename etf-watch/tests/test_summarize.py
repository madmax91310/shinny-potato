from etf_watch.models import ETFProduct
from etf_watch.summarize import TWEET_MAX_LEN, build_digest, build_tweet


def make_product(**overrides):
    defaults = dict(
        isin="FR0014017NX3", name="Amundi PEA Global MSCI ACWI",
        issuer="Amundi", source_name="amundi",
        source_url="https://www.amundietf.fr/fr/actus/lancement-gpea",
        ticker="GPEA", index="MSCI ACWI", ter="0.18%",
        asset_class="equity", launch_date="15 juillet 2026",
    )
    defaults.update(overrides)
    return ETFProduct(**defaults)


def test_build_tweet_contains_key_fields():
    tweet = build_tweet(make_product())
    assert "Amundi" in tweet
    assert "FR0014017NX3" in tweet
    assert "GPEA" in tweet
    assert "0.18%" in tweet
    assert "MSCI ACWI" in tweet
    assert tweet.count("\n") >= 2


def test_build_tweet_under_max_length():
    long_name = "A" * 400
    tweet = build_tweet(make_product(name=long_name))
    assert len(tweet) <= TWEET_MAX_LEN


def test_build_tweet_handles_missing_optional_fields():
    product = make_product(ticker=None, index=None, ter=None, launch_date=None, asset_class=None)
    tweet = build_tweet(product)
    assert "FR0014017NX3" in tweet


def test_build_digest_empty():
    digest = build_digest([])
    assert "Aucun nouveau" in digest


def test_build_digest_multiple():
    digest = build_digest([make_product(), make_product(isin="LU1234567890", name="Other ETF")])
    assert digest.count("ISIN") == 2
