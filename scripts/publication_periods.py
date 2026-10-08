"""Validate published annual periods without inventing the next calendar year's data."""
import re
import urllib.parse


def completed_year(years, today, count=None):
    years = list(years)
    if (not years or any(type(y) is not int for y in years)
            or len(set(years)) != len(years) or (count is not None and len(years) != count)):
        raise ValueError('Missing/duplicate annual publication periods')
    ordered = sorted(years)
    if ordered != list(range(ordered[0], ordered[-1] + 1)):
        raise ValueError('Non-consecutive annual publication periods')
    year = ordered[-1]
    # Annual reports are normally published during the first half of the year.
    # Older data is allowed only in that explicit window, and never redated.
    oldest = today.year - (2 if today.month <= 6 else 1)
    if not oldest <= year < today.year:
        raise ValueError('Incomplete or overdue annual publication')
    return year


def latest_annual(urls, pattern, today):
    """Pick the latest linked completed exercise, not a guessed future filename."""
    candidates = []
    for url in urls:
        match = re.search(pattern, urllib.parse.unquote(url), re.I)
        if match and int(match['year']) < today.year:
            candidates.append((int(match['year']), url))
    if not candidates:
        raise ValueError('Missing official completed annual report')
    year = max(y for y, _ in candidates)
    completed_year([year], today)
    links = sorted(set(url for y, url in candidates if y == year))
    if len(links) != 1:
        raise ValueError('Ambiguous latest annual report')
    return links[0], year


def annual_status(year, today):
    completed_year([year], today)
    return {'latestPublishedYear': year, 'expectedYear': today.year - 1,
            'awaitingPublication': year < today.year - 1}
