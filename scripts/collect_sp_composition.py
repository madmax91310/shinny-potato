"""S&P exact-index composition: native tables plus checked printed sector labels.

The PDF's sector legend uses outlined glyphs, absent from pdftotext. Two render
resolutions must yield identical named weights. Ambiguous OCR rejects the entire
composition and preserves the prior dated snapshot. Calendar returns remain separate.
"""
import datetime as dt
import gzip
import json
import math
import pathlib
import re
import subprocess
import tempfile
import urllib.error
from data_automation import reject
from issuer_documents import download, pdf_text, proof, document_date, validated_rows
from collect_index_documents import COUNTRY_LABELS, SECTOR_LABELS

SECTORS = ['Financials','Industrials','Utilities','Materials','Health Care','Communication Services',
           'Energy','Consumer Staples','Real Estate','Information Technology','Consumer Discretionary']

def parse_public_data(body, config, now):
    """The public page's numerical data, with effective dates rather than fetch dates."""
    if body[:2] == b'\x1f\x8b': body = gzip.decompress(body)
    if len(body) > 4_000_000: reject('S&P JSON exceeds size limit')
    data = json.loads(body)
    detail = data['indexDetailHolder']['indexDetail']
    index_id = config['compositionIndexId']
    if data.get('status') is not True or data['indexDetailHolder'].get('status') is not True:
        reject('S&P data service unavailable')
    if detail['indexId'] != index_id or detail['indexName'] != config['compositionDataName'] or detail['currencyCode'] != config['returnCurrency']:
        reject('Wrong S&P exact composition identity')
    characteristics = data['indexCharacteristics']
    if characteristics['indexId'] != index_id: reject('S&P characteristics identity mismatch')
    count = characteristics['constituentsCount']
    if isinstance(count, bool) or not isinstance(count, int) or count <= 0: reject('Invalid S&P count')
    def effective(value):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value): reject('Invalid S&P effective date')
        # S&P serializes US Eastern midnight; UTC retains the same calendar day.
        return document_date(dt.datetime.fromtimestamp(value / 1000, dt.timezone.utc).date().isoformat(), now)
    stamp = effective(characteristics['effectiveDate'])
    if document_date(characteristics['formattedFetchedDate'], now) != stamp: reject('S&P effective date mismatch')
    def rows(holder, key):
        block = data[holder]
        if block.get('status') is not True or not block.get(key): reject('S&P composition block unavailable')
        if any(effective(row['effectiveDate']) != stamp for row in block[key]): reject('S&P mixed snapshot dates')
        return block[key]
    def weight(value, factor=1):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value): reject('Invalid S&P weight')
        return value * factor
    country_data = rows('idsIndexCountryBreakdownHolder', 'indexCountryBreakdown')
    if any(r['indexId'] != index_id or isinstance(r['stockCount'], bool) or not isinstance(r['stockCount'], int) or r['stockCount'] < 0 for r in country_data): reject('S&P country identity/count mismatch')
    if sum(r['stockCount'] for r in country_data) != count: reject('S&P country counts disagree')
    countries = validated_rows([{'name':r['countryName'], 'weightPct':weight(r['indexWeight'])} for r in country_data])
    sector_data = rows('indexSectorBreakdownHolder', 'indexSectorBreakdown')
    if any(r['sectorDescription'] not in SECTORS or r['gicsTypeID'] != 1 for r in sector_data): reject('S&P sector classification changed')
    sectors = validated_rows([{'name':r['sectorDescription'], 'weightPct':weight(r['marketCapitalPercentage'],100)} for r in sector_data])
    holding_data = rows('constituentHolder', 'constituents')
    if len(holding_data) != 10: reject('S&P top-ten incomplete')
    holdings = validated_rows([{'name':r['instrumentName'], 'weightPct':weight(r['indexWeight'],100)} for r in holding_data], complete=False)
    top = weight(characteristics['topNConstituentWeight'])
    if abs(sum(r['weightPct'] for r in holdings)-top) > 0.02: reject('S&P top-ten total mismatch')
    return {'index':config['name'], 'asOf':stamp, 'constituents':count, 'sectorClassification':'GICS', 'topWeight':top,
            'countries':[[COUNTRY_LABELS.get(r['name'],r['name']),round(r['weightPct'],4)] for r in countries],
            'sectors':[[SECTOR_LABELS.get(r['name'],r['name']),round(r['weightPct'],4)] for r in sectors],
            'holdings':[[r['name'],round(r['weightPct'],4)] for r in holdings],
            'source':{'url':config['compositionDataUrl'],'checkedAt':now.date().isoformat(),'sha256':proof(body),'label':'Données publiques numériques S&P DJI'},
            'provenance':'Données publiques utilisées par la page S&P DJI de l’indice exact. Dates d’effet, identités, classification, totaux des pays/secteurs et poids cumulé du top dix contrôlés. Rendements conservés séparément.'}

def parse_legend(text):
    found=[]
    for line in text.splitlines():
        for label in SECTORS:
            # OCR sometimes joins the two words; punctuation/chart bullets are ignored.
            pattern=r'(?<![A-Za-z])'+r'\s*'.join(label.split())+r'\s+(\d+(?:\.\d+)?)\s*%\s*$'
            match=re.search(pattern,line,re.I)
            if match:found.append({'name':label,'weightPct':float(match[1])})
    if len(found)<6 or len({r['name']for r in found})!=len(found):reject('S&P sector legend incomplete/duplicated')
    validated_rows(found)
    if abs(sum(r['weightPct']for r in found)-100)>0.6:reject('S&P sector rounding total invalid')
    return sorted(found,key=lambda r:r['name'])

def printed_legend(body, page):
    readings=[]
    with tempfile.TemporaryDirectory()as directory:
        pdf=pathlib.Path(directory)/'source.pdf';pdf.write_bytes(body)
        for resolution in [250,300]:
            image=pathlib.Path(directory)/f'page-{resolution}'
            subprocess.run(['pdftoppm','-f',str(page),'-l',str(page),'-r',str(resolution),'-png','-singlefile',str(pdf),str(image)],check=True,capture_output=True,timeout=45)
            output=subprocess.run(['tesseract',str(image)+'.png','stdout','--psm','3'],check=True,capture_output=True,text=True,timeout=45)
            readings.append(parse_legend(output.stdout))
    if readings[0]!=readings[1]:reject('S&P sector readings disagree across resolutions')
    return readings[0]

def parse_composition(text, legend_a, legend_b, config, now):
    title=config['compositionTitle']
    if text.count(title)<2 or config['expectedIndex'] not in text:reject('Wrong S&P exact index identity')
    dates=re.findall(r'AS OF ([A-Z]+ \d{1,2}, 20\d{2})',text)
    if not dates or len(set(dates))!=1:reject('S&P composition date missing/ambiguous')
    stamp=document_date(dt.datetime.strptime(dates[0],'%B %d, %Y').date().isoformat(),now)
    counts=re.findall(r'NUMBER OF CONSTITUENTS\s+(\d+)',text)
    if len(counts)!=1:reject('S&P constituent count missing')
    count=int(counts[0]); countries=[]; total_count=0
    if 'Country/Region Breakdown' not in text:reject('S&P country table absent')
    block=text.split('Country/Region Breakdown',1)[1].split('Tickers',1)[0]
    for line in block.splitlines():
        match=re.fullmatch(r'\s*([A-Za-z ,]+?)\s{2,}(\d+)\s+([\d,.]+)\s+(\d+(?:\.\d+)?)\s*',line)
        if match:
            countries.append({'name':match[1].strip(),'weightPct':float(match[4])});total_count+=int(match[2])
    if total_count!=count:reject('S&P country counts do not match index count')
    validated_rows(countries)
    sectors_a=parse_legend(legend_a);sectors_b=parse_legend(legend_b)
    if sectors_a!=sectors_b:reject('S&P sector readings disagree')
    tops=re.findall(r'WEIGHT TOP 10 CONSTITUENTS \[%\]\s+(\d+(?:\.\d+)?)',text)
    if len(tops)!=1:reject('S&P top-ten total missing')
    return {'index':config['name'],'asOf':stamp,'constituents':count,'sectorClassification':'GICS',
            'topWeight':float(tops[0]),'countries':[[COUNTRY_LABELS.get(r['name'],r['name']),r['weightPct']]for r in countries],
            'sectors':[[SECTOR_LABELS.get(r['name'],r['name']),r['weightPct']]for r in sorted(sectors_a,key=lambda r:-r['weightPct'])],
            'holdings':[], 'provenance':'Publication officielle de l’indice exact ; pays de domiciliation et comptage extraits des tables. Secteurs : légende imprimée lue à deux résolutions concordantes, total contrôlé. Poids individuels des principales lignes non publiés ; aucune substitution par le portefeuille ETF. Rendements conservés dans leur registre séparé.'}

def collect(config, now, fetch=download):
    if config.get('compositionDataUrl'):
        if fetch is download:
            try:
                body = download(config['compositionDataUrl'], headers={
                    'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                    'Accept':'application/json', 'Accept-Language':'en-GB,en;q=0.9',
                    'Referer':config['compositionPageUrl']})
            except (urllib.error.URLError, TimeoutError) as error:
                from sp_public_feed import read_response
                try:
                    return read_response(config, now)
                except Exception as feed_error:
                    reject(f'S&P direct download failed: {error}; official handoff failed: {feed_error}')
        else: body = fetch(config['compositionDataUrl'])
        return parse_public_data(body, config, now)
    try:
        body=fetch(config['sourceUrl'])
    except urllib.error.HTTPError as error:
        if error.code != 403 or fetch is not download:
            raise
        # Same public PDF, using normal public-document headers as in public_page.
        # This never accepts a regional page or skips identity/date validation.
        body=download(config['sourceUrl'], headers={
            'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Accept':'application/pdf', 'Accept-Language':'en-GB,en;q=0.9'})
    text=pdf_text(body)
    pages=text.split('\f')
    matches=[i+1 for i,p in enumerate(pages)if 'Sector* Breakdown' in p]
    if len(matches)!=1:reject('S&P sector page missing/ambiguous')
    sectors=printed_legend(body,matches[0])
    # Pass already-qualified readings back through the same parser for native-table checks.
    legend='\n'.join(f"{r['name']} {r['weightPct']}%"for r in sectors)
    facts=parse_composition(text,legend,legend,config,now)
    facts['source']={'url':config['sourceUrl'],'checkedAt':now.date().isoformat(),'sha256':proof(body),'label':'Composition officielle S&P DJI automatisée'}
    return facts
