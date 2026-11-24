"""Qualify the Bitwise issuer calendar against the exact HANetf workbook."""
import datetime as dt
import hashlib
import math
import re

from collect_product_calendars import bitwise_calendar
from collect_public_issuer import Page
from issuer_nav_history import calendar_checks, dated, positive, xlsx_rows

PRODUCT_URL = 'https://bitwiseinvestments.eu/products/bitwise-physical-bitcoin-etp/'
WORKBOOK_URL = 'https://hanetf.com/wp-content/assets/upload/NAV_history-BTCE-DE000A27Z304-all-all.xlsx'
EXCEL_EPOCH = dt.date(1899, 12, 30)
HEADER = {'A': 'Date', 'B': 'NAV', 'C': 'AuM', 'D': 'Shares Outstanding',
          'E': 'Entitlement Per Security'}


def workbook(body, now, start):
    rows = xlsx_rows(body)
    for field, expected in {'Fund Name:': 'Bitwise Physical Bitcoin ETP',
                            'Ticker:': 'BTCE', 'ISIN:': 'DE000A27Z304'}.items():
        if [row.get('B') for row in rows[:3] if row.get('A') == field] != [expected]:
            raise ValueError('Wrong Bitwise workbook identity: ' + field)
    if len(rows) < 6 or rows[3] != HEADER:
        raise ValueError('Bitwise workbook columns changed')

    values, units, disagreements = [], {}, []
    first = dt.date.fromisoformat(start + '-01')
    for row in rows[4:]:
        if not any(row.values()):
            continue
        if set(row) != set(HEADER) or not re.fullmatch(r'\d{5}', row['A']):
            raise ValueError('Bitwise workbook date or column missing')
        date = EXCEL_EPOCH + dt.timedelta(days=int(row['A']))
        if date < first:
            continue
        day = date.isoformat()
        value = positive(row['B'])
        shares, entitlement = positive(row['D']), positive(row['E'])
        if not shares.is_integer() or entitlement >= 1:
            raise ValueError('Invalid Bitwise share or entitlement units')
        aum = float(row['C'])
        if not math.isfinite(aum) or aum < 0:
            raise ValueError('Invalid Bitwise workbook AUM')
        values.append((day, value))
        if aum:
            units[day] = {'nav': value, 'aumPerSecurity': aum / shares}
            if not math.isclose(aum / shares, value, rel_tol=5e-5):
                disagreements.append(day)
    return dated(values, now), units, disagreements


def qualify(source, now, document):
    if (source['isin'], source['navCurrency'], source['sourceUrl'], source['workbookUrl']) != (
            'DE000A27Z304', 'USD', PRODUCT_URL, WORKBOOK_URL):
        raise ValueError('Unqualified Bitwise exact USD NAV route')
    page_body = document(PRODUCT_URL)
    page = Page(page_body.decode('utf-8'))
    text = '\n'.join(page.tokens)
    if not {'DE000A27Z304', 'BTCE'} <= set(page.tokens) or 'Price Reference Currency\nUSD' not in text:
        raise ValueError('Bitwise issuer identity or currency changed')
    result = bitwise_calendar(page, {**source, 'currency': 'USD'}, now, hashlib.sha256(page_body).hexdigest())
    nav, units, disagreements = workbook(document(WORKBOOK_URL), now, source['periodStart'])
    checks = calendar_checks(nav, result['years'], 2, now)
    proof = next((check for check in checks if check['year'] == 2021), None)
    if not proof or any(proof[bound] not in units or proof[bound] in disagreements for bound in ('start', 'end')):
        raise ValueError('Bitwise exact 2021 calendar or NAV/share bounds missing')
    return nav, result['years'], {
        'controlledInstrument': source['isin'],
        'controlledFields': ['ISIN', 'ticker', 'USD NAV', 'issuer NAV calendar', 'entitlement per security',
                             'shares outstanding', 'AUM per security'],
        'requestedStart': source['periodStart'] + '-01',
        'controlledCalendarYears': sorted(result['years']),
        'officialCalendarSource': PRODUCT_URL,
        'sourceNavUrl': WORKBOOK_URL,
        'officialIncomeReinvestedChartChecks': checks,
        # AUM and shares lack a same-valuation-time guarantee in this export.
        # Disagreements are retained, and never used to replace the NAV column.
        'nonComparableAumPerSecurityDays': disagreements,
        'periodUnitChecks': {proof[key]: units[proof[key]] for key in ('start', 'end')},
        'incomeTreatment': 'Exact issuer USD NAV including product fees, no extra fee or distribution adjustment',
    }
