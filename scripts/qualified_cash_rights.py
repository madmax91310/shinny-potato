"""Documented cash-only merger rights, distinct from company shares.

These are historical reference qualifications, not fresh issuer observations.
Live holdings keep their original NAV weights, source class and observation date.
No security identifier, market price or company exposure is inferred.
"""
import copy
import datetime as dt
import math


ARCELLX = {
    'id': 'arcellx-cash-cvr-20260428',
    'issuer': 'Arcellx, Inc.',
    'effectiveDate': '2026-04-28',
    'paymentDate': '2030-03-31',
    'reviewedAt': '2026-11-12',
    'kind': 'contingent-cash-right',
    'method': 'Completed merger: former common shares converted into cash and a contractual contingent cash payment; this right is not a common share in Arcellx or Gilead.',
    'sources': [
        {'url': 'https://www.sec.gov/Archives/edgar/data/1786205/000110465926050318/tm2612746d7_8k.htm',
         'sha256': '9f44ef0df09b1111c475982d7e8b99e467bb4ee6f4b60f72e9e8c21ad848ca1d',
         'documentDate': '2026-04-28', 'cik': '1786205'},
        {'url': 'https://www.sec.gov/Archives/edgar/data/882095/000110465926049874/tm2612748d1_8k.htm',
         'sha256': 'f9656c2910fc0f51f3922849f295bcff7b46113d6a3d2aaf1b11d24b7aa9adb5',
         'documentDate': '2026-04-28', 'cik': '882095'},
    ],
}



AKERO = {
    'id': 'akero-cash-cvr-20251209',
    'issuer': 'Akero Therapeutics, Inc.',
    'effectiveDate': '2025-12-09',
    'terminationDate': '2031-06-30',
    'reviewedAt': '2026-11-13',
    'kind': 'contingent-cash-right',
    'method': 'Completed merger: common shares cancelled for cash and one contractual cash-only CVR; governing agreement section 2.5 excludes equity, ownership, voting and dividend rights. No Novo Nordisk share exposure or security identifier is inferred.',
    'sourceMetadataNote': 'The observed BlackRock Equity / NASDAQ / AKE markers are retained verbatim. They do not prove a live listed share or an executable CVR quote; the completed merger delisted the common stock and the CVR contract is nontransferable except permitted transfers.',
    'sources': [
        {'url': 'https://www.sec.gov/Archives/edgar/data/1744659/000114036125044946/ef20060786_8k.htm',
         'sha256': 'ecb2b17d2a78d27afd177c36329e42ea22db45c5ac55face358eb2085699fd22',
         'documentDate': '2025-12-09', 'cik': '1744659', 'role': 'completed merger and cancelled/delisted common stock'},
        {'url': 'https://www.sec.gov/Archives/edgar/data/1744659/000119312525235919/d42650dex21.htm',
         'sha256': 'ee7fa62ec1ea052ad57c151fcc6db3a6ff96b7576630d15bebf5d709925a13b0',
         'documentDate': '2025-10-09', 'cik': '1744659', 'role': 'governing merger agreement incorporated by completion filing; annex CVR sections 2.2 and 2.5 and termination date'},
    ],
}


def _qualified_akero_cash_right(position, as_of):
    # Different, actually observed source markers from Arcellx. In particular,
    # never generalise a CVR-name or an old NASDAQ listing into a qualification.
    if (position.get('name') != 'AKERO THERAPEUTICS CVR'
            or position.get('isin') is not None
            or position.get('assetClass') != 'Equity'
            or position.get('currency') != 'USD'
            or position.get('exchange') != 'NASDAQ'
            or position.get('ticker') != 'AKE'
            or position.get('country') != 'United States'):
        return None
    weight = position.get('weightPct')
    if type(weight) not in (int, float) or not math.isfinite(weight) or not 0 < weight <= 100:
        return None
    stamp = dt.date.fromisoformat(as_of)
    if not dt.date.fromisoformat(AKERO['effectiveDate']) <= stamp <= dt.date.fromisoformat(AKERO['terminationDate']):
        return None
    return {'sourcePosition': copy.deepcopy(position), 'asOf': as_of,
            'qualifiedKind': AKERO['kind'], 'qualification': copy.deepcopy(AKERO)}

ESPERION = {'id': 'esperion-cash-cvr-20260713',
 'issuer': 'Esperion Therapeutics, Inc.',
 'effectiveDate': '2026-07-13',
 'qualificationValidThrough': '2030-12-31',
 'reviewedAt': '2026-11-13',
 'kind': 'contingent-cash-right',
 'method': 'Completed merger; contractual contingent cash payments only. Executed CVR agreement section 2.5 '
           'excludes equity, ownership, voting and dividend rights. The original provider ISIN is preserved, '
           'not inferred from the former common shares.',
 'reviewBoundaryNote': '2030-12-31 is the final contractual milestone-year boundary and a limit of this '
                       'qualification, not an asserted payment or termination date. Section 6.1 preserves '
                       'earned unpaid amounts and requires final milestone determination; a new review is '
                       'required thereafter.',
 'sourceMetadataNote': 'Observed Equity / NASDAQ / null ticker and US296CVR0207 retained verbatim; no '
                       'common-share or parent exposure is inferred.',
 'sources': [{'url': 'https://www.sec.gov/Archives/edgar/data/1434868/000110465926082926/tm2620034d3_8k.htm',
              'sha256': '3f003a4465792428257b6fa6990ac3543c3b6033a1179061adf9af8528666212',
              'documentDate': '2026-07-13',
              'cik': '1434868',
              'role': 'completed acquisition and cash-only CVR'},
             {'url': 'https://www.sec.gov/Archives/edgar/data/1434868/000110465926082926/tm2620034d3_ex10-1.htm',
              'sha256': '731286629eabf478b7fc8dfb277e301005934b65bc2a19049fbc6c9ba268e22f',
              'documentDate': '2026-07-13',
              'cik': '1434868',
              'role': 'executed CVR agreement sections 2.5 and 6.1; milestone periods'}]}

def _qualified_esperion_cash_right(position, as_of):
    if (position.get("name") != "ESPERION THERAPEUTICS (CVR)"
            or position.get("isin") != "US296CVR0207"
            or position.get("assetClass") != "Equity"
            or position.get("currency") != "USD"
            or position.get("exchange") != "NASDAQ"
            or position.get("ticker") is not None
            or position.get("country") != "United States"):
        return None
    weight = position.get("weightPct")
    if type(weight) not in (int, float) or not math.isfinite(weight) or not 0 < weight <= 100:
        return None
    stamp = dt.date.fromisoformat(as_of)
    if not dt.date.fromisoformat(ESPERION["effectiveDate"]) <= stamp <= dt.date.fromisoformat(ESPERION["qualificationValidThrough"]):
        return None
    return {"sourcePosition": copy.deepcopy(position), "asOf": as_of,
            "qualifiedKind": ESPERION["kind"], "qualification": copy.deepcopy(ESPERION)}


def qualified_cash_right(position, as_of):
    """Return proof only for an exactly documented USD cash-right signature.

    A different name, identifier, currency, venue, ticker or historical period
    remains in the original unqualified equity perimeter. In particular, CVR
    is never a general exclusion rule and its value is never treated as zero.
    """
    if position.get("name") == "ESPERION THERAPEUTICS (CVR)":
        return _qualified_esperion_cash_right(position, as_of)
    if position.get('name') == 'AKERO THERAPEUTICS CVR':
        return _qualified_akero_cash_right(position, as_of)
    if (position.get('name') != 'ARCELLX INC CVR'
            or position.get('isin') is not None
            or position.get('assetClass') != 'Equity'
            or position.get('currency') != 'USD'
            or position.get('exchange') != 'NO MARKET (E.G. UNLISTED)'
            or position.get('ticker') is not None
            or position.get('country') != 'United States'):
        return None
    weight = position.get('weightPct')
    if type(weight) not in (int, float) or not math.isfinite(weight) or not 0 < weight <= 100:
        return None
    stamp = dt.date.fromisoformat(as_of)
    if not dt.date.fromisoformat(ARCELLX['effectiveDate']) <= stamp <= dt.date.fromisoformat(ARCELLX['paymentDate']):
        return None  # A new qualification is required beyond the contractual payment date.
    return {'sourcePosition': copy.deepcopy(position), 'asOf': as_of,
            'qualifiedKind': ARCELLX['kind'], 'qualification': copy.deepcopy(ARCELLX)}
