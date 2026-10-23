"""Exact Federal Reserve H.10 daily TWD/USD, the primary source of FRED DEXTAUS."""
import csv
import datetime as dt
import io
import math
from urllib.parse import urlencode

DISCOVERY = 'https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H10'
PACKAGE = '60f32914ab61dfab590e0e470153e3ae'
SERIES = 'H10/H10/RXI_N.B.TA'


def source_url(now):
    # Daily-rates package linked in the official Data Download Program.
    return 'https://www.federalreserve.gov/datadownload/Output.aspx?' + urlencode({
        'rel':'H10','series':PACKAGE,'lastobs':'','from':'01/01/1999',
        'to':now.strftime('%m/%d/%Y'),'filetype':'csv','label':'include',
        'layout':'seriescolumn','type':'package'})


def parse(body, now):
    rows=list(csv.reader(io.StringIO(body.decode('utf-8-sig'))))
    if len(rows)<8 or [r[0].strip() for r in rows[:6]] != [
            'Series Description','Unit:','Multiplier:','Currency:','Unique Identifier:','Time Period']:
        raise ValueError('Wrong H.10 daily-rates export')
    if len({len(r) for r in rows}) != 1 or rows[4].count(SERIES)!=1:
        raise ValueError('Truncated or ambiguous H.10 series')
    col=rows[4].index(SERIES)
    if [rows[i][col] for i in range(6)] != [
            'Taiwanese N.T. Dollar','Currency','1','TWD',SERIES,'RXI_N.B.TA']:
        raise ValueError('Wrong H.10 TWD currency, multiplier or daily buying-rate identity')
    values={};seen=set()
    for row in rows[6:]:
        day=dt.date.fromisoformat(row[0])
        if day in seen or day>now.date():raise ValueError('Duplicate or future H.10 date')
        seen.add(day)
        if row[col] in ('ND',''):continue
        rate=float(row[col])
        if not math.isfinite(rate) or not 0<rate<1000:raise ValueError('Invalid H.10 TWD rate')
        values[day]=rate
    if not values:raise ValueError('Empty H.10 daily TWD history')
    return values
