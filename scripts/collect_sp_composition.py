"""S&P exact-index composition: native tables plus checked printed sector labels.

The PDF's sector legend uses outlined glyphs, absent from pdftotext. Two render
resolutions must yield identical named weights. Ambiguous OCR rejects the entire
composition and preserves the prior dated snapshot. Calendar returns remain separate.
"""
import datetime as dt
import pathlib
import re
import subprocess
import tempfile
from data_automation import reject
from issuer_documents import download, pdf_text, proof, document_date, validated_rows
from collect_index_documents import COUNTRY_LABELS, SECTOR_LABELS

SECTORS = ['Financials','Industrials','Utilities','Materials','Health Care','Communication Services',
           'Energy','Consumer Staples','Real Estate','Information Technology','Consumer Discretionary']

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
    body=fetch(config['sourceUrl']); text=pdf_text(body)
    pages=text.split('\f')
    matches=[i+1 for i,p in enumerate(pages)if 'Sector* Breakdown' in p]
    if len(matches)!=1:reject('S&P sector page missing/ambiguous')
    sectors=printed_legend(body,matches[0])
    # Pass already-qualified readings back through the same parser for native-table checks.
    legend='\n'.join(f"{r['name']} {r['weightPct']}%"for r in sectors)
    facts=parse_composition(text,legend,legend,config,now)
    facts['source']={'url':config['sourceUrl'],'checkedAt':now.date().isoformat(),'sha256':proof(body),'label':'Composition officielle S&P DJI automatisée'}
    return facts
