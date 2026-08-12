"""Entry point for the daily market tweet job: fetch, generate, publish."""

from __future__ import annotations

from .market_data import fetch_all_quotes
from .news import fetch_top_headlines
from .poster import post_tweet
from .tweet_generator import generate_tweet


def main() -> None:
    quotes = fetch_all_quotes()
    headlines = fetch_top_headlines()
    tweet = generate_tweet(quotes, headlines)
    print(tweet)
    post_tweet(tweet)


if __name__ == "__main__":
    main()
