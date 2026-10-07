"""Exact-index economic exposures for qualified synthetic shares, with separate provenance."""
import json
import pathlib
from data_automation import reject
from issuer_documents import download, pdf_text, proof, validated_rows
from collect_index_documents import msci_composition, SECTOR_LABELS, COUNTRY_LABELS
from collect_index_extensions import collect_amundi_composition

CONFIG = pathlib.Path(__file__).with_name('index-automation.json')
QUALIFIED = {
    'IE0002XZSHO1': ('world', 'MSCI World Index'),
    'IE000DQLYVB9': ('sp500-pea', 'S&P 500 Net TR Index'),
    'FR0011550185': ('sp500-pea', 'S&P 500 Composite (NR)'),
}


def collect_one(share, now, benchmark, fetch=download):
    identity = QUALIFIED.get(share['isin'])
    if not identity or benchmark != identity[1]:
        reject('Unqualified or changed synthetic-share benchmark')
    config = next(c for c in json.loads(CONFIG.read_text())['indices'] if c['id'] == identity[0])
    if config['id'] == 'world':
        body = fetch(config['sourceUrl'])
        facts = msci_composition(pdf_text(body), config, now)
        source = {'url': config['sourceUrl'], 'sha256': proof(body)}
    else:
        facts = collect_amundi_composition(config, now, fetch)
        source = facts['source']
    if facts['index'] != config['name']:
        reject('Wrong tracked-index composition identity')
    # MSCI parsers return presentation labels; restore the published names before
    # the ETF adapter translates them. Amundi already returns raw French names.
    translations = {'sectors': {v: k for k, v in SECTOR_LABELS.items()},
                    'countries': {v: k for k, v in COUNTRY_LABELS.items()}}
    result = {}
    for field in ('countries', 'sectors', 'holdings'):
        rows = [{'name': translations.get(field, {}).get(n, n), 'weightPct': w} for n, w in facts[field]]
        result[field] = {'asOf': facts['asOf'], 'basis': 'index',
            'sourceUrl': source['url'], 'sha256': source['sha256'],
            'index': config['name'], 'indexId': config['id'],
            'method': 'Published composition of the exact tracked index; economic equity exposure, not the fund swap basket; index returns are not used as share returns',
            'rows': validated_rows(rows, complete=field != 'holdings')}
    return result
