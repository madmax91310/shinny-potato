"""Refresh explicitly published characteristics; an accessible URL is never evidence of a field."""
import argparse
import datetime as dt
import hashlib
import html
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from data_automation import UTC, write_json_atomic
from issuer_documents import download, pdf_text
ROOT=Path(__file__).resolve().parents[1]
FIELDS=('distribution','domicile','replicationMethod','pea','currencyHedge','listings')
# Same threshold as the active-field freshness check (report-asset-fields.mjs): a static
# characteristic missed by one transient source failure is not an incident before then.
RENEWAL_GRACE_DAYS=7
# Legal domicile and replication method only change through a prospectus amendment or a
# fund merger: one unavailable issuer page must not raise a daily incident. They are
# still re-read daily, published as soon as observed, and must be renewed within a year.
STATIC_RENEWAL_DAYS={'domicile':365,'replicationMethod':365}
# Any language of a regional factsheet (fr/en, fr/fr...) or the UCITS one. The browser
# helper only reads English regional documents, so /fr/fr/ is read as /fr/en/.
VANECK_FACTSHEET=re.compile(r'https://www\.vaneck\.com/(?:ucits|([a-z]{2})/[a-z]{2})/library/fact-sheets/([a-z0-9]+-fact-sheet\.pdf)')

def fetch_document(url,fetch=download):
    """Returns (body, url actually read)."""
    try:
        return fetch(url),url
    except ValueError as error:
        # VanEck answers its factsheet URLs with a regional consent page. Like
        # collect_vaneck_etf.py, complete the gate in a browser, then try the same
        # factsheet on the Dutch and UK gates, which US-based runners can pass.
        match=VANECK_FACTSHEET.fullmatch(url)
        if fetch is not download or 'Expected official PDF' not in str(error) or not match:raise
        region,name=match.groups()
        first=f'https://www.vaneck.com/{region}/en/library/fact-sheets/{name}' if region else url
        candidates=list(dict.fromkeys([first,*(f'https://www.vaneck.com/{region}/en/library/fact-sheets/{name}' for region in ('nl','uk'))]))
        failures=[]
        for candidate in candidates:
            try:result=subprocess.run(['node',str(Path(__file__).with_name('download-vaneck-document.mjs')),candidate],capture_output=True,timeout=120)
            except subprocess.TimeoutExpired:failures.append(f'{candidate}: timeout');continue
            if not result.returncode:return result.stdout,candidate
            failures.append(f"{candidate}: {result.stderr.decode('utf-8',errors='replace').strip().splitlines()[-1:]}")
        raise ValueError(f"{error}; browser initialisation failed: {' | '.join(failures)[-700:]}")

def renewal_days(field):return STATIC_RENEWAL_DAYS.get(field,RENEWAL_GRACE_DAYS)

def renewal_overdue(field_record,now,field=None):
    try:return (now.date()-dt.date.fromisoformat(field_record.get('checkedAt','')[:10])).days>renewal_days(field)
    except (TypeError,ValueError):return True

def text_of(body):
    if body.startswith(b'%PDF-'):return pdf_text(body)
    text=body.decode('utf-8')
    text=re.sub(r'<(?:script|style)\b[^>]*>.*?</(?:script|style)>','',text,flags=re.S|re.I)
    return html.unescape(re.sub(r'<[^>]+>','\n',text))

def parse_text(text,isin):
    # Never attribute a comparison table, another share, navigation or footer to this ISIN.
    identities=set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',text))
    if identities!={isin}:raise ValueError('Missing or multiple exact-share identities in metadata document')
    text=re.sub(r'[ \t\r]+',' ',text)
    patterns={
      'distribution':r'(?:Use of (?:Income|Profits)|Income Treatment|Distribution Policy|Affectation des r[ée]sultats|Politique de distribution)\s*[:\n]?\s*(Accumulating|Distributing|Capitalisation|Distribution|Reinvestment)\b',
      'domicile':r'(?:Fund Domicile|Domicile|Domiciliation|Domicile du fonds)\s*[:\n]?\s*(Ireland|Irlande|Luxembourg|Germany|Allemagne|France|Jersey|(?:The )?Netherlands)\b',
      'replicationMethod':r'(?:Replication (?:Method|methodology)|M[ée]thode de r[ée]plication|Replication|R[ée]plication)\s*[:\n]?\s*(Physical(?:\s*\((?:Full replication|Optimised sampling)\))?|Synthetic|Physique|Synth[ée]tique|Direct Replication|Indirect\s*\(Swap Based\))\b',
      'pea':r'(?:PEA eligibility|Eligible PEA|[ÉE]ligibilit[ée] (?:au )?PEA|[ÉE]ligible (?:au )?PEA)\s*[:\n]?\s*(Yes|No|Oui|Non)\b',
      'currencyHedge':r'(?:Currency Hedged|Currency Hedge|Couverture de change|Couvert contre le risque de change)\s*[:\n]?\s*(Yes|No|Oui|Non)\b',
    }
    result={}
    for field,pattern in patterns.items():
        found=set(re.findall(pattern,text,re.I))
        if len(found)>1:raise ValueError('Conflicting explicit metadata: '+field)
        if found:
            value=found.pop()
            # VanEck factsheets: "Income Treatment Reinvestment" and "Domicile The Netherlands".
            value={'Reinvestment':'Accumulating','The Netherlands':'Netherlands'}.get(value,value)
            result[field]=value.lower() in ('yes','oui') if field in ('pea','currencyHedge') else value
    # VanEck factsheets print "Product Structure Physical (Full" and wrap "Replication)" onto
    # the next line, after text from the description column.
    if 'replicationMethod' not in result:
        found={(kind+(f' ({scope} {method.lower()})' if scope else '')) for kind,scope,method in re.findall(r'^Product Structure (Physical|Synthetic)(?: \((Full|Optimi[sz]ed)\b[^\n]*\n\s*(Replication|Sampling)\))?',text,re.M)}
        if len(found)>1:raise ValueError('Conflicting explicit metadata: replicationMethod')
        if found:result['replicationMethod']=found.pop()
    if 'pea' not in result:
        badges={line.strip().lower() for line in text.splitlines()}
        positive=bool(badges & {'éligible au pea','eligible au pea'})
        negative=bool(badges & {'non éligible au pea','non eligible au pea'})
        if positive and negative:raise ValueError('Conflicting PEA badge statements')
        if positive or negative:result['pea']=positive
    return result

def parse_json(body,isin):
    doc=json.loads(body)
    try:
        points=doc['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        if points['isin']['value']!=isin:raise ValueError('Wrong exact-share metadata')
    except KeyError:
        raise ValueError('No qualified structured metadata parser for this endpoint')
    mapping={'useOfProfitsCode':'distribution','domicile':'domicile','productStructure':'replicationMethod'}
    return {field:points[key]['value'] for key,field in mapping.items() if isinstance(points.get(key,{}).get('value'),str) and points[key]['value']}

def parse_listings(body,source,url,checked):
    if 'www.justetf.com/' in url:return []  # Listings require an issuer or exchange row, not a specialist profile alone.
    isin=source['isin'];digest=hashlib.sha256(body).hexdigest();rows=[]
    markets={'London Stock Exchange':'XLON','Deutsche Boerse Xetra':'XETR','Xetra':'XETR','Euronext Amsterdam':'XAMS','Nyse Euronext - Euronext Paris':'XPAR','Euronext Paris':'XPAR','Borsa Italiana':'ETFP','SIX Swiss Exchange':'XSWX'}
    if body.lstrip().startswith(b'{'):
        doc=json.loads(body)
        points=doc['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        if points['isin']['value']!=isin:raise ValueError('Wrong listing share')
        data=doc['componentsByNameMap'].get('listings',{}).get('containersByNameMap',{}).get('default',{}).get('dataPointsByNameMap',{})
        columns=[data.get(k,{}).get('value',[]) for k in ['exchange','ticker','currencyCode','ric']]
        if len({len(v) for v in columns})!=1:raise ValueError('Truncated listing columns')
        for exchange,ticker,currency,symbol in zip(*columns):
            if exchange not in markets or not re.fullmatch(r'[A-Z]{3}',currency or '') or not ticker or not symbol:continue
            canonical={'XETR':'Xetra','XPAR':'Euronext Paris'}.get(markets[exchange],exchange)
            rows.append(dict(ticker=ticker,mic=markets[exchange],exchange=canonical,currency=currency,symbol=symbol,excerpt=' | '.join([isin,exchange,ticker,currency,symbol])))
    else:
        text=text_of(body)
        if set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',text))!={isin}:raise ValueError('Ambiguous listing document identity')
        if body.startswith(b'%PDF-'):blocks=text.splitlines()
        else:blocks=[html.unescape(re.sub('<[^>]+>',' ',r)) for r in re.findall(r'<tr\b[^>]*>(.*?)</tr>',body.decode(),re.S|re.I)]
        # VanEck factsheets print exchanges in capitals and name Xetra "Deutsche Börse"
        # (Bloomberg suffix GY, i.e. Xetra); ticker and currency must still match the row.
        aliases={'XLON':['London Stock Exchange','LSE'],'XPAR':['Euronext Paris'],'XAMS':['Euronext Amsterdam'],'ETFP':['Borsa Italiana'],'XETR':['Xetra','Deutsche Börse'],'XSWX':['SIX Swiss Exchange','SIX Swiss']}
        for listing in source.get('listings',[]):
            for block in blocks:
                if re.search(r'(?<![A-Za-z0-9])'+re.escape(listing['ticker'])+r'(?![A-Za-z0-9])',block) and re.search(r'\b'+re.escape(listing['currency'])+r'\b',block) and any(m.casefold() in block.casefold() for m in aliases.get(listing['mic'],[listing['exchange']])):
                    rows.append({k:listing[k] for k in ['ticker','mic','exchange','currency','symbol'] if k in listing}|{'excerpt':isin+' | '+' '.join(block.split())})
                    break
    return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in rows]

def collect(source,now,fetch=download):
    values={};errors=[];conflicts=set();checked=now.date().isoformat()
    for url in source['urls']:
        try:
            body,url=fetch_document(url,fetch)
            fields=parse_json(body,source['isin']) if body.lstrip().startswith(b'{') else parse_text(text_of(body),source['isin'])
            listing_rows=parse_listings(body,source,url,checked)
            if listing_rows:fields['listings']=listing_rows
            if not fields:raise ValueError('No explicit supported metadata fields')
            for field,value in fields.items():
                if field in conflicts:continue
                if field in values and values[field]['value']!=value:
                    # Equivalent issuer labels are normalised below; unresolved differences are retained as failures.
                    if field in ('pea','currencyHedge'):
                        conflicts.add(field);values.pop(field,None)
                        raise ValueError('Conflicting metadata sources: '+field)
                    continue
                values[field]={'value':value,'checkedAt':checked,'sourceUrl':url,'sha256':hashlib.sha256(body).hexdigest()}
        except Exception as error:errors.append({'sourceUrl':url,'error':str(error)})
    return values,errors

def main():
    p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--only',nargs='+');p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    sources=json.loads((ROOT/'scripts/instrument-metadata-sources.json').read_text())['instruments']
    if a.only:sources=[s for s in sources if s['isin'] in a.only]
    path=ROOT/'src/data/automated-instrument-metadata.json';records=json.loads(path.read_text())
    status_path=ROOT/'src/data/instrument-metadata-status.json';status=json.loads(status_path.read_text());now=dt.datetime.now(UTC)
    def one(s):return s['isin'],*collect(s,now)
    errors=[];updated=[];successes=[]
    with ThreadPoolExecutor(max_workers=6) as pool:
        for isin,values,failures in pool.map(one,sources):
            old=records.get(isin,{})
            for field,value in values.items():
                if value['checkedAt']>=old.get(field,{}).get('checkedAt',''):old[field]=value
            records[isin]=old
            missing=[field for field in FIELDS if field not in values]
            status[isin]={'checkedAt':now.isoformat(),'observed':list(values),'pending':missing,'errors':failures}
            if values:updated.append(isin)
            successes.extend({'id':f'{isin}:{field}'} for field in values)
            # Fail when previously automatic values stay unrenewed beyond the grace period; absent publications stay explicit pending fields.
            for field in old:
                if field not in values and renewal_overdue(old[field],now,field):errors.append({'id':f'{isin}:{field}','field':field,'error':f'Previously automated metadata not renewed for more than {renewal_days(field)} days; original evidence retained.'})
    if a.apply:
        write_json_atomic(path,records);write_json_atomic(status_path,status)
    write_json_atomic(a.output,{'checkedAt':now.isoformat(),'updated':updated,'successes':successes,'errors':errors,'pending':{isin:s['pending'] for isin,s in status.items() if s['pending']}})
    print(f'Metadata: {len(updated)}/{len(sources)} observed instruments; {len(errors)} failed renewals.')
    if errors:raise SystemExit(1)
if __name__=='__main__':main()
