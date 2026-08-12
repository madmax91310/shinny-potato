"""Post the generated tweet to X, if credentials are configured."""

from __future__ import annotations

import os

REQUIRED_ENV_VARS = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"]


def post_tweet(text: str) -> None:
    if not all(os.environ.get(name) for name in REQUIRED_ENV_VARS):
        print("[info] Identifiants X absents : tweet généré mais non publié.")
        return

    import tweepy

    client = tweepy.Client(
        consumer_key=os.environ["X_API_KEY"],
        consumer_secret=os.environ["X_API_SECRET"],
        access_token=os.environ["X_ACCESS_TOKEN"],
        access_token_secret=os.environ["X_ACCESS_SECRET"],
    )

    parts = [part.strip() for part in text.split("\n---\n") if part.strip()]

    previous_id = None
    for part in parts:
        response = client.create_tweet(text=part, in_reply_to_tweet_id=previous_id)
        previous_id = response.data["id"]
