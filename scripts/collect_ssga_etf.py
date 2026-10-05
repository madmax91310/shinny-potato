"""Collect State Street's embedded official JSON and dated XLSX holdings."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
from html.parser import HTMLParser
import io
import json
import os
import pathlib
import urllib.request
from urllib.parse import urljoin, urlsplit
import zipfile
import xml.etree.ElementTree as ET
from data_automation import UTC, get_text, number, reject, write_json_atomic
from apply_etf_collection import apply
from collect_etf_pilot import source_date

ROOT = pathlib.Path(__file__).resolve().parents[1]


class Inputs(HTMLParser):
    def __init__(self):
        super().__init__(); self.data={}; self.holdings=None
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag=='input' and attrs.get('value','').startswith('{'):
            key=attrs.get('id')
            if key in self.data:reject('Duplicate State Street component')
            self.data[key]=json.loads(attrs['value'])
        if tag=='a' and 'holdings-daily-emea' in attrs.get('href',''):
            self.holdings=attrs['href']


def date(value, now):
    months={'jan':'Jan','feb':'Feb','fév':'Feb','mar':'Mar','mär':'Mar','apr':'Apr','avr':'Apr','may':'May','mai':'May','jun':'Jun','juin':'Jun','jul':'Jul','juil':'Jul','aug':'Aug','août':'Aug','sep':'Sep','sept':'Sep','oct':'Oct','okt':'Oct','nov':'Nov','dec':'Dec','déc':'Dec','dez':'Dec'}
    parts=value.replace('-', ' ').split()
    if len(parts)!=3 or parts[1].lower().rstrip('.') not in months:reject('Unknown State Street date format')
    value=' '.join([parts[0],months[parts[1].lower().rstrip('.')],parts[2]])
    return source_date(dt.datetime.strptime(value,'%d %b %Y').strftime('%Y%m%d'),now)


def allocation(component, now):
    rows=[{'name':p['name']['value'],'weightPct':number(float(p['weight']['originalValue']),positive=False)} for p in component['attrArray']]
    if not rows or len({p['name']for p in rows})!=len(rows) or not 99<=sum(p['weightPct']for p in rows)<=101:
        reject('Incomplete State Street allocation')
    return {'asOf':date(component['asOfDateSimple'],now),'rows':rows,'basis':'fund'}


def parse_page(body, share, now):
    parser=Inputs();parser.feed(body)
    facts=parser.data['fund-quick-info']['attrs'];v=lambda k:facts[k]['value']
    if v('isin')!=share['isin'] or v('share-class-currency' if 'share-class-currency' in facts else 'base-fund-currency')!=share['currency']:
        reject('Wrong State Street ISIN or currency')
    ter=number(float(facts['total-expense-ratio']['originalValue']),positive=False)
    if ter>5:reject('Invalid State Street TER')
    aum=facts.get('share-class-assets-millions') or facts.get('aum')
    if not aum:reject('Missing State Street AUM')
    result={**share,'productId':share['isin'],'terPct':ter,'index':v('benchmark'),'distribution':v('fund-income-treatment'),
        'aum':{'amount':number(float(aum['originalValue'])),'currency':share['currency'],'scope':'share-class' if 'share-class-assets-millions' in facts else 'fund',
            'asOf':date(aum['asOfDateSimple'],now)}}
    if share.get('collectComposition'):
        for key,component in [('sectors','fund-sector-breakdown'),('countries','fund-geographical-breakdown')]:
            if component in parser.data:result[key]=allocation(parser.data[component],now)
    years={}
    calendar=parser.data.get('data-point-cal',{}).get('fund-perf-cal-net-total-mon',{})
    for key,point in calendar.get('attrs',{}).items():
        year=point['label']
        if key=='ytd':continue
        if not year.isdigit() or int(year)>=now.year or year in years:reject('Invalid State Street annual year')
        raw=point.get('originalValue')
        if raw in (None,'','-'):continue
        value=float(raw)
        if not -100<value<1000:reject('Invalid State Street annual return')
        years[year]=round(value,2)
    if years:result['performance']={'currency':share['currency'],'basis':'fund',
        'method':'calendar-year fund NAV net total return, income reinvested, fund fees included','years':dict(sorted(years.items()))}
    return result,parser.holdings


def get_xlsx(url):
    if urlsplit(url).hostname!='www.ssga.com' or '/library-content/products/fund-data/etfs/emea/' not in urlsplit(url).path:
        reject('Unexpected State Street download host')
    with urllib.request.urlopen(url,timeout=25)as response:
        b=response.read(6_000_001)
        if len(b)>6_000_000 or not b.startswith(b'PK'):reject('Invalid holdings XLSX response')
        return b


def xlsx_rows(body):
    ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(io.BytesIO(body))as book:
        if sum(i.file_size for i in book.infolist())>30_000_000:reject('Oversized holdings workbook')
        strings=[]
        if 'xl/sharedStrings.xml'in book.namelist():
            root=ET.fromstring(book.read('xl/sharedStrings.xml'))
            strings=[''.join(n.itertext())for n in root.findall('s:si',ns)]
        sheet=ET.fromstring(book.read('xl/worksheets/sheet1.xml'))
        rows=[]
        for row in sheet.findall('.//s:sheetData/s:row',ns):
            values=[]
            for cell in row.findall('s:c',ns):
                letters=''.join(c for c in cell.attrib['r']if c.isalpha());index=0
                for c in letters:index=index*26+ord(c)-64
                while len(values)<index:values.append(None)
                if cell.find('s:f',ns)is not None:reject('Formula in holdings workbook')
                val=cell.find('s:v',ns);kind=cell.attrib.get('t')
                value=strings[int(val.text)]if kind=='s' and val is not None else ''.join(cell.find('s:is',ns).itertext())if kind=='inlineStr'else val.text if val is not None else None
                values[index-1]=value
            rows.append(values)
        return rows


def parse_holdings(body, share, now):
    rows=xlsx_rows(body);metadata={r[0]:r[1]for r in rows[:5]if len(r)>1 and r[0]}
    if metadata.get('ISIN:')!=share['isin']:reject('Wrong State Street holdings ISIN')
    stamp=date(metadata['Holdings As Of:'].replace('-',' '),now)
    header=next((i for i,r in enumerate(rows)if 'Percent of Fund'in r and 'Security Name'in r),None)
    if header is None:reject('Missing State Street holdings header')
    columns=rows[header];weights=[];holdings=[]
    for row in rows[header+1:]:
        if len(row)<len(columns) or not row[columns.index('ISIN')] or row[columns.index('ISIN')]=='Unassigned':continue
        try:w=float(row[columns.index('Percent of Fund')])
        except (TypeError,ValueError):reject('Invalid State Street holding weight')
        number(w,positive=False)
        weights.append(w);holdings.append({'name':row[columns.index('Security Name')],'isin':row[columns.index('ISIN')],'weightPct':w})
    if not holdings or not 99<=sum(weights)<=101:reject('Incomplete State Street holdings download')
    return {'asOf':stamp,'basis':'fund','rows':sorted(holdings,key=lambda p:-p['weightPct'])[:10]}


def collect(config,now=None,fetch=get_text,download=get_xlsx):
    now=now or dt.datetime.now(UTC)
    def one(share):
        result,path=parse_page(fetch(share['sourceUrl'],('text/html',),6_000_000),share,now)
        if share.get('collectComposition'):
            if not path:reject('Missing State Street holdings download')
            url=urljoin(share['sourceUrl'],path)
            result['holdings']=parse_holdings(download(url),share,now);result['holdings']['sourceUrl']=url
        return result
    with ThreadPoolExecutor(max_workers=3)as pool:shares=list(pool.map(one,config['instruments']))
    return {'schemaVersion':1,'checkedAt':now.isoformat(),'shares':shares,'status':'validated'}


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--baseline',required=True,type=pathlib.Path);p.add_argument('--output',required=True,type=pathlib.Path);p.add_argument('--apply',action='store_true');args=p.parse_args()
    report=collect(json.loads((ROOT/'scripts/ssga-etf.json').read_text()));write_json_atomic(args.output,report)
    if args.apply:report['status']='applied'if apply(report,ROOT/'src/data/automated-etf.json',json.loads(args.baseline.read_text()))else'unchanged'
    write_json_atomic(args.output,report);message=f"{len(report['shares'])} parts State Street validées : {report['status']}."
    print(message)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'],'a')as h:h.write('\n## State Street\n\n'+message+'\n')
if __name__=='__main__':main()
