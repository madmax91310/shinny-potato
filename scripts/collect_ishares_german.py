"""Exact German iShares share whose UK API is unavailable; explicit label translation."""
import copy
from urllib.parse import urlencode
from data_automation import get_json
from collect_etf_pilot import parse_share
from collect_etf_holdings import parse_holdings
from issuer_documents import proof
import json

COUNTRIES=dict(zip(
 ['Vereinigtes Königreich','Frankreich','Schweiz','Deutschland','Niederlande','Spanien','Italien','Schweden','Dänemark','Finnland','Belgien','Norwegen','Polen','Other','Cash und/oder Derivate','Griechenland','Irland','Europäische Union','Portugal','Vereinigte Staaten','Österreich','Australien'],
 ['United Kingdom','France','Switzerland','Germany','Netherlands','Spain','Italy','Sweden','Denmark','Finland','Belgium','Norway','Poland','Other','Cash and/or Derivatives','Greece','Ireland','European Union','Portugal','United States','Austria','Australia']))
SECTORS=dict(zip(
 ['Finanzwesen','Industrie','Gesundheitsversorgung','IT','Nichtzyklische Konsumgüter','Zyklische Konsumgüter','Energie','Materialien','Versorger','Kommunikation','Immobilien','Barmittel & Derivate'],
 ['Financials','Industrials','Health Care','Information Technology','Consumer Staples','Consumer Discretionary','Energy','Materials','Utilities','Communication Services','Real Estate','Cash and/or Derivatives']))
SECTORS['Sonstige']='Other'


def normalize(raw):
    body=copy.deepcopy(raw)
    if body['productId']!=251931 or body['currencyCode']!='EUR':raise ValueError('Wrong German iShares product')
    c=body['componentsByNameMap'];facts=c['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value']!='DE0002635307' or facts['useOfProfitsCode']['value']!='ausschüttend':
        raise ValueError('German exact share/distribution changed')
    facts['useOfProfitsCode']['value']='Distributing'
    e=c['exposureBreakdowns']['containersByNameMap']
    for table,mapping in [(e['sector'],SECTORS),(e['geography']['subContainersByNameMap']['countries'],COUNTRIES)]:
        points=table['dataPointsByNameMap']
        points['type']['value']=[mapping[label.strip()] for label in points['type']['value']]
    h=c['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    h['countryOfRisk']['value']=[COUNTRIES[x] for x in h['countryOfRisk']['value']]
    classes={'Aktien':'Equity','Geldmarkt':'Cash','Futures':'Futures','FX':'FX','Cash Collateral and Margins':'Cash Collateral and Margins'}
    h['assetClass']['value']=[classes[x] for x in h['assetClass']['value']]
    return body


def collect(share,now):
    if share['isin']!='DE0002635307':raise ValueError('Unqualified German share')
    query={'portfolioId':251931,'productId':251931,'portfolioType':'ISHARES_FUND_DATA','currencyCode':'EUR','shareClass':' ',
      'aladdinFundTicker':'IDJST6TTL','ticker':'EXSA','appSubType':'ISHARES','locale':'de_DE','targetSite':'de-ishares-v2',
      'userType':'individual','slice':'emea','appType':'PRODUCT_PAGE','component':'keyFundFacts,performance,exposureBreakdowns,holdings.all',
      'includeConfig':'true','excludeContent':'true'}
    url='https://www.blackrock.com/varnish-api/uk-retail01-product-data/product-data/api/v2/get-product-data?'+urlencode(query)
    raw=get_json(url);body=normalize(raw)
    result=parse_share(body,share,now)
    result['sourceUrl']=url
    result.pop('rawComponents',None)
    result['holdings'],result['countriesRisk']=parse_holdings(body,share,now)
    for field in ('countries','sectors','holdings','countriesRisk'):
        result[field].update(sourceUrl=url,basis='fund',sha256=proof(json.dumps(raw,sort_keys=True).encode()),translation='Explicit German-to-English labels; published weights unchanged')
    return result
