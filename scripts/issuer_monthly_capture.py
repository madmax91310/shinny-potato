"""Archive exact-share month-end NAV returns without interpolating missing months."""
import calendar
import datetime as dt
import math
import re
from data_automation import reject


def merge_monthly_returns(previous, incoming, checked):
    months = dict(previous.get('months', {}))
    evidence = dict(previous.get('monthEvidence', {}))
    today = dt.date.fromisoformat(checked)
    for row in incoming.get('observations', []):
        if row.get('label') != '1 mois':
            continue
        stamp = dt.date.fromisoformat(row['asOf'])
        # A rolling month at an arbitrary date is not a calendar month.
        if stamp.day != calendar.monthrange(stamp.year, stamp.month)[1] or stamp.strftime('%Y-%m') >= checked[:7]:
            continue
        if stamp > today:
            reject('Future monthly NAV observation')
        value = row.get('value')
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not -100 < value < 1000:
            reject('Invalid monthly NAV return')
        if not incoming.get('sourceUrl') or not re.fullmatch(r'[a-f0-9]{64}', incoming.get('sha256', '')):
            reject('Missing monthly NAV source proof')
        month = stamp.strftime('%Y-%m')
        if month in months and abs(months[month] - value) >= 1:
            reject('Monthly NAV correction >= 1 point; review required')
        months[month] = value
        evidence[month] = dict(asOf=stamp.isoformat(), sourceUrl=incoming['sourceUrl'], sha256=incoming['sha256'], checkedAt=checked,
                              method='Published exact-share one-month NAV total return at calendar month end')
    return dict(months=dict(sorted(months.items())), monthEvidence=evidence) if months else {}
