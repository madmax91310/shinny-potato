"""Qualify existing fund histories with explicitly identified official NAV series.

Exchange quotes are archived, never presented as repaired by this substitution.
Only performance consumers accepting NAV total return use these active records.
"""
import argparse
import copy
import datetime as dt
import gzip
import hashlib
import json
import math
import pathlib
import re
import urllib.parse
import functools
import threading
from bs4 import BeautifulSoup
from data_automation import UTC, get_json, get_text, write_json_atomic
from issuer_documents import download, pdf_text
from issuer_nav_history import (blackrock_nav, calendar_checks, dws_nav, monthly,
                                vaneck_nav, wisdomtree_identity, wisdomtree_nav, ssga_nav)

ROOT = pathlib.Path(__file__).resolve().parents[1]
IDS = ['etfEqualWeight', 'etfIE000U9ODG19', 'etfIE00BDFBTQ78', 'etfGB00B15KXQ89']
VANECK_CHART_URL='https://www.vaneck.com/static/eu/js/dist/main.js'
_VANECK_CHART_LOCK=threading.Lock()


@functools.lru_cache(maxsize=8)
def _vaneck_chart_body(fetch):
    return fetch(VANECK_CHART_URL)


def vaneck_page_calendar(soup, isin, native, title, ticker, now, fetch, document):
    """The public UCITS page APIs, never the US fund sharing its public ticker."""
    from decimal import Decimal
    from issuer_documents import document_date
    normalize=lambda s:' '.join(BeautifulSoup(s,'html.parser').get_text(' ',strip=True).split())
    page_text=normalize(str(soup))
    if not re.search(r'Performance data for the Irish domiciled ETFs is displayed on a Net Asset Value basis, in Base Currency terms, with net income reinvested, net of fees',page_text):
        raise ValueError('VanEck page NAV currency/income convention not confirmed')
    page_id=soup.find('ve-histopricesblock')['data-pageid']
    def block(tag, controller):
        element=soup.find(tag)
        if not element or element.get('data-pageid')!=page_id or not re.fullmatch(r'\d+',element.get('data-blockid','')):
            raise ValueError('VanEck official fund component changed')
        query=urllib.parse.urlencode(dict(blockid=element['data-blockid'],pageid=page_id,ticker=ticker))
        response=fetch('https://www.vaneck.com/Main/'+controller+'/GetContent/?'+query)
        if response.get('blockId')!=int(element['data-blockid']):raise ValueError('Wrong VanEck component identity')
        result=response['data']
        if 'Ticker' in result and result['Ticker']!=ticker:raise ValueError('Wrong VanEck internal fund ticker')
        return result
    facts=block('ve-fund-details-block','FundDetailsBlock')
    values={normalize(row['Title']):normalize(row['Value'])for row in facts['Values']}
    required={'Income Treatment':'Reinvestment','Distribution Frequency':'None','Domicile':'Ireland','UCITS Compliant':'Yes','Base Currency':native,'Fund Ticker':title.rsplit(' - ',1)[1]}
    if any(values.get(k)!=v for k,v in required.items()):raise ValueError('VanEck UCITS income/currency context not confirmed')
    listings=block('ve-tradinginformationblock','TradingInformationBlock')
    if not listings.get('Items') or {row.get('Isin')for row in listings['Items']}!={isin}:
        raise ValueError('VanEck trading table exact share not confirmed')
    launch=next((v for k,v in values.items()if k.startswith('Inception Date')),None)
    inception=dt.datetime.strptime(launch,'%m/%d/%Y').date()
    document_date(inception.isoformat(),now,max_age=36500)
    asof=dt.datetime.strptime(facts['LongVersionAsOfDate'],'%m/%d/%Y').date().isoformat()
    document_date(asof,now,max_age=75)
    calendar=block('ve-performancepastyearschartblock','PerformancePastYearsChartBlock')
    if calendar['AsOfDate']!=f'12/31/{now.year-1}' or not re.search(r'fund.s performance in '+re.escape(native)+r'\b',normalize(calendar['DisclaimerText'])):
        raise ValueError('VanEck annual performance currency/date not confirmed')
    stated_launch=re.search(r'Fund was launched on (\d{1,2} [A-Za-z]+ \d{4})',normalize(calendar['DisclaimerText']))
    if not stated_launch or document_date(stated_launch[1],now,max_age=36500)!=inception.isoformat():
        raise ValueError('VanEck annual performance fund launch mismatch')
    categories=json.loads(calendar['Categories'])
    if any(not re.fullmatch(r'20\d{2}\*?',str(y))for y in categories):raise ValueError('Invalid VanEck annual column')
    categories=[str(y).rstrip('*')for y in categories]
    if categories!=[str(y)for y in range(int(categories[0]),now.year)]:raise ValueError('Missing or duplicate VanEck annual column')
    series=json.loads(calendar['Series'],parse_float=Decimal)
    selected=[row for row in series if normalize(row['name'])==normalize(title.rsplit(' - ',1)[0])]
    if len(selected)!=1 or len(selected[0]['data'])!=len(categories):raise ValueError('Wrong or missing VanEck fund calendar row')
    renderer=document(VANECK_CHART_URL).decode()
    start=renderer.find('window.initPastYearsChart=')
    if start<0 or not re.search(r'tooltip:\{formatter:function\(\)\{return this\.series\.name\+": "\+this\.y\+"%"\}\}',renderer[start:start+8000]):
        raise ValueError('VanEck published calendar number format changed')
    first_full=inception.year+(0 if (inception.month,inception.day)==(1,1)else 1)
    years={};precision={}
    for year,value in zip(categories,selected[0]['data']):
        if int(year)<first_full:continue
        if isinstance(value,bool)or not isinstance(value,(int,Decimal))or not math.isfinite(value)or value<=-100:
            raise ValueError('Missing complete VanEck annual observation')
        # The verified issuer renderer concatenates a JavaScript Number, not
        # the JSON decimal token: 2.0 is published as 2%, 11.6 as 11.6%.
        years[year]=float(value);precision[year]=max(0,-Decimal(value).normalize().as_tuple().exponent)
    if not years:raise ValueError('No complete VanEck annual observation')
    return years,precision,{'isin':isin,'internalTicker':ticker,'fundInception':inception.isoformat(),'fundDataAsOf':asof,'calendarAsOf':calendar['AsOfDate'],'calendarCurrency':native,'incomeTreatment':values['Income Treatment'],'numberFormat':'verified issuer JavaScript Number + percent; insignificant trailing zeroes omitted','numberFormatSource':VANECK_CHART_URL}


def configurations():
    old = {r['id']:r for r in json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']}
    extras = {
        'etfEqualWeight':dict(navProvider='dws',navCurrency='USD',identityFrom='2015-06-26',periodStart='2015-06',
            sourceUrl='https://etf.dws.com/api/pdp/en-gb/etf/IE00BLNMYC90/pdpMetaTagsTealium'),
        'etfIE000U9ODG19':dict(navProvider='blackrock',navCurrency='USD',productId=334464,
            sourceUrl='https://www.blackrock.com/varnish-api/uk-retail01-product-data/product-data/api/v2/get-product-data'),
        'etfIE00BDFBTQ78':dict(navProvider='vaneck',navCurrency='USD',
            sourceUrl='https://www.vaneck.com/DK/en/investments/mining-etf/',
            factsheetUrl='https://www.vaneck.com/ucits/library/fact-sheets/gdig-fact-sheet.pdf'),
        'etfGB00B15KXQ89':dict(navProvider='wisdomtree',navCurrency='USD',
            sourceUrl='https://www.wisdomtree.com/ie/products/commodities/wisdomtree-copper',
            navHistoryTransport='official-xlsx-post',wisdomClassId=1000073),
    }
    result = []
    for id in IDS:
        prior=old[id]
        # The same exact share and output currency; NAV is a different valuation convention.
        result.append({k:v for k,v in {
            'id':id,'isin':prior['isin'],'label':prior['label'].removesuffix(' · VL')+' · VL',
            'instrumentType':prior.get('instrumentType','ETF'),'consumerScope':'catalog',
            'currency':prior['currency'],'periodStart':prior['periodStart'],
            'precision':8,'collectAnniversary':True,'parser':'official-nav','field':'nav-total-return',
            'valuationBasis':'fund-nav-total-return',
            'method':'Valeur liquidative officielle de la part exacte, revenus capitalisés, nette des frais du fonds ; conversion mensuelle BCE explicite si nécessaire ; aucune cotation de marché substituée silencieusement',
            **({'navCalendarSource':prior['navCalendarSource']}if 'navCalendarSource'in prior else{}),
            **extras[id]}.items()})
    remainder = json.loads((ROOT/'scripts/official-nav-remainder-sources.json').read_text())
    return result + remainder


def daily_nav_fx_factor(native, currency, latest, body):
    """Same-date ECB cross for qualified native/output currencies; never a current quote."""
    if (native,currency) not in {('USD','EUR'),('JPY','EUR')}:
        raise ValueError('Unqualified daily NAV conversion')
    from collect_ranking_sources import ecb_daily_rates
    rates=ecb_daily_rates(body)
    eligible=[day for day in rates if day.isoformat()<=latest]
    if not eligible:raise ValueError('Missing official daily NAV/FX currency or date')
    day=max(eligible)
    if native not in rates[day] or currency not in rates[day]:raise ValueError('Missing official daily NAV/FX currency at the selected fixing')
    if (dt.date.fromisoformat(latest)-day).days>4:raise ValueError('Official daily NAV/FX dates incompatible')
    return day.isoformat(),rates[day][currency]/rates[day][native]


_LANDG_CATALOGUE_LOCK=threading.Lock()
@functools.lru_cache(maxsize=8)
def _landg_catalogue(fetch,url):
    # One source consultation shared by exact-share qualifications in this
    # process, never a persisted cache presented as a new source control.
    return fetch(url)


def collect_one(source, now, json_fetch=get_json, document_fetch=download, capture=None):
    urls, hashes = [], {}
    def document(url, supplied=None):
        if supplied is not None:body=supplied
        elif url==VANECK_CHART_URL:
            # A single shared request even when the monthly producer collects
            # several UCITS funds concurrently. Cache lasts only this process.
            with _VANECK_CHART_LOCK:body=_vaneck_chart_body(document_fetch)
        else:body=document_fetch(url)
        urls.append(url);hashes[url]=hashlib.sha256(body).hexdigest()
        if capture:
            capture.mkdir(parents=True,exist_ok=True)
            (capture/(hashes[url]+'.bin.gz')).write_bytes(gzip.compress(body))
        return body
    def data(url):
        if source.get('navProvider')=='landg'and url==source.get('catalogueUrl'):
            with _LANDG_CATALOGUE_LOCK:value=_landg_catalogue(json_fetch,url)
        else:value=json_fetch(url)
        body=json.dumps(value,sort_keys=True,separators=(',',':')).encode()
        urls.append(url);hashes[url]=hashlib.sha256(body).hexdigest()
        if capture:
            capture.mkdir(parents=True,exist_ok=True)
            (capture/(hashes[url]+'.json.gz')).write_bytes(gzip.compress(body))
        return value
    kind=source['navProvider'];isin=source['isin'];native=source['navCurrency']
    if source.get('anniversaryNavKind')is not None and (kind!='amundi'or source['anniversaryNavKind']!='official-price-excluding-distributions'):raise ValueError('Unqualified anniversary NAV convention')
    identity_from=source.get('identityFrom');calendar_precision=2;calendar_proof={};anniversary_nav=None
    if kind=='amundi':
        from collect_amundi_etf import fetch_api, API
        from amundi_nav_history import request_payload, parse
        payload=request_payload(source,now)
        body=fetch_api(payload)
        encoded=json.dumps(body,sort_keys=True,separators=(',',':')).encode()
        urls.append(API);hashes[API]=hashlib.sha256(encoded).hexdigest()
        if capture:
            capture.mkdir(parents=True,exist_ok=True)
            (capture/(hashes[API]+'.json.gz')).write_bytes(gzip.compress(encoded))
            (capture/(hashes[API]+'.request.json')).write_text(json.dumps(payload,indent=2)+'\n')
        nav,years,calendar_proof=parse(body,source,now)
        if source.get('anniversaryNavKind')=='official-price-excluding-distributions':
            from amundi_nav_history import anniversary_price_history
            anniversary_nav,price_proof=anniversary_price_history(body,source,now,nav)
            calendar_proof.update(price_proof)
        credit='Amundi'
    elif kind=='blackrock':
        query=urllib.parse.urlencode(dict(appSubType='ISHARES',appType='PRODUCT_PAGE',component='keyFundFacts,performance',locale='en_GB',portfolioId=source['productId'],targetSite='ishares-uk',userType='individual',excludeContent='true',includeConfig='true'))
        body=data(source['sourceUrl']+'?'+query);parsed=blackrock_nav(body,isin,native,now)
        years=parsed['years']
        if source.get('navHistoryKind')=='official-income-reinvested-index':
            from blackrock_income_history import qualify
            nav,calendar_proof=qualify(body,parsed,source,now)
            if parsed['distribution']=='Distributing':anniversary_nav=parsed['nav']
            calendar_proof['shareInception']=parsed['inception']
        else:
            if parsed['distribution']!='Accumulating':raise ValueError('Raw NAV does not qualify a distributing share')
            nav=parsed['nav']
            # Accumulation keeps its independently checked raw-NAV path.
            checks=calendar_checks(parsed['totalReturn'],years,2,now,identity_from)
            calendar_checks(nav,years,2,now,identity_from)
            calendar_proof={'officialIncomeReinvestedChartChecks':checks,'shareInception':parsed['inception']}
        credit='BlackRock iShares'
    elif kind=='dws':
        from collect_dws_etf import parse_product
        body=data(source['sourceUrl']);facts=parse_product(body,{'isin':isin,'currency':native,'sourceUrl':source['sourceUrl']},now)
        if source.get('navHistoryKind')=='official-income-reinvested-chart':
            from dws_income_history import qualify
            url=source['sourceUrl'].rsplit('/',1)[0]+'/historicaldata/download?'+urllib.parse.urlencode({'startDate':source['identityFrom'],'endDate':now.date().isoformat(),'includeTax':'false'})
            raw_nav=dws_nav(document(url),isin,native,now)
            chart=data(source['sourceUrl'].rsplit('/',1)[0]+'/performancechart')
            nav,calendar_proof=qualify(body,chart,facts,source,raw_nav,now)
            years=facts['performance']['years'];credit='DWS Xtrackers'
        else:
            if facts['distribution']!='Capitalizing':raise ValueError('DWS NAV reinvestment not qualified')
            policy=source.get('dwsIdentityBasis')
            if policy not in (None,'share-class-launch'):raise ValueError('Unqualified DWS identity policy')
            if policy=='share-class-launch':
                if not identity_from or facts['characteristics'].get('inceptionDate')!=identity_from or source['periodStart']<identity_from[:7]:
                    raise ValueError('DWS exact share launch identity changed')
                start=identity_from
            else:start='2015-06-26'
            url=source['sourceUrl'].rsplit('/',1)[0]+'/historicaldata/download?'+urllib.parse.urlencode({'startDate':start,'endDate':now.date().isoformat(),'includeTax':'false'})
            nav=dws_nav(document(url),isin,native,now);years=facts['performance']['years'];credit='DWS Xtrackers'
            if policy=='share-class-launch':
                calendar_proof={'identityFrom':identity_from,'identityBasis':policy,'incomeTreatment':facts['distribution']}
            else:
                notes=' '.join(t.get('text','') for tab in body['pdpResult']['pageSections']['performanceSection']['performanceTables']['tabs'] if tab['header']=='Calendar year' for t in tab.get('disclaimerHtml',[]))
                if '26 June 2015' not in notes or 'Luxembourg' not in notes:raise ValueError('DWS merger identity evidence changed')
                calendar_proof={'identityFrom':identity_from,'mergerNote':notes}
    elif kind=='ssga':
        from collect_ssga_etf import Inputs, parse_page
        page=document(source['sourceUrl']).decode(); parsed=Inputs(); parsed.feed(page)
        facts=parsed.data['fund-quick-info']['attrs']
        if facts['isin']['value']!=isin or facts['fund-income-treatment']['value']!='Accumulation':
            raise ValueError('State Street exact accumulating share not confirmed')
        record,_=parse_page(page,{'isin':isin,'currency':native},now)
        paths=[a['href'] for a in BeautifulSoup(page,'html.parser').find_all('a',href=True)
               if '/navhist-emea-' in a['href']]
        if len(set(paths))!=1:raise ValueError('Ambiguous State Street NAV export')
        url=urllib.parse.urljoin(source['sourceUrl'],paths[0]);parts=urllib.parse.urlsplit(url)
        if parts.scheme!='https' or parts.netloc!='www.ssga.com' or not parts.path.startswith('/library-content/products/fund-data/etfs/emea/navhist-emea-'):
            raise ValueError('Unexpected State Street NAV export host/path')
        nav=ssga_nav(document(url),isin,native,now)
        years=record['performance']['years'];credit='State Street'
        calendar_proof={'incomeTreatment':'Accumulation','sourceNavUrl':url}
    elif kind=='21shares':
        from collect_product_calendars import abtc_calendar, issuer_json
        base=source['sourceUrl'].rsplit('/api/',1)[0]
        if base not in ('https://api.primary.21shares.com','https://api.secondary.21shares.com'):
            raise ValueError('Unqualified 21Shares official API origin')
        endpoints=[base+'/api/'+name+'/ABTC' for name in
                   ('product_details','product_valuation_history','product_performance_metrics')]
        # Reuse the exact-share monthly oracle, including the documented 14:1
        # split guard. Never add another split/dividend adjustment to this NAV.
        product,history,metrics=[issuer_json(document(url)) for url in endpoints]
        performance=abtc_calendar(product,history,metrics,
            {'isin':isin,'currency':native},now,endpoints[1])
        nav={row['valuation_date']:row['nav_per_share'] for row in history['data']}
        years=performance['years'];credit='21Shares'
        calendar_proof={'shareInception':product['data']['inception_date'],
            'incomeTreatment':'Issuer exact ETP NAV; monthly published returns checked',
            'splitAdjustment':'14:1 on 2021-04-12 already reflected; no additional adjustment',
            'validationSources':endpoints,'monthlyOracle':performance['method'],
            'controlledInstrument':isin,'requestedStart':source['periodStart']+'-01',
            'controlledCalendarYears':sorted(years),
            'controlledFields':['product_details.details.isin','product_details.ticker',
                'product_details.currency.short_name','product_details.inception_date',
                'product_details.valuation_date','product_details.nav_per_unit',
                'product_valuation_history.valuation_date','product_valuation_history.nav_per_share',
                'product_valuation_history.fiat_denominator','product_valuation_history.index:split-check-only',
                'product_performance_metrics.performance_monthly','product_performance_metrics.performance_details'],
            'historicFxQualification':'Existing validated monthly ECB observations; not a new historic ECB source consultation'}
    elif kind=='wisdomtree':
        export_body=None
        if source.get('navHistoryTransport')=='official-xlsx-post':
            from wisdomtree_nav_export import download_with_identity as export_download,payload as export_payload,parse as export_parse
            url=f"https://www.wisdomtree.com/api/fund-history/{source['wisdomClassId']}/historical-data-export"
            request=export_payload(source,now)
            try:export_body,export_identity_body,export_transport=export_download(url,request,source['sourceUrl'])
            except Exception as error:raise ValueError('Official NAV XLSX POST failed at '+url+': '+str(error))from error
            urls.append(url);hashes[url]=hashlib.sha256(export_body).hexdigest()
            if capture:
                capture.mkdir(parents=True,exist_ok=True)
                (capture/(hashes[url]+'.xlsx.gz')).write_bytes(gzip.compress(export_body))
                (capture/(hashes[url]+'.request.json')).write_text(json.dumps(request,indent=2)+'\n')
        try:identity=wisdomtree_identity(document(source['sourceUrl'],supplied=export_identity_body if export_body is not None else None).decode(),isin)
        except Exception as error:raise ValueError('Official share identity failed at '+source['sourceUrl']+': '+str(error))from error
        if identity['fundCurrency']!=native or identity['useOfIncome']!='N/A':raise ValueError('Commodity currency/income changed')
        if export_body is not None:nav=export_parse(export_body,identity,source,now)
        else:
            url=f"https://www.wisdomtree.com/api/fund-history/{identity['wtClassID']}?view=navHistoryModal"
            nav=wisdomtree_nav(data(url),now)
        credit='WisdomTree'
        registry=source.get('calendarRegistry','src/data/automated-etf.json')
        if registry not in ['src/data/automated-etf.json','src/data/non-bond-etf-records.json','src/data/exposure-etf-expansion-records.json']:raise ValueError('Unqualified WisdomTree calendar registry')
        performance=json.loads((ROOT/registry).read_text())[isin]['performance']
        if performance['currency']!=native or performance['basis']!='fund':raise ValueError('WisdomTree shared calendar convention changed')
        calendar_proof={'calendarRegistry':registry,'calendarRegistryPerformanceHash':hashlib.sha256(json.dumps(performance,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'controlledInstrument':isin,'controlledFields':['ISIN','wtClassID','fundCurrency','useOfIncome','historical-data-export.NAV','historical-data-export.Date','calendarRegistry.performance'],'requestedStart':source['periodStart']+'-01','controlledCalendarYears':sorted(performance['years']),'publicProduct':{k:identity.get(k)for k in ['ISIN','wtClassID','fundCurrency','useOfIncome','inceptionDt','NAV_Date']},'calendarSource':{k:performance.get(k)for k in ['sourceUrl','sha256','asOf','checkedAt','method']},'calendarSourceConsultedByThisCollector':False,'navHistoryTransport':source.get('navHistoryTransport','nav-modal-json'),**({'actualNavTransport':export_transport}if export_body is not None else{})}
        years=performance['years']
    elif kind=='landg':
        from landg_nav_history import identity as landg_identity,parse as landg_parse,product_page as landg_page
        catalogue=data(source['catalogueUrl'])
        page=(landg_page(source['sourceUrl'])if document_fetch is download else document_fetch(source['sourceUrl']))
        url,facts,calendar_proof=landg_identity(document(source['sourceUrl'],supplied=page),catalogue,source,now)
        nav,calendar_proof=landg_parse(document(url),source,catalogue,calendar_proof,now)
        years=facts['performance']['years'];identity_from=source['identityFrom'];credit='L&G'
    elif kind=='vaneck':
        title=source.get('navTitle') or ('VanEck S&P Global Mining UCITS ETF - GDIG' if isin=='IE00BDFBTQ78' else None)
        if not title:raise ValueError('Unregistered VanEck exact NAV context')
        page=document(source['sourceUrl']).decode();soup=BeautifulSoup(page,'html.parser')
        if isin not in soup.get_text(' ',strip=True):raise ValueError('Wrong VanEck exact share')
        heading=soup.find('h1')
        normalize=lambda s:' '.join(s.split()).casefold()
        if not heading or normalize(title.rsplit(' - ',1)[0]) not in normalize(heading.get_text(' ',strip=True)):
            raise ValueError('Wrong VanEck fund heading')
        block=soup.find('ve-histopricesblock');ticker=soup.find('ve-fundticker')
        if not block or not ticker:raise ValueError('VanEck official NAV export discovery changed')
        query=urllib.parse.urlencode({'blockid':block['data-blockid'],'pageid':block['data-pageid'],'ticker':ticker.get_text(strip=True)})
        metadata=data('https://www.vaneck.com/Main/HistoPricesBlock/GetContent/?'+query)['data']
        if metadata['CurrencyName']!=native or metadata['Ticker']!=ticker.get_text(strip=True):raise ValueError('Wrong VanEck NAV context')
        path=metadata['DownloadUrl']
        slug=re.fullmatch(r'/[^/]+/[^/]+/investments/([^/]+)/?',urllib.parse.urlsplit(source['sourceUrl']).path)
        if not slug or path!='/ucits/investments/'+slug[1]+'/downloads/fundhistoprices/':raise ValueError('Unexpected NAV download target')
        if source.get('navCalendarSource')=='page-api':
            years,calendar_precision,calendar_context=vaneck_page_calendar(soup,isin,native,title,ticker.get_text(strip=True),now,data,document)
            nav=vaneck_nav(document('https://www.vaneck.com'+path),title,now)
            credit='VanEck'
            calendar_proof={'sourceNavMetadata':metadata,'incomeTreatment':'Reinvestment; distribution frequency None','officialPageCalendar':calendar_context}
        else:
            from collect_vaneck_etf import download_document, parse_calendar_performance
            from issuer_routes import vaneck_factsheet_candidates
            pdf,pdf_url=download_document({'sourceUrl':source['factsheetUrl'],'fallbackUrls':vaneck_factsheet_candidates(source['factsheetUrl'])[1:]},fetch=document_fetch)
            urls.append(pdf_url);hashes[pdf_url]=hashlib.sha256(pdf).hexdigest()
            if capture:(capture/(hashes[pdf_url]+'.bin.gz')).write_bytes(gzip.compress(pdf))
            facts=pdf_text(pdf)
            share_isins=set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',facts))
            base_currency=re.search(r'Base Currency\s+(USD|EUR|GBP)',facts)
            if 'ISIN' not in facts or share_isins!={isin} or not base_currency or base_currency[1]!=native:
                raise ValueError('VanEck factsheet exact share/currency not confirmed')
            if not re.search(r'Income Treatment\s+Reinvestment',facts) or not re.search(r'Distribution Frequency\s+None',facts):raise ValueError('VanEck income reinvestment not confirmed')
            convention=pdf_text(pdf,(190,410))
            if not re.search(r'Performance data is displayed on a Net\s+Asset Value basis, in Base Currency terms, with net income reinvested, net of fees',convention):
                raise ValueError('VanEck calendar currency/convention not confirmed')
            nav=vaneck_nav(document('https://www.vaneck.com'+path),title,now)
            performance,calendar_precision=parse_calendar_performance(facts,{'isin':isin,'currency':native},now)
            if not performance:raise ValueError('Official VanEck calendar layout changed')
            years=performance['years'];credit='VanEck'
            calendar_proof={'sourceNavMetadata':metadata,'incomeTreatment':'Reinvestment; distribution frequency None'}
    else:raise ValueError('Unregistered official NAV provider')
    if identity_from:nav={d:v for d,v in nav.items()if d>=identity_from}
    checked_nav=nav
    if kind=='vaneck'and source.get('navCalendarSource')=='page-api':
        # Qualify the history actually supplied to consumers. A complete year
        # requiring a December before periodStart cannot be calculated by them.
        checked_nav={d:v for d,v in nav.items()if d[:7]>=source['periodStart']}
        outside=[]
        for year,value in sorted(years.items()):
            if f'{int(year)-1}-12'>=source['periodStart']:continue
            item={'year':int(year),'scope':'outside supplied monthly history','requiredStart':f'{int(year)-1}-12','suppliedStart':source['periodStart']}
            try:
                proof=calendar_checks(nav,{year:value},calendar_precision,now,identity_from)
                item.update(qualified=bool(proof),checks=proof)
            except ValueError as error:
                item.update(qualified=False,reason=str(error))
            outside.append(item)
        if outside:calendar_proof['outsideSuppliedWindowChecks']=outside
    if source.get('returnWindowQualification')=='corroborated-calendars':
        if kind!='wisdomtree'or source.get('navHistoryTransport')!='official-xlsx-post':raise ValueError('Unqualified partial return-window policy')
        from wisdomtree_nav_export import qualify_return_windows
        checks,withheld=qualify_return_windows(checked_nav,performance,source,now)
        calendar_proof['historyUnqualifiedReturnWindows']=withheld
        calendar_proof['qualifiedCalendarYears']=[c['year']for c in checks]
        calendar_proof['qualificationScope']='Only independent corroborated return intervals; unresolved official daily/calendar differences remain refused. No price interpolation or threshold change.'
    else:checks=calendar_checks(checked_nav,years,calendar_precision,now,identity_from)
    fx=json.loads((ROOT/'src/data/monthly-fx.json').read_text())
    points,proof_rows=monthly(nav,native,source['currency'],source['periodStart'],now,fx)
    points=[[d,math.floor(v*10**source['precision']+.5)/10**source['precision']]for d,v in points]
    anniversary_points=points
    if anniversary_nav:
        prices,price_proofs=monthly(anniversary_nav,native,source['currency'],source['periodStart'],now,fx)
        by_month={row['date'][:7]:row for row in price_proofs}
        for row in proof_rows:
            price=by_month[row['date'][:7]]
            row.update(anniversaryValue=price['value'],anniversaryDate=price['date'])
        anniversary_points=[[d,math.floor(v*10**source['precision']+.5)/10**source['precision']]for d,v in prices]
    latest_values=anniversary_nav or nav
    eligible=[d for d in latest_values if d<now.date().isoformat()]
    latest=max(eligible)
    daily_policy=json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['series.dailyNav']
    if (now.date()-dt.date.fromisoformat(latest)).days>daily_policy['dataDays']:raise ValueError('Official latest NAV is stale')
    factor=1;fx_date=None
    if native!=source['currency']:
        from collect_ranking_sources import ECB
        ECB=ECB.replace('eurofxref-hist.xml','eurofxref-hist-90d.xml')
        xml=get_text(ECB,('application/xml','text/xml'),2_000_000)
        fx_date,factor=daily_nav_fx_factor(native,source['currency'],latest,xml)
        urls.append(ECB);hashes[ECB]=hashlib.sha256(xml.encode()).hexdigest()
    latest_level={'value':latest_values[latest]*factor,'asOf':latest,'currency':source['currency'],'isin':isin,
       'parser':'official-nav','valuationBasis':'fund-nav-price'if anniversary_nav else source['valuationBasis'],'nativeValue':latest_values[latest],'nativeCurrency':native,
       'fxAsOf':fx_date,'fxFactor':factor,'sourceUrl':urls[0],'sourceUrls':urls,'checkedAt':now.date().isoformat(),
       'method':'Valeur liquidative officielle publiée de la part exacte, hors distributions ; conversion BCE si nécessaire'if anniversary_nav else source['method']if source.get('navHistoryKind')else'Valeur liquidative officielle de la part exacte, revenus capitalisés ; conversion BCE si nécessaire',
       'maxAgeDays':daily_policy['dataDays'],'sha256':hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest()}
    observation_hashes={**hashes,**({'cachedCalendarPerformance':calendar_proof['calendarRegistryPerformanceHash']}if 'calendarRegistryPerformanceHash'in calendar_proof else{})}
    result={**source,'points':points,**({'anniversaryPoints':anniversary_points}if source.get('collectAnniversary') is not False else {'anniversaryAvailable':False}),**({'anniversaryValuationBasis':'fund-nav-price','anniversaryVariant':'Valeurs liquidatives publiées · hors distributions'}if anniversary_nav else{}),'checkedAt':now.date().isoformat(),
            'periodEnd':points[-1][0],'sourceUrls':urls,'sourceCredit':credit,
            'latestLevel':latest_level,'nativeValuationCurrency':native,'lastOfficialValuation':max(nav),
            'financialConvention':('exact-share issuer income-reinvested series scaled to same-date per-share NAV; no exchange-price claim'if source.get('navHistoryKind')else'exact-share accumulated net NAV; no exchange-price claim'),
            'calendarProof':{**calendar_proof,'checks':checks},
            **({key:calendar_proof[key]for key in ['historyExcludedMonths','anniversaryExcludedMonths','historyUnqualifiedReturnWindows']if key in calendar_proof}),
            'proofRows':proof_rows,
            'responseSha256':hashlib.sha256(json.dumps(observation_hashes,sort_keys=True).encode()).hexdigest(),
            'rawSourceHashes':hashes}
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    selection=parser.add_mutually_exclusive_group()
    selection.add_argument('--only',nargs='+',choices=[s['id'] for s in configurations()])
    parser.add_argument('--capture-dir',type=pathlib.Path)
    selection.add_argument('--missing-source-controls',action='store_true',help='Only configured official NAV identities without an ordinary monthly source-control record')
    parser.add_argument('--output',type=pathlib.Path,required=True)
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--migrate-quote-records',action='store_true',help='One-off reviewed migration; archive original quotes/configurations')
    args=parser.parse_args();now=dt.datetime.now(UTC);results=[]
    sources=[s for s in configurations()if not args.only or s['id']in args.only]
    if args.missing_source_controls:
        registered={r['id']:r for r in json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']}
        observed=json.loads((ROOT/'scripts/source-snapshots/monthly-collection-status.json').read_text()).get('series',{})
        sources=[s for s in sources if registered.get(s['id'],{}).get('parser')=='official-nav'and s['id']not in observed]
    scope={'requestedIds':args.only or [s['id']for s in sources],'expectedIds':[s['id']for s in sources]}
    if args.missing_source_controls:
        scope['selection']='configured-official-nav-without-ordinary-source-control'
        if not sources:scope['emptyReason']='No newly configured identity lacks an ordinary source-control record; existing failures are not retried or resolved by this check.'
    for source in sources:
        try:
            record=collect_one(source,now,capture=args.capture_dir)
            results.append({'id':source['id'],'status':'validated','record':record,**({'usageState':'partial','usageLimits':{'historyUnqualifiedReturnWindows':record['historyUnqualifiedReturnWindows']}}if record.get('historyUnqualifiedReturnWindows')else{})})
            print(source['id'],'validated',len(record['points']),'months',flush=True)
        except Exception as error:
            results.append({'id':source['id'],'status':'failed','reason':str(error)})
            print(source['id'],'FAILED',str(error),flush=True)
    report={'checkedAt':now.isoformat(),'scope':scope,'series':results};write_json_atomic(args.output,report)
    if args.apply and any(r['status']=='failed'for r in results):raise SystemExit(1)
    if args.apply:
        # Some existing histories belong to the isolated non-bond producer.
        # Keep their configuration, observations and latest level in that producer.
        groups = [
            ('scripts/monthly-automation.json','src/data/automated-etf-monthly.json','src/data/anniversary-levels.json','scripts/source-snapshots/monthly-automated.json'),
            ('scripts/non-bond-monthly-sources.json','src/data/non-bond-monthly-records.json','src/data/non-bond-levels.json','scripts/source-snapshots/non-bond-monthly-active.json'),
        ]
        loaded = [(paths, [json.loads((ROOT/p).read_text()) for p in paths]) for paths in groups]
        targets={}
        for paths, (config,current,levels,evidence) in loaded:
            for entry in config['series']:
                if entry['id'] in targets:raise ValueError('Duplicate producer ownership')
                targets[entry['id']]=(config,current,levels,evidence)
        archive={}
        for row in results:
            id=row['id'];config,current,levels,evidence=targets[id]
            record=row['record'];old=current.get(id)
            configured=next(s for s in config['series'] if s['id']==id)
            if (configured['isin'],configured['currency'])!=(record['isin'],record['currency']):
                raise ValueError('Wrong configured identity/currency')
            if old is None:
                # Only a declared, independently validated NAV lane may be new.
                # Existing quote ids/records are never removed or overwritten here.
                if (configured['parser']!='official-nav' or record['parser']!='official-nav'
                        or not record.get('calendarProof',{}).get('checks')):
                    raise ValueError('New official NAV lane lacks configuration or financial qualification')
                continue
            if old['isin']!=record['isin'] or old['currency']!=record['currency']:
                raise ValueError('Wrong replacement identity/currency')
            if old['parser']!='official-nav':
                if not args.migrate_quote_records:raise ValueError('Quote/NAV migration needs its explicit original-evidence archive')
                archive[id]={'record':old,'configuration':next(r for r in config['series']if r['id']==id),'latestLevel':levels.get(id)}
        if archive:
            archive_path=args.output.with_name('original-exchange-quote-records.json.gz')
            if archive_path.exists():
                original=json.loads(gzip.decompress(archive_path.read_bytes()))
                if any(original.get(id)!=prior for id,prior in archive.items()):
                    raise ValueError('Existing original archive differs; refuse replacement')
            else:archive_path.write_bytes(gzip.compress(json.dumps(archive,ensure_ascii=False).encode()))
        for row in results:
            id=row['id'];config,current,levels,evidence=targets[id]
            current[id]={k:v for k,v in row['record'].items()if k!='proofRows'}

            if row['record'].get('collectAnniversary') is not False:levels[id]=row['record']['latestLevel']
            evidence[id]=row['record']
            config['series']=[next(s for s in sources if s['id']==id)if s['id']==id else s for s in config['series']]
        for paths,values in loaded:
            for path,value in zip(paths,values):write_json_atomic(ROOT/path,value)
    if any(r['status']=='failed'for r in results):raise SystemExit(1)


if __name__=='__main__':main()
