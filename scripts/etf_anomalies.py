"""Conservative change checks against the last validated exact-share observation."""
import math


def anomalies(previous, incoming):
    issues = []
    old_performance = previous.get('performance', {})
    performance = incoming.get('performance', {})
    if all(old_performance.get(k) == performance.get(k) for k in ('currency', 'basis', 'method')):
        for year, value in performance.get('years', {}).items():
            old = old_performance.get('years', {}).get(year)
            if old is not None and abs(value - old) >= 1:
                issues.append(f'performance {year}: {old} -> {value} %, correction >= 1 point')
    old, new = previous.get('aum', {}), incoming.get('aum', {})
    if (old.get('amount', 0) > 0 and new.get('amount', 0) > 0
            and all(old.get(k) == new.get(k) for k in ('currency', 'scope'))
            and old.get('asOf') and new.get('asOf') and new['asOf'] >= old['asOf']):
        from datetime import date
        days = (date.fromisoformat(new['asOf']) - date.fromisoformat(old['asOf'])).days
        ratio = new['amount'] / old['amount']
        if days <= 45 and (ratio >= 2 or ratio <= .5):
            issues.append(f'aum: {old["amount"]} -> {new["amount"]} {new["currency"]}, ratio {ratio:.3f} in {days} days')
    for field in ('countries', 'sectors', 'holdings'):
        old, new = previous.get(field, {}), incoming.get(field, {})
        if not old.get('rows') or not new.get('rows'):
            continue
        if (not new.get('asOf') or new['asOf'] < old.get('asOf', '')
                or any(old.get(k) != new.get(k) for k in ('basis', 'classification', 'index'))):
            continue
        def weights(table):
            result = {}
            for row in table['rows']:
                key = row.get('isin') or row['name'].strip().casefold()
                value = row['weightPct']
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                    raise ValueError('Invalid composition weight')
                result[key] = result.get(key, 0) + value
            return result
        a, b = weights(old), weights(new)
        common = a.keys() & b.keys()
        # Compare only matching classifications; translations and label migrations
        # must not look like a portfolio turnover. Top ten is not a full allocation.
        if field == 'holdings':
            delta = max((abs(a[k] - b[k]) for k in common), default=0)
            threshold = 15
        else:
            if not common or sum(abs(a[k]) for k in common) < 90 or sum(abs(b[k]) for k in common) < 90:
                continue
            delta = sum(abs(a.get(k, 0) - b.get(k, 0)) for k in a.keys() | b.keys()) / 2
            threshold = 25
        if delta >= threshold:
            issues.append(f'{field}: weight change {delta:.2f} points >= {threshold} ({old.get("asOf")} -> {new["asOf"]})')
    return issues
