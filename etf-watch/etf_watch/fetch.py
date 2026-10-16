"""Polite HTTP fetching: robots.txt check, rate limiting, retries, and an
optional Playwright fallback for JS-rendered pages.

Every function here returns None (and logs) on failure instead of raising,
so one broken source never takes down the whole run.
"""

from __future__ import annotations

import time
import urllib.robotparser
from urllib.parse import urlparse

import requests

from . import config
from .logging_setup import get_logger

logger = get_logger(__name__)

_last_request_at: dict[str, float] = {}
_robots_cache: dict[str, urllib.robotparser.RobotFileParser] = {}


def _host(url: str) -> str:
    return urlparse(url).netloc


def _robots_allows(url: str) -> bool:
    host = _host(url)
    parser = _robots_cache.get(host)
    if parser is None:
        parser = urllib.robotparser.RobotFileParser()
        robots_url = f"{urlparse(url).scheme}://{host}/robots.txt"
        try:
            resp = requests.get(
                robots_url, headers={"User-Agent": config.USER_AGENT}, timeout=10
            )
            if resp.status_code == 200:
                parser.parse(resp.text.splitlines())
            else:
                # No robots.txt / inaccessible: default to allow.
                parser.parse([])
        except requests.RequestException as exc:
            logger.warning("Could not fetch robots.txt for %s (%s); defaulting to allow", host, exc)
            parser.parse([])
        _robots_cache[host] = parser
    try:
        return parser.can_fetch(config.USER_AGENT, url)
    except Exception:
        return True


def _throttle(host: str) -> None:
    last = _last_request_at.get(host)
    if last is not None:
        elapsed = time.monotonic() - last
        wait = config.REQUEST_DELAY_SECONDS - elapsed
        if wait > 0:
            time.sleep(wait)
    _last_request_at[host] = time.monotonic()


def fetch_url(url: str, *, binary: bool = False) -> str | bytes | None:
    """Fetch a URL with requests. Returns text (or bytes if binary=True),
    or None on any failure / robots.txt disallow."""
    if not _robots_allows(url):
        logger.warning("robots.txt disallows fetching %s -- skipping", url)
        return None

    host = _host(url)
    headers = {"User-Agent": config.USER_AGENT, "Accept-Language": "en,fr;q=0.8"}

    for attempt in range(1, config.MAX_RETRIES + 2):
        _throttle(host)
        try:
            resp = requests.get(
                url, headers=headers, timeout=config.REQUEST_TIMEOUT_SECONDS
            )
            if resp.status_code == 200:
                return resp.content if binary else resp.text
            if resp.status_code in (403, 429):
                logger.warning(
                    "%s returned %s (attempt %d/%d) -- possible bot blocking",
                    url, resp.status_code, attempt, config.MAX_RETRIES + 1,
                )
            else:
                logger.warning(
                    "%s returned HTTP %s (attempt %d/%d)",
                    url, resp.status_code, attempt, config.MAX_RETRIES + 1,
                )
        except requests.RequestException as exc:
            logger.warning(
                "Request to %s failed (attempt %d/%d): %s",
                url, attempt, config.MAX_RETRIES + 1, exc,
            )
        if attempt <= config.MAX_RETRIES:
            time.sleep(2 ** attempt)

    logger.error("Giving up on %s after %d attempts", url, config.MAX_RETRIES + 1)
    return None


def fetch_url_js(url: str, *, wait_selector: str | None = None, timeout_ms: int = 20000) -> str | None:
    """Fetch a JS-rendered page via Playwright (optional dependency).

    Returns None if playwright isn't installed, robots.txt disallows the
    URL, or rendering fails for any reason -- never raises.
    """
    if not _robots_allows(url):
        logger.warning("robots.txt disallows fetching %s -- skipping", url)
        return None

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.info(
            "playwright not installed -- skipping JS fallback for %s "
            "(pip install playwright && playwright install chromium)",
            url,
        )
        return None

    host = _host(url)
    _throttle(host)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                page = browser.new_page(user_agent=config.USER_AGENT)
                page.goto(url, timeout=timeout_ms, wait_until="networkidle")
                if wait_selector:
                    page.wait_for_selector(wait_selector, timeout=timeout_ms)
                html = page.content()
                return html
            finally:
                browser.close()
    except Exception as exc:
        logger.warning("Playwright fetch of %s failed: %s", url, exc)
        return None
