"""Completed-year EUR/USD rates from the official ECB daily reference series."""
import argparse
import calendar
import datetime as dt
import json
import math
import pathlib
import xml.etree.ElementTree as ET
from data_automation import UTC, reject, write_json_atomic
from issuer_documents import download, proof

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml'


def easter_sunday(year):
    """Gregorian Easter (Meeus/Jones/Butcher)."""
    century, year_in_century = divmod(year, 100)
    leap_centuries, remaining_centuries = divmod(century, 4)
    correction = (century + 8) // 25
    epact = (19 * (year % 19) + century - leap_centuries
             - (century - correction + 1) // 3 + 15) % 30
    leap_years, remaining_years = divmod(year_in_century, 4)
    weekday = (32 + 2 * remaining_centuries + 2 * leap_years - epact - remaining_years) % 7
    day = epact + weekday - 7 * ((year % 19 + 11 * epact + 22 * weekday) // 451) + 114
    month, day_in_month = divmod(day, 31)
    return dt.date(year, month, day_in_month + 1)


def month_end_reference_date(year, month):
    """Last TARGET working day; official December exceptions are kept."""
    day = dt.date(year, month, calendar.monthrange(year, month)[1])
    closed = {dt.date(year, 1, 1), dt.date(year, 5, 1),
              dt.date(year, 12, 25), dt.date(year, 12, 26)}
    if month in (3, 4):
        easter = easter_sunday(year)
        closed.update((easter - dt.timedelta(days=2), easter + dt.timedelta(days=1)))
    if year in (1999, 2001):
        closed.add(dt.date(year, 12, 31))
    while day.weekday() >= 5 or day in closed:
        day -= dt.timedelta(days=1)
    return day.isoformat()


def year_end_reference_date(year):
    return month_end_reference_date(year, 12)


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
