"""Vanguard's live factsheet link: exact-share dated assets, expenses and published exposures."""
from html.parser import HTMLParser
import datetime as dt
import hashlib
import json
import re
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit
from data_automation import reject
from issuer_documents import download, pdf_text, document_date, proof, validated_rows, bounded_return

API = 'https://www.vanguard.co.uk/gpx/graphql'
# Same public GPX fields used by Vanguard's annual-return and market-allocation widgets.
QUERY = '''query ExactShareRefresh($portIds: [String!]!) {
  funds(portIds: $portIds) {
    profile {
      portId fundFullName fundCurrency primaryMarketEquityClassification
      identifiers(altIds: ["ISIN"]) { altId altIdValue }
    }
    performanceDetails { items { quarterlyReturns {
      totalReturns(limit: -1, returnPeriodCodes: [ONE_YEAR], sortAsc: true) {
        items { returnPeriod percent effectiveDate }
      }
    } } }
    marketAllocation {
      portId date countryCode countryName fundMktPercent holdingStatCode
    }
  }
}'''


def fetch_api(code):
    payload = {'query': QUERY, 'variables': {'portIds': [str(code)]},
               'operationName': 'ExactShareRefresh'}
    request = urllib.request.Request(API, data=json.dumps(payload).encode(), headers={
        'Content-Type': 'application/json', 'Accept': 'application/json',
        'X-Consumer-ID': 'uk-pro', 'User-Agent': 'EpargnantLibre-Data/1.0'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                if response.headers.get_content_type() != 'application/json':
                    reject('Expected Vanguard GPX JSON')
                body = response.read(2_000_001)
                if len(body) > 2_000_000:
                    reject('Vanguard GPX response too large')
            data = json.loads(body, parse_constant=lambda _: reject('Non-finite Vanguard JSON'))
            if data.get('errors'):
                reject('Vanguard GPX query failed: ' + str(data['errors'])[:300])
            return data
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def parse_api(body, share, now):
    funds = body['data']['funds']
    if len(funds) != 1:
        reject('Missing or duplicate Vanguard share')
    fund = funds[0]; profile = fund['profile']
    isins = [i['altIdValue'] for i in profile['identifiers'] if i['altId'] == 'ISIN']
    if (isins != [share['isin']] or profile['portId'] != str(share['productCode'])
            or profile['fundCurrency'] != share['currency']):
        reject('Vanguard GPX exact-share identity or currency changed')
    result = {'unavailable': []}
    digest = hashlib.sha256(json.dumps(body, sort_keys=True, allow_nan=False).encode()).hexdigest()
    try:
        points = fund['performanceDetails']['items']['quarterlyReturns']['totalReturns']['items']
        if not points:
            reject('No Vanguard annual returns')
        # Recent monthly endpoint dates certify the publication, but only a 1YR
        # observation ending on 31 December is a completed calendar-year return.
        dates = [dt.date.fromisoformat(p['effectiveDate']) for p in points]
        document_date(max(dates).isoformat(), now)
        if any(d > now.date() for d in dates):
            reject('Future Vanguard performance observation')
        years = {}
        for point, date in zip(points, dates):
            if point['returnPeriod'] != '1YR':
                reject('Unexpected Vanguard return period')
            if date.month != 12 or date.day != 31 or date.year < 2020:
                continue
            if date.year >= now.year or str(date.year) in years:
                reject('Duplicate or unfinished Vanguard calendar year')
            years[str(date.year)] = bounded_return(point['percent'])
        if not years:
            reject('No completed Vanguard calendar years')
        result['performance'] = {'basis': 'fund', 'currency': share['currency'],
            'method': 'calendar-year NAV total return, gross income reinvested, fund fees included',
            'years': dict(sorted(years.items())), 'sourceUrl': API, 'sha256': digest}
    except (ValueError, KeyError, TypeError) as error:
        result['unavailable'].append('performance: ' + str(error))
    if share.get('equity', True):
        try:
            classification = profile['primaryMarketEquityClassification']
            code = {'FTSE Country of Risk': 'FTCTYATPCS',
                    'MSCI Country of Risk': 'MSCTYATPCS'}.get(classification)
            if not code:
                reject('Unqualified Vanguard country classification')
            points = [p for p in fund['marketAllocation'] if p['holdingStatCode'] == code]
            if not points or any(p['portId'] != str(share['productCode']) for p in points):
                reject('Vanguard market allocation share mismatch')
            dates = {p['date'] for p in points}
            if len(dates) != 1:
                reject('Mixed Vanguard country dates')
            stamp = document_date(dates.pop(), now)
            rows = [{'name': p['countryName'], 'weightPct': p['fundMktPercent']} for p in points]
            validated_rows(rows)
            result['countries'] = {'asOf': stamp, 'basis': 'fund', 'sourceUrl': API,
                'method': classification, 'sha256': digest,
                'rows': sorted(rows, key=lambda p: -p['weightPct'])}
        except (ValueError, KeyError, TypeError) as error:
            result['unavailable'].append('countries: ' + str(error))
    return result


class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='a' and attrs.get('href'):self.links.append(attrs['href'])


def parse_document(body,share,now):
    text=pdf_text(body)
    if share['isin']not in text:reject('Wrong Vanguard factsheet share')
    stamp=document_date(re.search(r'Factsheet \| (\d+ [A-Za-z]+ \d{4})',text)[1],now)
    currency=re.search(r'Base currency[^\n]*\n\s*(USD|EUR|GBP)\b',text)
    if not currency or currency[1]!=share['currency']:reject('Vanguard base currency changed')
    aum=re.search(r'Share class assets \(million\)\s*([\$€£])([\d,]+(?:\.\d+)?) as at (\d+ [A-Za-z]+ \d{4})',text)
    if not aum or {'$':'USD','€':'EUR','£':'GBP'}[aum[1]]!=share['currency']:reject('Vanguard exact-share assets missing')
    aum_date=document_date(aum[3],now)
    ter=re.search(r'Ongoing Charges Figure\S*\s+(\d+\.\d+)%',text)
    if not ter or float(ter[1])>5:reject('Vanguard expenses missing/invalid')
    result={**share,'productId':share['isin'],'terPct':float(ter[1]),'index':share['benchmark'],
      'distribution':share['distribution'],'aum':{'amount':float(aum[2].replace(',',''))*1e6,
       'currency':share['currency'],'scope':'share-class','asOf':aum_date},
      'documentSha256':proof(body),'unavailable':['performance: factsheet publishes rolling twelve-month returns, not calendar years',
       'countries: factsheet geography is a truncated top-country table']}
    if share.get('equity',True):
        holdings=[];block=text.split('Top 10 holdings',1)[1].split('Weighted exposure',1)[0]
        for line in block.splitlines():
            cells=re.split(r' {2,}',line.strip())
            if len(cells)>=2 and re.fullmatch(r'\d+\.\d+%?',cells[-1]) and not re.fullmatch(r'[\d.,$%]+',cells[-2]):
                holdings.append({'name':cells[-2],'weightPct':float(cells[-1].rstrip('%'))})
        if len(holdings)!=10:reject('Vanguard top-ten holdings table incomplete')
        validated_rows(holdings,complete=False)
        result['holdings']={'asOf':stamp,'basis':'fund','sourceUrl':share['sourceUrl'],'rows':holdings}
        sectors=[];block=text.split('Weighted exposure',1)[1].split('Sector categories',1)[0]
        for line in block.splitlines():
            cells=re.split(r' {2,}',line.strip())
            for i in range(len(cells)-1):
                if re.fullmatch(r'[A-Za-z &]+',cells[i]) and re.fullmatch(r'\d+\.\d+%?',cells[i+1]):
                    sectors.append({'name':cells[i],'weightPct':float(cells[i+1].rstrip('%'))})
        validated_rows(sectors)
        result['sectors']={'asOf':stamp,'basis':'fund','sourceUrl':share['sourceUrl'],'rows':sectors}
    return result


def collect_one(share,now,fetch=download,api_fetch=fetch_api):
    page=fetch(share['pageUrl']).decode('utf-8');parser=Links();parser.feed(page)
    links=[u for u in parser.links if urlsplit(u).hostname=='fund-docs.vanguard.com'and
           f"_{share['productCode']}_"in u and u.endswith('_UK_EN.pdf')]
    if len(set(links))!=1:reject('Vanguard current factsheet link ambiguous')
    url=links[0]
    result = parse_document(fetch(url),{**share,'sourceUrl':url},now)
    # The PDF certifies the part, AUM, fees and holdings. Complementary fields
    # have their own GPX identity, dates and provenance.
    extra = parse_api(api_fetch(share['productCode']), share, now)
    result['unavailable'] = extra.pop('unavailable')
    result.update(extra)
    return result
