"""Capture a published year-end NAV YTD without relabelling rolling returns."""
import datetime as dt
from data_automation import reject
from issuer_documents import bounded_return


def capture_year_end(performance, launch, now):
    stamp = dt.date.fromisoformat(performance['asOf'])
    today = now.date() if isinstance(now, dt.datetime) else now
    if stamp > today:
        reject('Future NAV observation')
    if (stamp.month, stamp.day) != (12, 31) or stamp.year >= today.year:
        return
    if dt.date.fromisoformat(launch) > dt.date(stamp.year, 1, 1):
        return  # A launch-year YTD is not a complete year.
    rows = performance.get('observations', [])
    ytd = [r for r in rows if r['label'] == 'Depuis janvier' and r['asOf'] == stamp.isoformat()]
    if len(ytd) != 1:
        reject('Missing or ambiguous year-end NAV YTD')
    value = bounded_return(ytd[0]['value'])
    annual = [r for r in rows if r['label'] == '1 an' and r['asOf'] == stamp.isoformat()]
    if len(annual) > 1 or annual and abs(bounded_return(annual[0]['value']) - value) > .05:
        reject('Year-end NAV YTD and one-year returns disagree')
    year = str(stamp.year)
    performance['years'][year] = value
    performance['yearEvidence'] = {year: {
        'asOf': stamp.isoformat(), 'sourceUrl': performance['sourceUrl'],
        'sha256': performance['sha256'], 'method': 'Published exact-share NAV YTD at 31 December'}}
