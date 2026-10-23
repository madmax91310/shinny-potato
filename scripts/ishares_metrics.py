"""Dated optional portfolio metrics from the official iShares component.

A missing component is not a zero, and a top-ten table is never a holdings count.
"""
import datetime as dt
import math

FIELDS = [
    ('numHoldings', 'Nombre de positions hors liquidités et dérivés', 'positions', 1, 100000),
    ('modelOad', 'Duration effective', 'ans', 0, 100),
]


def parse_metrics(components, now, source_url):
    points = components.get('fundamentalsAndRisk', {}).get('containersByNameMap', {}).get('default', {}).get('dataPointsByNameMap', {})
    metrics = {}
    for key, label, unit, low, high in FIELDS:
        point = points.get(key, {})
        value = point.get('value')
        if value is None:
            continue
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high or (key == 'numHoldings' and int(value) != value):
            raise ValueError('Invalid issuer metric: ' + key)
        stamp = dt.datetime.strptime(str(point.get('asOfDate')), '%Y%m%d').date()
        if not 0 <= (now.date() - stamp).days <= 45:
            raise ValueError('Missing, future or stale issuer metric date: ' + key)
        metrics[key] = {'value': value, 'label': label, 'unit': unit, 'asOf': stamp.isoformat(),
                        'checkedAt': now.date().isoformat(), 'sourceUrl': source_url,
                        'scope': 'Fund portfolio', 'method': point.get('infoBubble', '')}
    return metrics
