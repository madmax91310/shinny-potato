"""Published BCOM groups, kept separate from equity sectors and swap collateral."""
import math
import re
from data_automation import reject
from issuer_documents import download, pdf_text, document_date, proof

LABELS = {'Energy':'Énergie', 'Grains':'Céréales', 'Precious metals':'Métaux précieux',
          'Industrial metals':'Métaux industriels', 'Softs':'Produits agricoles',
          'Livestock':'Bétail', 'Others':'Autres'}
SOURCE_ISIN = 'IE00BD6FTQ80'
SOURCE_URL = 'https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/IE00BD6FTQ80_factsheet_en.pdf'


def parse_allocation(text, now, digest, source_url=SOURCE_URL):
    if SOURCE_ISIN not in text or not re.search(r'Index Bloomberg ticker\s+BCOMTR\b', text):
        reject('Wrong commodity allocation source share or benchmark')
    if not re.search(r'Index\s+Bloomberg Commodity Index\s', text):
        reject('Wrong exact BCOM identity')
    blocks = text.split('Index composition (%)')
    if len(blocks) != 2 or 'Top exposures (%)' not in blocks[1]:
        reject('Missing or ambiguous index commodity allocation')
    block = blocks[1].split('Top exposures (%)', 1)[0]
    dates = re.findall(r'Source: Invesco, as at (\d+ [A-Za-z]+ \d{4})', block)
    if len(dates) != 1: reject('Missing commodity allocation date')
    stamp = document_date(dates[0], now)
    pattern = r'^\s*\S\s+(' + '|'.join(LABELS) + r')\s+(-?\d+\.\d+)\b'
    pairs = re.findall(pattern, block, re.M)
    if len(pairs) != len(LABELS) or {name for name, _ in pairs} != set(LABELS):
        reject('Missing or duplicate published commodity groups')
    rows = [{'name':name, 'label':LABELS[name], 'weightPct':float(value)} for name, value in pairs]
    # A tiny signed Others weight is published explicitly; preserve it, never
    # clip it or invent a residual to force the rounded table to total 100%.
    if any(not math.isfinite(r['weightPct']) or not (-.05 if r['name']=='Others' else 0) <= r['weightPct'] <= 100 for r in rows):
        reject('Invalid commodity group weight')
    if not 99 <= sum(r['weightPct'] for r in rows) <= 101:
        reject('Incomplete commodity allocation')
    return {'rows':rows, 'asOf':stamp, 'basis':'index', 'index':'Bloomberg Commodity Index',
            'classification':'commodity-groups', 'sourceIsin':SOURCE_ISIN,
            'sourceUrl':source_url, 'sha256':digest,
            'scope':'Bloomberg Commodity Index · groupes de matières premières',
            'method':'Published numerical index allocation, rounded issuer weights; not fund holdings, swap collateral or equity sectors'}


def collect_allocation(now, fetch=download):
    body = fetch(SOURCE_URL)
    return parse_allocation(pdf_text(body), now, proof(body))


def add_allocation(result, share, now, fetch=download, body=None):
    if not share.get('collectCommodityAllocation'): return result
    try:
        expected = share['commodityBenchmark']
        if result.get('index') != expected:
            reject('Fund does not track the qualified exact commodity benchmark')
        allocation = (parse_allocation(pdf_text(body), now, proof(body))
                      if body is not None else collect_allocation(now, fetch))
        allocation['identitySourceUrl'] = result['sourceUrl']
        allocation['sourceUrls'] = list(dict.fromkeys([allocation['sourceUrl'], result['sourceUrl']]))
        result['commodityAllocation'] = allocation
    except Exception as error:
        result.setdefault('collectionErrors', []).append({'field':'commodityAllocation', 'reason':str(error), 'url':SOURCE_URL})
    return result
