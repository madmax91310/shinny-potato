"""Exact corporate-action references, never a name-based security search.

Static reference review and live holdings source controls keep separate dates.
The resulting HEG company is distinct from HEG Advanced Materials and its ISIN.
"""
import copy
import datetime as dt
import json
import math
from pathlib import Path

HEG_GRAPHITE = {
    'id': 'heg-graphite-resulting-equity-20260901',
    'issuer': 'HEG Graphite Limited',
    'isin': 'INE0Y9J01020',
    'securityClass': 'Equity Shares',
    'faceValueINR': 2,
    'effectiveDate': '2026-09-01',
    'reviewedAt': '2026-11-12',
    'sourceUrl': 'https://heg-limited.com/wp-content/uploads/2025/03/Pre-and-Post-amalgamation-share-holding-pattern-of-unlisted-entity.pdf',
    'sha256': '0dae5c7ff06e751d13adaa88f979ec77f35f0e65116ff105e3de5114e7395282',
    'documentDate': '2025-02-28',
    'pages': [18, 22],
    'schemeSourceUrl': 'https://nsearchives.nseindia.com/corporate/HEG_24082026185355_FinalOutcome24082026.pdf',
    'schemeSha256': '454eb663af73944b4e34c095be6be3f4cac814c6319e95e5fc6fd5e29b73c4a0',
    'method': 'Issuer signed pre/post-scheme shareholding tables explicitly identify the resulting company, equity class and post-split ISIN. NSE-hosted issuer outcome fixes scheme effectiveness. No old-company ISIN or price adjustment reused.',
}
SHARES = {'IE00B3F81G20', 'IE00BKM4GZ66'}


def qualified_corporate_identity(position, as_of, fund_isin, now):
    if (fund_isin not in SHARES
            or position.get('name') != 'HEG GRAPHITE LTD'
            or position.get('isin') is not None
            or position.get('assetClass') != 'Equity'
            or position.get('currency') != 'INR'
            or position.get('exchange') != 'Bse Ltd'
            or position.get('ticker') is not None
            or position.get('country') != 'India'):
        return None
    weight = position.get('weightPct')
    if type(weight) not in (int, float) or not math.isfinite(weight) or not 0 < weight <= 100:
        return None
    policy = json.loads((Path(__file__).resolve().parents[1] / 'src/data/freshness-policy.json').read_text())
    reviewed = dt.date.fromisoformat(HEG_GRAPHITE['reviewedAt'])
    today = now.date()
    if not 0 <= (today - reviewed).days <= policy['fields']['etf.staticCharacteristic']['checkDays']:
        return None  # Expired reference stays unqualified; no invented recheck.
    observed = dt.date.fromisoformat(as_of)
    if not dt.date.fromisoformat(HEG_GRAPHITE['effectiveDate']) <= observed <= today:
        return None
    return {'sourcePosition': copy.deepcopy(position), 'asOf': as_of,
            'qualifiedIsin': HEG_GRAPHITE['isin'],
            'qualification': copy.deepcopy(HEG_GRAPHITE)}
