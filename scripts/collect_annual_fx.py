"""Completed-year EUR/USD rates from the official ECB daily reference series."""
import argparse
import datetime as dt
import json
import math
import pathlib
import xml.etree.ElementTree as ET
from data_automation import UTC, reject, write_json_atomic
from issuer_documents import download, proof

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml'


def year_end_reference_date(year):
    """Last December TARGET working day, not merely a recent December rate.

    ECB reference rates exclude TARGET closing days. December 31 was also
    exceptionally closed in 1999 and 2001 (see the archived ECB decisions in
    fixtures/ecb-year-end/README.md). Easter/May/January cannot affect this
    backwards December-only search; no generic market calendar is inferred.
    """
    day = dt.date(year, 12, 31)
    while (day.weekday() >= 5 or day.day in (25, 26)
           or (year in (1999, 2001) and day.day == 31)):
        day -= dt.timedelta(days=1)
    return day.isoformat()


def parse(body, now):
    root = ET.fromstring(body)
    if root.tag != '{http://www.gesmes.org/xml/2002-08-01}Envelope':
        reject('Wrong ECB reference document')
    ns = '{http://www.ecb.int/vocabulary/2002-08-01/eurofxref}'
    observed = {}
    seen = set()
    for cube in root.iter(ns + 'Cube'):
        if 'time' not in cube.attrib:
            continue
        date = dt.date.fromisoformat(cube.attrib['time'])
        if date in seen or date > now.date():
            reject('Duplicate or future ECB daily date')
        seen.add(date)
        rates = [row for row in cube if row.attrib.get('currency') == 'USD']
        if len(rates) != 1:
            reject('Missing or ambiguous ECB USD observation')
        value = float(rates[0].attrib['rate'])
        if not math.isfinite(value) or not 0 < value < 10:
            reject('Invalid ECB USD per EUR rate')
        if date.year >= 1999 and date.year < now.year and date.month == 12:
            key = str(date.year)
            if key not in observed or date.isoformat() > observed[key]['asOf']:
                observed[key] = {'value': value, 'asOf': date.isoformat()}
    expected = {str(y) for y in range(1999, now.year)}
    if set(observed) != expected:
        reject('Incomplete completed-year ECB coverage')
    for year, row in observed.items():
        expected_date = year_end_reference_date(int(year))
        if row['asOf'] != expected_date:
            reject(f'ECB final year-end reference missing for {year}: expected {expected_date}, observed {row["asOf"]}')
    return {'currency': 'USD per EUR', 'sourceUrl': SOURCE, 'years': observed,
            'sha256': proof(body)}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--apply', action='store_true')
    args = p.parse_args()
    result = parse(download(SOURCE, max_bytes=12_000_000), dt.datetime.now(UTC))
    path = ROOT / 'src/data/annual-fx.json'
    previous = json.loads(path.read_text()) if path.exists() else {}
    if previous and max(result['years']) < max(previous['years']):
        reject('ECB completed-year history would regress')
    if args.apply and result != previous:
        write_json_atomic(path, result)
    print('ECB year-end rates validated through ' + max(result['years']))


if __name__ == '__main__':
    main()
