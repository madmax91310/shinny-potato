"""Repair four existing fund histories with explicitly identified official NAV series.

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
from bs4 import BeautifulSoup
from data_automation import UTC, get_json, get_text, write_json_atomic
from issuer_documents import download, pdf_text
from issuer_nav_history import (blackrock_nav, calendar_checks, dws_nav, monthly,
                                vaneck_nav, wisdomtree_identity, wisdomtree_nav)

ROOT = pathlib.Path(__file__).resolve().parents[1]
IDS = ['etfEqualWeight', 'etfIE000U9ODG19', 'etfIE00BDFBTQ78', 'etfGB00B15KXQ89']


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
            sourceUrl='https://www.wisdomtree.com/ie/products/commodities/wisdomtree-copper'),
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
            **extras[id]}.items()})
    remainder = json.loads((ROOT/'scripts/official-nav-remainder-sources.json').read_text())
    return result + remainder


def collect_one(source, now, json_fetch=get_json, document_fetch=download, capture=None):
    urls, hashes = [], {}
    def document(url):
        body=document_fetch(url);urls.append(url);hashes[url]=hashlib.sha256(body).hexdigest()
        if capture:
            capture.mkdir(parents=True,exist_ok=True)
            (capture/(hashes[url]+'.bin.gz')).write_bytes(gzip.compress(body))
        return body
    def data(url):
        value=json_fetch(url);body=json.dumps(value,sort_keys=True,separators=(',',':')).encode()
        urls.append(url);hashes[url]=hashlib.sha256(body).hexdigest()
        if capture:
            capture.mkdir(parents=True,exist_ok=True)
            (capture/(hashes[url]+'.json.gz')).write_bytes(gzip.compress(body))
        return value
    kind=source['navProvider'];isin=source['isin'];native=source['navCurrency']
    identity_from=source.get('identityFrom');calendar_precision=2;calendar_proof={}
    if kind=='blackrock':
        query=urllib.parse.urlencode(dict(appSubType='ISHARES',appType='PRODUCT_PAGE',component='keyFundFacts,performance',locale='en_GB',portfolioId=source['productId'],targetSite='ishares-uk',userType='individual',excludeContent='true',includeConfig='true'))
        body=data(source['sourceUrl']+'?'+query);parsed=blackrock_nav(body,isin,native,now)
        if parsed['distribution']!='Accumulating':raise ValueError('Raw NAV does not qualify a distributing share')
        nav=parsed['nav'];years=parsed['years']
        # With accumulation the official daily NAV and income-reinvested chart must agree.
        checks=calendar_checks(parsed['totalReturn'],years,2,now,identity_from)
        calendar_checks(nav,years,2,now,identity_from)
        calendar_proof={'officialIncomeReinvestedChartChecks':checks,'shareInception':parsed['inception']}
        credit='BlackRock iShares'
    elif kind=='dws':
        from collect_dws_etf import parse_product
        body=data(source['sourceUrl']);facts=parse_product(body,{'isin':isin,'currency':native,'sourceUrl':source['sourceUrl']},now)
        if facts['distribution']!='Capitalizing':raise ValueError('DWS NAV reinvestment not qualified')
        url=source['sourceUrl'].rsplit('/',1)[0]+'/historicaldata/download?'+urllib.parse.urlencode({'startDate':'2015-06-26','endDate':now.date().isoformat(),'includeTax':'false'})
        nav=dws_nav(document(url),isin,native,now);years=facts['performance']['years'];credit='DWS Xtrackers'
        notes=' '.join(t.get('text','') for tab in body['pdpResult']['pageSections']['performanceSection']['performanceTables']['tabs'] if tab['header']=='Calendar year' for t in tab.get('disclaimerHtml',[]))
        if '26 June 2015' not in notes or 'Luxembourg' not in notes:raise ValueError('DWS merger identity evidence changed')
        calendar_proof={'identityFrom':identity_from,'mergerNote':notes}
    elif kind=='wisdomtree':
        identity=wisdomtree_identity(document(source['sourceUrl']).decode(),isin)
        if identity['fundCurrency']!=native or identity['useOfIncome']!='N/A':raise ValueError('Commodity currency/income changed')
        url=f"https://www.wisdomtree.com/api/fund-history/{identity['wtClassID']}?view=navHistoryModal"
        nav=wisdomtree_nav(data(url),now);credit='WisdomTree'
        calendar_proof={'publicProduct':{k:identity.get(k)for k in ['ISIN','wtClassID','fundCurrency','useOfIncome','inceptionDt','NAV_Date']}}
        years=json.loads((ROOT/'src/data/automated-etf.json').read_text())[isin]['performance']['years']
    elif kind=='vaneck':
        page=document(source['sourceUrl']).decode();soup=BeautifulSoup(page,'html.parser')
        if isin not in soup.get_text(' ',strip=True):raise ValueError('Wrong VanEck exact share')
        block=soup.find('ve-histopricesblock');ticker=soup.find('ve-fundticker')
        if not block or not ticker:raise ValueError('VanEck official NAV export discovery changed')
        query=urllib.parse.urlencode({'blockid':block['data-blockid'],'pageid':block['data-pageid'],'ticker':ticker.get_text(strip=True)})
        metadata=data('https://www.vaneck.com/Main/HistoPricesBlock/GetContent/?'+query)['data']
        if metadata['CurrencyName']!=native or metadata['Ticker']!=ticker.get_text(strip=True):raise ValueError('Wrong VanEck NAV context')
        path=metadata['DownloadUrl']
        if not path.startswith('/ucits/investments/mining-etf/downloads/fundhistoprices/'):raise ValueError('Unexpected NAV download target')
        from collect_vaneck_etf import download_document
        from issuer_routes import vaneck_factsheet_candidates
        pdf,pdf_url=download_document({'sourceUrl':source['factsheetUrl'],'fallbackUrls':vaneck_factsheet_candidates(source['factsheetUrl'])[1:]},fetch=document_fetch)
        urls.append(pdf_url);hashes[pdf_url]=hashlib.sha256(pdf).hexdigest()
        if capture:(capture/(hashes[pdf_url]+'.bin.gz')).write_bytes(gzip.compress(pdf))
        facts=pdf_text(pdf)
        if isin not in facts or not re.search(r'Income Treatment\s+Reinvestment',facts) or not re.search(r'Distribution Frequency\s+None',facts):raise ValueError('Mining income reinvestment not confirmed')
        nav=vaneck_nav(document('https://www.vaneck.com'+path),'VanEck S&P Global Mining UCITS ETF - GDIG',now)
        row=re.search(r'(?:^|\s)VanEck S&P Global Mining UCITS ETF\s+((?:-?\d+(?:\.\d+)?\s+){6}-?\d+(?:\.\d+)?)\s*$',facts,re.M)
        if not row:raise ValueError('Official Mining calendar layout changed')
        tokens=row[1].split();years={str(2019+i):float(v)for i,v in enumerate(tokens)}
        calendar_precision={str(2019+i):len(v.split('.')[1])if'.'in v else 0 for i,v in enumerate(tokens)};credit='VanEck'
        calendar_proof={'sourceNavMetadata':metadata,'incomeTreatment':'Reinvestment; distribution frequency None'}
    else:raise ValueError('Unregistered official NAV provider')
    if identity_from:nav={d:v for d,v in nav.items()if d>=identity_from}
    checks=calendar_checks(nav,years,calendar_precision,now,identity_from)
    fx=json.loads((ROOT/'src/data/monthly-fx.json').read_text())
    points,proof_rows=monthly(nav,native,source['currency'],source['periodStart'],now,fx)
    points=[[d,math.floor(v*10**source['precision']+.5)/10**source['precision']]for d,v in points]
    eligible=[d for d in nav if d<now.date().isoformat()]
    latest=max(eligible)
    if (now.date()-dt.date.fromisoformat(latest)).days>7:raise ValueError('Official latest NAV is stale')
    factor=1;fx_date=None
    if native!=source['currency']:
        if (native,source['currency'])!=('USD','EUR'):raise ValueError('Unqualified daily NAV conversion')
        from collect_ranking_sources import ECB,ecb_daily_usd
        ECB=ECB.replace('eurofxref-hist.xml','eurofxref-hist-90d.xml')
        xml=get_text(ECB,('application/xml','text/xml'),2_000_000)
        rates={d.isoformat():v for d,v in ecb_daily_usd(xml).items()};fx_date=max(d for d in rates if d<=latest)
        if (dt.date.fromisoformat(latest)-dt.date.fromisoformat(fx_date)).days>4:raise ValueError('Official daily NAV/FX dates incompatible')
        factor=1/rates[fx_date];urls.append(ECB);hashes[ECB]=hashlib.sha256(xml.encode()).hexdigest()
    latest_level={'value':nav[latest]*factor,'asOf':latest,'currency':source['currency'],'isin':isin,
       'parser':'official-nav','valuationBasis':source['valuationBasis'],'nativeValue':nav[latest],'nativeCurrency':native,
       'fxAsOf':fx_date,'fxFactor':factor,'sourceUrl':urls[0],'sourceUrls':urls,'checkedAt':now.date().isoformat(),
       'method':'Valeur liquidative officielle de la part exacte, revenus capitalisés ; conversion BCE si nécessaire',
       'maxAgeDays':7,'sha256':hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest()}
    result={**source,'points':points,'anniversaryPoints':points,'checkedAt':now.date().isoformat(),
            'periodEnd':points[-1][0],'sourceUrls':urls,'sourceCredit':credit,
            'latestLevel':latest_level,'nativeValuationCurrency':native,'lastOfficialValuation':max(nav),
            'financialConvention':'exact-share accumulated net NAV; no exchange-price claim',
            'calendarProof':{**calendar_proof,'checks':checks},'proofRows':proof_rows,
            'responseSha256':hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest(),
            'rawSourceHashes':hashes}
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--only',nargs='+',choices=[s['id'] for s in configurations()])
    parser.add_argument('--capture-dir',type=pathlib.Path)
    parser.add_argument('--output',type=pathlib.Path,required=True)
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--migrate-quote-records',action='store_true',help='One-off reviewed migration; archive original quotes/configurations')
    args=parser.parse_args();now=dt.datetime.now(UTC);results=[]
    sources=[s for s in configurations()if not args.only or s['id']in args.only]
    for source in sources:
        try:
            record=collect_one(source,now,capture=args.capture_dir)
            results.append({'id':source['id'],'status':'validated','record':record})
            print(source['id'],'validated',len(record['points']),'months',flush=True)
        except Exception as error:
            results.append({'id':source['id'],'status':'failed','reason':str(error)})
            print(source['id'],'FAILED',str(error),flush=True)
    report={'checkedAt':now.isoformat(),'series':results};write_json_atomic(args.output,report)
    if args.apply and any(r['status']=='failed'for r in results):raise SystemExit(1)
    if args.apply:
        path=ROOT/'src/data/automated-etf-monthly.json';current=json.loads(path.read_text())
        config_path=ROOT/'scripts/monthly-automation.json';config=json.loads(config_path.read_text())
        if args.migrate_quote_records:
            archive={s['id']:{'record':current[s['id']],'configuration':next(r for r in config['series']if r['id']==s['id'])}for s in sources}
            archive_path=args.output.with_name('original-exchange-quote-records.json.gz')
            if archive_path.exists():
                original=json.loads(gzip.decompress(archive_path.read_bytes()))
                for id,prior in archive.items():
                    if prior['record']['parser']!='official-nav' and original.get(id)!=prior:
                        raise ValueError('Existing original archive differs; refuse replacement')
            else:
                archive_path.write_bytes(gzip.compress(json.dumps(archive,ensure_ascii=False).encode()))
        for row in results:
            if row['status']!='validated':continue
            id=row['id'];record={k:v for k,v in row['record'].items()if k not in ['proofRows']}
            old=current.get(id)
            if old and old['isin']!=record['isin']:raise ValueError('Wrong replacement instrument')
            if old and old['currency']!=record['currency']:raise ValueError('Wrong replacement output currency')
            if old and old['parser']!='official-nav' and not args.migrate_quote_records:raise ValueError('Quote/NAV migration needs its explicit original-evidence archive')
            current[id]=record
            config['series']=[next(s for s in sources if s['id']==id)if s['id']==id else s for s in config['series']]
        write_json_atomic(path,current);write_json_atomic(config_path,config)
    if any(r['status']=='failed'for r in results):raise SystemExit(1)


if __name__=='__main__':main()
