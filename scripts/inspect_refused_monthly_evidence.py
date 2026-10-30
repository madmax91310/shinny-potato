"""Replay dated issuer evidence for the nine refused windows. Never admit or patch a series.

Usage: python scripts/inspect_refused_monthly_evidence.py --output /tmp/replay.json
All inputs are immutable captures, not fresh supplier controls. No application registry
is written; successful HTTP acquisition is deliberately separate from qualification.
"""
import argparse
import datetime as dt
import gzip
import hashlib
import json
import math
import re
from pathlib import Path
from bs4 import BeautifulSoup
from issuer_nav_history import blackrock_nav
from blackrock_income_history import qualify

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'reports/refused-monthly-2026-10-30'
ISIN = 'IE00B4K6B022'


def hsbc_notice(body, isin=ISIN):
    """Read the exact security's table; never borrow dates/currency from its neighbours."""
    soup = BeautifulSoup(body, 'html.parser')
    candidates = []
    for table in soup.find_all('table'):
        if table.find('table') is not None:
            continue
        pairs = [[c.get_text(' ', strip=True) for c in row.find_all(['td', 'th'], recursive=False)]
                 for row in table.find_all('tr')]
        if not any(p == ['ISIN(s)', isin] for p in pairs):
            continue
        facts = {}
        for pair in pairs:
            if len(pair) != 2 or pair[0] in facts:
                raise ValueError('Ambiguous exact-security notice table')
            facts[pair[0]] = pair[1]
        candidates.append(facts)
    if len(candidates) != 1:
        raise ValueError('Missing or duplicate exact HSBC security')
    facts = candidates[0]
    if facts.get('Issuer/Company Name') != 'HSBC ETFs plc':
        raise ValueError('Wrong dividend issuer')
    match = re.fullmatch(r'([0-9]+\.[0-9]+) EUR', facts.get('Dividend Amount (Gross) and Currency', ''))
    if not match or not math.isfinite(float(match[1])) or float(match[1]) <= 0:
        raise ValueError('Unqualified dividend amount/currency')
    def day(key):
        return dt.datetime.strptime(facts[key], '%d/%m/%Y').date().isoformat()
    ex, record, pay = (day(k) for k in ['Ex-Date', 'Record Date', 'Pay Date'])
    if not ex < record <= pay:
        raise ValueError('Unqualified dividend date order')
    return dict(isin=isin, exDate=ex, recordDate=record, paymentDate=pay,
                amount=float(match[1]), currency='EUR', quoteCurrencyInferred=False,
                note='Dividend currency is EUR even when the notice lists a GBX trading line')


def replay(folder=EVIDENCE):
    manifest = json.loads((folder / 'sources.json').read_text())
    bodies = {}
    for source in manifest:
        raw = gzip.decompress((folder / 'sources' / source['file']).read_bytes())
        if hashlib.sha256(raw).hexdigest() != source['sha256']:
            raise ValueError('Evidence hash changed: ' + source['file'])
        bodies[source['id']] = raw
    now = dt.datetime(2026, 10, 30, 23, 59, tzinfo=dt.timezone.utc)
    cash = [hsbc_notice(bodies[name]) for name in ['hsbc-february', 'hsbc-august']]
    amundi = []
    for product in json.loads(bodies['amundi'])['products']:
        facts = product['characteristics']
        if product['productId'] != facts['ISIN'] or facts['CURRENCY'] != 'EUR':
            raise ValueError('Amundi exact share/currency changed')
        histories = {h['indicator']: h['historicalData'] for h in product['historics']}
        amundi.append(dict(isin=facts['ISIN'], incomePolicy=facts['DISTRIBUTION_POLICY'],
                           observations={k: None if v is None else len(v) for k, v in histories.items()},
                           zeroDistributionsProven=False, admitted=False))
    isin = 'DE000A0H08P6'
    body = json.loads(bodies['blackrock'])
    parsed = blackrock_nav(body, isin, 'EUR', now)
    config = dict(isin=isin, navCurrency='EUR', periodStart='2015-01',
                  navHistoryKind='official-income-reinvested-index', distributionValidationYears=[2019])
    try:
        qualify(body, parsed, config, now)
        failure = None
    except ValueError as error:
        failure = str(error)
    table = body['componentsByNameMap']['performance']['containersByNameMap']['distributions']['subContainersByNameMap']['table']['dataPointsByNameMap']
    nav, total = parsed['nav'], parsed['totalReturn']
    checks = []
    for date, amount in zip(table['exDate']['value'], table['totalDistribution']['value']):
        if not str(date).startswith('2019'):
            continue
        day = dt.datetime.strptime(str(date), '%Y%m%d').date().isoformat()
        previous = max(d for d in nav.keys() & total.keys() if d < day)
        after = min(d for d in nav.keys() & total.keys() if d >= day)
        observed = (total[after] / nav[after]) / (total[previous] / nav[previous])
        expected = 1 / (1 - float(amount) / nav[previous])
        checks.append(dict(exDate=day, amount=amount, observed=observed, expected=expected,
                           difference=observed-expected,
                           passed=math.isclose(observed, expected, rel_tol=1e-6, abs_tol=1e-8)))
    bitwise = json.loads(bodies['bitwise'])
    return dict(captureDate='2026-10-30', replayIsFreshSourceControl=False,
                additionalQualifiedWindows=0, qualificationCriteriaChanged=False,
                hsbc=dict(officialExDates=cash, contradictionWithEuronextClosed=False,
                          monthlyWindowRestored=False, providerPricesModified=False),
                amundi=amundi, blackrock=dict(refusal=failure, cashChecks=checks),
                bitwise=dict(publishedTimestamp=bitwise['dateiso'], dailyHistoryQualified=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = replay()
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(additionalQualifiedWindows=0, output=str(args.output))))
