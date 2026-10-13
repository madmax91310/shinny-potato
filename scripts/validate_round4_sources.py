"""Recheck official identity and exact trading currency for history-only additions."""
import datetime as dt
import json
from pathlib import Path
from collect_etf_pilot import product_data_url
from collect_public_issuer import Page, only
from data_automation import get_text, UTC, reject
from issuer_documents import public_page, document_date

ROOT = Path(__file__).resolve().parents[1]

def validate():
    configs = json.loads((ROOT / 'scripts/monthly-automation.json').read_text())['series']
    silver = next(c for c in configs if c['id'] == 'etcSilverPhysical')
    url = product_data_url({'productId':258443}).replace('exposureBreakdowns', 'exposureBreakdowns%2Clistings')
    body = json.loads(get_text(url, ('application/json',), 10_000_000))
    components = body['componentsByNameMap']
    facts = components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value'] != silver['isin'] or facts['assetClass']['value'] != 'Commodity':
        reject('Wrong physical silver ETC')
    points = components['listings']['containersByNameMap']['default']['dataPointsByNameMap']
    keys = ['exchange','ticker','currencyCode','ric']
    rows = list(zip(*(points[k]['value'] for k in keys)))
    if ('London Stock Exchange', silver['ticker'], silver['currency'], silver['symbol']) not in rows:
        reject('Physical silver listing changed')
    miners = next(c for c in configs if c['id'] == 'etfSilverMiners')
    page = Page(public_page(miners['sourceUrl']))
    tokens = '\n'.join(page.tokens)
    if f'Primary ISIN\n{miners["isin"]}\n' not in tokens or f'USD Accumulating\n(ISIN:\n{miners["isin"]}\n)' not in tokens:
        reject('Wrong silver miners share or income policy')
    if 'Physical - Full Replication - Passively Managed Index Tracking' not in tokens:
        reject('Silver miners replication changed')
    stamp = tokens.split('Key Information\nAs of ',1)[1].splitlines()[0]
    document_date(stamp, dt.datetime.now(UTC))
    table = only([t for t in page.tables if t['rows'] and t['rows'][0][:4] == ['Exchange','Trading Currency','Ticker','Listing Date'] and any(r[:3] == ['London Stock Exchange','USD','SILV LN'] for r in t['rows'])], 'USD silver miners listing')
    if not table or miners['symbol'] != 'SILV.L' or miners['mic'] != 'XLON':
        reject('Silver miners history differs from official listing')
    print('Official silver ETC and accumulating silver-miners share/listings validated.')

if __name__ == '__main__':
    validate()
