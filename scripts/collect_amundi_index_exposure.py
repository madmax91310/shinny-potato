"""Dated index exposure from Amundi synthetic-fund factsheets, not the substitute basket."""
import datetime as dt
import re
from data_automation import UTC, reject
from issuer_documents import download, pdf_text, document_date, proof, validated_rows
from collect_amundi_etf import API, fetch_api, breakdown


def parse_product(product, share, now):
    facts = product['characteristics']
    if product['productId'] != share['isin'] or facts.get('ISIN') != share['isin']:
        reject('Wrong Amundi index-exposure share')
    if facts.get('FUND_REPLICATION_METHODOLOGY') != 'Indirect(Swap Based)':
        reject('Amundi index exposure requires the exact synthetic share')
    if not facts.get('BENCHMARK_NAME') or facts['BENCHMARK_NAME'] != share['expectedIndex']:
        reject('Amundi tracked index changed')
    # This is the INDEX date, never POSITION_AS_OF_DATE / FUND_BREAKDOWNS_AS_OF_DATE.
    date = document_date(facts['INDEX_BREAKDOWNS_AS_OF_DATE'], now)
    result = {**share, 'sourceUrl': API, 'productId': share['isin'], 'exposureOnly': True}
    for key, field, top in [('countries', 'INDEX_COUNTRIES', False),
                            ('sectors', 'INDEX_SECTORS', False), ('holdings', 'INDEX_TOP10', True)]:
        allocation = breakdown(product['breakDowns'], field, date, now, top)
        if not allocation:
            reject('Missing Amundi index allocation: ' + field)
        allocation['basis'] = 'index'
        if top and len(allocation['rows']) != 10:
            reject('Incomplete Amundi top-ten index allocation')
        result[key] = allocation
    return result


def rows(block):
    result=[]
    for line in block.splitlines():
        # Security names can contain digits (10X GENOMICS, HUT 8, etc.).
        m=re.fullmatch(r'\s*([^%\n]+?)\s{2,}(\d+(?:[,.]\d+)?)\s*%\s*',line)
        if m and m[1].strip() not in ('Total','Sous-total'):
            result.append({'name':m[1].strip(),'weightPct':float(m[2].replace(',','.'))})
    return result


def parse_document(body,share,now):
    text=pdf_text(body);left=pdf_text(body,(0,300));right=pdf_text(body,(300,300))
    replication = share.get('expectedReplication', 'Synthétique')
    if replication not in ('Synthétique', 'Physique') or share['isin'] not in text or replication not in text:
        reject('Amundi exact-share identity/replication missing')
    dates=re.findall(r'\b\d{2}/\d{2}/\d{4}\b',text)
    # Header date, independently checked against the URL requested by the collector.
    stamp=document_date(dates[0],now)
    countries=rows(left.split("Répartition géographique de l'indice (source : Amundi)",1)[1].split('\f',1)[0])
    holdings=rows(right.split("Principales lignes de l'indice (source : Amundi)",1)[1].split("Secteurs de l'indice",1)[0])
    sectors=rows(right.split("Secteurs de l'indice (source : Amundi)",1)[1].split('\f',1)[0])
    validated_rows(countries);validated_rows(sectors);validated_rows(holdings,complete=False)
    if not 3<=len(holdings)<=10:reject('Amundi principal index holdings incomplete')
    return {**share,'productId':share['isin'],'exposureOnly':True,
      **{key:{'asOf':stamp,'basis':'index','rows':value,'sha256':proof(body),
              'sourceUrl':share['sourceUrl']}for key,value in [('countries',countries),('sectors',sectors),('holdings',holdings)]}}


def collect_monthly_document(share, now, parse, fetch=download):
    """Use Amundi's live official edition; date it from the validated PDF.

    A transport failure may fall back to two dated editions. Invalid content
    fails closed: an older PDF must not hide an identity or methodology change.
    """
    end = now.date().replace(day=1) - dt.timedelta(days=1)
    previous = end.replace(day=1) - dt.timedelta(days=1)
    base = f"https://www.amundietf.fr/pdfDocuments/monthly-factsheet/{share['isin']}/FRA/FRA/INSTITUTIONNEL/ETF"
    errors = []
    for edition in [None, end, previous]:
        url = base if edition is None else f'{base}/{edition:%Y%m%d}'
        try:
            body = fetch(url)
        except Exception as error:
            errors.append(f'{url}: {error}')
            continue
        result, stamp = parse(body, url)
        # The live endpoint can still publish the preceding monthly edition.
        # Never label it with the month we hoped to retrieve, or accept YTD.
        if stamp not in (end.isoformat(), previous.isoformat()):
            reject('Amundi published index month is not a recent completed month')
        if edition is not None and stamp != edition.isoformat():
            reject('Amundi requested/published index month mismatch')
        return result
    reject('Amundi current index document unavailable: ' + ' ; '.join(errors))


def collect_one(share,now=None,fetch=download,api_fetch=fetch_api):
    now=now or dt.datetime.now(UTC)
    if share.get('expectedIndex'):
        payload = {'productIds': [share['isin']],
            'context': {'countryCode': 'FRA', 'languageCode': 'fr', 'userProfileName': 'INSTIT'},
            'characteristics': ['ISIN', 'BENCHMARK_NAME', 'FUND_REPLICATION_METHODOLOGY',
                                'INDEX_BREAKDOWNS_AS_OF_DATE'],
            'breakDown': {'aggregationFields': ['INDEX_TOP10', 'INDEX_COUNTRIES', 'INDEX_SECTORS']}}
        try:
            products = api_fetch(payload)['products']
            if len(products) != 1:
                reject('Missing or duplicate Amundi index-exposure share')
            return parse_product(products[0], share, now)
        except Exception as error:
            # A changed identity/method cannot be rescued by an older PDF.
            # Qualified API sources fail closed and retain their existing values.
            reject('Amundi index API: ' + str(error))
    def parse(body, url):
        result = parse_document(body, {**share, 'sourceUrl': url}, now)
        return result, result['holdings']['asOf']
    return collect_monthly_document(share, now, parse, fetch)
