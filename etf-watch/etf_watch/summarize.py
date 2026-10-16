"""Turn a newly-detected ETFProduct into a tweet-ready summary."""

from __future__ import annotations

from .models import ETFProduct

TWEET_MAX_LEN = 280

ASSET_CLASS_LABELS = {
    "equity": "Actions",
    "fixed_income": "Obligataire",
    "commodity": "Matières premières",
    "multi_asset": "Multi-actifs",
    "money_market": "Monétaire",
    "crypto": "Crypto",
}


def _render(product: ETFProduct, name: str) -> str:
    asset_class = ASSET_CLASS_LABELS.get(product.asset_class or "", product.asset_class)
    parts = [f"🆕 Nouvel ETF {product.issuer} : {name}"]
    details = []
    if product.ticker:
        details.append(f"Ticker {product.ticker}")
    details.append(f"ISIN {product.isin}")
    if product.index:
        details.append(f"réplique {product.index}")
    if product.ter:
        details.append(f"TER {product.ter}")
    if asset_class:
        details.append(str(asset_class))
    if product.launch_date:
        details.append(f"lancé le {product.launch_date}")
    parts.append(" | ".join(details))
    if product.source_url:
        parts.append(product.source_url)
    return "\n".join(parts)


def build_tweet(product: ETFProduct) -> str:
    tweet = _render(product, product.name)
    if len(tweet) <= TWEET_MAX_LEN:
        return tweet

    # Only the name is variable-length enough to blow the budget; shrink
    # it by exactly the overflow (plus the ellipsis char) and re-render.
    fixed_len = len(tweet) - len(product.name)
    max_name_len = max(0, TWEET_MAX_LEN - fixed_len - 1)
    truncated_name = product.name[:max_name_len] + "…"
    return _render(product, truncated_name)


def build_digest(products: list[ETFProduct]) -> str:
    """A longer-form summary of all new launches in one run, for logs/console."""
    if not products:
        return "Aucun nouveau lancement d'ETF détecté lors de cette exécution."

    lines = [f"{len(products)} nouveau(x) lancement(s) d'ETF détecté(s) :\n"]
    for product in products:
        lines.append(build_tweet(product))
        lines.append("-" * 40)
    return "\n".join(lines)
