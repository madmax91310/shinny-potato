"""Fetch the day's top financial headlines to give the tweet real context."""

from __future__ import annotations

from dataclasses import dataclass

import feedparser

FEED_URLS = [
    "https://www.boursorama.com/rss/actualites/",
    "https://www.lesechos.fr/finance-marches/rss",
]


@dataclass
class Headline:
    title: str
    link: str
    source: str


def fetch_top_headlines(limit: int = 3) -> list[Headline]:
    headlines: list[Headline] = []
    for url in FEED_URLS:
        feed = feedparser.parse(url)
        source = feed.feed.get("title", url)
        for entry in feed.entries:
            headlines.append(Headline(title=entry.title, link=entry.link, source=source))
            if len(headlines) >= limit:
                return headlines
    return headlines
